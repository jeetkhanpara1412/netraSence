import os
import logging
import torch
import torch.nn as nn
from torchvision.models import efficientnet_b0, EfficientNet_B0_Weights
from typing import Dict, Any, Tuple
import numpy as np

logger = logging.getLogger(__name__)

ICDR_NAMES = {
    0: "No Diabetic Retinopathy",
    1: "Mild Non-Proliferative Diabetic Retinopathy (NPDR)",
    2: "Moderate Non-Proliferative Diabetic Retinopathy (NPDR)",
    3: "Severe Non-Proliferative Diabetic Retinopathy (NPDR)",
    4: "Proliferative Diabetic Retinopathy (PDR)"
}


class ModelUnavailableError(RuntimeError):
    pass


class DiabeticRetinopathyClassifier(nn.Module):
    def __init__(self, num_classes: int = 5, pretrained: bool = False):
        super().__init__()
        weights = EfficientNet_B0_Weights.DEFAULT if pretrained else None
        self.backbone = efficientnet_b0(weights=weights)
        in_features = self.backbone.classifier[1].in_features
        self.backbone.classifier = nn.Sequential(
            nn.Dropout(p=0.3, inplace=True),
            nn.Linear(in_features, num_classes)
        )
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.backbone(x)

    def forward_with_probabilities(self, x: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        logits = self.forward(x)
        probs = torch.softmax(logits, dim=-1)
        return logits, probs

class DRModelManager:
    """
    Manages model loading, device allocation, inference execution, and uncertainty estimation.
    """
    def __init__(self, model_path: str = None, device: str = None):
        self.device = torch.device(device or ("cuda" if torch.cuda.is_available() else "cpu"))
        self.model_path = model_path
        self.model: DiabeticRetinopathyClassifier = None
        self.is_loaded = False
        self.is_custom_checkpoint = False
        self.load_error = None
        self._load_model()

    def _load_model(self):
        if not self.model_path or not os.path.isfile(self.model_path):
            self.load_error = f"Trained model checkpoint not found: {self.model_path}"
            logger.warning(self.load_error)
            return

        try:
            logger.info(f"Initializing EfficientNet-B0 DR model on device: {self.device}")
            checkpoint = torch.load(
                self.model_path,
                map_location=self.device,
                weights_only=True
            )
            if not isinstance(checkpoint, dict) or checkpoint.get("initialized") is True:
                raise ValueError("Untrained or legacy checkpoints are not accepted for screening.")
            metadata = checkpoint.get("metadata")
            if (
                not isinstance(metadata, dict)
                or metadata.get("dataset") != "IDRiD"
                or metadata.get("official_test_metrics") is None
            ):
                raise ValueError("Checkpoint must include IDRiD training metadata and official test metrics.")
            state_dict = checkpoint.get("state_dict")
            if not isinstance(state_dict, dict):
                raise ValueError("Checkpoint must contain a model state_dict.")

            model = DiabeticRetinopathyClassifier(num_classes=5)
            model.load_state_dict(state_dict, strict=True)
            self.model = model
            self.model.to(self.device)
            self.model.eval()
            self.is_custom_checkpoint = True
            self.is_loaded = True
            self.load_error = None
            logger.info("Trained model checkpoint loaded and ready for inference.")
        except Exception as e:
            self.load_error = f"Failed to load DR classifier checkpoint: {e}"
            logger.exception(self.load_error)
            self.model = None
            self.is_loaded = False

    def predict(self, tensor: torch.Tensor) -> Dict[str, Any]:
        if not self.is_loaded or self.model is None:
            raise ModelUnavailableError(
                self.load_error or "A trained DR model checkpoint is unavailable."
            )
        if tensor.ndim != 4 or tensor.shape[0] != 1 or tensor.shape[1] != 3:
            raise ValueError("Inference input must have shape (1, 3, height, width).")

        tensor = tensor.to(self.device)
        with torch.no_grad():
            logits, probs = self.model.forward_with_probabilities(tensor)
            probs_np = probs.cpu().numpy()[0]
            logits_np = logits.cpu().numpy()[0]
        if not np.isfinite(probs_np).all() or not np.isfinite(logits_np).all():
            raise RuntimeError("Model produced non-finite values; refusing to return a prediction.")

        pred_grade = int(np.argmax(probs_np))
        top_class_score_pct = float(probs_np[pred_grade] * 100.0)

        # Calculate predictive entropy as uncertainty measure: H(p) = -sum(p * log(p))
        eps = 1e-12
        entropy = float(-np.sum(probs_np * np.log(probs_np + eps)))
        max_entropy = float(np.log(5.0))  # log(5) for 5 uniform classes
        norm_entropy = float(np.clip(entropy / max_entropy, 0.0, 1.0))

        uncertainty_tier = "Uncalibrated; clinician review required"

        # Sort alternatives
        sorted_indices = np.argsort(probs_np)[::-1]
        top_idx = int(sorted_indices[0])
        second_idx = int(sorted_indices[1])
        third_idx = int(sorted_indices[2])

        probabilities_list = [
            {
                "level": i,
                "label": f"Level {i}: {ICDR_NAMES[i].replace(' Diabetic Retinopathy', '')}",
                "probability": round(float(probs_np[i] * 100.0), 1)
            }
            for i in range(5)
        ]

        model_alternatives = {
            "top": {
                "level": top_idx,
                "label": f"Level {top_idx}: {ICDR_NAMES[top_idx]}",
                "probability": round(float(probs_np[top_idx] * 100.0), 1)
            },
            "second": {
                "level": second_idx,
                "label": f"Level {second_idx}: {ICDR_NAMES[second_idx]}",
                "probability": round(float(probs_np[second_idx] * 100.0), 1)
            },
            "third": {
                "level": third_idx,
                "label": f"Level {third_idx}: {ICDR_NAMES[third_idx]}",
                "probability": round(float(probs_np[third_idx] * 100.0), 1)
            },
            "uncertaintyContext": (
                f"Normalized predictive entropy: {round(norm_entropy, 3)}. "
                "Descriptive only; probabilities and entropy are not calibrated."
            )
        }

        referable_status = "Not clinically assessed"
        referral_urgency = "Not assessed; clinician review required"
        recommendation = (
            "Research output only. A qualified clinician must review the source image; "
            "do not use this classification alone to diagnose, rule out disease, or defer care."
        )

        return {
            "predicted_grade": pred_grade,
            "severity_label": ICDR_NAMES[pred_grade],
            "icdr_code": f"ICDR Stage {pred_grade}",
            "confidence": round(top_class_score_pct, 1),
            "uncertainty_tier": uncertainty_tier,
            "uncertainty_score": round(norm_entropy, 3),
            "referable_status": referable_status,
            "referral_urgency": referral_urgency,
            "recommendation": recommendation,
            "probabilities": probabilities_list,
            "model_alternatives": model_alternatives,
            "raw_logits": [round(float(x), 4) for x in logits_np]
        }
