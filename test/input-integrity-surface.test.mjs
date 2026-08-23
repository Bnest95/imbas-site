// input-integrity-surface — the view model and the exported receipt, over the whole corpus.
//
// ══ WHAT THIS FILE IS RESPONSIBLE FOR ══════════════════════════════════════════
//
// file-view.js decides everything a person reads: which group a finding lands in, what
// its locator says, whether it earns a two-reading contrast, which coverage state the run
// is in, what the zero state claims, and what the downloadable receipt carries. None of
// that touches a DOM, so all of it is decidable here rather than in a browser.
//
// The browser receipt (scripts/qa/input-integrity-path.mjs) proves the seams this file
// cannot reach: that a module worker starts under the production policy, that pdf.js runs
// inside it, that a real File through a real <input> comes out as rendered sentences, and
// that nothing carrying file bytes goes to the network. The two are complements. Neither
// is a substitute for the other, and both run.
//
// ══ THE REGISTER SEPARATION IS TESTED IN BOTH DIRECTIONS ═══════════════════════
//
// file-result.js is a deliberate sibling of reader-result.js sharing no vocabulary. This
// file asserts the two laws that follow, against the strings the surface actually ships
// rather than against the type declarations:
//
//   no PHENOMENON_CLASS string may reach a Reader result, and
//   no FINDING_CLASS string may reach a file result.
//
// Run: node --test test/input-integrity-surface.test.mjs

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

import { readPdf } from "../file-intake-pdfjs.js";
import { detectFileFindings } from "../file-detectors.js";
import { PHENOMENON_CLASS_IDS } from "../file-result.js";
import { FINDING_CLASSES } from "../reader-result.js";
import { FILE_TEMPLATES } from "../file-templates.js";
import {
  FILE_VIEW_VERSION,
  RECEIPT_SCHEMA_VERSION,
  buildReceipt,
  buildView,
  contrastOf,
  coverageSentences,
  deriveCoverage,
  failedView,
  groupOf,
  locatorOf,
  unavailableView,
} from "../file-view.js";
import * as COPY from "../file-surface-copy.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = path.join(HERE, "fixtures", "file-intake");
const STANDARD_FONT_DIR = path.join(HERE, "..", "node_modules", "pdfjs-dist", "standard_fonts") + path.sep;

const FIXTURES = fs.readdirSync(FIXTURE_DIR).filter((n) => n.endsWith(".pdf")).sort();

const cache = new Map();
async function viewOf(file) {
  if (!cache.has(file)) {
    const bytes = fs.readFileSync(path.join(FIXTURE_DIR, file));
    const record = await readPdf({ pdfjsLib, data: new Uint8Array(bytes), standardFontDataUrl: STANDARD_FONT_DIR });
    const detection = detectFileFindings({ record });
    cache.set(file, { view: buildView({ fileName: file, byteSize: bytes.length, detection, record }), bytes, record });
  }
  return cache.get(file);
}

async function allViews() {
  const out = [];
  for (const file of FIXTURES) out.push({ file, ...(await viewOf(file)) });
  return out;
}

// ── The corpus, end to end ──────────────────────────────────────────────────────

test("RECEIPT: every vendored fixture builds a view, and the corpus reaches every group", async () => {
  const views = await allViews();
  assert.equal(views.length, 33, "the fixture corpus changed size — re-read this file before pinning the new one");

  const groups = new Set();
  let items = 0;
  let zero = 0;
  for (const { view } of views) {
    assert.equal(view.state, "read");
    items += view.surfaced_count;
    if (view.surfaced_count === 0) zero += 1;
    for (const g of view.groups) groups.add(g.id);
  }

  // Pinned. A detector or template change that moves these numbers lands the author here,
  // which is where the decision belongs.
  assert.deepEqual([...groups].sort(), ["container", "control_codepoints", "measured", "no_paint"]);
  assert.equal(items, 28);
  assert.equal(zero, 17);
});

test("a group's membership is a schema fact, and the four groups partition every item", async () => {
  for (const { file, view } of await allViews()) {
    for (const item of view.items) {
      assert.equal(item.group, groupOf({ class_label: item.class_label, ...findingOf(view, item) }), file);
      assert.ok(COPY.GROUP_IDS.includes(item.group), `${file}: ${item.group} is not a declared group`);
    }
    const grouped = view.groups.reduce((n, g) => n + g.items.length, 0);
    assert.equal(grouped, view.items.length, `${file}: items were lost or duplicated across groups`);
  }
});

