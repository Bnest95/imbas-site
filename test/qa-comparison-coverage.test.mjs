// Guardrail: a skipped comparison is not a passed comparison.
// Run: node --test test/qa-comparison-coverage.test.mjs
//
// The defect this closes: a board run compared 62 of 62 DOM snapshots, 0 of 62 images,
// skipped every image because the available browser was HeadlessChrome 147 while the
// committed baselines require 148, exited 0, and printed "no regressions — every
// snapshot and image matches its baseline." Every one of those statements was true about
// what the run looked at, and the run looked at no pixels at all.
//
// The invariant is therefore counted, not reasoned about: expected_images ===
// compared_images and expected_snapshots === compared_snapshots, with expected taken
// from the scenario registry and compared taken from comparisons that actually ran.
// Nothing here special-cases the browser mismatch — the general fail-open condition is
// what is under test, because the next cause will not be a version number.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { createHash } from "node:crypto";

import { runDiff, expectedInventory, baselineBrowserIdentity } from "../scripts/qa/visual-acceptance.mjs";
import { serializeSnapshot } from "../scripts/qa/snapshot.mjs";
import { SCENARIOS } from "../scripts/qa/scenarios.mjs";

const sha256 = (b) => createHash("sha256").update(b).digest("hex");

// ── Real PNG bytes, so a comparison compares images rather than strings ───────
function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return (c ^ -1) >>> 0;
}
function encodePng(width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const chunk = (type, body) => {
    const out = Buffer.alloc(12 + body.length);
    out.writeUInt32BE(body.length, 0);
    out.write(type, 4, "ascii");
    body.copy(out, 8);
    out.writeUInt32BE(crc32(out.subarray(4, 8 + body.length)), 8 + body.length);
    return out;
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
const W = 8;
const H = 6;
function png(tint = 0) {
  const px = Buffer.alloc(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    px[i * 4] = 40 + tint;
    px[i * 4 + 1] = 50;
    px[i * 4 + 2] = 60;
    px[i * 4 + 3] = 255;
  }
  return encodePng(W, H, px);
}
const BASELINE_PNG = png(0);
const OTHER_PNG = png(7);

// Two registered, drivable scenarios at one viewport: a two-entry board, so "one
// skipped" and "all skipped" are different states rather than the same state.
const NAMES = ["curated-readout", "single-findings"];
const VIEWPORT = "mobile";
const BROWSER = "HeadlessChrome/148.0.7778.96";
const ENV = {
  browser_version: BROWSER,
  viewport: "375x812",
  device_scale_factor: "3",
  mobile_emulation: "true",
};

const EXPECTED = expectedInventory({ names: NAMES, viewports: [VIEWPORT] });
const snapshotFor = (env = ENV) => serializeSnapshot({ env, payload: {}, lines: ['h2 "MEASUREMENT"'] });

function resultFor(scenario, { buf = BASELINE_PNG, env = ENV } = {}) {
  const id = `${scenario}--${VIEWPORT}`;
  return {
    filename: `${id}.png`,
    snapshotFilename: `${id}.snapshot.txt`,
    buf,
    snapshotText: snapshotFor(env),
    sha256: sha256(buf),
    bytes: buf.length,
    env,
    policy: null,
    rasterRegion: null,
  };
}

// A board directory holding an accepted baseline per expected entry.
function bench({ baselineEnv = ENV } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "imbas-coverage-"));
  const outDir = path.join(root, "board");
  fs.mkdirSync(outDir, { recursive: true });
  for (const { id } of EXPECTED) {
    fs.writeFileSync(path.join(outDir, `${id}.png`), BASELINE_PNG);
    fs.writeFileSync(path.join(outDir, `${id}.snapshot.txt`), snapshotFor(baselineEnv));
  }
  return { root, outDir, quarantineRoot: path.join(root, "quarantine") };
}

function diffRun(outDir, results, quarantineRoot, opts = {}) {
  const priorExit = process.exitCode;
  const priorLog = console.log;
  const lines = [];
  console.log = (...a) => lines.push(a.join(" "));
  try {
    process.exitCode = undefined;
    const verdict = runDiff(outDir, results, {
      quarantineRoot,
      expected: EXPECTED,
      resolvedBrowser: BROWSER,
      ...opts,
    });
    return { exitCode: process.exitCode, output: lines.join("\n"), verdict };
  } finally {
    console.log = priorLog;
    process.exitCode = priorExit;
  }
}

