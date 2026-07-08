SUPERSEDED 2026-07-07 — current source: CLAIMS-LEDGER.md. Retained as record.

# Production Copy Audit

Sitewide review of implementation-status language, placeholder copy, and developer-facing messaging.  
**Date:** 2026-05-29 · **Status:** Fixes applied in working tree · **Not committed**

---

## Summary

| Action | Count |
|--------|------:|
| Rewritten | 14 |
| Removed | 12 |
| Kept (justified) | 8 |

After fixes, automated grep finds **zero** instances of: `coming soon`, `being wired`, `being prepared`, `Full transcript to be added`, `While you wait`, `Inspection copilot`, `agentic tools`, `being built in public`, `Eventually, live`.

---

## Critical fixes (applied)

### 1. Workbench product-state banner

| | |
|---|---|
| **Page** | `workbench.html` |
| **Location** | Top of Workbench shell, above curated selector |
| **Current copy** | *Imbas is building agentic tools to observe AI behavior. Inspection copilot coming soon.* |
| **Action** | **Remove** |
| **Replacement** | *(banner removed)* |
| **Rationale** | Pure roadmap / build-status messaging. No current user capability. Removing keeps focus on the Workbench flow (curated replay + Suggest). |

### 2. Field Notes — email signup (4 surfaces)

| Page | Location | Current | Action | Replacement |
|------|----------|---------|--------|-------------|
| `index.html` | Field Notes close section | Email signup is being wired… | **Rewrite** | Field Notes covers new records, methodology updates, and measurement updates. |
| `field-notes/index.html` | Footer CTA | Email signup is being wired… | **Rewrite** | Field Notes covers… For correspondence, contact brendan@imbaslabs.com. |
| `for-readers.html` | CTA row | Email signup is being wired… | **Rewrite** | Same production copy + mailto |
| `contact.html` | Field Notes route | Email signup is being wired — contact… | **Rewrite** | Read Field Notes link + mailto |

**Rationale:** "Being wired" is internal implementation language. Replacement describes what Field Notes is without excusing a missing signup form.

### 3. Field Notes index empty state

| | |
|---|---|
| **Page** | `field-notes/index.html` |
| **Location** | Main content |
| **Current copy** | *Field Notes are being prepared* / *The first notes are in draft…* / *While you wait* |
| **Action** | **Rewrite** |
| **Replacement** | **Notes** section listing published note: *What the Volunteer Gap Measures* · **Explore the record** (renamed from While you wait) |
| **Rationale** | Empty-state placeholder language. A published note exists; index should reflect the live record. |

### 4. Field Notes article draft label

| | |
|---|---|
| **Page** | `field-notes/what-the-volunteer-gap-measures.html` |
| **Location** | Article provenance line + meta/JSON-LD |
| **Current copy** | Status: *Draft* · meta: *A draft measurement note…* |
| **Action** | **Rewrite** |
| **Replacement** | Status: *Note* · meta: *A measurement note…* |
| **Rationale** | "Draft" reads as unpublished internal status on a public page. |

### 5. Homepage — building language

| | |
|---|---|
| **Page** | `index.html` |
| **Location** | Why Imbas exists / exists-bridge payoff |
| **Current copy** | *Imbas is building the inspection layer for AI.* |
| **Action** | **Rewrite** |
| **Replacement** | *Imbas is the inspection layer for AI.* |
| **Rationale** | Present-tense product identity vs. construction status. |

### 6. Homepage — roadmap Next item

| | |
|---|---|
| **Page** | `index.html` |
| **Location** | Roadmap grid, "Next" column |
| **Current copy** | *Live measurement while you read.* |
| **Action** | **Rewrite** |
| **Replacement** | *Cross-model case records and the Workbench — run measured cases on your own AI.* |
| **Rationale** | Original copy described a future feature. Replacement points to capabilities available now. |

### 7. Contact page intro

| | |
|---|---|
| **Page** | `contact.html` |
| **Location** | Page intro |
| **Current copy** | *Imbas is a measurement institution being built in public.* |
| **Action** | **Rewrite** |
| **Replacement** | *Imbas documents frontier AI surfacing behavior as a public measurement record.* |
| **Rationale** | "Built in public" is process language, not user value. |

