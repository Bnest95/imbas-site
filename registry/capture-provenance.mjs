// Capture provenance — the custody envelope, and why it lives here.
//
// A CAPTURE is the preserved evidentiary artifact a model produced. An
// INSPECTION is the product-level record built around one or more captures.
// Inspections are not D1's to build. What D1 owes them is a guarantee they can
// rely on: that a governed protocol capture and an answer a user pasted into
// the Reader can never be rendered with the same evidentiary authority merely
// because they share a data shape.
//
// WHERE THE PROVENANCE CLASS BELONGS, AND WHY NOT THE OTHER TWO PLACES.
//
// Not on the capture record. Two reasons, either one sufficient. First, no
// governed row carries a provenance field, and D1's import contract imports
// what the record carries and nothing else; writing PROTOCOL_CAPTURE onto
// eighteen rows would be inventing a field, which is the one thing the import
// contract forbids most plainly. Second, and worse: a protocol capture schema
// requires an instrument version, an environment, timestamps, and artifact
// hashes. A pasted answer has none of them. One schema carrying both classes
// makes every protocol-required field optional, and a schema whose required
// fields are all optional can no longer enforce protocol completeness for
// anything. That is the invalid state, and it is why USER_SUPPLIED is defined
// here rather than added to capture-record.mjs.
//
// Not on the relationship through which a capture enters an Inspection. A
// capture loaded by identifier, without going through that edge, would carry no
// provenance at all — so the guard is bypassable, and the requirement is that
// it be impossible rather than discouraged. Worse, the same capture could enter
// two Inspections through two edges making two different claims, which would
// make provenance a property of a use rather than of an origin. A pasted answer
// could then be laundered into protocol authority by an edge that says so.
// Provenance is fixed when the capture comes into existence and is the same
// fact in every context that later reads it.
//
// On a custody envelope bound to capture identity. This is where the fact
// already lives. The governed record does not assert provenance row by row; it
// asserts it once, for the whole record, by being the approved protocol record
// with a protocol version, a checksums ledger, and an instrument version per
// row. Every row inside inherits protocol provenance from the custody chain it
// arrived through. The envelope names that fact at the boundary where captures
// enter the registry, which invents nothing, keeps the capture record
// byte-faithful, and gives provenance one canonical location per capture_id
// instead of one per use.
//
// WHY A LABEL WOULD NOT BE ENOUGH. A string field called provenance_class is
// ignorable, and a renderer that forgets to read it fails open. So the two
// classes are separated by what they can show, not by what they are called: a
// protocol capture must present the custody a governed record supplies, and
// this module refuses to mint one that cannot. A user-supplied capture has no
// such custody to present and therefore cannot satisfy the predicate, whatever
// it is labelled. Authority is denied by default and granted only against
// evidence.
//
// D1 mints no USER_SUPPLIED envelope. The class is reserved here so the Reader
// has a defined location to write into later, and so that the absence of a
// provenance envelope can be treated as absence of authority rather than as
// permission.

export const CAPTURE_PROVENANCE_CLASSES = Object.freeze(["PROTOCOL_CAPTURE", "USER_SUPPLIED"]);

// What a capture must be able to show before it may be rendered as protocol
// evidence. These are the marks a governed record leaves on everything inside
// it; nothing outside such a record can present them.
export const PROTOCOL_CUSTODY_BASIS_KEYS = Object.freeze([
  "protocol_version",
  "record_status",
  "ledger_sha256",
  "instrument_version",
]);

// Artifact custody is reported rather than required. A governed row may
// legitimately declare no artifact — a refusal has nothing to hash — and
// denying it authority for that would be wrong. A row whose declared artifacts
// failed to re-hash is a different matter and loses authority.
export const ARTIFACT_CUSTODY_STATES = Object.freeze(["VERIFIED", "NONE_DECLARED", "FAILED"]);

