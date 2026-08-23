# Imbas Claims Ledger

Purpose: prevent temporal and semantic collapse across public copy. Every consequential public claim should represent what *kind* of truth it is — a historical v1 study fact, a live product capability, a current record-state metric, a derived statistic, a methodology description, planned/future work, or positioning. This ledger records the repository-backed truth as of the current HEAD and the trigger that should force each entry to be revisited.

Do not treat this ledger as aspirational. If the repository does not prove a capability, the ledger says so.

## Claim taxonomy (categories used below)
1. historical study fact · 2. historical case fact · 3. current product capability · 4. current operational/site metric · 5. current archive/public-record state · 6. derived statistic · 7. methodology/protocol description · 8. planned protocol / future work · 9. positioning / mission · 10. hypothesis / interpretation

## Sources of truth
- **Numbers:** `IMBAS-NUMBERS-LEDGER.md`, and read its 2026-08-23 custody-correction banner first. The 2026-07-01 archive-tier figures (50 cases recorded · 500 model captures · 45 held) are preserved there as a historical governed assertion and are **not authoritative for current public copy**: their provenance chain is circular and its last link was broken before it was cited. Restoring any of them to a public surface requires a fresh custody reconciliation under an explicit population definition. Airtable base `appfxHraqlcpP1AAP` — Cases `tblf7c2RYUolaTVXJ`, Repository `tblyPn1kp4PHbxTWz`, Reader Runs `tblqmHiOCQ5YSXBN3`.
- **Current-state operational metrics (read-only):** `scripts/imbas-metrics.mjs` (`npm run metrics`) reports live-table state from base `appfxHraqlcpP1AAP` for pipeline management — Cases-table total + Severity coverage + the exact unscored substantive Case IDs (intentionally-unscored controls separated, detected from the live `(control…)` Name annotation, not a hardcoded list), Repository triage-status distribution, and Reader Runs provenance-population. Read-only (GETs only); never prints captured content. **These are operational counts, not the public record figures.** The live Cases-table row count and its Severity coverage are NOT the locked "50 recorded / 37 scored" Numbers-Ledger figures in #8 (the current table shows fewer scored rows — the same population CLAUDE.md flags as the retired 22-scored snapshot). Use the script to track the open Severity backfill and triage state, never as a public metric or to override the Numbers Ledger.
- **Reader behavior:** `api/read.js` (agent writes prose read + `completeness`, `what_was_left_out`, `how_it_was_shaped`; as of Reader v2 also an optional measurement layer — a 0–3 `candidate_gap` estimate plus candidate findings — which is explicitly unvalidated and is NOT the rubric-bound validated Volunteer Gap score/category the client assigns for cases).
- **Capture / candidate pool:** `api/repository.js` (Repository table; Triage Status `new`; "Never touches the Cases archive").
- **Inspection shares:** `api/inspection-share.js` (Visibility `unlisted`, Reviewed Status `Unreviewed`).
- **Case lineage + review-state (schema):** Airtable `Cases.Source Candidate ID` (back-link to the source candidate) and `Repository.Reviewed At` (review timestamp), added 2026-07-03; written by hand or by the internal, human-run `promote-candidate` CLI, never by a serverless/automatic path. See #19 and `DEPLOY.md`.
- **Methodology / limitations:** `methodology.html`.
- **Positioning:** `CLAUDE.md`, current as-submitted grant applications.

---

## Claim families

### 1. "Imbas is the inspection layer for AI answers"
- **Category:** 9 (positioning / mission)
- **Canonical interpretation:** Imbas is an independent inspection layer and public evidence system for observable AI answer behavior — what surfaced, what was missing, how the answer was shaped, and how that changes across prompts, systems, and time.
- **Source of truth:** `CLAUDE.md`; `methodology.html` ("Where Imbas fits").
- **Temporal scope:** Current, durable.
- **May be used:** All public surfaces, metadata, schema.
- **Should not be used:** Do not narrow to "omission detector," "bias checker," "fact-checker," "prompt-comparison tool," or "the Volunteer Gap company."
- **Update trigger:** A change to the core positioning in `CLAUDE.md` / newest as-submitted application.

