// file-result.js — the canonical file-intake result (Input Integrity, Lane 1).
//
// ══ WHAT THIS IS, AND WHAT IT DELIBERATELY IS NOT ══════════════════════════════
//
// A SIBLING of reader-result.js, not an extension of it. reader-result.v1 records
// what a model's answer did. file-result.v1 records what a file's own structure
// instructs. They share no vocabulary: FINDING_CLASSES (omission / framing_drift /
// deflection) belongs to the answer instrument and is untouched by this module,
// and PHENOMENON_CLASSES below never enters a Reader result.
//
// This module is the foundation only. There is no parser here, no detector, and no
// interface. It defines the shape a detector must fill and refuses to construct a
// shape that would let a later lane over-claim.
//
// ══ REGISTER LAW ═══════════════════════════════════════════════════════════════
//
// Report what the PDF instructs. Never infer what the person experienced. Every
// class below names a structural property of the file — an operator, an operand, a
// container, a codepoint. None names an appearance, an intention, or an effect on a
// reader. A file that sets text render mode 3 has set text render mode 3; whether
// anybody failed to read something is not a fact this schema can hold.
//
// ══ NO ABSENCE OBJECTS ═════════════════════════════════════════════════════════
//
// Nothing in a file result asserts that something is not there. A measurement the
// detector did not make is OMITTED, not recorded as null, "none", or { absent: true }.
// That is load-bearing rather than stylistic: omission is what makes a template
// ineligible in file-templates.js, so an absent field renders nothing instead of
// rendering a sentence built on a hole. assertNoAbsenceShapes enforces it over the
// whole constructed object.
//
// An empty ARRAY and an empty OBJECT are not absence objects. `findings: []` is a
// collection whose cardinality is zero, and `thresholds_applied: {}` records that a
// class was established structurally with no numeric threshold applied. Neither
// makes a claim about the document. `{ absent: true }` does, which is why it cannot
// be built.
//
// ══ SCOPED NEGATIVE ESTABLISHMENT ══════════════════════════════════════════════
//
// checks_run[] and thresholds_applied are mandatory on EVERY finding, and their
// scope is that finding. They say which checks ran and at which thresholds to reach
// this one observation. They never widen into a claim about the file as a whole, and
// there is no file-level "checks_run" field for them to widen into.
//
// The mandate is not a presence test. Each class declares the checks and thresholds
// its detector must record, and construction rejects a finding that omits any of
// them. A tiny_text finding cannot exist without the size threshold that produced it.
//
// Pure JS by contract, like reader-result.js: no node: imports, no DOM, no Date.now,
// no random. Fixed input produces an identical result. Every constructed object is
// deep-frozen, so a prohibited combination can be neither built nor mutated into
// existence afterward.

export const FILE_RESULT_SCHEMA_VERSION = "file-result.v1";

export const FILE_CANON_ERROR_PREFIX = "file-result:";

function reject(message) {
  throw new RangeError(`${FILE_CANON_ERROR_PREFIX} ${message}`);
}

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const k of Object.keys(value)) deepFreeze(value[k]);
  }
  return value;
}

function isPlainObject(v) {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function isFiniteNumber(v) {
  return typeof v === "number" && Number.isFinite(v);
}

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim() !== "";
}

function isIndex(v) {
  return Number.isInteger(v) && v >= 0;
}

// ---------------------------------------------------------------------------
// Absence shapes. Two families, both refused.
//
//   1. A KEY whose name asserts nothingness. `missing_font`, `not_found`,
//      `no_backdrop`, `absent` — a field whose existence is the claim.
//   2. A VALUE that stands in for a measurement nobody made. null, undefined,
//      NaN, and the sentinel strings people reach for instead of omitting a field.
//
// The value family is skipped on OPAQUE paths, which carry text the document
// supplied rather than a value this schema chose. A PDF is entitled to a metadata
// key literally named "none", and refusing to record it would be the schema editing
// the evidence.
// ---------------------------------------------------------------------------

