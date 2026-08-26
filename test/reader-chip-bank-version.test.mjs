// reader-chip-bank-version — the fourth governed fact on a chip receipt.
//
// A chip receipt already named three things: which intent the person chose (chip_id),
// the version of that intent's wording (instruction_version), and the pinned prompt the
// comparison was read under (paired_prompt_version). It did not name the SET the intent
// was drawn from, and nothing on the artifact could be made to name it.
//
// That gap is not cosmetic, and it is not merely undeclared — it is underivable. When a
// bank version ships with an entry whose instruction_text is unchanged, that entry keeps
// its id, keeps its instruction_version, and hashes to the same content_hash in both
// versions. The stored Targeted Prompt Hash is a hash of the instruction text, so it is
// byte-identical too. Every candidate discriminator collapses. Only a stamp written at
// the moment of the run can say which bank produced it, which is why the row carries one
// and the receipt reports it.
//
// The rules this file holds:
//   1. the four facts are independent — no one of them derives another;
//   2. a fresh run stamps the bank version from the tree;
//   3. a reconstruction that has no stored bank version reports "", never today's tag;
//   4. the replay path reads the row's own stamp with no fallback of any kind.
//
// Constants and source text only — no network, no model call, no capture.
//
// Run: node --test test/reader-chip-bank-version.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";

import { buildChipPairedReceipt, canonicalizeForHash } from "../reader-receipt.js";
import { SECOND_QUESTION_BANK, SECOND_QUESTION_BANK_VERSION } from "../reader-second-question-bank.js";
import { CHIP_PAIRED_METHOD_VERSION } from "../reader-paired.js";

const SRC = fs.readFileSync(new URL("../api/read-paired.js", import.meta.url), "utf8");
const sha256 = (s) => createHash("sha256").update(s, "utf8").digest("hex");

const OPEN_RUN = { question: "", answer: "first answer", provenance: { request_id: "abc0123456789def" } };

function receiptFor(chipAnalysis) {
  return buildChipPairedReceipt({
    generatedAt: "2026-08-25T00:00:00.000Z",
    openRun: OPEN_RUN,
    chipAnalysis: { open_run_id: "abc0123456789def", delta_items: [], ...chipAnalysis },
    declarations: [],
  });
}

// ── The fact reaches the artifact ────────────────────────────────────────────────────

test("the bank version reaches the chip receipt", () => {
  const r = receiptFor({ chip_id: "sq.sources", instruction_version: "v1", bank_version: SECOND_QUESTION_BANK_VERSION });
  assert.equal(r.paired_analysis.bank_version, SECOND_QUESTION_BANK_VERSION);
});

test("the bank version is a namespaced tag, not a bare number", () => {
  assert.equal(typeof SECOND_QUESTION_BANK_VERSION, "string");
  assert.match(
    SECOND_QUESTION_BANK_VERSION,
    /^second-question-bank\.v\d+$/,
    `SECOND_QUESTION_BANK_VERSION "${SECOND_QUESTION_BANK_VERSION}" should look like "second-question-bank.v1"`,
  );
});

// ── Independence: four facts, none derived from another ──────────────────────────────

test("the four governed facts are four separate fields on the receipt", () => {
  const r = receiptFor({
    chip_id: "sq.sources",
    instruction_version: "v1",
    paired_prompt_version: CHIP_PAIRED_METHOD_VERSION,
    bank_version: SECOND_QUESTION_BANK_VERSION,
  });
  const pa = r.paired_analysis;
  assert.equal(pa.chip_id, "sq.sources");
  assert.equal(pa.instruction_version, "v1");
  assert.equal(pa.paired_prompt_version, CHIP_PAIRED_METHOD_VERSION);
  assert.equal(pa.bank_version, SECOND_QUESTION_BANK_VERSION);
  // Four distinct values, so no reader can mistake one for a copy of another.
  assert.equal(new Set([pa.chip_id, pa.instruction_version, pa.paired_prompt_version, pa.bank_version]).size, 4);
});

