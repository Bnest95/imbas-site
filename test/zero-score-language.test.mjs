// zero-score-language.test.mjs — the machine check behind PASS 2B-B's hard
// acceptance criterion: ZERO SCORE LANGUAGE.
//
// THE RULE. No current-run user-facing render, no current canonical receipt section,
// and no current canonical export may present, or derive a claim from:
//   · "gap estimate" / "Machine gap estimate"
//   · an N-of-M score
//   · a 0-3 scale figure
//
// WHY IT EXISTS. The Reader used to open its result with "Machine gap estimate: 2 of
// 3 (unvalidated)", and that number drove the headline, the state tag, the correction
// chips and the copied card beneath it. A 0-3 figure over a single answer pair has no
// unit and no denominator a reader can inspect. It compressed a set of individually
// quotable rows into one number that read as more authoritative than the rows it
// summarized, and an unvalidated label under it does not undo that. What replaced it
// is a count with a declared unit, produced by a named canonical selector, which a
// reader can check by counting the rows on screen.
//
// THREE PARTS, DIFFERENT JOBS:
//
//   PART A — OUTPUT SCAN. Builds real receipts and a real Review Record export and
//   asserts the prohibited patterns appear ZERO times. This is the actual guarantee.
//   It has no baseline and no allowance, because the correct number is zero.
//
//   PART B — SOURCE RATCHET. Scans shipped source for prohibited strings. It is not
//   an exception list: it records a per-file ceiling. A prohibited string in any file
//   NOT in the baseline fails. An increase in a baselined file fails. A decrease
//   passes, and tightening the recorded number afterwards is the intended workflow.
//   Every baseline entry is annotated with the lane that retires it.
//
//   PART C — BOARD SCAN. Reads the committed acceptance-board baselines and asserts
//   that no RENDER section on the board carries a prohibited string, at either
//   viewport, in any state. Parts A and B check what the code emits and what the
//   source says; this checks what a camera pointed at the running product recorded.
//   The payload block of the same file is a stubbed API response and is ratcheted
//   separately, because the wire field is the compatibility envelope Part A already
//   proves cannot become a claim.
//
// SCOPE OF THE SOURCE SCAN. Comments are stripped before scanning. A comment cannot
// present a claim to a reader, and the prose explaining why the score is gone would
// otherwise dominate the baseline and hide real drift underneath it. What is scanned
// is string literals and JSX text — the things that reach a person.
//
// The patterns match the PHRASE ("gap estimate"), not the IDENTIFIER (gap_estimate).
// That is the distinction the pass turns on: the field may ride the wire inside a
// versioned compatibility envelope, but the claim may not reach a reader. Part A is
// what proves the field never becomes a claim.
//
// WHAT EACH TEST CATCHES. Verified by mutation when this file was written — reapply
// any of these and the named test should go red:
//   · formatReceiptText pushes gapEstimateLabel(2) again ....... single receipt scan
//   · assembleReviewRecord adds `measurement: openRun.measurement` ... both RR scans
//   · a prohibited string in a file with no baseline entry ......... outside-baseline
//   · one more prohibited string inside a baselined file ................... ceiling
//   · a prohibited string appended to workbench.bundle.js only ....... bundle/source
//   · the consent copy drops its disclosure while the page still scores .. invariant
//   · a baseline re-accepted with the score gauge back on screen ......... board scan
//   · a board scenario deleted so its states stop being photographed ... board census

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

import {
  buildSingleReceipt,
  buildPairedReceipt,
  canonicalizeForHash,
  formatReceiptText,
  formatPairedReceiptText,
} from "../reader-receipt.js";
import { buildReviewRecord, REVIEW_RECORD_UI, METHOD_NOTE } from "../reader-review-record.js";
import { buildCheckRegister } from "../reader-checks.js";
import { buildPairCapture, PAIR_SAME_MODEL, PAIR_EDITS, PAIRED_METHOD_VERSION } from "../reader-paired.js";
import { SCENARIOS } from "../scripts/qa/scenarios.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const sha256Hex = (s) => createHash("sha256").update(s, "utf8").digest("hex");

