# Visual acceptance manifest

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

captured_against_sha: `da08ce44a8b3ffc6130deb769a139169551f8eea`

**These images were captured against commit `da08ce44a8b3ffc6130deb769a139169551f8eea` PLUS the uncommitted working tree of the pass that produced them.** They were not captured against their own commit — that commit did not exist yet when the shutter fired. Treat `captured_against_sha` as the base the working tree sat on top of, nothing stronger.

That uncommitted working-tree state was subsequently committed as `d914e47d95921d0c08335c13888487001c2919da`. This line records where those changes landed; it does not change what `captured_against_sha` above means, and `d914e47` is not the commit these images were captured against.

- working tree at capture time: **dirty**
- browser: `/Users/brendan/Library/Caches/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-mac-arm64/chrome-headless-shell`
- browser version: `HeadlessChrome/148.0.7778.96`
- captured: 2026-07-30T20:07:18.643Z
- fixtures: synthetic, from `scripts/qa/scenarios.mjs` — not captures, not evidence
- network: deny-by-default; no model API call is reachable from this harness

## Portability

**Image baselines are specific to the machine and browser build that produced them.** PNG bytes depend on the platform's font rasterizer and the Chromium encoder, so the same page on another machine, another OS, or another Chromium version encodes to different bytes even when it looks identical. Do not treat an image diff on a different machine, or in CI, as a regression signal — it will report changed for reasons that have nothing to do with the product. The **snapshot** baselines (`*.snapshot.txt`) carry no rasterized pixels and are portable; they are the layer to trust when the machine changes.

## Comparison policy

> UPDATE 2026-08-03 — founder ruling. `curated-readout-mobile-header-raster-v1` is retired. It observed a real browser-noise event against one specific accepted baseline; FD-1 lawfully repainted that baseline, and an observation does not follow a baseline it was not made against. The active registry is now empty. The observation is retained, unaltered and internally verified, in `scripts/qa/raster-policy.mjs` (`HISTORICAL_RASTER_OBSERVATIONS`) and `test/fixtures/curated-readout-mobile-alternate-raster.json`, against a pinned crop of the pixels it was seen on. Activating any new tolerance is a founder ruling. The paragraph below is what the generator now emits; this banner is not generated and a regeneration will drop it.

Every image on this board is compared byte-for-byte against its baseline. There is no exception: no scenario carries a bounded-comparison policy, so any difference of any size in any pixel fails the run.

## Pinned environment

Recorded so a future run can explain why a baseline is or is not comparable.

| pinned value | setting |
| --- | --- |
| browser_executable | `/Users/brendan/Library/Caches/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-mac-arm64/chrome-headless-shell` |
| browser_version | `HeadlessChrome/148.0.7778.96` |
| capture_region | `viewport (state scrolled into it)` |
| color_scheme | `light` |
| font_strategy | `webfonts fetched once into .qa-cache/, served from disk, document.fonts.ready awaited` |
| image_diff | `enabled` |
| locale | `en-US` |
| reduced_motion | `reduce` |
| screenshot_format | `png` |
| timezone | `UTC` |
| url | `/workbench.html` |
| viewport `desktop` | `1440x900 @ dsf 2, mobile=false, scroll offset 2646` |
| viewport `mobile` | `375x812 @ dsf 3, mobile=true, scroll offset 3053` |
| viewport `desktop` | `1440x900 @ dsf 2, mobile=false, scroll offset 6117` |
| viewport `mobile` | `375x812 @ dsf 3, mobile=true, scroll offset 8567` |
| viewport `desktop` | `1440x900 @ dsf 2, mobile=false, scroll offset 6197` |
| viewport `mobile` | `375x812 @ dsf 3, mobile=true, scroll offset 8713` |
| viewport `desktop` | `1440x900 @ dsf 2, mobile=false, scroll offset 6030` |
| viewport `mobile` | `375x812 @ dsf 3, mobile=true, scroll offset 8445` |
| viewport `desktop` | `1440x900 @ dsf 2, mobile=false, scroll offset 5006` |
| viewport `mobile` | `375x812 @ dsf 3, mobile=true, scroll offset 6557` |
| viewport `desktop` | `1440x900 @ dsf 2, mobile=false, scroll offset 5602` |
| viewport `mobile` | `375x812 @ dsf 3, mobile=true, scroll offset 7510` |
| viewport `desktop` | `1440x900 @ dsf 2, mobile=false, scroll offset 1252` |
| viewport `mobile` | `375x812 @ dsf 3, mobile=true, scroll offset 1801` |
| viewport `desktop` | `1440x900 @ dsf 2, mobile=false, scroll offset 1744` |
| viewport `mobile` | `375x812 @ dsf 3, mobile=true, scroll offset 2636` |
| viewport `desktop` | `1440x900 @ dsf 2, mobile=false, scroll offset 2445` |
| viewport `mobile` | `375x812 @ dsf 3, mobile=true, scroll offset 2749` |
| viewport `desktop` | `1440x900 @ dsf 2, mobile=false, scroll offset 1546` |
| viewport `mobile` | `375x812 @ dsf 3, mobile=true, scroll offset 1632` |
| viewport `desktop` | `1440x900 @ dsf 2, mobile=false, scroll offset 5923` |
| viewport `mobile` | `375x812 @ dsf 3, mobile=true, scroll offset 8034` |
| viewport `desktop` | `1440x900 @ dsf 2, mobile=false, scroll offset 5125` |
| viewport `mobile` | `375x812 @ dsf 3, mobile=true, scroll offset 6788` |
| viewport `desktop` | `1440x900 @ dsf 2, mobile=false, scroll offset 5135` |
| viewport `mobile` | `375x812 @ dsf 3, mobile=true, scroll offset 6788` |
| viewport `desktop` | `1440x900 @ dsf 2, mobile=false, scroll offset 5125` |
| viewport `mobile` | `375x812 @ dsf 3, mobile=true, scroll offset 6796` |
| viewport `desktop` | `1440x900 @ dsf 2, mobile=false, scroll offset 5135` |
| viewport `mobile` | `375x812 @ dsf 3, mobile=true, scroll offset 6806` |
| viewport `desktop` | `1440x900 @ dsf 2, mobile=false, scroll offset 5435` |
| viewport `mobile` | `375x812 @ dsf 3, mobile=true, scroll offset 7524` |
| viewport `desktop` | `1440x900 @ dsf 2, mobile=false, scroll offset 5456` |
| viewport `mobile` | `375x812 @ dsf 3, mobile=true, scroll offset 7514` |
| viewport `desktop` | `1440x900 @ dsf 2, mobile=false, scroll offset 3735` |
| viewport `mobile` | `375x812 @ dsf 3, mobile=true, scroll offset 4789` |
| viewport `desktop` | `1440x900 @ dsf 2, mobile=false, scroll offset 7136` |
| viewport `mobile` | `375x812 @ dsf 3, mobile=true, scroll offset 10006` |
| viewport `desktop` | `1440x900 @ dsf 2, mobile=false, scroll offset 206` |
| viewport `mobile` | `375x812 @ dsf 3, mobile=true, scroll offset 819` |
| viewport `desktop` | `1440x900 @ dsf 2, mobile=false, scroll offset 141` |
| viewport `mobile` | `375x812 @ dsf 3, mobile=true, scroll offset 159` |
| viewport `desktop` | `1440x900 @ dsf 2, mobile=false, scroll offset 762` |
| viewport `mobile` | `375x812 @ dsf 3, mobile=true, scroll offset 790` |
| viewport `desktop` | `1440x900 @ dsf 2, mobile=false, scroll offset 1076` |
| viewport `mobile` | `375x812 @ dsf 3, mobile=true, scroll offset 1118` |
| viewport `desktop` | `1440x900 @ dsf 2, mobile=false, scroll offset 1086` |
| viewport `mobile` | `375x812 @ dsf 3, mobile=true, scroll offset 1147` |

