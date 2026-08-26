// reader-chip-entry-provenance — the three doors into steering, and the record of which
// one was used.
//
// Steering can begin from three places, and until this pass the receipt could not tell
// them apart. Someone reading a chip receipt six months from now needs to know whether the
// person arrived at the follow-up because an inspection had just named something, because
// they wanted the draft improved, or because they came to /reader.html?start=chips with a
// draft and no inspection at all. Those are three different situations and they produce
// three different kinds of evidence.
//
// The field is open_run.entered_via. It lives inside open_run because that is the block the
// paired envelope embeds verbatim; a top-level sibling would be dropped at that hop.
//
// The thing this file most exists to hold: entered_via and continues answer DIFFERENT
// questions and must never be derived from each other.
//   entered_via — where the person came from. Always present.
//   continues   — which inspection receipt this run continues. Null when it continues none.
// A degraded inspection returns no receipt, so a reactive entry can legitimately continue
// nothing; and the direct standing door always continues nothing. Collapsing the two would
// make the second case unreportable and the first a lie.
//
// Constants and pure builders only — no network, no model call, no capture.
//
// Run: node --test test/reader-chip-entry-provenance.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";

import { CHIP_ENTRY_VIA, CHIP_ENTRY_VIA_VALUES, normalizeChipEntryVia, CHIP_UI } from "../reader-paired.js";
import { SECOND_QUESTION_BANK, SECOND_QUESTION_BANK_VERSION } from "../reader-second-question-bank.js";
import { buildChipPairedReceipt, canonicalizeForHash } from "../reader-receipt.js";
import { validateOpenReceipt, verifyReceiptIntegrity } from "../api/read-paired.js";
import { assembleReviewRecord, serializeCanonical } from "../reader-review-record.js";

const JSX = fs.readFileSync(new URL("../workbench-app.jsx", import.meta.url), "utf8");
const API = fs.readFileSync(new URL("../api/read-paired.js", import.meta.url), "utf8");

const sha256Hex = (s) => createHash("sha256").update(s, "utf8").digest("hex");
const countOf = (hay, needle) => hay.split(needle).length - 1;

// A client-minted chip open receipt, shaped exactly as buildChipOpenReceipt in
// workbench-app.jsx shapes one, so what is asserted here is what the endpoint receives.
function openReceipt({ answer = "the first answer", enteredVia, parent = null } = {}) {
  const r = {
    receipt_type: "single",
    schema_version: "reader-receipt-1.2",
    generated_at: "2026-08-24T00:00:00.000Z",
    open_run: {
      question: "",
      answer,
      provenance: { request_id: sha256Hex(answer).slice(0, 16) },
      entered_via: normalizeChipEntryVia(enteredVia),
      continues: parent,
    },
    integrity: { algorithm: "sha256", canonicalization_version: "1.0", content_hash: null },
  };
  r.integrity.content_hash = sha256Hex(canonicalizeForHash(r));
  return r;
}

const PARENT = {
  receipt_schema_version: "reader-receipt-1.2",
  content_hash: sha256Hex("parent"),
  request_id: "abc0123456789def",
  generated_at: "2026-08-23T00:00:00.000Z",
};

// ── The enum ────────────────────────────────────────────────────────────────

test("there are exactly three entry origins, and they are distinct", () => {
  assert.deepEqual(CHIP_ENTRY_VIA_VALUES, ["inspection_reactive", "inspection_proactive", "direct_standing"]);
  assert.equal(new Set(CHIP_ENTRY_VIA_VALUES).size, 3, "three origins that cannot collapse into fewer");
  assert.ok(Object.isFrozen(CHIP_ENTRY_VIA_VALUES), "the value set is frozen, so no fourth arrives by mutation");
  // Named, so no caller has to spell a wire literal.
  assert.equal(CHIP_ENTRY_VIA.INSPECTION_REACTIVE, "inspection_reactive");
  assert.equal(CHIP_ENTRY_VIA.INSPECTION_PROACTIVE, "inspection_proactive");
  assert.equal(CHIP_ENTRY_VIA.DIRECT_STANDING, "direct_standing");
});

test("each origin normalizes to itself", () => {
  for (const v of CHIP_ENTRY_VIA_VALUES) assert.equal(normalizeChipEntryVia(v), v);
});

// The fallback claims the LEAST: a run whose origin is unreadable is reported as the door
// that asserts no inspection happened. Falling back to either inspection origin would put
// an inspection on the record that nothing witnessed.
test("an unrecognized origin falls to the door that claims the least", () => {
  for (const junk of [null, undefined, "", "inspection", "reactive", 7, {}, [], "INSPECTION_REACTIVE"]) {
    assert.equal(normalizeChipEntryVia(junk), CHIP_ENTRY_VIA.DIRECT_STANDING);
  }
});

