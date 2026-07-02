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
from ..services import plans
from ..deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


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
