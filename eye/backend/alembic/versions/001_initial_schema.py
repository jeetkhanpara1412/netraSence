"""001_initial_schema

Revision ID: 001_initial
Revises: 
Create Date: 2026-09-20 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Users table
    op.create_table(
        'users',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('email', sa.String(length=255), nullable=False, unique=True),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=32), nullable=False, server_default='DOCTOR'),
        sa.Column('registration_number', sa.String(length=64), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False)
    )

    # Patients table
    op.create_table(
        'patients',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('external_id', sa.String(length=64), nullable=False, unique=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('age', sa.Integer(), nullable=False),
        sa.Column('gender', sa.String(length=32), nullable=False),
        sa.Column('diabetes_duration', sa.String(length=128), nullable=True),
        sa.Column('hba1c', sa.String(length=32), nullable=True),
        sa.Column('systemic_bp', sa.String(length=64), nullable=True),
        sa.Column('phc_center', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False)
    )

    # Screenings table
    op.create_table(
        'screenings',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('screening_code', sa.String(length=64), nullable=False, unique=True),
        sa.Column('patient_id', sa.String(length=36), sa.ForeignKey('patients.id', ondelete='CASCADE'), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='UPLOADED'),
        sa.Column('eye', sa.String(length=16), nullable=False, server_default='OD'),
        sa.Column('camera_model', sa.String(length=255), nullable=True),
        sa.Column('operator_name', sa.String(length=255), nullable=True),
        sa.Column('exam_date', sa.String(length=64), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False)
    )

    # Fundus Images table
    op.create_table(
        'fundus_images',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('screening_id', sa.String(length=36), sa.ForeignKey('screenings.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('original_path', sa.Text(), nullable=False),
        sa.Column('enhanced_path', sa.Text(), nullable=True),
        sa.Column('gradcam_path', sa.Text(), nullable=True),
        sa.Column('evidence_path', sa.Text(), nullable=True),
        sa.Column('original_filename', sa.String(length=255), nullable=True),
        sa.Column('file_size_bytes', sa.Integer(), nullable=True),
        sa.Column('mime_type', sa.String(length=64), nullable=True),
        sa.Column('width', sa.Integer(), nullable=True),
        sa.Column('height', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False)
    )

    # Image Quality Results table
    op.create_table(
        'image_quality_results',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('screening_id', sa.String(length=36), sa.ForeignKey('screenings.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('overall_score', sa.Float(), nullable=False),
        sa.Column('focus_score', sa.Float(), nullable=False),
        sa.Column('illumination_score', sa.Float(), nullable=False),
        sa.Column('field_of_view_score', sa.Float(), nullable=False),
        sa.Column('contrast_score', sa.Float(), nullable=True),
        sa.Column('artifacts_score', sa.Float(), nullable=True),
        sa.Column('is_gradable', sa.Boolean(), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False),
        sa.Column('clinical_verdict', sa.String(length=64), nullable=False),
        sa.Column('recapture_needed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('issues', sa.JSON(), nullable=True),
        sa.Column('metrics', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False)
    )

    # AI Predictions table
    op.create_table(
        'ai_predictions',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('screening_id', sa.String(length=36), sa.ForeignKey('screenings.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('predicted_grade', sa.Integer(), nullable=False),
        sa.Column('severity_label', sa.String(length=128), nullable=False),
        sa.Column('icdr_code', sa.String(length=32), nullable=False),
        sa.Column('confidence', sa.Float(), nullable=False),
        sa.Column('uncertainty_tier', sa.String(length=64), nullable=False),
        sa.Column('uncertainty_score', sa.Float(), nullable=False),
        sa.Column('referable_status', sa.String(length=32), nullable=False),
        sa.Column('referral_urgency', sa.String(length=64), nullable=False),
        sa.Column('recommendation', sa.Text(), nullable=True),
        sa.Column('probabilities', sa.JSON(), nullable=False),
        sa.Column('model_alternatives', sa.JSON(), nullable=True),
        sa.Column('raw_logits', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False)
    )

    # Lesion Findings table
    op.create_table(
        'lesion_findings',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('screening_id', sa.String(length=36), sa.ForeignKey('screenings.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='AVAILABLE'),
        sa.Column('microaneurysms', sa.JSON(), nullable=True),
        sa.Column('hemorrhages', sa.JSON(), nullable=True),
        sa.Column('exudates', sa.JSON(), nullable=True),
        sa.Column('neovascularization', sa.JSON(), nullable=True),
        sa.Column('evidence_gallery', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False)
    )

    # Structure Findings table
    op.create_table(
        'structures_findings',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('screening_id', sa.String(length=36), sa.ForeignKey('screenings.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('optic_disc', sa.JSON(), nullable=True),
        sa.Column('macula_fovea', sa.JSON(), nullable=True),
        sa.Column('vessels', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False)
    )

    # Explanations table
    op.create_table(
        'explanations',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('screening_id', sa.String(length=36), sa.ForeignKey('screenings.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('gradcam_url', sa.Text(), nullable=False),
        sa.Column('target_layer', sa.String(length=64), nullable=True),
        sa.Column('heatmap_description', sa.Text(), nullable=True),
        sa.Column('attention_hotspots', sa.JSON(), nullable=True),
        sa.Column('self_validation', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False)
    )

    # Doctor Reviews table
    op.create_table(
        'doctor_reviews',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('screening_id', sa.String(length=36), sa.ForeignKey('screenings.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('decision', sa.String(length=32), nullable=False),
        sa.Column('final_dr_level', sa.Integer(), nullable=False),
        sa.Column('urgency', sa.String(length=64), nullable=True),
        sa.Column('override_reason', sa.Text(), nullable=True),
        sa.Column('doctor_notes', sa.Text(), nullable=True),
        sa.Column('reviewer_name', sa.String(length=128), nullable=True),
        sa.Column('registration_number', sa.String(length=64), nullable=True),
        sa.Column('review_timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('is_overridden', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False)
    )

    # Audit Events table
    op.create_table(
        'audit_events',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('screening_id', sa.String(length=36), sa.ForeignKey('screenings.id', ondelete='CASCADE'), nullable=False),
        sa.Column('event_type', sa.String(length=64), nullable=False),
        sa.Column('actor', sa.String(length=128), nullable=False),
        sa.Column('role', sa.String(length=32), nullable=False, server_default='SYSTEM'),
        sa.Column('note', sa.Text(), nullable=True),
        sa.Column('details', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False)
    )

    # Reports table
    op.create_table(
        'reports',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('report_code', sa.String(length=64), nullable=False, unique=True),
        sa.Column('screening_id', sa.String(length=36), sa.ForeignKey('screenings.id', ondelete='CASCADE'), nullable=False),
        sa.Column('facility', sa.String(length=255), nullable=True),
        sa.Column('nodal_hospital', sa.String(length=255), nullable=True),
        sa.Column('generated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False)
    )

def downgrade() -> None:
    op.drop_table('reports')
    op.drop_table('audit_events')
    op.drop_table('doctor_reviews')
    op.drop_table('explanations')
    op.drop_table('structures_findings')
    op.drop_table('lesion_findings')
    op.drop_table('ai_predictions')
    op.drop_table('image_quality_results')
    op.drop_table('fundus_images')
    op.drop_table('screenings')
    op.drop_table('patients')
    op.drop_table('users')
