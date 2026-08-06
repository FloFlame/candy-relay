"""Website improvement suggestions.

Deterministic, built from the real audit findings and any review data. Produces
concrete, per-section ideas an agency can pitch. No AI required; if Ollama is
enabled the copy ideas can be smoothed by the caller.
"""
from __future__ import annotations


def _weak(category_scores: dict, key: str, threshold: int = 60) -> bool:
    return category_scores.get(key, 100) < threshold


def generate_suggestions(lead: dict, audit: dict) -> dict:
    name = lead.get("business_name", "the business")
    niche = lead.get("category") or "local"
    city = lead.get("city") or "your area"
    cats = audit.get("category_scores", {})
    issues = {f["issue"] for f in audit.get("findings", [])}

    headline_ideas = [
        f"{niche.title()} in {city} you can trust — free quote in 24h",
        f"Fast, reliable {niche} services across {city}",
        f"{city}'s {niche} specialists — book online today",
    ]

    cta_ideas = ["Get a free quote", "Book a call today", "Request a callback", "Message us on WhatsApp"]

    hero = [
        "Lead with a one-line promise + a single primary CTA above the fold.",
        "Show a trust strip (reviews stars, years in business, guarantees) directly under the headline.",
        "Add a real photo of the team or recent work, not a stock image.",
    ]

    trust_section = []
    rating = lead.get("google_rating")
    reviews = lead.get("review_count")
    if rating:
        trust_section.append(f"Feature your {rating}★ Google rating ({reviews or 0} reviews) prominently.")
    else:
        trust_section.append("Collect and display Google reviews — start by asking your last 10 happy customers.")
    trust_section += [
        "Add 2–3 named testimonials with a photo or location.",
        "Show guarantees/certifications as badges near the CTA.",
    ]

    faq_ideas = [
        f"How much does {niche} cost in {city}?",
        "How quickly can you start?",
        "Do you offer a guarantee?",
        "Which areas do you cover?",
    ]

    service_pages = [f"A dedicated page per core {niche} service (better SEO + clarity)."]
    local_pages = [f"A '{niche} in {city}' location page targeting local search intent."]

    priorities: list[str] = []
    if _weak(cats, "conversion"):
        priorities.append("Add a clear above-the-fold CTA + click-to-call and a short quote form.")
    if _weak(cats, "local_seo"):
        priorities.append("Add NAP (name/address/phone), a Google Map embed and opening hours.")
    if _weak(cats, "seo"):
        priorities.append("Fix the title/meta description and add LocalBusiness JSON-LD.")
    if _weak(cats, "technical") or "No HTTPS" in issues:
        priorities.append("Move the site to HTTPS and add a mobile viewport tag.")
    if _weak(cats, "performance"):
        priorities.append("Compress images, lazy-load below-the-fold media, enable caching/CDN.")
    if not priorities:
        priorities.append("The site is solid — focus on conversion polish and fresh content.")

    return {
        "priority_fixes": priorities,
        "headline_ideas": headline_ideas,
        "cta_ideas": cta_ideas,
        "hero_structure": hero,
        "trust_section": trust_section,
        "faq_ideas": faq_ideas,
        "service_pages": service_pages,
        "local_seo_pages": local_pages,
        "trust_badges": ["Licensed & insured", "Free quotes", "Satisfaction guarantee", f"Serving {city}"],
        "contact_improvements": [
            "Add a sticky click-to-call button on mobile.",
            "Put a short contact form on every page footer.",
            "Offer WhatsApp as a contact option.",
        ],
        "mobile_sticky_cta": f"Sticky bottom bar on mobile: 'Call {name}' + 'Get a quote'.",
    }
