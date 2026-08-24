// The chip lane's open and close, measured in a live renderer.
//
//   node scripts/qa/chip-lane-return.mjs
//   node scripts/qa/chip-lane-return.mjs --view 390
//
// This is a MEASUREMENT probe, not the acceptance board. It writes no baseline, compares
// no bytes against one, and touches nothing in docs/qa/visual-acceptance-harness.
//
// ── What it is for ───────────────────────────────────────────────────────────
// test/chip-lane-return.test.mjs pins the source guarantees: which ref the fallback
// resolves to, that the reading position is read before the state change, that the lane is
// hidden rather than unmounted. Those are the right assertions for a suite with no browser,
// but three of the claims are about what a person's screen actually does, and source cannot
// settle them:
//
//   1. after opening, focus is INSIDE the lane and the lane heading is IN the viewport;
//   2. the lane's first answer is the answer the inspection ran on, it is read-only, and
//      an edit aimed at it does not move it;
//   3. the return control closes the lane and puts the person back where they were;
//   4. a half-typed draft survives the close and the reopen.
//
// So they are measured here, on the governed renderer, against the board's own scenario.
//
// ── Why single-findings ──────────────────────────────────────────────────────
// It is the one registered scenario that reaches a result with the door under it, which is
// the state the disorientation was reported from. `chip-arrival` enters the lane directly
// and so has no open transition to measure and no inspection to return to.
//
// Reduced motion is emulated, as the board emulates it, which makes both scrolls instant.
// A smooth scroll would make every reading below a race against an animation.

