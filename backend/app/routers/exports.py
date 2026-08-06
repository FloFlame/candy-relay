from __future__ import annotations

import csv
import io

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import User, License, Lead
from ..deps import get_current_user, require_license, enforce_and_count

router = APIRouter(prefix="/exports", tags=["exports"])

COLUMNS = ["business_name", "city", "country", "category", "website", "phone", "email",
           "google_rating", "review_count", "status", "overall_score", "priority",
           "language", "last_audited_at"]


@router.get("/leads.csv")
def export_leads(
    user: User = Depends(get_current_user),
    lic: License = Depends(require_license),
    db: Session = Depends(get_db),
    status_filter: str | None = Query(None, alias="status"),
    priority: str | None = None,
):
    enforce_and_count(db, user, lic, "exports", "exports_per_day")
    stmt = select(Lead).where(Lead.user_id == user.id)
    if status_filter:
        stmt = stmt.where(Lead.status == status_filter)
    if priority:
        stmt = stmt.where(Lead.priority == priority)
    stmt = stmt.order_by(Lead.overall_score.asc().nulls_last())

    def rows():
        buf = io.StringIO()
        writer = csv.writer(buf)
        writer.writerow(COLUMNS)
        yield buf.getvalue()
        buf.seek(0); buf.truncate(0)
        # Stream in batches to stay memory-safe on large datasets.
        for lead in db.scalars(stmt).yield_per(200):
            writer.writerow([
                lead.business_name, lead.city, lead.country, lead.category, lead.website,
                lead.phone, lead.email, lead.google_rating, lead.review_count, lead.status,
                lead.overall_score, lead.priority, lead.language,
                lead.last_audited_at.isoformat() if lead.last_audited_at else "",
            ])
            yield buf.getvalue()
            buf.seek(0); buf.truncate(0)

    filename = f"leadly-{status_filter or 'all'}.csv"
    return StreamingResponse(rows(), media_type="text/csv",
                             headers={"content-disposition": f'attachment; filename="{filename}"'})
