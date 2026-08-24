// file-surface-copy — the surface's whole copy space, and the markup that carries it.
//
// ══ WHY THIS FILE EXISTS ALONGSIDE file-vocab-lint ═════════════════════════════
//
// file-vocab-lint.test.mjs lints the COMPLETE output space of file-templates.js, and that
// closure is what makes the claim exhaustive rather than representative. The Input
// Integrity surface needs sentences the template registry does not hold — a boundary
// line, a coverage state, a group heading, a refusal — and copy written straight into
// input-integrity.html would sit outside every lint that governs this lane.
//
// So the surface gets the same treatment, and this file is the enforcement:
//
//   1. Every string file-surface-copy.js can render passes all three lint lanes.
//   2. The rendered space reaches every exported string-producing function, so a new
//      one cannot be added without a path into the lint.
//   3. Every authored sentence in input-integrity.html carries a data-copy key, and the
//      text in the markup EQUALS the registry value that key names. The page cannot
//      drift from the registry without failing here.
//   4. No sentence-bearing text sits in the page's own <main> outside a data-copy
//      element. That is the assertion that makes (3) exhaustive rather than a sample.
//   5. The epistemic boundary holds across the whole space: no string claims what an AI
//      system, an ingestion pipeline, or a person received.
//
// Run: node --test test/file-surface-copy.test.mjs

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { lintFileStrings } from "../file-vocab.js";
import {
  lintUserFacingStrings,
  lintChipStrings,
  CHIP_VOCAB_SCOPE,
  chipVocabGoverns,
} from "../reader-check-vocab.js";
import * as COPY from "../file-surface-copy.js";
import {
  renderConclusionById,
  CONCLUSION_TEMPLATES,
  renderCompleteConclusionSpace,
} from "../file-templates.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PAGE = fs.readFileSync(path.join(ROOT, "input-integrity.html"), "utf8");

// The name this surface answers to inside a vocabulary lane's declared scope. Written
// once here and read from the lane, so the two cannot drift apart silently.
const SURFACE_ID = "input-integrity-surface";

const SPACE = COPY.renderCompleteCopySpace();
const STRINGS = SPACE.map((r) => r.string);

// ── (1) three lanes, over the whole space ───────────────────────────────────────

test("the registry is versioned", () => {
  assert.match(COPY.FILE_SURFACE_COPY_VERSION, /^file-surface-copy\.v\d+$/);
});

test("EXHAUSTIVE: every string the surface can render passes file-vocab.v1", () => {
  const violations = lintFileStrings(STRINGS);
  assert.deepEqual(violations, [], `file-vocab.v1 violations:\n${JSON.stringify(violations, null, 2)}`);
});

test("EXHAUSTIVE: every string also passes the main lane (check-vocab.v2)", () => {
  const violations = lintUserFacingStrings(STRINGS);
  assert.deepEqual(violations, [], `check-vocab.v2 violations:\n${JSON.stringify(violations, null, 2)}`);
});

// ── the third lane, and why it is not run over this surface ─────────────────────
//
// chip-vocab.v1 is a THIRD register with its own jurisdiction, declared in
// reader-check-vocab.js as CHIP_VOCAB_SCOPE. It governs surfaces that describe a
// change to a person without speaking as the instrument. This surface IS the
// instrument, so the lane does not govern it, and that is a boundary rather than an
// exemption: "surfaced" is the accurate verb for what a parser did to a structural
// property, and an inspection instrument must not avoid the accurate word to satisfy a
// rule written for a surface that is not an instrument.
//
// Recorded rather than silently dropped, because "we ran two of the three lanes" reads
// as an oversight a year from now. What is asserted is the SCOPE, not a list of strings
// the lane happens to dislike — a list of known exceptions decays into a list nobody
// can tell from a list of defects.
test("chip-vocab.v1 does not govern this surface, and says so where the lane is defined", () => {
  assert.equal(CHIP_VOCAB_SCOPE.lane, "chip-vocab.v1");
  assert.ok(
    CHIP_VOCAB_SCOPE.does_not_govern.includes(SURFACE_ID),
    `${SURFACE_ID} is not named in chip-vocab.v1's declared scope`,
  );
  assert.equal(chipVocabGoverns(SURFACE_ID), false);
  // The lane's own jurisdiction is non-empty, so "does not govern" is a boundary
  // between two named surfaces and not a lane that governs nothing at all.
  assert.ok(CHIP_VOCAB_SCOPE.governs.length > 0);
  assert.ok(!CHIP_VOCAB_SCOPE.governs.includes(SURFACE_ID));
});

