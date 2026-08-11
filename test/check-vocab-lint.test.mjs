// check-vocab-lint — AT-5 v1 slice of the claims compiler (CI, site repo).
//
// Two jobs, both pinned here:
//   1. The authored, user-facing Check Register copy (CHECK_UI in reader-checks.js)
//      contains no banned construction — pointer register only. This is the CI
//      gate: a future copy edit that smuggles a verdict word fails `npm test`.
//   2. The versioned banned-constructions list actually catches each family it
//      claims to (world-claim verdicts, reliance verdicts, defensibility claims)
//      and does NOT trip on legitimate pointer-register phrasing.
//
// Run: node --test test/check-vocab-lint.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  CHECK_VOCAB_VERSION,
  BANNED_CONSTRUCTIONS,
  lintString,
  lintUserFacingStrings,
  hasWorldClaimVerdict,
  CHIP_VOCAB_VERSION,
  CHIP_BANNED_CONSTRUCTIONS,
  lintChipString,
  lintChipStrings,
} from "../reader-check-vocab.js";
import { CHECK_UI } from "../reader-checks.js";
import { PAIR_CAPTURE_UI, CHIP_UI, CHIP_LOOP_STATE_COPY } from "../reader-paired.js";
import { EXPLAIN_PANEL_UI } from "../reader-explain-panel.js";
import { SECOND_QUESTION_BANK } from "../reader-second-question-bank.js";
import { RECEIPT_BOUNDARY } from "../reader-receipt.js";

// ── The list is versioned and stable ────────────────────────────────────────────

test("the vocab list is versioned", () => {
  assert.match(CHECK_VOCAB_VERSION, /^check-vocab\.v\d+$/);
  assert.ok(BANNED_CONSTRUCTIONS.length > 0);
  // Rule ids are unique (a shipped id is never reused for a different rule).
  const ids = BANNED_CONSTRUCTIONS.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length);
});

// ── AT-5: the shipped user-facing copy passes the lint ──────────────────────────

test("AT-5: CHECK_UI (all shipped register/card copy) contains no banned construction", () => {
  const violations = lintUserFacingStrings(CHECK_UI);
  assert.deepEqual(violations, [], `banned constructions in CHECK_UI:\n${JSON.stringify(violations, null, 2)}`);
});

test("AT-5: PAIR_CAPTURE_UI (run-the-pair paste-back copy + unmatched warning) contains no banned construction", () => {
  const violations = lintUserFacingStrings(PAIR_CAPTURE_UI);
  assert.deepEqual(violations, [], `banned constructions in PAIR_CAPTURE_UI:\n${JSON.stringify(violations, null, 2)}`);
});

test("AT-5: EXPLAIN_PANEL_UI (Inspection Meaning panel copy table, all five states) contains no banned construction", () => {
  const violations = lintUserFacingStrings(EXPLAIN_PANEL_UI);
  assert.deepEqual(violations, [], `banned constructions in EXPLAIN_PANEL_UI:\n${JSON.stringify(violations, null, 2)}`);
});

test("AT-5: SECOND_QUESTION_BANK user-facing copy (six labels + six instruction texts) contains no banned construction", () => {
  // The chip a person taps and the instruction it sends are both displayed strings, so
  // they enter the same pointer-register lint as every other user-facing surface. Derived
  // from the bank rather than a second exported copy — the module ships exactly three
  // exports, so the user-facing strings are read off the entries here.
  const userFacing = SECOND_QUESTION_BANK.flatMap((e) => [e.approved_ui_label, e.instruction_text]);
  const violations = lintUserFacingStrings(userFacing);
  assert.deepEqual(
    violations,
    [],
    `banned constructions in SECOND_QUESTION_BANK copy:\n${JSON.stringify(violations, null, 2)}`,
  );
});

// ── AT-5: one paired fixture per banned form ────────────────────────────────────
// Every banned form gets two strings: one that must trip its own rule, and one near-miss
// in the register the Reader is allowed to speak, which must trip nothing at all. A rule
// proved only by its positive can be too broad and still look green; a rule proved only by
// its negative can be absent entirely and still look green. The pair is what closes both.
//
// The near-misses are the pointer register the copy actually uses, not invented phrases,
// so a rule that starts eating real copy is caught here rather than in review.

