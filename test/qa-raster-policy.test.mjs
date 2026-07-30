// Guardrail: the bounded renderer-noise comparison must accept exactly the diagnosed
// state and nothing wider.
// Run: node --test test/qa-raster-policy.test.mjs
//
// This policy is the only place in the harness where two different images can both be
// accepted, so it is the only place where a mistake produces a green run over a real
// regression. Every one of these tests exists to hold one edge of it: the real observed
// frame passes, and each way of being worse than that frame fails — a bigger channel
// delta, more pixels, a pixel outside the region, a touched alpha value, changed
// dimensions, a region that grew, a region that could not be found, and a second
// scenario trying to use the allowance.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

import {
  RASTER_POLICIES,
  POLICY_ERRORS,
  resolvePolicy,
  toDeviceBounds,
  decodePng,
  comparePolicy,
  formatPolicyReport,
} from "../scripts/qa/raster-policy.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "..");

const POLICY = resolvePolicy("curated-readout", "mobile");
// The resolved region this tree actually produces. Tests that are not about bounds use
// it so they exercise the same geometry a real run does.
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

test("the policy registry holds exactly one entry, bound to one scenario and viewport", () => {
  assert.equal(RASTER_POLICIES.length, 1);
  const p = RASTER_POLICIES[0];
  assert.equal(p.id, "curated-readout-mobile-header-raster-v1");
  assert.equal(p.scenario, "curated-readout");
  assert.equal(p.viewport, "mobile");
  assert.equal(p.selector, ".site-header");
  assert.equal(p.maxRgbDelta, 1);
  assert.equal(p.maxDifferingPixels, 600);
});

test("another scenario cannot invoke the policy", () => {
  // The allowance is not a tolerance the board can reach for. Every other board state
  // — including the same scenario at the other captured viewport — resolves to null,
  // which is what sends it down the byte-exact path.
  assert.equal(resolvePolicy("curated-readout", "desktop"), null);
  assert.equal(resolvePolicy("single-findings", "mobile"), null);
  assert.equal(resolvePolicy("paired-matched", "mobile"), null);
  assert.equal(resolvePolicy("public-example", "mobile"), null);
  assert.equal(resolvePolicy("single-empty", "mobile"), null);
  assert.ok(resolvePolicy("curated-readout", "mobile"));
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
const BASELINE_PATH = path.join(REPO_ROOT, "docs/qa/visual-acceptance-harness/curated-readout--mobile.png");

// The alternate frame is reconstructed from the accepted baseline plus the exact signed
// deltas recorded when it was observed. It is rebuilt rather than committed because it
// must never exist in this tree as a second full-frame image — it is an observation,
// not a baseline. The pixel hash assertion below is what makes the reconstruction
// worth trusting.
function reconstructAlternate() {
  const base = decodePng(fs.readFileSync(BASELINE_PATH));
  const px = Buffer.from(base.data);
  for (const [x, y, dr, dg, db] of FIXTURE.deltas) {
    const p = (y * base.width + x) * 4;
    px[p] = px[p] + dr;
    px[p + 1] = px[p + 1] + dg;
    px[p + 2] = px[p + 2] + db;
  }
  return { width: base.width, height: base.height, data: px };
}

test("the observed alternate frame passes the policy", () => {
  const base = fs.readFileSync(BASELINE_PATH);
  const alt = reconstructAlternate();
  assert.equal(
    createHash("sha256").update(alt.data).digest("hex"),
    FIXTURE.reconstructed_pixel_sha256,
    "reconstruction does not reproduce the observed frame's pixels"
  );
  const altPng = encodePng(alt.width, alt.height, alt.data, { colorType: 6 });

  const report = comparePolicy(POLICY, base, altPng, RESOLVED);
  assert.equal(report.result, "pass", formatPolicyReport(report));
  assert.equal(report.different_pixels_total, 477);
  assert.equal(report.different_pixels_inside, 477);
  assert.equal(report.different_pixels_outside, 0);
  assert.equal(report.max_rgb_delta, 1);
  assert.equal(report.alpha_differences, 0);
});

test("the observed frame's damage stops inside the header, which is why the region is drawn there", () => {
  // If this ever stops being true the diagnosis is wrong and the policy is pointed at
  // the wrong element — which is a bigger problem than a red run.
  assert.equal(FIXTURE.differing_pixels, 477);
  assert.ok(FIXTURE.bbox.y1 < POLICY.declaredBounds.bottom, "damage extends past the declared region");
  assert.equal(FIXTURE.source_frame_bytes, 297032);
  assert.ok(FIXTURE.source_frame_sha256.startsWith("4219e938"));
});

test("the real alternate frame file, when present, is the frame the fixture describes", () => {
  // Optional because .qa-scratch is not committed. It is an extra binding, never the
  // only proof: every assertion about the alternate frame above runs unconditionally.
  const p = path.join(REPO_ROOT, ".qa-scratch/framedump-297032-4219e938.png");
  if (!fs.existsSync(p)) return;
  const buf = fs.readFileSync(p);
  assert.equal(createHash("sha256").update(buf).digest("hex"), FIXTURE.source_frame_sha256);
  const decoded = decodePng(buf);
  assert.ok(decoded.data.equals(reconstructAlternate().data));
  const report = comparePolicy(POLICY, fs.readFileSync(BASELINE_PATH), buf, RESOLVED);
  assert.equal(report.result, "pass", formatPolicyReport(report));
  assert.equal(report.different_pixels_inside, 477);
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
  const img = decodePng(fs.readFileSync(BASELINE_PATH));
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
