// The ember census, measured against controlled fixtures.
//
// scripts/qa/ember-census.mjs produces a headline number, and a headline number from an
// unchecked instrument is how the claim this lane exists to repair was made in the first
// place. These are the census's own self-tests: small inputs whose right answer is known
// before the instrument runs, so a census that has quietly stopped seeing a whole class
// of spend fails here instead of reporting a smaller, tidier number.
//
// The drift test at the end is the other half of the contract. It recomputes the census's
// authored half from the current tree and holds it against the committed artifact, so the
// baseline in docs/qa/surface-measurements/ember-census.json cannot go stale unnoticed.
// The authored half needs no renderer and runs on every machine; the driven half — which
// selectors actually reach the region — needs Chrome and is checked by `--check`.
//
// Run: node --test test/ember-census-fixtures.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

import { SCENARIOS } from "../scripts/qa/scenarios.mjs";
import { platformLayout, resolveBrowser } from "../scripts/qa/visual-acceptance.mjs";
import {
  BASELINE_PATH,
  MATCH_FN_SOURCE,
  REGION,
  REPO_ROOT,
  SOURCE_PATHS,
  authoredInventory,
  authoredProjection,
  classify,
  coverageFingerprint,
  governedScenarios,
  parseDeclarations,
  readEmberRamp,
  recomputeAuthored,
  stripSelectorPart,
} from "../scripts/qa/ember-census.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ARTIFACT = JSON.parse(fs.readFileSync(path.resolve(HERE, "..", BASELINE_PATH), "utf8"));

// A ramp with the shape of the real one — a hex step, an rgba step, and the channel
// triple — so the fixtures below exercise all three ways ember reaches a declaration.
const FIXTURE_STYLES = `:root {
  --ember: #DE6F38;
  --ember-glow: rgba(222, 111, 56, 0.30);
  --ember-trace: rgba(222, 111, 56, 0.14);
  --ember-rgb: 222, 111, 56;
  --ink: #F2E8DC;
}`;
const RAMP = readEmberRamp(FIXTURE_STYLES);

const only = (rows, selector, property) => {
  const hit = rows.filter((r) => r.selector === selector && r.property === property);
  assert.equal(hit.length, 1, `expected exactly one ${selector} { ${property} } — got ${hit.length}`);
  return hit[0];
};

// ── 1. A free-alpha spend is detected ────────────────────────────────────────
// Both spellings. `rgba(var(--ember-rgb), a)` spends the channel triple with an alpha the
// author picked; `rgba(222, 111, 56, a)` writes the same hue out longhand. Neither routes
// through a declared paint token and the census must see both.

test("census fixture: a free alpha spent through the channel token is detected", () => {
  const rows = parseDeclarations(`.mark { border-left: 2px solid rgba(var(--ember-rgb), 0.55); }`, "fixture.css");
  const c = classify(rows[0].value, RAMP);
  assert.equal(c.freeAlphas.length, 1);
  assert.equal(c.freeAlphas[0].alpha, "0.55");
  assert.equal(c.freeAlphas[0].hue, "var(--ember-rgb)");
  assert.deepEqual(c.declaredTokens, []);
});

test("census fixture: a free alpha spent on the literal ramp hue is detected", () => {
  const c = classify("rgba(222, 111, 56, 0.5)", RAMP);
  assert.equal(c.freeAlphas.length, 1);
  assert.equal(c.freeAlphas[0].alpha, "0.5");
  assert.deepEqual(c.declaredTokens, []);
});

// A shorthand carrying the spend is the case Chrome's CSSOM loses. Reading the authored
// text has to find it inside `2px solid rgba(...)`, not only in a bare colour longhand.
test("census fixture: a free alpha inside a border shorthand is detected", () => {
  const rows = parseDeclarations(`.panel { border: 1px solid rgba(var(--ember-rgb), 0.34); }`, "fixture.css");
  assert.equal(rows[0].property, "border");
  assert.equal(classify(rows[0].value, RAMP).freeAlphas[0].alpha, "0.34");
});

