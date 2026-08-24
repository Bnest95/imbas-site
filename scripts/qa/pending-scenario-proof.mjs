// Does a scenario waiting for a baseline actually reach the state it claims?
//
//   node scripts/qa/pending-scenario-proof.mjs
//   node scripts/qa/pending-scenario-proof.mjs --name chips-from-inspection
//
// READ-ONLY. It writes no baseline, no image and no snapshot, and touches nothing in
// docs/qa. That is the entire reason it exists.
//
// ── Why this is not just "run the board" ─────────────────────────────────────
// A scenario in PENDING_SCENARIOS is finished and drivable but holds no committed
// baseline, and the board only drives SCENARIOS. Promoting it there to see whether it
// works would write its first baseline — which is the one thing a withheld ruling
// withholds. So the drive semantics are borrowed from the board rather than
// reimplemented, and the result is printed instead of committed.
//
// ── What it proves ───────────────────────────────────────────────────────────
// 1. The scenario's OWN contract: every assertText is in the document and the
//    assertSelector is visible, checked with the board's own `__qa` helpers at the same
//    point in the drive the board checks them.
// 2. The composed state, including the things only an absence or a content check can
//    establish: that no source paste box was restored into the lane, that the lane's own
//    compose fields were not seeded with carried-over text, and that the inspection
//    underneath still holds its marks. A passing render assertion sees none of them.
// 3. Where each proof surface sits relative to the captured rectangle, so the frame this
//    would produce is described before anyone rules on it.
// 4. Last, because it leaves the state: that pressing the way back returns what was
//    pasted, byte-for-byte, with the marks intact. The origin note makes that promise in
//    words and nothing else in the harness holds it to it.
//
// ── After a promotion ────────────────────────────────────────────────────────
// `--name` resolves from SCENARIOS when the pending registry no longer holds the name, so
// a scenario keeps this proof after it becomes a board member. The board photographs a
// rectangle; proofs 2 and 4 are an absence and a round trip, and no frame can hold either.
// The promotion is what makes the frame available, not what makes these checks redundant.

import { PENDING_SCENARIOS, SCENARIOS, resolvePayloads } from "./scenarios.mjs";
import {
  BOARD_VIEWPORTS,
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
const log = (s = "") => process.stdout.write(`${s}\n`);
const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? null : process.argv[i + 1];
};