// ── The origins cannot collapse ─────────────────────────────────────────────

test("three origins produce three distinguishable receipts", () => {
  const seen = new Map();
  for (const via of CHIP_ENTRY_VIA_VALUES) {
    const r = openReceipt({ enteredVia: via });
    assert.equal(r.open_run.entered_via, via);
    seen.set(via, r.integrity.content_hash);
  }
  assert.equal(new Set(seen.values()).size, 3, "the same first answer under three doors hashes three ways");
});

test("the origin is inside open_run, which is the block that travels", () => {
  const r = openReceipt({ enteredVia: CHIP_ENTRY_VIA.INSPECTION_REACTIVE });
  assert.ok("entered_via" in r.open_run, "inside open_run");
  assert.ok(!("entered_via" in r), "and not a top-level sibling, which the paired envelope would drop");
});

// ── entered_via and continues are independent ───────────────────────────────

test("every combination of origin and continuation is representable", () => {
  const cases = [
    [CHIP_ENTRY_VIA.INSPECTION_REACTIVE, PARENT],
    [CHIP_ENTRY_VIA.INSPECTION_PROACTIVE, PARENT],
    [CHIP_ENTRY_VIA.DIRECT_STANDING, null],
    // A degraded inspection returns no receipt to continue. The person still came through
    // an inspection door and the record still says so.
    [CHIP_ENTRY_VIA.INSPECTION_REACTIVE, null],
    [CHIP_ENTRY_VIA.INSPECTION_PROACTIVE, null],
  ];
  const hashes = new Set();
  for (const [via, parent] of cases) {
    const r = openReceipt({ enteredVia: via, parent });
    assert.equal(r.open_run.entered_via, via);
    assert.equal(r.open_run.continues, parent);
    hashes.add(r.integrity.content_hash);
  }
  assert.equal(hashes.size, cases.length, "no two of the five collapse onto one artifact");
});

test("the origin does not move when the continuation does, and the reverse", () => {
  const a = openReceipt({ enteredVia: CHIP_ENTRY_VIA.INSPECTION_REACTIVE, parent: PARENT });
  const b = openReceipt({ enteredVia: CHIP_ENTRY_VIA.INSPECTION_REACTIVE, parent: null });
  assert.equal(a.open_run.entered_via, b.open_run.entered_via, "same door, different continuation");
  assert.notEqual(a.open_run.continues, b.open_run.continues);

  const c = openReceipt({ enteredVia: CHIP_ENTRY_VIA.INSPECTION_PROACTIVE, parent: PARENT });
  assert.deepEqual(a.open_run.continues, c.open_run.continues, "same continuation, different door");
  assert.notEqual(a.open_run.entered_via, c.open_run.entered_via);
});

// Source-level, because the guarantee is that no code path ever computes one from the
// other. A future edit that wrote `entered_via: parentHash ? ... : ...` would satisfy every
// assertion above and still destroy the distinction.
test("neither field is derived from the other, in either module", () => {
  const mint = JSX.slice(
    JSX.indexOf("async function buildChipOpenReceipt("),
    JSX.indexOf("async function buildChipOpenReceipt(") + 1600,
  );
  assert.match(mint, /entered_via: normalizeChipEntryVia\(enteredVia\),/, "the origin comes from the door alone");
  assert.ok(
    !/entered_via:[^\n]*parent/.test(mint),
    "the origin must not be computed from the parent receipt",
  );
  assert.ok(
    !/continues:[^\n]*enteredVia/.test(mint),
    "the continuation must not be computed from the door",
  );
});

// ── Survival into the paired receipt ────────────────────────────────────────

test("the origin survives the embed into the chip paired receipt", () => {
  for (const via of CHIP_ENTRY_VIA_VALUES) {
    const openRun = openReceipt({ enteredVia: via, parent: via === "direct_standing" ? null : PARENT }).open_run;
    const receipt = buildChipPairedReceipt({
      generatedAt: "2026-08-24T00:00:00.000Z",
      openRun,
      chipAnalysis: { chip_id: "sq.sources", instruction_version: "v1", open_run_id: openRun.provenance.request_id },
      declarations: [],
    });
    assert.equal(receipt.open_run.entered_via, via, `${via} reaches the exported artifact`);
    assert.equal(receipt.open_run.continues, openRun.continues, "and continues rides beside it, unchanged");
  }
});

test("the origin reaches the exported JSON, not just the object", () => {
  const openRun = openReceipt({ enteredVia: CHIP_ENTRY_VIA.INSPECTION_PROACTIVE, parent: PARENT }).open_run;
  const receipt = buildChipPairedReceipt({
    generatedAt: "2026-08-24T00:00:00.000Z",
    openRun,
    chipAnalysis: { chip_id: "sq.sources", instruction_version: "v1" },
    declarations: [],
  });
  const json = JSON.parse(JSON.stringify(receipt));
  assert.equal(json.open_run.entered_via, "inspection_proactive");
  // And it is inside the hashed content, so it cannot be edited in transit unnoticed.
  assert.match(canonicalizeForHash(receipt), /"entered_via":"inspection_proactive"/);
});

