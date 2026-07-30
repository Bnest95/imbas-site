// Guardrail: the visual acceptance harness must be able to COMPARE, not just capture.
// These cover the diff engine, snapshot normalization, and the guards that decide
// whether anything is allowed to touch a committed baseline.
// Run: node --test test/qa-visual-diff.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  canonicalJSON,
  normalizeText,
  normalizeHref,
  entryToLine,
  normalizeEntries,
  serializeSnapshot,
  parseSnapshot,
  diffLines,
  diffSnapshots,
  diffImageBuffers,
  imageComparability,
  detectErrorPage,
  assertScenarioCapturable,
  SNAPSHOT_FORMAT,
} from "../scripts/qa/snapshot.mjs";
import { captureAll, commitResults, parseArgs } from "../scripts/qa/visual-acceptance.mjs";
import { SCENARIOS } from "../scripts/qa/scenarios.mjs";

const snap = (lines, payload = {}, env = {}) =>
  serializeSnapshot({ env: { browser_version: "TestChrome/1", ...env }, payload, lines });

// ── Identical snapshots ──────────────────────────────────────────────────────

test("identical snapshots report no change", () => {
  const a = snap(['h2 "MEASUREMENT"', 'p "Missing item: 1"']);
  const d = diffSnapshots(a, a);
  assert.equal(d.identical, true);
  assert.equal(d.render.added.length, 0);
  assert.equal(d.render.removed.length, 0);
  assert.equal(d.render.changed.length, 0);
});

test("an unchanged capture of the real committed baseline diffs clean", () => {
  const baseline = path.resolve(
    import.meta.dirname,
    "../docs/qa/visual-acceptance-harness/single-findings--desktop.snapshot.txt"
  );
  // The committed baseline must remain parseable and self-identical, or the whole
  // regression story is broken before a single product change is made.
  const text = fs.readFileSync(baseline, "utf8");
  const parsed = parseSnapshot(text);
  assert.ok(parsed.render.length > 0, "committed baseline has render lines");
  assert.ok(parsed.payload.length > 0, "committed baseline has a payload section");
  assert.equal(diffSnapshots(text, text).identical, true);
});

// ── Added, removed, changed ──────────────────────────────────────────────────

test("an added line is reported as added", () => {
  const d = diffLines(["a", "b"], ["a", "b", "c"]);
  assert.equal(d.identical, false);
  assert.deepEqual(d.added.map((o) => o.line), ["c"]);
  assert.equal(d.removed.length, 0);
  assert.equal(d.changed.length, 0);
});

test("a removed line is reported as removed", () => {
  const d = diffLines(["a", "b", "c"], ["a", "c"]);
  assert.deepEqual(d.removed.map((o) => o.line), ["b"]);
  assert.equal(d.added.length, 0);
  assert.equal(d.changed.length, 0);
});

test("a reworded line is reported as one change, not an add plus a remove", () => {
  const d = diffLines(
    ['p "Missing item: 1 · Framing issue: 1"'],
    ['p "Missing item: 0 · Framing issue: 1"']
  );
  assert.equal(d.changed.length, 1);
  assert.equal(d.added.length, 0);
  assert.equal(d.removed.length, 0);
  assert.match(d.changed[0].from, /Missing item: 1/);
  assert.match(d.changed[0].to, /Missing item: 0/);
});

test("the wrong-state defect class shows up as a render change", () => {
  // This is the defect that actually occurred here: a panel counting the wrong
  // findings source. It changes rendered text, so the snapshot layer catches it.
  const before = snap(['h2 "MEASUREMENT"', 'p "Missing item: 1 · Framing issue: 1 · Deflection: 0"']);
  const after = snap(['h2 "MEASUREMENT"', 'p "Missing item: 3 · Framing issue: 1 · Deflection: 0"']);
  const d = diffSnapshots(before, after);
  assert.equal(d.identical, false);
  assert.equal(d.render.changed.length, 1);
});

