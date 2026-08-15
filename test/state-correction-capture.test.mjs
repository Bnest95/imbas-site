// Correcting the machine's suggested reading, and where that correction is allowed to go.
//
// A person who disagrees with the state the Reader suggested can say so, on the
// Confirmation Loop and in the chip lane. The audit observed that pressing one of those
// chips fires zero network requests and read that as the correction going unrecorded.
//
// It is recorded. `state_corrected` already exists, already carries exactly the minimum
// — the machine's suggestion, the person's declaration, the run it belongs to — and
// already lands in the one place a correction may land: the browser-local telemetry log,
// whose transmission is implemented and switched off until a server flag turns it on.
// Zero network requests is that switch, not a missing write.
//
// So this file adds no capture. It is the proof the capture is sound, and it exists
// because "it is already handled" is the claim most worth pinning:
//
//   1. one correction emits exactly one event, and a no-op press emits none;
//   2. the event is a different KIND of thing from the perception tap — different name,
//      different schema, different transport, different store — so the two can never be
//      read as one another;
//   3. the perception seam could not have carried it, which is why it does not;
//   4. the correction reaches no governed artifact: not the Review Record, not the
//      receipt, not an export, not the inspection record, not anything that travels.
//
// (4) is pinned by enumerating every place the corrected state is read. A future edit
// that pipes it into an export has to come through here.
//
// Run: node --test test/state-correction-capture.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { READER_EVENTS, READER_EVENT_NAMES, buildEvent, sanitizeEventProps } from "../reader-telemetry.js";
import {
  ALL_PERCEPTION_VALUES,
  SINGLE_PERCEPTION_VALUES,
  PAIRED_PERCEPTION_VALUES,
  isPerceptionValueForMode,
  perceptionModeForValue,
} from "../reader-perception-client.js";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const JSX = readFileSync(`${ROOT}workbench-app.jsx`, "utf8");
const PERCEPTION_API = readFileSync(`${ROOT}api/reader-perception.js`, "utf8");
const REVIEW_RECORD = readFileSync(`${ROOT}reader-review-record.js`, "utf8");

const countOf = (haystack, needle) => haystack.split(needle).length - 1;

// The two correction handlers, sliced from the components that own them. Both are named
// correctTo; they are told apart by the component each sits in.
function correctToBodies() {
  const bodies = [...JSX.matchAll(/const correctTo = \(next\) => \{([\s\S]*?)\n  \};/g)].map((m) => m[1]);
  assert.equal(bodies.length, 2, "two surfaces offer a correction: the Confirmation Loop and the chip lane");
  return bodies;
}

// ── 1. One correction, one event ─────────────────────────────────────────────

test("a correction emits exactly one event, and a press that changes nothing emits none", () => {
  for (const body of correctToBodies()) {
    assert.match(
      body,
      /^\s*if \(next === userState\) return;/,
      "the guard runs first, so re-pressing the state already held records nothing",
    );
    assert.equal(countOf(body, "emitReaderEvent("), 1, "one correction is one event, never two");
    assert.match(body, /emitReaderEvent\(READER_EVENTS\.STATE_CORRECTED, \{ run, from_state: userState, to_state: next/);
    // The emit precedes the state change, which is what makes from_state the state the
    // person is leaving rather than the one they just arrived at.
    assert.ok(
      body.indexOf("emitReaderEvent(") < body.indexOf("setUserState(next)"),
      "from_state must be read before the correction is applied",
    );
  }
});

test("the event carries the machine's suggestion, the person's reading, and the run — and nothing else", () => {
  // Executed, not read: this is what a correction actually produces.
  const event = buildEvent(
    READER_EVENTS.STATE_CORRECTED,
    { run: "run_abc", from_state: "gap_revealed", to_state: "still_missing", check: "quick" },
    1_700_000_000_000,
  );
  assert.deepEqual(event, {
    name: "state_corrected",
    ts: 1_700_000_000_000,
    run: "run_abc",
    from_state: "gap_revealed",
    to_state: "still_missing",
    check: "quick",
  });

  // And the allowlist is the reason no answer text can ever ride one.
  const smuggled = sanitizeEventProps({
    run: "run_abc",
    from_state: "gap_revealed",
    to_state: "still_missing",
    answer: "the pasted answer body",
    question: "what the person asked",
    note: "a free-text correction reason",
  });
  assert.deepEqual(Object.keys(smuggled).sort(), ["from_state", "run", "to_state"]);
});

test("the machine's suggestion is what from_state starts as, on both surfaces", () => {
  // useState(suggested) is the whole mechanism: before any correction the held state IS
  // the suggested one, so the first correction reports the machine's reading as its from.
  assert.equal(
    countOf(JSX, "const [userState, setUserState] = useState(suggested);"),
    2,
    "both correction surfaces must seed the held state from the machine's suggestion",
  );
});

// ── 2. Distinct from the perception tap ──────────────────────────────────────

test("a correction and a perception tap are different kinds of thing, not two values of one", () => {
  // Different vocabulary. No overlap in either direction, so neither can be parsed as
  // the other after the fact.
  const overlap = READER_EVENT_NAMES.filter((n) => ALL_PERCEPTION_VALUES.includes(n));
  assert.deepEqual(overlap, [], "no telemetry event name is also a perception value");
  assert.equal(perceptionModeForValue(READER_EVENTS.STATE_CORRECTED), null);
  assert.equal(isPerceptionValueForMode("single", READER_EVENTS.STATE_CORRECTED), false);
  assert.equal(isPerceptionValueForMode("paired", READER_EVENTS.STATE_CORRECTED), false);

  // Different schema. A perception write carries one enum from a closed set of five and
  // no event type at all; a correction carries a from/to pair and names itself.
  assert.equal(SINGLE_PERCEPTION_VALUES.length + PAIRED_PERCEPTION_VALUES.length, 5);
  assert.equal(ALL_PERCEPTION_VALUES.length, 5, "the perception vocabulary is still exactly five values");
  for (const value of ALL_PERCEPTION_VALUES) {
    assert.doesNotMatch(value, /correct/, "no perception value may read as a correction");
  }
});

test("a correction takes a different road and stops in a different place", () => {
  // The correction: emitReaderEvent, which writes the browser's own log and returns.
  assert.match(
    JSX,
    /function emitReaderEvent\(name, props = \{\}\) \{[\s\S]*?localStorage\.setItem\(READER_EVENTS_STORAGE_KEY[\s\S]*?\n\}/,
    "corrections land in browser-local storage",
  );
  for (const body of correctToBodies()) {
    assert.doesNotMatch(body, /fetch\(|XMLHttpRequest|sendBeacon/, "a correction performs no request of its own");
  }

  // The perception tap: a POST to an endpoint that PATCHes one field on the row the
  // receipt identifies. That row is the inspection record, which is exactly why a
  // calibration event could not be routed through this seam — see the next test.
  assert.match(JSX, /const READER_PERCEPTION_API = "\/api\/reader-perception";/);
  assert.match(PERCEPTION_API, /Perception Tap/, "the endpoint writes the perception field");
});

test("the perception seam could not have carried a distinct correction event", () => {
  // Two independent reasons, both structural.
  //
  // First: the request has no event type. Its only meaningful field is `value`, and the
  // server accepts a value only if it is one of the five perception enums. A correction
  // sent through it would have to arrive wearing one of those five, and afterwards
  // nothing could tell it apart from a person answering the tap.
  assert.match(PERCEPTION_API, /const SINGLE_VALUES = new Set\(SINGLE_PERCEPTION_VALUES\);/);
  assert.match(PERCEPTION_API, /const PAIRED_VALUES = new Set\(PAIRED_PERCEPTION_VALUES\);/);
  assert.doesNotMatch(
    PERCEPTION_API,
    /body\.(?:event|event_type|kind|type)\b/,
    "the perception request carries no event-type discriminator to hang a second event on",
  );

  // Second, and decisive: the write target is a field on the governed run row. Anything
  // sent through this seam enters the inspection record by construction, which is the
  // one place the correction is bound never to reach.
  assert.match(PERCEPTION_API, /const RUNS_TABLE = "tblqmHiOCQ5YSXBN3";/, "single-mode perception writes the Reader Runs row");
  assert.match(PERCEPTION_API, /const PAIRED_TABLE = "tblP1ekWWWscz6pBG";/, "paired-mode writes the paired-analysis row");
});

// ── 3. The correction reaches no governed artifact ───────────────────────────

// Every read of the corrected state, in both components. The point of the list is its
// completeness: if a later edit hands userState to an export, this count moves and the
// named set below stops matching.
test("the corrected state is read only by the live screen, never by anything that travels", () => {
  const reads = JSX.split("\n")
    .map((line, i) => [i + 1, line.trim()])
    .filter(([, line]) => /\buserState\b/.test(line) && !line.startsWith("//"));

  const kinds = {
    seed: /^const \[userState, setUserState\] = useState\(suggested\);$/,
    guard: /^if \(next === userState\) return;$/,
    emit: /^emitReaderEvent\(READER_EVENTS\.STATE_CORRECTED,/,
    copy: /^const copy = (?:loopRevealCopy\(userState, unmatched\)|CHIP_LOOP_STATE_COPY\[userState\] \|\| \{\});$/,
    render: /^\{userState === LOOP_STATE|^aria-pressed=\{s === userState\}$|is-active|^state=\{userState\}$/,
  };
  const seen = {};
  for (const [lineNo, line] of reads) {
    const kind = Object.keys(kinds).find((k) => kinds[k].test(line));
    assert.ok(kind, `unclassified read of userState at line ${lineNo}: ${line}`);
    seen[kind] = (seen[kind] || 0) + 1;
  }
  // Two of each structural read, one per surface, and the renders that draw the chips.
  // `state` reaches exactly one place: the card's telemetry prop, covered below.
  assert.deepEqual(seen, { seed: 2, guard: 2, emit: 2, copy: 2, render: 7 });
  assert.equal(reads.length, 15, "the set of places the corrected state is read is pinned; a new one must be justified here");
});

test("the Review Record cannot see a correction, because it is never handed one", () => {
  // The export takes a result, the per-check statuses, and optionally the pair. There is
  // no state prop to carry a correction, on either variant.
  const mounts = [...JSX.matchAll(/<ReviewRecordExport[^/]*\/>/g)].map((m) => m[0]);
  assert.equal(mounts.length, 2, "one Review Record export in single mode, one in paired");
  for (const mount of mounts) {
    assert.doesNotMatch(mount, /\buserState\b|\bstate=/, "no correction may be passed to the Review Record");
  }
  // And the builder's own input shape has no room for one.
  assert.match(JSX, /buildReviewRecord\(\{\s*result,\s*checkStates: statuses,\s*createdAt: [^,]+,\s*pair,\s*\}\)/);
  assert.doesNotMatch(REVIEW_RECORD, /\buserState\b|\bstate_corrected\b|\bfrom_state\b|\bto_state\b/);
});

test("the receipt is minted upstream, so a correction cannot reach one", () => {
  // Every receipt rendered on these surfaces comes from the server payload. Nothing
  // downstream of the correction is in the path.
  const mounts = [...JSX.matchAll(/<ReaderReceiptActions[^/]*\/>/g)].map((m) => m[0]);
  assert.equal(mounts.length, 3, "three receipt surfaces: single, paired, and the chip lane's");
  for (const mount of mounts) {
    assert.match(mount, /receipt=\{[\w.]*receipt\}/, `the receipt is a payload value, not a derived one: ${mount}`);
    assert.doesNotMatch(mount, /\buserState\b/);
  }
});

test("an exported card carries the person's reading, and never the machine's prior one", () => {
  // The one honest qualification in this file. The inspection card's text does follow
  // the correction, through `copy` — the card says "share what you saw", and what the
  // person saw is the state they declared. That is the person's own conclusion in the
  // person's own artifact, and it is not the calibration signal.
  //
  // The calibration signal is the PAIR: machine suggested X, person said Y. The card is
  // never given the state, only the resolved copy, so no reader of a card can recover
  // that a correction happened or what it moved from. The suggestion does not travel.
  assert.match(
    JSX,
    /const cardText = \(\) => formatInspectionCard\(\{ copy, firstText, secondText, smallPrint \}\);/,
    "the card is built from resolved copy and the two answers — never from the state",
  );
  const card = JSX.slice(JSX.indexOf("function InspectionCardAction("), JSX.indexOf("\n}", JSX.indexOf("function InspectionCardAction(")));
  assert.equal(
    countOf(card, "state"),
    countOf(card, "state,") + countOf(card, "state }"),
    "state appears in the card component only as a prop passed to telemetry",
  );
  assert.match(card, /emitReaderEvent\(READER_EVENTS\.CARD_EXPORTED, \{ run, state, check \}\)/);
});

test("no governed record surface gained a field for this", () => {
  // Nothing was added, and this asserts the shape of "nothing". The perception
  // vocabulary is untouched at five values, the endpoint still writes one field, and the
  // correction's two props are the ones the schema already carried.
  assert.deepEqual(ALL_PERCEPTION_VALUES, [
    "single_yes",
    "single_no",
    "paired_small",
    "paired_noticeable",
    "paired_large",
  ]);
  assert.equal(countOf(PERCEPTION_API, "Perception Tap"), 5, "the endpoint still names exactly one Airtable field");
  const sanitized = sanitizeEventProps({ from_state: "a", to_state: "b" });
  assert.deepEqual(sanitized, { from_state: "a", to_state: "b" }, "from_state/to_state were already in the allowlist");
});
