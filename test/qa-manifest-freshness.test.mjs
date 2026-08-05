// Guardrail: the committed visual acceptance manifest is what the generator emits, now.
// Run: node --test test/qa-manifest-freshness.test.mjs
//
// The manifest attests a sha256 for every governed baseline, and for four passes nothing
// checked those attestations against the files sitting next to them. It went 34-of-48
// stale on master and then fully stale, while every individual baseline acceptance was
// correct — because regenerating it used to require re-photographing the whole board, and
// the acceptance protocol forbids that run for good reasons of its own.
//
// So the checksums are not what these tests hold. They hold the GENERATOR: regenerate in
// memory and compare byte-for-byte against the committed file. That makes staleness a red
// suite rather than something a reader has to notice, and it means a pass that moves a
// baseline regenerates the manifest in the same commit without being told to.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  BASELINE_DIR,
  BOARD_VIEWPORTS,
  VIEWPORTS,
  ManifestGrant,
  buildManifestModel,
  renderManifest,
} from "../scripts/qa/visual-acceptance.mjs";
import { SCENARIOS } from "../scripts/qa/scenarios.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST = path.join(BASELINE_DIR, "manifest.md");
const HARNESS = path.join(REPO_ROOT, "scripts/qa/visual-acceptance.mjs");

const registeredImages = () =>
  Object.keys(SCENARIOS)
    .filter((name) => SCENARIOS[name].drivable)
    .flatMap((name) => BOARD_VIEWPORTS.map((viewport) => `${name}--${viewport}.png`))
    .sort();

const onDisk = (suffix) =>
  fs
    .readdirSync(BASELINE_DIR)
    .filter((f) => f.endsWith(suffix))
    .sort();

// ── The freshness gate ───────────────────────────────────────────────────────

test("the committed manifest is byte-for-byte what the generator emits today", () => {
  const committed = fs.readFileSync(MANIFEST, "utf8");
  const regenerated = renderManifest(buildManifestModel());

  if (committed === regenerated) return;

  // A 68 KB diff dumped into a test failure is unreadable, so report the first line
  // that moved and the size of the move. That is enough to tell a stale checksum from
  // a changed `expected` string from a scenario that arrived or left.
  const a = committed.split("\n");
  const b = regenerated.split("\n");
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  assert.fail(
    `docs/qa/visual-acceptance-harness/manifest.md is stale.\n` +
      `  committed: ${a.length} lines, ${Buffer.byteLength(committed)} bytes\n` +
      `  generated: ${b.length} lines, ${Buffer.byteLength(regenerated)} bytes\n` +
      `  first difference at line ${i + 1}:\n` +
      `    committed: ${JSON.stringify(a[i])}\n` +
      `    generated: ${JSON.stringify(b[i])}\n` +
      `  Regenerate it in this commit: node scripts/qa/visual-acceptance.mjs --manifest`
  );
});

