// file-detectors.js — the eleven Lane 1 classes, computed over a walk.
//
// ══ WHAT THIS MODULE IS ════════════════════════════════════════════════════════
//
// Arithmetic over operands, and nothing else. No parser, no DOM, no node: imports, no
// network, no model call on document text. It takes the record file-intake-pdfjs.js
// produced and returns findings built through file-result.js. It imports the schema
// precisely so it cannot route around it: every finding this module emits went through
// makeFinding, and a shape the schema refuses is a shape this module cannot return.
//
// ══ REGISTER LAW, RESTATED WHERE IT BITES ══════════════════════════════════════
//
// Report what the PDF instructs; never infer what the person experienced. Each function
// below establishes an operand, a container, or a codepoint. None establishes what
// anyone saw, and none establishes why any of it is there. A run shown with fill alpha
// zero was shown with fill alpha zero; whether it reached a reader is not a fact any of
// this can hold, and the schema has no field to hold it in.
//
// ══ INELIGIBILITY IS THE CONTROL, NOT AN ERROR PATH ════════════════════════════
//
// Lane 1's rule is that a missing field makes a template ineligible and renders
// nothing, never fallback prose. That rule reaches back to here. When a measurement
// cannot be established — an optional content group with no name, a white run with
// something already painted under it, a covering object whose alpha was modified — the
// detector emits NOTHING for that span. It does not emit a finding with a weaker field,
// a null, or a hedge. That is why several functions below read as a stack of guards
// with one construction at the bottom: the guards are the product.
//
// ══ THRESHOLDS TRAVEL WITH THE FINDING ═════════════════════════════════════════
//
// Three classes turn on a number. The schema makes thresholds_applied mandatory on
// exactly those, so the number that produced a finding is part of the finding rather
// than a setting a reader has to go looking for. DEFAULT_THRESHOLDS states the
// defaults and the reasoning; a caller may pass its own, and whatever it passes is what
// gets recorded.

import { makeFinding, makeFileIdentity } from "./file-result.js";
import { WALKER_NAME, WALKER_VERSION } from "./file-graphics-walker.js";

export const PREDICATE_SET_NAME = "imbas-file-predicates";
export const PREDICATE_SET_VERSION = "1.0.0";

export const DEFAULT_THRESHOLDS = Object.freeze({
  // A fill alpha at or below this, but above zero, is the near_zero_alpha class.
  // Exactly zero is a different class with no threshold at all, because zero needs no
  // judgement: the operand is the finding.
  fill_alpha_max: 0.1,

  // Effective size at or below this point size is the tiny_text class. Effective, not
  // nominal: a 12pt font under a 0.04 scale renders at 0.48pt, and the nominal operand
  // is the one that lies about it.
  effective_size_pt_max: 1,

  // The fraction of the run's own box that must lie under the later object. Set at a
  // majority so that clipping a corner is not reported as covering, and stated rather
  // than tuned: on the vendored corpus f07 measures 1.0 and c8a measures 0.8484, so
  // nothing about this number was chosen to make a particular fixture land. The
  // measured boxes travel inside the finding, so a consumer that wants a stricter rule
  // can recompute the fraction rather than trust this one.
  bbox_overlap_min: 0.5,
});

// ---------------------------------------------------------------------------
// Codepoint categories. Closed sets, matched against what the operator list emitted.
// ---------------------------------------------------------------------------

const ZERO_WIDTH_CODEPOINTS = new Set([
  0x00ad, // SOFT HYPHEN
  0x200b, // ZERO WIDTH SPACE
  0x200c, // ZERO WIDTH NON-JOINER
  0x200d, // ZERO WIDTH JOINER
  0x2060, // WORD JOINER
  0xfeff, // ZERO WIDTH NO-BREAK SPACE
]);

const BIDI_CONTROL_CODEPOINTS = new Set([
  0x061c, // ARABIC LETTER MARK
  0x200e, // LEFT-TO-RIGHT MARK
  0x200f, // RIGHT-TO-LEFT MARK
  0x202a, // LEFT-TO-RIGHT EMBEDDING
  0x202b, // RIGHT-TO-LEFT EMBEDDING
  0x202c, // POP DIRECTIONAL FORMATTING
  0x202d, // LEFT-TO-RIGHT OVERRIDE
  0x202e, // RIGHT-TO-LEFT OVERRIDE
  0x2066, // LEFT-TO-RIGHT ISOLATE
  0x2067, // RIGHT-TO-LEFT ISOLATE
  0x2068, // FIRST STRONG ISOLATE
  0x2069, // POP DIRECTIONAL ISOLATE
]);