test("a control-state flip is reported even when the label is unchanged", () => {
  const before = snap(['button "Run again" disabled=false']);
  const after = snap(['button "Run again" disabled=true']);
  const d = diffSnapshots(before, after);
  assert.equal(d.render.changed.length, 1);
});

test("payload and render changes are reported separately", () => {
  const before = snap(['p "x"'], { "/api/read": { completeness: "partial" } });
  const after = snap(['p "x"'], { "/api/read": { completeness: "full" } });
  const d = diffSnapshots(before, after);
  assert.equal(d.identical, false);
  assert.equal(d.payload.identical, false);
  assert.equal(d.render.identical, true, "render is untouched when only the payload moved");
});

// ── Baseline-only and fresh-only ─────────────────────────────────────────────

test("a baseline-only line is removed and a fresh-only line is added", () => {
  const d = diffLines(["only-in-baseline"], ["only-in-fresh"]);
  // Equal-length runs pair into a change rather than an orphan add and remove.
  assert.equal(d.changed.length, 1);

  const d2 = diffLines(["kept", "baseline-only"], ["kept"]);
  assert.deepEqual(d2.removed.map((o) => o.line), ["baseline-only"]);

  const d3 = diffLines(["kept"], ["kept", "fresh-only"]);
  assert.deepEqual(d3.added.map((o) => o.line), ["fresh-only"]);
});

test("image diff reports missing on either side", () => {
  const buf = Buffer.from([1, 2, 3]);
  assert.equal(diffImageBuffers(null, buf).status, "missing-baseline");
  assert.equal(diffImageBuffers(buf, null).status, "missing-fresh");
  assert.equal(diffImageBuffers(null, null).status, "missing-both");
  assert.equal(diffImageBuffers(buf, Buffer.from([1, 2, 3])).status, "identical");
  assert.equal(diffImageBuffers(buf, Buffer.from([1, 2, 4])).status, "changed");
  // Same length, different content must not read as identical.
  assert.equal(diffImageBuffers(Buffer.from("aaaa"), Buffer.from("aaab")).status, "changed");
});

// ── Normalization ────────────────────────────────────────────────────────────

test("timestamps are tokenized, not deleted", () => {
  const out = normalizeText("Model: (not declared) · 2026-07-25T12:00:00.000Z");
  assert.match(out, /<TIMESTAMP>/);
  assert.doesNotMatch(out, /2026-07-25T12:00/);
  // The surrounding product text survives.
  assert.match(out, /Model: \(not declared\)/);
});

test("two captures taken at different times normalize to the same line", () => {
  const a = normalizeText("run at 2026-07-25T12:00:00.000Z");
  const b = normalizeText("run at 2026-11-02T23:59:59.123Z");
  assert.equal(a, b);
});

test("run ids and hashes are tokenized", () => {
  assert.match(normalizeText("request 0000000000000000"), /<ID>/);
  assert.match(normalizeText("req a1b2c3d4e5f60718"), /<ID>/);
  assert.equal(normalizeText("request 0000000000000000"), normalizeText("request a1b2c3d4e5f60718"));

  const h = "e3be7b0870ff4673ed6274452933d17d50e20cc73ea12461e07c5f5a1faad578";
  assert.match(normalizeText(`hash ${h}`), /<HASH64>/);

  assert.match(normalizeText("id 3f2504e0-4f89-11d3-9a0c-0305e82c3301"), /<UUID>/);
});

test("normalization does not swallow ordinary product text", () => {
  const line = "Reader inspections are discovery, not evidence.";
  assert.equal(normalizeText(line), line);
  assert.equal(normalizeText("Missing item: 1 · Framing issue: 1 · Deflection: 0"),
    "Missing item: 1 · Framing issue: 1 · Deflection: 0");
});

test("whitespace and line endings are canonicalized", () => {
  assert.equal(normalizeText("  a\r\n\r\n   b  \t c "), "a b c");
});

