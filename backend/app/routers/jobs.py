from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import User, Job
from ..deps import get_current_user
from ..services import jobs as jobs_svc

router = APIRouter(prefix="/jobs", tags=["jobs"])

VALID_TYPES = {"audit_all", "audit_leads"}


class JobCreate(BaseModel):
    type: str = "audit_all"
    lead_ids: list[str] | None = None


def _job_dict(j: Job) -> dict:
    return {
        "id": j.id, "type": j.type, "status": j.status, "total": j.total, "done": j.done,
        "step": j.step, "error": j.error, "result": j.result,
        "created_at": j.created_at.isoformat(), "updated_at": j.updated_at.isoformat(),
    }


@router.post("", status_code=201)
def create_job(body: JobCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if body.type not in VALID_TYPES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Unknown job type")
    payload = {"lead_ids": body.lead_ids} if body.lead_ids else {}
    job = Job(user_id=user.id, type=body.type, payload=payload, status="queued")
    db.add(job)
    db.commit()
    db.refresh(job)
    jobs_svc.enqueue(job.id)
    return _job_dict(job)


@router.get("")
def list_jobs(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.scalars(select(Job).where(Job.user_id == user.id).order_by(Job.created_at.desc()).limit(50)).all()
    return {"jobs": [_job_dict(j) for j in rows]}


@router.get("/{job_id}")
def get_job(job_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    job = db.scalar(select(Job).where(Job.id == job_id, Job.user_id == user.id))
    if not job:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Job not found")
    return _job_dict(job)


@router.post("/{job_id}/cancel")
def cancel_job(job_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    job = db.scalar(select(Job).where(Job.id == job_id, Job.user_id == user.id))
    if not job:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Job not found")
    if job.status in ("queued", "running"):
        job.cancel_requested = True
        if job.status == "queued":
            job.status = "cancelled"
        db.commit()
    return _job_dict(job)


@router.post("/{job_id}/retry", status_code=201)
def retry_job(job_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    old = db.scalar(select(Job).where(Job.id == job_id, Job.user_id == user.id))
    if not old:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Job not found")
    job = Job(user_id=user.id, type=old.type, payload=old.payload, status="queued")
    db.add(job)
    db.commit()
    db.refresh(job)
    jobs_svc.enqueue(job.id)
    return _job_dict(job)