// Everything the composed state claims, read in one pass off the live page.
//
// The two absence checks are the point. "No editor is restored into the lane" and "the
// inspection still holds its marks" are both invisible to a render assertion: the first
// passes trivially when the thing is missing, and the second passes trivially when the
// thing is present but empty. Both are counted here against the live DOM.
const PROBE = `(() => {
  const lane = document.getElementById("wb-chip-lane");
  const door = document.querySelector(".wb-chip-door");
  const rect = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      top: Math.round(r.top), left: Math.round(r.left),
      width: Math.round(r.width), height: Math.round(r.height),
      bottom: Math.round(r.bottom),
    };
  };
  // The board's own visibility rule: a box AND a renderer that agrees it is painted.
  const seen = (el) => {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    return typeof el.checkVisibility === "function"
      ? el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })
      : true;
  };
  const one = (sel, root) => (root || document).querySelector(sel);
  const text = (el) => (el ? el.textContent.trim() : null);

  // Two different questions about editors, and conflating them is how a probe lies.
  //
  // The SOURCE editors are the inspection's own paste boxes, which live in
  // .wb-reader-v2__field wrappers. Opening the lane drops them out of the stage. One
  // reappearing inside the lane is the restore bug.
  //
  // The lane's OWN compose editors are supposed to be there — the first answer box is the
  // surface the whole lane exists to offer, and chip-arrival already photographs it. So
  // the check on those is not presence but writability. Over an inspection the first box
  // carries the inspected answer, read-only, off receipt.open_run.answer: that is the
  // architecture and steering the answer that was measured depends on it. What must never
  // appear is an EDITABLE box holding carried-over text, because a person could change it
  // and then be steering an answer nothing inspected.
  const SOURCE_EDITOR = ".wb-reader-v2__fields, .wb-reader-v2__field, .wb-reader-v2__reveal";
  const sourceInLane = lane ? [...lane.querySelectorAll(SOURCE_EDITOR)] : [];
  const laneEditors = lane ? [...lane.querySelectorAll("textarea, input:not([type=hidden]), [contenteditable='true']")] : [];
  const describe = (e) => ({
    tag: e.tagName.toLowerCase(),
    cls: e.className ? String(e.className).split(/\\s+/)[0] : "",
    label: (e.closest(".wb-field") || e.parentElement)?.querySelector(".wb-field-label")?.textContent.trim() || null,
    chars: typeof e.value === "string" ? e.value.length : null,
    readOnly: e.readOnly === true,
  });

  return {
    laneMounted: !!lane,
    laneHidden: lane ? lane.hidden === true : null,
    doorExpanded: door ? door.getAttribute("aria-expanded") : null,
    doorLabel: text(door),

    headingText: text(one("#wb-chip-heading")),
    headingFocusable: (() => { const h = one("#wb-chip-heading"); return h ? h.tabIndex : null; })(),
    headingIsActive: document.activeElement === one("#wb-chip-heading"),
    headingSeen: seen(one("#wb-chip-heading")),
    headingRect: rect(one("#wb-chip-heading")),

    returnText: text(one(".wb-chip__return-btn")),
    returnSeen: seen(one(".wb-chip__return-btn")),
    returnRect: rect(one(".wb-chip__return-btn")),
    returnCount: document.querySelectorAll(".wb-chip__return-btn").length,

    originMounted: !!one(".wb-chip__origin"),
    originLabel: text(one(".wb-chip__origin-label")),
    originQuestion: text(one(".wb-chip__origin-question")),
    originNote: text(one(".wb-chip__origin-note")),
    originSeen: seen(one(".wb-chip__origin")),
    originRect: rect(one(".wb-chip__origin")),

    chipCount: document.querySelectorAll("#wb-chip-lane .wb-chip__row .wb-chip__pick").length,
    chipRowRect: rect(one("#wb-chip-lane .wb-chip__row")),

    sourceEditorsInLane: sourceInLane.map((e) => "." + String(e.className).split(/\\s+/)[0]),
    laneEditors: laneEditors.map(describe),
    laneSeeded: laneEditors.filter((e) => !e.readOnly && typeof e.value === "string" && e.value.length > 0).length,

    findingRows: document.querySelectorAll(".wb-measure__list li.wb-measure__finding").length,
    checkCards: document.querySelectorAll(".wb-checks__list li").length,

    viewport: { width: window.innerWidth, height: window.innerHeight },
    scrollY: Math.round(window.scrollY),
    documentHeight: document.documentElement.scrollHeight,
  };
})()`;

const inFrame = (r, vp) => (r ? r.bottom > 0 && r.top < vp.height && r.width > 0 : false);

