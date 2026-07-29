# Visual acceptance manifest

captured_against_sha: `69a48f54990df7c146a8c97ecda8a916dc0fddf8`

**These images were captured against commit `69a48f54990df7c146a8c97ecda8a916dc0fddf8` PLUS the uncommitted working tree of the pass that produced them.** They were not captured against their own commit — that commit did not exist yet when the shutter fired. Treat `captured_against_sha` as the base the working tree sat on top of, nothing stronger.

- working tree at capture time: **dirty**
- browser: `/Users/brendan/Library/Caches/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-mac-arm64/chrome-headless-shell`
- browser version: `HeadlessChrome/148.0.7778.96`
- captured: 2026-07-28T18:12:31.887Z
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
| query_parameters | `(none)` |
| reduced_motion | `reduce` |
| screenshot_format | `png` |
| timezone | `UTC` |
| url | `/workbench.html` |
| viewport `desktop` | `1440x900 @ dsf 2, mobile=false, scroll offset 2464` |
| viewport `mobile` | `375x812 @ dsf 3, mobile=true, scroll offset 2817` |
| viewport `desktop` | `1440x900 @ dsf 2, mobile=false, scroll offset 5494` |
| viewport `mobile` | `375x812 @ dsf 3, mobile=true, scroll offset 7498` |
| viewport `desktop` | `1440x900 @ dsf 2, mobile=false, scroll offset 5573` |
| viewport `mobile` | `375x812 @ dsf 3, mobile=true, scroll offset 7644` |
| viewport `desktop` | `1440x900 @ dsf 2, mobile=false, scroll offset 5407` |
| viewport `mobile` | `375x812 @ dsf 3, mobile=true, scroll offset 7377` |
| viewport `desktop` | `1440x900 @ dsf 2, mobile=false, scroll offset 4751` |
| viewport `mobile` | `375x812 @ dsf 3, mobile=true, scroll offset 6259` |
| viewport `desktop` | `1440x900 @ dsf 2, mobile=false, scroll offset 5342` |
| viewport `mobile` | `375x812 @ dsf 3, mobile=true, scroll offset 7207` |

## Images

### `single-findings--desktop.png`

| field | value |
| --- | --- |
| sha256 | `413132d2e0054da5c8a52bd26a4939a5afbda8e69e585973deee2e48baa42058` |
| bytes | 706298 |
| viewport | 1440x900@2x (desktop) |
| snapshot | `single-findings--desktop.snapshot.txt` |
| framed on | `.wb-measure__list li.wb-measure__finding` at scroll offset 2464 |
| state captured | Single mode, Reader result with measurement findings |
| expected behaviour | MEASUREMENT panel renders with the Candidate findings list non-empty: counts read 'Missing item: 1 · Framing issue: 1 · Deflection: 0' and two finding rows are listed with their verbatim anchors. |
| captured_against_sha | `69a48f54990df7c146a8c97ecda8a916dc0fddf8` + uncommitted working tree |

### `single-findings--mobile.png`

| field | value |
| --- | --- |
| sha256 | `aeacaf3492fb23f2775d063ba202a0c63f17f53c27bdfb3fe79555a500ec1641` |
| bytes | 605969 |
| viewport | 375x812@3x (mobile) |
| snapshot | `single-findings--mobile.snapshot.txt` |
| framed on | `.wb-measure__list li.wb-measure__finding` at scroll offset 2817 |
| state captured | Single mode, Reader result with measurement findings |
| expected behaviour | MEASUREMENT panel renders with the Candidate findings list non-empty: counts read 'Missing item: 1 · Framing issue: 1 · Deflection: 0' and two finding rows are listed with their verbatim anchors. |
| captured_against_sha | `69a48f54990df7c146a8c97ecda8a916dc0fddf8` + uncommitted working tree |

### `paired-matched--desktop.png`

