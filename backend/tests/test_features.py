from app.services import suggestions, scoring


def _fake_audit(scores):
    return {
        "category_scores": scores,
        "findings": [
            {"category": "conversion", "issue": "No click-to-call", "weight": 22,
             "severity": "high", "reason": "x", "fix": "y"},
        ],
    }


def test_suggestions_prioritise_weak_categories():
    lead = {"business_name": "Acme Roofing", "category": "roofer", "city": "Austin",
            "google_rating": 4.6, "review_count": 32}
    audit = _fake_audit({c: 30 for c in scoring.CATEGORIES})
    out = suggestions.generate_suggestions(lead, audit)
    assert out["priority_fixes"]
    assert out["headline_ideas"] and out["cta_ideas"]
    # rating present -> trust section references it
    assert any("4.6" in s for s in out["trust_section"])


def test_suggestions_healthy_site_has_polish_note():
    lead = {"business_name": "Acme", "category": "dentist", "city": "Miami"}
    audit = _fake_audit({c: 90 for c in scoring.CATEGORIES})
    out = suggestions.generate_suggestions(lead, audit)
    assert any("solid" in p.lower() for p in out["priority_fixes"])


def test_custom_weights_change_overall():
    scores = {"seo": 100, "conversion": 0, "technical": 50, "local_seo": 50,
              "design": 50, "copywriting": 50, "accessibility": 50, "performance": 50, "content": 50}
    default = scoring.compute_overall(scores)
    seo_heavy = scoring.compute_overall(scores, {"seo": 0.9, "conversion": 0.1})
    assert seo_heavy > default