test("regeneration is deterministic — same inputs, same bytes, every time", () => {
  // Volatile generation metadata is what rotted the old manifest: a timestamp and a HEAD
  // meant an unrelated commit could stale it. Two builds in one process cannot catch a
  // wall-clock field cheaply, so this asserts the property directly on the output.
  const once = renderManifest(buildManifestModel());
  const twice = renderManifest(buildManifestModel());
  assert.equal(once, twice);

  for (const [what, pattern] of [
    ["an ISO timestamp", /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/],
    ["a captured_against_sha", /captured_against_sha/],
    ["a working-tree state", /working tree at capture time/],
    ["an absolute machine path", /(^|[\s`(])\/(Users|home)\//m],
  ]) {
    assert.equal(pattern.test(once), false, `the manifest carries ${what}, which stales it on unrelated commits`);
  }
});

// ── Complete inventory ───────────────────────────────────────────────────────

test("the manifest lists every registered baseline and nothing else, in both directions", () => {
  const model = buildManifestModel();
  const listed = model.images.map((i) => i.filename).sort();
  const registered = registeredImages();

  assert.deepEqual(
    listed.filter((f) => !new Set(registered).has(f)),
    [],
    "the manifest lists an image the registry does not register"
  );
  assert.deepEqual(
    registered.filter((f) => !new Set(listed).has(f)),
    [],
    "the registry registers an image the manifest does not list"
  );
  assert.deepEqual(listed, onDisk(".png"), "listed images and images on disk are not the same set");
  assert.deepEqual(
    model.images.map((i) => i.snapshot.filename).sort(),
    onDisk(".snapshot.txt"),
    "listed snapshots and snapshots on disk are not the same set"
  );

  // The count is derived, never written down. It moved 48 → 62 when this generator
  // replaced one that could only describe the images a single run had re-photographed.
  const expected = Object.keys(SCENARIOS).filter((n) => SCENARIOS[n].drivable).length * BOARD_VIEWPORTS.length;
  assert.equal(model.images.length, expected);
  assert.equal(model.scope.imageCount, expected);
});

test("every governed file the manifest names is checksummed, and the checksums are of the bytes on disk", () => {
  const model = buildManifestModel();
  const text = renderManifest(model);

  for (const image of model.images) {
    for (const [file, sha, bytes] of [
      [image.filename, image.sha256, image.bytes],
      [image.snapshot.filename, image.snapshot.sha256, image.snapshot.bytes],
    ]) {
      const buf = fs.readFileSync(path.join(BASELINE_DIR, file));
      assert.equal(bytes, buf.length, `${file}: recorded byte count is not the file's length`);
      assert.match(sha, /^[0-9a-f]{64}$/, `${file}: no sha256`);
      assert.ok(text.includes(sha), `${file}: its checksum never reaches the rendered manifest`);
    }
  }
});

test("the scope declaration names the layers it governs, and governs exactly those", () => {
  const model = buildManifestModel();
  assert.deepEqual(model.scope.governs, ["png", "snapshot"]);

  // Requirement of the document, not of the model: a reader must be able to tell from
  // the file itself whether a snapshot is covered, without reading this test.
  const text = renderManifest(model);
  assert.match(text, /^## Scope$/m);
  assert.match(text, /governs both committed baseline layers/i);
  assert.ok(text.includes("`.snapshot.txt`"), "the scope section does not name the snapshot layer");
  assert.ok(text.includes("| snapshot sha256 |"), "snapshots are declared governed but not checksummed");
});

// ── The read-only property ───────────────────────────────────────────────────

test("regenerating the manifest touches no baseline byte", () => {
  const before = Object.fromEntries(
    fs
      .readdirSync(BASELINE_DIR)
      .filter((f) => f !== "manifest.md")
      .map((f) => [f, fs.statSync(path.join(BASELINE_DIR, f)).size])
  );
  renderManifest(buildManifestModel());
  const after = Object.fromEntries(
    fs
      .readdirSync(BASELINE_DIR)
      .filter((f) => f !== "manifest.md")
      .map((f) => [f, fs.statSync(path.join(BASELINE_DIR, f)).size])
  );
  assert.deepEqual(after, before);
});

test("a manifest grant opens manifest.md and nothing else", () => {
  const grant = new ManifestGrant();
  assert.equal(grant.allows("manifest.md"), true);
  for (const f of [
    "single-findings--desktop.png",
    "single-findings--desktop.snapshot.txt",
    "manifest.md.bak",
    "../manifest.md",
  ]) {
    assert.equal(grant.allows(f), false, `${f} must not ride into the baseline directory behind a manifest`);
  }
  assert.throws(() => grant.assertAllows("single-findings--desktop.png"), /authorizes manifest.md and nothing else/);
});

test("the generator reaches no browser, no server and no capture", () => {
  // Structural, because the point of the mode is that it runs where none of that is
  // available — a checkout with no Chromium, or a machine that cannot render this board
  // at all. A generator that quietly grew a capture dependency would still pass the
  // freshness test on the machine that has one.
  const src = fs.readFileSync(HARNESS, "utf8");
  const start = src.indexOf("export function buildManifestModel(");
  const end = src.indexOf("\nexport function regenerateManifest(");
  assert.ok(start > 0 && end > start, "the generator is not where this test expects it");
  const body = src.slice(start, end);

  for (const forbidden of [
    "resolveBrowser",
    "launchBrowser",
    "startStaticServer",
    "CDP.",
    "cdp",
    "capture(",
    "execSync",
    "Date.now",
    "new Date",
  ]) {
    assert.ok(!body.includes(forbidden), `the manifest generator reaches ${forbidden}`);
  }
});

// ── The board the manifest describes ─────────────────────────────────────────

test("the board viewports the manifest records are the ones a run defaults to", () => {
  // Two places used to hold this list: the command-line default and, implicitly, whatever
  // a capture run happened to produce. When they disagree the manifest either demands a
  // baseline no run captures or omits one every run does.
  for (const name of BOARD_VIEWPORTS) {
    assert.ok(VIEWPORTS[name], `board viewport ${name} has no geometry`);
  }
  const model = buildManifestModel();
  assert.deepEqual(
    model.scope.viewports.map((v) => v.name),
    [...BOARD_VIEWPORTS].sort()
  );
  assert.ok(!BOARD_VIEWPORTS.includes("mobile-tall"), "mobile-tall is declared unphotographed; it is not board");
});

test("a registered baseline missing from disk stops generation instead of shortening the record", () => {
  assert.throws(
    () =>
      buildManifestModel({
        scenarios: {
          ...SCENARIOS,
          "probe-never-captured": { name: "probe-never-captured", drivable: true, state: "x", expected: "y" },
        },
      }),
    /registered image\(s\) are not on disk/
  );
});

test("a baseline on disk that nothing registers stops generation instead of going unlisted", () => {
  // The exact failure that made the committed file wrong: 14 registered images the
  // manifest had never been regenerated to see, and it read as complete anyway. Modelled
  // by withholding a scenario the registry really has, which leaves its two images
  // orphaned on disk.
  const { "single-findings": withheld, ...rest } = SCENARIOS;
  assert.ok(withheld, "single-findings is expected in the registry");
  assert.throws(() => buildManifestModel({ scenarios: rest }), /registered by nothing/);
});