// The exact sentence the 0-of-62 run printed. Asserted as a pattern rather than by
// counting, because the all-clear is the artifact a reader acts on.
const ALL_CLEAR = /✓ no regressions/;

// ── Images: the eligible-to-pass case ────────────────────────────────────────

test("a run that compared every expected image is eligible to pass", () => {
  const { outDir, quarantineRoot } = bench();
  const { exitCode, output, verdict } = diffRun(
    outDir,
    NAMES.map((n) => resultFor(n)),
    quarantineRoot
  );

  assert.equal(exitCode, undefined);
  assert.equal(verdict.ok, true);
  assert.equal(verdict.expected, 2);
  assert.equal(verdict.comparedImages, 2);
  assert.equal(verdict.comparedSnapshots, 2);
  assert.deepEqual(verdict.uncompared, []);
  assert.match(output, ALL_CLEAR);
});

// ── Images: one skipped ──────────────────────────────────────────────────────

test("one skipped image exits non-zero and the all-clear cannot print", () => {
  const { outDir, quarantineRoot } = bench();
  // The real mechanism: one capture ran under a browser the baseline was not taken at.
  const results = [
    resultFor(NAMES[0]),
    resultFor(NAMES[1], { env: { ...ENV, browser_version: "HeadlessChrome/147.0.7727.15" } }),
  ];
  const { exitCode, output, verdict } = diffRun(outDir, results, quarantineRoot);

  assert.equal(exitCode, 1);
  assert.equal(verdict.ok, false);
  assert.equal(verdict.comparedImages, 1);
  assert.equal(verdict.expected, 2);
  assert.doesNotMatch(output, ALL_CLEAR);
  // The counts are stated, not left for a reader to derive from skip lines.
  assert.match(output, /images:\s+1 compared of 2 expected/);
  // And the skipped scenario is named with its reason.
  assert.equal(verdict.uncompared.length, 1);
  assert.equal(verdict.uncompared[0].id, `${NAMES[1]}--${VIEWPORT}`);
  assert.equal(verdict.uncompared[0].layer, "image");
  assert.match(verdict.uncompared[0].reason, /browser_version differs/);
  assert.match(output, new RegExp(`${NAMES[1]}--${VIEWPORT}\\s+\\[image\\]`));
});

// ── Images: all skipped — the run that shipped ───────────────────────────────

test("every image skipped exits non-zero even though every snapshot matched", () => {
  const { outDir, quarantineRoot } = bench();
  const stale = { ...ENV, browser_version: "HeadlessChrome/147.0.7727.15" };
  const { exitCode, output, verdict } = diffRun(
    outDir,
    NAMES.map((n) => resultFor(n, { env: stale })),
    quarantineRoot
  );

  // This is the shape of the run that exited 0: snapshots all compared, all identical,
  // no differences found, and not one pixel looked at.
  assert.equal(verdict.comparedSnapshots, 2);
  assert.equal(verdict.changed, 0);
  assert.equal(verdict.missing, 0);
  assert.equal(verdict.comparedImages, 0);
  assert.equal(exitCode, 1);
  assert.equal(verdict.ok, false);
  assert.doesNotMatch(output, ALL_CLEAR);
  assert.match(output, /images:\s+0 compared of 2 expected/);
  assert.match(output, /did not compare what it is supposed to compare/);
});

test("a skipped image is not reported in language that reads like a pass", () => {
  const { outDir, quarantineRoot } = bench();
  const stale = { ...ENV, browser_version: "HeadlessChrome/147.0.7727.15" };
  const { output } = diffRun(outDir, [resultFor(NAMES[0], { env: stale }), resultFor(NAMES[1])], quarantineRoot);
  // "– image: skipped (…)" read as an intentional, benign exclusion. It was a hole.
  assert.doesNotMatch(output, /– image: skipped/);
  assert.match(output, /image: NOT COMPARED/);
});

// ── Snapshots: the same four ─────────────────────────────────────────────────

test("a run that compared every expected snapshot is eligible to pass", () => {
  const { outDir, quarantineRoot } = bench();
  const { verdict } = diffRun(
    outDir,
    NAMES.map((n) => resultFor(n)),
    quarantineRoot
  );
  assert.equal(verdict.comparedSnapshots, verdict.expected);
  assert.equal(verdict.ok, true);
});

