import cv2
import logging
from typing import Dict, Any
from app.core.config import settings
from app.ml.classification.model import DRModelManager, ModelUnavailableError
from app.ml.preprocessing.retina_transforms import preprocess_for_inference

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.model_manager = DRModelManager(
            model_path=settings.MODEL_PATH,
            device=settings.DEVICE
        )

    def is_healthy(self) -> Dict[str, Any]:
        return {
            "loaded": self.model_manager.is_loaded,
            "device": str(self.model_manager.device),
            "custom_weights": self.model_manager.is_custom_checkpoint,
            "error": self.model_manager.load_error
        }

    def predict_image(self, image_path: str) -> Dict[str, Any]:
        if not self.model_manager.is_loaded:
            raise ModelUnavailableError(
                self.model_manager.load_error or "A trained DR model checkpoint is unavailable."
            )
        image_bgr = cv2.imread(image_path)
        if image_bgr is None:
            raise ValueError(f"Could not load image at path: {image_path}")
            
        tensor = preprocess_for_inference(image_bgr, target_size=512)
        prediction = self.model_manager.predict(tensor)
        return prediction

ai_service = AIService()
