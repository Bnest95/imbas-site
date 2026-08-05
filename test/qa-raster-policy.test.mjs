// Guardrail: the bounded renderer-noise comparison must accept exactly the diagnosed
// state and nothing wider.
// Run: node --test test/qa-raster-policy.test.mjs
//
// No policy is active. The active registry is empty, every board state is compared
// byte-for-byte, and these tests hold two separate things:
//
//   1. The current baseline carries no exception. Nothing resolves, no recorded delta
//      is applied to it, and any differing pixel fails closed.
//   2. The historical observation stays internally verifiable against the pixels it
//      was actually observed on, which are pinned as a fixture asset rather than read
//      from the live baseline. FD-1 repainted that baseline; an observation does not
//      follow a baseline it was not made against.
//
// The comparator edge tests below stay, exercising the historical entry's numbers
// against synthetic frames. They are what a future founder ruling would rely on: if a
// bounded comparison is ever activated again it must accept exactly the diagnosed
// state and nothing wider — a bigger channel delta, more pixels, a pixel outside the
// region, a touched alpha value, changed dimensions, a region that grew, a region that
// could not be found, all fail.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

import {
  RASTER_POLICIES,
  HISTORICAL_RASTER_OBSERVATIONS,
  POLICY_ERRORS,
  resolvePolicy,
  toDeviceBounds,
  decodePng,
  comparePolicy,
  formatPolicyReport,
} from "../scripts/qa/raster-policy.mjs";
import { renderComparisonPolicySection } from "../scripts/qa/visual-acceptance.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "..");

// Sourced from the historical record, not from `resolvePolicy`, because nothing
// resolves any more. Reaching for it through the resolver is exactly the transfer this
// ruling forbids, so the tests take it from the shelf it was retired to.
const POLICY = HISTORICAL_RASTER_OBSERVATIONS[0];
// The region that entry declared. Tests that are not about bounds use it so they
// exercise the same geometry the observation was made under.
const RESOLVED = { left: 0, top: 0, right: 1125, bottom: 236 };

// ── A minimal PNG encoder, for fixtures only ─────────────────────────────────
// Every row uses filter type 0. Real captures do not look like this, and they do not
// need to: the decoder under test reverses all five filter types, and what these
// fixtures need to control is pixel VALUES, not how they were stored.
function encodePng(width, height, rgba, { colorType = 6 } = {}) {
  const channels = colorType === 6 ? 4 : 3;
  const stride = width * channels;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    for (let x = 0; x < width; x++) {
      const s = (y * width + x) * 4;
      const d = y * (stride + 1) + 1 + x * channels;
      raw[d] = rgba[s];
      raw[d + 1] = rgba[s + 1];
      raw[d + 2] = rgba[s + 2];
      if (channels === 4) raw[d + 3] = rgba[s + 3];
    }
  }
  const chunk = (type, body) => {
    const out = Buffer.alloc(12 + body.length);
    out.writeUInt32BE(body.length, 0);
    out.write(type, 4, "ascii");
    body.copy(out, 8);
    out.writeInt32BE(crc32(out.subarray(4, 8 + body.length)) | 0, 8 + body.length);
    return out;
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = colorType;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return c ^ -1;
}

// A small canvas whose geometry mirrors the real one: a region across the full width at
// the top, and plenty of rows below it that must stay exact.
const W = 40;
const H = 60;
const REGION = { left: 0, top: 0, right: 40, bottom: 20 };

function blank() {
  const px = Buffer.alloc(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    px[i * 4] = 100;
    px[i * 4 + 1] = 110;
    px[i * 4 + 2] = 120;
    px[i * 4 + 3] = 255;
  }
  return px;
}
const at = (x, y) => (y * W + x) * 4;

function pair(mutate, opts) {
  const a = blank();
  const b = blank();
  mutate(b);
  return [encodePng(W, H, a, opts), encodePng(W, H, b, opts)];
}

const SMALL_POLICY = { ...POLICY, declaredBounds: REGION };