## Photographed, under another name

These states are covered. They are listed on their own because no scenario is named after them, so a reviewer searching by name finds nothing and concludes there is a gap. Nothing in this section is a gap.

- **The paired surface with an ABSENT original-answer side** — photographed by `paired-unmatched`. Its second row renders only the Second answer excerpt, because the open side resolved to nothing and the surface leaves it out rather than standing a placeholder in its place. The scenario's `expected` states it, and `test/qa-board-coverage.test.mjs` holds the fixture to it.

## What the board does not photograph

A board that lists only what it covers reads as complete. These are the result states that exist in the product and have no image here, each with the reason. Anyone adding a scenario should check this list first — it is where the next one comes from.

- **The chip lane's empty comparison** — `CHIP_UI.reveal.empty_delta` in `reader-paired.js` renders its own empty state in the chip reveal, separate from the Reader's. The chip lane is fenced at chip.1.0 and this pass was instructed not to touch its logic, so photographing it would have meant driving a lane it could not fix if the capture found something wrong.
- **The share and permalink page, in every state** — Carved out of this pass by ruling. The share surface still renders a score from its stored row, and schema, render, page metadata and consent copy move together in 2B-C. Share scenarios arrive with 2B-C under 2B-C's own coverage.
- **A route that returns an unparseable body** — The harness can now inject failures — `httpFailure` and `neverResolves` in `scripts/qa/scenarios.mjs` — and `read-error`, `read-capacity` and `read-in-flight` photograph the three states that matter. A malformed body is the one failure left unphotographed: the client maps it to `bad_json`, which renders the same banner as the `no_key` and `disabled` configuration states already covered in wording by `read-error`'s frame. Injecting it is one line whenever a reviewer wants the image.
- **The curated case result panel, after a visitor pastes** — The board photographs the curated console at its first screen (`curated-readout`), which is one step before this. The panel is where the retired score gauge and the retired CLOSED GAP / PARTIALLY SURFACED / GAP HELD badge both sat, so it is the frame a reviewer most wants. It is not photographed because `runDate` is built from `new Date()` at run time and reaches the share text inside the panel, which would make the baseline change every day and turn a real regression into noise nobody reads. Pinning the clock is a harness capability, and the removal is held meanwhile by `test/reader-no-allclear-vocabulary.test.mjs`, which asserts at source level that no badge builder, verdict label table or tone class survives, and that the one sentence standing there is read off the stored case rather than computed from the paste.
- **The correction chips after a person has corrected the reading** — Every board state captures the default reading. The two corrected states change a headline and add a call to action (`LOOP_STATE_STILL_MISSING`, `LOOP_STATE_NOT_CLEAR` in `workbench-app.jsx`). They are reachable by one more drive step and are the most obvious next scenarios to add.
- **The mobile-tall viewport** — Declared in VIEWPORTS and not part of the default board. It exists to re-test a reported blank-compositor claim at 375x812, not to double every baseline; running it by default would triple the image set to re-photograph the same states.

## Images

### `single-findings--desktop.png`

| field | value |
| --- | --- |
| sha256 | `95f50ba815762283a12db09ee41b4b29aa3ee95baa880049e833829a4daeffac` |
| bytes | 670899 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `single-findings--desktop.snapshot.txt` |
| framed on | `.wb-measure__list li.wb-measure__finding` at scroll offset 2646 |
| state captured | Single mode, Reader result with measurement findings |
| expected behaviour | MEASUREMENT panel renders with the Candidate findings list non-empty: counts read 'Omission: 1 · Framing Drift: 1 · Deflection: 0' and two finding rows are listed with their verbatim anchors. |
| captured_against_sha | `da08ce44a8b3ffc6130deb769a139169551f8eea` + uncommitted working tree |

### `single-findings--mobile.png`

| field | value |
| --- | --- |
| sha256 | `90139e5e73ab22f8cfc64bfedf943b47c9861ebe864da2c188aff0a45b5c33c6` |
| bytes | 481644 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `single-findings--mobile.snapshot.txt` |
| framed on | `.wb-measure__list li.wb-measure__finding` at scroll offset 3053 |
| state captured | Single mode, Reader result with measurement findings |
| expected behaviour | MEASUREMENT panel renders with the Candidate findings list non-empty: counts read 'Omission: 1 · Framing Drift: 1 · Deflection: 0' and two finding rows are listed with their verbatim anchors. |
| captured_against_sha | `da08ce44a8b3ffc6130deb769a139169551f8eea` + uncommitted working tree |

### `paired-matched--desktop.png`

