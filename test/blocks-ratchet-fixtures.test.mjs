// The blocks_before ratchet, measured against controlled fixtures.
//
// R2 makes `blocks_before` a governed ratchet. A ratchet that prints a different number
// instead of failing is a report, and a ratchet whose block definition has drifted from
// the only other committed measurement of the same quantity is two instruments arguing.
// These fixtures hold both properties on inputs whose right answer is known before the
// instrument runs.
//
// The structural half runs everywhere. The half that counts blocks in a real document is
// a claim about a renderer's layout and visibility semantics, so it drives the pinned
// binary on the same skip terms as test/qa-visibility-semantics.test.mjs.
//
// Run: node --test test/blocks-ratchet-fixtures.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

import { SCENARIOS } from "../scripts/qa/scenarios.mjs";
import { FLOOR_VIEWPORTS, STATES, measureExpression } from "../scripts/qa/comprehension.mjs";
import { platformLayout, resolveBrowser } from "../scripts/qa/visual-acceptance.mjs";
import {
  BASELINE_PATH,
  COMPOSITIONS,
  TARGET_SELECTORS,
  coverageFingerprint,
  governedScenarios,
  governedViewports,
  hold,
  populationSources,
} from "../scripts/qa/blocks-ratchet.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ARTIFACT = JSON.parse(fs.readFileSync(path.resolve(HERE, "..", BASELINE_PATH), "utf8"));
const RATCHET_SRC = fs.readFileSync(path.resolve(HERE, "../scripts/qa/blocks-ratchet.mjs"), "utf8");
const COMPREHENSION_SRC = fs.readFileSync(path.resolve(HERE, "../scripts/qa/comprehension.mjs"), "utf8");

const clone = (v) => JSON.parse(JSON.stringify(v));

// ── 1. One block definition, not two ─────────────────────────────────────────
// The ratchet and the comprehension floor must be measuring the same thing or their
// numbers cannot be set beside each other. The guarantee is structural: the ratchet has
// no walker of its own.

test("ratchet fixture: the block definition is imported from comprehension.mjs, not restated", () => {
  assert.match(RATCHET_SRC, /import \{ FLOOR_VIEWPORTS, measureExpression \} from "\.\/comprehension\.mjs"/);
  assert.match(RATCHET_SRC, /measureExpression\(comp, vp\.height\)/);
  // `hasBlockTextChild` is the walker's own local. If it ever appears in the ratchet, a
  // second copy of the definition has been written and the two instruments have forked.
  assert.ok(COMPREHENSION_SRC.includes("hasBlockTextChild"), "the walker's marker moved — this test needs rewriting");
  assert.ok(!RATCHET_SRC.includes("hasBlockTextChild"), "the ratchet has grown its own block walker");
});

test("ratchet fixture: the governed viewports are the floor's, so both instruments measure one geometry", () => {
  assert.deepEqual(governedViewports(), [390, 1440]);
  assert.deepEqual(ARTIFACT.coverage_fingerprint.viewports, [390, 1440]);
  for (const v of governedViewports()) assert.ok(FLOOR_VIEWPORTS[v], `${v} is not a floor viewport`);
});

// Every state comprehension.mjs measures is also governed here, at the same viewport. If
// the ratchet ever stopped covering one, the two instruments could disagree on it in
// silence.
test("ratchet fixture: every comprehension floor state is a governed ratchet state", () => {
  const governed = new Set(ARTIFACT.ceilings.map((g) => `${g.scenario}@${g.view}`));
  for (const st of STATES) {
    assert.ok(governed.has(`${st.scenario}@${st.view}`), `${st.scenario}@${st.view} is measured by the floor but not governed`);
  }
});

// ── 2. The registry cannot silently omit a governed case ─────────────────────

test("ratchet fixture: the fingerprint's scenario list is the whole board registry", () => {
  assert.deepEqual(governedScenarios(), Object.keys(SCENARIOS).sort());
  assert.deepEqual(ARTIFACT.coverage_fingerprint.scenarios, Object.keys(SCENARIOS).sort());
});