const PAIRED_FIXTURES = [
  // world-claim verdicts: ruling on whether a claim is so.
  ["world-claim-verdict", "true", "The stated exemption is true.", "the exemption this conclusion rests on"],
  ["world-claim-verdict", "false", "That figure is false.", "no source is given for that figure"],
  ["world-claim-verdict", "correct", "The date given is correct.", "the date is worth checking against the register"],
  ["world-claim-verdict", "incorrect", "The citation is incorrect.", "check the citation against the statute"],
  ["world-claim-verdict", "wrong", "The model got the year wrong.", "the year the conclusion depends on"],

  // reliance verdicts: rating whether the reader may lean on it.
  ["safe-to-rely", "safe to rely", "This is safe to rely on.", "this is what the conclusion rests on"],
  ["safe-to-rely", "unsafe to rely", "It is unsafe to rely on the summary.", "the summary names no source"],
  ["can-rely-verdict", "can rely", "You can rely on the exemption.", "the exemption is the claim to check"],
  ["can-rely-verdict", "cannot rely", "You cannot rely on this figure.", "no source is given for this figure"],
  ["can-rely-verdict", "can't rely", "You can't rely on the date.", "the date is worth checking"],
  ["can-rely-verdict", "could rely", "A reader could rely on that line.", "a reader can check that line"],
  ["can-rely-verdict", "should rely", "You should rely on the statute.", "the statute is the source to check against"],
  ["can-rely-verdict", "shouldn't rely", "You shouldn't rely on the summary.", "the summary omits the filing window"],
  ["can-rely-verdict", "may rely", "A reader may rely on this.", "a reader can check this against the source"],
  ["can-rely-verdict", "must rely", "You must rely on the register.", "the register is where to check"],
  ["reliance-is-verdict", "reliance … verdict", "Reliance verdict: open.", "what reliance would rest on is unstated"],
  ["reliance-is-verdict", "reliance … justified", "Reliance here is justified.", "reliance here would rest on one date"],
  ["reliance-is-verdict", "reliance … warranted", "Reliance on the figure is warranted.", "reliance on the figure rests on a source not named"],
  ["reliance-is-verdict", "reliance … established", "Reliance is established by the record.", "reliance rests on a record you can read"],
  ["reliance-is-verdict", "reliance … proven", "Reliance is proven.", "reliance rests on the earlier claim"],
  ["reliance-is-verdict", "reliance … confirmed", "Reliance is confirmed.", "reliance rests on what the source says"],

  // defensibility: certifying the record rather than describing it.
  ["defensible", "defensible", "This makes the record defensible.", "this is a record of what was examined"],
  ["defensible", "defensibility", "a defensibility claim about the record", "a record of what this examined"],
  ["compliance-proof", "compliance-proof", "A compliance-proof packet.", "a record for your own file"],
  ["compliance-proof", "compliance proof", "compliance proof for the auditor", "a record you can hand to a colleague"],
  ["adequate-review", "adequate review", "an adequate review of the record", "a record of what this review examined"],
  ["adequate-review", "adequately reviewed", "The record was adequately reviewed.", "the record says what was reviewed"],
  ["adequate-review", "adequate-review", "an adequate-review claim", "a claim about what was examined"],
  ["adequate-review", "adequate reviews", "two adequate reviews of the file", "two questions worth asking about the file"],

  // v2 — outcome verdicts: ruling on whether the answer came out well.
  ["verdict-outcome", "fail", "The answer will fail on the exemption date.", "the exemption date the conclusion rests on"],
  ["verdict-outcome", "fails", "The answer fails the second check.", "the second question worth asking"],
  ["verdict-outcome", "failed", "The first answer failed.", "the first answer did not name a source"],
  ["verdict-outcome", "failing", "The answer is failing this check.", "this check is worth running against the source"],
  ["verdict-outcome", "failure", "This is a failure on the date.", "no date is given"],
  ["verdict-outcome", "pass", "The answer gets a pass here.", "nothing here is marked either way"],
  ["verdict-outcome", "passes", "The answer passes on completeness.", "completeness is not what this measures"],
  ["verdict-outcome", "passed", "The answer passed the check.", "the check records the marks you set"],
  ["verdict-outcome", "passing", "a passing grade for this answer", "a record of what was examined"],
];

