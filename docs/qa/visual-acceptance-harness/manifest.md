# Visual acceptance manifest

captured_against_sha: `f1e146485bc1879d7a30577d8d2c0a7218fb6327`

**These images were captured against commit `f1e146485bc1879d7a30577d8d2c0a7218fb6327` PLUS the uncommitted working tree of the pass that produced them.** They were not captured against their own commit — that commit did not exist yet when the shutter fired. Treat `captured_against_sha` as the base the working tree sat on top of, nothing stronger.

- working tree at capture time: **dirty**
- browser: `/Users/brendan/Library/Caches/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-mac-arm64/chrome-headless-shell`
- browser version: `HeadlessChrome/148.0.7778.96`
- captured: 2026-07-30T15:42:51.305Z
- fixtures: synthetic, from `scripts/qa/scenarios.mjs` — not captures, not evidence
- network: deny-by-default; no model API call is reachable from this harness

## Portability

**Image baselines are specific to the machine and browser build that produced them.** PNG bytes depend on the platform's font rasterizer and the Chromium encoder, so the same page on another machine, another OS, or another Chromium version encodes to different bytes even when it looks identical. Do not treat an image diff on a different machine, or in CI, as a regression signal — it will report changed for reasons that have nothing to do with the product. The **snapshot** baselines (`*.snapshot.txt`) carry no rasterized pixels and are portable; they are the layer to trust when the machine changes.

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
| viewport `mobile` | `375x812 @ dsf 3, mobile=true, scroll offset 3034` |
| viewport `desktop` | `1440x900 @ dsf 2, mobile=false, scroll offset 6117` |
| viewport `mobile` | `375x812 @ dsf 3, mobile=true, scroll offset 8542` |
| viewport `desktop` | `1440x900 @ dsf 2, mobile=false, scroll offset 6197` |
| viewport `mobile` | `375x812 @ dsf 3, mobile=true, scroll offset 8688` |
| viewport `desktop` | `1440x900 @ dsf 2, mobile=false, scroll offset 6030` |
| viewport `mobile` | `375x812 @ dsf 3, mobile=true, scroll offset 8420` |
| viewport `desktop` | `1440x900 @ dsf 2, mobile=false, scroll offset 5006` |
| viewport `mobile` | `375x812 @ dsf 3, mobile=true, scroll offset 6538` |
| viewport `desktop` | `1440x900 @ dsf 2, mobile=false, scroll offset 5602` |
| viewport `mobile` | `375x812 @ dsf 3, mobile=true, scroll offset 7491` |
| viewport `desktop` | `1440x900 @ dsf 2, mobile=false, scroll offset 1252` |
| viewport `mobile` | `375x812 @ dsf 3, mobile=true, scroll offset 1801` |
| viewport `desktop` | `1440x900 @ dsf 2, mobile=false, scroll offset 1744` |
| viewport `mobile` | `375x812 @ dsf 3, mobile=true, scroll offset 2636` |
| viewport `desktop` | `1440x900 @ dsf 2, mobile=false, scroll offset 2445` |
| viewport `mobile` | `375x812 @ dsf 3, mobile=true, scroll offset 2749` |
| viewport `desktop` | `1440x900 @ dsf 2, mobile=false, scroll offset 1546` |
| viewport `mobile` | `375x812 @ dsf 3, mobile=true, scroll offset 1632` |
| viewport `desktop` | `1440x900 @ dsf 2, mobile=false, scroll offset 5935` |
| viewport `mobile` | `375x812 @ dsf 3, mobile=true, scroll offset 8026` |
| viewport `desktop` | `1440x900 @ dsf 2, mobile=false, scroll offset 5125` |
| viewport `mobile` | `375x812 @ dsf 3, mobile=true, scroll offset 6769` |
| viewport `desktop` | `1440x900 @ dsf 2, mobile=false, scroll offset 5135` |
| viewport `mobile` | `375x812 @ dsf 3, mobile=true, scroll offset 6777` |
| viewport `desktop` | `1440x900 @ dsf 2, mobile=false, scroll offset 5125` |
| viewport `mobile` | `375x812 @ dsf 3, mobile=true, scroll offset 6777` |
| viewport `desktop` | `1440x900 @ dsf 2, mobile=false, scroll offset 5135` |
| viewport `mobile` | `375x812 @ dsf 3, mobile=true, scroll offset 6787` |
| viewport `desktop` | `1440x900 @ dsf 2, mobile=false, scroll offset 5435` |
| viewport `mobile` | `375x812 @ dsf 3, mobile=true, scroll offset 7505` |
| viewport `desktop` | `1440x900 @ dsf 2, mobile=false, scroll offset 5456` |
| viewport `mobile` | `375x812 @ dsf 3, mobile=true, scroll offset 7489` |
| viewport `desktop` | `1440x900 @ dsf 2, mobile=false, scroll offset 3735` |
| viewport `mobile` | `375x812 @ dsf 3, mobile=true, scroll offset 4770` |
| viewport `desktop` | `1440x900 @ dsf 2, mobile=false, scroll offset 7136` |
| viewport `mobile` | `375x812 @ dsf 3, mobile=true, scroll offset 10004` |
| viewport `desktop` | `1440x900 @ dsf 2, mobile=false, scroll offset 206` |
| viewport `mobile` | `375x812 @ dsf 3, mobile=true, scroll offset 819` |

