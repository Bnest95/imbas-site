// Guardrail: the daily-brief workflow must supply AIRTABLE_INSPECTION_SHARES_TABLE to the
// Collect step. If it is unset, collect-airtable.mjs falls back and the P4 reported-share
// moderation queue silently degrades to "unavailable" in every unattended brief — a reported
// share would never surface for human review. This test fails loudly if that wiring is ever
// removed or drifts out of the Collect step's env block.
// Run: node --test test/daily-brief-wiring.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const yml = readFileSync(
  fileURLToPath(new URL("../.github/workflows/daily-brief.yml", import.meta.url)),
  "utf8",
);

// Isolate the "Collect Airtable ..." step: from its `- name:` line to the next step at the
// same indent, so the assertion cannot be satisfied by an unrelated step or a comment elsewhere.
function collectStepBlock(text) {
  const start = text.indexOf("- name: Collect Airtable");
  assert.notEqual(start, -1, "workflow must have a 'Collect Airtable' step");
  const rest = text.slice(start);
  const next = rest.indexOf("\n      - name:", 1); // next step is indented 6 spaces under steps:
  return next === -1 ? rest : rest.slice(0, next);
}

test("daily-brief Collect step passes AIRTABLE_INSPECTION_SHARES_TABLE (variable or secret)", () => {
  const block = collectStepBlock(yml);
  assert.match(
    block,
    /AIRTABLE_INSPECTION_SHARES_TABLE:\s*\$\{\{\s*(?:vars|secrets)\.AIRTABLE_INSPECTION_SHARES_TABLE\s*\}\}/,
    "Collect step must wire AIRTABLE_INSPECTION_SHARES_TABLE so the reported-shares queue cannot silently vanish",
  );
});

test("AIRTABLE_INSPECTION_SHARES_TABLE sits inside the Collect step's env: block, before run:", () => {
  const block = collectStepBlock(yml);
  const envIdx = block.indexOf("env:");
  const runIdx = block.indexOf("run:");
  const keyIdx = block.indexOf("AIRTABLE_INSPECTION_SHARES_TABLE:");
  assert.ok(envIdx !== -1, "Collect step must have an env: block");
  assert.ok(runIdx !== -1, "Collect step must have a run: block");
  assert.ok(keyIdx > envIdx && keyIdx < runIdx, "key must be an env var of the Collect step, not elsewhere");
});