const TAG_BLOCK_MIN = 0xe0000;
const TAG_BLOCK_MAX = 0xe007f;

function categoryOf(cp) {
  if (ZERO_WIDTH_CODEPOINTS.has(cp)) return "zero_width";
  if (BIDI_CONTROL_CODEPOINTS.has(cp)) return "bidi_override";
  if (cp >= TAG_BLOCK_MIN && cp <= TAG_BLOCK_MAX) return "unicode_tag_block";
  return null;
}

// The document information dictionary's text-string entries, per the PDF specification.
// CreationDate and ModDate are dates and PDFFormatVersion and the Is* flags are
// structure, so none of them is text this class can carry.
const INFO_TEXT_KEYS = ["Title", "Author", "Subject", "Keywords", "Creator", "Producer"];

// ---------------------------------------------------------------------------
// Small helpers. Every one of them is a guard, and the guards are load-bearing.
// ---------------------------------------------------------------------------

function isFiniteNumber(v) {
  return typeof v === "number" && Number.isFinite(v);
}

function codepointsOf(text) {
  return [...text].map((ch) => ch.codePointAt(0));
}

function isRect(r) {
  return Array.isArray(r) && r.length === 4 && r.every(isFiniteNumber);
}

function normalizeRect(r) {
  return [Math.min(r[0], r[2]), Math.min(r[1], r[3]), Math.max(r[0], r[2]), Math.max(r[1], r[3])];
}

function rectArea(r) {
  const [x0, y0, x1, y1] = normalizeRect(r);
  return (x1 - x0) * (y1 - y0);
}

function intersectionArea(a, b) {
  const [ax0, ay0, ax1, ay1] = normalizeRect(a);
  const [bx0, by0, bx1, by1] = normalizeRect(b);
  const w = Math.min(ax1, bx1) - Math.max(ax0, bx0);
  const h = Math.min(ay1, by1) - Math.max(ay0, by0);
  return w > 0 && h > 0 ? w * h : 0;
}

// A run is usable as evidence when it carries text, a real position, and a real size.
// A run that fails this is not a negative result, it is a span this walk did not
// measure, and nothing downstream should see it at all.
function usableRun(run) {
  return (
    typeof run.text === "string" &&
    run.text.length > 0 &&
    Number.isInteger(run.page_index) &&
    run.page_index >= 0 &&
    run.origin_device &&
    isFiniteNumber(run.origin_device.x) &&
    isFiniteNumber(run.origin_device.y) &&
    isFiniteNumber(run.effective_size_pt) &&
    run.effective_size_pt > 0
  );
}

function spanExtraction(run) {
  return {
    text: run.text,
    codepoints: codepointsOf(run.text),
    page_index: run.page_index,
    position: { x: run.origin_device.x, y: run.origin_device.y },
    effective_size_pt: run.effective_size_pt,
  };
}

// ---------------------------------------------------------------------------
// The eleven. Each takes what it needs and returns an array of findings.
// ---------------------------------------------------------------------------

// Text rendering mode 3 adds nothing to the page. The class declares equals: 3, so
// mode 7 — clip-only, which also contributes no paint — is deliberately not this
// class, and there is no v1 class it is. It is left unreported rather than reported
// under a label that would misdescribe it.
export function detectInvisibleRenderMode(run) {
  if (!usableRun(run) || run.render_mode !== 3) return [];
  return [
    makeFinding({
      class_label: "invisible_render_mode",
      extraction: spanExtraction(run),
      graphics_state: { render_mode: 3 },
      checks_run: ["text_render_mode"],
      thresholds_applied: {},
    }),
  ];
}

export function detectZeroAlpha(run) {
  if (!usableRun(run) || run.fill_alpha !== 0) return [];
  return [
    makeFinding({
      class_label: "zero_alpha",
      extraction: spanExtraction(run),
      graphics_state: { fill_alpha: 0 },
      checks_run: ["fill_alpha"],
      thresholds_applied: {},
    }),
  ];
}