// The server takes open_run off the receipt and hands it to the builder whole. If that ever
// became a field-by-field rebuild, every additive field would be silently dropped here.
test("the server embeds the open run whole rather than rebuilding it", () => {
  assert.match(API, /const openRun = openReceipt\.open_run;/);
  assert.match(API, /receipt = buildChipPairedReceipt\(\{ generatedAt, openRun, chipAnalysis, declarations: [^\n]*\}\);/);
});

// ── The gate the field has to pass ──────────────────────────────────────────

test("a receipt carrying the origin passes validation and verifies", () => {
  for (const via of CHIP_ENTRY_VIA_VALUES) {
    const r = openReceipt({ enteredVia: via });
    assert.deepEqual(validateOpenReceipt(r), { ok: true }, `${via} is accepted`);
    assert.ok(verifyReceiptIntegrity(r), `${via} verifies against its own content hash`);
  }
});

// The blank-first-state rule is older than this pass and the new field must not have
// bought a way around it. An origin is not a first state.
test("an origin does not substitute for a first answer", () => {
  for (const via of CHIP_ENTRY_VIA_VALUES) {
    const r = openReceipt({ answer: "   ", enteredVia: via });
    assert.deepEqual(validateOpenReceipt(r), { ok: false, reason: "content_empty" });
  }
});

test("altering the origin in transit breaks the integrity hash", () => {
  const r = openReceipt({ enteredVia: CHIP_ENTRY_VIA.DIRECT_STANDING });
  assert.ok(verifyReceiptIntegrity(r));
  r.open_run.entered_via = CHIP_ENTRY_VIA.INSPECTION_REACTIVE;
  assert.ok(!verifyReceiptIntegrity(r), "an origin rewritten after minting does not verify");
});

// ── Where the origin must NOT go ────────────────────────────────────────────

// The Review Record reads named fields off open_run and never copies it wholesale. The
// schema question of whether a review record should carry the steering lineage is recorded
// and open; what is pinned here is that this pass did not answer it by accident.
test("the origin does not enter the Review Record", () => {
  const record = assembleReviewRecord({
    result: { receipt: openReceipt({ enteredVia: CHIP_ENTRY_VIA.INSPECTION_PROACTIVE }) },
    createdAt: "2026-08-24T00:00:00.000Z",
  });
  const serialized = serializeCanonical(record);
  assert.ok(!serialized.includes("entered_via"), "no entry provenance in the review record");
  for (const via of CHIP_ENTRY_VIA_VALUES) {
    assert.ok(!serialized.includes(via), `no ${via} in the review record`);
  }
});

// Entry provenance lives in the receipt path only. The capture row's fields object is an
// explicit literal, and this asserts it stays one.
test("the origin is never written to a capture row", () => {
  const fields = API.slice(API.indexOf('"Open Run ID": record.openRunId'), API.indexOf("export function createReadPairedHandler"));
  assert.ok(!fields.includes("entered_via"), "no capture field carries the entry origin");
  assert.ok(!fields.includes("Entered Via"), "and no column was invented for it");
  assert.ok(!API.includes("Entry Via") && !API.includes("Entered Via"), "no such column name anywhere in the endpoint");
});

// ── Where the origin comes from in the client ───────────────────────────────

