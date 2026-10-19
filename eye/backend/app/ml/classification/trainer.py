"""Train and evaluate the five-class classifier with the supplied IDRiD data."""

import argparse
import json
import logging
import random
import time
from pathlib import Path

import cv2
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from PIL import Image
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    cohen_kappa_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from torch.utils.data import DataLoader, Dataset
from torchvision import transforms

from app.ml.classification.model import DiabeticRetinopathyClassifier
from app.ml.classification.data_splits import split_without_duplicate_leakage
from app.ml.preprocessing.retina_transforms import crop_retina_circle

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("DR-Trainer")

REPOSITORY_ROOT = Path(__file__).resolve().parents[5]
DEFAULT_DATA_DIR = REPOSITORY_ROOT / "SIHDatasets" / "idrid"
DEFAULT_OUTPUT_PATH = Path(__file__).resolve().parents[3] / "ml" / "weights" / "efficientnet_b0_dr.pth"
CLASS_NAMES = ["No DR", "Mild NPDR", "Moderate NPDR", "Severe NPDR", "Proliferative DR"]


class RetinalDataset(Dataset):
    def __init__(self, frame, image_dir, id_col, label_col, transform=None):
        self.frame = frame.reset_index(drop=True)
        self.image_dir = Path(image_dir)
        self.id_col = id_col
        self.label_col = label_col
        self.transform = transform

    def __len__(self):
        return len(self.frame)

    def _image_path(self, image_id):
        image_id = str(image_id).strip()
        candidate = self.image_dir / image_id
        if candidate.is_file():
            return candidate
        for extension in (".jpg", ".jpeg", ".png", ".tif", ".tiff"):
            candidate = self.image_dir / f"{image_id}{extension}"
            if candidate.is_file():
                return candidate
        raise FileNotFoundError(f"No image found for label ID {image_id!r} in {self.image_dir}")

    def __getitem__(self, idx):
        row = self.frame.iloc[idx]
        image_path = self._image_path(row[self.id_col])
        try:
            with Image.open(image_path) as source:
                rgb = np.asarray(source.convert("RGB"))
        except (OSError, ValueError) as exc:
            raise ValueError(f"Could not decode dataset image {image_path}: {exc}") from exc

        bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
        cropped = crop_retina_circle(bgr)
        image = Image.fromarray(cv2.cvtColor(cropped, cv2.COLOR_BGR2RGB))
        if self.transform:
            image = self.transform(image)
        return image, torch.tensor(int(row[self.label_col]), dtype=torch.long)


def load_labels(csv_path, image_dir, id_col, label_col):
    csv_path = Path(csv_path)
    if not csv_path.is_file():
        raise FileNotFoundError(f"Label CSV not found: {csv_path}")
    frame = pd.read_csv(csv_path)
    frame.columns = [str(column).strip() for column in frame.columns]
    frame = frame.loc[:, [column for column in frame.columns if column]]
    if id_col not in frame.columns or label_col not in frame.columns:
        raise ValueError(
            f"{csv_path} must contain columns {id_col!r} and {label_col!r}; "
            f"found {frame.columns.tolist()}"
        )

    frame = frame[[id_col, label_col]]
    if frame.isna().any().any():
        raise ValueError(f"{csv_path} contains rows with missing image IDs or grades.")
    frame[id_col] = frame[id_col].astype(str).str.strip()
    numeric_labels = pd.to_numeric(frame[label_col], errors="raise")
    if not np.isfinite(numeric_labels).all() or not np.equal(numeric_labels % 1, 0).all():
        raise ValueError(f"Labels in {csv_path} must be finite integers from 0 to 4.")
    frame[label_col] = numeric_labels.astype(int)
    if frame.empty:
        raise ValueError(f"No labelled samples found in {csv_path}")
    if frame[id_col].duplicated().any():
        duplicates = frame.loc[frame[id_col].duplicated(), id_col].tolist()
        raise ValueError(f"Duplicate image IDs in {csv_path}: {duplicates[:5]}")
    if not frame[label_col].between(0, 4).all():
        raise ValueError(f"Labels in {csv_path} must be integers from 0 to 4.")

    dataset = RetinalDataset(frame, image_dir, id_col, label_col)
    for image_id in frame[id_col]:
        dataset._image_path(image_id)
    return frame


