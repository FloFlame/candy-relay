from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import User, License, Device
from ..schemas import LicenseOut, LicenseActivateIn, DeviceOut
from ..deps import get_current_user, active_license

router = APIRouter(prefix="/licenses", tags=["licenses"])


@router.get("/mine", response_model=LicenseOut | None)
def my_license(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return active_license(db, user)


@router.post("/activate", response_model=DeviceOut)
def activate(body: LicenseActivateIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    lic = db.scalar(select(License).where(License.key == body.key))
    if not lic:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "License key not found")
    if lic.status not in ("trial", "active"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"License is {lic.status}")
    if lic.user_id and lic.user_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "License belongs to another account")
    if not lic.user_id:
        lic.user_id = user.id

    existing = db.scalar(select(Device).where(Device.user_id == user.id, Device.device_id == body.device_id))
    if existing:
        existing.active = True
        existing.last_online = datetime.utcnow()
        existing.last_validation = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return existing

    active_devices = db.scalars(
        select(Device).where(Device.user_id == user.id, Device.active == True)  # noqa: E712
    ).all()
    if len(active_devices) >= lic.max_devices:
        raise HTTPException(status.HTTP_409_CONFLICT,
                            f"Device limit reached ({lic.max_devices}). Deactivate an old device first.")

    dev = Device(user_id=user.id, license_id=lic.id, device_id=body.device_id,
                 name=body.device_name, os=body.os)
    db.add(dev)
    db.commit()
    db.refresh(dev)
    return dev


@router.get("/devices", response_model=list[DeviceOut])
def list_devices(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.scalars(select(Device).where(Device.user_id == user.id)).all()


@router.delete("/devices/{device_id}")
def deactivate_device(device_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    dev = db.scalar(select(Device).where(Device.id == device_id, Device.user_id == user.id))
    if not dev:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Device not found")
    dev.active = False
    db.commit()
    return {"ok": True}
