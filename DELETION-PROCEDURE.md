# DELETION-PROCEDURE.md — internal closure-set walk

**Internal operations document. Not linked from any page. Not the public policy.**
The public promise lives in [/retention.html](retention.html) ("What deletion means"). This file is the private procedure that makes that promise real: the exact storage locations a person walks, in order, to fulfil a deletion request with zero residue. When storage changes, this file changes in the same commit.

- Version: v3 (Reader v2 P4)
- Applies to: a single-mode Reader run (Act 1) **and** any paired analysis (Act 2) derived from it, including the optional **Perception Tap** telemetry P3 adds to each — it is a single enum field *on* those same rows, deleted wholesale with them (see §1 items 1–2) — **and** any unlisted **Inspection Share** created from either (the Reader v2 P4 redesign; see §1 item 3, updated for the new share fields). The candidate-lead store still does not exist: P4 shipped the Inspection Shares redesign, **not** a leads store, so its row below stays **NOT YET BUILT** and becomes a live step only when a leads store is actually built.
- Base: Airtable `appfxHraqlcpP1AAP`.

---

## 1. The closure set

A deletion request must remove, from Imbas-controlled storage, **every** copy of the requester's content — not just the obvious row. For a Reader run the closure set is:

1. **The run row** — Reader Runs table. Holds the raw text (question + pasted answer) and the derived inspection content (the read, omissions, shaping, note, and the P1 candidate findings/estimate) as fields on one row. Since P3 it may also carry the single-mode **Perception Tap** telemetry enum (`single_yes` / `single_no`) as one more field on that same row.
2. **Any paired-analysis record** derived from the run — Reader Paired Analyses table. One open run can spawn **more than one** paired record (a different second answer for the same run is a distinct row), so all must be found, not just one. A paired record independently stores the requester's **second** pasted answer (raw), the Imbas-derived targeted prompt, and the derived delta content — including short **verbatim spans quoted from both the first and second answers** (the `open_side` / `targeted_side` of each delta item), and since P3 the paired **Perception Tap** telemetry enum (`paired_small` / `paired_noticeable` / `paired_large`). It joins back to the run by **`Open Run ID` = the run's `Request ID`** (there is no Airtable link field; the join is by that text value). All of this content lives *on* the row — deleting the row removes it, the perception field included.
3. **Any share record** created from the run — Inspection Shares table. The Reader v2 P4 redesign changed the share's shape. A **P4 share no longer stores the full answer**: it holds the raw **Question**, the **Mode** (`single` / `paired`), a **Receipt Hash** foreign key (§2), short **verbatim excerpts** in **Findings JSON** (single-mode: the finding `anchor` spans; paired-mode: the `open_side` / `targeted_side` spans), a nullable **Gap Estimate**, **Visibility**, **Reviewed Status**, and — once a reader flags it — a **Report Flag**. A P4 share is therefore a *partial* copy: the requester's question and the quoted excerpts live here and must be deleted, but the full pasted answer does not. **Legacy pre-P4 shares still exist** and remain **denormalized full copies** (question + full raw answer + derived content), so the walk handles both shapes. A **report is not a separate record**: it sets `Report Flag` on this same row, so deleting the row removes the report with it — there is no report store to purge.
4. **The stored raw text** — lives *on* rows 1 and 3 (no separate blob store). Removed when those rows are removed.
5. **The derived inspection content** — lives *on* rows 1 and 3. Removed when those rows are removed.
6. **Any candidate-lead copy** that retained the text — *NOT YET BUILT* (candidate-case flag / future leads store). A lead stores metadata + delta summary only, and pasted text only under an explicit consent checkbox. No leads store exists today — P4 shipped the Inspection Shares redesign, not a leads store. When a leads store ships, add it here.

