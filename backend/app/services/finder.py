"""Business finder.

Provider order: SerpApi (if key set) → OpenStreetMap (Nominatim + Overpass) →
deterministic sample data, so the finder always returns results.
"""
from __future__ import annotations

import httpx

from ..config import settings
from ..core.security import domain_of

NICHE_TAGS: dict[str, list[str]] = {
    "dentist": ['["amenity"="dentist"]'],
    "restaurant": ['["amenity"="restaurant"]'],
    "cafe": ['["amenity"="cafe"]'],
    "plumber": ['["craft"="plumber"]'],
    "dakwerker": ['["craft"="roofer"]'],
    "roofer": ['["craft"="roofer"]'],
    "electrician": ['["craft"="electrician"]'],
    "lawyer": ['["office"="lawyer"]'],
    "hairdresser": ['["shop"="hairdresser"]'],
    "gym": ['["leisure"="fitness_centre"]'],
    "bakery": ['["shop"="bakery"]'],
    "garage": ['["shop"="car_repair"]'],
    "mechanic": ['["shop"="car_repair"]'],
    "detailing": ['["shop"="car_repair"]', '["shop"="car"]'],
    "hvac": ['["craft"="hvac"]'],
    "solar": ['["craft"="electrician"]'],
    "landscaper": ['["landuse"="garden_centre"]', '["shop"="garden_centre"]'],
    "hotel": ['["tourism"="hotel"]'],
}


def _client() -> httpx.Client:
    return httpx.Client(
        timeout=settings.request_timeout_s + 6,
        headers={"user-agent": "LeadlyBot/1.0 (+https://getleadly.net)"},
        proxy=settings.outbound_proxy or None,
    )


def _tags(niche: str) -> list[str]:
    key = "".join(c for c in niche.lower() if c.isalpha())
    for k, v in NICHE_TAGS.items():
        if k in key:
            return v
    safe = niche.replace('"', "").replace("\\", "")
    return [f'["shop"]["name"~"{safe}",i]', f'["office"]["name"~"{safe}",i]', f'["amenity"]["name"~"{safe}",i]']


def find_businesses(niche: str, city: str, limit: int = 20) -> dict:
    if settings.serpapi_key:
        try:
            return {"source": "serpapi", "results": _serpapi(niche, city, limit)}
        except Exception:
            pass
    try:
        results = _openstreetmap(niche, city, limit)
        if results:
            return {"source": "openstreetmap", "results": results}
    except Exception:
        pass
    return {"source": "sample", "results": _sample(niche, city, limit)}


def _serpapi(niche: str, city: str, limit: int) -> list[dict]:
    with _client() as c:
        r = c.get("https://serpapi.com/search.json", params={
            "engine": "google_maps", "type": "search",
            "q": f"{niche} in {city}", "api_key": settings.serpapi_key,
        })
        data = r.json()
    out = []
    for it in (data.get("local_results") or [])[:limit]:
        site = it.get("website", "")
        out.append({
            "business_name": it.get("title", ""),
            "website": site, "domain": domain_of(site),
            "phone": it.get("phone", ""), "address": it.get("address", ""),
            "city": city, "country": "",
            "lat": (it.get("gps_coordinates") or {}).get("latitude"),
            "lng": (it.get("gps_coordinates") or {}).get("longitude"),
            "category": it.get("type", ""),
            "google_rating": it.get("rating"), "review_count": it.get("reviews"),
            "maps_url": it.get("place_id_search", ""),
            "source": "serpapi", "source_query": f"{niche} in {city}",
        })
    return out


def _openstreetmap(niche: str, city: str, limit: int) -> list[dict]:
    with _client() as c:
        geo = c.get("https://nominatim.openstreetmap.org/search",
                    params={"format": "json", "limit": 1, "q": city}).json()
        if not geo:
            return []
        lat, lng = float(geo[0]["lat"]), float(geo[0]["lon"])
        filters = "".join(
            f"node{t}(around:12000,{lat},{lng});way{t}(around:12000,{lat},{lng});"
            for t in _tags(niche)
        )
        query = f"[out:json][timeout:20];({filters});out center {limit};"
        data = c.post("https://overpass-api.de/api/interpreter",
                      content="data=" + query,
                      headers={"content-type": "application/x-www-form-urlencoded"}).json()
    out = []
    for el in data.get("elements", [])[:limit]:
        t = el.get("tags", {})
        name = t.get("name") or t.get("name:en")
        if not name:
            continue
        site = (t.get("website") or t.get("contact:website") or "").strip()
        out.append({
            "business_name": name,
            "website": site, "domain": domain_of(site),
            "phone": (t.get("phone") or t.get("contact:phone") or "").strip(),
            "address": ", ".join(filter(None, [t.get("addr:street"), t.get("addr:city")])),
            "city": city, "country": "",
            "lat": el.get("lat") or (el.get("center") or {}).get("lat"),
            "lng": el.get("lon") or (el.get("center") or {}).get("lon"),
            "category": niche, "google_rating": None, "review_count": None,
            "maps_url": "", "source": "openstreetmap", "source_query": f"{niche} in {city}",
        })
    return out


def _sample(niche: str, city: str, limit: int) -> list[dict]:
    prefixes = ["Sunrise", "Elm Street", "Premier", "Harbour", "Oakwood", "Cornerstone",
                "Bright", "Maple", "Riverside", "Golden", "Summit", "Ironclad",
                "Blue Sky", "Evergreen", "Downtown", "Heritage", "Anchor", "Crestview"]
    out = []
    for i in range(min(limit, len(prefixes))):
        has_site = i % 3 != 0
        slug = "".join(c for c in prefixes[i].lower() if c.isalpha())
        citys = "".join(c for c in city.lower() if c.isalpha())
        site = f"http://{slug}{citys}.com" if has_site else ""
        out.append({
            "business_name": f"{prefixes[i]} {niche.title()}",
            "website": site, "domain": domain_of(site),
            "phone": f"+1 555 0{100+i:03d}", "address": f"{100+i*7} {prefixes[i]} Rd, {city}",
            "city": city, "country": "",
            "lat": None, "lng": None, "category": niche,
            "google_rating": round(3.5 + (i % 5) * 0.3, 1), "review_count": 5 + i * 7,
            "maps_url": "", "source": "sample", "source_query": f"{niche} in {city}",
        })
    return out
