// Is the span lane reachable by a person, in a real renderer, on a populated result?
//
//   node scripts/qa/span-interaction.mjs
//   node scripts/qa/span-interaction.mjs --json
//
// READ-ONLY. It photographs nothing, reads no baseline, writes no artifact, and accepts
// nothing. Exit 0 means all three cases held; exit 1 names which did not.
//
// ── What this covers that the Node tests do not ──────────────────────────────────────
// test/reader-span-selection.test.mjs drives the resolver against test/span-dom.mjs — a
// hand-built node tree that models the six DOM members the module touches. That test is
// the right shape for what it proves and it cannot prove this: that the shipped bundle
// renders `data-start` where the resolver looks for it, that a real Selection reaches the
// component's `selectionchange` listener, that React re-renders the affordances, and that
// pressing one reaches the clipboard call with the governed string in hand. Every one of
// those seams sits between the module and the person, and none of them is exercised by a
// test that hands the resolver its own tree.
//
// So this is one pass down the whole path: real bundle, real Selection, real click.
//
// ── Why scripts/qa/ and not test/ ────────────────────────────────────────────────────
// `npm test` is `node --test test/*.test.mjs` and it runs without a browser. Every
// browser-driving instrument in this repository lives here instead and is run on its own
// — cause-attribution.mjs, reflow.mjs, chip-lane-return.mjs, comprehension.mjs,
// contrast.mjs. Putting a renderer launch inside `test/` would make the whole suite
// require an installed chromium-headless-shell to report anything at all, which is a
// change to what `npm test` means and not a thing this pass may decide.
//
// ── Why register-overflow and not deposit-fixture ────────────────────────────────────
// REPORTED RATHER THAN WORKED AROUND: the deposit fixture cannot express two of the three
// cases. singleReadPayload builds its Check Register from `measurement.findings.filter(f
// => f.check)`, and not one of depositMeasurement()'s nine findings carries a `check`
// block, so that fixture assembles zero cards and every finding in it resolves to
// verification_card_id null. A selection over its marks therefore reaches COMPOSE, the
// same state an unmarked selection reaches, and cases B and C are unreachable on it.
//
// register-overflow is the equivalent that carries what those cases need. Its five
// findings each carry a resolving check block, card identity is derived from the two span
// offsets, so five distinct sentence pairs give five distinct cards — and its answer still
// leaves one sentence unmarked, which is case A. One fixture, all three states, and the
// fixture is the repository's own.
//
// ── Why the clipboard API is the assertion target ────────────────────────────────────
// navigator.clipboard.writeText is where the product's work ends. What the operating
// system then holds is environment: it depends on a headless shell's permission model, on
// whether the click carried transient activation, and on a clipboard this process does not
// own. Asserting there would be asserting about the machine. The spy is installed at
// document-start so no real write is ever attempted, and it records the exact string the
// product handed over — which is the thing the composition lane is responsible for.

import { SCENARIOS, resolvePayloads } from "./scenarios.mjs";
import {
  CDP,
  VIEWPORTS,
  buildStubScript,
  evaluate,
  installInterception,
  launchBrowser,
  resolveBrowser,
  resolveNavigation,
  resolveReadiness,
  runSteps,
  settle,
  startStaticServer,
  waitUntil,
} from "./visual-acceptance.mjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const AS_JSON = process.argv.includes("--json");
const log = (s = "") => process.stdout.write(`${s}\n`);

const SCENARIO_NAME = "register-overflow";
const VIEWPORT_NAME = "desktop";

// ── What a person is expected to see ─────────────────────────────────────────────────
// Written out here rather than imported from reader-span-selection.js. A test that read
// SPAN_UI would pass whatever SPAN_UI said, and would go on passing through a copy change
// nobody approved — it would prove the product agrees with itself. These are the strings
// as a person reads them, stated independently, for the same reason test/span-dom.mjs
// refuses to derive its expected offsets from the module under test.
const PROBLEM_AFFORDANCE = "Click the problem";
const DESIRED_AFFORDANCE = "Click what you want";
const ATTRIBUTION = "You selected this passage. Imbas did not mark it.";
const NARROWING_TWO = "This selection touches 2 findings. Narrow it to one.";

const PROBLEM_INSTRUCTION =
  "You marked this as the problem. Ask your AI: what is this based on, and what is the source and date?";
const DESIRED_INSTRUCTION =
  "Take this part and go deeper: give the full detail, the steps, and the conditions that apply.";

