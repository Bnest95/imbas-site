// Guardrail: the committed workbench.bundle.js must match a fresh build of
// workbench-app.jsx. If the source changed without a rebuild (or the bundle was
// hand-edited), this fails loudly so a stale bundle never ships.
// Run: node --test test/workbench-bundle.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";

import { checkWorkbenchBundle } from "../scripts/check-workbench-bundle.mjs";

test("workbench.bundle.js is in sync with workbench-app.jsx", async () => {
  const result = await checkWorkbenchBundle();
  assert.ok(result.ok, result.message);
});