// ── The prohibited patterns ───────────────────────────────────────────────────
const PROHIBITED = [
  ["gap-estimate phrase", /gap estimate/gi],
  ["machine-estimate phrase", /machine estimate/gi],
  ["N-of-M score", /\b\d+(\.\d+)?\s*(of|\/)\s*3\b/gi],
  ["0-3 scale figure", /\b0-3\b/g],
];

function occurrences(text) {
  const hits = [];
  for (const [label, re] of PROHIBITED) {
    for (const m of String(text).matchAll(re)) hits.push({ label, match: m[0] });
  }
  return hits;
}

// Strip // and /* */ comments while respecting string and template literals, so the
// scan sees only what can reach a reader. String bodies are KEPT — they are exactly
// what ships. This is a scanner, not a parser: it does not know a regex literal from
// a division, so `/'/` and an apostrophe in JSX text both read as an opening quote.
// The resync below bounds that damage, and parsesCleanly() below refuses to trust a
// file where it went wrong anyway.
function scanText(src) {
  let out = "";
  let state = "code";
  for (let i = 0; i < src.length; ) {
    const c = src[i];
    const d = src[i + 1];
    if (state === "code") {
      if (c === "/" && d === "/") { state = "line"; i += 2; continue; }
      if (c === "/" && d === "*") { state = "block"; i += 2; continue; }
      if (c === "'" || c === '"' || c === "`") { state = c; out += c; i += 1; continue; }
      out += c; i += 1; continue;
    }
    if (state === "line") {
      if (c === "\n") { state = "code"; out += c; }
      i += 1; continue;
    }
    if (state === "block") {
      if (c === "*" && d === "/") { state = "code"; i += 2; continue; }
      if (c === "\n") out += c;
      i += 1; continue;
    }
    // inside a string literal
    if (c === "\\") { out += c + (d || ""); i += 2; continue; }
    // A ' or " string cannot contain a raw newline. If one appears to, the opening
    // quote was an apostrophe in JSX text or a quote inside a regex literal. Resync
    // at the line break so one misread character cannot swallow the rest of the file
    // and preserve its comments as if they were shipped strings.
    if (c === "\n" && state !== "`") { state = "code"; out += c; i += 1; continue; }
    if (c === state) state = "code";
    out += c; i += 1;
  }
  return { out, endState: state };
}

const stripComments = (src) => scanText(src).out;

// A file the scanner finished reading mid-literal was misread somewhere, so its count
// is not trustworthy in either direction. Fail loudly rather than ratchet against a
// number the scanner guessed at.
const parsesCleanly = (src) => scanText(src).endState === "code";

// ── What ships ────────────────────────────────────────────────────────────────
// Superseded prototypes of workbench-app.jsx, referenced by no page and built by no
// entry point (last touched June 2026). They are excluded because they ship nothing,
// not because their contents are acceptable. Deleting them is its own cleanup.
const DEAD_PROTOTYPES = new Set(["Workbench.jsx", "GapWorkbench.jsx", "Imbas_Workbench.jsx"]);
const SKIP_DIRS = new Set(["node_modules", ".git", "test", "qa", ".claude", "case", "grant-engine", "lessons", "docs"]);
const SCANNED_EXT = /\.(jsx|mjs|html|js)$/;

function shippedFiles(dir = ROOT, out = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry) || entry.startsWith(".")) continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) shippedFiles(p, out);
    else if (SCANNED_EXT.test(entry) && !DEAD_PROTOTYPES.has(entry)) out.push(p);
  }
  return out;
}

const rel = (p) => relative(ROOT, p).split(sep).join("/");

function scanSource(path) {
  const raw = readFileSync(path, "utf8");
  return occurrences(path.endsWith(".html") ? raw : stripComments(raw));
}

