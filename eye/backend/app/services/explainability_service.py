import cv2
import logging
from typing import Dict, Any, List
from app.ml.explainability.gradcam import GradCAM
from app.ml.preprocessing.retina_transforms import (
    preprocess_for_inference,
    extract_green_clahe
)
from app.services.ai_service import ai_service
from app.storage.file_storage import storage_service

logger = logging.getLogger(__name__)

class ExplainabilityService:
    def __init__(self):
        self.gradcam = None
        self._init_gradcam()

    def _init_gradcam(self):
        if ai_service.model_manager.model is not None:
            self.gradcam = GradCAM(ai_service.model_manager.model)

    def generate_explanations(self, original_image_path: str, predicted_class: int) -> Dict[str, Any]:
        if self.gradcam is None:
            self._init_gradcam()
        if self.gradcam is None:
            raise RuntimeError("Grad-CAM explainability engine could not be initialized.")

        original_bgr = cv2.imread(original_image_path)
        if original_bgr is None:
            raise ValueError(f"Failed to read image at: {original_image_path}")

        # 1. Generate CLAHE Enhanced Image (Green channel)
        enhanced_bgr = extract_green_clahe(original_bgr)
        enhanced_saved = storage_service.save_numpy_image(enhanced_bgr, category="enhanced")

        # 2. Generate Grad-CAM Heatmap
        tensor = preprocess_for_inference(original_bgr, target_size=512)
        cam_norm, logits, hotspots = self.gradcam.generate_heatmap(tensor, target_class=predicted_class)
        
        # 3. Blend Grad-CAM Heatmap on Original Fundus
        overlay_bgr = GradCAM.overlay_heatmap(original_bgr, cam_norm, alpha=0.45)
        gradcam_saved = storage_service.save_numpy_image(overlay_bgr, category="gradcam")

        # 4. Generate ROI thumbnail evidence if hotspots exist
        evidence_saved = None
        if hotspots:
            h, w = original_bgr.shape[:2]
            top_spot = hotspots[0]
            cx, cy = int(top_spot["x"] * w / 100.0), int(top_spot["y"] * h / 100.0)
            box_size = min(h, w) // 4
            x1 = max(0, cx - box_size)
            y1 = max(0, cy - box_size)
            x2 = min(w, cx + box_size)
            y2 = min(h, cy + box_size)
            roi = original_bgr[y1:y2, x1:x2]
            if roi.size > 0:
                evidence_saved = storage_service.save_numpy_image(roi, category="evidence")

        self_validation = {
            "status": "NOT_ASSESSED",
            "isConsistent": False,
            "alignmentScore": None,
            "alignmentLevel": "NOT_ASSESSED",
            "gradcamLesionAlignment": "Not assessed",
            "summary": "Grad-CAM shows model attention only; lesion overlap has not been validated.",
            "details": "No validated lesion segmentation or spatial overlap procedure is configured."
        }

        return {
            "enhanced_url": enhanced_saved["url"],
            "gradcam_url": gradcam_saved["url"],
            "evidence_url": evidence_saved["url"] if evidence_saved else gradcam_saved["url"],
            "target_layer": "backbone.features[-1]",
            "heatmap_description": (
                "Grad-CAM visualizes image regions that influenced the model score. "
                "Highlighted areas are not confirmed lesions."
            ),
            "attention_hotspots": hotspots,
            "self_validation": self_validation
        }

explainability_service = ExplainabilityService()