test("hrefs normalize to repository-relative and absolute local paths are tokenized", () => {
  assert.equal(normalizeHref("http://127.0.0.1:52341/workbench.html"), "/workbench.html");
  assert.equal(normalizeHref("http://localhost:8080/archive.html"), "/archive.html");
  assert.equal(normalizeHref("http://127.0.0.1:9/x.html", "http://127.0.0.1:9"), "/x.html");
  assert.equal(normalizeHref("file:///Users/someone/imbas-site/workbench.html"), "<ABSPATH>");
  assert.equal(normalizeHref("/how-it-works.html"), "/how-it-works.html");
});

test("a port change alone does not move the snapshot", () => {
  // The static server binds port 0, so the port differs on every single run.
  const a = normalizeEntries([{ tag: "a", text: "Workbench", href: "http://127.0.0.1:1111/workbench.html" }]);
  const b = normalizeEntries([{ tag: "a", text: "Workbench", href: "http://127.0.0.1:65000/workbench.html" }]);
  assert.deepEqual(a, b);
});

test("canonicalJSON sorts keys so builder emission order does not leak in", () => {
  assert.equal(canonicalJSON({ b: 1, a: 2 }), canonicalJSON({ a: 2, b: 1 }));
  // Array order is meaningful and must be preserved.
  assert.notEqual(canonicalJSON([1, 2]), canonicalJSON([2, 1]));
});

test("entryToLine records state flags and drops contentless elements", () => {
  assert.equal(entryToLine({ tag: "button", text: "Copy", disabled: false }), 'button "Copy" disabled=false');
  assert.equal(
    entryToLine({ tag: "input", text: "", inputType: "checkbox", checked: true, disabled: false, readonly: false }),
    "input disabled=false readonly=false checked=true type=checkbox"
  );
  // A bare div with no text and no interactive state carries no signal.
  assert.deepEqual(normalizeEntries([{ tag: "div", text: "" }]), []);
});

// ── Serialize / parse round trip ─────────────────────────────────────────────

test("a snapshot round-trips through serialize and parse", () => {
  const text = snap(['h2 "MEASUREMENT"'], { "/api/read": { completeness: "partial" } }, { viewport: "1440x900" });
  const parsed = parseSnapshot(text);
  assert.equal(parsed.env.viewport, "1440x900");
  assert.equal(parsed.env.browser_version, "TestChrome/1");
  assert.deepEqual(parsed.render, ['h2 "MEASUREMENT"']);
  assert.ok(parsed.payload.join("\n").includes("completeness"));
  assert.ok(text.endsWith("\n"), "file ends with a newline");
});

// ── Malformed input rejection ────────────────────────────────────────────────

test("a malformed baseline is rejected rather than diffed", () => {
  // Diffing against garbage would report every line as changed and teach everyone
  // to ignore the diff.
  assert.throws(() => parseSnapshot("just some text\nwith no header"), /Not an imbas-visual-snapshot/);
  assert.throws(() => parseSnapshot(""), /Not an imbas-visual-snapshot/);
  assert.throws(() => parseSnapshot(null), /Not an imbas-visual-snapshot/);
  assert.throws(() => diffSnapshots("garbage", snap(["a"])), /Not an imbas-visual-snapshot/);
  assert.ok(SNAPSHOT_FORMAT.startsWith("imbas-visual-snapshot/"));
});

test("a malformed scenario is rejected", () => {
  assert.ok(assertScenarioCapturable("x", null).length, "null scenario rejected");
  assert.ok(
    assertScenarioCapturable("x", { name: "y", routes: { "/api/read": {} } }).some((p) => /disagrees/.test(p)),
    "key/name mismatch rejected"
  );
  assert.ok(
    assertScenarioCapturable("x", { name: "x", routes: {} }).some((p) => /no routes/.test(p)),
    "scenario with no routes rejected"
  );
  assert.ok(
    assertScenarioCapturable("x", {
      name: "x",
      routes: { "/api/read": {} },
      drivable: true,
      steps: [],
      assertSelector: ".x",
    }).some((p) => /no drive steps/.test(p)),
    "drivable scenario with no steps rejected"
  );
});