| field | value |
| --- | --- |
| sha256 | `3cd69577c7b68289491e9dc3283af252c6d2dd293600a533d8e7660c523728cc` |
| bytes | 641631 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `paired-matched--desktop.snapshot.txt` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 6117 |
| state captured | Paired comparison at method 2.0, both sides server-resolved, conditions derived as MATCHED |
| expected behaviour | The 'What the second answer added' section lists 2 rows. Row 1 quotes BOTH answers; both excerpts are spans the door resolved against the stored answers. Each row carries the Reader's reading in a labelled, unquoted register. Counts read 'Omission: 2 · Framing Drift: 0 · Deflection: 0' — the same collection as the rows. No unmatched-conditions warning: conditions_matched === true, derived client-side from same model + no edits. |
| captured_against_sha | `da08ce44a8b3ffc6130deb769a139169551f8eea` + uncommitted working tree |

### `paired-matched--mobile.png`

| field | value |
| --- | --- |
| sha256 | `2c2de1df8f483d1a760d416912b0f690d979280c5bb1a8db13993b76c592a390` |
| bytes | 506594 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `paired-matched--mobile.snapshot.txt` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 8567 |
| state captured | Paired comparison at method 2.0, both sides server-resolved, conditions derived as MATCHED |
| expected behaviour | The 'What the second answer added' section lists 2 rows. Row 1 quotes BOTH answers; both excerpts are spans the door resolved against the stored answers. Each row carries the Reader's reading in a labelled, unquoted register. Counts read 'Omission: 2 · Framing Drift: 0 · Deflection: 0' — the same collection as the rows. No unmatched-conditions warning: conditions_matched === true, derived client-side from same model + no edits. |
| captured_against_sha | `da08ce44a8b3ffc6130deb769a139169551f8eea` + uncommitted working tree |

### `paired-unmatched--desktop.png`

| field | value |
| --- | --- |
| sha256 | `9851b01af7e01b527a068f39b0a6bcf44db655c2027a5b940ffb5e102d078864` |
| bytes | 549254 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `paired-unmatched--desktop.snapshot.txt` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 6197 |
| state captured | Paired comparison at method 2.0 with an ABSENT open side, conditions derived as UNMATCHED |
| expected behaviour | The 'What the second answer added' section lists 2 rows. Row 2 shows ONLY the Second answer excerpt — its open side is ABSENT, so no First answer blockquote is rendered and no placeholder stands in for one. The unmatched-conditions warning is present: conditions_matched === false, derived client-side from a disclosed edit. |
| captured_against_sha | `da08ce44a8b3ffc6130deb769a139169551f8eea` + uncommitted working tree |

### `paired-unmatched--mobile.png`

| field | value |
| --- | --- |
| sha256 | `8851a8dd1d8ac87d9dff32d896eef021f0962b0753b75b901feb7ae8b7ed2334` |
| bytes | 472313 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `paired-unmatched--mobile.snapshot.txt` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 8713 |
| state captured | Paired comparison at method 2.0 with an ABSENT open side, conditions derived as UNMATCHED |
| expected behaviour | The 'What the second answer added' section lists 2 rows. Row 2 shows ONLY the Second answer excerpt — its open side is ABSENT, so no First answer blockquote is rendered and no placeholder stands in for one. The unmatched-conditions warning is present: conditions_matched === false, derived client-side from a disclosed edit. |
| captured_against_sha | `da08ce44a8b3ffc6130deb769a139169551f8eea` + uncommitted working tree |

### `paired-rejected-snippet--desktop.png`

| field | value |
| --- | --- |
| sha256 | `ede848d0820b41c303763d50c1df9c75196b3ffbb634c1eebd0370fb69cdeb5f` |
| bytes | 712861 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `paired-rejected-snippet--desktop.snapshot.txt` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 6030 |
| state captured | Paired comparison at method 2.0 where one proposed snippet did not resolve — recorded, not surfaced |
| expected behaviour | The 'What the second answer added' section lists ONE row, from two proposed differences. The rejected one ('a tenant who waits too long forfeits the penalty entirely') appears NOWHERE on screen — not as a row, not as a quotation, not as a count. The counts read 'Omission: 1 · Framing Drift: 0 · Deflection: 0' against paired-matched's 'Omission: 2'. |
| captured_against_sha | `da08ce44a8b3ffc6130deb769a139169551f8eea` + uncommitted working tree |

### `paired-rejected-snippet--mobile.png`

| field | value |
| --- | --- |
| sha256 | `c451c1892f59b598a705717312beb777efda05a80ae05eb4a69603be47aaf451` |
| bytes | 539788 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `paired-rejected-snippet--mobile.snapshot.txt` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 8445 |
| state captured | Paired comparison at method 2.0 where one proposed snippet did not resolve — recorded, not surfaced |
| expected behaviour | The 'What the second answer added' section lists ONE row, from two proposed differences. The rejected one ('a tenant who waits too long forfeits the penalty entirely') appears NOWHERE on screen — not as a row, not as a quotation, not as a count. The counts read 'Omission: 1 · Framing Drift: 0 · Deflection: 0' against paired-matched's 'Omission: 2'. |
| captured_against_sha | `da08ce44a8b3ffc6130deb769a139169551f8eea` + uncommitted working tree |

### `paired-legacy--desktop.png`

| field | value |
| --- | --- |
| sha256 | `b46ac88c6d05590680e90c907970ee3c54a311032c2ff1d263dfb1c305a2d659` |
| bytes | 1046796 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `paired-legacy--desktop.snapshot.txt` |
| framed on | `.wb-act2__notice--legacy` at scroll offset 5006 |
| state captured | Paired record at method 1.1 — the version notice and the suppressed panels |
| expected behaviour | A version-labelled notice names method 1.1 and says the excerpts are withheld. The headline follows it directly, with NO side-by-side answer panels between them — the surface that would normally carry the two quoted spans is simply absent. |
| captured_against_sha | `da08ce44a8b3ffc6130deb769a139169551f8eea` + uncommitted working tree |

### `paired-legacy--mobile.png`