test("ratchet fixture: governed and ungoverned scenarios partition the registry with nothing dropped", () => {
  const governed = new Set(ARTIFACT.ceilings.map((g) => g.scenario));
  const ungoverned = new Set(ARTIFACT.ungoverned_scenarios);
  for (const s of governed) assert.ok(!ungoverned.has(s), `${s} is in both lists`);
  assert.deepEqual([...new Set([...governed, ...ungoverned])].sort(), Object.keys(SCENARIOS).sort());
  // A scenario that renders no governed region is named, not dropped. Dropping it would
  // let a surface leave the population without leaving a trace.
  assert.equal(ARTIFACT.counts.ungoverned_scenarios, ARTIFACT.ungoverned_scenarios.length);
  assert.equal(ARTIFACT.counts.governed_states, ARTIFACT.ceilings.length);
  assert.equal(ARTIFACT.counts.governed_scenarios, governed.size);
  assert.equal(ARTIFACT.ceilings.length, governed.size * ARTIFACT.coverage_fingerprint.viewports.length);
});

test("ratchet fixture: removing a scenario from the population changes the fingerprint", () => {
  const fp = ARTIFACT.coverage_fingerprint;
  const same = coverageFingerprint({ scenarios: fp.scenarios, viewports: fp.viewports, sources: fp.sources });
  assert.equal(same.sha256, fp.sha256, "the fingerprint must recompute from its four fields alone");
  const fewer = coverageFingerprint({
    scenarios: fp.scenarios.slice(1),
    viewports: fp.viewports,
    sources: fp.sources,
  });
  assert.notEqual(fewer.sha256, fp.sha256);
});

test("ratchet fixture: the coverage fingerprint is exactly its four fields and carries no measured value", () => {
  const fp = ARTIFACT.coverage_fingerprint;
  assert.deepEqual(Object.keys(fp).sort(), ["scenarios", "sha256", "sources", "target_selectors", "viewports"]);
  assert.deepEqual(fp.target_selectors, [...TARGET_SELECTORS].sort());
  const blob = JSON.stringify(fp);
  for (const k of Object.keys(ARTIFACT.counts)) assert.ok(!blob.includes(`"${k}"`), `${k} leaked into the fingerprint`);
});

test("ratchet fixture: the population sources still hash to what the fingerprint recorded", () => {
  const live = new Map(populationSources().map((s) => [s.path, s.sha256]));
  for (const s of ARTIFACT.coverage_fingerprint.sources) {
    assert.equal(live.get(s.path), s.sha256, `${s.path} changed without the ratchet baseline being rewritten`);
  }
});

// ── 3. A regression is detected, and an improvement is not a regression ──────
// `hold` is the whole enforcement surface. A ceiling means measured <= committed: one
// block more is a violation, one block fewer is not.

test("ratchet fixture: one extra block on one governed state is a violation", () => {
  const worse = clone(ARTIFACT);
  worse.ceilings[0].blocks_before += 1;
  const failures = hold(worse, ARTIFACT);
  const violations = failures.filter((f) => f.kind === "violation");
  assert.equal(violations.length, 1);
  assert.match(violations[0].message, /blocks_before \d+ → \d+/);
  assert.match(violations[0].message, /R2 forbids an increase/);
});

test("ratchet fixture: a decrease passes the ceiling", () => {
  const better = clone(ARTIFACT);
  better.ceilings[0].blocks_before -= 1;
  assert.deepEqual(hold(better, ARTIFACT), []);
});

test("ratchet fixture: an unchanged measurement passes", () => {
  assert.deepEqual(hold(clone(ARTIFACT), ARTIFACT), []);
});

// A population change and a value regression are different failures and must not be
// reported as one another: the first says the numbers are incomparable, the second says
// they are comparable and worse.
test("ratchet fixture: a moved population fails as a population change, not as a violation", () => {
  const moved = clone(ARTIFACT);
  moved.coverage_fingerprint.sha256 = "0".repeat(64);
  const failures = hold(moved, ARTIFACT);
  assert.equal(failures.filter((f) => f.kind === "violation").length, 0);
  assert.ok(failures.some((f) => f.kind === "population" && /fingerprint/.test(f.message)));
});