async function drive(cdp, origin, scenario, viewName) {
  const vp = VIEWPORTS[viewName];
  const stub = await cdp.send("Page.addScriptToEvaluateOnNewDocument", {
    source: buildStubScript(resolvePayloads(scenario)),
  });
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: vp.width,
    height: vp.height,
    deviceScaleFactor: vp.dsf,
    mobile: vp.mobile,
  });
  await cdp.send("Emulation.setLocaleOverride", { locale: "en-US" }).catch(() => {});
  await cdp.send("Emulation.setTimezoneOverride", { timezoneId: "UTC" }).catch(() => {});
  await cdp
    .send("Emulation.setEmulatedMedia", {
      features: [
        { name: "prefers-color-scheme", value: "light" },
        { name: "prefers-reduced-motion", value: "reduce" },
      ],
    })
    .catch(() => {});

  const nav = resolveNavigation(scenario);
  await cdp.send("Page.navigate", { url: `${origin}${nav.path}${nav.query || ""}` });
  await waitUntil(cdp, "document.readyState === 'complete'", { label: "document ready" });
  await waitUntil(cdp, `__qa.mounted(${JSON.stringify(resolveReadiness(nav.page).rendered)})`, {
    label: `rendered ${nav.page}`,
  });
  await runSteps(cdp, scenario.steps);
  await settle(cdp);

  // The scenario's own contract, checked exactly where the board checks it.
  const failures = [];
  if (scenario.assertSelector) {
    const ok = await evaluate(cdp, `__qa.visible(${JSON.stringify(scenario.assertSelector)})`);
    if (!ok) failures.push(`assertSelector not visible: ${scenario.assertSelector}`);
  }
  for (const t of scenario.assertText || []) {
    const ok = await evaluate(cdp, `__qa.hasText(${JSON.stringify(t)})`);
    if (!ok) failures.push(`assertText missing: ${JSON.stringify(t)}`);
  }

  // Scroll where the board would before it shot, so the geometry below describes the
  // frame this scenario would produce rather than an arbitrary scroll position.
  const focus = scenario.focus || scenario.assertSelector;
  const scrolled = await evaluate(cdp, `__qa.scrollToDeterministic(${JSON.stringify(focus)})`);
  if (!scrolled.ok) failures.push(`cannot scroll to focus ${focus}: ${scrolled.why}`);
  await settle(cdp);

  const probe = await evaluate(cdp, PROBE);

  // LAST, because it leaves the state the frame describes. The origin note promises "What
  // you pasted is still here. Going back opens it as you left it." That is a claim about
  // React state the open lane cannot show — the source boxes are unmounted while it is
  // open — so the only honest way to check it is to press the way back and read what
  // comes up. Everything above is already measured, so this cannot disturb the record.
  // What the drive typed into the source box is what "still here" has to mean, so the
  // expected value is read back off the scenario's own steps rather than re-declared.
  const ANSWER_SEL = ".wb-reader-v2__field--answer textarea";
  const typed = [...scenario.steps].reverse().find((s) => s.fill === ANSWER_SEL);
  await evaluate(cdp, `(() => { document.querySelector(".wb-chip__return-btn")?.click(); return true; })()`);
  await settle(cdp);
  const afterReturn = await evaluate(
    cdp,
    `(() => {
      const box = document.querySelector(${JSON.stringify(ANSWER_SEL)});
      const lane = document.getElementById("wb-chip-lane");
      return {
        laneHidden: lane ? lane.hidden === true : null,
        answerMounted: !!box,
        answerValue: box ? box.value : null,
        findingRows: document.querySelectorAll(".wb-measure__list li.wb-measure__finding").length,
      };
    })()`,
  );
  afterReturn.expectedChars = typed ? typed.text.length : null;
  afterReturn.answerChars = afterReturn.answerValue == null ? null : afterReturn.answerValue.length;
  afterReturn.answerMatches = !!typed && afterReturn.answerValue === typed.text;
  delete afterReturn.answerValue;

  await cdp.send("Page.removeScriptToEvaluateOnNewDocument", { identifier: stub.identifier }).catch(() => {});
  return { failures, probe, afterReturn, vp };
}