| field | value |
| --- | --- |
| sha256 | `1917024e6d006e003cef434d523b7b278ded572b6f4c4304035e8af3b7b124c9` |
| bytes | 684827 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `paired-legacy--mobile.snapshot.txt` |
| framed on | `.wb-act2__notice--legacy` at scroll offset 6557 |
| state captured | Paired record at method 1.1 — the version notice and the suppressed panels |
| expected behaviour | A version-labelled notice names method 1.1 and says the excerpts are withheld. The headline follows it directly, with NO side-by-side answer panels between them — the surface that would normally carry the two quoted spans is simply absent. |
| captured_against_sha | `da08ce44a8b3ffc6130deb769a139169551f8eea` + uncommitted working tree |

### `paired-legacy-rows--desktop.png`

| field | value |
| --- | --- |
| sha256 | `1acbb2243e537fa8f3883bb135bd3d287e014156f685229fd79455b80e7d8c86` |
| bytes | 788000 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `paired-legacy-rows--desktop.snapshot.txt` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 5602 |
| state captured | Paired record at method 1.1 — the readings, rendered without excerpts |
| expected behaviour | Both readings render, each labelled as the Reader's reading. NO quotation marks and no blockquotes appear beside them, and neither the gap x-ray nor the signal-count line is drawn. The card and share actions are not offered. |
| captured_against_sha | `da08ce44a8b3ffc6130deb769a139169551f8eea` + uncommitted working tree |

### `paired-legacy-rows--mobile.png`

| field | value |
| --- | --- |
| sha256 | `42c7120abacfb086c649d21e296b4c08bedac681bb31b7ddff3dbfd3cc870ca8` |
| bytes | 550842 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `paired-legacy-rows--mobile.snapshot.txt` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 7510 |
| state captured | Paired record at method 1.1 — the readings, rendered without excerpts |
| expected behaviour | Both readings render, each labelled as the Reader's reading. NO quotation marks and no blockquotes appear beside them, and neither the gap x-ray nor the signal-count line is drawn. The card and share actions are not offered. |
| captured_against_sha | `da08ce44a8b3ffc6130deb769a139169551f8eea` + uncommitted working tree |

### `public-example--desktop.png`

| field | value |
| --- | --- |
| sha256 | `86828d59ad2ac10c34459665fc1386a0e9066f93590316172ff88b93a624ace4` |
| bytes | 664367 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `public-example--desktop.snapshot.txt` |
| framed on | `.wb-demo` at scroll offset 1252 |
| state captured | The public example door, opened from the paste box — the loop |
| expected behaviour | The Montana example runs the loop end to end. The open side reads 'Didn't come up.' because delta 1's open side is empty. The count line names four Omission items and says one is shown, so a single quoted line cannot read as the whole difference. No score and no construct name. |
| captured_against_sha | `da08ce44a8b3ffc6130deb769a139169551f8eea` + uncommitted working tree |

### `public-example--mobile.png`

| field | value |
| --- | --- |
| sha256 | `5ae3580ef1e6c2412f909dc08b26097429be286b6746c0a326af1839bf855512` |
| bytes | 517970 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `public-example--mobile.snapshot.txt` |
| framed on | `.wb-demo` at scroll offset 1801 |
| state captured | The public example door, opened from the paste box — the loop |
| expected behaviour | The Montana example runs the loop end to end. The open side reads 'Didn't come up.' because delta 1's open side is empty. The count line names four Omission items and says one is shown, so a single quoted line cannot read as the whole difference. No score and no construct name. |
| captured_against_sha | `da08ce44a8b3ffc6130deb769a139169551f8eea` + uncommitted working tree |

### `public-example-provenance--desktop.png`

| field | value |
| --- | --- |
| sha256 | `4e0ddd6a494c51f2506ea6be38740b6b4419f0d2bf597296eb1062d3e01aa49e` |
| bytes | 492468 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `public-example-provenance--desktop.snapshot.txt` |
| framed on | `.wb-demo__prov` at scroll offset 1744 |
| state captured | The public example door — the four provenance facts, kept apart |
| expected behaviour | Four labelled rows state four separate facts: what the person declared, what the page displayed plus the tier, what the hashes fix and what they do not, and the matched-conditions field that does not exist end to end. The statute line under them carries its retrieval date rather than a present tense. |
| captured_against_sha | `da08ce44a8b3ffc6130deb769a139169551f8eea` + uncommitted working tree |

### `public-example-provenance--mobile.png`

| field | value |
| --- | --- |
| sha256 | `507a59218cf19fea85128075de0fac641565a5815d85ae3e677fb907930ed608` |
| bytes | 434242 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `public-example-provenance--mobile.snapshot.txt` |
| framed on | `.wb-demo__prov` at scroll offset 2636 |
| state captured | The public example door — the four provenance facts, kept apart |
| expected behaviour | Four labelled rows state four separate facts: what the person declared, what the page displayed plus the tier, what the hashes fix and what they do not, and the matched-conditions field that does not exist end to end. The statute line under them carries its retrieval date rather than a present tense. |
| captured_against_sha | `da08ce44a8b3ffc6130deb769a139169551f8eea` + uncommitted working tree |

### `single-empty--desktop.png`

| field | value |
| --- | --- |
| sha256 | `197f9ce9ab9a6831305b62eaf8fc464e305be0ac4bd7af936b6acf799e04bada` |
| bytes | 603638 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `single-empty--desktop.snapshot.txt` |
| framed on | `.wb-measure__findings` at scroll offset 2445 |
| state captured | Single mode, a read with no candidate finding — the MEASUREMENT panel's empty state |
| expected behaviour | The counts line reads all zeros and the finding list is replaced by one line naming the condition: 'No candidate finding surfaced under the tested conditions.' No score, no 'clean' verdict, no claim about the answer. |
| captured_against_sha | `da08ce44a8b3ffc6130deb769a139169551f8eea` + uncommitted working tree |

### `single-empty--mobile.png`

| field | value |
| --- | --- |
| sha256 | `c5cd4af2ab83a370b23f3fde9ba57c8e8c6ab9a64f4e04a4b9865097c6bc2ae8` |
| bytes | 483092 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `single-empty--mobile.snapshot.txt` |
| framed on | `.wb-measure__findings` at scroll offset 2749 |
| state captured | Single mode, a read with no candidate finding — the MEASUREMENT panel's empty state |
| expected behaviour | The counts line reads all zeros and the finding list is replaced by one line naming the condition: 'No candidate finding surfaced under the tested conditions.' No score, no 'clean' verdict, no claim about the answer. |
| captured_against_sha | `da08ce44a8b3ffc6130deb769a139169551f8eea` + uncommitted working tree |

