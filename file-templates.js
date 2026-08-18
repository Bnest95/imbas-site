// file-templates.js — the closed template registry for file-result.v1 (Lane 1).
//
// ══ CLOSED GENERATION ══════════════════════════════════════════════════════════
//
// Every sentence a file finding can produce is written down in this file. There is
// no generator, no model, and no fallback branch. That is what makes the lint in
// file-vocab.js exhaustive rather than representative: because the registry is
// finite and its inputs are typed, renderCompleteOutputSpace() enumerates the whole
// output space at build time and the test lints all of it.
//
// ══ TEMPLATES NEVER INTERPOLATE DOCUMENT-SUPPLIED TEXT ═════════════════════════
//
// A template renders NUMBERS and CLOSED ENUMS only. It never weaves the extracted
// span, a metadata key, an annotation subtype, or an OCG name into a sentence. Two
// reasons, and both are load-bearing. First, a file's text is written by whoever
// wrote the file; interpolating it would hand an unbounded string space to a lint
// that claims to be exhaustive, and the claim would be untrue the moment it shipped.
// Second, the extracted span is EVIDENCE. It belongs beside the sentence, quoted and
// attributable, not inside it. file-templates.test.mjs proves the property with a
// sentinel span that must not appear in any rendered string.
//
// ══ FIELD DEPENDENCY IS THE ONLY ELIGIBILITY RULE ══════════════════════════════
//
// Each template declares `requires`: dot paths into a finding. A template whose
// declared fields are not all present is INELIGIBLE, and an ineligible template
// renders nothing. It does not degrade to a vaguer sentence, and there is no prose
// that stands in for a measurement nobody made. Absence in the schema is expressed
// by omitting a field (see file-result.js), so the schema's absence discipline and
// the registry's eligibility rule are the same mechanism seen from two ends.
//
// `requires_values` gates on a closed enum value rather than presence. It exists for
// one case: encoding_control_structures carries three categories that state three
// different structural facts, so it holds three templates rather than one template
// that shrugs.
//
// ══ NO TEMPLATE ASSERTS A RELATION ITS SOURCE FIELDS DO NOT ESTABLISH ══════════
//
// Three families, and the boundary between them is the whole point.
//
//   structural              — restates the typed fields the detector measured.
//   extraction_consequence  — gated on the parser having emitted the span. If the
//                             span is in the extraction record, then a system that
//                             extracts text from this file receives it. That holds
//                             for metadata and annotations exactly as it holds for
//                             page content, because extraction is what produced the
//                             record in the first place.
//   rendering_consequence   — attaches ONLY where a structural field establishes
//                             what the page's instructions paint.
//
// RENDERING_CONSEQUENCE_CLASSES has two members: text render mode 3, and fill alpha
// 0. In both, the operand settles the paint contribution inside the content stream.
// Four classes were considered and refused, and the reasoning is recorded so it is
// not reopened from the same premise:
//
//   offpage_text     — a crop box is a viewing hint a consumer may honour or ignore.
//                      The geometry is established. The paint is not.
//   hidden_ocg_text  — a default configuration is a default. Any viewer, and any
//                      later configuration dictionary, can set the group on.
//   tiny_text, near_zero_alpha, white_fill_unbacked — these are appearance questions,
//                      and appearance is where "what the file instructs" turns into
//                      "what somebody saw". Register law forbids the crossing. The
//                      structural template states the measured value and stops.
//
// metadata, annotation, and encoding-control classes take no rendering consequence
// at all: none of them is a page-painting instruction.
//
// Pure JS by contract: no node: imports, no DOM. Fixed input produces identical
// output.

import { PHENOMENON_CLASSES, PHENOMENON_CLASS_IDS, makeFinding } from "./file-result.js";

export const FILE_TEMPLATE_REGISTRY_VERSION = "file-templates.v1";

export const TEMPLATE_FAMILIES = Object.freeze(["structural", "extraction_consequence", "rendering_consequence"]);

export const RENDERING_CONSEQUENCE_CLASSES = Object.freeze(["invisible_render_mode", "zero_alpha"]);

// Classes that can never take a rendering consequence, named rather than inferred so
// the prohibition is readable at the point a future class is added.
export const NO_RENDERING_CONSEQUENCE_CLASSES = Object.freeze([
  "metadata_text",
  "annotation_text",
  "encoding_control_structures",
]);

// ---------------------------------------------------------------------------
// Value rendering. Closed, and deliberately dull.
// ---------------------------------------------------------------------------

