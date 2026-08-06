from __future__ import annotations

from datetime import date

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.orm import Session

from .db import get_db
from .core.security import decode_token
from .models import User, License, UsageCounter

bearer = HTTPBearer(auto_error=False)


def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    if not creds:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")
    payload = decode_token(creds.credentials)
    if not payload or payload.get("type") != "access":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")
    user = db.get(User, payload["sub"])
    if not user or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found or inactive")
    return user


def require_role(*roles: str):
    def checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Insufficient permissions")
        return user
    return checker


def active_license(db: Session, user: User) -> License | None:
    lic = db.scalars(
        select(License).where(License.user_id == user.id).order_by(License.issued_at.desc())
    ).first()
    return lic


def require_license(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> License:
    """Every account needs a usable license. Owners bypass the check."""
    if user.role == "owner":
        # Synthesise an unlimited license object for the owner.
        return License(id="owner", key="OWNER", type="enterprise", status="active",
                       searches_per_day=10**9, audits_per_day=10**9,
                       ai_generations_per_day=10**9, max_devices=10**9,
                       review_collection=True, api_integrations=True)
    lic = active_license(db, user)
    if not lic:
        raise HTTPException(status.HTTP_402_PAYMENT_REQUIRED, "No license on this account")
    if lic.status not in ("trial", "active"):
        raise HTTPException(status.HTTP_402_PAYMENT_REQUIRED, f"License is {lic.status}")
    return lic


def _usage_today(db: Session, user_id: str) -> UsageCounter:
    uc = db.scalar(
        select(UsageCounter).where(UsageCounter.user_id == user_id, UsageCounter.day == date.today())
    )
    if not uc:
        uc = UsageCounter(user_id=user_id, day=date.today())
        db.add(uc)
        db.commit()
        db.refresh(uc)
    return uc


def enforce_and_count(db: Session, user: User, lic: License, field: str, limit_field: str, amount: int = 1):
    """Check a daily plan limit and increment usage. Owners are unlimited."""
    if user.role == "owner":
        return
    uc = _usage_today(db, user.id)
    used = getattr(uc, field)
    limit = getattr(lic, limit_field)
    if used + amount > limit:
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS,
                            f"Daily limit reached for {field} ({limit}/day on your plan)")
    setattr(uc, field, used + amount)
    db.commit()