// The register card the case-B passage sits inside, quoted as the register holds it.
const CARD_QUESTION =
  "Which statute sets the 40-hour threshold and the one-and-a-half rate, and does it reach this employer?";

// ── The three passages ───────────────────────────────────────────────────────────────
// Named by their words, not by their offsets. The offsets are then located in the
// fixture's own answer at run time and asserted unique, so this file states WHICH words a
// person drags across and the record states where they sit. An offset written here would
// be a second copy of the fixture, and it would rot the first time a sentence moved.
const PASSAGES = {
  // Sentence five. The one sentence of the six that no finding anchors, which is what
  // makes it the unmarked case.
  A: "If you think you were misclassified, you can file a wage claim with the labor department and ask for the unpaid hours.",
  // Inside sentence one, which mark 1 covers whole. One mark, one card.
  B: "overtime at one and a half times the regular rate for every hour over 40 in a workweek.",
  // Across the sentence-one/sentence-two boundary, so it takes in mark 1 and mark 2 and
  // the two distinct cards behind them.
  C: "over 40 in a workweek. Salaried employees are generally exempt from that rule",
};

// ── In-page driver ───────────────────────────────────────────────────────────────────
// Installed alongside the payload stub, before the bundle runs.
//
// The clipboard spy shadows the Navigator prototype's accessor with an own property on
// the instance. It records rather than writes, and it carries a marker the run asserts on
// — a spy that silently failed to install would leave the real writeText in place, the
// click would reject on a permission the headless shell never granted, the component
// would render its own "Could not copy" line, and this would report a product defect that
// is really a harness defect.
//
// selectByOffsets is the inverse of resolveAnswerOffset and is written independently of
// it: it walks the segment elements the body renders, skips [data-mark-number] subtrees
// because those characters are chrome and not answer text, and lands a boundary point on
// a real text node. It builds a real Range and puts it on the real Selection, so the
// component's own `selectionchange` listener is what notices — nothing here calls into
// the product.
const DRIVER_SCRIPT = `
(() => {
  const calls = [];
  window.__spanClipboardCalls = calls;
  const spy = {
    __isSpy: true,
    writeText(text) { calls.push(String(text)); return Promise.resolve(); },
  };
  try {
    Object.defineProperty(navigator, "clipboard", { configurable: true, get() { return spy; } });
  } catch (e) {
    window.__spanClipboardSpyError = String((e && e.message) || e);
  }

  const BODY = ".wb-measure__source .wb-source__body";
  const SPAN = ".wb-measure__source .wb-span";

  // Every text node under \`el\` that carries answer characters, in document order.
  // [data-mark-number] subtrees are excluded: the numeral renders ahead of the words it
  // labels and exists in no version of the answer.
  const answerTextNodes = (el) => {
    const out = [];
    (function walk(n) {
      if (n.nodeType === 1 && n.hasAttribute("data-mark-number")) return;
      if (n.nodeType === 3) { out.push(n); return; }
      for (const kid of n.childNodes) walk(kid);
    })(el);
    return out;
  };

  const classPath = (el) => el.tagName.toLowerCase() + [...el.classList].map((c) => "." + c).join("");

  window.__span = {
    // The boundary point standing at answer-character \`index\`, found by walking the
    // segments the body actually rendered.
    pointAt(body, index) {
      for (const seg of body.children) {
        const base = Number(seg.getAttribute("data-start"));
        if (!Number.isFinite(base)) continue;
        let acc = base;
        for (const t of answerTextNodes(seg)) {
          const len = t.data.length;
          if (index >= acc && index <= acc + len) return { node: t, offset: index - acc };
          acc += len;
        }
      }
      return null;
    },

    select(start, end) {
      const body = document.querySelector(BODY);
      if (!body) return { ok: false, why: "no source-reading body at " + BODY };
      const s = this.pointAt(body, start);
      const e = this.pointAt(body, end);
      if (!s || !e) return { ok: false, why: "boundary point did not resolve (" + start + ".." + end + ")" };

      const range = document.createRange();
      range.setStart(s.node, s.offset);
      range.setEnd(e.node, e.offset);
      const sel = document.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);

      // What the DOM itself says this selection touches, read off the marks rather than
      // off the resolver. This is the run's own account of the precondition each case
      // claims — unmarked, one mark, two marks — and it is derived from the rendered
      // element boxes, not from anything the span lane computed.
      const marks = [...body.querySelectorAll("mark[data-mark]")]
        .filter((m) => range.intersectsNode(m))
        .map((m) => m.getAttribute("data-mark"));

      return { ok: true, selected: sel.toString(), marks };
    },

    clear() {
      const sel = document.getSelection();
      if (sel) sel.removeAllRanges();
      return true;
    },

    // Everything the affordance surface is currently showing. Children are reported as a
    // class path so "and nothing else" is an assertion about the rendered tree rather
    // than about the handful of things this file remembered to look for.
    state() {
      const root = document.querySelector(SPAN);
      if (!root) return null;
      const buttons = [...root.querySelectorAll("button")];
      return {
        aria_label: root.getAttribute("aria-label"),
        children: [...root.children].map(classPath),
        buttons: buttons.map((b) => b.textContent),
        button_classes: buttons.map((b) => [...b.classList].join(" ")),
        attribution: root.querySelector(".wb-span__attribution")?.textContent ?? null,
        narrow: root.querySelector(".wb-span__narrow")?.textContent ?? null,
        question: root.querySelector(".wb-span__question")?.textContent ?? null,
        copy_fail: root.querySelector(".wb-reader-result__copy-fail")?.textContent ?? null,
      };
    },

    present() { return !!document.querySelector(SPAN); },

    clickButton(index) {
      const root = document.querySelector(SPAN);
      if (!root) return { ok: false, why: "no affordance surface" };
      const buttons = [...root.querySelectorAll("button")];
      if (!buttons[index]) return { ok: false, why: "no button at index " + index };
      buttons[index].click();
      return { ok: true, label: buttons[index].textContent };
    },

    clipboard() { return window.__spanClipboardCalls.slice(); },
    clipboardSpyInstalled() { return navigator.clipboard && navigator.clipboard.__isSpy === true; },
    clipboardSpyError() { return window.__spanClipboardSpyError || null; },
  };
})();
`;

