from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import User, License, Lead
from ..schemas import FinderIn, LeadImportIn, LeadOut
from ..deps import get_current_user, require_license, enforce_and_count
from ..services import finder as finder_svc
from ..services import dedup
from ..core.security import domain_of

router = APIRouter(prefix="/finder", tags=["finder"])


@router.post("/search")
def search(body: FinderIn, user: User = Depends(get_current_user),
           lic: License = Depends(require_license), db: Session = Depends(get_db)):
    enforce_and_count(db, user, lic, "searches", "searches_per_day")
    result = finder_svc.find_businesses(body.niche, body.city, body.limit)

    # Deduplicate against the user's existing leads.
    existing_keys = {dedup.key_for(*row) for row in db.execute(
        select(Lead.business_name, Lead.domain, Lead.phone, Lead.city).where(Lead.user_id == user.id)
    ).all()}
    deduped = dedup.dedupe(result["results"], existing_keys)
    return {"source": result["source"], "count": len(deduped), "results": deduped}


@router.post("/import", response_model=list[LeadOut], status_code=201)
def import_leads(body: LeadImportIn, user: User = Depends(get_current_user),
                 lic: License = Depends(require_license), db: Session = Depends(get_db)):
    existing_keys = {dedup.key_for(*row) for row in db.execute(
        select(Lead.business_name, Lead.domain, Lead.phone, Lead.city).where(Lead.user_id == user.id)
    ).all()}
    deduped = dedup.dedupe(body.items, existing_keys)
    created: list[Lead] = []
    for it in deduped:
        site = it.get("website", "")
        lead = Lead(
            user_id=user.id,
            business_name=it.get("business_name", "") or it.get("businessName", ""),
            website=site, domain=it.get("domain") or domain_of(site),
            phone=it.get("phone", ""), email=it.get("email", ""),
            address=it.get("address", ""), city=it.get("city", ""), country=it.get("country", ""),
            lat=it.get("lat"), lng=it.get("lng"),
            category=it.get("category", ""), google_rating=it.get("google_rating"),
            review_count=it.get("review_count"), source_query=it.get("source_query", ""),
            maps_url=it.get("maps_url", ""), source=it.get("source", "manual"),
            language=it.get("language", "en"),
        )
        if lead.business_name:
            db.add(lead)
            created.append(lead)
    db.commit()
    for c in created:
        db.refresh(c)
    return created