function requireCaptureId(value) {
  if (typeof value !== "string" || value.length === 0) {
    throw new TypeError(
      "capture_id must be a capture_id string, not a capture record. Provenance " +
        "binds to capture identity so that reading a capture's contents is never " +
        "required to establish where it came from.",
    );
  }
  return value;
}

function missingBasisKeys(custody_basis) {
  return PROTOCOL_CUSTODY_BASIS_KEYS.filter((key) => {
    const value = custody_basis?.[key];
    return typeof value !== "string" || value.length === 0;
  });
}

export function createCaptureProvenance({
  capture_id,
  provenance_class,
  custody_basis = {},
  artifact_custody = "NONE_DECLARED",
}) {
  const id = requireCaptureId(capture_id);

  if (!CAPTURE_PROVENANCE_CLASSES.includes(provenance_class)) {
    throw new RangeError(
      `provenance_class ${JSON.stringify(provenance_class)} is outside the closed set: ` +
        CAPTURE_PROVENANCE_CLASSES.join(", "),
    );
  }
  if (!ARTIFACT_CUSTODY_STATES.includes(artifact_custody)) {
    throw new RangeError(
      `artifact_custody ${JSON.stringify(artifact_custody)} is outside the closed set: ` +
        ARTIFACT_CUSTODY_STATES.join(", "),
    );
  }

  // A protocol capture is minted against its custody, never against its label.
  if (provenance_class === "PROTOCOL_CAPTURE") {
    const missing = missingBasisKeys(custody_basis);
    if (missing.length > 0) {
      throw new RangeError(
        `${id}: a PROTOCOL_CAPTURE provenance requires the custody a governed ` +
          `record supplies, and these are missing: ${missing.join(", ")}. A capture ` +
          "that cannot show them is not a protocol capture, whatever it is called.",
      );
    }
  }

  const denied = authorityDenialReason(provenance_class, custody_basis, artifact_custody);

  return Object.freeze({
    capture_id: id,
    provenance_class,
    custody_basis: Object.freeze({ ...custody_basis }),
    artifact_custody,
    protocol_authority: denied === null,
    authority_denied_reason: denied,
  });
}

function authorityDenialReason(provenance_class, custody_basis, artifact_custody) {
  if (provenance_class !== "PROTOCOL_CAPTURE") {
    return `provenance_class is ${provenance_class}, which carries no protocol custody`;
  }
  const missing = missingBasisKeys(custody_basis);
  if (missing.length > 0) return `custody basis incomplete: ${missing.join(", ")}`;
  if (artifact_custody === "FAILED") {
    return "declared artifacts did not re-hash to their recorded values";
  }
  return null;
}

// The single question a renderer asks. It reads one capture's provenance and
// answers about that capture alone: it takes no second capture, and it produces
// no finding about what the capture says.
export function hasProtocolAuthority(provenance) {
  return provenance?.protocol_authority === true;
}

// Default-deny. A capture with no envelope has no authority, so a caller that
// forgets to create one fails closed rather than open.
export function requireProtocolAuthority(provenance, label = "capture") {
  if (provenance === null || provenance === undefined) {
    throw new RangeError(
      `${label} has no provenance envelope. A capture with no recorded provenance ` +
        "is not protocol evidence; absence of a claim is not a claim.",
    );
  }
  if (!hasProtocolAuthority(provenance)) {
    throw new RangeError(
      `${provenance.capture_id} may not be rendered as protocol evidence: ` +
        provenance.authority_denied_reason,
    );
  }
  return provenance;
}

// Reports how a set of captures divides by provenance class. Identifiers only,
// like every other grouping in D1: the group says where its members came from
// and nothing about what they contain.
export function groupByProvenanceClass(envelopes) {
  const groups = {};
  for (const envelope of envelopes) {
    (groups[envelope.provenance_class] ??= []).push(envelope.capture_id);
  }
  return Object.freeze(groups);
}