// ── The policy block itself ──────────────────────────────────────────────────

test("the active policy registry is empty, so the current active tolerance count is zero", () => {
  // The headline guarantee of the ruling, asserted as a number rather than described
  // in a comment. If anything ever lands here again it fails this line first.
  assert.equal(RASTER_POLICIES.length, 0);
});

test("the historical record keeps the retired entry with its bounds and ceilings unchanged", () => {
  assert.equal(HISTORICAL_RASTER_OBSERVATIONS.length, 1);
  const p = HISTORICAL_RASTER_OBSERVATIONS[0];
  assert.equal(p.id, "curated-readout-mobile-header-raster-v1");
  assert.equal(p.status, "OBSERVED_AGAINST_SUPERSEDED_BASELINE");
  assert.equal(p.applicability, "HISTORICAL_NOT_APPLICABLE");
  assert.equal(p.scenario, "curated-readout");
  assert.equal(p.viewport, "mobile");
  assert.equal(p.selector, ".site-header");
  // Bounds unchanged since the observation. Ceilings never widened.
  assert.deepEqual(p.declaredBounds, { left: 0, top: 0, right: 1125, bottom: 236 });
  assert.equal(p.maxRgbDelta, 1);
  assert.equal(p.maxDifferingPixels, 600);
  assert.equal(p.observedDifferingPixels, 477);
  // It names the commit that repainted the baseline beneath it, so the reason it is
  // retired is readable from the entry rather than from a changelog.
  assert.equal(p.supersededBy, "abe1914d516a4da2d8eb42ed9548719de1be7414");
});

test("no scenario at any viewport can invoke a policy", () => {
  // Every board state resolves to null, which is what sends it down the byte-exact
  // path. The scenario the entry was written for resolves to null like all the rest:
  // a retired observation must not become a live allowance by being findable.
  assert.equal(resolvePolicy("curated-readout", "mobile"), null);
  assert.equal(resolvePolicy("curated-readout", "desktop"), null);
  assert.equal(resolvePolicy("single-findings", "mobile"), null);
  assert.equal(resolvePolicy("paired-matched", "mobile"), null);
  assert.equal(resolvePolicy("public-example", "mobile"), null);
  assert.equal(resolvePolicy("single-empty", "mobile"), null);
});

test("the historical entry is not reachable through the resolver", () => {
  // Belt and braces on the line above: resolving by the retired entry's own fields
  // must still miss, so moving it back into reach has to be a deliberate edit.
  const p = HISTORICAL_RASTER_OBSERVATIONS[0];
  assert.equal(resolvePolicy(p.scenario, p.viewport), null);
});

test("device-pixel conversion floors left and top and ceils right and bottom", () => {
  // Conservative in one direction only: the region may grow outward to whole pixels,
  // never inward, so no part of the filtered box can fall outside it and get compared
  // byte-exact by accident.
  const b = toDeviceBounds({ left: 0.4, top: 0.6, right: 10.1, bottom: 78.594 }, 3);
  assert.deepEqual(b, { left: 1, top: 1, right: 31, bottom: 236 });
  // The declared bounds are this tree's own geometry under that same rule.
  assert.deepEqual(
    toDeviceBounds({ left: 0, top: 0, right: 375, bottom: 78.594 }, 3),
    POLICY.declaredBounds
  );
});

// ── The real observed frame ──────────────────────────────────────────────────

const FIXTURE = JSON.parse(
  fs.readFileSync(path.join(HERE, "fixtures/curated-readout-mobile-alternate-raster.json"), "utf8")
);
// The pixels the frame was observed against, pinned. NOT the live baseline: FD-1
// repainted that, and reconstructing against today's pixels would be inventing a frame
// nobody rendered. Only the declared region is committed, not the full page — enough to
// reconstruct, and small enough that it is plainly test provenance rather than a second
// baseline. It sits under test/fixtures/ so no board run and no manifest pass can reach it.
const HISTORICAL_BAND_PATH = path.join(
  REPO_ROOT,
  "test/fixtures/curated-readout-mobile-header-band-superseded.png"
);
const LIVE_BASELINE_PATH = path.join(
  REPO_ROOT,
  "docs/qa/visual-acceptance-harness/curated-readout--mobile.png"
);

