# DELETION-PROCEDURE.md — internal closure-set walk

**Internal operations document. Not linked from any page. Not the public policy.**
The public promise lives in [/retention.html](retention.html) ("What deletion means"). This file is the private procedure that makes that promise real: the exact storage locations a person walks, in order, to fulfil a deletion request with zero residue. When storage changes, this file changes in the same commit.

- Version: v2 (Reader v2 P2)
- Applies to: a single-mode Reader run (Act 1) **and** any paired analysis (Act 2) derived from it. The candidate-lead store still does not exist; its row below stays NOT YET BUILT and becomes a live step when P4 ships.
- Base: Airtable `appfxHraqlcpP1AAP`.

---

## 1. The closure set

A deletion request must remove, from Imbas-controlled storage, **every** copy of the requester's content — not just the obvious row. For a Reader run the closure set is:

1. **The run row** — Reader Runs table. Holds the raw text (question + pasted answer) and the derived inspection content (the read, omissions, shaping, note, and the P1 candidate findings/estimate) as fields on one row.
2. **Any paired-analysis record** derived from the run — Reader Paired Analyses table. One open run can spawn **more than one** paired record (a different second answer for the same run is a distinct row), so all must be found, not just one. A paired record independently stores the requester's **second** pasted answer (raw), the Imbas-derived targeted prompt, and the derived delta content — including short **verbatim spans quoted from both the first and second answers** (the `open_side` / `targeted_side` of each delta item). It joins back to the run by **`Open Run ID` = the run's `Request ID`** (there is no Airtable link field; the join is by that text value). All of this content lives *on* the row — deleting the row removes it.
3. **Any share record** created from the run — Inspection Shares table. A share is a **denormalized copy**: it independently stores the same raw text and derived content, so deleting the run row alone leaves the share as a full second copy.
4. **The stored raw text** — lives *on* rows 1 and 3 (no separate blob store). Removed when those rows are removed.
5. **The derived inspection content** — lives *on* rows 1 and 3. Removed when those rows are removed.
6. **Any candidate-lead copy** that retained the text — *NOT YET BUILT* (candidate-case flag / P4). A lead stores metadata + delta summary only, and pasted text only under an explicit consent checkbox. No leads store exists today. When it ships, add it here.

**Not in the closure set (recorded so no one assumes content hides there):**
- **Redis** holds only aggregate counters — rate-limit windows, monthly spend (`reader:spend:${month}`), the share-create-day counter (`share:create:d:${date}`). These carry no run content and expire on their own TTLs. Nothing to delete per-request.
- **Downloaded receipts and copies on other people's machines** are outside Imbas control. The public policy states this boundary plainly; Imbas deletes what Imbas holds.
- **OG/link-preview images** carry no answer text by design.

---

## 2. Storage map (current implementation)

