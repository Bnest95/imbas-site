// The one shape a guided-rotation consumer reads, whatever kind of record it is.
//
// The rotation holds two kinds of record and they are not the same thing. A measured
// case is Imbas's own scored archive entry: four models were asked one question, a
// human read what came back, and the result is a category, a term list, a date and a
// score. A public example is a Reader run on a live answer: two artifacts, a delta
// between them, provenance for both, and no score at all, because nobody scored it.
//
// The guided consumer was written against the first kind. It reached for a category to
// print a provenance line, a detect list to run the term check, and a numbered case id
// to label the card. Handed the second kind it printed "CASE montana-employment ·
// UNDEFINED" or threw, so the flagship was held out of its own rotation by
// RENDER_BLOCKERS in product-example-registry.js — in the open, with the discharge
// condition attached:
//
//   "A shared presentation model both record types satisfy, or a dedicated
//    public-example rendering path. Either one discharges this entry, and the entry is
//    then deleted rather than narrowed. Adding measured-case fields to Montana does not
//    discharge it."
//
// This file is the first of those two. It is a projection, not a store: every value
// below is read off a record that already exists — the registry entry, the packet in
// reader-public-example.js, or the per-case copy the consumer owns — and nothing here
// authors a fact about an example. That is the whole guard. The cheap discharge was to
// type a category and a detect list onto Montana until the picker stopped complaining,
// which would have fabricated measurement data in the one record the product points at.
// A projection cannot do that: it has nothing to project from.
//
// What the two kinds share is a shape, not a vocabulary. `dateLabel` exists because the
// two dates are different facts — a measured case's is when four models were observed,
// the public example's is when a statute was read off its primary source — and a single
// "Verified" over both would merge them into a claim neither record carries. Each record
// says what its own date is a fact about.
//
// The measurement fields at the bottom of the field list are null on a public example,
// and that is the honest value: nobody measured it. A consumer that renders one of them
// is a measured-case consumer and must seat measured cases only. `measuredCaseIds`
// below is how it says so.
//
// Pure by contract, like reader-provenance.js and reader-public-example.js: no node:
// imports, no DOM, no Date.now, no randomness.

import { EXAMPLES, FINDING_CLASS } from "./product-example-registry.js";
import { PUBLIC_EXAMPLE } from "./reader-public-example.js";

export const GUIDED_RECORD_VERSION = "reader-guided-record.v1";

// Which kind of record this is. The consumer that can seat both reads neither branch;
// the consumer that can seat one reads this and filters.
export const GUIDED_RECORD_KIND = Object.freeze({
  MEASURED_CASE: "measured_case",
  PUBLIC_EXAMPLE: "public_example",
});

// Every field a projected record carries, in three groups. A record has exactly these
// keys and no others, which is what makes "the consumer reads the model, not the raw
// record" a property a test can hold rather than a habit.
export const GUIDED_RECORD_FIELDS = Object.freeze({
  // Identity and display. Every record supplies a real value.
  IDENTITY: Object.freeze(["id", "kind", "ready", "title", "recordName", "cardTitle", "cardLabel", "metaLabel"]),
  // The record's own content. `reveal`, `dateLabel` and `dateValue` are nullable
  // because a record may honestly have none.
  CONTENT: Object.freeze(["openPrompt", "reveal", "dateLabel", "dateValue"]),
  // What the read request carries. Empty values where the record supplies none, which
  // is what paste-your-own already sends.
  REQUEST: Object.freeze(["topic", "anchor", "whyItMatters", "detect", "keyDetect"]),
  // Measurement output. Null on a public example.
  MEASURED: Object.freeze(["category", "observedDate", "short", "observed", "gap"]),
});

export const GUIDED_RECORD_KEYS = Object.freeze([
  ...GUIDED_RECORD_FIELDS.IDENTITY,
  ...GUIDED_RECORD_FIELDS.CONTENT,
  ...GUIDED_RECORD_FIELDS.REQUEST,
  ...GUIDED_RECORD_FIELDS.MEASURED,
]);

// The eyebrow over a public example's picker card, and the record line in its evidence
// panel. It is the registry's own word for what the flagship is — FINDING_CLASS
// .READER_RUN, "the flagship is not a case. It is a Reader run, and the honest class
// for it is what it is" — set in the case the two sibling cards use.
export const PUBLIC_EXAMPLE_RECORD_LABEL = "READER RUN";

// What each kind's date is a fact about. A measured case's is the month four models
// were observed; the public example's is the day the underlying claim was read off its
// primary source. Two labels because they are two facts.
export const MEASURED_DATE_LABEL = "Verified";
export const PUBLIC_EXAMPLE_DATE_LABEL = "Source read";

