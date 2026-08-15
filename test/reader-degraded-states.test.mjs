// The states that are not a result (PASS 2B-B correction, item 1).
//
// A board of finished results photographs the product on its best day. Three of the
// four states added here are the days it does not finish — the request is open, the
// route refused, the metered lane was withheld — and the fourth is the screen every
// visitor sees before anything happens at all. None of them could be photographed
// until this pass, because the harness could only stub a success.
//
// What this file holds:
//
//   the capability   `httpFailure` and `neverResolves` produce tagged descriptors, and
//                    the integrity checker rejects the ways a failure scenario can be
//                    silently wrong — a status the client maps to the other family, a
//                    hang that does not declare itself, a declaration with nothing
//                    behind it.
//
//   the states       the four scenarios exist by name, at both viewports, with the
//                    baselines committed. The board census only asserts that every
//                    scenario present is photographed; it cannot notice one that was
//                    deleted. This can.
//
//   the copy         a degraded run states that it did not run. Three lines used to
//                    claim otherwise: the status line said "Inspection complete.", the
//                    copyable card printed a signal name looked up from a completeness
//                    key the client sets for styling, and the in-flight narration
//                    announced "Found something to check…" before any response existed.
//                    All three are asserted gone, at source and on the committed board.
//
// Source-reading for the component, because workbench-app.jsx is JSX and Node cannot
// import it. Run: node --test test/reader-degraded-states.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

import {
  SCENARIOS,
  assertScenarioIntegrity,
  httpFailure,
  neverResolves,
  isInjectedResponse,
  resolvePayloads,
  INJECT_HTTP,
  INJECT_HANG,
} from "../scripts/qa/scenarios.mjs";
import { ACT2_CAPACITY_COPY, isCapacityFallbackReason } from "../reader-paired.js";
import { deriveStage, stageView, STAGE_RESULT } from "../reader-stage.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = readFileSync(join(ROOT, "workbench-app.jsx"), "utf8");
const BOARD_DIR = join(ROOT, "docs", "qa", "visual-acceptance-harness");
const VIEWPORTS = ["desktop", "mobile"];

// The four states the correction requires, and what each has to prove on the board.
// `failure` is the scenario's own declaration; the integrity checker holds the
// injected response to it, so a scenario cannot claim one family and inject the other.
const REQUIRED = [
  { name: "first-load", failure: undefined, canned: true },
  { name: "read-in-flight", failure: "in_flight", canned: false },
  { name: "read-error", failure: "error", canned: false },
  { name: "read-capacity", failure: "capacity", canned: false },
];

const renderOf = (file) => {
  const text = readFileSync(join(BOARD_DIR, file), "utf8");
  const i = text.indexOf("\n## render");
  assert.ok(i >= 0, `${file} has no render section`);
  return text.slice(i);
};

// ── The capability ───────────────────────────────────────────────────────────

test("httpFailure only builds failure responses", () => {
  const r = httpFailure({ status: 503, body: { error: "unavailable" } });
  assert.equal(r[INJECT_HTTP], true);
  assert.equal(r.status, 503);
  assert.deepEqual(r.body, { error: "unavailable" });
  assert.ok(isInjectedResponse(r));

  // A 200 through this door would photograph a success under a failure scenario's
  // name, and every assertion in that scenario would still pass.
  for (const bad of [200, 302, 399, 600, "503", null, undefined, 1.5]) {
    assert.throws(() => httpFailure({ status: bad }), /4xx or 5xx/, `accepted status ${JSON.stringify(bad)}`);
  }
});

test("neverResolves is tagged, and an ordinary payload is not", () => {
  assert.equal(neverResolves()[INJECT_HANG], true);
  assert.ok(isInjectedResponse(neverResolves()));
  for (const notInjected of [{ measurement: {} }, {}, null, undefined, "x", 3, []]) {
    assert.equal(isInjectedResponse(notInjected), false, `${JSON.stringify(notInjected)} read as injected`);
  }
});

