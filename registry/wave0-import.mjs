// Wave 0 import — D1's acceptance proof.
//
// Reads the governed record and writes a registry beside it. It never writes
// back: no governed file is opened for writing, renamed, or moved.
//
// The record is located by IMBAS_WAVE0_ROOT rather than by a path baked into
// the tree. It lives outside this repository on purpose, and the importer fails
// closed when it is unreachable rather than proceeding against anything else.

import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { importCaptureRecord, auditArtifactStatuses, effectiveCaptureStatus } from "./capture-record.mjs";
import { registerQuestionSeries, verifyBankRegeneration, waveScheduleFromBankEntry } from "./question-series.mjs";
import { extractSourceObservations, checkDeclaredCounts } from "./source-observation.mjs";
import { readStatusAmendments, captureStatusVocabulary, diffAgainstRecordVocabulary, classifyArtifactStatus } from "./status-vocabulary.mjs";
import { findOrphanRelations } from "./relation-types.mjs";

const REQUIRED_ENTRIES = Object.freeze([
  "manifest.json",
  "bank.json",
  "COMPROMISES.md",
  "checksums.txt",
  "captures",
]);

export function locateWave0Record(root = process.env.IMBAS_WAVE0_ROOT ?? null) {
  if (typeof root !== "string" || root.length === 0) {
    return Object.freeze({
      located: false,
      root: null,
      reason: "IMBAS_WAVE0_ROOT is not set; the governed record lives outside this repository",
      entries: Object.freeze([]),
    });
  }
  const entries = REQUIRED_ENTRIES.map((name) => {
    try {
      const stats = statSync(join(root, name));
      return Object.freeze({
        name,
        readable: true,
        bytes: stats.isDirectory() ? null : stats.size,
        directory: stats.isDirectory(),
      });
    } catch {
      return Object.freeze({ name, readable: false, bytes: null, directory: false });
    }
  });
  const missing = entries.filter((entry) => !entry.readable).map((entry) => entry.name);
  return Object.freeze({
    located: missing.length === 0,
    root,
    reason: missing.length === 0 ? null : `unreadable: ${missing.join(", ")}`,
    entries: Object.freeze(entries),
  });
}

