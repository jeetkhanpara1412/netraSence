"""Validate supplied retinal data and write a deterministic JSON report."""

import argparse
import csv
import hashlib
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

from PIL import Image


REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_DATA_ROOT = REPOSITORY_ROOT / "SIHDatasets"
DEFAULT_REPORT = REPOSITORY_ROOT / "docs" / "DATASET_VALIDATION.json"
GRADING_CSVS = {
    "training": "idrid/annotations/grading/a. IDRiD_Disease Grading_Training Labels.csv",
    "testing": "idrid/annotations/grading/b. IDRiD_Disease Grading_Testing Labels.csv",
}
LANDMARK_CSVS = {
    "fovea_training": "idrid/annotations/landmarks/fovea/IDRiD_Fovea_Center_Training Set_Markups.csv",
    "fovea_testing": "idrid/annotations/landmarks/fovea/IDRiD_Fovea_Center_Testing Set_Markups.csv",
    "optic_disc_training": "idrid/annotations/landmarks/optic_disc/a. IDRiD_OD_Center_Training Set_Markups.csv",
    "optic_disc_testing": "idrid/annotations/landmarks/optic_disc/b. IDRiD_OD_Center_Testing Set_Markups.csv",
}
MASK_CATEGORIES = {
    "1. Microaneurysms": "MA",
    "2. Haemorrhages": "HE",
    "3. Hard Exudates": "EX",
    "4. Soft Exudates": "SE",
    "5. Optic Disc": "OD",
}


def relative(path, root):
    return path.relative_to(root).as_posix()


def decode(path):
    try:
        with Image.open(path) as image:
            image.verify()
        with Image.open(path) as image:
            image.load()
            return {
                "width": image.width,
                "height": image.height,
                "mode": image.mode,
                "format": image.format,
            }, None
    except (OSError, ValueError, Image.DecompressionBombError) as error:
        return None, str(error)


def sha256(path):
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def inventory(directory, root):
    records = {}
    failures = []
    if not directory.is_dir():
        return records, [{"path": relative(directory, root), "error": "Directory is missing."}]
    for path in sorted(item for item in directory.iterdir() if item.is_file()):
        info, error = decode(path)
        if error:
            failures.append({"path": relative(path, root), "error": error})
            continue
        records[path.stem.lower()] = {
            "path": path,
            "relative_path": relative(path, root),
            "sha256": sha256(path),
            **info,
        }
    return records, failures


def read_csv(path):
    with path.open(encoding="utf-8-sig", newline="") as source:
        reader = csv.DictReader(source)
        return [
            {(key.strip() if isinstance(key, str) else key): value for key, value in row.items()}
            for row in reader
        ]


def audit_grading(data_root, root, split, images):
    path = data_root / GRADING_CSVS[split]
    ids = []
    counts = Counter()
    invalid = []
    missing = []
    for row_number, row in enumerate(read_csv(path), start=2):
        image_id = (row.get("Image name") or "").strip().lower()
        grade_text = (row.get("Retinopathy grade") or "").strip()
        if not image_id and not grade_text:
            continue
        ids.append(image_id)
        try:
            grade = int(grade_text)
            if str(grade) != grade_text or grade not in range(5):
                raise ValueError
            counts[str(grade)] += 1
        except ValueError:
            invalid.append(f"Row {row_number}: invalid DR grade {grade_text!r}.")
        if image_id not in images:
            missing.append(image_id)
    duplicates = sorted(key for key, count in Counter(ids).items() if count > 1)
    return {
        "csv": relative(path, root),
        "labelled_rows": len(ids),
        "class_counts": {str(grade): counts.get(str(grade), 0) for grade in range(5)},
        "duplicate_label_ids": duplicates,
        "labels_without_image": sorted(missing),
        "unlabelled_image_count": len(set(images) - set(ids)),
        "unlabelled_image_ids": sorted(set(images) - set(ids)),
        "invalid_rows": invalid,
    }, (
        invalid
        + ([f"{split}: duplicate label IDs found."] if duplicates else [])
        + ([f"{split}: labels without images found."] if missing else [])
    )


