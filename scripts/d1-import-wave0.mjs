#!/usr/bin/env node
// Runs the Wave 0 import and writes the report to .d1-import/, which is
// ignored. The report contains governed capture content and must never become
// a tracked file.
//
//   IMBAS_WAVE0_ROOT=/path/to/wave-0 node scripts/d1-import-wave0.mjs

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { importWave0, evaluateAcceptance, locateWave0Record } from "../registry/wave0-import.mjs";

const OUTPUT_DIR = ".d1-import";

function main() {
  const location = locateWave0Record();
  if (!location.located) {
    console.error(`Wave 0 record not located: ${location.reason}`);
    console.error("Set IMBAS_WAVE0_ROOT to the governed record's directory and run again.");
    process.exitCode = 1;
    return;
  }

  const result = importWave0();
  const acceptance = evaluateAcceptance(result);

  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(join(OUTPUT_DIR, "import-report.json"), `${JSON.stringify(result, null, 2)}\n`);
  writeFileSync(join(OUTPUT_DIR, "acceptance.json"), `${JSON.stringify(acceptance, null, 2)}\n`);

  const { counts, source } = result;
  console.log(`source            ${source.root}`);
  console.log(`protocol          ${source.protocol_version}  ${source.wave}  ${source.status}`);
  console.log(`ledger            ${source.ledger.sha256}  ${source.ledger.rows} rows`);
  console.log(`manifest rows     ${counts.manifest_rows} (${counts.planned_rows} PLANNED)`);
  console.log(`imported rows     ${counts.imported_rows} of ${counts.governed_rows} governed`);
  console.log(`declared artifacts${String(counts.declared_artifacts).padStart(4)}`);
  console.log(`observations      ${counts.observations}`);
  console.log(`relations         ${result.relations.length} (orphans ${result.relation_orphans.length})`);
  console.log("");

  for (const entry of result.captures) {
    const audit = entry.artifact_status_audit;
    const hashes = entry.artifact_hash_checks;
    const bad = hashes.filter((check) => !check.present || !check.sha256_matches || !check.size_matches);
    console.log(
      [
        entry.record.capture_id.padEnd(17),
        entry.record.capture_status.padEnd(18),
        `effective ${entry.effective.status.padEnd(18)}`,
        `artifacts ${String(hashes.length).padStart(2)}/${String(hashes.length - bad.length).padStart(2)} verified`,
        `obs ${String(entry.observation_count).padStart(2)}`,
        `outside-vocab ${audit.outside_declared_vocabulary.length}`,
      ].join("  "),
    );
  }

  console.log("");
  for (const entry of acceptance.criteria) {
    console.log(`${entry.passed ? "PASS" : "FAIL"}  ${entry.criterion}`);
    console.log(`      ${JSON.stringify(entry.found)}`);
  }

  console.log("");
  console.log(`report written to ${OUTPUT_DIR}/ (ignored)`);
  if (!acceptance.passed) process.exitCode = 1;
}

main();
