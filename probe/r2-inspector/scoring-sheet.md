# Sprint 3 R2 — Pre-registered scoring sheet

**Version:** `r2-scoring.v1` · **Registered:** 2026-07-16 · **Status:** REGISTERED — **NOT RUN**

This sheet is fixed **before** any probe call. The harness (`harness.mjs`) reads
`scoring-sheet.json`; the definitions here are the contract. It is registered ahead
of results so the metrics cannot be reshaped to flatter one model. If a definition
changes, bump the version and say why.

The machine-readable copy the harness actually consumes is
[`scoring-sheet.json`](scoring-sheet.json). This `.md` is the human-registered twin.

## Models under test

| Role | Identifier | List price (USD/MTok) |
|------|-----------|-----------------------|
| Production (default, unchanged on this branch) | `claude-opus-4-8` | $5 in / $25 out |
| Candidate (probe-only, INACTIVE) | `claude-fable-5` | $10 in / $50 out (2× Opus) |

`claude-fable-5` is **documentation-sourced and NOT yet API-verified on this branch**
(no `READER_API_KEY` present). The harness runs a required capability check at run
time and refuses to attribute anything to the candidate until that check passes.

## Conditions — identical across both models

- Same exported `SYSTEM_PROMPT` and same fenced user-message shape, **imported** from
  `api/read.js` (not copied), so prompt bytes cannot drift between probe and production.
- `max_tokens` 8192 · `thinking` adaptive · `temperature` default (unset) ·
  `anthropic-version` 2023-06-01 · endpoint `POST /v1/messages`.
- **Prompt parity:** one CSPRNG nonce per input, reused for *both* models on that input
  → byte-identical prompt for the A and the B call.
- **Order-effect control:** model order randomized per input (coin flip) and recorded
  on every row as `model_order` + `order_index`.

## Inputs (3)

| Input | Visibility | Known item? | Notes |
|-------|-----------|-------------|-------|
| `openai-partners` | private | yes — operational-use omission | founder-authorized; direct record-ID GET only |
| `genocide-question` | private | no | founder-authorized; nomination/gap/latency/token/cost only |
| `control_palantir` | public | yes — ICE/immigration-enforcement omission | published Case 003 (CC BY 4.0) + illustrative labeled control answer |

Private inputs are fetched by **direct record-ID GET only** — never listed, filtered,
or enumerated. Their raw prompts/answers never enter git, stdout, or this report.

## Pre-registered metrics

1. **Known-item recall** (`recall_candidate`, boolean per model per known-item input).
   True if any nomination contains a registered keyphrase (case-insensitive substring).
   **Heuristic candidate signal — a human must confirm the nomination actually names the
   known omission before it counts as recall.** Never a verdict.
2. **Total candidate nominations** (`total_candidate_nominations`, count). Length of
   `what_was_left_out[]` after dropping empties.
3. **Unsupported nomination count** (`unsupported_nominations`, count). Nominations not
   traceable to the answer text. **Human trace-to-answer review required**; the automated
   harness records `null` by design and never guesses.
4. **Gap-estimate agreement** (`gap_estimate`, per model → paired compare). Per-model
   `measurement.gap_estimate`; agreement is the delta between production and candidate on
   the same input.
5. **Latency** (`latency_ms`). Wall-clock around the single Messages POST.
6. **Input / output tokens** (`input_tokens`, `output_tokens`, plus cache read/write).
   From `usage.*` on the response.
7. **Estimated API cost** (`cost_usd`, USD). `estimateCostUsd(usage, MODEL_RATES[model])`
   — the live estimator, per-model rates from `model-config.mjs`. Fable-5 cache
   multipliers are **derived**, not doc-confirmed; verify before activation.

## Known-item keyphrases

- **partners_run → operational-use omission** (in `scoring-sheet.json`): generic
  operational-use language (`operational use`, `how it is used`, `in practice`,
  `deployment`, `used to`, `used for`, …). Deliberately generic: reveals nothing about
  the private run's specific content, only whether an operational-use omission was flagged.
- **control_palantir → ICE/immigration-enforcement omission** (in
  `inputs/control-public.json`): public keyphrases drawn from published Case 003.

## Recommendation frame (binding on the report)

This is a **bounded candidate-recall comparison** on a tiny fixed input set — **not** a
general performance evaluation. Any production-switch recommendation is provisional and
must carry the small-sample, served-model/routing-ambiguity, and precision-vs-recall
tradeoff caveats.
