# Harness history

**Append-only. This file is a historical record, not manifest authority.**

Every entry below is a block of prose that once stood in
`docs/qa/visual-acceptance-harness/manifest.md` and was removed when that document stopped being
hand-annotated and became generated. The blocks are quoted verbatim, frozen at the moment they were
written, and each one is expected to describe a board that no longer exists.

Nothing here states a current fact. The current inventory, and the current byte identity of every
committed baseline, live in `manifest.md` and nowhere else — and `manifest.md` is regenerated from
the bytes on disk and checked byte-for-byte by `test/qa-manifest-freshness.test.mjs`, so it is the
only one of the two files a reader can trust about today. If this file and `manifest.md` disagree
about the board, `manifest.md` is right and this file is doing its job.

Entries are appended, never edited, never re-ordered, never deleted. A statement that later turned
out to be wrong stays, with the correction recorded underneath it, because the point of the record is
what was believed at the time and on what basis.

---

## 2026-08-05 — the manifest became a derived document

The manifest used to be a by-product of a capture run, built from that run's results. Regenerating
it therefore required re-photographing the whole board, which the acceptance protocol forbids, so it
could only be kept current by doing the one thing nobody is allowed to do. It went stale four times,
reaching 34-of-48 and then fully stale, while every individual baseline acceptance was correct.
It is now derived from the scenario registry and the committed bytes, and its freshness is asserted
by the suite.

Readers had annotated it in the meantime — a banner, a provenance addendum, a founder ruling — and a
generated document deletes anything typed into it. Those blocks are recorded here.

**Measured at the time this record was written**, against the tree at `991cf34`:

- The old manifest listed 48 images. The registry registered 62. The 14 it never listed were not
  marked absent; the document read as complete.
- **0 of its 48 recorded checksums matched the bytes on disk.** Not 34 of 48 — none of them. FD-1
  (`abe1914`) repainted 61 of the 62 baselines after those checksums were written, so by the time
  this record was made the document's per-image attestations were wrong for every image it listed.
- Its `captured_against_sha` was one value, `da08ce44`, stamped identically on all 48 rows.

---

### Block 1 — the STALE banner

Hand-written. Stood immediately under the `# Visual acceptance manifest` heading.

````text
> **STALE — this manifest is a qualified historical record, not a current inventory.**
>
> The current board contains 31 scenarios and 62 PNG baselines. This manifest describes an earlier 48-image board and is therefore not current on inventory, coverage count, checksums, byte counts, or board-wide capture provenance.
>
> The committed baseline files currently divide by the commit in which each file was last changed:
>
> - 34 images: 7e9ebb9f84df5b02f38ad5f629033413028d1677
> - 14 images: af51c2243f8da2953a3850377bff6c9b7d84af0e
> - 8 images: d914e47d95921d0c08335c13888487001c2919da
> - 6 images: 0c308b6521cf8c08ab4fcc2d49643813cbf6801e
>
> These SHAs identify where the committed baseline files were last changed. They do not establish when the pixels were captured, which working tree produced them, or that checking out those commits reproduces them.
>
> The historical capture-provenance paragraphs below describe the earlier subset to which they originally applied. They do not describe the current 62-image board as a whole.
>
> A named follow-on will separate per-image capture provenance from the derived manifest inventory and add browser-free manifest generation. Until then, this file is retained as a qualified historical record and must not be treated as a current complete inventory of the acceptance board.
>
> Nothing here is wrong by accident. `--update <scenario>` refuses to rewrite the manifest when the run did not re-capture every image, because rewriting it from a partial run would silently drop the images that run did not touch. Four passes have now accepted baselines one scenario at a time under a scope rule that forbids a broad update, so the manifest has fallen behind four times by design.
>
> The third pass (conditions provenance) accepted 17 scenarios and moved exactly one image: `share-paired-no-model--mobile.png`. Its other 16 acceptances were snapshot-only — the payload gained a declaration block and no pixel changed. That block shipped in that pass as a singular `run_declaration` object; the fourth pass (declaration history) replaced it with the `run_declarations` array, which is the key to grep for today. That one image moved because the share page grew a section below the fold, which lengthened the document and re-rasterized the fixed-attachment masthead gradient by at most 2 RGB levels; the section itself is not in frame at either viewport.
>
> The fourth pass (declaration history) accepted the same 17 scenarios and moved the same one image, for the mirror-image reason: the share page LOST the decl.1 block that pass three had given it, the document shortened, and the fixed-attachment gradient re-rasterized again. `share-paired-no-model--mobile.png` went 313703 → 313547 bytes and stayed inside `curated-readout-mobile-header-raster-v1` byte-identical, 0 differing pixels. The other 16 acceptances were snapshot-only. Payload-only churn, no render change on any of the 34 snapshots: 34 scenarios traded `run_declaration` for `run_declarations: []`, 8 share scenarios gained `declaration_ids: []`, and 8 gained `declaration_state`.
````