def get_transforms(img_size=512):
    normalize = transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225],
    )
    train_transform = transforms.Compose([
        transforms.Resize((img_size, img_size)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomVerticalFlip(p=0.5),
        transforms.RandomRotation(degrees=30),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
        transforms.ToTensor(),
        normalize,
    ])
    eval_transform = transforms.Compose([
        transforms.Resize((img_size, img_size)),
        transforms.ToTensor(),
        normalize,
    ])
    return train_transform, eval_transform


def calculate_metrics(labels, predictions):
    qwk = cohen_kappa_score(labels, predictions, weights="quadratic", labels=range(5))
    return {
        "accuracy": float(accuracy_score(labels, predictions)),
        "precision_macro": float(precision_score(labels, predictions, labels=range(5), average="macro", zero_division=0)),
        "precision_weighted": float(precision_score(labels, predictions, labels=range(5), average="weighted", zero_division=0)),
        "recall_macro": float(recall_score(labels, predictions, labels=range(5), average="macro", zero_division=0)),
        "recall_weighted": float(recall_score(labels, predictions, labels=range(5), average="weighted", zero_division=0)),
        "f1_macro": float(f1_score(labels, predictions, labels=range(5), average="macro", zero_division=0)),
        "f1_weighted": float(f1_score(labels, predictions, labels=range(5), average="weighted", zero_division=0)),
        "quadratic_weighted_kappa": float(qwk) if np.isfinite(qwk) else None,
        "confusion_matrix": confusion_matrix(labels, predictions, labels=range(5)).tolist(),
        "per_class": classification_report(
            labels,
            predictions,
            labels=range(5),
            target_names=CLASS_NAMES,
            output_dict=True,
            zero_division=0,
        ),
    }


def train_one_epoch(model, loader, criterion, optimizer, device):
    model.train()
    running_loss = 0.0
    for images, labels in loader:
        images, labels = images.to(device), labels.to(device)
        optimizer.zero_grad(set_to_none=True)
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        running_loss += loss.item() * images.size(0)
    return running_loss / len(loader.dataset)


def evaluate(model, loader, criterion, device):
    model.eval()
    running_loss = 0.0
    predictions, labels_all = [], []
    started = time.perf_counter()
    with torch.no_grad():
        for images, labels in loader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            running_loss += criterion(outputs, labels).item() * images.size(0)
            predictions.extend(outputs.argmax(dim=1).cpu().tolist())
            labels_all.extend(labels.cpu().tolist())
    elapsed = time.perf_counter() - started
    metrics = calculate_metrics(labels_all, predictions)
    metrics["loss"] = float(running_loss / len(loader.dataset))
    metrics["inference_ms_per_image_including_data_loading"] = float(
        elapsed * 1000.0 / len(loader.dataset)
    )
    return metrics


def main():
    parser = argparse.ArgumentParser(description="Train and evaluate the IDRiD DR classifier")
    parser.add_argument("--data_dir", type=Path, default=DEFAULT_DATA_DIR)
    parser.add_argument("--train_csv", default="annotations/grading/a. IDRiD_Disease Grading_Training Labels.csv")
    parser.add_argument("--train_images", default="images/training")
    parser.add_argument("--test_csv", default="annotations/grading/b. IDRiD_Disease Grading_Testing Labels.csv")
    parser.add_argument("--test_images", default="images/testing")
    parser.add_argument("--id_col", default="Image name")
    parser.add_argument("--label_col", default="Retinopathy grade")
    parser.add_argument("--validation_fraction", type=float, default=0.2)
    parser.add_argument("--epochs", type=int, default=25)
    parser.add_argument("--batch_size", type=int, default=8)
    parser.add_argument("--lr", type=float, default=3e-4)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--num_workers", type=int, default=0)
    parser.add_argument("--output_path", type=Path, default=DEFAULT_OUTPUT_PATH)
    parser.add_argument("--no_pretrained", action="store_true", help="Do not initialize from ImageNet weights.")
    args = parser.parse_args()

    if not 0 < args.validation_fraction < 0.5 or args.epochs < 1 or args.batch_size < 1:
        parser.error("validation_fraction must be in (0, 0.5), and epochs/batch_size must be positive.")

    torch.manual_seed(args.seed)
    np.random.seed(args.seed)
    random.seed(args.seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(args.seed)

    train_labels = load_labels(
        args.data_dir / args.train_csv,
        args.data_dir / args.train_images,
        args.id_col,
        args.label_col,
    )
    test_csv = args.data_dir / args.test_csv if args.test_csv else None
    test_frame = (
        load_labels(test_csv, args.data_dir / args.test_images, args.id_col, args.label_col)
        if test_csv
        else None
    )
    train_frame, validation_frame, duplicate_handling = split_without_duplicate_leakage(
        train_labels,
        test_frame,
        args.data_dir / args.train_images,
        args.data_dir / args.test_images,
        args.id_col,
        args.label_col,
        args.validation_fraction,
        args.seed,
    )
    logger.info(
        "Excluded %d conflicting duplicate groups and %d training groups overlapping "
        "the official test set.",
        len(duplicate_handling["conflicting_duplicate_groups_excluded"]),
        len(duplicate_handling["training_images_excluded_for_official_test_overlap"]),
    )
    logger.info(
        "IDRiD split sizes: train=%d, validation=%d, official_test=%d",
        len(train_frame),
        len(validation_frame),
        len(test_frame) if test_frame is not None else 0,
    )
    logger.info("Training class counts: %s", train_frame[args.label_col].value_counts().sort_index().to_dict())

    train_transform, eval_transform = get_transforms()
    train_set = RetinalDataset(train_frame, args.data_dir / args.train_images, args.id_col, args.label_col, train_transform)
    validation_set = RetinalDataset(validation_frame, args.data_dir / args.train_images, args.id_col, args.label_col, eval_transform)
    train_loader = DataLoader(
        train_set,
        batch_size=args.batch_size,
        shuffle=True,
        num_workers=args.num_workers,
        generator=torch.Generator().manual_seed(args.seed),
    )
    validation_loader = DataLoader(validation_set, batch_size=args.batch_size, num_workers=args.num_workers)
    test_loader = None
    if test_frame is not None:
        test_set = RetinalDataset(test_frame, args.data_dir / args.test_images, args.id_col, args.label_col, eval_transform)
        test_loader = DataLoader(test_set, batch_size=args.batch_size, num_workers=args.num_workers)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = DiabeticRetinopathyClassifier(num_classes=5, pretrained=not args.no_pretrained).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=args.epochs)

    majority_grade = int(train_frame[args.label_col].mode().iloc[0])
    baseline_predictions = np.full(len(validation_frame), majority_grade)
    baseline_metrics = calculate_metrics(validation_frame[args.label_col].to_numpy(), baseline_predictions)

    best_selection_score = float("-inf")
    best_state = None
    best_epoch = None
    best_validation_metrics = None
    training_started = time.perf_counter()
    for epoch in range(1, args.epochs + 1):
        train_loss = train_one_epoch(model, train_loader, criterion, optimizer, device)
        validation_metrics = evaluate(model, validation_loader, criterion, device)
        scheduler.step()
        qwk = validation_metrics["quadratic_weighted_kappa"]
        selection_score = qwk if qwk is not None else validation_metrics["f1_weighted"]
        logger.info(
            "Epoch %d/%d train_loss=%.4f val_loss=%.4f val_qwk=%s val_accuracy=%.4f val_f1_weighted=%.4f",
            epoch,
            args.epochs,
            train_loss,
            validation_metrics["loss"],
            f"{qwk:.4f}" if qwk is not None else "undefined",
            validation_metrics["accuracy"],
            validation_metrics["f1_weighted"],
        )
        if selection_score > best_selection_score:
            best_selection_score = selection_score
            best_state = {key: value.detach().cpu().clone() for key, value in model.state_dict().items()}
            best_epoch = epoch
            best_validation_metrics = validation_metrics

    training_seconds = time.perf_counter() - training_started
    model.load_state_dict(best_state)
    model.to(device)
    test_metrics = evaluate(model, test_loader, criterion, device) if test_loader else None

    report = {
        "dataset": "IDRiD",
        "dataset_root": str(args.data_dir.resolve()),
        "train_csv": str((args.data_dir / args.train_csv).resolve()),
        "official_test_csv": str(test_csv.resolve()) if test_csv and test_csv.is_file() else None,
        "split_sizes": {
            "train": len(train_frame),
            "validation": len(validation_frame),
            "official_test": len(test_frame) if test_frame is not None else 0,
        },
        "class_counts": {
            "train": {str(int(k)): int(v) for k, v in train_frame[args.label_col].value_counts().sort_index().items()},
            "validation": {str(int(k)): int(v) for k, v in validation_frame[args.label_col].value_counts().sort_index().items()},
            "official_test": (
                {str(int(k)): int(v) for k, v in test_frame[args.label_col].value_counts().sort_index().items()}
                if test_frame is not None
                else None
            ),
        },
        "seed": args.seed,
        "pretrained_imagenet_initialization": not args.no_pretrained,
        "model": "EfficientNet-B0",
        "best_epoch": best_epoch,
        "training_seconds": training_seconds,
        "selection_metric": "quadratic_weighted_kappa (fallback: weighted F1)",
        "validation_split_policy": duplicate_handling["method"],
        "duplicate_content_exclusions": duplicate_handling,
        "majority_class_validation_baseline": baseline_metrics,
        "validation_metrics": best_validation_metrics,
        "official_test_metrics": test_metrics,
        "hyperparameter_search": "Not performed; this run uses the explicitly recorded CLI configuration.",
        "configuration": {
            "epochs": args.epochs,
            "batch_size": args.batch_size,
            "learning_rate": args.lr,
            "validation_fraction": args.validation_fraction,
            "optimizer": "AdamW",
        },
    }

    args.output_path.parent.mkdir(parents=True, exist_ok=True)
    torch.save({"state_dict": best_state, "metadata": report}, args.output_path)
    report_path = args.output_path.with_suffix(".evaluation.json")
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    logger.info("Saved checkpoint to %s and evaluation report to %s", args.output_path, report_path)


if __name__ == "__main__":
    main()
