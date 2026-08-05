#!/usr/bin/env node
// scripts/qa/visual-acceptance.mjs — committed visual acceptance harness.
//
// Drives the workbench into a named app state and writes a PNG to disk. Zero new
// dependencies: it speaks Chrome DevTools Protocol over Node's global WebSocket
// (Node >= 22) to a headless Chrome already installed on the machine.
//
// WHY THIS EXISTS
// Three passes in a row produced visual acceptance evidence and lost it — an ad hoc
// harness that was never committed, and screenshots that existed only as inline
// images in a chat transcript with no file path. This writes files to disk, under
// version control, with checksums.
//
// NO METERED CALL IS POSSIBLE HERE. Three independent layers:
//   1. An in-page fetch stub answers /api/* from scripts/qa/scenarios.mjs.
//   2. The static server treats any /api/* request as a hard failure — if one
//      arrives, the stub did not install, and the run aborts rather than capturing
//      a wrong state.
//   3. CDP request interception denies every origin by default. Only the local
//      server and the three asset origins the page needs are allowed, and those
//      are disk-cached. Anything else is failed and reported.
//
// Usage:
//   node scripts/qa/visual-acceptance.mjs --list
//   node scripts/qa/visual-acceptance.mjs --scenario single-findings --out docs/qa/my-pass
//   node scripts/qa/visual-acceptance.mjs --all --out docs/qa/my-pass
//   node scripts/qa/visual-acceptance.mjs --scenario single-findings --viewport mobile-tall --out docs/qa/my-pass
//   node scripts/qa/visual-acceptance.mjs --all --diff              # compare, write nothing
//   node scripts/qa/visual-acceptance.mjs --update single-findings  # accept ONE baseline
//   node scripts/qa/visual-acceptance.mjs --manifest                # rewrite the record, no browser
//
// Capture mode requires --out and refuses to aim it at the committed baseline
// directory. Baselines move only under --update <scenario>. See the baseline write
// boundary below for why.

import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SCENARIOS, resolvePayloads, assertScenarioIntegrity, INJECT_HTTP, INJECT_HANG } from "./scenarios.mjs";
import {
  EXTRACTOR_SOURCE,
  normalizeEntries,
  serializeSnapshot,
  parseSnapshot,
  diffSnapshots,
  diffImageBuffers,
  imageComparability,
  detectErrorPage,
  assertScenarioCapturable,
  formatDiff,
} from "./snapshot.mjs";
import {
  RASTER_POLICIES,
  resolvePolicy,
  toDeviceBounds,
  comparePolicy,
  formatPolicyReport,
} from "./raster-policy.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "../..");
const CACHE_DIR = path.join(REPO_ROOT, ".qa-cache");

const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");
const log = (...a) => console.log(...a);
const fail = (msg) => {
  throw new Error(msg);
};

// ── The baseline write boundary ──────────────────────────────────────────────
// docs/qa/visual-acceptance-harness/ holds the ACCEPTED baselines. It used to be
// the default --out, so `--all` with no destination silently rewrote every one of
// them. A --diff run immediately afterwards then compared a fresh capture against
// a baseline that same run had just written and reported no regressions — a false
// green that only survived being believed because a person happened to notice.
//
// The guarded interface around --update meant nothing while that default stood:
// --update demands a named scenario and --update-all is a hard error, but bare
// --all walked past both. So the check here is on the resolved PATH rather than
// on a flag. A flag check only covers the code paths someone remembered to check;
// a path check covers the ones they did not.
export const BASELINE_DIR = path.resolve(REPO_ROOT, "docs/qa/visual-acceptance-harness");

const insideBaselineDir = (p) => {
  const resolved = path.resolve(p);
  return resolved === BASELINE_DIR || resolved.startsWith(BASELINE_DIR + path.sep);
};

// An authorization to write named files inside BASELINE_DIR. It is constructed in
// exactly one place — update mode, from scenario names a person typed — and it
// lists the files it permits up front. A capture that drifted onto some other
// filename therefore cannot ride into the baseline directory on the back of
// someone else's acceptance.
export class BaselineGrant {
  constructor(scenarioNames, viewports, scenarios = SCENARIOS) {
    if (!Array.isArray(scenarioNames) || scenarioNames.length === 0) {
      fail("A baseline grant requires at least one explicitly named scenario. There is no bulk accept.");
    }
    if (!Array.isArray(viewports) || viewports.length === 0) {
      fail("A baseline grant requires the viewports being accepted.");
    }
    const files = new Set();
    for (const name of scenarioNames) {
      const scenario = scenarios[name];
      if (!scenario) {
        fail(
          `Cannot accept a baseline for unknown scenario "${name}". ` +
            `Known: ${Object.keys(scenarios).join(", ")}`
        );
      }
      if (!scenario.drivable) {
        fail(
          `Cannot accept a baseline for fixture-only scenario "${name}": it has no drive steps, so no ` +
            `capture of that state exists. Add drive steps in scripts/qa/scenarios.mjs first.`
        );
      }
      for (const viewport of viewports) {
        files.add(`${name}--${viewport}.png`);
        files.add(`${name}--${viewport}.snapshot.txt`);
      }
    }
    // manifest.md is deliberately NOT here. It is no longer written from a capture
    // run at all — it is derived from the committed bytes by regenerateManifest,
    // which mints its own narrower authorization. An acceptance grants pixels; it
    // does not need, and must not carry, permission to rewrite the record of them.
    this.scenarios = [...scenarioNames];
    this.files = files;
  }

  allows(filename) {
    return this.files.has(filename);
  }

  assertAllows(filename) {
    if (!this.allows(filename)) {
      fail(
        `Refusing to write ${filename} into the committed baseline directory. This run accepted ` +
          `${this.scenarios.map((s) => `"${s}"`).join(", ")}, and that file belongs to none of them. ` +
          `Accept one scenario at a time with --update <scenario>.`
      );
    }
  }
}

// The authorization the manifest regeneration holds, and the only other one that
// opens the baseline directory. It is strictly narrower than a BaselineGrant: it
// permits exactly one filename and can never be widened by an argument, so no pixel
// and no snapshot can ride into the baseline directory behind a manifest rewrite.
// It takes no scenario names because it needs none — the manifest is derived from
// whatever is already committed, so rewriting it destroys no accepted state.
export class ManifestGrant {
  constructor() {
    this.scenarios = ["(manifest only — no scenario)"];
  }

  allows(filename) {
    return filename === "manifest.md";
  }

  assertAllows(filename) {
    if (!this.allows(filename)) {
      fail(
        `Refusing to write ${filename} into the committed baseline directory. A manifest grant ` +
          `authorizes manifest.md and nothing else.`
      );
    }
  }
}

// THE single write function. Every artefact this harness puts on disk goes through
// here, so no path into the baseline directory exists that does not first prove a
// person named the scenario being replaced.
export function writeArtifact(filePath, data, grant = null) {
  const resolved = path.resolve(filePath);
  if (insideBaselineDir(resolved)) {
    if (!grant) {
      fail(
        `Refusing to write ${path.relative(REPO_ROOT, resolved)} — it is inside the committed baseline ` +
          `directory and this run holds no acceptance. Baselines move only under --update <scenario>, ` +
          `which prints the full diff before it writes.`
      );
    }
    grant.assertAllows(path.basename(resolved));
  }
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, data);
  return resolved;
}

// Where this run is allowed to put its output, decided before anything expensive
// runs so a misaimed command fails on the command line rather than after a browser
// launch and a full capture.
export function resolveDestination(args) {
  const requested = args.outDir ? path.resolve(REPO_ROOT, args.outDir) : null;
  const mode = args.diff ? "diff" : args.update.length ? "update" : "capture";

  if (mode === "capture") {
    if (!requested) {
      fail(
        "Capture mode needs an explicit destination: --out <dir>. It no longer defaults to the committed " +
          "baseline directory, because that made a bare --all overwrite every accepted baseline without " +
          "saying so, and a --diff run straight afterwards then compared against what it had just " +
          "written. To check for regressions use --diff; to accept a change use --update <scenario>."
      );
    }
    if (insideBaselineDir(requested)) {
      fail(
        `--out ${args.outDir} points inside the committed baseline directory. Capture mode may not write ` +
          `there. Compare against the baselines with --diff, or accept a change one scenario at a time ` +
          `with --update <scenario>.`
      );
    }
    return { mode, outDir: requested };
  }
  return { mode, outDir: requested || BASELINE_DIR };
}

// ── Viewports ────────────────────────────────────────────────────────────────
// mobile-tall exists because a 375x812 capture was reported to render blank at the
// compositor while 375x1600 rendered correctly. Both are kept so the claim can be
// re-tested rather than assumed; see docs for what this run actually measured.
export const VIEWPORTS = {
  desktop: { width: 1440, height: 900, dsf: 2, mobile: false },
  mobile: { width: 375, height: 812, dsf: 3, mobile: true },
  "mobile-tall": { width: 375, height: 1600, dsf: 3, mobile: true },
};

// The viewports the board is actually kept at. Declared once and read by both the
// command line default and the manifest, because those two disagreeing is how a
// registered baseline becomes one the manifest does not list: the run photographs a
// viewport the record has never heard of, or the record demands one no run captures.
// mobile-tall is declared above and deliberately absent here — see UNPHOTOGRAPHED.
export const BOARD_VIEWPORTS = ["desktop", "mobile"];

