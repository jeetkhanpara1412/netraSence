"""Leakage-aware, deterministic dataset partitioning helpers."""

import hashlib
from pathlib import Path

from sklearn.model_selection import StratifiedGroupKFold


def _image_path(image_dir, image_id):
    image_dir = Path(image_dir)
    image_id = str(image_id).strip()
    candidate = image_dir / image_id
    if candidate.is_file():
        return candidate
    for extension in (".jpg", ".jpeg", ".png", ".tif", ".tiff"):
        candidate = image_dir / f"{image_id}{extension}"
        if candidate.is_file():
            return candidate
    raise FileNotFoundError(f"No image found for label ID {image_id!r} in {image_dir}")


def image_content_hashes(frame, image_dir, id_col):
    return {
        str(row[id_col]): hashlib.sha256(_image_path(image_dir, row[id_col]).read_bytes()).hexdigest()
        for _, row in frame.iterrows()
    }


def split_without_duplicate_leakage(
    train_labels,
    test_labels,
    image_dir,
    test_image_dir,
    id_col,
    label_col,
    validation_fraction,
    seed,
):
    train_hashes = image_content_hashes(train_labels, image_dir, id_col)
    test_hashes = (
        image_content_hashes(test_labels, test_image_dir, id_col)
        if test_labels is not None
        else {}
    )
    test_ids_by_hash = {}
    for image_id, digest in test_hashes.items():
        test_ids_by_hash.setdefault(digest, []).append(image_id)

    cross_split_exclusions = []
    for digest, group in train_labels.assign(
        _content_hash=train_labels[id_col].astype(str).map(train_hashes)
    ).groupby("_content_hash"):
        if digest in test_ids_by_hash:
            cross_split_exclusions.append({
                "training_image_ids": group[id_col].astype(str).tolist(),
                "official_test_image_ids": test_ids_by_hash[digest],
            })

    overlapping_ids = {
        image_id
        for entry in cross_split_exclusions
        for image_id in entry["training_image_ids"]
    }
    train_frame = train_labels.loc[
        ~train_labels[id_col].astype(str).isin(overlapping_ids)
    ].copy()
    train_frame["_content_hash"] = train_frame[id_col].astype(str).map(train_hashes)

    conflicts = []
    for digest, group in train_frame.groupby("_content_hash"):
        if group[label_col].nunique() > 1:
            conflicts.append({
                "sha256": digest,
                "image_ids": group[id_col].astype(str).tolist(),
                "grades": [int(value) for value in sorted(group[label_col].unique())],
            })
    conflict_hashes = {entry["sha256"] for entry in conflicts}
    train_frame = train_frame.loc[
        ~train_frame["_content_hash"].isin(conflict_hashes)
    ].copy()

    class_group_counts = train_frame.groupby(label_col)["_content_hash"].nunique()
    if train_frame.empty or class_group_counts.empty or class_group_counts.min() < 2:
        raise ValueError(
            "At least two unique image-content groups per represented grade are required "
            "after excluding duplicate-content conflicts and train/test overlaps."
        )

    n_splits = min(5, max(2, round(1 / validation_fraction)), int(class_group_counts.min()))
    splitter = StratifiedGroupKFold(n_splits=n_splits, shuffle=True, random_state=seed)
    candidates = list(splitter.split(
        train_frame,
        train_frame[label_col],
        groups=train_frame["_content_hash"],
    ))
    total_counts = train_frame[label_col].value_counts(normalize=True)

    def split_score(indices):
        validation = train_frame.iloc[indices[1]]
        validation_counts = validation[label_col].value_counts(normalize=True)
        size_error = abs(len(validation) / len(train_frame) - validation_fraction)
        class_error = sum(
            abs(validation_counts.get(grade, 0.0) - proportion)
            for grade, proportion in total_counts.items()
        )
        return size_error, class_error

    selected_train, selected_validation = min(candidates, key=split_score)
    train_frame = train_frame.drop(columns=["_content_hash"])
    validation_frame = train_frame.iloc[selected_validation].copy()
    training_frame = train_frame.iloc[selected_train].copy()
    return training_frame, validation_frame, {
        "conflicting_duplicate_groups_excluded": conflicts,
        "training_images_excluded_for_official_test_overlap": cross_split_exclusions,
        "method": f"StratifiedGroupKFold({n_splits}) by exact image SHA-256",
    }
