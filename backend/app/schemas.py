from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


# ---- Auth ----
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    name: str = ""


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshIn(BaseModel):
    refresh_token: str


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    role: str
    is_active: bool
    email_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ---- Licensing ----
class LicenseOut(BaseModel):
    id: str
    key: str
    type: str
    status: str
    searches_per_day: int
    audits_per_day: int
    ai_generations_per_day: int
    max_devices: int
    review_collection: bool
    api_integrations: bool
    issued_at: datetime
    expires_at: datetime | None

    class Config:
        from_attributes = True


class LicenseCreateIn(BaseModel):
    type: str = "trial"
    user_email: EmailStr | None = None
    expires_at: datetime | None = None


class LicenseActivateIn(BaseModel):
    key: str
    device_id: str
    device_name: str = ""
    os: str = ""


class DeviceOut(BaseModel):
    id: str
    device_id: str
    name: str
    os: str
    active: bool
    activated_at: datetime
    last_online: datetime

    class Config:
        from_attributes = True


# ---- Finder / Leads ----
class FinderIn(BaseModel):
    niche: str
    city: str
    country: str = ""
    language: str = "en"
    limit: int = 20


class LeadImportIn(BaseModel):
    items: list[dict]


class LeadOut(BaseModel):
    id: str
    business_name: str
    website: str
    domain: str
    phone: str
    email: str
    address: str
    city: str
    country: str
    category: str
    google_rating: float | None
    review_count: int | None
    status: str
    overall_score: int | None
    priority: str | None
    language: str
    notes: str
    last_audited_at: datetime | None
    created_at: datetime

    class Config:
        from_attributes = True


class LeadPatchIn(BaseModel):
    status: str | None = None
    notes: str | None = None
    language: str | None = None
    email: str | None = None


class OutreachIn(BaseModel):
    variant: str = "soft_email"
    language: str | None = None
    sender: str = "Your name"


# ---- Admin ----
class AdminUserPatch(BaseModel):
    is_active: bool | None = None
    role: str | None = None