// ── What the board does not cover ────────────────────────────────────────────
// Written into the manifest, because a board that lists only what it photographs
// reads as complete. Each entry is a state that exists in the product with no image
// on the board, and the reason it has none. Reasons are scope decisions or fences,
// never "we did not get to it" without saying so.
const UNPHOTOGRAPHED = [
  {
    state: "The chip lane's empty comparison",
    why:
      "`CHIP_UI.reveal.empty_delta` in `reader-paired.js` renders its own empty state in the " +
      "chip reveal, separate from the Reader's. The chip lane is fenced at chip.1.0 and this " +
      "pass was instructed not to touch its logic, so photographing it would have meant " +
      "driving a lane it could not fix if the capture found something wrong.",
  },
  {
    state: "A published share whose sources WERE captured",
    why:
      "The share board photographs `share-receipt`, where the sources section stands as " +
      "NOT_CAPTURED and says so in words — which is the state every share is in today, because " +
      "nothing in the capture path preserves source artifacts yet. The OBSERVED rendering of " +
      "that section has no product path to reach it, so a scenario for it would photograph a " +
      "fixture rather than the product. It arrives with the first capture path that preserves " +
      "sources.",
  },
  {
    state: "A route that returns an unparseable body",
    why:
      "The harness can now inject failures — `httpFailure` and `neverResolves` in " +
      "`scripts/qa/scenarios.mjs` — and `read-error`, `read-capacity` and `read-in-flight` " +
      "photograph the three states that matter. A malformed body is the one failure left " +
      "unphotographed: the client maps it to `bad_json`, which renders the same banner as the " +
      "`no_key` and `disabled` configuration states already covered in wording by " +
      "`read-error`'s frame. Injecting it is one line whenever a reviewer wants the image.",
  },
  {
    state: "The curated case result panel, after a visitor pastes",
    why:
      "The board photographs the curated console at its first screen (`curated-readout`), which " +
      "is one step before this. The panel is where the retired score gauge and the retired " +
      "CLOSED GAP / PARTIALLY SURFACED / GAP HELD badge both sat, so it is the frame a reviewer " +
      "most wants. It is not photographed because `runDate` is built from `new Date()` at run " +
      "time and reaches the share text inside the panel, which would make the baseline change " +
      "every day and turn a real regression into noise nobody reads. Pinning the clock is a " +
      "harness capability, and the removal is held meanwhile by " +
      "`test/reader-no-allclear-vocabulary.test.mjs`, which asserts at source level that no " +
      "badge builder, verdict label table or tone class survives, and that the one sentence " +
      "standing there is read off the stored case rather than computed from the paste.",
  },
  {
    state: "The correction chips after a person has corrected the reading",
    why:
      "Every board state captures the default reading. The two corrected states change a " +
      "headline and add a call to action (`LOOP_STATE_STILL_MISSING`, `LOOP_STATE_NOT_CLEAR` " +
      "in `workbench-app.jsx`). They are reachable by one more drive step and are the most " +
      "obvious next scenarios to add.",
  },
  {
    state: "The mobile-tall viewport",
    why:
      "Declared in VIEWPORTS and not part of the default board. It exists to re-test a " +
      "reported blank-compositor claim at 375x812, not to double every baseline; running it " +
      "by default would triple the image set to re-photograph the same states.",
  },
];

// ── Photographed, but not under the name a reviewer will search for ──────────
// These states ARE on the board. They are listed separately because no scenario is
// named after them, so someone looking for one by name finds nothing and concludes
// it is missing. Anything here is covered; nothing here is a gap. Keeping it out of
// UNPHOTOGRAPHED matters — a covered state filed under "does not photograph" tells a
// reviewer the opposite of the truth.
const COVERED_UNDER_ANOTHER_NAME = [
  {
    state: "The paired surface with an ABSENT original-answer side",
    photographedBy: "`paired-unmatched`",
    why:
      "Its second row renders only the Second answer excerpt, because the open side resolved " +
      "to nothing and the surface leaves it out rather than standing a placeholder in its " +
      "place. The scenario's `expected` states it, and `test/qa-board-coverage.test.mjs` holds " +
      "the fixture to it.",
  },
];

// ── Pinned environment ───────────────────────────────────────────────────────
// Recorded into the manifest and into every snapshot so a future run can explain
// why a baseline is or is not comparable. Locale and timezone are pinned because
// any product code reaching for toLocaleDateString would otherwise render one
// string on this machine and another on a machine set to a different zone.
const PINNED = {
  locale: "en-US",
  timezone: "UTC",
  color_scheme: "light",
  reduced_motion: "reduce",
  screenshot_format: "png",
  // Byte-reproducible output was proven on this machine: three consecutive captures
  // of single-findings produced one checksum once the scroll offset was made
  // deterministic. Recorded per baseline so a future run can tell whether the image
  // layer was trustworthy when that baseline was written.
  image_diff: "enabled",
  capture_region: "viewport (state scrolled into it)",
  // url and query_parameters are defaults, not pins: a scenario may name its own page
  // and its own query, and what it names is what gets recorded. See resolveNavigation.
  url: "/workbench.html",
  query_parameters: "(none)",
  font_strategy: "webfonts fetched once into .qa-cache/, served from disk, document.fonts.ready awaited",
};

// ── Per-scenario query string ────────────────────────────────────────────────
// One surface needs a query: the curated console renders only when the Reader flag is
// off, and the flag is read from the URL. Two things follow from that, and they are
// derived together here so they cannot disagree — the URL the browser is sent to, and
// the string recorded into the baseline's env block.
//
// The recorded value matters as much as the URL. query_parameters is deliberately NOT
// in IMAGE_ENV_KEYS: a different query is a different page, so it is a real difference
// to report, not an incomparability to skip. Recording it means a baseline captured
// under ?reader=0 can be read back as such instead of being mistaken for a capture of
// the bare page that happens to look nothing like it.
//
// A scenario may also name its own PAGE. The board was one page for as long as every
// state it photographed lived in the Workbench app; the share surfaces do not, and a
// share page photographed by driving the Workbench would be a picture of the wrong
// thing filed under the right name. The page is recorded beside the query for the same
// reason the query is: a baseline captured on another page has to read back as such
// rather than as a capture of this one that looks nothing like it.
export function resolveNavigation(scenario, pinned = PINNED) {
  const query = String((scenario && scenario.query) || "").replace(/^\?+/, "");
  const page = String((scenario && scenario.page) || pinned.url);
  return {
    page,
    path: `${page}${query ? `?${query}` : ""}`,
    query_parameters: query ? `?${query}` : pinned.query_parameters,
  };
}

// ── Page readiness ───────────────────────────────────────────────────────────
// When a page is ready to photograph is a property of the PAGE, not of the scenario.
// The Workbench is a React app: if React never loaded, nothing will ever mount, so
// that is a hard failure rather than something to wait out. The share surfaces are a
// classic script rendering into a container it first fills with a loading line, so
// waiting for the container would photograph the spinner; the wait is for the record
// or the error that replaces it.
//
// Deriving this from the resolved page rather than from a per-scenario flag is the
// point: a Workbench scenario cannot opt out of the check it most needs, and a share
// scenario is not failed by a check its page was never built to satisfy.
const PAGE_READINESS = {
  "/workbench.html": {
    react: true,
    rendered: "#root, [data-reactroot], main",
  },
  "/inspection.html": {
    react: false,
    rendered: ".insp-record__mast, .insp-error",
  },
};

export function resolveReadiness(page) {
  const rule = PAGE_READINESS[page];
  if (!rule) {
    fail(
      `No readiness rule for page "${page}". Add one to PAGE_READINESS naming what ` +
        `"rendered" means there — the harness will not guess, because guessing wrong ` +
        `captures a half-built page and files it as a baseline.`,
    );
  }
  return rule;
}

// ── Browser resolution ───────────────────────────────────────────────────────
// Priority order: purpose-built headless shells first (fastest, no profile), then
// full Chrome installs. Nothing is installed — if none of these exist the run stops
// and reports every path probed.
const BROWSER_CANDIDATES = [
  ...expandGlob(path.join(os.homedir(), ".cache/puppeteer/chrome-headless-shell"), "chrome-headless-shell"),
  ...expandGlob(path.join(os.homedir(), "Library/Caches/ms-playwright"), "chromium_headless_shell"),
  ...expandGlob(path.join(os.homedir(), "Library/Caches/ms-playwright"), "chromium-"),
  ...expandGlob(path.join(os.homedir(), ".cache/puppeteer/chrome"), "chrome"),
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
];

function expandGlob(baseDir, prefix) {
  // Cache layouts nest a version dir then a platform dir; walk two levels and take
  // any executable whose name looks like a Chromium binary.
  const found = [];
  if (!fs.existsSync(baseDir)) return found;
  for (const versionDir of safeReaddir(baseDir)) {
    if (!versionDir.startsWith(prefix)) continue;
    const vPath = path.join(baseDir, versionDir);
    for (const inner of safeReaddir(vPath)) {
      const iPath = path.join(vPath, inner);
      for (const name of [
        "chrome-headless-shell",
        "headless_shell",
        "Google Chrome for Testing",
        "Chromium",
        "chrome",
      ]) {
        const direct = path.join(iPath, name);
        if (fs.existsSync(direct) && fs.statSync(direct).isFile()) found.push(direct);
        const appBin = path.join(iPath, `${name}.app/Contents/MacOS/${name}`);
        if (fs.existsSync(appBin)) found.push(appBin);
      }
    }
  }
  return found;
}

function safeReaddir(p) {
  try {
    return fs.readdirSync(p);
  } catch {
    return [];
  }
}

function resolveBrowser() {
  const probed = [];
  for (const candidate of BROWSER_CANDIDATES) {
    probed.push(candidate);
    try {
      fs.accessSync(candidate, fs.constants.X_OK);
      return { binary: candidate, probed };
    } catch {
      /* keep probing */
    }
  }
  fail(
    "No usable headless browser found. Nothing was installed.\nProbed these paths:\n" +
      probed.map((p) => `  - ${p}`).join("\n")
  );
}

// ── Static server ────────────────────────────────────────────────────────────
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