import { SCENARIOS, resolvePayloads } from "./scenarios.mjs";
import {
  CDP,
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

const SCENARIO = "single-findings";
const VIEWS = {
  1440: { width: 1440, height: 1000, dsf: 1, mobile: false },
  390: { width: 390, height: 844, dsf: 1, mobile: true },
};

const DOOR = ".wb-chip-door";
const LANE = "#wb-chip-lane";
const HEADING = "#wb-chip-heading";
const RETURN = ".wb-chip__return-btn";
// The lane's two paste boxes. Over an inspection the first one is not a draft: it holds
// the answer the inspection ran on, read-only, off receipt.open_run.answer. So the draft
// that has to survive a close is the SECOND one, which is the lane's own state and the
// only thing in here a person types.
const FIRST = "#wb-chip-lane textarea";
const PICK = "#wb-chip-lane .wb-chip__pick";
const DRAFT = "#wb-chip-lane .wb-chip__instruction textarea";

const DRAFT_TEXT = "half-typed answer, mid-sen";
const EDIT_ATTEMPT = "an edit the lane must refuse";

// The scroll restore lands within a pixel of the captured position on an instant scroll.
// The tolerance exists for sub-pixel layout rounding, not for a near miss: 2px is smaller
// than a line of any text on the page, so a real failure cannot hide inside it.
const RESTORE_TOLERANCE = 2;

const q = (sel) => JSON.stringify(sel);

// Focus, the lane's visibility, the heading's place in the viewport, the scroll position
// and the draft — read in one round trip so they describe one moment rather than five.
const READ = `(() => {
  const lane = document.querySelector(${q(LANE)});
  const heading = document.querySelector(${q(HEADING)});
  const draft = document.querySelector(${q(DRAFT)});
  const first = document.querySelector(${q(FIRST)});
  const active = document.activeElement;
  const r = heading ? heading.getBoundingClientRect() : null;
  return {
    laneInDocument: !!lane,
    laneHidden: lane ? lane.hidden : null,
    scrollY: Math.round(window.scrollY),
    activeTag: active ? active.tagName.toLowerCase() : null,
    activeId: active ? active.id || null : null,
    activeClass: active ? active.className || null : null,
    focusInLane: !!(lane && active && lane.contains(active)),
    focusIsHeading: !!(heading && active === heading),
    headingTop: r ? Math.round(r.top) : null,
    headingBottom: r ? Math.round(r.bottom) : null,
    headingInViewport: !!(r && r.bottom > 0 && r.top < window.innerHeight),
    viewportHeight: window.innerHeight,
    headerOffset: Math.round(
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-offset")) || 0,
    ),
    draftValue: draft ? draft.value : null,
    firstValue: first ? first.value : null,
    firstReadOnly: first ? first.readOnly : null,
    // Every paste box the lane offers, so "one live input" is a count and not an
    // impression. A second editable copy of the held answer would show up here.
    liveInputs: lane
      ? [...lane.querySelectorAll("textarea")].filter((t) => !t.readOnly && !t.disabled).length
      : null,
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  };
})()`;

const click = (sel) => `(() => {
  const el = document.querySelector(${q(sel)});
  if (!el) return { ok: false, why: "no element at " + ${q(sel)} };
  el.click();
  return { ok: true };
})()`;

// React owns the textarea's value, so writing .value directly is overwritten on the next
// render. The native setter plus a bubbling input event is how a synthetic edit reaches a
// controlled component — the same route the board's own fill step takes.
const typeDraft = (sel, text) => `(() => {
  const el = document.querySelector(${q(sel)});
  if (!el) return { ok: false, why: "no textarea at " + ${q(sel)} };
  const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
  setter.call(el, ${JSON.stringify(text)});
  el.dispatchEvent(new Event("input", { bubbles: true }));
  return { ok: true };
})()`;

// Put the door on screen and leave a real reading position under it, the way a person
// arrives at it: they have scrolled the result and the door is what they can see.
const SCROLL_TO_DOOR = `(() => {
  const el = document.querySelector(${q(DOOR)});
  if (!el) return { ok: false, why: "no door" };
  const top = el.getBoundingClientRect().top + window.scrollY - 200;
  window.scrollTo({ top: Math.max(0, top), behavior: "auto" });
  return { ok: true, scrollY: Math.round(window.scrollY) };
})()`;

const checks = [];
function check(name, pass, detail) {
  checks.push({ name, pass, detail });
  log(`  ${pass ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
}

async function probe(cdp, viewKey) {
  const vp = VIEWS[viewKey];
  const scenario = SCENARIOS[SCENARIO];
  await cdp.send("Page.removeScriptToEvaluateOnNewDocument", { identifier: "1" }).catch(() => {});
  await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: buildStubScript(resolvePayloads(scenario)) });
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
  await cdp.send("Page.navigate", { url: `${nav.path.startsWith("http") ? "" : cdp.__origin}${nav.path}` });
  await waitUntil(cdp, "document.readyState === 'complete'", { label: "document ready" });
  await waitUntil(cdp, `__qa.mounted(${JSON.stringify(resolveReadiness(nav.page).rendered)})`, {
    label: `rendered ${nav.page}`,
  });
  await runSteps(cdp, scenario.steps);
  await settle(cdp);

  log("");
  log(`── ${SCENARIO} @ ${viewKey} ──────────────────────────────────────────`);

  // ── 0. The starting position ──────────────────────────────────────────────
  const placed = await evaluate(cdp, SCROLL_TO_DOOR);
  if (!placed.ok) throw new Error(`could not reach the door: ${placed.why}`);
  await settle(cdp);
  const before = await evaluate(cdp, READ);
  check(`${viewKey}: reduced motion is emulated, so both scrolls are instant`, before.reducedMotion === true);
  const doorRect = await evaluate(
    cdp,
    `(() => { const e = document.querySelector(${q(DOOR)}); const r = e.getBoundingClientRect();
      return { top: Math.round(r.top), inViewport: r.bottom > 0 && r.top < window.innerHeight }; })()`,
  );
  check(`${viewKey}: the door is on screen when it is pressed`, doorRect.inViewport, `door top ${doorRect.top}px`);

  // ── 1. Open ───────────────────────────────────────────────────────────────
  const opened = await evaluate(cdp, click(DOOR));
  if (!opened.ok) throw new Error(opened.why);
  await waitUntil(cdp, `!document.querySelector(${q(LANE)}).hidden`, { label: "lane visible" });
  await settle(cdp);
  const open = await evaluate(cdp, READ);

  check(`${viewKey}: focus is inside the lane after opening`, open.focusInLane === true,
    `activeElement <${open.activeTag}${open.activeId ? ` id=${open.activeId}` : ""}>`);
  check(`${viewKey}: focus is on the lane's own heading`, open.focusIsHeading === true);
  check(`${viewKey}: the lane heading is within the viewport`, open.headingInViewport === true,
    `heading top ${open.headingTop}px of ${open.viewportHeight}px`);
  // Not merely on screen: under the fixed header, where the anchor mechanism puts it.
  check(`${viewKey}: the heading clears the fixed header rather than sitting behind it`,
    open.headingTop >= open.headerOffset - 1,
    `heading top ${open.headingTop}px vs header ${open.headerOffset}px`);

  // Without the fix, the same press left the door at a large negative offset with the
  // scroll untouched. Recording the delta makes the fix's effect a number.
  check(`${viewKey}: the reading position moved to follow the lane`, open.scrollY !== before.scrollY,
    `scrollY ${before.scrollY} → ${open.scrollY}`);

  // ── 2. The held first answer ──────────────────────────────────────────────
  // The lane was opened over an inspection, so its first answer is the one that
  // inspection ran on. Read the expected text off the same receipt the app renders
  // from rather than a copy of it: a constant would go on passing after a drift.
  const heldExpected = resolvePayloads(scenario)["/api/read"].receipt.open_run.answer;
  check(`${viewKey}: the first answer is the inspected answer, not an empty box`,
    open.firstValue === heldExpected,
    `${(open.firstValue || "").length} of ${heldExpected.length} chars`);
  check(`${viewKey}: the held answer is read-only`, open.firstReadOnly === true);
  check(`${viewKey}: the held answer is the lane's only copy of it, and no box is live yet`,
    open.liveInputs === 0, `${open.liveInputs} live paste boxes`);

  // A synthetic edit takes the same route a real keystroke takes. The held answer
  // belongs to the inspection, so the lane has to refuse it.
  const refused = await evaluate(cdp, typeDraft(FIRST, EDIT_ATTEMPT));
  if (!refused.ok) throw new Error(refused.why);
  await settle(cdp);
  const afterEdit = await evaluate(cdp, READ);
  check(`${viewKey}: an edit to the held answer does not change it`,
    afterEdit.firstValue === heldExpected, JSON.stringify((afterEdit.firstValue || "").slice(0, 40)));

  // ── 3. A half-typed draft, in the box that is actually the person's ───────
  const picked = await evaluate(cdp, click(PICK));
  if (!picked.ok) throw new Error(picked.why);
  await waitUntil(cdp, `!!document.querySelector(${q(DRAFT)})`, { label: "second answer box" });
  await settle(cdp);
  const typed = await evaluate(cdp, typeDraft(DRAFT, DRAFT_TEXT));
  if (!typed.ok) throw new Error(typed.why);
  await settle(cdp);
  const drafted = await evaluate(cdp, READ);
  check(`${viewKey}: the draft went in`, drafted.draftValue === DRAFT_TEXT, JSON.stringify(drafted.draftValue));
  check(`${viewKey}: the held answer still stands beside it, untouched`,
    drafted.firstValue === heldExpected);

  // ── 4. Return ─────────────────────────────────────────────────────────────
  const returned = await evaluate(cdp, click(RETURN));
  if (!returned.ok) throw new Error(returned.why);
  await waitUntil(cdp, `document.querySelector(${q(LANE)}).hidden === true`, { label: "lane hidden" });
  await settle(cdp);
  const back = await evaluate(cdp, READ);

  check(`${viewKey}: the return control closes the lane`, back.laneHidden === true);
  check(`${viewKey}: the lane stays in the document, hidden, so the draft has somewhere to live`,
    back.laneInDocument === true);
  check(`${viewKey}: the person is put back where they were`,
    Math.abs(back.scrollY - before.scrollY) <= RESTORE_TOLERANCE,
    `scrollY ${before.scrollY} → ${back.scrollY} (tolerance ${RESTORE_TOLERANCE}px)`);
  check(`${viewKey}: focus is on the door, which is the control at that position`,
    typeof back.activeClass === "string" && back.activeClass.includes("wb-chip-door"),
    `activeElement <${back.activeTag} class="${back.activeClass}">`);

  // ── 5. Reopen ─────────────────────────────────────────────────────────────
  const reopened = await evaluate(cdp, click(DOOR));
  if (!reopened.ok) throw new Error(reopened.why);
  await waitUntil(cdp, `!document.querySelector(${q(LANE)}).hidden`, { label: "lane visible again" });
  await settle(cdp);
  const again = await evaluate(cdp, READ);

  check(`${viewKey}: the half-typed draft survived the close and reopen`,
    again.draftValue === DRAFT_TEXT, JSON.stringify(again.draftValue));
  // Not the same guarantee as the line above it. The draft survives because the lane is
  // hidden and not unmounted; the held answer survives because it is read off a receipt
  // the lane does not own. Two mechanisms, and a person needs both to hold.
  check(`${viewKey}: the held answer came back as the inspection left it`,
    again.firstValue === heldExpected, `${(again.firstValue || "").length} of ${heldExpected.length} chars`);
  check(`${viewKey}: reopening focuses the lane heading again`, again.focusIsHeading === true);
  check(`${viewKey}: and brings it back into the viewport`, again.headingInViewport === true,
    `heading top ${again.headingTop}px`);
}

async function main() {
  const args = process.argv.slice(2);
  const viewArg = args.includes("--view") ? args[args.indexOf("--view") + 1] : null;
  const views = viewArg ? [viewArg] : Object.keys(VIEWS);

  const renderer = resolveBrowser();
  const { server, port } = await startStaticServer(REPO_ROOT);
  const origin = `http://127.0.0.1:${port}`;
  const { proc, port: cdpPort } = await launchBrowser(renderer.binary);
  const versionInfo = await (await fetch(`http://127.0.0.1:${cdpPort}/json/version`)).json();
  const browserVersion = versionInfo.Browser || "unknown";
  if (browserVersion !== `HeadlessChrome/${renderer.browserVersion}`) {
    proc.kill("SIGKILL");
    server.close();
    throw new Error(`Renderer identifies as "${browserVersion}", not the governed HeadlessChrome/${renderer.browserVersion}.`);
  }
  const targets = await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json();
  const cdp = await CDP.connect(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
  cdp.__origin = origin;

  try {
    await installInterception(cdp, []);
    for (const v of views) await probe(cdp, v);
  } finally {
    cdp.close?.();
    proc.kill("SIGKILL");
    server.close();
  }

  const failed = checks.filter((c) => !c.pass);
  log("");
  log(`Renderer: ${browserVersion}`);
  log(`${checks.length - failed.length} of ${checks.length} checks passed.`);
  if (failed.length) {
    for (const f of failed) log(`  FAILED: ${f.name}`);
    process.exitCode = 1;
  }
}

main().catch((e) => {
  log(String(e && e.stack ? e.stack : e));
  process.exitCode = 1;
});
