// ── Bounded renderer-noise comparison ────────────────────────────────────────
//
// CURRENT STATE: no policy is active. `RASTER_POLICIES` is empty, so every scenario
// at every viewport is compared byte-for-byte and any differing pixel fails the run.
// The comparator below is complete, exported and fully tested, and nothing reaches
// it from a board run. Activating a tolerance is a founder ruling, not a code change.
//
// WHY IT WAS DEACTIVATED (founder ruling, 2026-08-03). The single entry that used to
// live in the registry observed a real browser-noise event against one specific
// accepted baseline. FD-1 lawfully repainted that baseline, so the observation now
// describes pixels the board no longer renders. An observation does not transfer to
// a new baseline: showing that the recorded deltas still apply to the new pixels
// without clamping is arithmetic, not observation. The entry is retained below as a
// historical record with its bounds and ceilings unchanged, and it resolves for
// nothing.
//
// The original diagnosis follows, unaltered, because a future ruling would need it.
//
// WHAT IT WAS FOR, precisely. `curated-readout--mobile` failed byte comparison in
// 2 of 12 complete board runs. It was diagnosed, not guessed:
//
//   * The two frames differ in 477 pixels of 2,740,500 (0.017%), max per-channel
//     delta 1, inside a bounding box that stops dead at the sticky header's painted
//     bottom edge. Nothing below it ever differs.
//   * `.site-header` carries `backdrop-filter: blur(16px) saturate(120%)` under a
//     `linear-gradient` whose alpha falls from 0.86 to 0.55 top to bottom. The
//     backdrop shows through most at the bottom, which is exactly where the damage
//     concentrates — 126/107/188 differing pixels in the last three rows, thinning
//     to scattered singles higher up.
//   * At this scenario's capture scroll a case-card edge sits directly beneath the
//     most transparent band of that bar. No other board state puts a high-contrast
//     edge there, and no other board state has ever produced this failure.
//   * The cause is resource-sensitive Chromium SOFTWARE rasterization of that
//     large-radius backdrop-filter. Eight-way concurrency reproduces it at 16-31%.
//     A fresh browser per run still reproduces it, so it is not accumulated state.
//     The bad frame is stable across 8 reads over 2 seconds, so there is nothing to
//     wait for. `--disable-partial-raster`, `--num-raster-threads=1`,
//     `--deterministic-mode` and `--disable-skia-runtime-opts` do not suppress it.
//
// So this was NOT a tolerance for "images that look close enough". It was a named
// exemption for one element's raster on one scenario at one viewport, with the
// exempt area resolved from the live page rather than hard-coded, and with every
// other guarantee left exact: the DOM snapshot, the image dimensions, and every
// single pixel outside the filtered element's painted box.
//
// It was deliberately not a configuration option. There is no flag that turns it on
// for anything else. Any second use, any bounds change and any ceiling change needs
// a new founder ruling — and so, now, does any use at all.
//
// ── RECURRENCE, 2026-08-10 ───────────────────────────────────────────────────
//
// The same frame differed again on a full-board run against a tree at `47964b7`,
// and it is the same shape in the same place: `curated-readout--mobile`, the
// sticky header band, a case-card edge sitting under the most transparent part of
// that bar. The diagnosis above records 477 differing pixels at max per-channel
// delta 1. This event differs in 74,615 pixels of 2,740,500 at max delta 15, inside
// a box that stops dead at device row 315 — same location, same element, the cause
// attributed above, over 156 times the area and at 15 times the peak delta.
//
// A bounded diagnostic on 2026-08-11 ran 16 controlled sequences and kept its
// custody record outside the harness write path, in the `imbas-site-qa-evidence`
// tree beside this repository rather than inside it. It classified the difference
// before explaining it: both byte-states land at the same scroll offset, report the
// same bounding box on the moving element, produce byte-identical snapshot text,
// and differ in no pixel below the band. The two states are one layout rastered
// two ways, not two layouts.
//
// A cold-render raster mechanism was demonstrated, in which the first document
// render in a fresh renderer process produces the candidate bytes, and it does not
// explain the 2026-08-10 mid-board event, which remains unattributable because the
// harness retained no renderer-process identity and no crash evidence.
//
// Write that sentence out in full whenever this event is described. Never compress
// it to "the flicker was diagnosed." It carries two claims, one demonstrated and
// one open, and a board run reaches this scenario at navigation 40 of 62 in a
// renderer it has already reused 39 times — so the demonstrated mechanism cannot
// reach the event that prompted the diagnostic unless something replaced that
// renderer mid-run, which no retained evidence can confirm or rule out.
//
// Nothing was activated in response. `RASTER_POLICIES` is still empty, the entry
// below is still retired, and this block grants no allowance of any kind.
//
// ── INSTRUMENTED RECURRENCE, 2026-08-13 ──────────────────────────────────────
//
// The harness now records which renderer process took each frame, armed before the
// first capture of a run. Three full boards were captured on a tree at `7d2d5c2`
// with that instrumentation live, and the same frame differed again on one of them:
// `curated-readout--mobile`, run 2 of 3, producing the same alternate byte-state
// already retained from the event above. This time the run kept the identity the
// 2026-08-10 run did not.
//
// What the three runs recorded: one renderer pid held across all 64 captures in each
// run — 93328, 93436, 93471 — with zero replacements and zero crashes. Stated in the
// two-halves form, and never to be compressed to one:
//
//   FIRST HALF. Renderer-process replacement is falsified for these three
//   instrumented runs only. That closes the conditional above for them and for
//   nothing else: the demonstrated cold-render mechanism could only reach a
//   mid-board event if something replaced the renderer mid-run, and in these three
//   runs nothing did.
//
//   SECOND HALF. The 2026-08-10 event remains unattributed. Its renderer identity
//   was never retained, so nothing in the evidence that run kept can confirm or rule
//   out a mid-board replacement. These runs say nothing about it.
//
// Write both halves out whenever this is described. Never compress them to "the
// flicker was diagnosed", and never to "renderer replacement is ruled out." One
// claim is falsified in an instrumented sequence, the other is still open, and one
// can stand while the other stays open.
//
// The classification held. The DOM snapshot hashed identically in all three runs and
// the scroll offset read 567 in all three, so the two byte-states are still one
// layout rastered two ways. The difference sits inside x[0..1124] y[1..314] of the
// 1125 × 2436 frame, stopping dead at device row 315: 74,615 differing pixels of
// 2,740,500, 62,089 of them at channel delta 1, tapering to 6 pixels at delta 15.
//
// `backdrop-filter` and compositor raster timing are recorded here as a mechanism
// class consistent with that spatial pattern, and never as a demonstrated cause. No
// run on 2026-08-13 demonstrated a cause for any observed difference.
//
// One figure above has moved and is left as written: the board reached 62 captures
// when that paragraph was composed and now reaches 64, across 32 scenarios at two
// viewports. The argument it carries is unaffected — this scenario is still reached
// deep into a run, in a renderer already reused many times over.
//
// WHY THIS IS NOT APPENDED TO `HISTORICAL_RASTER_OBSERVATIONS`. That array holds
// retired *policies*: entries carrying `declaredBounds`, `maxRgbDelta` and
// `maxDifferingPixels` that a founder ruling once set and a later ruling retired,
// each pinned to a committed fixture. This observation has no ruling behind it, no
// bounds, no ceilings, and its frames are untracked working evidence. Writing it in
// that shape would mint numbers no ruling authorized and hand a tolerance somewhere
// to be found. It is recorded here, in prose, where it grants nothing.
//
// Nothing was activated in response, again. `RASTER_POLICIES` is still empty, every
// scenario at every viewport is still compared byte-for-byte, and this block still
// grants no allowance of any kind. The frame remains a standing STOP for founder
// ruling. Full record: `docs/qa/LANE4-ACCEPTANCE-RECORD-2026-08-12.md` §2.3–§2.4.