function startStaticServer(root) {
  const state = { apiLeaks: [] };
  const server = createServer((req, res) => {
    const url = new URL(req.url, "http://127.0.0.1");
    let rel = decodeURIComponent(url.pathname);

    // Layer 2 of the no-metered-call guarantee. Reaching here means the in-page
    // stub did not install, so the run must not continue to a capture.
    if (rel.startsWith("/api/")) {
      state.apiLeaks.push(rel);
      res.writeHead(599, { "content-type": "text/plain" });
      res.end("HARNESS ABORT: /api/* reached the network. The in-page fetch stub did not install.");
      return;
    }

    if (rel.endsWith("/")) rel += "index.html";
    // Contain path traversal: resolve, then require the result stay under root.
    const filePath = path.resolve(root, "." + rel);
    if (!filePath.startsWith(path.resolve(root) + path.sep)) {
      res.writeHead(403).end("forbidden");
      return;
    }
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      res.writeHead(404, { "content-type": "text/plain" }).end("not found");
      return;
    }
    const body = fs.readFileSync(filePath);
    res.writeHead(200, {
      "content-type": MIME[path.extname(filePath)] || "application/octet-stream",
      "cache-control": "no-store",
    });
    res.end(body);
  });

  return new Promise((resolve) => {
    // Bind to 127.0.0.1 explicitly. Binding/serving via "localhost" produced
    // connection refusals when it resolved to ::1 while the server held IPv4 only.
    server.listen(0, "127.0.0.1", () => {
      resolve({ server, port: server.address().port, state });
    });
  });
}

// ── CDP client over the global WebSocket ─────────────────────────────────────
class CDP {
  constructor(ws) {
    this.ws = ws;
    this.nextId = 1;
    this.pending = new Map();
    this.handlers = new Map();
    ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(`${msg.error.message} (${JSON.stringify(msg.error)})`));
        else resolve(msg.result);
        return;
      }
      const list = this.handlers.get(msg.method);
      if (list) for (const fn of list) fn(msg.params);
    });
  }

  static connect(wsUrl) {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl);
      ws.addEventListener("open", () => resolve(new CDP(ws)));
      ws.addEventListener("error", () => reject(new Error(`CDP websocket failed: ${wsUrl}`)));
    });
  }

  // Every call is bounded. An in-page promise that never settles (document.fonts.ready
  // behind a stalled font request, requestAnimationFrame in a headless shell that is
  // not compositing) would otherwise wedge Runtime.evaluate forever, and the run hangs
  // silently instead of failing.
  send(method, params = {}, timeout = 30000) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP call timed out after ${timeout}ms: ${method}`));
      }, timeout);
      const done = (fn) => (v) => {
        clearTimeout(timer);
        fn(v);
      };
      this.pending.set(id, { resolve: done(resolve), reject: done(reject) });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  on(method, fn) {
    if (!this.handlers.has(method)) this.handlers.set(method, []);
    this.handlers.get(method).push(fn);
  }

  close() {
    try {
      this.ws.close();
    } catch {
      /* already gone */
    }
  }
}

// ── Browser launch ───────────────────────────────────────────────────────────
async function launchBrowser(binary) {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "imbas-qa-"));
  const args = [
    "--headless=new",
    "--remote-debugging-port=0",
    `--user-data-dir=${userDataDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-gpu",
    "--hide-scrollbars",
    "--disable-background-timer-throttling",
    "--disable-renderer-backgrounding",
    "--disable-backgrounding-occluded-windows",
    "--force-color-profile=srgb",
    "about:blank",
  ];
  const proc = spawn(binary, args, { stdio: ["ignore", "pipe", "pipe"] });
  let stderr = "";
  proc.stderr.on("data", (d) => (stderr += d.toString()));

  const portFile = path.join(userDataDir, "DevToolsActivePort");
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    if (fs.existsSync(portFile)) {
      const lines = fs.readFileSync(portFile, "utf8").split("\n");
      if (lines.length >= 2 && lines[0].trim()) {
        return { proc, userDataDir, port: Number(lines[0].trim()) };
      }
    }
    if (proc.exitCode !== null) {
      fail(`Browser exited immediately (code ${proc.exitCode}).\n${stderr.slice(0, 2000)}`);
    }
    await sleep(50);
  }
  proc.kill("SIGKILL");
  fail(`Browser never wrote DevToolsActivePort within 20s.\n${stderr.slice(0, 2000)}`);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Asset allowlist + disk cache ─────────────────────────────────────────────
// The page loads React from cdnjs and its typefaces from Google Fonts. Blocking
// those would still render, but in fallback system fonts at the wrong metrics —
// a misleading capture. So they are allowed, fetched once, and cached to disk;
// every subsequent run is fully offline. Everything else is denied.
const ALLOWED_ORIGINS = new Set(["cdnjs.cloudflare.com", "fonts.googleapis.com", "fonts.gstatic.com"]);

function cachePathFor(url) {
  return path.join(CACHE_DIR, sha256(url).slice(0, 32));
}

async function fetchThroughCache(url) {
  const base = cachePathFor(url);
  const metaPath = `${base}.json`;
  const bodyPath = `${base}.bin`;
  if (fs.existsSync(metaPath) && fs.existsSync(bodyPath)) {
    return { ...JSON.parse(fs.readFileSync(metaPath, "utf8")), body: fs.readFileSync(bodyPath), cached: true };
  }
  const res = await fetch(url, {
    // Bounded: an unanswered asset fetch would leave a CDP request paused forever
    // and wedge page load.
    signal: AbortSignal.timeout(20000),
    headers: {
      // Google Fonts serves woff2 only to UAs it believes support it.
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36",
    },
  });
  if (!res.ok) fail(`Asset fetch failed ${res.status} for ${url}`);
  const body = Buffer.from(await res.arrayBuffer());
  const meta = { status: res.status, contentType: res.headers.get("content-type") || "application/octet-stream" };
  // Through the same door as everything else. The cache can never resolve inside
  // the baseline directory, so this needs no grant — but routing it here keeps the
  // rule "every write goes through writeArtifact" true without exception.
  writeArtifact(metaPath, JSON.stringify(meta));
  writeArtifact(bodyPath, body);
  return { ...meta, body, cached: false };
}

// ── In-page stub + drive helpers ─────────────────────────────────────────────
// Installed via Page.addScriptToEvaluateOnNewDocument so it is in place before
// workbench.bundle.js runs, not racing it.
function buildStubScript(payloads) {
  return `
(() => {
  const PAYLOADS = ${JSON.stringify(payloads)};
  const realFetch = window.fetch.bind(window);
  window.__qaCalls = [];

  window.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : (input && input.url) || "";
    const p = (() => { try { return new URL(url, location.href).pathname; } catch { return url; } })();
    if (Object.prototype.hasOwnProperty.call(PAYLOADS, p)) {
      const v = PAYLOADS[p];
      // Recorded BEFORE the branch, so an injected failure still counts as a served
      // route. The capture routine's "the app never called a stubbed route" check
      // would otherwise read a photographed error state as a scenario that never ran.
      window.__qaCalls.push(p);
      // Never settles. The app stays mid-request; nothing here times it out, because
      // the point of the state is that it has not finished.
      if (v && v["${INJECT_HANG}"] === true) return new Promise(() => {});
      if (v && v["${INJECT_HTTP}"] === true) {
        return new Response(v.body === null ? "" : JSON.stringify(v.body), {
          status: v.status,
          headers: { "content-type": "application/json" },
        });
      }
      return new Response(JSON.stringify(v), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    if (p.startsWith("/api/")) {
      window.__qaCalls.push("UNSTUBBED:" + p);
      throw new Error("HARNESS: unstubbed /api route " + p);
    }
    return realFetch(input, init);
  };

  const nativeSet = (el, value) => {
    // React tracks its own value on the node; assigning .value directly leaves the
    // tracker in sync and onChange never fires. Go through the prototype setter.
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value").set.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  };

  const boxed = (el) => {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };

  window.__qa = {
    fill(sel, text) {
      const el = document.querySelector(sel);
      if (!el) return { ok: false, why: "no match for " + sel };
      el.focus();
      nativeSet(el, text);
      return { ok: true };
    },
    click(sel) {
      const el = document.querySelector(sel);
      if (!el) return { ok: false, why: "no match for " + sel };
      if (el.disabled) return { ok: false, why: "disabled: " + sel };
      el.click();
      return { ok: true };
    },
    clickText(sel, text) {
      const el = [...document.querySelectorAll(sel)].find((n) => (n.textContent || "").includes(text));
      if (!el) return { ok: false, why: "no " + sel + " containing " + JSON.stringify(text) };
      el.click();
      return { ok: true };
    },
    visible(sel) { return boxed(document.querySelector(sel)); },
    // innerText, not textContent, so this asserts against text the user can
    // actually see. Case-folded and whitespace-collapsed because Chrome applies
    // text-transform to innerText — an uppercased heading would otherwise never
    // match the string as it appears in the source.
    hasText(t) {
      const norm = (s) => (s || "").replace(/\\s+/g, " ").trim().toLowerCase();
      return norm(document.body.innerText).includes(norm(t));
    },
    bodyText() { return (document.body.innerText || "").replace(/\\s+/g, " ").trim(); },
    rect(sel) {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: r.top, left: r.left, width: r.width, height: r.height, bottom: r.bottom };
    },
    // Deterministic framing. scrollIntoView({block:"center"}) was measured landing on
    // a DIFFERENT offset on every run (2507, 2428, 2436 across three runs) while the
    // element's absolute document position stayed constant at 2823.21875 — it resolves
    // its target against layout as it reads at call time, and never corrects. That was
    // the sole remaining source of capture nondeterminism.
    //
    // This computes the target from the element's ABSOLUTE position, rounds to an
    // integer CSS pixel, clamps to the scrollable range, and returns the target so the
    // caller can verify the browser actually landed there.
    scrollToDeterministic(sel) {
      const el = document.querySelector(sel);
      if (!el) return { ok: false, why: "no match for " + sel };
      const r = el.getBoundingClientRect();
      const absTop = r.top + window.scrollY;
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const ideal = absTop + r.height / 2 - window.innerHeight / 2;
      const target = Math.min(Math.max(Math.round(ideal), 0), maxScroll);
      window.scrollTo(0, target);
      return { ok: true, target, actual: window.scrollY, absTop, maxScroll };
    },
    scrollY() { return window.scrollY; },
    viewport() { return { w: window.innerWidth, h: window.innerHeight, scrollH: document.documentElement.scrollHeight }; },
    fontsReady(ms) {
      const bounded = new Promise((r) => setTimeout(() => r("timeout"), ms));
      if (!document.fonts) return Promise.resolve("no-font-api");
      return Promise.race([document.fonts.ready.then(() => "ready"), bounded]);
    },
    framesSettled(ms) {
      const bounded = new Promise((r) => setTimeout(() => r("timeout"), ms));
      const frames = new Promise((r) =>
        requestAnimationFrame(() => requestAnimationFrame(() => r("frames")))
      );
      return Promise.race([frames, bounded]);
    },
    // The selector comes from the page's readiness rule, not from a default here: a
    // page that renders its record into a container it also fills with a loading line
    // is "mounted" only once the record itself is there, and only the caller knows
    // which element that is.
    mounted(sel) { return !!document.querySelector(sel); },
    scrollHeight() { return document.documentElement.scrollHeight; },
    reactLoaded() { return typeof window.React !== "undefined" && typeof window.ReactDOM !== "undefined"; },
    calls() { return window.__qaCalls; },
  };

  // Animations make a capture depend on when the shutter fired. This runs LAST and
  // guarded: at new-document time there is no documentElement yet, and a throw here
  // must not take __qa down with it.
  const CSS = "*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition-duration:0s!important;transition-delay:0s!important;scroll-behavior:auto!important}";
  const addStyle = () => {
    try {
      const parent = document.head || document.documentElement;
      if (!parent || document.getElementById("__qa_no_anim")) return;
      const style = document.createElement("style");
      style.id = "__qa_no_anim";
      style.textContent = CSS;
      parent.appendChild(style);
    } catch { /* styling is a nicety, never a blocker */ }
  };
  addStyle();
  document.addEventListener("DOMContentLoaded", addStyle);
})();
`;
}