// The lane still runs, as a tripwire on the boundary itself. Every hit must be
// attributable to the two rule categories that are jurisdictional by construction —
// the ones that exist because a chip is not an instrument. A hit in the third category
// (quantified_improvement) is not a jurisdiction question: this surface must never
// claim a percentage improvement either, so that one would be a real defect and fails
// here.
test("no chip-lane hit on this surface falls outside the two jurisdictional rules", () => {
  const violations = lintChipStrings(STRINGS);
  const outside = violations.filter(
    (v) => v.category !== "construct_vocab" && v.category !== "imbas_action_claim",
  );
  assert.deepEqual(outside, [], `a chip-vocab.v1 hit this surface must answer for:\n${JSON.stringify(outside, null, 2)}`);
});

// ── (2) the claim is exhaustive ─────────────────────────────────────────────────

test("every exported string-producing function has a path into the linted space", () => {
  const coverage = COPY.copySpaceCoverage();
  assert.deepEqual(coverage.unreached_functions, [],
    `these functions render strings nothing lints: ${coverage.unreached_functions.join(", ")}`);
  assert.equal(coverage.rendered_strings, STRINGS.length);
});

test("every exported string constant reaches the space too", () => {
  // Walked off the module rather than off a list, so a new exported group cannot be
  // added without either appearing here or failing this test.
  const covered = new Set(SPACE.map((r) => r.string));
  const missing = [];
  for (const [name, value] of Object.entries(COPY)) {
    if (typeof value === "string") {
      if (name.endsWith("_VERSION")) continue;
      if (!covered.has(value)) missing.push(name);
      continue;
    }
    if (typeof value !== "object" || value === null || Array.isArray(value)) continue;
    for (const [key, inner] of Object.entries(value)) {
      if (typeof inner === "string" && !covered.has(inner)) missing.push(`${name}.${key}`);
      if (inner && typeof inner === "object") {
        for (const [k2, v2] of Object.entries(inner)) {
          if (typeof v2 === "string" && !covered.has(v2)) missing.push(`${name}.${key}.${k2}`);
        }
      }
    }
  }
  assert.deepEqual(missing, [], `these exported strings are outside the linted space: ${missing.join(", ")}`);
});

test("RECEIPT: the space is 63 strings", () => {
  // Pinned on purpose. A string added without re-reading this file lands the author in
  // the receipt, which is where the decision belongs.
  assert.equal(STRINGS.length, 63);
});

// ── (2b) this module CONSUMES the instrument's conclusions, it does not own them ─
//
// Every sentence whose truth depends on evidence from the run is generated by a
// governed template in file-templates.js. This module is the consumption point, and
// these tests are what makes "consumes rather than owns" checkable instead of a claim
// in a header comment.
//
// The failure this prevents is specific and has happened once already on this surface:
// a conclusion authored here reads exactly like a conclusion generated there, and the
// difference only shows up when someone edits the prose without the lint noticing.

test("every conclusion the surface renders is byte-identical to what the registry renders", () => {
  // Not "similar", not "passes the same lint" — the same string. If these two ever
  // diverge, one of them is an authored sentence wearing the registry's clothes.
  for (const consumer of COPY.CONCLUSION_CONSUMERS) {
    const fromRegistry = renderConclusionById(consumer.template_id, consumer.subject);
    assert.equal(typeof fromRegistry, "string",
      `${consumer.template_id} rendered nothing for its declared subject`);

    const [fnName, member] = consumer.fn.split(".");
    const fn = COPY[fnName];
    assert.equal(typeof fn, "function", `${consumer.fn} is not an exported function`);
    assert.ok(Array.isArray(consumer.args), `${consumer.fn} declares no call arguments`);
    const produced = member ? fn(...consumer.args)[member] : fn(...consumer.args);

    assert.equal(produced, fromRegistry,
      `${consumer.fn} does not render its template verbatim:\n` +
      `  surface:  ${JSON.stringify(produced)}\n` +
      `  registry: ${JSON.stringify(fromRegistry)}`);
  }
});

test("no conclusion template is declared and then left unconsumed", () => {
  // The registry is the authority on what conclusions exist. If a template lands there
  // and nothing here reaches it, the surface has a sentence it can never say — which
  // is a gap, not a safety margin.
  const declared = CONCLUSION_TEMPLATES.map((t) => t.id).sort();
  const consumed = [...new Set(COPY.CONSUMED_CONCLUSION_IDS)].sort();
  assert.deepEqual(consumed, declared,
    "the conclusion registry and this surface's consumption points disagree");
});