test("each door names its own origin, and one door does not name two", () => {
  // Every door in the tree, with the origin it declares. Three doors, three origins, one
  // each: no door can open the lane without saying which door it is, and no two doors can
  // report the same origin.
  const declared = [...JSX.matchAll(/chipDoorButton\(\s*(CHIP_ENTRY_VIA\.[A-Z_]+)/g)].map((m) => m[1]);
  assert.deepEqual(declared.slice().sort(), [
    "CHIP_ENTRY_VIA.DIRECT_STANDING",
    "CHIP_ENTRY_VIA.INSPECTION_PROACTIVE",
    "CHIP_ENTRY_VIA.INSPECTION_REACTIVE",
  ]);
  assert.match(JSX, /chipDoorButton\(CHIP_ENTRY_VIA\.INSPECTION_REACTIVE, CHIP_UI\.entry\.reactive\)/);
  assert.match(JSX, /chipDoorButton\(CHIP_ENTRY_VIA\.INSPECTION_PROACTIVE, CHIP_UI\.entry\.proactive\)/);
  // One control component, so there is no second door built by another route that could
  // reach openChipLane without an origin.
  assert.equal(countOf(JSX, "openChipLane("), 1, "the lane opens through one call site");
  assert.match(JSX, /const openChipLane = \(via\) => \{/, "and that call site takes the door");
});

// The arrival is state, not intention: ?start=chips seats direct_standing at mount, so a
// person who lands there and never presses anything still produces a truthful origin.
test("a direct arrival seats the standing origin before any press", () => {
  assert.match(
    JSX,
    /const \[chipEntry, setChipEntry\] = useState\(\(\) =>\s*\n\s*parseArrival\(window\.location\)\.lane === LANE_CHIPS \? CHIP_ENTRY_VIA\.DIRECT_STANDING : null\s*\n\s*\);/,
  );
  assert.match(JSX, /setChipEntry\(normalizeChipEntryVia\(via\)\);/, "and a press records the door pressed");
});

test("the origin the lane runs under is the origin the workbench recorded", () => {
  assert.match(JSX, /enteredVia=\{chipEntry\}/, "one source, threaded to the lane");
  assert.equal(countOf(JSX, "enteredVia={"), 1, "and no second, differently derived, origin prop");
});

// ── The origin as a product-event dimension ─────────────────────────────────
// Added 2026-08-25 by founder ruling. The doors exist to answer which intents people reach
// for under which framing, and a chip id with no door attached cannot answer it. So the
// origin rides on the two chip events as a dimension. It is the same enum the receipt
// carries, read through the same normalizer, and it is still not a chip fact: the bank is
// one flat set and the door never touches the row of choices.

test("the two chip events carry the origin, and nothing derives a second one", () => {
  assert.match(
    JSX,
    /emitReaderEvent\(READER_EVENTS\.CHIP_ROW_RENDERED, \{ entered_via: normalizeChipEntryVia\(enteredVia\) \}\);/,
    "the row event names the door",
  );
  assert.match(
    JSX,
    /emitReaderEvent\(READER_EVENTS\.CHIP_SELECTED, \{\s*\n\s*chip: e\.id,\s*\n\s*instruction_version: e\.instruction_version,\s*\n\s*entered_via: normalizeChipEntryVia\(enteredVia\),\s*\n\s*\}\);/,
    "and so does the selection event, beside the chip it selected",
  );
  // One emit apiece. A second emitter for either event would double every count derived
  // from it, and the two would drift the moment one of them was edited.
  assert.equal(countOf(JSX, "READER_EVENTS.CHIP_ROW_RENDERED"), 1);
  assert.equal(countOf(JSX, "READER_EVENTS.CHIP_SELECTED"), 1);
});

// The limitation, held in the source it qualifies. chip_row_rendered fires when the lane
// mounts, which means the offer was PUT IN THE DOCUMENT — not that it entered the viewport,
// not that anyone looked at it. The founder ruling of 2026-08-25 accepted the weaker
// measurement and refused the machinery that would strengthen it. This test is what stops a
// later pass from quietly adding that machinery and leaving the counts named the same.
test("the row event is a stated render proxy, and observes no one", () => {
  const lane = JSX.slice(JSX.indexOf("function ChipLane({"), JSX.indexOf("function ChipLane({") + 30000);
  const effect = lane.slice(lane.indexOf("chip_row_rendered fires"), lane.indexOf("READER_EVENTS.CHIP_ROW_RENDERED"));
  // Comment wrapping is not the subject here, so flatten it and read the prose.
  const prose = effect.replace(/^\s*\/\/ ?/gm, "").replace(/\s+/g, " ");
  assert.match(prose, /RENDER PROXY/, "the effect says what it is measuring");
  assert.match(prose, /not evidence the row entered the viewport/, "and names what it does not measure");
  assert.match(prose, /never "the offer was seen"/, "and says how to read every count derived from it");
  for (const api of ["IntersectionObserver", "requestIdleCallback", "visibilitychange", "document.hasFocus"]) {
    assert.ok(!lane.includes(api), `the lane must not reach for ${api} to strengthen the metric`);
  }
});

// ── Standing guards this pass must not have moved ───────────────────────────

// §8 of the brief: presentation and entry framing only. The bank itself is untouched.
test("the chip bank is unchanged in count and version", () => {
  assert.equal(SECOND_QUESTION_BANK.length, 6);
  assert.equal(SECOND_QUESTION_BANK_VERSION, "second-question-bank.v1");
  // No door-gating: no entry has a family, category, or door field.
  for (const e of SECOND_QUESTION_BANK) {
    for (const k of ["family", "category", "door", "entered_via", "entry"]) {
      assert.ok(!(k in e), `${e.id} must not carry a ${k} field`);
    }
  }
});

// The boundary sentence is what keeps a proactive door from reading as an Imbas finding.
// Two framings now open the same bank, and this sentence is the reason that is honest.
test("the comparison boundary sentence is preserved verbatim", () => {
  assert.equal(CHIP_UI.boundary, "User-directed follow-up. No Imbas inspection finding asserted.");
});
