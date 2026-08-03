// Mutation harness for the anchor artifact-identity lane.
//
// A passing test suite proves the tests pass. It does not prove the tests would
// catch the defect coming back. Each mutation below restores one clause of the
// pre-patch behaviour in a throwaway copy of the tree and requires the named test
// to FAIL. A mutation that survives means a test is decorative.
//
// The mutations, matching the list in test/anchor-artifact-identity.test.mjs:
//   M1  resolver ignores artifact_id           resolveSpanAgainst resolves against
//                                              whichever artifact carries the text
//   M2  builder accepts a caller-supplied id   quotedAnchor stamps span.artifact_id
//                                              instead of the artifact it was handed
//   M3  record validator skips artifact lookup validateRecordSpans returns ok blindly
//   M4  open/targeted bodies swapped           buildCanonicalPaired binds by position
//   M5  duplicate artifact ids accepted        normalizeArtifactMap overwrites silently
//
// Modules are COPIED, not symlinked: Node resolves a symlinked module to its real
// path, which would silently run the unmutated source and pass every mutation.
//
// Run: node --test test/anchor-artifact-identity-mutations.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "..");
const TEST_FILE = "anchor-artifact-identity.test.mjs";

// A working copy carrying every module the target test can reach, plus the corpus
// it reads. node_modules and docs are linked because nothing mutates them.
function stageTree() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "anchor-mutation-"));
  fs.mkdirSync(path.join(dir, "api"));
  fs.mkdirSync(path.join(dir, "test"));
  for (const f of fs.readdirSync(REPO_ROOT).filter((f) => f.endsWith(".js"))) {
    fs.copyFileSync(path.join(REPO_ROOT, f), path.join(dir, f));
  }
  for (const f of fs.readdirSync(path.join(REPO_ROOT, "api")).filter((f) => f.endsWith(".js"))) {
    fs.copyFileSync(path.join(REPO_ROOT, "api", f), path.join(dir, "api", f));
  }
  fs.copyFileSync(path.join(REPO_ROOT, "test", TEST_FILE), path.join(dir, "test", TEST_FILE));
  fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ type: "module" }));
  for (const link of ["node_modules", "docs"]) {
    const from = path.join(REPO_ROOT, link);
    if (fs.existsSync(from)) fs.symlinkSync(from, path.join(dir, link));
  }
  return dir;
}

// Applied as an exact string replacement so a rename upstream breaks the harness
// loudly rather than silently applying nothing and reporting a surviving mutation.
function mutate(dir, file, from, to) {
  const target = path.join(dir, file);
  const src = fs.readFileSync(target, "utf8");
  assert.ok(
    src.includes(from),
    `mutation anchor not found in ${file} — the harness is stale:\n${from}`,
  );
  fs.writeFileSync(target, src.replace(from, to));
}

function runTargetTests(dir, names) {
  // node:test refuses to start a runner inside a runner, and refuses SILENTLY —
  // it prints a warning, runs nothing, and exits 0, which reads as a surviving
  // mutation. Clearing the marker is what makes the child an independent run.
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  const r = spawnSync(process.execPath, ["--test", path.join(dir, "test", TEST_FILE)], {
    cwd: dir,
    encoding: "utf8",
    timeout: 120000,
    env,
  });
  const out = `${r.stdout || ""}${r.stderr || ""}`;
  const total = /^# tests (\d+)$/m.exec(out);
  return {
    failed: new Set([...out.matchAll(/^not ok \d+ - (.+)$/gm)].map((m) => m[1].trim())),
    ran: total ? Number(total[1]) : 0,
    out,
    names,
  };
}

// The contract: the mutation must be caught, and caught by the test named for it.
// Asserting only "the suite went red" would let an unrelated test carry the proof.
function assertKilledBy(dir, expected) {
  const { failed, ran, out } = runTargetTests(dir, expected);
  // A child that ran nothing reports zero failures, which reads identically to a
  // mutation that was tolerated. Prove the tests executed before reading the result.
  assert.ok(ran > 0, `the mutated child ran no tests, so nothing was proved:\n${out.slice(-3000)}`);
  assert.ok(failed.size > 0, `mutation survived — every test still passed:\n${out.slice(-3000)}`);
  for (const name of expected) {
    assert.ok(
      failed.has(name),
      `mutation not caught by its own test "${name}".\nFailed instead: ${[...failed].join(" | ") || "(none)"}`,
    );
  }
  fs.rmSync(dir, { recursive: true, force: true });
}

