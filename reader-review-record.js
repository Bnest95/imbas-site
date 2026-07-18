// reader-review-record.js — the ReviewRecord export (Reader v3, "Review Packet").
//
// A completed inspection is downloadable as a self-contained, client-built record
// of what was examined and what was resolved: the pasted answer as an Artifact,
// the detector events, the checks with their client-held status and structured
// demonstrations, the inspector provenance, the versions, the timestamps, a
// method note, and an integrity block whose digest is an unkeyed SHA-256 over the
// record's canonical form. No server-side persistence of user content — the whole
// record is assembled and hashed in the browser and downloaded as JSON.
//
// Implements the review-record.c14n.v1 canonicalization contract frozen in
// docs/REVIEW-GRAPH-SCHEMA.md (v0.2.3). That contract is DELIBERATELY DISTINCT
// from reader-receipt.js's canonicalization_version 1.0: the receipt normalizes
// string line endings, but c14n.v1 normalizes ONLY timestamps and hashes every
// other string value verbatim (span offsets into Artifact.body depend on the
// bytes staying exactly as pasted). The two contracts are versioned separately so
// neither drifts into the other.
//
// Pure JS by contract, exactly like reader-receipt.js / reader-checks.js: no node:
// imports, no DOM. The digest primitive is WebCrypto (globalThis.crypto.subtle),
// which is present in both the browser and modern Node (>=20) — so ONE code path
// runs in both environments and the browser bundle never pulls in a node builtin.
// Tests additionally recompute the digest with node:crypto over the same canonical
// string to prove the two primitives agree byte-for-byte (schema AT-14 parity).

// Version ids. The schema version tracks the frozen Review Graph erratum; the
// c14n id names the canonicalization contract this module implements; the record
// id versions the ReviewRecord envelope shape. Bump a c14n id only if the rules
// below change, so a digest recorded under the old rules stays reproducible.
export const REVIEW_GRAPH_SCHEMA_VERSION = "review-graph.v0.2.3";
export const REVIEW_RECORD_C14N_VERSION = "review-record.c14n.v1";
export const REVIEW_RECORD_VERSION = "review-record.v1";
export const REVIEW_RECORD_HASH_ALGORITHM = "sha256";

export const RECORD_STATUSES = new Set(["open", "resolved", "dismissed"]);
const ARTIFACT_ROLES = new Set(["original_answer", "targeted_answer", "supplied_source"]);

// The method note embedded in every record. Pointer register throughout: the
// record lists what was examined and resolved and claims nothing beyond that; its
// integrity is stated as an unkeyed SHA-256 fixity check, NEVER a "signature";
// no defensibility / compliance-proof / adequate-care language (schema AT-5 /
// AT-7). This string is covered by the vocabulary lint alongside REVIEW_RECORD_UI.
export const METHOD_NOTE =
  "This is a record of what was examined and what was resolved. It holds " +
  "provisional discovery outputs: each check is a pointer worth checking against " +
  "a source, never a verdict on the answer. The integrity block is an unkeyed " +
  "SHA-256 digest over the record's canonical form — a fixity check that the " +
  "listed contents have not shifted since export, not a signature and not proof " +
  "of who produced it. The record claims nothing beyond what it lists.";

// User-facing strings the export affordance adds to the Workbench. Linted by the
// AT-5 vocab test exactly like reader-checks.js's CHECK_UI: pointer register only.
export const REVIEW_RECORD_UI = {
  action_label: "Download review record",
  downloaded_label: "Downloaded",
  action_hint: "A record of what was examined and resolved, as JSON.",
  download_error: "Could not download the review record",
};

// ── review-record.c14n.v1 canonicalization ────────────────────────────────────
// The schema's timestamp-typed fields. c14n.v1 normalizes a string value to RFC
// 3339 UTC ONLY when its key is one of these; every other string hashes verbatim.
// Enumerating the keys (rather than sniffing timestamp-shaped strings) is what
// keeps Artifact.body — which may itself contain a date — verbatim, as the
// contract requires. "at" is the Check.resolution timestamp; it carries no value
// this lane but is listed so the resolution lane normalizes it without a c14n bump.
const TIMESTAMP_KEYS = new Set(["created_at", "supplied_at", "inspection_run_at", "at"]);