test("AT-5: every banned form has a paired fixture, so no rule ships unproven", () => {
  // The clause this enforces: a rule counts toward green only once its class is paired.
  // A rule added without fixtures fails here rather than passing on an empty promise.
  const covered = new Set(PAIRED_FIXTURES.map(([id]) => id));
  for (const rule of BANNED_CONSTRUCTIONS) {
    assert.ok(covered.has(rule.id), `banned rule "${rule.id}" has no paired fixture`);
  }
  // And no fixture names a rule that does not exist.
  const known = new Set(BANNED_CONSTRUCTIONS.map((r) => r.id));
  for (const id of covered) assert.ok(known.has(id), `fixture names unknown rule "${id}"`);
});

test("AT-5: each banned form is caught by its own rule", () => {
  for (const [ruleId, form, positive] of PAIRED_FIXTURES) {
    const hits = lintString(positive);
    assert.ok(
      hits.some((h) => h.id === ruleId),
      `"${form}" did not trip ${ruleId}: ${JSON.stringify(positive)} → ${JSON.stringify(hits.map((h) => h.id))}`,
    );
  }
});

test("AT-5: each banned form's near-miss control trips nothing", () => {
  for (const [ruleId, form, , control] of PAIRED_FIXTURES) {
    assert.deepEqual(
      lintString(control),
      [],
      `the control for ${ruleId}/"${form}" tripped a rule — the lint is eating legitimate copy: ${JSON.stringify(control)}`,
    );
  }
});

// ── AT-5: pointer register is NOT tripped (no false positives) ───────────────────

test("AT-5: legitimate pointer-register phrasing passes clean", () => {
  const pointerCopy = [
    "worth verifying against the source",
    "this conclusion rests on the earlier claim",
    "check against an authority",
    "a question worth asking",
    "re-run the calculation",
    "how they connect",
    CHECK_UI.register_note,
    CHECK_UI.provisional_label,
  ];
  for (const s of pointerCopy) {
    assert.deepEqual(lintString(s), [], `pointer-register copy tripped a rule: "${s}"`);
  }
});

// ── The v2 rule stays out of the runtime ────────────────────────────────────────

test("AT-5 v2: verdict-outcome is a CI rule and never a runtime drop", () => {
  // By ruling. This gate drops model-generated card copy, and pass/fail are ordinary
  // English about the world: a check may legitimately rest on "the bill passed the Senate".
  // Dropping that card would be the Reader omitting a real finding on a false positive.
  assert.ok(lintString("The bill passed the Senate in 2019.").some((h) => h.id === "verdict-outcome"));
  assert.equal(hasWorldClaimVerdict("The bill passed the Senate in 2019."), false);
  assert.equal(hasWorldClaimVerdict("The trial failed its primary endpoint."), false);
  // The world-claim gate is unchanged by v2.
  assert.equal(hasWorldClaimVerdict("This shows the claim is false."), true);

  // Keyed on rule id, and the rule carries its own category so a later change that keyed
  // on category instead cannot drag it into the runtime by accident.
  const rule = BANNED_CONSTRUCTIONS.find((r) => r.id === "verdict-outcome");
  assert.equal(rule.category, "outcome_verdict");
  assert.equal(
    BANNED_CONSTRUCTIONS.filter((r) => r.category === "outcome_verdict").length,
    1,
    "another rule joined outcome_verdict; the runtime-gate isolation argument needs re-checking",
  );
});

// ── The runtime gate keys only on world-claim verdicts ──────────────────────────

test("hasWorldClaimVerdict trips on verdict words but not on reliance/defensibility mentions", () => {
  assert.equal(hasWorldClaimVerdict("This shows the claim is false."), true);
  assert.equal(hasWorldClaimVerdict("Is the stated figure correct?"), true);
  // The runtime gate is world-claim-only: a bare reliance/defensibility mention is
  // handled by the CI lint over authored copy, not by the per-check runtime drop.
  assert.equal(hasWorldClaimVerdict("The exemption rests on the 2019 date."), false);
  assert.equal(hasWorldClaimVerdict("What source establishes the premise?"), false);
});

// ── Chip lane vocabulary (user-directed follow-up copy) ──────────────────────────
// A SEPARATE register from the Check copy above, with its own list and linter. A chip
// pair reports what visibly changed under an instruction the person chose; its copy
// legitimately says "correct" / "complete" / "better" (in the standing disclaimer) and
// "verified" (in the not-verified caption) — words the world-claim list bans — so the
// chip surfaces are linted through lintChipStrings, NEVER lintUserFacingStrings. In
// return the chip list bans what this descriptive lane must never borrow: Imbas-action /
// improvement claims, the instrument's construct vocabulary, and quantified improvement.

