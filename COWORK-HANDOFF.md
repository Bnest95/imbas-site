# Imbas — Cowork Handoff

Paste everything below into the new Cowork window.

---

You're picking up the Imbas project mid-flight. Read this fully before doing anything.

## What Imbas is
Imbas is an AI accountability / behavioral-observability **company** — internally (NOT public), "a liberty product disguised as observability infrastructure": Mill's *On Liberty* applied to AI mediation, **signal not verdict**. It surfaces specific named mechanisms a model didn't volunteer — Omission, Framing Drift, Deflection — and lets the user decide; it never says the AI is "biased/wrong/lying." (NOTE: "Active Foreclosure" is a DEAD term, dropped weeks ago — never use it.) Public mission line: "We don't tell you what's true. But you deserve to decide for yourself."

The **Volunteer Gap** is Imbas's v1 flagship *measurement primitive* — one component of a four-divergence roadmap (surfacing → execution → self-report → reasoning-output), scored 0–3. It is NOT the company. Do not collapse Imbas into the Volunteer Gap; that conflation is the core positioning trap. Canonical framing lives in the Notion "Positioning & Brand Voice (Locked May 19)" and "Top Ideas Archive" pages — those are locked and authoritative; defer to them, don't edit them.

This repo is the company's static-HTML site (not yet live). Dark editorial aesthetic. Domain: imbaslabs.com (apex assumed, not yet pointed anywhere).

## Where everything lives
Project folder: `/Users/brendan/Documents/Claude/Projects/Imbas/`

Key files:
- `index.html` — landing page. The site source of truth.
- `styles.css` — single stylesheet (~210KB). No build step, no package.json.
- `workbench.html` — the "Try Imbas" workbench, served standalone. Loads React + ReactDOM + Babel from cdnjs and compiles inline. (Stays this way — Pass L gives this one page a relaxed CSP instead of precompiling.)
- `Workbench.jsx` — ESM reference copy of the component. `IMBAS_ENDPOINT` is now `"/api/repository"` (live ingest once deployed; graceful clipboard fallback if the endpoint is unreachable). The version that actually renders is inlined in `workbench.html`.
- `imbas-landing-cursor-passes.md` — the canonical Cursor-pass pack (Passes A–L + Notes). New passes get appended here in the same format.
- `DEPLOY.md` — deploy notes. Now records the ACTUAL shipped per-route CSP (see below), the optional strict-`'self'` hardening, missing icon assets, Ghost `/briefing` dependency, domain decision.
- `api/repository.js` — Vercel serverless ingest function. **Created and in the repo** (Brendan applied the endpoint pass). Writes one row to the Repository table; needs `AIRTABLE_TOKEN` env var set in Vercel before it works.
- `vercel.json` — security headers (per-route CSP). **NOT yet created** — it's Pass L in the cursor-pass pack, ready for Brendan to run.
- `COWORK-HANDOFF.md` — this file.

Airtable: base `appfxHraqlcpP1AAP`
- Cases table `tblf7c2RYUolaTVXJ` — the VALIDATED archive. **Never modify. Never add without Brendan's explicit sign-off.**
- Repository table `tblyPn1kp4PHbxTWz` (view `viwDdm8p1sjDWlmjT`) — the captured pool. 18 fields, currently empty, fully decoupled from Cases (plain-text case references, no linked records). This is where new workbench submissions will land once the endpoint is live. Triage Status flow: new → triaged → candidate_for_review → promoted / rejected / duplicate.

Notion: documentation lives in 7 pages — Methodology Journal, v1 Results, Positioning, Methodology (May 16), Competitive Landscape, Top Ideas Archive, v2 Capture Phase.

## What's done
- Hero frame fixed (TRY IMBAS is a clean centered ember pill, no leftover box). Applied + confirmed.
- Repository table created in Airtable (done directly — Cursor can't write Airtable).
- Endpoint pass applied: `api/repository.js` exists; `IMBAS_ENDPOINT` is wired to `/api/repository`.
- **CSP decision + audit (this session):** the strict `script-src 'self'` in the old DEPLOY.md would have broken the LIVE SITE on launch — every page has an inline `<script>` (nav menu; index also has scroll-reveal) and 5 pages have inline `style=` attributes. Audited all 16 pages + styles.css: no off-site images/iframes, no external CSS, no inline event handlers; only conflicts are those inline scripts/styles + the workbench's cdnjs/Babel. Decision: ship a per-route CSP via `vercel.json` (Pass L) — near-strict on every page (keeps `'unsafe-inline'` for the inline scripts/styles), with a relaxed block scoped to `/workbench.html` only (allows cdnjs + `'unsafe-eval'`). Precompiling the workbench was considered and rejected (adds a build step to a no-build site; the sandbox couldn't even run the build to verify it). DEPLOY.md now records this, plus the optional strict-`'self'` upgrade (externalize the inline JS into `/site.js`).

## Pending Cursor passes (written, NOT yet applied/committed by Brendan)
1. **Pass L** — create `vercel.json` (per-route security headers). In `imbas-landing-cursor-passes.md`.
2. **Subline delete** — remove the redundant `.hero__subhead-close` line in index.html (cosmetic, Brendan's call).

## What's next (in order)
1. Brendan runs the two pending passes above (Pass L + subline). Verify Pass L on a Vercel PREVIEW deploy with DevTools (headers don't apply to a local file open) — see the verification block in Pass L.
2. Brendan's own steps (Claude must NOT do these): create Vercel account + import repo; create an Airtable personal access token with write scope and set Vercel env vars (`AIRTABLE_TOKEN`, optionally `AIRTABLE_BASE` / `AIRTABLE_REPO_TABLE`); point imbaslabs.com DNS at Vercel.
3. Ghost `/briefing` must be live OR replaced with a static fallback; add favicon.ico, og-image.png, apple-touch-icon.png.
4. End-to-end test: submit through the live workbench → confirm a row lands in the Repository table.
5. Go live.
6. Later: a triage agent that reads new Repository candidates, checks the gap is real, dedups, stacks onto existing cases, sets `candidate_for_review` — and NEVER promotes (promotion to Cases is Brendan's manual call).

Brendan's immediate sequence: take the site to **Fable** for one final audit with the Fable model → check the workbench → then go live.

## Working rules (non-negotiable)
- **Workflow:** discuss/advise → Brendan hones → deliver as Cursor passes he runs himself. Do NOT edit index.html or other site files directly. (Workbench.jsx direct edits were previously authorized.)
- **Cursor-pass format:** match `imbas-landing-cursor-passes.md` exactly — a shared guardrail preamble, then each change as `## Pass X — title (risk tag)` followed by ONE self-contained paste-ready `>` blockquote. Every pass ends with: screenshot the rendered change (not the diff) before commit, one commit this change only, **and "do not commit until I approve."**
- **Never commit to git.** Brendan reviews and commits.
- **Airtable:** update format `{'fields': {...}, 'id': 'recXXX'}`, create format `{'fields': {...}}`, batch up to 13. Never modify the v1/validated data.
- **Don't** send emails/messages, post or publish anything, make purchases, permanently delete anything (archive instead), create accounts, enter credentials/secrets, or change DNS — those are Brendan's steps.
- **Default to Cursor passes for continuity.** Only do something directly if it's genuinely better done by Claude than Cursor (e.g. Airtable reads/writes, which Cursor can't do) — and say so first.
- Operator, not chat partner. Results first, not narration. Be concise. Don't fabricate — if you don't know, say so. Don't present opinion as assessment.
