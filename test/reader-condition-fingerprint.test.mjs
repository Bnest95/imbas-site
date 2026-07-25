// Phase 0 §E — versioned condition fingerprint for longitudinal comparability.
// The fingerprint is derived from the RECORDED run conditions only (model identity,
// inspector prompt version, run conditions), is deterministic and order-independent,
// and changes iff a condition changes — so a model/prompt swap is flagged rather
// than silently making old and new candidate estimates look comparable.
// Run: node --test test/reader-condition-fingerprint.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

import {
  conditionFingerprint,
  CONDITION_FINGERPRINT_VERSION,
  buildSingleReceipt,
  canonicalizeForHash,
} from "../reader-receipt.js";

const sha256Hex = (s) => createHash("sha256").update(String(s), "utf8").digest("hex");

const PROV = {
  reader_model_version: "claude-opus-4-8",
  inspector_prompt_version: "reader.v3",
  inspector_run_conditions: { thinking: "adaptive", max_tokens: 8192, temperature: "default" },
};

test("fingerprint is versioned and carries the recorded conditions", () => {
  const fp = conditionFingerprint(PROV);
  assert.ok(fp.startsWith(`${CONDITION_FINGERPRINT_VERSION}|`), "leads with the fingerprint version");
  assert.ok(fp.includes("model=claude-opus-4-8"));
  assert.ok(fp.includes("prompt=reader.v3"));
  assert.ok(fp.includes("max_tokens=8192"));
  assert.ok(fp.includes("temperature=default"));
  assert.ok(fp.includes("thinking=adaptive"));
});

test("fingerprint is deterministic and independent of run-conditions key order", () => {
  const reordered = {
    reader_model_version: "claude-opus-4-8",
    inspector_prompt_version: "reader.v3",
    inspector_run_conditions: { temperature: "default", thinking: "adaptive", max_tokens: 8192 },
  };
  assert.equal(conditionFingerprint(PROV), conditionFingerprint(reordered));
});

test("any condition change yields a different fingerprint (comparability break is visible)", () => {
  const base = conditionFingerprint(PROV);
  const modelSwap = conditionFingerprint({ ...PROV, reader_model_version: "claude-opus-4-9" });
  const promptSwap = conditionFingerprint({ ...PROV, inspector_prompt_version: "reader.v4" });
  const condSwap = conditionFingerprint({
    ...PROV,
    inspector_run_conditions: { ...PROV.inspector_run_conditions, max_tokens: 4096 },
  });
  assert.notEqual(base, modelSwap);
  assert.notEqual(base, promptSwap);
  assert.notEqual(base, condSwap);
});

test("fingerprint is derived only from recorded conditions — nothing else leaks in", () => {
  // Extra provenance fields (hashes, request id, timestamp) must NOT move it.
  const noisy = {
    ...PROV,
    source_content_hash: sha256Hex("src"),
    reader_output_hash: sha256Hex("out"),
    run_timestamp: "2026-07-24T00:00:00.000Z",
    request_id: "abc123",
  };
  assert.equal(conditionFingerprint(noisy), conditionFingerprint(PROV));
});

test("missing/garbage provenance degrades to a stable versioned stub, never throws", () => {
  const empty = `${CONDITION_FINGERPRINT_VERSION}|model=|prompt=`;
  assert.equal(conditionFingerprint(undefined), empty);
  assert.equal(conditionFingerprint(null), empty);
  assert.equal(conditionFingerprint({}), empty);
  assert.equal(conditionFingerprint({ inspector_run_conditions: [1, 2] }), empty); // array ignored
});

test("buildSingleReceipt stamps the fingerprint from its own provenance and stays hashable", () => {
  const receipt = buildSingleReceipt({
    generatedAt: "2026-07-24T00:00:00.000Z",
    question: "What are the risks of relying on AI for triage?",
    topic: "triage",
    declaredModel: "GPT-5",
    answer: "AI triage can speed intake. It reduces wait times.",
    inspection: {
      completeness: "partial",
      the_read: "vendor-summary read",
      what_was_left_out: ["failure modes"],
      how_it_was_shaped: "benefit-forward",
      inspection_note: "",
    },
    measurement: null,
    provenance: PROV,
  });
  const prov = receipt.open_run.provenance;
  assert.equal(prov.fingerprint_version, CONDITION_FINGERPRINT_VERSION);
  assert.equal(prov.condition_fingerprint, conditionFingerprint(PROV));

  // Deterministic digest preserved: the hash recomputes over the present fields.
  receipt.integrity.content_hash = sha256Hex(canonicalizeForHash(receipt));
  const again = sha256Hex(canonicalizeForHash(receipt));
  assert.equal(receipt.integrity.content_hash, again, "hash is stable and self-consistent");
});