## What the board does not photograph

A board that lists only what it covers reads as complete. These are the result states that exist in the product and have no image here, each with the reason. Anyone adding a scenario should check this list first — it is where the next one comes from.

- **The chip lane's empty comparison** — `CHIP_UI.reveal.empty_delta` in `reader-paired.js` renders its own empty state in the chip reveal, separate from the Reader's. The chip lane is fenced at chip.1.0 and this pass was instructed not to touch its logic, so photographing it would have meant driving a lane it could not fix if the capture found something wrong.
- **The share and permalink page, in every state** — Carved out of this pass by ruling. The share surface still renders a score from its stored row, and schema, render, page metadata and consent copy move together in 2B-C. Share scenarios arrive with 2B-C under 2B-C's own coverage.
- **Failure states — a route that errors, times out, or returns an unparseable body** — The harness stubs successful responses. Photographing a failure means a fixture layer that can return one, which is a harness capability this pass did not build. The failure copy is held by unit tests instead, which is weaker for layout and equal for wording.
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
| captured_against_sha | `f1e146485bc1879d7a30577d8d2c0a7218fb6327` + uncommitted working tree |

### `single-findings--mobile.png`

| field | value |
| --- | --- |
| sha256 | `666240998247adfdbfa20959434b0c75647337d801781a94f0deb79d79064bef` |
| bytes | 480962 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `single-findings--mobile.snapshot.txt` |
| framed on | `.wb-measure__list li.wb-measure__finding` at scroll offset 3034 |
| state captured | Single mode, Reader result with measurement findings |
| expected behaviour | MEASUREMENT panel renders with the Candidate findings list non-empty: counts read 'Omission: 1 · Framing Drift: 1 · Deflection: 0' and two finding rows are listed with their verbatim anchors. |
| captured_against_sha | `f1e146485bc1879d7a30577d8d2c0a7218fb6327` + uncommitted working tree |

### `paired-matched--desktop.png`

| field | value |
| --- | --- |
| sha256 | `583c911987db2048d4341e03e53d5c975d364ea46b88a7967fa1abfe52db2912` |
| bytes | 642038 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `paired-matched--desktop.snapshot.txt` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 6117 |
| state captured | Paired comparison at method 2.0, both sides server-resolved, conditions derived as MATCHED |
| expected behaviour | The delta lists 2 rows. Row 1 quotes BOTH answers; both excerpts are spans the door resolved against the stored answers. Each row carries the Reader's reading in a labelled, unquoted register. Counts read 'Omission: 2 · Framing Drift: 0 · Deflection: 0' — the same collection as the rows. No unmatched-conditions warning: conditions_matched === true, derived client-side from same model + no edits. |
| captured_against_sha | `f1e146485bc1879d7a30577d8d2c0a7218fb6327` + uncommitted working tree |