const ABSENCE_KEY_PATTERN =
  /^(?:absent|absence|is_absent|was_absent|missing|is_missing|not_found|notfound|not_present|none_found|no_[a-z0-9_]+|lack|lacks|lacking|without_[a-z0-9_]+|unfound|nothing_[a-z0-9_]+|empty_[a-z0-9_]+)$/;

const ABSENCE_VALUE_STRINGS = new Set([
  "absent",
  "none",
  "n/a",
  "na",
  "not_found",
  "not found",
  "not_present",
  "not present",
  "missing",
  "unknown",
  "null",
  "undefined",
  "nothing",
]);

// Suffix-anchored so the same rule holds whether the walk started at a whole result
// (`findings[0].extraction.text`) or at a single finding (`extraction.text`).
const OPAQUE_PATH_PATTERNS = [
  /(?:^|\.)extraction\.text$/,
  /(?:^|\.)graphics_state\.(?:metadata_key|annotation_subtype|ocg_name)$/,
];

function isOpaquePath(path) {
  return OPAQUE_PATH_PATTERNS.some((p) => p.test(path));
}

export function assertNoAbsenceShapes(node, path = "") {
  if (Array.isArray(node)) {
    node.forEach((v, i) => assertNoAbsenceShapes(v, `${path}[${i}]`));
    return;
  }
  if (isPlainObject(node)) {
    for (const key of Object.keys(node)) {
      if (ABSENCE_KEY_PATTERN.test(key)) {
        reject(
          `absence-shaped field "${key}" at ${path || "<root>"} — a measurement nobody made is omitted, never recorded as an absence.`,
        );
      }
      assertNoAbsenceShapes(node[key], path ? `${path}.${key}` : key);
    }
    return;
  }
  if (isOpaquePath(path)) return;
  if (node === null || node === undefined) {
    reject(`absence-shaped value at ${path} — omit the field instead of recording it as ${String(node)}.`);
  }
  if (typeof node === "number" && Number.isNaN(node)) {
    reject(`absence-shaped value at ${path} — NaN stands in for a measurement nobody made.`);
  }
  if (typeof node === "string" && ABSENCE_VALUE_STRINGS.has(node.trim().toLowerCase())) {
    reject(`absence-shaped value "${node}" at ${path} — omit the field instead of naming its emptiness.`);
  }
}

// ---------------------------------------------------------------------------
// Typed field vocabulary. Every graphics-state and extraction field is one of
// these, so "the typed fields the detector measured" is a checkable statement
// rather than a free-form bag.
// ---------------------------------------------------------------------------

const FIELD_TYPES = {
  index: (v) => isIndex(v),
  positive_number: (v) => isFiniteNumber(v) && v > 0,
  positive_integer: (v) => Number.isInteger(v) && v > 0,
  unit_interval: (v) => isFiniteNumber(v) && v >= 0 && v <= 1,
  rect: (v) => Array.isArray(v) && v.length === 4 && v.every(isFiniteNumber),
  point: (v) => isPlainObject(v) && isFiniteNumber(v.x) && isFiniteNumber(v.y),
  rgb: (v) => Array.isArray(v) && v.length === 3 && v.every((c) => isFiniteNumber(c) && c >= 0 && c <= 1),
  opaque_text: (v) => typeof v === "string" && v.length > 0,
  codepoint_list: (v) => Array.isArray(v) && v.length > 0 && v.every(isIndex),
};

