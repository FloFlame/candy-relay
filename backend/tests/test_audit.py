from app.services import audit as audit_svc
from app.core import security
from app.services import dedup


def test_unreachable_is_high_opportunity():
    result = audit_svc._unreachable("", "No website on file")
    assert result["reachable"] is False
    assert result["overall_score"] <= 10
    assert result["priority"] == "high"
    assert result["findings"]


def test_ssrf_blocks_localhost():
    ok, _ = security.is_safe_url("http://localhost:8000")
    assert ok is False
    ok, _ = security.is_safe_url("http://127.0.0.1")
    assert ok is False


def test_ssrf_blocks_private_range():
    ok, _ = security.is_safe_url("http://192.168.1.1")
    assert ok is False


def test_ssrf_rejects_non_http_scheme():
    ok, _ = security.is_safe_url("ftp://example.com")
    assert ok is False


def test_normalize_url_adds_scheme():
    assert security.normalize_url("example.com") == "https://example.com"


def test_dedupe_by_domain_and_phone():
    items = [
        {"business_name": "A", "domain": "a.com", "phone": "+1 555 111", "city": "X"},
        {"business_name": "A dup", "domain": "a.com", "phone": "", "city": "Y"},  # same domain
        {"business_name": "B", "domain": "", "phone": "+15 55 111", "city": "X"},  # same phone digits
        {"business_name": "C", "domain": "c.com", "phone": "+1 999", "city": "Z"},
    ]
    out = dedup.dedupe(items)
    names = {o["business_name"] for o in out}
    assert names == {"A", "C"}