**Disposition: UNIQUE HISTORICAL RECORD.**

Why it is not carried into `manifest.md`: the banner is a statement *about* the document's own
decay, and the decay is what the generator removed. Re-emitting it would have the manifest declare
itself stale at the moment it was proven fresh. It is also hand-written by definition — a warning
that a document cannot be trusted cannot itself be generated by that document.

Superseded in these respects, recorded here so the block is not read as current:

- *"The committed baseline files currently divide by the commit in which each file was last
  changed: 34 / 14 / 8 / 6."* No longer true. Measured at `991cf34`, the 62 committed PNGs divide
  61 to `abe1914d516a4da2d8eb42ed9548719de1be7414` and 1 to `8b7dfd6f744255099b0668471ce54d540efc4e05`.
  All four commits the banner names are real and still in history; the division across them is not.
- *"A named follow-on will separate per-image capture provenance from the derived manifest inventory
  and add browser-free manifest generation."* Done. Browser-free generation is
  `node scripts/qa/visual-acceptance.mjs --manifest`; per-image capture provenance moved to each
  snapshot's `## environment` block.
- *"`--update <scenario>` refuses to rewrite the manifest when the run did not re-capture every
  image ... so the manifest has fallen behind four times by design."* The refusal branch is deleted.
  A single-scenario `--update` now regenerates the whole record from committed bytes, so there is no
  partial case left to refuse and no fifth fall-behind available.

Retained as historical fact, carried nowhere else: the third-pass and fourth-pass narrative — 17
scenarios accepted twice, one image moved each time, `share-paired-no-model--mobile.png` at
313703 → 313547 bytes, and the `run_declaration` → `run_declarations` rename. That is a reading of
two passes that no file in the tree reconstructs.

---

### Block 2 — the capture-provenance header

Lines 1, 3 and 7–12 of this block were **generated** by the old `writeManifest`. Line 5 (the
`d914e47` addendum) was **hand-written**; the old generator carried a source comment naming it as an
addendum that a regeneration would drop.

````text
captured_against_sha: `da08ce44a8b3ffc6130deb769a139169551f8eea`

**These images were captured against commit `da08ce44a8b3ffc6130deb769a139169551f8eea` PLUS the uncommitted working tree of the pass that produced them.** They were not captured against their own commit — that commit did not exist yet when the shutter fired. Treat `captured_against_sha` as the base the working tree sat on top of, nothing stronger.

That uncommitted working-tree state was subsequently committed as `d914e47d95921d0c08335c13888487001c2919da`. This line records where those changes landed; it does not change what `captured_against_sha` above means, and `d914e47` is not the commit these images were captured against.