// ── Evaluate helpers ─────────────────────────────────────────────────────────
async function evaluate(cdp, expression) {
  const r = await cdp.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) {
    fail(`In-page error: ${r.exceptionDetails.text} ${r.exceptionDetails.exception?.description || ""}`);
  }
  return r.result.value;
}

async function waitUntil(cdp, expression, { timeout = 15000, label = expression } = {}) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await evaluate(cdp, expression)) return true;
    await sleep(100);
  }
  fail(`Timed out after ${timeout}ms waiting for: ${label}`);
}

// Layout settle. A capture taken before this produced mis-framed images — the
// framing transform ran against a height that was still growing.
async function settle(cdp) {
  // Both waits are raced against a timer IN THE PAGE, so a promise that never
  // settles degrades to a slightly-early capture instead of a wedged run.
  await evaluate(cdp, "__qa.fontsReady(4000)");
  let last = -1;
  let stable = 0;
  for (let i = 0; i < 40 && stable < 3; i++) {
    const h = await evaluate(cdp, "__qa.scrollHeight()");
    stable = h === last ? stable + 1 : 0;
    last = h;
    await sleep(50);
  }
  await evaluate(cdp, "__qa.framesSettled(2000)");
}

// ── Capture one scenario at one viewport ─────────────────────────────────────
const MIN_PNG_BYTES = 5000; // A solid-colour page deflates to a few hundred bytes.

async function capture({ cdp, scenario, viewportName, serverState, blocked, payloads, browserVersion }) {
  const vp = VIEWPORTS[viewportName];
  if (!vp) fail(`Unknown viewport "${viewportName}". Known: ${Object.keys(VIEWPORTS).join(", ")}`);

  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: vp.width,
    height: vp.height,
    deviceScaleFactor: vp.dsf,
    mobile: vp.mobile,
  });

  // Pin everything the page can read that would otherwise vary by machine. Locale
  // and timezone matter because any toLocaleDateString in product code renders a
  // different string under a different zone; the media features matter because a
  // machine set to dark mode would capture a different palette.
  await cdp.send("Emulation.setLocaleOverride", { locale: PINNED.locale }).catch(() => {});
  await cdp.send("Emulation.setTimezoneOverride", { timezoneId: PINNED.timezone }).catch(() => {});
  await cdp.send("Emulation.setEmulatedMedia", {
    features: [
      { name: "prefers-color-scheme", value: PINNED.color_scheme },
      { name: "prefers-reduced-motion", value: PINNED.reduced_motion },
    ],
  }).catch(() => {});

  const nav = resolveNavigation(scenario);
  await cdp.send("Page.navigate", { url: `${serverState.origin}${nav.path}` });
  await waitUntil(cdp, "document.readyState === 'complete'", { label: "document ready" });

  const ready = resolveReadiness(nav.page);
  if (ready.react && !(await evaluate(cdp, "__qa.reactLoaded()"))) {
    fail("React/ReactDOM did not load — the app cannot mount, so any capture would be of an empty shell.");
  }
  await waitUntil(cdp, `__qa.mounted(${JSON.stringify(ready.rendered)})`, { label: `rendered ${nav.page}` });

  for (const step of scenario.steps) {
    if (step.waitFor) {
      await waitUntil(cdp, `__qa.visible(${JSON.stringify(step.waitFor)})`, { label: `visible ${step.waitFor}` });
    } else if (step.waitForText) {
      await waitUntil(cdp, `__qa.hasText(${JSON.stringify(step.waitForText)})`, { label: `text ${step.waitForText}` });
    } else if (step.fill) {
      const r = await evaluate(cdp, `__qa.fill(${JSON.stringify(step.fill)}, ${JSON.stringify(step.text)})`);
      if (!r.ok) fail(`Drive step failed (fill): ${r.why}`);
    } else if (step.click) {
      const r = await evaluate(cdp, `__qa.click(${JSON.stringify(step.click)})`);
      if (!r.ok) fail(`Drive step failed (click): ${r.why}`);
    } else if (step.clickText) {
      const r = await evaluate(cdp, `__qa.clickText(${JSON.stringify(step.clickText)}, ${JSON.stringify(step.text)})`);
      if (!r.ok) fail(`Drive step failed (clickText): ${r.why}`);
    } else {
      fail(`Unrecognised drive step: ${JSON.stringify(step)}`);
    }
  }

  // The stub must have actually served the route. If the app never called it, the
  // state on screen is not the state we think we captured.
  //
  // A canned scenario inverts the expectation: its surface is built from committed
  // copy, so a call would mean the app went somewhere this scenario does not describe.
  // Both directions are checked, and neither is skipped — the unstubbed check and the
  // server leak check below apply to every scenario either way.
  const calls = await evaluate(cdp, "__qa.calls()");
  const unstubbed = calls.filter((c) => c.startsWith("UNSTUBBED:"));
  if (unstubbed.length) fail(`App requested unstubbed API routes: ${unstubbed.join(", ")}`);
  if (scenario.canned) {
    if (calls.length) {
      fail(`Canned scenario called /api: ${calls.join(", ")} — the state on screen is not the canned one.`);
    }
  } else if (!calls.length) {
    fail("The app never called a stubbed /api route — the captured state is not a Reader result.");
  }
  if (serverState.state.apiLeaks.length) {
    fail(`/api/* reached the static server: ${serverState.state.apiLeaks.join(", ")} — stub did not install.`);
  }

  await settle(cdp);

  // Assert the state is in the DOM before trusting the pixels.
  if (scenario.assertSelector && !(await evaluate(cdp, `__qa.visible(${JSON.stringify(scenario.assertSelector)})`))) {
    fail(`Expected element not visible at capture time: ${scenario.assertSelector}`);
  }
  for (const t of scenario.assertText || []) {
    if (!(await evaluate(cdp, `__qa.hasText(${JSON.stringify(t)})`))) {
      const body = await evaluate(cdp, "__qa.bodyText()");
      fail(
        `Expected text not rendered at capture time: ${JSON.stringify(t)}\n` +
          `  rendered body text (first 1200 chars):\n  ${body.slice(0, 1200)}`
      );
    }
  }

  // Capture the VIEWPORT with the state scrolled into it, not the whole page.
  //
  // Full-page capture was tried and rejected on evidence. captureBeyondViewport
  // wedges Page.captureScreenshot in chrome-headless-shell; resizing the viewport
  // to the full content height instead produced a 1440x7446 image whose lower two
  // thirds were never painted — the MEASUREMENT panel passed every DOM assertion
  // and still did not appear in the pixels. A capture surface that large exceeds
  // what the compositor will paint, and the result is a confident, wrong image.
  // A viewport-sized capture is bounded, always painted, and is also the honest
  // artefact: it is what someone at this viewport actually sees.
  const focus = scenario.focus || scenario.assertSelector;
  let scrollTarget = 0;
  if (focus) {
    // Settle BEFORE measuring. The old code scrolled first and settled after, so the
    // scroll target was computed against a layout that was still moving.
    await settle(cdp);
    const r = await evaluate(cdp, `__qa.scrollToDeterministic(${JSON.stringify(focus)})`);
    if (!r.ok) fail(`Cannot scroll focus target into view: ${r.why}`);
    await settle(cdp);
    scrollTarget = r.target;

    // Re-assert after settling: if anything shifted the page between the scroll and
    // the shutter, the capture is not the frame we computed and must not be filed as
    // a comparable baseline.
    const landed = await evaluate(cdp, "__qa.scrollY()");
    if (landed !== r.target) {
      const retry = await evaluate(cdp, `__qa.scrollToDeterministic(${JSON.stringify(focus)})`);
      await settle(cdp);
      const landedAgain = await evaluate(cdp, "__qa.scrollY()");
      if (landedAgain !== retry.target) {
        fail(
          `Scroll position is not deterministic: asked for ${retry.target}, landed on ${landedAgain} ` +
            `(first attempt asked ${r.target}, landed ${landed}). The capture would not be byte-comparable, ` +
            `so it is not being written.`
        );
      }
      scrollTarget = retry.target;
    }

    // The state must be inside the rectangle we are about to photograph. Without
    // this, "element exists and is visible" can still mean "scrolled off-screen".
    const rect = await evaluate(cdp, `__qa.rect(${JSON.stringify(focus)})`);
    const view = await evaluate(cdp, "__qa.viewport()");
    if (!rect) fail(`Focus target vanished before capture: ${focus}`);
    const visibleTop = Math.max(rect.top, 0);
    const visibleBottom = Math.min(rect.bottom, view.h);
    if (visibleBottom - visibleTop <= 0) {
      fail(
        `Focus target "${focus}" is outside the captured viewport (rect.top=${Math.round(rect.top)}, ` +
          `rect.bottom=${Math.round(rect.bottom)}, viewport height=${view.h}). The image would not show the state.`
      );
    }
  }

  // Snapshot the rendered region BEFORE the shutter, so the text record and the
  // pixels describe the same frame.
  const entries = await evaluate(cdp, EXTRACTOR_SOURCE);
  const renderLines = normalizeEntries(entries, serverState.origin);
  if (!renderLines.length) {
    fail("Snapshot extractor found no visible elements in the captured region — the frame is empty.");
  }
  const errorMarker = detectErrorPage(renderLines);
  if (errorMarker) {
    fail(
      `The captured frame is a browser error page (matched ${JSON.stringify(errorMarker)}), not the app. ` +
        `A previous run filed a set of connection-error pages as captures and they compared byte-identical, ` +
        `which is the most dangerous possible false green. Nothing was written.`
    );
  }

  // If this scenario/viewport is under a raster policy, measure the exempt element
  // from the live page in the same frame that is about to be photographed. The region
  // is never a constant: a hard-coded rectangle would keep claiming to describe the
  // header long after the header stopped being that shape.
  const policy = resolvePolicy(scenario.name, viewportName);
  let rasterRegion = null;
  if (policy) {
    const measured = await evaluate(
      cdp,
      `(() => {
        const el = document.querySelector(${JSON.stringify(policy.selector)});
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { dpr: window.devicePixelRatio, css: { left: r.left, top: r.top, right: r.right, bottom: r.bottom } };
      })()`
    );
    // A null region is carried forward as null, not repaired. The comparator is the
    // one place that decides what an unresolvable region means, and it fails on it.
    if (measured) rasterRegion = toDeviceBounds(measured.css, measured.dpr);
  }

  const shot = await cdp.send("Page.captureScreenshot", { format: "png" });
  const buf = Buffer.from(shot.data, "base64");

  if (buf.length < MIN_PNG_BYTES) {
    fail(
      `Capture is ${buf.length} bytes — below the ${MIN_PNG_BYTES}-byte floor. A near-uniform PNG deflates to almost nothing, so this is a blank or near-blank frame, not a rendered state.`
    );
  }
  if (blocked.length) {
    log(`    note: ${blocked.length} non-allowlisted request(s) denied: ${[...new Set(blocked)].slice(0, 5).join(", ")}`);
  }

  const env = {
    ...PINNED,
    url: nav.page,
    query_parameters: nav.query_parameters,
    browser_version: browserVersion,
    viewport: `${vp.width}x${vp.height}`,
    device_scale_factor: String(vp.dsf),
    mobile_emulation: String(vp.mobile),
    scroll_offset: String(scrollTarget),
    framed_on: focus || "(page top)",
  };

  const snapshotText = serializeSnapshot({ env, payload: payloads, lines: renderLines });

  // NOTHING is written here. The caller decides whether this run may touch a
  // baseline — so a capture that throws above cannot leave a partial file behind,
  // and diff mode cannot overwrite the thing it is comparing against.
  return {
    filename: `${scenario.name}--${viewportName}.png`,
    snapshotFilename: `${scenario.name}--${viewportName}.snapshot.txt`,
    buf,
    snapshotText,
    sha256: sha256(buf),
    bytes: buf.length,
    viewport: `${vp.width}x${vp.height}@${vp.dsf}x`,
    viewport_name: viewportName,
    focus,
    scrollTarget,
    env,
    state: scenario.state,
    expected: scenario.expected,
    policy,
    rasterRegion,
  };
}

