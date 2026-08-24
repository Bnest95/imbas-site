// file-surface-copy.js — every authored string the Input Integrity surface ships.
//
// ══ WHY A REGISTRY AND NOT COPY IN THE MARKUP ══════════════════════════════════
//
// file-templates.js holds every sentence a FINDING can produce, and that closure is
// what makes the vocab lint exhaustive rather than representative. The surface around
// those findings needs sentences too — a boundary line, a coverage state, a heading
// over a group of evidence — and none of them come from the template registry. Copy
// written straight into input-integrity.html would sit outside every lint that governs
// this lane, which is exactly the hole the closed-generation rule exists to close.
//
// So the surface gets the same treatment. Every string is here, the interpolating ones
// are functions over typed values, and renderCompleteCopySpace() enumerates the whole
// space so test/file-surface-copy.test.mjs lints ALL of it against file-vocab.js.
//
// ══ THE EPISTEMIC BOUNDARY THIS COPY HOLDS ═════════════════════════════════════
//
// The surface reports two things and no third. What the governed local PARSER recovered
// from the file's structure, and what the governed local RENDERER draws. It does not
// report what an AI system, an ingestion pipeline, or a person received, because an
// arbitrary consumer rasterizes, OCRs, normalizes, or strips operators before a model
// sees anything, and none of that chain is established here.
//
// That is why no string below says "what the AI saw" or "what the machine received".
// RENDERED_SIDE_LABEL says "Rendered page" and its note names the renderer that drew
// it. A person may draw the inference the architecture is built on. The instrument
// states only what it measured.
//
// ══ WHAT THIS FILE OWNS, AND WHAT IT ONLY CONSUMES ═════════════════════════════
//
// It owns the sentences that are true before any file arrives: the boundary, the
// scope disclosure, the intake prompts, the group headings, the labels, and the
// rendering of typed values like a page number or a byte count.
//
// It does NOT own the instrument's CONCLUSIONS — the sentences whose truth depends on
// evidence from a particular run. Those live in file-templates.js beside the finding
// templates, gated on the run record by the same eligibility rule, and this file
// re-exports them under the names the surface already calls. The functions below are
// consumption points, not definitions: change the words in file-templates.js.
//
// The zero-reportable state is the case that forced the split. "No phenomenon
// surfaced under the checks that ran" looks like page furniture and is in fact an
// evidence-bearing claim: it is false if the checks did not run, and nothing on a
// surface can gate that. See the CONCLUSION TEMPLATES section of file-templates.js.
//
// Pure JS by contract, like its siblings: no node: imports, no DOM, no Date.now.

import { renderConclusionById, CONCLUSION_TEMPLATES } from "./file-templates.js";

export const FILE_SURFACE_COPY_VERSION = "file-surface-copy.v1";

// ---------------------------------------------------------------------------
// Number and noun rendering, borrowed in spirit from file-templates.js. A sentence
// that reads "1 pages" tells the reader it was assembled rather than written.
// ---------------------------------------------------------------------------

function count(n, noun) {
  return `${n} ${noun}${n === 1 ? "" : "s"}`;
}

// ---------------------------------------------------------------------------
// Masthead and boundary.
// ---------------------------------------------------------------------------

export const MASTHEAD = Object.freeze({
  eyebrow: "Input Integrity",
  title: "What the file carries under the page",
  lede:
    "A PDF's structure can carry more than its pages render. This reads that structure in your browser " +
    "and reports what the file instructs, with the evidence beside every statement.",
});

// Item 10's boundary, led by what the surface does rather than by a list of denials.
// The denials still ship, because a person arriving at a file-inspection surface brings
// a security frame with them and the instrument has to put it down.
export const BOUNDARY = Object.freeze({
  statement: "This reads the file's own structure and reports what it instructs.",
  denials:
    "It does not scan for viruses, audit security, or make any claim about the file's safety. " +
    "It reaches no verdict on the document or its author.",
});

// The epistemic line. Rendered on the result, not buried in a footer, because it is the
// difference between what this instrument measured and what a reader may assume it did.
export const ESTABLISHES = Object.freeze({
  label: "What this run establishes",
  body:
    "This run establishes what the local parser recovered from the file's structure, and what the local " +
    "renderer draws. It does not establish what any AI system, pipeline, or person received from this file.",
});

