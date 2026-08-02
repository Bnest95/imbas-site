// The frozen vocabularies, and the dated amendments beside them.
//
// capture_status is a frozen enum: the governed rows were judged against the
// array exactly as it stands, so nothing is appended to it. A later status is
// recorded as a dated amendment next to the array instead (FR-2026-08-02-D1
// R18). A validator that reads only the array therefore rejects a value the
// record permits, and a validator that folds amendments into the array loses
// the ability to say which rows were judged against a vocabulary containing it.
// This module reads the array plus its amendments, and keeps them separable.
//
// artifact_status has no amendment channel here. R18's ACCESS_RESTRICTED is a
// capture/arm status and never an artifact status.

export const CAPTURE_STATUS_FROZEN = Object.freeze([
  "PLANNED",
  "COMPLETE",
  "REFUSAL",
  "ERROR",
  "TRUNCATED",
  "PARTIAL_INTERFACE",
  "UNREACHABLE",
  "CONDITION_COMPROMISED",
]);

export const ARTIFACT_STATUS_FROZEN = Object.freeze([
  "PLANNED",
  "CAPTURED",
  "NOT_PRESENT",
  "NOT_CAPTURED",
]);

const AMENDMENT_KEY = /^amendment_(\d{4}-\d{2}-\d{2})_/;

// An amendment is admitted only if it says in its own words that it is a
// capture status and not an artifact status. D1 does not infer which
// vocabulary an amendment extends.
function admissionOf(classText) {
  const text = String(classText ?? "").toUpperCase();
  const disclaimsArtifact = text.includes("NEVER AN ARTIFACT STATUS");
  const claimsCapture = text.includes("CAPTURE");
  if (claimsCapture && disclaimsArtifact) return { admitted_to: "capture_status", reason: null };
  return {
    admitted_to: null,
    reason:
      "the amendment does not state that it is a capture status and not an " +
      "artifact status, and D1 will not infer which vocabulary it extends",
  };
}

export function readStatusAmendments(vocabularyBlock) {
  const amendments = [];
  for (const [key, value] of Object.entries(vocabularyBlock ?? {})) {
    const match = AMENDMENT_KEY.exec(key);
    if (!match) continue;
    const { admitted_to, reason } = admissionOf(value?.class);
    amendments.push(
      Object.freeze({
        key,
        effective_from: match[1],
        authority: value?.authority ?? null,
        new_status: value?.new_status ?? null,
        class_text: value?.class ?? null,
        effective_text: value?.effective ?? null,
        retrofit_text: value?.retrofit ?? null,
        admitted_to,
        not_admitted_reason: reason,
      }),
    );
  }
  return Object.freeze(amendments);
}

// asJudgedOn is a YYYY-MM-DD date. Omitted means "as the vocabulary stands
// now": every amendment counts. Passing a date reconstructs the vocabulary a
// row was judged against on that date, which is the question the frozen array
// exists to keep answerable.
export function captureStatusVocabulary(amendments = [], { asJudgedOn = null } = {}) {
  const admitted = amendments.filter(
    (a) =>
      a.admitted_to === "capture_status" &&
      typeof a.new_status === "string" &&
      (asJudgedOn === null || a.effective_from <= asJudgedOn),
  );
  return Object.freeze({
    frozen: CAPTURE_STATUS_FROZEN,
    amended: Object.freeze(admitted.map((a) => a.new_status)),
    all: Object.freeze([...CAPTURE_STATUS_FROZEN, ...admitted.map((a) => a.new_status)]),
    amendments_applied: Object.freeze(admitted.map((a) => a.key)),
  });
}

export function isValidCaptureStatus(value, amendments = [], options = {}) {
  return captureStatusVocabulary(amendments, options).all.includes(value);
}

export function isValidArtifactStatus(value) {
  return ARTIFACT_STATUS_FROZEN.includes(value);
}

// R13: the record carries artifact status strings outside the declared
// vocabulary. Every literal string imports as written. This reports whether a
// value is inside the declared vocabulary and nothing else — it is not an
// alias table, and no value is coerced onto another.
export function classifyArtifactStatus(value) {
  return Object.freeze({ value, in_declared_vocabulary: isValidArtifactStatus(value) });
}

// The importer calls this so that a vocabulary drift in the governed record
// surfaces as a failure rather than as silently different validation.
export function diffAgainstRecordVocabulary(recordVocabulary) {
  const compare = (mine, theirs) => ({
    missing_from_code: (theirs ?? []).filter((v) => !mine.includes(v)),
    absent_from_record: mine.filter((v) => !(theirs ?? []).includes(v)),
  });
  return Object.freeze({
    capture_status: compare(CAPTURE_STATUS_FROZEN, recordVocabulary?.capture_status),
    artifact_status: compare(ARTIFACT_STATUS_FROZEN, recordVocabulary?.artifact_status),
  });
}