// Article included, because the set is closed and "a image" is what happens when a
// sentence is assembled from a bare noun.
const COVERING_OBJECT_DISPLAY = Object.freeze({
  filled_path: "a filled path",
  image: "an image",
  form_xobject: "a form XObject",
});

// Trailing zeros drop, so 0.4 renders "0.4" and 12 renders "12". No rounding: the
// number in the sentence is the number in the record.
function num(v) {
  return String(v);
}

// "1 point", "2 points". A sentence that reads "1 points" tells the reader the
// sentence was assembled rather than written, and the whole register depends on it
// not reading that way.
function count(n, noun) {
  return `${num(n)} ${noun}${n === 1 ? "" : "s"}`;
}

function rect(r) {
  return r.map(num).join(", ");
}

export function getPath(obj, path) {
  let node = obj;
  for (const key of path.split(".")) {
    if (!node || typeof node !== "object" || !Object.prototype.hasOwnProperty.call(node, key)) return undefined;
    node = node[key];
  }
  return node;
}

function hasPath(obj, path) {
  return getPath(obj, path) !== undefined;
}

// ---------------------------------------------------------------------------
// The registry.
// ---------------------------------------------------------------------------

const EXTRACTION_CONSEQUENCE_SENTENCE = "A system that reads this file by extracting its text receives this text.";
const NO_PAINT_SENTENCE = "The page's rendering instructions do not paint it.";

export const FILE_TEMPLATES = Object.freeze(
  [
    // ── structural ──────────────────────────────────────────────────────────
    {
      id: "invisible_render_mode.structural",
      family: "structural",
      classes: ["invisible_render_mode"],
      requires: ["graphics_state.render_mode"],
      render: (f) => `The page's content stream sets text render mode ${num(f.graphics_state.render_mode)} for this run.`,
    },
    {
      id: "zero_alpha.structural",
      family: "structural",
      classes: ["zero_alpha"],
      requires: ["graphics_state.fill_alpha"],
      render: (f) => `The page's content stream sets the fill alpha for this run to ${num(f.graphics_state.fill_alpha)}.`,
    },
    {
      id: "near_zero_alpha.structural",
      family: "structural",
      classes: ["near_zero_alpha"],
      requires: ["graphics_state.fill_alpha", "thresholds_applied.fill_alpha_max"],
      render: (f) =>
        `The page's content stream sets the fill alpha for this run to ${num(f.graphics_state.fill_alpha)}. ` +
        `The check applied a threshold of ${num(f.thresholds_applied.fill_alpha_max)}.`,
    },
    {
      id: "offpage_text.structural",
      family: "structural",
      classes: ["offpage_text"],
      requires: ["graphics_state.text_bbox", "graphics_state.crop_box"],
      render: (f) =>
        `The page's content stream places this run at [${rect(f.graphics_state.text_bbox)}]. ` +
        `The page's crop box is [${rect(f.graphics_state.crop_box)}], and the two regions do not intersect.`,
    },
    {
      id: "tiny_text.structural",
      family: "structural",
      classes: ["tiny_text"],
      requires: ["extraction.effective_size_pt", "thresholds_applied.effective_size_pt_max"],
      render: (f) =>
        `The page's content stream sets this run at an effective size of ${count(f.extraction.effective_size_pt, "point")}. ` +
        `The check applied a threshold of ${count(f.thresholds_applied.effective_size_pt_max, "point")}.`,
    },
    {
      id: "white_fill_unbacked.structural",
      family: "structural",
      classes: ["white_fill_unbacked"],
      requires: ["graphics_state.fill_color_rgb", "graphics_state.backdrop_source"],
      render: (f) =>
        `The page's content stream sets the fill color for this run to white (${f.graphics_state.fill_color_rgb.map(num).join(", ")}). ` +
        `Across the region the run occupies, the backdrop is the page default.`,
    },
    {
      id: "covered_text.structural",
      family: "structural",
      classes: ["covered_text"],
      requires: ["graphics_state.covering_object_kind", "graphics_state.z_order_delta"],
      render: (f) =>
        `The page's content stream paints ${COVERING_OBJECT_DISPLAY[f.graphics_state.covering_object_kind]} ` +
        `over the region this run occupies, ${count(f.graphics_state.z_order_delta, "operation")} after the run.`,
    },
    {
      id: "annotation_text.structural",
      family: "structural",
      classes: ["annotation_text"],
      requires: ["graphics_state.container_kind", "extraction.page_index"],
      render: (f) => `The file carries this text in an annotation attached to page ${num(f.extraction.page_index + 1)}.`,
    },
    {
      id: "metadata_text.structural",
      family: "structural",
      classes: ["metadata_text"],
      requires: ["graphics_state.container_kind"],
      render: () => "The file carries this text in its metadata.",
    },
    {
      id: "hidden_ocg_text.structural",
      family: "structural",
      classes: ["hidden_ocg_text"],
      requires: ["graphics_state.container_kind", "graphics_state.ocg_default_state"],
      render: () => "The file carries this text in an optional content group whose default state is off.",
    },
    {
      id: "encoding_control_structures.zero_width.structural",
      family: "structural",
      classes: ["encoding_control_structures"],
      requires: ["graphics_state.control_codepoints"],
      requires_values: { "graphics_state.control_category": "zero_width" },
      render: (f) => `This run carries ${count(f.graphics_state.control_codepoints.length, "zero-width codepoint")}.`,
    },
    {
      id: "encoding_control_structures.bidi_override.structural",
      family: "structural",
      classes: ["encoding_control_structures"],
      requires: ["graphics_state.control_codepoints"],
      requires_values: { "graphics_state.control_category": "bidi_override" },
      render: (f) =>
        `This run carries ${count(f.graphics_state.control_codepoints.length, "bidirectional override codepoint")}.`,
    },
    {
      id: "encoding_control_structures.unicode_tag_block.structural",
      family: "structural",
      classes: ["encoding_control_structures"],
      requires: ["graphics_state.control_codepoints"],
      requires_values: { "graphics_state.control_category": "unicode_tag_block" },
      render: (f) =>
        `This run carries ${count(f.graphics_state.control_codepoints.length, "codepoint")} from the Unicode tag block.`,
    },

    // ── extraction consequence ──────────────────────────────────────────────
    // One template, every class. Its dependency is the extraction span itself, so
    // the gate is exactly the condition the sentence names.
    {
      id: "extraction_consequence",
      family: "extraction_consequence",
      classes: [...PHENOMENON_CLASS_IDS],
      requires: ["extraction.text"],
      render: () => EXTRACTION_CONSEQUENCE_SENTENCE,
    },

    // ── rendering consequence ───────────────────────────────────────────────
    {
      id: "invisible_render_mode.rendering_consequence",
      family: "rendering_consequence",
      classes: ["invisible_render_mode"],
      requires: ["graphics_state.render_mode"],
      render: () => NO_PAINT_SENTENCE,
    },
    {
      id: "zero_alpha.rendering_consequence",
      family: "rendering_consequence",
      classes: ["zero_alpha"],
      requires: ["graphics_state.fill_alpha"],
      render: () => NO_PAINT_SENTENCE,
    },
  ].map((t) => Object.freeze({ ...t, classes: Object.freeze(t.classes), requires: Object.freeze(t.requires) })),
);