### `paired-matched--mobile.png`

| field | value |
| --- | --- |
| sha256 | `04f6cf5212753c1a6e4fac6145b1f3311b4ec91d1a5e7b691fdfe34d18e77f3b` |
| bytes | 498785 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `paired-matched--mobile.snapshot.txt` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 8542 |
| state captured | Paired comparison at method 2.0, both sides server-resolved, conditions derived as MATCHED |
| expected behaviour | The delta lists 2 rows. Row 1 quotes BOTH answers; both excerpts are spans the door resolved against the stored answers. Each row carries the Reader's reading in a labelled, unquoted register. Counts read 'Omission: 2 · Framing Drift: 0 · Deflection: 0' — the same collection as the rows. No unmatched-conditions warning: conditions_matched === true, derived client-side from same model + no edits. |
| captured_against_sha | `f1e146485bc1879d7a30577d8d2c0a7218fb6327` + uncommitted working tree |

### `paired-unmatched--desktop.png`

| field | value |
| --- | --- |
| sha256 | `28f701bddce4a9d75e68d11cc37ec98c674b224d33510b5b67dbfa7918b2c91e` |
| bytes | 551293 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `paired-unmatched--desktop.snapshot.txt` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 6197 |
| state captured | Paired comparison at method 2.0 with an ABSENT open side, conditions derived as UNMATCHED |
| expected behaviour | The delta lists 2 rows. Row 2 shows ONLY the Second answer excerpt — its open side is ABSENT, so no First answer blockquote is rendered and no placeholder stands in for one. The unmatched-conditions warning is present: conditions_matched === false, derived client-side from a disclosed edit. |
| captured_against_sha | `f1e146485bc1879d7a30577d8d2c0a7218fb6327` + uncommitted working tree |

### `paired-unmatched--mobile.png`

| field | value |
| --- | --- |
| sha256 | `12fc3b317fa62c215d5839a74ce8ffa5b0d0fd21cf0c64e4bea957b5a050d9b1` |
| bytes | 481549 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `paired-unmatched--mobile.snapshot.txt` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 8688 |
| state captured | Paired comparison at method 2.0 with an ABSENT open side, conditions derived as UNMATCHED |
| expected behaviour | The delta lists 2 rows. Row 2 shows ONLY the Second answer excerpt — its open side is ABSENT, so no First answer blockquote is rendered and no placeholder stands in for one. The unmatched-conditions warning is present: conditions_matched === false, derived client-side from a disclosed edit. |
| captured_against_sha | `f1e146485bc1879d7a30577d8d2c0a7218fb6327` + uncommitted working tree |

### `paired-rejected-snippet--desktop.png`

| field | value |
| --- | --- |
| sha256 | `16325996c894e610e489fa91e6eff48ac9ed0806e1335b3e7822fc314334e161` |
| bytes | 714969 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `paired-rejected-snippet--desktop.snapshot.txt` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 6030 |
| state captured | Paired comparison at method 2.0 where one proposed snippet did not resolve — recorded, not surfaced |
| expected behaviour | The delta lists ONE row, from two proposed differences. The rejected one ('a tenant who waits too long forfeits the penalty entirely') appears NOWHERE on screen — not as a row, not as a quotation, not as a count. The counts read 'Omission: 1 · Framing Drift: 0 · Deflection: 0' against paired-matched's 'Omission: 2'. |
| captured_against_sha | `f1e146485bc1879d7a30577d8d2c0a7218fb6327` + uncommitted working tree |

### `paired-rejected-snippet--mobile.png`

