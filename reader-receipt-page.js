// The dated capture receipt: one permanent page per capture.
//
// The promise the page makes is narrow and total — the answer it preserves was said on
// a named day by a named system, and nothing that happens afterwards edits it. So the
// receipt renders from its own record and never joins to live state to display what it
// attests to. A value that depends on a second read succeeding is a live query wearing
// a receipt's clothes, and its failure mode is worse than a blank: flickering to "not
// recorded" would assert nothing was captured about something that was. The capture
// time and the declared model are therefore copied onto the share row at mint, and this
// module reads that one row.
//
// Three sections ship. They are a deliberate subset of the five-part series anatomy —
// "What changed" and "What was happening outside the systems" are series-level claims
// that need more than one capture to make, so they belong to the series work and are
// not stubbed here. RECEIPT_SECTIONS is the extension point: appending an entry adds a
// section, and nothing in describeReceipt or the render knows how many there are.
//
// A section that has nothing to show says it observed nothing. It never renders as an
// empty list of observations, because those are different facts: "we looked and there
// was none" and "we never looked" read identically as a blank, and only one of them is
// true of a surface Imbas does not capture at all.
//
// Pure by contract, like reader-receipt.js and reader-provenance.js: no node: imports,
// no DOM, no Date.now, no randomness, no locale. Every string is authored copy and is
// covered by the AT-5 vocabulary lint.

import { RECEIPT_BOUNDARY } from "./reader-receipt.js";

export const RECEIPT_PAGE_VERSION = "receipt-page.v1";

// What the record holds about one surface. A third state is deliberately absent: there
// is no "observed, and there was none", because no surface this page renders can
// distinguish an empty capture from an absent one.
export const OBSERVATION = Object.freeze({
  OBSERVED: "OBSERVED",
  NOT_CAPTURED: "NOT_CAPTURED",
});

// Whether a line is the answer's words or ours. The receipt sets preserved spans in
// quotation marks, and without this the limits in "What Imbas could not observe" get
// the same treatment — Imbas's own sentences rendered as though the system had said
// them, on the one page whose entire promise is that a reader can tell the difference.
export const ITEM = Object.freeze({
  QUOTED: "QUOTED",
  STATED: "STATED",
});

const str = (v) => (typeof v === "string" ? v.trim() : "");
const list = (v) => (Array.isArray(v) ? v : []);

// ── The anchor line ──────────────────────────────────────────────────────────
//
// "Captured 9 July 2026, ChatGPT. Answers change; this record doesn't."
//
// Every form ends in the same sentence, because that sentence is the page's whole
// claim and it holds whether or not the two slots are filled. The degraded forms are
// enumerated rather than assembled, so the line can never render as a fragment with a
// gap in it — an unfilled slot becomes a stated absence, never a blank.
export const RECEIPT_ANCHOR_TAIL = "Answers change; this record doesn't.";

const MONTHS = Object.freeze([
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]);

// The calendar date is read straight off the ISO string in UTC. No Date object, so the
// receipt shows the same day to every reader — a permanent record that renders as the
// 9th in one timezone and the 10th in another is not one record.
export function formatCaptureDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(str(iso));
  if (!m) return "";
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return "";
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

export function describeAnchor(record) {
  const r = record && typeof record === "object" ? record : {};
  const date = formatCaptureDate(r.captured_at);
  const model = str(r.ai_model);
  let lead;
  if (date && model) lead = `Captured ${date}, ${model}.`;
  else if (date) lead = `Captured ${date}. The answering system was not recorded.`;
  else if (model) lead = `Captured from ${model}. The capture date was not recorded.`;
  else lead = "The capture date and the answering system were not recorded.";
  return Object.freeze({
    lead,
    tail: RECEIPT_ANCHOR_TAIL,
    text: `${lead} ${RECEIPT_ANCHOR_TAIL}`,
    date_known: date !== "",
    model_known: model !== "",
  });
}

// ── The sections ─────────────────────────────────────────────────────────────
//
// Each entry reads the record and returns { state, items, note }. `items` is a list of
// { kind, label, text } — label names which side a quoted span came from and is omitted
// when there is only one side to name; kind says whose words these are.

// What the record preserved of the answer itself: the quoted spans the findings point
// at, and never the whole answer. That is not a shortcoming to apologise for, it is the
// design — the mint path reads no raw answer at all — but it does mean the section has
// to say what it is showing, or a reader will take the spans for the answer.
function readWhatWasSaid(record) {
  const spans = [];
  for (const f of list(record.findings)) {
    const t = str(f && f.anchor);
    if (t) spans.push({ kind: ITEM.QUOTED, label: "", text: t });
  }
  for (const d of list(record.delta_items)) {
    const open = str(d && d.open_side);
    const targeted = str(d && d.targeted_side);
    if (open) spans.push({ kind: ITEM.QUOTED, label: "First answer", text: open });
    if (targeted) spans.push({ kind: ITEM.QUOTED, label: "Second answer", text: targeted });
  }
  if (!spans.length) {
    return {
      state: OBSERVATION.NOT_CAPTURED,
      items: [],
      note: "This record preserved no quoted words from the answer.",
    };
  }
  return {
    state: OBSERVATION.OBSERVED,
    items: spans,
    note: "These are the passages this record preserved word for word. They are pieces of the answer, not the whole of it.",
  };
}