function findingOf(view, item) {
  return {
    class_label: item.class_label,
    extraction: item.extraction,
    graphics_state: item.graphics_state,
    checks_run: item.checks_run,
    thresholds_applied: item.thresholds_applied,
  };
}

test("groups render in the declared order and never invent one", async () => {
  for (const { file, view } of await allViews()) {
    const order = view.groups.map((g) => g.id);
    const expected = COPY.GROUP_IDS.filter((id) => order.includes(id));
    assert.deepEqual(order, expected, file);
  }
});

// ── The human template leads ────────────────────────────────────────────────────

test("every item leads with a sentence from the closed template registry, never a class label", async () => {
  const authored = new Set(FILE_TEMPLATES.map((t) => t.id));
  for (const { file, view } of await allViews()) {
    for (const item of view.items) {
      assert.ok(item.statements.length > 0, `${file}: ${item.class_label} rendered no sentence`);
      const lead = item.statements[0].string;
      assert.ok(lead.length > 0);
      assert.ok(!PHENOMENON_CLASS_IDS.includes(lead), `${file}: the lead is a class label`);
      assert.ok(!authored.has(lead), `${file}: the lead is a template id`);
      // A sentence, not an identifier: it ends in a full stop and carries a space.
      assert.match(lead, /^[A-Z].*\.$/s, `${file}: ${JSON.stringify(lead)} does not read as a sentence`);
      assert.ok(lead.includes(" "));
    }
  }
});

// ── Locators never fabricate ────────────────────────────────────────────────────

test("a locator carries only what the finding established, and no key stands undefined", async () => {
  for (const { file, view } of await allViews()) {
    for (const item of view.items) {
      const loc = item.locator;
      for (const [key, value] of Object.entries(loc)) {
        assert.notEqual(value, undefined, `${file}: locator.${key} is undefined`);
        assert.notEqual(value, null, `${file}: locator.${key} is null`);
      }
      // A page number is derived from the index or absent. It is never guessed.
      if ("page_number" in loc) assert.equal(loc.page_number, loc.page_index + 1, file);
      else assert.ok(!("page_index" in loc), file);

      // Everything in the locator traces to the finding's own record.
      const source = { ...item.extraction, ...item.graphics_state };
      for (const key of ["container_kind", "annotation_subtype", "metadata_key", "ocg_name", "effective_size_pt"]) {
        if (key in loc) assert.deepEqual(loc[key], source[key], `${file}: locator.${key} was not measured`);
      }
    }
  }
});

test("a finding with no measured location gets no locator row rather than a placeholder", () => {
  const bare = {
    class_label: "metadata_text",
    extraction: { text: "x", codepoints: [120] },
    graphics_state: { container_kind: "metadata", metadata_key: "Subject" },
  };
  assert.deepEqual(locatorOf(bare), { container_kind: "metadata", metadata_key: "Subject" });
  assert.ok(!("page_index" in locatorOf(bare)));
  assert.ok(!("position" in locatorOf(bare)));
});

// ── The two-reading contrast ────────────────────────────────────────────────────

test("a contrast is offered only where both sides share a referent", async () => {
  for (const { file, view } of await allViews()) {
    for (const item of view.items) {
      const loc = item.locator;
      const eligible = "page_index" in loc && ("position" in loc || "text_bbox" in loc);
      assert.equal(!!item.contrast, eligible, `${file}: ${item.class_label} contrast eligibility`);
      if (!item.contrast) continue;
      assert.equal(item.contrast.page_index, loc.page_index);
      assert.equal(item.contrast.page_number, loc.page_number);
      for (const [key, value] of Object.entries(item.contrast)) {
        assert.notEqual(value, undefined, `${file}: contrast.${key} is undefined`);
      }
    }
  }
});

test("a metadata finding has no page, so it earns no side-by-side pair", () => {
  assert.equal(contrastOf({ class_label: "metadata_text", extraction: { text: "x" }, graphics_state: { metadata_key: "Subject" } }), null);
});

test("a finding with a page but no in-page location earns no pair either", () => {
  assert.equal(contrastOf({ class_label: "hidden_ocg_text", extraction: { page_index: 0, text: "x" }, graphics_state: { ocg_name: "Layer" } }), null);
});

// ── Coverage: three states, and only what the record establishes ────────────────

test("a file whose pages all walked is complete, and says how many it read", async () => {
  const { view } = await viewOf("f01_rendermode3.pdf");
  assert.equal(view.coverage.state, "complete");
  assert.deepEqual(view.coverage.pages_failed, []);
  assert.equal(view.coverage_copy.label, "Complete");
  assert.equal(view.coverage_copy.statement, "This run inspected 1 page, and every page was read.");
  assert.deepEqual(view.coverage_copy.pages, []);
});