test("the integrity checker catches a failure scenario that lies about itself", () => {
  const base = { name: "x", drivable: true, steps: [{ waitFor: "body" }], assertSelector: "body" };
  const has = (problems, re) => problems.some((p) => re.test(p));

  // 429 is in the capacity family, 503 is not. A scenario that swaps them photographs
  // the wrong sentence under the right name — the one failure mode the two states
  // exist to keep apart.
  assert.ok(
    has(
      assertScenarioIntegrity({ ...base, failure: "capacity", routes: { "/api/read": httpFailure({ status: 503 }) } }),
      /capacity family but status 503/,
    ),
    "a capacity scenario injecting a non-capacity status passed",
  );
  assert.ok(
    has(
      assertScenarioIntegrity({ ...base, failure: "error", routes: { "/api/read": httpFailure({ status: 429 }) } }),
      /generic failure but status 429/,
    ),
    "a generic-error scenario injecting a capacity status passed",
  );
  // A hang that does not declare itself would sit on the board as an ordinary
  // scenario whose fixture happens to be missing.
  assert.ok(
    has(assertScenarioIntegrity({ ...base, routes: { "/api/read": neverResolves() } }), /does not declare failure/),
    "an undeclared hang passed",
  );
  // …and a declaration with nothing behind it is a scenario documenting a state it
  // does not actually produce.
  assert.ok(
    has(assertScenarioIntegrity({ ...base, failure: "error", routes: {} }), /injects no failing route/),
    "a failure declaration with no injected route passed",
  );

  // The honest shapes pass.
  assert.deepEqual(
    assertScenarioIntegrity({ ...base, failure: "error", routes: { "/api/read": httpFailure({ status: 503 }) } }),
    [],
  );
  assert.deepEqual(
    assertScenarioIntegrity({ ...base, failure: "in_flight", routes: { "/api/read": neverResolves() } }),
    [],
  );
});

test("the two failure statuses land on different families, which is why both are on the board", () => {
  // Read off the client's own predicate, not off a literal here — if the family
  // membership ever changes, this test moves with it instead of asserting history.
  assert.equal(isCapacityFallbackReason("429"), true);
  assert.equal(isCapacityFallbackReason("503"), false);

  const status = (name) => resolvePayloads(SCENARIOS[name])["/api/read"].status;
  assert.equal(isCapacityFallbackReason(String(status("read-capacity"))), true);
  assert.equal(isCapacityFallbackReason(String(status("read-error"))), false);
});

// ── The states ───────────────────────────────────────────────────────────────

test("every required board state exists, declares its kind, and is photographed at both viewports", () => {
  for (const want of REQUIRED) {
    const s = SCENARIOS[want.name];
    assert.ok(s, `the board has no scenario named ${want.name}`);
    assert.equal(s.failure, want.failure, `${want.name}: wrong failure declaration`);
    assert.equal(!!s.canned, want.canned, `${want.name}: wrong canned flag`);
    assert.deepEqual(assertScenarioIntegrity(s), [], `${want.name} failed integrity`);
    assert.ok((s.expected || "").length > 80, `${want.name}: no expected-state prose`);
    for (const vp of VIEWPORTS) {
      for (const ext of ["png", "snapshot.txt"]) {
        const f = `${want.name}--${vp}.${ext}`;
        assert.ok(existsSync(join(BOARD_DIR, f)), `missing baseline: ${f}`);
      }
    }
  }
});