| field | value |
| --- | --- |
| sha256 | `c1e15d9965d31dc31061ff80faf9eac344ce523224097f9080cbb7b70a48677f` |
| bytes | 528242 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `paired-rejected-snippet--mobile.snapshot.txt` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 8420 |
| state captured | Paired comparison at method 2.0 where one proposed snippet did not resolve — recorded, not surfaced |
| expected behaviour | The delta lists ONE row, from two proposed differences. The rejected one ('a tenant who waits too long forfeits the penalty entirely') appears NOWHERE on screen — not as a row, not as a quotation, not as a count. The counts read 'Omission: 1 · Framing Drift: 0 · Deflection: 0' against paired-matched's 'Omission: 2'. |
| captured_against_sha | `f1e146485bc1879d7a30577d8d2c0a7218fb6327` + uncommitted working tree |

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
| captured_against_sha | `f1e146485bc1879d7a30577d8d2c0a7218fb6327` + uncommitted working tree |

### `paired-legacy--mobile.png`

| field | value |
| --- | --- |
| sha256 | `c93efa24b5bb0a4a61e6c887e13627d80030547546d5cc2b9d36acc64238894b` |
| bytes | 686222 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `paired-legacy--mobile.snapshot.txt` |
| framed on | `.wb-act2__notice--legacy` at scroll offset 6538 |
| state captured | Paired record at method 1.1 — the version notice and the suppressed panels |
| expected behaviour | A version-labelled notice names method 1.1 and says the excerpts are withheld. The headline follows it directly, with NO side-by-side answer panels between them — the surface that would normally carry the two quoted spans is simply absent. |
| captured_against_sha | `f1e146485bc1879d7a30577d8d2c0a7218fb6327` + uncommitted working tree |

### `paired-legacy-rows--desktop.png`

| field | value |
| --- | --- |
| sha256 | `8a7514ea513b49182a75cb24d8b39a2fa24b922364c1628359182ac0befaa7d1` |
| bytes | 781539 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `paired-legacy-rows--desktop.snapshot.txt` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 5602 |
| state captured | Paired record at method 1.1 — the readings, rendered without excerpts |
| expected behaviour | Both readings render, each labelled as the Reader's reading. NO quotation marks and no blockquotes appear beside them, and neither the gap x-ray nor the signal-count line is drawn. The card and share actions are not offered. |
| captured_against_sha | `f1e146485bc1879d7a30577d8d2c0a7218fb6327` + uncommitted working tree |

### `paired-legacy-rows--mobile.png`

| field | value |
| --- | --- |
| sha256 | `5ef2d10da70c72060ab9ec2e8da0364ab907a88fd94704e4123bccfe7f9e5b54` |
| bytes | 537210 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `paired-legacy-rows--mobile.snapshot.txt` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 7491 |
| state captured | Paired record at method 1.1 — the readings, rendered without excerpts |
| expected behaviour | Both readings render, each labelled as the Reader's reading. NO quotation marks and no blockquotes appear beside them, and neither the gap x-ray nor the signal-count line is drawn. The card and share actions are not offered. |
| captured_against_sha | `f1e146485bc1879d7a30577d8d2c0a7218fb6327` + uncommitted working tree |

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
| captured_against_sha | `f1e146485bc1879d7a30577d8d2c0a7218fb6327` + uncommitted working tree |

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
| captured_against_sha | `f1e146485bc1879d7a30577d8d2c0a7218fb6327` + uncommitted working tree |

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
| captured_against_sha | `f1e146485bc1879d7a30577d8d2c0a7218fb6327` + uncommitted working tree |

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
| captured_against_sha | `f1e146485bc1879d7a30577d8d2c0a7218fb6327` + uncommitted working tree |

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
| captured_against_sha | `f1e146485bc1879d7a30577d8d2c0a7218fb6327` + uncommitted working tree |

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
| captured_against_sha | `f1e146485bc1879d7a30577d8d2c0a7218fb6327` + uncommitted working tree |