import zlib from "node:zlib";

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

// Named policy errors. These are identifiers, not prose: a run that trips one names
// it, so "the policy failed" is never something a reader has to interpret.
export const POLICY_ERRORS = {
  REGION_UNRESOLVED: "POLICY_REGION_UNRESOLVED",
  BOUNDS_EXCEED_DECLARED: "POLICY_BOUNDS_EXCEED_DECLARED",
  DIMENSIONS_CHANGED: "POLICY_DIMENSIONS_CHANGED",
  PIXEL_OUTSIDE_REGION: "POLICY_PIXEL_OUTSIDE_REGION",
  RGB_DELTA_EXCEEDED: "POLICY_RGB_DELTA_EXCEEDED",
  PIXEL_COUNT_EXCEEDED: "POLICY_PIXEL_COUNT_EXCEEDED",
  ALPHA_CHANGED: "POLICY_ALPHA_CHANGED",
  DECODE_FAILED: "POLICY_DECODE_FAILED",
};

// The active registry. Empty. Every board state resolves to null and is compared
// byte-for-byte. This is a list, not a flag, so "how many tolerances are active" is
// answered by reading it rather than by tracing a condition.
export const RASTER_POLICIES = [];

// The historical registry. Not consulted by `resolvePolicy`, not consulted by the
// board, not rendered into the manifest. It exists so the ruling that retired the
// entry did not also delete what was measured: a later founder ruling that wanted to
// reactivate a bounded comparison would start from these numbers, and would have to
// re-observe against whatever baseline was current at that time.
//
// `declaredBounds` is the geometry recorded at implementation time under the same
// rounding rule the comparator applies at run time (left/top floored, right/bottom
// ceiled). Bounds unchanged since the observation. Ceilings never widened.
export const HISTORICAL_RASTER_OBSERVATIONS = [
  {
    id: "curated-readout-mobile-header-raster-v1",
    status: "OBSERVED_AGAINST_SUPERSEDED_BASELINE",
    applicability: "HISTORICAL_NOT_APPLICABLE",
    retiredOn: "2026-08-03",
    supersededBy: "abe1914d516a4da2d8eb42ed9548719de1be7414",
    evidence: "test/fixtures/curated-readout-mobile-alternate-raster.json",
    scenario: "curated-readout",
    viewport: "mobile",
    selector: ".site-header",
    declaredBounds: { left: 0, top: 0, right: 1125, bottom: 236 },
    maxRgbDelta: 1,
    maxDifferingPixels: 600,
    observedDifferingPixels: 477,
    cause:
      "Resource-sensitive Chromium software rasterization of blur(16px) saturate(120%) " +
      "under the header's translucent gradient.",
  },
];