def audit_landmark(data_root, root, key, relative_csv, split, images):
    path = data_root / relative_csv
    populated = 0
    missing = []
    out_of_bounds = []
    invalid = []
    ids = []
    for row_number, row in enumerate(read_csv(path), start=2):
        image_id = (row.get("Image No") or row.get("Image name") or "").strip().lower()
        if not image_id:
            continue
        populated += 1
        ids.append(image_id)
        image = images[split].get(image_id)
        if image is None:
            missing.append(image_id)
            continue
        coordinates = []
        for column, value in row.items():
            if column in {"Image No", "Image name"} or not (value or "").strip():
                continue
            try:
                number = float(value)
            except ValueError:
                invalid.append(f"Row {row_number}, {column}: invalid coordinate {value!r}.")
                continue
            if column.lower().startswith("x"):
                coordinates.append((number, image["width"]))
            elif column.lower().startswith("y"):
                coordinates.append((number, image["height"]))
            else:
                invalid.append(f"Row {row_number}: unexpected coordinate column {column!r}.")
        if len(coordinates) != 2:
            invalid.append(f"Row {row_number}: expected exactly one x/y coordinate pair.")
        elif any(not 0 <= value < limit for value, limit in coordinates):
            out_of_bounds.append(image_id)
    duplicates = sorted(key for key, count in Counter(ids).items() if count > 1)
    return key, {
        "csv": relative(path, root),
        "populated_rows": populated,
        "duplicate_image_ids": duplicates,
        "missing_image_ids": sorted(missing),
        "out_of_bounds_image_ids": sorted(set(out_of_bounds)),
        "invalid_coordinates": invalid,
    }


def audit_masks(data_root, root, split, images, errors):
    split_root = data_root / "idrid" / "annotations" / "segmentation" / split
    report = {}
    for category, suffix in MASK_CATEGORIES.items():
        directory = split_root / category
        masks = []
        missing = []
        mismatches = []
        failures = []
        invalid_pixels = []
        for path in sorted(directory.glob("*.tif")) if directory.is_dir() else []:
            info, error = decode(path)
            if error:
                failures.append({"path": relative(path, root), "error": error})
                continue
            with Image.open(path) as mask:
                colors = mask.getcolors(maxcolors=3)
            pixel_values = sorted({pixel for _, pixel in colors}) if colors else []
            if not pixel_values or len(pixel_values) > 2:
                invalid_pixels.append(path.stem)
            match = re.fullmatch(r"IDRiD_(\d+)_([A-Z]+)", path.stem, re.IGNORECASE)
            image_id = f"idrid_{int(match.group(1)):03d}" if match else ""
            source = images.get(image_id)
            if source is None:
                missing.append(path.stem)
            elif (info["width"], info["height"]) != (source["width"], source["height"]):
                mismatches.append(path.stem)
            masks.append({
                "path": relative(path, root),
                "source_image_id": image_id,
                "width": info["width"],
                "height": info["height"],
                "mode": info["mode"],
                "unique_pixel_values": pixel_values,
            })
        if not directory.is_dir():
            errors.append(f"Missing segmentation directory: {relative(directory, root)}")
        if missing:
            errors.append(f"{split} {suffix}: mask has no matching image.")
        if mismatches:
            errors.append(f"{split} {suffix}: mask and source dimensions differ.")
        if failures:
            errors.append(f"{split} {suffix}: mask decode failure.")
        if invalid_pixels:
            errors.append(f"{split} {suffix}: mask contains more than two pixel values.")
        report[suffix] = {
            "mask_count": len(masks),
            "masks": masks,
            "missing_source_image_ids": sorted(missing),
            "dimension_mismatch_ids": sorted(mismatches),
            "decode_failures": failures,
            "non_binary_masks": sorted(invalid_pixels),
        }
    return report


def audit_vessels(data_root, root):
    base = data_root / "retinal_vessel"
    report = {}
    errors = []
    for split in ("training", "testing"):
        split_root = base / split
        dirs = {key: split_root / key for key in ("images", "manual", "masks")}
        paths = {
            key: sorted(path for path in directory.glob("*") if path.is_file())
            if directory.is_dir() else []
            for key, directory in dirs.items()
        }

        def canonical_id(path):
            stem = path.stem
            suffixes = ("_training_mask", "_manual1", "_training", "_test_mask", "_test")
            for suffix in suffixes:
                if stem.lower().endswith(suffix):
                    return stem[:-len(suffix)]
            return stem

        ids = {key: {canonical_id(path) for path in group} for key, group in paths.items()}
        mismatches = {
            "images_without_manual": sorted(ids["images"] - ids["manual"]) if split == "training" else [],
            "images_without_mask": sorted(ids["images"] - ids["masks"]),
            "manual_without_image": sorted(ids["manual"] - ids["images"]) if split == "training" else [],
            "masks_without_image": sorted(ids["masks"] - ids["images"]),
        }
        failures = []
        dims = {}
        for key, group in paths.items():
            for path in group:
                info, error = decode(path)
                if error:
                    failures.append({"path": relative(path, root), "error": error})
                else:
                    dims[(key, canonical_id(path))] = (info["width"], info["height"])
        dimension_mismatches = []
        for image_id in ids["images"]:
            image_dims = dims.get(("images", image_id))
            for key in ("manual", "masks") if split == "training" else ("masks",):
                if image_id in ids[key] and dims.get((key, image_id)) != image_dims:
                    dimension_mismatches.append(image_id)
        if any(mismatches.values()) or failures or dimension_mismatches:
            errors.append(f"Retinal-vessel {split}: invalid pairs, dimensions, or image files.")
        report[split] = {
            "image_count": len(paths["images"]),
            "manual_count": len(paths["manual"]),
            "mask_count": len(paths["masks"]),
            "ids": sorted(ids["images"]),
            "pairing_mismatches": mismatches,
            "dimension_mismatch_ids": sorted(set(dimension_mismatches)),
            "decode_failures": failures,
        }
    return report, errors