### `single-empty-read--desktop.png`

| field | value |
| --- | --- |
| sha256 | `b5f14156d3db63e340908ef1adef522affa89729b5f28e8d467a51ac661526ae` |
| bytes | 638504 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `single-empty-read--desktop.snapshot.txt` |
| framed on | `.wb-reader-result__section--left-out` at scroll offset 1546 |
| state captured | Single mode, a read with nothing left out and no shaping — the read panel's two empty states |
| expected behaviour | 'What may be missing' and 'How it was shaped' each render one line naming the run rather than grading the answer: the Reader flagged nothing missing, and recorded no shaping, under the tested conditions. Neither line says the answer was complete or clean. |
| captured_against_sha | `f1e146485bc1879d7a30577d8d2c0a7218fb6327` + uncommitted working tree |

### `single-empty-read--mobile.png`

| field | value |
| --- | --- |
| sha256 | `214dbbc8453cf64a3c69aa8b64e9f051a4d732aaab0b6e7ddc5b64706d8bed32` |
| bytes | 541545 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `single-empty-read--mobile.snapshot.txt` |
| framed on | `.wb-reader-result__section--left-out` at scroll offset 1632 |
| state captured | Single mode, a read with nothing left out and no shaping — the read panel's two empty states |
| expected behaviour | 'What may be missing' and 'How it was shaped' each render one line naming the run rather than grading the answer: the Reader flagged nothing missing, and recorded no shaping, under the tested conditions. Neither line says the answer was complete or clean. |
| captured_against_sha | `f1e146485bc1879d7a30577d8d2c0a7218fb6327` + uncommitted working tree |

### `paired-empty--desktop.png`

| field | value |
| --- | --- |
| sha256 | `1f5e0bedc853db9443047f8a549f4c287136911cbd0d8f55cc1555d6a557a6fc` |
| bytes | 690256 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `paired-empty--desktop.snapshot.txt` |
| framed on | `.wb-act2__delta` at scroll offset 5935 |
| state captured | Paired comparison at method 2.0 that surfaced nothing — the empty state, NO_CLAIM, and no value close |
| expected behaviour | The count reads '0 differences surfaced'. The delta renders one line: the second answer surfaced nothing decision-relevant, stated as a result for this pair under reported conditions rather than a finding that either answer is complete. No value close appears anywhere on the page. |
| captured_against_sha | `f1e146485bc1879d7a30577d8d2c0a7218fb6327` + uncommitted working tree |

### `paired-empty--mobile.png`

| field | value |
| --- | --- |
| sha256 | `1754df4f0993ecb1f18c44121692cb661f93f640e6ccedbc7e166adc8999938d` |
| bytes | 604401 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `paired-empty--mobile.snapshot.txt` |
| framed on | `.wb-act2__delta` at scroll offset 8026 |
| state captured | Paired comparison at method 2.0 that surfaced nothing — the empty state, NO_CLAIM, and no value close |
| expected behaviour | The count reads '0 differences surfaced'. The delta renders one line: the second answer surfaced nothing decision-relevant, stated as a result for this pair under reported conditions rather than a finding that either answer is complete. No value close appears anywhere on the page. |
| captured_against_sha | `f1e146485bc1879d7a30577d8d2c0a7218fb6327` + uncommitted working tree |

### `claim-authorized-match--desktop.png`

| field | value |
| --- | --- |
| sha256 | `143adcf866baf2764a11723420d0b5d1832117828952e471cb22541f4d234206` |
| bytes | 1125591 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `claim-authorized-match--desktop.snapshot.txt` |
| framed on | `.wb-claim` at scroll offset 5125 |
| state captured | Paired result whose findings carry an authorized conditions record reading MATCHED |
| expected behaviour | The claim row reads 'Matched conditions' and says an authorized record of the capture conditions places the two answers at like for like. This is the only state in which the surface asserts a matched-condition basis, and it is unreachable from any live endpoint today. |
| captured_against_sha | `f1e146485bc1879d7a30577d8d2c0a7218fb6327` + uncommitted working tree |

