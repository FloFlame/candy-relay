from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from .config import settings
from .db import init_db, SessionLocal
from .models import User
from .core.security import hash_password
from .services import ollama_client
from .routers import auth, account, admin, licenses, finder, leads, exports, health

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s | %(message)s")
log = logging.getLogger("leadly")


def bootstrap_owner() -> None:
    with SessionLocal() as db:
        exists = db.scalar(select(User).where(User.role == "owner"))
        if exists:
            return
        owner = User(
            email=settings.owner_email, name="Owner", role="owner",
            password_hash=hash_password(settings.owner_password),
            is_active=True, email_verified=True,
        )
        db.add(owner)
        db.commit()
        log.info("Created bootstrap owner account: %s", settings.owner_email)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    bootstrap_owner()
    if ollama_client.is_enabled():
        h = ollama_client.health()
        if h.get("reachable"):
            log.info("Ollama reachable; ensuring model %s", settings.ollama_model)
            ollama_client.ensure_model()
        else:
            log.warning("Ollama not reachable — outreach will use templates")
    yield


app = FastAPI(title=settings.app_name, version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API = "/api"
for r in (health.router, auth.router, account.router, admin.router,
          licenses.router, finder.router, leads.router, exports.router):
    app.include_router(r, prefix=API)


@app.get("/")
def root():
    return {"name": settings.app_name, "docs": "/docs", "health": "/api/health"}
