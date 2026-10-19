import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    JSON,
    Index
)
from sqlalchemy.orm import relationship
from app.db.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(32), default="CLINICIAN", nullable=False)  # ADMIN, CLINICIAN, DEVELOPER, PATIENT
    registration_number = Column(String(64), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    email_verified = Column(Boolean, default=False, nullable=False)
    failed_login_attempts = Column(Integer, default=0, nullable=False)
    locked_until = Column(DateTime(timezone=True), nullable=True)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now, nullable=False)

    api_keys = relationship("APIKey", back_populates="user", cascade="all, delete-orphan")


class APIKey(Base):
    __tablename__ = "api_keys"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(64), nullable=False)
    key_prefix = Column(String(32), nullable=False, index=True)
    hashed_key = Column(String(255), nullable=False)
    scopes = Column(JSON, default=list)
    is_active = Column(Boolean, default=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    last_used_at = Column(DateTime(timezone=True), nullable=True)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)

    user = relationship("User", back_populates="api_keys")


class Patient(Base):
    __tablename__ = "patients"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    external_id = Column(String(64), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    age = Column(Integer, nullable=True)
    gender = Column(String(32), nullable=False)
    diabetes_duration = Column(String(128), nullable=True)  # e.g. "11 years (Type 2 DM)"
    hba1c = Column(String(32), nullable=True)              # e.g. "8.4%"
    systemic_bp = Column(String(64), nullable=True)        # e.g. "138/86 mmHg"
    phc_center = Column(String(255), nullable=True)         # Rural health facility
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now, nullable=False)

    screenings = relationship("Screening", back_populates="patient", cascade="all, delete-orphan")


class Screening(Base):
    __tablename__ = "screenings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    screening_code = Column(String(64), unique=True, nullable=False, index=True)  # e.g., SCN-2026-0842
    patient_id = Column(String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(32), default="UPLOADED", nullable=False, index=True)
    # Statuses: UPLOADED, ANALYZING, ANALYZED, UNGRADABLE, REVIEWED
    
    eye = Column(String(16), default="OD", nullable=False)  # "OD" (Right) or "OS" (Left)
    camera_model = Column(String(255), default="Not provided")
    operator_name = Column(String(255), default="Not provided")
    exam_date = Column(String(64), nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now, nullable=False)

    # Relationships
    patient = relationship("Patient", back_populates="screenings")
    images = relationship("FundusImage", back_populates="screening", uselist=False, cascade="all, delete-orphan")
    quality = relationship("ImageQualityResult", back_populates="screening", uselist=False, cascade="all, delete-orphan")
    ai_prediction = relationship("AIPrediction", back_populates="screening", uselist=False, cascade="all, delete-orphan")
    lesion_findings = relationship("LesionFinding", back_populates="screening", uselist=False, cascade="all, delete-orphan")
    structures_findings = relationship("StructureFinding", back_populates="screening", uselist=False, cascade="all, delete-orphan")
    explanation = relationship("Explanation", back_populates="screening", uselist=False, cascade="all, delete-orphan")
    doctor_review = relationship("DoctorReview", back_populates="screening", uselist=False, cascade="all, delete-orphan")
    audit_events = relationship("AuditEvent", back_populates="screening", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="screening", cascade="all, delete-orphan")