// ── Main ─────────────────────────────────────────────────────────────────────
export function parseArgs(argv) {
  const out = {
    scenarios: [],
    viewports: [...BOARD_VIEWPORTS],
    outDir: null,
    list: false,
    all: false,
    diff: false,
    manifest: false,
    update: [],
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--list") out.list = true;
    else if (a === "--manifest") out.manifest = true;
    else if (a === "--all") out.all = true;
    else if (a === "--diff") out.diff = true;
    else if (a === "--scenario") out.scenarios.push(argv[++i]);
    else if (a === "--viewport") out.viewports = argv[++i].split(",").map((s) => s.trim());
    else if (a === "--out") out.outDir = argv[++i];
    else if (a === "--update") {
      const name = argv[++i];
      // A red diff should cost a decision, not a keystroke. There is deliberately
      // no --update-all: accepting every changed baseline in one keystroke is how a
      // real regression gets blessed into the baseline without anyone reading it.
      if (!name || name.startsWith("--")) {
        fail("--update requires a scenario name: --update <scenario>. There is no bulk update flag.");
      }
      out.update.push(name);
    } else if (a === "--update-all" || a === "--accept-all" || a === "-u") {
      fail(
        `${a} does not exist, deliberately. Update one scenario at a time with --update <scenario> ` +
          `so every accepted baseline change is read before it is written.`
      );
    } else fail(`Unknown argument: ${a}`);
  }
  if (out.diff && out.update.length) fail("--diff and --update are different modes; pass one.");
  // --manifest photographs nothing, so a run that also asked for captures has asked for
  // two different things and would silently get one. Named flags, not a precedence rule.
  if (out.manifest && (out.diff || out.all || out.update.length || out.scenarios.length)) {
    fail(
      "--manifest regenerates the record from what is already committed and captures nothing. " +
        "Run it on its own, then --diff or --update separately."
    );
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.list) {
    for (const [name, s] of Object.entries(SCENARIOS)) {
      log(`${name}${s.drivable ? "" : "   [fixture-only — no drive steps, cannot be captured]"}`);
      log(`  ${s.state}`);
      log(`  expects: ${s.expected}\n`);
    }
    return;
  }

  // Read-only mode, and it returns before anything below it can run: no destination to
  // resolve, no browser, no server, no capture, no baseline moved. It is the one mode
  // that needs neither a machine that can render this board nor an acceptance to hold.
  if (args.manifest) {
    const written = regenerateManifest();
    log(`✓ manifest regenerated from committed bytes: ${path.relative(REPO_ROOT, written)}`);
    return;
  }

  // Destination and mode first, before a browser is launched or a pixel captured.
  // A run aimed at the wrong place must cost a command line, not a full capture.
  const { mode, outDir } = resolveDestination(args);

  // The ONE place a baseline grant is ever created. Nothing downstream can mint
  // one, so every other mode reaches the write guard empty-handed.
  const grant = mode === "update" ? new BaselineGrant(args.update, args.viewports) : null;

  // --all means every DRIVABLE scenario. Fixture-only scenarios are skipped here but
  // rejected loudly if named explicitly, so nobody gets a silently-missing capture.
  const names = args.all
    ? Object.keys(SCENARIOS).filter((n) => SCENARIOS[n].drivable)
    : args.update.length
      ? args.update
      : args.scenarios;
  if (!names.length) {
    fail("Nothing to do. Pass --scenario <name>, --update <name>, --all, --diff, or --list.");
  }
  for (const n of names) {
    if (!SCENARIOS[n]) fail(`Unknown scenario "${n}". Known: ${Object.keys(SCENARIOS).join(", ")}`);
    if (!SCENARIOS[n].drivable) {
      fail(
        `Scenario "${n}" is fixture-only: its payloads are defined and checked, but no drive steps ` +
          `exist to reach that state in the UI. Capturing it would photograph a different state and ` +
          `file it under this name. Add drive steps in scripts/qa/scenarios.mjs first.`
      );
    }
  }
  if (args.all) {
    const skipped = Object.keys(SCENARIOS).filter((n) => !SCENARIOS[n].drivable);
    if (skipped.length) log(`  (fixture-only, not captured: ${skipped.join(", ")})`);
  }

  // Fixture integrity and scenario shape before anything expensive.
  for (const n of names) {
    const shape = assertScenarioCapturable(n, SCENARIOS[n]);
    if (shape.length) fail(`Scenario "${n}" is malformed:\n  - ${shape.join("\n  - ")}`);
    const problems = assertScenarioIntegrity(SCENARIOS[n]);
    if (problems.length) fail(`Scenario "${n}" is not internally consistent:\n  - ${problems.join("\n  - ")}`);
  }
  log(`✓ fixture integrity: ${names.length} scenario(s) consistent`);

  const { binary, probed } = resolveBrowser();
  log(`✓ browser: ${binary}\n  (probed ${probed.length} path(s))`);

  const { server, port, state } = await startStaticServer(REPO_ROOT);
  const origin = `http://127.0.0.1:${port}`;
  const serverState = { origin, state };

  // Verify the server actually serves before capturing anything. Every capture in
  // one earlier run was byte-identical because the server had died and each image
  // was the browser's connection-error page.
  const probe = await fetch(`${origin}/workbench.html`);
  if (!probe.ok) fail(`Static server preflight failed: ${probe.status} for ${origin}/workbench.html`);
  const probeBody = await probe.text();
  if (!probeBody.includes("workbench.bundle.js")) {
    fail("Static server preflight served a page without workbench.bundle.js — wrong root?");
  }
  log(`✓ static server: ${origin} (preflight 200, bundle referenced)`);

  const { proc, userDataDir, port: cdpPort } = await launchBrowser(binary);
  const versionInfo = await (await fetch(`http://127.0.0.1:${cdpPort}/json/version`)).json();
  const browserVersion = versionInfo.Browser || "unknown";
  log(`✓ browser version: ${browserVersion}`);
  const targets = await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json();
  const page = targets.find((t) => t.type === "page");
  if (!page) fail("No page target exposed by the browser.");
  const cdp = await CDP.connect(page.webSocketDebuggerUrl);

  const results = [];
  const blocked = [];
  try {
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Network.enable");

    // Deny-by-default interception.
    await cdp.send("Fetch.enable", { patterns: [{ urlPattern: "*", requestStage: "Request" }] });
    cdp.on("Fetch.requestPaused", async (params) => {
      const { requestId, request } = params;
      let host;
      try {
        host = new URL(request.url).hostname;
      } catch {
        host = "";
      }
      try {
        if (host === "127.0.0.1") {
          await cdp.send("Fetch.continueRequest", { requestId });
        } else if (ALLOWED_ORIGINS.has(host)) {
          const asset = await fetchThroughCache(request.url);
          await cdp.send("Fetch.fulfillRequest", {
            requestId,
            responseCode: asset.status,
            responseHeaders: [
              { name: "content-type", value: asset.contentType },
              { name: "access-control-allow-origin", value: "*" },
            ],
            body: asset.body.toString("base64"),
          });
        } else {
          blocked.push(request.url);
          await cdp.send("Fetch.failRequest", { requestId, errorReason: "BlockedByClient" });
        }
      } catch (e) {
        // A paused request left unanswered hangs the page; fail it so the run
        // surfaces a real error instead of a timeout.
        try {
          await cdp.send("Fetch.failRequest", { requestId, errorReason: "Failed" });
        } catch {
          /* request already gone */
        }
        log(`    interception error for ${request.url}: ${e.message}`);
      }
    });

    for (const name of names) {
      const scenario = SCENARIOS[name];
      const payloads = resolvePayloads(scenario);

      // Reinstall per scenario so each gets its own payload table.
      await cdp.send("Page.removeScriptToEvaluateOnNewDocument", { identifier: "1" }).catch(() => {});
      const { identifier } = await cdp.send("Page.addScriptToEvaluateOnNewDocument", {
        source: buildStubScript(payloads),
      });

      const captured = await captureAll(args.viewports, async (viewportName) => {
        log(`\n▶ ${name} @ ${viewportName}`);
        const r = await capture({ cdp, scenario, viewportName, serverState, blocked, payloads, browserVersion });
        log(`  ✓ ${r.filename}  ${r.bytes} bytes  sha256=${r.sha256.slice(0, 16)}…  scroll=${r.scrollTarget}`);
        return r;
      });
      results.push(...captured);

      await cdp.send("Page.removeScriptToEvaluateOnNewDocument", { identifier });
    }
  } finally {
    cdp.close();
    proc.kill("SIGKILL");
    server.close();
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch {
      /* best effort */
    }
  }

  // Identical checksums across distinct states means every capture failed the same
  // way. Report and refuse rather than emitting a manifest that looks complete.
  const byHash = new Map();
  for (const r of results) {
    if (!byHash.has(r.sha256)) byHash.set(r.sha256, []);
    byHash.get(r.sha256).push(r.filename);
  }
  const collisions = [...byHash.values()].filter((v) => v.length > 1);

  log("\n── captures ──");
  for (const r of results) log(`${r.bytes.toString().padStart(9)}  ${r.sha256}  ${r.filename}`);

  if (collisions.length) {
    log("\n✗ CHECKSUM COLLISION — distinct states produced identical bytes:");
    for (const c of collisions) log(`   ${c.join("  ==  ")}`);
    fail("Run failed. Do not commit these captures.");
  }
  log(`\n✓ ${results.length} capture(s), all checksums distinct`);

  // Every capture above SUCCEEDED — capture() throws on any failure and this line is
  // unreachable otherwise. Only now may anything touch a baseline.
  if (mode === "diff") return runDiff(outDir, results);
  if (mode === "update") return runUpdate(outDir, results, grant);

  // Capture mode. outDir is guaranteed non-baseline by resolveDestination, and the
  // null grant means the write guard would refuse it even if that ever stopped
  // being true.
  //
  // No manifest is written here. The manifest is a governance record of the committed
  // board — it asserts a complete inventory against the registry — and a scratch
  // directory holding whichever scenarios this run happened to name is not that board.
  // Emitting one anyway is what produced a file that read as complete while describing
  // a subset. Everything a scratch run needs is already on disk beside it: the snapshot
  // carries the full environment block, and the checksum table printed above carries
  // the bytes.
  commitResults(outDir, results);
  for (const r of results) r.path = path.join(outDir, r.filename);
}