### `claim-authorized-match--mobile.png`

| field | value |
| --- | --- |
| sha256 | `e502759f6af36bec1e02cae06715c5e1be3960b209df12d5f143e2ae5e361e2a` |
| bytes | 1054249 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `claim-authorized-match--mobile.snapshot.txt` |
| framed on | `.wb-claim` at scroll offset 6769 |
| state captured | Paired result whose findings carry an authorized conditions record reading MATCHED |
| expected behaviour | The claim row reads 'Matched conditions' and says an authorized record of the capture conditions places the two answers at like for like. This is the only state in which the surface asserts a matched-condition basis, and it is unreachable from any live endpoint today. |
| captured_against_sha | `f1e146485bc1879d7a30577d8d2c0a7218fb6327` + uncommitted working tree |

### `claim-authorized-mismatch--desktop.png`

| field | value |
| --- | --- |
| sha256 | `e01d55c6cff25c5ec573729c1b655dfb04ab768d16d50c1765a5db222d0e271c` |
| bytes | 1109375 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `claim-authorized-mismatch--desktop.snapshot.txt` |
| framed on | `.wb-claim` at scroll offset 5135 |
| state captured | Paired result whose authorized conditions record reads UNMATCHED, against a person who declared a match |
| expected behaviour | The claim row reads 'Observed difference · conditions not matched' and says an authorized record exists and does NOT place the two answers at like for like. The person declared same model and no edits, so no client-derived unmatched callout is drawn — the record's basis and the declaration disagree, and only the claim row carries that. |
| captured_against_sha | `f1e146485bc1879d7a30577d8d2c0a7218fb6327` + uncommitted working tree |

### `claim-authorized-mismatch--mobile.png`

| field | value |
| --- | --- |
| sha256 | `1440a4308029ced52fe082db4343b28f34b155668eaec0fcbe80b647295bf577` |
| bytes | 997708 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `claim-authorized-mismatch--mobile.snapshot.txt` |
| framed on | `.wb-claim` at scroll offset 6777 |
| state captured | Paired result whose authorized conditions record reads UNMATCHED, against a person who declared a match |
| expected behaviour | The claim row reads 'Observed difference · conditions not matched' and says an authorized record exists and does NOT place the two answers at like for like. The person declared same model and no edits, so no client-derived unmatched callout is drawn — the record's basis and the declaration disagree, and only the claim row carries that. |
| captured_against_sha | `f1e146485bc1879d7a30577d8d2c0a7218fb6327` + uncommitted working tree |

### `claim-client-declaration--desktop.png`

| field | value |
| --- | --- |
| sha256 | `ebe3b7248004dd50387a04c198783e42bba6eb348cc8c93ee4b0b45b9b5e6e95` |
| bytes | 1124898 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `claim-client-declaration--desktop.snapshot.txt` |
| framed on | `.wb-claim` at scroll offset 5125 |
| state captured | Paired result whose conditions basis is the person's own declaration, carried through to the record |
| expected behaviour | The claim row reads 'Observed difference · conditions as reported' and says the conditions are the ones you reported and Imbas did not observe them. The distinction from the state below is the one the register exists to hold: reported is not the same as unrecorded. |
| captured_against_sha | `f1e146485bc1879d7a30577d8d2c0a7218fb6327` + uncommitted working tree |

### `claim-client-declaration--mobile.png`