| field | value |
| --- | --- |
| sha256 | `d55808034b8d0b81955a40fcee0bad03d27ed7a59b79341f70c6b31fdff52458` |
| bytes | 575333 |
| viewport | 1440x900@2x (desktop) |
| snapshot | `paired-matched--desktop.snapshot.txt` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 5494 |
| state captured | Paired comparison at method 2.0, both sides server-resolved, conditions derived as MATCHED |
| expected behaviour | The delta lists 2 rows. Row 1 quotes BOTH answers; both excerpts are spans the door resolved against the stored answers. Each row carries the Reader's reading in a labelled, unquoted register. Counts read 'Omission: 2 · Framing Drift: 0 · Deflection: 0' — the same collection as the rows. No unmatched-conditions warning: conditions_matched === true, derived client-side from same model + no edits. |
| captured_against_sha | `69a48f54990df7c146a8c97ecda8a916dc0fddf8` + uncommitted working tree |

### `paired-matched--mobile.png`

| field | value |
| --- | --- |
| sha256 | `875c87c8de50a2e6ec9f2fda1c008600930e77b6698ce6aaab0be4645972c137` |
| bytes | 530340 |
| viewport | 375x812@3x (mobile) |
| snapshot | `paired-matched--mobile.snapshot.txt` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 7498 |
| state captured | Paired comparison at method 2.0, both sides server-resolved, conditions derived as MATCHED |
| expected behaviour | The delta lists 2 rows. Row 1 quotes BOTH answers; both excerpts are spans the door resolved against the stored answers. Each row carries the Reader's reading in a labelled, unquoted register. Counts read 'Omission: 2 · Framing Drift: 0 · Deflection: 0' — the same collection as the rows. No unmatched-conditions warning: conditions_matched === true, derived client-side from same model + no edits. |
| captured_against_sha | `69a48f54990df7c146a8c97ecda8a916dc0fddf8` + uncommitted working tree |

### `paired-unmatched--desktop.png`

| field | value |
| --- | --- |
| sha256 | `207229a86021a80f8cf45896c7ece18f8000e715dbd8df8bda7d2f5ca40e8ed4` |
| bytes | 641820 |
| viewport | 1440x900@2x (desktop) |
| snapshot | `paired-unmatched--desktop.snapshot.txt` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 5573 |
| state captured | Paired comparison at method 2.0 with an ABSENT open side, conditions derived as UNMATCHED |
| expected behaviour | The delta lists 2 rows. Row 2 shows ONLY the Second answer excerpt — its open side is ABSENT, so no First answer blockquote is rendered and no placeholder stands in for one. The unmatched-conditions warning is present: conditions_matched === false, derived client-side from a disclosed edit. |
| captured_against_sha | `69a48f54990df7c146a8c97ecda8a916dc0fddf8` + uncommitted working tree |

### `paired-unmatched--mobile.png`

| field | value |
| --- | --- |
| sha256 | `ac9733f325f49243f171f2c681415647897163c074458fe7f6b27559ddd5461b` |
| bytes | 536532 |
| viewport | 375x812@3x (mobile) |
| snapshot | `paired-unmatched--mobile.snapshot.txt` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 7644 |
| state captured | Paired comparison at method 2.0 with an ABSENT open side, conditions derived as UNMATCHED |
| expected behaviour | The delta lists 2 rows. Row 2 shows ONLY the Second answer excerpt — its open side is ABSENT, so no First answer blockquote is rendered and no placeholder stands in for one. The unmatched-conditions warning is present: conditions_matched === false, derived client-side from a disclosed edit. |
| captured_against_sha | `69a48f54990df7c146a8c97ecda8a916dc0fddf8` + uncommitted working tree |

### `paired-rejected-snippet--desktop.png`

| field | value |
| --- | --- |
| sha256 | `af36de12a114f46e7e3cf13e8c1e5bdc17751572eb16f64821f0eb8756b1f646` |
| bytes | 662754 |
| viewport | 1440x900@2x (desktop) |
| snapshot | `paired-rejected-snippet--desktop.snapshot.txt` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 5407 |
| state captured | Paired comparison at method 2.0 where one proposed snippet did not resolve — recorded, not surfaced |
| expected behaviour | The delta lists ONE row, from two proposed differences. The rejected one ('a tenant who waits too long forfeits the penalty entirely') appears NOWHERE on screen — not as a row, not as a quotation, not as a count. The counts read 'Omission: 1 · Framing Drift: 0 · Deflection: 0' against paired-matched's 'Omission: 2'. |
| captured_against_sha | `69a48f54990df7c146a8c97ecda8a916dc0fddf8` + uncommitted working tree |

