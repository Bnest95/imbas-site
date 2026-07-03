// Deterministic staleness check: rebuild workbench-app.jsx in memory (no write)
// and compare its SHA-256 against the committed workbench.bundle.js. If the source
// changed without a rebuild — or the bundle was hand-edited — the hashes diverge
// and this fails loudly. esbuild is deterministic for a pinned version + config,
// and the config is shared with the real builder (workbench-build-config.mjs), so
// a match means the committed bundle is exactly what building the current source
// produces. This does NOT touch the committed bundle.

import * as esbuild from "esbuild";
import fs from "fs";
import { createHash } from "node:crypto";
import { buildOptions, outFile } from "./workbench-build-config.mjs";

const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");
const REBUILD_HINT = "Run: npm run build:workbench  (then commit workbench-app.jsx AND workbench.bundle.js together)";

export async function checkWorkbenchBundle() {
  if (!fs.existsSync(outFile)) {
    return {
      ok: false,
      reason: "missing_bundle",
      message: `workbench.bundle.js is missing. ${REBUILD_HINT}`,
    };
  }

  const result = await esbuild.build(buildOptions({ write: false }));
  const built = result.outputFiles[0].contents;
  const committed = fs.readFileSync(outFile);

  const builtHash = sha256(built);
  const committedHash = sha256(committed);
  const ok = builtHash === committedHash;

  return {
    ok,
    reason: ok ? null : "stale_bundle",
    builtHash,
    committedHash,
    message: ok
      ? "workbench.bundle.js is in sync with workbench-app.jsx"
      : `workbench.bundle.js is STALE — it does not match a fresh build of workbench-app.jsx. ${REBUILD_HINT}`,
  };
}

// CLI: node scripts/check-workbench-bundle.mjs  → exit 1 (loud) when stale.
if (import.meta.url === `file://${process.argv[1]}`) {
  const r = await checkWorkbenchBundle();
  if (r.ok) {
    console.log(`✓ ${r.message}`);
    process.exit(0);
  }
  console.error(`✗ ${r.message}`);
  if (r.builtHash) {
    console.error(`  expected (fresh build): ${r.builtHash}`);
    console.error(`  committed bundle:       ${r.committedHash}`);
  }
  process.exit(1);
}
