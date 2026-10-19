import cv2
from typing import Dict, Any
from app.ml.quality.quality_checker import FundusQualityChecker

class QualityService:
    @staticmethod
    def assess_image_file(image_path: str) -> Dict[str, Any]:
        image_bgr = cv2.imread(image_path)
        if image_bgr is None:
            raise ValueError(f"Could not read fundus image from: {image_path}")
        return FundusQualityChecker.evaluate(image_bgr)

quality_service = QualityService()
