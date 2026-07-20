# Imbas Site — Copy Architecture Audit + Fix Pass

**Date:** 2026-07-20
**Base:** `origin/master` @ `82af18176c4da975d3f66228da3372bec1a459e8`
**Branch:** `sprint3/site-copy-architecture`
**Scope:** Public copy only (HTML text, JS string literals, metadata). No logic, schema, CSS, telemetry, consent, or retention-behavior changes.

Ground truth for shipped state is the repository. The served product artifact is `workbench.bundle.js` (the only script any page loads for the Workbench). `CLAIMS-LEDGER.md` governs claims; where the repo is ahead of the ledger, the repo controls and the divergence is logged below.

---

## 1. Verdict

The public site is **substantially clean and accurate**. Numbers match the locked ledger, signal categories are consistent, banned claims are absent, the locked Reader boundary is present byte-for-byte, and the future/agent language is correctly conditional. The site is **not** overclaiming.

The problem is the reverse: the site **under-surfaces what is already shipped.** The live Workbench runs a full chain — single read → a fixed, non-leading Second Question → paste-back pair → itemized side-by-side delta → downloadable review record — and most of that chain has little or no public copy. In particular:

- **The downloadable review record has zero copy anywhere in served HTML** despite shipping in the bundle.
- **The Second Question / paired flow is named nowhere as a product step** (only `exploration-pack.html` describes "paired mode" in passing).
- **The professional accountability wedge is entirely absent** site-wide.

The fix pass therefore *adds accurate description of shipped capability* and *introduces the professional wedge on an existing surface* — it does not walk back overclaims, because there are essentially none.

---

## 2. Shipped-state evidence (repository-proven)

Every SHIPPED claim below traces to a file:line or a verbatim string in the served bundle.

| Capability | Status | Evidence |
|---|---|---|
| Company line "Imbas is the inspection layer for AI answers" | SHIPPED | `methodology.html:148`; `index.html:8` / `:19` (meta) |
| Single paste-and-pair surface = Workbench (Reader is the engine, not a separate page) | SHIPPED | `workbench.html:116` mounts `#workbench-root`, `:169` loads `/workbench.bundle.js`; no page references `reader-paired.js` / `reader-review-record.js` / `workbench-app.jsx` |
| Single read of a pasted answer (what surfaced / omitted / how shaped) | SHIPPED | `index.html:140`, `how-it-works.html:84`; bundle renders single-read UI |
| Fixed, non-leading **Second Question** offered after the read | SHIPPED (fixed probe) | Bundle: `"Want to test it? Here's a direct question that gives nothing away."` `direct question that gives nothing away` [1 hit] |
| Paste-back **pair** (second answer → side-by-side) | SHIPPED | Bundle: `"One quick thing before the side-by-side"` [1], `"Second answer"` [1] |
| Delta classified Omission / Framing Drift / Deflection + correction chips | SHIPPED | Bundle: `"It didn't volunteer"` [1]; signal names across `methodology.html:216-225`, `volunteer-gap.html:252-261` |
| Downloadable **review record** (JSON, `review-graph.v0.3.0`) | SHIPPED | Bundle: `"Download review record"` [1], `review-graph.v0.3` [1] |
| Locked Reader boundary sentence (byte-for-byte) | SHIPPED | `how-it-works.html:75`; bundle: `discovery, not evidence` [2] |
| Optional "perception tap" = one value from a fixed short list | SHIPPED | `retention.html:123` |
| Reviewed Case Archive: 50 recorded · 5 public · 45 held · 500+ captures · 4 models (2026-07-01) | SHIPPED | `archive.html:358-364`, `faq.html:143` / `:316` |
| Unlisted share pages (question + short excerpts + labeled estimate, never verbatim answer) | SHIPPED | `retention.html:129`, `privacy.html:148` |
| Verbatim run storage as telemetry; deletion on request within 7 days | SHIPPED | `retention.html:123`, `:140` |
| Privacy instruction: do **not** paste confidential/privileged/proprietary into Workbench | SHIPPED (live policy) | `privacy.html:141` |

Bundle string counts captured 2026-07-20 via `grep -c -F` against `workbench.bundle.js`.

---

## 3. Claims-state matrix

