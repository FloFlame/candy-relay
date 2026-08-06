"""Lead deduplication by domain, phone, and name+city."""
from __future__ import annotations

import re


def _norm_phone(p: str) -> str:
    return re.sub(r"\D", "", p or "")


def _key(item: dict) -> tuple:
    domain = (item.get("domain") or "").lower().replace("www.", "")
    phone = _norm_phone(item.get("phone", ""))
    name = (item.get("business_name") or "").strip().lower()
    city = (item.get("city") or "").strip().lower()
    return (domain, phone, f"{name}|{city}")


def dedupe(items: list[dict], existing_keys: set | None = None) -> list[dict]:
    """Remove duplicates within the batch and against existing leads.

    Matches if ANY of domain / phone / (name+city) collide.
    """
    seen_domains, seen_phones, seen_namecity = set(), set(), set()
    if existing_keys:
        for d, p, nc in existing_keys:
            if d:
                seen_domains.add(d)
            if p:
                seen_phones.add(p)
            if nc:
                seen_namecity.add(nc)

    out = []
    for it in items:
        d, p, nc = _key(it)
        if (d and d in seen_domains) or (p and p in seen_phones) or (nc and nc in seen_namecity):
            continue
        if d:
            seen_domains.add(d)
        if p:
            seen_phones.add(p)
        if nc:
            seen_namecity.add(nc)
        out.append(it)
    return out


def key_for(business_name: str, domain: str, phone: str, city: str) -> tuple:
    return _key({"business_name": business_name, "domain": domain, "phone": phone, "city": city})