export function templatesForClass(classLabel) {
  return FILE_TEMPLATES.filter((t) => t.classes.includes(classLabel));
}

// Render one template against one finding. Returns the string, or null when the
// template is ineligible. Never returns a fallback.
export function renderTemplate(template, finding) {
  if (!finding || typeof finding !== "object") return null;
  if (!template.classes.includes(finding.class_label)) return null;
  for (const path of template.requires) {
    if (!hasPath(finding, path)) return null;
  }
  if (template.requires_values) {
    for (const [path, expected] of Object.entries(template.requires_values)) {
      if (getPath(finding, path) !== expected) return null;
    }
  }
  return template.render(finding);
}

// Every eligible line for one finding, in registry order.
export function renderFinding(finding) {
  const out = [];
  for (const template of FILE_TEMPLATES) {
    const line = renderTemplate(template, finding);
    if (line !== null) out.push({ template_id: template.id, family: template.family, string: line });
  }
  return out;
}

// ---------------------------------------------------------------------------
// LINT FIXTURES — the closed input set that makes the output space enumerable.
//
// These live in the module rather than in the test because the exhaustive-lint
// claim is a property of the registry, not of one test run. A new template with no
// fixture that reaches it fails the coverage assertion in file-templates.test.mjs.
//
// Numeric fixtures carry two value sets where a template interpolates a number, so
// the rendered space covers the numeral positions as well as the words.
// ---------------------------------------------------------------------------

// Built from codepoints, never typed as literals. A zero-width or bidi character
// pasted into source is invisible to the next reader and survives an editor round
// trip only by luck; a fixture that silently loses its control character would make
// the encoding templates render against nothing while still looking green.
const CP = {
  zero_width_space: 0x200b,
  zero_width_non_joiner: 0x200c,
  right_to_left_override: 0x202e,
  left_to_right_override: 0x202d,
  tag_latin_capital_a: 0xe0041,
};
const ch = (name) => String.fromCodePoint(CP[name]);