test("a drivable scenario with no DOM assertion is rejected", () => {
  const problems = assertScenarioCapturable("x", {
    name: "x",
    drivable: true,
    routes: { "/api/read": {} },
    steps: [{ click: ".go" }],
  });
  assert.ok(problems.some((p) => /no DOM assertion/.test(p)));
});

// A canned scenario photographs a surface built from committed copy, so it has no
// state to stub and the routes rule has nothing to protect. The escape hatch buys the
// empty route table only: it cannot smuggle past the drivable checks, and declaring
// it alongside routes is a contradiction rather than a preference.
test("a canned scenario may declare no routes, and nothing else", () => {
  const canned = {
    name: "x",
    canned: true,
    routes: {},
    drivable: true,
    steps: [{ click: ".go" }],
    assertSelector: ".x",
  };
  assert.deepEqual(assertScenarioCapturable("x", canned), [], "a well-formed canned scenario passes");

  assert.ok(
    assertScenarioCapturable("x", { ...canned, drivable: false, steps: undefined }).some((p) =>
      /canned scenario must be drivable/.test(p)
    ),
    "a canned scenario that drives nothing would photograph the page it landed on"
  );
  assert.ok(
    assertScenarioCapturable("x", { ...canned, routes: { "/api/read": {} } }).some((p) =>
      /marked canned but declares routes/.test(p)
    ),
    "canned and routes together is a contradiction"
  );
  assert.ok(
    assertScenarioCapturable("x", { ...canned, assertSelector: undefined }).some((p) =>
      /no DOM assertion/.test(p)
    ),
    "canned does not excuse a scenario from proving its state"
  );
});

test("every committed scenario passes its own shape check", () => {
  for (const [name, scenario] of Object.entries(SCENARIOS)) {
    assert.deepEqual(assertScenarioCapturable(name, scenario), [], `scenario ${name} is well formed`);
  }
});

// ── Browser error page ───────────────────────────────────────────────────────

test("a browser error page is detected and never treated as a capture", () => {
  // A dead server once produced a set of connection-error pages that compared
  // byte-identical to each other — a perfect, meaningless green.
  assert.equal(detectErrorPage(['h1 "This site can\'t be reached"']), "this site can't be reached");
  assert.ok(detectErrorPage(['p "ERR_CONNECTION_REFUSED"']));
  assert.ok(detectErrorPage(['div "127.0.0.1 refused to connect."']));
  assert.equal(detectErrorPage(['h2 "MEASUREMENT"', 'p "Missing item: 1"']), null);
  assert.equal(detectErrorPage([]), null);
});

// ── Capture failure must not replace a baseline ──────────────────────────────

test("a failed capture never replaces a baseline", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "qa-diff-test-"));
  const imgPath = path.join(dir, "single-findings--desktop.png");
  const snapPath = path.join(dir, "single-findings--desktop.snapshot.txt");
  const originalImg = Buffer.from("ORIGINAL-BASELINE-IMAGE");
  const originalSnap = snap(['h2 "MEASUREMENT"']);
  fs.writeFileSync(imgPath, originalImg);
  fs.writeFileSync(snapPath, originalSnap);

  const good = {
    filename: "single-findings--desktop.png",
    snapshotFilename: "single-findings--desktop.snapshot.txt",
    buf: Buffer.from("FRESH"),
    snapshotText: snap(['h2 "CHANGED"']),
  };

  // Second capture throws — a DOM assertion failure, a timeout, a browser crash.
  await assert.rejects(
    captureAll(["desktop", "mobile"], async (vp) => {
      if (vp === "mobile") throw new Error("Expected element not visible at capture time");
      return good;
    }),
    /Expected element not visible/
  );

  // The run aborted before the write path, so the baseline is untouched.
  assert.deepEqual(fs.readFileSync(imgPath), originalImg, "baseline image not overwritten");
  assert.equal(fs.readFileSync(snapPath, "utf8"), originalSnap, "baseline snapshot not overwritten");

  fs.rmSync(dir, { recursive: true, force: true });
});

