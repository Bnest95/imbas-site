// file-vocab-lint — file-vocab.v1, subordinate to closed generation (Lane 1).
//
// The lint is the backstop. Closed generation is the control. So the headline test
// here is not "the lint catches bad strings" — it is that the COMPLETE rendered
// output space of the template registry passes three lanes at build time. Because
// file-templates.js holds every sentence the lane can produce, that assertion covers
// every string that exists rather than every string somebody remembered to sample.
//
// Four jobs:
//   1. Exhaustive: every rendered string, through file-vocab.v1, check-vocab.v2, and
//      chip-vocab.v1. Zero violations, with the count recorded as the receipt.
//   2. The seven Phase 0 control strings are all caught by file-vocab.v1.
//   3. The gap is real: the controls that motivated this list pass the two existing
//      lanes clean, which is why a third lane exists at all.
//   4. Near-misses. The register the templates actually speak trips nothing, so a
//      rule that starts eating real copy is caught here rather than in review.
//
// Run: node --test test/file-vocab-lint.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";

import { FILE_VOCAB_VERSION, FILE_BANNED_CONSTRUCTIONS, lintFileString, lintFileStrings } from "../file-vocab.js";
import { lintString, lintUserFacingStrings, lintChipString, lintChipStrings } from "../reader-check-vocab.js";
import { renderCompleteOutputSpace, FILE_TEMPLATES } from "../file-templates.js";

// ── The list is versioned and stable ────────────────────────────────────────────

test("the file vocab list is versioned and its rule ids are unique", () => {
  assert.match(FILE_VOCAB_VERSION, /^file-vocab\.v\d+$/);
  assert.ok(FILE_BANNED_CONSTRUCTIONS.length > 0);
  const ids = FILE_BANNED_CONSTRUCTIONS.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const rule of FILE_BANNED_CONSTRUCTIONS) {
    assert.ok(rule.pattern instanceof RegExp, `${rule.id} must carry a pattern`);
    assert.ok(typeof rule.reason === "string" && rule.reason.length > 0, `${rule.id} must carry a reason`);
  }
});

test("the list is six rules across the four register categories it claims to cover", () => {
  assert.equal(FILE_BANNED_CONSTRUCTIONS.length, 6);
  const categories = new Set(FILE_BANNED_CONSTRUCTIONS.map((r) => r.category));
  assert.deepEqual(
    [...categories].sort(),
    ["author_intent", "detection_claim", "document_verdict", "experience_inference"].sort(),
  );
});

// ── (c) exhaustive: the complete rendered output space ──────────────────────────

const SPACE = renderCompleteOutputSpace();
const STRINGS = SPACE.map((r) => r.string);

test("EXHAUSTIVE: every rendered string in the registry's output space passes file-vocab.v1", () => {
  const violations = lintFileStrings(STRINGS);
  assert.deepEqual(violations, [], `file-vocab.v1 violations:\n${JSON.stringify(violations, null, 2)}`);
});

test("EXHAUSTIVE: every rendered string also passes the main lane (check-vocab.v2)", () => {
  const violations = lintUserFacingStrings(STRINGS);
  assert.deepEqual(violations, [], `check-vocab.v2 violations:\n${JSON.stringify(violations, null, 2)}`);
});

test("EXHAUSTIVE: every rendered string also passes the chip lane (chip-vocab.v1)", () => {
  const violations = lintChipStrings(STRINGS);
  assert.deepEqual(violations, [], `chip-vocab.v1 violations:\n${JSON.stringify(violations, null, 2)}`);
});

test("the exhaustive claim is exhaustive: every template contributed at least one linted string", () => {
  // A template the fixture set never reaches would sit outside the lint while the
  // suite still reported green. That is the one way "exhaustive" could be a lie.
  const linted = new Set(SPACE.map((r) => r.template_id));
  const missed = FILE_TEMPLATES.filter((t) => !linted.has(t.id)).map((t) => t.id);
  assert.deepEqual(missed, [], `these templates were never linted: ${missed.join(", ")}`);
  assert.equal(linted.size, FILE_TEMPLATES.length);
});

test("RECEIPT: the rendered output space is 36 strings across 16 templates and 11 classes", () => {
  // Pinned on purpose. A template or fixture added without re-reading this file
  // changes the number and lands the author in the lint receipt, which is where the
  // decision belongs.
  assert.equal(STRINGS.length, 36);
  assert.equal(FILE_TEMPLATES.length, 16);
  assert.equal(new Set(SPACE.map((r) => r.class_label)).size, 11);
});

// ── (c) the seven Phase 0 control strings ───────────────────────────────────────
//
// Two are the governing record's verbatim controls. The other five were authored in
// this pass to reach the remaining families in the ruling's register (author intent,
// detection language, document verdict, threat frame), because the governing record
// itself is out of this session's reach. They are marked so a later pass can replace
// any of the five with the record's own wording without re-deriving the intent.

