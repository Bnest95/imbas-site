// Guardrail: the board renders on the renderer this repository declares, or it does not render.
// Run: node --test test/qa-browser-resolution.test.mjs
//
// The defect this closes: the resolver enumerated browser caches and launched the first
// executable it could run. On a machine holding both chromium_headless_shell-1217
// (Chrome 147) and chromium_headless_shell-1223 (Chrome 148), "1217" sorts first, so
// every run rendered on 147 while the committed baselines recorded 148 — and the board
// compared 62 of 62 snapshots against 0 of 62 images and exited 0.
//
// So selection is computed, never searched. playwright-core ships the browser registry
// it was built against; the pinned version of that dependency names one revision, and
// that revision names exactly one path. The tests below pin the three properties that
// makes true: the declared build wins over an older one that sorts ahead of it, an
// unrelated newer build on the same machine is not a candidate at all, and no listing of
// any directory can move the answer. Everything else is fail-closed — absent,
// incomplete, unexecutable, or the wrong identity all stop the run before capture.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  GOVERNED_BROWSER,
  governedRendererSpec,
  platformLayout,
  locatePlaywrightCore,
  resolveBrowser,
  formatGovernedRenderer,
} from "../scripts/qa/visual-acceptance.mjs";

const HARNESS = new URL("../scripts/qa/visual-acceptance.mjs", import.meta.url);

// ── A machine, described rather than created ─────────────────────────────────
// Selection is a path computation, so a fake machine is just the set of paths that
// exist. Listing order is supplied separately and deliberately, because a resolver that
// cannot be swayed by it must be shown a hostile order and produce the same answer.
function machine({ paths, versions = {} }) {
  const present = new Set(paths);
  return {
    exists: (p) => present.has(p),
    isExecutable: (p) => present.has(p),
    probeVersion: (p) => {
      const v = versions[p];
      if (!v) throw new Error(`nothing executable at ${p}`);
      return v;
    },
  };
}

const LAYOUT = { cache: "Caches/ms-playwright", platformDir: "shell-mac-arm64", binary: "chrome-headless-shell" };
const SPEC = {
  playwrightCoreVersion: "1.60.0",
  revision: "1223",
  browserVersion: "148.0.7778.96",
  installDirName: "chromium_headless_shell-1223",
};
const HOME = "/fake/home";
const REGISTRY = path.join(HOME, LAYOUT.cache);

const shellIn = (dirName) => path.join(REGISTRY, dirName, LAYOUT.platformDir, LAYOUT.binary);
const GOVERNED = shellIn("chromium_headless_shell-1223");
const OLDER = shellIn("chromium_headless_shell-1217");

// A machine that holds the governed build, an older build whose directory name sorts
// ahead of it, and an unrelated newer Chrome in a different cache entirely.
function crowdedMachine(extra = {}) {
  const puppeteerNewer = path.join(HOME, ".cache/puppeteer/chrome-headless-shell/mac_arm-150.0.7871.24/x/chrome-headless-shell");
  return machine({
    paths: [
      path.join(REGISTRY, "chromium_headless_shell-1217"),
      path.join(REGISTRY, "chromium_headless_shell-1217", "INSTALLATION_COMPLETE"),
      OLDER,
      path.join(REGISTRY, "chromium_headless_shell-1223"),
      path.join(REGISTRY, "chromium_headless_shell-1223", "INSTALLATION_COMPLETE"),
      GOVERNED,
      puppeteerNewer,
      ...(extra.paths ?? []),
    ],
    versions: {
      [OLDER]: "147.0.7727.15",
      [GOVERNED]: "148.0.7778.96",
      [puppeteerNewer]: "150.0.7871.24",
      ...(extra.versions ?? {}),
    },
  });
}

const resolveOn = (m, over = {}) =>
  resolveBrowser({ spec: SPEC, layout: LAYOUT, env: {}, home: HOME, ...m, ...over });

// ── Selection ────────────────────────────────────────────────────────────────

test("the declared build is selected even though an older one sorts ahead of it", () => {
  const resolved = resolveOn(crowdedMachine());
  assert.equal(resolved.binary, GOVERNED);
  assert.equal(resolved.actualBrowserVersion, "148.0.7778.96");
  assert.ok(!resolved.binary.includes("1217"), "the 147 build sorts first and must still lose");
});

test("an unrelated newer browser on the same machine is not a candidate", () => {
  // Not "ranked lower" — never considered. Chrome 150 sits in Puppeteer's cache and the
  // resolver never reads that directory, because the pin does not point at it.
  const resolved = resolveOn(crowdedMachine());
  assert.ok(!resolved.binary.includes("150"), "the newest browser present must not be selected");
  assert.ok(!resolved.binary.includes("puppeteer"), "no cache other than the governed one is consulted");
  assert.equal(resolved.binary, GOVERNED);
});