test("this module authors no sentence that depends on run evidence", () => {
  // The dividing line, stated as a test. A string constant is fine when it is true
  // before any file arrives — a heading, a label, a scope disclosure like "This run
  // establishes what the local parser recovered", which is a statement about what this
  // KIND of run can establish and is written before any file exists. It is NOT fine
  // when the sentence reports a result, because a result is an instrument claim and
  // instrument claims are generated from the registry.
  //
  // So each pattern names a conclusion together with its SUBJECT. That distinction is
  // load-bearing: "What surfaced" is a section heading and stays a constant here, while
  // "0 items surfaced." reports a count and must come from the registry. A pattern
  // matching a bare verb would not be able to tell those two apart.
  const fromRegistry = new Set(renderCompleteConclusionSpace().map((r) => r.string));
  const REPORTS_A_RESULT = [
    /\bthis run inspected\b/i,
    /\bthe parser reported\b/i,
    /\b\d+ items? surfaced\b/i,
    /\bno phenomenon surfaced\b/i,
    /\b(?:this file|this page|page \d+)\b[^.]*\bcould not be (?:read|drawn)\b/i,
    /\bthe inspection did not start\b/i,
  ];

  // The tripwire must be live. A pattern set that matched nothing would pass this test
  // forever while an authored conclusion sat next to it, so the patterns are first
  // checked against the registry's own sentences — the strings they are known to
  // describe. Eleven of the twelve report a result; the twelfth is the zero state's
  // scope disclosure, which states what the checks describe rather than what this run
  // found, and is correctly not result-shaped.
  const matchedInRegistry = [...fromRegistry].filter((s) =>
    REPORTS_A_RESULT.some((re) => re.test(s)));
  assert.equal(matchedInRegistry.length, 11,
    "the patterns no longer describe the registry's own conclusions, so this test " +
    "would pass without checking anything");

  const offenders = SPACE
    .filter((r) => REPORTS_A_RESULT.some((re) => re.test(r.string)))
    .filter((r) => !fromRegistry.has(r.string))
    .map((r) => ({ source: r.source, string: r.string }));

  assert.deepEqual(offenders, [],
    "these read as run conclusions but are authored outside the template registry:\n" +
    JSON.stringify(offenders, null, 2));
});

// ── (3) and (4) the markup carries the registry, and nothing else ───────────────

// The value a data-copy key names, resolved off the module by dotted path.
function resolve(key) {
  let node = COPY;
  for (const part of key.split(".")) {
    if (node === undefined || node === null) return undefined;
    node = node[part];
  }
  return node;
}

// Elements carrying data-copy, with the text between their tags. The surface's markup is
// flat by construction — every data-copy element holds text and no child elements — so a
// regex is the honest tool here rather than a parser this repository does not carry.
function copyElements(html) {
  const out = [];
  const re = /<([a-z0-9]+)\b[^>]*\bdata-copy="([^"]+)"[^>]*>([\s\S]*?)<\/\1>/g;
  let m;
  while ((m = re.exec(html)) !== null) out.push({ tag: m[1], key: m[2], text: m[3].trim() });
  return out;
}

const MAIN = PAGE.slice(PAGE.indexOf("<main"), PAGE.indexOf("</main>"));

test("every data-copy key resolves to a string in the registry", () => {
  const elements = copyElements(MAIN);
  assert.ok(elements.length > 0, "the page carries no data-copy elements at all");
  for (const el of elements) {
    const value = resolve(el.key);
    assert.equal(typeof value, "string", `data-copy="${el.key}" names nothing in file-surface-copy.js`);
  }
});

