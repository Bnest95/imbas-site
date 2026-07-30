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
//
// Capture mode requires --out and refuses to aim it at the committed baseline
// directory. Baselines move only under --update <scenario>. See the baseline write
// boundary below for why.

import { createServer } from "node:http";
import { spawn, execSync } from "node:child_process";
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
const BASELINE_DIR = path.resolve(REPO_ROOT, "docs/qa/visual-acceptance-harness");

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
    // The manifest attests a sha256 per image, so accepting an image change has to
    // be able to correct it. runUpdate independently refuses to rewrite it when
    // this run did not re-capture every image already on disk.
    files.add("manifest.md");
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
const VIEWPORTS = {
  desktop: { width: 1440, height: 900, dsf: 2, mobile: false },
  mobile: { width: 375, height: 812, dsf: 3, mobile: true },
  "mobile-tall": { width: 375, height: 1600, dsf: 3, mobile: true },
};

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
    state: "The share and permalink page, in every state",
    why:
      "Carved out of this pass by ruling. The share surface still renders a score from its " +
      "stored row, and schema, render, page metadata and consent copy move together in 2B-C. " +
      "Share scenarios arrive with 2B-C under 2B-C's own coverage.",
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
    state: "The paired surface with an ABSENT original-answer side",
    why:
      "Photographed, and recorded here because a reviewer looking for it by name will not " +
      "find a scenario called that. `paired-unmatched` is the frame: its second row renders " +
      "only the Second answer excerpt, because the open side resolved to nothing and the " +
      "surface leaves it out rather than standing a placeholder in its place. The scenario's " +
      "`expected` states it, and `test/qa-board-coverage.test.mjs` holds the fixture to it.",
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
export function resolveNavigation(scenario, pinned = PINNED) {
  const query = String((scenario && scenario.query) || "").replace(/^\?+/, "");
  return {
    path: `${pinned.url}${query ? `?${query}` : ""}`,
    query_parameters: query ? `?${query}` : pinned.query_parameters,
  };
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
    mounted() { return !!document.querySelector("#root, [data-reactroot], main"); },
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

  if (!(await evaluate(cdp, "__qa.reactLoaded()"))) {
    fail("React/ReactDOM did not load — the app cannot mount, so any capture would be of an empty shell.");
  }
  await waitUntil(cdp, "__qa.mounted()", { label: "app mounted" });

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
  };
}