// ── Diff mode ────────────────────────────────────────────────────────────────
// Compares a fresh capture against the committed baseline. Writes NOTHING.
function runDiff(outDir, results) {
  let changed = 0;
  let missing = 0;
  log("\n══ regression diff ══");

  for (const r of results) {
    const snapPath = path.join(outDir, r.snapshotFilename);
    const imgPath = path.join(outDir, r.filename);
    log(`\n▶ ${r.filename.replace(/\.png$/, "")}`);

    if (!fs.existsSync(snapPath)) {
      log(`  ✗ no baseline snapshot at ${path.relative(REPO_ROOT, snapPath)}`);
      log(`    create one with: --update ${r.filename.split("--")[0]}`);
      missing++;
      continue;
    }

    let d;
    try {
      d = diffSnapshots(fs.readFileSync(snapPath, "utf8"), r.snapshotText);
    } catch (e) {
      log(`  ✗ baseline is unreadable: ${e.message}`);
      missing++;
      continue;
    }

    if (d.identical) {
      log("  ✓ snapshot: no change");
    } else {
      changed++;
      log(formatDiff("payload", d.payload));
      log(formatDiff("render", d.render));
    }

    // Only compare pixels when both sides were produced under the same conditions.
    // A baseline from another machine or Chromium build encodes differently even
    // when the page is identical, and reporting that as a regression is the
    // always-red failure this tooling exists to avoid.
    const baseEnv = (() => {
      try {
        return parseSnapshot(fs.readFileSync(snapPath, "utf8")).env;
      } catch {
        return {};
      }
    })();
    const cmp = imageComparability(baseEnv, r.env);
    if (!cmp.comparable) {
      log(`  – image: skipped (${cmp.reason})`);
      continue;
    }

    const baselineImg = fs.existsSync(imgPath) ? fs.readFileSync(imgPath) : null;

    // ── The one policied comparison ──────────────────────────────────────────
    // For the single scenario/viewport under a raster policy, the byte comparison is
    // replaced by the bounded one — and it runs on EVERY diff, including runs where
    // the bytes happen to match. A policy that only spoke up on failure would give a
    // reader no way to tell a run where the region was checked and clean from a run
    // where the check silently did not happen.
    if (r.policy) {
      if (!baselineImg) {
        log(`  ✗ image: no baseline on disk`);
        missing++;
        continue;
      }
      const report = comparePolicy(r.policy, baselineImg, r.buf, r.rasterRegion);
      const bytesMatch = baselineImg.length === r.buf.length && baselineImg.equals(r.buf);
      log(
        report.result === "pass"
          ? `  ✓ image: within raster policy (${bytesMatch ? "byte-identical" : `${report.different_pixels_inside} px inside region, max delta ${report.max_rgb_delta}`})`
          : `  ✗ image: raster policy FAILED`
      );
      log(formatPolicyReport(report));
      if (report.result !== "pass") changed++;
      continue;
    }

    const img = diffImageBuffers(baselineImg, r.buf);
    if (img.status === "identical") log(`  ✓ image: byte-identical (${img.baselineBytes} bytes)`);
    else if (img.status === "missing-baseline") {
      log(`  ✗ image: no baseline on disk`);
      missing++;
    } else {
      log(`  ✗ image: bytes differ (baseline ${img.baselineBytes}, fresh ${img.freshBytes})`);
      changed++;
    }
  }

  log("");
  if (missing) log(`✗ ${missing} baseline(s) missing or unreadable.`);
  if (changed) {
    log(`✗ ${changed} difference(s) found. Nothing was written.`);
    log(`  If a change is intended, accept it one scenario at a time: --update <scenario>`);
    process.exitCode = 1;
    return;
  }
  if (missing) {
    process.exitCode = 1;
    return;
  }
  log("✓ no regressions — every snapshot and image matches its baseline.");
}

// ── Update mode ──────────────────────────────────────────────────────────────
// Named scenarios only, and the diff is PRINTED BEFORE anything is written, so an
// accepted baseline change is always read first.
function runUpdate(outDir, results, grant) {
  if (!grant) fail("Update mode reached the write path with no baseline grant. Refusing to write.");
  log("\n══ baseline update ══");
  for (const r of results) {
    const snapPath = path.join(outDir, r.snapshotFilename);
    const imgPath = path.join(outDir, r.filename);
    log(`\n▶ ${r.filename.replace(/\.png$/, "")}`);

    if (fs.existsSync(snapPath)) {
      try {
        const d = diffSnapshots(fs.readFileSync(snapPath, "utf8"), r.snapshotText);
        if (d.identical) log("  snapshot: no change");
        else {
          log("  snapshot changes being accepted:");
          log(formatDiff("payload", d.payload));
          log(formatDiff("render", d.render));
        }
      } catch (e) {
        log(`  (previous baseline unreadable: ${e.message})`);
      }
      const prev = fs.existsSync(imgPath) ? fs.readFileSync(imgPath) : null;
      const img = diffImageBuffers(prev, r.buf);
      log(`  image: ${img.status}${img.status === "changed" ? ` (${img.baselineBytes} → ${img.freshBytes} bytes)` : ""}`);
    } else {
      log("  new baseline (nothing on disk yet)");
    }

    writeArtifact(snapPath, r.snapshotText, grant);
    writeArtifact(imgPath, r.buf, grant);
    r.path = imgPath;
    log(`  ✓ written: ${path.relative(REPO_ROOT, snapPath)}`);
    log(`  ✓ written: ${path.relative(REPO_ROOT, imgPath)}`);
  }

  // The manifest attests a sha256 per image, so an acceptance that moved one has to
  // correct it. It used to be rewritten from THIS RUN's captures, which meant a
  // single-scenario acceptance could only either drop the 60 images it did not
  // photograph or leave the record stale — and the protocol forbids the bulk run that
  // would have satisfied it, so it went stale by design, four times. It is now derived
  // from the committed bytes instead of from the run, so accepting one scenario
  // regenerates the whole record correctly and there is no partial case left to refuse.
  const written = regenerateManifest({ baselineDir: outDir });
  log(`\n✓ manifest regenerated from committed bytes: ${path.relative(REPO_ROOT, written)}`);
}