// ── 2. A declared token is not misclassified as free ─────────────────────────
// --ember-glow's own value is `rgba(222, 111, 56, 0.30)`. A census that resolved tokens
// before classifying would see an alpha and book a free spend, which would make every
// authorized use of the ramp look like a violation. Spending a declared step is a
// declared-token spend whatever that step happens to resolve to.

test("census fixture: a declared ramp token is a declared spend, not a free alpha", () => {
  for (const token of ["--ember", "--ember-glow", "--ember-trace"]) {
    const c = classify(`var(${token})`, RAMP);
    assert.deepEqual(c.declaredTokens, [token], `${token} should be a declared-token spend`);
    assert.deepEqual(c.freeAlphas, [], `${token} must not be counted as a free alpha`);
  }
});

test("census fixture: the channel triple is not a paint token", () => {
  assert.deepEqual(RAMP.channelTokens.map((t) => t.name), ["--ember-rgb"]);
  assert.ok(!RAMP.paintTokens.some((t) => t.name === "--ember-rgb"));
  // Spent bare rather than through rgba(), the channel is not a colour at all and books
  // nothing — the census must not invent a spend from the token name alone.
  const c = classify("var(--ember-rgb)", RAMP);
  assert.deepEqual(c.declaredTokens, []);
  assert.deepEqual(c.freeAlphas, []);
});

test("census fixture: a hue off the declared ramp is not counted as ember", () => {
  const c = classify("rgba(224, 112, 80, 0.5)", RAMP);
  assert.deepEqual(c.freeAlphas, [], "an off-ramp warm hue would need a similarity threshold to fold in");
  assert.deepEqual(c.literalHues, []);
});

// ── 3. Pseudo-state declarations are separable from resting paint ────────────

test("census fixture: a pseudo-state selector is marked, and its resting twin is not", () => {
  assert.deepEqual(stripSelectorPart(".wb-demo-trigger:hover"), { stripped: ".wb-demo-trigger", pseudoState: true });
  assert.deepEqual(stripSelectorPart(".wb-demo-trigger"), { stripped: ".wb-demo-trigger", pseudoState: false });
  // A structural pseudo-class is not a state. :not(:hover) is a resting selector that
  // happens to mention hover, and stripping it to a state would delete real paint.
  assert.equal(stripSelectorPart(".wb-btn:not(:disabled)").pseudoState, false);
  // ::before is an element, not a state — it paints at rest.
  assert.equal(stripSelectorPart(".wb-mark::before").pseudoState, false);
});

test("census fixture: a declaration is pseudo-state-only when every one of its parts is", () => {
  const mixed = parseDeclarations(`.a:hover, .b { color: rgba(var(--ember-rgb), 0.5); }`, "fixture.css")[0];
  const pure = parseDeclarations(`.a:hover, .b:focus { color: rgba(var(--ember-rgb), 0.5); }`, "fixture.css")[0];
  assert.equal(mixed.parts.every((p) => p.pseudoState), false, "a resting part makes the declaration resting");
  assert.equal(pure.parts.every((p) => p.pseudoState), true);
});

// ── 4. The registry cannot be quietly narrowed ───────────────────────────────

test("census fixture: the governed scenario list is the whole board registry", () => {
  assert.deepEqual(governedScenarios(), Object.keys(SCENARIOS).sort());
  assert.deepEqual(ARTIFACT.coverage_fingerprint.scenarios, Object.keys(SCENARIOS).sort());
});

test("census fixture: the coverage fingerprint is exactly its four fields", () => {
  const fp = ARTIFACT.coverage_fingerprint;
  assert.deepEqual(Object.keys(fp).sort(), ["region_selector", "scenarios", "sha256", "sources", "viewports"]);
  assert.equal(fp.region_selector, REGION);
  // Measured values are not part of the fingerprint. Recomputing it from the four fields
  // alone must reproduce the committed hash.
  const again = coverageFingerprint({
    region: fp.region_selector,
    scenarios: fp.scenarios,
    viewports: fp.viewports,
    sources: fp.sources,
  });
  assert.equal(again.sha256, fp.sha256);
});

// ── 5. Changing a governed declaration cannot pass silently ──────────────────
// The instrument is run against a copy of the real sources with one alpha moved. Both
// halves of the contract must react: the row's identity changes, and so does the
// fingerprint, because the source hash it carries is the changed file's.

