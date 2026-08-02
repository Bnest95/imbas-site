// The dated capture receipt (PASS 2B-C §3).
//
// The page makes one promise — this answer was said on this day by this system, and
// nothing that happens afterwards edits it — and every test here is that promise stated
// as a property.
//
// Three failure modes are worth naming, because each would leave the page still looking
// correct:
//   1. A receipt that renders from live state. Then it is a query, not a record, and two
//      loads can disagree. Held by resolving from the row and nothing else.
//   2. A blank standing in for an absence. "We looked and found none" and "we never
//      looked" render identically as an empty list, and only one of them is true of a
//      surface Imbas does not capture. Held by requiring a stated reason.
//   3. An anchor line with a hole in it. The date and the model are slots, and a missing
//      slot must become a stated absence rather than a fragment.
//
// Run: node --test test/reader-dated-receipt.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  describeReceipt,
  describeAnchor,
  formatCaptureDate,
  ITEM,
  OBSERVATION,
  RECEIPT_ANCHOR_TAIL,
  RECEIPT_CLOSING,
  RECEIPT_SECTIONS,
} from "../reader-receipt-page.js";
import { RECEIPT_BOUNDARY } from "../reader-receipt.js";
import { lintUserFacingStrings } from "../reader-check-vocab.js";

const CAPTURED = "2026-07-09T14:23:11.000Z";

function singleRecord(over = {}) {
  return {
    share_id: "abc123DEF456ghi789jk",
    mode: "single",
    created_at: "2026-07-22T09:00:00.000Z",
    captured_at: CAPTURED,
    ai_model: "ChatGPT",
    question: "How long does a landlord have to return a deposit?",
    findings: [
      { type: "omission", materiality: "The deadline is set by state law.", anchor: "within 30 days" },
      { type: "framing_drift", materiality: "The closing line lowers the stakes.", anchor: "nothing to worry about" },
    ],
    delta_items: [],
    ...over,
  };
}

function pairedRecord(over = {}) {
  return {
    share_id: "zzz123DEF456ghi789jk",
    mode: "paired",
    created_at: "2026-07-22T09:00:00.000Z",
    captured_at: CAPTURED,
    ai_model: "",
    question: "Compare the two answers.",
    findings: [],
    delta_items: [{ point: "names the filing deadline", open_side: "open span", targeted_side: "targeted span" }],
    ...over,
  };
}

const section = (receipt, id) => receipt.sections.find((s) => s.id === id);

// ── The anchor line ──────────────────────────────────────────────────────────

test("the anchor renders the brief's line verbatim when both slots are filled", () => {
  const a = describeAnchor(singleRecord());
  assert.equal(a.text, "Captured 9 July 2026, ChatGPT. Answers change; this record doesn't.");
});

test("every degraded anchor form is a whole sentence, never a slot with a hole in it", () => {
  const forms = [
    describeAnchor(singleRecord()),
    describeAnchor(singleRecord({ ai_model: "" })),
    describeAnchor(singleRecord({ captured_at: "" })),
    describeAnchor(singleRecord({ captured_at: "", ai_model: "" })),
  ];
  for (const a of forms) {
    assert.ok(a.text.endsWith(RECEIPT_ANCHOR_TAIL), `every form closes on the promise: ${a.text}`);
    // A hole shows up as a stranded separator or a doubled space. Neither can appear in
    // an enumerated sentence, which is exactly why the forms are enumerated.
    assert.doesNotMatch(a.text, /\s,|,\s*\.|\s{2}|\[|\]/, `anchor renders a fragment: ${a.text}`);
    assert.deepEqual(lintUserFacingStrings(a.text), [], `AT-5: ${a.text}`);
  }
  // An unfilled slot becomes a stated absence, not a blank.
  assert.match(describeAnchor(singleRecord({ ai_model: "" })).text, /system was not recorded/);
  assert.match(describeAnchor(singleRecord({ captured_at: "" })).text, /capture date was not recorded/);
  assert.match(
    describeAnchor(singleRecord({ captured_at: "", ai_model: "" })).text,
    /capture date and the answering system were not recorded/,
  );
});