function applyDeltas(frame, originX, originY) {
  const px = Buffer.from(frame.data);
  let clamped = 0;
  for (const [x, y, dr, dg, db] of FIXTURE.deltas) {
    const p = ((y - originY) * frame.width + (x - originX)) * 4;
    for (const [off, d] of [[0, dr], [1, dg], [2, db]]) {
      const v = px[p + off] + d;
      if (v < 0 || v > 255) clamped++;
      px[p + off] = v;
    }
  }
  return { width: frame.width, height: frame.height, data: px, clamped };
}

// The alternate frame is rebuilt from the pinned historical band plus the exact signed
// deltas recorded when it was observed, rather than committed, because it must never
// exist in this tree as a second full-frame image: it is an observation, not a baseline.
// The pixel hash assertion below is what makes the reconstruction worth trusting.
function reconstructAlternateBand() {
  return applyDeltas(decodePng(fs.readFileSync(HISTORICAL_BAND_PATH)), 0, 0);
}

// ── 1. The historical observation, against the pixels it was observed on ─────

test("the pinned historical asset is the exact crop the fixture says it is", () => {
  const buf = fs.readFileSync(HISTORICAL_BAND_PATH);
  const a = FIXTURE.historical_baseline_asset;
  assert.equal(buf.length, a.bytes);
  assert.equal(createHash("sha256").update(buf).digest("hex"), a.sha256);
  const decoded = decodePng(buf);
  assert.equal(decoded.width, a.width);
  assert.equal(decoded.height, a.height);
  assert.equal(createHash("sha256").update(decoded.data).digest("hex"), a.pixel_sha256);
  // The crop is a derived artifact, so the fixture records what it was derived from.
  // These are the coordinates the region was cut at, and they are the declared bounds.
  const c = FIXTURE.extraction_chain.crop_bounds;
  assert.deepEqual(c, POLICY.declaredBounds);
  assert.equal(decoded.width, c.right - c.left);
  assert.equal(decoded.height, c.bottom - c.top);
  assert.equal(FIXTURE.extraction_chain.source_path, "docs/qa/visual-acceptance-harness/curated-readout--mobile.png");
  assert.match(FIXTURE.extraction_chain.source_commit, /^[0-9a-f]{40}$/);
  assert.match(FIXTURE.extraction_chain.source_blob_oid, /^[0-9a-f]{40}$/);
});

test("the observed alternate frame reconstructs from the historical asset", () => {
  const alt = reconstructAlternateBand();
  // Nothing saturates. If a channel clamped, the recorded delta would not be recoverable
  // and the reconstruction would be a lossy guess wearing an exact hash.
  assert.equal(alt.clamped, 0, "a channel clamped while reconstructing");
  assert.equal(
    createHash("sha256").update(alt.data).digest("hex"),
    FIXTURE.reconstructed_band_pixel_sha256,
    "reconstruction does not reproduce the observed frame's pixels"
  );
});

test("the observed alternate frame passes the ceilings it was measured against", () => {
  // What this shows is that the retired entry's numbers do describe the frame that was
  // seen. It is a statement about the historical pair only. Neither image here is a
  // baseline the board compares anything to.
  const base = fs.readFileSync(HISTORICAL_BAND_PATH);
  const alt = reconstructAlternateBand();
  const altPng = encodePng(alt.width, alt.height, alt.data, { colorType: 6 });

  const report = comparePolicy(POLICY, base, altPng, RESOLVED);
  assert.equal(report.result, "pass", formatPolicyReport(report));
  assert.equal(report.different_pixels_total, 477);
  assert.equal(report.different_pixels_inside, 477);
  assert.equal(report.different_pixels_outside, 0);
  assert.equal(report.max_rgb_delta, 1);
  assert.equal(report.alpha_differences, 0);
});

