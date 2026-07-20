// reader-second-question-bank — the six standing follow-up instructions, pinned.
//
// Gates held here:
//   - Shape: a versioned bank of exactly six ordered entries with the fixed stable ids
//     and the verbatim adopted labels; every entry carries the full field set.
//   - Content hash + immutability pin: each entry's content_hash is an INDEPENDENTLY
//     recomputed lowercase-hex SHA-256 over the exact UTF-8 bytes of instruction_text
//     (no trimming, no normalization), and the recomputed hash is pinned against the
//     entry's instruction_version. Editing any instruction text without bumping its
//     version and updating the pin fails here — the "no silent edit" rule as CI.
//   - Deep immutability: the array, every entry, and every nested object/array are
//     frozen; no mutation takes effect.
//   - Provenance discipline: each seeding_tag is one of the four enum values; the tags
//     match the seeding pass (chips 2/5 capture_derived, chip 3 mixed, chips 1/4/6
//     practice_derived); cross-repo seed ids are namespaced external refs, never bare
//     local paths; practice_derived entries carry no seed case ids.
//   - Word ban: the three over-strong evidence words appear nowhere in the module.
//
// Content-blind and pure: no model calls, no network, no instrument files read.
// Run: node --test test/reader-second-question-bank.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import {
  SECOND_QUESTION_BANK_VERSION,
  SECOND_QUESTION_BANK,
  SECOND_QUESTION_SEEDING_TAGS,
} from "../reader-second-question-bank.js";

// Independent hash primitive — the module ships no hasher; this is the test's own,
// matching the exact-bytes rule (utf8 in, lowercase hex out).
const sha256Hex = (s) => createHash("sha256").update(s, "utf8").digest("hex");

// The fixed stable ids, in order. These are compatibility surfaces once merged.
const EXPECTED_IDS = [
  "sq.material",
  "sq.sources",
  "sq.date_version",
  "sq.direct_answer",
  "sq.quantity",
  "sq.fact_assumption",
];

// The adopted labels, verbatim, in order.
const EXPECTED_LABELS = [
  "Didn't use the material I provided",
  "Doesn't show where its claims came from",
  "Doesn't say what date or version applies",
  "Didn't answer the question I actually asked",
  "Didn't give the number or range I asked for",
  "Mixes facts with assumptions",
];

// Seeding tag per entry, from the documented seeding pass.
const EXPECTED_TAGS = {
  "sq.material": "practice_derived",
  "sq.sources": "capture_derived",
  "sq.date_version": "mixed",
  "sq.direct_answer": "practice_derived",
  "sq.quantity": "capture_derived",
  "sq.fact_assumption": "practice_derived",
};

// The immutability pin: {id → {version, hash}}. hash is the SHA-256 the instruction
// text is FROZEN to at this version. The test recomputes the hash from the live text
// and asserts it equals this pin — so a text change without a version bump + pin update
// fails CI. These are not copied from the module's content_hash; they are the recorded
// expectation the module must reproduce.
const PINS = {
  "sq.material": { version: "v1", hash: "d9e7d15b3d88d9998913b581de2d520300221df4cfc91d1750134ec09556994a" },
  "sq.sources": { version: "v1", hash: "42a23c8211cb2a1a1592a30dcf03cb42edfbfc9ca6a398c4ae760db8d99e9c81" },
  "sq.date_version": { version: "v1", hash: "dc6f07c835c92b5ddffb8cdc9c3261866c2f20370e825340f703e8470ae40ff8" },
  "sq.direct_answer": { version: "v1", hash: "98fa2a649b3776c6deec3e40c06e218223624849601a823483568dade94a1e8a" },
  "sq.quantity": { version: "v1", hash: "12051d77dd1190464a0404f82fde0b225efa802f732425233181ed6f6bf7a06e" },
  "sq.fact_assumption": { version: "v1", hash: "e07d9fc87aec3e94797a7398ad175cc157436560101243024e0f5f6b108d1309" },
};

const byId = (id) => SECOND_QUESTION_BANK.find((e) => e.id === id);

// ── Version + shape ───────────────────────────────────────────────────────────────

test("the bank is versioned, namespaced like its sibling constants", () => {
  assert.match(SECOND_QUESTION_BANK_VERSION, /^second-question-bank\.v\d+$/);
});

test("the bank is exactly the six ordered entries, ids fixed and unique", () => {
  assert.ok(Array.isArray(SECOND_QUESTION_BANK));
  assert.equal(SECOND_QUESTION_BANK.length, 6);
  assert.deepEqual(SECOND_QUESTION_BANK.map((e) => e.id), EXPECTED_IDS);
  assert.equal(new Set(SECOND_QUESTION_BANK.map((e) => e.id)).size, 6);
});