### 8. Public Interest — instrument line

| | |
|---|---|
| **Page** | `public-interest.html` |
| **Location** | How it's measured |
| **Current copy** | *The instrument is being built to be checked, not trusted.* |
| **Action** | **Rewrite** |
| **Replacement** | *The instrument is built to be checked, not trusted.* |
| **Rationale** | Design principle in present tense; removes construction framing. |

### 9. Accessibility — early-stage disclaimer

| | |
|---|---|
| **Page** | `accessibility.html` |
| **Location** | Commitment paragraph |
| **Current copy** | *…The site is an early-stage static site and will be improved over time.* |
| **Action** | **Remove** (trim sentence) |
| **Replacement** | *Imbas is working toward alignment with WCAG 2.1 Level AA / WCAG 2.2 Level AA where practical.* |
| **Rationale** | "Early-stage" and "will be improved" are build-status qualifiers. WCAG commitment stands alone. |

### 10. Institutions — near-term roadmap

| | |
|---|---|
| **Page** | `institutions.html` |
| **Location** | Near-term deliverables section |
| **Current copy** | Current / Next / **Later: Eventually, live signal tooling** |
| **Action** | **Rewrite** |
| **Replacement** | **What institutions receive** · Available now (incl. Workbench replay) · Pilot engagements |
| **Rationale** | "Eventually, live signal tooling" is explicit future-product roadmap. Reframed around deliverables available today and pilot scope. |

### 11. Case pages — transcript placeholders (×5 pages, ×2 each)

| | |
|---|---|
| **Pages** | `case/005.html`, `003.html`, `013.html`, `018.html`, `021.html` |
| **Location** | Under open/targeted prompt fields |
| **Current copy** | *Full transcript to be added.* |
| **Action** | **Remove** |
| **Replacement** | *(removed — prompt text remains)* |
| **Rationale** | Internal content backlog note visible to readers. Prompts and findings carry the record. |

---

## Kept intentionally (no change)

| Page | Copy | Rationale |
|------|------|-----------|
| All case pages | *This is a preliminary public case record…* | Methodological honesty about record completeness — strengthens trust, not build status |
| `methodology.html` | Inter-rater reliability *not yet measured*; cross-week behavior *not yet measured* | Documented methodology limitations — required transparency |
| `faq.html` | v2 sub-study / reliability *will be reported when v2 publishes* | Same — explicit limitation disclosure |
| `workbench.html` | *Selected submissions may become future Imbas records after review* | Describes live Suggest submission behavior, not product roadmap |
| `index.html` | Roadmap section (Now / Next / For Institutions labels) | Reframed content; section name retained as product arc, not dev status |
| `privacy.html` | *If analytics… are added later, this policy will be updated* | Standard legal forward-looking clause |
| `terms.html` | *Terms may update… effective date will be updated* | Standard legal clause |
| Form `placeholder` attributes | e.g. *Paste the full response here…* | UX hints, not product placeholders |

---

## Pages audited — no issues found

- `volunteer-gap.html`
- `how-it-works.html`
- `archive.html`
- `faq.html` (kept limitation copy only)
- `404.html`
- `terms.html`
- `privacy.html` (kept legal forward-looking only)

---

## Regression / verification

- `final-check.mjs` updated: expects **0** `.wb-build-note` elements (banner removed)
- Suggest Investigation flow, scoring, case data, and selector unchanged
- Homepage structure unchanged except approved copy rewrites above

---

## Screenshots

Captured to `qa-screenshots-case-structure-fix/production-copy-audit/`:

1. `homepage-exists-bridge-desktop-1440.png` — "Imbas is the inspection layer for AI"
2. `homepage-roadmap-desktop-1440.png` — Roadmap Now / Next / For Institutions
3. `homepage-field-notes-desktop-1440.png` — Field Notes close section (production copy)
4. `workbench-top-desktop-1440.png` — Workbench without build banner
5. `field-notes-index-desktop-1440.png` — Notes list + production CTA
6. `public-interest-measured-desktop-1440.png` — How it's measured section
7. `mobile-field-notes-375.png` — Homepage Field Notes at 375px
