from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.permissions import require_roles
from app.db.models import User
from app.db.session import get_db
from app.services.report_service import report_service

router = APIRouter()

@router.get("/screenings/{screening_id}/report", summary="Retrieve or Generate Official Tele-Ophthalmology Report")
def get_screening_report(
    screening_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "CLINICIAN", "DEVELOPER")),
):
    return report_service.get_or_create_report(db, screening_id)
