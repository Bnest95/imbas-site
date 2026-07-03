# Imbas Claims Ledger

Purpose: prevent temporal and semantic collapse across public copy. Every consequential public claim should represent what *kind* of truth it is — a historical v1 study fact, a live product capability, a current record-state metric, a derived statistic, a methodology description, planned/future work, or positioning. This ledger records the repository-backed truth as of the current HEAD and the trigger that should force each entry to be revisited.

Do not treat this ledger as aspirational. If the repository does not prove a capability, the ledger says so.

## Claim taxonomy (categories used below)
1. historical study fact · 2. historical case fact · 3. current product capability · 4. current operational/site metric · 5. current archive/public-record state · 6. derived statistic · 7. methodology/protocol description · 8. planned protocol / future work · 9. positioning / mission · 10. hypothesis / interpretation

## Sources of truth
- **Numbers:** `IMBAS-NUMBERS-LEDGER.md` (LOCKED 2026-07-01: 50 cases recorded · 37 scored under current rubric · 500 model captures · 4 models). Airtable base `appfxHraqlcpP1AAP` — Cases `tblf7c2RYUolaTVXJ`, Repository `tblyPn1kp4PHbxTWz`, Reader Runs `tblqmHiOCQ5YSXBN3`.
- **Reader behavior:** `api/read.js` (agent writes prose read + `completeness`, `what_was_left_out`, `how_it_was_shaped`; does NOT compute the gap score/category — those are rubric-bound in the client).
- **Capture / candidate pool:** `api/repository.js` (Repository table; Triage Status `new`; "Never touches the Cases archive").
- **Inspection shares:** `api/inspection-share.js` (Visibility `unlisted`, Reviewed Status `Unreviewed`).
- **Case lineage + review-state (schema):** Airtable `Cases.Source Candidate ID` (back-link to the source candidate) and `Repository.Reviewed At` (review timestamp), added 2026-07-03; manual, no code writer. See #19 and `DEPLOY.md`.
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
- **Canonical interpretation:** The Reader inspects one pasted AI answer against the open question and returns a structured read — `completeness` (full/partial/thin), `the_read` (prose), `what_was_left_out`, `how_it_was_shaped`, plus an `inspection_note`. It is prompt-injection-safe and degrades to an honest fallback.
- **Source of truth:** `api/read.js`.
- **Temporal scope:** Current, live.
- **May be used:** Reader/Workbench copy, how-it-works, for-readers.
- **Should not be used:** Do NOT claim the Reader computes or returns a Volunteer Gap 0–3 score/category (the client does that for rubric-bound cases, not the Reader). Do not claim the Reader proves intent, bias, censorship, or factual falsity.
- **Update trigger:** Change to the Reader output contract in `api/read.js`.

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

### 8. "50+ cases recorded" / "500+ model captures"
- **Category:** 4 (current operational/site metric)
- **Canonical interpretation:** The record holds 50 cases and 500 model captures across four frontier models (37 scored under the current rubric) as of 2026-07-01; figures are floors ("+"), growing.
- **Source of truth:** `IMBAS-NUMBERS-LEDGER.md`.
- **Temporal scope:** Current; expected to grow.
- **May be used:** Homepage proof strip, archive stat strip. Floor phrasing ("50+", "500+") preferred over exact frozen counts.
- **Should not be used:** Do not revert to the retired 22-scored / 331-capture snapshot. Do not state exact non-floor counts that will stale.
- **Update trigger:** New signed-off standing in `IMBAS-NUMBERS-LEDGER.md`.

