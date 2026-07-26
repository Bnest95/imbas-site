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
//   node scripts/qa/visual-acceptance.mjs --scenario single-findings --viewport mobile-tall

import { createServer } from "node:http";
import { spawn, execSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SCENARIOS, resolvePayloads, assertScenarioIntegrity } from "./scenarios.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "../..");
const CACHE_DIR = path.join(REPO_ROOT, ".qa-cache");

const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");
const log = (...a) => console.log(...a);
const fail = (msg) => {
  throw new Error(msg);
};

// ── Viewports ────────────────────────────────────────────────────────────────
// mobile-tall exists because a 375x812 capture was reported to render blank at the
// compositor while 375x1600 rendered correctly. Both are kept so the claim can be
// re-tested rather than assumed; see docs for what this run actually measured.
const VIEWPORTS = {
  desktop: { width: 1440, height: 900, dsf: 2, mobile: false },
  mobile: { width: 375, height: 812, dsf: 3, mobile: true },
  "mobile-tall": { width: 375, height: 1600, dsf: 3, mobile: true },
};

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
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(metaPath, JSON.stringify(meta));
  fs.writeFileSync(bodyPath, body);
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
      window.__qaCalls.push(p);
      return new Response(JSON.stringify(PAYLOADS[p]), {
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
    scrollTo(sel) {
      const el = document.querySelector(sel);
      if (!el) return { ok: false, why: "no match for " + sel };
      el.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" });
      return { ok: true };
    },
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

async function capture({ cdp, scenario, viewportName, outDir, serverState, blocked }) {
  const vp = VIEWPORTS[viewportName];
  if (!vp) fail(`Unknown viewport "${viewportName}". Known: ${Object.keys(VIEWPORTS).join(", ")}`);

  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: vp.width,
    height: vp.height,
    deviceScaleFactor: vp.dsf,
    mobile: vp.mobile,
  });

  await cdp.send("Page.navigate", { url: `${serverState.origin}/workbench.html` });
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
  const calls = await evaluate(cdp, "__qa.calls()");
  const unstubbed = calls.filter((c) => c.startsWith("UNSTUBBED:"));
  if (unstubbed.length) fail(`App requested unstubbed API routes: ${unstubbed.join(", ")}`);
  if (!calls.length) fail("The app never called a stubbed /api route — the captured state is not a Reader result.");
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
  if (focus) {
    const r = await evaluate(cdp, `__qa.scrollTo(${JSON.stringify(focus)})`);
    if (!r.ok) fail(`Cannot scroll focus target into view: ${r.why}`);
    await settle(cdp);

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

  fs.mkdirSync(outDir, { recursive: true });
  const filename = `${scenario.name}--${viewportName}.png`;
  const outPath = path.join(outDir, filename);
  fs.writeFileSync(outPath, buf);

  return {
    filename,
    path: outPath,
    sha256: sha256(buf),
    bytes: buf.length,
    viewport: `${vp.width}x${vp.height}@${vp.dsf}x`,
    viewport_name: viewportName,
    focus,
    state: scenario.state,
    expected: scenario.expected,
  };
}

// ── Main ─────────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const out = { scenarios: [], viewports: ["desktop", "mobile"], outDir: null, list: false, all: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--list") out.list = true;
    else if (a === "--all") out.all = true;
    else if (a === "--scenario") out.scenarios.push(argv[++i]);
    else if (a === "--viewport") out.viewports = argv[++i].split(",").map((s) => s.trim());
    else if (a === "--out") out.outDir = argv[++i];
    else fail(`Unknown argument: ${a}`);
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

  // --all means every DRIVABLE scenario. Fixture-only scenarios are skipped here but
  // rejected loudly if named explicitly, so nobody gets a silently-missing capture.
  const names = args.all
    ? Object.keys(SCENARIOS).filter((n) => SCENARIOS[n].drivable)
    : args.scenarios;
  if (!names.length) fail("Nothing to do. Pass --scenario <name>, or --all, or --list.");
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

  const outDir = path.resolve(REPO_ROOT, args.outDir || "docs/qa/visual-acceptance-harness");

  // Fixture integrity before anything expensive.
  for (const n of names) {
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

      for (const viewportName of args.viewports) {
        log(`\n▶ ${name} @ ${viewportName}`);
        const r = await capture({ cdp, scenario, viewportName, outDir, serverState, blocked });
        results.push(r);
        log(`  ✓ ${r.filename}  ${r.bytes} bytes  sha256=${r.sha256.slice(0, 16)}…`);
      }

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

  writeManifest(outDir, results, blocked, binary);
  log(`✓ manifest: ${path.relative(REPO_ROOT, path.join(outDir, "manifest.md"))}`);
}

// ── Manifest ─────────────────────────────────────────────────────────────────
function writeManifest(outDir, results, blocked, binary) {
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
  lines.push(`- captured: ${new Date().toISOString()}`);
  lines.push(`- fixtures: synthetic, from \`scripts/qa/scenarios.mjs\` — not captures, not evidence`);
  lines.push(`- network: deny-by-default; no model API call is reachable from this harness`);
  if (blocked.length) {
    lines.push(`- denied origins: ${[...new Set(blocked.map((u) => safeHost(u)))].join(", ")}`);
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
    lines.push(`| framed on | \`${r.focus || "(page top)"}\` scrolled into the viewport |`);
    lines.push(`| state captured | ${r.state} |`);
    lines.push(`| expected behaviour | ${r.expected} |`);
    lines.push(`| captured_against_sha | \`${baseSha}\` + uncommitted working tree |`);
    lines.push("");
  }
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "manifest.md"), lines.join("\n"));
}

function safeHost(u) {
  try {
    return new URL(u).hostname;
  } catch {
    return u;
  }
}

main().catch((e) => {
  console.error(`\n✗ ${e.message}`);
  process.exit(1);
});