- working tree at capture time: **dirty**
- browser: `/Users/brendan/Library/Caches/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-mac-arm64/chrome-headless-shell`
- browser version: `HeadlessChrome/148.0.7778.96`
- captured: 2026-07-30T20:07:18.643Z
- fixtures: synthetic, from `scripts/qa/scenarios.mjs` — not captures, not evidence
- network: deny-by-default; no model API call is reachable from this harness
````

**Disposition: UNIQUE HISTORICAL RECORD.**

Why it is not carried into `manifest.md`: this whole block is generation-time measurement, and
generation-time measurement is precisely what staled the file. A timestamp, a HEAD and a
working-tree flag make an unrelated commit rot the document. The new generator emits none of it, and
`test/qa-manifest-freshness.test.mjs` asserts their absence by pattern so they cannot return quietly.

Partially preserved elsewhere, but not enough to qualify this block as covered:

- `browser version: HeadlessChrome/148.0.7778.96` — now recorded per image, in each snapshot's
  `## environment` block and in each `manifest.md` image row's `browser` field. Fully covered.
- `fixtures: synthetic ... not captures, not evidence` and `network: deny-by-default` — standing
  properties of the harness, documented in `DEPLOY.md`. Fully covered.
- `working tree at capture time: dirty`, `captured: 2026-07-30T20:07:18.643Z`, the browser
  executable path, and both commit SHAs — **carried nowhere else in the tree.** They are the reason
  this block is C rather than B.

---

### Block 3 — the `captured_against_sha` attestations

Generated. One preamble line, and one table row repeated on all 48 image blocks — a single value, not
48 measurements:

````text
| captured_against_sha | `da08ce44a8b3ffc6130deb769a139169551f8eea` + uncommitted working tree |
````

**Disposition: UNIQUE HISTORICAL RECORD, as a superseded statement.**

This is the block the disposition rule asks about directly, and the honest answer is that the value
was **a board-wide inference, not a per-image capture fact**:

1. It was one value stamped on every row. `git rev-parse HEAD` was read once per generation and
   written 48 times, so the row said the same thing on every image regardless of when that image's
   pixels were actually taken.
2. It was **silently inapplicable to the 14 registered images the manifest never listed.** Those
   images had no row, so the document neither attested provenance for them nor recorded that it
   could not. A reader counting rows saw 48 consistent attestations and no gap.
3. By the time it was removed, **all 48 checksums it accompanied were wrong**, because `abe1914`
   had repainted the baselines underneath them. A provenance claim attached to bytes that no longer
   exist attests nothing.
4. The old manifest's own banner had already conceded the general form of this defect for the
   last-changed SHAs: *"They do not establish when the pixels were captured, which working tree
   produced them, or that checking out those commits reproduces them."* The same limit applied to
   `captured_against_sha`, and the banner did not say so.

It is therefore not carried into the new manifest model in any form. Capture-time provenance is now
per image and recorded where it stays true — in each snapshot's `## environment` block, written by
the capture that produced the pixels beside it. `git log` on an image file records when those bytes
last moved. Neither is an inference.

---

### Block 4 — the founder ruling of 2026-08-03

Hand-written. Stood under `## Comparison policy`, above the generated paragraph.

````text
> UPDATE 2026-08-03 — founder ruling. `curated-readout-mobile-header-raster-v1` is retired. It observed a real browser-noise event against one specific accepted baseline; FD-1 lawfully repainted that baseline, and an observation does not follow a baseline it was not made against. The active registry is now empty. The observation is retained, unaltered and internally verified, in `scripts/qa/raster-policy.mjs` (`HISTORICAL_RASTER_OBSERVATIONS`) and `test/fixtures/curated-readout-mobile-alternate-raster.json`, against a pinned crop of the pixels it was seen on. Activating any new tolerance is a founder ruling. The paragraph below is what the generator now emits; this banner is not generated and a regeneration will drop it.
````

**Disposition: UNIQUE HISTORICAL RECORD.**

