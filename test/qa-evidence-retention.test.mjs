// Guardrail: a comparison that finds a differing frame must keep that frame.
// Run: node --test test/qa-evidence-retention.test.mjs
//
// The defect this closes: diff mode detected a difference, printed it, and destroyed the
// only artifact that had ever been observed. For a nondeterministic raster event that is
// unrecoverable — re-running produces a fresh observation, not the one that varied, which
// is how 4219e938 ended up naming a file nobody can produce.
//
// The load-bearing property is byte identity: what lands in quarantine must be the bytes
// the comparator read, not a re-render that happens to look the same. Every test below
// proves it by hash rather than by trusting the call order.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
  runDiff,
  retainDifferingFrame,
  observationsFor,
  pixelDifference,
  expectedInventory,
  QUARANTINE_DIR,
} from "../scripts/qa/visual-acceptance.mjs";
import { serializeSnapshot } from "../scripts/qa/snapshot.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "..");
const sha256 = (b) => createHash("sha256").update(b).digest("hex");

// ── A minimal PNG encoder, so a "differing frame" is real image bytes ─────────
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

const W = 16;
const H = 12;
function canvas(tweak) {
  const px = Buffer.alloc(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    px[i * 4] = 90;
    px[i * 4 + 1] = 100;
    px[i * 4 + 2] = 110;
    px[i * 4 + 3] = 255;
  }
  if (tweak) tweak(px);
  return px;
}
const BASELINE_PNG = encodePng(W, H, canvas());
// One pixel, one channel, delta 3 — the shape of a raster event rather than a repaint.
const CANDIDATE_PNG = encodePng(
  W,
  H,
  canvas((px) => {
    px[(4 * W + 6) * 4 + 1] += 3;
  })
);

// Every key in IMAGE_ENV_KEYS, because a baseline missing any of them makes diff mode
// skip the image comparison — correctly, but then these tests would assert retention
// against a comparison that never ran.
const ENV = {
  browser_version: "TestChrome/1",
  viewport: "375x812",
  device_scale_factor: "3",
  mobile_emulation: "true",
};
const SCENARIO_ID = "curated-readout--mobile";

// A capture result carrying the same fields diff mode reads. `buf` is the candidate: the
// bytes the comparator sees and, if it differs, the bytes that must be retained.
function resultFor(buf) {
  return {
    filename: `${SCENARIO_ID}.png`,
    snapshotFilename: `${SCENARIO_ID}.snapshot.txt`,
    buf,
    snapshotText: serializeSnapshot({ env: ENV, payload: {}, lines: ['h2 "MEASUREMENT"'] }),
    sha256: sha256(buf),
    bytes: buf.length,
    env: ENV,
    policy: null,
    rasterRegion: null,
  };
}

// A board directory holding an accepted baseline, plus a quarantine root, both disposable.
function bench() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "imbas-retention-"));
  const outDir = path.join(root, "board");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, `${SCENARIO_ID}.png`), BASELINE_PNG);
  fs.writeFileSync(
    path.join(outDir, `${SCENARIO_ID}.snapshot.txt`),
    serializeSnapshot({ env: ENV, payload: {}, lines: ['h2 "MEASUREMENT"'] })
  );
  return { root, outDir, quarantineRoot: path.join(root, "quarantine") };
}

// The one-entry board these tests run against, taken from the scenario registry the way
// the real board takes its 62 — so a comparison these tests skip is still counted.
const EXPECTED = expectedInventory({ names: ["curated-readout"], viewports: ["mobile"] });

// runDiff sets process.exitCode. Reading it without restoring would hand this suite's own
// exit status to the scenario under test, so the previous value goes back on the way out.
function diffRun(outDir, results, quarantineRoot, runId) {
  const priorExit = process.exitCode;
  const priorLog = console.log;
  const lines = [];
  console.log = (...a) => lines.push(a.join(" "));
  try {
    process.exitCode = undefined;
    runDiff(outDir, results, {
      quarantineRoot,
      expected: EXPECTED,
      resolvedBrowser: ENV.browser_version,
      ...(runId ? { runId } : {}),
    });
    return { exitCode: process.exitCode, output: lines.join("\n") };
  } finally {
    console.log = priorLog;
    process.exitCode = priorExit;
  }
}

const framesIn = (quarantineRoot) => {
  const dir = path.join(quarantineRoot, SCENARIO_ID);
  return fs.existsSync(dir) ? fs.readdirSync(dir).sort() : [];
};