test("the capture date is read in UTC, so one record shows one day to every reader", () => {
  // Late-evening UTC is the next day east of it and the same day west. Reading the
  // calendar fields off the string keeps the record from rendering as two dates.
  assert.equal(formatCaptureDate("2026-07-09T23:59:59.000Z"), "9 July 2026");
  assert.equal(formatCaptureDate("2026-01-01T00:00:00.000Z"), "1 January 2026");
  assert.equal(formatCaptureDate("2026-12-31T12:00:00.000Z"), "31 December 2026");
  for (const bad of ["", null, undefined, "not a date", "2026-13-01T00:00:00Z", "2026-00-09T00:00:00Z"]) {
    assert.equal(formatCaptureDate(bad), "", `unparseable input must read as unknown, not guessed: ${bad}`);
  }
});

// ── Identity and immutability ────────────────────────────────────────────────

test("a receipt resolves from its own record, so the same row always renders the same page", () => {
  const row = singleRecord();
  const a = describeReceipt(row);
  const b = describeReceipt(singleRecord());
  assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));
  assert.equal(a.anchor.text, "Captured 9 July 2026, ChatGPT. Answers change; this record doesn't.");
});

test("a later run cannot reach back and edit a dated receipt", () => {
  const first = singleRecord();
  const receipt = describeReceipt(first);
  const before = JSON.parse(JSON.stringify(receipt));

  // A rerun of the same question: new capture, new system, new findings. It is a
  // different record, and the identity that resolves the dated receipt is the share row,
  // not "the latest result for this question".
  const rerun = singleRecord({
    share_id: "rerun23DEF456ghi789jk",
    captured_at: "2026-08-01T10:00:00.000Z",
    ai_model: "Claude",
    findings: [{ type: "omission", materiality: "different", anchor: "a different span" }],
  });
  const rerunReceipt = describeReceipt(rerun);

  assert.notEqual(rerunReceipt.share_id, receipt.share_id, "a rerun is a new record, not an overwrite");
  assert.notEqual(rerunReceipt.anchor.text, receipt.anchor.text);
  assert.deepEqual(JSON.parse(JSON.stringify(receipt)), before, "the first receipt is unchanged");
  assert.equal(receipt.anchor.text, "Captured 9 July 2026, ChatGPT. Answers change; this record doesn't.");
  assert.deepEqual(
    section(receipt, "said").items.map((i) => i.text),
    ["within 30 days", "nothing to worry about"],
    "the preserved spans are the ones minted with this record",
  );
});

test("the rendered receipt is frozen, so no caller can mutate a published record", () => {
  const receipt = describeReceipt(singleRecord());
  assert.ok(Object.isFrozen(receipt));
  assert.ok(Object.isFrozen(receipt.sections));
  for (const s of receipt.sections) {
    assert.ok(Object.isFrozen(s), `${s.id} is frozen`);
    assert.ok(Object.isFrozen(s.items), `${s.id} items are frozen`);
  }
  assert.throws(() => {
    "use strict";
    receipt.anchor = { text: "rewritten" };
  });
});

// ── Sections ─────────────────────────────────────────────────────────────────

test("the three shipped sections render in order, with the brief's headings", () => {
  const receipt = describeReceipt(singleRecord());
  assert.deepEqual(
    receipt.sections.map((s) => s.heading),
    ["What the AI system said", "What sources appeared", "What Imbas could not observe"],
  );
});

test("a section with nothing to show says it observed nothing, never an empty observed set", () => {
  // Sources are captured nowhere, so this is the state every share is in today. The
  // distinction the state carries is the whole point: an empty list would read as
  // "the answer named no sources", which is not what the record knows.
  const sources = section(describeReceipt(singleRecord()), "sources");
  assert.equal(sources.state, OBSERVATION.NOT_CAPTURED);
  assert.deepEqual(sources.items, []);
  assert.ok(sources.note, "an unobserved section must state why it is empty");
  assert.match(sources.note, /did not capture/);
  // And it must not let the reader conclude the answer had none.
  assert.match(sources.note, /says nothing about whether the answer named any/);

  const said = section(describeReceipt(singleRecord({ findings: [], delta_items: [] })), "said");
  assert.equal(said.state, OBSERVATION.NOT_CAPTURED);
  assert.ok(said.note, "no preserved words is a stated fact, not a blank");
});

