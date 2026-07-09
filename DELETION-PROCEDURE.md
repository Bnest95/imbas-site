# DELETION-PROCEDURE.md — internal closure-set walk

**Internal operations document. Not linked from any page. Not the public policy.**
The public promise lives in [/retention.html](retention.html) ("What deletion means"). This file is the private procedure that makes that promise real: the exact storage locations a person walks, in order, to fulfil a deletion request with zero residue. When storage changes, this file changes in the same commit.

- Version: v1 (Reader v2 P1)
- Applies to: a single-mode Reader run (Act 1). Paired analysis and candidate-lead stores do not exist yet; their rows below are marked NOT YET BUILT and become live steps when P2/P4 ship.
- Base: Airtable `appfxHraqlcpP1AAP`.

---

## 1. The closure set

A deletion request must remove, from Imbas-controlled storage, **every** copy of the requester's content — not just the obvious row. For a Reader run the closure set is:

1. **The run row** — Reader Runs table. Holds the raw text (question + pasted answer) and the derived inspection content (the read, omissions, shaping, note, and the P1 candidate findings/estimate) as fields on one row.
2. **Any paired-analysis record** derived from the run — *NOT YET BUILT* (Act 2 / P2). No table exists today. When it ships, add its table + link field here.
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
| 2 | Paired analysis | — | NOT YET BUILT (P2) |
| 6 | Candidate lead | — | NOT YET BUILT (P4) |

There is currently no stored foreign key from a share back to its originating run; a share is matched to its run by content (identical Question + Answer, and the run's Source Content Hash), or by the Share ID the requester provides.

---

## 3. The manual walk (per request)

Performed by a person, within 7 days, per the public policy.

1. **Identify.** From the request, capture the identifier(s): the **Share ID**, or the **approximate time + question** of the run.
2. **Locate the run row.** In Reader Runs, find the row by Question + Created timestamp; confirm identity against Source Content Hash where the requester can supply enough to recompute, otherwise by matching question/answer text. Note its record ID.
3. **Locate every share row.** In Inspection Shares, find rows by Share ID (if given) **and** by matching Question + Answer (a run may have been shared more than once, or shared without the requester quoting the ID). Note all record IDs.
4. **Locate paired analysis.** NOT YET BUILT — skip in P1. When built: find records whose provenance parent is the run row; note IDs.
5. **Locate candidate-lead copies.** NOT YET BUILT — skip in P1. When built: find leads that retained this text (consent-checkbox rows); note IDs.
6. **Delete.** Remove all located records: the run row, then every share row (then paired/lead rows when those exist). Deleting the Airtable row deletes the raw text and derived content it carried (locations 4 and 5) — they have no separate store.
7. **Verify residue = zero** (section 4).
8. **Record** the fulfilment (date, identifiers, what was removed) in the operator's deletion log.

---

## 4. Zero-residue verification

After deletion, prove nothing survived:

- **Reader Runs:** query for the run's Question / Source Content Hash — expect **0 rows**.
- **Inspection Shares:** query for the Share ID(s) and for the matching Question + Answer — expect **0 rows**.
- **Paired analysis / candidate leads:** when built, query by provenance parent — expect **0 rows**.
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

<!-- TEST-LOG -->
