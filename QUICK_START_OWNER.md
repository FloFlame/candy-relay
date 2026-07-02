# Leadly — Quick Start (Owner)

The fastest path from clone to a running app with an owner account and a license.

## Option A — Docker (everything, incl. local AI)

```bash
# 1. Configure
cp .env.example .env
#    edit .env: set a strong SECRET_KEY and OWNER_PASSWORD

# 2. Start backend + frontend + Ollama
docker compose up -d --build

# 3. Pull the local AI model (first run only; ~4.7GB)
docker compose exec ollama ollama pull qwen2.5:7b

# 4. Open the app
#    Frontend:  http://localhost:3000
#    API docs:  http://localhost:8000/docs
#    Health:    http://localhost:8000/api/health
```

The owner account from `.env` (`OWNER_EMAIL` / `OWNER_PASSWORD`) is created
automatically on first boot.

## Option B — Local dev (no Docker)

```bash
# --- Backend ---
cd backend
python3 -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example .env          # AI_MODE=OFF is fine without Ollama
alembic upgrade head             # create tables
python -m app.seed               # owner + demo user + sample leads
uvicorn app.main:app --reload    # http://localhost:8000

# --- Frontend (new terminal) ---
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:8000/api npm run dev   # http://localhost:3000
```

## 5 commands you'll use most

```bash
# 1. Install (docker)          docker compose up -d --build
# 2. Run locally (backend)     uvicorn app.main:app --reload
# 3. Create owner account      python -m app.seed        # or auto on boot
# 4. Create a license          curl -X POST localhost:8000/api/admin/licenses \
#                                -H "Authorization: Bearer <OWNER_TOKEN>" \
#                                -H "content-type: application/json" \
#                                -d '{"type":"lifetime","user_email":"user@x.com"}'
# 5. Activate on a device      curl -X POST localhost:8000/api/licenses/activate \
#                                -H "Authorization: Bearer <USER_TOKEN>" \
#                                -H "content-type: application/json" \
#                                -d '{"key":"LEADLY-....","device_id":"dev-1","device_name":"Laptop"}'
```

Get an owner token:

```bash
curl -X POST localhost:8000/api/auth/login -H "content-type: application/json" \
  -d '{"email":"owner@leadly.local","password":"changeme123"}'
```

## Default demo credentials (after `python -m app.seed`)

| Role  | Email               | Password      |
| ----- | ------------------- | ------------- |
| Owner | owner@leadly.local  | changeme123   |
| User  | demo@leadly.test    | supersecret   |

> Change these before deploying anywhere public.

See **OWNER_GUIDE.md** for the full operations manual (migrations, Postgres,
Tauri desktop builds, Stripe, deployment, troubleshooting).