### `single-empty-read--desktop.png`

| field | value |
| --- | --- |
| sha256 | `0e327720fdc370365d4e0dbbd21a2e40d2b15585bae725baad61877f990f6215` |
| bytes | 644500 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `single-empty-read--desktop.snapshot.txt` |
| framed on | `.wb-reader-result__section--left-out` at scroll offset 1546 |
| state captured | Single mode, a read with nothing left out and no shaping — the read panel's two empty states |
| expected behaviour | 'What may be missing' and 'How it was shaped' each render one line naming the run rather than grading the answer: the Reader flagged nothing missing, and recorded no shaping, under the tested conditions. Neither line says the answer was complete or clean. |
| captured_against_sha | `da08ce44a8b3ffc6130deb769a139169551f8eea` + uncommitted working tree |

### `single-empty-read--mobile.png`

| field | value |
| --- | --- |
| sha256 | `23df79dbd0d113caf8d23efe9ff66de6e4c759e8b452fb874c131839eba6cf02` |
| bytes | 552747 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `single-empty-read--mobile.snapshot.txt` |
| framed on | `.wb-reader-result__section--left-out` at scroll offset 1632 |
| state captured | Single mode, a read with nothing left out and no shaping — the read panel's two empty states |
| expected behaviour | 'What may be missing' and 'How it was shaped' each render one line naming the run rather than grading the answer: the Reader flagged nothing missing, and recorded no shaping, under the tested conditions. Neither line says the answer was complete or clean. |
| captured_against_sha | `da08ce44a8b3ffc6130deb769a139169551f8eea` + uncommitted working tree |

### `paired-empty--desktop.png`

| field | value |
| --- | --- |
| sha256 | `966a7ddcc5f58118d2558774911371048c1ee42fe423a4b8cb4fbf1d296ad1ed` |
| bytes | 712107 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `paired-empty--desktop.snapshot.txt` |
| framed on | `.wb-act2__delta` at scroll offset 5923 |
| state captured | Paired comparison at method 2.0 that surfaced nothing — the empty state, NO_CLAIM, and no value close |
| expected behaviour | The count reads '0 differences surfaced'. Under 'What the second answer added' one line renders: this probe surfaced nothing new, and that does not mean either answer is complete. The absence is reported about the probe, not about the two answers. No value close appears anywhere on the page. |
| captured_against_sha | `da08ce44a8b3ffc6130deb769a139169551f8eea` + uncommitted working tree |

### `paired-empty--mobile.png`

| field | value |
| --- | --- |
| sha256 | `efb77eb5be51cd676b54f2b79e34c6f28a61430ef3c500876a750ded2c2e0bfa` |
| bytes | 660947 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `paired-empty--mobile.snapshot.txt` |
| framed on | `.wb-act2__delta` at scroll offset 8034 |
| state captured | Paired comparison at method 2.0 that surfaced nothing — the empty state, NO_CLAIM, and no value close |
| expected behaviour | The count reads '0 differences surfaced'. Under 'What the second answer added' one line renders: this probe surfaced nothing new, and that does not mean either answer is complete. The absence is reported about the probe, not about the two answers. No value close appears anywhere on the page. |
| captured_against_sha | `da08ce44a8b3ffc6130deb769a139169551f8eea` + uncommitted working tree |

### `claim-authorized-match--desktop.png`

| field | value |
| --- | --- |
| sha256 | `656ef721da3acd5c96268bdf955493cf789b94fbddeabd00c811016275ccb6b2` |
| bytes | 1125736 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `claim-authorized-match--desktop.snapshot.txt` |
| framed on | `.wb-claim` at scroll offset 5125 |
| state captured | Paired result whose findings carry an authorized conditions record reading MATCHED |
| expected behaviour | The claim row reads 'Conditions matched' and says an authorized record of the capture conditions places the two answers at like for like. This is the only state in which the surface asserts a matched-condition basis, and it is unreachable from any live endpoint today. |
| captured_against_sha | `da08ce44a8b3ffc6130deb769a139169551f8eea` + uncommitted working tree |

### `claim-authorized-match--mobile.png`

| field | value |
| --- | --- |
| sha256 | `1254c70a8a2603b1849bc393135b036218498efbc6278ca24686ffabde5852f9` |
| bytes | 1065562 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `claim-authorized-match--mobile.snapshot.txt` |
| framed on | `.wb-claim` at scroll offset 6788 |
| state captured | Paired result whose findings carry an authorized conditions record reading MATCHED |
| expected behaviour | The claim row reads 'Conditions matched' and says an authorized record of the capture conditions places the two answers at like for like. This is the only state in which the surface asserts a matched-condition basis, and it is unreachable from any live endpoint today. |
| captured_against_sha | `da08ce44a8b3ffc6130deb769a139169551f8eea` + uncommitted working tree |

### `claim-authorized-mismatch--desktop.png`

| field | value |
| --- | --- |
| sha256 | `fa9adbb25cd226d891f1b6c1dd07a4b95609b77bc401d27512216b3a0d282217` |
| bytes | 1103387 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `claim-authorized-mismatch--desktop.snapshot.txt` |
| framed on | `.wb-claim` at scroll offset 5135 |
| state captured | Paired result whose authorized conditions record reads UNMATCHED, against a person who declared a match |
| expected behaviour | The claim row reads 'Conditions differ' and says an authorized record exists and does NOT place the two answers at like for like. The person declared same model and no edits, so no client-derived unmatched callout is drawn — the record and the declaration disagree, and only the claim row carries that. |
| captured_against_sha | `da08ce44a8b3ffc6130deb769a139169551f8eea` + uncommitted working tree |

### `claim-authorized-mismatch--mobile.png`

| field | value |
| --- | --- |
| sha256 | `f95d29b9f5deea09c02e0f33eeb997dbaab6410f1dc9fd2aea75a2c6b7167f49` |
| bytes | 968340 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `claim-authorized-mismatch--mobile.snapshot.txt` |
| framed on | `.wb-claim` at scroll offset 6788 |
| state captured | Paired result whose authorized conditions record reads UNMATCHED, against a person who declared a match |
| expected behaviour | The claim row reads 'Conditions differ' and says an authorized record exists and does NOT place the two answers at like for like. The person declared same model and no edits, so no client-derived unmatched callout is drawn — the record and the declaration disagree, and only the claim row carries that. |
| captured_against_sha | `da08ce44a8b3ffc6130deb769a139169551f8eea` + uncommitted working tree |

