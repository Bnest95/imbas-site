// Guardrail: nothing overwrites a committed baseline except an explicit, named acceptance.
//
// The defect these hold down: `--out` defaulted to the committed baseline directory, so
// `node scripts/qa/visual-acceptance.mjs --all` rewrote every accepted baseline and said
// nothing about it. A `--diff` run straight afterwards then compared a fresh capture
// against a baseline that same run had just written, and reported no regressions. The
// evidence survived only because a person noticed and restored the files by hand.
//
// The guarded update interface was already in place and did not help: `--update` requires
// a named scenario, `--update-all` is a hard error, the diff prints before it writes. Bare
// `--all` walked past all of it. So these drive the REAL CLI, not only the helpers — the
// defect lived in the entry point's own argument handling, not in anything it called.
//
// Run: node --test test/qa-baseline-write-safety.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";

import {
  BaselineGrant,
  writeArtifact,
  resolveDestination,
  parseArgs,
} from "../scripts/qa/visual-acceptance.mjs";

const REPO_ROOT = path.resolve(import.meta.dirname, "..");
const HARNESS = path.join(REPO_ROOT, "scripts/qa/visual-acceptance.mjs");
const BASELINE_DIR = path.join(REPO_ROOT, "docs/qa/visual-acceptance-harness");

// Every committed baseline file by content hash. The assertion made over and over below is
// that this map is identical before and after a run.
function baselineHashes() {
  const out = {};
  for (const name of fs.readdirSync(BASELINE_DIR).sort()) {
    const p = path.join(BASELINE_DIR, name);
    if (fs.statSync(p).isFile()) {
      out[name] = createHash("sha256").update(fs.readFileSync(p)).digest("hex");
    }
  }
  return out;
}

function runHarness(argv, timeout = 180000) {
  const r = spawnSync(process.execPath, [HARNESS, ...argv], { cwd: REPO_ROOT, encoding: "utf8", timeout });
  return { code: r.status, out: `${r.stdout || ""}${r.stderr || ""}` };
}

test("there are committed baselines to protect, or none of this proves anything", () => {
  const names = Object.keys(baselineHashes());
  assert.ok(names.length >= 2, `expected committed baselines, found ${JSON.stringify(names)}`);
  assert.ok(names.some((n) => n.endsWith(".png")), "at least one baseline image");
  assert.ok(names.some((n) => n.endsWith(".snapshot.txt")), "at least one baseline snapshot");
});

// ── The real CLI ─────────────────────────────────────────────────────────────

test("a bare --all exits non-zero, names --update, and moves no baseline", () => {
  const before = baselineHashes();
  const { code, out } = runHarness(["--all"]);
  assert.equal(code, 1, "bare --all must not succeed");
  assert.match(out, /--out/, "the error says a destination is required");
  assert.match(out, /--update/, "and names the flag that legitimately moves a baseline");
  assert.deepEqual(baselineHashes(), before, "bare --all wrote into the baseline directory");
});

test("a bare --scenario exits non-zero and moves no baseline", () => {
  // Same defaulted destination, same silent overwrite, one scenario at a time.
  const before = baselineHashes();
  const { code, out } = runHarness(["--scenario", "single-findings"]);
  assert.equal(code, 1);
  assert.match(out, /needs an explicit destination/);
  assert.deepEqual(baselineHashes(), before);
});

test("capture mode aimed straight at the baseline directory is refused", () => {
  // Requiring --out is not enough on its own: the operator can simply type the
  // baseline path. That is still capture mode reaching a baseline without naming a
  // scenario, so it is refused too, nested paths included.
  const before = baselineHashes();
  for (const out of ["docs/qa/visual-acceptance-harness", "docs/qa/visual-acceptance-harness/nested"]) {
    const r = runHarness(["--all", "--out", out]);
    assert.equal(r.code, 1, `--out ${out} must be refused`);
    assert.match(r.out, /inside the committed baseline directory/);
  }
  assert.deepEqual(baselineHashes(), before);
});

test("--all --diff leaves every committed baseline byte-identical", () => {
  const before = baselineHashes();
  const { out } = runHarness(["--all", "--diff"]);
  assert.deepEqual(baselineHashes(), before, "diff mode wrote into the baseline directory");

  // With a headless Chrome present this ran a real capture and compared it. Without
  // one it stopped at browser resolution. The write-safety assertion above holds
  // either way; this records which of the two happened rather than letting a
  // no-browser run pass itself off as the full proof.
  if (!/regression diff/.test(out)) {
    assert.match(out, /No usable headless browser found/, `diff neither compared nor said why:\n${out}`);
  }
});

test("an unknown or fixture-only scenario cannot mutate baselines through the CLI", () => {
  const before = baselineHashes();

  const unknown = runHarness(["--update", "nope-not-real"]);
  assert.equal(unknown.code, 1);
  assert.match(unknown.out, /unknown scenario/);

  // A fixture-only scenario has payloads but no drive steps, so no capture of that
  // state exists to accept. Writing one would file some other flow under its name.
  const fixtureOnly = runHarness(["--update", "paired-matched"]);
  assert.equal(fixtureOnly.code, 1);
  assert.match(fixtureOnly.out, /fixture-only/);

  assert.deepEqual(baselineHashes(), before);
});

// ── The grant ────────────────────────────────────────────────────────────────

test("an update grant authorizes only the named scenario's own files", () => {
  const grant = new BaselineGrant(["single-findings"], ["desktop", "mobile"]);
  for (const f of [
    "single-findings--desktop.png",
    "single-findings--desktop.snapshot.txt",
    "single-findings--mobile.png",
    "single-findings--mobile.snapshot.txt",
  ]) {
    assert.equal(grant.allows(f), true, `${f} belongs to the accepted scenario`);
  }
  for (const f of [
    "paired-matched--desktop.png",
    "paired-unmatched--mobile.snapshot.txt",
    "single-findings--mobile-tall.png", // a viewport this run did not accept
    "single-findings--desktop.png.bak",
  ]) {
    assert.equal(grant.allows(f), false, `${f} was never accepted by this run`);
  }
});