| field | value |
| --- | --- |
| sha256 | `23d2f724b6b6e9df896a599f970fdd7da3e6423242d7ee9b0d5fcd1533ec23d8` |
| bytes | 989314 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `claim-client-declaration--mobile.snapshot.txt` |
| framed on | `.wb-claim` at scroll offset 6777 |
| state captured | Paired result whose conditions basis is the person's own declaration, carried through to the record |
| expected behaviour | The claim row reads 'Observed difference · conditions as reported' and says the conditions are the ones you reported and Imbas did not observe them. The distinction from the state below is the one the register exists to hold: reported is not the same as unrecorded. |
| captured_against_sha | `f1e146485bc1879d7a30577d8d2c0a7218fb6327` + uncommitted working tree |

### `claim-unrecognized-source--desktop.png`

| field | value |
| --- | --- |
| sha256 | `c036868e8fd5673051bc9e6bc2e26da43a011b84804fba3991ebe7317d862e34` |
| bytes | 1108428 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `claim-unrecognized-source--desktop.snapshot.txt` |
| framed on | `.wb-claim` at scroll offset 5135 |
| state captured | Paired result naming a conditions source this build does not recognize, with status MATCHED |
| expected behaviour | The claim row reads 'Observed difference · conditions basis unrecognized' and says this build reads the named source as no basis at all. The stored status is MATCHED and the surface still refuses the matched-conditions claim, because the source is not in the authorized set. |
| captured_against_sha | `f1e146485bc1879d7a30577d8d2c0a7218fb6327` + uncommitted working tree |

### `claim-unrecognized-source--mobile.png`

| field | value |
| --- | --- |
| sha256 | `c2c99501b5ce6c1c5eb6cad3ca4b0892f7358c4f2344f91d94875dfe8faa849b` |
| bytes | 1004395 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `claim-unrecognized-source--mobile.snapshot.txt` |
| framed on | `.wb-claim` at scroll offset 6787 |
| state captured | Paired result naming a conditions source this build does not recognize, with status MATCHED |
| expected behaviour | The claim row reads 'Observed difference · conditions basis unrecognized' and says this build reads the named source as no basis at all. The stored status is MATCHED and the surface still refuses the matched-conditions claim, because the source is not in the authorized set. |
| captured_against_sha | `f1e146485bc1879d7a30577d8d2c0a7218fb6327` + uncommitted working tree |

### `provenance-complete--desktop.png`

| field | value |
| --- | --- |
| sha256 | `80ee8a1ae406ce921595e709d861b1392e383f8808938c3c0d4155b52b576bde` |
| bytes | 854899 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `provenance-complete--desktop.snapshot.txt` |
| framed on | `.wb-loop__reveal .wb-prov` at scroll offset 5435 |
| state captured | The provenance strip with every field recorded — seven rows, none unknown |
| expected behaviour | Seven labelled rows, every one carrying a recorded value: declared answer model, inspection provider, inspection model, pinned inspection build, inspection method, paired method, and capture time. The strip reports data-complete=yes. The note under it still says the answer model is declared and not observed. |
| captured_against_sha | `f1e146485bc1879d7a30577d8d2c0a7218fb6327` + uncommitted working tree |

### `provenance-complete--mobile.png`

| field | value |
| --- | --- |
| sha256 | `2a3ec541408eacbe465d8e02eb2191d448da38994eeadbf1a67f474a6e8d7ef0` |
| bytes | 689142 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `provenance-complete--mobile.snapshot.txt` |
| framed on | `.wb-loop__reveal .wb-prov` at scroll offset 7505 |
| state captured | The provenance strip with every field recorded — seven rows, none unknown |
| expected behaviour | Seven labelled rows, every one carrying a recorded value: declared answer model, inspection provider, inspection model, pinned inspection build, inspection method, paired method, and capture time. The strip reports data-complete=yes. The note under it still says the answer model is declared and not observed. |
| captured_against_sha | `f1e146485bc1879d7a30577d8d2c0a7218fb6327` + uncommitted working tree |

### `provenance-partial--desktop.png`