test("census fixture: moving one governed alpha changes both the inventory and the fingerprint", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "imbas-census-fixture-"));
  try {
    for (const p of SOURCE_PATHS) fs.copyFileSync(path.join(REPO_ROOT, p), path.join(tmp, p));

    const before = authoredInventory(tmp);
    const target = only(before.rows, ".wb-loop__tag", "border-left");
    assert.deepEqual(
      target.freeAlphas.map((f) => f.alpha),
      ["0.55"],
      "the fixture's anchor declaration is no longer the one this test was written against",
    );

    const wb = path.join(tmp, "workbench.css");
    const patched = fs
      .readFileSync(wb, "utf8")
      .replace(".wb-loop__tag {", ".wb-loop__tag { border-left: 2px solid rgba(var(--ember-rgb), 0.61);");
    fs.writeFileSync(wb, patched);

    const after = authoredInventory(tmp);
    const moved = after.rows.filter((r) => r.selector === ".wb-loop__tag" && r.property === "border-left");
    assert.ok(
      moved.some((r) => r.freeAlphas.some((f) => f.alpha === "0.61")),
      "the census did not see the changed declaration",
    );

    const fpBefore = coverageFingerprint({ scenarios: ["x"], viewports: ["y"], sources: before.sources });
    const fpAfter = coverageFingerprint({ scenarios: ["x"], viewports: ["y"], sources: after.sources });
    assert.notEqual(fpAfter.sha256, fpBefore.sha256, "a changed governed source must change the fingerprint");
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

// ── 6. The committed baseline cannot drift ───────────────────────────────────

test("census baseline: the authored half still recomputes to the committed artifact", () => {
  assert.deepEqual(recomputeAuthored(ARTIFACT), authoredProjection(ARTIFACT));
});

test("census baseline: every source the fingerprint names still hashes to its recorded value", () => {
  const live = authoredInventory(REPO_ROOT);
  const byPath = new Map(live.sources.map((s) => [s.path, s.sha256]));
  for (const s of ARTIFACT.coverage_fingerprint.sources) {
    assert.equal(byPath.get(s.path), s.sha256, `${s.path} changed without the census baseline being rewritten`);
  }
});

test("census baseline: the counts equal their own inventories", () => {
  const c = ARTIFACT.counts;
  assert.equal(c.free_alpha_spends, ARTIFACT.free_alpha_inventory.length);
  assert.equal(c.declared_token_spends, ARTIFACT.declared_token_inventory.length);
  assert.equal(c.distinct_free_alphas, ARTIFACT.distinct_free_alphas.length);
  assert.equal(
    c.free_alpha_spends_resting + c.free_alpha_spends_pseudo_state_only,
    c.free_alpha_spends,
    "resting and pseudo-state must partition the free-alpha spends",
  );
  assert.equal(
    c.free_alpha_spends_pseudo_state_only,
    ARTIFACT.free_alpha_inventory.filter((r) => r.pseudo_state_only).length,
  );
  const alphas = [...new Set(ARTIFACT.free_alpha_inventory.flatMap((r) => r.alphas))].sort();
  assert.deepEqual(ARTIFACT.distinct_free_alphas, alphas);
});

// The R14 adjudication carries every region-only free-alpha spend, and a subject nobody
// wrote down is an exception preserved silently. The subject list is built from the
// measurement, so a new region-only spend joins it on its own — this asserts the other
// half, that joining it obliges somebody to say what it is.
test("census baseline: every R14 subject is a region-only spend, and every one is adjudicated", () => {
  const adj = ARTIFACT.r14_adjudication;
  const measured = ARTIFACT.free_alpha_inventory.filter((r) => r.scope === "region-only");
  assert.deepEqual(
    adj.subjects.map((s) => `${s.selector}|${s.property}`).sort(),
    measured.map((r) => `${r.selector}|${r.property}`).sort(),
    "the subjects must be exactly the region-only free-alpha spends",
  );
  for (const s of adj.subjects) {
    assert.ok(s.note, `${s.selector} ${s.property} is carried with no recorded rationale`);
  }
  for (const s of adj.subjects) {
    const m = measured.find((r) => r.selector === s.selector && r.property === s.property);
    assert.equal(s.resting_paint, !m.pseudo_state_only, `${s.selector} disagrees with its own measurement`);
  }
  assert.match(adj.changed_in_this_lane, /^No CSS\./);
});

// The 2026-08-22 ruling is the reason this count is not a gate, and a ruling that survives
// only in a commit message is a ruling the next pass will not find. It is pinned here so
// that quietly dropping it, or quietly turning the count back into a threshold, fails.
test("census baseline: the founder ruling is carried verbatim and every named selector is covered", () => {
  const r = ARTIFACT.r14_adjudication.ruling;
  assert.equal(r.date, "2026-08-22");
  assert.equal(r.authority, "founder");

  assert.match(r.text, /^Free ember alpha values are not, by themselves, an R14 violation\./);
  assert.match(r.text, /R14 governs the semantic role in which ember is spent\./);
  assert.match(r.text, /does not establish a universal requirement/);
  assert.match(r.text, /section 0 correction 1 left the registry unseeded/);
  assert.match(r.text, /section 6 judgment 6 reserves accent-token reconciliation to the founder/);

  const therefore = r.therefore.join(" ");
  assert.match(therefore, /remains a governed measurement and a technical-debt and reconciliation signal/);
  assert.match(therefore, /is NOT a pass\/fail R14 compliance threshold/);
  assert.match(therefore, /semantic-role finding under R14 or a separately adopted founder rule/);
  assert.match(therefore, /which does not exist today/);
  assert.match(therefore, /withdrawn as inaccurate/);
  assert.match(therefore, /do not normalize them to any prior target, including 26\/4\/4/);

  // The ruling names six selectors as not-to-be-changed. Every one must still be a measured
  // subject, or the record is protecting something that is no longer there.
  const named = [
    ".wb-loop__panel--second", ".wb-loop__tag", ".wb-loop__unmatched",
    ".wb-share-consent__panel", ".wb-share-consent__confirm", ".wb-perception__option:hover",
  ];
  const subjects = ARTIFACT.r14_adjudication.subjects.map((s) => s.selector);
  for (const sel of named) {
    assert.match(therefore, new RegExp(sel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `the ruling must name ${sel}`);
    assert.ok(
      subjects.some((s) => s.startsWith(sel)),
      `${sel} is named in the ruling but is no longer a measured subject`,
    );
  }
});

// The count is a signal, not a gate. Anyone reading the artifact should hit that sentence
// before they reach a number, so this pins the disclaimer to the notes rather than leaving
// it to be inferred from the adjudication section further down.
test("census baseline: the record says plainly that the free-alpha count is not a threshold", () => {
  assert.match(ARTIFACT.notes.what_the_free_alpha_count_is_not, /NOT a pass\/fail R14 compliance threshold/);
  assert.match(ARTIFACT.notes.withdrawn_claim, /WITHDRAWN as inaccurate/);
  // And the withdrawal is not just asserted — the measurement contradicts the old claim.
  const regionOnly = ARTIFACT.free_alpha_inventory.filter((r) => r.scope === "region-only");
  assert.ok(
    regionOnly.length > 0,
    "the withdrawn claim said every surviving free alpha also painted outside the region",
  );
});

// ── 7. The renderer half, on a fixture whose answer is known ─────────────────
// Two claims here are facts about Chrome and nothing but Chrome can settle them: that the
// matcher tells a region-only selector from one that also applies outside, and that the
// CSSOM loses a var()-bearing shorthand. The second is the census's whole reason for
// reading authored text, so it is measured rather than asserted in a comment.

const notACaptureMachine = (() => {
  try {
    platformLayout();
    if (!fs.existsSync(resolveBrowser().binary)) return "the governed renderer is not installed on this machine";
    return false;
  } catch {
    return `${process.platform}/${process.arch} is not a platform this board is captured on`;
  }
})();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// `.inside-only` matches nothing outside the region. `.both` matches on either side of
// it. `.hover-only` matches inside but paints only under :hover, so it is in the region
// and is not resting paint.
const FIXTURE_HTML = `<!doctype html><html><head><meta charset="utf-8"><style>
  .inside-only { border-left: 2px solid rgba(var(--ember-rgb), 0.55); }
  .both { color: rgba(var(--ember-rgb), 0.7); }
  .hover-only:hover { border-color: rgba(222, 111, 56, 0.5); }
  :root { --ember-rgb: 222, 111, 56; }
</style></head><body>
  <p class="both" id="outside-both">outside</p>
  <div class="wb-reader-v2__result">
    <p class="inside-only">inside</p>
    <p class="both">inside</p>
    <p class="hover-only">inside</p>
  </div>
</body></html>`;

async function inFixture(expression) {
  const { binary } = resolveBrowser();
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "imbas-census-render-"));
  const fixture = path.join(userDataDir, "fixture.html");
  fs.writeFileSync(fixture, FIXTURE_HTML);
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
    for (let i = 0; i < 100; i++) {
      const r = await send("Runtime.evaluate", {
        expression: "document.readyState === 'complete' && !!document.querySelector('.wb-reader-v2__result')",
        returnByValue: true,
      });
      if (r && r.result && r.result.value === true) break;
      await sleep(50);
    }
    const out = await send("Runtime.evaluate", { expression, returnByValue: true });
    assert.ok(out && out.result && typeof out.result.value === "string", "the fixture returned nothing");
    ws.close();
    return JSON.parse(out.result.value);
  } finally {
    proc.kill("SIGKILL");
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }
}

