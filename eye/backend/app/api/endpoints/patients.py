from typing import List
import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.permissions import require_roles
from app.db.models import Patient, User
from app.db.session import get_db
from app.schemas.patient import PatientCreate, PatientResponse

router = APIRouter()

@router.get("/patients", response_model=List[PatientResponse], summary="List Patients")
def list_patients(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "CLINICIAN")),
):
    return db.query(Patient).order_by(Patient.created_at.desc()).offset(skip).limit(limit).all()

@router.post("/patients", response_model=PatientResponse, summary="Create Patient Record")
def create_patient(
    patient_in: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "CLINICIAN")),
):
    patient = Patient(
        name=patient_in.name,
        age=patient_in.age,
        gender=patient_in.gender,
        external_id=patient_in.external_id or f"LOCAL-{uuid.uuid4().hex.upper()}",
        diabetes_duration=patient_in.diabetes_duration,
        hba1c=patient_in.hba1c,
        systemic_bp=patient_in.systemic_bp,
        phc_center=patient_in.phc_center,
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient
