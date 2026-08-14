// The Check Register above its own top-N line, and the chip lane's own front door.
// Run: node --test test/register-overflow-contract.test.mjs
//
// Why this file exists. The register shows DEFAULT_TOP_N cards and puts the rest behind
// a disclosure control. Measured across every scenario's resolved /api/read payload, no
// fixture on the board produced more than one card — most produce exactly one, three
// produce none. So the eyebrow, the count inside the button label, and both states of
// the disclosure had never been rendered by a driven run, including the
// aria-expanded/aria-controls pair this lane put on that button. The state was reachable
// in production and unreachable in QA.
//
// `register-overflow` and `register-overflow-expanded` close that. They are written and
// complete in scripts/qa/scenarios.mjs, and they sit in PENDING_SCENARIOS rather than on
// the board because a board scenario owes a committed baseline and this lane holds every
// baseline until the founder releases them. So what holds these states meanwhile is this
// file. The assertions below are the ones that do not need a camera: how many cards the
// real assembler produces, that the guard which proves it is live, and what the control
// promises assistive technology.
//
// The chip-lane half is here for the same reason: `chip-arrival` enters through
// `?start=chips`, and what has to be true is that the query it declares is the contract
// reader-stage.js already ships rather than one written for the harness.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PENDING_SCENARIOS, SCENARIOS, assertRegisterOverflows, resolvePayloads } from "../scripts/qa/scenarios.mjs";
import { assertScenarioCapturable } from "../scripts/qa/snapshot.mjs";
import { DEFAULT_TOP_N } from "../reader-checks.js";
import { LANE_CHIPS, STAGE_CHIPS, deriveStage, parseArrival, stageView } from "../reader-stage.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const JSX = fs.readFileSync(path.join(ROOT, "workbench-app.jsx"), "utf8");

// Either registry, because a scenario reads the same whichever one holds it, and these
// assertions have to keep passing unchanged on the day the three are promoted.
const scenarioOf = (name) => {
  const scenario = PENDING_SCENARIOS[name] || SCENARIOS[name];
  assert.ok(scenario, `no scenario named ${name} in either registry`);
  return scenario;
};

const payloadOf = (name) => resolvePayloads(scenarioOf(name))["/api/read"];

// ── The fixture overflows, through the real assembler ────────────────────────

test("the overflow fixture assembles more cards than the register shows", () => {
  const read = payloadOf("register-overflow");
  assert.equal(read.checks.default_top_n, DEFAULT_TOP_N, "the fixture must be measured against the shipped top-N");
  assert.ok(
    read.checks.cards.length > read.checks.default_top_n,
    `the fixture assembled ${read.checks.cards.length} card(s) against a top-N of ${read.checks.default_top_n}, ` +
      "so the disclosure control it is named for would not render",
  );
  assert.equal(read.checks.top.length, DEFAULT_TOP_N, "the shown set is still the top N, not the whole register");
});

test("every card's spans cut its own quotes out of the answer the fixture types", () => {
  // The both-ends rule: a card exists only where both quotes were located in the answer.
  // Slicing the answer at the offsets the assembler returned, and comparing the result to
  // the text the card displays, is what separates "the assembler ran" from "a card-shaped
  // object was written into the fixture" — which is the failure A6 names. The answer is
  // taken from the drive step, because that string is what a person would have pasted.
  const read = payloadOf("register-overflow");
  const answer = scenarioOf("register-overflow").steps[0].text;
  assert.equal(typeof answer, "string", "the first drive step must fill the answer box");

  for (const card of read.checks.cards) {
    assert.ok(card.evidence_spans.length >= 2, `${card.id} carries fewer than two evidence spans, so one end was never quoted`);
    for (const span of card.evidence_spans) {
      assert.ok(span.end > span.start, `${card.id} carries a span that resolves to nothing`);
    }
    for (const side of ["proposition", "dependent_output"]) {
      const part = card[side];
      assert.ok(part && part.spans.length, `${card.id} has no resolved spans on its ${side}`);
      const cut = part.spans.map((s) => answer.slice(s.start, s.end)).join(" … ");
      assert.equal(cut, part.text, `${card.id}'s ${side} offsets do not cut the text the card displays`);
    }
  }

  // Every card distinct: card identity is derived from the two span offsets, so a
  // duplicated pair would dedup away and the count would silently drop.
  const ids = read.checks.cards.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length, `two cards share one id, so one of them was dropped: ${ids.join(", ")}`);
});

test("the counts the frame will show are the counts the payload carries", () => {
  const read = payloadOf("register-overflow");
  assert.equal(read.measurement.findings.length, 5);
  assert.equal(read.result.counts.recorded_findings.value, 5, "the construction door must not lose a finding");
  assert.equal(read.checks.cards.length, 5, "the button label prints this number, so the assertText depends on it");
  assert.ok(
    scenarioOf("register-overflow").assertText.includes(`Show the full register (${read.checks.cards.length})`),
    "the scenario asserts a button label with the card count in it; the two must not drift apart",
  );
});

// ── The guard that keeps the fixture honest ──────────────────────────────────

test("the overflow guard rejects a payload that does not overflow", () => {
  // The failure this guards against does not announce itself. assembleComparativeCheck
  // returns null on a failed gate and logs nothing, so a product change that trips one of
  // those gates removes a card in silence — the payload still builds, the register still
  // renders, and two scenarios named for the overflow photograph a register that does not
  // overflow. Driving the guard with a payload that really is under-full is what proves it
  // rejects rather than that it exists; single-findings is that shape already, one card
  // against a top-N of three.
  const under = payloadOf("single-findings");
  assert.ok(under.checks.cards.length <= under.checks.default_top_n, "single-findings must be the under-full case");
  assert.throws(
    () => assertRegisterOverflows(under, "register-overflow"),
    /assembled 1 card\(s\) against default_top_n 3/,
    "the guard passed a payload whose register does not overflow",
  );
});

test("the overflow guard passes the fixture it guards, and is wired into it", () => {
  const read = payloadOf("register-overflow");
  assert.equal(assertRegisterOverflows(read, "register-overflow"), read, "the guard must return the payload it approved");
  // Wired in, not merely available: the route function is what the harness and the tests
  // both call, so the guard has to run there or it runs nowhere.
  const registry = fs.readFileSync(path.join(ROOT, "scripts/qa/scenarios.mjs"), "utf8");
  assert.match(
    registry,
    /function overflowReadPayload\(\)\s*\{\s*return assertRegisterOverflows\(/,
    "overflowReadPayload must build through the guard; a guard beside the builder proves nothing",
  );
});

// ── What the disclosure promises assistive technology ────────────────────────

function registerPanelMarkup() {
  const start = JSX.indexOf("function CheckRegisterPanel(");
  assert.notEqual(start, -1, "workbench-app.jsx must render the register at CheckRegisterPanel");
  const end = JSX.indexOf("\nfunction ", start + 1);
  assert.ok(end > start, "the register panel's body is not readable");
  return JSX.slice(start, end);
}

test("the disclosure names the list it lengthens and reports its own state", () => {
  const panel = registerPanelMarkup();
  assert.match(panel, /aria-expanded=\{showAll\}/, "aria-expanded must track the live state, not a second flag that can drift from it");
  assert.match(panel, /aria-controls=\{CHECKS_LIST_ID\}/, "the control must name the list it opens");
  assert.match(panel, /id=\{CHECKS_LIST_ID\}/, "the id the control points at must exist on the list");
  assert.match(JSX, /const CHECKS_LIST_ID = "wb-checks-list";/, "the id must be one constant, so the pair cannot half-change");
});

test("the disclosure exists only above the top-N line, and the eyebrow only below the open one", () => {
  // Both halves matter. A control rendered under an unfilled register is a control that
  // does nothing; an eyebrow left standing over the full register qualifies a set that is
  // no longer a subset.
  const panel = registerPanelMarkup();
  assert.match(panel, /const hasMore = reg\.cards\.length > topN;/, "the overflow condition must be the card count against top-N");
  assert.match(panel, /\{hasMore \? \(\s*<button/, "the control must be gated on there being more to show");
  assert.match(
    panel,
    /\{hasMore && !showAll \? <p className="wb-checks__eyebrow">/,
    "the eyebrow qualifies a shown subset, so it must leave when the whole register is shown",
  );
});

test("the register renders nothing at all when no check resolved", () => {
  // The silence rule. Three board scenarios resolve zero checks, and what they must show
  // is nothing — not an empty panel with a heading over it.
  const panel = registerPanelMarkup();
  assert.match(
    panel,
    /if \(!reg \|\| !Array\.isArray\(reg\.cards\) \|\| reg\.cards\.length === 0\) return null;/,
    "an empty register must render null rather than an empty ceremony",
  );
});

// ── The chip lane's front door ───────────────────────────────────────────────

test("the chip-arrival scenario enters through the shipped contract, not a harness one", () => {
  const scenario = scenarioOf("chip-arrival");
  assert.equal(scenario.query, "?start=chips", "the arrival query must be the one reader-stage.js already parses");
  assert.equal(scenario.page, "/reader.html");

  // Read back through the real parser: the scenario's own declared query, handed to the
  // function the app calls on mount. This is what makes the scenario a use of the
  // contract rather than a restatement of it.
  const arrival = parseArrival({ search: scenario.query, hash: "" });
  assert.equal(arrival.lane, LANE_CHIPS, "?start=chips must resolve to the chip lane");
  assert.equal(arrival.stage, null, "the arrival carries no stage hash; the lane comes from the lane, not a fragment");

  const stage = deriveStage({ lane: arrival.lane, busy: false, hasResult: false, hasAct2: false, followUpOpen: false, hasDelta: false });
  assert.equal(stage, STAGE_CHIPS, "a person arriving this way has run nothing, and still lands in the lane");
  const view = stageView(stage);
  assert.equal(view.chipLane, true, "the lane must be visible on arrival, or the scenario photographs a closed door");
  assert.equal(view.pasteBox, false, "one live answer field at a time: the lane owns the input at this stage");
});

test("the app reads its arrival lane from the parser rather than from the query itself", () => {
  assert.match(
    JSX,
    /useState\(\(\) => parseArrival\(window\.location\)\.lane\)/,
    "the lane must initialize through parseArrival; a second reader of the query string is a second contract",
  );
  assert.match(
    JSX,
    /useState\(\(\) => parseArrival\(window\.location\)\.lane === LANE_CHIPS\)/,
    "the lane must also be mounted on arrival, or ?start=chips opens a door onto nothing",
  );
});

test("no scenario invents a stage fragment for the chip lane", () => {
  // The arrival doctrine is `?start=chips`. `#stage=chips` normalizes to the same stage,
  // which is exactly why a scenario reaching for it would look like it worked.
  for (const [name, s] of [...Object.entries(SCENARIOS), ...Object.entries(PENDING_SCENARIOS)]) {
    const url = `${s.page || ""}${s.query || ""}`;
    assert.doesNotMatch(url, /#/, `${name} carries a fragment in its URL; the harness records page and query separately`);
    assert.doesNotMatch(url, /stage=/, `${name} reaches the chip lane by a stage parameter instead of the shipped ?start=chips`);
  }
});

// ── The waiting room, and what it costs to leave it ──────────────────────────

test("every pending scenario is board-ready by the board's own shape check", () => {
  // The one thing holding these off the board is that a board scenario owes a baseline.
  // Everything else about them has to be finished, or "pending" quietly becomes a place
  // where an unfinished scenario waits without anyone noticing. assertScenarioCapturable
  // is the same function the board runs over its own members.
  for (const [name, scenario] of Object.entries(PENDING_SCENARIOS)) {
    assert.deepEqual(assertScenarioCapturable(name, scenario), [], `${name} is not board-ready`);
    assert.equal(scenario.drivable, true, `${name} has drive steps, so it is not fixture-only and must not claim to be`);
    assert.ok(scenario.state && scenario.expected, `${name} must say what it captures and what should be true of it`);
  }
});

test("the pending registry and the board do not overlap, and hold no baseline between them", () => {
  const board = new Set(Object.keys(SCENARIOS));
  const dir = path.join(ROOT, "docs/qa/visual-acceptance-harness");
  const committed = fs.readdirSync(dir);

  for (const name of Object.keys(PENDING_SCENARIOS)) {
    assert.ok(!board.has(name), `${name} sits in both registries; one of the two copies is the one nobody edits`);
    // A promotion is a move, not a copy, and this is what proves the move happened rather
    // than a baseline being accepted while the name still waited here.
    const frames = committed.filter((f) => f.startsWith(`${name}--`));
    assert.deepEqual(frames, [], `${name} is still pending but already carries committed baseline files: ${frames.join(", ")}`);
  }
});