test("the sentence in the markup EQUALS the registry value its key names", () => {
  for (const el of copyElements(MAIN)) {
    const value = resolve(el.key);
    // Markup wraps long sentences across lines; the registry holds one line. Compare on
    // collapsed whitespace, and only on whitespace, so a word change still fails.
    const inPage = el.text.replace(/\s+/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'");
    assert.equal(inPage, value.replace(/\s+/g, " "), `data-copy="${el.key}" drifted from the registry`);
  }
});

// Only the strata a reader meets before choosing a file are authored here. Everything in
// the result region is rendered by input-integrity.js out of the same registry.
test("RECEIPT: the page carries 12 authored sentences, every one of them from the registry", () => {
  const elements = copyElements(MAIN);
  assert.equal(elements.length, 12);
  assert.deepEqual(
    elements.map((e) => e.key),
    [
      "MASTHEAD.eyebrow",
      "MASTHEAD.title",
      "MASTHEAD.lede",
      "BOUNDARY.statement",
      "BOUNDARY.denials",
      "INTAKE.prompt",
      "INTAKE.limit",
      "INTAKE.choose",
      "INTAKE.custody",
      "INTAKE.sample_action",
      "INTAKE.sample_note",
      "INTAKE.processing",
    ],
  );
});

test("no sentence-bearing text sits in <main> outside a data-copy element", () => {
  // Strip every data-copy element whole, then every remaining tag, and look at what text
  // is left. Anything with a space and a letter is a sentence somebody authored outside
  // the registry — which is the hole this whole registry exists to close.
  const stripped = MAIN.replace(/<([a-z0-9]+)\b[^>]*\bdata-copy="[^"]+"[^>]*>[\s\S]*?<\/\1>/g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]+>/g, "\n");

  const leftovers = stripped
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => /[A-Za-z]/.test(s) && s.includes(" "));

  assert.deepEqual(leftovers, [], `authored outside the registry: ${JSON.stringify(leftovers)}`);
});

test("the page's own strings are the ones the surface ships, and the boundary is on it", () => {
  assert.ok(MAIN.includes(COPY.BOUNDARY.statement));
  assert.ok(MAIN.includes(COPY.BOUNDARY.denials));
  assert.ok(MAIN.includes(COPY.INTAKE.custody));
  assert.ok(MAIN.includes(COPY.INTAKE.limit));
});

// ── (5) the epistemic boundary ──────────────────────────────────────────────────

test("no string in the space claims what an AI, a pipeline, or a person received", () => {
  const banned = [
    /what the (ai|model|machine|system) (saw|received|read)/i,
    /the (ai|model) (saw|received|never saw|did not see)/i,
    /\bhidden from (you|the reader|the user|humans?)\b/i,
    /\byou (would not|wouldn't|did not|didn't) see\b/i,
    /\binvisible to (you|the reader|humans?)\b/i,
  ];
  for (const { source, string } of SPACE) {
    for (const rule of banned) {
      assert.ok(!rule.test(string), `${source} claims what someone received: ${JSON.stringify(string)}`);
    }
  }
});

test("the rendered side of the contrast is labelled as a rendering, and names its renderer", () => {
  assert.equal(COPY.RESULT.rendered_side_label, "Rendered page");
  assert.equal(COPY.renderedSideNote("pdfjs-dist", "6.2.108"), "Drawn here by pdfjs-dist 6.2.108.");
  // A label that named a person would be the whole failure this lane exists to avoid.
  assert.ok(!/\b(you|your|saw|seen|viewer|reader)\b/i.test(COPY.RESULT.rendered_side_label));
});

test("the establishes line states the limit positively, then denies only the specific inference", () => {
  assert.ok(COPY.ESTABLISHES.body.startsWith("This run establishes"));
  assert.ok(COPY.ESTABLISHES.body.includes("local parser"));
  assert.ok(COPY.ESTABLISHES.body.includes("local renderer"));
  assert.ok(COPY.ESTABLISHES.body.includes("does not establish what any AI system, pipeline, or person received"));
});

test("the boundary leads with what the surface does before what it does not", () => {
  assert.ok(COPY.BOUNDARY.statement.startsWith("This reads"));
  assert.ok(!/\bnot\b/.test(COPY.BOUNDARY.statement), "the leading boundary sentence should carry no denial");
  assert.ok(COPY.BOUNDARY.denials.includes("does not scan for viruses"));
  assert.ok(COPY.BOUNDARY.denials.includes("reaches no verdict"));
});

// ── One sentence, one fact ──────────────────────────────────────────────────────

test("the refusal reuses the stated limit with the live value set in, not a parallel sentence", () => {
  assert.ok(COPY.refusal("notes.docx").startsWith(COPY.INTAKE.limit));
  assert.equal(COPY.refusal("notes.docx"), "PDF only. notes.docx was not read.");
});

test("numerals render with the noun they actually have", () => {
  assert.equal(COPY.surfacedCount(1), "1 item surfaced.");
  assert.equal(COPY.surfacedCount(4), "4 items surfaced.");
  assert.equal(COPY.coverageComplete(1), "This run inspected 1 page, and every page was read.");
  assert.equal(COPY.coverageComplete(12), "This run inspected 12 pages, and every page was read.");
  assert.equal(COPY.byteSize(650), "650 bytes");
  assert.equal(COPY.byteSize(1), "1 byte");
  assert.equal(COPY.byteSize(248321), "248.3 kB (248321 bytes)");
});