// Which sources appeared in the answer. Nothing on the record carries one today, so
// this lands on NOT_CAPTURED for every share that exists. It reads a field anyway:
// the day a source artifact is preserved, the section shows it without being rewritten,
// which is the difference between a section that is empty and a section that is a stub.
function readSources(record) {
  const sources = [];
  for (const s of list(record.sources)) {
    const text = str(typeof s === "string" ? s : s && s.text);
    if (text) sources.push({ kind: ITEM.QUOTED, label: str(s && s.label), text });
  }
  if (!sources.length) {
    return {
      state: OBSERVATION.NOT_CAPTURED,
      items: [],
      note: "Imbas did not capture the sources behind this answer. That is a limit of what was recorded here, and says nothing about whether the answer named any.",
    };
  }
  return {
    state: OBSERVATION.OBSERVED,
    items: sources,
    note: "Sources this record preserved from the answer.",
  };
}

// The limits, stated as limits. Every line here is something a reader might otherwise
// assume the page covered. The first is the standing one: a person typed the model
// name, and a name someone typed is a report, not an observation.
//
// These are Imbas speaking, not the answer, and they are marked as such — a limit set
// in quotation marks beside a preserved span reads as something the system said about
// itself.
function readNotObserved(record) {
  const items = [
    {
      kind: ITEM.STATED,
      label: "",
      text: "Which system produced this answer. The name on this record is the one the person running the inspection gave; Imbas records it and does not watch it.",
    },
    {
      kind: ITEM.STATED,
      label: "",
      text: "What the same question returns now. This record fixes one answer on one day and does not follow it.",
    },
    {
      kind: ITEM.STATED,
      label: "",
      text: "What was asked before or after. Imbas saw the question on this page and no other part of the conversation.",
    },
    {
      kind: ITEM.STATED,
      label: "",
      text: "What the system was working from. No sources, settings, or retrieved documents were captured.",
    },
  ];
  if (!formatCaptureDate(record.captured_at)) {
    items.push({
      kind: ITEM.STATED,
      label: "",
      text: "When the answer was captured. This record carries no capture date, so the day it was said is not established here.",
    });
  }
  return { state: OBSERVATION.OBSERVED, items, note: "" };
}

export const RECEIPT_SECTIONS = Object.freeze([
  Object.freeze({ id: "said", heading: "What the AI system said", read: readWhatWasSaid }),
  Object.freeze({ id: "sources", heading: "What sources appeared", read: readSources }),
  Object.freeze({ id: "not_observed", heading: "What Imbas could not observe", read: readNotObserved }),
]);

// ── The closing block ────────────────────────────────────────────────────────
//
// Fixed shape, fixed placement, on every receipt. It closes the record — everything
// after it on the page is furniture, not record — because the reader has by then seen
// everything the record holds, and this is the list of readings that material does not
// support.
export const RECEIPT_CLOSING = Object.freeze({
  heading: "What this record does not establish",
  items: Object.freeze([
    "Why the system answered this way. The record holds what was said, not what produced it.",
    "What anyone intended. Imbas measures behavior, and behavior does not carry motive.",
    "How much the answer left out. Nothing here counts what a fuller answer would have held.",
    "Who wrote the answer. The system named here is the one the person running the inspection reported.",
  ]),
});

// ── The whole receipt ────────────────────────────────────────────────────────
//
// One record in, one render descriptor out. The caller escapes and lays out; it never
// decides what a section says, and it never has to know how many sections there are.
export function describeReceipt(record) {
  const r = record && typeof record === "object" ? record : {};
  const sections = RECEIPT_SECTIONS.map((def) => {
    const read = def.read(r) || {};
    return Object.freeze({
      id: def.id,
      heading: def.heading,
      state: read.state === OBSERVATION.OBSERVED ? OBSERVATION.OBSERVED : OBSERVATION.NOT_CAPTURED,
      items: Object.freeze(
        list(read.items).map((i) =>
          Object.freeze({
            // Quotation marks are opt-in. An item that does not say it is quoted is
            // rendered as our own sentence, so a section added later cannot acquire
            // quotation marks by forgetting to say anything.
            kind: i && i.kind === ITEM.QUOTED ? ITEM.QUOTED : ITEM.STATED,
            label: str(i && i.label),
            text: str(i && i.text),
          }),
        ),
      ),
      note: str(read.note),
    });
  });
  return Object.freeze({
    version: RECEIPT_PAGE_VERSION,
    share_id: str(r.share_id),
    anchor: describeAnchor(r),
    sections: Object.freeze(sections),
    closing: RECEIPT_CLOSING,
    boundary: RECEIPT_BOUNDARY,
  });
}