| field | value |
| --- | --- |
| sha256 | `919c8709998b6b14c75e3cc2da34306327e5a4a5a1debbc1ed245fbd2bcb71fa` |
| bytes | 827321 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `provenance-partial--desktop.snapshot.txt` |
| framed on | `.wb-loop__reveal .wb-prov` at scroll offset 5456 |
| state captured | The provenance strip on a live-shaped run — two fields unrecorded, both stated |
| expected behaviour | Seven rows again, with 'none given' against the declared answer model and 'not pinned' against the inspection build. The strip reports data-complete=no. No row is hidden and no value is borrowed from a neighbouring field. |
| captured_against_sha | `f1e146485bc1879d7a30577d8d2c0a7218fb6327` + uncommitted working tree |

### `provenance-partial--mobile.png`

| field | value |
| --- | --- |
| sha256 | `adafe90f3e3b80a7fa7de9dc50958a5fc421be46c1bb9902b652b72760792616` |
| bytes | 701136 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `provenance-partial--mobile.snapshot.txt` |
| framed on | `.wb-loop__reveal .wb-prov` at scroll offset 7489 |
| state captured | The provenance strip on a live-shaped run — two fields unrecorded, both stated |
| expected behaviour | Seven rows again, with 'none given' against the declared answer model and 'not pinned' against the inspection build. The strip reports data-complete=no. No row is hidden and no value is borrowed from a neighbouring field. |
| captured_against_sha | `f1e146485bc1879d7a30577d8d2c0a7218fb6327` + uncommitted working tree |

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
| captured_against_sha | `f1e146485bc1879d7a30577d8d2c0a7218fb6327` + uncommitted working tree |

### `export-single--mobile.png`

| field | value |
| --- | --- |
| sha256 | `b64130df4c1fb4668b6a9b9df2544dcb1f10bdc8881d9591c94d90f07085ae50` |
| bytes | 482818 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `export-single--mobile.snapshot.txt` |
| framed on | `.wb-checks__export--single` at scroll offset 4770 |
| state captured | The Review Record export on a single-answer run — the control and its support line |
| expected behaviour | The control reads 'Export Review Record'. The line beside it names the answer as pasted, the recorded findings, the checks with the marks set, and the run's provenance, then states that every finding in it is unreviewed. It does not mention a paired capture, and it makes no verification claim. |
| captured_against_sha | `f1e146485bc1879d7a30577d8d2c0a7218fb6327` + uncommitted working tree |

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
| captured_against_sha | `f1e146485bc1879d7a30577d8d2c0a7218fb6327` + uncommitted working tree |

### `export-paired--mobile.png`

| field | value |
| --- | --- |
| sha256 | `d81aba9c22924f9717667d511ff6ed683796391dc5eb92ad2fdc159976267776` |
| bytes | 729873 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| snapshot | `export-paired--mobile.snapshot.txt` |
| framed on | `.wb-checks__export--paired` at scroll offset 10004 |
| state captured | The Review Record export on a paired run — the control and its support line |
| expected behaviour | Same control label. The line names both answers as pasted, the recorded findings, the capture conditions YOU REPORTED, and the run's provenance. It names no checks, because a paired inspection produces none, and it calls the conditions reported rather than matched. |
| captured_against_sha | `f1e146485bc1879d7a30577d8d2c0a7218fb6327` + uncommitted working tree |

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
| expected behaviour | The case provenance line carries the case id, its category and its observed date. The run strip names the category, the four models tested, and the observation date. No gauge and no scored figure of any kind appears on the surface — the board's score scan is what holds that, and it cannot be written out longhand here without tripping itself. |
| captured_against_sha | `f1e146485bc1879d7a30577d8d2c0a7218fb6327` + uncommitted working tree |

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
| expected behaviour | The case provenance line carries the case id, its category and its observed date. The run strip names the category, the four models tested, and the observation date. No gauge and no scored figure of any kind appears on the surface — the board's score scan is what holds that, and it cannot be written out longhand here without tripping itself. |
| captured_against_sha | `f1e146485bc1879d7a30577d8d2c0a7218fb6327` + uncommitted working tree |
