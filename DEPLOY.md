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

**Staleness guardrail:** `npm run check:workbench` (also run inside `npm test` via
`test/workbench-bundle.test.mjs`) rebuilds `workbench-app.jsx` in memory and compares the
SHA-256 against the committed `workbench.bundle.js`. A mismatch exits non-zero and fails the
test suite loudly. Both use the shared esbuild config in `scripts/workbench-build-config.mjs`,
so the check and the real build can't drift. A comment/whitespace-only edit that doesn't change
the minified output is intentionally treated as in-sync.

When changing Workbench logic or copy:

1. Edit `workbench-app.jsx`
2. Run `npm run build:workbench`
3. Commit `workbench-app.jsx` and `workbench.bundle.js`
4. Run `npm test` (or `npm run check:workbench`) to confirm the bundle is in sync
5. Run `node qa-screenshots-case-structure-fix/final-check.mjs`
6. Run `node qa-screenshots-case-structure-fix/metadata-check.mjs`

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

## Reader runtime observability

`POST /api/read` emits structured `reader_runtime` JSON logs (one line per event) for every
major execution step. Search Vercel function logs for `"event":"reader_runtime"`.

**Quick health check:** `GET /api/reader-health` returns non-sensitive status (`mode`:
`ready` | `degraded` | `disabled`, store/key/capture configured flags, timestamp). No secrets,
tokens, or user data.

### Normal successful run (agent path)

Typical event chain for one request (same `request_id` throughout):

1. `request_received`
2. `inference_started` → `inference_succeeded` (includes `inference_duration_ms`, token counts)
3. `parse_succeeded`
4. `capture_started` → `capture_succeeded` (or `capture_failed` if Airtable write fails)
5. `response_returned` (`source: "agent"`, `duration_ms`)

Also expect occasional `reader_security` events from `reader-security.js` when Redis is
unavailable (`store_unavailable`, `action: memory_fallback`).

### Degraded execution signals

| Log type | Meaning |
|----------|---------|
| `fallback_returned` | User got honest placeholder, not agent read (`reason`: `disabled`, `no_key`, `api_error`, `network`, `bad_json`) |
| `inference_failed` | Anthropic call failed; check `upstream_status` or `failure_class` |
| `parse_failed` | Model returned unparseable JSON (`parse_error_class`, `model_text_len` only — no raw output) |
| `capture_failed` | Reader Runs row not written; user still got 200 (`user_response_returned: true`) |
| `security_rejected` | Rate limit or spend ceiling (`reason`: `rate_limited`, `spend_ceiling`) |
| `validation_rejected` | Bad input (`reason`: `empty`, `too_long`, `body_too_large`, etc.) |

### What to do

- **`inference_failed` spike** — Check Anthropic status, `READER_API_KEY` scope, Vercel env on Production. Note `request_id` from error JSON if user reports a problem.
- **`parse_failed` spike** — Model output shape drift; inspect frequency, not log content (privacy). Fallback reads are honest but thin.
- **`capture_failed`** — Check `AIRTABLE_TOKEN` permissions on base `appfxHraqlcpP1AAP`, Reader Runs table `tblqmHiOCQ5YSXBN3`. Reads still work; only logging is affected.
- **`security_rejected` + `store_error: true`** — Upstash/KV unreachable; rate limits may fail closed. Verify `KV_REST_API_*` or `UPSTASH_REDIS_REST_*` on Vercel.
- **`security_rejected` + `reason: spend_ceiling`** — Monthly cap hit (`READER_SPEND_CEILING_USD`, default 8). Raise cap or wait for month rollover.
- **`reader_security` + `memory_fallback`** — Durable store not configured or down; per-instance counters only. Fix Redis env vars and redeploy.
- **`/api/reader-health` `mode: degraded`** — Missing model key and/or durable store; inspect flags before traffic.

Error responses (400/429) include `request_id` for correlation. They do not include stack traces,
provider bodies, or user content.

## Reader Runs capture fields (provenance)

