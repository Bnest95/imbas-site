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

// ── AT-5: the list catches each banned family ───────────────────────────────────

test("AT-5: world-claim verdict words are caught", () => {
  for (const word of ["true", "false", "correct", "incorrect", "wrong"]) {
    const hits = lintString(`The answer's claim is ${word}.`);
    assert.ok(
      hits.some((h) => h.id === "world-claim-verdict"),
      `expected "${word}" to trip world-claim-verdict`,
    );
  }
});

test("AT-5: reliance verdicts are caught", () => {
  assert.ok(lintString("This is safe to rely on.").some((h) => h.category === "reliance_verdict"));
  assert.ok(lintString("You cannot rely on this figure.").some((h) => h.category === "reliance_verdict"));
  assert.ok(lintString("You can rely on the exemption.").some((h) => h.category === "reliance_verdict"));
});

test("AT-5: defensibility / compliance / adequate-review claims are caught", () => {
  assert.ok(lintString("This makes the record defensible.").some((h) => h.id === "defensible"));
  assert.ok(lintString("A compliance-proof packet.").some((h) => h.id === "compliance-proof"));
  assert.ok(lintString("an adequate review of the record").some((h) => h.id === "adequate-review"));
  assert.ok(lintString("adequately reviewed").some((h) => h.id === "adequate-review"));
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
