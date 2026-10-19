"""Allow unknown patient age without storing zero as a fabricated value."""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "002_nullable_patient_age"
down_revision: Union[str, None] = "001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("patients") as batch_op:
        batch_op.alter_column(
            "age",
            existing_type=sa.Integer(),
            nullable=True,
        )


def downgrade() -> None:
    with op.batch_alter_table("patients") as batch_op:
        batch_op.alter_column(
            "age",
            existing_type=sa.Integer(),
            nullable=False,
        )