const SPAN = "REPRESENTATIVE SPAN";
const ZERO_WIDTH_SPAN = `a${ch("zero_width_space")}b${ch("zero_width_non_joiner")}c`;
const BIDI_SPAN = `a${ch("right_to_left_override")}b${ch("left_to_right_override")}c`;
const TAG_SPAN = `a${ch("tag_latin_capital_a")}b`;

function cp(text) {
  return [...text].map((ch) => ch.codePointAt(0));
}

function span(text, extra) {
  return { text, codepoints: cp(text), ...extra };
}

const ON_PAGE = { page_index: 0, position: { x: 72, y: 700 }, effective_size_pt: 12 };

export const TEMPLATE_LINT_FIXTURES = Object.freeze([
  {
    id: "invisible_render_mode",
    finding: makeFinding({
      class_label: "invisible_render_mode",
      extraction: span(SPAN, ON_PAGE),
      graphics_state: { render_mode: 3 },
      checks_run: ["text_render_mode"],
      thresholds_applied: {},
    }),
  },
  {
    id: "zero_alpha",
    finding: makeFinding({
      class_label: "zero_alpha",
      extraction: span(SPAN, ON_PAGE),
      graphics_state: { fill_alpha: 0 },
      checks_run: ["fill_alpha"],
      thresholds_applied: {},
    }),
  },
  {
    id: "near_zero_alpha.fine",
    finding: makeFinding({
      class_label: "near_zero_alpha",
      extraction: span(SPAN, ON_PAGE),
      graphics_state: { fill_alpha: 0.004 },
      checks_run: ["fill_alpha"],
      thresholds_applied: { fill_alpha_max: 0.05 },
    }),
  },
  {
    id: "near_zero_alpha.coarse",
    finding: makeFinding({
      class_label: "near_zero_alpha",
      extraction: span(SPAN, ON_PAGE),
      graphics_state: { fill_alpha: 0.05 },
      checks_run: ["fill_alpha"],
      thresholds_applied: { fill_alpha_max: 0.05 },
    }),
  },
  {
    id: "offpage_text",
    finding: makeFinding({
      class_label: "offpage_text",
      extraction: span(SPAN, { page_index: 0, position: { x: -400, y: 700 }, effective_size_pt: 12 }),
      graphics_state: { text_bbox: [-400, 690, -260, 706], crop_box: [0, 0, 612, 792] },
      checks_run: ["text_bbox_against_crop_box"],
      thresholds_applied: {},
    }),
  },
  {
    id: "tiny_text.sub_point",
    finding: makeFinding({
      class_label: "tiny_text",
      extraction: span(SPAN, { page_index: 0, position: { x: 72, y: 700 }, effective_size_pt: 0.4 }),
      graphics_state: { font_size_pt: 4, text_matrix_scale: 0.1 },
      checks_run: ["effective_text_size"],
      thresholds_applied: { effective_size_pt_max: 1 },
    }),
  },
  {
    id: "tiny_text.at_threshold",
    finding: makeFinding({
      class_label: "tiny_text",
      extraction: span(SPAN, { page_index: 0, position: { x: 72, y: 700 }, effective_size_pt: 1 }),
      graphics_state: { font_size_pt: 1, text_matrix_scale: 1 },
      checks_run: ["effective_text_size"],
      thresholds_applied: { effective_size_pt_max: 1 },
    }),
  },
  {
    id: "white_fill_unbacked",
    finding: makeFinding({
      class_label: "white_fill_unbacked",
      extraction: span(SPAN, ON_PAGE),
      graphics_state: { fill_color_rgb: [1, 1, 1], backdrop_source: "page_default" },
      checks_run: ["fill_color", "backdrop_source"],
      thresholds_applied: {},
    }),
  },
  {
    id: "covered_text.filled_path",
    finding: makeFinding({
      class_label: "covered_text",
      extraction: span(SPAN, { page_index: 0, position: { x: 50, y: 100 }, effective_size_pt: 12 }),
      graphics_state: {
        text_bbox: [50, 96, 175, 114],
        covering_object_bbox: [45, 96, 175, 114],
        covering_object_kind: "filled_path",
        z_order_delta: 2,
      },
      checks_run: ["paint_order", "bbox_overlap"],
      thresholds_applied: { bbox_overlap_min: 0.9 },
    }),
  },
  {
    id: "covered_text.image",
    finding: makeFinding({
      class_label: "covered_text",
      extraction: span(SPAN, { page_index: 0, position: { x: 50, y: 100 }, effective_size_pt: 12 }),
      graphics_state: {
        text_bbox: [50, 96, 175, 114],
        covering_object_bbox: [0, 0, 612, 792],
        covering_object_kind: "image",
        z_order_delta: 11,
      },
      checks_run: ["paint_order", "bbox_overlap"],
      thresholds_applied: { bbox_overlap_min: 0.9 },
    }),
  },
  {
    id: "covered_text.form_xobject",
    finding: makeFinding({
      class_label: "covered_text",
      extraction: span(SPAN, { page_index: 0, position: { x: 50, y: 100 }, effective_size_pt: 12 }),
      graphics_state: {
        text_bbox: [50, 96, 175, 114],
        covering_object_bbox: [40, 90, 200, 120],
        covering_object_kind: "form_xobject",
        z_order_delta: 1,
      },
      checks_run: ["paint_order", "bbox_overlap"],
      thresholds_applied: { bbox_overlap_min: 0.9 },
    }),
  },
  {
    id: "annotation_text",
    finding: makeFinding({
      class_label: "annotation_text",
      extraction: span(SPAN, { page_index: 0, position: { x: 100, y: 400 } }),
      graphics_state: { container_kind: "annotation", annotation_subtype: "FreeText" },
      checks_run: ["annotation_inventory"],
      thresholds_applied: {},
    }),
  },
  {
    id: "metadata_text",
    finding: makeFinding({
      class_label: "metadata_text",
      extraction: span(SPAN),
      graphics_state: { container_kind: "metadata", metadata_key: "Keywords" },
      checks_run: ["metadata_inventory"],
      thresholds_applied: {},
    }),
  },
  {
    id: "hidden_ocg_text",
    finding: makeFinding({
      class_label: "hidden_ocg_text",
      extraction: span(SPAN, ON_PAGE),
      graphics_state: { container_kind: "optional_content_group", ocg_name: "Layer 2", ocg_default_state: "off" },
      checks_run: ["optional_content_group_state"],
      thresholds_applied: {},
    }),
  },
  {
    id: "encoding_control_structures.zero_width",
    finding: makeFinding({
      class_label: "encoding_control_structures",
      extraction: span(ZERO_WIDTH_SPAN),
      graphics_state: { control_category: "zero_width", control_codepoints: [0x200b, 0x200c] },
      checks_run: ["codepoint_scan"],
      thresholds_applied: {},
    }),
  },
  {
    id: "encoding_control_structures.bidi_override",
    finding: makeFinding({
      class_label: "encoding_control_structures",
      extraction: span(BIDI_SPAN),
      graphics_state: { control_category: "bidi_override", control_codepoints: [0x202e, 0x202d] },
      checks_run: ["codepoint_scan"],
      thresholds_applied: {},
    }),
  },
  {
    id: "encoding_control_structures.unicode_tag_block",
    finding: makeFinding({
      class_label: "encoding_control_structures",
      extraction: span(TAG_SPAN),
      graphics_state: { control_category: "unicode_tag_block", control_codepoints: [0xe0041] },
      checks_run: ["codepoint_scan"],
      thresholds_applied: {},
    }),
  },
]);

// The whole output space, enumerated. Every template crossed with every fixture it
// is eligible for. This is what file-vocab-lint.test.mjs lints, and its length is
// the receipt that the lint was exhaustive rather than sampled.
export function renderCompleteOutputSpace() {
  const out = [];
  for (const fixture of TEMPLATE_LINT_FIXTURES) {
    for (const line of renderFinding(fixture.finding)) {
      out.push({ fixture_id: fixture.id, class_label: fixture.finding.class_label, ...line });
    }
  }
  return out;
}

// Guard for the fixture set: every class in the schema has at least one fixture, and
// every template in the registry is reached by at least one of them. Exported so the
// test asserts it rather than restating the enumeration.
export function outputSpaceCoverage() {
  const space = renderCompleteOutputSpace();
  const reachedTemplates = new Set(space.map((r) => r.template_id));
  const coveredClasses = new Set(TEMPLATE_LINT_FIXTURES.map((f) => f.finding.class_label));
  return {
    rendered_strings: space.length,
    unreached_templates: FILE_TEMPLATES.filter((t) => !reachedTemplates.has(t.id)).map((t) => t.id),
    uncovered_classes: Object.keys(PHENOMENON_CLASSES).filter((c) => !coveredClasses.has(c)),
  };
}
