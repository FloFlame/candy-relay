import os
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from .config import settings


class Base(DeclarativeBase):
    pass


# Ensure the sqlite directory exists for file-based DBs.
if settings.database_url.startswith("sqlite"):
    db_path = settings.database_url.split("///", 1)[-1]
    os.makedirs(os.path.dirname(db_path) or ".", exist_ok=True)

connect_args = (
    {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
)
engine = create_engine(settings.database_url, connect_args=connect_args, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create tables for V1. Alembic manages migrations from here on."""
    from . import models  # noqa: F401 — register models

    Base.metadata.create_all(bind=engine)