`POST /api/read` writes one row per read to **Reader Runs** (`tblqmHiOCQ5YSXBN3`, base
`appfxHraqlcpP1AAP`). Alongside the original capture fields (`Question`, `Answer`, `The Read`,
`Completeness`, `What Was Left Out`, `How It Was Shaped`, `Inspection Note`, `Source`, `Created`),
the capture writes these **additive provenance fields**. All are **single line text** and were
created on this base on 2026-07-03 (via the Airtable schema API, not auto-created by the write):

| Field | Source | Notes |
|-------|--------|-------|
| `Request ID` | server-side `ctx.request_id` (16 hex) | Ties the row to the `reader_runtime` logs for the same run |
| `Reader Model` | `MODEL` constant (`claude-opus-4-7`) | The configured Reader model |
| `Reader Prompt Version` | `READER_PROMPT_VERSION` (`reader.v1`) | Bump when `SYSTEM_PROMPT` / output contract changes |
| `Topic` | request `case.topic` | Empty when the request carries none |
| `Anchor` | request `case.anchor` | Empty when the request carries none |
| `Inspected AI Model` | request `inspected_model` (Workbench model select) | Empty when unknown; no new UI, no user requirement |
| `Source Content Hash` | SHA-256 hex of `open_question` + "\n" + `answer` | Deterministic source fingerprint |
| `Reader Output Hash` | SHA-256 hex of the output (fixed key order: completeness, the_read, what_was_left_out, how_it_was_shaped, inspection_note, source) | Deterministic read fingerprint |

**Manual creation (fresh base / new environment):** if you point the Reader at a base where these
fields do not yet exist, create all eight as **single line text** fields on the Reader Runs table
before deploying. Airtable's `typecast: true` coerces values but does **not** create fields — a POST
naming a nonexistent field returns **HTTP 422 `UNKNOWN_FIELD_NAME`** and fails the whole row.

**Fail-safe:** a missing field never breaks a read. The write is fail-safe (`captureRun`) and runs
after the 200 body is prepared, so the user still gets their inspection; the failure surfaces as a
`capture_failed` log with `failure_class: "airtable_http"`, `upstream_status: 422`, and
`user_response_returned: true`. Reads continue in **degraded capture mode** until the fields exist.