// ── Main ─────────────────────────────────────────────────────────────────────
export function parseArgs(argv) {
  const out = {
    scenarios: [],
    viewports: ["desktop", "mobile"],
    outDir: null,
    list: false,
    all: false,
    diff: false,
    update: [],
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--list") out.list = true;
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
  if (mode === "update") return runUpdate(outDir, results, { blocked, binary, browserVersion, grant });

  // Capture mode. outDir is guaranteed non-baseline by resolveDestination, and the
  // null grant means the write guard would refuse it even if that ever stopped
  // being true.
  commitResults(outDir, results);
  for (const r of results) r.path = path.join(outDir, r.filename);
  writeManifest(outDir, results, blocked, binary, browserVersion);
  log(`✓ manifest: ${path.relative(REPO_ROOT, path.join(outDir, "manifest.md"))}`);
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
function runUpdate(outDir, results, updateCtx) {
  const { grant } = updateCtx;
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

  // The manifest attests a sha256 per image. Updating one scenario without
  // regenerating it would leave the manifest asserting a checksum that no longer
  // matches the file next to it, so either it is rewritten completely or it is
  // reported as stale — never silently left wrong.
  const onDisk = safeReaddir(outDir).filter((f) => f.endsWith(".png"));
  const covered = new Set(results.map((r) => r.filename));
  const uncovered = onDisk.filter((f) => !covered.has(f));
  if (uncovered.length) {
    log(
      `\n! manifest.md NOT regenerated: this run did not re-capture ${uncovered.join(", ")}, ` +
        `and rewriting it now would drop them. Its checksums for the updated image(s) are stale ` +
        `until you run a full capture.`
    );
  } else {
    writeManifest(outDir, results, updateCtx.blocked, updateCtx.binary, updateCtx.browserVersion, grant);
    log(`\n✓ manifest regenerated: ${path.relative(REPO_ROOT, path.join(outDir, "manifest.md"))}`);
  }
}

// ── Manifest ─────────────────────────────────────────────────────────────────
function writeManifest(outDir, results, blocked, binary, browserVersion, grant = null) {
  const baseSha = execSync("git rev-parse HEAD", { cwd: REPO_ROOT }).toString().trim();
  const dirty = execSync("git status --porcelain", { cwd: REPO_ROOT }).toString().trim();

  const lines = [];
  lines.push(`# Visual acceptance manifest`);
  lines.push("");
  lines.push(`captured_against_sha: \`${baseSha}\``);
  lines.push("");
  lines.push(
    `**These images were captured against commit \`${baseSha}\` PLUS the uncommitted working tree of the pass that produced them.** They were not captured against their own commit — that commit did not exist yet when the shutter fired. Treat \`captured_against_sha\` as the base the working tree sat on top of, nothing stronger.`
  );
  lines.push("");
  lines.push(`- working tree at capture time: **${dirty ? "dirty" : "clean"}**`);
  lines.push(`- browser: \`${binary}\``);
  lines.push(`- browser version: \`${browserVersion}\``);
  lines.push(`- captured: ${new Date().toISOString()}`);
  lines.push(`- fixtures: synthetic, from \`scripts/qa/scenarios.mjs\` — not captures, not evidence`);
  lines.push(`- network: deny-by-default; no model API call is reachable from this harness`);
  if (blocked.length) {
    lines.push(`- denied origins: ${[...new Set(blocked.map((u) => safeHost(u)))].join(", ")}`);
  }
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
  lines.push(`## Pinned environment`);
  lines.push("");
  lines.push(`Recorded so a future run can explain why a baseline is or is not comparable.`);
  lines.push("");
  lines.push(`| pinned value | setting |`);
  lines.push(`| --- | --- |`);
  // query_parameters is per-scenario, not pinned. One surface needs a query, so listing
  // a single value here would state a setting the board does not share. It is dropped
  // from the pinned table and printed against each image instead.
  const shared = { ...PINNED, browser_version: browserVersion, browser_executable: binary };
  delete shared.query_parameters;
  for (const k of Object.keys(shared).sort()) lines.push(`| ${k} | \`${shared[k]}\` |`);
  for (const r of results) {
    lines.push(
      `| viewport \`${r.viewport_name}\` | \`${r.env.viewport} @ dsf ${r.env.device_scale_factor}, ` +
        `mobile=${r.env.mobile_emulation}, scroll offset ${r.env.scroll_offset}\` |`
    );
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
  for (const gap of UNPHOTOGRAPHED) {
    lines.push(`- **${gap.state}** — ${gap.why}`);
  }
  lines.push("");
  lines.push(`## Images`);
  lines.push("");
  for (const r of results) {
    lines.push(`### \`${r.filename}\``);
    lines.push("");
    lines.push(`| field | value |`);
    lines.push(`| --- | --- |`);
    lines.push(`| sha256 | \`${r.sha256}\` |`);
    lines.push(`| bytes | ${r.bytes} |`);
    lines.push(`| viewport | ${r.viewport} (${r.viewport_name}) |`);
    lines.push(`| url | \`${PINNED.url}\`, query \`${r.env.query_parameters}\` |`);
    lines.push(`| snapshot | \`${r.snapshotFilename}\` |`);
    lines.push(`| framed on | \`${r.focus || "(page top)"}\` at scroll offset ${r.scrollTarget} |`);
    lines.push(`| state captured | ${r.state} |`);
    lines.push(`| expected behaviour | ${r.expected} |`);
    lines.push(`| captured_against_sha | \`${baseSha}\` + uncommitted working tree |`);
    lines.push("");
  }
  writeArtifact(path.join(outDir, "manifest.md"), lines.join("\n"), grant);
}

function safeHost(u) {
  try {
    return new URL(u).hostname;
  } catch {
    return u;
  }
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