test("the observed frame's damage stops inside the header, which is why the region was drawn there", () => {
  // If this ever stops being true the diagnosis was wrong and the region was pointed at
  // the wrong element, which matters more than a red run.
  assert.equal(FIXTURE.differing_pixels, 477);
  assert.equal(FIXTURE.deltas.length, 477);
  assert.ok(FIXTURE.bbox.y1 < POLICY.declaredBounds.bottom, "damage extends past the declared region");
  // Every recorded delta, not just the bounding box corners, sits inside the region.
  // The bbox is a summary; this is the thing the bbox summarises.
  const d = POLICY.declaredBounds;
  let outside = 0;
  let maxAbs = 0;
  for (const [x, y, dr, dg, db] of FIXTURE.deltas) {
    if (x < d.left || x >= d.right || y < d.top || y >= d.bottom) outside++;
    maxAbs = Math.max(maxAbs, Math.abs(dr), Math.abs(dg), Math.abs(db));
  }
  assert.equal(outside, 0);
  assert.equal(maxAbs, FIXTURE.observed_ceilings.max_rgb_delta);
});

test("the unretained source frame is marked as unretained rather than described as a file", () => {
  // The frame itself was never committed, so this hash names something that cannot be
  // produced. The marker says so. A future variance retains the frame file instead.
  assert.equal(FIXTURE.source_frame_bytes, 297032);
  assert.ok(FIXTURE.source_frame_sha256.startsWith("4219e938"));
  assert.equal(FIXTURE.source_frame_sha256_marker, "HASH_OF_UNRETAINED_OBSERVATION");
  assert.equal(FIXTURE.status, "OBSERVED_AGAINST_SUPERSEDED_BASELINE");
  assert.equal(FIXTURE.applicability_to_current_baseline, "HISTORICAL_NOT_APPLICABLE");
});

// ── 2. The current baseline, which inherits none of it ───────────────────────

test("the current baseline is not the frame the observation was made against", () => {
  // The whole ruling in one assertion. The live baseline's masthead band is different
  // pixels now, so the observation describes a picture the board no longer produces.
  const live = decodePng(fs.readFileSync(LIVE_BASELINE_PATH));
  const d = POLICY.declaredBounds;
  const w = d.right - d.left;
  const band = Buffer.alloc(w * (d.bottom - d.top) * 4);
  for (let y = d.top; y < d.bottom; y++) {
    const s = (y * live.width + d.left) * 4;
    live.data.copy(band, (y - d.top) * w * 4, s, s + w * 4);
  }
  assert.notEqual(
    createHash("sha256").update(band).digest("hex"),
    FIXTURE.historical_baseline_asset.pixel_sha256,
    "the live baseline matches the superseded asset; the supersession record is wrong"
  );
});

test("the recorded deltas do not transfer to the current baseline", () => {
  // Applying them still produces a bit pattern, and no channel clamps. That proves
  // nothing: it is arithmetic on pixels nobody rendered. The frame it makes is not the
  // frame that was observed, and this test exists to keep that visible rather than
  // letting "the deltas still fit" read as "the observation still holds".
  const live = decodePng(fs.readFileSync(LIVE_BASELINE_PATH));
  const synthetic = applyDeltas(live, 0, 0);
  assert.notEqual(
    createHash("sha256").update(synthetic.data).digest("hex"),
    FIXTURE.reconstructed_pixel_sha256,
    "synthesising the observation onto the current baseline reproduced the observed hash"
  );
});

// ── Each way of being worse than that frame ──────────────────────────────────

test("a per-channel delta of 2 fails", () => {
  const [a, b] = pair((px) => {
    px[at(5, 5)] += 2;
  });
  const report = comparePolicy(SMALL_POLICY, a, b, REGION);
  assert.equal(report.result, "fail");
  assert.equal(report.max_rgb_delta, 2);
  assert.ok(report.errors.includes(POLICY_ERRORS.RGB_DELTA_EXCEEDED));
});