export function detectNearZeroAlpha(run, thresholds) {
  const max = thresholds.fill_alpha_max;
  if (!usableRun(run)) return [];
  if (!isFiniteNumber(run.fill_alpha) || run.fill_alpha <= 0 || run.fill_alpha > max) return [];
  return [
    makeFinding({
      class_label: "near_zero_alpha",
      extraction: spanExtraction(run),
      graphics_state: { fill_alpha: run.fill_alpha },
      checks_run: ["fill_alpha"],
      thresholds_applied: { fill_alpha_max: max },
    }),
  ];
}

// `view` is CropBox ∩ MediaBox, which is a sound crop box in both branches: it equals
// the CropBox when the page declares one, and the specification defines the default
// CropBox as the MediaBox when it does not. See PAGE_BOX_LIMITATION in
// file-intake-pdfjs.js for why the MediaBox itself is not reported here under any name.
export function detectOffpageText(run, cropBox) {
  if (!usableRun(run) || !isRect(cropBox) || !isRect(run.box_device)) return [];
  // The schema's invariant demands no intersection at all. Checking it here as well is
  // not belt-and-braces: it is what makes non-intersection the detector's claim rather
  // than something the constructor happened to catch.
  if (intersectionArea(run.box_device, cropBox) > 0) return [];
  return [
    makeFinding({
      class_label: "offpage_text",
      extraction: spanExtraction(run),
      graphics_state: { text_bbox: run.box_device, crop_box: cropBox },
      checks_run: ["text_bbox_against_crop_box"],
      thresholds_applied: {},
    }),
  ];
}

// The pair of fields is the point. font_size_pt is the Tf operand and
// text_matrix_scale is what the matrices did to it; effective_size_pt in the extraction
// record is their product. A finding that carried only the product would not show where
// a sub-point render came from.
export function detectTinyText(run, thresholds) {
  const max = thresholds.effective_size_pt_max;
  if (!usableRun(run) || run.effective_size_pt > max) return [];
  if (!isFiniteNumber(run.font_size_pt) || run.font_size_pt <= 0) return [];
  const scale = run.effective_size_pt / run.font_size_pt;
  if (!isFiniteNumber(scale) || scale <= 0) return [];
  return [
    makeFinding({
      class_label: "tiny_text",
      extraction: spanExtraction(run),
      graphics_state: { font_size_pt: run.font_size_pt, text_matrix_scale: scale },
      checks_run: ["effective_text_size"],
      thresholds_applied: { effective_size_pt_max: max },
    }),
  ];
}

// "Unbacked" is the whole claim, and it is a claim about the operator list: at the
// moment this run was shown, nothing earlier in the scanned stream had painted into
// its box, so the backdrop is the page default. The enum admits only "page_default",
// so a run with something painted under it produces no finding at all — there is no
// value for "backed by something", and inventing one would be inventing a class.
export function detectWhiteFillUnbacked(run, priorPaints) {
  if (!usableRun(run) || !isRect(run.box_device)) return [];
  const fill = run.fill_color_rgb;
  if (!Array.isArray(fill) || fill.length !== 3 || !fill.every((c) => c === 1)) return [];
  for (const paint of priorPaints) {
    if (paint.op_index >= run.op_index) continue;
    if (isRect(paint.box_device) && intersectionArea(run.box_device, paint.box_device) > 0) return [];
  }
  return [
    makeFinding({
      class_label: "white_fill_unbacked",
      extraction: spanExtraction(run),
      graphics_state: { fill_color_rgb: [1, 1, 1], backdrop_source: "page_default" },
      checks_run: ["fill_color", "backdrop_source"],
      thresholds_applied: {},
    }),
  ];
}

/**
 * Covering objects, scoped exactly as the governing ruling scopes them: the opacity
 * claim holds because NO ALPHA OPERATOR MODIFIED THE COVERER WITHIN THE SCANNED CONTENT
 * STREAM. Three operands establish that and nothing wider — constant alpha at 1, no
 * soft mask in force, and a normal blend mode. What the walk cannot settle it does not
 * claim: an image's own alpha channel lives in the image data, which is why a stencil
 * mask is excluded outright rather than assumed opaque.
 *
 * A Form XObject is not a candidate either. A form paints nothing itself; its contents
 * do, and those contents are already in this same walk as paths and images. Counting
 * the form as well would report a covering that only its children performed, and would
 * report one for a form whose children paint nothing at all.
 */