// ── Checks ───────────────────────────────────────────────────────────────────────────
const checks = [];
function check(caseName, claim, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  checks.push({ case: caseName, claim, ok, actual, expected });
  return ok;
}

const jsonEq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Locate a passage in the fixture's own answer and prove it occurs exactly once. A
// passage that occurred twice would make "the selected words" ambiguous and the receipt
// unreadable.
function locate(answer, passage, caseName) {
  const start = answer.indexOf(passage);
  const last = answer.lastIndexOf(passage);
  if (start === -1) throw new Error(`case ${caseName}: passage is not in the fixture answer: ${JSON.stringify(passage)}`);
  if (start !== last) throw new Error(`case ${caseName}: passage occurs more than once, so its span is ambiguous`);
  return { start, end: start + passage.length };
}

// Put a selection on the page and wait for the surface to catch up. The selection is
// cleared first and the surface waited out, so no case can read the previous case's
// render and call it its own.
async function selectPassage(cdp, span) {
  await evaluate(cdp, "__span.clear()");
  await waitUntil(cdp, "__span.present() === false", { label: "affordances cleared" });
  const applied = await evaluate(cdp, `__span.select(${span.start}, ${span.end})`);
  if (!applied.ok) throw new Error(`selection failed: ${applied.why}`);
  await waitUntil(cdp, "__span.present() === true", { label: "affordances rendered" });
  return applied;
}

