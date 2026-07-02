# Leadly — Owner Guide

The operations manual for running, maintaining and shipping Leadly.

- [Architecture](#architecture)
- [Install & configure](#install--configure)
- [Running the app](#running-the-app)
- [Database & migrations](#database--migrations)
- [Accounts & licensing](#accounts--licensing)
- [Device activation](#device-activation)
- [AI (Ollama / Anthropic)](#ai)
- [Providers (SerpApi)](#providers)
- [Packaging as a desktop app (Tauri)](#packaging-desktop-tauri)
- [Deploying as a SaaS](#deploying-as-a-saas)
- [Switching SQLite → PostgreSQL](#switching-to-postgresql)
- [Adding Stripe later](#adding-stripe)
- [Troubleshooting](#troubleshooting)

---

## Architecture

```
frontend/   Next.js + React + TypeScript + Tailwind   (port 3000)
backend/    FastAPI + SQLAlchemy + Alembic            (port 8000)
ollama      Local AI model server (Docker)            (port 11434)
```

Everything the frontend does goes through the REST API under `/api`. The
backend is service-based:

```
backend/app/
  core/security.py     Argon2 hashing, JWT, SSRF guard
  services/            audit, scoring, finder, dedup, outreach, ollama, plans
  routers/             auth, account, admin, licenses, finder, leads, exports, health
  models.py            SQLAlchemy models
  deps.py              auth + license + usage-limit dependencies
  main.py              app factory, startup (init db, owner bootstrap, ollama)
```

## Install & configure

```bash
cp .env.example .env
```

Key settings (see `.env.example` for all):

| Var | Meaning |
| --- | --- |
| `SECRET_KEY` | JWT signing secret — **must** be changed in prod |
| `DATABASE_URL` | `sqlite:///./data/leadly.db` or `postgresql://…` |
| `AI_PROVIDER` / `AI_MODE` | `ollama`/`anthropic`/`off` · `OFF`/`LOCAL_LIGHT`/`LOCAL_FULL`/`API_PREMIUM` |
| `OLLAMA_MODEL` | e.g. `qwen2.5:7b` |
| `SERPAPI_KEY` | empty → OpenStreetMap + sample fallback |
| `OWNER_EMAIL` / `OWNER_PASSWORD` | bootstrap owner created on first boot |

## Running the app

**Docker (all services):**
```bash
docker compose up -d --build
docker compose logs -f backend
```

**Local dev:**
```bash
# backend
cd backend && . .venv/bin/activate
uvicorn app.main:app --reload
# frontend
cd frontend && npm run dev
```

## Database & migrations

Leadly uses Alembic. On first run the backend also calls `create_all` so it
works out of the box, but the source of truth for schema changes is Alembic.

```bash
cd backend
alembic upgrade head                         # apply all migrations
alembic revision --autogenerate -m "change"  # after editing models.py
alembic downgrade -1                          # roll back one
```

**Reset the database (dev):**
```bash
rm -f backend/data/leadly.db
alembic upgrade head
python -m app.seed
```

**Seed demo data:**
```bash
cd backend && python -m app.seed
# owner@leadly.local / changeme123   ·   demo@leadly.test / supersecret
```

## Accounts & licensing

Roles: `owner`, `admin`, `user`. The owner is created automatically from `.env`.

Every account needs a usable license (owners bypass the check). New signups get
a 14-day trial automatically. License **types**: trial, monthly, annual,
lifetime, enterprise. **Statuses**: trial, active, expired, suspended, revoked,
invalid. Plan limits (searches/audits/AI/exports per day, devices, languages)
live in `backend/app/services/plans.py`.

Admin endpoints (owner/admin only):

```bash
POST   /api/admin/licenses              # create { type, user_email? }
GET    /api/admin/licenses              # list
POST   /api/admin/licenses/{id}/revoke  # revoke | suspend | activate | expire
GET    /api/admin/users                 # search users
PATCH  /api/admin/users/{id}            # activate/deactivate, change role
GET    /api/admin/stats                 # counts
```

## Device activation

```bash
POST   /api/licenses/activate     # { key, device_id, device_name, os }
GET    /api/licenses/devices      # list this account's devices
DELETE /api/licenses/devices/{id} # deactivate a device
```

Activation enforces the plan's `max_devices`. Devices record `activated_at`,
`last_online` and `last_validation` for offline-grace validation.

## AI

Local AI runs through Ollama in Docker — users never install it manually.

```bash
docker compose exec ollama ollama pull qwen2.5:7b   # first run
```

On startup the backend checks Ollama, pulls the model if missing, and falls
back to templates if AI is unavailable. AI is used only for *wording*
(outreach, summaries, suggestions) — never for factual detection or scoring.
Set `AI_MODE=OFF` to use templates only. To use Claude instead, set
`AI_PROVIDER=anthropic` and `ANTHROPIC_API_KEY`.

## Providers

Set `SERPAPI_KEY` to pull Google-Maps-style business data (rating, review
count, category, place URL). Without it, the finder uses OpenStreetMap
(Nominatim + Overpass) and, if that's unreachable, deterministic sample data —
always flagged by `source` in the response.

## Packaging desktop (Tauri)

The frontend is Tauri-compatible and the backend runs as an embedded local
service (not a Python EXE). Outline:

```bash
cd frontend
npm install -D @tauri-apps/cli
npx tauri init                 # point build to the Next export/server
# ship the backend as a sidecar binary (e.g. built with pyinstaller or run via
# a bundled python) started on app launch, pointing NEXT_PUBLIC_API_URL at it.
npx tauri build                # produces installers per-OS
```

Build targets: Windows (`.msi`/`.exe`), macOS (`.dmg`), Linux (`.AppImage`/`.deb`)
— run `tauri build` on each target OS or via CI matrix.

## Deploying as a SaaS

1. Set a strong `SECRET_KEY`, real `OWNER_*`, and `DATABASE_URL` (Postgres).
2. `docker compose up -d --build` behind a reverse proxy (Caddy/Nginx/Traefik).
3. Terminate HTTPS at the proxy; point a domain at it and set `CORS_ORIGINS`
   to your frontend origin.
4. Run migrations on deploy: `alembic upgrade head`.

## Switching to PostgreSQL

```bash
# 1. Provision Postgres, then set:
DATABASE_URL=postgresql+psycopg://user:pass@host:5432/leadly
# 2. Install the driver in backend/requirements.txt: psycopg[binary]
# 3. Apply migrations:
alembic upgrade head
```

Screenshots/exports are stored on disk (paths in the DB), so they migrate
independently of the database engine.

## Adding Stripe

The schema is billing-ready (licenses, statuses, seat/usage limits). To add
payments: create a `subscriptions` table keyed to `users`/`licenses`, add a
Stripe webhook router that flips `License.status` on `invoice.paid` /
`customer.subscription.deleted`, and gate `require_license` on the result.
No core changes needed.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `index ... already exists` on boot | You have both a stale DB and new schema — `rm data/leadly.db && alembic upgrade head`. |
| Finder returns `source: sample` | OpenStreetMap was unreachable (or no SerpApi key). Expected offline; results are real when the network allows. |
| Outreach is template-only | Ollama unreachable or `AI_MODE=OFF`. Check `GET /api/health` → `ai`. |
| Audit says `unreachable` | Site is down, blocked, or resolves to a private IP (SSRF guard). |
| 402 on API calls | The account has no active license — create/activate one. |
| 429 on API calls | Daily plan limit hit — raise limits in `plans.py` or upgrade the license. |
