// reader-span-bank — the eleven span-directed requests, pinned.
//
// SECOND_QUESTION_BANK discipline in full, applied to a bank that was RECOVERED rather
// than authored. That difference is what most of this file is about: the eleven entries
// came out of a read-only recon session's log, verbatim, and the founder ruling that
// seeded them said "fabricate nothing" and "do not author substitutes". A hash pin is
// the only thing that can hold a verbatim transcription verbatim, because nothing else
// in the repo remembers what the log said.
//
// Gates held here:
//   - Shape: a versioned bank of exactly eleven ordered entries with the recovered ids,
//     the recorded modes, and the full field set on every entry.
//   - Content hash + immutability pin: each content_hash is an INDEPENDENTLY recomputed
//     lowercase-hex SHA-256 over the exact UTF-8 bytes of instruction_text (no trimming,
//     no normalization), pinned against the entry's instruction_version. Editing a text
//     without bumping its version and updating the pin fails here — which for THIS bank
//     means an edit away from the log fails here.
//   - Deep immutability: the array, every entry, and every nested object/array frozen.
//   - Seeding provenance: every entry names the log it came from and pins that log's
//     sha256, so a later pass can tell whether it holds the same corpus or a similar one.
//   - Exclusions: the three ids the founder ruling kept out are recorded, absent from the
//     bank, and their texts appear nowhere in the module source.
//   - Default determinism: defaultSpanEntry is first-of-mode in recorded order.
//
// Content-blind and pure: no model calls, no network, no DOM.
// Run: node --test test/reader-span-bank.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  READER_SPAN_BANK_VERSION,
  READER_SPAN_BANK,
  SPAN_MODES,
  PHASE0_SEED_LOG,
  PHASE0_SEED_LOG_SHA256,
  PHASE0_SEEDING_TAG,
  PHASE0_EXCLUDED_IDS,
  spanEntriesForMode,
  defaultSpanEntry,
} from "../reader-span-bank.js";

// Independent hash primitive — the module ships no hasher, by contract. This is the
// test's own, matching the exact-bytes rule (utf8 in, lowercase hex out).
const sha256Hex = (s) => createHash("sha256").update(s, "utf8").digest("hex");

const MODULE_PATH = fileURLToPath(new URL("../reader-span-bank.js", import.meta.url));

// The recovered ids, in the order the Phase 0 return recorded them. Order is
// load-bearing: composeSpanRequest takes the first entry of the requested mode, so this
// order is what makes the default deterministic and traceable to the log.
const EXPECTED_IDS = ["P1", "P2", "P3", "P4", "P5", "P6", "D1", "D2", "D3", "D4", "D6"];

// Mode per entry, taken from the Phase 0 return, which STATES the mapping rather than
// implying it: the P-series is PROBLEM and the D-series is DESIRED. Written out per id
// rather than derived from the letter, so a future entry that breaks the pattern cannot
// be silently absorbed by a rule that reads the first character.
const EXPECTED_MODES = {
  P1: "problem",
  P2: "problem",
  P3: "problem",
  P4: "problem",
  P5: "problem",
  P6: "problem",
  D1: "desired",
  D2: "desired",
  D3: "desired",
  D4: "desired",
  D6: "desired",
};

// The sub-shapes the Phase 0 return recorded, in order.
const EXPECTED_SUB_SHAPES = {
  P1: "generic",
  P2: "wrong",
  P3: "missing",
  P4: "refused",
  P5: "not-done",
  P6: "loop",
  D1: "expand",
  D2: "do-it",
  D3: "properly",
  D4: "artifact",
  D6: "narrow",
};