test("labels are the adopted copy, verbatim and in order", () => {
  assert.deepEqual(SECOND_QUESTION_BANK.map((e) => e.approved_ui_label), EXPECTED_LABELS);
});

// ── Field set + types ───────────────────────────────────────────────────────────────

const EXPECTED_KEYS = [
  "id",
  "approved_ui_label",
  "instruction_text",
  "instruction_version",
  "seeding_tag",
  "seed_case_ids",
  "abstraction_note",
  "author",
  "date",
  "review_status",
  "known_misuse_risks",
  "negative_examples",
  "content_hash",
].sort();

test("every entry carries exactly the contracted field set, correctly typed", () => {
  for (const e of SECOND_QUESTION_BANK) {
    assert.deepEqual(Object.keys(e).sort(), EXPECTED_KEYS, `${e.id}: key set`);
    assert.equal(typeof e.id, "string");
    assert.match(e.id, /^sq\.[a-z_]+$/);
    assert.equal(typeof e.approved_ui_label, "string");
    assert.ok(e.approved_ui_label.length > 0);
    assert.equal(typeof e.instruction_text, "string");
    assert.ok(e.instruction_text.length > 0);
    // No surrounding whitespace: the hash is over the exact bytes with no trimming, so a
    // stray leading/trailing space would silently move the hash.
    assert.equal(e.instruction_text, e.instruction_text.trim(), `${e.id}: no surrounding whitespace`);
    assert.equal(e.instruction_version, "v1");
    assert.equal(typeof e.seeding_tag, "string");
    assert.ok(Array.isArray(e.seed_case_ids));
    assert.equal(typeof e.abstraction_note, "string");
    assert.ok(e.abstraction_note.length > 0);
    assert.equal(e.author, "Imbas");
    assert.equal(e.date, "2026-07-20");
    assert.equal(e.review_status, "authored, pending founder review and bounded testing");
    assert.ok(Array.isArray(e.known_misuse_risks) && e.known_misuse_risks.length >= 1);
    assert.ok(e.known_misuse_risks.every((s) => typeof s === "string" && s.length > 0));
    assert.ok(Array.isArray(e.negative_examples) && e.negative_examples.length >= 1);
    assert.ok(e.negative_examples.every((s) => typeof s === "string" && s.length > 0));
    assert.equal(typeof e.content_hash, "string");
  }
});

test("author is the org, never an automated session, and review is pending on every entry", () => {
  for (const e of SECOND_QUESTION_BANK) {
    assert.equal(e.author, "Imbas");
    assert.match(e.review_status, /pending founder review and bounded testing/);
  }
});

// ── Two-input-shape coarse guard ─────────────────────────────────────────────────────

test("every instruction names the draft shape, not only the chat shape", () => {
  // Coarse structural guard for the work-product input shape: each template must speak
  // to an AI-assisted draft (memo/clause/report passage), not just a chat answer.
  for (const e of SECOND_QUESTION_BANK) {
    assert.match(e.instruction_text, /draft/i, `${e.id}: instruction must address the draft input shape`);
  }
});

// ── Content hash: honest + independently recomputed + pinned to the version ──────────

test("content_hash is an honest, independently recomputed SHA-256 pinned to the instruction version", () => {
  for (const e of SECOND_QUESTION_BANK) {
    // Recompute from the live instruction text over exact UTF-8 bytes — no trimming, no
    // normalization, no prefix/suffix — exactly as the module documents.
    const recomputed = sha256Hex(e.instruction_text);
    assert.match(e.content_hash, /^[0-9a-f]{64}$/, `${e.id}: content_hash is 64-char lowercase hex`);
    // 1. The stored hash is honest: it equals a freshly computed hash of the text.
    assert.equal(e.content_hash, recomputed, `${e.id}: content_hash must equal sha256(instruction_text)`);
    // 2. The text is frozen to its pinned version: recomputed hash equals the pin. Any
    //    edit without bumping instruction_version and updating this pin fails here.
    const pin = PINS[e.id];
    assert.ok(pin, `${e.id}: has an immutability pin`);
    assert.equal(e.instruction_version, pin.version, `${e.id}: instruction_version matches the pin`);
    assert.equal(recomputed, pin.hash, `${e.id}: instruction text changed without a version bump + pin update`);
  }
  // No stale pins: the pinned id set is exactly the bank's id set.
  assert.deepEqual(Object.keys(PINS).sort(), EXPECTED_IDS.slice().sort());
});

// ── Seeding tags + provenance discipline ─────────────────────────────────────────────