// ── PART B: the ratchet baseline ──────────────────────────────────────────────
// Per-file ceilings for shipped source. Every entry states WHO retires it. Counts
// were derived in-session; the BASE_SHA figures they descend from are recorded in the
// PR body as the elimination proof.
//
// CARVED SURFACE (share / permalink). Ruled out of scope for Pass 2B-B, closed by
// 2B-C: the share row no longer stores the score, the page no longer renders it, the
// metadata no longer prints it, and the consent copy no longer promises it. Schema,
// render, metadata and consent copy moved in one commit, because a disclosure that
// understates what gets published is worse than the thing it fails to disclose. Those
// five entries are DELETED rather than lowered to zero — a zero ceiling is still a
// permission slip, and the surface is now held by Part A like every other file.
const BASELINE = {
  // COMPATIBILITY ENVELOPE. Score generation and storage persist untouched behind
  // frozen API semantics. After 2B-B none of it drives a current render, a canonical
  // receipt claim, an export, a tally, a label, or explanatory copy — Part A is what
  // proves that. These retire with the API-spec lane, not with a presentation pass.
  "api/read.js": {
    count: 3,
    status: "temporary",
    retired_by: "API-spec lane — retires score generation from the inspector prompt",
  },
  "api/read-paired.js": {
    count: 4,
    status: "temporary",
    retired_by: "API-spec lane — retires gap_estimate_label from the paired payload",
  },
  "reader-receipt.js": {
    count: 2,
    status: "temporary",
    retired_by:
      "API-spec lane — pairedGapEstimateLabel survives only because api/read-paired.js still publishes gap_estimate_label on a frozen payload; gapEstimateLabel has had no production caller since 2B-C removed the share projection, and deleting it is the API-spec lane's call, not a presentation pass's, because relocation is prohibited while api semantics are frozen",
  },

  // FROZEN DOCUMENTS. Dated papers and the pages that define the term. Editorial
  // reconciliation of the live pages is queued; the papers stay as written.
  "glossary.html": {
    count: 8,
    status: "temporary",
    retired_by: "post-B editorial reconciliation",
  },
  "calibration.html": {
    count: 6,
    status: "temporary",
    retired_by: "post-B editorial reconciliation",
  },
  "whitepaper.html": {
    count: 3,
    status: "permanent",
    retired_by: "none — a dated document, cited as published",
  },
  "volunteer-gap-paper.html": {
    count: 3,
    status: "permanent",
    retired_by: "none — a dated document, cited as published",
  },
};

test("source ratchet: no prohibited score language outside the recorded baseline", () => {
  const offenders = [];
  for (const path of shippedFiles()) {
    const name = rel(path);
    if (BASELINE[name]) continue;
    const hits = scanSource(path);
    if (hits.length) offenders.push(`${name}: ${hits.map((h) => `${h.label} ("${h.match}")`).join(", ")}`);
  }
  assert.deepEqual(
    offenders,
    [],
    "Score language appeared in a file with no baseline entry. The Reader states counts " +
      "with declared units, never a 0-3 estimate. If this is genuinely a carved or " +
      "compatibility surface, it needs a BASELINE entry naming the lane that retires it — " +
      "not a wider pattern.\n" + offenders.join("\n"),
  );
});

test("source ratchet: no baselined file exceeds its recorded ceiling", () => {
  const regressions = [];
  for (const [name, entry] of Object.entries(BASELINE)) {
    const n = scanSource(join(ROOT, name)).length;
    if (n > entry.count) {
      regressions.push(`${name}: ${n} occurrences, ceiling ${entry.count} (retired by: ${entry.retired_by})`);
    }
  }
  assert.deepEqual(
    regressions,
    [],
    "A baselined file gained score language. The baseline is a ratchet, not an " +
      "allowance: it may only go down.\n" + regressions.join("\n"),
  );
});