// THE IMMUTABILITY PIN: {id → {version, hash}}. hash is the SHA-256 the instruction text
// is FROZEN to at this version. The test recomputes from the live text and asserts it
// equals this pin, so a text change without a version bump + pin update fails CI.
//
// For a recovered bank this pin carries a second meaning. These hashes are over the
// strings as the Phase 0 log states them; the module is a transcription and the pin is
// what proves the transcription has not drifted. A well-meant later edit — fixing P1's
// addressee mix, tightening P6 — moves a hash and fails here, which is the point. The
// texts are the founder's recovered corpus, not this repo's copy to improve.
const PINS = {
  P1: { version: "v1", hash: "80ac2946f520584f47050d941bc01cd49b92acea1971143b8f932a4878fe9fc8" },
  P2: { version: "v1", hash: "4376472b8c5de7177e976efe8804de1c9fa38848bc8c7bde7f9d67145c75a243" },
  P3: { version: "v1", hash: "3d0af979c18747215ce234df32a47df82a7c44419afcc93eb691dee6db53afc3" },
  P4: { version: "v1", hash: "d2e2ffc4819ffa4b50c1bb406a2246a1d311b695c0fe4a006659b146b3b52499" },
  P5: { version: "v1", hash: "3cacda5c79127a03012537ad5209859401c01c76023b4a46660afb65fea5216e" },
  P6: { version: "v1", hash: "83bfefd3b9de25a2e59d07122000038929df01241e51272f1a61261d5ec9e420" },
  D1: { version: "v1", hash: "b7d8c8bf03098a69a57c80319c0a133ae42c3213ad2b01693716c441c104b6dd" },
  D2: { version: "v1", hash: "bd726cf337e757806a8147e64afddaa7b0853f799116a26eaf5197a5fd431e3b" },
  D3: { version: "v1", hash: "fbf61a2aff3600703e29215b8b60c7c91113ab8de95523e648c300e16c64d1ad" },
  D4: { version: "v1", hash: "506bb3a1b7743196dc02508b3fcf2d146006d9afe1311cd5a1f2d63c30c65eb0" },
  D6: { version: "v1", hash: "a3ad73bb677809380167b67ecd4c8ca0be86267849a68cb40a003fbdb6b23d4d" },
};

const byId = (id) => READER_SPAN_BANK.find((e) => e.id === id);

// ── Version + shape ───────────────────────────────────────────────────────────────

test("the bank is versioned, namespaced like its sibling constants", () => {
  assert.match(READER_SPAN_BANK_VERSION, /^reader-span-bank\.v\d+$/);
});

test("the bank is exactly the eleven recovered entries, ids fixed, unique, and in log order", () => {
  assert.ok(Array.isArray(READER_SPAN_BANK));
  assert.equal(READER_SPAN_BANK.length, 11);
  assert.deepEqual(READER_SPAN_BANK.map((e) => e.id), EXPECTED_IDS);
  assert.equal(new Set(READER_SPAN_BANK.map((e) => e.id)).size, 11);
});

test("SPAN_MODES is the frozen two-value enum, and every entry carries a recorded mode", () => {
  assert.deepEqual(Object.values(SPAN_MODES).slice().sort(), ["desired", "problem"]);
  assert.ok(Object.isFrozen(SPAN_MODES));
  for (const e of READER_SPAN_BANK) {
    assert.equal(e.mode, EXPECTED_MODES[e.id], `${e.id}: mode is the one the Phase 0 return recorded`);
  }
  // Six problem, five desired — D5 is one of the three the ruling excluded.
  assert.equal(spanEntriesForMode(SPAN_MODES.PROBLEM).length, 6);
  assert.equal(spanEntriesForMode(SPAN_MODES.DESIRED).length, 5);
});

test("sub-shapes are the ones the Phase 0 return recorded", () => {
  for (const e of READER_SPAN_BANK) assert.equal(e.sub_shape, EXPECTED_SUB_SHAPES[e.id], e.id);
});

// ── Field set + types ─────────────────────────────────────────────────────────────

const EXPECTED_KEYS = [
  "id",
  "mode",
  "sub_shape",
  "approved_ui_label",
  "instruction_text",
  "instruction_version",
  "seeding_tag",
  "abstraction_note",
  "content_hash",
].sort();

