from __future__ import annotations

import uuid
from datetime import datetime, date

from sqlalchemy import (
    String, Integer, Float, Boolean, DateTime, Date, ForeignKey, JSON, Text, UniqueConstraint, Index
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


def _uuid(prefix: str):
    return lambda: f"{prefix}_{uuid.uuid4().hex[:18]}"


def utcnow() -> datetime:
    return datetime.utcnow()


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid("usr"))
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    name: Mapped[str] = mapped_column(String, default="")
    password_hash: Mapped[str] = mapped_column(String)
    role: Mapped[str] = mapped_column(String, default="user")  # owner | admin | user
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    # Optional per-user category weight overrides for scoring (JSON: {category: weight}).
    score_weights: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    # Single-use tokens for email verification and password reset.
    verify_token: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    reset_token: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    reset_expires: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    licenses: Mapped[list[License]] = relationship(back_populates="user", cascade="all, delete-orphan")
    devices: Mapped[list[Device]] = relationship(back_populates="user", cascade="all, delete-orphan")
    leads: Mapped[list[Lead]] = relationship(back_populates="user", cascade="all, delete-orphan")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid("rft"))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    token_hash: Mapped[str] = mapped_column(String, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime)
    revoked: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class License(Base):
    __tablename__ = "licenses"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid("lic"))
    key: Mapped[str] = mapped_column(String, unique=True, index=True)
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    type: Mapped[str] = mapped_column(String, default="trial")  # trial|monthly|annual|lifetime|enterprise
    status: Mapped[str] = mapped_column(String, default="trial")  # trial|active|expired|suspended|revoked|invalid
    # plan limits
    searches_per_day: Mapped[int] = mapped_column(Integer, default=10)
    audits_per_day: Mapped[int] = mapped_column(Integer, default=25)
    ai_generations_per_day: Mapped[int] = mapped_column(Integer, default=25)
    screenshots_per_day: Mapped[int] = mapped_column(Integer, default=25)
    exports_per_day: Mapped[int] = mapped_column(Integer, default=10)
    competitor_comparisons_per_day: Mapped[int] = mapped_column(Integer, default=10)
    max_devices: Mapped[int] = mapped_column(Integer, default=1)
    max_languages: Mapped[int] = mapped_column(Integer, default=3)
    review_collection: Mapped[bool] = mapped_column(Boolean, default=False)
    api_integrations: Mapped[bool] = mapped_column(Boolean, default=False)
    issued_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    user: Mapped[User | None] = relationship(back_populates="licenses")
    devices: Mapped[list[Device]] = relationship(back_populates="license", cascade="all, delete-orphan")