test("source ratchet: the baseline is honest — every entry still earns its ceiling", () => {
  const slack = [];
  for (const [name, entry] of Object.entries(BASELINE)) {
    const n = scanSource(join(ROOT, name)).length;
    if (n < entry.count) slack.push(`${name}: ${n} occurrences but ceiling is ${entry.count} — tighten it`);
  }
  assert.deepEqual(slack, [], slack.join("\n"));
});

test("source ratchet: the scanner read every shipped file cleanly", () => {
  const misread = [];
  for (const path of shippedFiles()) {
    if (path.endsWith(".html")) continue;
    if (!parsesCleanly(readFileSync(path, "utf8"))) misread.push(rel(path));
  }
  assert.deepEqual(
    misread,
    [],
    "The scanner finished these files mid-literal, so it stopped telling comments from " +
      "shipped strings and every count it reports for them is a guess. Fix the scanner " +
      "before trusting the ratchet.\n" + misread.join("\n"),
  );
});

// workbench.bundle.js is generated from workbench-app.jsx. If the two disagree, either
// the bundle is stale or an edit landed in the bundle that never went through source.
test("source ratchet: the bundle carries exactly what its source carries", () => {
  assert.equal(
    scanSource(join(ROOT, "workbench.bundle.js")).length,
    scanSource(join(ROOT, "workbench-app.jsx")).length,
    "workbench.bundle.js and workbench-app.jsx disagree on how much score language they " +
      "carry. Rebuild the bundle: npm run build:workbench",
  );
});

test("source ratchet: every baseline entry names the lane that retires it", () => {
  for (const [name, entry] of Object.entries(BASELINE)) {
    assert.ok(["temporary", "permanent"].includes(entry.status), `${name}: status must be temporary or permanent`);
    assert.ok(entry.retired_by && entry.retired_by.length > 10, `${name}: retired_by must name a lane`);
    if (entry.status === "permanent") {
      assert.match(entry.retired_by, /^none — /, `${name}: a permanent entry must say why it never retires`);
    }
  }
});

// ── PART A: the output scan ───────────────────────────────────────────────────
// The guarantee. No baseline, no allowance: the answer is zero.

const PROVENANCE = {
  reader_model_version: "claude-opus-4-8",
  inspector_prompt_version: "reader.v2",
  inspector_run_conditions: { thinking: "adaptive", max_tokens: 8192, temperature: "default" },
  source_content_hash: sha256Hex("src"),
  reader_output_hash: sha256Hex("out"),
  run_timestamp: "2026-07-09T00:00:00.000Z",
  request_id: "reqzeroscore0001",
};

// A pasted answer with two exactly-quotable spans, so the check register emits a real
// check instead of rejecting the finding as unlocatable and leaving nothing to scan.
const ANSWER =
  "The report recommends approval on the strength of the projection. " +
  "The recommendation rests on a projected figure of 4.2 million in the first year.";

const FINDING = {
  type: "omission",
  check: {
    supporting_proposition: "a projected figure of 4.2 million in the first year",
    dependent_output: "The report recommends approval",
    dependency_statement: "The recommendation rests on the projected figure.",
    verification_question: "What source gives the projected figure this recommendation depends on?",
    resolver: "authority",
    propagation: "recommendation_or_action",
  },
};

const TARGETED_PROMPT =
  "Are there any required notices, deadlines, safeguards, exceptions, or other material " +
  "points relevant to this situation? Name the governing source for each.";
const TARGETED_ANSWER = "There are notice requirements and a filing deadline under the governing rule.";

// A measurement carrying the worst case for this test: a maximal 3-of-3 score, a
// rationale that restates it in words, and findings in all three classes.
const SCORED_MEASUREMENT = {
  gap_estimate: 3,
  estimate_rationale: "Machine gap estimate 3 of 3: I counted only material deltas on the 0-3 scale.",
  findings: [
    { type: "candidate missing item", anchor: "smoother workflows", materiality: "no failure modes" },
    { type: "candidate framing issue", anchor: "reduce wait times", materiality: "benefit-forward" },
    { type: "candidate deflection", anchor: "", materiality: "sidesteps liability" },
  ],
  finding_counts: { "candidate missing item": 1, "candidate framing issue": 1, "candidate deflection": 1 },
  unvalidated: true,
};