// Normalize one RFC 3339 timestamp to the pinned canonical form: millisecond
// precision, YYYY-MM-DDTHH:mm:ss.sssZ (Date#toISOString). Sub-millisecond digits
// are TRUNCATED (not rounded) before parsing so the result is deterministic across
// JS engines; offset forms and fractional-zero forms of the same instant collapse
// to one string (schema AT-14 pinned vectors). Empty string passes through; a
// non-empty unparseable value throws (a builder bug, caught by tests).
export function canonicalTimestamp(value) {
  if (typeof value !== "string" || value === "") return value;
  const truncated = value.replace(/(\.\d{3})\d+/, "$1");
  const d = new Date(truncated);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`review-record.c14n.v1: unparseable timestamp ${JSON.stringify(value)}`);
  }
  return d.toISOString();
}

// Recursive canonicalization: object keys sorted (lexicographic), array order
// preserved, timestamp-keyed strings normalized, every other string verbatim
// (no Unicode normalization, no trimming, no line-ending normalization). Numbers,
// booleans, and null pass through. The `key` context lets a string know whether
// it sits under a timestamp key; array elements inherit their array's key.
function canonicalize(value, key) {
  if (typeof value === "string") {
    return TIMESTAMP_KEYS.has(key) ? canonicalTimestamp(value) : value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => canonicalize(item, key));
  }
  if (value && typeof value === "object") {
    const out = {};
    for (const k of Object.keys(value).sort()) out[k] = canonicalize(value[k], k);
    return out;
  }
  return value;
}

// The exact string the digest is taken over: the record with its integrity block
// excluded, canonicalized, serialized as compact JSON (structural whitespace only).
export function serializeCanonical(record) {
  const src = record && typeof record === "object" ? record : {};
  const body = {};
  for (const k of Object.keys(src)) {
    if (k === "integrity") continue; // the integrity block is excluded from the hashed body
    body[k] = src[k];
  }
  return JSON.stringify(canonicalize(body, null));
}

// SHA-256 → lowercase hex, via WebCrypto. Runs in the browser and in Node >=20
// (globalThis.crypto.subtle). Async because subtle.digest is async.
export async function sha256Hex(input) {
  const bytes = new TextEncoder().encode(String(input));
  const subtle = globalThis.crypto && globalThis.crypto.subtle;
  if (!subtle) {
    throw new Error("review-record.c14n.v1: WebCrypto SHA-256 is unavailable in this environment");
  }
  const digest = await subtle.digest("SHA-256", bytes);
  const view = new Uint8Array(digest);
  let hex = "";
  for (let i = 0; i < view.length; i++) hex += view[i].toString(16).padStart(2, "0");
  return hex;
}

// The unkeyed integrity digest over a record's canonical body.
export async function digestReviewRecord(record) {
  return sha256Hex(serializeCanonical(record));
}

// ── Record assembly ────────────────────────────────────────────────────────────

function str(v) {
  return typeof v === "string" ? v : "";
}

function normalizeStatus(s) {
  return RECORD_STATUSES.has(s) ? s : null;
}