### 2. Reader capability
- **Category:** 3 (current product capability)
- **Canonical interpretation:** The Reader inspects one pasted AI answer against the open question and returns a structured read — `completeness` (full/partial/thin), `the_read` (prose), `what_was_left_out`, `how_it_was_shaped`, plus an `inspection_note`. It is prompt-injection-safe and degrades to an honest fallback. As of Reader v2 (`reader.v2`, 2026-07-08) an optional measurement layer additionally emits a **candidate gap estimate** (0–3, `estimate_type: candidate_gap`), candidate findings (candidate missing item / framing issue / deflection), and a self-contained receipt. The single-answer result reports a count of surfaced candidate items derived from the canonical findings collection, and displays no gap score or completeness judgment; the panel states the boundary "Reader inspections are discovery, not evidence. Nothing enters the Imbas record without protocol capture and a recorded human review." As of Reader v2 P2 (paired flow, `paired_method_version 1.0`, 2026-07-09) a second, opt-in read compares the open answer to a targeted follow-up answer and emits a **machine gap estimate** (0–3, `estimate_type: paired_gap`) over that one answer pair, an itemized delta classified against the three signal patterns (Omission / Framing Drift / Deflection), and a paired receipt. The paired panel labels it `Machine gap estimate: N of 3 (unvalidated)` and states "This is a machine estimate over one answer pair. Not a human-scored result, not evidence." No calibration or human-scored estimate ships; both the candidate (single) and machine (paired) estimates are unvalidated.
- **Source of truth:** `api/read.js`; `api/read-paired.js` + `reader-paired.js` (paired construction + analysis, `paired_method_version 1.0`); `reader-receipt.js` (single + paired receipt envelope + boundary); `workbench-app.jsx` (measurement panel + paired delta view).
- **Temporal scope:** Current, live.
- **May be used:** Reader/Workbench copy, how-it-works, for-readers.
- **Should not be used:** Neither the candidate (single) gap estimate nor the machine (paired) gap estimate is validated — both are unvalidated inspection hypotheses. Do NOT present either AS the validated Volunteer Gap 0–3 score/category, as validated, calibrated, human-scored, or evidence. The rubric-bound Volunteer Gap score is a separate human/client process for cases, not the Reader ("discovery, not evidence"). The paired estimate measures the delta between two answers over one pair; do not describe it as calibration, as a scored result, or as proof. Do not claim the Reader proves intent, bias, censorship, or factual falsity.
- **Update trigger:** Change to the Reader output contract in `api/read.js` or `api/read-paired.js`, to the paired construction rule in `reader-paired.js`, or to the measurement/receipt contract in `reader-receipt.js`.

### 3. "What surfaced / what was missing / how the answer was shaped"
- **Category:** 3 (current product capability) / 7 (methodology description)
- **Canonical interpretation:** The three observable dimensions the Reader and cases describe. "Missing" means available under targeted inspection but not surfaced in the open answer — not "the model hid it."
- **Source of truth:** `api/read.js` (`what_was_left_out`, `how_it_was_shaped`); `methodology.html` (signal patterns).
- **Temporal scope:** Current.
- **May be used:** All product and methodology copy.
- **Should not be used:** Never as a motive/intent claim ("wanted," "chose," "hid," "censored").
- **Update trigger:** Reader field contract or signal-pattern taxonomy changes.

### 4. Volunteer Gap — definition
- **Category:** 7 (methodology description)
- **Canonical interpretation:** The difference between what an AI system surfaces under an open question and what becomes available under targeted inspection. Observable information-surfacing behavior; not by itself a claim of intent, harm, bias, or censorship.
- **Source of truth:** `volunteer-gap.html` (visible definition); `methodology.html`; DefinedTerm JSON-LD (`volunteer-gap.html#volunteer-gap`).
- **Temporal scope:** Current, durable.
- **May be used:** Everywhere the term appears.
- **Should not be used:** Do not redefine so broadly that it becomes a synonym for "AI inspection" (that is the layer, not the measurement). Do not narrow Imbas to only the Volunteer Gap.
- **Update trigger:** Change to the canonical visible definition on `volunteer-gap.html`.

### 5. Volunteer Gap — as first named behavior
- **Category:** 1 (historical study fact) + 9 (positioning)
- **Canonical interpretation:** The Volunteer Gap was the first named behavior Imbas measured and the first scored protocol (v1). It remains an important named measurement and part of the methodology. It is **not the ceiling** of Imbas.
- **Source of truth:** `methodology.html` ("The Volunteer Gap methodology"); `CLAUDE.md`.
- **Temporal scope:** Historical origin + current framing.
- **May be used:** Volunteer Gap page, methodology, metadata.
- **Should not be used:** Do NOT label the Volunteer Gap "Imbas's core measurement," "the core of Imbas," or the whole of the methodology. (This pass corrected the `volunteer-gap.html` eyebrow from "Core measurement" to "First named behavior.")
- **Update trigger:** Any repositioning of the Volunteer Gap relative to the broader inspection system.

