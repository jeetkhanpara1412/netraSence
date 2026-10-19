"""Add indexes declared by the SQLAlchemy models."""

from typing import Sequence, Union

from alembic import op


revision: str = "004_add_model_indexes"
down_revision: Union[str, None] = "003_merge_auth_and_patient_age"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index("ix_ai_predictions_screening_id", "ai_predictions", ["screening_id"], unique=True)
    op.create_index("ix_audit_events_created_at", "audit_events", ["created_at"], unique=False)
    op.create_index("ix_audit_events_screening_id", "audit_events", ["screening_id"], unique=False)
    op.create_index("ix_doctor_reviews_screening_id", "doctor_reviews", ["screening_id"], unique=True)
    op.create_index("ix_explanations_screening_id", "explanations", ["screening_id"], unique=True)
    op.create_index("ix_fundus_images_screening_id", "fundus_images", ["screening_id"], unique=True)
    op.create_index("ix_image_quality_results_screening_id", "image_quality_results", ["screening_id"], unique=True)
    op.create_index("ix_lesion_findings_screening_id", "lesion_findings", ["screening_id"], unique=True)
    op.create_index("ix_patients_external_id", "patients", ["external_id"], unique=True)
    op.create_index("ix_reports_report_code", "reports", ["report_code"], unique=True)
    op.create_index("ix_reports_screening_id", "reports", ["screening_id"], unique=False)
    op.create_index("ix_screenings_patient_id", "screenings", ["patient_id"], unique=False)
    op.create_index("ix_screenings_screening_code", "screenings", ["screening_code"], unique=True)
    op.create_index("ix_screenings_status", "screenings", ["status"], unique=False)
    op.create_index("ix_structures_findings_screening_id", "structures_findings", ["screening_id"], unique=True)
    op.create_index("ix_users_email", "users", ["email"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_users_email", table_name="users")
    op.drop_index("ix_structures_findings_screening_id", table_name="structures_findings")
    op.drop_index("ix_screenings_status", table_name="screenings")
    op.drop_index("ix_screenings_screening_code", table_name="screenings")
    op.drop_index("ix_screenings_patient_id", table_name="screenings")
    op.drop_index("ix_reports_screening_id", table_name="reports")
    op.drop_index("ix_reports_report_code", table_name="reports")
    op.drop_index("ix_patients_external_id", table_name="patients")
    op.drop_index("ix_lesion_findings_screening_id", table_name="lesion_findings")
    op.drop_index("ix_image_quality_results_screening_id", table_name="image_quality_results")
    op.drop_index("ix_fundus_images_screening_id", table_name="fundus_images")
    op.drop_index("ix_explanations_screening_id", table_name="explanations")
    op.drop_index("ix_doctor_reviews_screening_id", table_name="doctor_reviews")
    op.drop_index("ix_audit_events_screening_id", table_name="audit_events")
    op.drop_index("ix_audit_events_created_at", table_name="audit_events")
    op.drop_index("ix_ai_predictions_screening_id", table_name="ai_predictions")