test("SECOND_QUESTION_SEEDING_TAGS is the frozen enum of exactly the four valid values", () => {
  assert.deepEqual(
    Object.values(SECOND_QUESTION_SEEDING_TAGS).slice().sort(),
    ["capture_derived", "dossier_derived", "mixed", "practice_derived"],
  );
  assert.ok(Object.isFrozen(SECOND_QUESTION_SEEDING_TAGS));
});

test("every entry's seeding_tag is a valid enum value and matches the seeding pass", () => {
  const valid = new Set(Object.values(SECOND_QUESTION_SEEDING_TAGS));
  for (const e of SECOND_QUESTION_BANK) {
    assert.ok(valid.has(e.seeding_tag), `${e.id}: ${e.seeding_tag} is a valid tag`);
    assert.equal(e.seeding_tag, EXPECTED_TAGS[e.id], `${e.id}: tag matches the seeding pass`);
  }
});

test("seed case ids are namespaced external refs; practice_derived carries none", () => {
  for (const e of SECOND_QUESTION_BANK) {
    for (const cid of e.seed_case_ids) {
      assert.match(cid, /^imbas-instrument:/, `${e.id}: seed id ${cid} is an external namespaced ref`);
      assert.doesNotMatch(cid, /^\.?\//, `${e.id}: seed id ${cid} is not a bare local path`);
    }
    if (e.seeding_tag === "practice_derived") {
      assert.equal(e.seed_case_ids.length, 0, `${e.id}: practice_derived has no seed case ids`);
    } else {
      assert.ok(e.seed_case_ids.length >= 1, `${e.id}: capture/mixed cites at least one seed`);
    }
  }
});

test("the mixed entry is chip 3, and it cites the two captured date/version seeds", () => {
  const e = byId("sq.date_version");
  assert.equal(e.seeding_tag, "mixed");
  assert.deepEqual(e.seed_case_ids, [
    "imbas-instrument:registry/cases/case-005",
    "imbas-instrument:registry/cases/case-009",
  ]);
  // The abstraction note must state the split provenance explicitly (captured date clause
  // vs dossier-only supersession clause), per the structural rule.
  assert.match(e.abstraction_note, /supersession/i);
  assert.match(e.abstraction_note, /dossier-only/i);
});

// ── Deep immutability ────────────────────────────────────────────────────────────────

test("the bank and every nested structure are deeply frozen", () => {
  assert.ok(Object.isFrozen(SECOND_QUESTION_BANK));
  for (const e of SECOND_QUESTION_BANK) {
    assert.ok(Object.isFrozen(e), `${e.id}: entry frozen`);
    assert.ok(Object.isFrozen(e.seed_case_ids), `${e.id}: seed_case_ids frozen`);
    assert.ok(Object.isFrozen(e.known_misuse_risks), `${e.id}: known_misuse_risks frozen`);
    assert.ok(Object.isFrozen(e.negative_examples), `${e.id}: negative_examples frozen`);
  }
});

test("no mutation of the frozen bank takes effect", () => {
  assert.throws(() => SECOND_QUESTION_BANK.push({ id: "sq.evil" }));
  assert.throws(() => {
    SECOND_QUESTION_BANK[0].id = "sq.tampered";
  });
  assert.throws(() => {
    SECOND_QUESTION_BANK[0].content_hash = "0".repeat(64);
  });
  assert.throws(() => SECOND_QUESTION_BANK[0].seed_case_ids.push("imbas-instrument:registry/cases/case-999"));
  assert.throws(() => {
    SECOND_QUESTION_SEEDING_TAGS.NEW_TAG = "new";
  });
  // The bank is unchanged after every rejected mutation.
  assert.equal(SECOND_QUESTION_BANK.length, 6);
  assert.equal(SECOND_QUESTION_BANK[0].id, "sq.material");
  assert.deepEqual(SECOND_QUESTION_BANK.map((e) => e.id), EXPECTED_IDS);
});

// ── Word ban ─────────────────────────────────────────────────────────────────────────

test("the three over-strong evidence words appear nowhere in the module source", () => {
  // Read the module source (comments included) and assert absence of the three words the
  // module bans. Tokens are assembled from fragments so this test's own source never
  // contains them literally; word boundaries keep legitimate neighbors (provenance,
  // validation) from tripping.
  const src = readFileSync(new URL("../reader-second-question-bank.js", import.meta.url), "utf8");
  const banned = [
    new RegExp("\\b" + "valid" + "ated" + "\\b", "i"),
    new RegExp("\\b" + "prov" + "en" + "\\b", "i"),
    new RegExp("\\b" + "known to " + "work" + "\\b", "i"),
  ];
  for (const re of banned) {
    assert.doesNotMatch(src, re, `module source contains a banned over-strong word: ${re}`);
  }
});
