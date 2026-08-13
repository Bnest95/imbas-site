// What the board means when it says an element is visible.
//
// `__qa.visible(sel)` decides whether a scenario may proceed and whether a frame may be
// captured. Every `waitFor` step waits on it and every `assertSelector` gates on it. So
// what it counts as visible is what the board is capable of noticing, and if it answers
// true for something a reader cannot see, the board photographs a frame missing that
// thing and passes.
//
// It used to answer that question with a client rect: width > 0 and height > 0. That is
// wrong in the renderer this board pins, and the tests below are the measurement. Four
// ways of hiding an element leave the rect at its full size, and the two the founder's
// ruling names — a closed <details>, and visibility/opacity — are among them. The share
// page and the Reader result both put content behind disclosures during this pass, so
// this is not hypothetical about the tree it runs on.
//
// WHY THIS TEST LAUNCHES A BROWSER. The claim is about a renderer's semantics. A stand-in
// that returns what I expect proves that I can write a stand-in. checkVisibility's answer
// for a closed <details> is a fact about Chrome 148 that only Chrome 148 can supply, so
// this drives the same pinned binary the board drives, on the same skip terms as
// test/qa-browser-resolution.test.mjs: where the board cannot be captured, this states
// the reason rather than passing quietly.
//
// PAIRED. Every hidden case is run beside a visible twin holding the same markup, so a
// check that had simply started answering false to everything would fail here rather than
// look like a fix.
//
// Run: node --test test/qa-visibility-semantics.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

import { platformLayout, resolveBrowser } from "../scripts/qa/visual-acceptance.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HARNESS = path.resolve(HERE, "../scripts/qa/visual-acceptance.mjs");

const notACaptureMachine = (() => {
  try {
    platformLayout();
    if (!fs.existsSync(resolveBrowser().binary)) return "the governed renderer is not installed on this machine";
    return false;
  } catch {
    return `${process.platform}/${process.arch} is not a platform this board is captured on`;
  }
})();

// ── The predicate under test, taken from the harness ─────────────────────────
//
// `seen` lives inside a template literal that the harness injects into the page, so it
// cannot be imported. It is lifted out by name and shipped to the browser as itself —
// what runs below is the harness's own source text, not a restatement of it. Restating it
// here would make this a test of my transcription.
function liftSeen() {
  const src = fs.readFileSync(HARNESS, "utf8");
  const start = src.indexOf("  const seen = (el) => {");
  assert.ok(start >= 0, "could not find `seen` in the harness — has the predicate been renamed?");
  const end = src.indexOf("\n  };", start);
  assert.ok(end > start, "could not find the end of `seen`");
  return src.slice(start, end + "\n  };".length).trim();
}

// The predicate as it stood before the port, kept so the tests can show the difference
// rather than assert it. This is the only restatement in the file and it is of code that
// no longer exists.
const RECT_ONLY = `const rectOnly = (el) => {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
};`;

// Each case: the same paragraph, hidden one way or not hidden at all.
const FIXTURE = `<!doctype html><html><head><meta charset="utf-8"><style>
  body { font: 16px/1.5 system-ui; margin: 20px; width: 800px; }
</style></head><body>
  <details id="d-closed"><summary>Show the full register</summary><p id="closed-details">text</p></details>
  <details id="d-open" open><summary>Show the full register</summary><p id="open-details">text</p></details>
  <div style="visibility:hidden"><p id="visibility-hidden">text</p></div>
  <div style="visibility:visible"><p id="visibility-visible">text</p></div>
  <div style="opacity:0"><p id="opacity-zero">text</p></div>
  <div style="opacity:1"><p id="opacity-one">text</p></div>
  <p id="plain">text</p>
</body></html>`;

