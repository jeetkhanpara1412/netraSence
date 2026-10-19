from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from app.schemas.ai import (
    ImageQualityResponse,
    AIPredictionResponse,
    ExplainabilityResponse,
    LesionFindingsResponse,
    SelfValidationResponse,
    ModelAlternatives
)
from app.schemas.doctor_review import DoctorReviewResponse

class ScreeningImages(BaseModel):
    original: str
    enhanced: Optional[str] = None
    gradCam: Optional[str] = None
    evidence: Optional[str] = None

class PatientSummary(BaseModel):
    id: str
    name: str
    age: Optional[int] = None
    gender: str
    eye: str
    selectedEye: Optional[str] = None
    diabetesDuration: Optional[str] = None
    hba1c: Optional[str] = None
    systemicBp: Optional[str] = None
    phcCenter: Optional[str] = None
    operator: Optional[str] = None
    cameraModel: Optional[str] = None
    examDate: Optional[str] = None
    previousDate: Optional[str] = None
    previousDrLevel: Optional[int] = None

class AuditTimelineItem(BaseModel):
    time: str
    action: str
    actor: str
    note: Optional[str] = None

class ScreeningDetailResponse(BaseModel):
    id: str
    caseType: str = "REAL_CLINICAL_SCREENING"
    status: str  # UPLOADED, ANALYZED, UNGRADABLE, REVIEWED
    patient: PatientSummary
    images: ScreeningImages
    quality: Optional[ImageQualityResponse] = None
    aiResult: Optional[AIPredictionResponse] = None
    modelAlternatives: Optional[ModelAlternatives] = None
    selfValidation: Optional[SelfValidationResponse] = None
    explainability: Optional[ExplainabilityResponse] = None
    lesions: Optional[LesionFindingsResponse] = None
    structures: Optional[Dict[str, Any]] = None
    evidenceGallery: Optional[List[Dict[str, Any]]] = []
    doctorReview: Optional[DoctorReviewResponse] = None
    auditTimeline: Optional[List[AuditTimelineItem]] = []
    analyzedAt: Optional[str] = None
    presetKey: Optional[str] = "CUSTOM"

class ScreeningUploadResponse(BaseModel):
    screening_id: str
    image_id: str
    status: str
    screening: ScreeningDetailResponse