const CANONICAL = {
  counts: {
    surfaced_candidate_items: {
      value: 2,
      unit_one: "item",
      unit_many: "items",
      predicate_id: "single_surface_satisfying_anchor_contract",
      class_breakdown: { omission: 1, framing_drift: 1, deflection: 0 },
    },
    probe_surfaced_differences: {
      value: 2,
      unit_one: "difference",
      unit_many: "differences",
      predicate_id: "paired_probe_only_satisfying_anchor_contract",
      class_breakdown: { omission: 1, framing_drift: 1, deflection: 0 },
    },
  },
  findings: [],
};

function singleReceipt() {
  const e = buildSingleReceipt({
    generatedAt: "2026-07-09T00:00:00.000Z",
    question: "What are the risks?",
    topic: "triage",
    declaredModel: "GPT-5",
    answer: ANSWER,
    inspection: {
      completeness: "partial",
      the_read: "recommendation stated without its source",
      what_was_left_out: ["the source behind the projected figure"],
      how_it_was_shaped: "conclusion-forward",
      inspection_note: "",
    },
    measurement: SCORED_MEASUREMENT,
    canonical: CANONICAL,
    provenance: PROVENANCE,
  });
  e.integrity.content_hash = sha256Hex(canonicalizeForHash(e));
  return e;
}

test("output scan: the single canonical receipt presents no score, even from a maximal one", () => {
  const e = singleReceipt();
  const hits = occurrences(formatReceiptText(e));
  assert.deepEqual(
    hits.map((h) => `${h.label}: "${h.match}"`),
    [],
    "The single receipt is a canonical export and may not carry a score claim.",
  );
});

test("output scan: the single receipt envelope carries the datum but never a rendered label", () => {
  const e = singleReceipt();
  // The raw number survives — api/inspection-share.js reads it off the envelope, and
  // this pass does not move that surface. What may not survive is a rendered claim.
  assert.equal(e.open_run.measurement.gap_estimate, 3);
  assert.ok(!("gap_estimate_label" in e.open_run.measurement));
  assert.deepEqual(occurrences(JSON.stringify(Object.keys(e.open_run.measurement))), []);
});

function pairedReceipt() {
  const e = buildPairedReceipt({
    generatedAt: "2026-07-09T00:00:00.000Z",
    openRun: {
      question: "What are the risks?",
      answer: ANSWER,
      declared_model: "GPT-5",
      provenance: { ...PROVENANCE, request_id: "reqzeroscore0002" },
    },
    pairedAnalysis: {
      open_run_id: "reqzeroscore0002",
      targeted_prompt: TARGETED_PROMPT,
      targeted_answer: TARGETED_ANSWER,
      gap_estimate: 3,
      estimate_rationale: SCORED_MEASUREMENT.estimate_rationale,
      delta_items: [{ signal_pattern: "Omission", point: "The deadline was never named." }],
      canonical: CANONICAL,
      paired_method_version: "2.0",
    },
  });
  e.integrity.content_hash = sha256Hex(canonicalizeForHash(e));
  return e;
}

test("output scan: the paired canonical receipt presents no score", () => {
  const hits = occurrences(formatPairedReceiptText(pairedReceipt()));
  assert.deepEqual(
    hits.map((h) => `${h.label}: "${h.match}"`),
    [],
    "The paired receipt is a canonical export and may not carry a score claim.",
  );
});

