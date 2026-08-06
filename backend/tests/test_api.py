"""In-process API integration tests via FastAPI TestClient.

Runs the whole app without binding a port, so it's reliable in sandboxes that
kill backgrounded servers. Covers auth, licensing, finder+dedup, audit,
suggestions, outreach, weights, verification and password reset.
"""
import os
import tempfile

# Configure a throwaway DB and disable AI before importing the app.
_tmp = tempfile.mkdtemp()
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp}/test.db"
os.environ["AI_MODE"] = "OFF"
os.environ["AI_PROVIDER"] = "off"
os.environ["ENVIRONMENT"] = "development"

import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def auth_headers(client, email="user@example.com"):
    r = client.post("/api/auth/register", json={"email": email, "password": "password123", "name": "U"})
    assert r.status_code == 201, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["checks"]["database"] == "ok"


def test_register_login_refresh(client):
    r = client.post("/api/auth/register", json={"email": "a@example.com", "password": "password123", "name": "A"})
    assert r.status_code == 201
    tokens = r.json()
    assert tokens["access_token"] and tokens["refresh_token"]

    r = client.post("/api/auth/login", json={"email": "a@example.com", "password": "password123"})
    assert r.status_code == 200

    r = client.post("/api/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert r.status_code == 200 and r.json()["access_token"]


def test_trial_license_auto_issued(client):
    h = auth_headers(client, "lic@example.com")
    r = client.get("/api/licenses/mine", headers=h)
    assert r.status_code == 200
    assert r.json()["type"] == "trial"


def test_finder_dedup_and_import(client):
    h = auth_headers(client, "finder@example.com")
    r = client.post("/api/finder/search", json={"niche": "dentist", "city": "Austin", "limit": 5}, headers=h)
    assert r.status_code == 200
    results = r.json()["results"]
    assert len(results) > 0
    # import with a duplicate -> deduped
    items = results[:3] + [results[0]]
    r = client.post("/api/finder/import", json={"items": items}, headers=h)
    assert r.status_code == 201
    assert len(r.json()) == 3


def test_audit_and_suggestions(client):
    h = auth_headers(client, "audit@example.com")
    r = client.post("/api/finder/import", json={"items": [
        {"business_name": "Acme", "website": "", "city": "Austin", "category": "roofer"}
    ]}, headers=h)
    lead_id = r.json()[0]["id"]

    r = client.post(f"/api/leads/{lead_id}/audit", headers=h)
    assert r.status_code == 200
    audit = r.json()["audit"]
    assert set(audit["category_scores"]) and "conversion" in audit["category_scores"]
    assert audit["priority"] in ("high", "medium", "low")

    r = client.post(f"/api/leads/{lead_id}/suggestions", headers=h)
    assert r.status_code == 200
    s = r.json()["suggestions"]
    assert s["priority_fixes"] and s["headline_ideas"]


def test_outreach_variants_multilingual(client):
    h = auth_headers(client, "out@example.com")
    r = client.post("/api/finder/import", json={"items": [
        {"business_name": "Dakwerker BV", "website": "", "city": "Turnhout", "category": "dakwerker"}
    ]}, headers=h)
    lead_id = r.json()[0]["id"]
    r = client.post(f"/api/leads/{lead_id}/outreach", json={"variant": "all", "language": "nl"}, headers=h)
    assert r.status_code == 200
    variants = [o["variant"] for o in r.json()["outreach"]]
    assert set(variants) == {"soft_email", "direct_email", "whatsapp", "linkedin", "follow_up_1", "follow_up_2"}
    # Dutch CTA present in an email variant
    bodies = " ".join(o["body"] for o in r.json()["outreach"])
    assert "doorsturen" in bodies


def test_custom_weights(client):
    h = auth_headers(client, "weights@example.com")
    r = client.get("/api/account/weights", headers=h)
    assert r.status_code == 200 and r.json()["custom"] is False
    r = client.put("/api/account/weights", json={"weights": {"seo": 0.5, "conversion": 0.5}}, headers=h)
    assert r.status_code == 200
    r = client.get("/api/account/weights", headers=h)
    assert r.json()["custom"] is True


def test_email_verification(client):
    h = auth_headers(client, "verify@example.com")
    r = client.post("/api/auth/verify/request", headers=h)
    token = r.json()["token"]
    r = client.post("/api/auth/verify/confirm", json={"token": token})
    assert r.status_code == 200 and r.json()["verified"] is True


def test_password_reset(client):
    client.post("/api/auth/register", json={"email": "reset@example.com", "password": "password123", "name": "R"})
    r = client.post("/api/auth/password/forgot", json={"email": "reset@example.com"})
    token = r.json()["token"]
    r = client.post("/api/auth/password/reset", json={"token": token, "new_password": "brandnew123"})
    assert r.status_code == 200
    r = client.post("/api/auth/login", json={"email": "reset@example.com", "password": "brandnew123"})
    assert r.status_code == 200


def test_auth_guards(client):
    assert client.get("/api/leads").status_code == 401
    h = auth_headers(client, "guard@example.com")
    assert client.get("/api/admin/stats", headers=h).status_code == 403


def test_admin_flow(client):
    # Promote via a fresh owner is complex; instead verify a user is forbidden
    # and that license creation requires admin. Owner path is covered by bootstrap.
    h = auth_headers(client, "adm@example.com")
    assert client.post("/api/admin/licenses", json={"type": "monthly"}, headers=h).status_code == 403