class Device(Base):
    __tablename__ = "devices"
    __table_args__ = (UniqueConstraint("user_id", "device_id", name="uq_user_device"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid("dev"))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    license_id: Mapped[str | None] = mapped_column(ForeignKey("licenses.id", ondelete="SET NULL"), nullable=True)
    device_id: Mapped[str] = mapped_column(String, index=True)
    name: Mapped[str] = mapped_column(String, default="")
    os: Mapped[str] = mapped_column(String, default="")
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    activated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    last_online: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    last_validation: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    user: Mapped[User] = relationship(back_populates="devices")
    license: Mapped[License | None] = relationship(back_populates="devices")


class Lead(Base):
    __tablename__ = "leads"
    __table_args__ = (
        Index("ix_leads_user_status", "user_id", "status"),
        Index("ix_leads_user_score", "user_id", "overall_score"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid("lead"))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    business_name: Mapped[str] = mapped_column(String, index=True)
    website: Mapped[str] = mapped_column(String, default="")
    domain: Mapped[str] = mapped_column(String, default="", index=True)
    phone: Mapped[str] = mapped_column(String, default="")
    email: Mapped[str] = mapped_column(String, default="")
    address: Mapped[str] = mapped_column(String, default="")
    city: Mapped[str] = mapped_column(String, default="", index=True)
    country: Mapped[str] = mapped_column(String, default="")
    lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    lng: Mapped[float | None] = mapped_column(Float, nullable=True)
    category: Mapped[str] = mapped_column(String, default="")
    google_rating: Mapped[float | None] = mapped_column(Float, nullable=True)
    review_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    source_query: Mapped[str] = mapped_column(String, default="")
    maps_url: Mapped[str] = mapped_column(String, default="")
    source: Mapped[str] = mapped_column(String, default="manual")

    status: Mapped[str] = mapped_column(String, default="new", index=True)  # new|audited|contacted|replied|won|lost|ignored
    overall_score: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    priority: Mapped[str | None] = mapped_column(String, nullable=True)  # high|medium|low
    language: Mapped[str] = mapped_column(String, default="en")
    notes: Mapped[str] = mapped_column(Text, default="")
    last_audited_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)

    user: Mapped[User] = relationship(back_populates="leads")
    audits: Mapped[list[Audit]] = relationship(back_populates="lead", cascade="all, delete-orphan")
    outreach: Mapped[list[Outreach]] = relationship(back_populates="lead", cascade="all, delete-orphan")


class Audit(Base):
    __tablename__ = "audits"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid("aud"))
    lead_id: Mapped[str] = mapped_column(ForeignKey("leads.id", ondelete="CASCADE"), index=True)
    reachable: Mapped[bool] = mapped_column(Boolean, default=False)
    final_url: Mapped[str] = mapped_column(String, default="")
    status_code: Mapped[int | None] = mapped_column(Integer, nullable=True)
    response_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    html_hash: Mapped[str] = mapped_column(String, default="")
    overall_score: Mapped[int] = mapped_column(Integer, default=0)
    priority: Mapped[str] = mapped_column(String, default="high")
    category_scores: Mapped[dict] = mapped_column(JSON, default=dict)
    findings: Mapped[list] = mapped_column(JSON, default=list)  # [{category,issue,weight,severity,reason,fix}]
    meta: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    lead: Mapped[Lead] = relationship(back_populates="audits")


class Outreach(Base):
    __tablename__ = "outreach"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid("out"))
    lead_id: Mapped[str] = mapped_column(ForeignKey("leads.id", ondelete="CASCADE"), index=True)
    variant: Mapped[str] = mapped_column(String, default="soft_email")
    language: Mapped[str] = mapped_column(String, default="en")
    subject: Mapped[str] = mapped_column(String, default="")
    body: Mapped[str] = mapped_column(Text, default="")
    generated_by: Mapped[str] = mapped_column(String, default="template")  # template | ollama | anthropic
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    lead: Mapped[Lead] = relationship(back_populates="outreach")


class Job(Base):
    __tablename__ = "jobs"
    __table_args__ = (Index("ix_jobs_user_status", "user_id", "status"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid("job"))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    type: Mapped[str] = mapped_column(String)  # audit_all | audit_leads | ...
    status: Mapped[str] = mapped_column(String, default="queued")  # queued|running|done|failed|cancelled
    total: Mapped[int] = mapped_column(Integer, default=0)
    done: Mapped[int] = mapped_column(Integer, default=0)
    step: Mapped[str] = mapped_column(String, default="")
    error: Mapped[str] = mapped_column(Text, default="")
    payload: Mapped[dict] = mapped_column(JSON, default=dict)
    result: Mapped[dict] = mapped_column(JSON, default=dict)
    cancel_requested: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)


class UsageCounter(Base):
    __tablename__ = "usage_counters"
    __table_args__ = (UniqueConstraint("user_id", "day", name="uq_usage_day"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid("use"))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    day: Mapped[date] = mapped_column(Date, default=date.today)
    searches: Mapped[int] = mapped_column(Integer, default=0)
    audits: Mapped[int] = mapped_column(Integer, default=0)
    ai_generations: Mapped[int] = mapped_column(Integer, default=0)
    screenshots: Mapped[int] = mapped_column(Integer, default=0)
    exports: Mapped[int] = mapped_column(Integer, default=0)
    competitor_comparisons: Mapped[int] = mapped_column(Integer, default=0)