test("captureAll resolves only when every capture succeeded", async () => {
  const results = await captureAll([1, 2, 3], async (n) => ({ n }));
  assert.deepEqual(results, [{ n: 1 }, { n: 2 }, { n: 3 }]);
});

test("commitResults writes both artifacts per result", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "qa-commit-test-"));
  const written = commitResults(dir, [
    {
      filename: "a--desktop.png",
      snapshotFilename: "a--desktop.snapshot.txt",
      buf: Buffer.from("IMG"),
      snapshotText: "SNAP",
    },
  ]);
  assert.equal(written.length, 2);
  assert.equal(fs.readFileSync(path.join(dir, "a--desktop.png"), "utf8"), "IMG");
  assert.equal(fs.readFileSync(path.join(dir, "a--desktop.snapshot.txt"), "utf8"), "SNAP");
  fs.rmSync(dir, { recursive: true, force: true });
});

// ── Image diff gating ────────────────────────────────────────────────────────

test("image diff is skipped when the baseline recorded it as disabled", () => {
  const c = imageComparability(
    { image_diff: "disabled", browser_version: "X", viewport: "1440x900", device_scale_factor: "2", mobile_emulation: "false" },
    { image_diff: "enabled", browser_version: "X", viewport: "1440x900", device_scale_factor: "2", mobile_emulation: "false" }
  );
  assert.equal(c.comparable, false);
  assert.match(c.reason, /disabled/);
});

test("image diff is skipped across browser builds rather than reported as a regression", () => {
  const base = {
    image_diff: "enabled",
    browser_version: "HeadlessChrome/148.0.7778.96",
    viewport: "1440x900",
    device_scale_factor: "2",
    mobile_emulation: "false",
  };
  const other = { ...base, browser_version: "HeadlessChrome/149.0.0.1" };
  const c = imageComparability(base, other);
  assert.equal(c.comparable, false);
  assert.match(c.reason, /browser_version differs/);

  // Same for a viewport or scale-factor change.
  assert.equal(imageComparability(base, { ...base, device_scale_factor: "1" }).comparable, false);
  assert.equal(imageComparability(base, { ...base, viewport: "375x812" }).comparable, false);

  // Matching environments do compare.
  assert.equal(imageComparability(base, { ...base }).comparable, true);
});

test("image diff is skipped when the baseline predates environment recording", () => {
  const c = imageComparability({}, { browser_version: "X" });
  assert.equal(c.comparable, false);
  assert.match(c.reason, /does not record/);
});

// ── CLI contract ─────────────────────────────────────────────────────────────

test("--update requires a named scenario and there is no bulk update flag", () => {
  assert.deepEqual(parseArgs(["--update", "single-findings"]).update, ["single-findings"]);
  assert.throws(() => parseArgs(["--update"]), /requires a scenario name/);
  assert.throws(() => parseArgs(["--update", "--diff"]), /requires a scenario name/);
  assert.throws(() => parseArgs(["--update-all"]), /does not exist, deliberately/);
  assert.throws(() => parseArgs(["--accept-all"]), /does not exist, deliberately/);
  assert.throws(() => parseArgs(["-u"]), /does not exist, deliberately/);
});

test("--diff and --update are mutually exclusive modes", () => {
  assert.throws(() => parseArgs(["--diff", "--update", "single-findings"]), /different modes/);
  assert.equal(parseArgs(["--diff"]).diff, true);
});

test("unknown arguments are rejected", () => {
  assert.throws(() => parseArgs(["--nope"]), /Unknown argument/);
});