test("a grant cannot be minted for an unknown or fixture-only scenario, or for nothing", () => {
  assert.throws(() => new BaselineGrant(["nope-not-real"], ["desktop"]), /unknown scenario/);
  assert.throws(() => new BaselineGrant(["paired-matched"], ["desktop"]), /fixture-only/);
  assert.throws(() => new BaselineGrant([], ["desktop"]), /at least one explicitly named scenario/);
  assert.throws(() => new BaselineGrant(["single-findings"], []), /viewports/);
});

// ── The write guard ──────────────────────────────────────────────────────────

test("writeArtifact refuses a baseline path when the run holds no acceptance", () => {
  const before = baselineHashes();
  assert.throws(
    () => writeArtifact(path.join(BASELINE_DIR, "single-findings--desktop.png"), Buffer.from("OVERWRITTEN")),
    /holds no acceptance/
  );
  assert.deepEqual(baselineHashes(), before);
});

test("writeArtifact refuses a baseline file the grant does not name", () => {
  const before = baselineHashes();
  const grant = new BaselineGrant(["single-findings"], ["desktop"]);
  assert.throws(
    () => writeArtifact(path.join(BASELINE_DIR, "paired-matched--desktop.png"), Buffer.from("X"), grant),
    /belongs to none of them/
  );
  assert.deepEqual(baselineHashes(), before);
});

test("the guard reads the resolved path, so traversal does not slip past it", () => {
  const before = baselineHashes();
  const viaParent = path.join(BASELINE_DIR, "..", "visual-acceptance-harness", "single-findings--desktop.png");
  assert.throws(() => writeArtifact(viaParent, Buffer.from("X")), /holds no acceptance/);
  assert.deepEqual(baselineHashes(), before);
});

test("an authorized write is permitted through the guard", () => {
  // The other direction: the guard must not be a wall that blocks the legitimate
  // update too. This writes each file's OWN current bytes back, so the content is
  // unchanged and the hash assertion below still holds — it proves the grant opens
  // the door without accepting anything.
  const before = baselineHashes();
  const grant = new BaselineGrant(["single-findings"], ["desktop", "mobile"]);
  for (const name of Object.keys(before)) {
    if (name === "manifest.md") continue;
    const target = path.join(BASELINE_DIR, name);
    const current = fs.readFileSync(target);
    assert.doesNotThrow(() => writeArtifact(target, current, grant), `${name} is authorized`);
  }
  assert.deepEqual(baselineHashes(), before, "writing identical bytes changed nothing");
});

test("writeArtifact writes freely outside the baseline directory", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "qa-write-guard-"));
  const written = writeArtifact(path.join(dir, "nested", "x.png"), Buffer.from("IMG"));
  assert.equal(fs.readFileSync(written, "utf8"), "IMG");
  fs.rmSync(dir, { recursive: true, force: true });
});

// ── Destination resolution ───────────────────────────────────────────────────

test("capture mode demands a destination and refuses the baseline directory", () => {
  assert.throws(() => resolveDestination(parseArgs(["--all"])), /needs an explicit destination/);
  assert.throws(
    () => resolveDestination(parseArgs(["--scenario", "single-findings"])),
    /needs an explicit destination/
  );
  assert.throws(
    () => resolveDestination(parseArgs(["--all", "--out", "docs/qa/visual-acceptance-harness"])),
    /inside the committed baseline directory/
  );
  const ok = resolveDestination(parseArgs(["--all", "--out", ".qa-scratch/probe"]));
  assert.equal(ok.mode, "capture");
  assert.equal(ok.outDir, path.join(REPO_ROOT, ".qa-scratch/probe"));
});

test("diff and update still read the committed baseline directory by default", () => {
  const diff = resolveDestination(parseArgs(["--all", "--diff"]));
  assert.equal(diff.mode, "diff");
  assert.equal(diff.outDir, BASELINE_DIR);

  const update = resolveDestination(parseArgs(["--update", "single-findings"]));
  assert.equal(update.mode, "update");
  assert.equal(update.outDir, BASELINE_DIR);
});

// ── Nothing bypasses the one write function ──────────────────────────────────

test("every disk write in the harness goes through writeArtifact", () => {
  // A flag check only covers the code paths someone remembered to check. This
  // asserts the structural property instead: there is exactly one raw write call in
  // the module, and it sits inside the guard. A second one is a second door into
  // the baseline directory, which is this whole defect coming back.
  const src = fs.readFileSync(HARNESS, "utf8");
  const raw =
    src.match(/fs\.(writeFileSync|appendFileSync|createWriteStream|copyFileSync|renameSync|cpSync)\s*\(/g) || [];
  assert.deepEqual(raw, ["fs.writeFileSync("], `unexpected raw write call(s): ${raw.join(", ")}`);

  const start = src.indexOf("export function writeArtifact");
  assert.ok(start > 0, "writeArtifact is present");
  const body = src.slice(start, src.indexOf("\n}", start));
  assert.ok(body.includes("fs.writeFileSync("), "the one raw write lives inside writeArtifact");
});

test("a baseline grant is constructed in exactly one place, and only in update mode", () => {
  const src = fs.readFileSync(HARNESS, "utf8");
  assert.equal((src.match(/new BaselineGrant\(/g) || []).length, 1);
  assert.match(src, /mode === "update"\s*\?\s*new BaselineGrant/);
});