// The proof that the stamp is necessary. Hold the chip fixed and move only the bank: an
// entry carried forward unchanged into a later bank keeps its id, its wording version, and
// its content hash. If bank_version were absent, these two runs would be indistinguishable
// on the artifact AND in the stored row, and a series segmented by chip would silently pool
// them.
test("nothing else on a chip receipt discriminates one bank version from another", () => {
  const common = {
    chip_id: "sq.sources",
    instruction_version: "v1",
    paired_prompt_version: CHIP_PAIRED_METHOD_VERSION,
    targeted_prompt: "Show me where each claim in this answer came from.",
    targeted_prompt_hash: sha256("Show me where each claim in this answer came from."),
    targeted_answer: "second answer",
    targeted_answer_hash: sha256("second answer"),
    paired_method_version: CHIP_PAIRED_METHOD_VERSION,
  };
  const v1 = receiptFor({ ...common, bank_version: "second-question-bank.v1" });
  const v2 = receiptFor({ ...common, bank_version: "second-question-bank.v2" });

  for (const key of Object.keys(v1.paired_analysis)) {
    if (key === "bank_version") continue;
    assert.deepEqual(
      v2.paired_analysis[key],
      v1.paired_analysis[key],
      `${key} is identical across the two banks, so it cannot tell them apart`,
    );
  }
  assert.notEqual(v2.paired_analysis.bank_version, v1.paired_analysis.bank_version);
  // And the field is inside the hashed envelope, so the receipt hash now separates them too.
  assert.notEqual(sha256(canonicalizeForHash(v2)), sha256(canonicalizeForHash(v1)));
});

// The same point from the bank's own side: an entry's content hash is a hash of its
// wording. Carry the wording forward and the hash comes with it.
test("an entry's content hash follows its wording, not its bank", () => {
  const entry = SECOND_QUESTION_BANK.find((e) => e.id === "sq.sources");
  assert.ok(entry, "sq.sources is in the bank");
  assert.equal(entry.content_hash, sha256(entry.instruction_text));
});

// ── Legacy compatibility: no backfill, ever ──────────────────────────────────────────

test("an analysis with no bank version yields an empty field, never the current tag", () => {
  const r = receiptFor({ chip_id: "sq.sources", instruction_version: "v1" });
  assert.equal(r.paired_analysis.bank_version, "");
  assert.notEqual(r.paired_analysis.bank_version, SECOND_QUESTION_BANK_VERSION);
});

// A row predating the column is a recorded gap in the historical record. Reporting "" is
// the honest answer; reporting today's constant would assert a bank that row was never
// written under.
test("an empty bank version is preserved through the receipt, not coerced", () => {
  const r = receiptFor({ chip_id: "sq.sources", instruction_version: "v1", bank_version: "" });
  assert.equal(r.paired_analysis.bank_version, "");
  assert.ok("bank_version" in r.paired_analysis, "the field is present and empty, not absent");
});

// ── The write path and the replay path, read from source ─────────────────────────────

test("a fresh chip run stamps the bank version from the tree", () => {
  assert.match(
    SRC,
    /bank_version: SECOND_QUESTION_BANK_VERSION,/,
    "the fresh chipAnalysis stamps the imported constant",
  );
  assert.match(
    SRC,
    /bankVersion: SECOND_QUESTION_BANK_VERSION,/,
    "and the capture record carries the same constant to the row",
  );
  assert.match(
    SRC,
    /"Bank Version": record\.bankVersion \|\| "",/,
    "which the chip branch of the Airtable fields map writes as Bank Version",
  );
});

// The Bank Version column belongs to the chip lane only. An inspection follow-up is not
// steered by a bank entry, so a bank version on that row would name a set the run never
// drew from.
test("only the chip branch writes Bank Version", () => {
  assert.equal(SRC.split('"Bank Version"').length - 1, 2, "one write in the fields map, one read on replay");
});

test("the replay path reads the row's own stamp with no fallback", () => {
  assert.match(SRC, /bank_version: f\["Bank Version"\] \|\| "",/, "row first, empty string second, nothing else");
  // Every rejected fallback, named. A read that reached for the request body, the chip
  // entry, or the current constant would each be a different way of asserting a bank the
  // row never recorded.
  assert.ok(!/bank_version: f\["Bank Version"\] \|\| embed\./.test(SRC), "never the client's claim");
  assert.ok(
    !/bank_version: f\["Bank Version"\] \|\| SECOND_QUESTION_BANK_VERSION/.test(SRC),
    "never today's constant",
  );
  assert.ok(!/bank_version: SECOND_QUESTION_BANK_VERSION;?\s*\/\/ replay/.test(SRC), "never stamped on a replay");
});

// The join key is untouched. Adding a column that participated in idempotency would make
// a v2 rerun of a v1 pair look like a new pair and buy a second model call.
test("the bank version is not part of the idempotency key", () => {
  const lookup = SRC.slice(SRC.indexOf("export async function findExistingPaired"));
  const body = lookup.slice(0, lookup.indexOf("\n}\n"));
  assert.ok(!body.includes("Bank Version"), "findExistingPaired keys on the pair, not on the bank");
  assert.ok(body.includes("{Open Run ID}") && body.includes("{Targeted Answer Hash}"));
});