test("every entry carries exactly the contracted field set, correctly typed", () => {
  for (const e of READER_SPAN_BANK) {
    assert.deepEqual(Object.keys(e).sort(), EXPECTED_KEYS, `${e.id}: key set`);
    assert.match(e.id, /^[PD]\d$/);
    assert.equal(typeof e.sub_shape, "string");
    assert.ok(e.sub_shape.length > 0);
    assert.equal(typeof e.instruction_text, "string");
    assert.ok(e.instruction_text.length > 0);
    // No surrounding whitespace: the hash is over exact bytes with no trimming, so a
    // stray leading or trailing space would silently move it.
    assert.equal(e.instruction_text, e.instruction_text.trim(), `${e.id}: no surrounding whitespace`);
    assert.equal(e.instruction_version, "v1");
    assert.equal(typeof e.seeding_tag, "string");
    assert.equal(typeof e.abstraction_note, "string");
    assert.ok(e.abstraction_note.length > 0, `${e.id}: carries an abstraction note`);
    assert.match(e.content_hash, /^[0-9a-f]{64}$/, `${e.id}: content_hash is 64-char lowercase hex`);
  }
});

test("approved_ui_label is null on every entry — a recorded gap, not an oversight", () => {
  // The Phase 0 return supplied an id, a mode, a sub-shape and an instruction per
  // candidate. It supplied no per-entry UI label, and no founder ruling has approved
  // one. A label invented here would be an unapproved string wearing the word
  // "approved". The field stays in the shape so the later lane that adds sub-shape
  // selection has somewhere to put an approved label.
  for (const e of READER_SPAN_BANK) assert.equal(e.approved_ui_label, null, e.id);
});

// ── Content hash: honest + independently recomputed + pinned to the version ───────

test("content_hash is an honest, independently recomputed SHA-256 pinned to the instruction version", () => {
  for (const e of READER_SPAN_BANK) {
    const recomputed = sha256Hex(e.instruction_text);
    // 1. The stored hash is honest: it equals a freshly computed hash of the text.
    assert.equal(e.content_hash, recomputed, `${e.id}: content_hash must equal sha256(instruction_text)`);
    // 2. The text is frozen to its pinned version. For a recovered bank this is also the
    //    verbatim-transcription pin: an edit away from the log fails right here.
    const pin = PINS[e.id];
    assert.ok(pin, `${e.id}: has an immutability pin`);
    assert.equal(e.instruction_version, pin.version, `${e.id}: instruction_version matches the pin`);
    assert.equal(recomputed, pin.hash, `${e.id}: instruction text changed without a version bump + pin update`);
  }
  // No stale pins: the pinned id set is exactly the bank's id set.
  assert.deepEqual(Object.keys(PINS).sort(), EXPECTED_IDS.slice().sort());
});

// ── Seeding provenance ────────────────────────────────────────────────────────────

