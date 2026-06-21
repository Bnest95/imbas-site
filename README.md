# Imbas

Imbas is an independent AI behavioral measurement company. The public site documents observed frontier AI surfacing behavior, the Volunteer Gap methodology, a case archive, and supporting pages for readers, researchers, and institutions.

## Static site

This repo is mostly a **static HTML/CSS site** with small inline JavaScript. There is **no site-wide build step** and no framework.

The **Workbench** (`/workbench.html`) is the one compiled surface: source lives in `workbench-app.jsx`, output in `workbench.bundle.js`. See [DEPLOY.md — Workbench build](DEPLOY.md#workbench-build) before editing Workbench logic.

## Run locally

From the repo root:

```bash
python3 -m http.server 8765
```

Then open [http://localhost:8765/](http://localhost:8765/).

## Main routes

| Route | File |
|-------|------|
| `/` | `index.html` |
| `/archive.html` | Case Archive |
| `/volunteer-gap.html` | The Volunteer Gap |
| `/how-it-works.html` | How It Works |
| `/methodology.html` | Methodology |
| `/institutions.html` | For Institutions |
| `/for-readers.html` | For Readers |
| `/public-interest.html` | Public Interest |
| `/faq.html` | FAQ |
| `/contact.html` | Contact |
| `/privacy.html` | Privacy Policy |
| `/terms.html` | Terms of Use |
| `/accessibility.html` | Accessibility Statement |
| `/case/005.html` | Case 005 |
| `/workbench.html` | Workbench (precompiled bundle) |
| `/404.html` | Not found (configure host to serve with HTTP 404) |
| `/robots.txt` | Crawler rules |
| `/sitemap.xml` | Sitemap |

## Field Notes signup

Field Notes signup posts to **`/api/field-notes-signup`** (Vercel serverless → Airtable). Legacy **`/briefing`** URLs redirect to **`/field-notes/`**.

## Missing launch assets

These files are referenced by the site but are **not yet in the repo**:

- `favicon.ico`
- `og-image.png`
- `apple-touch-icon.png`

`favicon.svg` is present.

## Deploy

**Deploy tracked files only** — from git or an explicit allowlist. Do not upload the whole project folder.

Do not deploy: `pass14-screenshots/`, `pass15-screenshots/`, `.DS_Store`, `node_modules/`, local server files, scratch files, or unapproved assets.

Full deploy notes: [DEPLOY.md](DEPLOY.md).

## Security headers

Security headers (CSP, HSTS, `X-Content-Type-Options`, etc.) belong at the **host or CDN layer**, not in this static repo. See [DEPLOY.md](DEPLOY.md) for recommended values.

## Known launch blockers

Before public share:

1. **Field Notes API env vars** — set `AIRTABLE_TOKEN` and `AIRTABLE_FIELD_NOTES_TABLE` on Vercel, or signup forms return unconfigured
2. **Missing assets** — `favicon.ico`, `og-image.png`, `apple-touch-icon.png`
3. **Deploy hygiene** — use tracked files only; exclude screenshot folders and junk on disk
4. **HTTPS + security headers** — configure at host/CDN; enable HSTS only after HTTPS is confirmed
5. **404 host config** — serve `404.html` with HTTP 404 for unknown paths
6. **Domain redirect** — decide www vs apex (`imbaslabs.com` assumed in canonical/sitemap)