// The Review Record is assembled from a `result` — the check register plus the receipt
// envelope — exactly as ReviewRecordExport in workbench-app.jsx hands it over. The
// receipt fed in here is the real one built above, carrying gap_estimate: 3 and a
// rationale that spells the figure out in words. If the exporter ever starts embedding
// open_run.measurement, this is what catches it.
function exportedResult() {
  const register = buildCheckRegister({
    artifactId: "original_answer",
    artifactText: ANSWER,
    findings: [FINDING],
    inspector: { model: "claude-opus-4-8", model_version: "claude-opus-4-8", prompt_version: "reader.v3" },
  });
  return { register, result: { checks: register, receipt: singleReceipt() } };
}

test("output scan: the Review Record export presents no score", async () => {
  const { register, result } = exportedResult();
  const record = await buildReviewRecord({ result, createdAt: "2026-07-09T00:00:00.000Z" });

  // The scan below only means something over a record that actually got built.
  assert.equal(register.checks.length, 1, "fixture must emit a check, or the scan proves nothing");
  assert.equal(record.contents.artifacts[0].body, ANSWER);
  assert.equal(record.contents.checks.length, 1);
  assert.match(record.integrity.digest, /^[0-9a-f]{64}$/);
  assert.equal(result.receipt.open_run.measurement.gap_estimate, 3, "the input must carry the score");

  const hits = occurrences(JSON.stringify(record));
  assert.deepEqual(
    hits.map((h) => `${h.label}: "${h.match}"`),
    [],
    "The Review Record is the canonical export. A compatibility field may ride the " +
      "wire, but nothing in this record may present a score claim.",
  );
});

test("output scan: the paired Review Record export presents no score", async () => {
  const { result } = exportedResult();
  const record = await buildReviewRecord({
    result,
    createdAt: "2026-07-09T00:00:00.000Z",
    pair: {
      targeted_answer: TARGETED_ANSWER,
      targeted_prompt: TARGETED_PROMPT,
      targeted_prompt_hash: sha256Hex(TARGETED_PROMPT),
      targeted_source_model: { name: "claude-opus-4-8", version: "" },
      capture: buildPairCapture({ same_model: PAIR_SAME_MODEL.YES, edits: PAIR_EDITS.NONE }),
      inspector: { model: "claude-opus-4-8", model_version: "claude-opus-4-8", prompt_version: PAIRED_METHOD_VERSION },
    },
  });

  assert.deepEqual(record.contents.artifacts.map((a) => a.role), ["original_answer", "targeted_answer"]);
  assert.equal(record.contents.pair_runs.length, 1);

  const hits = occurrences(JSON.stringify(record));
  assert.deepEqual(
    hits.map((h) => `${h.label}: "${h.match}"`),
    [],
    "The paired Review Record may not carry a score claim either.",
  );
});

test("output scan: the export control copy names no score", () => {
  assert.deepEqual(occurrences(JSON.stringify(REVIEW_RECORD_UI)), []);
});

// ── The consistency invariant ─────────────────────────────────────────────────
// The share page, the metadata that unfurls it, and the consent dialog shown before
// it is published all speak about the same page, so they must not disagree about what
// that page carries. Until 2B-C the shared fact was a score, and the invariant held
// all three to disclosing it. 2B-C removed it from all three in one commit, so the
// invariant now holds all three to zero. It is one assertion, not three, on purpose:
// a person must never consent to publishing a page that says more than the dialog
// admitted, and the only way to fail that is to move one of these without the others.
// The serialization is included because a field the endpoint still stores is a field
// the page can start printing again without anyone editing the page.
test("consistency invariant: the share page, its metadata, and the consent copy agree", () => {
  const surfaces = {
    "inspection.js": readFileSync(join(ROOT, "inspection.js"), "utf8"),
    "api/inspection-view.js": readFileSync(join(ROOT, "api/inspection-view.js"), "utf8"),
    "api/inspection-share.js": readFileSync(join(ROOT, "api/inspection-share.js"), "utf8"),
    "workbench-app.jsx": readFileSync(join(ROOT, "workbench-app.jsx"), "utf8"),
    "workbench.bundle.js": readFileSync(join(ROOT, "workbench.bundle.js"), "utf8"),
  };

  const disagreements = [];
  for (const [name, src] of Object.entries(surfaces)) {
    const hits = occurrences(stripComments(src));
    for (const h of hits) disagreements.push(`${name}: ${h.label} ("${h.match}")`);
  }

  assert.deepEqual(
    disagreements,
    [],
    "The share surface carries no score, so neither its serialization, its metadata, " +
      "nor the consent dialog may name one. Whichever of these came back is either a " +
      "reintroduction or a survivor of the 2B-C migration; all of them move together " +
      "or none of them move.\n" + disagreements.join("\n"),
  );
});

