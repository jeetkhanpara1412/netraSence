import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.permissions import get_current_user, require_roles
from app.core.security import generate_api_key, get_password_hash, hash_api_key, verify_password, create_access_token
from app.db.models import APIKey, User
from app.db.session import get_db
from app.schemas.auth import APIKeyCreateRequest, APIKeyResponse, ChangePasswordRequest, LoginRequest, RegisterRequest, TokenResponse, UserPublic

router = APIRouter(prefix="/auth", tags=["Authentication"])
logger = logging.getLogger(__name__)


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_user(payload: RegisterRequest, db: Session = Depends(get_db)):
    normalized_email = payload.email.lower().strip()
    if db.query(User).filter(User.email == normalized_email).first():
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    user = User(
        email=normalized_email,
        full_name=payload.full_name.strip(),
        hashed_password=get_password_hash(payload.password),
        role="PATIENT",
        registration_number=payload.registration_number,
        is_active=True,
        email_verified=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        user=UserPublic.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse)
def login_user(payload: LoginRequest, db: Session = Depends(get_db)):
    normalized_email = payload.email.lower().strip()
    user = db.query(User).filter(User.email == normalized_email).first()
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if user.locked_until and user.locked_until > datetime.now(timezone.utc):
        raise HTTPException(status_code=403, detail="Too many failed login attempts. Please try again later.")

    if not verify_password(payload.password, user.hashed_password):
        user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
        if user.failed_login_attempts >= settings.AUTH_LOCKOUT_ATTEMPTS:
            user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=settings.AUTH_LOCKOUT_MINUTES)
            user.failed_login_attempts = settings.AUTH_LOCKOUT_ATTEMPTS
        db.commit()
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    user.failed_login_attempts = 0
    user.last_login_at = datetime.now(timezone.utc)
    db.commit()

    token = create_access_token(user.id)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        user=UserPublic.model_validate(user),
    )


@router.get("/me", response_model=UserPublic)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=401, detail="Current password is incorrect.")

    current_user.hashed_password = get_password_hash(payload.new_password)
    current_user.failed_login_attempts = 0
    current_user.locked_until = None
    db.commit()
    return {"message": "Password changed successfully."}


@router.post("/logout")
def logout_user(current_user: User = Depends(get_current_user)):
    return {"message": f"Session ended for {current_user.email}."}