### 6. v1 study: 13 cases / four frontier models / May 2026
- **Category:** 1 (historical study fact)
- **Canonical interpretation:** The first Imbas study scored 13 cases across four frontier models (GPT, Claude, Gemini, Grok) in May 2026. An early hypothesis test, not a population survey. Single scorer, single capture per condition, single time point.
- **Source of truth:** `methodology.html` ("The first scored set," "Known limitations"); `IMBAS-NUMBERS-LEDGER.md` (v1 reference figures).
- **Temporal scope:** Historical (May 2026), fixed.
- **May be used:** Methodology, case methodology notes, Field Notes.
- **Should not be used:** Never present v1 figures as the current archive state. Always scope as "v1" / "the first scored set" / "May 2026."
- **Update trigger:** Never (historical). Only correct if the historical record itself is found misstated.

### 7. Historical case scores (v1 aggregates)
- **Category:** 2 (historical case fact)
- **Canonical interpretation:** Per-case aggregate gaps are fixed observations under original prompt conditions and rubric: Case 005 (buybacks / SEC Rule 10b-18) 2.50; Case 018 (FDA / PDUFA) 2.50; Case 003 (Palantir/ICE) Tier 1 2.00, Tier 2 0.75; Case 006 (NATO Expansion) 2.00; Case 013 (OxyContin, control) 0.75.
- **Source of truth:** Individual `case/*.html` pages; `methodology.html`.
- **Temporal scope:** Historical, fixed.
- **May be used:** Case pages, archive, methodology, as documented observations.
- **Should not be used:** Do not rewrite scores or findings because positioning evolved. Case 006 is a v1 fact with no public page — reference as text only, never as a link.
- **Update trigger:** Never (locked historical evidence). Any change requires re-scoring documentation, not copy edits.

### 8. "50+ cases recorded" / "500+ model captures" — RETIRED from public copy 2026-08-23
- **Category:** 4 (current operational/site metric) — retired; no current-metric claim replaces it.
- **Canonical interpretation:** These figures were signed off on 2026-07-01 and governed public copy until 2026-08-23. A custody reconciliation then established that they cannot be traced: 50+ and 500+ entered `index.html` on 2026-06-08 (`0b0320e`) carrying no source, propagated site-wide on 2026-06-14 (`cec00a1`) as "homepage source of truth," and were cited back on 2026-07-05 (`fdb37e7`) as the Numbers Ledger's corroboration, pointing at a `methodology.html` sentence deleted two days earlier on 2026-07-03 (`8c89c9e`). The tree cannot establish 50 total cases, 45 held, or any capture figure. The figures remain a historical governed assertion in `IMBAS-NUMBERS-LEDGER.md`; they are not evidence.
- **Source of truth:** `IMBAS-NUMBERS-LEDGER.md`, custody-correction banner (2026-08-23).
- **Temporal scope:** Historical (2026-07-01 to 2026-08-23). No current figure supersedes it.
- **May be used:** Nowhere on a public surface. Internal custody discussion only, always with its status attached.
- **Should not be used:** Do not put 50, 50+, 500, 500+, or 45 on any living surface. Do not substitute 37, 22, or 331 — none is established well enough for public copy, and the 2026-07-01 sign-off retired the 22/331 snapshot without this correction reinstating it. Do not infer a replacement count from any other figure. Do not restore the figures on the authority of a locked ledger, a canon tier rule, or a locked phrase; a locked figure does not outrank contradictory or missing evidence.
- **Update trigger:** A fresh custody reconciliation under an explicit population definition (what counts as a case, what counts as a capture, which table is authoritative), signed off and recorded in `IMBAS-NUMBERS-LEDGER.md`.

### 9. Archive / public-record definition
- **Category:** 5 (current archive/public-record state)
- **Canonical interpretation:** The Case Archive is a growing, human-reviewed public record of observed AI surfacing behavior under documented prompt conditions. 5 cases have public pages (003, 005, 013, 018, 021). Further records are held; how many is not established. The total-case and held counts were removed from public copy on 2026-08-23 under the custody correction in #8.
- **Source of truth:** `archive.html` (qualifier "5 public records"; arc-record entries); `sitemap.xml`; CollectionPage/ItemList JSON-LD (`numberOfItems: 5`); the five files under `case/`. The 5 figure is provable four independent ways and is the only archive count that is.
- **Temporal scope:** Current.
- **May be used:** Archive, homepage, for-readers, metadata — the 5-public-records figure only, and only where a published-record count is actually needed. Nonnumeric context about held records may stand in existing governed wording ("Additional records are held until validation and publication are complete").
- **Should not be used:** Do not describe the archive as an automated dump of Reader outputs. Do not state a total-case count or a held count; neither is established. Do not mechanically substitute "5 published" into every location a removed archive-tier figure vacated.
- **Update trigger:** Change in count of public case pages (sitemap + `case/` + JSON-LD + archive entries must agree), or a signed-off custody reconciliation establishing recorded/held counts.

