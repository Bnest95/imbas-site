// Typed relations, stored and uninterpreted.
//
// The enum is closed at D1 (IMBAS-2BD-SCOPE-MEMO section 3). D1 records that two
// captures are linked and under which type. What a link licenses anyone to say is
// D2's, and nothing in this module reads a relation's members.

export const RELATION_TYPES = Object.freeze([
  "REPLICATE",
  "SAME_QUESTION_ACROSS_TIME",
  "SAME_QUESTION_ACROSS_PROVIDERS",
  "AUTHORIZED_VARIANT",
  "CHANGED_CONDITIONS",
  "CONTROL_COMPARISON",
]);

// The complete key set a relation record may carry. Identity and linkage only.
export const RELATION_RECORD_KEYS = Object.freeze([
  "relation_id",
  "relation_type",
  "from_capture_id",
  "to_capture_id",
  "question_group_id",
  "research_status",
  "basis_ref",
]);

export const RESEARCH_STATUSES = Object.freeze(["STANDARD", "EXPLORATORY"]);

function requireCaptureId(value, label) {
  if (typeof value !== "string" || value.length === 0) {
    throw new TypeError(
      `${label} must be a capture_id string, not a capture record. D1 links ` +
        "captures by identifier so that creating a relation cannot read what " +
        "the captures contain.",
    );
  }
  return value;
}

export function createCaptureRelation({
  relation_type,
  from_capture_id,
  to_capture_id,
  question_group_id,
  research_status,
  basis_ref = null,
}) {
  if (!RELATION_TYPES.includes(relation_type)) {
    throw new RangeError(
      `relation_type ${JSON.stringify(relation_type)} is outside the closed enum: ` +
        RELATION_TYPES.join(", "),
    );
  }
  const from = requireCaptureId(from_capture_id, "from_capture_id");
  const to = requireCaptureId(to_capture_id, "to_capture_id");
  if (from === to) {
    throw new RangeError("a relation links two distinct capture_ids");
  }
  if (typeof question_group_id !== "string" || question_group_id.length === 0) {
    throw new TypeError("question_group_id is required on every relation");
  }
  if (!RESEARCH_STATUSES.includes(research_status)) {
    throw new RangeError(
      "research_status must be STANDARD or EXPLORATORY and travels with the " +
        "relation; D2 decides what an EXPLORATORY relation may support.",
    );
  }
  return Object.freeze({
    relation_id: `${relation_type}:${from}->${to}`,
    relation_type,
    from_capture_id: from,
    to_capture_id: to,
    question_group_id,
    research_status,
    basis_ref,
  });
}

export function findOrphanRelations(relations, knownCaptureIds) {
  const known = new Set(knownCaptureIds);
  const orphans = [];
  for (const relation of relations) {
    const missing = [relation.from_capture_id, relation.to_capture_id].filter(
      (id) => !known.has(id),
    );
    if (missing.length > 0) {
      orphans.push({ relation_id: relation.relation_id, missing_capture_ids: missing });
    }
  }
  return orphans;
}