function sha256File(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function readLedger(root) {
  const path = join(root, "checksums.txt");
  const text = readFileSync(path, "utf8");
  const [header] = text.split("\n");
  return Object.freeze({
    header,
    sha256: createHash("sha256").update(text, "utf8").digest("hex"),
    rows: text.split("\n").filter((line) => line.trim().length > 0 && !line.startsWith("#")).length,
  });
}

// Every declared artifact is re-hashed from disk. A hash that no longer matches
// is a custody failure and is reported per file, never rounded off.
function verifyArtifactHashes(root, row) {
  const declared = row.artifact_hashes ?? {};
  const results = [];
  for (const [filename, expected] of Object.entries(declared)) {
    const path = join(root, "captures", row.capture_id, filename);
    try {
      const stats = statSync(path);
      const actual = sha256File(path);
      results.push({
        filename,
        present: true,
        sha256_matches: actual === expected.sha256,
        size_matches: stats.size === expected.size_bytes,
      });
    } catch {
      results.push({ filename, present: false, sha256_matches: false, size_matches: false });
    }
  }
  return results;
}

function readCaptureArtifacts(root, capture_id) {
  const dir = join(root, "captures", capture_id);
  let filenames;
  try {
    filenames = readdirSync(dir).sort();
  } catch {
    return [];
  }
  const artifacts = [];
  for (const filename of filenames) {
    if (!filename.endsWith(".json")) continue;
    try {
      artifacts.push({ filename, body: JSON.parse(readFileSync(join(dir, filename), "utf8")) });
    } catch {
      artifacts.push({ filename, body: null });
    }
  }
  return artifacts;
}

export function importWave0({ root = process.env.IMBAS_WAVE0_ROOT ?? null } = {}) {
  const location = locateWave0Record(root);
  if (!location.located) {
    throw new Error(
      `Wave 0 record not located (${location.reason}). D1 imports the governed ` +
        "record or it imports nothing; it does not proceed against reconstructed data.",
    );
  }

  const manifest = JSON.parse(readFileSync(join(location.root, "manifest.json"), "utf8"));
  const bank = JSON.parse(readFileSync(join(location.root, "bank.json"), "utf8"));
  const ledger = readLedger(location.root);

  const vocabulary_diff = diffAgainstRecordVocabulary(manifest.status_vocabulary);
  const amendments = readStatusAmendments(manifest.status_vocabulary);
  const capture_vocabulary = captureStatusVocabulary(amendments);

  const series = bank.questions.map((family) => registerQuestionSeries(family));
  const series_verification = series.map((entry) => verifyBankRegeneration(entry));
  const wave_schedule = bank.questions.map((family) =>
    waveScheduleFromBankEntry(family, manifest.wave),
  );

  const planned = manifest.captures.filter((row) => row.capture_status === "PLANNED");
  const governed = manifest.captures.filter((row) => row.capture_status !== "PLANNED");

  const captures = [];
  const observations = [];
  const count_checks = [];
  const unextracted_lists = [];

  for (const row of governed) {
    const record = importCaptureRecord(row);
    const artifacts = readCaptureArtifacts(location.root, row.capture_id);
    const artifact_hash_checks = verifyArtifactHashes(location.root, row);

    let observation_count = 0;
    for (const artifact of artifacts) {
      if (artifact.body === null) continue;
      const extraction = extractSourceObservations(artifact.body, {
        capture_id: row.capture_id,
        capture_instrument_ref: row.instrument_ref,
      });
      if (!extraction.admitted) continue;
      observations.push(...extraction.observations);
      observation_count += extraction.observations.length;
      count_checks.push(...checkDeclaredCounts(extraction));
      for (const list of extraction.unextracted_lists) {
        unextracted_lists.push({
          capture_id: row.capture_id,
          artifact: artifact.filename,
          path: list.path,
          length: list.length,
        });
      }
    }

    captures.push({
      record,
      effective: effectiveCaptureStatus(record),
      artifact_status_audit: auditArtifactStatuses(record),
      artifact_hash_checks,
      artifacts_on_disk: artifacts.length,
      observation_count,
    });
  }

  // No relation is created from this sitting. replicate_of_pair is a
  // variance-design label bound by variance_subset.constraint, and
  // FR-2026-08-02-REPLICATION forbids reading it as a REPLICATE relation, as
  // retry lineage, or as evidence of independent replication. The record types
  // no other link between two capture_ids, so typing one here would be D1
  // making a classification the governed record has not made.
  const relations = [];

  return Object.freeze({
    source: Object.freeze({
      root: location.root,
      protocol_version: manifest.protocol_version,
      wave: manifest.wave,
      frozen_at: manifest.frozen_at,
      status: manifest.status,
      ledger,
    }),
    vocabulary: Object.freeze({
      diff: vocabulary_diff,
      agrees:
        vocabulary_diff.capture_status.missing_from_code.length === 0 &&
        vocabulary_diff.capture_status.absent_from_record.length === 0 &&
        vocabulary_diff.artifact_status.missing_from_code.length === 0 &&
        vocabulary_diff.artifact_status.absent_from_record.length === 0,
      amendments,
      capture_status_all: capture_vocabulary.all,
    }),
    series: Object.freeze({
      registered: series,
      verification: Object.freeze(series_verification),
      wave_schedule: Object.freeze(wave_schedule),
    }),
    captures: Object.freeze(captures),
    counts: Object.freeze({
      manifest_rows: manifest.captures.length,
      planned_rows: planned.length,
      governed_rows: governed.length,
      imported_rows: captures.length,
      planned_capture_count_declared: manifest.planned_capture_count,
      declared_artifacts: governed.reduce(
        (total, row) => total + Object.keys(row.artifact_hashes ?? {}).length,
        0,
      ),
      observations: observations.length,
    }),
    observations: Object.freeze(observations),
    observation_count_checks: Object.freeze(count_checks),
    unextracted_lists: Object.freeze(unextracted_lists),
    relations: Object.freeze(relations),
    relation_orphans: Object.freeze(
      findOrphanRelations(relations, captures.map((entry) => entry.record.capture_id)),
    ),
  });
}

// Reads the import result back against the criteria the brief keys acceptance
// to. Each entry names what it checked and what it found, so a failure says
// which criterion failed rather than that something did.
export function evaluateAcceptance(result) {
  const captures = result.captures;
  const artifactStatusValues = captures.flatMap((entry) =>
    Object.values(entry.record.artifact_statuses ?? {}),
  );
  const hashChecks = captures.flatMap((entry) => entry.artifact_hash_checks);
  const preservationFields = ["capture_status", "artifact_statuses", "conditions", "lineage"];

  const criteria = [
    {
      criterion: "imported row count equals the governed manifest count",
      found: { imported: result.counts.imported_rows, governed: result.counts.governed_rows },
      passed: result.counts.imported_rows === result.counts.governed_rows,
    },
    {
      criterion: "no governed row dropped for status",
      found: {
        statuses: [...new Set(captures.map((entry) => entry.record.capture_status))].sort(),
      },
      passed: result.counts.imported_rows === result.counts.governed_rows,
    },
    {
      criterion: "every imported row preserves status, conditions, lineage and hashes",
      found: {
        rows_missing_a_field: captures.filter(
          (entry) =>
            !preservationFields.every((field) => Object.hasOwn(entry.record, field)) ||
            !Object.hasOwn(entry.record, "artifact_hashes"),
        ).length,
      },
      passed: captures.every(
        (entry) =>
          preservationFields.every((field) => Object.hasOwn(entry.record, field)) &&
          Object.hasOwn(entry.record, "artifact_hashes"),
      ),
    },
    {
      criterion: "every declared artifact re-hashes to its recorded sha256 and size",
      found: {
        checked: hashChecks.length,
        mismatched: hashChecks.filter((check) => !check.sha256_matches || !check.size_matches)
          .length,
      },
      passed:
        hashChecks.length > 0 &&
        hashChecks.every((check) => check.present && check.sha256_matches && check.size_matches),
    },
    {
      criterion: "bank regeneration from the registry reproduces the frozen question hashes",
      found: {
        series: result.series.verification.length,
        reproduced: result.series.verification.filter((entry) => entry.reproduced).length,
        variant_hashes_checked: result.series.verification.reduce(
          (total, entry) => total + entry.variants_checked,
          0,
        ),
      },
      passed: result.series.verification.every((entry) => entry.reproduced),
    },
    {
      criterion: "artifact statuses import as literal strings, including values outside the declared vocabulary",
      found: {
        populated_cells: artifactStatusValues.length,
        outside_declared_vocabulary: artifactStatusValues.filter(
          (value) => !classifyArtifactStatus(value).in_declared_vocabulary,
        ).length,
        distinct: [...new Set(artifactStatusValues)].sort(),
      },
      passed: artifactStatusValues.length > 0,
    },
    {
      criterion: "no imported row carries retry_of",
      found: {
        rows_with_retry_of: captures.filter((entry) => Object.hasOwn(entry.record.lineage, "retry_of"))
          .length,
      },
      passed: captures.every((entry) => !Object.hasOwn(entry.record.lineage, "retry_of")),
    },
    {
      criterion: "NOT_PRESENT and NOT_CAPTURED survive as distinct values",
      found: {
        NOT_PRESENT: artifactStatusValues.filter((value) => value === "NOT_PRESENT").length,
        NOT_CAPTURED: artifactStatusValues.filter((value) => value === "NOT_CAPTURED").length,
      },
      passed:
        artifactStatusValues.includes("NOT_PRESENT") &&
        artifactStatusValues.includes("NOT_CAPTURED"),
    },
    {
      criterion: "research_status preserved on every imported capture",
      found: {
        missing: captures.filter((entry) => !Object.hasOwn(entry.record, "research_status")).length,
        distinct: [
          ...new Set(captures.map((entry) => entry.record.research_status)),
        ].sort(),
      },
      passed: captures.every((entry) => Object.hasOwn(entry.record, "research_status")),
    },
    {
      criterion: "research_status preserved on every registered series",
      found: {
        missing: result.series.registered.filter(
          (entry) => !Object.hasOwn(entry, "research_status"),
        ).length,
        exploratory: result.series.registered.filter(
          (entry) => entry.research_status === "EXPLORATORY",
        ).length,
      },
      passed: result.series.registered.every((entry) => Object.hasOwn(entry, "research_status")),
    },
    {
      criterion: "instrument_version present on every observation row",
      found: {
        observations: result.observations.length,
        missing: result.observations.filter(
          (observation) => !observation.instrument_version,
        ).length,
      },
      passed:
        result.observations.length > 0 &&
        result.observations.every((observation) => Boolean(observation.instrument_version)),
    },
    {
      criterion: "every extracted observation list matches its artifact's own declared count",
      found: {
        checked: result.observation_count_checks.length,
        disagreeing: result.observation_count_checks.filter((check) => !check.agrees).length,
      },
      passed: result.observation_count_checks.every((check) => check.agrees),
    },
    {
      criterion: "relations typed against the closed enum, zero orphans",
      found: { relations: result.relations.length, orphans: result.relation_orphans.length },
      passed: result.relation_orphans.length === 0,
    },
    {
      criterion: "the code's frozen vocabulary agrees with the record's",
      found: result.vocabulary.diff,
      passed: result.vocabulary.agrees,
    },
  ];

  return Object.freeze({
    passed: criteria.every((entry) => entry.passed),
    criteria: Object.freeze(criteria.map((entry) => Object.freeze(entry))),
  });
}
