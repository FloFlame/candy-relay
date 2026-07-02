"""Deterministic, transparent scoring.

The overall score is a weighted average of per-category scores (0-100, where
higher = stronger existing website). Priority is derived from the overall
score: a *low* score means a *big* sales opportunity.
"""
from __future__ import annotations

# Default category weights (sum = 1.0). Owners can override per-account.
DEFAULT_WEIGHTS: dict[str, float] = {
    "technical": 0.14,
    "seo": 0.16,
    "local_seo": 0.14,
    "conversion": 0.16,
    "design": 0.12,
    "copywriting": 0.08,
    "accessibility": 0.08,
    "performance": 0.08,
    "content": 0.04,
}

CATEGORIES = list(DEFAULT_WEIGHTS.keys())

SEVERITY_ORDER = {"critical": 4, "high": 3, "medium": 2, "low": 1, "info": 0}


def clamp(n: float) -> int:
    return max(0, min(100, round(n)))


def compute_overall(category_scores: dict[str, float], weights: dict[str, float] | None = None) -> int:
    w = weights or DEFAULT_WEIGHTS
    total_w = sum(w.get(c, 0) for c in category_scores) or 1
    weighted = sum(category_scores.get(c, 0) * w.get(c, 0) for c in category_scores)
    return clamp(weighted / total_w)


def priority_band(overall_score: int) -> str:
    """High: 0-45 · Medium: 46-70 · Low: 71-100 (lower score = hotter lead)."""
    if overall_score <= 45:
        return "high"
    if overall_score <= 70:
        return "medium"
    return "low"


def opportunity_score(overall_score: int) -> int:
    """Inverse of site strength, for ranking hottest-first."""
    return 100 - overall_score