// ── Driving the pinned renderer ──────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function measure() {
  const { binary } = resolveBrowser();
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "imbas-vis-test-"));
  const fixture = path.join(userDataDir, "fixture.html");
  fs.writeFileSync(fixture, FIXTURE);

  const proc = spawn(
    binary,
    [
      "--headless=new",
      "--remote-debugging-port=0",
      `--user-data-dir=${userDataDir}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-gpu",
      "--hide-scrollbars",
      "about:blank",
    ],
    { stdio: ["ignore", "pipe", "pipe"] },
  );

  try {
    const portFile = path.join(userDataDir, "DevToolsActivePort");
    let port = null;
    const deadline = Date.now() + 20000;
    while (Date.now() < deadline && port === null) {
      if (fs.existsSync(portFile)) {
        const lines = fs.readFileSync(portFile, "utf8").split("\n");
        if (lines.length >= 2 && lines[0].trim()) port = Number(lines[0].trim());
      }
      if (port === null) await sleep(50);
    }
    assert.ok(port, "the renderer never wrote DevToolsActivePort");

    const target = await (
      await fetch(`http://127.0.0.1:${port}/json/new?file://${fixture}`, { method: "PUT" })
    ).json();
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((res, rej) => {
      ws.addEventListener("open", res);
      ws.addEventListener("error", rej);
    });

    let id = 0;
    const send = (method, params) =>
      new Promise((res) => {
        const myId = ++id;
        const on = (ev) => {
          const m = JSON.parse(ev.data);
          if (m.id === myId) {
            ws.removeEventListener("message", on);
            res(m.result);
          }
        };
        ws.addEventListener("message", on);
        ws.send(JSON.stringify({ id: myId, method, params }));
      });

    // Wait for the document rather than sleeping at it.
    for (let i = 0; i < 100; i++) {
      const r = await send("Runtime.evaluate", {
        expression: "document.readyState === 'complete' && !!document.getElementById('plain')",
        returnByValue: true,
      });
      if (r && r.result && r.result.value === true) break;
      await sleep(50);
    }

    const expression = `JSON.stringify((() => {
      ${liftSeen()}
      ${RECT_ONLY}
      const ids = ["plain","closed-details","open-details","visibility-hidden","visibility-visible","opacity-zero","opacity-one"];
      const out = {};
      for (const id of ids) {
        const el = document.getElementById(id);
        const r = el.getBoundingClientRect();
        out[id] = { seen: seen(el), rectOnly: rectOnly(el), area: [Math.round(r.width), Math.round(r.height)] };
      }
      return out;
    })())`;
    const evaluated = await send("Runtime.evaluate", { expression, returnByValue: true });
    assert.ok(
      evaluated && evaluated.result && typeof evaluated.result.value === "string",
      `the predicate did not evaluate in the renderer: ${JSON.stringify(evaluated)}`,
    );
    ws.close();
    return JSON.parse(evaluated.result.value);
  } finally {
    proc.kill("SIGKILL");
  }
}

let M = null;
const measured = async () => (M ||= await measure());

// ── Negative control 1 · the closed disclosure ───────────────────────────────

test(
  "content inside a closed disclosure is not visible, and its open twin is",
  { skip: notACaptureMachine },
  async () => {
    const m = await measured();

    // The control. Same markup, one attribute apart.
    assert.equal(m["open-details"].seen, true, "an OPEN disclosure's content must still count as visible");
    assert.equal(m["closed-details"].seen, false, "content inside a CLOSED disclosure counts as visible");

    // And the reason the old predicate could not tell them apart: the rect is identical.
    assert.deepEqual(
      m["closed-details"].area,
      m["open-details"].area,
      "this renderer no longer gives a closed disclosure's content a full-size box, so the " +
        "measurement this test was written from no longer holds — re-measure before trusting it",
    );
    assert.equal(
      m["closed-details"].rectOnly,
      true,
      "a rect-only test would now reject the closed disclosure on its own, which is not what was measured",
    );
  },
);

// ── Negative control 2 · visibility and opacity ──────────────────────────────

test(
  "visibility:hidden and opacity:0 are not visible, and their twins are",
  { skip: notACaptureMachine },
  async () => {
    const m = await measured();

    assert.equal(m["visibility-visible"].seen, true, "visibility:visible must count as visible");
    assert.equal(m["visibility-hidden"].seen, false, "visibility:hidden counts as visible");

    assert.equal(m["opacity-one"].seen, true, "opacity:1 must count as visible");
    assert.equal(m["opacity-zero"].seen, false, "opacity:0 counts as visible");

    for (const id of ["visibility-hidden", "opacity-zero"]) {
      assert.equal(
        m[id].rectOnly,
        true,
        `a rect-only test would now reject ${id} on its own — re-measure before trusting this file`,
      );
    }
  },
);

// ── The pair that keeps the two above honest ─────────────────────────────────

test(
  "the predicate has not simply started answering false",
  { skip: notACaptureMachine },
  async () => {
    const m = await measured();
    // Three unhidden elements, each of which the old predicate also accepted. A port that
    // broke the board by rejecting everything would pass both negative controls above and
    // fail here.
    for (const id of ["plain", "open-details", "visibility-visible", "opacity-one"]) {
      assert.equal(m[id].seen, true, `${id} is not visible, so the predicate rejects things a reader can see`);
      assert.equal(m[id].rectOnly, true, `${id} has no box, so this fixture is not measuring what it claims`);
    }
  },
);

// ── The predicate is the harness's, not a copy ───────────────────────────────

test("the harness still holds the predicate this file lifts", () => {
  // Runs everywhere, including where the browser does not. If `seen` is renamed, inlined,
  // or reverted to a rect test, the three tests above would skip or lift the wrong thing;
  // this fails instead.
  const lifted = liftSeen();
  assert.match(lifted, /checkVisibility\(/, "the harness predicate no longer asks the browser");
  for (const option of ["contentVisibilityAuto: true", "opacityProperty: true", "visibilityProperty: true"]) {
    assert.ok(lifted.includes(option), `the harness predicate no longer passes ${option}`);
  }
  assert.match(
    lifted,
    /r\.width > 0 && r\.height > 0/,
    "the box test is gone; checkVisibility answers true for a rendered element of zero area, which no camera sees",
  );
  assert.ok(
    fs.readFileSync(HARNESS, "utf8").includes("visible(sel) { return seen(document.querySelector(sel)); }"),
    "__qa.visible no longer routes through the predicate, so scenarios are gated on something else",
  );
});