test("census fixture: region-only and also-outside are distinguishable, and :hover is not resting", { skip: notACaptureMachine }, async () => {
  const rows = parseDeclarations(FIXTURE_HTML.slice(FIXTURE_HTML.indexOf("<style>") + 7, FIXTURE_HTML.indexOf("</style>")), "fixture");
  const probes = rows
    .filter((r) => r.selector !== ":root")
    .map((r) => ({
      id: r.selector,
      parts: r.parts.map((p) => ({ stripped: p.stripped, pseudoState: p.pseudoState })),
      media: r.media,
    }));

  const res = await inFixture(
    `JSON.stringify((() => { ${MATCH_FN_SOURCE}; return __emberMatch(${JSON.stringify(REGION)}, ${JSON.stringify(probes)}, ["222, 111, 56"]); })())`,
  );

  assert.equal(res.region, true);
  assert.deepEqual(res.matched[".inside-only"], { inRegion: true, outside: false, restingInRegion: true, mediaHolds: true });
  assert.deepEqual(res.matched[".both"], { inRegion: true, outside: true, restingInRegion: true, mediaHolds: true });
  // In the region, and not resting paint. Collapsing these two into one number is the
  // error the split in the artifact exists to prevent.
  assert.deepEqual(res.matched[".hover-only:hover"], { inRegion: true, outside: false, restingInRegion: false, mediaHolds: true });

  // And the resting sweep agrees with the selector answer: the hover border is nowhere in
  // the computed paint the region actually carries at rest.
  const restingProps = res.resting.map((r) => `${r.cls}|${r.prop}|${r.value}`);
  assert.ok(restingProps.some((k) => k.startsWith("inside-only|border-left-color")), "the resting left rule should be in the sweep");
  assert.ok(!restingProps.some((k) => k.includes("hover-only|border")), "a :hover border must not appear as resting paint");
});

test("census fixture: the CSSOM loses a var()-bearing shorthand, which is why the census reads text", { skip: notACaptureMachine }, async () => {
  const res = await inFixture(`JSON.stringify((() => {
    const sheet = document.styleSheets[0];
    const rule = Array.from(sheet.cssRules).find((r) => r.selectorText === ".inside-only");
    return { cssText: rule.style.cssText, borderLeftColor: rule.style.getPropertyValue("border-left-color") };
  })())`);
  // If this ever starts returning the colour, the census may read the CSSOM — but until
  // it does, a CSSOM census reports a spend that is plainly on screen as absent.
  assert.ok(
    !res.cssText.includes("222") && !res.borderLeftColor.includes("222"),
    `Chrome now serializes the shorthand's colour (${JSON.stringify(res)}) — revisit the census's text-parsing rationale`,
  );
});