def validate(data_root):
    root = data_root.parent
    errors = []
    image_records = {}
    image_failures = {}
    for split in ("training", "testing"):
        image_records[split], image_failures[split] = inventory(
            data_root / "idrid" / "images" / split, root
        )
        if image_failures[split]:
            errors.append(f"IDRiD {split}: one or more images could not be decoded.")

    grades = {}
    for split in ("training", "testing"):
        grades[split], grade_errors = audit_grading(data_root, root, split, image_records[split])
        errors.extend(grade_errors)

    landmarks = {}
    for key, csv_path in LANDMARK_CSVS.items():
        split = "training" if key.endswith("training") else "testing"
        name, result = audit_landmark(data_root, root, key, csv_path, split, image_records)
        landmarks[name] = result
        if result["duplicate_image_ids"] or result["missing_image_ids"] or result["out_of_bounds_image_ids"] or result["invalid_coordinates"]:
            errors.append(f"IDRiD {key}: landmark coordinates did not validate.")

    segmentation = {
        split: audit_masks(data_root, root, split, image_records[split], errors)
        for split in ("training", "testing")
    }

    hash_groups = defaultdict(list)
    label_maps = {}
    for split in ("training", "testing"):
        label_maps[split] = {
            (row.get("Image name") or "").strip().lower(): (row.get("Retinopathy grade") or "").strip()
            for row in read_csv(data_root / GRADING_CSVS[split])
            if (row.get("Image name") or "").strip()
        }
        for image_id, record in image_records[split].items():
            hash_groups[record["sha256"]].append({
                "split": split,
                "image_id": image_id,
                "path": record["relative_path"],
                "grade": label_maps[split].get(image_id),
            })
    duplicate_groups = []
    for digest, files in sorted(hash_groups.items()):
        if len(files) > 1:
            duplicate_groups.append({"sha256": digest, "files": files})
    cross_split_duplicates = [
        group for group in duplicate_groups
        if {item["split"] for item in group["files"]} == {"training", "testing"}
    ]
    conflicting_label_duplicates = [
        group for group in duplicate_groups
        if len({item["grade"] for item in group["files"] if item["grade"] is not None}) > 1
    ]

    vessels, vessel_errors = audit_vessels(data_root, root)
    errors.extend(vessel_errors)
    license_dir = data_root / "idrid" / "licenses"
    licenses = sorted(relative(path, root) for path in license_dir.glob("*") if path.is_file())
    if not licenses:
        errors.append("No IDRiD license files found.")

    return {
        "status": "passed" if not errors else "failed",
        "dataset_root": relative(data_root, root),
        "checks": [
            "Image decoding, dimensions, and duplicate SHA-256 groups",
            "Grade labels, duplicate IDs, image coverage, and class counts",
            "Landmark image matches and coordinate bounds",
            "Segmentation mask decoding, two-color content, image IDs, and dimensions",
            "Retinal-vessel image/manual/mask pairs and dimensions",
            "IDRiD license text presence",
        ],
        "idrid": {
            "images": {
                split: {
                    "count": len(records),
                    "dimension_counts": {
                        f"{width}x{height}": count
                        for (width, height), count in sorted(
                            Counter((row["width"], row["height"]) for row in records.values()).items()
                        )
                    },
                    "decode_failures": image_failures[split],
                }
                for split, records in image_records.items()
            },
            "grading": grades,
            "landmarks": landmarks,
            "segmentation": segmentation,
            "exact_content_duplicate_groups": duplicate_groups,
            "cross_split_duplicate_groups": cross_split_duplicates,
            "conflicting_label_duplicate_groups": conflicting_label_duplicates,
            "licenses": licenses,
        },
        "retinal_vessel": vessels,
        "errors": errors,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-root", type=Path, default=DEFAULT_DATA_ROOT)
    parser.add_argument("--output", type=Path, default=DEFAULT_REPORT)
    args = parser.parse_args()
    report = validate(args.data_root.resolve())
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({"status": report["status"], "output": str(args.output), "errors": report["errors"]}, indent=2))
    return 0 if report["status"] == "passed" else 1


if __name__ == "__main__":
    sys.exit(main())