test("baseline: the staged copy passes unmutated (otherwise every kill below is meaningless)", () => {
  const dir = stageTree();
  const { failed, ran, out } = runTargetTests(dir, []);
  assert.deepEqual([...failed], [], out.slice(-3000));
  assert.ok(ran > 20, `the staged copy ran ${ran} tests; it is not the real target file`);
  fs.rmSync(dir, { recursive: true, force: true });
});

test("M1: a resolver that ignores artifact_id is caught", () => {
  const dir = stageTree();
  // Pre-patch behaviour: any artifact carrying the text at those offsets satisfies
  // the span, so the artifact it names is decoration.
  mutate(
    dir,
    "reader-checks.js",
    "  const artifact = map.get(id);\n  if (!artifact) return { ok: false, reason: SPAN_REJECTION.UNKNOWN_ARTIFACT };",
    "  let artifact = map.get(id);\n" +
      "  if (!artifact) {\n" +
      "    for (const cand of map.values()) {\n" +
      "      const want = quote == null ? span.quote : quote;\n" +
      "      if (cand.body.slice(span.start, span.end) === want) { artifact = cand; break; }\n" +
      "    }\n" +
      "  }\n" +
      "  if (!artifact) return { ok: false, reason: SPAN_REJECTION.UNKNOWN_ARTIFACT };",
  );
  assertKilledBy(dir, [
    "A: the same span fails where its named artifact is absent, though B holds the text verbatim",
    "A: resolution is a lookup, never a scan — no artifact in the map is consulted but the named one",
  ]);
});

test("M2: a builder that trusts a caller-supplied artifact_id is caught", () => {
  const dir = stageTree();
  mutate(
    dir,
    "reader-result.js",
    "    span: { artifact_id: artifact.id, start: span.start, end: span.end },",
    "    span: { artifact_id: span.artifact_id || artifact.id, start: span.start, end: span.end },",
  );
  assertKilledBy(dir, [
    "B: quotedAnchor stamps the artifact it was handed, ignoring any id the caller put on the span",
  ]);
});

test("M3: a Review Record validator that skips the artifact lookup is caught", () => {
  const dir = stageTree();
  mutate(
    dir,
    "reader-review-record.js",
    "function validateRecordSpans(c) {",
    "function validateRecordSpans(c) {\n  if (c) return { ok: true };",
  );
  assertKilledBy(dir, [
    "C: a span naming targeted_answer whose text belongs only to original_answer is rejected",
    "C: the record validator does not take construction on trust — it re-proves every check span",
    "C: an unknown artifact_id is rejected rather than ignored",
    "D: a span whose named artifact is too short fails even though another artifact could carry it",
    "E: a duplicate artifact id makes the map ambiguous and the record is rejected",
    "F: a Review Record whose artifact bodies were swapped after the fact is rejected",
    "G: the audit's headline Review Record fixture is rejected",
  ]);
});

test("M4: binding the paired bodies by position is caught", () => {
  const dir = stageTree();
  // The pre-patch signature. Under it, buildCanonicalPaired(pm, {open, targeted})
  // reads the object as `open` and gets undefined for both — but the swap test is
  // the one that matters: with positional binding the two bodies are interchangeable
  // and a swap produces a fully-formed, wrongly-attributed result.
  mutate(
    dir,
    "api/read-paired.js",
    "  const artifacts = { [ARTIFACT_ORIGINAL]: open || \"\", [ARTIFACT_TARGETED]: targeted || \"\" };",
    "  const artifacts = { [ARTIFACT_ORIGINAL]: targeted || \"\", [ARTIFACT_TARGETED]: open || \"\" };",
  );
  assertKilledBy(dir, [
    "F: with the correct binding, both sides quote and each anchor names its own document",
    // And its mirror: under a positional bind the two bodies are interchangeable, so
    // the deliberately-swapped call now produces the fully-formed result instead.
    "F: swapping the two bodies while keeping anchor identities produces no quoted anchor",
  ]);
});

test("M5: an artifact map that silently accepts a duplicate id is caught", () => {
  const dir = stageTree();
  mutate(
    dir,
    "reader-checks.js",
    "    if (map.has(id)) throw new Error(`reader-checks: duplicate artifact id in map: ${id}`);",
    "    // duplicate tolerated: last writer wins",
  );
  assertKilledBy(dir, [
    "E: a duplicate artifact id makes the map ambiguous and the record is rejected",
    "E: duplicate ids are refused at the map primitive, so no consumer has to guess which one won",
  ]);
});
