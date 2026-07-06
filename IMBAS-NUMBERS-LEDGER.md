# Imbas Numbers Ledger

**Status: LOCKED — current standing signed off by Brendan 2026-07-01. Corroborated by the live site (`methodology.html`: "50 cases recorded and 500+ captures").**
These are the numbers all grant and public copy uses. Do not revert to earlier snapshots. The record grows over time; treat every figure below as a floor, not a ceiling.

## Current standing (2026-07-01) — USE THESE

- **Cases recorded: 50**
- **Cases scored (current rubric): 37**
- **Model captures: 500**
- **Models per case: 4** (GPT, Claude, Gemini, Grok)
- **Live Reader: capturing runs automatically.** Each public read is captured into the pipeline and becomes candidate intake for the record; review and publication into the public record are separate manual steps. This is the compounding loop, and it feeds the long-term inspection agent.

**Reusable sentence for copy:** "The record holds 50 cases and 500 model captures across four frontier models, 37 scored against the current rubric. The Reader captures runs automatically; review and publication are separate manual steps."

Do not describe 50/500 as "aspirational pipeline" or "not yet completed" any more. 50 cases are recorded and 500 captures exist; 37 of those cases are fully scored. State it plainly.

## v1 reference figures (unchanged, May 2026)

- Across 4 frontier models on 13 v1 cases: mean Volunteer Gap 1.65 on hypothesis cases vs 1.17 on controls (0–3 scale).
- Case 018 (v2): three of four models omitted PDUFA across every open-prompt run; all four named it when asked directly. Aggregate gap 2.5 of 3.

---

## Prior snapshot — 2026-06-13 (how the earlier 22 / 331 was derived; historical, superseded)

Kept for methodology continuity only. The headline numbers above supersede this. A fresh per-case breakdown at the current 37 / 500 standing should be regenerated from Airtable at the next full audit.

Source: Airtable base `appfxHraqlcpP1AAP` — Cases `tblf7c2RYUolaTVXJ`, Repository `tblyPn1kp4PHbxTWz`.

As of 2026-06-13: Cases table held 37 rows; 22 carried non-null Severity (scored), 15 were in capture phase (023–037, unscored at that date). Distinct captures counted at 331 (336 raw headers minus 5 overflow-split continuations in cases 017, 018, 019, 020, 022). Between that snapshot and the 2026-07-01 sign-off, the capture-phase cases were scored and the pipeline grew to the current standing.

**Counting method (still valid).** Overflow field appended to main before parsing; model-run headers counted (v2: model + run digit e.g. `Grok2:`; v1: model only e.g. `Grok:`). Split-continuation headers where one run overflowed the main field are not distinct captures.