**Not in the closure set (recorded so no one assumes content hides there):**
- **Redis** holds only aggregate counters — rate-limit windows, monthly spend (`reader:spend:${month}`), the share-create-day counter (`share:create:d:${date}`), and the P3 per-receipt perception write-cap counter (`reader:perception:${receiptHash}`, an integer of writes with a 24h TTL). These carry no run content — the perception counter keys off the receipt *hash*, never the answer text — and expire on their own TTLs. Nothing to delete per-request.
- **Downloaded receipts and copies on other people's machines** are outside Imbas control. The public policy states this boundary plainly; Imbas deletes what Imbas holds.
- **OG/link-preview images** carry no answer text by design.

---

## 2. Storage map (current implementation)

| # | Location | Table | What it holds |
|---|----------|-------|---------------|
| 1 | Run row | Reader Runs `tblqmHiOCQ5YSXBN3` | Question, Answer (raw); The Read, What Was Left Out, How It Was Shaped, Inspection Note, Finding Types, Gap Estimate, Estimate Rationale (derived); Source/Reader Output/Receipt hashes; Perception Tap (P3 single-mode telemetry enum, nullable); provenance + version fields |
| 3 | Share row(s) | Inspection Shares `tbliYeeM5n0TSVrxf` | **P4 shape:** Share ID; Question (raw); Mode; Receipt Hash (foreign key to the run or paired row — see below); Findings JSON (short verbatim excerpts, **no full answer**); Gap Estimate; Reviewed Status; Report Flag; Visibility. **Legacy pre-P4 shape (still present):** Share ID; Question, Answer (full raw copy); The Read, What Was Left Out, How It Was Shaped, Inspection Note, Completeness (derived copy); labels; visibility |
| 2 | Paired analysis | Reader Paired Analyses `tblP1ekWWWscz6pBG` | Open Run ID (join to the run's Request ID); Targeted Prompt (derived), Targeted Answer (raw second answer); Delta Items — JSON with verbatim `open_side`/`targeted_side` spans from both answers; Signal Patterns, Gap Estimate, Estimate Rationale (derived); Targeted Prompt/Answer + Receipt hashes; Perception Tap (P3 paired-mode telemetry enum, nullable); Estimate Type, Rubric/Paired Method/Schema versions; Created |
| 6 | Candidate lead | — | NOT YET BUILT (future leads store) |

A **P4 share carries a real foreign key**: its **`Receipt Hash`** equals the originating run's `Receipt Hash` (single-mode) or the paired-analysis row's `Receipt Hash` (paired-mode) — the same possession-proof hash the share was created against — so a P4 share is found by that hash without recomputing content. **Legacy pre-P4 shares carry no such key** and are still matched by content (identical Question + Answer, and the run's Source Content Hash) or by the Share ID the requester provides, so the walk keeps both paths. A **paired analysis** also carries an explicit text join: its **`Open Run ID`** equals the originating run's **`Request ID`** (Reader Runs field). So the walk must read the run's **`Request ID`** and **`Receipt Hash`**, and each paired row's **`Receipt Hash`**, **before** deleting anything, then query shares by Receipt Hash and paired analyses by Open Run ID.

---

## 3. The manual walk (per request)

Performed by a person, within 7 days, per the public policy.

1. **Identify.** From the request, capture the identifier(s): the **Share ID**, or the **approximate time + question** of the run.
2. **Locate the run row.** In Reader Runs, find the row by Question + Created timestamp; confirm identity against Source Content Hash where the requester can supply enough to recompute, otherwise by matching question/answer text. Note its record ID, its **`Request ID`** (the paired-analysis join key), **and its `Receipt Hash`** (the single-mode share join key). Capture all three now, before any deletion.
3. **Locate every share row.** In Inspection Shares, find rows three ways, because P4 and legacy shares differ: (a) by **`Receipt Hash`** — the run's Receipt Hash from step 2 for single-mode shares, and each paired row's Receipt Hash from step 4 for paired-mode shares (this finds P4 shares directly through their foreign key); (b) by **Share ID**, if the requester gave one; and (c) by matching **Question** — plus **Answer** for legacy pre-P4 shares, which still carry the full raw answer. A run may have been shared more than once, or shared without the requester quoting the ID, so run every applicable path. Note all record IDs.
4. **Locate every paired analysis.** In Reader Paired Analyses `tblP1ekWWWscz6pBG`, find **all** rows where `Open Run ID` equals the run's `Request ID` (from step 2). One run may have several — a distinct second answer each. Note all record IDs **and each row's `Receipt Hash`** — a paired-mode share joins to its paired row by that hash (step 3), so capture it before deleting.
5. **Locate candidate-lead copies.** NOT YET BUILT — skip until a leads store exists. When built: find leads that retained this text (consent-checkbox rows); note IDs.
6. **Delete.** Remove all located records: the run row, every share row, **and every paired-analysis row** (then candidate-lead rows when those exist). Deleting each Airtable row deletes the content it carried — none has a separate store: the run row's raw text and derived content; the paired row's second answer, targeted prompt, and both-side delta spans; a **P4 share's** Question, Findings-JSON excerpts, Gap Estimate, Mode, Receipt Hash, and any Report Flag (the report is a field on the row, so it dies with the row); and a **legacy share's** full raw answer and derived copy.
7. **Verify residue = zero** (section 4).
8. **Record** the fulfilment (date, identifiers, what was removed) in the operator's deletion log.

---

## 4. Zero-residue verification

After deletion, prove nothing survived:

- **Reader Runs:** query for the run's Question / Source Content Hash — expect **0 rows**.
- **Inspection Shares:** query for the Share ID(s), for the **Receipt Hash(es)** — the run's and each paired row's, which catches P4 shares by their foreign key — and for the matching Question (plus Answer for legacy shares) — expect **0 rows**.
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

### 2026-07-09 (UTC) — v2 P3 procedure proof, redesigned single-mode flow

- **Namespace:** `DELETE_TEST_READER_V2_P3_20260709T141930Z` (carried inside the pasted answer).
- **Origin:** the authorized Reader v2 interaction-redesign (paste-first / result-hero) verification run. One paid call total: a real `/api/read` single-mode open run against the production endpoint the shipped workbench bundle calls. The redesigned UI then rendered that exact payload end to end at 380px (result hero: "Candidate gap estimate: 2 of 3 (unvalidated)", summary "Reader found 4 candidate missing items"). Source was `agent`, not fallback.
- **Closure set located:**
  - Run row `recUbUmucZDPiPNfs` in Reader Runs `tblqmHiOCQ5YSXBN3`, located by content namespace (find step proven, not the held ID). Its `Request ID` = `a19b98f62503fa14` and `Source Content Hash` = `d590a2d110c8663959a7152398af492d37925706793904af03ed4344380f9e0b`, both captured before deletion per §3 step 2 and matched against the run receipt.
  - Inspection Shares `tbliYeeM5n0TSVrxf`: queried by namespace **and** by Question — 0 rows. The run was never shared.
  - Reader Paired Analyses `tblP1ekWWWscz6pBG`: queried by `Open Run ID` = `a19b98f62503fa14` — 0 rows. No paired (Act 2) run was performed.
  - Candidate-lead store: still NOT YET BUILT (P4), so not in this closure set.
- **Deleted:** the run row `recUbUmucZDPiPNfs`. Removing it removed the raw answer and derived content with it — no separate blob store.
- **Verified residue = 0:** Reader Runs 0 rows (re-queried by namespace and by Request ID); Inspection Shares 0 rows; Reader Paired Analyses 0 rows. Redis holds counters only, nothing per-run to delete.
- **Result: PASS** — zero residue across every live closure-set location.

### 2026-07-10 (UTC) — v2 P4 procedure proof, paired run + unlisted share (first share-exercising proof)

- **Namespace:** `DELETE_TEST_READER_V2_P4_20260710T172205Z` (carried inside BOTH the pasted open answer and the targeted answer).
- **Origin:** the authorized Reader v2 P4 unlisted-share verification. One paid paired run against production: a real `/api/read` open run, then a real `/api/read-paired` targeted run (two Opus calls, counted as the single authorized paired run per the P2 precedent). A share was then minted from the verified **paired** receipt via `/api/inspection-share` (no model spend) and rendered through `/api/inspection/:shareId`. Unlike P1–P3 — which were never shared — this is the first proof that exercises the **Inspection Shares** row, closing the one closure-set location the earlier proofs could not.
- **Closure set located (all three, before deletion per §3):**
  - Run row `recj2xQsBE2HkyYkY` in Reader Runs `tblqmHiOCQ5YSXBN3`, located by content namespace (find step proven, not the held ID). `Request ID` = `641279d0d7854402`, `Source Content Hash` = `bd80099f0b13cf9bae757fa71b6c7037643a053b1bf9712ba229132f7bac6ad5`, `Receipt Hash` = `7fb06f32b6310ce01091c5aa970be14cc6e070b87d7b437d531299b407555d4a` — all captured and matched against the open receipt.
  - Paired-analysis row `recNGjZxuiLSoPxtF` in Reader Paired Analyses `tblP1ekWWWscz6pBG`, located by its join key `Open Run ID` = `641279d0d7854402` (find step proven). `Receipt Hash` = `6dd9143c24ceaf3c1bf1aec8e8f1ad52af6539a9140a8390288f61171ff5af3a`. It carried the raw targeted answer, the derived targeted prompt, and the both-side verbatim delta spans.
  - Share row `recOQ8s0GzQwhDA9H` in Inspection Shares `tbliYeeM5n0TSVrxf`, located by `Share ID` = `4Zz-ckuacHAzyIPOv05nyV1K` and by `Receipt Hash` = `6dd9143c…` (the paired hash — the possession-proof link). Mode `paired`, `Gap Estimate` 3.
- **No-full-answer verified (the P4 guarantee):** the share row's legacy `Answer` field was empty; only `Question` + `Mode` + `Receipt Hash` + `Findings JSON` (the allowlisted delta spans) + `Gap Estimate` persisted. The live `/api/inspection/:shareId` projection carried no full answer — neither pasted answer's namespace marker appeared, and the longest published verbatim span was 153 chars against the 789/835-char source answers. The full answers existed only in the run row (`Answer`) and the paired row (`Targeted Answer`), both in the closure set.
- **Deleted:** all three rows — share `recOQ8s0GzQwhDA9H`, paired `recNGjZxuiLSoPxtF`, run `recj2xQsBE2HkyYkY`. Removing the paired and run rows removed both raw answers, the targeted prompt, and the delta spans with them — no separate blob store.
- **Verified residue = 0:** Reader Runs 0 rows (by namespace, Request ID, and Receipt Hash); Reader Paired Analyses 0 rows (by Open Run ID, Receipt Hash, and namespace); Inspection Shares 0 rows (by Share ID and Receipt Hash). Serving layer confirmed the removal end to end: `/api/inspection/4Zz-…` returned `{ok:false,error:"not_found"}` and the share page returned HTTP 404 (branded shell). Redis holds counters only, nothing per-run to delete.
- **Result: PASS** — zero residue across every closure-set location, including the Inspection Shares store that P1–P3 never exercised.

### 2026-07-11 (UTC) — legacy QA-seed cleanup batch (6 pre-P4 Inspection Shares)

- **Not a procedure proof — a one-time authorized cleanup.** Unlike the P1–P4 entries above (each a namespaced deletion drill against a run the pipeline had just produced), this batch removed the six **pre-existing** rows that were the entire contents of Inspection Shares `tbliYeeM5n0TSVrxf` at the time: QA/test seeds left over from Workbench and security-pass verification, none organic, none carrying a Receipt Hash foreign key (legacy denormalized shape, §2 / S4.3). They predate the namespaced-proof convention, so no namespace marker applies; each was matched by record id and, where present, by Share ID.
- **Authorization & precondition state.** Run under **explicit founder authorization** to delete these as QA seeds. The W-003 13-case disposition sitting was **PENDING, not begun** — scheduled and deliberately deferred for a rested review; this cleanup is dormant-defect / claims-truth closure, not gated on disposition content, and one of the six shares was returning HTTP 502 in production at the time. Recorded here (and in the commit body) that this ran on founder authorization, **not** on a satisfied W-003 precondition.
- **Basis.** The authorized read-only inventory (2026-07-10; folded into the P4 code audit §4): 6 rows total. The cleanup script held an abort-on-surprise guard — delete only the six inventoried ids, abort untouched if the table contained any other row — so a real share minted after the inventory could not be destroyed. The table still held exactly those six, so it deleted them.
- **Closure set located (all six — the entire table):**
  - `recciHUvtECdvHfZB` — Share ID `K4K5Z8dl3MJ7hsRp-JlASu_d`, Case Label "TEST" · Source "Workbench inspection", Created 2026-07-03, full legacy `Answer` present. Was **HTTP 502** at `/inspection/:shareId` — the live broken share.
  - `recjCE573bqstz9xl` — Share ID `UXHA6bxb8eUljUhAodDHFa2P`, Source "Security pass verification", Created 2026-07-07, full legacy `Answer` present. Was HTTP 200.
  - `reczrfl474SDgU5cx` — Share ID `97Ly9KjAx-PYJGYd62kDWfIO`, Case Label "TEST" · Source "Workbench inspection", Created 2026-07-03, full legacy `Answer` present. Was HTTP 200.
  - `recFxXdkSjJO6obdp`, `recIs2D9bOHX0A9K5`, `recKrGVbBGggynZjx` — three blank orphan rows: no Share ID, no labels, no `Answer`. No Share ID means the per-Share-ID residue query cannot see them; the per-record-id and full-list checks below are what close them.
- **Deleted:** all six rows via `DELETE /v0/appfxHraqlcpP1AAP/tbliYeeM5n0TSVrxf/:id` — each returned HTTP 200 `{deleted:true}`. Removing the three legacy rows removed their full `Answer` copies with them (no separate blob store).
- **Verified residue = 0:**
  - **Full table:** re-listed — **0 rows** (the authoritative catch for the three blank, Share-ID-less orphans).
  - **Per Share ID (separately, each of the three):** `{Share ID}='K4K5Z8dl3MJ7hsRp-JlASu_d'` → 0 rows; `…'UXHA6bxb8eUljUhAodDHFa2P'` → 0 rows; `…'97Ly9KjAx-PYJGYd62kDWfIO'` → 0 rows.
  - **Per record id (all six):** GET returned HTTP 403 for each. Under the read-only `data.records:read` token Airtable answers a now-nonexistent record id with 403 (forbidden) rather than 404 (not found); the empty full-table list above is the authoritative proof the ids are gone.
  - **Serving layer:** origin returns **HTTP 404** for all three Share IDs (verified with a cache-busting query param). The previously-502 share (`K4K5Z8…`) now 404s live from origin (`x-vercel-cache=MISS`) — the production breakage is closed. The other two briefly returned a **stale edge-cached 200** (`x-vercel-cache=HIT`) under the found-row `s-maxage=3600, stale-while-revalidate=86400` header; the origin 404s them, the 404 is `no-store` so the cache cannot repopulate, and the entries expire within the hour and are purged outright by the next deployment.
  - Redis holds counters only, nothing per-share to delete.
- **Result: PASS** — zero residue at the data layer and the serving origin. Inspection Shares now empty (0 rows).

<!-- TEST-LOG -->