test("a per-channel delta of 1 in the same place passes", () => {
  // The companion to the test above: the ceiling is the only thing that moved.
  const [a, b] = pair((px) => {
    px[at(5, 5)] += 1;
  });
  const report = comparePolicy(SMALL_POLICY, a, b, REGION);
  assert.equal(report.result, "pass", formatPolicyReport(report));
  assert.equal(report.max_rgb_delta, 1);
});

test("601 differing pixels fail and 600 pass", () => {
  const paint = (n) => (px) => {
    for (let i = 0; i < n; i++) {
      const x = i % W;
      const y = Math.floor(i / W);
      px[at(x, y)] += 1;
    }
  };
  // 600 pixels need 15 rows of 40, well inside the 20-row region.
  const [a600, b600] = pair(paint(600));
  const ok = comparePolicy(SMALL_POLICY, a600, b600, REGION);
  assert.equal(ok.result, "pass", formatPolicyReport(ok));
  assert.equal(ok.different_pixels_inside, 600);

  const [a601, b601] = pair(paint(601));
  const bad = comparePolicy(SMALL_POLICY, a601, b601, REGION);
  assert.equal(bad.result, "fail");
  assert.equal(bad.different_pixels_inside, 601);
  assert.ok(bad.errors.includes(POLICY_ERRORS.PIXEL_COUNT_EXCEEDED));
});

test("one changed pixel outside the resolved region fails", () => {
  // One pixel, one channel, delta 1 — the smallest possible change, below every other
  // ceiling. Position is the only thing wrong with it, and position is enough.
  const [a, b] = pair((px) => {
    px[at(5, REGION.bottom)] += 1;
  });
  const report = comparePolicy(SMALL_POLICY, a, b, REGION);
  assert.equal(report.result, "fail");
  assert.equal(report.different_pixels_outside, 1);
  assert.equal(report.different_pixels_inside, 0);
  assert.deepEqual(report.first_outside_pixel, { x: 5, y: REGION.bottom });
  assert.ok(report.errors.includes(POLICY_ERRORS.PIXEL_OUTSIDE_REGION));
});

test("no differing pixel may sit below the region's bottom edge", () => {
  // The last row inside is exempt; the first row below it is not. The boundary is
  // half-open, and this is the test that says which side each row is on.
  const inside = pair((px) => {
    px[at(20, REGION.bottom - 1)] += 1;
  });
  assert.equal(comparePolicy(SMALL_POLICY, inside[0], inside[1], REGION).result, "pass");

  const below = pair((px) => {
    px[at(20, H - 1)] += 1;
  });
  const report = comparePolicy(SMALL_POLICY, below[0], below[1], REGION);
  assert.equal(report.result, "fail");
  assert.ok(report.errors.includes(POLICY_ERRORS.PIXEL_OUTSIDE_REGION));
});

test("one changed alpha value fails", () => {
  const [a, b] = pair(
    (px) => {
      px[at(5, 5) + 3] = 254;
    },
    { colorType: 6 }
  );
  const report = comparePolicy(SMALL_POLICY, a, b, REGION);
  assert.equal(report.result, "fail");
  assert.equal(report.alpha_differences, 1);
  assert.equal(report.max_rgb_delta, 0);
  assert.ok(report.errors.includes(POLICY_ERRORS.ALPHA_CHANGED));
});

test("changed dimensions fail", () => {
  const a = encodePng(W, H, blank());
  const b = encodePng(W, H + 1, Buffer.alloc(W * (H + 1) * 4));
  const report = comparePolicy(SMALL_POLICY, a, b, REGION);
  assert.equal(report.result, "fail");
  assert.ok(report.errors.includes(POLICY_ERRORS.DIMENSIONS_CHANGED));
  assert.deepEqual(report.dimensions, { baseline: [W, H], fresh: [W, H + 1] });
});

