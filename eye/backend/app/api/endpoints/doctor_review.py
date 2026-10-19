import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.permissions import require_roles
from app.db.models import User
from app.db.session import get_db
from app.schemas.doctor_review import DoctorReviewCreate
from app.services.screening_service import screening_service

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/screenings/{screening_id}/review", summary="Submit Clinician Review / Override")
def submit_doctor_review(
    screening_id: str,
    review_in: DoctorReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "CLINICIAN")),
):
    try:
        updated = screening_service.submit_doctor_review(db, screening_id, review_in)
        return {
            "success": True,
            "message": "Doctor review recorded successfully in audit trail.",
            "screening": updated
        }
    except HTTPException:
        raise
    except Exception:
        db.rollback()
        logger.exception("Clinician review submission failed.")
        raise HTTPException(status_code=500, detail="Review submission failed. Check the server log for details.")

@router.get("/screenings/{screening_id}/review", summary="Get Review Details for Screening")
def get_doctor_review(
    screening_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "CLINICIAN", "DEVELOPER")),
):
    screening = screening_service.get_screening_formatted(db, screening_id)
    return screening.get("doctorReview") or {"status": "PENDING_REVIEW"}
