"""License type → plan limit presets."""
from __future__ import annotations

from datetime import datetime, timedelta

PLAN_LIMITS: dict[str, dict] = {
    "trial": dict(searches_per_day=10, audits_per_day=25, ai_generations_per_day=15,
                  screenshots_per_day=15, exports_per_day=5, competitor_comparisons_per_day=5,
                  max_devices=1, max_languages=3, review_collection=False, api_integrations=False),
    "monthly": dict(searches_per_day=50, audits_per_day=200, ai_generations_per_day=200,
                    screenshots_per_day=200, exports_per_day=50, competitor_comparisons_per_day=50,
                    max_devices=3, max_languages=6, review_collection=True, api_integrations=True),
    "annual": dict(searches_per_day=100, audits_per_day=500, ai_generations_per_day=500,
                   screenshots_per_day=500, exports_per_day=100, competitor_comparisons_per_day=100,
                   max_devices=3, max_languages=12, review_collection=True, api_integrations=True),
    "lifetime": dict(searches_per_day=200, audits_per_day=1000, ai_generations_per_day=1000,
                     screenshots_per_day=1000, exports_per_day=200, competitor_comparisons_per_day=200,
                     max_devices=5, max_languages=12, review_collection=True, api_integrations=True),
    "enterprise": dict(searches_per_day=10**9, audits_per_day=10**9, ai_generations_per_day=10**9,
                       screenshots_per_day=10**9, exports_per_day=10**9, competitor_comparisons_per_day=10**9,
                       max_devices=10**9, max_languages=12, review_collection=True, api_integrations=True),
}


def default_expiry(license_type: str) -> datetime | None:
    now = datetime.utcnow()
    return {
        "trial": now + timedelta(days=14),
        "monthly": now + timedelta(days=30),
        "annual": now + timedelta(days=365),
        "lifetime": None,
        "enterprise": None,
    }.get(license_type, now + timedelta(days=14))


def default_status(license_type: str) -> str:
    return "trial" if license_type == "trial" else "active"
