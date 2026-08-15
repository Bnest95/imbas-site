// What actually moved in each frame the board flagged.
//
//   node scripts/qa/frame-movement.mjs
//   node scripts/qa/frame-movement.mjs --json
//
// READ-ONLY. It opens the committed baseline and the frame the board quarantined beside
// it, and writes nothing to either. No baseline is read for acceptance and none is
// written. This is the instrument for the question "63 frames differ — differ HOW", which
// a byte comparison cannot answer because a byte comparison has exactly two answers.
//
// ── Two axes, because one of them alone gets the answer wrong ────────────────
// HOW FAR each differing pixel moved separates a re-raster from real change. A gradient
// laid out against a different height lands a level or two off across the whole surface:
// a third of the frame "differs" and nothing on it looks any different. Changed text
// moves its pixels by a hundred levels or more. Pixel counts cannot tell these apart and
// on this board most frames are some of each, so every differing pixel is bucketed by
// its largest per-channel delta and the >16 band is reported separately.
//
// WHERE the frame moved separates an insertion from a repaint. An inserted element pushes
// everything below it down, so row y comes to hold what row y−k held. That is measured as
// the k for which the most rows of the fresh frame reproduce a row of the baseline.

import { decodePng } from "./raster-policy.mjs";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const BASELINES = path.join(REPO_ROOT, "docs/qa/visual-acceptance-harness");
const QUARANTINE = path.join(REPO_ROOT, ".qa-quarantine");
const AS_JSON = process.argv.includes("--json");
const log = (s = "") => process.stdout.write(`${s}\n`);

// How far a shift is looked for. The largest single insertion this lane makes is the
// capability strip; nothing it adds approaches 400px, so a shift outside this range is
// not a shift this lane can explain and should be reported as unexplained rather than
// matched to some coincidental k.
const MAX_SHIFT = 400;

// Rows are hashed with the low bits dropped. Hashing exact bytes was tried first and it
// cannot see displacement on this board at all: when a frame is BOTH pushed down and
// faintly re-rastered, no row reproduces any earlier row byte-for-byte, so the exact
// matcher reports "nothing moved" on frames where content plainly moved. Quantising to
// 5 bits per channel steps over a shift of one or two levels while still distinguishing
// any change a person could see.
function rowHashes(img, quantize = true) {
  const stride = img.width * 4;
  const out = new Array(img.height);
  const row = Buffer.alloc(stride);
  for (let y = 0; y < img.height; y++) {
    const src = img.data.subarray(y * stride, y * stride + stride);
    if (!quantize) {
      out[y] = crypto.createHash("sha1").update(src).digest("hex");
      continue;
    }
    for (let i = 0; i < stride; i++) row[i] = src[i] & 0xf8;
    out[y] = crypto.createHash("sha1").update(row).digest("hex");
  }
  return out;
}

// Counting differing pixels cannot tell a repaint from a re-raster, and on this board
// that is the whole question. A gradient laid out one pixel differently changes almost
// every pixel in the frame by one or two levels; a changed word changes a few thousand
// pixels by a hundred or more. Same "differs" from a byte comparison, opposite findings.
// So every differing pixel is also bucketed by how far it moved.
function pixelDiff(a, b) {
  const stride = a.width * 4;
  let count = 0;
  let firstRow = -1;
  let lastRow = -1;
  let rows = 0;
  let maxDelta = 0;
  let sumDelta = 0;
  const buckets = { d1: 0, d2: 0, d4: 0, d8: 0, d16: 0, big: 0 };
  let firstBigRow = -1;
  let lastBigRow = -1;
  let bigCount = 0;
  for (let y = 0; y < Math.min(a.height, b.height); y++) {
    let rowCount = 0;
    let rowBig = 0;
    for (let x = 0; x < stride; x += 4) {
      const i = y * stride + x;
      const dr = Math.abs(a.data[i] - b.data[i]);
      const dg = Math.abs(a.data[i + 1] - b.data[i + 1]);
      const db = Math.abs(a.data[i + 2] - b.data[i + 2]);
      const d = Math.max(dr, dg, db);
      if (d === 0) continue;
      rowCount++;
      sumDelta += d;
      if (d > maxDelta) maxDelta = d;
      if (d <= 1) buckets.d1++;
      else if (d <= 2) buckets.d2++;
      else if (d <= 4) buckets.d4++;
      else if (d <= 8) buckets.d8++;
      else if (d <= 16) buckets.d16++;
      else {
        buckets.big++;
        rowBig++;
      }
    }
    if (rowCount) {
      count += rowCount;
      if (firstRow === -1) firstRow = y;
      lastRow = y;
      rows++;
    }
    if (rowBig) {
      bigCount += rowBig;
      if (firstBigRow === -1) firstBigRow = y;
      lastBigRow = y;
    }
  }
  return {
    count,
    firstRow,
    lastRow,
    rowsWithDiff: rows,
    maxDelta,
    meanDelta: count ? +(sumDelta / count).toFixed(2) : 0,
    buckets,
    bigCount,
    firstBigRow,
    lastBigRow,
    // The share of differing pixels that moved by no more than two levels. A re-raster
    // sits at essentially 1.0 here; changed content does not.
    faintShare: count ? +((buckets.d1 + buckets.d2) / count).toFixed(4) : 0,
  };
}

