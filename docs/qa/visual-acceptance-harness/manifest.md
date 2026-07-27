# Visual acceptance manifest

captured_against_sha: `ea3e710e276cc5ba71296cba4974df995ca8a06c`

**These images were captured against commit `ea3e710e276cc5ba71296cba4974df995ca8a06c` PLUS the uncommitted working tree of the pass that produced them.** They were not captured against their own commit — that commit did not exist yet when the shutter fired. Treat `captured_against_sha` as the base the working tree sat on top of, nothing stronger.

- working tree at capture time: **dirty**
- browser: `/Users/brendan/Library/Caches/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-mac-arm64/chrome-headless-shell`
- browser version: `HeadlessChrome/148.0.7778.96`
- captured: 2026-07-27T03:22:15.318Z
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
| captured_against_sha | `ea3e710e276cc5ba71296cba4974df995ca8a06c` + uncommitted working tree |

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
| captured_against_sha | `ea3e710e276cc5ba71296cba4974df995ca8a06c` + uncommitted working tree |