function checkField(spec, path, value) {
  const validate = FIELD_TYPES[spec.type];
  if (!validate) reject(`unknown field type "${spec.type}" declared for ${path} — the type vocabulary is closed.`);
  if (!validate(value)) reject(`${path} is not a valid ${spec.type}: ${JSON.stringify(value)}`);
  if (spec.enum && !spec.enum.includes(value)) {
    reject(`${path} must be one of ${spec.enum.join(" | ")}, got ${JSON.stringify(value)}`);
  }
  if (spec.equals !== undefined) {
    const same = Array.isArray(spec.equals)
      ? Array.isArray(value) && value.length === spec.equals.length && value.every((c, i) => c === spec.equals[i])
      : value === spec.equals;
    if (!same) reject(`${path} must equal ${JSON.stringify(spec.equals)} for this class, got ${JSON.stringify(value)}`);
  }
}

// ---------------------------------------------------------------------------
// PHENOMENON CLASSES — v1, structural only.
//
// Eleven classes, each naming a property of the file's own structure. There is no
// instruction class, no linguistic class, and no class that reads the text. What a
// span SAYS is outside this schema entirely; that a span carries U+200B is inside it.
//
// Each class declares four things, and construction enforces all four:
//   extraction  — extraction fields this class requires beyond text + codepoints
//   graphics_state — the typed fields the detector must have measured
//   checks      — check ids that must appear in the finding's checks_run
//   thresholds  — threshold ids that must appear in thresholds_applied
//
// `graphics_state` keeps the governing record's name. For the encoding class the
// typed fields sit in the encoding layer rather than the graphics state; the record
// is still the paired measurement half of the evidence, which is what the name is
// for.
// ---------------------------------------------------------------------------

export const PHENOMENON_CLASSES = deepFreeze({
  invisible_render_mode: {
    extraction: ["page_index", "position", "effective_size_pt"],
    graphics_state: { render_mode: { type: "index", equals: 3 } },
    checks: ["text_render_mode"],
    thresholds: [],
  },
  zero_alpha: {
    extraction: ["page_index", "position", "effective_size_pt"],
    graphics_state: { fill_alpha: { type: "unit_interval", equals: 0 } },
    checks: ["fill_alpha"],
    thresholds: [],
  },
  near_zero_alpha: {
    extraction: ["page_index", "position", "effective_size_pt"],
    graphics_state: { fill_alpha: { type: "unit_interval" } },
    checks: ["fill_alpha"],
    thresholds: ["fill_alpha_max"],
  },
  offpage_text: {
    extraction: ["page_index", "position", "effective_size_pt"],
    graphics_state: { text_bbox: { type: "rect" }, crop_box: { type: "rect" } },
    checks: ["text_bbox_against_crop_box"],
    thresholds: [],
  },
  tiny_text: {
    extraction: ["page_index", "position", "effective_size_pt"],
    graphics_state: { font_size_pt: { type: "positive_number" }, text_matrix_scale: { type: "positive_number" } },
    checks: ["effective_text_size"],
    thresholds: ["effective_size_pt_max"],
  },
  white_fill_unbacked: {
    extraction: ["page_index", "position", "effective_size_pt"],
    graphics_state: {
      fill_color_rgb: { type: "rgb", equals: [1, 1, 1] },
      backdrop_source: { type: "opaque_text", enum: ["page_default"] },
    },
    checks: ["fill_color", "backdrop_source"],
    thresholds: [],
  },
  covered_text: {
    extraction: ["page_index", "position", "effective_size_pt"],
    graphics_state: {
      text_bbox: { type: "rect" },
      covering_object_bbox: { type: "rect" },
      covering_object_kind: { type: "opaque_text", enum: ["filled_path", "image", "form_xobject"] },
      z_order_delta: { type: "positive_integer" },
    },
    checks: ["paint_order", "bbox_overlap"],
    thresholds: ["bbox_overlap_min"],
  },
  annotation_text: {
    extraction: ["page_index", "position"],
    graphics_state: {
      container_kind: { type: "opaque_text", enum: ["annotation"] },
      annotation_subtype: { type: "opaque_text" },
    },
    checks: ["annotation_inventory"],
    thresholds: [],
  },
  metadata_text: {
    extraction: [],
    graphics_state: {
      container_kind: { type: "opaque_text", enum: ["metadata"] },
      metadata_key: { type: "opaque_text" },
    },
    checks: ["metadata_inventory"],
    thresholds: [],
  },
  hidden_ocg_text: {
    extraction: ["page_index", "position", "effective_size_pt"],
    graphics_state: {
      container_kind: { type: "opaque_text", enum: ["optional_content_group"] },
      ocg_name: { type: "opaque_text" },
      ocg_default_state: { type: "opaque_text", enum: ["off"] },
    },
    checks: ["optional_content_group_state"],
    thresholds: [],
  },
  encoding_control_structures: {
    extraction: [],
    graphics_state: {
      control_category: { type: "opaque_text", enum: ["zero_width", "bidi_override", "unicode_tag_block"] },
      control_codepoints: { type: "codepoint_list" },
    },
    checks: ["codepoint_scan"],
    thresholds: [],
  },
});