test("resolved bounds larger than the declared bounds fail with the named error", () => {
  // Growth is the direction that matters. An element that got taller means a larger
  // exempt area, and an exemption that widens on its own is how a narrow allowance
  // becomes a general one with nobody deciding to do that.
  const a = encodePng(W, H, blank());
  for (const grown of [
    { ...REGION, bottom: REGION.bottom + 1 },
    { ...REGION, right: REGION.right + 1 },
    { ...REGION, left: REGION.left - 1 },
    { ...REGION, top: REGION.top - 1 },
  ]) {
    const report = comparePolicy(SMALL_POLICY, a, a, grown);
    assert.equal(report.result, "fail", `grown bounds accepted: ${JSON.stringify(grown)}`);
    assert.ok(report.errors.includes(POLICY_ERRORS.BOUNDS_EXCEED_DECLARED));
    assert.deepEqual(report.resolved_bounds, grown);
    assert.deepEqual(report.declared_bounds, REGION);
  }
});

test("shrinkage or movement within the declared bounds is reported, not failed", () => {
  const [a, b] = pair((px) => {
    px[at(5, 5)] += 1;
  });
  const shrunk = { left: 2, top: 2, right: REGION.right - 2, bottom: REGION.bottom - 2 };
  const report = comparePolicy(SMALL_POLICY, a, b, shrunk);
  assert.equal(report.result, "pass", formatPolicyReport(report));
  assert.deepEqual(report.resolved_bounds, shrunk);
  assert.deepEqual(report.declared_bounds, REGION);
});

test("an unresolvable region selector fails with the named error", () => {
  // Not a fallback to byte-exact comparison and not a skip. A broken selector that fell
  // back would keep passing on days the raster was clean, and the real failure would
  // surface much later wearing the wrong face.
  const a = encodePng(W, H, blank());
  const report = comparePolicy(SMALL_POLICY, a, a, null);
  assert.equal(report.result, "fail");
  assert.ok(report.errors.includes(POLICY_ERRORS.REGION_UNRESOLVED));
  assert.equal(report.resolved_bounds, null);
});

test("an undecodable image fails with the named error rather than throwing", () => {
  const a = encodePng(W, H, blank());
  const report = comparePolicy(SMALL_POLICY, a, Buffer.from("not a png at all"), REGION);
  assert.equal(report.result, "fail");
  assert.ok(report.errors.includes(POLICY_ERRORS.DECODE_FAILED));
});

// ── The decoder ──────────────────────────────────────────────────────────────

test("the decoder is pure: it reverses every filter type to the same pixels", () => {
  // Filter choice is an encoder decision that must not change a single compared value.
  // The real captures use adaptive filtering; these fixtures pin the arithmetic.
  const width = 8;
  const height = 5;
  const rgba = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    rgba[i * 4] = (i * 7) & 0xff;
    rgba[i * 4 + 1] = (i * 13) & 0xff;
    rgba[i * 4 + 2] = (i * 29) & 0xff;
    rgba[i * 4 + 3] = 255;
  }
  const stride = width * 3;
  for (const filter of [0, 1, 2, 3, 4]) {
    const raw = Buffer.alloc((stride + 1) * height);
    // Encode by applying the filter forward, then let the decoder undo it.
    for (let y = 0; y < height; y++) {
      raw[y * (stride + 1)] = filter;
      for (let x = 0; x < stride; x++) {
        const cur = rgba[(y * width + Math.floor(x / 3)) * 4 + (x % 3)];
        const a = x >= 3 ? rgba[(y * width + Math.floor((x - 3) / 3)) * 4 + (x % 3)] : 0;
        const b = y > 0 ? rgba[((y - 1) * width + Math.floor(x / 3)) * 4 + (x % 3)] : 0;
        const c = y > 0 && x >= 3 ? rgba[((y - 1) * width + Math.floor((x - 3) / 3)) * 4 + (x % 3)] : 0;
        let sub;
        if (filter === 0) sub = cur;
        else if (filter === 1) sub = cur - a;
        else if (filter === 2) sub = cur - b;
        else if (filter === 3) sub = cur - ((a + b) >> 1);
        else {
          const p = a + b - c;
          const pa = Math.abs(p - a);
          const pb = Math.abs(p - b);
          const pc = Math.abs(p - c);
          sub = cur - (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
        }
        raw[y * (stride + 1) + 1 + x] = sub & 0xff;
      }
    }
    const chunk = (type, body) => {
      const out = Buffer.alloc(12 + body.length);
      out.writeUInt32BE(body.length, 0);
      out.write(type, 4, "ascii");
      body.copy(out, 8);
      out.writeInt32BE(crc32(out.subarray(4, 8 + body.length)) | 0, 8 + body.length);
      return out;
    };
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8;
    ihdr[9] = 2;
    const png = Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk("IHDR", ihdr),
      chunk("IDAT", zlib.deflateSync(raw)),
      chunk("IEND", Buffer.alloc(0)),
    ]);
    const got = decodePng(png);
    assert.equal(got.width, width);
    assert.equal(got.height, height);
    assert.ok(got.data.equals(rgba), `filter ${filter} did not round-trip`);
  }
});