// The best whole-frame vertical shift, measured only over the rows at or below the first
// differing row: above that point the frames are identical and every k matches equally,
// so including those rows would flatter every candidate by the same amount.
function bestShift(baseHashes, freshHashes, from) {
  const index = new Map();
  baseHashes.forEach((h, y) => {
    if (!index.has(h)) index.set(h, []);
    index.get(h).push(y);
  });
  const tally = new Map();
  for (let y = from; y < freshHashes.length; y++) {
    const candidates = index.get(freshHashes[y]);
    if (!candidates) continue;
    for (const by of candidates) {
      const k = y - by;
      if (Math.abs(k) > MAX_SHIFT) continue;
      tally.set(k, (tally.get(k) || 0) + 1);
    }
  }
  let best = { k: 0, rows: 0 };
  for (const [k, rows] of tally) if (rows > best.rows) best = { k, rows };
  return { ...best, rowsConsidered: Math.max(0, freshHashes.length - from) };
}

// Three findings, in the order that decides them.
//   RE-RASTER  every differing pixel moved by at most two levels. Nothing legible changed;
//              the frame was laid out against a different total height and the gradients
//              landed one level off across the whole surface.
//   CONTENT    a band of pixels moved far. Where that band starts is where the change is.
//   BOTH       a re-raster carrying a band of real change inside it.
function classify({ dims, diff, shift }) {
  if (!dims) return "FRAME SIZE — the capture rectangle itself changed";
  if (diff.count === 0) return "no pixel differs";
  // bigCount decides first. A frame where 99% of the differing pixels are faint can still
  // carry thousands that are not, and calling that a re-raster would file real change
  // under a heading that says nothing changed.
  if (diff.bigCount === 0) return `RE-RASTER only — nothing moved more than 16 levels (max Δ${diff.maxDelta})`;
  const moved = shift.k !== 0 && shift.rows / Math.max(1, shift.rowsConsidered) > 0.25;
  const where = moved ? `moved ${shift.k > 0 ? "down" : "up"} ${Math.abs(shift.k)}px; ` : "";
  const band = `${diff.bigCount} px >16 levels in rows ${diff.firstBigRow}–${diff.lastBigRow}`;
  if (diff.faintShare >= 0.5) return `BOTH — re-raster across the frame plus ${where}${band}`;
  return `CONTENT — ${where}${band}`;
}

const dirs = fs
  .readdirSync(QUARANTINE, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

const rows = [];
for (const name of dirs) {
  const basePath = path.join(BASELINES, `${name}.png`);
  if (!fs.existsSync(basePath)) {
    rows.push({ frame: name, error: "no committed baseline" });
    continue;
  }
  // The board keeps every distinct set of bytes it has seen for a frame. Take the newest
  // by its observation record, so this reads the frame THIS run produced.
  const pngs = fs
    .readdirSync(path.join(QUARANTINE, name))
    .filter((f) => f.endsWith(".png"))
    .map((f) => ({ f, m: fs.statSync(path.join(QUARANTINE, name, f)).mtimeMs }))
    .sort((a, b) => b.m - a.m);
  if (!pngs.length) {
    rows.push({ frame: name, error: "no retained frame" });
    continue;
  }
  const base = decodePng(fs.readFileSync(basePath));
  const fresh = decodePng(fs.readFileSync(path.join(QUARANTINE, name, pngs[0].f)));
  const dims = base.width === fresh.width && base.height === fresh.height;
  const diff = dims ? pixelDiff(base, fresh) : { count: -1, firstRow: -1, lastRow: -1, rowsWithDiff: -1 };
  const shift = dims && diff.firstRow >= 0 ? bestShift(rowHashes(base), rowHashes(fresh), diff.firstRow) : { k: 0, rows: 0, rowsConsidered: 0 };
  rows.push({
    frame: name,
    retained: pngs.length,
    baseline: `${base.width}x${base.height}`,
    fresh: `${fresh.width}x${fresh.height}`,
    diffPixels: diff.count,
    diffPct: dims ? +((100 * diff.count) / (base.width * base.height)).toFixed(3) : null,
    firstDiffRow: diff.firstRow,
    lastDiffRow: diff.lastRow,
    rowsWithDiff: diff.rowsWithDiff,
    shiftPx: shift.k,
    shiftRows: shift.rows,
    rowsConsidered: shift.rowsConsidered,
    maxDelta: diff.maxDelta,
    meanDelta: diff.meanDelta,
    faintShare: diff.faintShare,
    bigPixels: diff.bigCount,
    bigRows: diff.bigCount ? [diff.firstBigRow, diff.lastBigRow] : null,
    verdict: classify({ dims, diff, shift }),
  });
}

const width = Math.max(...rows.map((r) => r.frame.length));
log("");
log(
  `${"frame".padEnd(width)}  ${"diff px".padStart(9)}  ${"%".padStart(6)}  ${"maxΔ".padStart(5)}  ` +
    `${"meanΔ".padStart(6)}  ${"faint%".padStart(7)}  ${">16px".padStart(8)}  verdict`,
);
log("─".repeat(width + 60));
for (const r of rows) {
  if (r.error) {
    log(`${r.frame.padEnd(width)}  ${r.error}`);
    continue;
  }
  log(
    `${r.frame.padEnd(width)}  ${String(r.diffPixels).padStart(9)}  ${String(r.diffPct).padStart(6)}  ` +
      `${String(r.maxDelta).padStart(5)}  ${String(r.meanDelta).padStart(6)}  ` +
      `${(r.faintShare * 100).toFixed(1).padStart(7)}  ${String(r.bigPixels).padStart(8)}  ${r.verdict}`,
  );
}

const byVerdict = new Map();
for (const r of rows) {
  const key = (r.verdict || r.error || "?").replace(/^(\w+[- ]?\w*)\b.*/, "$1");
  byVerdict.set(key, (byVerdict.get(key) || 0) + 1);
}
log("");
log("── classes ──");
for (const [k, n] of [...byVerdict].sort((a, b) => b[1] - a[1])) log(`  ${String(n).padStart(3)}  ${k}`);
if (AS_JSON) log(JSON.stringify(rows, null, 2));