// The disclosure has to describe the page, not merely avoid the retired words. A
// consent dialog that promised a figure the page no longer prints would be as wrong
// as one that hid a figure it does print, and the failure is quieter because nothing
// scans for a promise that overstates.
test("consistency invariant: the consent dialog promises no figure the page cannot show", () => {
  const consent = readFileSync(join(ROOT, "workbench-app.jsx"), "utf8");
  const block = consent.slice(
    consent.indexOf("const READER_SHARE_CONSENT"),
    consent.indexOf("function shareFailureMessage"),
  );
  assert.ok(block.length > 200, "READER_SHARE_CONSENT block not found — the slice bounds moved");
  assert.equal(occurrences(block).length, 0);
  assert.ok(
    !/\bestimate\b/i.test(block),
    "The consent copy still promises an estimate the share page does not render.",
  );
  assert.ok(
    block.includes("Reader inspections are discovery, not evidence"),
    "The consent copy must still name the boundary line the page carries.",
  );
});

// ── PART C: the acceptance board ──────────────────────────────────────────────
// Parts A and B reason about code. This part reads what a camera recorded off the
// running product. A baseline is a text file in three sections: `## environment`, the
// stubbed `## payload`, and `## render` — the elements that were actually visible
// inside the captured rectangle. Only the render section is copy a person saw, and it
// is the section the hard criterion governs.
//
// The payload section is a stubbed API response carrying gap_estimate_label, the
// frozen wire field named in the compatibility envelope. It is counted and ratcheted
// rather than banned, because banning it would mean editing the fixtures to hide a
// field the endpoint really does return — the scan would then be measuring the
// fixtures instead of the product. Part A is what proves the field cannot become a
// claim; this is what proves it never reached the screen.

const BOARD_DIR = join(ROOT, "docs", "qa", "visual-acceptance-harness");
const BOARD_VIEWPORTS = ["desktop", "mobile"];

function boardSections(text) {
  const iRender = text.indexOf("\n## render\n");
  const iPayload = text.indexOf("\n## payload\n");
  return {
    environment: text.slice(0, iPayload < 0 ? text.length : iPayload),
    payload: iPayload < 0 ? "" : text.slice(iPayload, iRender < 0 ? text.length : iRender),
    render: iRender < 0 ? "" : text.slice(iRender),
  };
}

function boardBaselines() {
  return readdirSync(BOARD_DIR)
    .filter((f) => f.endsWith(".snapshot.txt"))
    .sort()
    .map((f) => ({ file: f, sections: boardSections(readFileSync(join(BOARD_DIR, f), "utf8")) }));
}

test("board scan: no state on the acceptance board renders score language", () => {
  const offenders = [];
  for (const { file, sections } of boardBaselines()) {
    assert.ok(sections.render.length, `${file} has no render section, so it proves nothing about what was on screen`);
    for (const h of occurrences(sections.render)) offenders.push(`${file} — ${h.label}: ${JSON.stringify(h.match)}`);
  }
  assert.deepEqual(
    offenders,
    [],
    "A committed baseline photographed score language on screen. Either the surface " +
      "regressed, or a baseline was re-accepted from a tree where it had not been " +
      "removed yet. Do not re-accept to make this green: fix the render, then capture.",
  );
});

