// D1's public surface.
//
// D1 establishes what exists and who owns it. Everything exported here creates,
// validates, or reads back a registry, capture, artifact, source-observation,
// lineage, amendment, or typed-relation record. Nothing exported here computes
// or publishes a comparison claim — deciding what a link licenses anyone to say
// is D2's (IMBAS-2BD-SCOPE-MEMO section 2, the seam law).
//
// The boundary test in test/d1-seam-law.test.mjs reads this list and the module
// graph beneath it. Adding an export that takes two captures and returns a
// finding fails that test, which is the point of routing the surface through
// one file.

export {
  carryPresentFields,
  isAbsent,
  isPresentAndNull,
  presentKeys,
} from "./field-custody.mjs";

export {
  CAPTURE_STATUS_FROZEN,
  ARTIFACT_STATUS_FROZEN,
  readStatusAmendments,
  captureStatusVocabulary,
  isValidCaptureStatus,
  isValidArtifactStatus,
  classifyArtifactStatus,
  diffAgainstRecordVocabulary,
} from "./status-vocabulary.mjs";

export {
  HASH_CONVENTION,
  SERIES_RECORD_KEYS,
  WAVE_SCHEDULE_KEYS,
  SERIES_FIELD_MAPPING,
  sha256Utf8,
  registerQuestionSeries,
  waveScheduleFromBankEntry,
  regenerateBankHashes,
  verifyBankRegeneration,
  seriesPresentKeys,
} from "./question-series.mjs";

export {
  CAPTURE_IDENTITY_FIELDS,
  ARTIFACT_STATUS_FIELDS,
  CAPTURE_CONDITION_FIELDS,
  LINEAGE_FIELDS,
  readCaptureAmendments,
  effectiveCaptureStatus,
  importCaptureRecord,
  auditArtifactStatuses,
  cohortByEffectiveCaptureStatus,
} from "./capture-record.mjs";

export {
  ARTIFACT_ROLES,
  ARTIFACT_CLASS_TO_ROLE,
  OBSERVATION_LIST_SOURCES,
  OBSERVATION_LIST_PATHS,
  READING_STATES,
  inventoryEnumerableLists,
  extractSourceObservations,
  checkDeclaredCounts,
} from "./source-observation.mjs";

export {
  RELATION_TYPES,
  RELATION_RECORD_KEYS,
  RESEARCH_STATUSES,
  createCaptureRelation,
  findOrphanRelations,
} from "./relation-types.mjs";

export {
  CAPTURE_PROVENANCE_CLASSES,
  PROTOCOL_CUSTODY_BASIS_KEYS,
  ARTIFACT_CUSTODY_STATES,
  createCaptureProvenance,
  hasProtocolAuthority,
  requireProtocolAuthority,
  groupByProvenanceClass,
} from "./capture-provenance.mjs";

export { locateWave0Record, importWave0, evaluateAcceptance } from "./wave0-import.mjs";
