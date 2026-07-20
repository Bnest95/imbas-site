# Imbas Site — Stable Public Surfaces Copy + Metadata Pass

**Date:** 2026-07-20
**Branch:** `sprint3/stable-public-surfaces-copy`
**Merge base:** `origin/master` @ `b39afcb` (Merge PR #27 — site-copy-architecture pass)
**Scope:** Public copy + page metadata only. No CSS, JavaScript, schema, bundle, endpoint, telemetry, consent, or retention-behavior changes.

Ground truth for shipped state is the repository. `CLAUDE.md` (repository law) governs where it conflicts with this brief. This pass follows the predecessor pass documented in `SITE-COPY-ARCHITECTURE-AUDIT-2026-07-20.md` (PR #27), which edited `how-it-works.html` and `index.html`; this pass extends the same accurate-description work onto the two remaining reader-facing surfaces that still under-surfaced the shipped Reader chain.

---

## 1. Verdict

The stable public site is **accurate and does not overclaim.** The predecessor pass (PR #27) closed the largest gaps on the homepage and `how-it-works.html`. A full re-inventory of all 33 served HTML pages found the rest of the site clean: numbers match the locked ledger, the locked Reader boundary is present byte-for-byte on every page that carries it, banned claims are absent, and no retired terms survive.

Two reader-facing surfaces still described only **half** the shipped Reader chain — the single read — and never named the shipped **Second Question**, the side-by-side comparison, or keeping the record:

- **`for-readers.html`** — its "How to inspect an answer" ledger stopped at "Decide what deserves further inspection." A reader on the page built for readers never learned that the Reader hands them a direct Second Question, that they can put both answers side by side, or that they can keep the record. This is the same chain PR #27 added to `how-it-works.html`, absent from the reader page.
- **`faq.html`** — nineteen questions, none of which answered "what does the Reader actually let me do right now." The FAQ covered the *measurement* framing ("Why compare open prompts and direct prompts?") but never the *reader action*.

Both are genuine consistency gaps against the brief's objective that the stable site *consistently* communicate what the Reader lets a person do now and why the Second Question matters. Both were closed with additive, restrained copy that reuses the approved, already-merged language from `how-it-works.html`. Nothing else was changed, because nothing else was inaccurate.

---

## 2. Page inventory & classification (all 33 served HTML pages)

| Class | Pages |
|---|---|
| **Stable public surface** | `index.html`, `how-it-works.html`, **`for-readers.html`**, `institutions.html`, `volunteer-gap.html`, `public-interest.html`, **`faq.html`**, `exploration-pack.html`, `field-notes/index.html`, `field-notes/what-the-volunteer-gap-measures.html` |
| **Workbench-dependent** (excluded) | `workbench.html`, `inspection.html` |
| **Methodology / governance** | `methodology.html`, `whitepaper.html`, `volunteer-gap-paper.html`, `archive.html`, `glossary.html`, `calibration.html`, `challenge.html`, `challenge-log.html`, `independence.html`, `publication-policy.html`, `case/003.html`, `case/005.html`, `case/013.html`, `case/018.html`, `case/021.html` |
| **Legal / privacy** | `privacy.html`, `terms.html`, `retention.html`, `accessibility.html` |
| **Utility / contact** | `contact.html`, `404.html` |

**Edited this pass:** `for-readers.html`, `faq.html` (both stable public surfaces).

---

## 3. Page matrix (analysis before editing)

| Page | Current role | Main gap | Disposition | Reason |
|---|---|---|---|---|
| `index.html` | Homepage; hero single-read CTA + "Your Experience" | None material | UNCHANGED | PR #27 already enriched "Your Experience" to name compare-under-a-direct-follow-up + preserved review. |
| `how-it-works.html` | Full product-flow doctrine page | None | UNCHANGED | PR #27 named the fixed Second Question, the paste-back pair, the review record, and added the professional wedge. Editing = churn. Carries the locked boundary `:75`. |
| **`for-readers.html`** | Reader-facing "how to inspect" | **"How to inspect" ledger stops at the single read; never names Second Question, side-by-side, keeping the record, or the discovery/evidence boundary** | **EDIT** | The reader page is the natural home for the reader chain; it was the biggest remaining under-surface. |
| **`faq.html`** | Audience FAQ (accordion + JSON-LD) | **No question answers "what does the Reader let me do now"; Second Question never named** | **EDIT** | One additive Q&A closes a named-objective consistency gap on a high-intent reference page. |
| `institutions.html` | Org-framed; carries the institutional professional case + "What Imbas does not claim" restraint plate | None | UNCHANGED | Rigorous and accurate; inline `<style>` must not be touched. |
| `volunteer-gap.html` | Flagship concept page | Stops at the Gap measurement | UNCHANGED | Correct register; concept page need not span into product flow. "Signal, not verdict" intact. |
| `public-interest.html` | Motivational / policy argument | None | UNCHANGED | Scoped to the measurement/record layer; accurate. Inline `<style>`. |
| `exploration-pack.html` | Public prompt resource | None | UNCHANGED | Carries the locked boundary `:108`; states results are the user's own, not Imbas cases. |
| `methodology.html`, `whitepaper.html`, `volunteer-gap-paper.html`, `glossary.html`, `calibration.html`, `archive.html`, `challenge*.html`, `independence.html`, `publication-policy.html`, `case/*` | Methodology / governance / record | None | UNCHANGED | Technical register where defined terms are permitted; boundary and numbers correct. |
| `privacy.html`, `terms.html`, `retention.html`, `accessibility.html` | Legal / policy | None | UNCHANGED | Policy text; out of scope to alter. |
| `contact.html`, `404.html` | Utility | None | UNCHANGED | Fit-for-purpose. |
| `workbench.html`, `inspection.html` | Workbench-dependent | n/a | EXCLUDED | Hard exclusion per brief. |

---

## 4. Exact before/after copy

### 4.1 `for-readers.html` — "How to inspect an answer" ledger (extend, do not replace)

The existing six `rd-inspect-ledger` rows (the single read) are unchanged. Four rows were appended after "Decide what deserves further inspection." The `rd-inspect-ledger__label` is a *categorical* tag ("Inspect"), not a literal verb — existing rows already label "Bring an AI answer…" and "Decide what deserves…" as "Inspect" — so the appended rows keep the same label consistently.

**Added rows (verbatim `dd` text):**
1. `Ask the direct Second Question the Reader hands you. It gives nothing away.`
2. `Bring the second answer back and put the two side by side.`
3. `See what changed: what the first answer left out, framed differently, or stepped around.`
4. `Keep the record of the exchange before you decide what to trust, use, or send.`

**Added note (new `rd-record-note--follow`, inserted before the existing Case Archive note):**
> This is discovery, not evidence. The comparison is not a verdict and not a signature. Keep it, and come back to it when you need to.

The pre-existing Case Archive note ("…They are not an automated dump of Reader results.") is unchanged and still closes the section, preserving the public-discovery-vs-governed-record distinction.

*Language provenance:* mirrors the already-merged `how-it-works.html:166` ("a direct Second Question, one that gives nothing away … put the two side by side … This is discovery, not evidence.") and `:175` ("keep a record … not a verdict and not a signature … come back to it later"). No new claim is introduced.

### 4.2 `faq.html` — one added Q&A (visible accordion + JSON-LD, mirrored)

Inserted after "Why compare open prompts and direct prompts?" (the measurement-framing question it operationalizes). New accordion IDs `faq-q-17` / `faq-a-17` (the accordion JS keys on `aria-controls` pairing via `querySelectorAll('.faq-entry__trigger')`, so IDs need only be unique, not sequential; no renumbering required).

**Question:** `What can I do with the Reader right now?`

**Answer (verbatim):**
> Paste an AI answer and the Reader shows what surfaced, what may be missing, and how it was shaped. It then hands you one direct Second Question that gives nothing away. Ask it, bring the second answer back, and put the two side by side to see what changed. You can keep a record of the exchange before you decide what to trust, use, or send. Reader inspections are discovery, not evidence. [See how it works → `/how-it-works.html`]

The JSON-LD `FAQPage` object was added in the same position with identical answer text (link rendered as a trailing URL, matching the existing Q01 convention). Visible copy and structured data stay in sync.

---

## 5. Metadata before/after

### `for-readers.html` — description (synced across `<meta name="description">`, `og:description`, `twitter:description`, JSON-LD `description` — all four were byte-identical and all four were updated):

- **Before:** `Use the Reader to inspect what surfaced, what may be missing, and how AI answers were shaped. The Case Archive holds reviewed public records.`
- **After:** `Inspect an AI answer: what surfaced, what may be missing, how it was shaped. Ask the direct Second Question, put both answers side by side, and keep a record before you decide.` (~156 chars)

Rationale: the page now surfaces the Second Question + comparison; the description was updated to concrete actions that match. The two-instrument (Reader vs Case Archive) distinction remains carried in the page body (masthead line + Case Archive note), so dropping the archive clause from the length-limited description loses nothing.

**Unchanged for `for-readers.html`:** `<title>` ("Imbas for Readers — See what AI answers leave out" already names the page purpose), `og:title`/`twitter:title` ("For Readers | Imbas" — social short form), canonical, OG image + alt (shared brand asset, accurate).

### `faq.html` — metadata reviewed, no change

The meta/OG/Twitter/JSON-LD description ("Answers about Imbas, AI answer inspection, the Volunteer Gap, and observed answer behavior under documented conditions.") already summarizes the page accurately after the one-entry addition ("AI answer inspection" covers the new Q). No unsupported claim introduced. Title unchanged.

### `sitemap.xml` — deliberately NOT changed (reported per brief)

`for-readers.html` and `faq.html` both carry `lastmod` `2026-07-03`. **Convention evidence:** PR #27's copy commit `eb7e736` edited `how-it-works.html` and `index.html` but did **not** touch `sitemap.xml` — both remain `2026-07-03`. The established convention is that copy/metadata revisions do **not** bump `lastmod`; those dates track publication/structural events. Per the brief ("change lastmod only if a real per-page maintenance convention exists, else leave and report why"), `sitemap.xml` is left unchanged to match the precedent set by the immediately preceding pass.

---

## 6. Unchanged pages & why

All 31 non-edited served pages were inventoried (§2). None had a meaningful gap against the brief's objectives:

- **Concept / methodology / governance / record pages** (`volunteer-gap`, `methodology`, `whitepaper`, `volunteer-gap-paper`, `glossary`, `calibration`, `archive`, `challenge`, `challenge-log`, `independence`, `publication-policy`, `case/*`) operate at the measurement layer in their proper technical register. The locked boundary is present byte-for-byte where used (`whitepaper:256`, `volunteer-gap-paper:187`, `how-it-works:75`, `exploration-pack:108`, `calibration:108`). "Signal, not verdict" and "not a verdict system" framing intact.
- **Legal/policy pages** (`privacy`, `terms`, `retention`, `accessibility`) are out of scope to alter and were accurate.
- **Utility pages** (`contact`, `404`) are fit-for-purpose.
- **`institutions.html` / `public-interest.html`** carry inline `<style>` blocks (CSS, hard-excluded) and their copy is already rigorous and correctly restrained.
- **`index.html` / `how-it-works.html`** were completed by PR #27; re-editing would be churn.

---

## 7. Privacy tensions

**Result: no tension introduced; no privacy language weakened.**

- Both edits keep the paste target as **"an AI answer."** Neither invites the user to paste confidential, privileged, proprietary, regulated, or personally sensitive material. Neither adds a "paste your draft/document" instruction.
- Neither edit promises confidentiality, secure processing, privilege preservation, or institutional compliance.
- The phrase "before you decide what to trust, use, or send" is accountability register about the *AI answer/work product moving onward* — it mirrors the already-merged `how-it-works.html:185` wedge ("Before you send it, file it, recommend it…") and makes no promise about how Imbas stores anything.
- The professional-accountability **wedge** ("AI made the draft. Your name still goes on it.") was **not** added to `for-readers.html` or `faq.html` — see §9. This keeps the professional framing (which touches privileged drafts) confined to where PR #27 already placed it, respecting `privacy.html:141`.

---

## 8. Claims-ledger discrepancies

- **No new claim introduced.** Every capability named in the new copy is present-tense-safe SHIPPED per `CLAIMS-LEDGER.md` and the predecessor audit's repository-proven evidence: the fixed non-leading Second Question, the paste-back pair / side-by-side, and the downloadable review record ("keep a record of the exchange"). The discovery/evidence boundary is preserved.
- **Pre-existing, out-of-lane:** the predecessor audit (§6.2) logged that the repo is ahead of `CLAIMS-LEDGER.md` on `paired_method_version` (code ships 1.1; ledger records 1.0) and the Deflection rename. That is an internal governance-doc reconciliation, not public copy, and remains out of this lane. Repository evidence controls the copy either way. No STOP condition triggered.

---

## 9. Recommended later professional surface (for founder review)

The professional-accountability use case currently lives on **`how-it-works.html`** (the closing wedge, PR #27) and **`institutions.html`** (institutional/examiner framing). It is therefore present on the site, but it is **not** surfaced on the individual-reader path.

This pass deliberately did **not** duplicate the wedge onto `for-readers.html`, for three reasons: (a) the predecessor audit §6.4 explicitly flagged wedge placement beyond `how-it-works` as a founder decision; (b) the wedge speaks to accountable professionals whose drafts are often privileged, creating a real tension with `privacy.html:141`; (c) scope discipline — the brief prefers few meaningful edits and forbids creating a professionals page absent proof of demand.

**Recommendation (not taken here):** if the founder wants the individual-professional accountability case more prominent, the lowest-risk next step is a single restrained accountability aside on `for-readers.html`, reusing the approved `how-it-works.html:185` lines verbatim and keeping the paste target as "an AI answer or AI-assisted draft" (positioning only, no confidentiality promise). A dedicated `/for-professionals` surface is **not** yet warranted — there is no existing page proving the need, and the brief forbids creating one speculatively.

---

## 10. Test & visual evidence

- **Full test suite:** `node --test test/*.test.mjs` → **492 pass / 0 fail** (includes `check-vocab-lint` AT-5 over shipped UI copy and the bundle-in-sync check). node_modules not required (only devDep is esbuild).
- **New-string vocab lint:** every new public-facing string (8 distinct strings) run through `lintString` and `hasWorldClaimVerdict` from `reader-check-vocab.js` → **all clean** (no world-claim verdict, no reliance/defensibility construction). New copy contains none of `true/false/correct/incorrect/wrong`, `rely`, `defensible`, `compliance`, `adequate review`.
- **Banned-claim sweep** over the two edited files → only pre-existing legitimate disavowals ("Is Imbas a fact-checking site?" → "No"; "require independent verification"). New copy is clean.
- **Stale-jargon sweep** (itemized delta / paste-back / candidate observation / deterministic probe / provenance class / model-facing) over the two edited files → **none**.
- **Locked boundary** — full sentence intact byte-for-byte on all five carrier pages (`whitepaper:256`, `volunteer-gap-paper:187`, `how-it-works:75`, `exploration-pack:108`, `calibration:108`); not altered or duplicated in the edited files. New copy uses only the canonical standalone clauses ("This is discovery, not evidence." / "Reader inspections are discovery, not evidence.").
- **Scope diff:** `git diff --name-only` → `faq.html`, `for-readers.html` only. No CSS/JS/schema/bundle/sitemap/`reader-*`/`api/**` touched.
- **Internal links:** added link target `/how-it-works.html` exists and resolves.
- **Accordion integrity:** `faq.html` now has 17 entries, no duplicate IDs; new entry `faq-q-17` toggles correctly (`aria-expanded` true/false, `hidden` add/remove) via the existing order-independent JS.
- **Visual review (desktop 1280 + mobile 380):** both changed sections reviewed in a rendered browser at both widths. `for-readers.html` — the four new "INSPECT" rows render with preserved row striping and the two stacked ember-bordered notes space correctly; mobile stacks label-above-description with no overflow. `faq.html` — the new entry sits in correct order (after the "compare" question), expands cleanly, and the "See how it works" link renders; mobile answer is fully legible.