### `claim-client-declaration--desktop.png`

| field | value |
| --- | --- |
| sha256 | `a696f250b5b50ac2e34ebac30afaaa05e5f7c66f8f89aa9ec4eaa0aaf0afce07` |
| bytes | 1120735 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `claim-client-declaration--desktop.snapshot.txt` |
| framed on | `.wb-claim` at scroll offset 5125 |
| state captured | Paired result whose conditions basis is the person's own declaration, carried through to the record |
| expected behaviour | The claim row reads 'Conditions as you reported them' and says the conditions are the ones you told us and not ones Imbas watched. The distinction from the state below is the one the register exists to hold: reported is not the same as unrecorded. |
| captured_against_sha | `da08ce44a8b3ffc6130deb769a139169551f8eea` + uncommitted working tree |

### `claim-client-declaration--mobile.png`

| field | value |
| --- | --- |
| sha256 | `ddc980036f32aef540749b394418862bb9110f1ff732b82bce9a8a3fbae1fa4b` |
| bytes | 983666 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `claim-client-declaration--mobile.snapshot.txt` |
| framed on | `.wb-claim` at scroll offset 6796 |
| state captured | Paired result whose conditions basis is the person's own declaration, carried through to the record |
| expected behaviour | The claim row reads 'Conditions as you reported them' and says the conditions are the ones you told us and not ones Imbas watched. The distinction from the state below is the one the register exists to hold: reported is not the same as unrecorded. |
| captured_against_sha | `da08ce44a8b3ffc6130deb769a139169551f8eea` + uncommitted working tree |

### `claim-unrecognized-source--desktop.png`

| field | value |
| --- | --- |
| sha256 | `9bb44ed0953d02bbc87598524e76b70903ab5305574318e57d3e63d93118c281` |
| bytes | 1110476 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `claim-unrecognized-source--desktop.snapshot.txt` |
| framed on | `.wb-claim` at scroll offset 5135 |
| state captured | Paired result naming a conditions source this build does not recognize, with status MATCHED |
| expected behaviour | The claim row reads 'Conditions source not recognized' and says this build does not know the named source, so it treats it as nothing recorded. The stored status is MATCHED and the surface still refuses the matched-conditions claim, because the source is not in the authorized set. |
| captured_against_sha | `da08ce44a8b3ffc6130deb769a139169551f8eea` + uncommitted working tree |

### `claim-unrecognized-source--mobile.png`

| field | value |
| --- | --- |
| sha256 | `14908c1260bccd6d5deab6e51ac8560a076fc58764c7a9cbd016a249763c1d0b` |
| bytes | 1003577 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `claim-unrecognized-source--mobile.snapshot.txt` |
| framed on | `.wb-claim` at scroll offset 6806 |
| state captured | Paired result naming a conditions source this build does not recognize, with status MATCHED |
| expected behaviour | The claim row reads 'Conditions source not recognized' and says this build does not know the named source, so it treats it as nothing recorded. The stored status is MATCHED and the surface still refuses the matched-conditions claim, because the source is not in the authorized set. |
| captured_against_sha | `da08ce44a8b3ffc6130deb769a139169551f8eea` + uncommitted working tree |

### `provenance-complete--desktop.png`

| field | value |
| --- | --- |
| sha256 | `36bf665d1d63faf8dd83e688f78779db9fb81a2819175c3f21274dc85fb525b9` |
| bytes | 861729 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `provenance-complete--desktop.snapshot.txt` |
| framed on | `.wb-loop__reveal .wb-prov` at scroll offset 5435 |
| state captured | The provenance strip with every field recorded — seven rows, none unknown |
| expected behaviour | Seven labelled rows, every one carrying a recorded value: declared answer model, inspection provider, inspection model, pinned inspection build, inspection method, paired method, and capture time. The strip reports data-complete=yes. The note under it still says the answer model is declared and not observed. |
| captured_against_sha | `da08ce44a8b3ffc6130deb769a139169551f8eea` + uncommitted working tree |

### `provenance-complete--mobile.png`

| field | value |
| --- | --- |
| sha256 | `2cf14fc82e9a89270e28d96e02c15acf7642dfd970ae30019034d245d2932c00` |
| bytes | 685435 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `provenance-complete--mobile.snapshot.txt` |
| framed on | `.wb-loop__reveal .wb-prov` at scroll offset 7524 |
| state captured | The provenance strip with every field recorded — seven rows, none unknown |
| expected behaviour | Seven labelled rows, every one carrying a recorded value: declared answer model, inspection provider, inspection model, pinned inspection build, inspection method, paired method, and capture time. The strip reports data-complete=yes. The note under it still says the answer model is declared and not observed. |
| captured_against_sha | `da08ce44a8b3ffc6130deb769a139169551f8eea` + uncommitted working tree |

### `provenance-partial--desktop.png`

| field | value |
| --- | --- |
| sha256 | `1097710fd416a0c651d569c0b438cd900414109e7b48ec07cea39382cd484716` |
| bytes | 830180 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `provenance-partial--desktop.snapshot.txt` |
| framed on | `.wb-loop__reveal .wb-prov` at scroll offset 5456 |
| state captured | The provenance strip on a live-shaped run — two fields unrecorded, both stated |
| expected behaviour | Seven rows again, with 'none given' against the declared answer model and 'not pinned' against the inspection build. The strip reports data-complete=no. No row is hidden and no value is borrowed from a neighbouring field. |
| captured_against_sha | `da08ce44a8b3ffc6130deb769a139169551f8eea` + uncommitted working tree |

### `provenance-partial--mobile.png`

| field | value |
| --- | --- |
| sha256 | `f9d06e0a185f36fe044e4dda092025a1a989c0bd4280ee778e2d8ad9f10170fa` |
| bytes | 684790 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `provenance-partial--mobile.snapshot.txt` |
| framed on | `.wb-loop__reveal .wb-prov` at scroll offset 7514 |
| state captured | The provenance strip on a live-shaped run — two fields unrecorded, both stated |
| expected behaviour | Seven rows again, with 'none given' against the declared answer model and 'not pinned' against the inspection build. The strip reports data-complete=no. No row is hidden and no value is borrowed from a neighbouring field. |
| captured_against_sha | `da08ce44a8b3ffc6130deb769a139169551f8eea` + uncommitted working tree |