test("ratchet fixture: a governed state that appears or disappears is a population failure", () => {
  const dropped = clone(ARTIFACT);
  const gone = dropped.ceilings.shift();
  assert.ok(hold(dropped, ARTIFACT).some((f) => f.kind === "population" && f.message.includes(gone.scenario)));

  const added = clone(ARTIFACT);
  added.ceilings.push({ ...added.ceilings[0], scenario: "a-scenario-nobody-accepted" });
  assert.ok(hold(added, ARTIFACT).some((f) => f.kind === "population" && f.message.includes("a-scenario-nobody-accepted")));
});

// The laundering path: the fingerprint no longer matches, `--write` looks like the
// obvious repair, and an increase rides in under it. `--write` consults `hold` for
// violations before writing, so a carried-over state that got worse still blocks.
test("ratchet fixture: a regression is still a violation when the population also moved", () => {
  const both = clone(ARTIFACT);
  both.coverage_fingerprint.sha256 = "0".repeat(64);
  both.ceilings[0].blocks_before += 1;
  const failures = hold(both, ARTIFACT);
  assert.equal(failures.filter((f) => f.kind === "violation").length, 1);
  assert.ok(failures.some((f) => f.kind === "population"));
  assert.match(RATCHET_SRC, /refusing to write: a governed state carried over from the committed baseline increased/);
});

// ── 4. The historical figures are recorded as superseded, not quietly dropped ─

test("ratchet fixture: the artifact records the unreproducible historical figures as superseded", () => {
  const note = ARTIFACT.notes.superseded_historical_figures;
  for (const fragment of ["deposit-fixture 7/13/22", "single-findings 10/14", "export-single 10/14", "share-single 7/10"]) {
    assert.ok(note.includes(fragment), `the superseded note no longer names ${fragment}`);
  }
  assert.match(note, /NOT authoritative/);
  // And the measured baseline does not reproduce them, which is the reason the note exists.
  const at = (s, v) => ARTIFACT.ceilings.find((g) => g.scenario === s && g.view === v).blocks_before;
  assert.notEqual(at("deposit-fixture", 1440), 7);
  assert.notEqual(at("single-findings", 1440), 10);
  assert.notEqual(at("export-single", 1440), 10);
  assert.notEqual(at("share-single", 1440), 7);
});

test("ratchet fixture: the relation recorded in the artifact is the ceiling R2 states", () => {
  assert.match(ARTIFACT.notes.relation, /^CEILING\./);
  assert.equal(ARTIFACT.rule, "R2");
  const doctrine = fs.readFileSync(path.resolve(HERE, "..", ARTIFACT.doctrine), "utf8");
  assert.ok(
    doctrine.includes("No change may increase `blocks_before` for any finding class without a recorded founder ruling."),
    "the doctrine sentence the relation was derived from is no longer in the normative document",
  );
});

// ── 5. The count itself, in a document whose blocks can be counted by hand ───

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

// Three visible leaf text blocks above the prompt: .a, and .b and .c inside a wrapper the
// walker descends rather than counts. Everything else above the prompt is there to be
// skipped for a stated reason.
const FIXTURE_HTML = `<!doctype html><html><head><meta charset="utf-8"><style>
  body { font: 16px/1.5 system-ui; margin: 0; }
  p, div { margin: 0; }
</style></head><body>
  <div id="above-region"><p>a block above the region entirely</p></div>
  <div id="region">
    <p class="a">one</p>
    <div class="wrap"><p class="b">two</p><p class="c">three</p></div>
    <p class="none" style="display:none">display none</p>
    <p class="invis" style="visibility:hidden">visibility hidden</p>
    <p class="clear" style="opacity:0">opacity zero</p>
    <p class="blank"></p>
    <div class="prompt">the question</div>
    <p class="answer">the answer body</p>
    <p class="below">below the boundary</p>
  </div>
</body></html>`;

const WITH_PROMPT = { region: "#region", prompt: ".prompt", source: ".answer" };
const NO_PROMPT = { region: "#region", prompt: null, source: ".answer" };