test("a partial run names both sides of the count and never uses whole-file language", () => {
  const coverage = deriveCoverage({
    page_count: 3,
    pages: [{ page_index: 0 }, { page_index: 2 }],
    page_failures: [{ page_index: 1, reason: "stream must have data" }],
  });
  assert.equal(coverage.state, "partial");
  assert.deepEqual(coverage.pages_inspected_numbers, [1, 3]);

  const copy = coverageSentences(coverage);
  assert.equal(copy.label, "Partial");
  assert.equal(copy.statement, "This run inspected 2 of 3 pages. The rest could not be read.");
  assert.deepEqual(copy.pages, ["Page 2 could not be read. The parser reported: stream must have data"]);

  // The three phrases that would imply coverage it does not have.
  const all = [copy.statement, ...copy.pages].join(" ");
  for (const phrase of ["every page", "the whole file", "all pages", "the entire"]) {
    assert.ok(!all.toLowerCase().includes(phrase), `partial coverage claimed "${phrase}"`);
  }
});

test("a page that failed to walk moves the state off complete on its own", () => {
  const coverage = deriveCoverage({
    page_count: 2,
    pages: [{ page_index: 0 }, { page_index: 1 }],
    page_failures: [{ page_index: 1, reason: "bad operator list" }],
  });
  assert.equal(coverage.state, "partial");
});

test("a parse failure is a third state, and renders nothing that could read as a finding", () => {
  const view = failedView("broken.pdf", "Invalid PDF structure.");
  assert.equal(view.state, "failed");
  assert.equal(view.file_name, "broken.pdf");
  assert.equal(view.label, "Not read");
  assert.equal(view.statement, "This file could not be read. The parser reported: Invalid PDF structure.");
  for (const key of ["items", "groups", "surfaced_count", "zero_reportable", "coverage"]) {
    assert.ok(!(key in view), `a failed view carries ${key}, which a renderer could read as a result`);
  }
  assert.equal(view.establishes.body, COPY.ESTABLISHES.body);
});

test("a browser that could not start the reader is a fourth state, and names no parser", () => {
  const view = unavailableView();
  assert.equal(view.state, "unavailable");
  assert.ok(!("file_name" in view));
  assert.equal(view.statement, "The inspection did not start in this browser. No file was read.");
  assert.ok(!view.statement.includes("parser"), "an unavailable view must not report a parser that never ran");
  for (const key of ["items", "groups", "surfaced_count", "coverage"]) {
    assert.ok(!(key in view));
  }
});

// ── Zero-reportable ─────────────────────────────────────────────────────────────

test("a file where nothing qualified reaches a complete state that claims nothing about the document", async () => {
  const { view } = await viewOf("c1_nocrop.pdf");
  assert.equal(view.surfaced_count, 0);
  assert.deepEqual(view.items, []);
  assert.deepEqual(view.groups, []);
  assert.equal(view.coverage.state, "complete");
  assert.equal(view.surfaced_count_copy, "0 items surfaced.");

  const zero = view.zero_reportable;
  assert.equal(zero.statement, "No phenomenon surfaced under the checks that ran.");
  assert.equal(
    zero.scope,
    "Those checks describe eleven structural properties of a PDF. Other structure may exist in this file " +
      "that they do not describe.",
  );
});

test("the zero state never implies the document is safe, clean, ordinary, verified, or complete in itself", () => {
  const words = ["safe", "clean", "ordinary", "verified", "secure", "trusted", "harmless", "no issues", "all clear", "nothing wrong"];
  const text = `${COPY.ZERO_REPORTABLE.statement} ${COPY.ZERO_REPORTABLE.scope}`.toLowerCase();
  for (const word of words) assert.ok(!text.includes(word), `the zero state says "${word}"`);
  // It must positively state its own scope rather than leaving it to inference.
  assert.ok(COPY.ZERO_REPORTABLE.scope.includes("Other structure may exist"));
});

test("a zero-finding file and a file that would not open are different objects", async () => {
  const { view } = await viewOf("c1_nocrop.pdf");
  const failed = failedView("c1_nocrop.pdf", "Invalid PDF structure.");
  assert.notEqual(view.state, failed.state);
  assert.ok(view.zero_reportable !== null);
  assert.ok(!("zero_reportable" in failed));
});

// ── Omitted measurement renders nothing ─────────────────────────────────────────