// Assemble a ReviewRecord (schema v0.2.3) from an inspection result + client-held
// check states, with the integrity.digest left empty for buildReviewRecord to fill.
//
//   result      — the Reader read response: { receipt.open_run, checks (register) }
//   checkStates — optional map { [checkId]: "open"|"resolved"|"dismissed" }; a
//                 missing or out-of-enum entry falls back to the check's own status
//   createdAt   — ISO 8601 record-creation timestamp (the caller supplies it, so
//                 assembly stays deterministic; the Workbench passes toISOString())
//
// pair_runs and resolution_evidence are always present as arrays (empty in this
// lane) so the run-the-pair and resolution lanes slot in with no record-format
// change. Deterministic: no Date.now, no random — identical inputs, identical body.
export function assembleReviewRecord({ result, checkStates = {}, createdAt } = {}) {
  const created = str(createdAt);
  if (!created) throw new Error("assembleReviewRecord: createdAt (ISO 8601) is required");

  const receipt = (result && result.receipt) || {};
  const openRun = receipt.open_run || {};
  const provenance = openRun.provenance || {};
  const register = (result && result.checks) || {};
  const inspector = register.inspector || {};

  const inspectionId = str(provenance.request_id) || "inspection";
  const inspectionRunAt = str(provenance.run_timestamp) || created;
  const answer = str(openRun.answer);

  const artifacts = [
    {
      id: "original_answer",
      role: "original_answer",
      body: answer, // verbatim as pasted — c14n.v1 hashes it byte-for-byte
      source_model_user_reported: {
        name: str(openRun.declared_model),
        version: "",
      },
      verified: false, // always false in the Reader
      supplied_at: inspectionRunAt,
    },
  ];

  const detectorEvents = Array.isArray(register.detector_events) ? register.detector_events : [];
  const registerChecks = Array.isArray(register.checks) ? register.checks : [];

  // Each exported check carries its structured demonstration and its effective
  // client-held status. Resolution detail (note / evidence / dismissal_reason) is
  // NOT collected in this lane, so Check.resolution stays absent; the status field
  // alone records open / resolved / dismissed. The resolution lane fills it later.
  const checks = registerChecks.map((chk) => {
    const effective = normalizeStatus(checkStates[chk && chk.id]) || normalizeStatus(chk && chk.status) || "open";
    return {
      id: str(chk.id),
      detector_event_id: str(chk.detector_event_id),
      subclass: str(chk.subclass),
      proposition_at_issue: chk.proposition_at_issue,
      dependent_output: chk.dependent_output,
      demonstration: chk.demonstration,
      verification_action: chk.verification_action,
      ranking: chk.ranking,
      status: effective,
    };
  });

  const contents = {
    artifacts,
    pair_runs: [], // single mode; shape supports paired (schema PairRun) with no format change
    detector_events: detectorEvents,
    checks,
    resolution_evidence: [], // ResolutionEvidence is a later lane; present-but-empty here
    inspector: {
      model: str(inspector.model) || str(provenance.reader_model_version),
      model_version: str(inspector.model_version) || str(provenance.reader_model_version),
      prompt_version: str(inspector.prompt_version) || str(provenance.inspector_prompt_version),
    },
    versions: {
      schema: REVIEW_GRAPH_SCHEMA_VERSION,
      canonicalization: REVIEW_RECORD_C14N_VERSION,
      record: REVIEW_RECORD_VERSION,
      check_model: str(register.version),
    },
    timestamps: {
      created_at: created,
      inspection_run_at: inspectionRunAt,
    },
    method_note: METHOD_NOTE,
  };

  return {
    id: `rr_${inspectionId}`,
    inspection_ids: [inspectionId],
    created_at: created,
    contents,
    integrity: {
      algorithm: REVIEW_RECORD_HASH_ALGORITHM,
      canonicalization: REVIEW_RECORD_C14N_VERSION,
      digest: "", // filled by buildReviewRecord from the canonical body
    },
  };
}

// Build a complete ReviewRecord: assemble the body, then fill the integrity digest
// from the canonical body. The digest sits in the excluded integrity block, so
// writing it never changes the value it was computed from.
export async function buildReviewRecord(input) {
  const record = assembleReviewRecord(input);
  record.integrity.digest = await digestReviewRecord(record);
  return record;
}

// Download filename: imbas-review-record-<UTC date>-<first 8 of digest>.json.
// The date is the UTC calendar day of created_at; the digest prefix disambiguates
// two exports of the same inspection whose contents differ.
export function reviewRecordFilename(record) {
  const digest = str(record && record.integrity && record.integrity.digest);
  const created = str(record && record.created_at);
  let datePart = "unknown";
  if (created) {
    const norm = canonicalTimestamp(created);
    if (norm) datePart = norm.slice(0, 10);
  }
  const shortDigest = digest ? digest.slice(0, 8) : "00000000";
  return `imbas-review-record-${datePart}-${shortDigest}.json`;
}