async function inFixture(evaluations) {
  const { binary } = resolveBrowser();
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "imbas-ratchet-render-"));
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
        expression: "document.readyState === 'complete' && !!document.querySelector('.below')",
        returnByValue: true,
      });
      if (r && r.result && r.result.value === true) break;
      await sleep(50);
    }
    const out = [];
    for (const expression of evaluations) {
      const r = await send("Runtime.evaluate", { expression: `JSON.stringify(${expression})`, returnByValue: true });
      assert.ok(r && r.result && typeof r.result.value === "string", `the fixture returned nothing for ${expression.slice(0, 40)}`);
      out.push(JSON.parse(r.result.value));
    }
    ws.close();
    return out;
  } finally {
    proc.kill("SIGKILL");
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }
}

test("ratchet fixture: it counts the structural quantity, and one extra block is one more", { skip: notACaptureMachine }, async () => {
  const inject = `(() => {
    const p = document.createElement("p");
    p.className = "injected";
    p.textContent = "an explanation that was not there before";
    document.querySelector(".prompt").before(p);
    return true;
  })()`;

  const [withPrompt, noPrompt, injected, after] = await inFixture([
    measureExpression(WITH_PROMPT, 1000),
    measureExpression(NO_PROMPT, 1000),
    inject,
    measureExpression(WITH_PROMPT, 1000),
  ]);

  assert.equal(injected, true);

  // Three, by hand: .a, .b, .c. The wrapper is descended into rather than counted, the
  // three hidden paragraphs are skipped, the empty one carries no text, the prompt is the
  // boundary and is excluded, and .answer and .below sit at or past it.
  assert.equal(withPrompt.blocks_before, 3);
  assert.deepEqual(withPrompt.blocks.map((b) => b.cls), ["a", "b", "c"]);

  // With no prompt in the region the walker's own fallback bounds at the answer's first
  // CHARACTER, so the question line becomes one of the blocks standing before it. Both
  // compositions this ratchet governs are represented: the share renders its question,
  // the runner does not.
  //
  // `answer` is in this list on purpose and is the subtlety worth pinning. The boundary is
  // a glyph top, and a glyph top sits below its own paragraph's box top by the line's half
  // leading, so the paragraph carrying the answer is itself a block that begins before the
  // answer begins. Every runner state in the baseline is counted under that rule. It is a
  // property of the imported definition rather than a choice made here, and a future edit
  // that bounded at the element box instead would drop one block from every runner state
  // and read as a site-wide improvement that nobody made.
  assert.deepEqual(noPrompt.blocks.map((b) => b.cls), ["a", "b", "c", "prompt", "answer"]);
  assert.equal(noPrompt.blocks_before, 5);

  // Blocks outside the region are counted separately and never fold into the governed
  // number, which is what makes the region scoping visible rather than argued.
  assert.equal(withPrompt.blocks_above_region, 1);

  // The regression. One visible paragraph of explanation added before the boundary, and
  // the governed number rises by exactly one.
  assert.equal(after.blocks_before, 4);
  assert.deepEqual(after.blocks.map((b) => b.cls), ["a", "b", "c", "injected"]);

  // And that rise is what `hold` refuses.
  const base = clone(ARTIFACT);
  const now = clone(ARTIFACT);
  now.ceilings[0].blocks_before = base.ceilings[0].blocks_before + (after.blocks_before - withPrompt.blocks_before);
  assert.equal(hold(now, base).filter((f) => f.kind === "violation").length, 1);
});

test("ratchet fixture: both governed compositions are declared with the fields the walker reads", () => {
  assert.deepEqual(
    COMPOSITIONS.map((c) => c.region),
    [".wb-reader-v2__result", "#insp-record-root"],
  );
  for (const c of COMPOSITIONS) {
    assert.deepEqual(Object.keys(c).sort(), ["name", "prompt", "region", "source"]);
  }
  // The runner has no question inside the result; the share does. That difference is the
  // reason the walker carries a fallback at all, and the artifact records which boundary
  // fired for every governed state rather than leaving it to be inferred.
  const boundaries = new Map(ARTIFACT.ceilings.map((g) => [g.composition, g.boundary]));
  assert.equal(boundaries.get("runner"), "answer");
  assert.equal(boundaries.get("share"), "prompt");
});