### SHIPPED NOW (safe to state in present tense)
The full discovery chain above: paste an answer, inspect the single read, run **one fixed direct Second Question**, paste the second answer back, read the itemized pair delta, download the review record. Plus the reviewed archive, methodology, share pages, retention/deletion policy.

### PROPOSED / IN-DEVELOPMENT (must be labelled, not stated as live)
- **Context-tailored Second Question** — "the exact second question" composed for *your* specific answer or draft. The bundle ships a **single fixed probe**, not a tailored generator. (Brief's near-term line.)
- **"Tap what bothered you" chip door** — six diagnosis chips as an *input* that selects a tailored follow-up. Absent from bundle and HTML; the only chips in code are *output-side* correction labels ("It didn't volunteer"). Confirmed absent.
- **Professional-requirement inputs / profiles** — absent.

### FUTURE (direction, not roadmap-committed; keep conditional)
- **Specialized inspection agent → real-time copilot** — `index.html:492` ("can become the training substrate for a specialized inspection agent"), `how-it-works.html:183` ("Next surface … an agentic copilot"). Correctly conditional today.
- **Whole-file ingestion (docx/PDF/xlsx), bundles** — absent everywhere; the word "upload" appears nowhere. Do not introduce.

---

## 4. Banned-claim sweep — result

Searched all HTML for: verifies truth · guarantees · grades/ranks · certifies · compliant/compliance · defensible · safe to rely on. **No problematic hits.** The only matches are legitimate disclaimers or third-party-vocabulary description:

- `terms.html:126` — "not legal, financial … compliance … advice" (disclaimer).
- `institutions.html:291` — describes *examiner-side professionals'* existing gap-detection vocabulary; does not claim Imbas certifies compliance.
- `archive.html:353`, `privacy.html:141`, `faq.html:108` — "verify independently," "require independent verification" (correct posture).

Other sweeps: no "Active Foreclosure" (fully migrated to Deflection); no "upload"; no "Imbas agent"; no "coming soon"; no claim that user records train any system.

---

## 5. Page-by-page inventory & disposition

| Route / file | Current state | Classification | Problem | Action | Disposition |
|---|---|---|---|---|---|
| `index.html` | Strong. Hero single-read CTA; Value Flow (`:405-411`) is archive-flavored (Ask/Inspect/Compare/Measure/Record-as-case); audiences = Institutions + Readers only | SHIPPED (accurate) | Live pair / Second Question / review record not reflected; no professional wedge | Light touch: enrich the "Your Experience" block to name compare-under-a-direct-follow-up + preserved review | FIX (light) |
| `how-it-works.html` | Locked boundary present `:75`; 6-step flow; step 05 gestures ("push the model further"); step 06 omits review record; closing `:183` = future copilot | SHIPPED (accurate but incomplete) | Biggest gap: the shipped Second Question + pair + **review record** are not named as product steps; tailored-vs-fixed not distinguished | Name the fixed Second Question + paste-back pair as discovery (step 05); name the downloadable review record (step 06); add one in-development note for the *tailored* Second Question; add professional accountability wedge in the closing | FIX (primary) |
| `workbench.html` | Mounts bundle; title/meta/noscript hand-editable | SHIPPED | None | — | KEEP |
| `volunteer-gap.html` | Concept page; signal categories correct; "Signal, not verdict" | SHIPPED (accurate) | None | — | KEEP |
| `methodology.html` | Rigorous; company line `:148`; archive protocol (fresh sessions) | SHIPPED (accurate) | None. (Human-validation para `:343` paraphrases, not quotes, the locked boundary — acceptable; sentence is only mandated byte-for-byte where used) | — | KEEP |
| `archive.html` | Numbers match ledger `:358-364`; trust note `:353` | SHIPPED (accurate) | None | — | KEEP |
| `institutions.html` | Org-framed; "What Imbas does not claim"; "Available now" vs "Pilot engagements" | SHIPPED (accurate) | None | — | KEEP |
| `for-readers.html` | Individual-reader-framed; "raises an antenna, not truth/bias"; CTA "Try the Reader" | SHIPPED (accurate) | None | — | KEEP |
| `retention.html` | Matches implementation; verbatim storage, deletion, perception tap | SHIPPED (live policy) | None — do not alter policy text | — | KEEP (policy) |
| `privacy.html` | `:141` forbids pasting confidential/privileged/proprietary | SHIPPED (live policy) | Constrains the professional wedge (see §6) | — | KEEP (policy) |
| `faq.html` | Numbers match `:143`/`:316`; "Who is Imbas for?" lists readers/researchers/institutions | SHIPPED (accurate) | Professionals not named (optional, not a defect) | — | KEEP |
| `whitepaper.html`, `volunteer-gap-paper.html` | Document masthead; construct + method; "The pair" as construct term `:173` | SHIPPED (accurate) | None | — | KEEP |
| `exploration-pack.html` | Describes running "paired mode" in the Workbench `:114` | SHIPPED (accurate) | Only place the live pair is described; fine to leave | — | KEEP |
| `inspection.html` | Permalink **viewer** for a shared inspection (not a paste surface) | SHIPPED | None | — | KEEP |
| Secondary (`glossary`, `independence`, `challenge`, `calibration`, `contact`, `terms`, `accessibility`, `public-interest`, `publication-policy`, `404`, `field-notes/`, `case/*`) | Spot-checked in sweeps; no banned claims, numbers consistent, signals consistent | SHIPPED (accurate) | None found | — | KEEP |

---

## 6. Contradictions & unresolved items (for founder review)

1. **Review record is shipped but has no public copy.** `grep` for "review record" across HTML returns nothing; the bundle ships `"Download review record"`. The product-story link "the record preserves the review" is invisible on the site. → Addressed in the fix pass (how-it-works step 06).

2. **Repo is ahead of `CLAIMS-LEDGER.md`.** Ledger records `paired_method_version 1.0`; the code ships `PAIRED_METHOD_VERSION 1.1`, the Run-the-pair paste-back capture, and the Deflection rename (v0.3.0 schema). The public site already reflects the newer state. **Unresolved and out of this lane's scope:** the ledger is an internal governance doc, not public copy; updating it is a separate task. Repo evidence controls the copy either way. Logged, not silently reconciled.

3. **Privacy vs. professional wedge — a real tension.** `privacy.html:141` instructs users **not** to paste confidential, privileged, or proprietary material into the Workbench. The professional wedge ("AI made the draft. Your name still goes on it.") speaks to accountable professionals (lawyers, analysts, accountants) whose drafts are frequently privileged. **Resolution taken in this pass:** the wedge is introduced as *accountability positioning only*. It makes **no** confidentiality or retention promise, adds **no** "paste your draft" instruction, and keeps the paste target as "an AI answer." The current-promise phrase "AI answer or AI-assisted draft" is used at the positioning level, not as an invitation to submit privileged documents. Flagged here so the founder can decide whether to go further (e.g., a dedicated professional surface) in a later, in-scope pass.

4. **Placement of the professional wedge.** There is no existing "professionals" page, and the brief forbids creating one absent proof none exists. The wedge is neither purely "reader" nor purely "institution." This pass places it as one restrained accountability aside on `how-it-works.html` (the page that already carries the "you decide" doctrine and the locked boundary), which is the lowest-risk existing home. If the founder wants it elsewhere (homepage audiences, a For-Professionals surface), that is a positioning decision to make on the PR.

No STOP condition was triggered: shipped state of the core capability is determinable and present-tense-safe; no change required CSS, schema, logic, consent, retention, or telemetry edits; paste-and-pair is not duplicated across surfaces (Workbench is the single surface).

---

## 7. Fix pass — changes applied

All edits are copy-only, reuse existing CSS classes, add no new selectors, and preserve the locked boundary byte-for-byte. See the diff on the branch. Summary:

- **`how-it-works.html`** — named the shipped fixed Second Question + paste-back pair as a discovery step; named the downloadable review record; added one clearly-labelled in-development note for the *tailored* Second Question (distinct from the shipped fixed one and from the future copilot); added the professional accountability wedge as one aside using the approved lines.
- **`index.html`** — light enrichment of the "Your Experience" block so the homepage reflects compare-under-a-direct-follow-up and the preserved review, without overclaiming.

Nothing else was changed. Every other page was left as-is because it was already accurate.