A ruling can be superseded; it cannot be non-historical, and this one is not superseded — it is in
force. Every substantive clause is *additionally* carried in `scripts/qa/raster-policy.mjs`:

| clause | where it also lives |
| --- | --- |
| `curated-readout-mobile-header-raster-v1` is retired | `HISTORICAL_RASTER_OBSERVATIONS[0]`: `status: "OBSERVED_AGAINST_SUPERSEDED_BASELINE"`, `applicability: "HISTORICAL_NOT_APPLICABLE"`, `retiredOn: "2026-08-03"` |
| it observed a real browser-noise event against one accepted baseline | header comment, *WHY IT WAS DEACTIVATED (founder ruling, 2026-08-03)* |
| FD-1 repainted that baseline; an observation does not follow a baseline it was not made against | same comment, and `supersededBy: "abe1914d516a4da2d8eb42ed9548719de1be7414"` |
| the active registry is now empty | `export const RASTER_POLICIES = []`, and the *CURRENT STATE* comment |
| the observation is retained, unaltered, against a pinned crop | `HISTORICAL_RASTER_OBSERVATIONS[0]` with bounds and ceilings unchanged; `evidence: "test/fixtures/curated-readout-mobile-alternate-raster.json"` |
| activating any new tolerance is a founder ruling | *"Activating a tolerance is a founder ruling, not a code change"* and *"any second use, any bounds change and any ceiling change needs a new founder ruling — and so, now, does any use at all"* |

One clause is **not** covered there, which is why this block is C and not B: *"The paragraph below is
what the generator now emits; this banner is not generated and a regeneration will drop it."* That is
a statement about the manifest's own mechanics. Its general form is now the manifest's opening line —
anything typed into the file is deleted by the next regeneration — and its specific prediction was
correct: the regeneration dropped it, which is why it is here.

---

### Block 5 — a retired coverage ruling in *What the board does not photograph*

Generated, from the `UNPHOTOGRAPHED` list as that list stood on 2026-07-30. The list has since been
edited in source, so this entry survived only in the un-regenerated document:

````text
- **The share and permalink page, in every state** — Carved out of this pass by ruling. The share surface still renders a score from its stored row, and schema, render, page metadata and consent copy move together in 2B-C. Share scenarios arrive with 2B-C under 2B-C's own coverage.
````

**Disposition: UNIQUE HISTORICAL RECORD.**

It records a ruling — a deliberate scope carve-out — so it is not eligible to be called
non-historical. It is superseded on the facts: the share surface **is** photographed now
(`share-receipt` and the other share scenarios are on the board), and the score it describes the
share surface as rendering has since been removed from the product. Its own replacement in the
current manifest is the entry beginning *"A published share whose sources WERE captured"*.

That this block outlived its own source constant is itself evidence of the defect being fixed: the
registry said one thing and the un-regenerated document said another, for four passes, with nothing
comparing them.

---

### Not preserved here, because it is genuinely preserved in `manifest.md`

These generated rows were removed from the pinned-environment table and are recorded verbatim in the
current manifest's per-image rows, one per image instead of once for the board:

- `browser_version` → each image row's `browser` field, read back from the snapshot that image was
  captured with.
- `url` → each image row's `url` field. It was never a pinned value; the board photographs more than
  one page, so a single pinned row understated it.
- the per-viewport rows carrying `scroll offset` → each image row's `framed on ... at scroll offset`
  field. The old table emitted the same two viewport geometries once per captured image, 48 times,
  differing only in a scroll offset that belongs to the image and not to the viewport.

One removed row is **not** preserved in `manifest.md` and is recorded in Block 2 above instead:

````text
| browser_executable | `/Users/brendan/Library/Caches/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-mac-arm64/chrome-headless-shell` |
````

An absolute path on one machine. It is provenance — it names the Playwright cache revision that
produced those bytes — but it is not a property of the board, and a machine path in a generated
document stales it for everyone else. It stays here, with the capture session it belongs to.