test("one uncompared snapshot exits non-zero and the all-clear cannot print", () => {
  const { outDir, quarantineRoot } = bench();
  fs.rmSync(path.join(outDir, `${NAMES[1]}--${VIEWPORT}.snapshot.txt`));
  const { exitCode, output, verdict } = diffRun(
    outDir,
    NAMES.map((n) => resultFor(n)),
    quarantineRoot
  );

  assert.equal(exitCode, 1);
  assert.equal(verdict.comparedSnapshots, 1);
  assert.equal(verdict.expected, 2);
  assert.doesNotMatch(output, ALL_CLEAR);
  assert.match(output, /snapshots:\s+1 compared of 2 expected/);
});

test("every snapshot uncompared exits non-zero", () => {
  const { outDir, quarantineRoot } = bench();
  for (const { id } of EXPECTED) fs.rmSync(path.join(outDir, `${id}.snapshot.txt`));
  const { exitCode, output, verdict } = diffRun(
    outDir,
    NAMES.map((n) => resultFor(n)),
    quarantineRoot
  );

  assert.equal(exitCode, 1);
  assert.equal(verdict.comparedSnapshots, 0);
  assert.equal(verdict.comparedImages, 0);
  assert.doesNotMatch(output, ALL_CLEAR);
  assert.match(output, /snapshots:\s+0 compared of 2 expected/);
});

test("an unreadable baseline snapshot is uncompared, not quietly passed", () => {
  const { outDir, quarantineRoot } = bench();
  fs.writeFileSync(path.join(outDir, `${NAMES[0]}--${VIEWPORT}.snapshot.txt`), "not a snapshot at all");
  const { exitCode, verdict } = diffRun(
    outDir,
    NAMES.map((n) => resultFor(n)),
    quarantineRoot
  );
  assert.equal(exitCode, 1);
  assert.equal(verdict.comparedSnapshots, 1);
  assert.ok(verdict.uncompared.some((u) => u.id === `${NAMES[0]}--${VIEWPORT}` && u.layer === "snapshot"));
});

// ── Expected comes from the registry, not from what the run attempted ────────

test("a scenario the run never attempted still counts as expected and uncompared", () => {
  const { outDir, quarantineRoot } = bench();
  // The hole one level down: a scenario dropped before it registers an attempt cannot
  // log a skip line, so a count taken from the run would never miss it.
  const { exitCode, output, verdict } = diffRun(outDir, [resultFor(NAMES[0])], quarantineRoot);

  assert.equal(exitCode, 1);
  assert.equal(verdict.expected, 2);
  assert.equal(verdict.comparedImages, 1);
  assert.equal(verdict.comparedSnapshots, 1);
  assert.doesNotMatch(output, ALL_CLEAR);
  assert.ok(
    verdict.uncompared.some(
      (u) => u.id === `${NAMES[1]}--${VIEWPORT}` && /produced no capture/.test(u.reason)
    ),
    "the scenario that never ran is named"
  );
});

test("a run with no results at all cannot pass", () => {
  const { outDir, quarantineRoot } = bench();
  const { exitCode, output, verdict } = diffRun(outDir, [], quarantineRoot);
  assert.equal(exitCode, 1);
  assert.equal(verdict.comparedImages, 0);
  assert.equal(verdict.comparedSnapshots, 0);
  assert.doesNotMatch(output, ALL_CLEAR);
});

test("expected is the registry projection, so it does not move when a run does", () => {
  // Same inventory whatever any run produces: two names at one viewport is two entries,
  // sorted, and derived from SCENARIOS rather than from a results array.
  assert.deepEqual(
    EXPECTED.map((e) => e.id),
    [`curated-readout--${VIEWPORT}`, `single-findings--${VIEWPORT}`]
  );
  // And it is the same source the board uses to establish that there are 70. The
  // literal is written down rather than derived because deriving it from SCENARIOS
  // would make this assertion agree with any registry, including one that lost half
  // its scenarios. It moved from 62 when the dense acceptance record registered, and
  // from 64 to 70 when register-overflow, register-overflow-expanded and chip-arrival
  // were promoted off the pending registry — three scenarios at two viewports, and the
  // pending registry is empty behind them.
  const drivable = Object.keys(SCENARIOS).filter((n) => SCENARIOS[n].drivable);
  assert.equal(expectedInventory({ names: drivable, viewports: ["desktop", "mobile"] }).length, 70);
});