class FundusImage(Base):
    __tablename__ = "fundus_images"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    screening_id = Column(String(36), ForeignKey("screenings.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    
    original_path = Column(Text, nullable=False)
    enhanced_path = Column(Text, nullable=True)
    gradcam_path = Column(Text, nullable=True)
    evidence_path = Column(Text, nullable=True)
    
    original_filename = Column(String(255), nullable=True)
    file_size_bytes = Column(Integer, nullable=True)
    mime_type = Column(String(64), nullable=True)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)

    screening = relationship("Screening", back_populates="images")


class ImageQualityResult(Base):
    __tablename__ = "image_quality_results"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    screening_id = Column(String(36), ForeignKey("screenings.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    
    overall_score = Column(Float, nullable=False)
    focus_score = Column(Float, nullable=False)
    illumination_score = Column(Float, nullable=False)
    field_of_view_score = Column(Float, nullable=False)
    contrast_score = Column(Float, default=85.0)
    artifacts_score = Column(Float, default=90.0)
    
    is_gradable = Column(Boolean, nullable=False)
    status = Column(String(32), nullable=False)            # "Good" | "Borderline" | "Ungradable"
    clinical_verdict = Column(String(64), nullable=False)  # "GOOD FOR ANALYSIS" | "RECAPTURE RECOMMENDED"
    recapture_needed = Column(Boolean, default=False, nullable=False)
    
    issues = Column(JSON, default=list)                   # List of identified quality defects
    metrics = Column(JSON, default=dict)                  # Detailed metric dictionaries with status & description
    
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)

    screening = relationship("Screening", back_populates="quality")


class AIPrediction(Base):
    __tablename__ = "ai_predictions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    screening_id = Column(String(36), ForeignKey("screenings.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    
    predicted_grade = Column(Integer, nullable=False)      # 0 to 4
    severity_label = Column(String(128), nullable=False)   # e.g. "Moderate Non-Proliferative Diabetic Retinopathy (NPDR)"
    icdr_code = Column(String(32), nullable=False)         # e.g. "ICDR Stage 2"
    
    confidence = Column(Float, nullable=False)            # Raw top-class softmax score (%); not calibrated
    uncertainty_tier = Column(String(64), nullable=False)  # Uncalibrated; clinician review required
    uncertainty_score = Column(Float, nullable=False)      # Normalized Shannon entropy [0.0 - 1.0]
    
    referable_status = Column(String(32), nullable=False)  # "Referable" | "Non-Referable"
    referral_urgency = Column(String(64), nullable=False)  # Timing is not assessed by the model
    recommendation = Column(Text, nullable=True)
    
    probabilities = Column(JSON, nullable=False)           # 5-class distribution array [{level, label, probability}]
    model_alternatives = Column(JSON, nullable=True)       # Top, second, third ranked predictions with uncertainty context
    raw_logits = Column(JSON, nullable=True)               # Pre-softmax model outputs for calibration audit
    
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)

    screening = relationship("Screening", back_populates="ai_prediction")


class LesionFinding(Base):
    __tablename__ = "lesion_findings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    screening_id = Column(String(36), ForeignKey("screenings.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    
    status = Column(String(32), default="AVAILABLE", nullable=False)  # "AVAILABLE" | "NOT_AVAILABLE"
    microaneurysms = Column(JSON, default=dict)
    hemorrhages = Column(JSON, default=dict)
    exudates = Column(JSON, default=dict)
    neovascularization = Column(JSON, default=dict)
    evidence_gallery = Column(JSON, default=list)
    
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)

    screening = relationship("Screening", back_populates="lesion_findings")


class StructureFinding(Base):
    __tablename__ = "structures_findings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    screening_id = Column(String(36), ForeignKey("screenings.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    
    optic_disc = Column(JSON, default=dict)
    macula_fovea = Column(JSON, default=dict)
    vessels = Column(JSON, default=dict)
    
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)

    screening = relationship("Screening", back_populates="structures_findings")


class Explanation(Base):
    __tablename__ = "explanations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    screening_id = Column(String(36), ForeignKey("screenings.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    
    gradcam_url = Column(Text, nullable=False)
    target_layer = Column(String(64), default="features.8")
    heatmap_description = Column(Text, nullable=True)
    attention_hotspots = Column(JSON, default=list)        # [{x, y, intensity, feature}]
    self_validation = Column(JSON, default=dict)           # Spatial alignment score & explanation consistency
    
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)

    screening = relationship("Screening", back_populates="explanation")


class DoctorReview(Base):
    __tablename__ = "doctor_reviews"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    screening_id = Column(String(36), ForeignKey("screenings.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    
    decision = Column(String(32), nullable=False)          # "Accept" | "Modify" | "Mark for Review" | "Refer"
    final_dr_level = Column(Integer, nullable=False)       # 0 to 4
    urgency = Column(String(64), nullable=True)
    override_reason = Column(Text, nullable=True)
    doctor_notes = Column(Text, nullable=True)
    reviewer_name = Column(String(128), nullable=True)
    registration_number = Column(String(64), nullable=True)
    review_timestamp = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    is_overridden = Column(Boolean, default=False, nullable=False)
    
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now, nullable=False)

    screening = relationship("Screening", back_populates="doctor_review")


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    screening_id = Column(String(36), ForeignKey("screenings.id", ondelete="CASCADE"), nullable=False, index=True)
    
    event_type = Column(String(64), nullable=False)        # IMAGE_UPLOADED, QUALITY_CHECK, AI_INFERENCE, DOCTOR_REVIEW, etc.
    actor = Column(String(128), nullable=False)
    role = Column(String(32), default="SYSTEM", nullable=False)
    note = Column(Text, nullable=True)
    details = Column(JSON, default=dict)
    
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False, index=True)

    screening = relationship("Screening", back_populates="audit_events")


class Report(Base):
    __tablename__ = "reports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    report_code = Column(String(64), unique=True, nullable=False, index=True)  # e.g., REP-2026-0842
    screening_id = Column(String(36), ForeignKey("screenings.id", ondelete="CASCADE"), nullable=False, index=True)
    
    facility = Column(String(255), default="Maharashtra Tele-Ophthalmology Network (Vision Mission India)")
    nodal_hospital = Column(String(255), default="Sasoon General Hospital & B.J. Medical College, Pune")
    generated_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)

    screening = relationship("Screening", back_populates="reports")
