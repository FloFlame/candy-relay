from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import User, UsageCounter
from ..schemas import UserOut
from ..core.security import hash_password, verify_password
from ..deps import get_current_user, active_license, _usage_today

router = APIRouter(prefix="/account", tags=["account"])


class ProfileIn(BaseModel):
    name: str | None = None


class PasswordIn(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)


@router.patch("/profile", response_model=UserOut)
def update_profile(body: ProfileIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if body.name is not None:
        user.name = body.name.strip()
    db.commit()
    db.refresh(user)
    return user


@router.post("/password")
def change_password(body: PasswordIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(body.current_password, user.password_hash):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Current password is incorrect")
    user.password_hash = hash_password(body.new_password)
    db.commit()
    return {"ok": True}


@router.get("/usage")
def usage(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    lic = active_license(db, user)
    uc = _usage_today(db, user.id)
    return {
        "plan": lic.type if lic else None,
        "status": lic.status if lic else None,
        "used": {
            "searches": uc.searches, "audits": uc.audits,
            "ai_generations": uc.ai_generations, "exports": uc.exports,
            "competitor_comparisons": uc.competitor_comparisons,
        },
        "limits": {
            "searches": lic.searches_per_day if lic else 0,
            "audits": lic.audits_per_day if lic else 0,
            "ai_generations": lic.ai_generations_per_day if lic else 0,
            "exports": lic.exports_per_day if lic else 0,
            "competitor_comparisons": lic.competitor_comparisons_per_day if lic else 0,
        } if user.role != "owner" else {"searches": "∞", "audits": "∞", "ai_generations": "∞"},
    }