test("selection follows the pin, so moving the pin moves the renderer and nothing else does", () => {
  const older = resolveOn(crowdedMachine(), {
    spec: { ...SPEC, revision: "1217", browserVersion: "147.0.7727.15", installDirName: "chromium_headless_shell-1217" },
  });
  assert.equal(older.binary, OLDER, "the governed build is whichever one the pin declares, not the newest");
});

test("no directory listing can change the answer", () => {
  // Structural, because an order-independence test that only tries two orders proves
  // two orders. A resolver that reads no directory cannot be swayed by any of them.
  const src = fs.readFileSync(HARNESS, "utf8");
  const start = src.indexOf("// ── Governed renderer resolution ─");
  const end = src.indexOf("function safeReaddir(");
  assert.ok(start > 0 && end > start, "the resolver is not where this test expects it");
  const body = src.slice(start, end);

  for (const forbidden of ["readdir", "glob", "sort(", "Applications/"]) {
    assert.ok(!body.includes(forbidden), `governed renderer resolution reaches ${forbidden}`);
  }
});

test("the resolved path is a pure function of the pin, the layout and the home directory", () => {
  const m = crowdedMachine();
  const twice = [resolveOn(m).binary, resolveOn(m).binary];
  assert.equal(twice[0], twice[1]);
  assert.equal(
    twice[0],
    path.join(HOME, LAYOUT.cache, SPEC.installDirName, LAYOUT.platformDir, LAYOUT.binary),
    "the path must be reconstructible from its inputs alone"
  );
});

test("PLAYWRIGHT_BROWSERS_PATH relocates the registry without loosening which build is chosen", () => {
  const elsewhere = "/opt/browsers";
  const governedThere = path.join(elsewhere, SPEC.installDirName, LAYOUT.platformDir, LAYOUT.binary);
  const m = machine({
    paths: [
      path.join(elsewhere, SPEC.installDirName),
      path.join(elsewhere, SPEC.installDirName, "INSTALLATION_COMPLETE"),
      governedThere,
    ],
    versions: { [governedThere]: "148.0.7778.96" },
  });
  const resolved = resolveBrowser({ spec: SPEC, layout: LAYOUT, env: { PLAYWRIGHT_BROWSERS_PATH: elsewhere }, home: HOME, ...m });
  assert.equal(resolved.binary, governedThere);
});

// ── Fail-closed ──────────────────────────────────────────────────────────────

test("a missing governed renderer stops the run and names the command that installs it", () => {
  const m = machine({ paths: [] });
  assert.throws(() => resolveOn(m), (e) => {
    assert.match(e.message, /not installed/);
    assert.match(e.message, /chromium_headless_shell-1223/);
    assert.match(e.message, new RegExp(`npx playwright-core install ${GOVERNED_BROWSER}`));
    return true;
  });
});

test("a missing governed renderer does not fall back to an older or newer build that is present", () => {
  // The whole failure mode in one test: everything except the governed build is here.
  const puppeteerNewer = path.join(HOME, ".cache/puppeteer/chrome-headless-shell/mac_arm-150.0.7871.24/x/chrome-headless-shell");
  const system = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  const m = machine({
    paths: [
      path.join(REGISTRY, "chromium_headless_shell-1217"),
      path.join(REGISTRY, "chromium_headless_shell-1217", "INSTALLATION_COMPLETE"),
      OLDER,
      puppeteerNewer,
      system,
    ],
    versions: { [OLDER]: "147.0.7727.15", [puppeteerNewer]: "150.0.7871.24", [system]: "151.0.7922.76" },
  });
  assert.throws(() => resolveOn(m), /not installed/);
});

test("an interrupted download is not an installed renderer", () => {
  const m = machine({
    paths: [path.join(REGISTRY, SPEC.installDirName), GOVERNED],
    versions: { [GOVERNED]: "148.0.7778.96" },
  });
  assert.throws(() => resolveOn(m), /download never completed/);
});

test("a present but unexecutable renderer stops the run", () => {
  const m = crowdedMachine();
  assert.throws(() => resolveOn(m, { isExecutable: (p) => p !== GOVERNED }), /not executable/);
});

test("a renderer reporting a different version stops the run before anything is captured", () => {
  const m = crowdedMachine();
  assert.throws(
    () => resolveOn(m, { probeVersion: () => "147.0.7727.15" }),
    (e) => {
      assert.match(e.message, /reports 147\.0\.7727\.15/);
      assert.match(e.message, /148\.0\.7778\.96/);
      return true;
    }
  );
});

