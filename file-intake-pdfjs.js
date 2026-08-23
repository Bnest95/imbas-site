// file-intake-pdfjs.js — the only module in this lane that binds to a parser.
//
// ══ WHY THE BINDING IS ITS OWN MODULE ══════════════════════════════════════════
//
// file-graphics-walker.js and file-detectors.js are arithmetic over operands and
// import nothing. This module is where pdf.js enters, and keeping it separate is what
// lets the walk be exercised under node:test today and inside a Web Worker in Lane 3
// without two implementations drifting apart.
//
// pdfjsLib is INJECTED rather than imported, because the entry point differs by
// environment: node resolves `pdfjs-dist/legacy/build/pdf.mjs`, a browser worker wants
// `pdfjs-dist/build/pdf.mjs`. Injecting keeps that choice at the edge instead of
// hard-coding one environment's answer into a shared module.
//
// No node: imports here either. The caller supplies bytes; reading them off a disk or
// off an upload is the caller's problem, and in Lane 3 it will be the latter.
//
// The parser is pinned EXACTLY to 6.2.108 in package.json — the version the probe was
// run against. A parser is not an implementation detail of a measurement instrument:
// it is the instrument, and PARSER_VERSION travels into every result's identity so a
// finding can be re-derived against the same one.
//
// ══ THE ONE THING pdf.js WILL NOT TELL US ══════════════════════════════════════
//
// See PAGE_BOX_LIMITATION. It is stated as an exported constant rather than a comment
// so a consumer that needs a MediaBox finds the reason at the point of use.
//
// ══ standardFontDataUrl IS PART OF THE EVIDENCE PATH ═══════════════════════════
//
// It is required here, and readPdf throws without it, because omitting it does not
// fail — it DEGRADES. Measured on the vendored f13_tag_block fixture: with the
// standard font data reachable, the operator list returns the tag-block run as
// U+E0001 U+E0054 U+E0041 U+E0047 U+E007F. Without it, pdf.js resolves the same five
// glyphs to U+0001 U+0054 U+0041 U+0047 U+007F — the low seven bits, silently, behind
// a warning on a channel nobody reads. A walk that produced the second answer would
// look exactly like a walk that produced the first, and every codepoint claim built on
// it would be wrong. So the configuration that decides which one you get is an
// argument, not a default.

import { walkPageOperators } from "./file-graphics-walker.js";

export const PARSER_NAME = "pdfjs-dist";
export const PARSER_VERSION = "6.2.108";

// pdf.js exposes exactly one page box on its public surface: `page.view`, which the
// worker computes as CropBox ∩ MediaBox (falling back to MediaBox when there is no
// CropBox, which is also what the PDF specification says the default CropBox is).
// MediaBox itself lives on the worker side and never crosses to the API. So `view` is
// a sound CROP box in both branches, and the MediaBox is not recoverable from this
// parser at this version. Nothing in this lane reports a media box, because reporting
// `view` under that name would be a claim the parser never made.
export const PAGE_BOX_LIMITATION = Object.freeze({
  exposed: "view",
  definition: "CropBox ∩ MediaBox, or MediaBox when the page carries no CropBox",
  not_exposed: "MediaBox",
  parser: `${PARSER_NAME}@${PARSER_VERSION}`,
});

