// reader-prompt-version — provenance guardrail for the Reader.
//
// READER_PROMPT_VERSION is stamped onto every Reader Runs capture as the tag that
// says which prompt/protocol produced a run. Its whole value depends on staying
// truthful: if SYSTEM_PROMPT changes but the tag does not, every capture is
// mislabelled and the provenance record silently rots.
//
// This test pins the tag to a SHA-256 fingerprint of the current SYSTEM_PROMPT.
// A prompt edit changes the fingerprint and FAILS QA until someone deliberately:
//   1. bumps READER_PROMPT_VERSION in api/read.js (e.g. "reader.v1" -> "reader.v2"), and
//   2. registers the new version's fingerprint in KNOWN_FINGERPRINTS below.
// A prompt edit that skips either step cannot pass `npm test`.
//
// It imports the two constants only (no network, no model call, no capture), so it
// never touches a live base or spends anything.
//
// Run: node --test test/reader-prompt-version.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

import { SYSTEM_PROMPT, READER_PROMPT_VERSION } from "../api/read.js";

// Registry of prompt fingerprints, keyed by the version tag that describes them.
// Add a new entry (never edit an old one) whenever SYSTEM_PROMPT changes and the
// version is bumped. The key set is the list of prompt versions that have ever
// shipped; the value is the SHA-256 (hex) of that version's SYSTEM_PROMPT.
const KNOWN_FINGERPRINTS = {
  "reader.v1": "e30ee03560916b143ccf2dbeafc0bc367f2b02080e1d7765db2fff8404ba16be",
};

const fingerprint = (s) => createHash("sha256").update(s, "utf8").digest("hex");

test("SYSTEM_PROMPT is exported as a non-empty string", () => {
  assert.equal(typeof SYSTEM_PROMPT, "string");
  assert.ok(SYSTEM_PROMPT.length > 0, "SYSTEM_PROMPT must not be empty");
});

test("READER_PROMPT_VERSION is a well-formed reader.vN tag", () => {
  assert.equal(typeof READER_PROMPT_VERSION, "string");
  assert.match(
    READER_PROMPT_VERSION,
    /^reader\.v\d+$/,
    `READER_PROMPT_VERSION "${READER_PROMPT_VERSION}" should look like "reader.v1"`,
  );
});

test("READER_PROMPT_VERSION is registered in KNOWN_FINGERPRINTS", () => {
  assert.ok(
    READER_PROMPT_VERSION in KNOWN_FINGERPRINTS,
    `Unknown READER_PROMPT_VERSION "${READER_PROMPT_VERSION}". Register its ` +
      `SYSTEM_PROMPT fingerprint in test/reader-prompt-version.test.mjs.`,
  );
});

test("SYSTEM_PROMPT fingerprint matches the pinned version", () => {
  const actual = fingerprint(SYSTEM_PROMPT);
  const expected = KNOWN_FINGERPRINTS[READER_PROMPT_VERSION];
  assert.equal(
    actual,
    expected,
    `SYSTEM_PROMPT changed but READER_PROMPT_VERSION is still "${READER_PROMPT_VERSION}". ` +
      `Bump the version in api/read.js and add the new fingerprint to KNOWN_FINGERPRINTS ` +
      `so every capture stays traceable to the prompt that produced it.`,
  );
});