// ── Manifest ─────────────────────────────────────────────────────────────────
// The manifest is a DERIVED DOCUMENT. It reads no browser, starts no server, captures
// no pixel and moves no baseline: it is built from the scenario registry and from the
// bytes already committed next to it, so it can be regenerated at any commit by anyone
// with a checkout and no acceptance in hand.
//
// That is the fix for how it rotted. It used to be a by-product of a capture run, which
// tied regenerating it to re-photographing all 62 images — a run the acceptance protocol
// forbids, because accepting baselines in bulk is how a real regression gets blessed in
// unread. So the document that attests a checksum per image could only be kept current by
// doing the one thing nobody is allowed to do, and it fell 34-of-48 stale while every
// individual acceptance was correct.
//
// Nothing measured at generation time may enter this file. No timestamp, no HEAD, no
// working-tree state, no machine path: any of those would make an unrelated commit stale
// the manifest, and a document that goes stale on its own teaches its readers to ignore
// it. Capture-time provenance is not lost, it is filed where it belongs — in each
// snapshot's `## environment` block, and in the git history of the image files.
//
// The comparison policy is generated rather than typed for the same reason the rest is: a
// hand-written copy would keep asserting a ceiling or a scenario name the comparator had
// already stopped using, and the record would go quietly wrong in the direction nobody
// checks. The diagnostic figures inside it are observations recorded once and do not live
// in the registry.
export function renderComparisonPolicySection(policies) {
  const lines = [`## Comparison policy`, ""];

  if (!policies.length) {
    lines.push(
      `Every image on this board is compared byte-for-byte against its baseline. There is no ` +
        `exception: no scenario carries a bounded-comparison policy, so any difference of any ` +
        `size in any pixel fails the run.`
    );
    return lines;
  }

  lines.push(
    `Every image on this board is compared byte-for-byte against its baseline, with ` +
      `${policies.length === 1 ? "one named exception" : `${policies.length} named exceptions`}.`
  );
  for (const p of policies) {
    lines.push("");
    lines.push(
      `**\`${p.scenario}--${p.viewport}\` uses a bounded renderer-noise comparison for the sticky ` +
        `backdrop-filter header, while the DOM snapshot and all pixels outside that region remain ` +
        `exact.** The region is the painted box of the element carrying the filter (\`${p.selector}\`), ` +
        `resolved from the live page at comparison time rather than written down as a rectangle. ` +
        `Inside it, at most ${p.maxDifferingPixels} pixels may differ by at most ${p.maxRgbDelta} ` +
        `per channel, with alpha untouched. Outside it, one differing pixel is a failure.`
    );
    lines.push("");
    // The cause is registry state and is interpolated, so editing it there cannot leave
    // this paragraph asserting a diagnosis nobody holds any more. The measured figures
    // that follow are a one-time observation of this board on this machine, they are not
    // in the registry, and they are kept because a reader needs the size of the thing to
    // judge whether the ceiling above is generous or tight.
    lines.push(
      `The reason is diagnosed, not assumed: ${p.cause} Under load it produces a frame differing ` +
        `in 477 pixels of 2,740,500 that stops dead at the header's bottom edge. ` +
        `\`scripts/qa/raster-policy.mjs\` carries the full diagnosis and the evidence that ruled ` +
        `out timing, animation, fonts, browser reuse and every raster flag tried.`
    );
    lines.push("");
    lines.push(
      `This is not a tolerance setting. Policy \`${p.id}\` is hard-coded to one scenario at one ` +
        `viewport, no flag or environment variable reaches it, and \`test/qa-raster-policy.test.mjs\` ` +
        `holds each edge of it. Any second use, any bounds change and any ceiling change needs a ` +
        `new founder ruling.`
    );
  }
  return lines;
}

// The structured model the document is projected from. It is built whole and returned
// before a line of markdown exists, because the inventory rules are set operations and a
// generator that formats as it walks has no set to check them against. Every value here
// comes from the registry or from a committed byte; nothing is measured now.
export function buildManifestModel({
  baselineDir = BASELINE_DIR,
  scenarios = SCENARIOS,
  viewports = BOARD_VIEWPORTS,
  viewportSpecs = VIEWPORTS,
  policies = RASTER_POLICIES,
  pinned = PINNED,
} = {}) {
  const boardViewports = [...viewports].sort();
  for (const name of boardViewports) {
    if (!viewportSpecs[name]) {
      fail(`Board viewport "${name}" is not declared in VIEWPORTS, so its geometry cannot be recorded.`);
    }
  }

  // Registered = what the registry says the board holds, not what happens to be on disk.
  // Reading the directory instead would make the manifest a description of whatever it
  // found, which is how a deleted baseline becomes invisible rather than a failure.
  const registeredScenarios = Object.keys(scenarios)
    .filter((name) => scenarios[name].drivable)
    .sort();
  const registered = [];
  for (const scenario of registeredScenarios) {
    for (const viewport of boardViewports) registered.push({ scenario, viewport });
  }

  const inventory = assertBaselineInventory(baselineDir, registered);

  const images = registered
    .map(({ scenario: name, viewport: viewportName }) => {
      const scenario = scenarios[name];
      const vp = viewportSpecs[viewportName];
      const nav = resolveNavigation(scenario, pinned);
      // The same expression the capture path frames on. Derived here rather than read
      // back from the snapshot so the registry stays the thing that governs, and a
      // registry edit that never reached the pixels shows up as the mismatch below.
      const focus = scenario.focus || scenario.assertSelector || "";

      const filename = `${name}--${viewportName}.png`;
      const snapshotFilename = `${name}--${viewportName}.snapshot.txt`;
      const imageBytes = fs.readFileSync(path.join(baselineDir, filename));
      const snapshotBytes = fs.readFileSync(path.join(baselineDir, snapshotFilename));
      const env = parseSnapshot(snapshotBytes.toString("utf8")).env || {};

      // What the registry declares must be what the committed capture ran under. These
      // agree today for all 62; if a registry edit ever lands without a re-capture they
      // stop agreeing, and the manifest refuses to record a URL, a frame or a viewport
      // that the bytes beside it were not produced at.
      const declared = {
        url: nav.page,
        query_parameters: nav.query_parameters,
        framed_on: focus || "(page top)",
        viewport: `${vp.width}x${vp.height}`,
        device_scale_factor: String(vp.dsf),
        mobile_emulation: String(vp.mobile),
      };
      for (const [key, want] of Object.entries(declared)) {
        if (env[key] !== want) {
          fail(
            `${snapshotFilename} was captured with ${key}=${JSON.stringify(env[key])}, but the registry ` +
              `now declares ${JSON.stringify(want)}. The registry and the committed pixels disagree, so ` +
              `no manifest can describe both. Re-capture with --update ${name}, or put the registry back.`
          );
        }
      }
      // Not derivable from the registry and not cross-checkable: these are facts only the
      // capture knew. They are read back rather than recomputed, and a snapshot that lost
      // one stops generation instead of yielding an "undefined" in the record.
      for (const key of ["scroll_offset", "browser_version"]) {
        if (!env[key]) fail(`${snapshotFilename} carries no ${key}, so its image row cannot be written.`);
      }

      return {
        filename,
        scenario: name,
        viewport: viewportName,
        sha256: sha256(imageBytes),
        bytes: imageBytes.length,
        snapshot: {
          filename: snapshotFilename,
          sha256: sha256(snapshotBytes),
          bytes: snapshotBytes.length,
        },
        viewportLabel: `${vp.width}x${vp.height}@${vp.dsf}x`,
        url: nav.page,
        query: nav.query_parameters,
        framedOn: focus,
        scrollOffset: env.scroll_offset,
        browserVersion: env.browser_version,
        state: scenario.state,
        expected: scenario.expected,
      };
    })
    .sort((a, b) => (a.filename < b.filename ? -1 : a.filename > b.filename ? 1 : 0));

  // url and query_parameters are per-scenario, not pinned: the board photographs more
  // than one page, so listing a single value here would state a setting the board does
  // not share. Both are dropped from the pinned table and printed against each image.
  const shared = { ...pinned };
  delete shared.url;
  delete shared.query_parameters;

  return {
    scope: {
      baselineRoot: path.relative(REPO_ROOT, baselineDir),
      registryPath: path.relative(REPO_ROOT, path.join(HERE, "scenarios.mjs")),
      governs: ["png", "snapshot"],
      scenarioCount: registeredScenarios.length,
      viewports: boardViewports.map((name) => ({ name, ...viewportSpecs[name] })),
      imageCount: images.length,
      snapshotCount: images.length,
      inventory,
    },
    pinned: shared,
    policies,
    coveredUnderAnotherName: COVERED_UNDER_ANOTHER_NAME,
    unphotographed: UNPHOTOGRAPHED,
    images,
  };
}