export const PHENOMENON_CLASS_IDS = deepFreeze(Object.keys(PHENOMENON_CLASSES));

const EXTRACTION_FIELD_SPECS = {
  page_index: { type: "index" },
  position: { type: "point" },
  effective_size_pt: { type: "positive_number" },
};

// ---------------------------------------------------------------------------
// Constructors.
// ---------------------------------------------------------------------------

const SHA256_PATTERN = /^[0-9a-f]{64}$/;

export function makeFileIdentity(input) {
  if (!isPlainObject(input)) reject("file identity must be an object.");
  const { sha256, byte_size, parser_name, parser_version, predicate_versions } = input;

  if (typeof sha256 !== "string" || !SHA256_PATTERN.test(sha256)) {
    reject("sha256 must be 64 lowercase hex characters.");
  }
  if (!Number.isInteger(byte_size) || byte_size <= 0) reject("byte_size must be a positive integer.");
  if (!isNonEmptyString(parser_name)) reject("parser_name is required — a result names the parser that produced it.");
  if (!isNonEmptyString(parser_version)) reject("parser_version is required.");
  if (!isPlainObject(predicate_versions) || Object.keys(predicate_versions).length === 0) {
    reject("predicate_versions must name at least one predicate and its version.");
  }
  for (const [k, v] of Object.entries(predicate_versions)) {
    if (!isNonEmptyString(v)) reject(`predicate_versions.${k} must be a non-empty version string.`);
  }

  return deepFreeze({
    sha256,
    byte_size,
    parser_name,
    parser_version,
    predicate_versions: { ...predicate_versions },
  });
}

export function makePage(input) {
  if (!isPlainObject(input)) reject("a page inventory entry must be an object.");
  const { index, media_box, crop_box, rotation } = input;
  if (!isIndex(index)) reject("page index must be a non-negative integer.");
  if (!FIELD_TYPES.rect(media_box)) reject(`page ${index} media_box is not a rect.`);
  if (!FIELD_TYPES.rect(crop_box)) reject(`page ${index} crop_box is not a rect.`);
  if (!Number.isInteger(rotation) || rotation % 90 !== 0) reject(`page ${index} rotation must be a multiple of 90.`);
  return deepFreeze({ index, media_box: [...media_box], crop_box: [...crop_box], rotation });
}

function codepointsOf(text) {
  return [...text].map((ch) => ch.codePointAt(0));
}

