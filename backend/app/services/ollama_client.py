"""Ollama client with graceful fallback.

If the AI provider is off or Ollama is unreachable, callers fall back to
templates. This never raises — it returns None so callers degrade gracefully.
"""
from __future__ import annotations

import httpx

from ..config import settings


def is_enabled() -> bool:
    return settings.ai_provider == "ollama" and settings.ai_mode != "OFF"


def health() -> dict:
    if settings.ai_provider != "ollama":
        return {"provider": settings.ai_provider, "reachable": False, "model_present": False}
    try:
        with httpx.Client(timeout=3.0) as c:
            tags = c.get(f"{settings.ollama_base_url}/api/tags").json()
        models = [m.get("name", "") for m in tags.get("models", [])]
        present = any(settings.ollama_model.split(":")[0] in m for m in models)
        return {"provider": "ollama", "reachable": True, "model_present": present, "models": models}
    except Exception:
        return {"provider": "ollama", "reachable": False, "model_present": False}


def ensure_model() -> bool:
    """Pull the configured model if missing. Returns True if available."""
    h = health()
    if not h.get("reachable"):
        return False
    if h.get("model_present"):
        return True
    try:
        with httpx.Client(timeout=None) as c:
            c.post(f"{settings.ollama_base_url}/api/pull", json={"name": settings.ollama_model})
        return health().get("model_present", False)
    except Exception:
        return False


def generate(prompt: str, system: str | None = None) -> str | None:
    if not is_enabled():
        return None
    try:
        with httpx.Client(timeout=60.0) as c:
            r = c.post(f"{settings.ollama_base_url}/api/generate", json={
                "model": settings.ollama_model,
                "prompt": prompt,
                "system": system or "",
                "stream": False,
            })
            return (r.json().get("response") or "").strip() or None
    except Exception:
        return None
