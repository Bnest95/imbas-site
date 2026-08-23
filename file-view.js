// file-view.js — the render model for the Input Integrity surface (Lane 3).
//
// ══ WHY THE VIEW MODEL IS A PURE MODULE ════════════════════════════════════════
//
// Everything a person reads on the surface is decided here, and nothing here touches a
// DOM. That split is what lets node:test drive the whole product decision space —
// grouping, locators, coverage, the zero state, the export receipt — without a browser,
// and leaves input-integrity.js as markup assembly with no judgement in it.
//
// ══ WHY NOT makeFileResult ═════════════════════════════════════════════════════
//
// file-result.js exports makeFileResult, and this module does not call it. That is a
// property of the parser, not an oversight. makeFileResult requires a page inventory,
// makePage requires BOTH media_box and crop_box, and PAGE_BOX_LIMITATION in
// file-intake-pdfjs.js records that pdf.js at 6.2.108 exposes only `view` — CropBox ∩
// MediaBox — and never the MediaBox itself. Passing `view` as media_box would put a
// claim in the record that the parser never made. So the surface consumes what the
// detectors actually return, `{ identity, thresholds, findings }`, and the page
// inventory the schema wants stays unbuilt until a parser can fill it honestly.
//
// A partial inspection makes the same point a second way: makeFileResult requires the
// inventory to run 0..n-1 with no gaps, and a file where page 3 failed to walk has a
// gap. The schema is right to refuse it. The surface still has nine real pages to show.
//
// ══ GROUPING USES SCHEMA FACTS ONLY ════════════════════════════════════════════
//
// Four groups, and each boundary is a question the schema already answers:
//
//   no_paint            — a rendering_consequence template is eligible for this finding.
//                         The ONLY group where the substrate establishes both halves of
//                         a rendered-versus-structural contrast, which is why it is the
//                         only group whose heading makes a paint statement.
//   container           — the class declares graphics_state.container_kind.
//   control_codepoints  — the class declares graphics_state.control_category.
//   measured            — none of the above: typed graphics-state values and nothing
//                         about what the page paints, because file-templates.js refuses
//                         a rendering consequence for exactly these classes.
//
// No severity, no risk, no ordering by importance, no count of classes standing in for
// one. Groups render in GROUP_IDS order and findings keep detector order inside them.
//
// Pure JS by contract: no node: imports, no DOM, no Date.now, no random.

import { PHENOMENON_CLASSES } from "./file-result.js";
import { renderFinding } from "./file-templates.js";
import * as COPY from "./file-surface-copy.js";

export const FILE_VIEW_VERSION = "file-view.v1";
export const RECEIPT_SCHEMA_VERSION = "file-receipt.v1";

function declaresField(classLabel, field) {
  const spec = PHENOMENON_CLASSES[classLabel];
  return !!spec && Object.prototype.hasOwnProperty.call(spec.graphics_state, field);
}

function has(obj, key) {
  return !!obj && Object.prototype.hasOwnProperty.call(obj, key);
}

// ---------------------------------------------------------------------------
// Grouping.
// ---------------------------------------------------------------------------

export function groupOf(finding) {
  const eligible = renderFinding(finding);
  if (eligible.some((line) => line.family === "rendering_consequence")) return "no_paint";
  if (declaresField(finding.class_label, "container_kind")) return "container";
  if (declaresField(finding.class_label, "control_category")) return "control_codepoints";
  return "measured";
}

// ---------------------------------------------------------------------------
// Locators. Every member is present only when the substrate established it. Nothing
// here defaults, rounds, or fills a gap: a finding with no page index simply has no
// page in its locator, and the surface renders one fewer row.
// ---------------------------------------------------------------------------

