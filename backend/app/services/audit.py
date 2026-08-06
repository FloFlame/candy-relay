"""Deep, deterministic website audit.

Fetches a site (SSRF-guarded) and scores it across the spec's categories. Each
category returns a 0-100 score; every problem becomes a structured finding with
a weight, severity, reason and suggested fix. No AI is required for the score.
"""
from __future__ import annotations

import hashlib
import re
import time

import httpx
from bs4 import BeautifulSoup

from ..config import settings
from ..core.security import is_safe_url, normalize_url
from . import scoring


def _finding(category, issue, weight, severity, reason, fix):
    return {
        "category": category,
        "issue": issue,
        "weight": weight,
        "severity": severity,
        "reason": reason,
        "fix": fix,
    }


def _client() -> httpx.Client:
    proxy = settings.outbound_proxy or None
    return httpx.Client(
        follow_redirects=True,
        timeout=settings.request_timeout_s,
        headers={"user-agent": "LeadlyBot/1.0 (+https://getleadly.net)"},
        proxy=proxy,
    )


def audit_website(raw_url: str) -> dict:
    safe, value = is_safe_url(raw_url) if raw_url else (False, "No website on file")
    if not raw_url:
        return _unreachable("", "No website on file")
    if not safe:
        return _unreachable(normalize_url(raw_url), value)

    url = value
    start = time.time()
    try:
        with _client() as client:
            resp = client.get(url)
    except Exception as exc:  # noqa: BLE001
        return _unreachable(url, f"Site did not respond ({type(exc).__name__})")

    response_ms = int((time.time() - start) * 1000)
    html = resp.text[: settings.max_html_bytes]
    html_hash = hashlib.sha256(html.encode("utf-8", "ignore")).hexdigest()
    soup = BeautifulSoup(html, "html.parser")
    text = soup.get_text(" ", strip=True).lower()
    final_url = str(resp.url)
    https = final_url.startswith("https://")

    cats: dict[str, float] = {}
    findings: list[dict] = []

    # ---------- TECHNICAL ----------
    tech = 100.0
    if not https:
        tech -= 45
        findings.append(_finding("technical", "No HTTPS", 45, "critical",
            "The site isn't served over HTTPS so browsers show 'Not secure'.",
            "Install an SSL certificate and force https:// redirects."))
    if not resp.headers.get("strict-transport-security") and https:
        tech -= 6
        findings.append(_finding("technical", "No HSTS header", 6, "low",
            "HTTPS is on but HSTS isn't set, leaving a downgrade gap.",
            "Send a Strict-Transport-Security header."))
    has_viewport = bool(soup.find("meta", attrs={"name": "viewport"}))
    if not has_viewport:
        tech -= 20
        findings.append(_finding("technical", "No mobile viewport", 20, "high",
            "Without a viewport tag the site won't scale on phones.",
            'Add <meta name="viewport" content="width=device-width, initial-scale=1">.'))
    has_favicon = bool(soup.find("link", rel=re.compile("icon", re.I)))
    if not has_favicon:
        tech -= 6
        findings.append(_finding("technical", "No favicon", 6, "low",
            "A missing favicon looks unpolished in browser tabs.",
            "Add a favicon link in <head>."))
    has_canonical = bool(soup.find("link", rel="canonical"))
    if not has_canonical:
        tech -= 6
        findings.append(_finding("technical", "No canonical tag", 6, "low",
            "Missing canonical tags can cause duplicate-content issues.",
            "Add a <link rel=\"canonical\"> to the primary URL."))
    has_analytics = bool(re.search(r"gtag\(|googletagmanager|google-analytics|plausible|matomo|fathom", lower))
    if not has_analytics:
        tech -= 5
        findings.append(_finding("technical", "No analytics detected", 5, "low",
            "No web analytics found, so the owner is flying blind on traffic.",
            "Add privacy-friendly analytics (Plausible, Fathom or GA4)."))
    has_og = bool(soup.find("meta", attrs={"property": re.compile("^og:")}))
    if not has_og:
        tech -= 4
        findings.append(_finding("technical", "No Open Graph tags", 4, "low",
            "Links shared on social/WhatsApp won't show a rich preview.",
            "Add og:title, og:description and og:image meta tags."))
    if resp.status_code >= 400:
        tech -= 20
        findings.append(_finding("technical", f"HTTP {resp.status_code}", 20, "critical",
            f"The homepage returned an HTTP {resp.status_code} error.",
            "Fix the server error so the homepage returns 200."))
    cats["technical"] = scoring.clamp(tech)

    # ---------- PERFORMANCE ----------
    perf = 100.0
    if response_ms > 800:
        pen = min(55, (response_ms - 800) / 45)
        perf -= pen
        if response_ms > 2500:
            findings.append(_finding("performance", "Slow response", round(pen), "high",
                f"The homepage took {response_ms/1000:.1f}s to respond.",
                "Enable caching/CDN, compress assets and reduce server work."))
    page_bytes = len(html)
    if page_bytes > 200_000:
        perf -= min(20, (page_bytes - 200_000) / 40_000)
        findings.append(_finding("performance", "Heavy page weight", 12, "medium",
            "The HTML payload is large, which slows mobile loads.",
            "Minify HTML/CSS/JS and lazy-load images."))
    imgs = soup.find_all("img")
    lazy = sum(1 for i in imgs if (i.get("loading") == "lazy"))
    if imgs and lazy == 0:
        perf -= 8
        findings.append(_finding("performance", "No image lazy-loading", 8, "low",
            "Images load eagerly, delaying first paint.",
            'Add loading="lazy" to below-the-fold images.'))
    cats["performance"] = scoring.clamp(perf)

    # ---------- SEO ----------
    seo = 0.0
    title = (soup.title.string or "").strip() if soup.title else ""
    if title:
        seo += 26
        if 10 <= len(title) <= 65:
            seo += 6
        else:
            findings.append(_finding("seo", "Title length off", 6, "low",
                "The page title is too short or too long for search snippets.",
                "Aim for a 10–65 character title."))
    else:
        findings.append(_finding("seo", "Missing title tag", 26, "critical",
            "Search engines rely on the <title>; it's missing.",
            "Add a descriptive, keyword-led <title>."))
    desc = soup.find("meta", attrs={"name": "description"})
    if desc and desc.get("content"):
        seo += 20
    else:
        findings.append(_finding("seo", "No meta description", 20, "high",
            "There's no meta description so snippets are auto-generated.",
            "Write a compelling 120–160 char meta description."))
    h1s = soup.find_all("h1")
    if len(h1s) == 1:
        seo += 16
    elif len(h1s) == 0:
        findings.append(_finding("seo", "No H1 heading", 16, "high",
            "No H1 was found, weakening on-page SEO structure.",
            "Add a single, descriptive H1."))
    else:
        seo += 8
        findings.append(_finding("seo", "Multiple H1s", 8, "low",
            f"Found {len(h1s)} H1 tags; one is best practice.",
            "Use a single H1 and H2/H3 for subsections."))
    if soup.find_all(["h2", "h3"]):
        seo += 8
    if soup.find("html", attrs={"lang": True}) or soup.find(attrs={"lang": True}):
        seo += 6
    if soup.find("script", attrs={"type": "application/ld+json"}):
        seo += 10
    else:
        findings.append(_finding("seo", "No structured data", 10, "medium",
            "No JSON-LD schema found; you lose rich-result eligibility.",
            "Add LocalBusiness JSON-LD with name, address and phone."))
    imgs_missing_alt = sum(1 for i in imgs if not (i.get("alt") or "").strip())
    if imgs and imgs_missing_alt / max(len(imgs), 1) > 0.4:
        seo += 4
        findings.append(_finding("seo", "Images missing alt text", 6, "medium",
            f"{imgs_missing_alt}/{len(imgs)} images have no alt text.",
            "Add descriptive alt text to informative images."))
    else:
        seo += 8
    cats["seo"] = scoring.clamp(seo)

    # ---------- LOCAL SEO ----------
    local = 0.0
    if re.search(r"\+?\d[\d\s().-]{7,}\d", text):
        local += 22
    else:
        findings.append(_finding("local_seo", "No visible phone", 22, "high",
            "A local business should show a phone number prominently.",
            "Put a click-to-call phone number in the header and footer."))
    if re.search(r"\b\d{4,5}\b", text) and re.search(r"street|straat|rue|road|ave|laan|weg", text):
        local += 18
    else:
        findings.append(_finding("local_seo", "No visible address", 18, "medium",
            "No physical address detected; hurts local trust and maps.",
            "Add a full NAP (name, address, phone) block."))
    if "maps.google" in html or "google.com/maps" in html or soup.find("iframe", src=re.compile("maps")):
        local += 16
    else:
        findings.append(_finding("local_seo", "No Google Maps embed", 16, "medium",
            "No map/embed found; visitors can't see your location.",
            "Embed a Google Map of your location on the contact page."))
    if re.search(r"opening hours|openingsuren|hours|geopend|horaire", text):
        local += 14
    else:
        findings.append(_finding("local_seo", "No opening hours", 14, "low",
            "Opening hours aren't shown, a common local-intent need.",
            "List opening hours near your contact details."))
    if re.search(r"review|reviews|google reviews|beoordeling|avis", text):
        local += 16
    else:
        findings.append(_finding("local_seo", "No review signals", 16, "medium",
            "No mention of reviews/ratings, a key local trust signal.",
            "Show your Google rating and recent reviews."))
    local += 14  # baseline presence
    cats["local_seo"] = scoring.clamp(local)

    # ---------- CONVERSION ----------
    conv = 0.0
    has_tel = bool(soup.find("a", href=re.compile(r"^tel:", re.I)))
    has_form = bool(soup.find("form"))
    has_mail = bool(soup.find("a", href=re.compile(r"^mailto:", re.I)))
    cta_words = re.search(r"contact|book|quote|call|offerte|afspraak|bel|reserve|get started|request", text)
    has_whatsapp = "wa.me" in html or "whatsapp" in text
    if has_tel:
        conv += 22
    else:
        findings.append(_finding("conversion", "No click-to-call", 22, "high",
            "Mobile visitors can't tap to call.",
            'Add a <a href="tel:..."> click-to-call button.'))
    if has_form:
        conv += 24
    else:
        findings.append(_finding("conversion", "No contact/quote form", 24, "high",
            "There's no form to capture enquiries or quote requests.",
            "Add a short contact or quote-request form."))
    if cta_words:
        conv += 20
    else:
        findings.append(_finding("conversion", "Weak call-to-action", 20, "high",
            "No clear call-to-action language detected.",
            "Add a prominent CTA above the fold (e.g. 'Request a free quote')."))
    if has_whatsapp:
        conv += 10
    if has_mail:
        conv += 8
    if re.search(r"testimonial|review|guarantee|garantie|certified|award", text):
        conv += 16
    else:
        findings.append(_finding("conversion", "No trust signals", 16, "medium",
            "No testimonials, guarantees or badges found.",
            "Add testimonials, guarantees and trust badges."))
    cats["conversion"] = scoring.clamp(conv)

    # ---------- DESIGN (heuristic; AI vision is a future enhancement) ----------
    design = 45.0
    if html[:200].lower().find("<!doctype html>") != -1:
        design += 12
    if soup.find("link", rel="stylesheet") or soup.find("style"):
        design += 16
    if has_viewport:
        design += 15
    if soup.find(class_=re.compile(r"hero|banner|jumbotron", re.I)) or soup.find("header"):
        design += 8
    if imgs:
        design += 4
    cats["design"] = scoring.clamp(design)

    # ---------- COPYWRITING ----------
    words = len(text.split())
    copy = 60.0
    if words < 120:
        copy -= 25
        findings.append(_finding("copywriting", "Very little copy", 15, "medium",
            "The homepage has very little text to explain the offer.",
            "Add clear, benefit-led copy describing services and areas served."))
    elif words > 3000:
        copy -= 10
        findings.append(_finding("copywriting", "Wall of text", 8, "low",
            "The homepage is text-heavy, which can overwhelm visitors.",
            "Break copy into scannable sections with headings and bullets."))
    else:
        copy += 20
    if re.search(r"best|number one|#1|leading", text) and not re.search(r"review|award|certified", text):
        copy -= 8
        findings.append(_finding("copywriting", "Unsupported claims", 8, "low",
            "Superlative claims without proof read as vague.",
            "Back claims with reviews, numbers or certifications."))
    cats["copywriting"] = scoring.clamp(copy)

    # ---------- CONTENT COMPLETENESS ----------
    content = 40.0
    links = [a.get("href", "") for a in soup.find_all("a")]
    if any(re.search(r"service|dienst|prestation", (l or "").lower()) for l in links):
        content += 20
    else:
        findings.append(_finding("content", "No service pages", 12, "medium",
            "No dedicated service pages detected.",
            "Add a page per core service for SEO and clarity."))
    if any(re.search(r"contact", (l or "").lower()) for l in links):
        content += 15
    if any(re.search(r"about|over-ons|about-us", (l or "").lower()) for l in links):
        content += 10
    if any(re.search(r"faq", (l or "").lower()) for l in links) or "faq" in text:
        content += 15
    else:
        findings.append(_finding("content", "No FAQ", 8, "low",
            "No FAQ section found; misses long-tail SEO and objections.",
            "Add an FAQ answering common local questions."))
    cats["content"] = scoring.clamp(content)

    # ---------- ACCESSIBILITY ----------
    acc = 100.0
    if imgs and imgs_missing_alt / max(len(imgs), 1) > 0.3:
        acc -= 25
        findings.append(_finding("accessibility", "Missing alt text", 25, "high",
            f"{imgs_missing_alt} images lack alt text for screen readers.",
            "Add meaningful alt text to informative images."))
    inputs = soup.find_all("input")
    labels = soup.find_all("label")
    if inputs and len(labels) < len(inputs) / 2:
        acc -= 20
        findings.append(_finding("accessibility", "Form inputs without labels", 20, "medium",
            "Form fields lack associated labels.",
            "Associate every input with a <label>."))
    if not (soup.find("html", attrs={"lang": True})):
        acc -= 15
        findings.append(_finding("accessibility", "No lang attribute", 15, "low",
            "The <html> tag has no lang attribute.",
            'Set <html lang="..."> for assistive tech.'))
    if not soup.find_all(["h1", "h2"]):
        acc -= 15
    cats["accessibility"] = scoring.clamp(acc)

    overall = scoring.compute_overall(cats)
    findings.sort(key=lambda f: scoring.SEVERITY_ORDER.get(f["severity"], 0), reverse=True)

    return {
        "reachable": True,
        "final_url": final_url,
        "status_code": resp.status_code,
        "response_ms": response_ms,
        "html_hash": html_hash,
        "overall_score": overall,
        "priority": scoring.priority_band(overall),
        "category_scores": {k: int(v) for k, v in cats.items()},
        "findings": findings,
        "meta": {
            "title": title or None,
            "https": https,
            "has_viewport": has_viewport,
            "word_count": words,
            "image_count": len(imgs),
            "bytes": page_bytes,
        },
    }


def _unreachable(url: str, reason: str) -> dict:
    zero = {c: 5 for c in scoring.CATEGORIES}
    return {
        "reachable": False,
        "final_url": url,
        "status_code": None,
        "response_ms": None,
        "html_hash": "",
        "overall_score": 6,
        "priority": "high",
        "category_scores": zero,
        "findings": [
            _finding("technical", "Website unreachable" if url else "No website", 100, "critical",
                reason,
                "This is a prime opportunity — pitch building a new site." if not url
                else "The current site is down or misconfigured; offer to rebuild it."),
        ],
        "meta": {"title": None, "https": False, "reason": reason},
    }
