from app.services import scoring


def test_overall_is_weighted_average():
    cats = {c: 80 for c in scoring.CATEGORIES}
    assert scoring.compute_overall(cats) == 80


def test_priority_bands():
    assert scoring.priority_band(20) == "high"
    assert scoring.priority_band(45) == "high"
    assert scoring.priority_band(46) == "medium"
    assert scoring.priority_band(70) == "medium"
    assert scoring.priority_band(71) == "low"
    assert scoring.priority_band(100) == "low"


def test_opportunity_is_inverse():
    assert scoring.opportunity_score(30) == 70
    assert scoring.opportunity_score(100) == 0


def test_clamp_bounds():
    assert scoring.clamp(-10) == 0
    assert scoring.clamp(150) == 100
    assert scoring.clamp(63.6) == 64


def test_custom_weights_shift_result():
    cats = {"seo": 100, "technical": 0}
    heavy_seo = scoring.compute_overall(cats, {"seo": 0.9, "technical": 0.1})
    heavy_tech = scoring.compute_overall(cats, {"seo": 0.1, "technical": 0.9})
    assert heavy_seo > heavy_tech