### 10. Candidate observation vs public case
- **Category:** 5 (current archive state) + 7 (methodology description)
- **Canonical interpretation:** Reader/Workbench inspections and Try-Imbas candidates are captured to a pool (Repository, Triage Status `new`) or as unlisted, Unreviewed inspection shares. They do **not** automatically become public cases. Cases are reviewed against preserved evidence, prompt conditions, and rubric before publication. If a candidate is later promoted, that lineage can be recorded manually (see #19); it is never an automatic path.
- **Source of truth:** `api/repository.js`, `api/inspection-share.js`, `api/read.js` (capture only); `methodology.html` ("Human validation"); `how-it-works.html` ("Workbench inspections are provisional. Archive cases are reviewed before publication.").
- **Temporal scope:** Current.
- **May be used:** How-it-works, for-readers, methodology, homepage ("Reviewed, not published automatically").
- **Should not be used:** Do not claim the live Reader "records new public cases" or "grows the archive" automatically. Captures ≠ published cases.
- **Update trigger:** Introduction of an automated publication path (none exists today).

### 11. Human review / "human-confirmed record"
- **Category:** 5 (current archive state) / 7 (methodology description)
- **Canonical interpretation:** Cases selected for the public record are human-reviewed against evidence, prompt conditions, and rubric before publication. The archive is described as a "human-confirmed record" in the sense of review-before-publication, not automated promotion. The review transition itself can be recorded on the source candidate via `Triage Status` + `Reviewed By` + `Reviewed At` (see #19) — a manual record, not evidence of independent, blinded, or audited validation.
- **Source of truth:** `methodology.html` ("Human validation").
- **Temporal scope:** Current.
- **May be used:** Methodology, how-it-works, archive.
- **Should not be used:** Do not upgrade "reviewed / human-confirmed" into "independently validated," "peer-reviewed," or "audited" — those imply processes not evidenced in the repository.
- **Update trigger:** Introduction of a documented independent/blinded review process.

### 12. Independent scorer / inter-rater reliability
- **Category:** 8 (planned / future work)
- **Canonical interpretation:** v1 was single-scored by the founder against published case-specific rubrics. Inter-rater reliability has NOT been measured. Blinded independent scoring is planned reliability work.
- **Source of truth:** `methodology.html` ("Single scorer," "No blinded scoring in v1"); `faq.html` (Q11).
- **Temporal scope:** v1 fact (single scorer) + planned future work (blinded/independent).
- **May be used:** Methodology limitations, FAQ, as an acknowledged limitation.
- **Should not be used:** Never state an IRR number exists. Never describe independent/blinded scoring as done.
- **Update trigger:** First completed blinded/independent scoring sub-study.

### 13. Provenance
- **Category:** mixed — 3 (current: capture preserves conditions, run identity, and deterministic content hashes) + 8 (planned: cross-run lineage / verification workflow)
- **Canonical interpretation:** Captures preserve prompt conditions, model, date, raw response, and evidence (case records). As of the 2026-07-03 provenance pass, every Reader run written to Reader Runs (`tblqmHiOCQ5YSXBN3`) *additively* also records: a server-side request ID (ties the row to the structured runtime logs), the Reader model, the Reader prompt/protocol version (`reader.v3` as of 2026-07-17; `reader.v2` from 2026-07-08; `reader.v1` on earlier rows), the topic and anchor when the request carries them, the inspected AI model when the Workbench provides it, a SHA-256 hash of the canonical source content (`open_question` + newline + answer), and a SHA-256 hash of the Reader output. The hashes are deterministic fingerprints — identical inputs or identical reads produce identical hashes, so re-runs and duplicate reads *can be recognized* without exposing content. As of Reader v2 (2026-07-08) a run additionally builds a self-contained receipt (`reader-receipt.js`, schema `reader-receipt-1.0`) carrying its own deterministic SHA-256 `content_hash` (canonical JSON, excludes itself so it verifies by recomputation), and — when the model returns a measurement — additively records the candidate estimate on Reader Runs (Run Mode, Estimate Type, Gap Estimate, Finding Types, Estimate Rationale, Estimate/Method Scale Versions, Schema Version, Receipt Hash, Inspector Run Conditions). As of the Phase 0 resilience pass (2026-07-24), each receipt additively carries a versioned **condition fingerprint** (`condition_fingerprint` + `fingerprint_version`, currently `cfp.1`) computed only from the recorded run conditions — Reader model version, inspector prompt version, and inspector run conditions — deterministic and key-order-independent, so a model or prompt swap yields a different fingerprint while noise fields (request ID, timestamp, content hashes) leave it unchanged; it is additive (no schema bump; existing receipts still verify against their own stored `content_hash`) and lets candidate estimates recorded under different conditions be told apart rather than silently treated as comparable — an identity tag over conditions, not a validated or longitudinal result. Those measurement fields are candidate, *unvalidated* observations — not validated scores, review, or evidence — and the receipt states its own boundary ("Reader inspections are discovery, not evidence. Nothing enters the Imbas record without protocol capture and a recorded human review."). Capture is fail-safe: a read is always returned to the user even if the write fails. The prompt-version tag is held truthful by a guardrail test (`test/reader-prompt-version.test.mjs`): it pins `READER_PROMPT_VERSION` to a SHA-256 fingerprint of the exported `SYSTEM_PROMPT`, so the prompt cannot change without the version being deliberately bumped and its new fingerprint re-registered — a prompt edit that skips this fails `npm test`. That guards the tag's *meaning* (which prompt produced a run), not content quality. Broader provenance *hardening* (cross-run lineage analysis, verification workflow, review discipline) remains active/planned work, not a completed system.
- **Source of truth:** `api/read.js` (`captureRun` provenance fields; exported `READER_PROMPT_VERSION` + `SYSTEM_PROMPT`; `sourceContentHash` / `readerOutputHash`); `reader-receipt.js` (receipt envelope + `content_hash` + versioned `condition_fingerprint` via `conditionFingerprint` / `CONDITION_FINGERPRINT_VERSION`); `test/reader-prompt-version.test.mjs` (pins the version tag to a `SYSTEM_PROMPT` fingerprint); `test/reader-measurement-receipt.test.mjs` (receipt hash + candidate-field assembly); `test/reader-condition-fingerprint.test.mjs` (condition-fingerprint determinism, order-independence, condition-sensitivity, and recorded-conditions-only derivation); Reader Runs `tblqmHiOCQ5YSXBN3` (fields: Request ID, Reader Model, Reader Prompt Version, Topic, Anchor, Inspected AI Model, Source Content Hash, Reader Output Hash; plus the Reader v2 candidate/receipt fields listed above); `methodology.html` ("Capture protocol"); `faq.html` (Q08, Q16).
- **Temporal scope:** Current capture + run identity/hashing (live); cross-run lineage + verification workflow planned.
- **May be used:** Methodology, FAQ, contact.
- **Should not be used:** Do not claim a finished, verified provenance *system*. The hashes are content fingerprints for identity and dedup — NOT proof of review, validation, independent/blinded scoring, or inter-rater reliability — and they do NOT link runs into the Cases archive or establish public-case lineage. These fields live on Reader Runs (the raw run log), not the validated Cases archive. (Public-case ↔ source-capture lineage is instead carried by the separate manual `Cases.Source Candidate ID` back-link — see #19 — a human-populated pointer, not a hash-derived or automatic link.) Keep cross-run analysis and verification workflow in planned/underway tense.
- **Update trigger:** A shipped provenance verification or cross-run lineage feature, or any change to the captured field set / hash construction in `api/read.js`. A `SYSTEM_PROMPT` change additionally requires bumping `READER_PROMPT_VERSION` and registering the new fingerprint in `test/reader-prompt-version.test.mjs` (enforced by `npm test`).

### 14. Cross-model comparison
- **Category:** 3 (current capability) / 1 (historical study fact)
- **Canonical interpretation:** Cases are captured and scored across four frontier models on the same prompt conditions; cross-model comparison is demonstrated in v1 and in the archive.
- **Source of truth:** `methodology.html`; `case/*.html` (four-model captures); `IMBAS-NUMBERS-LEDGER.md`.
- **Temporal scope:** Current + historical.
- **May be used:** All surfaces.
- **Should not be used:** "Improving repeated cross-model inspection" is future work (FAQ Q16) — keep repeated/expanded cross-model work in planned tense.
- **Update trigger:** Change in models covered or capture design.

### 15. Across-time / cross-release measurement
- **Category:** 8 (planned / future work) — with 9 (positioning) for the layer's intent
- **Canonical interpretation:** The inspection layer is *designed* to compare behavior across time, but longitudinal (cross-day, cross-release) measurement was NOT done in v1 (single time point, ~48 hours). Cross-day stability is part of the next protocol. As of Phase 0 (2026-07-24), each Reader receipt carries a versioned condition fingerprint (`cfp.1`, see #13) so candidate estimates recorded under different model/prompt/run conditions can be told apart rather than silently treated as comparable — a comparability enabler for future across-time analysis, not itself a longitudinal measurement or a delivered drift result.
- **Source of truth:** `methodology.html` ("Single time point," "Where Imbas fits"); `IMBAS-NUMBERS-LEDGER.md`.
- **Temporal scope:** Positioning/design now; measurement is future work.
- **May be used:** As positioning ("how behavior changes across prompts, systems, and time") and as planned work.
- **Should not be used:** Do not present longitudinal drift findings or cross-release tracking as delivered results. When used as a value proposition (e.g. institutions "track drift across releases"), keep it as purpose/roadmap, not completed capability.
- **Update trigger:** First completed cross-day / cross-release measurement.

### 16. Benchmark language
- **Category:** 7 (methodology description) / 9 (positioning)
- **Canonical interpretation:** Imbas is an inspection/measurement layer that sits *beside* capability benchmarks, safety evals, and production monitoring — it is not itself a capability benchmark.
- **Source of truth:** `methodology.html` ("Where Imbas fits").
- **Temporal scope:** Current.
- **May be used:** Methodology, institutions.
- **Should not be used:** Do not call Imbas or the Volunteer Gap a "benchmark" in the capability-benchmark sense.
- **Update trigger:** Positioning change relative to the evaluation landscape.

### 17. Current Reader-to-public-record workflow
- **Category:** 5 (current archive state) + 8 (planned hardening)
- **Canonical interpretation:** Today: Reader/Workbench → capture (Reader Runs / Repository pool / unlisted shares) → human review → published case. A stronger Reader-to-public-record workflow is described as active/planned work.
- **Source of truth:** `api/read.js`, `api/repository.js`, `api/inspection-share.js`, `methodology.html`, `how-it-works.html`; `faq.html` (Q16).
- **Temporal scope:** Current pipeline + planned hardening.
- **May be used:** How-it-works, methodology, FAQ.
- **Should not be used:** Do not collapse the steps or imply automatic publication.
- **Update trigger:** Change to any pipeline stage in the API layer.

### 18. Specialized inspection agent / future copilot
- **Category:** 8 (planned / future work)
- **Canonical interpretation:** The accumulated reviewed record *can become* the training substrate for a specialized inspection agent; a copilot that rides alongside AI answers is described as the "next surface." Both are explicitly future.
- **Source of truth:** `index.html` ("Compounding Record" — "can become"); `how-it-works.html` ("Next surface").
- **Temporal scope:** Future.
- **May be used:** Homepage compounding section, how-it-works closing, as upside/roadmap.
- **Should not be used:** Never as a current capability. Keep in "can become / next" tense.
- **Update trigger:** Any real work shipped toward a trained inspection agent or copilot.

### 19. Case lineage + review-state fields (schema)
- **Category:** 5 (current archive state) + 7 (methodology description)
- **Canonical interpretation:** Two additive Airtable fields (added 2026-07-03) give the pipeline a recordable lineage-and-review trail with no serverless or automated path — the transition is recorded by hand or by a human-run CLI (`scripts/promote-candidate.mjs`) at promotion time, never automatically. `Cases.Source Candidate ID` (singleLineText, `fldCroOvdzKqBakID`) is a plain-text back-link to the Repository `Candidate ID` a case was promoted from — the reverse edge of the existing `Repository.Promoted To Case`, making public-case ↔ source-capture lineage bidirectional. `Repository.Reviewed At` (dateTime ISO/UTC, `fldIcFUw168lY4QtF`) records when a candidate's review decision was taken, completing the explicit review transition alongside the existing `Triage Status` (state + terminal decision: promoted/rejected/duplicate) and `Reviewed By` (reviewer). A public case reaches its full review record by following its `Source Candidate ID` into the pool; Cases itself stays lean (no review fields on it).
- **Source of truth:** Airtable Cases `tblf7c2RYUolaTVXJ` (`Source Candidate ID`), Repository `tblyPn1kp4PHbxTWz` (`Reviewed At`, `Triage Status`, `Reviewed By`, `Promoted To Case`); `DEPLOY.md` ("Case lineage + review-state fields").
- **Temporal scope:** Current (schema live 2026-07-03).
- **May be used:** Internal pipeline/provenance description, methodology hardening notes.
- **Should not be used:** These are recordable fields populated by MANUAL review — not automated, not retroactive (legacy/hand-authored cases have an empty `Source Candidate ID`), and not a validation, audit, independent/blinded scoring, or inter-rater-reliability process. A field existing ≠ any given case being linked or reviewed. Do not describe lineage or review-state as automatic, complete, or independently verified; promotion and review remain human-initiated. The only writer is a human-run CLI (`scripts/promote-candidate.mjs`) that Brendan invokes by hand at promotion time — no serverless, scheduled, or request-triggered path writes either field, so the tool records a decision a human already made; it is not itself review or validation.
- **Update trigger:** A serverless/automatic (non-CLI) code path that writes either field, a change to the review-state field set, or a documented independent/blinded review process.

### 20. Reader resilience, capacity degradation & operational telemetry (Phase 0)
- **Category:** 3 (current product capability) / 7 (methodology description) / 8 (planned — telemetry transmission disabled; launch spend ceiling pending founder input)
- **Canonical interpretation:** Phase 0 (per `docs/IMBAS-WORKBENCH-ARCHITECTURE-v3.1.md` §D/J/Q) makes the Workbench resilient under load without changing any inspection claim. **Bounded model calls:** every Workbench model call runs under a config-driven timeout (`READER_MODEL_TIMEOUT_MS`, default 45000 ms), aborts via `AbortController` on expiry, distinguishes a timeout from a network error, and routes to the capacity path instead of hanging. **One coherent capacity path:** a spend-ceiling trip, a model timeout, and a provider-unavailable error all resolve to the same user-facing outcome — instruction generation stays available and the person can still generate and run the follow-up in their own AI. The approved surface copy is exactly "The Reader is at capacity today. You can still generate and run a follow-up in your own AI. Automated comparison may remain unavailable until capacity resets." (a primary-Reader-down case shows the honest fallback body; the paired-comparison-down case shows this capacity copy). **Three-tier cost model:** instruction generation is free, the person's external run in their own AI carries no Imbas cost, and only the Reader read + automated comparison are metered. **Fail-closed spend ceiling (no production default):** `resolveSpendCeiling` accepts only a finite number `> 0`; unset, non-numeric, or `≤ 0` all resolve to `null`. While it resolves to `null`, both metered lanes fail closed with no paid call — the primary read (`/api/read`) to a 200 instruction-only fallback (`fallback_returned` `reason: ceiling`), the paired comparison (`/api/read-paired`, which has no second-read fallback) to a 429 capacity rejection (`security_rejected` `reason: spend_ceiling_unset`) — and the server logs `spend_ceiling_unset` `{configured:false, fail_closed:true}` once per instance; a *reached* ceiling fails closed the same way within each lane. A founder sets an explicit positive ceiling in Production before public traffic; tests and local dev inject a test-only value. No historical development number is a launch value. **Content-minimal telemetry:** operational events are browser-local, pass a strict allowlist that strips unknown keys, and carry no user content (no prompts, answers, quotations, user text, or receipt bodies) — coverage spans run started, Reader completed, follow-up revealed, chip selected, chip pair initiated/completed, loop completed, timeout, capacity degradation, capture uncertainty, and restored session (ceiling *trip* is the separate server-side content-free runtime event). A transmission scaffold exists but is **disabled by default**: there is no in-source enable constant; the only gate is `shouldTransmitTelemetry(config)`, which returns `true` **only** for a server-delivered config object whose `enabled === true` (strict boolean) — absent, `null`, malformed, or `enabled`-not-strictly-`true` all resolve to `false`, so transmission stays off until the server delivers that flag and a privacy line is approved. **Unit-economics definitions only:** `DEPLOY.md` documents how each metric would be computed (median / p95 latency, average cost per Reader result, average cost per completed comparison, completion rate, cost per completed loop, failure frequencies) — definitions, not figures, and no dashboard ships.
- **Source of truth:** `api/read.js` (`MODEL_CALL_TIMEOUT_MS` / `READER_MODEL_TIMEOUT_MS`, `READER_SPEND_CEILING_USD` via `resolveSpendCeiling` (no production default) + `spend_ceiling_unset` log + `fallback(input, "ceiling")` fail-closed path, `CAPACITY_MESSAGE`, `buildAct2` availability); `api/read-paired.js`; `reader-security.js` (durable Upstash rate limiting + `checkGlobalSpendCeiling`, per-instance in-memory fallback); `reader-telemetry.js` (event set + `ALLOWED_PROP_KEYS` allowlist + `shouldTransmitTelemetry` server-delivered gate / `prepareTelemetryBatch`); `reader-paired.js` (`ACT2_CAPACITY_COPY`); `workbench-app.jsx` (client event emission + Act2 degraded surface); `DEPLOY.md` ("Phase 0 — capacity degradation, telemetry, unit economics"); `test/reader-model-timeout.test.mjs`; `test/reader-telemetry.test.mjs`.
- **Temporal scope:** Current (bounded calls, single capacity path, browser-local telemetry — live); planned (telemetry transmission disabled pending an approved privacy line); pending founder input (interim launch spend ceiling).
- **May be used:** Internal ops / `DEPLOY.md` description, methodology-hardening notes, resilience posture in operational/funder context.
- **Should not be used:** Do not say telemetry is "collected," "transmitted," "sent," or "reported" — it is browser-local and transmission is disabled. There is no production default ceiling; do not present any historical development number (e.g. `8`) as a launch, production, or budget figure. While the ceiling is unset, metered calls fail closed to the capacity fallback and instruction generation stays available. Do not describe the follow-up or paired comparison as better, corrected, fixed, safer, or true; the capacity path only preserves the person's ability to generate and run a follow-up in their own AI. Do not claim durable rate limiting or a spend ceiling is "complete," "guaranteed," or "verified," and do not claim a launch ceiling is set. Do not describe any of this as a dashboard, monitoring product, or delivered unit-economics reporting — only metric definitions exist. No user content ever enters telemetry or operational logs.
- **Update trigger:** A founder-set interim launch spend ceiling (`READER_SPEND_CEILING_USD`); an approved telemetry privacy line plus a server-delivered `config.enabled === true` flag (via `shouldTransmitTelemetry`); or a change to the timeout/ceiling config, the telemetry event allowlist, or the capacity-degradation copy.

### 21. Frozen publications — what counts as a revision, and what does not
- **Category:** 7 (methodology/protocol description)
- **Canonical interpretation:** `whitepaper.html` and `volunteer-gap-paper.html` are frozen dated publications. Each carries its own colophon rule: superseded only by a later version with a change log, never silently edited. `IMBAS-CANON.md` rule 5 defines the freeze itself and is untouched by this entry. This entry answers the classification question the freeze does not: which edits count as a revision. **Site-shell changes do not constitute a publication revision** — navigation, footer, and design-system integration require no change-log entry, provided they do not alter substantive claims, figures, methods, conclusions, or evidentiary content. **The converse binds equally: a shell edit must not alter the article's substantive rendered content.** If a shell change would move a figure, a claim, a method statement, a conclusion, or evidentiary text, it is a revision and takes the change-log path instead. The tier-labeled figures inside both papers are part of the published historical record, not current site metrics; they are correct as published and are not touched when current copy is corrected. A later version's change log carries any correction.
- **Source of truth:** `whitepaper.html` and `volunteer-gap-paper.html` colophons; `IMBAS-CANON.md` rule 5 (the freeze); this entry (the classification).
- **Temporal scope:** Durable.
- **May be used:** Any pass touching either paper's shell, and any pass correcting current-site figures that also appear in a paper.
- **Should not be used:** Do not add an addendum, note, or correction to a frozen paper to reconcile it with corrected current copy. Do not treat a paper's tier-labeled figure as a current metric. Do not use this exemption to reach substantive content.
- **Update trigger:** A published later version of either paper, or a founder ruling narrowing what counts as chrome.

### 22. "169 captures" (v1 corpus, evidence custody) — provenance unresolved in this repository
- **Category:** 1 (historical study fact) — provenance unresolved here.
- **Canonical interpretation:** `whitepaper.html` reports the original 13-case corpus as 169 captures held under content-addressed custody in a versioned instrument repository behind a human-only admission gate. It is a publication figure whose source record is **not recoverable from this repository**. `IMBAS-CANON.md` places that custody in a separate repo (`Projects/imbas-instrument`). This tree can neither confirm nor refute the figure. It is a separate orphan from the archive-tier 50/500/45 chain in #8 and must not be folded into it.
- **Source of truth:** None available in this repository. `whitepaper.html` (as published, frozen); `IMBAS-CANON.md` (points custody elsewhere).
- **Temporal scope:** Published July 2026; provenance unresolved as of 2026-08-23.
- **May be used:** Where it already stands in the frozen whitepaper, untouched.
- **Should not be used:** Do not promote 169 to any other surface. Do not manufacture a custody trail for it after the fact. Do not cite it as corroborating or contradicting any archive-tier figure.
- **Update trigger:** Recovery of the source record in project custody, recorded with its location and method.

---

## Maintenance
- Update this ledger whenever a source-of-truth file changes a consequential claim, when the Numbers Ledger is re-signed, or when a planned capability ships.
- When copy and this ledger disagree, fix the copy to match repository-backed truth (or update the ledger if the repository itself changed).
