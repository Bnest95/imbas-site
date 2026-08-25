// reader-chip-prompt-version — provenance guardrail for the user-chip analysis prompt.
//
// api/read-paired.js said, in a comment above CHIP_PAIRED_PROMPT_VERSION, that "a
// fingerprint test pins the prompt to that version so a silent edit fails QA." No such
// test existed. The claim was not wrong about what should be true; it was a note that
// read like a guarantee, and anyone relying on it was relying on nothing. This file is
// what makes that sentence true.
//
// The rule, mirroring test/reader-prompt-version.test.mjs for the single-mode prompt:
// CHIP_PAIRED_SYSTEM_PROMPT is pinned by SHA-256 to CHIP_PAIRED_PROMPT_VERSION. Editing
// the prompt changes the fingerprint and FAILS until someone deliberately
//   1. bumps CHIP_PAIRED_METHOD_VERSION in reader-paired.js, and
//   2. registers the new version's fingerprint in KNOWN_FINGERPRINTS below.
// Add entries; never edit one. The key set is every chip analysis prompt that has ever
// shipped, and rewriting a value would erase the record it exists to keep.
//
// Constants only — no network, no model call, no capture.
//
// Run: node --test test/reader-chip-prompt-version.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";

import {
  CHIP_PAIRED_SYSTEM_PROMPT,
  CHIP_PAIRED_PROMPT_VERSION,
  PAIRED_SYSTEM_PROMPT,
  parseChipMeasurement,
} from "../api/read-paired.js";
import { CHIP_PAIRED_METHOD_VERSION } from "../reader-paired.js";
import { buildChipPairedReceipt } from "../reader-receipt.js";

const KNOWN_FINGERPRINTS = {
  "chip.1.0": "75f8b7d9e0bda7c325bdadf6c3bf62c5d5554380e89344651b0f150c54d0a698",
};

const fingerprint = (s) => createHash("sha256").update(s, "utf8").digest("hex");

test("CHIP_PAIRED_SYSTEM_PROMPT is exported as a non-empty string", () => {
  assert.equal(typeof CHIP_PAIRED_SYSTEM_PROMPT, "string");
  assert.ok(CHIP_PAIRED_SYSTEM_PROMPT.length > 0, "CHIP_PAIRED_SYSTEM_PROMPT must not be empty");
});

test("CHIP_PAIRED_PROMPT_VERSION is a well-formed chip.N.N tag", () => {
  assert.equal(typeof CHIP_PAIRED_PROMPT_VERSION, "string");
  assert.match(
    CHIP_PAIRED_PROMPT_VERSION,
    /^chip\.\d+\.\d+$/,
    `CHIP_PAIRED_PROMPT_VERSION "${CHIP_PAIRED_PROMPT_VERSION}" should look like "chip.1.0"`,
  );
});

// The single source of truth. The prompt tag is not a second version to keep in step by
// hand; it is the method version, and the receipt reads it as such on the replay path.
test("CHIP_PAIRED_PROMPT_VERSION tracks CHIP_PAIRED_METHOD_VERSION", () => {
  assert.equal(CHIP_PAIRED_PROMPT_VERSION, CHIP_PAIRED_METHOD_VERSION);
});

test("CHIP_PAIRED_PROMPT_VERSION is registered in KNOWN_FINGERPRINTS", () => {
  assert.ok(
    CHIP_PAIRED_PROMPT_VERSION in KNOWN_FINGERPRINTS,
    `Unknown CHIP_PAIRED_PROMPT_VERSION "${CHIP_PAIRED_PROMPT_VERSION}". Register its ` +
      `CHIP_PAIRED_SYSTEM_PROMPT fingerprint in test/reader-chip-prompt-version.test.mjs.`,
  );
});

test("CHIP_PAIRED_SYSTEM_PROMPT fingerprint matches the pinned version", () => {
  assert.equal(
    fingerprint(CHIP_PAIRED_SYSTEM_PROMPT),
    KNOWN_FINGERPRINTS[CHIP_PAIRED_PROMPT_VERSION],
    `CHIP_PAIRED_SYSTEM_PROMPT changed but the version is still "${CHIP_PAIRED_PROMPT_VERSION}". ` +
      `Bump CHIP_PAIRED_METHOD_VERSION in reader-paired.js and add the new fingerprint to ` +
      `KNOWN_FINGERPRINTS so every chip receipt stays traceable to the prompt that produced it.`,
  );
});

// The two prompts are separate artifacts under separate pins. A chip run is descriptive
// and an inspection run is measured, and a change that collapsed one into the other would
// otherwise pass every other check in the suite.
test("the chip prompt is not the inspection prompt", () => {
  assert.notEqual(CHIP_PAIRED_SYSTEM_PROMPT, PAIRED_SYSTEM_PROMPT);
  assert.notEqual(fingerprint(CHIP_PAIRED_SYSTEM_PROMPT), fingerprint(PAIRED_SYSTEM_PROMPT));
});

// A pin nobody can read is provenance the artifact does not carry. The version has to
// reach the exported receipt, beside the method version already there.
test("the prompt version reaches the chip receipt", () => {
  const measured = parseChipMeasurement({ delta_items: [{ point: "the second answer names the filing window" }] });
  assert.equal(measured.paired_prompt_version, CHIP_PAIRED_PROMPT_VERSION);

  const receipt = buildChipPairedReceipt({
    generatedAt: "2026-08-24T00:00:00.000Z",
    openRun: { question: "", answer: "first answer", provenance: { request_id: "abc0123456789def" } },
    chipAnalysis: { ...measured, chip_id: "c1", instruction_version: "1.0", open_run_id: "abc0123456789def" },
    declarations: [],
  });
  assert.equal(receipt.paired_analysis.paired_prompt_version, CHIP_PAIRED_PROMPT_VERSION);
  assert.equal(receipt.paired_analysis.paired_method_version, CHIP_PAIRED_METHOD_VERSION);
});

// No backfill. A row written before the field existed reports nothing rather than
// borrowing today's tag, exactly as paired_method_version does on the inspection payload.
test("an analysis with no prompt version yields an empty field, never the current tag", () => {
  const receipt = buildChipPairedReceipt({
    generatedAt: "2026-08-24T00:00:00.000Z",
    openRun: { question: "", answer: "first answer", provenance: { request_id: "abc0123456789def" } },
    chipAnalysis: { chip_id: "c1", instruction_version: "1.0", delta_items: [] },
    declarations: [],
  });
  assert.equal(receipt.paired_analysis.paired_prompt_version, "");
});

// The server derives the instruction from the frozen bank by id; it must derive the
// prompt the same way. Nothing in the request body may reach the model as the system
// prompt, under any key.
test("the analysis prompt is never taken from the client", () => {
  const text = fs.readFileSync(new URL("../api/read-paired.js", import.meta.url), "utf8");
  const sent = text.indexOf("text: isChip ? CHIP_PAIRED_SYSTEM_PROMPT : PAIRED_SYSTEM_PROMPT");
  assert.ok(sent > 0, "the system prompt is no longer selected from the two frozen constants");
  assert.ok(
    !/system[\s_]*(?:prompt)?\s*[:=]\s*body\./i.test(text),
    "a request field is being used as the system prompt",
  );
});
