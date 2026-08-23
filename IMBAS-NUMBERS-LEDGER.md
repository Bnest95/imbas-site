# Imbas Numbers Ledger

## CUSTODY CORRECTION — 2026-08-23. This banner governs. Read it before quoting any figure below.

The archive-tier figures below (50 cases recorded, 500 model captures, 45 held) are **not independently corroborated**, are **disputed by later custody evidence**, and are **not authoritative for current public copy**. Brendan signed them off on 2026-07-01 and they governed copy from that date, so they stand as a historical governed assertion. They do not stand as current evidence. A locked figure does not outrank contradictory or missing evidence.

Restoring any of them to a public surface requires a fresh custody reconciliation under an explicit population definition: what counts as a case, what counts as a capture, and which table is authoritative. Nothing substitutes for that reconciliation. Do not fall back to 22 scored or 331 captures, which the 2026-07-01 sign-off retired and which this correction does not reinstate. Do not infer a replacement number from any other figure in this file.

**The corroboration note was false the day it was written.** The original status line read, verbatim:

> **Status: LOCKED — current standing signed off by Brendan 2026-07-01. Corroborated by the live site (`methodology.html`: "50 cases recorded and 500+ captures").**

That sentence is preserved here rather than deleted. It governed copy for seven weeks and the record should show that it did. Its git history:

| Date | Commit | What happened |
|------|--------|---------------|
| 2026-06-08 | `0b0320e` | 50+ cases and 500+ captures enter `index.html`. The commit cites no source. |
| 2026-06-14 | `cec00a1` | The figures propagate to `methodology.html` as "The Case Archive now holds 50 cases recorded and 500+ captures across those four frontier models." The commit subject sources them to the homepage: "Align site-wide record counts with homepage source of truth." |
| 2026-07-03 | `8c89c9e` | That sentence is deleted from `methodology.html`. |
| 2026-07-05 | `fdb37e7` | This file gains the corroboration note pointing at that sentence, two days after its deletion. |

The chain closes on itself. The site corroborated the ledger with a figure the site had taken from the ledger's own copy, and by the time the note was written the sentence it cited was already gone.

**What this correction does not reach.** The v1 reference figures below (13 cases, 4 frontier models, May 2026) carry separate, consistently scoped publication provenance. They are untouched. `whitepaper.html` and `volunteer-gap-paper.html` report their figures under explicit tier labels and dates. They are frozen published records, not current site metrics, and they are not corrected here.

**169 captures: provenance unresolved.** `whitepaper.html` reports the original 13-case corpus as 169 captures held under content-addressed custody in a versioned instrument repository. That source record is not recoverable from this repository. The figure is a publication figure with unresolved provenance in this tree. Do not promote it to any other surface, and do not reconstruct a custody trail for it after the fact. `IMBAS-CANON.md` places the custody in `Projects/imbas-instrument`; confirming it there is a separate act and does not happen by inference here.

---

**Historical status line (superseded 2026-08-23 by the banner above).**
These are the numbers all grant and public copy uses. Do not revert to earlier snapshots. The record grows over time; treat every figure below as a floor, not a ceiling.

## Current standing (2026-07-01) — historical governed assertion, NOT authoritative for current public copy

Superseded for living surfaces by the custody correction above. Preserved as signed off.

- **Cases recorded: 50**
- **Cases scored (current rubric): 37**
- **Model captures: 500**
- **Models per case: 4** (GPT, Claude, Gemini, Grok)
- **Live Reader: capturing runs automatically.** Each public read is captured into the pipeline and becomes candidate intake for the record; review and publication into the public record are separate manual steps. This is the compounding loop, and it feeds the long-term inspection agent.

**Reusable sentence for copy (WITHDRAWN 2026-08-23, preserved as written):** "The record holds 50 cases and 500 model captures across four frontier models, 37 scored against the current rubric. The Reader captures runs automatically; review and publication are separate manual steps." Do not put this sentence, or any part of its count clause, on a public surface. Its second clause about the Reader stands on its own and is unaffected.

**Withdrawn 2026-08-23, preserved as written:** Do not describe 50/500 as "aspirational pipeline" or "not yet completed" any more. 50 cases are recorded and 500 captures exist; 37 of those cases are fully scored. State it plainly.

## v1 reference figures (unchanged, May 2026)

- Across 4 frontier models on 13 v1 cases: mean Volunteer Gap 1.65 on hypothesis cases vs 1.17 on controls (0–3 scale).
- Case 018 (v2): three of four models omitted PDUFA across every open-prompt run; all four named it when asked directly. Aggregate gap 2.5 of 3.

---

## Prior snapshot — 2026-06-13 (how the earlier 22 / 331 was derived; historical, superseded)

Kept for methodology continuity only. The headline numbers above supersede this. A fresh per-case breakdown at the current 37 / 500 standing should be regenerated from Airtable at the next full audit.

Source: Airtable base `appfxHraqlcpP1AAP` — Cases `tblf7c2RYUolaTVXJ`, Repository `tblyPn1kp4PHbxTWz`.

As of 2026-06-13: Cases table held 37 rows; 22 carried non-null Severity (scored), 15 were in capture phase (023–037, unscored at that date). Distinct captures counted at 331 (336 raw headers minus 5 overflow-split continuations in cases 017, 018, 019, 020, 022). Between that snapshot and the 2026-07-01 sign-off, the capture-phase cases were scored and the pipeline grew to the current standing.

**Counting method (still valid).** Overflow field appended to main before parsing; model-run headers counted (v2: model + run digit e.g. `Grok2:`; v1: model only e.g. `Grok:`). Split-continuation headers where one run overflowed the main field are not distinct captures.