test("the in-flight state is pinned to a terminal line, not to a moment", () => {
  // The narration advances on an interval and CLAMPS on its last entry. That clamp is
  // the whole basis for capturing this state deterministically: waiting for the last
  // words is a wait for something that cannot change again. If the clamp goes, the
  // capture becomes a race and three different baselines all look correct.
  assert.match(SRC, /Math\.min\(s \+ 1, READER_INSPECTING_NARRATION\.length - 1\)/);

  const list = SRC.match(/const READER_INSPECTING_NARRATION = \[([\s\S]*?)\];/);
  assert.ok(list, "READER_INSPECTING_NARRATION not found");
  const lines = [...list[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  assert.ok(lines.length >= 2, "the narration needs a distinct last line to clamp on");

  const terminal = lines[lines.length - 1];
  assert.equal(SCENARIOS["read-in-flight"].assertText[0], terminal, "the scenario waits on a line that is not the last one");
  for (const vp of VIEWPORTS) {
    assert.ok(renderOf(`read-in-flight--${vp}.snapshot.txt`).includes(terminal), `${vp}: terminal line not on the board`);
  }
});

test("nothing said while the request is open claims a finding", () => {
  const list = SRC.match(/const READER_INSPECTING_NARRATION = \[([\s\S]*?)\];/);
  const lines = [...list[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  // At the moment any of these renders, the response has not arrived. A verb of
  // discovery there reports a result the run has not got.
  for (const line of lines) {
    assert.doesNotMatch(
      line,
      /\b(found|spotted|detected|caught|identified|surfaced)\b/i,
      `the in-flight narration announces a finding before the response exists: ${JSON.stringify(line)}`,
    );
  }
  // And the retired line specifically, anywhere in the component.
  assert.ok(!SRC.includes("Found something to check"), "the retired in-flight claim is back");
});

// ── The copy ─────────────────────────────────────────────────────────────────

test("a degraded run says it did not run, on screen and on the board", () => {
  // The status line used to land on "result" for a fallback and read "Inspection
  // complete." over a banner saying the Reader was unavailable — two lines, one
  // screen, opposite claims.
  assert.match(SRC, /readerResult\.source === "fallback"\s*\?\s*"degraded"/);
  const copy = SRC.match(/const READER_STATUS_COPY = \{([\s\S]*?)\n\};/);
  assert.ok(copy, "READER_STATUS_COPY not found");
  const degraded = copy[1].match(/degraded:\s*"([^"]+)"/);
  assert.ok(degraded, "no degraded status copy");

  for (const name of ["read-error", "read-capacity"]) {
    // Presence is asserted through the scenario's own assertText, which the capture
    // routine checks against the WHOLE document before the shutter. A committed frame
    // is a viewport crop — read-capacity at 375 wide scrolls the banner into view and
    // the status line out of it — so requiring the line in every render would be
    // asserting where the frame landed, not what the product said.
    assert.ok(
      (SCENARIOS[name].assertText || []).includes(degraded[1]),
      `${name}: the scenario does not assert the degraded status line at capture time`,
    );
    // …and it has to be visible somewhere on the board, or "asserted at capture time"
    // is the only evidence and no one can look at it.
    assert.ok(
      VIEWPORTS.some((vp) => renderOf(`${name}--${vp}.snapshot.txt`).includes(degraded[1])),
      `${name}: the degraded status line is photographed at neither viewport`,
    );
    // Absence is asserted per frame, which a crop can only under-report, never fake.
    for (const vp of VIEWPORTS) {
      assert.ok(
        !renderOf(`${name}--${vp}.snapshot.txt`).includes("Inspection complete."),
        `${name}--${vp}: a failed run is photographed reporting a completed inspection`,
      );
    }
  }
});

test("the copyable card does not print a signal name for a run that never inspected", () => {
  // The client builds a fallback with completeness "thin" because that is what keys
  // the muted styling. The flag lookup over that key resolves to a signal name, and
  // the card is the copy that travels — pasted into a document, a signal name over a
  // failed request is a finding Imbas never made, with nothing around it to say so.
  const fn = SRC.match(/function formatReaderResultCopy\(result\) \{([\s\S]*?)\n\}/);
  assert.ok(fn, "formatReaderResultCopy not found");
  const body = fn[1];
  const guard = body.indexOf('result?.source === "fallback"');
  const flag = body.indexOf("`This inspection: ${comp}`");
  assert.ok(guard > 0, "the card does not branch on the fallback source");
  assert.ok(flag > guard, "the flag line is reachable before the fallback branch returns");
  assert.match(body.slice(guard, flag), /did not run/, "the fallback branch does not say the inspection did not run");
});

test("the two failure states are told apart by their copy, not only by their names", () => {
  const banner = (name, vp) => renderOf(`${name}--${vp}.snapshot.txt`);
  for (const vp of VIEWPORTS) {
    const cap = banner("read-capacity", vp);
    const err = banner("read-error", vp);
    // The capacity sentence is founder-approved and matches the server byte for byte.
    // It withholds the automated lane without withholding the instruction, which is
    // the distinction the generic line cannot carry.
    assert.ok(cap.includes(ACT2_CAPACITY_COPY), `${vp}: the capacity sentence is not on the capacity board state`);
    assert.ok(!err.includes(ACT2_CAPACITY_COPY), `${vp}: the generic failure is photographed showing the capacity sentence`);
    assert.ok(
      err.includes("Reader unavailable — showing fallback check."),
      `${vp}: the generic failure line is not on the board`,
    );
    assert.ok(
      !cap.includes("Reader unavailable — showing fallback check."),
      `${vp}: the capacity state is photographed showing the generic line`,
    );
  }
});

test("no degraded state renders a count, a finding row, or a result badge", () => {
  // Nothing inspected the answer, so nothing about the answer may be claimed. This is
  // the same rule the empty states are held to, applied where it matters more: an
  // empty state at least ran.
  for (const name of ["read-error", "read-capacity", "read-in-flight"]) {
    for (const vp of VIEWPORTS) {
      const render = renderOf(`${name}--${vp}.snapshot.txt`);
      assert.doesNotMatch(render, /differences surfaced/, `${name}--${vp}: a count is on screen`);
      assert.doesNotMatch(render, /Omission: \d/, `${name}--${vp}: a class breakdown is on screen`);
      for (const badge of ["NOTHING FLAGGED", "SOMETHING TO CHECK", "DEFLECTION FLAGGED"]) {
        assert.ok(!render.includes(badge), `${name}--${vp}: the result badge "${badge}" is on screen`);
      }
    }
  }
});

test("the first-load state promises an inspection, not a verdict", () => {
  for (const vp of VIEWPORTS) {
    const render = renderOf(`first-load--${vp}.snapshot.txt`);
    assert.ok(
      render.includes("Paste an AI answer below. The Reader inspects what it might be missing."),
      `${vp}: the front-door intro is not on the board`,
    );
    // The action is available and inert until there is something to act on, so the
    // sequence is legible before anyone commits to it.
    assert.match(render, /button "See what might be missing" disabled=true/, `${vp}: the run button is not present-and-disabled`);
    // Nothing has happened, so nothing may be reported.
    assert.doesNotMatch(render, /differences surfaced|Omission: \d/, `${vp}: a count is on the arrival screen`);
  }
});

// ── The 503's way forward ────────────────────────────────────────────────────
// The capacity state hands the person a manual continuation path in words: "You can
// still generate and run a follow-up in your own AI." The generic failure says only
// that the Reader did not run, and offers nothing in words. The audit read that as a
// missing recovery seam.
//
// It is not missing. The control the capacity sentence points at is the chip door, and
// both states reach it by the same derivation, so the 503 already carries the same way
// forward the 429 does — the 429 just names it. Asserted from the stage machine rather
// than the board, because the door's position relative to the fold differs by viewport
// and a photograph of one rectangle cannot prove presence.
//
// The words stay where they are. "At capacity" is a claim about capacity, and
// isCapacityFallbackReason("503") is false by design (above); moving that sentence onto
// a route refusal would tell the person something the response does not support.
test("the 503 state reaches the same continuation control the 429 state names", () => {
  // Both failures produce a fallback body, and a fallback carries no measurement, so
  // buildAct2 returns null and both derive the same stage.
  const degraded = deriveStage({ hasResult: true, hasAct2: false });
  assert.equal(degraded, STAGE_RESULT, "a degraded read lands on the result stage, capacity or not");
  assert.equal(stageView(degraded).chipDoor, true, "and that stage carries the chip door");

  // The door is one control with two mount points, and the mount that serves this stage
  // is the late one — the early mount stands down everywhere except the follow-up stage,
  // which a degraded read never reaches.
  assert.match(SRC, /\{view\.chipDoor && stage !== STAGE_FOLLOWUP \? chipDoorControl\(\) : null\}/);

  // The seam is reused, not rebuilt: no failure-only recovery control exists.
  assert.doesNotMatch(SRC, /retryRead|autoRetry|recoverFrom5\d\d/i, "a 503 must not retry on the person's behalf");
});
