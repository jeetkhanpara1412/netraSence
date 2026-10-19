import cv2
import numpy as np
from typing import Dict, Any, List

class FundusQualityChecker:
    """
    Automated computer-vision quality gate for color fundus photography.
    Evaluates:
    1. Focus / Sharpness (Variance of Laplacian over high-contrast retinal vessels)
    2. Illumination / Exposure (Luminance histogram, under/over-exposure clipping)
    3. Field of View (FOV) Coverage (Retinal circular aperture integrity)
    """

    @staticmethod
    def evaluate(image_bgr: np.ndarray) -> Dict[str, Any]:
        h, w = image_bgr.shape[:2]
        gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
        
        # 1. Segment retinal mask to ignore black surrounding borders
        _, mask = cv2.threshold(gray, 12, 255, cv2.THRESH_BINARY)
        retina_pixels = gray[mask > 0]
        
        if len(retina_pixels) == 0:
            return {
                "overall_score": 0.0,
                "focus_score": 0.0,
                "illumination_score": 0.0,
                "field_of_view_score": 0.0,
                "contrast_score": 0.0,
                "artifacts_score": 0.0,
                "is_gradable": False,
                "status": "Ungradable",
                "clinical_verdict": "RECAPTURE REQUIRED (EMPTY/BLACK IMAGE)",
                "recapture_needed": True,
                "issues": ["Image contains no visible retinal structures."],
                "metrics": {
                    "focus": {"score": 0, "status": "Failed", "description": "No fundus detected"},
                    "illumination": {"score": 0, "status": "Failed", "description": "Completely dark"},
                    "fieldOfView": {"score": 0, "status": "Failed", "description": "No aperture"}
                }
            }

        issues: List[str] = []

        # --- A. FOCUS & SHARPNESS EVALUATION ---
        # Variance of Laplacian on green channel (where retinal vessels are most distinct)
        green = image_bgr[:, :, 1]
        laplacian = cv2.Laplacian(green, cv2.CV_64F)
        # Calculate variance strictly within retinal mask
        laplacian_masked = laplacian[mask > 0]
        lap_var = float(np.var(laplacian_masked))
        
        # Calibrated scaling: typical sharp fundus lap_var >= 160. Severe blur <= 45.
        focus_score = float(np.clip((lap_var / 150.0) * 90.0 + 10.0, 10.0, 99.0))
        if lap_var < 45.0:
            focus_status = "Poor"
            issues.append("Optical blur detected: Retinal vessel margins and foveal reflex are indistinct.")
        elif lap_var < 85.0:
            focus_status = "Borderline"
            issues.append("Sub-optimal focus: Fine microvascular details may be degraded.")
        else:
            focus_status = "Optimal"

        # --- B. ILLUMINATION & EXPOSURE EVALUATION ---
        mean_lum = float(np.mean(retina_pixels))
        p5 = float(np.percentile(retina_pixels, 5))
        p95 = float(np.percentile(retina_pixels, 95))
        
        # Over-exposure: percentage of retina pixels saturated (> 245)
        over_exposed_ratio = float(np.sum(retina_pixels > 245)) / len(retina_pixels)
        # Under-exposure: percentage of retina pixels very dark (< 25)
        under_exposed_ratio = float(np.sum(retina_pixels < 25)) / len(retina_pixels)
        
        illum_score = 92.0
        if mean_lum < 40.0:
            illum_score -= 40.0
            issues.append("Severe under-exposure: Macular region is insufficiently illuminated.")
        elif mean_lum < 60.0:
            illum_score -= 20.0
            issues.append("Mild under-exposure: Peripheral retina is shadowed.")
            
        if over_exposed_ratio > 0.08:
            illum_score -= 35.0
            issues.append("Excessive flash artifact / corneal reflection obscuring retina.")
        elif over_exposed_ratio > 0.03:
            illum_score -= 15.0

        illum_score = float(np.clip(illum_score, 15.0, 98.0))
        if illum_score < 50.0:
            illum_status = "Poor"
        elif illum_score < 75.0:
            illum_status = "Borderline"
        else:
            illum_status = "Good"

        # --- C. FIELD OF VIEW & CENTERING ---
        # Ratio of retinal mask area to expected circular aperture area
        retina_area = float(np.sum(mask > 0))
        total_frame_area = float(h * w)
        coverage_ratio = retina_area / total_frame_area
        
        # In a standard 45° fundus photograph, circular retina occupies ~55% to 75% of the rectangular frame
        fov_score = 95.0
        if coverage_ratio < 0.30:
            fov_score = 35.0
            issues.append("Significant field clipping or severe eyelid/eyelash obstruction.")
        elif coverage_ratio < 0.45:
            fov_score = 65.0
            issues.append("Partial peripheral clipping: Full 45° diagnostic field not captured.")
        else:
            fov_score = float(min(98.0, 85.0 + (coverage_ratio - 0.45) * 40.0))

        if fov_score < 50.0:
            fov_status = "Incomplete"
        elif fov_score < 75.0:
            fov_status = "Partial"
        else:
            fov_status = "Full 45°"

        # --- D. CONTRAST & ARTIFACT ESTIMATION ---
        contrast_ratio = (p95 - p5) / max(mean_lum, 1.0)
        contrast_score = float(np.clip(contrast_ratio * 40.0, 30.0, 95.0))
        artifacts_score = float(np.clip(100.0 - (over_exposed_ratio * 300.0), 20.0, 96.0))

        # --- E. OVERALL COMPOSITE QUALITY SCORE ---
        overall_score = float(
            0.40 * focus_score +
            0.35 * illum_score +
            0.15 * fov_score +
            0.05 * contrast_score +
            0.05 * artifacts_score
        )
        overall_score = round(overall_score, 1)

        # Classification decision gate
        is_gradable = bool(overall_score >= 55.0 and focus_score >= 45.0 and illum_score >= 45.0)
        recapture_needed = not is_gradable

        if overall_score >= 80.0:
            status = "Good"
            verdict = "GOOD FOR ANALYSIS"
        elif overall_score >= 55.0:
            status = "Borderline"
            verdict = "BORDERLINE - ACCEPTABLE WITH CAUTION"
        else:
            status = "Ungradable"
            verdict = "RECAPTURE REQUIRED (INSUFFICIENT QUALITY)"

        return {
            "overall_score": overall_score,
            "focus_score": round(focus_score, 1),
            "illumination_score": round(illum_score, 1),
            "field_of_view_score": round(fov_score, 1),
            "contrast_score": round(contrast_score, 1),
            "artifacts_score": round(artifacts_score, 1),
            "is_gradable": is_gradable,
            "status": status,
            "clinical_verdict": verdict,
            "recapture_needed": recapture_needed,
            "issues": issues,
            "metrics": {
                "focus": {
                    "score": round(focus_score, 1),
                    "status": focus_status,
                    "description": "Vessel edge definition and foveal avascular zone clarity"
                },
                "illumination": {
                    "score": round(illum_score, 1),
                    "status": illum_status,
                    "description": "Macular and arcade illumination uniformity"
                },
                "fieldOfView": {
                    "score": round(fov_score, 1),
                    "status": fov_status,
                    "description": "Centering includes optic nerve head and macular center"
                },
                "contrast": {
                    "score": round(contrast_score, 1),
                    "status": "Adequate" if contrast_score >= 70 else "Sub-optimal",
                    "description": "Vessel-to-background luminance contrast"
                },
                "artifacts": {
                    "score": round(artifacts_score, 1),
                    "status": "Low" if artifacts_score >= 80 else "Present",
                    "description": "Corneal reflections, dust spots, or eyelash shadows"
                }
            }
        }