test("a measurement the parser did not take produces no sentence and no row", async () => {
  for (const { file, view } of await allViews()) {
    for (const item of view.items) {
      for (const [key, value] of Object.entries(item.graphics_state)) {
        assert.notEqual(value, undefined, `${file}: graphics_state.${key} is undefined`);
      }
      for (const statement of item.statements) {
        assert.ok(!/undefined|NaN|null|\[object Object\]/.test(statement.string),
          `${file}: ${JSON.stringify(statement.string)} rendered a missing value`);
      }
    }
  }
});

test("a scoped negative is per-finding, never per-file", async () => {
  const { view } = await viewOf("f09_metadata_text.pdf");
  assert.ok(view.items.length > 1);
  for (const item of view.items) {
    assert.ok(Array.isArray(item.checks_run) && item.checks_run.length > 0);
  }
  // The file-level view carries no checks_run of its own, so nothing can render one
  // sentence about the whole document from a per-finding scope.
  assert.ok(!("checks_run" in view));
  assert.ok(!("thresholds_applied" in view));
});

// ── The register separation, both directions ────────────────────────────────────

test("no PHENOMENON_CLASS string reaches a Reader result", () => {
  const readerClasses = new Set(Object.keys(FINDING_CLASSES));
  for (const id of PHENOMENON_CLASS_IDS) {
    assert.ok(!readerClasses.has(id), `${id} is both a phenomenon class and a Reader finding class`);
  }
});

test("no FINDING_CLASS string reaches a file result, in any rendered sentence or receipt field", async () => {
  const readerClasses = Object.keys(FINDING_CLASSES);
  for (const { file, view } of await allViews()) {
    const receipt = buildReceipt({ view, generatedAt: "2026-08-23T00:00:00.000Z" });
    const serialized = JSON.stringify({ view, receipt });
    for (const id of readerClasses) {
      assert.ok(!serialized.includes(`"${id}"`), `${file}: the Reader finding class ${id} reached a file result`);
    }
  }
});

test("the two registries are disjoint by construction, so neither can drift into the other", () => {
  const overlap = PHENOMENON_CLASS_IDS.filter((id) => id in FINDING_CLASSES);
  assert.deepEqual(overlap, []);
  assert.ok(PHENOMENON_CLASS_IDS.length > 0);
  assert.ok(Object.keys(FINDING_CLASSES).length > 0);
});

// ── The exportable receipt ──────────────────────────────────────────────────────

test("the receipt carries the governed fields, and the version is pinned", async () => {
  const { view } = await viewOf("f01_rendermode3.pdf");
  const receipt = buildReceipt({ view, generatedAt: "2026-08-23T00:00:00.000Z" });

  assert.equal(RECEIPT_SCHEMA_VERSION, "file-receipt.v1");
  assert.equal(FILE_VIEW_VERSION, "file-view.v1");
  assert.deepEqual(Object.keys(receipt).sort(), [
    "coverage", "file", "generated_at", "limitations", "receipt_schema_version", "surfaced", "thresholds_available",
  ]);
  assert.deepEqual(Object.keys(receipt.file).sort(), [
    "byte_size", "name", "parser_name", "parser_version", "predicate_versions", "sha256",
  ]);
  assert.equal(receipt.file.parser_name, "pdfjs-dist");
  assert.equal(receipt.file.parser_version, "6.2.108");
  assert.equal(receipt.generated_at, "2026-08-23T00:00:00.000Z");
});

test("the receipt's digest is the digest of the bytes on disk", async () => {
  const { view, bytes } = await viewOf("f01_rendermode3.pdf");
  const receipt = buildReceipt({ view, generatedAt: "2026-08-23T00:00:00.000Z" });
  assert.equal(receipt.file.sha256, crypto.createHash("sha256").update(bytes).digest("hex"));
});

test("no source-PDF content reaches the receipt, for any fixture in the corpus", async () => {
  for (const { file, view, bytes } of await allViews()) {
    const json = JSON.stringify(buildReceipt({ view, generatedAt: "2026-08-23T00:00:00.000Z" }));

    assert.ok(!json.includes("%PDF-"), `${file}: a PDF header reached the receipt`);
    for (const keyword of ["endobj", "endstream", "xref", "trailer", "/Contents", "stream\n"]) {
      assert.ok(!json.includes(keyword), `${file}: the PDF keyword ${keyword} reached the receipt`);
    }
    assert.ok(!json.includes(bytes.toString("base64").slice(0, 48)), `${file}: the source bytes are base64 in the receipt`);
    assert.ok(!json.includes(bytes.toString("hex").slice(0, 48)), `${file}: the source bytes are hex in the receipt`);
  }
});

