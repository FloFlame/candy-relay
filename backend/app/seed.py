"""Seed demo data: an owner, a demo user with a trial license, and sample leads.

Usage:  python -m app.seed
"""
from __future__ import annotations

from sqlalchemy import select

from .db import init_db, SessionLocal
from .models import User, License, Lead
from .core.security import hash_password, new_license_key
from .services import plans


def run() -> None:
    init_db()
    with SessionLocal() as db:
        if not db.scalar(select(User).where(User.role == "owner")):
            db.add(User(email="owner@leadly.local", name="Owner", role="owner",
                        password_hash=hash_password("changeme123"), email_verified=True))

        demo = db.scalar(select(User).where(User.email == "demo@leadly.test"))
        if not demo:
            demo = User(email="demo@leadly.test", name="Demo User", role="user",
                        password_hash=hash_password("supersecret"), email_verified=True)
            db.add(demo)
            db.flush()
            db.add(License(key=new_license_key(), user_id=demo.id, type="monthly",
                           status="active", expires_at=plans.default_expiry("monthly"),
                           **plans.PLAN_LIMITS["monthly"]))
            samples = [
                ("Sunrise Dental", "", "Austin", "dentist"),
                ("Lone Star Roofing", "http://lonestarroofing-austin.com", "Austin", "dakwerker"),
                ("Blue Sky Detailing", "", "Miami", "car detailing"),
            ]
            for name, site, city, cat in samples:
                db.add(Lead(user_id=demo.id, business_name=name, website=site,
                            city=city, category=cat, source="sample", language="en"))
        db.commit()
        print("Seeded: owner@leadly.local / changeme123, demo@leadly.test / supersecret")


if __name__ == "__main__":
    run()
