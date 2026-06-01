# Imbas

Imbas is an independent AI behavioral measurement project. The public site documents observed frontier AI surfacing behavior, the Volunteer Gap methodology, a case archive, and supporting pages for readers, researchers, and institutions.

## Static site

This repo is a **static HTML/CSS site** with small inline JavaScript. There is **no build step**, no bundler, and no package manager required to run or deploy the site.

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
| `/404.html` | Not found (configure host to serve with HTTP 404) |
| `/robots.txt` | Crawler rules |
| `/sitemap.xml` | Sitemap |

## Ghost dependency

Field Notes and email signup depend on **Ghost** served at **`/briefing`**:

- Nav and footer links to `/briefing`
- Homepage signup forms POST to `/briefing/members/api/send-magic-link`
- Sample post links: `/briefing/post-1`, `post-2`, `post-3`

Ghost must be configured before public launch, or `/briefing` links and forms need a temporary static fallback. See [DEPLOY.md](DEPLOY.md) for required Ghost setup.

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

1. **Ghost at `/briefing`** — or hide/replace Field Notes links and signup forms until live
2. **Missing assets** — `favicon.ico`, `og-image.png`, `apple-touch-icon.png`
3. **Deploy hygiene** — use tracked files only; exclude screenshot folders and junk on disk
4. **HTTPS + security headers** — configure at host/CDN; enable HSTS only after HTTPS is confirmed
5. **404 host config** — serve `404.html` with HTTP 404 for unknown paths
6. **Domain redirect** — decide www vs apex (`imbaslabs.com` assumed in canonical/sitemap)