export function locatorOf(finding) {
  const out = {};
  const ex = finding.extraction || {};
  const gs = finding.graphics_state || {};

  if (has(ex, "page_index")) {
    out.page_index = ex.page_index;
    out.page_number = ex.page_index + 1;
  }
  if (has(ex, "position")) out.position = { x: ex.position.x, y: ex.position.y };
  if (has(ex, "effective_size_pt")) out.effective_size_pt = ex.effective_size_pt;
  if (has(gs, "text_bbox")) out.text_bbox = [...gs.text_bbox];
  if (has(gs, "crop_box")) out.crop_box = [...gs.crop_box];
  if (has(gs, "covering_object_bbox")) out.covering_object_bbox = [...gs.covering_object_bbox];

  // The container names itself. Which field of the container carried the text is part
  // of what the finding reports, so it travels as the locator rather than as prose.
  if (has(gs, "container_kind")) out.container_kind = gs.container_kind;
  if (has(gs, "annotation_subtype")) out.annotation_subtype = gs.annotation_subtype;
  if (has(gs, "metadata_key")) out.metadata_key = gs.metadata_key;
  if (has(gs, "ocg_name")) out.ocg_name = gs.ocg_name;

  return out;
}

// A stable anchor. Deterministic for a given file, parser and predicate set, because the
// detector order it indexes is deterministic for those three.
export function anchorOf(finding, index) {
  return `item-${index + 1}-${finding.class_label}`;
}

// ---------------------------------------------------------------------------
// The two-reading contrast.
//
// A pair needs the SAME referent on both sides. The rendered side draws one page, so a
// finding with no page index has no rendered side to stand beside its evidence — and a
// page with no in-page location gives the two sides nothing to agree about. Both
// conditions are checked rather than assumed, and a finding that fails either renders
// its evidence alone instead of a fabricated pair.
// ---------------------------------------------------------------------------

export function contrastOf(finding) {
  const loc = locatorOf(finding);
  if (!has(loc, "page_index")) return null;
  if (!has(loc, "position") && !has(loc, "text_bbox")) return null;
  const out = { page_index: loc.page_index, page_number: loc.page_number };
  if (has(loc, "position")) out.position = loc.position;
  if (has(loc, "text_bbox")) out.text_bbox = loc.text_bbox;
  return out;
}

// ---------------------------------------------------------------------------
// Coverage. Derived from the parse record, never from the finding count: a file with no
// findings and a file whose pages all failed are different states, and only the record
// can tell them apart.
// ---------------------------------------------------------------------------

export function deriveCoverage(record) {
  const pageCount = record.page_count;
  const inspected = record.pages.map((p) => p.page_index);
  const failed = (record.page_failures || []).map((f) => ({
    page_index: f.page_index,
    page_number: f.page_index + 1,
    reason: f.reason,
  }));
  const state = failed.length === 0 && inspected.length === pageCount ? "complete" : "partial";
  return {
    state,
    page_count: pageCount,
    pages_inspected: inspected,
    pages_inspected_numbers: inspected.map((i) => i + 1),
    pages_failed: failed,
  };
}

export function coverageSentences(coverage) {
  if (coverage.state === "complete") {
    return { label: COPY.COVERAGE.complete_label, statement: COPY.coverageComplete(coverage.page_count), pages: [] };
  }
  return {
    label: COPY.COVERAGE.partial_label,
    statement: COPY.coveragePartial(coverage.pages_inspected.length, coverage.page_count),
    pages: coverage.pages_failed.map((f) => COPY.coveragePageFailure(f.page_number, f.reason)),
  };
}

// A document that would not open. Kept apart from a zero-finding result at the type
// level, so nothing downstream can render one as the other.
export function failedView(fileName, reason) {
  return {
    state: "failed",
    file_name: fileName,
    label: COPY.COVERAGE.failed_label,
    statement: COPY.coverageFailed(reason),
    boundary: COPY.BOUNDARY,
    establishes: COPY.ESTABLISHES,
  };
}