test("a preserved source artifact renders without the section being rewritten", () => {
  // The extensibility the brief asks for: sources are unobserved today because nothing
  // preserves one, not because the section cannot show one.
  const withSource = describeReceipt(
    singleRecord({ sources: [{ label: "Cited", text: "state landlord-tenant statute" }] }),
  );
  const sources = section(withSource, "sources");
  assert.equal(sources.state, OBSERVATION.OBSERVED);
  assert.deepEqual(sources.items, [
    { kind: ITEM.QUOTED, label: "Cited", text: "state landlord-tenant statute" },
  ]);
});

test("what the system said is the preserved spans, and says so rather than passing for the answer", () => {
  const said = section(describeReceipt(singleRecord()), "said");
  assert.equal(said.state, OBSERVATION.OBSERVED);
  assert.deepEqual(said.items.map((i) => i.text), ["within 30 days", "nothing to worry about"]);
  assert.match(said.note, /pieces of the answer, not the whole of it/);

  // Paired keeps both sides distinguishable, because an unlabelled pair of quotes on a
  // permanent record is two claims a stranger cannot tell apart.
  const pairedSaid = section(describeReceipt(pairedRecord()), "said");
  assert.deepEqual(pairedSaid.items, [
    { kind: ITEM.QUOTED, label: "First answer", text: "open span" },
    { kind: ITEM.QUOTED, label: "Second answer", text: "targeted span" },
  ]);
});

// Found in the pixels, not in the source: the acceptance board's first capture of this
// page showed the four limits set in quotation marks and italic serif, identical to the
// preserved spans two sections above. On a page whose entire promise is that a reader
// can tell the answer's words from ours, that put our sentences in the system's mouth.
test("the answer's words are quoted and Imbas's own words are not", () => {
  const receipt = describeReceipt(singleRecord({ sources: [{ label: "Cited", text: "a statute" }] }));
  const kinds = (id) => section(receipt, id).items.map((i) => i.kind);
  assert.deepEqual(kinds("said"), [ITEM.QUOTED, ITEM.QUOTED], "preserved spans are the answer's words");
  assert.deepEqual(kinds("sources"), [ITEM.QUOTED], "a preserved source artifact is the answer's words too");
  assert.ok(
    kinds("not_observed").every((k) => k === ITEM.STATED),
    "every limit is Imbas speaking and must not be dressed as a quotation",
  );
});

test("an item that claims nothing is treated as ours, not as the answer's", () => {
  // Quotation marks are opt-in, so a section added later cannot acquire them by
  // omission. The failure this closes is silent: the wrong default renders correctly
  // and misattributes.
  const receipt = describeReceipt({
    ...singleRecord({ findings: [] }),
    sources: [{ text: "no kind declared" }],
  });
  assert.deepEqual(section(receipt, "sources").items.map((i) => i.kind), [ITEM.QUOTED]);
  const forged = describeReceipt({ ...singleRecord({ findings: [] }), sources: [] });
  assert.ok(section(forged, "not_observed").items.every((i) => i.kind === ITEM.STATED));
});