### `export-single--desktop.png`

| field | value |
| --- | --- |
| sha256 | `8b8e0b4a81732d9552859d7cdba1d6718e5d82166384d3ed1e0f1ea2470ad6ce` |
| bytes | 622405 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `export-single--desktop.snapshot.txt` |
| framed on | `.wb-checks__export--single` at scroll offset 3735 |
| state captured | The Review Record export on a single-answer run — the control and its support line |
| expected behaviour | The control reads 'Export Review Record'. The line beside it names the answer as pasted, the recorded findings, the checks with the marks set, and the run's provenance, then states that every finding in it is unreviewed. It does not mention a paired capture, and it makes no verification claim. |
| captured_against_sha | `da08ce44a8b3ffc6130deb769a139169551f8eea` + uncommitted working tree |

### `export-single--mobile.png`

| field | value |
| --- | --- |
| sha256 | `acb92b1d8954fe6d8462f7c6eae417b8c76adeb5a625af7e898f42a549a7b327` |
| bytes | 480098 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `export-single--mobile.snapshot.txt` |
| framed on | `.wb-checks__export--single` at scroll offset 4789 |
| state captured | The Review Record export on a single-answer run — the control and its support line |
| expected behaviour | The control reads 'Export Review Record'. The line beside it names the answer as pasted, the recorded findings, the checks with the marks set, and the run's provenance, then states that every finding in it is unreviewed. It does not mention a paired capture, and it makes no verification claim. |
| captured_against_sha | `da08ce44a8b3ffc6130deb769a139169551f8eea` + uncommitted working tree |

### `export-paired--desktop.png`

| field | value |
| --- | --- |
| sha256 | `d9f7022e9b242962a449ad9f7a3ac5e8aad37de82e2c5030ea202e03a8b28fbf` |
| bytes | 766309 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `export-paired--desktop.snapshot.txt` |
| framed on | `.wb-checks__export--paired` at scroll offset 7136 |
| state captured | The Review Record export on a paired run — the control and its support line |
| expected behaviour | Same control label. The line names both answers as pasted, the recorded findings, the capture conditions YOU REPORTED, and the run's provenance. It names no checks, because a paired inspection produces none, and it calls the conditions reported rather than matched. |
| captured_against_sha | `da08ce44a8b3ffc6130deb769a139169551f8eea` + uncommitted working tree |

### `export-paired--mobile.png`

| field | value |
| --- | --- |
| sha256 | `e753aa94f3917dd44356df948e8ff30c1a8eda6a4bcfc2c7da5eb60e67222aec` |
| bytes | 727359 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `export-paired--mobile.snapshot.txt` |
| framed on | `.wb-checks__export--paired` at scroll offset 10006 |
| state captured | The Review Record export on a paired run — the control and its support line |
| expected behaviour | Same control label. The line names both answers as pasted, the recorded findings, the capture conditions YOU REPORTED, and the run's provenance. It names no checks, because a paired inspection produces none, and it calls the conditions reported rather than matched. |
| captured_against_sha | `da08ce44a8b3ffc6130deb769a139169551f8eea` + uncommitted working tree |

### `curated-readout--desktop.png`

| field | value |
| --- | --- |
| sha256 | `43ad24c7d2b97a1b7b2f798b6ea691160b54886d06514fa133fa998ab67081e6` |
| bytes | 503378 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `?reader=0` |
| snapshot | `curated-readout--desktop.snapshot.txt` |
| framed on | `.wb-readout` at scroll offset 206 |
| state captured | The curated case console, first screen — provenance and run strip with no score |
| expected behaviour | The case provenance line carries the case id, its category and its observed date. The run strip names the category, the four models tested, and the observation date. This is the screen BEFORE a person pastes, so neither retired hero was ever in this frame: the scored gauge and the live verdict badge both sat on the result panel one step later, which the board does not photograph (see the manifest). No gauge and no scored figure of any kind appears here; the board's score scan is what holds that, and it cannot be written out longhand here without tripping itself. |
| captured_against_sha | `da08ce44a8b3ffc6130deb769a139169551f8eea` + uncommitted working tree |

### `curated-readout--mobile.png`

| field | value |
| --- | --- |
| sha256 | `35bbd380ebe8e14769fb25ff43d9aac8065ddac2ee67c8ed8fccee76e9b70144` |
| bytes | 297088 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `?reader=0` |
| snapshot | `curated-readout--mobile.snapshot.txt` |
| framed on | `.wb-readout` at scroll offset 819 |
| state captured | The curated case console, first screen — provenance and run strip with no score |
| expected behaviour | The case provenance line carries the case id, its category and its observed date. The run strip names the category, the four models tested, and the observation date. This is the screen BEFORE a person pastes, so neither retired hero was ever in this frame: the scored gauge and the live verdict badge both sat on the result panel one step later, which the board does not photograph (see the manifest). No gauge and no scored figure of any kind appears here; the board's score scan is what holds that, and it cannot be written out longhand here without tripping itself. |
| captured_against_sha | `da08ce44a8b3ffc6130deb769a139169551f8eea` + uncommitted working tree |

### `first-load--desktop.png`

| field | value |
| --- | --- |
| sha256 | `ba6b206ec8e98444a46e51facd37246e5f3b9494a1d2e7c57f0c0baa71fa3d76` |
| bytes | 421565 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `first-load--desktop.snapshot.txt` |
| framed on | `.wb-reader-v2__fields` at scroll offset 141 |
| state captured | The workbench on arrival — the paste box, before anything is pasted |
| expected behaviour | The paste box leads. The intro says what the Reader does and does not promise a verdict: paste an AI answer, the Reader inspects what it might be missing. The status line reads 'Paste an answer to inspect it.' and the run button is present and disabled, so the sequence is legible before anyone commits to it. No result surface, no count, and no score of any kind. |
| captured_against_sha | `da08ce44a8b3ffc6130deb769a139169551f8eea` + uncommitted working tree |

### `first-load--mobile.png`

