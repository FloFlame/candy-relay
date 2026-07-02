from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import User, License, Lead, Audit, Outreach
from ..schemas import LeadOut, LeadPatchIn, OutreachIn
from ..deps import get_current_user, require_license, enforce_and_count
from ..services import audit as audit_svc
from ..services import finder as finder_svc
from ..services import outreach as outreach_svc
from ..services import scoring

router = APIRouter(prefix="/leads", tags=["leads"])

VALID_STATUS = {"new", "audited", "contacted", "replied", "won", "lost", "ignored"}


@router.get("", response_model=dict)
def list_leads(
    user: User = Depends(get_current_user), db: Session = Depends(get_db),
    status_filter: str | None = Query(None, alias="status"),
    q: str | None = None,
    sort: str = "score",
    page: int = 1, page_size: int = 50,
):
    stmt = select(Lead).where(Lead.user_id == user.id)
    if status_filter:
        stmt = stmt.where(Lead.status == status_filter)
    if q:
        stmt = stmt.where(Lead.business_name.ilike(f"%{q}%"))
    total = db.scalar(select(func.count()).select_from(stmt.subquery()))
    order = {
        "score": Lead.overall_score.asc().nulls_last(),
        "name": Lead.business_name.asc(),
        "recent": Lead.created_at.desc(),
    }.get(sort, Lead.overall_score.asc().nulls_last())
    rows = db.scalars(stmt.order_by(order).offset((page - 1) * page_size).limit(page_size)).all()
    return {
        "total": total, "page": page, "page_size": page_size,
        "leads": [LeadOut.model_validate(r).model_dump() for r in rows],
    }


def _get_lead(db: Session, user: User, lead_id: str) -> Lead:
    lead = db.scalar(select(Lead).where(Lead.id == lead_id, Lead.user_id == user.id))
    if not lead:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Lead not found")
    return lead


@router.get("/{lead_id}")
def get_lead(lead_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    lead = _get_lead(db, user, lead_id)
    latest_audit = db.scalar(
        select(Audit).where(Audit.lead_id == lead.id).order_by(Audit.created_at.desc())
    )
    outreach = db.scalars(
        select(Outreach).where(Outreach.lead_id == lead.id).order_by(Outreach.created_at.desc())
    ).all()
    return {
        "lead": LeadOut.model_validate(lead).model_dump(),
        "audit": _audit_dict(latest_audit) if latest_audit else None,
        "outreach": [_outreach_dict(o) for o in outreach],
    }


@router.patch("/{lead_id}", response_model=LeadOut)
def patch_lead(lead_id: str, body: LeadPatchIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    lead = _get_lead(db, user, lead_id)
    if body.status is not None:
        if body.status not in VALID_STATUS:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid status")
        lead.status = body.status
    if body.notes is not None:
        lead.notes = body.notes
    if body.language is not None:
        lead.language = body.language
    if body.email is not None:
        lead.email = body.email
    db.commit()
    db.refresh(lead)
    return lead


@router.delete("/{lead_id}")
def delete_lead(lead_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    lead = _get_lead(db, user, lead_id)
    db.delete(lead)
    db.commit()
    return {"ok": True}


@router.post("/{lead_id}/audit")
def run_audit(lead_id: str, user: User = Depends(get_current_user),
              lic: License = Depends(require_license), db: Session = Depends(get_db)):
    lead = _get_lead(db, user, lead_id)
    enforce_and_count(db, user, lic, "audits", "audits_per_day")
    result = audit_svc.audit_website(lead.website)
    audit = Audit(lead_id=lead.id, **{k: result[k] for k in (
        "reachable", "final_url", "status_code", "response_ms", "html_hash",
        "overall_score", "priority", "category_scores", "findings", "meta")})
    db.add(audit)
    lead.overall_score = result["overall_score"]
    lead.priority = result["priority"]
    lead.last_audited_at = datetime.utcnow()
    if lead.status == "new":
        lead.status = "audited"
    db.commit()
    db.refresh(audit)
    return {"lead": LeadOut.model_validate(lead).model_dump(), "audit": _audit_dict(audit)}


@router.post("/{lead_id}/outreach")
def gen_outreach(lead_id: str, body: OutreachIn, user: User = Depends(get_current_user),
                 lic: License = Depends(require_license), db: Session = Depends(get_db)):
    lead = _get_lead(db, user, lead_id)
    enforce_and_count(db, user, lic, "ai_generations", "ai_generations_per_day")
    latest = db.scalar(select(Audit).where(Audit.lead_id == lead.id).order_by(Audit.created_at.desc()))
    if not latest:
        result = audit_svc.audit_website(lead.website)
        latest = Audit(lead_id=lead.id, **{k: result[k] for k in (
            "reachable", "final_url", "status_code", "response_ms", "html_hash",
            "overall_score", "priority", "category_scores", "findings", "meta")})
        db.add(latest)
        lead.overall_score = result["overall_score"]
        lead.priority = result["priority"]
        db.commit()
        db.refresh(latest)
    variants = outreach_svc.VARIANTS if body.variant == "all" else [body.variant]
    lang = body.language or lead.language or "en"
    out = []
    for v in variants:
        gen = outreach_svc.generate_variant(
            {"business_name": lead.business_name, "category": lead.category},
            latest.findings, v, lang, body.sender,
        )
        rec = Outreach(lead_id=lead.id, **gen)
        db.add(rec)
        out.append(gen)
    db.commit()
    return {"outreach": out}


@router.post("/{lead_id}/competitors")
def competitors(lead_id: str, user: User = Depends(get_current_user),
                lic: License = Depends(require_license), db: Session = Depends(get_db)):
    lead = _get_lead(db, user, lead_id)
    if not lead.category or not lead.city:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Lead needs a category and city to compare")
    enforce_and_count(db, user, lic, "competitor_comparisons", "competitor_comparisons_per_day")
    found = finder_svc.find_businesses(lead.category, lead.city, 12)["results"]
    peers = [b for b in found if b.get("website") and b.get("business_name") != lead.business_name][:4]
    results = []
    for c in peers:
        a = audit_svc.audit_website(c["website"])
        results.append({"business_name": c["business_name"], "website": c["website"],
                        "health": a["overall_score"], "priority": a["priority"]})
    healths = [r["health"] for r in results]
    avg = round(sum(healths) / len(healths)) if healths else None
    self_health = lead.overall_score
    results.sort(key=lambda r: r["health"], reverse=True)
    return {
        "self": {"business_name": lead.business_name, "health": self_health},
        "competitors": results, "market_average_health": avg,
        "beats_market": (self_health >= avg) if (self_health is not None and avg is not None) else None,
    }


def _audit_dict(a: Audit) -> dict:
    return {
        "id": a.id, "reachable": a.reachable, "final_url": a.final_url,
        "status_code": a.status_code, "response_ms": a.response_ms,
        "overall_score": a.overall_score, "opportunity_score": scoring.opportunity_score(a.overall_score),
        "priority": a.priority, "category_scores": a.category_scores,
        "findings": a.findings, "meta": a.meta, "created_at": a.created_at.isoformat(),
    }


def _outreach_dict(o: Outreach) -> dict:
    return {"id": o.id, "variant": o.variant, "language": o.language, "subject": o.subject,
            "body": o.body, "generated_by": o.generated_by, "created_at": o.created_at.isoformat()}