**Verification procedure (after deploy):**
1. Deploy to Production and run **one** controlled inspection through the live Workbench (never loop `/api/read` — each call spends real model budget).
2. In Vercel function logs, filter `"event":"reader_runtime"` and confirm the run ends with `capture_succeeded` (not `capture_failed`). Success logs also carry presence booleans: `request_id_present`, `reader_model_present`, `prompt_version_present`, `source_content_hash_present`, `reader_output_hash_present` — all `true`. Hash **values** are never logged.
3. Open the newest Reader Runs row and confirm the eight fields above are populated (`Request ID` matches the run's `request_id`; both hashes are 64 hex chars). Do not export or publish row contents or user answer text.

**Prompt-version guardrail.** `Reader Prompt Version` is only trustworthy if it changes whenever
the prompt changes. `test/reader-prompt-version.test.mjs` enforces this: it pins
`READER_PROMPT_VERSION` to a SHA-256 fingerprint of `SYSTEM_PROMPT` (both now exported from
`api/read.js`) through a `KNOWN_FINGERPRINTS` registry. Any edit to `SYSTEM_PROMPT` changes the
fingerprint and fails `npm test` until someone deliberately (1) bumps `READER_PROMPT_VERSION`
(e.g. `reader.v1` → `reader.v2`) and (2) registers the new version's fingerprint in that file. So a
prompt change can't ship while silently mislabelling every capture with the old version tag. The
test imports the two constants only — no model call, no Airtable, no spend — and never prints the
prompt text.

## Case lineage + review-state fields

Two additive fields close the pipeline's **public-case ↔ source-capture linkage** and **explicit
review-state** gaps. They are **populated during review/promotion — by hand or via the internal
`promote-candidate` CLI (below)** — and **no serverless function writes them**, so there is no
runtime dependency and no automated-publication path. Created on base `appfxHraqlcpP1AAP` on
2026-07-03 via the Airtable schema API.

| Table | Field | Type | Purpose |
|-------|-------|------|---------|
| Cases (`tblf7c2RYUolaTVXJ`) | `Source Candidate ID` | single line text | Back-link to the Repository `Candidate ID` a case was promoted from. Mirrors Repository's `Promoted To Case` for a bidirectional, plain-text (non-linked-record) lineage trail. Empty for legacy / hand-authored cases. |
| Repository (`tblyPn1kp4PHbxTWz`) | `Reviewed At` | dateTime (ISO / `utc`) | Timestamp of the review decision. Completes the explicit review transition with existing `Triage Status` (state + terminal decision) and `Reviewed By` (reviewer). Empty until reviewed. |

**Tracing a public case's lineage + review:** from a Case row, `Source Candidate ID` → the Repository
candidate; that candidate carries `Triage Status` (`promoted` / `rejected` / `duplicate` = the
decision), `Reviewed By` (who), and `Reviewed At` (when). The reverse edge
(`Repository.Promoted To Case` → Case) already existed.

**Writer — the internal `promote-candidate` CLI, not a serverless route.** The `/api` request path
still never writes these fields: `api/repository.js` sets `Triage Status: new` at intake and does
**not** touch `Reviewed At` (a fresh candidate is unreviewed) or the Cases table (it never has).
Promotion is instead recorded by a human-run helper, `scripts/promote-candidate.mjs` — Brendan runs
it by hand at promotion time; there is no automatic, scheduled, or request-triggered path, so the
no-automated-publication guarantee holds. Given an **already-created** Case, it looks up both rows
first, then writes only:

- Repository (found by `Candidate ID`): `Reviewed At` = now, `Triage Status` = `promoted`,
  `Promoted To Case` = `<case>`, and `Reviewed By` when `--by` is passed;
- Cases (found by `Case ID`): `Source Candidate ID` = `<candidate>`.

It fails safely with no writes if either ID is missing or ambiguous, reads both rows back to verify
the write, requests only ID/state columns (never answer, prompt, or email content), and reads the
token from `AIRTABLE_TOKEN` in the environment (never printed, never committed). It never creates a
case, publishes, scores, or validates. Run a `--dry-run` first (it looks up both rows and prints the
planned writes without changing anything), then the real write:

```
# dry run — resolves both rows, writes nothing:
AIRTABLE_TOKEN=… node scripts/promote-candidate.mjs --candidate CAND-abc12 --case 005 --dry-run
# real write (optionally record the reviewer):
AIRTABLE_TOKEN=… node scripts/promote-candidate.mjs --candidate CAND-abc12 --case 005 --by "Brendan Nestor"
```

Mapping/validation logic is unit-tested with no live Airtable calls (`test/promote-candidate.test.mjs`).

**Manual creation (fresh base / new environment):** create `Source Candidate ID` as single line text
on Cases, and `Reviewed At` as a dateTime field (ISO date, 24-hour, `utc` time zone) on Repository.
Nothing deploys or breaks if they are absent — they are only read/written by hand in the Airtable UI.

**Verification (schema-presence, not a runtime probe):** because these are human-populated, confirm
the fields exist on the live base rather than firing a request. Via `get_table_schema` (or the
Airtable UI): Cases `Source Candidate ID` = singleLineText (`fldCroOvdzKqBakID`); Repository
`Reviewed At` = dateTime/`utc` (`fldIcFUw168lY4QtF`). Do **not** write probe rows into the validated
Cases archive.

## Pipeline metrics (read-only)

`npm run metrics` (`scripts/imbas-metrics.mjs`) prints a one-screen count of the data layer so the
pipeline's state can be checked at a glance without opening Airtable:

- **Cases** — total, Severity coverage (`X / total`), and the exact Case IDs still missing a
  Severity score. Intentionally-unscored **controls are listed separately** so a baseline item is
  never counted as a scoring gap. Controls are detected from live data — a Case whose `Name` carries
  the parenthetical `(control…)` / `(CONTROL)` annotation — not from a hardcoded ID list, so the rule
  follows the naming convention (and the report prints the excluded control IDs, so a
  misclassification is visible, not silent).
- **Repository** — triage-status distribution (how many candidates sit at each stage).
- **Reader Runs** — total, and how many carry provenance (both `Reader Prompt Version` and
  `Source Content Hash` present), as a count and rate.

It is **read-only**: Airtable GETs only, never a PATCH/POST/DELETE. It requests only the few fields
each metric needs, follows offset pagination, and **never prints captured content** — no prompts,
answers, emails, or hash values (provenance is a presence count; hash strings are tested for presence
and discarded). It reads `AIRTABLE_TOKEN` from the environment (needs `data.records:read`); with no
token it exits non-zero and makes no request. Exit codes: `0` ok, `2` bad usage, `3` missing token,
`1` runtime / Airtable error.

Classification/aggregation logic is unit-tested with no live Airtable calls
(`test/imbas-metrics.test.mjs`).

## As-submitted snapshot integrity (read-only)

`npm run check:snapshots` (`scripts/check-submission-snapshots.mjs`) verifies that the archived
as-submitted grant artifacts still match what was recorded when they were saved. It reads a
hand-maintained ledger, `grant-engine/applications/submissions-ledger.json`, and for every entry
marked `snapshot_present` it **recomputes the sha256 of each artifact file and asserts it still
matches the recorded hash** — making the snapshots tamper-evident. Entries marked
`submission_version_unknown` are listed as **open gaps for human review, not failures**: the honest
state of a hand submission is often "we know it was submitted, we can't prove which byte-exact draft
went out," and the script never fabricates a snapshot or copies a live draft to fill a gap.

It is **read-only**: it hashes the ledgered files and writes nothing — no network, no Airtable, no
Gmail. It never prints artifact contents and never prints hash values; a mismatch is reported by
filename and reason only. `grant-engine/` is local scratch and is **not committed**, so a fresh
checkout has no ledger — that is not an error: the script says so and exits `0`. Exit codes: `0` ok
(all present artifacts verify, or no ledger to check), `2` bad usage, `1` runtime (ledger unreadable
/ invalid JSON), `4` check failed (a snapshot artifact is missing or its hash no longer matches, or
the ledger is internally inconsistent).

Integrity logic is unit-tested with synthetic in-memory fixtures — no dependency on the uncommitted
`grant-engine/` files (`test/check-submission-snapshots.test.mjs`).

## Grant Tracker reconciliation (evidence → operational fields)

`npm run reconcile:grants` (`scripts/grant-reconcile.mjs`) turns **body-free** funder-reply evidence
into a minimal, idempotent set of operational-field updates on the Grant Tracker
(`tbllp4STmYOafMWy3`, base `appfxHraqlcpP1AAP`). It answers, per grant: did we submit, when, is the
submission email-confirmed, did the funder reply, what kind of reply, is an action owed — and routes
everything it is not confident about to human review instead of writing a guess.

**Why a pure engine, not a cron.** Gmail is only reachable through the agent's read-only MCP; there is
**no Gmail credential in the CLI/serverless environment**, so nothing here can autonomously scan a
mailbox. The shippable artifact is therefore a **pure, tested reconciliation core**: the agent (or any
future credentialed run) does the Gmail read, distills each thread into a small body-free evidence
record, and feeds the engine three JSON inputs plus a field map. The engine classifies, matches, and
plans; it never reads mail itself. Writes are applied either by the agent over the Airtable MCP or by
the script's own `--apply` REST path.

**Inputs (all body-free JSON, all live in uncommitted `grant-engine/reconcile/`):**

- `--evidence` — one record per grant: `grant_key`, `funder`, `record_id`, `submitted_date`,
  `source` (`gmail` | `none`), `evidence_id` (stable Gmail thread id = the idempotency anchor),
  `reply_type`, `asks_response`, `responded`. **No addresses, subjects, or bodies.**
- `--ledger` — the submissions ledger (`grant_id`-keyed) used only to decide whether a confirmed
  submission is already tracked (drives the `needsReview` flag, never a field value).
- `--tracker` — a snapshot of current row field values, so the plan can diff against live state.
- `--fieldmap` — maps the six writable logical names to live Grant Tracker field IDs.

**Field allowlist (the only cells it may ever touch).** Anything outside this frozen set is refused:

| Logical | Grant Tracker field | Type | Written when |
|---------|---------------------|------|--------------|
| `submitted` | `fldcuKha1d5EcKeKL` | checkbox | submission is `gmail`-confirmed |
| `submissionDate` | `fldvzyR5wcjX31zWb` | date | with a confirmed submission (never invented) |
| `responseCategory` | `fldafDQvCpTduSDOg` | singleSelect | a reply is classified with confidence |
| `actionRequired` | `fldMhuw8GK4tmGQZC` | checkbox | reply-required / interview / more-info |
| `evidenceRef` | `fld9UasKkEtYJGJGy` | singleLineText | always (the thread id, for traceability) |
| `result` | `fldWh0ypaABi2LVCF` | singleSelect | award/rejection **only when decisive** |

The last three are **additive fields created on this base on 2026-07-03** via the Airtable schema API
(Response Category = `fldafDQvCpTduSDOg`, singleSelect with the eight categories below; Action Required
= `fldMhuw8GK4tmGQZC`, checkbox; Evidence Ref = `fld9UasKkEtYJGJGy`, single line text), each carrying
the provenance description "Additive operational field, added 2026-07-03." The first three
(`Submitted`, `Submission Date`, `Result`) pre-existed.

**Evidence categories** (`responseCategory` values): `acknowledgment`, `award`, `rejection`,
`interview-meeting`, `more-info-requested`, `reply-required`, `decision-status-update`,
`other-uncertain`.

**Safety guarantees (all unit-tested):**

- **Idempotent.** A second run with no new evidence writes nothing. No-ops are decided by a
  checkbox-tolerant comparator (`sameValue`) — Airtable returns an unchecked box as *absent* on
  read-back, so a desired `false` correctly matches an absent cell and is never rewritten.
- **Never erases.** Empty inferred values never overwrite a populated cell (except an explicit
  `actionRequired` clear when a reply-required item is resolved).
- **Never downgrades human truth.** A strong human `Result` (`Accepted`/`Rejected`/`Withdrawn`) and a
  populated `Submission Date` are protected from weaker inferred writes; `responseCategory` is kept as-is
  when the same evidence id already backs the row.
- **Uncertainty is routed, not written.** Non-Gmail sources, undecisive award/rejection signals,
  unknown reply shapes, and confirmed-but-unledgered submissions produce **no field writes** and are
  listed for human review. Award/rejection is written only when the evidence is marked decisive.
- **Body-free reports.** The dry-run report prints funder, record id, field ids, and category only —
  never an address, subject, snippet, or body.

**Run it — dry run first, always:**

```
# dry run (default): prints the plan, writes nothing, no token needed
npm run reconcile:grants -- \
  --evidence grant-engine/reconcile/evidence.json \
  --ledger grant-engine/applications/submissions-ledger.json \
  --tracker grant-engine/reconcile/tracker-snapshot.json \
  --fieldmap grant-engine/reconcile/fieldmap.json

# apply (needs a token; PATCHes then reads each row back to verify):
AIRTABLE_TOKEN=… npm run reconcile:grants -- --apply --evidence … --ledger … --tracker … --fieldmap …
```

`--apply` PATCHes only the planned cells and **reads each row back to confirm the write landed**
(again using the checkbox-tolerant comparator, so a dropped `false` is not a false alarm). Exit codes:
`0` ok, `2` bad usage, `3` `--apply` without `AIRTABLE_TOKEN`, `1` runtime / Airtable error, `4`
apply-verify mismatch (a written cell did not read back as intended).

**Manual creation (fresh base / new environment):** create Response Category as a singleSelect with the
eight category options, Action Required as a checkbox, and Evidence Ref as single line text on the Grant
Tracker before applying. As with the Reader provenance fields, Airtable will **not** auto-create them — a
PATCH naming a missing field returns HTTP 422 and fails the row.

**Verification (schema-presence + one dry run):** confirm the three additive fields exist via
`get_table_schema` (or the Airtable UI), then run a dry run and read the plan — a clean reconciled state
prints `field writes: 0`. Because Gmail is agent-only, do not expect a scheduled job to keep this
current; it is re-run when new funder replies are observed.

Classification, matching, planning, and apply-verify logic are unit-tested with **synthetic fixtures and
an injected fake `fetch`** — no live Airtable, no Gmail, no network, and no real email content in any
fixture (`test/grant-reconcile.test.mjs`). `grant-engine/` is local scratch and is **not committed**, so
a fresh checkout ships the engine and its tests but none of the evidence, ledger, or snapshots.

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