test("the extracted spans DO reach the receipt, because a statement without its evidence is unverifiable", async () => {
  const { view } = await viewOf("f01_rendermode3.pdf");
  const receipt = buildReceipt({ view, generatedAt: "2026-08-23T00:00:00.000Z" });
  assert.equal(receipt.surfaced.length, 1);
  assert.equal(receipt.surfaced[0].extracted_text, "INVISIBLE-MODE3");
  assert.ok(receipt.surfaced[0].extracted_codepoints.length > 0);
  assert.equal(receipt.surfaced[0].anchor, view.items[0].anchor);
});

test("the receipt states what the run could not establish, and a zero-finding one states its scope too", async () => {
  const found = buildReceipt({ view: (await viewOf("f01_rendermode3.pdf")).view, generatedAt: "t" });
  assert.ok(found.limitations.includes(COPY.ESTABLISHES.body));
  assert.ok(found.limitations.includes(COPY.BOUNDARY.statement));
  assert.ok(found.limitations.includes(COPY.BOUNDARY.denials));
  assert.equal(found.limitations.length, 3);

  const empty = buildReceipt({ view: (await viewOf("c1_nocrop.pdf")).view, generatedAt: "t" });
  assert.ok(empty.limitations.includes(COPY.ZERO_REPORTABLE.scope));
  assert.equal(empty.limitations.length, 4);
});

test("a partial run's receipt names the pages it read and the pages it did not", () => {
  const view = {
    file_name: "p.pdf", byte_size: 10,
    identity: { sha256: "0".repeat(64), parser_name: "pdfjs-dist", parser_version: "6.2.108", predicate_versions: {} },
    thresholds: {},
    coverage: deriveCoverage({
      page_count: 3,
      pages: [{ page_index: 0 }, { page_index: 2 }],
      page_failures: [{ page_index: 1, reason: "stream must have data" }],
    }),
    items: [], zero_reportable: COPY.ZERO_REPORTABLE,
  };
  const receipt = buildReceipt({ view, generatedAt: "t" });
  assert.equal(receipt.coverage.state, "partial");
  assert.deepEqual(receipt.coverage.pages_inspected, [1, 3]);
  assert.deepEqual(receipt.coverage.pages_failed, [{ page: 2, reason: "stream must have data" }]);
});

// ── No severity, no ranking, no intent ──────────────────────────────────────────

test("nothing the surface renders invents severity, risk, maliciousness, or intent", async () => {
  const banned = /\b(severity|severe|risk|risky|score|ranked?|ranking|priority|critical|dangerous|threat|malicious|attack|exploit|suspicious|intent|deliberate|deliberately|attempts? to|designed to|tries to|wants to)\b/i;
  for (const { file, view } of await allViews()) {
    const strings = [
      view.surfaced_count_copy,
      view.coverage_copy.label,
      view.coverage_copy.statement,
      ...view.coverage_copy.pages,
      view.provenance_statement,
      ...view.groups.flatMap((g) => [g.heading, g.note]),
      ...view.items.flatMap((i) => i.statements.map((s) => s.string)),
    ];
    for (const s of strings) {
      assert.ok(!banned.test(s), `${file}: ${JSON.stringify(s)} carries a severity or intent word`);
    }
  }
});

test("items keep detector order inside a group, so nothing reads as a ranking", async () => {
  for (const { file, view } of await allViews()) {
    for (const group of view.groups) {
      const positions = group.items.map((item) => view.items.indexOf(item));
      assert.deepEqual(positions, [...positions].sort((a, b) => a - b), file);
    }
  }
});

// ── Anchors ─────────────────────────────────────────────────────────────────────

test("every anchor is unique within a file and stable across two builds of the same file", async () => {
  for (const { file, view } of await allViews()) {
    const anchors = view.items.map((i) => i.anchor);
    assert.equal(new Set(anchors).size, anchors.length, `${file}: duplicate anchors`);
    for (const anchor of anchors) assert.match(anchor, /^item-\d+-[a-z0-9_]+$/);
  }

  const bytes = fs.readFileSync(path.join(FIXTURE_DIR, "f09_metadata_text.pdf"));
  const record = await readPdf({ pdfjsLib, data: new Uint8Array(bytes), standardFontDataUrl: STANDARD_FONT_DIR });
  const again = buildView({
    fileName: "f09_metadata_text.pdf",
    byteSize: bytes.length,
    detection: detectFileFindings({ record }),
    record,
  });
  const first = (await viewOf("f09_metadata_text.pdf")).view;
  assert.deepEqual(again.items.map((i) => i.anchor), first.items.map((i) => i.anchor));
});
