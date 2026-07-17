# Sprint 3 R2 — Inspector A/B probe report

**Status: PREPARED — PROBE NOT RUN. HOLD.** This branch stages a non-persisting,
provenance-pinned A/B comparison between the production Reader inspector
(`claude-opus-4-8`) and the candidate (`claude-fable-5`). It changes **no** production
behavior. The probe table below is **empty on purpose**: there is no Anthropic
`READER_API_KEY` on this branch, so the required capability check and live inference
cannot run, and this report contains **zero fabricated metrics**. Run the harness where
the key exists, then fill the tables from its bounded output.

---

## Blocker (why the table is NOT RUN)

The R2 brief requires the candidate be confirmed by **a successful API capability check**
— "never infer or invent the identifier; record the exact identifier returned or accepted
by the API. If the account's key cannot access it, stop and report." No Anthropic API key
is present on this branch (`.env` carries only Airtable/Zenodo tokens; `GET /v1/models`
returns HTTP 401). So:

- `claude-fable-5` is **documentation-sourced, NOT API-verified on this branch.** It is
  the newest GA Anthropic frontier model per the official Models overview (GA on the
  Claude API since 2026-06-09, Messages API, adaptive thinking). It is staged as an
  **inactive, probe-only** identifier and must not be treated as adopted until the
  capability check passes.
- The harness **refuses to run** without the key (verified: prints `BLOCKED`, exits 2,
  makes no network call, fabricates nothing).

**To complete:** set `READER_API_KEY` (Anthropic, server-side) where authorized, copy
`inputs/run-ids.local.json.example` → `inputs/run-ids.local.json` with the two authorized
record IDs, run `node probe/r2-inspector/harness.mjs`, then transcribe the bounded numbers
into the tables below. Do not merge until then.

---

## §1 Candidate model

| Field | Value |
|-------|-------|
| Requested identifier | `claude-fable-5` |
| Source | Official Anthropic "Models overview" (most capable widely released model; GA 2026-06-09) |
| API-verified on this branch? | **No** — no key present. Capability check is REQUIRED before adoption. |
| Staged where | `probe/r2-inspector/model-config.mjs` (`CANDIDATE_MODEL`), probe-only |
| Production default | **Unchanged** — `claude-opus-4-8` in `api/read.js` + `api/read-paired.js` |
| Excluded | `claude-mythos-5` (not GA) — out of scope for a GA-only comparison |

## §2 Served-model provenance (method)

Per run the harness records: the **requested** model, the **served** model
(`response.data.model`), the `response.id`, and the `request-id` response header. It writes
these to each bounded row (`requested_model`, `served_model`, `request_id`).

**Fallback ambiguity, stated plainly:** the Anthropic Messages API exposes **no explicit
routing/fallback flag**. There is no field that says "your request was served by a
different model than requested." The harness therefore records `fallback_disclosed: false`
and attributes results to the requested model **only when `served_model` equals it**. If a
run's `served_model` differs from the requested identifier, that row is not attributed to
the candidate and the discrepancy is reported. Absence of a fallback signal is recorded,
not resolved.

## §3 Private-run access (method + confidentiality)

- Exactly **two** founder-authorized records are read: the OpenAI-partners run and the
  genocide-question run. Their record IDs live only in the gitignored
  `inputs/run-ids.local.json` (never committed).
- Fetch is **direct record-ID GET only** (`/v0/{base}/{table}/{recordId}`). The harness
  never lists, filters, searches, or enumerates the Reader Runs table.
- Raw prompts/answers are processed **ephemerally** and written **only** under the
  gitignored `probe-artifacts/` path for local human review. They never enter git, stdout,
  the PR, fixtures, screenshots, or this report. Committed output carries only bounded
  metrics, counts, hashes, run IDs, and short redacted descriptions.
- Third input is a **public control**: published Case 003's open prompt plus an
  illustrative, clearly-labeled control answer (`inputs/control-public.json`) — safe to
  reproduce.

## §4 Non-persistence guarantees