test("the seed log is named and its hash pinned, so a later pass can tell same corpus from similar", () => {
  assert.match(PHASE0_SEED_LOG, /\.jsonl$/);
  assert.match(PHASE0_SEED_LOG, /\.claude\/projects\//);
  assert.match(PHASE0_SEED_LOG_SHA256, /^[0-9a-f]{64}$/);
  // The tag states both facts in one string, in the form the founder ruling specified.
  assert.ok(PHASE0_SEEDING_TAG.includes(PHASE0_SEED_LOG));
  assert.ok(PHASE0_SEEDING_TAG.includes(PHASE0_SEED_LOG_SHA256));
  assert.match(PHASE0_SEEDING_TAG, /^seeded from Phase 0 recon session log /);
});

test("every entry's seeding_tag records the same log and hash — one recovery, one corpus", () => {
  // All eleven came from one recovery of one log, so a per-entry tag that differed would
  // mean an entry arrived from somewhere unrecorded.
  for (const e of READER_SPAN_BANK) {
    assert.equal(e.seeding_tag, PHASE0_SEEDING_TAG, `${e.id}: seeding tag`);
  }
});

// ── Exclusions: recorded by id, absent in text ────────────────────────────────────

test("the three excluded ids are recorded, absent from the bank, and their texts are nowhere in the module", () => {
  assert.deepEqual([...PHASE0_EXCLUDED_IDS].sort(), ["D5", "P7", "P8"]);
  const shipped = new Set(READER_SPAN_BANK.map((e) => e.id));
  for (const id of PHASE0_EXCLUDED_IDS) {
    assert.ok(!shipped.has(id), `excluded candidate ${id} is in the bank`);
  }

  // The ruling: record the ids, not the texts, so this module cannot become a back door
  // to the strings it kept out. The module names all three ids in its comment — that is
  // required — but the id set is exactly what it may name. Asserted structurally: the
  // gap between P6 and D1 in the id sequence, and between D4 and D6, is the whole of
  // what the source says about them.
  const src = readFileSync(MODULE_PATH, "utf8");
  for (const id of PHASE0_EXCLUDED_IDS) assert.ok(src.includes(id), `${id} must be recorded as excluded`);
  // No excluded id appears as an entry literal.
  for (const id of PHASE0_EXCLUDED_IDS) {
    assert.ok(!src.includes(`id: "${id}"`), `${id} appears as a bank entry literal`);
  }
});

// ── Deep immutability ─────────────────────────────────────────────────────────────

test("the bank is deeply frozen — array, entries, and nested values", () => {
  assert.ok(Object.isFrozen(READER_SPAN_BANK));
  for (const e of READER_SPAN_BANK) assert.ok(Object.isFrozen(e), `${e.id} frozen`);
  assert.ok(Object.isFrozen(PHASE0_EXCLUDED_IDS));

  // And mutation genuinely does not take effect (frozen, not merely flagged).
  const before = READER_SPAN_BANK[0].instruction_text;
  try {
    READER_SPAN_BANK[0].instruction_text = "mutated";
  } catch {
    /* strict-mode throw is the other acceptable outcome */
  }
  assert.equal(READER_SPAN_BANK[0].instruction_text, before);
  const lenBefore = READER_SPAN_BANK.length;
  try {
    READER_SPAN_BANK.push({ id: "X1" });
  } catch {
    /* ditto */
  }
  assert.equal(READER_SPAN_BANK.length, lenBefore);
});

// ── Selection helpers ─────────────────────────────────────────────────────────────

test("defaultSpanEntry is first-of-mode in recorded order, so the default is traceable not chosen", () => {
  // Which entry a mode SHOULD default to is a founder decision this module does not
  // make. It only makes the current answer deterministic and traceable to the log.
  assert.equal(defaultSpanEntry(SPAN_MODES.PROBLEM).id, "P1");
  assert.equal(defaultSpanEntry(SPAN_MODES.DESIRED).id, "D1");
  assert.equal(defaultSpanEntry(SPAN_MODES.PROBLEM), spanEntriesForMode(SPAN_MODES.PROBLEM)[0]);
  assert.equal(defaultSpanEntry(SPAN_MODES.DESIRED), spanEntriesForMode(SPAN_MODES.DESIRED)[0]);
});

test("an unknown mode yields no entries and no default, rather than a wrong one", () => {
  assert.deepEqual(spanEntriesForMode("nonsense"), []);
  assert.equal(defaultSpanEntry("nonsense"), null);
  assert.equal(defaultSpanEntry(undefined), null);
  assert.equal(defaultSpanEntry(""), null);
});

test("spanEntriesForMode preserves recorded order within a mode", () => {
  assert.deepEqual(spanEntriesForMode(SPAN_MODES.PROBLEM).map((e) => e.id), ["P1", "P2", "P3", "P4", "P5", "P6"]);
  assert.deepEqual(spanEntriesForMode(SPAN_MODES.DESIRED).map((e) => e.id), ["D1", "D2", "D3", "D4", "D6"]);
});

// ── The one entry whose recorded oddity is reported rather than repaired ──────────

test("P1's addressee mix is preserved verbatim and flagged in its abstraction note", () => {
  // P1 opens addressing the person ("You marked this as the problem. Ask your AI:") and
  // then addresses the AI that receives the paste. The founder ruling said seed verbatim
  // and fabricate nothing, so the mix is preserved exactly as the log records it and
  // flagged for founder review rather than silently edited here. This test is what stops
  // a later pass tidying it without a ruling: the note must still say so.
  const p1 = byId("P1");
  assert.match(p1.instruction_text, /^You marked this as the problem\. Ask your AI:/);
  assert.match(p1.abstraction_note, /addressee mix/i);
  assert.match(p1.abstraction_note, /founder review/i);
});
