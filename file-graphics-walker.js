// file-graphics-walker.js — the graphics-state walk over a PDF operator list
// (Input Integrity, Lane 2).
//
// ══ getOperatorList IS THE EVIDENCE SURFACE ════════════════════════════════════
//
// This walker consumes an operator list and nothing else. getTextContent is barred
// from the evidence path by ruling: it deletes Cf codepoints and fabricates
// characters out of advance gaps, so a span it returns is neither what the file
// carries nor a superset of it. It appears in this repository only as a cross-check
// comparator inside a test, never as a source a finding is built from.
//
// No model is called on document text anywhere in this lane. The walk is arithmetic
// over operands.
//
// ══ ENVIRONMENT-AGNOSTIC BY CONTRACT ═══════════════════════════════════════════
//
// No node: imports, no DOM, no window, no fs, and no import of pdfjs-dist. The
// walker takes the operator list and the OPS table as ARGUMENTS. Binding to a parser
// happens in file-intake-pdfjs.js, which is the only module that imports one. That is
// what lets the same walk run under node:test today and inside a Web Worker in Lane 3
// without a second implementation drifting away from this one.
//
// Fixed input produces an identical record: no Date.now, no random, no iteration over
// unordered structures.
//
// ══ MATRIX CONVENTION ══════════════════════════════════════════════════════════
//
// A matrix is [a, b, c, d, e, f] applied to the row vector (x, y, 1), which is the
// PDF convention and pdf.js's. `mul(a, b)` composes so that b applies FIRST:
// apply(mul(a, b), x, y) === apply(a, ...apply(b, x, y)). Every composition below
// reads in that order, and getting it backwards is the single easiest way to produce
// positions that look plausible and are wrong.

export const WALKER_NAME = "imbas-file-graphics-walker";
export const WALKER_VERSION = "1.0.0";

// ---------------------------------------------------------------------------
// Matrix and rectangle arithmetic.
// ---------------------------------------------------------------------------

export const IDENTITY_MATRIX = Object.freeze([1, 0, 0, 1, 0, 0]);

export function mul(a, b) {
  return [
    a[0] * b[0] + a[2] * b[1],
    a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3],
    a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4],
    a[1] * b[4] + a[3] * b[5] + a[5],
  ];
}

export function apply(m, x, y) {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}

// The same six numbers reach this module in two shapes: `transform` receives them as
// six loose arguments, `setTextMatrix` as a single Float32Array in argument zero.
// Reading one shape with the other's accessor does not throw — it yields a length-1
// array whose sole element is an object, and every downstream coordinate becomes NaN.
// That is precisely what the Tm coverage fixture caught, so the normalization is here
// rather than at either call site.
export function matrixArg(a) {
  const src = a.length === 1 && a[0] !== null && typeof a[0] === "object" ? a[0] : a;
  return [Number(src[0]), Number(src[1]), Number(src[2]), Number(src[3]), Number(src[4]), Number(src[5])];
}

// The vertical scale the transform imposes. Text render size scales with this and
// not with the horizontal scale operand, which is why Tz never changes it.
function verticalScale(m) {
  return Math.hypot(m[1], m[3]);
}

function horizontalScale(m) {
  return Math.hypot(m[0], m[1]);
}

// A soft mask or a non-normal blend mode means the composite is something an operator
// list does not settle: the mask's own content stream and the backdrop both feed it.
// Recording the two operands beside every paint is what lets a consumer SCOPE a claim
// about paint contribution instead of asserting one the walk cannot support. pdf.js
// reports an active mask as `true` on setGState and clears it with "None".
function compositeState(st) {
  const sm = st.soft_mask;
  return {
    soft_mask_active: sm !== null && sm !== undefined && sm !== false && sm !== "None",
    blend_mode: st.blend_mode === null || st.blend_mode === undefined ? "normal" : String(st.blend_mode).toLowerCase(),
  };
}

function boxOf(points) {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}

// A rect through a transform. Both diagonal corners are mapped and re-bounded, so a
// rotated or flipped CTM still yields an axis-aligned device box rather than a box
// with its corners crossed.
function transformRect(m, r) {
  return boxOf([apply(m, r[0], r[1]), apply(m, r[2], r[3]), apply(m, r[0], r[3]), apply(m, r[2], r[1])]);
}

export function rectIntersection(a, b) {
  const r = [Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.min(a[2], b[2]), Math.min(a[3], b[3])];
  return r[2] > r[0] && r[3] > r[1] ? r : null;
}

