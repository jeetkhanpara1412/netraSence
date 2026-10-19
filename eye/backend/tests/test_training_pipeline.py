import pytest

from app.ml.classification.trainer import DEFAULT_DATA_DIR, load_labels


def test_included_idrid_training_and_testing_labels_match_images():
    training = load_labels(
        DEFAULT_DATA_DIR / "annotations/grading/a. IDRiD_Disease Grading_Training Labels.csv",
        DEFAULT_DATA_DIR / "images/training",
        "Image name",
        "Retinopathy grade",
    )
    testing = load_labels(
        DEFAULT_DATA_DIR / "annotations/grading/b. IDRiD_Disease Grading_Testing Labels.csv",
        DEFAULT_DATA_DIR / "images/testing",
        "Image name",
        "Retinopathy grade",
    )

    assert len(training) == 413
    assert len(testing) == 103
    assert set(training["Retinopathy grade"]) == set(range(5))
    assert set(testing["Retinopathy grade"]) == set(range(5))


def test_load_labels_rejects_missing_images(tmp_path):
    labels = tmp_path / "labels.csv"
    labels.write_text("image,grade\nmissing-image,1\n", encoding="utf-8")

    with pytest.raises(FileNotFoundError, match="No image found"):
        load_labels(labels, tmp_path / "images", "image", "grade")


def test_load_labels_rejects_fractional_grades(tmp_path):
    labels = tmp_path / "labels.csv"
    labels.write_text("image,grade\nimage,1.5\n", encoding="utf-8")

    with pytest.raises(ValueError, match="finite integers"):
        load_labels(labels, tmp_path / "images", "image", "grade")
