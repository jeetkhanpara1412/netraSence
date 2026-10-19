import logging
from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.permissions import require_roles
from app.db.models import Screening, User
from app.db.session import get_db
from app.services.screening_service import screening_service
from app.services.quality_service import quality_service
from app.services.explainability_service import explainability_service
from app.ml.classification.model import ModelUnavailableError

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/screenings/upload", summary="Upload Fundus Image & Create Screening Session")
def upload_screening(
    file: UploadFile = File(...),
    patient_name: str = Form("Not provided"),
    patient_id: Optional[str] = Form(None),
    age: Optional[int] = Form(None),
    gender: str = Form("Not provided"),
    eye: str = Form("Not provided"),
    camera_model: str = Form("Not provided"),
    operator_name: str = Form("Not provided"),
    diabetes_duration: Optional[str] = Form(None),
    hba1c: Optional[str] = Form(None),
    systemic_bp: Optional[str] = Form(None),
    phc_center: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "CLINICIAN", "DEVELOPER")),
):
    try:
        screening_res = screening_service.upload_and_create_screening(
            db=db,
            upload_file=file,
            patient_name=patient_name,
            patient_id_ext=patient_id,
            age=age,
            gender=gender,
            eye=eye,
            camera_model=camera_model,
            operator_name=operator_name,
            diabetes_duration=diabetes_duration,
            hba1c=hba1c,
            systemic_bp=systemic_bp,
            phc_center=phc_center
        )
        return {
            "success": True,
            "screening_id": screening_res["id"],
            "status": screening_res["status"],
            "screening": screening_res
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        logger.exception("Screening upload failed.")
        raise HTTPException(status_code=500, detail="Upload failed. Check the server log for details.")

@router.post("/screenings/{screening_id}/analyze", summary="Execute Real AI Model Inference & Grad-CAM")
def analyze_screening(
    screening_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "CLINICIAN", "DEVELOPER")),
):
    try:
        res = screening_service.analyze_screening(db, screening_id)
        return res
    except HTTPException:
        raise
    except ModelUnavailableError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e
    except Exception:
        db.rollback()
        logger.exception("Screening inference failed.")
        raise HTTPException(status_code=500, detail="Inference failed. Check the server log for details.")

@router.get("/screenings/{screening_id}", summary="Get Full Screening Record by ID or Code")
def get_screening(
    screening_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "CLINICIAN", "DEVELOPER")),
):
    return screening_service.get_screening_formatted(db, screening_id)

@router.get("/screenings", summary="List All Recent Screening Sessions")
def list_screenings(
    limit: int = Query(50, ge=1, le=100),
    skip: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "CLINICIAN", "DEVELOPER")),
):
    screenings = db.query(Screening).order_by(Screening.created_at.desc()).offset(skip).limit(limit).all()
    return [screening_service.get_screening_formatted(db, screening.id) for screening in screenings]

@router.post("/screenings/{screening_id}/quality", summary="Run Quality Assessment on Screening")
def assess_screening_quality(
    screening_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "CLINICIAN", "DEVELOPER")),
):
    screening = db.query(Screening).filter(Screening.id == screening_id).first()
    if not screening:
        screening = db.query(Screening).filter(Screening.screening_code == screening_id).first()
    if not screening or not screening.images:
        raise HTTPException(status_code=404, detail="Screening image not found")
    
    return quality_service.assess_image_file(screening.images.original_path)

@router.post("/screenings/{screening_id}/explain", summary="Generate Grad-CAM for Specific Grade")
def generate_gradcam_explanation(
    screening_id: str,
    target_class: Optional[int] = Query(None, ge=0, le=4),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "CLINICIAN", "DEVELOPER")),
):
    screening = db.query(Screening).filter(Screening.id == screening_id).first()
    if not screening:
        screening = db.query(Screening).filter(Screening.screening_code == screening_id).first()
    if not screening or not screening.images:
        raise HTTPException(status_code=404, detail="Screening image not found")

    if not screening.ai_prediction:
        raise HTTPException(status_code=409, detail="Analyze the screening before requesting a Grad-CAM explanation.")
    grade = target_class if target_class is not None else screening.ai_prediction.predicted_grade
    return explainability_service.generate_explanations(screening.images.original_path, predicted_class=grade)
