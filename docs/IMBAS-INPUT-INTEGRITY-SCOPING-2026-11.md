# Input Integrity: detection gap and three scoped additions (2026-11-03)

Scoping notes for brief item 12. Nothing here is built. Each section says what the instrument does today, what a build would take, and the rule that decides whether it can ship.

## 1. Text coloured to match a non-white backdrop

**Checked, and not detected today.** A constructed one-page test file carried two runs:

- light grey text (fill 0.92, 0.92, 0.92) on the white page;
- dark text (fill 0.16) on a dark filled rectangle (0.12).

Neither surfaced. The run reported "The checks surfaced no text on this file's pages." The only colour class is `white_fill_unbacked`. It requires a fill of exactly `[1, 1, 1]` and nothing painted under the run earlier in the stream (`backdrop_source: "page_default"`). Any other colour, or any backdrop, falls outside it by construction.

**Admission.** The repository has no written process for admitting a new phenomenon class. What it has is the cost of one:

- `file-result.js` declares the schema as "Eleven classes … v1, structural only". A twelfth class changes `file-result.v1`.
- `PREDICATE_SET_VERSION` would move from 1.0.0.
- `DESCRIBED_CLASS_COUNT_WORD` would change to "twelve". `test/file-templates.test.mjs` pins it so the zero-state scope sentence cannot go quietly wrong.
- The vendored fixture corpus, the ground-truth tests and the lint receipts would all move.
- `file-templates.js` records the classes refused a rendering consequence "so it is not reopened from the same premise". A contrast class sits in exactly that appearance territory.

A schema version is a founder decision, so this pass scopes the class and does not build it.

**Proposed class: `low_contrast_fill`.**

- **Measured.** The run's fill colour, the colour of the single opaque filled path painted under the whole run box earlier in the stream (or the page default), and the WCAG relative-luminance contrast ratio between the two.
- **Graphics state.**
  - `fill_color_rgb` (rgb)
  - `backdrop_color_rgb` (rgb)
  - `backdrop_source` (enum: `page_default` | `filled_path`)
  - `contrast_ratio` (positive number)
- **Checks.** `fill_color`, `backdrop_source`, `contrast_ratio`.
- **Threshold.** `contrast_ratio_max`, stated in the finding. A starting value of 1.5:1 reaches both test runs (about 1.2:1 and 1.1:1) and leaves ordinary grey body text alone.
- **Guards. Each one emits nothing for the span:**
  - a backdrop that is an image, a shading or a form;
  - more than one path under the run;
  - any alpha below 1, a soft mask or a non-normal blend mode on either side;
  - a colour space other than DeviceGray or DeviceRGB.

  Ineligibility is the control here, as it is for every class today.
- **Overlap.** White on the page default stays `white_fill_unbacked` only. The new class excludes `[1, 1, 1]` over `page_default`, so one run never reports twice for one property.
- **Plain label.** "Low-contrast text (1.1:1 against what is behind it)".
- **Summary phrase.** "in a colour close to what is behind it".
- **Effort.** About two days. The walker already records each path's fill colour (`file-graphics-walker.js`), and `detectWhiteFillUnbacked` already walks the earlier paints.
- **Tests.**
  - Fixtures: grey on white, dark on dark, 3:1 grey that must not surface, text over an image (ineligible), and white on the page (`white_fill_unbacked` only).
  - Schema construction tests, label and summary lint receipts, and a ground-truth row per fixture.
- **Copy rules.** State the two colours and the ratio. Never "hard to read", "faint" or "invisible": the lane reports what the file sets, not what anyone saw.

## 2. Scope only: a marker for instruction-style phrases

- **What it would do.** Match the extracted text of every span, page and metadata alike, against a published, versioned phrase list. Report "matched these phrases" with the phrase and the span it matched in.
- **No inference from a non-match.** When nothing matches, the surface states the list's name and size and says a list cannot show that a file is free of instructions. It never says "no instructions found".
- **Where it sits.** Not as a phenomenon class. `file-result.js` says the schema reads no text: "What a span SAYS is outside this schema entirely". So this is a second, separate layer with its own registry and its own receipt field. That needs a ruling.
- **The list.** Vendored, pinned by sha256, with its source URL and version recorded beside it. Candidates are the prompt-injection probe sets that security test suites publish. The list must be one Imbas did not write, so the matches are not Imbas's own judgement.
- **Matching.** Case-folded and whitespace-collapsed, after NFKC normalisation and after stripping the zero-width and bidi codepoints this lane already names.
- **Effort.** About a day and a half with tests.
- **Tests.** List hash pinned, normaliser unit tests, a known-match fixture, a near-miss fixture that must not match, and the non-match sentence in the lint receipt.
- **Copy rules.** "Matched these phrases from [list, version]". The file lint bans "injection", "attack", "manipulation" and "detected", so none of them can appear. Neither can any claim about what the phrase would do to a model.

## 3. Scope only: what the file declares about its origin

- **What it would show.** A short section, "Declared by the file, not verified", with three entries:
  - **Creating software.** The Creator and Producer fields, already listed under Document details.
  - **IPTC generative-AI source tag.** `Iptc4xmpExt:DigitalSourceType` from the XMP packet (for example `trainedAlgorithmicMedia`). The record already parses XMP into `xmp_fields`, so this is display work.
  - **Content Credentials (C2PA).** Whether a manifest store is present: an associated or embedded file the C2PA PDF embedding names, with the claim generator string if one is readable. Presence only.
- **What it would not do.** Validating C2PA signatures needs the C2PA SDK (WebAssembly) and trust lists fetched over the network. This surface sends nothing over the network, so validation is out. The label says so.
- **Effort.** Half a day for the IPTC tag and the section, and a day for C2PA presence.
- **Tests.**
  - An XMP fixture carrying DigitalSourceType.
  - A PDF with a C2PA manifest attachment, to assert presence only.
  - A file with neither, which renders nothing for this section, with no "none" row.
- **Copy rules.** "Declared by the file, not verified." Never "AI-generated", "authentic", "genuine" or "verified". The values are the file's own strings, shown as data beside their field names.

## 4. Scope only: an inventory of active content

- **What it would list.** Facts only:
  - document-level scripts (the Names JavaScript tree);
  - an open action, and its kind;
  - additional actions on pages and fields;
  - launch actions;
  - embedded files, which the record already carries as `attachments`;
  - external link targets, by domain, from link annotations.

  Counts and targets, no verdict.
- **Source.** pdf.js exposes these as document and annotation data (`getJSActions`, `getOpenAction`, annotation `url`), and the worker already reads attachments.
- **Effort.** About a day and a half.
- **Tests.** One fixture per kind, a file with none (renders nothing), and a link-domain fixture that proves the list shows domains and never full URLs with query strings.
- **Copy rules.** The boundary line already says the surface "does not scan for viruses, audit security, or make any claim about the file's safety". The inventory sits under it. No "dangerous", "malicious", "suspicious" or "unsafe"; the file lint bans them already. No count is styled as a warning, and no order implies a ranking.