// ── Case A — an unmarked passage composes ────────────────────────────────────────────
async function caseA(cdp, answer) {
  const span = locate(answer, PASSAGES.A, "A");
  const applied = await selectPassage(cdp, span);

  check("A", "the selection touches no mark", applied.marks, []);
  check("A", "the browser's own selection is the passage", applied.selected, PASSAGES.A);

  const state = await evaluate(cdp, "__span.state()");
  check("A", "the surface is the two affordances and the attribution, and nothing else", state.children, [
    "p.wb-span__actions",
    "p.wb-span__attribution",
  ]);
  check("A", "exactly two affordances, in the shipped order", state.buttons, [PROBLEM_AFFORDANCE, DESIRED_AFFORDANCE]);
  check("A", "the attribution line reads as authored", state.attribution, ATTRIBUTION);
  check("A", "no narrowing line", state.narrow, null);
  check("A", "no register question", state.question, null);
  check("A", "nothing reported a failed copy", state.copy_fail, null);

  const expected = {
    problem: `${PROBLEM_INSTRUCTION}\n\n"${PASSAGES.A}"`,
    desired: `${DESIRED_INSTRUCTION}\n\n"${PASSAGES.A}"`,
  };

  const pressed = [];
  for (const [index, mode] of [[0, "problem"], [1, "desired"]]) {
    const before = (await evaluate(cdp, "__span.clipboard()")).length;
    const hit = await evaluate(cdp, `__span.clickButton(${index})`);
    if (!hit.ok) throw new Error(`case A: ${hit.why}`);
    await waitUntil(cdp, `__span.clipboard().length === ${before + 1}`, { label: `${mode} reached the clipboard` });
    const written = (await evaluate(cdp, "__span.clipboard()")).at(-1);

    check("A", `the ${mode} affordance hands over the governed composition`, written, expected[mode]);
    check("A", `the ${mode} payload quotes the selected words verbatim`, written.includes(PASSAGES.A), true);
    pressed.push({ mode, payload: written });
  }

  const after = await evaluate(cdp, "__span.state()");
  check("A", "no copy reported a failure", after.copy_fail, null);

  return { span, selected: applied.selected, marks: applied.marks, state, payloads: pressed };
}

// ── Case B — one card's question, verbatim, and no composition ───────────────────────
async function caseB(cdp, answer) {
  const span = locate(answer, PASSAGES.B, "B");
  const before = (await evaluate(cdp, "__span.clipboard()")).length;
  const applied = await selectPassage(cdp, span);

  check("B", "the selection lies inside exactly one mark", applied.marks, ["1"]);

  const state = await evaluate(cdp, "__span.state()");
  check("B", "the register's existing question surfaces verbatim", state.question, CARD_QUESTION);
  check("B", "the surface is the question, its copy control and the attribution", state.children, [
    "p.wb-span__question",
    "p.wb-measure__question",
    "p.wb-span__attribution",
  ]);
  check("B", "the attribution line still stands", state.attribution, ATTRIBUTION);
  check("B", "neither composing affordance is offered", state.buttons.includes(PROBLEM_AFFORDANCE) || state.buttons.includes(DESIRED_AFFORDANCE), false);
  check("B", "no narrowing line", state.narrow, null);
  check("B", "no composed instruction is anywhere on the surface", state.question.includes(PROBLEM_INSTRUCTION) || state.question.includes(DESIRED_INSTRUCTION), false);
  check("B", "nothing was composed to the clipboard", (await evaluate(cdp, "__span.clipboard()")).length, before);

  return { span, selected: applied.selected, marks: applied.marks, state };
}

// ── Case C — two cards, so narrow, and choose nothing ────────────────────────────────
async function caseC(cdp, answer) {
  const span = locate(answer, PASSAGES.C, "C");
  const before = (await evaluate(cdp, "__span.clipboard()")).length;
  const applied = await selectPassage(cdp, span);

  check("C", "the selection crosses two distinct marks", applied.marks, ["1", "2"]);

  const state = await evaluate(cdp, "__span.state()");
  check("C", "the narrowing state renders, with the live count set into it", state.narrow, NARROWING_TWO);
  check("C", "the surface is the narrowing line and the attribution, and nothing else", state.children, [
    "p.wb-span__narrow",
    "p.wb-span__attribution",
  ]);
  check("C", "the attribution line still stands", state.attribution, ATTRIBUTION);
  check("C", "no card was chosen", state.question, null);
  check("C", "no affordance is offered", state.buttons, []);
  check("C", "nothing was composed to the clipboard", (await evaluate(cdp, "__span.clipboard()")).length, before);

  return { span, selected: applied.selected, marks: applied.marks, state };
}