test("the decoder widens RGB and RGBA to the same canonical representation", () => {
  const px = blank();
  const rgb = decodePng(encodePng(W, H, px, { colorType: 2 }));
  const rgba = decodePng(encodePng(W, H, px, { colorType: 6 }));
  assert.ok(rgb.data.equals(rgba.data));
  assert.equal(rgb.data[3], 255);
});

test("the real baseline decodes to the dimensions the board captures", () => {
  // A decoder test, not a policy one: the fixtures above are all filter-type 0, and a
  // real Chromium capture is not. This is the only place the decoder meets one.
  const img = decodePng(fs.readFileSync(LIVE_BASELINE_PATH));
  assert.equal(img.width, 1125);
  assert.equal(img.height, 2436);
  assert.equal(img.data.length, 1125 * 2436 * 4);
});

// ── The report ───────────────────────────────────────────────────────────────

test("the report carries every named field, and the formatted output spells each one out", () => {
  const [a, b] = pair((px) => {
    px[at(5, 5)] += 1;
  });
  const report = comparePolicy(SMALL_POLICY, a, b, REGION);
  for (const field of [
    "policy_id",
    "selector",
    "declared_bounds",
    "resolved_bounds",
    "different_pixels_total",
    "different_pixels_inside",
    "different_pixels_outside",
    "max_rgb_delta",
    "alpha_differences",
    "result",
  ]) {
    assert.ok(field in report, `report is missing ${field}`);
    // Abbreviating a label to save a column would mean a reviewer grepping a run for
    // the named field finds nothing.
    assert.match(formatPolicyReport(report), new RegExp(`^\\s*${field}\\s*:`, "m"));
  }
});

// The manifest is the record a reviewer reads instead of the code. If the registry and
// that record can disagree, the record is the one that goes wrong, and it goes wrong
// silently — the board still passes, and the document quietly describes a comparison
// nobody is running. Asserting both directions is the point: naming a policy that does
// not exist is the same defect as omitting one that does.
test("the generated manifest names a raster policy exactly when the registry holds one", () => {
  const withPolicy = renderComparisonPolicySection(RASTER_POLICIES).join("\n");
  for (const p of RASTER_POLICIES) {
    assert.ok(
      withPolicy.includes(p.id),
      `manifest text omits policy id ${p.id}, which the registry contains`
    );
    assert.ok(withPolicy.includes(`${p.scenario}--${p.viewport}`));
    assert.ok(withPolicy.includes(String(p.maxDifferingPixels)));
  }

  const withoutPolicy = renderComparisonPolicySection([]).join("\n");
  for (const p of RASTER_POLICIES) {
    assert.ok(
      !withoutPolicy.includes(p.id),
      `manifest text names policy id ${p.id} with an empty registry`
    );
  }
  // An empty registry has to say so rather than fall silent, or a manifest generated
  // after the exemption was removed reads identically to one generated before it existed.
  assert.match(withoutPolicy, /byte-for-byte/);
  assert.match(withoutPolicy, /no exception/i);
});
