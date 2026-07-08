SUPERSEDED 2026-07-07 — current source: live Field Notes signup + STATE.md. Retained as record.

# Field Notes Subscribe — Sitewide Consistency QA

**Date:** 2026-05-29 · **Status:** Verified in working tree · **Not committed**

---

## Final pattern (required)

| Element | Value |
|---------|--------|
| Heading | Field Notes |
| Heading color | `var(--ember-soft)` · `rgb(240, 143, 88)` |
| Body | Get updates, new cases, and findings from Imbas. |
| Form | Email address input + Subscribe button |
| CTA | Read Field Notes → |
| Button | Deep ember fill, 44px min-height, not ghost |

---

## Pages checked (14)

| Page | Subscribe form | Heading ember-soft | Good body | Old copy | Placeholder copy | Changed |
|------|:--------------:|:------------------:|:---------:|:--------:|:----------------:|:-------:|
| `index.html` | ✓ | ✓ | ✓ | none | none | prior pass |
| `field-notes/index.html` | ✓ | ✓ | ✓ | none | none | **yes** |
| `for-readers.html` | ✓ | ✓ | ✓ | none | none | cache bust |
| `contact.html` | — | — | — | none | none | link only |
| `archive.html` | — | — | — | none | none | — |
| `institutions.html` | — | — | — | none | none | — |
| `public-interest.html` | — | — | — | none | none | — |
| `volunteer-gap.html` | — | — | — | none | none | — |
| `how-it-works.html` | — | — | — | none | none | — |
| `methodology.html` | — | — | — | none | none | — |
| `faq.html` | — | — | — | none | none | — |
| `privacy.html` | — | — | — | none | none | legal only |
| `terms.html` | — | — | — | none | none | legal only |
| `accessibility.html` | — | — | — | none | none | — |

---

## Changes this pass

### `field-notes/index.html`
- Replaced h2 **Subscribe** with **Field Notes** + `field-notes__heading`
- Added **Read Field Notes →** link to published note
- Cache bust: `styles.css?v=field-notes-subscribe-ember`

### `styles.css`
- Consolidated `.field-notes-signup h2.field-notes__heading` rule
- Added For Readers override so `.rd-section__title` white color does not win

### `for-readers.html`
- Cache bust: `styles.css?v=field-notes-subscribe-ember`

---

## Mistakes searched (sitewide grep)

| Pattern | Found in public HTML |
|---------|---------------------|
| Follow new records, measurement updates… | **0** |
| Records show the result… | **0** |
| FOLLOW NEW RECORDS AND PRODUCT RELEASES. | **0** |
| Email signup is being wired. | **0** |
| `#C9A36A` / `#C9B08A` / `--fn-heading-accent` | **0** |

---

## Computed heading colors (subscribe surfaces)

| Surface | Expected | Verified |
|---------|----------|----------|
| Homepage close section | `rgb(240, 143, 88)` | ✓ |
| Field Notes index subscribe | `rgb(240, 143, 88)` | ✓ |
| For Readers Field Notes block | `rgb(240, 143, 88)` | ✓ |

---

## Layout status

| Surface | Desktop | Mobile 375 |
|---------|---------|------------|
| Homepage | one-row form | stacked full-width |
| Field Notes index | one-row form | stacked full-width |
| For Readers | one-row form | stacked full-width |

---

## Screenshots

`qa-screenshots-case-structure-fix/field-notes-subscribe/`:

1. `homepage-field-notes-subscribe-desktop-1440.png`
2. `homepage-field-notes-subscribe-mobile-375.png`
3. `field-notes-index-subscribe-desktop-1440.png`
4. `field-notes-index-subscribe-mobile-375.png`
5. `for-readers-field-notes-subscribe-desktop-1440.png`
6. `for-readers-field-notes-subscribe-mobile-375.png`
7. `homepage-field-notes-subscribe-success-desktop-1440.png`
8. `sitewide-verification.json`

---

## Regression

- `final-check.mjs` — all checks pass
- Workbench unchanged
- Footer navigation unchanged
