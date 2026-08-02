// Capture lineage and custody.
//
// A capture record holds what the governed row says about itself: its statuses
// as literal strings, its conditions and compromises references, its instrument
// version, its artifact hashes, and its lineage. Statuses import exactly as
// written, including values outside the declared vocabulary — an importer that
// coerces them into the declared four is reconstructing the record rather than
// carrying it (FR-2026-08-02-D1 R13).
//
// Where a dated amendment supplies a status for cross-row use, both values are
// kept and neither replaces the other. Nothing in this module reads two
// captures together, and grouping by a stored status is custody of a field the
// record already carries, not a comparison of the captures in the group.

import { carryPresentFields, presentKeys } from "./field-custody.mjs";
import { classifyArtifactStatus } from "./status-vocabulary.mjs";

export const CAPTURE_IDENTITY_FIELDS = Object.freeze([
  "capture_id",
  "question_group_id",
  "question_sha256",
  "prompt_role",
  "research_status",
  "provider",
  "provider_code",
  "provider_surface",
  "model_label_displayed",
]);

export const ARTIFACT_STATUS_FIELDS = Object.freeze([
  "answer_artifact_status",
  "source_panel_status",
  "suggested_followups_status",
  "screenshot_status",
  "gate_content_status",
  "inline_citations_status",
  "sponsored_content_status",
]);

export const CAPTURE_CONDITION_FIELDS = Object.freeze([
  "signed_in_state",
  "browsing_search_status",
  "fresh_chat_confirmed",
  "timestamp_start",
  "timestamp_end",
  "timezone",
  "environment_ref",
  "invalidation_status",
  "invalidation_reason",
  "compromises_ref",
  "notes",
]);

// retry_of is prospective: a nullable pointer from a later capture to a first
// attempt. No Wave 0 row carries it, and the importer never creates one. A
// retry does not by itself make a REPLICATE relation (FR-2026-08-02-REPLICATION).
export const LINEAGE_FIELDS = Object.freeze([
  "retry_of",
  "replicate_index",
  "replicate_of_pair",
  "variance_subset_member",
  "planned_order_position",
  "actual_order_position",
  "order_deviation_reason",
  "slot",
]);

const AMENDMENT_KEY = /^amendment_(\d{4}-\d{2}-\d{2})_/;

export function readCaptureAmendments(row) {
  const amendments = [];
  for (const [key, value] of Object.entries(row ?? {})) {
    const match = AMENDMENT_KEY.exec(key);
    if (!match) continue;
    amendments.push(Object.freeze({ key, effective_from: match[1], body: value }));
  }
  return Object.freeze(amendments);
}

// Returns the status to group by and the basis for it. When no amendment
// supplies a value the basis is the row's own capture_status, resolved here
// rather than written into the record, so that a row carrying no amendment
// does not gain a field the governed record never had.
export function effectiveCaptureStatus(record) {
  for (const amendment of record.amendments ?? []) {
    const supplied = amendment.body?.effective_for_comparison;
    if (typeof supplied === "string" && supplied.length > 0) {
      return Object.freeze({ status: supplied, basis: amendment.key });
    }
  }
  return Object.freeze({ status: record.capture_status, basis: "capture_status" });
}

export function importCaptureRecord(row) {
  if (typeof row?.capture_id !== "string" || row.capture_id.length === 0) {
    throw new TypeError("a capture record requires a capture_id");
  }
  const artifact_statuses = carryPresentFields(row, ARTIFACT_STATUS_FIELDS);
  return Object.freeze({
    ...carryPresentFields(row, CAPTURE_IDENTITY_FIELDS),
    capture_status: row.capture_status,
    artifact_statuses: Object.freeze(artifact_statuses),
    artifact_status_fields_present: Object.freeze(presentKeys(row, ARTIFACT_STATUS_FIELDS)),
    conditions: Object.freeze(carryPresentFields(row, CAPTURE_CONDITION_FIELDS)),
    lineage: Object.freeze(carryPresentFields(row, LINEAGE_FIELDS)),
    ...carryPresentFields(row, ["artifact_hashes", "instrument_ref", "dimension_status"]),
    amendments: readCaptureAmendments(row),
    // The governed row verbatim, so that no field is lost by not having been
    // enumerated above. Never written into the tracked tree.
    source_row: row,
  });
}

// Reports which literal artifact statuses sit outside the declared vocabulary.
// A report, not a mapping: no value is rewritten and no value is rejected.
export function auditArtifactStatuses(record) {
  const outside = [];
  for (const [field, value] of Object.entries(record.artifact_statuses ?? {})) {
    const classified = classifyArtifactStatus(value);
    if (!classified.in_declared_vocabulary) outside.push({ field, value });
  }
  return Object.freeze({
    capture_id: record.capture_id,
    populated_cells: Object.keys(record.artifact_statuses ?? {}).length,
    outside_declared_vocabulary: Object.freeze(outside),
  });
}

// Identifiers only. The group is a list of capture_ids and carries nothing
// about what those captures contain.
export function cohortByEffectiveCaptureStatus(records) {
  const cohorts = {};
  for (const record of records) {
    const { status } = effectiveCaptureStatus(record);
    (cohorts[status] ??= []).push(record.capture_id);
  }
  return Object.freeze(cohorts);
}