### 9. Archive / public-record definition
- **Category:** 5 (current archive/public-record state)
- **Canonical interpretation:** The Case Archive is a growing, human-reviewed public record of observed AI surfacing behavior under documented prompt conditions. 50 recorded cases; 5 have public pages (003, 005, 013, 018, 021); 45 held pending release.
- **Source of truth:** `archive.html` (stat strip + qualifier "50 recorded · 5 public · 45 held"); sitemap; CollectionPage JSON-LD.
- **Temporal scope:** Current.
- **May be used:** Archive, homepage, for-readers, metadata.
- **Should not be used:** Do not describe the archive as an automated dump of Reader outputs. Do not imply all 50 cases have public pages.
- **Update trigger:** Change in count of public case pages (sitemap) or signed-off recorded/held counts.

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
- **Canonical interpretation:** Captures preserve prompt conditions, model, date, raw response, and evidence (case records). As of the 2026-07-03 provenance pass, every Reader run written to Reader Runs (`tblqmHiOCQ5YSXBN3`) *additively* also records: a server-side request ID (ties the row to the structured runtime logs), the Reader model, the Reader prompt/protocol version (`reader.v1`), the topic and anchor when the request carries them, the inspected AI model when the Workbench provides it, a SHA-256 hash of the canonical source content (`open_question` + newline + answer), and a SHA-256 hash of the Reader output. The hashes are deterministic fingerprints — identical inputs or identical reads produce identical hashes, so re-runs and duplicate reads *can be recognized* without exposing content. Capture is fail-safe: a read is always returned to the user even if the write fails. Broader provenance *hardening* (cross-run lineage analysis, verification workflow, review discipline) remains active/planned work, not a completed system.
- **Source of truth:** `api/read.js` (`captureRun` provenance fields; `READER_PROMPT_VERSION`; `sourceContentHash` / `readerOutputHash`); Reader Runs `tblqmHiOCQ5YSXBN3` (fields: Request ID, Reader Model, Reader Prompt Version, Topic, Anchor, Inspected AI Model, Source Content Hash, Reader Output Hash); `methodology.html` ("Capture protocol"); `faq.html` (Q08, Q16).
- **Temporal scope:** Current capture + run identity/hashing (live); cross-run lineage + verification workflow planned.
- **May be used:** Methodology, FAQ, contact.
- **Should not be used:** Do not claim a finished, verified provenance *system*. The hashes are content fingerprints for identity and dedup — NOT proof of review, validation, independent/blinded scoring, or inter-rater reliability — and they do NOT link runs into the Cases archive or establish public-case lineage. These fields live on Reader Runs (the raw run log), not the validated Cases archive. (Public-case ↔ source-capture lineage is instead carried by the separate manual `Cases.Source Candidate ID` back-link — see #19 — a human-populated pointer, not a hash-derived or automatic link.) Keep cross-run analysis and verification workflow in planned/underway tense.
- **Update trigger:** A shipped provenance verification or cross-run lineage feature, or any change to the captured field set / hash construction in `api/read.js`.

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
- **Canonical interpretation:** The inspection layer is *designed* to compare behavior across time, but longitudinal (cross-day, cross-release) measurement was NOT done in v1 (single time point, ~48 hours). Cross-day stability is part of the next protocol.
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
- **Canonical interpretation:** Two additive Airtable fields (added 2026-07-03) give the pipeline a recordable, manual lineage-and-review trail with no code or automation. `Cases.Source Candidate ID` (singleLineText, `fldCroOvdzKqBakID`) is a plain-text back-link to the Repository `Candidate ID` a case was promoted from — the reverse edge of the existing `Repository.Promoted To Case`, making public-case ↔ source-capture lineage bidirectional. `Repository.Reviewed At` (dateTime ISO/UTC, `fldIcFUw168lY4QtF`) records when a candidate's review decision was taken, completing the explicit review transition alongside the existing `Triage Status` (state + terminal decision: promoted/rejected/duplicate) and `Reviewed By` (reviewer). A public case reaches its full review record by following its `Source Candidate ID` into the pool; Cases itself stays lean (no review fields on it).
- **Source of truth:** Airtable Cases `tblf7c2RYUolaTVXJ` (`Source Candidate ID`), Repository `tblyPn1kp4PHbxTWz` (`Reviewed At`, `Triage Status`, `Reviewed By`, `Promoted To Case`); `DEPLOY.md` ("Case lineage + review-state fields").
- **Temporal scope:** Current (schema live 2026-07-03).
- **May be used:** Internal pipeline/provenance description, methodology hardening notes.
- **Should not be used:** These are recordable fields populated by MANUAL review — not automated, not retroactive (legacy/hand-authored cases have an empty `Source Candidate ID`), and not a validation, audit, independent/blinded scoring, or inter-rater-reliability process. A field existing ≠ any given case being linked or reviewed. Do not describe lineage or review-state as automatic, complete, or independently verified; promotion and review remain manual. No application code writes either field.
- **Update trigger:** A code path that writes either field, a change to the review-state field set, or a documented independent/blinded review process.

---

## Maintenance
- Update this ledger whenever a source-of-truth file changes a consequential claim, when the Numbers Ledger is re-signed, or when a planned capability ships.
- When copy and this ledger disagree, fix the copy to match repository-backed truth (or update the ledger if the repository itself changed).
