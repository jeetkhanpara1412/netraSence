from pathlib import Path

import pandas as pd

from app.ml.classification.data_splits import split_without_duplicate_leakage


def test_content_duplicates_do_not_leak_between_partitions(tmp_path):
    train_dir = tmp_path / "training"
    test_dir = tmp_path / "testing"
    train_dir.mkdir()
    test_dir.mkdir()
    training_rows = []

    for grade in range(5):
        for index in range(5):
            image_id = f"grade-{grade}-{index}"
            (train_dir / f"{image_id}.jpg").write_bytes(f"{image_id}".encode())
            training_rows.append({"image": image_id, "grade": grade})

    (train_dir / "conflict-a.jpg").write_bytes(b"conflicting-content")
    (train_dir / "conflict-b.jpg").write_bytes(b"conflicting-content")
    training_rows.extend([
        {"image": "conflict-a", "grade": 0},
        {"image": "conflict-b", "grade": 1},
    ])
    (train_dir / "duplicate-a.jpg").write_bytes(b"same-grade-duplicate")
    (train_dir / "duplicate-b.jpg").write_bytes(b"same-grade-duplicate")
    training_rows.extend([
        {"image": "duplicate-a", "grade": 4},
        {"image": "duplicate-b", "grade": 4},
    ])
    (train_dir / "overlap-training.jpg").write_bytes(b"official-test-overlap")
    (test_dir / "overlap-test.jpg").write_bytes(b"official-test-overlap")
    training_rows.append({"image": "overlap-training", "grade": 2})
    test_rows = [{"image": "overlap-test", "grade": 3}]

    training, validation, exclusions = split_without_duplicate_leakage(
        pd.DataFrame(training_rows),
        pd.DataFrame(test_rows),
        train_dir,
        test_dir,
        "image",
        "grade",
        0.2,
        42,
    )

    retained_ids = set(training["image"]) | set(validation["image"])
    assert {"conflict-a", "conflict-b", "overlap-training"}.isdisjoint(retained_ids)
    assert len(exclusions["conflicting_duplicate_groups_excluded"]) == 1
    assert len(exclusions["training_images_excluded_for_official_test_overlap"]) == 1
    assert ("duplicate-a" in training["image"].values) == ("duplicate-b" in training["image"].values)
    assert ("duplicate-a" in validation["image"].values) == ("duplicate-b" in validation["image"].values)

    hashes_by_partition = []
    for frame, directory in ((training, train_dir), (validation, train_dir)):
        hashes_by_partition.append({
            (directory / f"{image_id}.jpg").read_bytes()
            for image_id in frame["image"]
        })
    assert hashes_by_partition[0].isdisjoint(hashes_by_partition[1])