// The topic a read request carries when the record names none. It travels to the API as
// `case.topic`, so it has to be a phrase and not an empty string.
export const GUIDED_TOPIC_FALLBACK = "Guided case";

function frozenList(value) {
  return Object.freeze(Array.isArray(value) ? value.slice() : []);
}

function text(value) {
  return typeof value === "string" ? value : "";
}

// A measured archive case: the registry entry for identity, the consumer's own per-case
// copy for everything the archive measured.
export function measuredCaseRecord({ id, example, copy }) {
  if (!copy) throw new Error(`readerGuided names "${id}", which has no guided-case copy`);
  return Object.freeze({
    id,
    kind: GUIDED_RECORD_KIND.MEASURED_CASE,
    ready: copy.ready === true,
    title: copy.title,
    recordName: example.shortLabel,
    cardTitle: copy.cardShort || copy.title,
    cardLabel: `CASE ${id}`,
    metaLabel: `CASE ${id} · ${text(copy.category).toUpperCase()}`,
    openPrompt: copy.openPrompt,
    reveal: copy.reveal || null,
    dateLabel: copy.observedDate ? MEASURED_DATE_LABEL : null,
    dateValue: copy.observedDate || null,
    topic: copy.topic || copy.title || GUIDED_TOPIC_FALLBACK,
    anchor: copy.mechanism || copy.anchor || "",
    whyItMatters: text(copy.whyItMatters),
    detect: frozenList(copy.detect),
    keyDetect: frozenList(copy.keyDetect),
    category: copy.category || null,
    observedDate: copy.observedDate || null,
    short: copy.short || null,
    observed: copy.observed || null,
    gap: typeof copy.gap === "number" ? copy.gap : null,
  });
}

// A public example: the registry entry for identity and disposition, the packet for the
// question, the catch and why it mattered. Nothing here is authored — `reveal` is the
// registry's own ten-second statement of the catch, which is the packet's `left_out`,
// and it is the field this slot is for: "one plain-language statement of the catch, for
// a stranger."
//
// `anchor` is empty because the packet names no single anchor term. Its missing item is
// two propositions — a one-year deadline and an internal-appeal requirement — and
// picking one of them as the anchor would state a finding the packet does not make.
// `detect` and `keyDetect` are empty for the same reason a category is null: a term
// list is measurement output and this run has none.
export function publicExampleRecord({ id, example, packet }) {
  if (example.findingClass !== FINDING_CLASS.READER_RUN) {
    throw new Error(`"${id}" is not a Reader run, so it has no public-example projection`);
  }
  return Object.freeze({
    id,
    kind: GUIDED_RECORD_KIND.PUBLIC_EXAMPLE,
    ready: true,
    title: example.title,
    recordName: example.shortLabel,
    cardTitle: example.title,
    cardLabel: PUBLIC_EXAMPLE_RECORD_LABEL,
    metaLabel: PUBLIC_EXAMPLE_RECORD_LABEL,
    openPrompt: packet.question,
    reveal: example.tenSecondCopy || null,
    dateLabel: example.verificationDate ? PUBLIC_EXAMPLE_DATE_LABEL : null,
    dateValue: example.verificationDate || null,
    topic: example.title || GUIDED_TOPIC_FALLBACK,
    anchor: "",
    whyItMatters: text(packet.why_it_mattered),
    detect: frozenList(null),
    keyDetect: frozenList(null),
    category: null,
    observedDate: null,
    short: null,
    observed: null,
    gap: null,
  });
}

// Which kind an example is, read off the registry rather than off the projection, so a
// consumer can filter the rotation before anything is projected. A registered example
// with no case id is not an archive case; that is what `caseId: null` records.
export function isMeasuredCaseExample(example) {
  return !!example && example.caseId !== null && example.caseId !== undefined;
}

// The measured cases in a list of example ids, in the order given. A consumer that
// renders a category, a term list or an observation date reads this instead of the
// whole rotation — not because a public example is lesser, but because that consumer
// would have to invent those three fields to seat one.
export function measuredCaseIds(ids, examples = EXAMPLES) {
  return ids.filter((id) => isMeasuredCaseExample(examples[id]));
}

// The rotation, projected. `ids` is the registry's own resolution — the caller passes
// renderableExamples("readerGuided") — and `caseCopy` is the per-case copy table the
// consumer owns, which stays with the consumer because it is that case's words about
// itself.
export function buildGuidedRotation({ ids, caseCopy, examples = EXAMPLES, packet = PUBLIC_EXAMPLE }) {
  return ids.map((id) => {
    const example = examples[id];
    if (!example) throw new Error(`readerGuided names "${id}", which is not a registered example`);
    return isMeasuredCaseExample(example)
      ? measuredCaseRecord({ id, example, copy: caseCopy[id] })
      : publicExampleRecord({ id, example, packet });
  });
}
