# Imbas deploy notes

## Deploy only tracked files

Deploy from git or an explicit allowlist. Do not upload the whole project folder.

Do not deploy:

- pass14-screenshots/
- pass15-screenshots/
- .DS_Store
- node_modules/
- local server files
- scratch files
- unapproved assets

## Static site

No build step required. The site is static HTML/CSS with small inline JS.

## Required external dependency before public launch

Ghost must be configured at /briefing, or /briefing links/forms must be replaced with a temporary static fallback.

Required Ghost items:

- /briefing route
- Members API
- labels: early-access, field-notes
- unsubscribe behavior
- real post slugs or redirects for /briefing/post-1, /post-2, /post-3
- rate limiting / spam monitoring

## Missing launch assets

Still needed:

- favicon.ico
- og-image.png
- apple-touch-icon.png

## Hosting headers

Platform: Vercel. Headers ship in `vercel.json` (repo root). CSP is per-route: a
near-strict policy on every page, plus a relaxed block scoped to `/workbench.html`
only (it loads React/Babel from cdnjs and compiles in the browser, which needs
`'unsafe-eval'` + cdnjs).

Note: the site embeds an inline `<script>` on every page (nav menu; index also has
scroll-reveal) and a few inline `style="..."` attributes, so the shipped policy
includes `'unsafe-inline'` for script and style. This is a deliberate downgrade from
a pure `script-src 'self'`. To recover strict `script-src 'self'` later: externalize
the per-page inline script into a self-hosted `/site.js` (`<script src="/site.js"
defer>`) and convert the inline `style=` attributes to classes, then drop
`'unsafe-inline'` from script-src. Not required for launch.

Values below are the GLOBAL (non-workbench) policy. The workbench block is the same
but with `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com`.

Content-Security-Policy:

```
default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self' https://imbaslabs.com/briefing/members/api/send-magic-link
```

X-Content-Type-Options:

```
nosniff
```

Referrer-Policy:

```
strict-origin-when-cross-origin
```

Permissions-Policy:

```
camera=(), microphone=(), geolocation=(), payment=()
```

Strict-Transport-Security:

```
max-age=31536000; includeSubDomains
```

HSTS is intentionally NOT in the initial vercel.json. Add it only after the custom
domain serves HTTPS cleanly on Vercel — HSTS pins browsers and is hard to undo if the
cert/DNS cutover hiccups.

## Domain

Canonical and sitemap currently use:

```
https://imbaslabs.com/
```

Decide whether www redirects to apex or apex redirects to www before launch. Current metadata assumes apex.

## 404 page

`404.html` is included in the repo for host configuration. Configure the host to serve it with HTTP status 404 for unknown paths. Do not add `404.html` to `sitemap.xml` — error pages should not be indexed.