// The observation records for one candidate. Read through the harness's own reader rather
// than by globbing here, so a test that passes proves the shipped reader finds them too.
const observations = (quarantineRoot, buf) =>
  observationsFor({ quarantineRoot, scenarioId: SCENARIO_ID, candidateSha256: sha256(buf) });

const readObservation = (o) => JSON.parse(fs.readFileSync(o.path, "utf8"));

// ── The difference case ──────────────────────────────────────────────────────

test("a differing frame is retained as the exact bytes that were compared", () => {
  const { outDir, quarantineRoot } = bench();
  const candidate = resultFor(CANDIDATE_PNG);
  const { exitCode, output } = diffRun(outDir, [candidate], quarantineRoot);

  // The verdict is unchanged: a difference is still a difference, still exit 1.
  assert.equal(exitCode, 1);
  assert.match(output, /image: bytes differ/);

  // The frame is content-addressed; its observation record is not, so the directory holds
  // one PNG named for the bytes and one JSON named for the run that saw them.
  const files = framesIn(quarantineRoot);
  assert.equal(files.length, 2, files.join(", "));
  assert.ok(files.includes(`${sha256(CANDIDATE_PNG)}.png`));
  const obs = observations(quarantineRoot, CANDIDATE_PNG);
  assert.equal(obs.length, 1);
  assert.ok(files.includes(obs[0].file));

  // The whole point, asserted as bytes rather than described: what was retained hashes to
  // what was compared. A re-render would land here with a different hash — or the same
  // hash for the wrong reason — and this line is what tells the two apart.
  const retained = fs.readFileSync(path.join(quarantineRoot, SCENARIO_ID, `${sha256(CANDIDATE_PNG)}.png`));
  assert.equal(sha256(retained), sha256(candidate.buf));
  assert.ok(retained.equals(candidate.buf));
});

test("the run says where it put the frame instead of saying nothing was written", () => {
  const { outDir, quarantineRoot } = bench();
  const { output } = diffRun(outDir, [resultFor(CANDIDATE_PNG)], quarantineRoot);
  // The old summary claimed nothing was written, which is now false and was the sentence
  // that made the loss look intentional.
  assert.doesNotMatch(output, /Nothing was written/);
  assert.match(output, /No baseline was written and nothing was accepted/);
  assert.match(output, /1 differing frame\(s\) retained/);
  assert.match(output, new RegExp(`⤷ retained .*${sha256(CANDIDATE_PNG)}\\.png`));
  // The run says where the circumstances went too, not only where the pixels went.
  assert.match(output, /observation .*\.json/);
});