export function rectArea(r) {
  return Math.max(0, r[2] - r[0]) * Math.max(0, r[3] - r[1]);
}

// Rounded to 4 decimal places wherever a number enters the record. Float composition
// of three matrices leaves 1e-13 dust that would make two identical walks compare
// unequal; 4 places is far below any threshold this lane applies.
const PLACES = 4;
function r4(n) {
  return Math.round(n * 1e4) / 1e4;
}
function r4a(a) {
  return a.map(r4);
}

// ---------------------------------------------------------------------------
// Colour. pdf.js hands colour to the operator list as a CSS hex string, having
// already converted DeviceGray, DeviceCMYK and Separation into device RGB. The
// original colour space and its operands do NOT survive to this surface, so the
// walker records the RGB it was given and nothing about the space it came from.
// ---------------------------------------------------------------------------

export function parseColor(value) {
  if (typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value)) {
    return [
      parseInt(value.slice(1, 3), 16) / 255,
      parseInt(value.slice(3, 5), 16) / 255,
      parseInt(value.slice(5, 7), 16) / 255,
    ];
  }
  if (Array.isArray(value) && value.length === 3 && value.every((c) => typeof c === "number")) {
    return [...value];
  }
  return null;
}

const BLACK = Object.freeze([0, 0, 0]);

// ---------------------------------------------------------------------------
// Graphics state.
// ---------------------------------------------------------------------------

function freshState() {
  return {
    ctm: [...IDENTITY_MATRIX],
    fill_color_rgb: [...BLACK],
    stroke_color_rgb: [...BLACK],
    fill_alpha: 1,
    stroke_alpha: 1,
    line_width: 1,
    blend_mode: null,
    soft_mask: null,
    // Nested clips intersect, but folding them is the consumer's job by ruling, so
    // the walker carries the stack in application order and never collapses it.
    clip_stack: [],
    font_id: null,
    font_size_pt: 0,
    render_mode: 0,
    char_spacing: 0,
    word_spacing: 0,
    horizontal_scale: 1,
    leading: 0,
    text_rise: 0,
    form_depth: 0,
  };
}

function cloneState(s) {
  return { ...s, ctm: [...s.ctm], fill_color_rgb: [...s.fill_color_rgb], stroke_color_rgb: [...s.stroke_color_rgb], clip_stack: [...s.clip_stack] };
}

// ---------------------------------------------------------------------------
// The walk.
// ---------------------------------------------------------------------------

const PAINT_OP_NAMES = [
  "stroke",
  "closeStroke",
  "fill",
  "eoFill",
  "fillStroke",
  "eoFillStroke",
  "closeFillStroke",
  "closeEOFillStroke",
];

const FILL_OP_NAMES = ["fill", "eoFill", "fillStroke", "eoFillStroke", "closeFillStroke", "closeEOFillStroke"];

const IMAGE_OP_NAMES = [
  "paintImageXObject",
  "paintImageXObjectRepeat",
  "paintInlineImageXObject",
  "paintInlineImageXObjectGroup",
  "paintImageMaskXObject",
  "paintImageMaskXObjectGroup",
  "paintImageMaskXObjectRepeat",
  "paintSolidColorImageMask",
];

// Marked-content properties for optional content arrive as { type: "OCG", id } or as
// { type: "OCMD", ids: [...] }. Both are reduced to the id list the membership names,
// because a run's visibility question is "which groups govern this run".
function ocgIdsOf(props) {
  if (!props || typeof props !== "object") return [];
  if (props.type === "OCG" && typeof props.id === "string") return [props.id];
  if (props.type === "OCMD" && Array.isArray(props.ids)) return props.ids.filter((id) => typeof id === "string");
  return [];
}

/**
 * Walk one page's operator list.
 *
 * @param {object} input
 * @param {{fnArray: ArrayLike<number>, argsArray: ArrayLike<any>}} input.operatorList
 * @param {Record<string, number>} input.ops  the parser's OPS table (name -> id)
 * @param {{index: number, view: number[], rotation: number, user_unit: number}} input.page
 * @returns {object} a page walk record
 */
