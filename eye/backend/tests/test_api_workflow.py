import io
import cv2
import numpy as np
from app.services.ai_service import ai_service
from app.core.security import create_access_token
from app.db.models import User

def create_dummy_fundus_bytes():
    img = np.zeros((512, 512, 3), dtype=np.uint8)
    cv2.circle(img, (256, 256), 240, (30, 80, 200), -1)
    cv2.circle(img, (180, 256), 35, (100, 220, 250), -1) # Optic disc
    cv2.circle(img, (320, 256), 18, (15, 30, 90), -1)   # Macula
    for angle in [0.3, 0.8, -0.4, -0.9]:
        x_end = int(180 + 200 * np.cos(angle))
        y_end = int(256 + 200 * np.sin(angle))
        cv2.line(img, (180, 256), (x_end, y_end), (10, 25, 110), 3)

    _, encoded = cv2.imencode(".jpg", img)
    return io.BytesIO(encoded.tobytes())

def test_full_screening_api_workflow(client, db_session):
    clinician = User(
        email="workflow-clinician@example.com",
        full_name="Workflow Test Clinician",
        hashed_password="not-used-in-this-test",
        role="CLINICIAN",
        is_active=True,
        email_verified=True,
    )
    db_session.add(clinician)
    db_session.flush()
    auth_headers = {
        "Authorization": f"Bearer {create_access_token(clinician.id)}",
    }
    img_bytes = create_dummy_fundus_bytes()

    # 1. Upload screening
    upload_response = client.post(
        "/api/screenings/upload",
        headers=auth_headers,
        files={"file": ("fundus_od.jpg", img_bytes, "image/jpeg")},
        data={
            "patient_name": "Test Patient",
            "age": 62,
            "gender": "Male",
            "eye": "OD",
            "diabetes_duration": "9 years"
        }
    )
    assert upload_response.status_code == 200
    res_data = upload_response.json()
    assert "screening_id" in res_data
    screening_id = res_data["screening_id"]
    assert res_data["screening"]["quality"]["overallScore"] > 0

    # 2. Analyze screening with AI
    analyze_response = client.post(
        f"/api/screenings/{screening_id}/analyze",
        headers=auth_headers,
    )
    if not ai_service.model_manager.is_loaded:
        if res_data["screening"]["quality"]["isGradable"]:
            assert analyze_response.status_code == 503
            assert "Trained model checkpoint not found" in analyze_response.json()["detail"]
        else:
            assert analyze_response.status_code == 200
            assert analyze_response.json()["status"] == "UNGRADABLE"
            assert analyze_response.json()["aiResult"] is None
        return

    assert analyze_response.status_code == 200
    analyzed_data = analyze_response.json()
    assert analyzed_data["status"] == "ANALYZED"
    assert "aiResult" in analyzed_data
    assert analyzed_data["aiResult"]["drLevel"] in [0, 1, 2, 3, 4]
    assert "explainability" in analyzed_data
    assert "gradcamUrl" in analyzed_data["explainability"]

    # 3. Clinician Review / Override
    review_response = client.post(
        f"/api/screenings/{screening_id}/review",
        headers=auth_headers,
        json={
            "decision": "Accept",
            "finalDrLevel": analyzed_data["aiResult"]["drLevel"],
            "doctorNotes": "Clinically reviewed fundus photograph. Microaneurysm pattern verified.",
            "reviewerName": "Dr. V. Joshi",
            "registrationNumber": "MCI-48920-MH"
        }
    )
    assert review_response.status_code == 200
    reviewed_data = review_response.json()
    assert reviewed_data["success"] is True
    assert reviewed_data["screening"]["status"] == "REVIEWED"
    assert reviewed_data["screening"]["doctorReview"]["doctorNotes"] == "Clinically reviewed fundus photograph. Microaneurysm pattern verified."

    # 4. Generate & Fetch Report
    report_response = client.get(
        f"/api/screenings/{screening_id}/report",
        headers=auth_headers,
    )
    assert report_response.status_code == 200
    report_data = report_response.json()
    assert "reportId" in report_data
    assert "clinicalSummary" in report_data
    assert report_data["clinicalSummary"]["finalDrLevel"] == analyzed_data["aiResult"]["drLevel"]