const PHASE_0_CONTROLS = [
  { source: "governing-record", string: "This document tries to manipulate the AI reading it." },
  { source: "governing-record", string: "This file contains a malicious hidden prompt." },
  { source: "authored-this-pass", string: "The author intended this text to be invisible to human readers." },
  { source: "authored-this-pass", string: "We detected an injected instruction in this PDF." },
  { source: "authored-this-pass", string: "This PDF is unsafe to process." },
  { source: "authored-this-pass", string: "The document attempts to deceive downstream systems." },
  { source: "authored-this-pass", string: "This is a prompt injection attack embedded in the file." },
];

test("all seven Phase 0 control strings are caught by file-vocab.v1", () => {
  assert.equal(PHASE_0_CONTROLS.length, 7);
  for (const control of PHASE_0_CONTROLS) {
    const hits = lintFileString(control.string);
    assert.ok(
      hits.length > 0,
      `file-vocab.v1 missed a Phase 0 control (${control.source}): ${JSON.stringify(control.string)}`,
    );
  }
});

test("the two governing-record controls are caught, named individually", () => {
  const manipulate = lintFileString("This document tries to manipulate the AI reading it.").map((h) => h.id);
  assert.ok(manipulate.includes("author-intent"));
  assert.ok(manipulate.includes("manipulation-claim"));

  const malicious = lintFileString("This file contains a malicious hidden prompt.").map((h) => h.id);
  assert.ok(malicious.includes("document-verdict"));
  assert.ok(malicious.includes("threat-frame"));
});

test("WHY A THIRD LANE: the governing-record controls pass check-vocab.v2 and chip-vocab.v1 clean", () => {
  // This is the empirical finding the module header rests on. If a future edit to
  // the existing lists ever starts catching these, this test fails and the claim in
  // file-vocab.js needs rewriting rather than quietly going stale.
  for (const control of PHASE_0_CONTROLS.filter((c) => c.source === "governing-record")) {
    assert.deepEqual(
      lintString(control.string),
      [],
      `check-vocab.v2 now catches ${JSON.stringify(control.string)} — file-vocab.js's stated reason is out of date.`,
    );
    assert.deepEqual(
      lintChipString(control.string),
      [],
      `chip-vocab.v1 now catches ${JSON.stringify(control.string)} — file-vocab.js's stated reason is out of date.`,
    );
  }
});

// ── (c) one paired fixture per rule: positive, and a near-miss ──────────────────
//
// A rule proved only by its positive can be too broad and still look green. A rule
// proved only by its negative can be absent entirely and still look green. The
// near-misses are drawn from the register the templates actually speak.

const PAIRED_FIXTURES = [
  ["author-intent", "This file tries to reach the parser first.", "The page's content stream sets text render mode 3 for this run."],
  ["author-intent", "The layout was designed to defeat extraction.", "The page's content stream places this run at [0, 0, 10, 10]."],
  ["manipulation-claim", "The text manipulates the reading system.", "The check applied a threshold of 0.05."],
  ["manipulation-claim", "This run misleads anything that parses it.", "This run carries 2 zero-width codepoints."],
  ["document-verdict", "This PDF is malicious.", "The file carries this text in its metadata."],
  ["document-verdict", "The upload is benign.", "The file carries this text in an annotation attached to page 1."],
  ["threat-frame", "The file carries a hidden instruction.", "The file carries this text in an optional content group whose default state is off."],
  ["threat-frame", "Someone injected a payload into the stream.", "The page's content stream paints a filled path over the region this run occupies, 2 operations after the run."],
  ["detection-claim", "We detected three anomalies.", "The check applied a threshold of 1 point."],
  ["detection-claim", "The scan revealed an embedded instruction.", "A system that reads this file by extracting its text receives this text."],
  ["experience-inference", "The text is invisible to a reader.", "The page's rendering instructions do not paint it."],
  ["experience-inference", "A person cannot see this run.", "The page's content stream sets the fill alpha for this run to 0."],
];

test("each rule catches its own family and leaves the template register alone", () => {
  for (const [ruleId, offender, nearMiss] of PAIRED_FIXTURES) {
    const caught = lintFileString(offender).map((h) => h.id);
    assert.ok(caught.includes(ruleId), `${ruleId} missed ${JSON.stringify(offender)} (caught: ${caught.join(", ")})`);

    const falsePositives = lintFileString(nearMiss);
    assert.deepEqual(
      falsePositives,
      [],
      `${ruleId} tripped on template register: ${JSON.stringify(nearMiss)}\n${JSON.stringify(falsePositives, null, 2)}`,
    );
  }
});

test("every rule has at least one paired fixture", () => {
  const covered = new Set(PAIRED_FIXTURES.map(([id]) => id));
  const missing = FILE_BANNED_CONSTRUCTIONS.filter((r) => !covered.has(r.id)).map((r) => r.id);
  assert.deepEqual(missing, [], `rules with no paired fixture: ${missing.join(", ")}`);
});

test("the linter walks nested structures the way the other two lanes do", () => {
  const violations = lintFileStrings({ panel: { lines: ["This file is malicious."] } });
  assert.equal(violations.length, 1);
  assert.equal(violations[0].path, "panel.lines[0]");
  assert.equal(violations[0].id, "document-verdict");
});