export function walkPageOperators({ operatorList, ops, page }) {
  const OPNAME = {};
  for (const [name, id] of Object.entries(ops)) OPNAME[id] = name;

  const isOneOf = (names, name) => names.includes(name);

  const state0 = freshState();
  let st = state0;
  const stack = [];
  let tm = [...IDENTITY_MATRIX];
  let tlm = [...IDENTITY_MATRIX];
  let pendingClip = null;
  let annotationDepth = 0;

  const markedContent = [];
  const textRuns = [];
  const paths = [];
  const images = [];
  const forms = [];
  const groups = [];
  const opNames = [];

  const { fnArray, argsArray } = operatorList;

  const currentClips = () => st.clip_stack.map((c) => ({ ...c, box_device: [...c.box_device] }));
  const currentMarkedContent = () =>
    markedContent.map((m) => ({ tag: m.tag, ocg_ids: [...m.ocg_ids], op_index: m.op_index }));

  // Show one glyph array. Shared by showText, showSpacedText, and the two
  // next-line-and-show operators, so their advance arithmetic cannot diverge.
  function showGlyphs(glyphs, opIndex, opName) {
    const full = mul(st.ctm, tm);
    // The text-space parameter matrix maps (0,0) to (0, rise); the origin is the
    // baseline start of the run with text rise applied.
    const origin = apply(full, 0, st.text_rise);

    let text = "";
    let advance = 0;
    const glyphRecords = [];

    for (const g of glyphs || []) {
      if (typeof g === "number") {
        // A TJ adjustment. Subtracted in thousandths of text space, scaled by the
        // font size and the horizontal scale — and NOT by char or word spacing,
        // which apply per glyph rather than per adjustment.
        const shift = (-g / 1000) * st.font_size_pt * st.horizontal_scale;
        advance += shift;
        glyphRecords.push({ kind: "adjustment", amount: g, advance_pt: r4(shift) });
        continue;
      }
      if (!g) continue;
      const unicode = typeof g.unicode === "string" ? g.unicode : "";
      const width = typeof g.width === "number" ? g.width : 0;
      const isSpace = g.isSpace === true;
      const step =
        ((width / 1000) * st.font_size_pt + st.char_spacing + (isSpace ? st.word_spacing : 0)) *
        st.horizontal_scale;
      text += unicode;
      advance += step;
      glyphRecords.push({
        kind: "glyph",
        unicode,
        codepoints: [...unicode].map((c) => c.codePointAt(0)),
        char_code: typeof g.originalCharCode === "number" ? g.originalCharCode : null,
        width_1000: width,
        is_space: isSpace,
        advance_pt: r4(step),
      });
    }

    const effectiveSize = st.font_size_pt * verticalScale(full);
    const advanceDevice = advance * horizontalScale(full);
    const end = apply(full, advance, st.text_rise);

    // The run's box is built from measured operands only: the baseline origin, the
    // summed advance, and the effective size. It is an ADVANCE-AND-SIZE box, not a
    // glyph outline box — an operator list carries no glyph outlines and no font
    // ascent, so a box drawn to the typeface's ascender would be a number this
    // walker invented. The top edge is the em box top: baseline + effective size.
    const emTop = apply(full, advance, st.text_rise + st.font_size_pt);
    const startTop = apply(full, 0, st.text_rise + st.font_size_pt);
    const boxDevice = boxOf([origin, end, emTop, startTop]);

    textRuns.push({
      op_index: opIndex,
      op_name: opName,
      page_index: page.index,
      text,
      codepoints: [...text].map((c) => c.codePointAt(0)),
      glyphs: glyphRecords,
      font_id: st.font_id,
      font_size_pt: st.font_size_pt,
      effective_size_pt: r4(effectiveSize),
      text_matrix: r4a(tm),
      ctm: r4a(st.ctm),
      full_transform: r4a(full),
      origin_device: { x: r4(origin[0]), y: r4(origin[1]) },
      box_device: r4a(boxDevice),
      advance_text_space_pt: r4(advance),
      advance_device_pt: r4(advanceDevice),
      render_mode: st.render_mode,
      fill_color_rgb: st.fill_color_rgb ? [...st.fill_color_rgb] : null,
      stroke_color_rgb: st.stroke_color_rgb ? [...st.stroke_color_rgb] : null,
      fill_alpha: st.fill_alpha,
      stroke_alpha: st.stroke_alpha,
      line_width: st.line_width,
      ...compositeState(st),
      char_spacing: st.char_spacing,
      word_spacing: st.word_spacing,
      horizontal_scale: st.horizontal_scale,
      leading: st.leading,
      text_rise: st.text_rise,
      clip_stack: currentClips(),
      marked_content: currentMarkedContent(),
      form_depth: st.form_depth,
      in_annotation: annotationDepth > 0,
    });

    // Showing text advances the text matrix. Omitting this is invisible while every
    // fixture holds one run per line and wrong the moment a second run follows on
    // the same line, which is what the operator-coverage fixtures exercise.
    tm = mul(tm, [1, 0, 0, 1, advance, 0]);
  }

  for (let i = 0; i < fnArray.length; i++) {
    const fn = fnArray[i];
    const a = argsArray[i];
    const name = OPNAME[fn];
    opNames.push(name);

    switch (name) {
      case "save":
        stack.push(cloneState(st));
        break;
      case "restore":
        if (stack.length) st = stack.pop();
        break;
      case "transform":
        st.ctm = mul(st.ctm, matrixArg(a));
        break;

      case "setGState":
        for (const [k, v] of a[0] || []) {
          if (k === "ca") st.fill_alpha = v;
          else if (k === "CA") st.stroke_alpha = v;
          else if (k === "LW") st.line_width = v;
          else if (k === "BM") st.blend_mode = v;
          else if (k === "SMask") st.soft_mask = v;
          else if (k === "Font") st.font_size_pt = v[1];
        }
        break;

      case "setFillRGBColor":
        st.fill_color_rgb = parseColor(a[0]);
        break;
      case "setStrokeRGBColor":
        st.stroke_color_rgb = parseColor(a[0]);
        break;
      case "setFillTransparent":
        st.fill_color_rgb = null;
        break;
      case "setStrokeTransparent":
        st.stroke_color_rgb = null;
        break;
      case "setLineWidth":
        st.line_width = a[0];
        break;

      case "setFont":
        st.font_id = a[0];
        st.font_size_pt = a[1];
        break;
      case "setTextRenderingMode":
        st.render_mode = a[0];
        break;
      case "setCharSpacing":
        st.char_spacing = a[0];
        break;
      case "setWordSpacing":
        st.word_spacing = a[0];
        break;
      case "setHScale":
        // Tz is a percentage on the wire and a ratio everywhere it is used.
        st.horizontal_scale = a[0] / 100;
        break;
      case "setLeading":
        st.leading = a[0];
        break;
      case "setTextRise":
        st.text_rise = a[0];
        break;

      case "beginText":
        tm = [...IDENTITY_MATRIX];
        tlm = [...IDENTITY_MATRIX];
        break;
      case "endText":
        break;
      case "setTextMatrix":
        tm = matrixArg(a);
        tlm = [...tm];
        break;
      case "moveText":
        tlm = mul(tlm, [1, 0, 0, 1, a[0], a[1]]);
        tm = [...tlm];
        break;
      case "setLeadingMoveText":
        // TD sets the leading to the negated vertical displacement, then moves.
        st.leading = -a[1];
        tlm = mul(tlm, [1, 0, 0, 1, a[0], a[1]]);
        tm = [...tlm];
        break;
      case "nextLine":
        tlm = mul(tlm, [1, 0, 0, 1, 0, -st.leading]);
        tm = [...tlm];
        break;

      case "showText":
      case "showSpacedText":
        showGlyphs(a[0], i, name);
        break;
      case "nextLineShowText":
        tlm = mul(tlm, [1, 0, 0, 1, 0, -st.leading]);
        tm = [...tlm];
        showGlyphs(a[0], i, name);
        break;
      case "nextLineSetSpacingShowText":
        st.word_spacing = a[0];
        st.char_spacing = a[1];
        tlm = mul(tlm, [1, 0, 0, 1, 0, -st.leading]);
        tm = [...tlm];
        showGlyphs(a[2], i, name);
        break;

      // A clip operator arrives BEFORE the constructPath that carries its geometry.
      // Reading it as though it applied to the path already seen is off by one path.
      case "clip":
        pendingClip = "clip";
        break;
      case "eoClip":
        pendingClip = "eoClip";
        break;

      case "constructPath": {
        const [paintOpId, coords, minMax] = a;
        const paintOpName = OPNAME[paintOpId] ?? String(paintOpId);
        // minMax is pre-CTM user space. Mapping it through the CTM is what makes it a
        // device region; treating it as already-device is the other off-by-a-matrix.
        const userBox = Array.from(minMax);
        const deviceBox = transformRect(st.ctm, userBox);
        const record = {
          op_index: i,
          paint_op: paintOpName,
          min_max_user: r4a(userBox),
          box_device: r4a(deviceBox),
          coords: Array.from(coords || []).map((s) => (ArrayBuffer.isView(s) || Array.isArray(s) ? Array.from(s).map(r4) : s)),
          ctm: r4a(st.ctm),
          fill_color_rgb: st.fill_color_rgb ? [...st.fill_color_rgb] : null,
          stroke_color_rgb: st.stroke_color_rgb ? [...st.stroke_color_rgb] : null,
          fill_alpha: st.fill_alpha,
          stroke_alpha: st.stroke_alpha,
          ...compositeState(st),
          is_paint: isOneOf(PAINT_OP_NAMES, paintOpName),
          is_fill: isOneOf(FILL_OP_NAMES, paintOpName),
          became_clip: pendingClip,
          clip_stack: currentClips(),
          marked_content: currentMarkedContent(),
          form_depth: st.form_depth,
        };
        if (pendingClip) {
          st.clip_stack = [...st.clip_stack, { source: pendingClip, op_index: i, box_device: r4a(deviceBox) }];
          pendingClip = null;
        }
        paths.push(record);
        break;
      }

      // pdf.js does NOT fold a Form XObject's /Matrix into the operator stream — the
      // renderer applies it here. A walk that ignores this reports every position
      // inside the form as though the form were placed at the identity.
      case "paintFormXObjectBegin": {
        stack.push(cloneState(st));
        const matrix = a[0] ? Array.from(a[0]) : null;
        if (matrix) st.ctm = mul(st.ctm, matrix);
        const bbox = a[1] ? Array.from(a[1]) : null;
        let bboxDevice = null;
        if (bbox) {
          bboxDevice = r4a(transformRect(st.ctm, bbox));
          st.clip_stack = [...st.clip_stack, { source: "form_bbox", op_index: i, box_device: bboxDevice }];
        }
        st.form_depth += 1;
        forms.push({
          op_index: i,
          matrix: matrix ? r4a(matrix) : null,
          bbox_user: bbox ? r4a(bbox) : null,
          box_device: bboxDevice,
          ctm: r4a(st.ctm),
          fill_alpha: st.fill_alpha,
          ...compositeState(st),
          depth: st.form_depth,
          marked_content: currentMarkedContent(),
        });
        break;
      }
      case "paintFormXObjectEnd":
        if (stack.length) st = stack.pop();
        break;

      case "beginGroup":
        groups.push({ op_index: i, info: a[0] ? { ...a[0], bbox: a[0].bbox ? r4a(Array.from(a[0].bbox)) : null } : null });
        break;
      case "endGroup":
        break;

      case "beginMarkedContentProps":
        markedContent.push({ tag: a[0], ocg_ids: ocgIdsOf(a[1]), op_index: i });
        break;
      case "beginMarkedContent":
        markedContent.push({ tag: a[0], ocg_ids: [], op_index: i });
        break;
      case "endMarkedContent":
        markedContent.pop();
        break;

      case "beginAnnotation":
        annotationDepth += 1;
        break;
      case "endAnnotation":
        annotationDepth -= 1;
        break;

      default:
        if (isOneOf(IMAGE_OP_NAMES, name)) {
          // An image XObject is painted into the unit square, so the CTM in force is
          // the placement.
          const unitBox = transformRect(st.ctm, [0, 0, 1, 1]);
          images.push({
            op_index: i,
            op_name: name,
            object_id: typeof a[0] === "string" ? a[0] : null,
            pixel_width: typeof a[1] === "number" ? a[1] : null,
            pixel_height: typeof a[2] === "number" ? a[2] : null,
            ctm: r4a(st.ctm),
            box_device: r4a(unitBox),
            fill_alpha: st.fill_alpha,
            ...compositeState(st),
            clip_stack: currentClips(),
            marked_content: currentMarkedContent(),
            form_depth: st.form_depth,
          });
        }
        break;
    }
  }

  return {
    page_index: page.index,
    // `view` is CropBox ∩ MediaBox, and it is the ONLY page box pdf.js puts on its
    // public surface. See PAGE_BOX_LIMITATION in file-intake-pdfjs.js.
    view: r4a(Array.from(page.view)),
    rotation: page.rotation,
    user_unit: page.user_unit,
    operator_count: fnArray.length,
    operator_names: opNames,
    text_runs: textRuns,
    paths,
    images,
    forms,
    groups,
  };
}
