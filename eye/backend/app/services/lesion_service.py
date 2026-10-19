from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import numpy as np
import logging

logger = logging.getLogger(__name__)

class BaseLesionAnalyzer(ABC):
    """
    Abstract interface for retinal microvascular lesion detection models.
    Supports modular replacement with deep learning segmentation networks (e.g. U-Net, Mask R-CNN, or Swin-UNETR)
    trained on IDRiD or DDR datasets.
    """
    @abstractmethod
    def analyze(self, image_bgr: np.ndarray) -> Dict[str, Any]:
        pass

class PluggableLesionService(BaseLesionAnalyzer):
    def __init__(self, model_weights_path: Optional[str] = None):
        self.model_weights_path = model_weights_path
        self.is_model_available = False
        if model_weights_path:
            logger.warning(
                "Lesion weights were configured at %s, but no lesion model loader is implemented; "
                "findings remain unavailable.",
                model_weights_path,
            )
        else:
            logger.info("Retinal lesion model is not configured; findings will be marked unavailable.")

    def analyze(self, image_bgr: np.ndarray) -> Dict[str, Any]:
        return {
            "status": "NOT_AVAILABLE",
            "microaneurysms": {"code": "MA", "name": "Microaneurysms", "detected": None, "count": "Not assessed", "severity": "Unknown", "regions": [], "evidenceIds": []},
            "hemorrhages": {"code": "HE", "name": "Intraretinal Hemorrhages", "detected": None, "count": "Not assessed", "severity": "Unknown", "regions": [], "evidenceIds": []},
            "exudates": {"code": "EX", "name": "Hard Exudates", "detected": None, "count": "Not assessed", "severity": "Unknown", "regions": [], "evidenceIds": []},
            "neovascularization": {"code": "NV", "name": "Neovascularization", "detected": None, "count": "Not assessed", "severity": "Unknown", "regions": [], "evidenceIds": []},
            "evidence_gallery": []
        }
lesion_service = PluggableLesionService()