async function sha256Hex(bytes) {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function annotationRecords(annotations) {
  return annotations.map((a, i) => ({
    index: i,
    subtype: typeof a.subtype === "string" ? a.subtype : null,
    rect: Array.isArray(a.rect) ? Array.from(a.rect) : null,
    // An annotation carries text in more than one place. Each is recorded under the
    // key it came from rather than merged, because "which field of the annotation
    // carried this" is part of what the finding reports.
    contents: typeof a.contentsObj?.str === "string" && a.contentsObj.str !== "" ? a.contentsObj.str : null,
    title: typeof a.titleObj?.str === "string" && a.titleObj.str !== "" ? a.titleObj.str : null,
    field_name: typeof a.fieldName === "string" ? a.fieldName : null,
    field_value: typeof a.fieldValue === "string" && a.fieldValue !== "" ? a.fieldValue : null,
    hidden: a.hidden === true,
  }));
}

async function optionalContentRecords(doc) {
  const config = await doc.getOptionalContentConfig();
  if (!config) return [];
  const order = config.getOrder();
  if (!Array.isArray(order)) return [];
  const out = [];
  for (const id of order) {
    if (typeof id !== "string") continue;
    const group = config.getGroup(id);
    out.push({
      id,
      name: typeof group?.name === "string" ? group.name : null,
      visible: config.isVisible({ type: "OCG", id }) === true,
    });
  }
  return out;
}

/**
 * Parse a PDF and return the full evidence record: file identity, per-page walks over
 * the operator list, and the document-level surfaces that carry text no content
 * stream ever paints.
 *
 * @param {object} input
 * @param {*} input.pdfjsLib   the pdf.js module namespace
 * @param {Uint8Array} input.data
 * @param {string} input.standardFontDataUrl  required; see the header note
 * @returns {Promise<object>}
 */
export async function readPdf({ pdfjsLib, data, standardFontDataUrl }) {
  if (typeof standardFontDataUrl !== "string" || standardFontDataUrl === "") {
    throw new Error(
      "file-intake: standardFontDataUrl is required — without it pdf.js resolves tag-block codepoints to their low seven bits and the walk is silently degraded evidence.",
    );
  }
  const sha256 = await sha256Hex(data);
  const task = pdfjsLib.getDocument({
    // pdf.js transfers and then detaches the buffer it is handed, which would empty
    // the caller's array. A copy keeps the caller's bytes intact and keeps a second
    // read of the same file reproducible.
    data: new Uint8Array(data),
    standardFontDataUrl,
    useSystemFonts: false,
    isEvalSupported: false,
  });
  const doc = await task.promise;

  try {
    const metadata = await doc.getMetadata();
    const attachmentsRaw = await doc.getAttachments();
    const optional_content_groups = await optionalContentRecords(doc);

    // A page that cannot be walked is recorded rather than thrown, because the two
    // outcomes are different facts and a surface has to be able to tell them apart. A
    // document that will not open is a failed inspection. A document where nine pages
    // walked and the tenth did not is a PARTIAL inspection, and the nine results are
    // real. Aborting the file on the tenth would throw away established evidence and
    // leave a consumer unable to say which pages it actually covered — so `pages` holds
    // the walks that completed and `page_failures` names the ones that did not, with
    // the parser's own reason. Neither list is inferred from the other: their lengths
    // sum to page_count, and a consumer that reports whole-file coverage has to check.
    const pages = [];
    const page_failures = [];
    for (let n = 1; n <= doc.numPages; n++) {
      try {
        const page = await doc.getPage(n);
        const operatorList = await page.getOperatorList();
        const walk = walkPageOperators({
          operatorList,
          ops: pdfjsLib.OPS,
          page: { index: n - 1, view: page.view, rotation: page.rotate, user_unit: page.userUnit },
        });
        walk.annotations = annotationRecords(await page.getAnnotations({ intent: "display" }));
        pages.push(walk);
      } catch (err) {
        page_failures.push({ page_index: n - 1, reason: String(err?.message || err) });
      }
    }

    const attachments = Object.entries(attachmentsRaw || {}).map(([key, value]) => ({
      key,
      filename: typeof value?.filename === "string" ? value.filename : null,
      byte_length: value?.content ? value.content.length : 0,
    }));

    return {
      identity: {
        sha256,
        byte_size: data.length,
        parser_name: PARSER_NAME,
        parser_version: PARSER_VERSION,
      },
      page_count: doc.numPages,
      info: metadata.info ? { ...metadata.info } : {},
      xmp: metadata.metadata ? metadata.metadata.getRaw() : null,
      // pdf.js parses the XMP packet into a map and exposes it only through the
      // iterator — `get(name)` needs a key you already know, and getAll() does not
      // exist at this version. Enumerating here is what lets a consumer report XMP
      // fields without a second XML parser entering the evidence path.
      xmp_fields: metadata.metadata ? Object.fromEntries([...metadata.metadata]) : {},
      attachments,
      optional_content_groups,
      pages,
      page_failures,
    };
  } finally {
    await task.destroy();
  }
}
