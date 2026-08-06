# Leadly — Feature Roadmap

The canonical, authoritative feature scope (40 sections) with implementation
status. Legend: ✅ done · 🟡 partial · ⬜ planned.

Core promise: **Find → Analyze → Connect → Close.** Find businesses, analyze
their weaknesses, generate personalized outreach, turn them into clients.

| # | Feature | Status | Where |
| - | ------- | ------ | ----- |
| 1 | Global business finder (SerpApi/OSM) | 🟡 | `services/finder.py` — OSM + sample now; SerpApi seam ready (needs key) |
| 2 | Lead deduplication (domain/phone/name+city) | ✅ | `services/dedup.py` |
| 3 | Website detection (reachable, redirects, HTTPS, status) | ✅ | `services/audit.py` |
| 4 | Full website audit (technical/SEO/local/conversion/design/copy/accessibility) | ✅ | `services/audit.py` (design/copy via heuristics; AI-vision ⬜) |
| 5 | Screenshots (Playwright, desktop+mobile) | ⬜ | SVG preview in frontend now; Playwright worker planned |
| 6 | Google review collection | ⬜ | schema fields present (`google_rating`, `review_count`); collector needs provider |
| 7 | Review intelligence (copy suggestions from real reviews) | ⬜ | depends on #6 |
| 8 | Advanced scoring (overall + 9 category scores, priority) | ✅ | `services/scoring.py`, `services/audit.py` |
| 9 | Transparent, adjustable scoring weights | ✅ | `scoring.DEFAULT_WEIGHTS` + per-user overrides (`/account/weights`, settings UI) |
| 10 | Competitor comparison | ✅ | `POST /api/leads/{id}/competitors` |
| 11 | AI outreach generator (11 languages, honest, findings-based) | ✅ | `services/outreach.py` (5 langs full, others fall back to EN) |
| 12 | Outreach variants (soft/direct/WhatsApp/LinkedIn/2 follow-ups) | ✅ | `services/outreach.py` |
| 13 | Multilingual system (per-lead language override) | 🟡 | outreach + lead.language ✅; UI i18n ⬜ |
| 14 | AI provider modes (OFF/LOCAL_LIGHT/LOCAL_FULL/API_PREMIUM) | ✅ | `config.ai_mode`, `services/ollama_client.py` |
| 15 | Internal local AI via Docker + Ollama | ✅ | `docker-compose.yml`, startup pull/health |
| 16 | Website improvement suggestions | ✅ | `services/suggestions.py`, `/leads/{id}/suggestions`, lead-detail panel |
| 17 | Built-in CRM (7 statuses, notes, history) | ✅ | `models.Lead`, `routers/leads.py` (status history ⬜) |
| 18 | Dashboard pages (search/leads/detail/settings) | 🟡 | backend complete; frontend rewiring in progress |
| 19 | Exports (CSV, filtered, streamed) | ✅ | `routers/exports.py` (Markdown/PDF ⬜) |
| 20 | Performance & cost optimization (rules-first, cache, HTML hash) | 🟡 | HTML hash + usage metering ✅; result cache ⬜ |
| 21 | Background jobs (queue, progress, retry) | ✅ | `services/jobs.py` worker + `/jobs` API (create/list/get/cancel/retry); bulk audit runs as a job with live progress |
| 22 | Concurrency & throttling (rate limits, backoff) | 🟡 | bounded ThreadPool per job + per-domain concurrency config + timeouts; global rate limiter ⬜ |
| 23 | Database optimization (indexes, files outside DB) | ✅ | indexes on models; storage dir for files |
| 24 | Frontend optimization (server filtering/paging, virtualized) | 🟡 | API paginates/sorts; virtualized table ⬜ |
| 25 | Storage optimization (compression, cleanup) | ⬜ | planned |
| 26 | Reliability (graceful degradation, health checks) | ✅ | fallbacks throughout; `GET /api/health` |
| 27 | Security (key safety, SSRF, private-IP block, URL sanitize) | ✅ | `core/security.py`, never exposes keys to frontend |
| 28 | Account system (register/login/JWT/refresh/roles) | ✅ | `routers/auth.py` incl. email verification + password reset (`/forgot`, `/reset`) |
| 29 | Licensing system (types/statuses/limits) | ✅ | `models.License`, `services/plans.py`, admin |
| 30 | Device activation (limits, offline grace) | ✅ | `routers/licenses.py`, `models.Device` |
| 31 | Admin dashboard (create/revoke/suspend, users, usage) | ✅ | `routers/admin.py` (backend); admin UI ⬜ |
| 32 | User account dashboard (profile, license, devices, usage) | ✅ | `routers/account.py`, `routers/licenses.py` |
| 33 | Billing-ready architecture (Stripe/seats/usage) | ✅ | schema + limits ready; Stripe ⬜ (see OWNER_GUIDE) |
| 34 | Production architecture (FastAPI/SQLAlchemy/Alembic/Next) | ✅ | this repo |
| 35 | Plugin architecture (providers/integrations) | 🟡 | service seams (finder providers, AI providers) ✅ |
| 36 | Owner documentation | ✅ | `OWNER_GUIDE.md`, `QUICK_START_OWNER.md` |
| 37 | Developer experience (seed, reset, tests, .env.example) | ✅ | `app/seed.py`, `backend/tests/`, `.env.example` |
| 38 | UI/UX style (modern SaaS, dark mode, skeletons, cmd palette) | 🟡 | dark mode + skeletons ✅; command palette/shortcuts ⬜ |
| 39 | Core product goal (Find→Analyze→Connect→Close) | ✅ | end-to-end path works |
| 40 | Success targets (500/run, 10k+ leads, 100+ audits/day) | 🟡 | paginated + indexed + metered; load-tested at scale ⬜ |

## This phase delivered

- FastAPI backend (service-based) with Alembic migrations.
- Auth: register/login/logout, JWT access + refresh rotation, Argon2, roles.
- Licensing + device activation + daily plan-limit enforcement + usage metering.
- Deep deterministic audit across 9 categories with weighted, structured
  findings (weight · severity · reason · fix) and priority bands.
- Business finder (OSM + sample fallback, SerpApi seam) with dedup.
- Multilingual outreach: 6 variants × languages, template-based with Ollama hook.
- Competitor comparison, streamed CSV export.
- Admin + account APIs, health checks, SSRF protection.
- Docker Compose (frontend + backend + Ollama), owner docs, tests.

## Next phases (highest value first)

1. Rewire the Next.js frontend to the FastAPI backend (auth, finder, leads,
   lead detail, admin, settings) with TanStack Query + Zustand + shadcn/ui.
2. Playwright screenshot worker + background job queue (#5, #21).
3. Review collection + review intelligence (#6, #7) once a provider is chosen.
4. Result caching + storage cleanup + load testing (#20, #25, #40).
5. Email verification / password reset, admin UI, command palette.

The full original specification text is preserved verbatim in
[`docs/SPEC.md`](./SPEC.md).
