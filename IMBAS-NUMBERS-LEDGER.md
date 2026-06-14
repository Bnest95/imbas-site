# Imbas Numbers Ledger

**Status: DRAFT — first-pass counts, verified by fetch 2026-06-13. Awaiting sign-off before the parked site change.**
Source: Airtable base `appfxHraqlcpP1AAP` — Cases `tblf7c2RYUolaTVXJ`, Repository `tblyPn1kp4PHbxTWz`. Counted, not estimated.

## Headline numbers

- **Scored cases: 22**
- **Distinct captures present: 331**
- **Repository (inbound workbench pool): 0 rows**
- **Models per case: 4** (GPT, Claude, Gemini, Grok)

## Scored cases — 22

| Tier | Cases | Count | Severity (gap) range |
| --- | --- | --- | --- |
| v1 | 001–013 | 13 | 0.75 – 2.5 |
| v2 | 014–022 | 9 | 1.0 – 2.5 |
| v2 — capture phase (unscored) | 023–037 | 15 | — (Severity null) |

Cases table total records: **37**. Scored = non-null Severity = 22 (001–022); unscored = 15 (023–037).

## Captures present (main + overflow), distinct

| Tier | Cases | Captures | Per case |
| --- | --- | --- | --- |
| v1 scored | 001–013 | 108 | 8 standard (4 models × open + targeted); 003 holds 12 |
| v2 scored | 014–022 | 216 | 24 each (4 models × 2 prompts × 3 runs) |
| v2 in capture | 023 | 7 | partial — GPT×3, Gemini×3, Claude×1; no Grok, no targeted yet |
| v2 not started | 024–037 | 0 | empty |
| **Distinct total** | | **331** | |

**Counting method.** Overflow appended to main, then model-run headers counted (v2: model + run digit, e.g. `Grok2:`; v1: model only, e.g. `Grok:`). Raw header count is **336**. Five v2 cases (017, 018, 019, 020, 022) each show one extra header where a single run's text overflowed the main field and continued in the overflow field with its header repeated — 017 Gemini-3 targeted, 018 Grok-3 targeted, 019 Grok-1 targeted, 020 Claude-3 targeted, 022 Claude-2 targeted. These five are split-continuation duplicates, not distinct captures; every v2 scored case holds exactly 24. Distinct = 336 − 5 = **331**.

## Repository — inbound workbench pool

- **Rows: 0.** No visitor captures from the Try-Imbas workbench have landed yet.
- **Schema note:** three BYO columns added 2026-06-12 for Pass 7b payload mapping — `Targeted Prompt`, `User Category`, `User Self Score`. Schema-only; not data, not discrepancies.

## Anomalies flagged

- **Case 003** carries a second targeted round (12 captures vs the v1-standard 8). Real captures, not a duplicate — flagged for awareness.
- **Case 023** is mid-capture (7 of a planned 24); 024–037 not started.

## Site-copy framings supported by these counts

- "across 4 models on 22 cases" — supported (22 scored, 4 models each).
- v2 multi-run instrument: "9 cases, 216 captures (4 models × 2 prompts × 3 runs)" — supported.
- Whole-dataset evidence: "331 captures across 22 scored cases" — supported.