// ---------------------------------------------------------------------------
// Intake. The PDF-only limit is stated before a person tries something else, and the
// refusal reuses that same sentence with the live value set in rather than inventing a
// parallel one.
// ---------------------------------------------------------------------------

export const INTAKE = Object.freeze({
  prompt: "Drop a PDF here, or choose one.",
  limit: "PDF only.",
  choose: "Choose a PDF",
  custody: "Your browser reads the file. The file does not leave this machine.",
  processing: "Reading the file in your browser.",
  sample_action: "Inspect a sample file",
  sample_note: "A constructed demonstration file, not a document found in the wild.",
});

// The inspection never started — a conclusion about the run, so the sentence is
// governed. Held apart from a parse failure on purpose: "the parser reported" would
// name a parser that never ran.
export function inspectionUnavailable() {
  return renderConclusionById("inspection_unavailable", { startup_failure: true });
}

export function refusal(name) {
  return `${INTAKE.limit} ${name} was not read.`;
}

// ---------------------------------------------------------------------------
// Coverage. Three states, and the partial one names both sides of the count because a
// number a reader cannot check is not a coverage claim.
// ---------------------------------------------------------------------------

export const COVERAGE = Object.freeze({
  complete_label: "Complete",
  partial_label: "Partial",
  failed_label: "Not read",
});

export function coverageComplete(pageCount) {
  return renderConclusionById("coverage_complete", { coverage: { state: "complete", page_count: pageCount } });
}

export function coveragePartial(inspected, total) {
  return renderConclusionById("coverage_partial", {
    coverage: { state: "partial", page_count: total, pages_inspected_count: inspected },
  });
}

export function coveragePageFailure(pageNumber, reason) {
  return renderConclusionById("coverage_page_failure", { page_failure: { page_number: pageNumber, reason } });
}

export function coverageFailed(reason) {
  return renderConclusionById("parse_failure", { parse_failure: { reason } });
}

// ---------------------------------------------------------------------------
// Zero-reportable. States the scope of the checks and nothing about the document.
// Both sentences are governed conclusions; this is the shape the surface reads them
// in, assembled from the registry rather than written here.
// ---------------------------------------------------------------------------

export function zeroReportable() {
  const subject = { surfaced_count: 0 };
  return Object.freeze({
    statement: renderConclusionById("zero_reportable_statement", subject),
    scope: renderConclusionById("zero_reportable_scope", subject),
  });
}

// ---------------------------------------------------------------------------
// Groups. Every boundary below is a fact the schema already carries, never a judgement
// laid over one: a rendering-consequence template is eligible, or graphics_state
// declares container_kind, or it declares control_category, or none of those hold.
// No severity, no risk, no ordering by importance.
// ---------------------------------------------------------------------------

export const GROUPS = Object.freeze({
  no_paint: {
    heading: "Text the page's instructions do not paint",
    note: "The file carries this text and the page's own operands settle that it contributes no paint.",
  },
  container: {
    heading: "Text held in a named container",
    note: "An annotation, the file's metadata, or an optional content group.",
  },
  control_codepoints: {
    heading: "Control codepoints inside a text run",
    note: "Codepoints that carry joining or ordering behavior rather than letters.",
  },
  measured: {
    heading: "Measured properties of a text run",
    note: "Values the page's content stream sets for the run: size, alpha, color, placement.",
  },
});

export const GROUP_IDS = Object.freeze(Object.keys(GROUPS));

// ---------------------------------------------------------------------------
// Result furniture.
// ---------------------------------------------------------------------------

export const RESULT = Object.freeze({
  summary_label: "What surfaced",
  back_to_summary: "Back to the summary",
  evidence_label: "Evidence",
  evidence_class: "Phenomenon class",
  evidence_checks: "Checks that ran",
  evidence_thresholds: "Thresholds applied",
  evidence_span: "Extracted text",
  evidence_state: "Measured values",
  locator_label: "Where",
  rendered_side_label: "Rendered page",
  structure_side_label: "In the file's structure",
  provenance_label: "Provenance",
  provenance_custody: "This file stayed on your machine.",
  provenance_hash: "File digest, SHA-256",
  provenance_parser: "Parser",
  provenance_predicates: "Predicate versions",
  provenance_pages: "Pages inspected",
  export_action: "Download the evidence receipt",
  export_note: "A JSON record of this inspection. The PDF itself is not included.",
});