function coveringCandidates(page) {
  const out = [];
  for (const p of page.paths) {
    if (!p.is_fill || p.fill_alpha !== 1 || p.soft_mask_active || p.blend_mode !== "normal") continue;
    if (!isRect(p.box_device)) continue;
    out.push({ op_index: p.op_index, box_device: p.box_device, kind: "filled_path" });
  }
  for (const im of page.images) {
    if (typeof im.op_name === "string" && im.op_name.includes("Mask")) continue;
    if (im.fill_alpha !== 1 || im.soft_mask_active || im.blend_mode !== "normal") continue;
    if (!isRect(im.box_device)) continue;
    out.push({ op_index: im.op_index, box_device: im.box_device, kind: "image" });
  }
  return out;
}

export function detectCoveredText(run, candidates, thresholds) {
  const min = thresholds.bbox_overlap_min;
  if (!usableRun(run) || !isRect(run.box_device)) return [];
  const area = rectArea(run.box_device);
  if (!(area > 0)) return [];

  // Z-order is operator order. The first later candidate that clears the threshold is
  // the one reported: a second one would be a second finding about the same span
  // saying the same thing, and z_order_delta names one object, not a set.
  let best = null;
  for (const c of candidates) {
    if (c.op_index <= run.op_index) continue;
    if (intersectionArea(run.box_device, c.box_device) / area < min) continue;
    if (best === null || c.op_index < best.op_index) best = c;
  }
  if (best === null) return [];

  return [
    makeFinding({
      class_label: "covered_text",
      extraction: spanExtraction(run),
      graphics_state: {
        text_bbox: run.box_device,
        covering_object_bbox: best.box_device,
        covering_object_kind: best.kind,
        z_order_delta: best.op_index - run.op_index,
      },
      checks_run: ["paint_order", "bbox_overlap"],
      thresholds_applied: { bbox_overlap_min: min },
    }),
  ];
}

// Annotations and metadata come off the document APIs, not the operator list, because
// the text they carry is text no content stream ever paints. An annotation holds text
// in more than one field, and each one is its own span.
const ANNOTATION_TEXT_FIELDS = ["contents", "title", "field_value"];

export function detectAnnotationText(annotation, pageIndex) {
  if (!annotation || typeof annotation.subtype !== "string" || annotation.subtype === "") return [];
  if (!isRect(annotation.rect)) return [];
  const [x, y] = normalizeRect(annotation.rect);
  const out = [];
  for (const field of ANNOTATION_TEXT_FIELDS) {
    const text = annotation[field];
    if (typeof text !== "string" || text.length === 0) continue;
    out.push(
      makeFinding({
        class_label: "annotation_text",
        extraction: { text, codepoints: codepointsOf(text), page_index: pageIndex, position: { x, y } },
        graphics_state: { container_kind: "annotation", annotation_subtype: annotation.subtype },
        checks_run: ["annotation_inventory"],
        thresholds_applied: {},
      }),
    );
  }
  return out;
}

// metadata_text carries no page and no position, because a document's metadata has
// neither. The schema declares an empty extraction requirement for exactly that reason,
// and this is the one class where a finding is a string and its key.
export function detectMetadataText(record) {
  const out = [];
  const emit = (key, text) => {
    if (typeof key !== "string" || key === "") return;
    if (typeof text !== "string" || text.length === 0) return;
    out.push(
      makeFinding({
        class_label: "metadata_text",
        extraction: { text, codepoints: codepointsOf(text) },
        graphics_state: { container_kind: "metadata", metadata_key: key },
        checks_run: ["metadata_inventory"],
        thresholds_applied: {},
      }),
    );
  };

  const info = record.info || {};
  for (const key of INFO_TEXT_KEYS) emit(`info:${key}`, info[key]);
  // pdf.js buckets info-dictionary keys it does not recognise under Custom, and a
  // non-standard key is still a text-string entry of the same dictionary.
  if (info.Custom && typeof info.Custom === "object") {
    for (const [key, value] of Object.entries(info.Custom)) emit(`info:${key}`, value);
  }
  for (const [key, value] of Object.entries(record.xmp_fields || {})) emit(`xmp:${key}`, value);
  return out;
}