// Both directions, every time. A registered file missing from disk is the obvious
// failure; a file on disk that nothing registers is the one that made this document
// wrong, because the old manifest simply did not mention the 14 images it had never
// been regenerated to see and read as complete anyway.
export function assertBaselineInventory(baselineDir, registered) {
  const onDisk = safeReaddir(baselineDir);
  const layers = [
    { layer: "image", suffix: ".png", want: registered.map((r) => `${r.scenario}--${r.viewport}.png`) },
    {
      layer: "snapshot",
      suffix: ".snapshot.txt",
      want: registered.map((r) => `${r.scenario}--${r.viewport}.snapshot.txt`),
    },
  ];
  const report = {};
  const problems = [];
  for (const { layer, suffix, want } of layers) {
    // .snapshot.txt files also end in .txt and .png files in nothing else, but an image
    // filter of "endsWith(.png)" would swallow a snapshot named .png. Partition once,
    // explicitly, so neither layer can borrow a file from the other.
    const present = onDisk.filter((f) => f.endsWith(suffix)).sort();
    const registeredNames = [...want].sort();
    const registeredSet = new Set(registeredNames);
    const presentSet = new Set(present);
    const missing = registeredNames.filter((f) => !presentSet.has(f));
    const unregistered = present.filter((f) => !registeredSet.has(f));
    report[layer] = { registered: registeredNames.length, present: present.length, missing, unregistered };
    if (missing.length) {
      problems.push(
        `${missing.length} registered ${layer}(s) are not on disk: ${missing.join(", ")}. The registry ` +
          `claims a baseline that does not exist; capture it with --update <scenario> or stop registering it.`
      );
    }
    if (unregistered.length) {
      problems.push(
        `${unregistered.length} ${layer}(s) on disk are registered by nothing: ${unregistered.join(", ")}. ` +
          `A file the registry does not know about is a baseline no run compares, so listing it would ` +
          `assert governance this harness does not have. Register its scenario or delete the file.`
      );
    }
  }
  if (problems.length) {
    fail(
      `The committed baseline directory and the scenario registry do not describe the same board, so ` +
        `no complete manifest can be generated:\n  - ${problems.join("\n  - ")}`
    );
  }
  return report;
}

// The projection. Deterministic in the strict sense: same registry plus same committed
// bytes gives the same string on any machine at any commit on any day. Ordering is by
// filename, compared as UTF-16 code units, so it does not inherit the registry's
// authoring order and cannot move when someone reorders that object.
export function renderManifest(model) {
  const { scope } = model;
  const viewportList = scope.viewports
    .map((v) => `\`${v.name}\` (${v.width}x${v.height} @ dsf ${v.dsf})`)
    .join(" and ");

  const lines = [];
  lines.push(`# Visual acceptance manifest`);
  lines.push("");
  lines.push(
    `Generated, never hand-edited. \`node scripts/qa/visual-acceptance.mjs --manifest\` rewrites this ` +
      `file from the scenario registry and the bytes committed beside it, and ` +
      `\`test/qa-manifest-freshness.test.mjs\` regenerates it and fails the suite on one byte of ` +
      `difference. Anything typed in here is deleted by the next regeneration, so a note worth keeping ` +
      `belongs in the harness that emits it.`
  );
  lines.push("");
  lines.push(
    `Generation reads no browser, starts no server, captures no pixel and moves no baseline, and it ` +
      `records nothing measured at generation time — no timestamp, no HEAD, no working-tree state, no ` +
      `machine path. That is deliberate: a manifest carrying any of those goes stale on commits that ` +
      `never touched an image, and a document that rots on its own teaches its readers to stop trusting ` +
      `it. Capture-time provenance is not lost, it is filed where it stays true — each snapshot's ` +
      `\`## environment\` block records the conditions its own capture ran under, and \`git log\` on an ` +
      `image file records when those bytes last moved.`
  );
  lines.push("");
  lines.push(`## Scope`);
  lines.push("");
  lines.push(
    `**This manifest governs both committed baseline layers: the \`.png\` images and the ` +
      `\`.snapshot.txt\` files beside them.** Both are checksummed. There is one row per image, and it ` +
      `carries the sha256 and byte count of the image and of its paired snapshot. Nothing else in ` +
      `\`${scope.baselineRoot}/\` is governed here.`
  );
  lines.push("");
  lines.push(
    `The inventory is complete by construction rather than by inspection. \`${scope.registryPath}\` ` +
      `registers ${scope.scenarioCount} drivable scenarios and the board is kept at ` +
      `${scope.viewports.length} viewports, ${viewportList} — so ${scope.imageCount} images and ` +
      `${scope.snapshotCount} snapshots are registered, and every one of them is listed below. ` +
      `Generation stops rather than emit a partial record: a registered baseline missing from disk ` +
      `fails, and a baseline on disk that the registry does not register fails too.`
  );
  lines.push("");
  lines.push(`## Portability`);
  lines.push("");
  lines.push(
    `**Image baselines are specific to the machine and browser build that produced them.** ` +
      `PNG bytes depend on the platform's font rasterizer and the Chromium encoder, so the same ` +
      `page on another machine, another OS, or another Chromium version encodes to different bytes ` +
      `even when it looks identical. Do not treat an image diff on a different machine, or in CI, ` +
      `as a regression signal — it will report changed for reasons that have nothing to do with the ` +
      `product. The **snapshot** baselines (\`*.snapshot.txt\`) carry no rasterized pixels and are ` +
      `portable; they are the layer to trust when the machine changes.`
  );
  lines.push("");
  lines.push(...renderComparisonPolicySection(model.policies));
  lines.push("");
  lines.push(`## Pinned environment`);
  lines.push("");
  lines.push(`Recorded so a future run can explain why a baseline is or is not comparable.`);
  lines.push("");
  lines.push(`| pinned value | setting |`);
  lines.push(`| --- | --- |`);
  for (const key of Object.keys(model.pinned).sort()) lines.push(`| ${key} | \`${model.pinned[key]}\` |`);
  // One row per viewport, not one per image. The old generator walked its capture
  // results here and emitted the same two geometries thirty-one times each.
  for (const v of model.scope.viewports) {
    lines.push(`| viewport \`${v.name}\` | \`${v.width}x${v.height} @ dsf ${v.dsf}, mobile=${v.mobile}\` |`);
  }
  lines.push("");
  lines.push(`## Photographed, under another name`);
  lines.push("");
  lines.push(
    `These states are covered. They are listed on their own because no scenario is named ` +
      `after them, so a reviewer searching by name finds nothing and concludes there is a gap. ` +
      `Nothing in this section is a gap.`
  );
  lines.push("");
  for (const item of model.coveredUnderAnotherName) {
    lines.push(`- **${item.state}** — photographed by ${item.photographedBy}. ${item.why}`);
  }
  lines.push("");
  lines.push(`## What the board does not photograph`);
  lines.push("");
  lines.push(
    `A board that lists only what it covers reads as complete. These are the result states ` +
      `that exist in the product and have no image here, each with the reason. Anyone adding a ` +
      `scenario should check this list first — it is where the next one comes from.`
  );
  lines.push("");
  for (const gap of model.unphotographed) {
    lines.push(`- **${gap.state}** — ${gap.why}`);
  }
  lines.push("");
  lines.push(`## Images`);
  lines.push("");
  lines.push(
    `${model.images.length} images, ${model.images.length} snapshots, ordered by filename. Every ` +
      `checksum below is of the committed bytes as they stand in this tree.`
  );
  lines.push("");
  for (const image of model.images) {
    lines.push(`### \`${image.filename}\``);
    lines.push("");
    lines.push(`| field | value |`);
    lines.push(`| --- | --- |`);
    lines.push(`| sha256 | \`${image.sha256}\` |`);
    lines.push(`| bytes | ${image.bytes} |`);
    lines.push(`| snapshot | \`${image.snapshot.filename}\` |`);
    lines.push(`| snapshot sha256 | \`${image.snapshot.sha256}\` |`);
    lines.push(`| snapshot bytes | ${image.snapshot.bytes} |`);
    lines.push(`| viewport | ${image.viewportLabel} (${image.viewport}) |`);
    lines.push(`| url | \`${image.url}\`, query \`${image.query}\` |`);
    lines.push(`| framed on | \`${image.framedOn || "(page top)"}\` at scroll offset ${image.scrollOffset} |`);
    lines.push(`| browser | \`${image.browserVersion}\` |`);
    lines.push(`| state captured | ${image.state} |`);
    lines.push(`| expected behaviour | ${image.expected} |`);
    lines.push("");
  }
  return lines.join("\n");
}

// The whole regeneration, in the only order it is allowed to happen: derive, project,
// then write through the one write function under an authorization that opens nothing
// but manifest.md.
export function regenerateManifest(options = {}) {
  const { baselineDir = BASELINE_DIR, ...rest } = options;
  const model = buildManifestModel({ baselineDir, ...rest });
  return writeArtifact(path.join(baselineDir, "manifest.md"), renderManifest(model), new ManifestGrant());
}

// ── Capture-then-commit boundary ─────────────────────────────────────────────
// The write path is separated from the capture path so a capture that errors, times
// out, or fails its DOM assertion can never leave a baseline in place and report a
// clean diff. captureAll resolves ONLY when every capture succeeded; if any one
// rejects, the whole run rejects and commitResults is never reached.
export async function captureAll(items, captureFn) {
  const results = [];
  for (const item of items) {
    // No try/catch: a rejection propagates and aborts the run by design.
    results.push(await captureFn(item));
  }
  return results;
}

// The injectable writer this used to take was itself a way around the baseline
// guard, so it is gone: every byte lands through writeArtifact or not at all.
export function commitResults(outDir, results, grant = null) {
  const written = [];
  for (const r of results) {
    written.push(writeArtifact(path.join(outDir, r.filename), r.buf, grant));
    written.push(writeArtifact(path.join(outDir, r.snapshotFilename), r.snapshotText, grant));
  }
  return written;
}

const INVOKED_DIRECTLY =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (INVOKED_DIRECTLY) {
  main().catch((e) => {
    console.error(`\n✗ ${e.message}`);
    process.exit(1);
  });
}
