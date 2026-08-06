from __future__ import annotations

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..config import settings
from ..models import User, RefreshToken, License
from ..schemas import RegisterIn, LoginIn, TokenOut, RefreshIn, UserOut
from ..core.security import (
    hash_password, verify_password, create_access_token,
    new_refresh_token, hash_refresh, new_license_key,
)
from ..config import settings
from ..services import plans
from ..deps import get_current_user
import secrets
import logging
from pydantic import BaseModel, EmailStr, Field

log = logging.getLogger("leadly.auth")
router = APIRouter(prefix="/auth", tags=["auth"])

# In development we return tokens in the response so flows are testable without
# an email provider. In production, wire these to your transactional email.
_DEV = lambda: settings.environment != "production"


def _issue_tokens(db: Session, user: User) -> TokenOut:
    access = create_access_token(user.id, user.role)
    raw, hashed = new_refresh_token()
    db.add(RefreshToken(
        user_id=user.id, token_hash=hashed,
        expires_at=datetime.utcnow() + timedelta(days=settings.refresh_token_ttl_days),
    ))
    db.commit()
    return TokenOut(access_token=access, refresh_token=raw)


@router.post("/register", response_model=TokenOut, status_code=201)
def register(body: RegisterIn, db: Session = Depends(get_db)):
    if db.scalar(select(User).where(User.email == body.email)):
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with that email already exists")
    user = User(
        email=str(body.email), name=body.name or body.email.split("@")[0],
        password_hash=hash_password(body.password), role="user",
    )
    db.add(user)
    db.flush()
    # Every new account gets a 14-day trial license.
    limits = plans.PLAN_LIMITS["trial"]
    db.add(License(key=new_license_key(), user_id=user.id, type="trial",
                   status="trial", expires_at=plans.default_expiry("trial"), **limits))
    db.commit()
    db.refresh(user)
    return _issue_tokens(db, user)


@router.post("/login", response_model=TokenOut)
def login(body: LoginIn, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == body.email))
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Account is deactivated")
    return _issue_tokens(db, user)


@router.post("/refresh", response_model=TokenOut)
def refresh(body: RefreshIn, db: Session = Depends(get_db)):
    hashed = hash_refresh(body.refresh_token)
    rt = db.scalar(select(RefreshToken).where(RefreshToken.token_hash == hashed))
    if not rt or rt.revoked or rt.expires_at < datetime.utcnow():
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid refresh token")
    rt.revoked = True  # rotate
    user = db.get(User, rt.user_id)
    db.commit()
    return _issue_tokens(db, user)


@router.post("/logout")
def logout(body: RefreshIn, db: Session = Depends(get_db)):
    hashed = hash_refresh(body.refresh_token)
    rt = db.scalar(select(RefreshToken).where(RefreshToken.token_hash == hashed))
    if rt:
        rt.revoked = True
        db.commit()
    return {"ok": True}


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user


# ---- Email verification ----
class TokenBody(BaseModel):
    token: str


@router.post("/verify/request")
def request_verify(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.email_verified:
        return {"verified": True}
    user.verify_token = secrets.token_urlsafe(24)
    db.commit()
    log.info("Email verification token for %s: %s", user.email, user.verify_token)
    return {"sent": True, **({"token": user.verify_token} if _DEV() else {})}


@router.post("/verify/confirm")
def confirm_verify(body: TokenBody, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.verify_token == body.token))
    if not user:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or used token")
    user.email_verified = True
    user.verify_token = None
    db.commit()
    return {"verified": True}


# ---- Password reset ----
class ForgotBody(BaseModel):
    email: EmailStr


class ResetBody(BaseModel):
    token: str
    new_password: str = Field(min_length=8)


@router.post("/password/forgot")
def forgot_password(body: ForgotBody, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == str(body.email)))
    # Always respond 200 to avoid leaking which emails exist.
    if user:
        user.reset_token = secrets.token_urlsafe(24)
        user.reset_expires = datetime.utcnow() + timedelta(hours=1)
        db.commit()
        log.info("Password reset token for %s: %s", user.email, user.reset_token)
        return {"sent": True, **({"token": user.reset_token} if _DEV() else {})}
    return {"sent": True}


@router.post("/password/reset")
def reset_password(body: ResetBody, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.reset_token == body.token))
    if not user or not user.reset_expires or user.reset_expires < datetime.utcnow():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired token")
    user.password_hash = hash_password(body.new_password)
    user.reset_token = None
    user.reset_expires = None
    # Revoke existing refresh tokens on password change.
    for rt in db.scalars(select(RefreshToken).where(RefreshToken.user_id == user.id)):
        rt.revoked = True
    db.commit()
    return {"reset": True}
