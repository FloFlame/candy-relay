# Leadly — Full Specification (verbatim)

This is the authoritative product specification. Implementation status is
tracked in [`FEATURES.md`](./FEATURES.md).

## 1. Global Business Finder
Search for businesses anywhere in the world. Inputs: Location + Search term
(e.g. "Turnhout Belgium" / "dakwerker", or "Miami Florida" / "car detailing").
Find businesses via Google-Maps-style data through SerpApi or another provider.
Collected: business name, website, phone, address, city, country, coordinates,
category, Google rating, review count, source search query, Google Maps result
URL, website domain, and contact email if found later from the website. Support
any niche (roofers, electricians, garages, plumbers, dentists, restaurants, car
detailers, landscapers, HVAC, solar, or any custom term).

## 2. Lead Deduplication
Before saving, remove duplicates by: website domain, phone number, Google place
ID, business name + address, business name + city.

## 3. Website Detection
For every business check: has a website; reachable; redirects; final URL; HTTP
status; HTTPS enabled; domain validity; website errors; timeout errors.
Businesses with no website are strong opportunities.

## 4. Full Website Audit
Run a full A-to-Z audit covering **Technical** (HTTPS, redirects, status codes,
load time, page size, broken links, viewport, robots.txt, sitemap.xml, favicon,
canonical, language, cookie banner, analytics, Open Graph, Twitter cards,
schema/JSON-LD, image optimization, lazy loading, caching), **SEO** (title +
length, meta description + length, H1 count, H2/H3 structure, keyword relevance,
local keywords, service/location pages, internal links, alt text, structured
data, FAQ, content depth, GBP consistency, review signals), **Local SEO**
(address, phone, maps link/embed, service area, city/region, local keywords,
opening hours, contact details, reviews, location pages, NAP consistency),
**Conversion** (clear CTA, CTA above the fold, click-to-call, contact/quote
form, booking, WhatsApp/chat, sticky mobile CTA, trust badges, testimonials,
reviews, before/after, portfolio, pricing hints, guarantees, emergency info,
contact clarity), **Design** (first impression, outdated look, layout, whitespace,
typography, colors, contrast, button visibility, hierarchy, image/logo quality,
spacing, mobile layout, animations, hero strength, professional feel, brand
consistency — using screenshots/AI vision where possible), **Copywriting**
(headline clarity, service clarity, benefit-driven copy, too much/little text,
vague claims, trust language, local relevance, CTA wording, FAQ quality, review
usage, grammar), **Accessibility** (contrast, alt text, form labels, heading
hierarchy, keyboard focus, readable fonts, semantic HTML).

## 5. Screenshots
Capture with Playwright: desktop + mobile homepage, optional service/contact
pages. Stored as files outside the DB (DB stores paths). Used for design
scoring, before/after, reports, future AI redesigns.

## 6. Google Review Collection
Collect public review data when available: average rating, review count,
snippets, reviewer names, dates, language, positive highlights, negative
patterns, recurring keywords. **Never invent reviews.**

## 7. Review Intelligence
Use reviews to find website opportunities (e.g. "Fast service" → hero copy).
Outputs: testimonial ideas, trust badges, headline ideas, benefit bullets, FAQ
ideas, reputation insights — based only on real reviews.

## 8. Advanced Scoring System
Score 0–100. Lower = bigger opportunity. Priority: High 0–45, Medium 46–70, Low
71–100. Category scores: technical, SEO, local SEO, mobile UX, conversion,
visual design, copywriting, trust/reputation, accessibility, performance,
branding, content completeness. Each category: score, what's good, what's wrong,
why it matters, quick fixes, bigger improvement ideas.

## 9. Transparent Scoring Weights
Deterministic first; AI explains/rewrites but isn't required for the core score.
Each issue has weight, category, reason, severity, suggested fix. Users can
adjust weights per category.

## 10. Competitor Comparison
Compare weaker businesses against stronger competitors in the same
niche/location: better CTAs, reviews above the fold, better service pages,
faster sites, better trust signals, clearer quote forms, stronger local SEO.

