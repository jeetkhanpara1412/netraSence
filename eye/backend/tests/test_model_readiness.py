import pytest
import torch

from app.ml.classification.model import DRModelManager, ModelUnavailableError


def test_missing_checkpoint_does_not_create_inference_model(tmp_path):
    manager = DRModelManager(model_path=str(tmp_path / "missing.pth"), device="cpu")

    assert manager.is_loaded is False
    assert manager.model is None
    with pytest.raises(ModelUnavailableError, match="checkpoint not found"):
        manager.predict(torch.zeros((1, 3, 32, 32)))


def test_random_initialized_checkpoint_is_not_accepted(tmp_path):
    checkpoint_path = tmp_path / "random.pth"
    torch.save({"state_dict": {}, "initialized": True, "kappa": 0.84}, checkpoint_path)

    manager = DRModelManager(model_path=str(checkpoint_path), device="cpu")

    assert manager.is_loaded is False
    assert "Untrained or legacy checkpoints" in manager.load_error
