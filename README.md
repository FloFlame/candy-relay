# Leadly

The full **Leadly** application — a SaaS that helps agencies and freelancers
find weak local business websites and turn them into paying clients. This repo
contains both the marketing site and a genuinely functional product app.

> Find weak local websites. Turn them into paying clients.

Built with Next.js 14 (App Router), React 18, TypeScript and Tailwind CSS.
No external database or paid API is required — it runs self-contained.

## Features (all working, not mocked)

- **Auth** — email/password signup & login with scrypt-hashed passwords and
  httpOnly cookie sessions. `/app/*` is guarded server-side.
- **Business finder** — pulls local businesses by niche + city from **live
  OpenStreetMap data** (Nominatim geocode → Overpass query), with a
  deterministic sample fallback when the network is unavailable.
- **Real website audit engine** — actually fetches a prospect's site and scores
  it 0–100 across **speed, mobile, SEO, design and security**, producing a
  health score, an inverse opportunity score, and a concrete list of issues.
- **Opportunity scoring** — leads are ranked by opportunity (weaker site =
  hotter lead) across the dashboard and leads table.
- **Outreach email generator** — writes honest emails built from the real audit
  findings, in three tones (friendly / direct / formal).
- **Competitor analysis** — audits nearby businesses in the same trade + city
  and ranks the prospect against the market average.
- **Website screenshots** — an SVG site preview per lead (swap in a real
  screenshot service via `SCREENSHOT_API_URL`).
- **Lead pipeline** — CRUD leads, filter by status (New → Contacted → Replied →
  Won / Lost), notes, and a dashboard with pipeline + top opportunities.
- **CSV export** — download every lead with scores and status.
- **Public API v1** — token-authenticated `GET /api/v1/leads` and
  `GET /api/v1/audit?url=` (Bearer token from Settings).
- **Settings** — edit profile, switch plan (demo), reveal/copy/regenerate API
  token.
- Marketing site: landing page, `/privacy` (GDPR), dark mode, SEO
  (title/meta, Open Graph, JSON-LD, sitemap, robots), cookie consent.

## Pages

| Route | Description |
| ----- | ----------- |
| `/` | Marketing landing page |
| `/privacy` | Privacy, Cookies & GDPR |
| `/signup`, `/login` | Auth |
| `/app` | Dashboard (pipeline + top opportunities) |
| `/app/finder` | Business finder |
| `/app/leads` | Lead list (filter, bulk audit, export) |
| `/app/leads/[id]` | Lead workspace (audit, email, competitors, notes) |
| `/app/settings` | Profile, plan, API token |
| `/app/api` | API docs & CSV export |

## API

All app endpoints live under `/api/*` and use cookie auth. The public,
token-authenticated API:

```bash
# Run a live audit of any URL
curl "https://getleadly.net/api/v1/audit?url=example.com" \
  -H "Authorization: Bearer <your-token>"

# List your leads
curl https://getleadly.net/api/v1/leads \
  -H "Authorization: Bearer <your-token>"
```

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

Then open `/signup`, create an account, and use the finder.

## Build & run

```bash
npm run build
npm run start
```

## How data is stored

Data persists to a JSON file at `./data/leadly.json` (git-ignored), which is
fine for a single-process deployment. For multi-instance / serverless hosting,
swap `lib/store.ts` for Postgres, SQLite or your database of choice — the
accessor functions are the only thing callers depend on.

## Configuration

| Env var | Purpose |
| ------- | ------- |
| `LEADLY_DATA_DIR` | Override where the JSON store is written |
| `HTTPS_PROXY` | Honoured by server-side fetches (audit/finder) |
| `SCREENSHOT_API_URL` | Point the screenshot route at a real service |

## Notes

- The audit engine and business finder make real outbound requests. In
  restricted networks the finder falls back to sample data (flagged in the UI)
  and unreachable sites are scored as high-opportunity.
- The email generator is deterministic and needs no API key; to use an LLM,
  replace the body of `generateEmail()` in `lib/email.ts` with a provider call
  using `lead.audit.issues`.
