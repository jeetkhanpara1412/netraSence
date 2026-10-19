import cv2
import numpy as np
from app.ml.quality.quality_checker import FundusQualityChecker

def test_quality_checker_empty_image():
    blank = np.zeros((512, 512, 3), dtype=np.uint8)
    res = FundusQualityChecker.evaluate(blank)
    assert res["is_gradable"] is False
    assert res["status"] == "Ungradable"
    assert res["overall_score"] == 0.0

def test_quality_checker_synthetic_fundus():
    # Generate synthetic fundus circle with simulated vessels
    img = np.zeros((512, 512, 3), dtype=np.uint8)
    cv2.circle(img, (256, 256), 230, (30, 80, 180), -1)  # Orange-red retinal disk
    cv2.circle(img, (180, 256), 35, (100, 200, 240), -1) # Optic disc
    # Simulated sharp branching vessel lines
    cv2.line(img, (180, 256), (350, 120), (10, 20, 100), 4)
    cv2.line(img, (180, 256), (360, 380), (10, 20, 100), 3)

    res = FundusQualityChecker.evaluate(img)
    assert res["overall_score"] > 40.0
    assert "metrics" in res
    assert "focus" in res["metrics"]
    assert "illumination" in res["metrics"]
    assert "fieldOfView" in res["metrics"]
