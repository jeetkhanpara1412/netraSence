"""Merge the authentication and nullable-patient-age migration heads."""

from typing import Sequence, Union


revision: str = "003_merge_auth_and_patient_age"
down_revision: Union[str, Sequence[str], None] = (
    "002_nullable_patient_age",
    "002_security_auth_and_api_keys",
)
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
