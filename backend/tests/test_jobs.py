"""Job queue tests. We run jobs synchronously via jobs_svc.run_job so we don't
depend on the worker thread timing."""
import os
import tempfile

_tmp = tempfile.mkdtemp()
os.environ.setdefault("DATABASE_URL", f"sqlite:///{_tmp}/jobs.db")
os.environ["AI_MODE"] = "OFF"
os.environ["AI_PROVIDER"] = "off"

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services import jobs as jobs_svc


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def _auth(client, email):
    r = client.post("/api/auth/register", json={"email": email, "password": "password123", "name": "J"})
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def test_audit_all_job_runs_and_scores(client, monkeypatch):
    h = _auth(client, "jobs@example.com")
    # Two no-website leads (audit is instant, no network needed)
    client.post("/api/finder/import", json={"items": [
        {"business_name": "A", "website": "", "city": "X", "category": "roofer"},
        {"business_name": "B", "website": "", "city": "X", "category": "roofer"},
    ]}, headers=h)

    # Create the job (worker may or may not have run yet), then run synchronously.
    r = client.post("/api/jobs", json={"type": "audit_all"}, headers=h)
    assert r.status_code == 201
    job_id = r.json()["id"]

    jobs_svc.run_job(job_id)

    r = client.get(f"/api/jobs/{job_id}", headers=h)
    body = r.json()
    assert body["status"] == "done"
    assert body["total"] == 2 and body["done"] == 2

    # Leads are now audited
    leads = client.get("/api/leads", headers=h).json()["leads"]
    assert all(l["overall_score"] is not None for l in leads)


def test_job_listing_and_retry(client):
    h = _auth(client, "jobs2@example.com")
    r = client.post("/api/jobs", json={"type": "audit_all"}, headers=h)
    job_id = r.json()["id"]
    jobs_svc.run_job(job_id)
    lst = client.get("/api/jobs", headers=h).json()["jobs"]
    assert any(j["id"] == job_id for j in lst)
    r = client.post(f"/api/jobs/{job_id}/retry", headers=h)
    assert r.status_code == 201 and r.json()["id"] != job_id


def test_unknown_job_type_rejected(client):
    h = _auth(client, "jobs3@example.com")
    r = client.post("/api/jobs", json={"type": "nope"}, headers=h)
    assert r.status_code == 400