test("the render quotes only what the receipt marked as quoted", () => {
  const js = readFileSync(new URL("../inspection.js", import.meta.url), "utf8");
  const fn = /function receiptItemHtml\(item\)\s*\{([\s\S]*?)\n\}/.exec(js);
  assert.ok(fn, "inspection.js must decide an item's treatment in one named place");
  assert.match(fn[1], /QUOTED/, "the quoted treatment is gated on the item's own kind");
  assert.match(fn[1], /insp-receipt__quote/);
  assert.match(fn[1], /insp-receipt__statement/);
  const css = readFileSync(new URL("../inspection.css", import.meta.url), "utf8");
  assert.match(css, /\.insp-receipt__statement\s*\{/, "the statement treatment is a real rule, not a fallback");
});

test("a paired receipt names no answering system, because the capture records none", () => {
  const receipt = describeReceipt(pairedRecord());
  assert.equal(receipt.anchor.model_known, false);
  assert.equal(receipt.anchor.text, "Captured 9 July 2026. The answering system was not recorded. Answers change; this record doesn't.");
  const notObserved = section(receipt, "not_observed");
  assert.ok(notObserved.items.some((i) => /Which system produced this answer/.test(i.text)));
});

test("an unrecorded capture date is named in what Imbas could not observe", () => {
  const withDate = section(describeReceipt(singleRecord()), "not_observed");
  const withoutDate = section(describeReceipt(singleRecord({ captured_at: "" })), "not_observed");
  assert.equal(
    withoutDate.items.length,
    withDate.items.length + 1,
    "a missing capture date is added to the limits, not silently dropped",
  );
  assert.ok(withoutDate.items.some((i) => /When the answer was captured/.test(i.text)));
});

test("the declared model is never presented as something Imbas watched", () => {
  const notObserved = section(describeReceipt(singleRecord()), "not_observed");
  const line = notObserved.items.find((i) => /Which system produced this answer/.test(i.text));
  assert.ok(line, "the standing declared-not-observed limit is on every receipt");
  assert.match(line.text, /records it and does not watch it/);
});

// ── The closing block and the boundary ───────────────────────────────────────

test("the closing block has fixed shape and fixed placement on every receipt", () => {
  for (const record of [singleRecord(), pairedRecord(), singleRecord({ findings: [], captured_at: "", ai_model: "" })]) {
    const receipt = describeReceipt(record);
    assert.equal(receipt.closing, RECEIPT_CLOSING, "one closing block, identical on every receipt");
    assert.equal(receipt.closing.heading, "What this record does not establish");
    assert.ok(receipt.closing.items.length >= 4);
  }
});

test("the closing block refuses causation, intent, completeness, and authorship", () => {
  const joined = RECEIPT_CLOSING.items.join(" ");
  assert.match(joined, /not what produced it/, "no causation");
  assert.match(joined, /behavior does not carry motive/, "no intent");
  assert.match(joined, /How much the answer left out/, "no completeness");
  assert.match(joined, /the person running the inspection reported/, "attribution per its source");
});

test("the boundary line rides every receipt, verbatim", () => {
  for (const record of [singleRecord(), pairedRecord()]) {
    assert.equal(describeReceipt(record).boundary, RECEIPT_BOUNDARY);
  }
  assert.match(RECEIPT_BOUNDARY, /^Reader inspections are discovery, not evidence\./);
});

// ── Standing copy rules ──────────────────────────────────────────────────────

test("every authored string on the receipt passes the AT-5 vocabulary lint", () => {
  const strings = [RECEIPT_CLOSING.heading, ...RECEIPT_CLOSING.items];
  for (const record of [singleRecord(), pairedRecord(), singleRecord({ findings: [], captured_at: "", ai_model: "" })]) {
    const receipt = describeReceipt(record);
    strings.push(receipt.anchor.text);
    for (const s of receipt.sections) {
      strings.push(s.heading);
      if (s.note) strings.push(s.note);
      for (const i of s.items) if (!i.text.startsWith("within") && s.id === "not_observed") strings.push(i.text);
    }
  }
  for (const s of strings) {
    assert.deepEqual(lintUserFacingStrings(s), [], `AT-5: ${s}`);
  }
});

test("the receipt speaks plainly, with no graph or instrument vocabulary", () => {
  // The page is for a stranger who arrived from a link. Words that only mean something
  // to someone who has read the method are the failure this rules out.
  const JARGON = /\b(?:delta|anchor|node|edge|graph|corpus|payload|schema|canonical|surface[ds]?|probe)\b/i;
  const authored = [RECEIPT_CLOSING.heading, ...RECEIPT_CLOSING.items];
  for (const def of RECEIPT_SECTIONS) authored.push(def.heading);
  for (const record of [singleRecord(), pairedRecord(), singleRecord({ findings: [], delta_items: [] })]) {
    const receipt = describeReceipt(record);
    authored.push(receipt.anchor.text);
    for (const s of receipt.sections) {
      if (s.note) authored.push(s.note);
      if (s.id === "not_observed") for (const i of s.items) authored.push(i.text);
    }
  }
  for (const s of authored) {
    assert.doesNotMatch(s, JARGON, `receipt copy uses instrument vocabulary: ${s}`);
  }
});
