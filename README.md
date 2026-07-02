# Leadly — marketing site

Marketing website for **Leadly**, a SaaS product that helps agencies and
freelancers find weak local business websites and turn them into paying
clients. Built with Next.js (App Router), TypeScript and Tailwind CSS.

> Find weak local websites. Turn them into paying clients.

## What's on the page

The single-page site follows the product's own workflow and was built from a
content audit of getleadly.net:

- **Hero** with a live-style audit preview (0–100 opportunity score).
- **Journey** — the four-step Find → Analyse → Connect → Close workflow.
- **Features** — all eight "Inside Leadly" capabilities.
- **Testimonials** — social proof from agencies and freelancers.
- **Pricing** — Trial, Starter (€25/mo), Professional (€65/mo) and Lifetime
  (€375 one-time), plus an Enterprise strip.
- **About**, **Resources**, **FAQ** and a closing call-to-action.
- **/privacy** — Privacy, Cookies & GDPR page.

### Audit weaknesses addressed

The original audit flagged several gaps; this build fixes them:

| Audit weakness                     | Fix in this site                                            |
| ---------------------------------- | ---------------------------------------------------------- |
| Limited social proof               | Testimonials section + a stats/trust bar                   |
| Missing About / company info       | Dedicated **About** section and footer company links       |
| No cookie banner / privacy notice  | Consent `CookieBanner` + full `/privacy` (GDPR) page        |
| Bare `Leadly` page title, weak SEO | Descriptive title/meta, Open Graph, JSON-LD, sitemap, robots |
| No resources / blog                | **Resources** section with article cards                   |
| No GDPR / compliance mention       | GDPR rights, retention and lawful-basis copy on `/privacy` |
| No dark mode                       | System-aware **dark mode** toggle (no flash of wrong theme) |
| Accessibility unclear              | Skip link, focus-visible rings, ARIA labels, semantic HTML |

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

## Build

```bash
npm run build
npm run start
```

## Tech

- [Next.js 14](https://nextjs.org/) App Router
- [React 18](https://react.dev/)
- [Tailwind CSS 3](https://tailwindcss.com/)
- TypeScript

All marketing copy lives in [`lib/content.ts`](lib/content.ts) so it can be
edited in one place.