// Validate a record against the schema v0.2.3 shapes. Returns { ok, reason? }.
// Defense in depth for the export path and a fixture for the schema-conformance
// tests; not a substitute for the register's own validators.
export function validateReviewRecord(record) {
  if (!record || typeof record !== "object") return { ok: false, reason: "record missing" };
  if (!str(record.id)) return { ok: false, reason: "id required" };
  if (!Array.isArray(record.inspection_ids) || record.inspection_ids.length === 0) {
    return { ok: false, reason: "inspection_ids[] required" };
  }
  if (!str(record.created_at)) return { ok: false, reason: "created_at required" };

  const c = record.contents;
  if (!c || typeof c !== "object") return { ok: false, reason: "contents required" };
  for (const key of ["artifacts", "pair_runs", "detector_events", "checks", "resolution_evidence"]) {
    if (!Array.isArray(c[key])) return { ok: false, reason: `contents.${key} must be an array` };
  }

  if (!c.inspector || typeof c.inspector !== "object") return { ok: false, reason: "contents.inspector required" };
  for (const f of ["model", "model_version", "prompt_version"]) {
    if (typeof c.inspector[f] !== "string") return { ok: false, reason: `inspector.${f} required` };
  }

  if (!c.versions || typeof c.versions !== "object") return { ok: false, reason: "contents.versions required" };
  if (c.versions.schema !== REVIEW_GRAPH_SCHEMA_VERSION) {
    return { ok: false, reason: `versions.schema must be ${REVIEW_GRAPH_SCHEMA_VERSION}` };
  }
  if (c.versions.canonicalization !== REVIEW_RECORD_C14N_VERSION) {
    return { ok: false, reason: `versions.canonicalization must be ${REVIEW_RECORD_C14N_VERSION}` };
  }

  if (!c.timestamps || typeof c.timestamps !== "object") return { ok: false, reason: "contents.timestamps required" };
  if (!str(c.method_note).trim()) return { ok: false, reason: "contents.method_note required" };

  for (const a of c.artifacts) {
    if (!a || !str(a.id)) return { ok: false, reason: "artifact.id required" };
    if (!ARTIFACT_ROLES.has(a.role)) return { ok: false, reason: `bad artifact.role: ${a && a.role}` };
    if (typeof a.body !== "string") return { ok: false, reason: "artifact.body must be a string" };
    if (a.verified !== false) return { ok: false, reason: "artifact.verified must be false in the Reader" };
  }

  const eventIds = new Set(c.detector_events.map((e) => e && e.id).filter(Boolean));
  for (const chk of c.checks) {
    if (!chk || !str(chk.id)) return { ok: false, reason: "check.id required" };
    // AT-1: no check without a resolving detector_event_id.
    if (!str(chk.detector_event_id) || !eventIds.has(chk.detector_event_id)) {
      return { ok: false, reason: `check ${chk && chk.id} has no resolving detector_event (AT-1)` };
    }
    if (!RECORD_STATUSES.has(chk.status)) return { ok: false, reason: `bad check.status: ${chk && chk.status}` };
    if (!chk.demonstration || typeof chk.demonstration !== "object") {
      return { ok: false, reason: `check ${chk && chk.id} missing demonstration` };
    }
  }

  const integ = record.integrity;
  if (!integ || typeof integ !== "object") return { ok: false, reason: "integrity block required" };
  if (integ.algorithm !== REVIEW_RECORD_HASH_ALGORITHM) return { ok: false, reason: "integrity.algorithm must be sha256" };
  if (integ.canonicalization !== REVIEW_RECORD_C14N_VERSION) {
    return { ok: false, reason: "integrity.canonicalization must be review-record.c14n.v1" };
  }
  if (!/^[0-9a-f]{64}$/.test(str(integ.digest))) {
    return { ok: false, reason: "integrity.digest must be a 64-char lowercase hex sha256" };
  }
  return { ok: true };
}
