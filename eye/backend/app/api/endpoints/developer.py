import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.permissions import get_current_user, require_roles
from app.core.security import generate_api_key, hash_api_key
from app.db.models import APIKey, User
from app.db.session import get_db
from app.schemas.auth import APIKeyCreateRequest, APIKeyResponse

router = APIRouter(prefix="/developer", tags=["Developer API"])
logger = logging.getLogger(__name__)


@router.get("/usage")
def get_usage(current_user: User = Depends(require_roles("ADMIN", "DEVELOPER", "CLINICIAN")), db: Session = Depends(get_db)):
    return {
        "user": current_user.email,
        "role": current_user.role,
        "requests_allowed_per_minute": settings.PUBLIC_API_RATE_LIMIT_PER_MINUTE,
        "max_uploads_per_minute": settings.MAX_IMAGE_UPLOADS_PER_MINUTE,
        "model_private": True,
    }


@router.post("/keys", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_api_key(
    payload: APIKeyCreateRequest,
    current_user: User = Depends(require_roles("ADMIN", "DEVELOPER")),
    db: Session = Depends(get_db),
):
    secret = generate_api_key()
    raw_key = secret
    api_key = APIKey(
        user_id=current_user.id,
        name=payload.name,
        key_prefix=raw_key[:12],
        hashed_key=hash_api_key(raw_key),
        scopes=payload.scopes,
        expires_at=datetime.now(timezone.utc) + timedelta(days=payload.expires_in_days),
        is_active=True,
    )
    db.add(api_key)
    db.commit()
    db.refresh(api_key)
    return {
        "id": api_key.id,
        "name": api_key.name,
        "key_prefix": api_key.key_prefix,
        "secret": raw_key,
        "scopes": api_key.scopes,
        "expires_at": api_key.expires_at,
    }


@router.get("/keys", response_model=list[APIKeyResponse])
def list_api_keys(
    current_user: User = Depends(require_roles("ADMIN", "DEVELOPER")),
    db: Session = Depends(get_db),
):
    keys = db.query(APIKey).filter(APIKey.user_id == current_user.id).order_by(APIKey.created_at.desc()).all()
    return keys


@router.delete("/keys/{key_id}")
def revoke_api_key(
    key_id: str,
    current_user: User = Depends(require_roles("ADMIN", "DEVELOPER")),
    db: Session = Depends(get_db),
):
    api_key = db.query(APIKey).filter(APIKey.id == key_id, APIKey.user_id == current_user.id).first()
    if api_key is None:
        raise HTTPException(status_code=404, detail="API key not found.")
    api_key.is_active = False
    api_key.revoked_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "API key revoked."}
