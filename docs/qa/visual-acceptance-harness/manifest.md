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

## Why the Pass 2B-A baseline change was accepted

Pass 2B-A regenerated both `single-findings` baselines once. The desktop image-diff against the
previous baseline reported **22.63% of pixels differing with a maximum channel delta of 224**,
which is far too large a number to wave through on "visually identical." It was analysed by
region rather than accepted. The analysis is recorded here because the headline figure will look
alarming to the next person who runs `git log` on these files.

**Cause, in one chain.** The pass removed the single-answer score from `ReaderResultHero`, which
made the hero **43.04 CSS px** shorter. The desktop frame is centred on
`.wb-measure__list li.wb-measure__finding` by `scrollToDeterministic`, which computes
`ideal = absTop + height/2 - innerHeight/2` and then **`Math.round`s** it
(`scripts/qa/visual-acceptance.mjs:584`). The focus element's document position moved up 43.04 px;
the rounded scroll target moved by exactly 44 (2508 → 2464). The 0.96 px difference is a residual
that lands on every element in the scrolled document: each one sits **+0.96 CSS px = +1.93 device
px** lower in the frame than before. A non-integer device offset re-rasterizes every antialiased
glyph and background gradient in the frame. That is the whole diff.

**What was measured, not assumed.**

| evidence | result |
| --- | --- |
| delta magnitude histogram | 79.28% of differing pixels differ by exactly 1/255; 95.92% by ≤ 4 |
| perceptible change (delta > 32) | 24,190 px = **0.4666% of the frame**, all on text glyph edges |
| integer shift search, dy −4..+4 | no integer aligns the frames; dy=2 (nearest to 1.93) is best at 19.27%, and odd shifts cost ~55% because they break the 2× subpixel grid |
| horizontal shift search, dx −4..+4 | dx=0 is best; the content did not move horizontally |
| intensity-weighted centroids, 4 scrolled text regions | +1.877, +1.974, +1.577, +1.928 device px vertical; \|dx\| ≤ 0.22 device px; ink totals unchanged within 0.1% |
| **control: fixed-position nav wordmark** | **+0.000 device px.** The fixed header does not scroll, so it did not move |
| fixed header region (CSS y 0..56) | max delta **1**, zero pixels > 32 |
| left margin (CSS x 0..300) | max delta **5**, zero pixels > 32 |
| right margin (CSS x 1140..1440) | max delta **5**, zero pixels > 32 |
| worst pixel, delta 224 | device (794,168) = CSS (397,84), inside the "Share this inspection" label: background umber `18,14,12` → type `242,232,220` |
| `## render` text record | **byte-identical** before and after — same 30 elements, same text, boundary string unchanged |

The maximum delta of 224 is not evidence of an additional change. It is one glyph-edge pixel
crossing from background to type, and 224 is the arithmetic maximum any sub-pixel type shift can
produce against this palette. Every perceptible pixel is confined to the content column; the fixed
header and both margins contain nothing above delta 5.

**Conclusion.** The diff is fully explained by the shortened hero and the rounded scroll target.
No unrelated region changed and there is no unexplained remainder. The hero itself is *not* in the
captured frame — it sits above it — which is why the text record is identical while every pixel in
it moved.

*One consequence worth knowing.* Because the residual comes from `Math.round`, any future layout
change whose height delta is not an integer will reproduce this: a full-frame diff of ~20% at ±1
per pixel, with no content change. Read the delta histogram before reading the percentage. A real
regression puts mass in the high buckets; this signature puts 96% of it at ≤ 4.

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