The harness calls the inspector through a **non-persisting** path. It does **not** invoke
the Reader capture endpoint, the Airtable Reader-Runs **write** path, the funnel logger,
the inspection-share rail, or the Repository rail. Its only remote calls are the Anthropic
Messages POST (the inference) and a read-only Airtable **GET-by-ID** for the two authorized
records. Default remote persistence is **zero**. Prompt parity is guaranteed by importing
`SYSTEM_PROMPT` / `extractJson` / `estimateCostUsd` from the live modules rather than
copying them.

---

## Probe table — vs pre-registered scoring sheet (`scoring-sheet.md`)

**All cells NOT RUN.** Fill from `probe-artifacts/<timestamp>/bounded-metrics.json`.

### Per-run bounded metrics

| Input | Requested model | Served model | Recall (human-confirm) | Total noms | Unsupported (human) | Gap est. | In tok | Out tok | Cost USD | Latency ms | Model order |
|-------|-----------------|--------------|------------------------|-----------|---------------------|----------|--------|---------|----------|------------|-------------|
| openai-partners (private) | claude-opus-4-8 | — | — | — | — | — | — | — | — | — | — |
| openai-partners (private) | claude-fable-5 | — | — | — | — | — | — | — | — | — | — |
| genocide-question (private) | claude-opus-4-8 | — | n/a | — | — | — | — | — | — | — | — |
| genocide-question (private) | claude-fable-5 | — | n/a | — | — | — | — | — | — | — | — |
| control-palantir (public) | claude-opus-4-8 | — | — | — | — | — | — | — | — | — | — |
| control-palantir (public) | claude-fable-5 | — | — | — | — | — | — | — | — | — | — |

### Per-input candidate − production deltas

| Input | Recall match? | Nomination Δ (cand − prod) | Gap-estimate agreement | Cost Δ USD | Latency Δ ms |
|-------|---------------|----------------------------|------------------------|------------|--------------|
| openai-partners | — | — | — | — | — |
| genocide-question | n/a | — | — | — | — |
| control-palantir | — | — | — | — | — |

*Recall is a heuristic keyphrase candidate signal that a human must confirm before it
counts (see scoring sheet). "Unsupported nominations" requires human trace-to-answer
review; the harness records it as null by design.*

---

## Recommendation

**None yet — the probe has not run.** When it does, the recommendation must be framed as:

> This probe is a **bounded candidate-recall comparison** on a tiny fixed input set
> (two private runs + one public control), **not a general performance evaluation.** Any
> recommendation to switch the production model is **provisional** and must carry these
> caveats: **(1) small sample** — three inputs cannot support a general quality claim;
> **(2) served-model / routing ambiguity** — the Messages API discloses no fallback flag,
> so a served-model match is the only routing assurance; **(3) precision-vs-recall
> tradeoff** — more nominations is not automatically better, since unsupported nominations
> (human-reviewed) are the cost of higher recall; **(4) price** — Fable 5 lists at 2× Opus
> 4.8, so any recall gain must be weighed against doubled inference cost.

Activation, if chosen, is a **separate founder decision** using the prepared change set in
[DECISION-PROPOSED.md](DECISION-PROPOSED.md) (labeled PROPOSED / NOT ACTIVATED).

## Out of scope — proposed as R3 follow-ups (two sentences)

An **enumeration-probe prompt** (a fixed adversarial input that asks each model to
enumerate the operationally material omissions, to sharpen the recall signal beyond a
single organic pass) is deferred to R3. A **"probe it yourself" affordance** (a
founder-only, still non-persisting way to run this A/B on an arbitrary pasted answer) is
also deferred to R3.

## What this branch verifies (production untouched)

- `api/read.js` and `api/read-paired.js` are **byte-identical** to `origin/master`
  (`git diff` empty; guarded by `test/r2-inspector-default-pin.test.mjs`).
- Production `MODEL` stays `claude-opus-4-8`; `READER_PROMPT_VERSION` stays `reader.v2`;
  read / capture / rate-limit / share / Repository paths untouched.
- **HOLD:** open the PR and do not merge.