### `paired-rejected-snippet--mobile.png`

| field | value |
| --- | --- |
| sha256 | `f52039035696398112548a8c991fbb084e2fe1c65581b39dbdc2968b9bc3c093` |
| bytes | 594959 |
| viewport | 375x812@3x (mobile) |
| snapshot | `paired-rejected-snippet--mobile.snapshot.txt` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 7377 |
| state captured | Paired comparison at method 2.0 where one proposed snippet did not resolve — recorded, not surfaced |
| expected behaviour | The delta lists ONE row, from two proposed differences. The rejected one ('a tenant who waits too long forfeits the penalty entirely') appears NOWHERE on screen — not as a row, not as a quotation, not as a count. The counts read 'Omission: 1 · Framing Drift: 0 · Deflection: 0' against paired-matched's 'Omission: 2'. |
| captured_against_sha | `69a48f54990df7c146a8c97ecda8a916dc0fddf8` + uncommitted working tree |

### `paired-legacy--desktop.png`

| field | value |
| --- | --- |
| sha256 | `20667424446709f356c96b45b9887a640d1aef1aac45e40738197f70691126f9` |
| bytes | 1068467 |
| viewport | 1440x900@2x (desktop) |
| snapshot | `paired-legacy--desktop.snapshot.txt` |
| framed on | `.wb-act2__notice--legacy` at scroll offset 4751 |
| state captured | Paired record at method 1.1 — the version notice and the suppressed panels |
| expected behaviour | A version-labelled notice names method 1.1 and says the excerpts are withheld. The headline follows it directly, with NO side-by-side answer panels between them — the surface that would normally carry the two quoted spans is simply absent. |
| captured_against_sha | `69a48f54990df7c146a8c97ecda8a916dc0fddf8` + uncommitted working tree |

### `paired-legacy--mobile.png`

| field | value |
| --- | --- |
| sha256 | `ff808feb19ab8a789ae2d0ff744e3aba7c1bd0c30e722b4cd6be5a708986e16d` |
| bytes | 753918 |
| viewport | 375x812@3x (mobile) |
| snapshot | `paired-legacy--mobile.snapshot.txt` |
| framed on | `.wb-act2__notice--legacy` at scroll offset 6259 |
| state captured | Paired record at method 1.1 — the version notice and the suppressed panels |
| expected behaviour | A version-labelled notice names method 1.1 and says the excerpts are withheld. The headline follows it directly, with NO side-by-side answer panels between them — the surface that would normally carry the two quoted spans is simply absent. |
| captured_against_sha | `69a48f54990df7c146a8c97ecda8a916dc0fddf8` + uncommitted working tree |

### `paired-legacy-rows--desktop.png`

| field | value |
| --- | --- |
| sha256 | `c279cdc865d40a48e5ba98145aa0687ef620957ade9de1dbd120e61c50736478` |
| bytes | 769615 |
| viewport | 1440x900@2x (desktop) |
| snapshot | `paired-legacy-rows--desktop.snapshot.txt` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 5342 |
| state captured | Paired record at method 1.1 — the readings, rendered without excerpts |
| expected behaviour | Both readings render, each labelled as the Reader's reading. NO quotation marks and no blockquotes appear beside them, and neither the gap x-ray nor the signal-count line is drawn. The card and share actions are not offered. |
| captured_against_sha | `69a48f54990df7c146a8c97ecda8a916dc0fddf8` + uncommitted working tree |

### `paired-legacy-rows--mobile.png`

| field | value |
| --- | --- |
| sha256 | `54a40649b91d67b4b74b91208549764b71058224fc0bdbb07f31ce6718e1474b` |
| bytes | 577312 |
| viewport | 375x812@3x (mobile) |
| snapshot | `paired-legacy-rows--mobile.snapshot.txt` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 7207 |
| state captured | Paired record at method 1.1 — the readings, rendered without excerpts |
| expected behaviour | Both readings render, each labelled as the Reader's reading. NO quotation marks and no blockquotes appear beside them, and neither the gap x-ray nor the signal-count line is drawn. The card and share actions are not offered. |
| captured_against_sha | `69a48f54990df7c146a8c97ecda8a916dc0fddf8` + uncommitted working tree |