test("a pin that governs no renderer is a stop, not a free choice", () => {
  assert.throws(
    () =>
      governedRendererSpec({
        packageRoot: "/fake",
        readJson: (p) => (p.endsWith("browsers.json") ? { browsers: [{ name: "firefox", revision: "1" }] } : { version: "1.60.0" }),
      }),
    /declares no usable "chromium-headless-shell" entry/
  );
});

test("an absent playwright-core stops the run rather than leaving the renderer ungoverned", () => {
  assert.throws(
    () =>
      locatePlaywrightCore(() => {
        throw new Error("ERR_MODULE_NOT_FOUND");
      }),
    /playwright-core is not installed/
  );
});

test("an unmapped platform stops rather than guessing a directory name", () => {
  assert.throws(() => platformLayout("linux", "x64"), /No governed-renderer layout for linux\/x64/);
});

// ── What a passing run states ────────────────────────────────────────────────

test("the successful path reports the executable, the pin, the governed build and what it reports", () => {
  const report = formatGovernedRenderer(resolveOn(crowdedMachine()));
  assert.match(report, /playwright-core:\s+1\.60\.0/);
  assert.match(report, /governs:\s+chromium-headless-shell r1223 \(148\.0\.7778\.96\)/);
  assert.match(report, new RegExp(`selected executable:\\s+${GOVERNED.replace(/[/.]/g, "\\$&")}`));
  assert.match(report, /reports:\s+148\.0\.7778\.96/);
});

test("the run asserts the launched process's CDP identity, not only the file on disk", () => {
  // The --version probe reads the binary; CDP reads the process that draws the pixels.
  // A run that checked only the first would accept a browser that execs something else.
  const src = fs.readFileSync(HARNESS, "utf8");
  assert.ok(
    src.includes('if (browserVersion !== `HeadlessChrome/${renderer.browserVersion}`)'),
    "the launched browser's reported identity is not checked against the governed version"
  );
  const guard = src.slice(src.indexOf("const versionInfo = await"));
  assert.ok(
    guard.indexOf("fail(") < guard.indexOf("Page.addScriptToEvaluateOnNewDocument"),
    "the identity check must stop the run before any capture"
  );
});

// ── This machine ─────────────────────────────────────────────────────────────
// The test below reads the real cache and the real binary on the machine running it, so
// its subject exists only where this board is captured. PLATFORM_LAYOUT declares macOS
// and nothing else on purpose — the committed baselines are macOS bytes, and a layout
// added for another platform would let the board render somewhere its baselines were not
// captured, which is the cross-renderer comparison this whole lane exists to prevent. A
// Linux CI runner therefore has no layout, and would have no binary either, because
// playwright-core downloads no browser when it installs. Failing there reports the
// environment rather than the pin, so it states the reason and skips.
//
// The gap that leaves is already closed from both ends, unconditionally and without
// touching this machine's cache: the refusal to guess a layout is asserted above, and
// the pin is checked against the committed baselines below.
const notACaptureMachine = (() => {
  try {
    platformLayout();
    return false;
  } catch {
    return `${process.platform}/${process.arch} is not a platform this board is captured on`;
  }
})();

test("this checkout resolves to the build its own playwright-core declares", { skip: notACaptureMachine }, () => {
  // Not a fake tree: the real dependency, the real cache, the real binary. This is the
  // test that would have caught the 147 board, because on this machine 1217 is still
  // present and still sorts first.
  const spec = governedRendererSpec();
  const resolved = resolveBrowser();

  assert.equal(resolved.playwrightCoreVersion, spec.playwrightCoreVersion);
  assert.equal(resolved.actualBrowserVersion, spec.browserVersion);
  assert.ok(
    resolved.binary.includes(`chromium_headless_shell-${spec.revision}`),
    `resolved ${resolved.binary}, which is not revision ${spec.revision}`
  );
  assert.ok(fs.existsSync(resolved.binary), "the resolved executable is not on disk");
});

test("the board's committed baselines were captured on the renderer this pin governs", () => {
  // The two ends of the lane, checked against each other. If a playwright-core bump ever
  // moves the governed build, this fails and says so, rather than letting a run compare
  // fresh pixels from one browser against baselines from another.
  const baselineDir = new URL("../docs/qa/visual-acceptance-harness/", import.meta.url);
  const snapshots = fs.readdirSync(baselineDir).filter((f) => f.endsWith(".snapshot.txt"));
  assert.ok(snapshots.length > 0, "no committed baselines to check");

  const governed = `HeadlessChrome/${governedRendererSpec().browserVersion}`;
  const recorded = new Set(
    snapshots.map((f) => /^browser_version:\s*(.+)$/m.exec(fs.readFileSync(new URL(f, baselineDir), "utf8"))?.[1]?.trim())
  );
  assert.deepEqual([...recorded], [governed], `baselines record ${[...recorded].join(", ")}, pin governs ${governed}`);
});
