// The capabilities this product has been ruled not to have, held as assertions.
// Run: node --test test/capability-exclusions.test.mjs
//
// Why this file exists. Some rulings say what to build. These say what not to, and a
// ruling of that shape has nowhere to live in a codebase — there is no file for the
// feature that was not written. It gets re-proposed instead, in good faith, by whoever
// reads the surrounding code next and finds an obvious gap in it. Each gap below is
// deliberate and each one looks like an oversight.
//
// The assertions are narrow on purpose. None of them forbids a capability outright,
// because a later ruling may seat one; each pins the boundary where the capability
// currently stops, so crossing it fails here and gets adjudicated instead of shipped.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ANCHOR_ABSENT_REASONS, ANCHOR_STATUS } from "../reader-result.js";
import { RESULT_ACTIONS } from "../reader-result-actions.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");

const RESULT = read("reader-result.js");
const CHECKS = read("reader-checks.js");

// ── ABSENT is reported, never decided ────────────────────────────────────────

test("an absence is only ever the record of a source that quoted nothing", () => {
  // The excluded capability is a producer that DECIDES something is absent — an
  // instrument that looks at an answer, concludes a thing is missing from the world,
  // and writes ABSENT to say so. What exists instead is narrower and says less: the
  // source handed over no quotation, or the artifact it would have quoted is not on
  // this surface. Both are facts about the record in hand.
  //
  // The reason set is the boundary, and it is closed. A third reason is where the
  // excluded capability would arrive, because it would have to describe something other
  // than an absent quotation to be worth adding.
  assert.deepEqual(
    Object.keys(ANCHOR_ABSENT_REASONS),
    ["SOURCE_SUPPLIED_NO_QUOTATION", "ARTIFACT_NOT_AVAILABLE_TO_SURFACE"],
    "a new absent reason is a new claim about why something is absent, and needs its own ruling",
  );
});

test("one function makes an ABSENT anchor, and only the two silent-source paths call it", () => {
  const producers = [...RESULT.matchAll(/status:\s*ANCHOR_STATUS\.ABSENT/g)];
  assert.equal(producers.length, 1, "ABSENT is written in more than one place, so the two can diverge");

  // Called twice, from the two branches that have just established there is nothing to
  // quote. A third call site is not automatically wrong — it is automatically a
  // question, because it would be a new circumstance under which the product asserts an
  // absence.
  const calls = [...RESULT.matchAll(/return absentAnchor\(\{/g)];
  assert.equal(calls.length, 2, `absentAnchor is called ${calls.length} times; two is the ruled shape`);
  assert.equal(ANCHOR_STATUS.ABSENT, "ABSENT");

  // And nowhere else in the product. A second module minting absences would be a second
  // producer whatever it called itself.
  for (const file of ["reader-checks.js", "reader-stage.js", "workbench-app.jsx"]) {
    assert.ok(!read(file).includes("absentAnchor"), `${file} mints absences of its own`);
  }
});

// ── One Check Register, and no paired one ────────────────────────────────────

test("the Check Register has exactly one producer and no paired counterpart", () => {
  // A paired register — one assembled across two answers, to say what the second one
  // fixed — is the most obvious thing missing from this module, and it is excluded. The
  // reason it is excluded is not that it would be hard. It is that a register is a set
  // of questions worth asking, and a paired one would have to say something about
  // whether the second answer resolved them, which is a verdict on an answer.
  const builders = [...CHECKS.matchAll(/export function (build\w*CheckRegister|\w*[Rr]egister\w*)\(/g)].map(
    (m) => m[1],
  );
  assert.deepEqual(builders, ["buildCheckRegister"], `reader-checks.js exports register builders: ${builders}`);

  for (const [file, src] of [["reader-checks.js", CHECKS], ["reader-result.js", RESULT]]) {
    const paired = [...src.matchAll(/^.*\b\w*[Pp]aired\w*[Rr]egister\w*\b.*$/gm)].map((m) => m[0].trim());
    assert.deepEqual(paired, [], `${file} names a paired register:\n${paired.join("\n")}`);
  }
});

// ── The action seam that was emptied stays empty ─────────────────────────────

test("the rejected finding-level action has not come back to the result panel", () => {
  // The seam is still there and still exported, holding nothing. That is deliberate: an
  // empty list is a decision anyone can read, where a deleted seam is a gap that gets
  // refilled. Seating an action here is a product ruling, and this is where it gets
  // asked for.
  assert.deepEqual(RESULT_ACTIONS, [], "an action is seated in the result panel that no ruling has seated");
});