// The rendered half can be missing for a page the renderer would not draw. A
// conclusion about this run, so the sentence is governed.
export function renderUnavailable() {
  return renderConclusionById("render_unavailable", { render_failure: true });
}

// The rendered half of the two-reading contrast names the renderer that drew it, so the
// panel is evidence of what a renderer displays rather than a claim about a person.
export function renderedSideNote(parserName, parserVersion) {
  return `Drawn here by ${parserName} ${parserVersion}.`;
}

export function provenanceStatement(parserName, parserVersion, sha256) {
  return `This result came from ${parserName} ${parserVersion} over the file with sha256 ${sha256}.`;
}

export function surfacedCount(n) {
  return renderConclusionById("surfaced_count", { surfaced_count: n });
}

export function locator(pageNumber) {
  return `Page ${pageNumber}`;
}

export function locatorPoint(x, y) {
  return `x ${x}, y ${y}`;
}

// Bytes, in the unit the number actually has. A file is measured in bytes and a reader
// is shown bytes; the kB form only appears once the byte count stops being readable, and
// it names the divisor it used so the two are the same measurement.
export function byteSize(n) {
  if (n < 10000) return count(n, "byte");
  return `${(n / 1000).toFixed(1)} kB (${n} bytes)`;
}

// ---------------------------------------------------------------------------
// THE COMPLETE COPY SPACE. Static strings plus every interpolating function rendered
// against representative values, so the lint covers the words AND the shapes the
// numerals sit in. A new string with no path into this function fails the coverage
// assertion in test/file-surface-copy.test.mjs.
// ---------------------------------------------------------------------------

const STATIC_GROUPS = Object.freeze({
  MASTHEAD,
  BOUNDARY,
  ESTABLISHES,
  INTAKE,
  COVERAGE,
  RESULT,
});

// Two value sets where a function takes a number, so singular and plural both render.
// The conclusion consumers are rendered here too. Their words belong to
// file-templates.js and are linted there as well; rendering them again through the
// path the surface actually calls is what proves the consumption point is wired to the
// registry rather than to a copy of it that drifted.
const COPY_FUNCTION_FIXTURES = Object.freeze([
  { id: "refusal", render: () => refusal("notes.docx") },
  { id: "inspectionUnavailable", render: () => inspectionUnavailable() },
  { id: "coverageComplete.singular", render: () => coverageComplete(1) },
  { id: "coverageComplete.plural", render: () => coverageComplete(12) },
  { id: "coveragePartial", render: () => coveragePartial(2, 3) },
  { id: "coveragePageFailure", render: () => coveragePageFailure(3, "stream must have data") },
  { id: "coverageFailed", render: () => coverageFailed("Invalid PDF structure.") },
  { id: "zeroReportable.statement", render: () => zeroReportable().statement },
  { id: "zeroReportable.scope", render: () => zeroReportable().scope },
  { id: "renderUnavailable", render: () => renderUnavailable() },
  { id: "renderedSideNote", render: () => renderedSideNote("pdfjs-dist", "6.2.108") },
  {
    id: "provenanceStatement",
    render: () => provenanceStatement("pdfjs-dist", "6.2.108", "0".repeat(64)),
  },
  { id: "surfacedCount.singular", render: () => surfacedCount(1) },
  { id: "surfacedCount.plural", render: () => surfacedCount(4) },
  { id: "surfacedCount.zero", render: () => surfacedCount(0) },
  { id: "locator", render: () => locator(1) },
  { id: "locatorPoint", render: () => locatorPoint(50, 100) },
  { id: "byteSize.bytes", render: () => byteSize(650) },
  { id: "byteSize.kilobytes", render: () => byteSize(248321) },
]);