// Reads the active registry only. The historical list is deliberately out of reach:
// a retired observation must not become a live allowance by being findable. With the
// active registry empty this returns null for everything, which is the byte-exact
// path, and there is no argument, flag or env var that changes that.
export function resolvePolicy(scenarioName, viewportName) {
  return (
    RASTER_POLICIES.find((p) => p.scenario === scenarioName && p.viewport === viewportName) || null
  );
}

// CSS rectangle -> device pixels, conservatively: the region may only ever grow
// outward to whole pixels, never inward, so the entire painted box is inside it. A
// region that rounded inward could leave a filtered edge pixel being compared
// byte-exact, which is the one thing this must not do by accident.
export function toDeviceBounds(cssRect, dpr) {
  return {
    left: Math.floor(cssRect.left * dpr),
    top: Math.floor(cssRect.top * dpr),
    right: Math.ceil(cssRect.right * dpr),
    bottom: Math.ceil(cssRect.bottom * dpr),
  };
}

// ── PNG decode ───────────────────────────────────────────────────────────────
// A pure decoder, on purpose. Routing these bytes through a browser canvas would
// reintroduce the renderer as a dependency of the check on the renderer, and canvas
// read-back premultiplies alpha and may apply a color profile — both of which would
// silently rewrite the very values being compared. Everything here is exact integer
// work: inflate, reverse the scanline filters, widen to RGBA.
export function decodePng(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 8 || !buf.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error("not a PNG: signature mismatch");
  }
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = -1;
  let interlace = 0;
  const idat = [];
  let sawIHDR = false;

  let i = 8;
  while (i + 8 <= buf.length) {
    const length = buf.readUInt32BE(i);
    const type = buf.toString("ascii", i + 4, i + 8);
    const body = buf.subarray(i + 8, i + 8 + length);
    if (type === "IHDR") {
      width = body.readUInt32BE(0);
      height = body.readUInt32BE(4);
      bitDepth = body[8];
      colorType = body[9];
      interlace = body[12];
      sawIHDR = true;
    } else if (type === "IDAT") {
      idat.push(body);
    } else if (type === "IEND") {
      break;
    }
    i += 12 + length;
  }

  if (!sawIHDR) throw new Error("not a PNG: no IHDR");
  if (bitDepth !== 8) throw new Error(`unsupported PNG bit depth ${bitDepth} (only 8 is handled)`);
  if (interlace !== 0) throw new Error("unsupported interlaced PNG");
  const CHANNELS = { 0: 1, 2: 3, 4: 2, 6: 4 };
  const srcChannels = CHANNELS[colorType];
  if (!srcChannels) throw new Error(`unsupported PNG color type ${colorType}`);
  if (!idat.length) throw new Error("not a PNG: no IDAT");

  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * srcChannels;
  if (raw.length < (stride + 1) * height) {
    throw new Error(`truncated PNG: ${raw.length} bytes for ${height} rows of ${stride}`);
  }

  // Un-filter in place into a contiguous unfiltered buffer.
  const out = Buffer.alloc(stride * height);
  const bpp = srcChannels;
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const src = raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
    const cur = out.subarray(y * stride, y * stride + stride);
    const prior = y > 0 ? out.subarray((y - 1) * stride, (y - 1) * stride + stride) : null;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0;
      const b = prior ? prior[x] : 0;
      const c = prior && x >= bpp ? prior[x - bpp] : 0;
      let v;
      switch (filter) {
        case 0: v = src[x]; break;
        case 1: v = src[x] + a; break;
        case 2: v = src[x] + b; break;
        case 3: v = src[x] + ((a + b) >> 1); break;
        case 4: {
          const p = a + b - c;
          const pa = Math.abs(p - a);
          const pb = Math.abs(p - b);
          const pc = Math.abs(p - c);
          v = src[x] + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
          break;
        }
        default: throw new Error(`unsupported PNG filter type ${filter} on row ${y}`);
      }
      cur[x] = v & 0xff;
    }
  }

  // Widen to one canonical representation so every comparison downstream is
  // channel-for-channel regardless of how the encoder chose to store the frame.
  const data = Buffer.alloc(width * height * 4);
  for (let px = 0; px < width * height; px++) {
    const s = px * srcChannels;
    const d = px * 4;
    if (colorType === 0) {
      data[d] = data[d + 1] = data[d + 2] = out[s];
      data[d + 3] = 255;
    } else if (colorType === 2) {
      data[d] = out[s];
      data[d + 1] = out[s + 1];
      data[d + 2] = out[s + 2];
      data[d + 3] = 255;
    } else if (colorType === 4) {
      data[d] = data[d + 1] = data[d + 2] = out[s];
      data[d + 3] = out[s + 1];
    } else {
      data[d] = out[s];
      data[d + 1] = out[s + 1];
      data[d + 2] = out[s + 2];
      data[d + 3] = out[s + 3];
    }
  }
  return { width, height, data };
}