// A run inside an optional content group whose configured state is off. The group's
// NAME is a required field, so a group the configuration does not name produces no
// finding: the class cannot be established without the thing it names.
export function detectHiddenOcgText(run, groupsById) {
  if (!usableRun(run) || !Array.isArray(run.marked_content)) return [];
  for (const entry of run.marked_content) {
    for (const id of entry.ocg_ids || []) {
      const group = groupsById.get(id);
      if (!group || group.visible !== false) continue;
      if (typeof group.name !== "string" || group.name === "") continue;
      return [
        makeFinding({
          class_label: "hidden_ocg_text",
          extraction: spanExtraction(run),
          graphics_state: {
            container_kind: "optional_content_group",
            ocg_name: group.name,
            ocg_default_state: "off",
          },
          checks_run: ["optional_content_group_state"],
          thresholds_applied: {},
        }),
      ];
    }
  }
  return [];
}

// One finding per category per run, not one per codepoint: the category is the claim
// and the codepoint list is the evidence for it. The schema's invariant re-checks every
// listed codepoint against the extracted span, so a category can never name a codepoint
// the run did not carry.
export function detectEncodingControlStructures(run) {
  if (!usableRun(run)) return [];
  const byCategory = new Map();
  for (const cp of codepointsOf(run.text)) {
    const category = categoryOf(cp);
    if (!category) continue;
    if (!byCategory.has(category)) byCategory.set(category, []);
    const list = byCategory.get(category);
    if (!list.includes(cp)) list.push(cp);
  }
  const out = [];
  for (const [category, codepoints] of byCategory) {
    out.push(
      makeFinding({
        class_label: "encoding_control_structures",
        extraction: { text: run.text, codepoints: codepointsOf(run.text) },
        graphics_state: { control_category: category, control_codepoints: codepoints },
        checks_run: ["codepoint_scan"],
        thresholds_applied: {},
      }),
    );
  }
  return out;
}

// ---------------------------------------------------------------------------
// The run.
// ---------------------------------------------------------------------------

/**
 * Run every detector over one readPdf record.
 *
 * @param {object} input
 * @param {object} input.record            the record readPdf produced
 * @param {object} [input.thresholds]      overrides merged onto DEFAULT_THRESHOLDS
 * @returns {{ identity: object, thresholds: object, findings: object[] }}
 */
export function detectFileFindings({ record, thresholds }) {
  const applied = { ...DEFAULT_THRESHOLDS, ...(thresholds || {}) };

  // The identity a finding set is re-derivable from: the exact bytes, the exact parser,
  // and the exact versions of the two modules that did the arithmetic. A finding without
  // this is a claim nobody can reproduce.
  const identity = makeFileIdentity({
    sha256: record.identity.sha256,
    byte_size: record.identity.byte_size,
    parser_name: record.identity.parser_name,
    parser_version: record.identity.parser_version,
    predicate_versions: {
      [WALKER_NAME]: WALKER_VERSION,
      [PREDICATE_SET_NAME]: PREDICATE_SET_VERSION,
    },
  });

  const groupsById = new Map((record.optional_content_groups || []).map((g) => [g.id, g]));
  const findings = [];

  for (const page of record.pages) {
    const candidates = coveringCandidates(page);
    // Everything the page paints, in operator order, for the backdrop question. A form
    // contributes its bbox here even though it is not a covering candidate, because
    // "something was painted into this region already" is a weaker claim than "this
    // object covers that text", and the bbox is enough to withdraw the white-fill one.
    const priorPaints = [
      ...page.paths.filter((p) => p.is_paint),
      ...page.images,
      ...page.forms.filter((f) => isRect(f.box_device)),
    ];

    for (const run of page.text_runs) {
      findings.push(
        ...detectInvisibleRenderMode(run),
        ...detectZeroAlpha(run),
        ...detectNearZeroAlpha(run, applied),
        ...detectOffpageText(run, page.view),
        ...detectTinyText(run, applied),
        ...detectWhiteFillUnbacked(run, priorPaints),
        ...detectCoveredText(run, candidates, applied),
        ...detectHiddenOcgText(run, groupsById),
        ...detectEncodingControlStructures(run),
      );
    }

    for (const annotation of page.annotations || []) {
      findings.push(...detectAnnotationText(annotation, page.page_index));
    }
  }

  findings.push(...detectMetadataText(record));

  return { identity, thresholds: applied, findings };
}