| field | value |
| --- | --- |
| sha256 | `acc3f8d4fa704b5c86d1555e40409edc32861aeb53916617ede2eed96f8a6771` |
| bytes | 359685 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `first-load--mobile.snapshot.txt` |
| framed on | `.wb-reader-v2__fields` at scroll offset 159 |
| state captured | The workbench on arrival — the paste box, before anything is pasted |
| expected behaviour | The paste box leads. The intro says what the Reader does and does not promise a verdict: paste an AI answer, the Reader inspects what it might be missing. The status line reads 'Paste an answer to inspect it.' and the run button is present and disabled, so the sequence is legible before anyone commits to it. No result surface, no count, and no score of any kind. |
| captured_against_sha | `da08ce44a8b3ffc6130deb769a139169551f8eea` + uncommitted working tree |

### `read-in-flight--desktop.png`

| field | value |
| --- | --- |
| sha256 | `6630927ff7e2c31f86067424570ea7c6d5394085d0a037aa2e7bef7c6c95b705` |
| bytes | 307606 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `read-in-flight--desktop.snapshot.txt` |
| framed on | `.wb-reader-v2__action-row` at scroll offset 762 |
| state captured | Mid-inspection — the request is open and the status line has reached its last words |
| expected behaviour | The run button reads 'Inspecting…' and is disabled. The status line has clamped on its terminal narration, which reports the instrument and the wait — still reading, long answers take longer — and claims nothing about what was found. The line it replaced said 'Found something to check…', which announced a finding before any response existed and is the line a slow request left on screen longest. No result panel and no count is rendered, because none has been returned. |
| captured_against_sha | `da08ce44a8b3ffc6130deb769a139169551f8eea` + uncommitted working tree |

### `read-in-flight--mobile.png`

| field | value |
| --- | --- |
| sha256 | `752d60354e64cf8d4dbdeea9ef2af61d72eb5a4121e74e2bfad2e6927fe72c1e` |
| bytes | 278039 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `read-in-flight--mobile.snapshot.txt` |
| framed on | `.wb-reader-v2__action-row` at scroll offset 790 |
| state captured | Mid-inspection — the request is open and the status line has reached its last words |
| expected behaviour | The run button reads 'Inspecting…' and is disabled. The status line has clamped on its terminal narration, which reports the instrument and the wait — still reading, long answers take longer — and claims nothing about what was found. The line it replaced said 'Found something to check…', which announced a finding before any response existed and is the line a slow request left on screen longest. No result panel and no count is rendered, because none has been returned. |
| captured_against_sha | `da08ce44a8b3ffc6130deb769a139169551f8eea` + uncommitted working tree |

### `read-error--desktop.png`

| field | value |
| --- | --- |
| sha256 | `7184811a424bd743bb5d15b85d624d7758b65f6294f0d4d8a14e6779eeadae38` |
| bytes | 435906 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `read-error--desktop.snapshot.txt` |
| framed on | `.wb-reader-result` at scroll offset 1076 |
| state captured | The read route refused the request — the fallback surface, generic family |
| expected behaviour | The result surface renders the fallback banner: the Reader is unavailable and a fallback check is what is showing. The read body says the full Reader is unavailable, that the question and answer are preserved, and that this is not a full inspection. No badge, no signal name, no count and no score: nothing inspected the answer, so nothing about the answer is claimed. The copyable card takes the same position — 'This inspection did not run.' rather than a flag lookup over completeness 'thin', which is what the client sets for styling and which used to reach the card as a signal name. |
| captured_against_sha | `da08ce44a8b3ffc6130deb769a139169551f8eea` + uncommitted working tree |

### `read-error--mobile.png`

| field | value |
| --- | --- |
| sha256 | `26ec711c274b77cafa44663b23937602d053cc6cd83ba84062908513799e2788` |
| bytes | 422235 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `read-error--mobile.snapshot.txt` |
| framed on | `.wb-reader-result` at scroll offset 1118 |
| state captured | The read route refused the request — the fallback surface, generic family |
| expected behaviour | The result surface renders the fallback banner: the Reader is unavailable and a fallback check is what is showing. The read body says the full Reader is unavailable, that the question and answer are preserved, and that this is not a full inspection. No badge, no signal name, no count and no score: nothing inspected the answer, so nothing about the answer is claimed. The copyable card takes the same position — 'This inspection did not run.' rather than a flag lookup over completeness 'thin', which is what the client sets for styling and which used to reach the card as a signal name. |
| captured_against_sha | `da08ce44a8b3ffc6130deb769a139169551f8eea` + uncommitted working tree |

### `read-capacity--desktop.png`

| field | value |
| --- | --- |
| sha256 | `c3b5fa03d65aa9fb9aec398ce1f6baed07fff88141e15db4b9960ec37ddbdd62` |
| bytes | 463685 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `read-capacity--desktop.snapshot.txt` |
| framed on | `.wb-reader-result` at scroll offset 1086 |
| state captured | The read route is at capacity — the fallback surface, capacity family |
| expected behaviour | The banner is the single capacity sentence, verbatim and identical to the server's: the Reader is at capacity today, a follow-up can still be generated and run in the person's own AI, and automated comparison may stay unavailable until capacity resets. It withholds the automated lane without withholding the instruction. The distinction from `read-error` is the whole reason both are on the board — one says the service failed, this one says the service is rationed and tells you what you can still do. |
| captured_against_sha | `da08ce44a8b3ffc6130deb769a139169551f8eea` + uncommitted working tree |

### `read-capacity--mobile.png`

| field | value |
| --- | --- |
| sha256 | `b806a97a9f229d2698ed9c7aff51404bbbce89c98dfefe921723ea64ac674845` |
| bytes | 440637 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `read-capacity--mobile.snapshot.txt` |
| framed on | `.wb-reader-result` at scroll offset 1147 |
| state captured | The read route is at capacity — the fallback surface, capacity family |
| expected behaviour | The banner is the single capacity sentence, verbatim and identical to the server's: the Reader is at capacity today, a follow-up can still be generated and run in the person's own AI, and automated comparison may stay unavailable until capacity resets. It withholds the automated lane without withholding the instruction. The distinction from `read-error` is the whole reason both are on the board — one says the service failed, this one says the service is rationed and tells you what you can still do. |
| captured_against_sha | `da08ce44a8b3ffc6130deb769a139169551f8eea` + uncommitted working tree |