## 11. AI Outreach Generator
Personalized messages from real findings. Languages: Dutch, English, French,
German, Spanish, Italian, Portuguese, Polish, Turkish, Arabic, Japanese, more
via config. Short, human, honest; mention only detected issues (2–4 findings);
offer a free homepage mockup; avoid spam/fake claims. Default Dutch CTA: "Mag ik
een voorbeeld doorsturen?"

## 12. Outreach Variants
Per lead: soft email, direct email, very short WhatsApp/SMS, LinkedIn DM,
follow-up after 3–5 days, optional second follow-up.

## 13. Multilingual System
Settings: UI language, outreach language, audit report language, per-lead
override. Localize greeting, tone, CTA, audit wording, suggestions, subjects.

## 14. AI Provider Modes
OFF (templates only), LOCAL_LIGHT (local AI for emails only), LOCAL_FULL (emails
+ review summaries + suggestions), API_PREMIUM (external API for top leads). AI
only after filtering.

## 15. Internal Local AI
Run local AI via Docker Compose (frontend, backend, Ollama). Backend talks to
Ollama internally; users don't install Ollama. Settings: AI_PROVIDER=ollama,
OLLAMA_BASE_URL, OLLAMA_MODEL=qwen2.5:7b. On startup: check reachable, check
model, pull if missing, fall back to templates. Use for outreach, multilingual
emails, review summaries, suggestions, headlines, CTA ideas, follow-ups. Not for
factual detection.

## 16. Website Improvement Suggestions
Per lead: better headline, CTA, hero structure, color/image improvements,
testimonial section from real reviews, FAQ, service/local-SEO page ideas, trust
badges, contact improvements, mobile sticky CTA.

## 17. Built-In CRM
Statuses: New, Audited, Contacted, Replied, Won, Lost, Ignored. Lead detail:
business info, website, phone, address, rating, reviews, audit results, category
scores, screenshots, emails, notes, status history, reports, suggested next
action.

## 18. Dashboard Pages
**Search** (location, term, language, #results, start). **Leads table** (name,
location, niche, website, rating, reviews, overall score, category summary,
priority, language, status, last audited; search, filters, sorting, pagination,
saved searches, status updates, bulk actions). **Lead detail** (info,
screenshots, overall + category scores, good/problems/quick wins/rebuild ideas,
reviews, insights, generated copy, outreach, report, competitor comparison;
copy/regenerate/change-language/export/mark buttons). **Settings** (SerpApi key,
AI mode, Ollama model, sender name, default language/locations/niches, score
weights, usage limits, cleanup).

## 19. Exports
All leads CSV, high-priority CSV, contacted CSV, won CSV, audit reports,
Markdown reports, future PDF. Filtered and streamed for large datasets.

## 20. Performance & Cost Optimization
Handle hundreds–thousands of leads/week. Rules first, AI only after filtering;
cache expensive results; never audit unchanged sites twice; batch jobs;
non-blocking UI; fast on a laptop. Pipeline: find → dedupe → cheap audits →
deterministic score → AI for filtered → screenshot/design AI for top → store.
Cache search results, HTML, HTML hash, screenshots, audits, reviews, AI outputs,
emails, suggestions, competitor comparisons.

## 21. Background Jobs
Job queue (SQLite-backed for V1; Celery/RQ/Redis-ready). Jobs: search, crawl,
audit, screenshots, reviews, AI email, AI suggestions, export. Frontend shows
progress, current step, failures, retry, cancel, logs.

## 22. Concurrency & Throttling
Process concurrently but safely: configurable rate limits, per-domain
throttling, timeouts, retries with backoff, skip repeatedly failing sites,
respect robots.txt.

## 23. Database Optimization
SQLite for V1, PostgreSQL-ready. Indexes: status, priority, score, city, niche,
domain, last audited, created. Store screenshots/reports/exports outside DB
(paths in DB). Structured audit findings.

