# DOCS-LEDGER — .md custody pass 2026-07-07

Every Markdown file in the repo, its custody class, and the source that governs it.
Scope: git-tracked and git-untracked `.md` under the repo root; excludes vendored trees
(`node_modules/`, `.venv-brand/`) and gitignored `.founder-ops/` (listed at the end for completeness).

Classes: **LAW** (never moved/renamed/edited) · **FROZEN** (frozen artifact, supersession by header note only) ·
**CURRENT** (live, governs its domain) · **SUPERSEDED** (bannered + moved to `docs-archive/`) ·
**REVIEW** (uncertain — untouched, needs Brendan's call).

Actions this pass: 5 SUPERSEDED → banner + `docs-archive/`. 0 DUPLICATE deletions (no byte-identical
redundant copies found). 2 REVIEW. All else left in place.

---

## LAW — never touched

| File | Pointer |
|------|---------|
| `CLAUDE.md` | Operating contract. Self-governing. |
| `IMBAS-CANON.md` | Canon (cross-model state). Self-governing. |
| `AGENT-DOCTRINE.md` | Doctrine. Self-governing. |

## FROZEN — frozen artifact, header-only supersession (canon rule 5)

| File | Class | Pointer |
|------|-------|---------|
| `FABLE-AUDIT-PACKET.md` | FROZEN | Already carries `SUPERSEDED 2026-07-04 by the six-lens re-audit` header (line 1). Left in place per canon rule 5 — never moved or rewritten. |

## CURRENT — live, governs its domain

| File | Pointer |
|------|---------|
| `STATE.md` | Current-truth file. Governs; rewritten in place. |
| `VOICE.md` | Voice contract. Governs all copy. |
| `README.md` | Repo readme. Matches live static site. |
| `DEPLOY.md` | Deploy notes. Matches live build (workbench bundle, field-notes API). |
| `CLAIMS-LEDGER.md` | Governing authority for every public claim / all copy. |
| `IMBAS-NUMBERS-LEDGER.md` | Locked numbers source (50/37/500/4). |
| `AUDIT-2026-07-01.md` | Current full audit; STATE.md "Known gaps" points here. |
| `AGENTS.md` | Agent entrypoint stub → CLAUDE.md + CLAIMS-LEDGER.md. Byte-identical to `GEMINI.md` **by design** (parallel per-tool entrypoints); NOT treated as duplicate — deleting either removes a tool's entrypoint. |
| `GEMINI.md` | Gemini CLI entrypoint stub. See `AGENTS.md` note above. |
| `grant-engine/ANSWER-BANK.md` | Canonical answer set (CLAUDE.md). |
| `grant-engine/BUDGET-TIERS.md` | Governs budgets (CLAUDE.md). |
| `grant-engine/OBJECTION-CANON.md` | Governs objections (CLAUDE.md). Supersedes archived OBJECTION-BANK. |
| `grant-engine/campaign-status.md` | Live campaign state (CLAUDE.md, STATE.md). |
| `grant-engine/IMBAS-FOUNDING-PLAN.md` | Current founding plan (July 2026, Day 57). Forward-looking. |
| `grant-engine/IMBAS-PILOT-PACKET.md` | Living master framework, v1.3 (2026-07-06). Actively versioned. |
| `grant-engine/BATCH-2026-07.md` | Current grant batch (2026-07-01, tracker-reconciled). Overlaps FUNDING-RESCAN but retained as active. |
| `grant-engine/FUNDING-RESCAN-2026-07-ANALYSIS.md` | Current market rescan (2026-07-03), companion to the xlsx. |
| `grant-engine/FIELD-NOTE-SEEDS.md` | Current content seeds (2026-07-05). |
| `grant-engine/applications/foresight-SUBMITTED-2026-06-30.md` | As-submitted snapshot (positioning ground truth, frozen). |
| `grant-engine/applications/longview-SUBMITTED-2026-07-02.md` | As-submitted snapshot (positioning ground truth, frozen). |
| `grant-engine/applications/cloudflare-startups.md` | Active working draft (no submission yet). |
| `grant-engine/applications/emergent-ventures.md` | Active working draft. |
| `grant-engine/applications/manifund.md` | Active working draft. |
| `grant-engine/applications/ms-founders-hub.md` | Active working draft. |
| `grant-engine/applications/nonlinear-network.md` | Active working draft. |
| `grant-engine/applications/sff-rolling.md` | Active working draft (SFF = next tranche). |
| `lessons/2026-07-04-fabricated-submitted-status.md` | Lesson (memory, per CLAUDE.md `/lessons`). |
| `lessons/reader-not-plugin-framing.md` | Lesson (memory). |
| `DOCS-LEDGER.md` | This ledger. |

## SUPERSEDED — bannered + moved to `docs-archive/`

| Now at | Was at | Superseded by |
|--------|--------|---------------|
| `docs-archive/COWORK-HANDOFF.md` | `COWORK-HANDOFF.md` | `STATE.md` + `CLAUDE.md`. Described site as "not yet live" and used dead framing ("Active Foreclosure", "liberty product", "Locked May 19" positioning). |
| `docs-archive/PRODUCTION_COPY_AUDIT.md` | `PRODUCTION_COPY_AUDIT.md` | `CLAIMS-LEDGER.md`. Point-in-time copy audit (2026-05-29, "not committed"); copy authority now the Claims Ledger. |
| `docs-archive/FIELD_NOTES_SUBSCRIBE_QA.md` | `FIELD_NOTES_SUBSCRIBE_QA.md` | Live Field Notes signup + `STATE.md`. Completed-pass QA record (2026-05-29, "not committed"). |
| `docs-archive/INSTITUTIONS_VALUE_BRIDGE_P1_QA.md` | `INSTITUTIONS_VALUE_BRIDGE_P1_QA.md` | `institutions.html` (live) + `STATE.md`. Completed pass-1 QA record. |
| `docs-archive/OBJECTION-BANK.md` | `grant-engine/OBJECTION-BANK.md` | `grant-engine/OBJECTION-CANON.md` (CLAUDE.md-designated governing objections doc). NOTE: BANK carries objections 4–6 ("labs run evals", etc.) not yet in CANON — worth porting before relying on the archive. |

## REVIEW — uncertain, untouched (needs Brendan's call)

| File | Why REVIEW |
|------|-----------|
| `imbas-landing-cursor-passes.md` | "Pre-launch" Cursor-pass pack documenting a workflow ("never commit to git; Brendan runs passes") the repo has since moved off of (direct commits now). Reads as dead, BUT it self-describes as an append target ("new passes get appended here"). Not moved — confirm it's dead before archiving. |
| `grant-engine/applications/foresight.md` | Working draft whose as-submitted snapshot exists (`foresight-SUBMITTED-2026-06-30.md`, ground truth). Draft differs from the snapshot. May be superseded, or may be retained for a resubmission/similar funder. Your call. |

## OUT-OF-SCOPE — gitignored (`.founder-ops/`), listed for completeness, untouched

| File | Note |
|------|------|
| `.founder-ops/brief-2026-07-04.md` | Daily brief (gitignored operational series). |
| `.founder-ops/brief-2026-07-07.md` | Daily brief. |
| `.founder-ops/brief-latest.md` | "Latest" pointer; differs from 2026-07-07 brief (not a byte-duplicate). |
| `.founder-ops/metrics-2026-07-05.md` | Metrics snapshot. |
