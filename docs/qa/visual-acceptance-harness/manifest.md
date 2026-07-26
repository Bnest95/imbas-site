# Visual acceptance manifest

captured_against_sha: `71f8294779b9528cce2da8ebae40c191de7490cf`

**These images were captured against commit `71f8294779b9528cce2da8ebae40c191de7490cf` PLUS the uncommitted working tree of the pass that produced them.** They were not captured against their own commit — that commit did not exist yet when the shutter fired. Treat `captured_against_sha` as the base the working tree sat on top of, nothing stronger.

- working tree at capture time: **dirty**
- browser: `/Users/brendan/Library/Caches/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-mac-arm64/chrome-headless-shell`
- captured: 2026-07-26T03:20:39.886Z
- fixtures: synthetic, from `scripts/qa/scenarios.mjs` — not captures, not evidence
- network: deny-by-default; no model API call is reachable from this harness

## Images

### `single-findings--desktop.png`

| field | value |
| --- | --- |
| sha256 | `0ac97365dd27ba6769e1b9290a747d31d821d3cf2f7dd4bb95503580a99f71a6` |
| bytes | 734286 |
| viewport | 1440x900@2x (desktop) |
| framed on | `.wb-measure__list li.wb-measure__finding` scrolled into the viewport |
| state captured | Single mode, Reader result with measurement findings |
| expected behaviour | MEASUREMENT panel renders with the Candidate findings list non-empty: counts read 'Missing item: 1 · Framing issue: 1 · Deflection: 0' and two finding rows are listed with their verbatim anchors. |
| captured_against_sha | `71f8294779b9528cce2da8ebae40c191de7490cf` + uncommitted working tree |

### `single-findings--mobile.png`

| field | value |
| --- | --- |
| sha256 | `b401a25c6b76904cf664bbf72ad87e7d9a2a7d21f18f14ab3d368a49655e8e93` |
| bytes | 606948 |
| viewport | 375x812@3x (mobile) |
| framed on | `.wb-measure__list li.wb-measure__finding` scrolled into the viewport |
| state captured | Single mode, Reader result with measurement findings |
| expected behaviour | MEASUREMENT panel renders with the Candidate findings list non-empty: counts read 'Missing item: 1 · Framing issue: 1 · Deflection: 0' and two finding rows are listed with their verbatim anchors. |
| captured_against_sha | `71f8294779b9528cce2da8ebae40c191de7490cf` + uncommitted working tree |