test("the inventory refuses a name the registry does not register", () => {
  assert.throws(() => expectedInventory({ names: ["no-such-scenario"], viewports: ["mobile"] }), /does not register/);
});

test("the inventory refuses a fixture-only scenario, which no run can photograph", () => {
  const fixtureOnly = Object.keys(SCENARIOS).find((n) => !SCENARIOS[n].drivable);
  if (!fixtureOnly) return;
  assert.throws(() => expectedInventory({ names: [fixtureOnly], viewports: ["mobile"] }), /fixture-only/);
});

test("a diff called with no inventory refuses to report a verdict", () => {
  const { outDir, quarantineRoot } = bench();
  assert.throws(
    () => runDiff(outDir, [resultFor(NAMES[0])], { quarantineRoot }),
    /no expected inventory/,
    "an unproven inventory must not be treated as a satisfied one"
  );
});

test("a capture the registry does not register cannot count toward coverage", () => {
  const { outDir, quarantineRoot } = bench();
  const stray = resultFor(NAMES[0]);
  stray.filename = `curated-readout--desktop.png`;
  stray.snapshotFilename = `curated-readout--desktop.snapshot.txt`;
  fs.writeFileSync(path.join(outDir, stray.filename), BASELINE_PNG);
  fs.writeFileSync(path.join(outDir, stray.snapshotFilename), snapshotFor());

  const { exitCode, output, verdict } = diffRun(
    outDir,
    [...NAMES.map((n) => resultFor(n)), stray],
    quarantineRoot
  );
  assert.equal(exitCode, 1);
  assert.deepEqual(verdict.unregistered, ["curated-readout--desktop"]);
  assert.doesNotMatch(output, ALL_CLEAR);
});

// ── Browser identity is reported, not only checked ───────────────────────────

test("the resolved browser and the version the baselines require are both reported on a pass", () => {
  const { outDir, quarantineRoot } = bench();
  const { output, verdict } = diffRun(
    outDir,
    NAMES.map((n) => resultFor(n)),
    quarantineRoot
  );
  assert.equal(verdict.ok, true);
  assert.equal(verdict.browser.resolved, BROWSER);
  assert.deepEqual(verdict.browser.required, [BROWSER]);
  assert.match(output, /resolved this run:\s+HeadlessChrome\/148\.0\.7778\.96/);
  assert.match(output, /baselines require:\s+HeadlessChrome\/148\.0\.7778\.96/);
  assert.match(output, /agreement:\s+match/);
});

test("a browser mismatch is stated as identity, not left to be inferred from skip lines", () => {
  const { outDir, quarantineRoot } = bench();
  const { output, verdict } = diffRun(
    outDir,
    NAMES.map((n) => resultFor(n)),
    quarantineRoot,
    { resolvedBrowser: "HeadlessChrome/147.0.7727.15" }
  );
  assert.equal(verdict.browser.resolved, "HeadlessChrome/147.0.7727.15");
  assert.deepEqual(verdict.browser.required, [BROWSER]);
  assert.match(output, /resolved this run:\s+HeadlessChrome\/147\.0\.7727\.15/);
  assert.match(output, /agreement:\s+MISMATCH/);
});

test("the required version is read back from the committed baselines, not written down", () => {
  const { outDir } = bench({ baselineEnv: { ...ENV, browser_version: "HeadlessChrome/151.0.7922.34" } });
  const identity = baselineBrowserIdentity(outDir, EXPECTED);
  assert.deepEqual(identity.required, ["HeadlessChrome/151.0.7922.34"]);
  assert.deepEqual(identity.unreadable, []);
});

test("the committed board records one browser version, and the harness can name it", () => {
  const drivable = Object.keys(SCENARIOS).filter((n) => SCENARIOS[n].drivable);
  const board = expectedInventory({ names: drivable, viewports: ["desktop", "mobile"] });
  const baselineDir = path.resolve(import.meta.dirname, "../docs/qa/visual-acceptance-harness");
  const identity = baselineBrowserIdentity(baselineDir, board);
  assert.deepEqual(identity.unreadable, [], "every committed baseline records the browser it was taken at");
  assert.equal(identity.required.length, 1, "the board is one browser build, not a mixture");
});