test("the chip vocab list is versioned with unique rule ids", () => {
  assert.match(CHIP_VOCAB_VERSION, /^chip-vocab\.v\d+$/);
  assert.ok(CHIP_BANNED_CONSTRUCTIONS.length > 0);
  const ids = CHIP_BANNED_CONSTRUCTIONS.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("chip lint: CHIP_UI (every authored chip string) contains no banned construction", () => {
  const violations = lintChipStrings(CHIP_UI);
  assert.deepEqual(violations, [], `banned chip constructions in CHIP_UI:\n${JSON.stringify(violations, null, 2)}`);
});

test("chip lint: CHIP_LOOP_STATE_COPY (the three loop-state headlines/notes/chips) contains no banned construction", () => {
  const violations = lintChipStrings(CHIP_LOOP_STATE_COPY);
  assert.deepEqual(
    violations,
    [],
    `banned chip constructions in CHIP_LOOP_STATE_COPY:\n${JSON.stringify(violations, null, 2)}`,
  );
});

test("chip lint catches Imbas-action / improvement claims", () => {
  for (const word of [
    "found", "detected", "identified", "fixed", "repaired", "improved", "improvement", "validated", "proven",
  ]) {
    assert.ok(
      lintChipString(`Imbas ${word} the answer.`).some((h) => h.id === "chip-imbas-action"),
      `expected "${word}" to trip chip-imbas-action`,
    );
  }
});

test("chip lint catches borrowed instrument construct vocabulary", () => {
  for (const word of ["gap", "volunteer", "volunteered", "surface", "surfaced", "omission", "deflection", "framing"]) {
    assert.ok(
      lintChipString(`This shows a ${word} in the answer.`).some((h) => h.id === "chip-construct-vocab"),
      `expected "${word}" to trip chip-construct-vocab`,
    );
  }
});

test("chip lint catches a quantified (percentage) improvement claim", () => {
  assert.ok(lintChipString("40% more complete").some((h) => h.id === "chip-percentage-claim"));
  assert.ok(lintChipString("a 12.5 % change").some((h) => h.id === "chip-percentage-claim"));
});

test("chip lint leaves the chip lane's legitimate register untouched", () => {
  // The words the chip lane is allowed to use — the world-claim list is not the authority
  // here. "correct" / "complete" / "better" ride in the standing disclaimer; "verified"
  // rides in the not-verified caption. None of these may trip a CHIP rule.
  const chipCopy = [
    CHIP_UI.meaning_panel_line,
    CHIP_UI.side_by_side.second_answer_caption,
    "the second answer is correct, complete, or better supported",
    "Not verified by Imbas.",
  ];
  for (const s of chipCopy) {
    assert.deepEqual(lintChipString(s), [], `chip-register copy tripped a chip rule: "${s}"`);
  }
});

test("the locked Reader boundary sentence is registered on the chip surface (clears BOTH lists)", () => {
  // Correction: ChipDeltaView now carries RECEIPT_BOUNDARY verbatim beside the chip
  // attribution line, so a string authored for the inspection lane newly renders on a
  // chip surface. Any string on a chip surface must pass the chip lint — it borrows
  // none of the chip lane's banned constructions (no Imbas-action / improvement claim,
  // no borrowed construct vocabulary, no percentage). It also clears the world-claim
  // list, exactly as on every inspection surface, so the one sentence renders
  // identically on both lanes with zero drift.
  assert.deepEqual(lintChipString(RECEIPT_BOUNDARY), []);
  assert.deepEqual(lintString(RECEIPT_BOUNDARY), []);
});

test("the two registers are genuinely separate: the chip meaning line clears the chip list but trips the world-claim list", () => {
  // The whole reason two lists exist. The mandated chip disclaimer contains "correct" (a
  // world-claim verdict word), so it clears lintChipString but WOULD fail the world-claim
  // lint — proving the chip surfaces must never be routed through lintUserFacingStrings.
  assert.deepEqual(lintChipString(CHIP_UI.meaning_panel_line), []);
  assert.ok(lintUserFacingStrings([CHIP_UI.meaning_panel_line]).some((v) => v.id === "world-claim-verdict"));
});