| # | Location | Table | What it holds |
|---|----------|-------|---------------|
| 1 | Run row | Reader Runs `tblqmHiOCQ5YSXBN3` | Question, Answer (raw); The Read, What Was Left Out, How It Was Shaped, Inspection Note, Finding Types, Gap Estimate, Estimate Rationale (derived); Source/Reader Output/Receipt hashes; provenance + version fields |
| 3 | Share row(s) | Inspection Shares `tbliYeeM5n0TSVrxf` | Share ID; Question, Answer (raw copy); The Read, What Was Left Out, How It Was Shaped, Inspection Note, Completeness (derived copy); labels; visibility |
| 2 | Paired analysis | Reader Paired Analyses `tblP1ekWWWscz6pBG` | Open Run ID (join to the run's Request ID); Targeted Prompt (derived), Targeted Answer (raw second answer); Delta Items — JSON with verbatim `open_side`/`targeted_side` spans from both answers; Signal Patterns, Gap Estimate, Estimate Rationale (derived); Targeted Prompt/Answer + Receipt hashes; Estimate Type, Rubric/Paired Method/Schema versions; Created |
| 6 | Candidate lead | — | NOT YET BUILT (P4) |

There is currently no stored foreign key from a share back to its originating run; a share is matched to its run by content (identical Question + Answer, and the run's Source Content Hash), or by the Share ID the requester provides. A **paired analysis** does carry an explicit text join: its **`Open Run ID`** equals the originating run's **`Request ID`** (Reader Runs field). So the walk must read the run's Request ID **before** deleting the run row, then query paired analyses by it.

---

## 3. The manual walk (per request)

Performed by a person, within 7 days, per the public policy.

1. **Identify.** From the request, capture the identifier(s): the **Share ID**, or the **approximate time + question** of the run.
2. **Locate the run row.** In Reader Runs, find the row by Question + Created timestamp; confirm identity against Source Content Hash where the requester can supply enough to recompute, otherwise by matching question/answer text. Note its record ID **and its `Request ID`** — the paired-analysis join key. Capture it now, before any deletion.
3. **Locate every share row.** In Inspection Shares, find rows by Share ID (if given) **and** by matching Question + Answer (a run may have been shared more than once, or shared without the requester quoting the ID). Note all record IDs.
4. **Locate every paired analysis.** In Reader Paired Analyses `tblP1ekWWWscz6pBG`, find **all** rows where `Open Run ID` equals the run's `Request ID` (from step 2). One run may have several — a distinct second answer each. Note all record IDs.
5. **Locate candidate-lead copies.** NOT YET BUILT — skip until P4. When built: find leads that retained this text (consent-checkbox rows); note IDs.
6. **Delete.** Remove all located records: the run row, every share row, **and every paired-analysis row** (then candidate-lead rows when those exist). Deleting each Airtable row deletes the raw text and derived content it carried — the paired row's second answer, targeted prompt, and both-side delta spans included — none has a separate store.
7. **Verify residue = zero** (section 4).
8. **Record** the fulfilment (date, identifiers, what was removed) in the operator's deletion log.

---

## 4. Zero-residue verification

After deletion, prove nothing survived:

- **Reader Runs:** query for the run's Question / Source Content Hash — expect **0 rows**.
- **Inspection Shares:** query for the Share ID(s) and for the matching Question + Answer — expect **0 rows**.
- **Paired analysis:** query Reader Paired Analyses `tblP1ekWWWscz6pBG` for `Open Run ID` = the run's Request ID — expect **0 rows**.
- **Candidate leads:** when built, query by provenance parent — expect **0 rows**.
- Redis needs no action (counters only, no content).

If any query returns a row, the walk is incomplete — do not close the request until every closure-set location returns zero.

---

## 5. Test log

Each entry proves the procedure was exercised end-to-end against real storage using explicitly namespaced dummy records (prefix `DELETE_TEST_READER_V2_P1_`), never real user data.

### 2026-07-09 (UTC) — v1 procedure proof, single-mode run

- **Namespace:** `DELETE_TEST_READER_V2_P1_2026-07-09T013706Z`
- **Created (direct prefixed writes, mirroring the full closure set):**
  - Run row `rect5zvsPWp62JnR3` in Reader Runs `tblqmHiOCQ5YSXBN3` (raw + derived + P1 fields).
  - Share row `recgoLxza2CIbbLoC` in Inspection Shares `tbliYeeM5n0TSVrxf` (denormalized raw + derived copy).
  - Paired-analysis and candidate-lead stores are NOT YET BUILT, so for a single-mode run these two rows are the complete closure set.
- **Located** by content prefix: 1 row in each table (find step proven, not just the held IDs).
- **Deleted** both rows.
- **Verified residue = 0:** Reader Runs 0 rows; Inspection Shares 0 rows (queried on both Share ID and Question). Redis holds counters only — no per-run content, nothing to delete.
- **Result: PASS** — zero residue.
- **Note:** the test routed dummies through direct Airtable writes rather than the paid `/api/read` path, to honor the one-paid-run rule; this exercises the closure walk against real storage without spend.

### 2026-07-09 (UTC) — v2 P2 procedure proof, paired run (open + targeted)

- **Namespace:** `DELETE_TEST_READER_V2_P2_20260709T084125Z` (carried inside the pasted open answer).
- **Origin:** the authorized Phase C.5 paired production verification pair. Two paid calls total: a real `/api/read` open run, then a real `/api/read-paired` targeted run. Unlike the v1 proof, this walk ran against records the live pipeline produced end to end, not direct prefixed writes.
- **Closure set located:**
  - Run row `recxDMprB4ems2Gah` in Reader Runs `tblqmHiOCQ5YSXBN3` (open answer raw + derived + P1 candidate fields). Its `Request ID` = `c8706c84a318a57b`, captured before deletion per §3 step 2.
  - Paired-analysis row `recd1UrxYHh8AvQnu` in Reader Paired Analyses `tblP1ekWWWscz6pBG` — located by its join key `Open Run ID` = `c8706c84a318a57b`, not the held ID (find step proven). It carried the raw second answer, the derived targeted prompt, and the both-side verbatim delta spans (Receipt Hash `605f43b3…`).
  - Inspection Shares `tbliYeeM5n0TSVrxf`: queried by namespace and by Question — 0 rows. The run was never shared, so the share store held nothing for it; the walk queried it regardless.
  - Candidate-lead store: still NOT YET BUILT (P4), so it is not in this closure set.
- **Deleted:** the paired-analysis row, then the run row. Removing the paired row removed the second answer, targeted prompt, and both-side delta spans with it — no separate blob store.
- **Verified residue = 0:** Reader Runs 0 rows (by Request ID and by namespace); Reader Paired Analyses 0 rows (by Open Run ID and by namespace); Inspection Shares 0 rows (by namespace and Question). Redis holds counters only, nothing per-run to delete.
- **Result: PASS** — zero residue across every closure-set location, including the paired store that P1 did not yet have.

<!-- TEST-LOG -->