// ── Run ──────────────────────────────────────────────────────────────────────────────
async function main() {
  const scenario = SCENARIOS[SCENARIO_NAME];
  if (!scenario) throw new Error(`unknown scenario: ${SCENARIO_NAME}`);
  const vp = VIEWPORTS[VIEWPORT_NAME];
  if (!vp) throw new Error(`unknown viewport: ${VIEWPORT_NAME}`);

  const payloads = resolvePayloads(scenario);
  const answer = payloads["/api/read"]?.receipt?.open_run?.answer || "";
  if (!answer) throw new Error(`${SCENARIO_NAME} carries no receipt answer, so there is nothing to select in`);

  const renderer = resolveBrowser();
  const { server, port } = await startStaticServer(REPO_ROOT);
  const { proc, port: cdpPort } = await launchBrowser(renderer.binary);

  const versionInfo = await (await fetch(`http://127.0.0.1:${cdpPort}/json/version`)).json();
  const version = versionInfo.Browser || "unknown";
  if (version !== `HeadlessChrome/${renderer.browserVersion}`) {
    proc.kill("SIGKILL");
    server.close();
    throw new Error(`Renderer identifies as "${version}", not the governed HeadlessChrome/${renderer.browserVersion}.`);
  }

  const targets = await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json();
  const cdp = await CDP.connect(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
  const origin = `http://127.0.0.1:${port}`;

  const results = {};
  const blocked = [];
  try {
    await installInterception(cdp, blocked);
    await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: buildStubScript(payloads) });
    await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: DRIVER_SCRIPT });
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: vp.dsf,
      mobile: vp.mobile,
    });

    const nav = resolveNavigation(scenario);
    await cdp.send("Page.navigate", { url: `${origin}${nav.path}` });
    await waitUntil(cdp, "document.readyState === 'complete'", { label: "document ready" });
    await waitUntil(cdp, `__qa.mounted(${JSON.stringify(resolveReadiness(nav.page).rendered)})`, {
      label: `rendered ${nav.page}`,
    });
    await runSteps(cdp, scenario.steps);
    await settle(cdp);

    // The spy has to be proven before anything leans on it. See DRIVER_SCRIPT.
    const spyError = await evaluate(cdp, "__span.clipboardSpyError()");
    if (spyError) throw new Error(`the clipboard spy did not install: ${spyError}`);
    check("setup", "the clipboard spy stands in front of the real API", await evaluate(cdp, "__span.clipboardSpyInstalled()"), true);
    check("setup", "the populated source reading rendered", await evaluate(cdp, `!!document.querySelector(".wb-measure__source .wb-source__body")`), true);
    check("setup", "no affordance surface stands before a selection exists", await evaluate(cdp, "__span.present()"), false);

    results.A = await caseA(cdp, answer);
    results.B = await caseB(cdp, answer);
    results.C = await caseC(cdp, answer);
  } finally {
    cdp.close?.();
    proc.kill("SIGKILL");
    server.close();
  }

  const failed = checks.filter((c) => !c.ok);

  if (AS_JSON) {
    log(JSON.stringify({
      renderer: `HeadlessChrome/${renderer.browserVersion}`,
      scenario: SCENARIO_NAME,
      viewport: VIEWPORT_NAME,
      checks,
      results,
    }, null, 2));
    if (failed.length) process.exitCode = 1;
    return;
  }

  log(`── span interaction, end to end ──`);
  log(`  renderer:  HeadlessChrome/${renderer.browserVersion}`);
  log(`  scenario:  ${SCENARIO_NAME} at ${VIEWPORT_NAME}`);
  log(`  answer:    ${answer.length} characters off receipt.open_run.answer`);
  log("");

  for (const c of checks) {
    const mark = c.ok ? "ok  " : "FAIL";
    log(`  ${mark} [${c.case}] ${c.claim}`);
    if (!c.ok) {
      log(`         expected: ${JSON.stringify(c.expected)}`);
      log(`         actual:   ${JSON.stringify(c.actual)}`);
    }
  }

  log("");
  log("── receipts ──");
  for (const [name, r] of Object.entries(results)) {
    log(`  case ${name}: span ${r.span.start}..${r.span.end}, marks touched [${r.marks.join(", ") || "none"}]`);
    log(`    selected: ${JSON.stringify(r.selected)}`);
    if (r.state.question !== null) log(`    question: ${JSON.stringify(r.state.question)}`);
    if (r.state.narrow !== null) log(`    narrowing: ${JSON.stringify(r.state.narrow)}`);
    for (const p of r.payloads || []) {
      log(`    clipboard [${p.mode}]:`);
      for (const line of p.payload.split("\n")) log(`      | ${line}`);
    }
  }

  log("");
  if (blocked.length) log(`  ${blocked.length} off-origin request(s) blocked: ${[...new Set(blocked)].join(", ")}`);
  log(
    failed.length === 0
      ? `All ${checks.length} checks held. The span lane is reachable end to end: an unmarked selection composes, a one-card selection re-enters the register's own question, and a two-card selection narrows.`
      : `${failed.length} of ${checks.length} checks failed: ${failed.map((f) => `[${f.case}] ${f.claim}`).join("; ")}`,
  );
  if (failed.length) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
