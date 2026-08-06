from __future__ import annotations

import hashlib
import ipaddress
import secrets
import socket
from datetime import datetime, timedelta
from urllib.parse import urlparse

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

from ..config import settings

_ph = PasswordHasher()
ALGO = "HS256"


# ---- Passwords (Argon2) ----
def hash_password(password: str) -> str:
    return _ph.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    try:
        return _ph.verify(hashed, password)
    except VerifyMismatchError:
        return False
    except Exception:
        return False


# ---- JWT ----
def create_access_token(user_id: str, role: str) -> str:
    now = datetime.utcnow()
    payload = {
        "sub": user_id,
        "role": role,
        "type": "access",
        "iat": now,
        "exp": now + timedelta(minutes=settings.access_token_ttl_min),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=ALGO)


def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[ALGO])
    except jwt.PyJWTError:
        return None


def new_refresh_token() -> tuple[str, str]:
    """Returns (raw_token, sha256_hash). Only the hash is stored."""
    raw = secrets.token_urlsafe(48)
    return raw, hashlib.sha256(raw.encode()).hexdigest()


def hash_refresh(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


def new_license_key() -> str:
    block = lambda: secrets.token_hex(2).upper()
    return f"LEADLY-{block()}-{block()}-{block()}-{block()}"


# ---- SSRF / URL safety ----
def normalize_url(raw: str) -> str:
    raw = (raw or "").strip()
    if not raw:
        return ""
    if not raw.startswith(("http://", "https://")):
        raw = "https://" + raw
    return raw


def is_safe_url(raw: str) -> tuple[bool, str]:
    """Blocks non-http(s) schemes and private/loopback/link-local targets (SSRF)."""
    url = normalize_url(raw)
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        return False, "Only http/https URLs are allowed"
    host = parsed.hostname
    if not host:
        return False, "Invalid host"
    try:
        infos = socket.getaddrinfo(host, None)
    except socket.gaierror:
        return False, "Host does not resolve"
    for info in infos:
        ip = ipaddress.ip_address(info[4][0])
        if (
            ip.is_private
            or ip.is_loopback
            or ip.is_link_local
            or ip.is_multicast
            or ip.is_reserved
            or ip.is_unspecified
        ):
            return False, "Target resolves to a private or reserved address"
    return True, url


def domain_of(raw: str) -> str:
    try:
        return urlparse(normalize_url(raw)).hostname or ""
    except Exception:
        return ""