## 24. Frontend Optimization
Server-side filtering/sorting/pagination, TanStack Query caching, optimistic
status updates, lazy-loaded screenshots/reports, virtualized tables, fast with
10,000+ leads.

## 25. Storage Optimization
Compressed screenshots, screenshot history limit, cleanup settings, delete old
screenshots after X days, keep latest audit or full history, archive old leads.

## 26. Reliability
Degrade gracefully: AI fails → templates; screenshots fail → continue text
audit; reviews fail → continue; one site fails → continue batch. Health checks:
backend, frontend, database, Ollama, SerpApi. Structured logs, error categories,
retryable vs non-retryable.

## 27. Security
Store API keys safely; never expose to frontend; sanitize URLs; prevent unsafe
crawling/SSRF; block localhost/private IP ranges; allow only HTTP/HTTPS; validate
redirects; request size limits; escape untrusted website text in the frontend.

## 28. Account System
Register, login, logout, email verification, forgot/reset password, remember me,
JWT access + refresh tokens, secure sessions, future Google/Microsoft login.
Argon2 (bcrypt acceptable). Roles: owner, admin, user.

## 29. Licensing System
Every account needs a valid license; without one the app is unusable. Types:
trial, monthly, annual, lifetime, enterprise. Statuses: trial, active, expired,
suspended, revoked, invalid. Plan limits: searches/day, audits/day, AI
generations, screenshots, exports, competitor comparisons, review collection,
languages, users, devices, API integrations.

## 30. Device Activation
Store device ID, name, OS, activation date, last online, last validation.
Limits e.g. Starter 1, Professional 3, Enterprise unlimited. Users can
deactivate old devices. Support temporary offline validation (e.g. 7 days).

## 31. Admin Dashboard
Owner/Admin: create/revoke/suspend licenses, activate/deactivate users, reset
passwords, manage plans/limits, view devices/activations/usage, search accounts,
export users.

## 32. User Account Dashboard
Manage profile, change password, view license, activate license, view
subscription, view/deactivate devices, see usage limits, manage API keys.

## 33. Billing-Ready Architecture
Structure for Stripe, subscriptions, seat-based and usage-based billing, teams,
organizations, white-label licensing (payments not implemented yet).

## 34. Production Architecture
Backend: FastAPI, SQLAlchemy, Alembic, Pydantic, service-based. Frontend:
Next.js, React, TypeScript, TailwindCSS, shadcn/ui, TanStack Query, Zustand.
Desktop-ready (Tauri; backend as embedded local service, not a Python EXE).
Deployment-ready: local desktop, web SaaS, future mobile backend, internal
agency tool. Everything through REST APIs.

## 35. Plugin Architecture
Easy future modules: CRM integrations, Gmail, Outlook, WhatsApp, Stripe, PDF,
AI providers, new audit engines, additional scraping/search providers, new
languages, competitor analysis modules.

## 36. Owner Documentation
OWNER_GUIDE.md and QUICK_START_OWNER.md (install, .env, start services, reset
DB, migrations, first owner, test login/activation, Tauri packaging, per-OS
builds, license management, device management, SQLite→Postgres, deploy SaaS,
domains, HTTPS, Stripe, troubleshooting).

## 37. Developer Experience
Clear logs, demo mode, fake sample leads, seed command, reset DB command, tests
for scoring/audit, README on performance modes, .env.example, Docker Compose.

## 38. UI/UX Style
Serious modern SaaS (Linear/Notion/Vercel/Cursor/Raycast): modern dashboard,
dark + light mode, responsive, smooth animations, loading skeletons, toasts,
keyboard shortcuts, command palette, searchable tables, beautiful lead detail.

## 39. Core Product Goal
Help agencies/freelancers Find → Analyze → Connect → Close. Find businesses,
analyze weaknesses, generate personalized outreach, turn them into clients.

## 40. Success Targets
Comfortably handle 500 leads/run, 5,000+ stored leads, 100+ audits/day on a
normal laptop, 10,000+ leads in dashboard, AI only for selected high-value
leads, local AI without API bills.