function report(name, viewName, { failures, probe, afterReturn, vp }) {
  const problems = [...failures];
  const check = (ok, msg) => {
    if (!ok) problems.push(msg);
    return ok ? "ok  " : "FAIL";
  };

  log("");
  log(`▶ ${name} @ ${viewName} (${vp.width}x${vp.height} dsf ${vp.dsf})`);
  log(
    `  window ${probe.viewport.height}px at scroll ${probe.scrollY} of a ${probe.documentHeight}px document`,
  );
  log("");
  log(`  ${check(probe.laneMounted && probe.laneHidden === false, "the lane is not open")}  stage is CHIPS and open — #wb-chip-lane mounted, hidden=${probe.laneHidden}, door aria-expanded=${probe.doorExpanded}`);
  log(`  ${check(probe.chipCount === 6, `expected six chips, found ${probe.chipCount}`)}  the six-chip bank rendered — ${probe.chipCount} chips`);
  log(`  ${check(probe.headingFocusable === -1 && probe.headingSeen, "the heading is not a visible focus target")}  the heading is a focus target and painted — tabIndex ${probe.headingFocusable}, "${probe.headingText}"`);
  log(`  ${check(probe.returnCount === 1 && probe.returnSeen, `expected one visible return control, found ${probe.returnCount}`)}  one visible return control — "${probe.returnText}"`);
  log(`  ${check(/Back to your inspection/.test(probe.returnText || ""), "the return control is not in its from-an-inspection form")}  it names the inspection, not the Reader`);
  log(`  ${check(probe.originMounted && probe.originSeen, "the origin reference is not painted")}  the origin reference is painted`);
  log(`      label    "${probe.originLabel}"`);
  log(`      question "${probe.originQuestion}"`);
  log(`      note     "${probe.originNote}"`);
  log(`  ${check(probe.sourceEditorsInLane.length === 0, `a source paste box is inside the lane: ${probe.sourceEditorsInLane.join(", ")}`)}  no source paste box restored into the lane — ${probe.sourceEditorsInLane.length} found`);
  log(`  ${check(probe.laneSeeded === 0, `the lane carried text into ${probe.laneSeeded} editable field(s)`)}  no editable field carries text into the lane — ${probe.laneEditors.length} field(s), ${probe.laneSeeded} seeded`);
  for (const e of probe.laneEditors) {
    log(`      ${e.tag.padEnd(8)} ${String(e.label || "—").padEnd(30)} ${String(e.chars)} chars${e.readOnly ? " (read-only)" : ""}`);
  }
  log(`  ${check(probe.findingRows === 2, `expected the inspection's two marks, found ${probe.findingRows}`)}  the inspection underneath still holds its marks — ${probe.findingRows} finding rows, ${probe.checkCards} register cards`);
  log("");
  log(`  inside the captured rectangle at this viewport:`);
  for (const [label, r, required] of [
    ["heading", probe.headingRect, true],
    ["return control", probe.returnRect, true],
    ["origin reference", probe.originRect, true],
    ["chip row", probe.chipRowRect, false],
  ]) {
    const yes = inFrame(r, probe.viewport);
    log(`    ${yes ? "in frame " : "below    "} ${label.padEnd(17)} top ${String(r ? r.top : "—").padStart(5)}  height ${String(r ? r.height : "—").padStart(4)}`);
    if (!yes && required) problems.push(`${label} is outside the captured rectangle at ${viewName}`);
  }

  log("");
  log(`  pressing the way back, after the frame was measured:`);
  log(`    ${check(afterReturn.laneHidden === true, "the lane did not close on return")}  the lane closed — hidden=${afterReturn.laneHidden}`);
  log(`    ${check(afterReturn.answerMatches, `what was pasted did not come back intact — ${afterReturn.answerChars} of ${afterReturn.expectedChars} chars`)}  what was pasted came back byte-for-byte — ${afterReturn.answerChars} of ${afterReturn.expectedChars} chars`);
  log(`    ${check(afterReturn.findingRows === 2, `the marks did not survive the round trip — ${afterReturn.findingRows}`)}  the marks survived the round trip — ${afterReturn.findingRows} finding rows`);
  return problems;
}

async function main() {
  const only = arg("name");
  const names = only ? [only] : Object.keys(PENDING_SCENARIOS);
  if (!names.length) {
    log("PENDING_SCENARIOS is empty. Nothing is waiting for a ruling.");
    return;
  }

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

  const problems = [];
  try {
    await installInterception(cdp, []);
    for (const name of names) {
      const scenario = PENDING_SCENARIOS[name] || SCENARIOS[name];
      if (!scenario) throw new Error(`no such scenario: ${name}`);
      for (const viewName of BOARD_VIEWPORTS) {
        problems.push(...report(name, viewName, await drive(cdp, origin, scenario, viewName)));
      }
    }
  } finally {
    cdp.close?.();
    proc.kill("SIGKILL");
    server.close();
  }

  log("");
  log(`Renderer: ${version}`);
  if (problems.length) {
    log("");
    for (const p of problems) log(`  FAIL  ${p}`);
    log("");
    log(`${problems.length} problem(s). The scenario does not reach the state it claims.`);
    process.exitCode = 1;
    return;
  }
  log(
    `${names.length === 1 ? names[0] : "Every scenario checked"} reaches the state it claims ` +
      `at both board viewports. No baseline was read for acceptance and none was written.`,
  );
}

main().catch((err) => {
  log(`pending-scenario-proof: ${err && err.stack ? err.stack : err}`);
  process.exitCode = 1;
});