function sameNumbers(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

function normalizeRect(r) {
  return [Math.min(r[0], r[2]), Math.min(r[1], r[3]), Math.max(r[0], r[2]), Math.max(r[1], r[3])];
}

function rectArea(r) {
  const [x0, y0, x1, y1] = normalizeRect(r);
  return (x1 - x0) * (y1 - y0);
}

function rectIntersectionArea(a, b) {
  const [ax0, ay0, ax1, ay1] = normalizeRect(a);
  const [bx0, by0, bx1, by1] = normalizeRect(b);
  const w = Math.min(ax1, bx1) - Math.max(ax0, bx0);
  const h = Math.min(ay1, by1) - Math.max(ay0, by0);
  return w > 0 && h > 0 ? w * h : 0;
}

function rectsIntersect(a, b) {
  return rectIntersectionArea(a, b) > 0;
}

// Per-class invariants that pair the two halves of the evidence. A finding is
// paired evidence, so a graphics-state record that does not answer to its own
// extraction record is not a weaker finding — it is a different file's finding
// wearing this one's identity, and it cannot be built.
const CLASS_INVARIANTS = {
  offpage_text(f) {
    if (rectsIntersect(f.graphics_state.text_bbox, f.graphics_state.crop_box)) {
      reject("offpage_text requires a text bbox that does not intersect the crop box.");
    }
  },
  tiny_text(f) {
    const max = f.thresholds_applied.effective_size_pt_max;
    if (f.extraction.effective_size_pt > max) {
      reject(`tiny_text requires effective_size_pt (${f.extraction.effective_size_pt}) at or below the applied threshold (${max}).`);
    }
  },
  near_zero_alpha(f) {
    const a = f.graphics_state.fill_alpha;
    const max = f.thresholds_applied.fill_alpha_max;
    if (a <= 0) reject("near_zero_alpha requires a fill alpha above 0; alpha 0 is the zero_alpha class.");
    if (a > max) reject(`near_zero_alpha requires fill alpha (${a}) at or below the applied threshold (${max}).`);
  },
  covered_text(f) {
    const textArea = rectArea(f.graphics_state.text_bbox);
    if (textArea <= 0) reject("covered_text requires a text bbox with positive area.");
    const overlap = rectIntersectionArea(f.graphics_state.text_bbox, f.graphics_state.covering_object_bbox) / textArea;
    const min = f.thresholds_applied.bbox_overlap_min;
    if (overlap < min) {
      reject(`covered_text requires an overlap fraction (${overlap}) at or above the applied threshold (${min}).`);
    }
  },
  encoding_control_structures(f) {
    const present = new Set(f.extraction.codepoints);
    for (const cp of f.graphics_state.control_codepoints) {
      if (!present.has(cp)) {
        reject(`encoding_control_structures names codepoint ${cp}, which does not occur in the extracted span.`);
      }
    }
  },
};

export function makeFinding(input) {
  if (!isPlainObject(input)) reject("a finding must be an object.");
  const { class_label, extraction, graphics_state, checks_run, thresholds_applied } = input;

  if (!isNonEmptyString(class_label) || !Object.prototype.hasOwnProperty.call(PHENOMENON_CLASSES, class_label)) {
    reject(`unknown phenomenon class ${JSON.stringify(class_label)} — the v1 class set is closed.`);
  }
  const spec = PHENOMENON_CLASSES[class_label];

  // ── extraction record ─────────────────────────────────────────────────────
  if (!isPlainObject(extraction)) reject(`${class_label}: an extraction record is required.`);
  if (typeof extraction.text !== "string" || extraction.text.length === 0) {
    reject(`${class_label}: extraction.text must be the span the parser emitted.`);
  }
  if (!FIELD_TYPES.codepoint_list(extraction.codepoints)) {
    reject(`${class_label}: extraction.codepoints must be a non-empty list of codepoints.`);
  }
  if (!sameNumbers(extraction.codepoints, codepointsOf(extraction.text))) {
    reject(`${class_label}: extraction.codepoints do not reproduce extraction.text.`);
  }

  const outExtraction = { text: extraction.text, codepoints: [...extraction.codepoints] };
  for (const field of spec.extraction) {
    if (!Object.prototype.hasOwnProperty.call(extraction, field)) {
      reject(`${class_label}: extraction.${field} is required for this class.`);
    }
  }
  for (const [field, fieldSpec] of Object.entries(EXTRACTION_FIELD_SPECS)) {
    if (!Object.prototype.hasOwnProperty.call(extraction, field)) continue;
    checkField(fieldSpec, `${class_label}.extraction.${field}`, extraction[field]);
    outExtraction[field] = field === "position" ? { x: extraction[field].x, y: extraction[field].y } : extraction[field];
  }

  // ── graphics-state record ─────────────────────────────────────────────────
  if (!isPlainObject(graphics_state)) reject(`${class_label}: a graphics-state record is required.`);
  const outGraphics = {};
  for (const [field, fieldSpec] of Object.entries(spec.graphics_state)) {
    if (!Object.prototype.hasOwnProperty.call(graphics_state, field)) {
      reject(`${class_label}: graphics_state.${field} is required for this class.`);
    }
    checkField(fieldSpec, `${class_label}.graphics_state.${field}`, graphics_state[field]);
    const v = graphics_state[field];
    outGraphics[field] = Array.isArray(v) ? [...v] : v;
  }
  for (const field of Object.keys(graphics_state)) {
    if (!Object.prototype.hasOwnProperty.call(spec.graphics_state, field)) {
      reject(`${class_label}: graphics_state.${field} is not a declared field of this class.`);
    }
  }

  // ── scoped negative establishment ─────────────────────────────────────────
  if (!Array.isArray(checks_run) || checks_run.length === 0) {
    reject(`${class_label}: checks_run is mandatory and names at least one check.`);
  }
  if (!checks_run.every(isNonEmptyString)) reject(`${class_label}: every checks_run entry must be a check id.`);
  const ran = new Set(checks_run);
  for (const required of spec.checks) {
    if (!ran.has(required)) reject(`${class_label}: checks_run must record the "${required}" check.`);
  }

  if (!isPlainObject(thresholds_applied)) {
    reject(`${class_label}: thresholds_applied is mandatory (an empty map records that no numeric threshold applied).`);
  }
  for (const [k, v] of Object.entries(thresholds_applied)) {
    if (!isFiniteNumber(v)) reject(`${class_label}: thresholds_applied.${k} must be the finite number applied.`);
  }
  for (const required of spec.thresholds) {
    if (!Object.prototype.hasOwnProperty.call(thresholds_applied, required)) {
      reject(`${class_label}: thresholds_applied must record "${required}".`);
    }
  }

  const finding = {
    class_label,
    extraction: outExtraction,
    graphics_state: outGraphics,
    checks_run: [...checks_run],
    thresholds_applied: { ...thresholds_applied },
  };

  const invariant = CLASS_INVARIANTS[class_label];
  if (invariant) invariant(finding);

  assertNoAbsenceShapes(finding);
  return deepFreeze(finding);
}

export function makeFileResult(input) {
  if (!isPlainObject(input)) reject("a file result must be an object.");
  const { file, pages, findings } = input;

  const identity = makeFileIdentity(file);

  if (!Array.isArray(pages) || pages.length === 0) {
    reject("pages is the page inventory and a file result carries at least one page.");
  }
  const inventory = pages.map(makePage);
  const seen = new Set();
  inventory.forEach((p, i) => {
    if (p.index !== i) reject(`page inventory is out of order at position ${i}: index ${p.index}.`);
    if (seen.has(p.index)) reject(`page index ${p.index} appears twice in the inventory.`);
    seen.add(p.index);
  });

  if (!Array.isArray(findings)) reject("findings must be an array (an empty array is a count, not an absence).");
  const built = findings.map(makeFinding);
  for (const f of built) {
    if (Object.prototype.hasOwnProperty.call(f.extraction, "page_index") && !seen.has(f.extraction.page_index)) {
      reject(`a ${f.class_label} finding names page ${f.extraction.page_index}, which is not in the page inventory.`);
    }
  }

  const result = {
    result_schema_version: FILE_RESULT_SCHEMA_VERSION,
    file: identity,
    pages: inventory,
    findings: built,
  };

  assertNoAbsenceShapes(result);
  return deepFreeze(result);
}
