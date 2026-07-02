# Leadly

Find weak local websites and turn them into paying clients. Leadly finds local
businesses, runs a deep automated website audit, scores each as a 0–100
opportunity, and generates honest, personalized outreach.

This is the full commercial-grade stack: a **FastAPI** backend, a **Next.js**
frontend, and local AI via **Ollama** — orchestrated with Docker Compose.

```
frontend/   Next.js + React + TypeScript + Tailwind   (:3000)
backend/    FastAPI + SQLAlchemy + Alembic            (:8000)
ollama      Local AI (Docker)                          (:11434)
docs/       FEATURES.md (roadmap) · SPEC.md (full spec)
```

## Quick start

See **[QUICK_START_OWNER.md](./QUICK_START_OWNER.md)** for the copy-paste path.
TL;DR with Docker:

```bash
cp .env.example .env          # set SECRET_KEY + OWNER_PASSWORD
docker compose up -d --build
docker compose exec ollama ollama pull qwen2.5:7b
# frontend :3000 · API :8000 · docs :8000/docs
```

Local dev without Docker:

```bash
cd backend && python3 -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head && python -m app.seed
uvicorn app.main:app --reload           # :8000

cd ../frontend && npm install
NEXT_PUBLIC_API_URL=http://localhost:8000/api npm run dev   # :3000
```

## What works today (backend, tested)

- **Auth** — register/login/logout, JWT access + refresh rotation, Argon2
  hashing, roles (owner/admin/user).
- **Licensing** — trial/monthly/annual/lifetime/enterprise with statuses, daily
  plan-limit enforcement, usage metering, and **device activation**.
- **Deep audit engine** — really fetches a site and scores 9 categories
  (technical, SEO, local SEO, conversion, design, copywriting, accessibility,
  performance, content) with **structured findings** (weight · severity ·
  reason · fix) and priority bands.
- **Business finder** — OpenStreetMap (Nominatim + Overpass) with SerpApi seam
  and deterministic sample fallback, plus **lead deduplication**.
- **Outreach** — 6 variants (soft/direct/WhatsApp/LinkedIn/2 follow-ups) in
  multiple languages, template-based with an Ollama hook.
- **Competitor comparison**, **streamed CSV export**, **admin + account** APIs,
  **health checks**, and **SSRF protection** (blocks private/loopback IPs).

Run the tests: `cd backend && . .venv/bin/activate && pytest`

## Documentation

- **[QUICK_START_OWNER.md](./QUICK_START_OWNER.md)** — get running fast.
- **[OWNER_GUIDE.md](./OWNER_GUIDE.md)** — full operations manual (migrations,
  licensing, devices, Tauri desktop, Postgres, Stripe, deploy, troubleshooting).
- **[docs/FEATURES.md](./docs/FEATURES.md)** — 40-section roadmap with status.
- **[docs/SPEC.md](./docs/SPEC.md)** — the full product specification.

## Status

The **backend is complete and tested** for the current phase (auth, licensing,
audit, finder, outreach, CRM, exports, admin). The **frontend** currently ships
the marketing site and the original app UI; rewiring every page to the FastAPI
backend (via the new `frontend/lib/api.ts` client) is the next phase — tracked
in `docs/FEATURES.md`.
