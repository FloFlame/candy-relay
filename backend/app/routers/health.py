from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from ..db import get_db
from ..config import settings
from ..services import ollama_client

router = APIRouter(tags=["health"])


@router.get("/health")
def health(db: Session = Depends(get_db)):
    checks = {}
    try:
        db.execute(text("SELECT 1"))
        checks["database"] = "ok"
    except Exception as e:  # noqa: BLE001
        checks["database"] = f"error: {type(e).__name__}"

    ai = ollama_client.health()
    checks["ollama"] = "ok" if ai.get("reachable") else "unreachable"
    checks["serpapi"] = "configured" if settings.serpapi_key else "fallback (openstreetmap/sample)"

    healthy = checks["database"] == "ok"
    return {
        "status": "healthy" if healthy else "degraded",
        "checks": checks,
        "ai": ai,
        "ai_mode": settings.ai_mode,
        "version": "1.0.0",
    }
