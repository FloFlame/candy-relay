"""Lightweight background job queue (V1).

A single daemon worker thread processes jobs one at a time so SQLite stays
happy. Each handler updates progress on the Job row. Job execution is exposed
as `run_job` so tests can run a job synchronously without the worker thread.
Future: swap the queue for Celery/RQ + Redis without changing the API surface.
"""
from __future__ import annotations

import logging
import queue
import threading
from concurrent.futures import ThreadPoolExecutor

from ..db import SessionLocal
from ..models import Job, Lead
from ..config import settings
from . import audit as audit_svc
from . import scoring

log = logging.getLogger("leadly.jobs")

_q: "queue.Queue[str]" = queue.Queue()
_worker_started = False


def enqueue(job_id: str) -> None:
    _q.put(job_id)


def start_worker() -> None:
    global _worker_started
    if _worker_started:
        return
    _worker_started = True
    t = threading.Thread(target=_worker_loop, name="leadly-jobs", daemon=True)
    t.start()
    log.info("Job worker started")


def _worker_loop() -> None:
    while True:
        job_id = _q.get()
        try:
            run_job(job_id)
        except Exception:  # noqa: BLE001
            log.exception("Job %s crashed", job_id)
        finally:
            _q.task_done()


# ---- Handlers ----
def run_job(job_id: str) -> None:
    """Process a job to completion. Safe to call synchronously (tests) or from
    the worker thread. Uses its own DB session."""
    db = SessionLocal()
    try:
        job = db.get(Job, job_id)
        if not job or job.status in ("done", "failed", "cancelled"):
            return
        job.status = "running"
        db.commit()
        handler = _HANDLERS.get(job.type)
        if not handler:
            job.status = "failed"
            job.error = f"Unknown job type: {job.type}"
            db.commit()
            return
        handler(db, job)
        if job.status == "running":
            job.status = "done"
        db.commit()
    except Exception as exc:  # noqa: BLE001
        db.rollback()
        job = db.get(Job, job_id)
        if job:
            job.status = "failed"
            job.error = f"{type(exc).__name__}: {exc}"
            db.commit()
        log.exception("Job %s failed", job_id)
    finally:
        db.close()


def _audit_leads(db, job: Job) -> None:
    """Audit a set of leads with bounded concurrency and per-progress updates."""
    lead_ids = job.payload.get("lead_ids")
    if lead_ids is None:
        lead_ids = [l.id for l in db.query(Lead).filter(
            Lead.user_id == job.user_id, Lead.overall_score.is_(None)).all()]
    job.total = len(lead_ids)
    job.done = 0
    db.commit()

    # Fetch websites up front (main-thread DB reads).
    leads = {l.id: l for l in db.query(Lead).filter(Lead.id.in_(lead_ids)).all()} if lead_ids else {}
    weights = None
    from ..models import User
    user = db.get(User, job.user_id)
    if user and user.score_weights:
        weights = user.score_weights

    def do_audit(lid: str):
        lead = leads.get(lid)
        if not lead:
            return lid, None
        return lid, audit_svc.audit_website(lead.website)

    workers = max(1, min(settings.per_domain_concurrency * 2, 6))
    with ThreadPoolExecutor(max_workers=workers) as pool:
        for lid, result in pool.map(do_audit, lead_ids):
            db.refresh(job)
            if job.cancel_requested:
                job.status = "cancelled"
                db.commit()
                return
            if result is not None:
                from ..models import Audit
                if weights:
                    result["overall_score"] = scoring.compute_overall(result["category_scores"], weights)
                    result["priority"] = scoring.priority_band(result["overall_score"])
                db.add(Audit(lead_id=lid, **{k: result[k] for k in (
                    "reachable", "final_url", "status_code", "response_ms", "html_hash",
                    "overall_score", "priority", "category_scores", "findings", "meta")}))
                lead = leads[lid]
                lead.overall_score = result["overall_score"]
                lead.priority = result["priority"]
                if lead.status == "new":
                    lead.status = "audited"
            job.done += 1
            job.step = f"Audited {job.done}/{job.total}"
            db.commit()
    job.result = {"audited": job.done}


_HANDLERS = {
    "audit_all": _audit_leads,
    "audit_leads": _audit_leads,
}
