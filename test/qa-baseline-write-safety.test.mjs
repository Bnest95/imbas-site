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
// QUARANTINE, AND WHY IT IS NOT A BREACH OF THE ABOVE. `npm test` runs the real
// `--all --diff` board; a differing nondeterministic frame can therefore write quarantine
// evidence. That is accepted-as-designed retention behavior, founder-ruled 2026-08-13 —
// the opposite of the defect these tests hold down. A baseline is committed state and may
// only change under a named acceptance; quarantine is the differing frame itself, written
// once, because a nondeterministic difference is a one-shot observation that re-running
// destroys. Nothing here treats a quarantine write as a baseline write.
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
  renameArtifact,
  resolveDestination,
  parseArgs,
} from "../scripts/qa/visual-acceptance.mjs";
import { SCENARIOS } from "../scripts/qa/scenarios.mjs";

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

function runHarness(argv, timeout = 360000) {
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
  const { code, out } = runHarness(["--all", "--diff"]);
  assert.deepEqual(baselineHashes(), before, "diff mode wrote into the baseline directory");

  // With the governed renderer present this ran a real capture and compared it. Without
  // it the run stopped at renderer resolution. The write-safety assertion above holds
  // either way; this records which of the two happened rather than letting a run that
  // rendered nothing pass itself off as the full proof.
  //
  // The second limb deliberately names no sentence. It used to require the exact words
  // "No usable headless browser found", which belonged to the resolver that enumerated
  // browser caches; the pin that replaced that resolver retired the phrase and left this
  // line matching a string nothing emits, so the limb failed wherever the renderer was
  // absent — CI, and equally a checkout that has not run the install command yet. A test
  // holding a private copy of another module's wording is what went stale, so this holds
  // to the two properties every refusal on that path actually has: it exits non-zero, and
  // it says what this repository governs.
  if (!/regression diff/.test(out)) {
    assert.equal(code, 1, `diff neither compared nor failed:\n${out}`);
    assert.match(out, /govern(s|ed)/, `diff neither compared nor said why:\n${out}`);
  }
});

test("an unknown or fixture-only scenario cannot mutate baselines through the CLI", () => {
  const before = baselineHashes();

  const unknown = runHarness(["--update", "nope-not-real"]);
  assert.equal(unknown.code, 1);
  assert.match(unknown.out, /unknown scenario/);

  // A fixture-only scenario has payloads but no drive steps, so no capture of that
  // state exists to accept. Writing one would file some other flow under its name.
  //
  // This half is conditional because it names no scenario of its own: it probes
  // whichever scenario is currently undrivable. Pass 2B-A2 gave the paired scenarios
  // drive steps, and paired-matched — which this test used to name outright — became
  // drivable, so at present there is no subject. The guard's own logic is covered
  // unconditionally below against an injected map; this asserts the CLI reaches it,
  // and starts asserting again the moment a fixture-only scenario exists.
  const undrivable = Object.keys(SCENARIOS).find((n) => !SCENARIOS[n].drivable);
  if (undrivable) {
    const fixtureOnly = runHarness(["--update", undrivable]);
    assert.equal(fixtureOnly.code, 1);
    assert.match(fixtureOnly.out, /fixture-only/);
  }

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
  // Injected rather than named from the real map: whether any shipped scenario is
  // currently undrivable is a fact about the fixtures, and this is a fact about the
  // guard. Naming a real scenario here is what tied this assertion to paired-matched
  // and broke it the day that scenario got drive steps.
  const undrivable = { "probe-no-drive-steps": { name: "probe-no-drive-steps", drivable: false } };
  assert.throws(
    () => new BaselineGrant(["probe-no-drive-steps"], ["desktop"], undrivable),
    /fixture-only/
  );
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
  // Only the granted scenario's own files. The loop used to run over every file in
  // the directory, which held while single-findings was the only scenario with
  // committed baselines and started failing the moment a second one had them —
  // reporting a broken guard when the guard was doing exactly its job.
  const granted = Object.keys(before).filter((n) => n.startsWith("single-findings--"));
  assert.ok(granted.length >= 2, `expected committed single-findings baselines, found ${granted.length}`);
  for (const name of granted) {
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
    src.match(/fs\.(writeFileSync|appendFileSync|createWriteStream|copyFileSync|cpSync)\s*\(/g) || [];
  assert.deepEqual(raw, ["fs.writeFileSync("], `unexpected raw write call(s): ${raw.join(", ")}`);

  const start = src.indexOf("export function writeArtifact");
  assert.ok(start > 0, "writeArtifact is present");
  const body = src.slice(start, src.indexOf("\n}", start));
  assert.ok(body.includes("fs.writeFileSync("), "the one raw write lives inside writeArtifact");
});

test("every rename in the harness goes through renameArtifact", () => {
  // A rename lands bytes at a path exactly as a write does, so it is the same door and
  // gets the same lock. Evidence retention needs an atomic publish — write to a temp name,
  // rename into place — and that rename is the only one the module may contain.
  const src = fs.readFileSync(HARNESS, "utf8");
  const raw = src.match(/fs\.renameSync\s*\(/g) || [];
  assert.deepEqual(raw, ["fs.renameSync("], `unexpected raw rename call(s): ${raw.join(", ")}`);

  const start = src.indexOf("export function renameArtifact");
  assert.ok(start > 0, "renameArtifact is present");
  const body = src.slice(start, src.indexOf("\n}", start));
  assert.ok(body.includes("fs.renameSync("), "the one raw rename lives inside renameArtifact");
  // The lock itself, not just the location: the guarded pair must both consult the same
  // question before moving anything.
  assert.ok(body.includes("insideBaselineDir("), "renameArtifact does not check the baseline dir");
});

test("renameArtifact refuses to move a file into the baseline directory without a grant", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "imbas-rename-"));
  const from = path.join(dir, "candidate.png");
  fs.writeFileSync(from, "bytes");
  assert.throws(
    () => renameArtifact(from, path.join(BASELINE_DIR, "curated-readout--mobile.png")),
    /Refusing to rename onto/
  );
  // The refusal must leave the source where it was, or a blocked publish still destroys
  // the thing it was trying to publish.
  assert.equal(fs.existsSync(from), true);
});

test("a baseline grant is constructed in exactly one place, and only in update mode", () => {
  const src = fs.readFileSync(HARNESS, "utf8");
  assert.equal((src.match(/new BaselineGrant\(/g) || []).length, 1);
  assert.match(src, /mode === "update"\s*\?\s*new BaselineGrant/);
});