test("board scan: every board scenario is photographed at both viewports", () => {
  // The render scan above passes trivially against an empty board. This is what makes
  // it mean something: every scenario the module declares has a committed baseline at
  // each viewport, so deleting a scenario or skipping a capture fails here rather than
  // quietly shrinking what the scan covers.
  const have = new Set(readdirSync(BOARD_DIR).filter((f) => f.endsWith(".snapshot.txt")));
  const missing = [];
  for (const name of Object.keys(SCENARIOS)) {
    for (const vp of BOARD_VIEWPORTS) {
      const f = `${name}--${vp}.snapshot.txt`;
      if (!have.has(f)) missing.push(f);
    }
  }
  assert.deepEqual(missing, [], `board states with no committed baseline: ${missing.join(", ")}`);

  const expected = new Set(
    Object.keys(SCENARIOS).flatMap((n) => BOARD_VIEWPORTS.map((vp) => `${n}--${vp}.snapshot.txt`)),
  );
  const orphans = [...have].filter((f) => !expected.has(f));
  assert.deepEqual(orphans, [], `baselines for scenarios that no longer exist: ${orphans.join(", ")}`);
});

// The exact expected count, derived rather than allowed. A scenario stubbing
// /api/read-paired carries gap_estimate_label once, and that one field trips two
// patterns — the phrase and the figure inside it. Everything else carries none, which
// includes every single-answer state: the receipt stopped carrying the label in this
// pass, so a single route now scans clean.
//
// Asserted as equality, not a ceiling, because the number is fully determined by which
// routes a scenario stubs. A ceiling would quietly absorb a second field appearing.
//
// RETIRED BY: the API-spec lane, which removes gap_estimate_label from the paired
// payload. When it lands, PAIRED_WIRE_FIELD goes to 0 and this test becomes the plain
// statement that no baseline carries score language anywhere — at which point it is
// merged into the render scan above rather than lowered.
const PAIRED_WIRE_FIELD = 2;

test("board scan: the wire field stays in the payload block and stays at its derived count", () => {
  const wrong = [];
  for (const { file, sections } of boardBaselines()) {
    const name = file.replace(/--(desktop|mobile)\.snapshot\.txt$/, "");
    const s = SCENARIOS[name];
    assert.ok(s, `${file} has no scenario named ${name}`);
    const expected = s.routes && s.routes["/api/read-paired"] ? PAIRED_WIRE_FIELD : 0;
    const n = occurrences(sections.payload).length;
    if (n !== expected) wrong.push(`${file}: ${n}, expected ${expected}`);
    // Whatever the payload carries, the environment block never mentions a score.
    assert.deepEqual(occurrences(sections.environment), [], `${file} records score language in its environment block`);
  }
  assert.deepEqual(
    wrong,
    [],
    "A board payload carries a different amount of score language than its stubbed routes " +
      `account for: ${wrong.join("; ")}. The paired route carries gap_estimate_label and nothing ` +
      "else does; a new occurrence means a second compatibility field appeared, which needs its " +
      "own decision rather than a bigger number here.",
  );
});

test("board scan: no scenario's own assertions or prose carry score language", () => {
  // A scenario's assertText drives a hasText check at capture time, so a prohibited
  // string there would be an instruction to confirm the score is present. The state
  // and expected prose are read by a person reviewing the board, and a description
  // that still talks in scores describes a product that no longer exists.
  const offenders = [];
  for (const [name, s] of Object.entries(SCENARIOS)) {
    const prose = [s.state, s.expected, ...(s.assertText || []), s.assertSelector || "", s.focus || ""].join("\n");
    for (const h of occurrences(prose)) offenders.push(`${name} — ${h.label}: ${JSON.stringify(h.match)}`);
  }
  assert.deepEqual(offenders, [], `board scenarios describing a score: ${offenders.join("; ")}`);
});