// The reader itself did not start. A third state, not a variant of the second: a parse
// failure is something the parser established about the file, and this is the absence of
// a parser. Nothing here names a file, because no file was read.
export function unavailableView() {
  return {
    state: "unavailable",
    label: COPY.COVERAGE.failed_label,
    statement: COPY.inspectionUnavailable(),
    boundary: COPY.BOUNDARY,
    establishes: COPY.ESTABLISHES,
  };
}

// ---------------------------------------------------------------------------
// The whole view.
// ---------------------------------------------------------------------------

export function buildView({ fileName, byteSize, detection, record }) {
  const coverage = deriveCoverage(record);
  const items = detection.findings.map((finding, index) => ({
    anchor: anchorOf(finding, index),
    class_label: finding.class_label,
    group: groupOf(finding),
    statements: renderFinding(finding).map((line) => ({ family: line.family, string: line.string })),
    locator: locatorOf(finding),
    contrast: contrastOf(finding),
    extraction: finding.extraction,
    graphics_state: finding.graphics_state,
    checks_run: finding.checks_run,
    thresholds_applied: finding.thresholds_applied,
  }));

  const groups = COPY.GROUP_IDS.map((id) => ({
    id,
    heading: COPY.GROUPS[id].heading,
    note: COPY.GROUPS[id].note,
    items: items.filter((item) => item.group === id),
  })).filter((group) => group.items.length > 0);

  return {
    state: "read",
    file_name: fileName,
    byte_size: byteSize,
    identity: detection.identity,
    thresholds: detection.thresholds,
    coverage,
    coverage_copy: coverageSentences(coverage),
    items,
    groups,
    surfaced_count: items.length,
    surfaced_count_copy: COPY.surfacedCount(items.length),
    zero_reportable: items.length === 0 ? COPY.zeroReportable() : null,
    provenance_statement: COPY.provenanceStatement(
      detection.identity.parser_name,
      detection.identity.parser_version,
      detection.identity.sha256,
    ),
    boundary: COPY.BOUNDARY,
    establishes: COPY.ESTABLISHES,
  };
}

// ---------------------------------------------------------------------------
// The durable receipt.
//
// Governed evidence and provenance the substrate actually holds, and nothing else. The
// source PDF is not in it and cannot be: nothing in this function has the bytes. The
// extracted spans ARE in it, because a span is the evidence a statement rests on and a
// receipt without it is a claim nobody can re-derive.
//
// `generatedAt` is a parameter because this module has no clock, and a receipt that
// invented one would be a provenance field the caller could not verify.
// ---------------------------------------------------------------------------

export function buildReceipt({ view, generatedAt }) {
  const limitations = [COPY.ESTABLISHES.body, COPY.BOUNDARY.statement, COPY.BOUNDARY.denials];
  if (view.zero_reportable) limitations.push(view.zero_reportable.scope);

  return {
    receipt_schema_version: RECEIPT_SCHEMA_VERSION,
    generated_at: generatedAt,
    file: {
      name: view.file_name,
      byte_size: view.byte_size,
      sha256: view.identity.sha256,
      parser_name: view.identity.parser_name,
      parser_version: view.identity.parser_version,
      predicate_versions: { ...view.identity.predicate_versions },
    },
    coverage: {
      state: view.coverage.state,
      page_count: view.coverage.page_count,
      pages_inspected: [...view.coverage.pages_inspected_numbers],
      pages_failed: view.coverage.pages_failed.map((f) => ({ page: f.page_number, reason: f.reason })),
    },
    thresholds_available: { ...view.thresholds },
    surfaced: view.items.map((item) => ({
      anchor: item.anchor,
      phenomenon_class: item.class_label,
      group: item.group,
      statements: item.statements.map((s) => s.string),
      locator: item.locator,
      extracted_text: item.extraction.text,
      extracted_codepoints: [...item.extraction.codepoints],
      measured_values: { ...item.graphics_state },
      checks_run: [...item.checks_run],
      thresholds_applied: { ...item.thresholds_applied },
    })),
    limitations,
  };
}