export function renderCompleteCopySpace() {
  const out = [];
  for (const [groupName, group] of Object.entries(STATIC_GROUPS)) {
    for (const [key, value] of Object.entries(group)) {
      if (typeof value === "string") {
        out.push({ source: `${groupName}.${key}`, string: value });
        continue;
      }
      for (const [innerKey, innerValue] of Object.entries(value)) {
        out.push({ source: `${groupName}.${key}.${innerKey}`, string: innerValue });
      }
    }
  }
  for (const [groupId, group] of Object.entries(GROUPS)) {
    out.push({ source: `GROUPS.${groupId}.heading`, string: group.heading });
    out.push({ source: `GROUPS.${groupId}.note`, string: group.note });
  }
  for (const fixture of COPY_FUNCTION_FIXTURES) {
    out.push({ source: `fn:${fixture.id}`, string: fixture.render() });
  }
  return out;
}

// Every exported string-producing name, so the test can assert the space reached all of
// them rather than trusting that a new export was remembered here.
export const COPY_FUNCTION_NAMES = Object.freeze([
  "refusal",
  "inspectionUnavailable",
  "coverageComplete",
  "coveragePartial",
  "coveragePageFailure",
  "coverageFailed",
  "zeroReportable",
  "renderUnavailable",
  "renderedSideNote",
  "provenanceStatement",
  "surfacedCount",
  "locator",
  "locatorPoint",
  "byteSize",
]);

// The conclusion consumers above, paired with the registry id each one must resolve
// to. test/file-surface-copy.test.mjs walks this to prove every consumption point
// returns exactly what file-templates.js renders — the assertion that keeps "consumes
// rather than owns" true after the comment explaining it has gone stale.
//
// `args` is how the function is called and `subject` is what the template is handed;
// the test asserts the two produce the same string. They are stated separately on
// purpose, because the whole job of these functions is to translate a caller's
// arguments into a template subject, and a test that derived one from the other would
// be asserting the translation against itself.
export const CONCLUSION_CONSUMERS = Object.freeze([
  {
    fn: "inspectionUnavailable",
    template_id: "inspection_unavailable",
    args: [],
    subject: { startup_failure: true },
  },
  {
    fn: "coverageComplete",
    template_id: "coverage_complete",
    args: [12],
    subject: { coverage: { state: "complete", page_count: 12 } },
  },
  {
    fn: "coveragePartial",
    template_id: "coverage_partial",
    args: [2, 3],
    subject: { coverage: { state: "partial", page_count: 3, pages_inspected_count: 2 } },
  },
  {
    fn: "coveragePageFailure",
    template_id: "coverage_page_failure",
    args: [3, "stream must have data"],
    subject: { page_failure: { page_number: 3, reason: "stream must have data" } },
  },
  {
    fn: "coverageFailed",
    template_id: "parse_failure",
    args: ["Invalid PDF structure."],
    subject: { parse_failure: { reason: "Invalid PDF structure." } },
  },
  {
    fn: "zeroReportable.statement",
    template_id: "zero_reportable_statement",
    args: [],
    subject: { surfaced_count: 0 },
  },
  {
    fn: "zeroReportable.scope",
    template_id: "zero_reportable_scope",
    args: [],
    subject: { surfaced_count: 0 },
  },
  {
    fn: "renderUnavailable",
    template_id: "render_unavailable",
    args: [],
    subject: { render_failure: true },
  },
  { fn: "surfacedCount", template_id: "surfaced_count", args: [4], subject: { surfaced_count: 4 } },
]);

// Every conclusion template the surface actually reaches. A template in the registry
// that no consumption point calls is a sentence nobody can see, and the test says so.
export const CONSUMED_CONCLUSION_IDS = Object.freeze(CONCLUSION_CONSUMERS.map((c) => c.template_id));

export { CONCLUSION_TEMPLATES };

export function copySpaceCoverage() {
  const space = renderCompleteCopySpace();
  const reached = new Set(space.map((r) => r.source.replace(/^fn:/, "").split(".")[0]));
  return {
    rendered_strings: space.length,
    unreached_functions: COPY_FUNCTION_NAMES.filter((n) => !reached.has(n)),
  };
}