// ── The comparison ───────────────────────────────────────────────────────────
// `resolved` is the device-pixel region measured from the live page during THIS
// capture, not a constant. It is passed in rather than looked up so the comparator
// stays a pure function of its inputs and the tests can drive it directly.
export function comparePolicy(policy, baselineBuf, freshBuf, resolved) {
  const report = {
    policy_id: policy.id,
    selector: policy.selector,
    declared_bounds: policy.declaredBounds,
    resolved_bounds: resolved || null,
    different_pixels_total: 0,
    different_pixels_inside: 0,
    different_pixels_outside: 0,
    max_rgb_delta: 0,
    alpha_differences: 0,
    result: "fail",
    errors: [],
  };

  // No region means no exemption. Falling back to a byte comparison here would turn
  // a broken selector into a silently stricter run that still passes on a good day,
  // and the failure would surface much later wearing the wrong face.
  if (!resolved) {
    report.errors.push(POLICY_ERRORS.REGION_UNRESOLVED);
    return report;
  }

  const d = policy.declaredBounds;
  if (
    resolved.left < d.left ||
    resolved.top < d.top ||
    resolved.right > d.right ||
    resolved.bottom > d.bottom
  ) {
    // Growth is the dangerous direction: a larger element means a larger exempt
    // area, and an exemption that widens by itself is how a narrow allowance turns
    // into a general one without anybody deciding to do that.
    report.errors.push(POLICY_ERRORS.BOUNDS_EXCEED_DECLARED);
    return report;
  }

  let a;
  let b;
  try {
    a = decodePng(baselineBuf);
    b = decodePng(freshBuf);
  } catch (e) {
    report.errors.push(POLICY_ERRORS.DECODE_FAILED);
    report.decode_error = e.message;
    return report;
  }

  if (a.width !== b.width || a.height !== b.height) {
    report.errors.push(POLICY_ERRORS.DIMENSIONS_CHANGED);
    report.dimensions = { baseline: [a.width, a.height], fresh: [b.width, b.height] };
    return report;
  }
  report.dimensions = { baseline: [a.width, a.height], fresh: [b.width, b.height] };

  let outsideExample = null;
  for (let y = 0; y < a.height; y++) {
    const inRows = y >= resolved.top && y < resolved.bottom;
    for (let x = 0; x < a.width; x++) {
      const p = (y * a.width + x) * 4;
      const dr = Math.abs(a.data[p] - b.data[p]);
      const dg = Math.abs(a.data[p + 1] - b.data[p + 1]);
      const db = Math.abs(a.data[p + 2] - b.data[p + 2]);
      const da = Math.abs(a.data[p + 3] - b.data[p + 3]);
      if (!dr && !dg && !db && !da) continue;

      report.different_pixels_total++;
      if (da) report.alpha_differences++;
      const rgbDelta = Math.max(dr, dg, db);
      if (rgbDelta > report.max_rgb_delta) report.max_rgb_delta = rgbDelta;

      const inside = inRows && x >= resolved.left && x < resolved.right;
      if (inside) report.different_pixels_inside++;
      else {
        report.different_pixels_outside++;
        if (!outsideExample) outsideExample = { x, y };
      }
    }
  }

  if (report.different_pixels_outside > 0) {
    report.errors.push(POLICY_ERRORS.PIXEL_OUTSIDE_REGION);
    report.first_outside_pixel = outsideExample;
  }
  if (report.alpha_differences > 0) report.errors.push(POLICY_ERRORS.ALPHA_CHANGED);
  if (report.max_rgb_delta > policy.maxRgbDelta) report.errors.push(POLICY_ERRORS.RGB_DELTA_EXCEEDED);
  if (report.different_pixels_inside > policy.maxDifferingPixels) {
    report.errors.push(POLICY_ERRORS.PIXEL_COUNT_EXCEEDED);
  }

  report.result = report.errors.length ? "fail" : "pass";
  return report;
}

// One line per field, stable order, so a run's policy output is greppable and two
// runs can be diffed against each other without reformatting.
export function formatPolicyReport(report) {
  const bounds = (v) => (v ? `${v.left},${v.top},${v.right},${v.bottom}` : "unresolved");
  // Field names are spelled out in full. They are the names the ruling gives them, and
  // an abbreviation to save a column would mean a reader grepping for the named field
  // finds nothing.
  const row = (k, v) => `    ${k.padEnd(24)}: ${v}`;
  const lines = [
    row("policy_id", report.policy_id),
    row("selector", report.selector),
    row("declared_bounds", bounds(report.declared_bounds)),
    row("resolved_bounds", bounds(report.resolved_bounds)),
    row("different_pixels_total", report.different_pixels_total),
    row("different_pixels_inside", report.different_pixels_inside),
    row("different_pixels_outside", report.different_pixels_outside),
    row("max_rgb_delta", report.max_rgb_delta),
    row("alpha_differences", report.alpha_differences),
    row("result", report.result),
  ];
  if (report.errors.length) lines.push(row("errors", report.errors.join(", ")));
  return lines.join("\n");
}