test("the observation record names the baseline the frame differed from, and how it differed", () => {
  const { outDir, quarantineRoot } = bench();
  diffRun(outDir, [resultFor(CANDIDATE_PNG)], quarantineRoot);
  const obs = observations(quarantineRoot, CANDIDATE_PNG);
  assert.equal(obs.length, 1);
  const car = readObservation(obs[0]);

  assert.equal(car.scenario_id, SCENARIO_ID);
  assert.equal(car.candidate.sha256, sha256(CANDIDATE_PNG));
  assert.equal(car.candidate.bytes, CANDIDATE_PNG.length);
  assert.deepEqual(car.candidate.dimensions, [W, H]);

  assert.equal(car.baseline.sha256, sha256(BASELINE_PNG));
  assert.equal(car.baseline.bytes, BASELINE_PNG.length);
  assert.deepEqual(car.baseline.dimensions, [W, H]);
  // Blob identity, so the baseline is named by its bytes and not only by a path.
  assert.match(car.baseline.blob_oid, /^[0-9a-f]{40}$/);
  assert.match(car.baseline.head_commit, /^[0-9a-f]{40}$/);

  // One pixel moved by 3 on one channel — the numbers that separate a raster event from a
  // repaint, which is the judgement the retained frame exists to support.
  assert.equal(car.comparison.differing_pixels, 1);
  assert.equal(car.comparison.max_channel_delta, 3);

  // The observation block is what makes this one sighting rather than the sighting.
  assert.ok(car.observation.run_id, "no run identity");
  assert.match(car.observation.observed_at, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(car.observation.id, `${sha256(CANDIDATE_PNG)}.${car.observation.run_id}`);
  assert.equal(car.observation.prior_observations, 0, "the first sighting has no predecessor");
  assert.deepEqual(car.observation.prior_records, []);
  // One notion of a sidecar, not two: the superseded content-addressed key is gone rather
  // than shadowed by the observation block.
  assert.equal(car.run, undefined, "the old run block is still present alongside the new one");
  assert.equal(
    fs.existsSync(path.join(quarantineRoot, SCENARIO_ID, `${sha256(CANDIDATE_PNG)}.json`)),
    false,
    "a content-addressed sidecar was written; that is the path a recurrence overwrites",
  );
});

// ── The clean case ───────────────────────────────────────────────────────────

test("a clean run writes nothing at all", () => {
  const { outDir, quarantineRoot } = bench();
  const { exitCode, output } = diffRun(outDir, [resultFor(BASELINE_PNG)], quarantineRoot);

  assert.equal(exitCode, undefined, "a clean diff must not set a failing exit code");
  assert.match(output, /no regressions/);
  // Not merely "no frames": the quarantine root is never created on a clean run, so a
  // green board leaves no trace suggesting something was observed.
  assert.equal(fs.existsSync(quarantineRoot), false);
});

test("a missing baseline is not a comparison, so nothing is retained for it", () => {
  const { outDir, quarantineRoot } = bench();
  fs.rmSync(path.join(outDir, `${SCENARIO_ID}.png`));
  const { exitCode, output } = diffRun(outDir, [resultFor(CANDIDATE_PNG)], quarantineRoot);
  assert.equal(exitCode, 1);
  assert.match(output, /no baseline on disk/);
  assert.equal(fs.existsSync(quarantineRoot), false);
});

// ── Retention itself ─────────────────────────────────────────────────────────

// ── The negative control: a second sighting must not delete the first ────────
// This is the fixture for a defect that actually destroyed evidence. On 2026-08-11 a board
// run reproduced candidate 9dd34c00… and, because sidecars were keyed by candidate hash,
// its record replaced the 2026-08-10 sighting's in the working tree. The earlier record
// survives only because it had been archived out of the harness write path by hand.
//
// The test the old shape passed read "retaining the same observed frame twice lands on one
// path, not two", with the reasoning "the same bytes are the same evidence". The bytes are
// the same. The events are not, and the difference between them — which HEAD, which
// renderer, whether any renderer identity existed at all — lives only in the record that
// was being overwritten.

test("a second observation of the same frame keeps the first observation's record", () => {
  const { outDir, quarantineRoot } = bench();
  const first = "2026-08-10T17-43-54-825Z-aaaaaaaa";
  const second = "2026-08-11T18-40-23-385Z-bbbbbbbb";

  // Counted off the directory rather than through observationsFor, so this assertion holds
  // the harness to keeping two records even if the shipped reader is the thing that broke.
  const recordsOnDisk = () => framesIn(quarantineRoot).filter((f) => f.endsWith(".json"));

  diffRun(outDir, [resultFor(CANDIDATE_PNG)], quarantineRoot, first);
  assert.equal(recordsOnDisk().length, 1);
  const firstFile = recordsOnDisk()[0];
  const firstBytes = fs.readFileSync(path.join(quarantineRoot, SCENARIO_ID, firstFile));

  diffRun(outDir, [resultFor(CANDIDATE_PNG)], quarantineRoot, second);

  // The load-bearing line. Under the pre-fix content-addressed key this reads 1, and the
  // one it kept is the second — the first sighting's circumstances are gone from disk.
  assert.equal(
    recordsOnDisk().length,
    2,
    `a second sighting of the same bytes destroyed the first sighting's record; on disk: ${recordsOnDisk()}`,
  );
  assert.ok(recordsOnDisk().includes(firstFile), `the first record ${firstFile} is no longer on disk`);

  const afterSecond = observations(quarantineRoot, CANDIDATE_PNG);

  // Two events, two records, oldest first — and the shipped reader finds both.
  assert.equal(afterSecond.length, 2, `both sightings must survive; got: ${afterSecond.map((o) => o.file)}`);
  assert.deepEqual(
    afterSecond.map((o) => o.run_id),
    [first, second],
  );

  // The first record is not merely still present — it is unchanged, byte for byte. A shape
  // that rewrote it in place would keep the count and lose the circumstances anyway.
  assert.ok(
    fs.readFileSync(afterSecond[0].path).equals(firstBytes),
    "the first observation's record was rewritten by the second sighting",
  );

  // The frame itself stays content-addressed: same bytes, one PNG, correct as is.
  const pngs = framesIn(quarantineRoot).filter((f) => f.endsWith(".png"));
  assert.deepEqual(pngs, [`${sha256(CANDIDATE_PNG)}.png`], "the frame should not be duplicated");

  // The second record knows it is a recurrence, and names what it recurs on.
  const car = readObservation(afterSecond[1]);
  assert.equal(car.observation.prior_observations, 1);
  assert.deepEqual(car.observation.prior_records, [afterSecond[0].file]);
});

test("a repeat sighting is announced by the run that makes it, not left to be discovered", () => {
  const { outDir, quarantineRoot } = bench();
  diffRun(outDir, [resultFor(CANDIDATE_PNG)], quarantineRoot, "2026-08-10T17-43-54-825Z-aaaaaaaa");
  const { output } = diffRun(outDir, [resultFor(CANDIDATE_PNG)], quarantineRoot, "2026-08-11T18-40-23-385Z-bbbbbbbb");
  assert.match(output, /these bytes have been observed before: 1 earlier record\(s\)/);
  assert.match(output, /2026-08-10T17-43-54-825Z-aaaaaaaa/);
});

test("two different observed frames are both kept", () => {
  const { outDir, quarantineRoot } = bench();
  const other = encodePng(
    W,
    H,
    canvas((px) => {
      px[(2 * W + 2) * 4] += 5;
    })
  );
  diffRun(outDir, [resultFor(CANDIDATE_PNG)], quarantineRoot);
  diffRun(outDir, [resultFor(other)], quarantineRoot);
  const files = framesIn(quarantineRoot);
  assert.equal(files.length, 4);
  // A second variance must never overwrite the first: both are observations.
  assert.ok(files.includes(`${sha256(CANDIDATE_PNG)}.png`));
  assert.ok(files.includes(`${sha256(other)}.png`));
});

test("retention leaves no partial file behind", () => {
  const { quarantineRoot } = bench();
  retainDifferingFrame({
    scenarioId: SCENARIO_ID,
    candidateBuf: CANDIDATE_PNG,
    baselineBuf: BASELINE_PNG,
    baselinePath: path.join(REPO_ROOT, "docs/qa/visual-acceptance-harness/curated-readout--mobile.png"),
    quarantineRoot,
  });
  // The write goes through a temp name and a rename. If a .tmp- survives, a reader can
  // find a half-written frame and mistake it for the observation.
  assert.deepEqual(framesIn(quarantineRoot).filter((f) => f.includes(".tmp-")), []);
});

test("undecodable or mismatched frames are recorded as unmeasured, not as zero difference", () => {
  // Reporting "0 differing pixels" when the comparison could not run is the same class of
  // false green the harness exists to prevent, so the sidecar says why instead.
  const notPng = pixelDifference(BASELINE_PNG, Buffer.from("not a png"));
  assert.equal(notPng.measured, false);
  assert.match(notPng.why, /did not decode/);

  const taller = pixelDifference(BASELINE_PNG, encodePng(W, H + 1, Buffer.alloc(W * (H + 1) * 4)));
  assert.equal(taller.measured, false);
  assert.match(taller.why, /dimensions differ/);
  assert.deepEqual(taller.dims, { baseline: [W, H], candidate: [W, H + 1] });
});

test("a frame that differs everywhere still reports real numbers", () => {
  const inverted = encodePng(
    W,
    H,
    canvas((px) => {
      for (let i = 0; i < W * H; i++) px[i * 4] = 255;
    })
  );
  const d = pixelDifference(BASELINE_PNG, inverted);
  assert.equal(d.measured, true);
  assert.equal(d.differing_pixels, W * H);
  assert.equal(d.max_channel_delta, 165);
});

// ── Custody ──────────────────────────────────────────────────────────────────

test("the quarantine path is ignored by git, so evidence never becomes a commit", () => {
  const probe = path.join(QUARANTINE_DIR, SCENARIO_ID, `${"0".repeat(64)}.png`);
  const r = spawnSync("git", ["check-ignore", "-q", "--no-index", probe], { cwd: REPO_ROOT });
  assert.equal(r.status, 0, `${path.relative(REPO_ROOT, probe)} is not covered by .gitignore`);
});

test("quarantine sits outside the committed board, so no run can mistake it for a baseline", () => {
  const board = path.join(REPO_ROOT, "docs/qa/visual-acceptance-harness");
  assert.equal(QUARANTINE_DIR.startsWith(board), false);
  assert.equal(path.relative(REPO_ROOT, QUARANTINE_DIR), ".qa-quarantine");
});
