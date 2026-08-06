from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import User, License, Device, Lead
from ..schemas import LicenseOut, LicenseCreateIn, UserOut, AdminUserPatch
from ..core.security import new_license_key
from ..services import plans
from ..deps import require_role

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_role("owner", "admin"))])


@router.get("/stats")
def stats(db: Session = Depends(get_db)):
    return {
        "users": db.scalar(select(func.count(User.id))),
        "licenses": db.scalar(select(func.count(License.id))),
        "active_licenses": db.scalar(select(func.count(License.id)).where(License.status.in_(["trial", "active"]))),
        "devices": db.scalar(select(func.count(Device.id))),
        "leads": db.scalar(select(func.count(Lead.id))),
    }


@router.get("/users", response_model=list[UserOut])
def list_users(q: str = "", db: Session = Depends(get_db)):
    stmt = select(User).order_by(User.created_at.desc())
    if q:
        stmt = stmt.where(User.email.ilike(f"%{q}%"))
    return db.scalars(stmt.limit(200)).all()


@router.patch("/users/{user_id}", response_model=UserOut)
def patch_user(user_id: str, body: AdminUserPatch, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    if body.is_active is not None:
        user.is_active = body.is_active
    if body.role in ("owner", "admin", "user"):
        user.role = body.role
    db.commit()
    db.refresh(user)
    return user


@router.get("/licenses", response_model=list[LicenseOut])
def list_licenses(db: Session = Depends(get_db)):
    return db.scalars(select(License).order_by(License.issued_at.desc()).limit(500)).all()


@router.post("/licenses", response_model=LicenseOut, status_code=201)
def create_license(body: LicenseCreateIn, db: Session = Depends(get_db)):
    if body.type not in plans.PLAN_LIMITS:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Unknown license type")
    user_id = None
    if body.user_email:
        u = db.scalar(select(User).where(User.email == str(body.user_email)))
        if not u:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "No user with that email")
        user_id = u.id
    limits = plans.PLAN_LIMITS[body.type]
    lic = License(
        key=new_license_key(), user_id=user_id, type=body.type,
        status=plans.default_status(body.type),
        expires_at=body.expires_at or plans.default_expiry(body.type), **limits,
    )
    db.add(lic)
    db.commit()
    db.refresh(lic)
    return lic


@router.post("/licenses/{license_id}/{action}", response_model=LicenseOut)
def license_action(license_id: str, action: str, db: Session = Depends(get_db)):
    lic = db.get(License, license_id)
    if not lic:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "License not found")
    mapping = {"revoke": "revoked", "suspend": "suspended", "activate": "active", "expire": "expired"}
    if action not in mapping:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Unknown action")
    lic.status = mapping[action]
    db.commit()
    db.refresh(lic)
    return lic
