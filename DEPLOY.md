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

Most pages are static HTML/CSS with small inline JS. **Vercel does not currently run a build step** for this site.

The Workbench is the one exception: it ships a precompiled JavaScript bundle (see **Workbench build** below). Everything else deploys as-is from git.

## Workbench build

The live Workbench UI is compiled from source into a static bundle. **`workbench.bundle.js` is committed as a static artifact** — Vercel serves it directly; it is not rebuilt on deploy.

If the bundle is stale (source edited but not rebuilt), Workbench behavior may not match `workbench-app.jsx`.

When changing Workbench logic or copy:

1. Edit `workbench-app.jsx`
2. Run `npm run build:workbench`
3. Commit `workbench-app.jsx` and `workbench.bundle.js`
4. Run `node qa-screenshots-case-structure-fix/final-check.mjs`
5. Run `node qa-screenshots-case-structure-fix/metadata-check.mjs`

First-time or after pulling changes that touch `package.json`:

```bash
npm install
npm run build:workbench
```

Source of truth: `workbench-app.jsx` (extracted from the former inline JSX in `workbench.html`). Do not edit `Workbench.jsx` unless diffed against `workbench-app.jsx` first — it may be stale.

Build script: `scripts/build-workbench.mjs` (esbuild; React and ReactDOM remain CDN externals).

## Reader inference security (rate limits + spend ceiling)

`POST /api/read` calls Anthropic Opus and is public. Durable abuse controls live in
`api/reader-security.js` and activate when both Upstash env vars are set on Vercel.

Required for **durable** cross-instance protection (recommended before traffic):

- `UPSTASH_REDIS_REST_URL` — from Upstash console → Redis database → REST API
- `UPSTASH_REDIS_REST_TOKEN` — same screen

Provisioning Upstash through the **Vercel Marketplace** instead injects
`KV_REST_API_URL` / `KV_REST_API_TOKEN`. Vercel marks these integration values write-only,
so they can't be read back via `vercel env pull` and can't be hand-copied into the
`UPSTASH_*` names. The security module therefore auto-detects the `KV_REST_API_*` names as
a fallback (see `reader-security.js`); set the `UPSTASH_*` names only when you want to
override the injected pair.

Upstash free tier is sufficient at current scale (10k commands/day). No npm package is
required; the serverless functions call the REST API directly.

Without any of these vars, Reader falls back to **per-instance in-memory** rate/spend counters
(same class of weakness as before). Logs emit `reader_security` events with
`action: memory_fallback` once per cold start.

Existing Reader env vars (unchanged):

- `READER_API_KEY` — Anthropic key
- `READER_ENABLED` — `"0"` manual kill switch (returns honest fallback, no inference)
- `READER_SPEND_CEILING_USD` — optional monthly estimated spend cap (default `8`)

Setup:

1. Create a free Upstash Redis database — either via the Vercel Marketplace (Storage →
   Upstash, which wires `KV_REST_API_*` into the project automatically) or standalone at
   the Upstash console (any region close to the Vercel deployment).
2. Marketplace path: nothing to copy — the integration injects the vars for the environments
   you select. Standalone path: copy REST URL + token into the project's Production (and
   Preview) env under the `UPSTASH_*` names.
3. Redeploy. Confirm Vercel logs show a `reader_security` `inference_usage` event carrying
   `durable_spend: true` and `durable_rate: true` after a test read. (The `rate_limited` and
   `spend_ceiling` events only carry `durable: true` when they actually block a request.)

## Field Notes signup

Homepage, For Readers, and `/field-notes/` collect email via **`POST /api/field-notes-signup`**. The route writes to Airtable using the same token pattern as `/api/repository`.

Required Vercel env vars:

- `AIRTABLE_TOKEN` — personal access token with read/write on the base
- `AIRTABLE_FIELD_NOTES_TABLE` — table ID for Field Notes signups

Optional:

- `AIRTABLE_BASE` — defaults to `appfxHraqlcpP1AAP`

Create an Airtable table with fields: **Email**, **Source Page**, **Created At**, **User Agent** (optional). Until both env vars are set, the API returns `{ ok: false, error: "unconfigured" }` and the form shows a quiet fallback message.

## Missing launch assets

Still needed:

- favicon.ico
- og-image.png
- apple-touch-icon.png

## Hosting headers

Platform: Vercel. Headers ship in `vercel.json` (repo root). CSP is per-route: a
near-strict policy on every page, plus a workbench-specific block scoped to
`/workbench.html` (allows cdnjs for React/ReactDOM CDN scripts).

Note: the site embeds an inline `<script>` on every page (nav menu; index also has
scroll-reveal) and a few inline `style="..."` attributes, so the shipped policy
includes `'unsafe-inline'` for script and style. This is a deliberate downgrade from
a pure `script-src 'self'`. To recover strict `script-src 'self'` later: externalize
the per-page inline script into a self-hosted `/site.js` (`<script src="/site.js"
defer>`) and convert the inline `style=` attributes to classes, then drop
`'unsafe-inline'` from script-src. Not required for launch.

Values below are the GLOBAL (non-workbench) policy. The workbench block is the same
but with `script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com` (no
`'unsafe-eval'` — Workbench JSX is precompiled to `/workbench.bundle.js`).

Content-Security-Policy:

```
default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
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
