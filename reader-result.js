// reader-result.js — the canonical Reader result (Pass 2B-A).
//
// ══ ARCHITECTURE RULE — read this before adding to this file or reading from it ══
//
// This module is the ONE construction door for a Reader result. Every visible
// quantity, every class label, every claim, and every exported field derives from
// the canonical findings collection built here.
//
//   source adapters   collect legacy and model output and hand it in
//   constructors      validate and normalize (this file, and only this file)
//   selectors         derive named subsets and named counts (this file)
//   renderers         consume selectors — they never recount
//   receipts/packets  serialize the canonical collection
//   Check Register    ANNOTATES a finding; it never decides whether it survives
//
// api/read.js and api/read-paired.js must not normalize claim registers, validate
// anchors, assign subset eligibility, compute counts, or enforce prohibited
// combinations. Two producers reproducing normalization is how a codebase ends up
// with two canonical models that drift. If you need a quantity, add a named count
// here and select it; do not compute one at the call site.
//
// ══ INVARIANTS, and why they are enforced by construction rather than by care ══
//
//   1. Findings are the semantic object. They survive an absent, malformed, or
//      non-finite legacy gap estimate. Score parsing cannot determine whether
//      findings exist, and no single-answer result depends on a gap estimate for
//      validity. (The old comment at api/read.js — "the panel is meaningless
//      without its estimate" — recorded the opposite architecture. It was wrong:
//      the estimate was evidence about the findings, never their precondition.)
//   2. An anchor cannot simultaneously carry a quotation and be absent. There is
//      no factory that produces that object.
//   3. A finding whose quotation does not resolve verbatim is recorded UNRESOLVED,
//      not dropped and not repaired. Nothing in this module invents a substitute
//      quotation for a side the source did not supply.
//   4. A matched-conditions claim requires an enumerated authorized basis AND an
//      affirmative MATCHED determination. Everything else normalizes DOWNWARD.
//      Nothing normalizes upward, ever.
//   5. Single-answer results carry no completeness label, no gap score, and no
//      0-3 scale. Those fields have no representation in the canonical block.
//   6. Suppressed register items remain findings in the canonical collection,
//      with their disposition and enumerated suppression reasons attached.
//
// Every constructed object is deep-frozen. That is what makes "cannot be
// constructed" true rather than aspirational: a prohibited combination can be
// neither built nor mutated into existence afterward.
//
// A note on the completeness probe: the second question is the fixed completeness
// probe at the recorded inspection_method_version. Its text is a property of that
// version, not of the Reader in general. No field, enum value, or comment in this
// module describes it as neutral, domain-general, or content-independent, because
// it is none of those things.
//
// Pure JS by contract (like reader-checks.js / reader-json.js): no node: imports,
// no DOM, no Date.now, no random. Fixed input produces an identical result.

import { resolveSpan } from "./reader-checks.js";

export const RESULT_SCHEMA_VERSION = "reader-result.v1";

// ---------------------------------------------------------------------------
// Failure mode. Construction throws on a prohibited combination rather than
// returning a degraded object, so a caller cannot accidentally ship one. The
// stable prefix lets tests assert the class of violation.
// ---------------------------------------------------------------------------

export const CANON_ERROR_PREFIX = "reader-result:";

function reject(message) {
  throw new RangeError(`${CANON_ERROR_PREFIX} ${message}`);
}

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const k of Object.keys(value)) deepFreeze(value[k]);
  }
  return value;
}

function str(v) {
  return typeof v === "string" ? v : "";
}

// ---------------------------------------------------------------------------
// One class vocabulary. Three parallel vocabularies existed for these three
// classes (inspector candidate strings, detector finding types, paired signal
// pattern labels). Everything normalizes here; nothing downstream re-maps.
// ---------------------------------------------------------------------------

export const FINDING_CLASSES = deepFreeze({
  omission: "Omission",
  framing_drift: "Framing Drift",
  deflection: "Deflection",
});

const CLASS_ALIASES = deepFreeze({
  "candidate missing item": "omission",
  "candidate framing issue": "framing_drift",
  "candidate deflection": "deflection",
  Omission: "omission",
  "Framing Drift": "framing_drift",
  Deflection: "deflection",
  omission: "omission",
  framing_drift: "framing_drift",
  deflection: "deflection",
});

export function normalizeClass(raw) {
  const key = str(raw).trim();
  return Object.prototype.hasOwnProperty.call(CLASS_ALIASES, key) ? CLASS_ALIASES[key] : null;
}

// ---------------------------------------------------------------------------
// Artifact roles. These are the ids already in use across the Review Packet and
// the Check Register; no new artifact vocabulary is introduced here.
// ---------------------------------------------------------------------------

export const ARTIFACT_ORIGINAL = "original_answer";
export const ARTIFACT_TARGETED = "targeted_answer";
export const ARTIFACT_ROLES = deepFreeze([ARTIFACT_ORIGINAL, ARTIFACT_TARGETED]);

// ---------------------------------------------------------------------------
// COORDINATE CONVENTION — declared here because the repository never declared one.
//
// Every span offset in this module is a JavaScript UTF-16 CODE UNIT index into the
// stored artifact string, half-open [start, end). This is not a new choice; it is
// the convention the existing code already had by accident, through
// String.prototype.indexOf and String.prototype.slice in reader-checks.js. Writing
// it down makes "character offset" unambiguous and makes the reproduction rule
// testable: for every resolved span, artifactText.slice(start, end) === quote,
// exactly, with no normalization applied to either side.
//
// A non-BMP character occupies two code units and therefore two index positions.
// That is consistent with slice(), which is what every consumer uses to re-derive
// the quoted text, so no consumer needs to know about surrogate pairs.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// SNIPPET RESOLUTION — evidence ownership (paired_method_version 2.0).
//
// The defect this replaces: the model was asked to reproduce quotations, and at 1.1
// it emitted delta prose presented as quotation that does not occur in the
// attributed answer, on 3 of 7 probe runs. The interface rendered those inside
// quotation marks.
//
// Models are unreliable reproducers and reliable locators. So ownership inverts:
// the model proposes a short snippet and names the artifact, and the SERVER locates
// it. A snippet that does not resolve never becomes a quotation, because no span
// exists for it and only a span can be quoted.
//
// This guarantees the evidence shown is real. It does NOT claim the model's
// interpretation of that evidence is correct. Those are different claims and the
// render register keeps them apart.
//
// Deliberately NOT reusing resolveSpan (reader-checks.js): it returns the FIRST
// indexOf hit and cannot report that a snippet occurred more than once, so it
// selects an occurrence silently. The Check Register depends on its current
// behavior, so it is left exactly as it is and this resolver is separate.
// ---------------------------------------------------------------------------

export const SNIPPET_REJECTION = deepFreeze({
  // The snippet does not occur in the named artifact at all.
  UNLOCATABLE_SNIPPET: "UNLOCATABLE_SNIPPET",
  // The snippet occurs more than once and the supplied context did not narrow it to
  // exactly one occurrence. Never resolved by picking one.
  AMBIGUOUS_SNIPPET: "AMBIGUOUS_SNIPPET",
});

const SNIPPET_REJECTION_SET = new Set(Object.values(SNIPPET_REJECTION));

// Quote-mark folding, applied symmetrically to artifact and snippet. A model that
// re-types a curly apostrophe as a straight one has not fabricated anything, and
// failing that match would discard true evidence. 1:1 by construction — every entry
// maps one code unit to one code unit — so folding never shifts an index.
const QUOTE_FOLD = new Map([
  ["‘", "'"], ["’", "'"], ["‚", "'"], ["‛", "'"],
  ["“", '"'], ["”", '"'], ["„", '"'], ["‟", '"'],
  ["′", "'"], ["″", '"'], ["«", '"'], ["»", '"'],
]);

const MATCH_WHITESPACE = new Set([" ", "\t", "\n", "\r", "\f", "\v", " "]);

// EXACTLY what is normalized, and nothing else:
//   1. every run of whitespace collapses to one space;
//   2. leading and trailing whitespace is dropped;
//   3. the quote marks in QUOTE_FOLD fold to their ASCII form.
// No case folding, no punctuation stripping, no fuzzy matching, no edit distance.
//
// Returns the normalized text AND the reversible mapping the contract requires:
// map[i] is the index in the ORIGINAL string that normalized code unit i came from.
// A whitespace run maps to the first index of that run. Because every canonical span
// is reported through this map, spans are always original-artifact offsets and a
// normalized offset is never stored.
function normalizeForMatch(text) {
  const chars = [];
  const map = [];
  let inSpace = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (MATCH_WHITESPACE.has(ch)) {
      if (!inSpace) {
        inSpace = true;
        chars.push(" ");
        map.push(i);
      }
      continue;
    }
    inSpace = false;
    chars.push(QUOTE_FOLD.get(ch) || ch);
    map.push(i);
  }
  let s = 0;
  let e = chars.length;
  while (s < e && chars[s] === " ") s++;
  while (e > s && chars[e - 1] === " ") e--;
  return { text: chars.slice(s, e).join(""), map: map.slice(s, e) };
}

// Every occurrence, including overlapping ones. The count is the point: knowing
// there are three is what makes "never select one silently" enforceable.
function findOccurrences(haystack, needle) {
  const hits = [];
  if (!needle) return hits;
  for (let from = 0; ; ) {
    const at = haystack.indexOf(needle, from);
    if (at === -1) break;
    hits.push(at);
    from = at + 1;
  }
  return hits;
}

// Locate one model-proposed snippet in one named artifact.
//
// Ambiguity policy, enumerated and total:
//   0 occurrences                    -> UNLOCATABLE_SNIPPET
//   1 occurrence                     -> span created
//   >1 and context identifies one    -> span created for that one
//   >1 and context leaves none       -> UNLOCATABLE_SNIPPET
//   >1 and context leaves several    -> AMBIGUOUS_SNIPPET
//   >1 and no usable context         -> AMBIGUOUS_SNIPPET
//
// The context is resolution metadata only. It never appears in the displayed
// quotation, and to be usable it must itself be verbatim from the same artifact,
// occur exactly once, and contain the snippet — so it can only ever narrow a set of
// real occurrences, never introduce one.
export function resolvePairedSnippet({ artifactText, snippet, context = "" }) {
  const source = str(artifactText);
  const raw = str(snippet);
  const miss = (reason, occurrences) => ({ ok: false, reason, occurrences });
  if (!source || !raw.trim()) return miss(SNIPPET_REJECTION.UNLOCATABLE_SNIPPET, 0);

  const A = normalizeForMatch(source);
  const S = normalizeForMatch(raw);
  if (!S.text) return miss(SNIPPET_REJECTION.UNLOCATABLE_SNIPPET, 0);

  let hits = findOccurrences(A.text, S.text);
  if (hits.length === 0) return miss(SNIPPET_REJECTION.UNLOCATABLE_SNIPPET, 0);

  if (hits.length > 1) {
    const C = normalizeForMatch(str(context));
    let narrowed = null;
    if (C.text && C.text.includes(S.text)) {
      const ctxHits = findOccurrences(A.text, C.text);
      if (ctxHits.length === 1) {
        const cs = ctxHits[0];
        const ce = cs + C.text.length;
        const inside = hits.filter((h) => h >= cs && h + S.text.length <= ce);
        if (inside.length === 0) return miss(SNIPPET_REJECTION.UNLOCATABLE_SNIPPET, hits.length);
        if (inside.length === 1) narrowed = inside;
      }
    }
    if (!narrowed) return miss(SNIPPET_REJECTION.AMBIGUOUS_SNIPPET, hits.length);
    hits = narrowed;
  }

  const ns = hits[0];
  const ne = ns + S.text.length;
  const start = A.map[ns];
  // The last normalized code unit is never a collapsed space (both ends are
  // trimmed), so it stands for exactly one original code unit.
  const end = A.map[ne - 1] + 1;
  return { ok: true, span: { start, end }, quote: source.slice(start, end), occurrences: 1 };
}

// ---------------------------------------------------------------------------
// Anchor contract (item 3). Three statuses, because "supplied but not verbatim"
// and "not supplied" are different facts and collapsing them would either drop a
// finding or overstate an anchor.
// ---------------------------------------------------------------------------

export const ANCHOR_STATUS = deepFreeze({
  QUOTED: "QUOTED",
  UNRESOLVED: "UNRESOLVED",
  ABSENT: "ABSENT",
});

export const ANCHOR_ABSENT_REASONS = deepFreeze({
  SOURCE_SUPPLIED_NO_QUOTATION: "SOURCE_SUPPLIED_NO_QUOTATION",
  ARTIFACT_NOT_AVAILABLE_TO_SURFACE: "ARTIFACT_NOT_AVAILABLE_TO_SURFACE",
});

const ANCHOR_ABSENT_REASON_SET = new Set(Object.values(ANCHOR_ABSENT_REASONS));

export const ANCHOR_REQUIREMENT = deepFreeze({
  REQUIRED: "REQUIRED",
  ABSENT_ALLOWED: "ABSENT_ALLOWED",
  FORBIDDEN: "FORBIDDEN",
});

// A quotation that resolves verbatim against the named artifact. Carries the span
// so a reader can point at it without re-resolving.
export function quotedAnchor({ role, quote, span }) {
  if (!ARTIFACT_ROLES.includes(role)) reject(`anchor role not enumerated: ${role}`);
  const q = str(quote);
  if (!q.trim()) reject("a QUOTED anchor requires a non-empty quotation");
  if (!span || typeof span.start !== "number" || typeof span.end !== "number") {
    reject("a QUOTED anchor requires a resolved span");
  }
  return deepFreeze({
    role,
    status: ANCHOR_STATUS.QUOTED,
    quote: q,
    span: { artifact_id: role, start: span.start, end: span.end },
    absent_reason: null,
  });
}

// The source supplied text for this side, but it does not occur verbatim in the
// artifact. Recorded, not repaired, and not counted as an anchor anywhere.
//
// quote is "" by construction. That is the whole mechanism: a surface can only
// render a quotation from a resolved span, so text that failed to resolve has
// nothing for a renderer to put inside quotation marks. rejection_reason names
// WHICH failure occurred, because "does not occur" and "occurs several times" are
// opposite facts about the model's behavior and a later calibration pass has to be
// able to tell them apart.
export function unresolvedAnchor({ role, supplied, rejection_reason = null }) {
  if (!ARTIFACT_ROLES.includes(role)) reject(`anchor role not enumerated: ${role}`);
  const s = str(supplied);
  if (!s.trim()) reject("an UNRESOLVED anchor requires the non-empty text that failed to resolve");
  if (rejection_reason != null && !SNIPPET_REJECTION_SET.has(rejection_reason)) {
    reject(`snippet rejection reason not enumerated: ${rejection_reason}`);
  }
  return deepFreeze({
    role,
    status: ANCHOR_STATUS.UNRESOLVED,
    quote: "",
    supplied_text: s,
    span: null,
    absent_reason: null,
    rejection_reason,
  });
}

// This side has nothing to quote and that is the truthful record of it. quote is
// "" by construction — no path in this module fills it.
export function absentAnchor({ role, reason }) {
  if (!ARTIFACT_ROLES.includes(role)) reject(`anchor role not enumerated: ${role}`);
  if (!ANCHOR_ABSENT_REASON_SET.has(reason)) reject(`absent_reason not enumerated: ${reason}`);
  return deepFreeze({
    role,
    status: ANCHOR_STATUS.ABSENT,
    quote: "",
    span: null,
    absent_reason: reason,
  });
}

// Resolve one supplied side into the anchor that truthfully describes it. The
// requirement comes from the finding's registered shape, so a shape that forbids a
// side cannot acquire one and a shape that requires one cannot be built without it.
//
// Two resolution modes, one door. `snippet` is the 2.0 contract: the model located
// evidence and the server resolves it, with occurrence counting and an enumerated
// rejection. `supplied` is the 1.x contract, kept for single-answer findings and for
// legacy paired records — it resolves through reader-checks.js resolveSpan, which
// takes the first match. A 1.x record therefore never acquires a 2.0 guarantee it
// did not earn; it just keeps behaving exactly as it did.
//
// tally is the per-run instrumentation sink. It counts what the model PROPOSED
// against what survived, which is the only way to tell a prompt that stopped
// fabricating from a prompt that fabricates just as often into a filter.
function buildAnchor({ role, supplied, snippet, context, artifactText, requirement, tally }) {
  if (requirement === ANCHOR_REQUIREMENT.FORBIDDEN) return null;
  const useSnippet = snippet != null;
  const s = str(useSnippet ? snippet : supplied).trim();
  if (!s) {
    if (requirement === ANCHOR_REQUIREMENT.REQUIRED) {
      reject(`shape requires a ${role} quotation and none was supplied`);
    }
    return absentAnchor({ role, reason: ANCHOR_ABSENT_REASONS.SOURCE_SUPPLIED_NO_QUOTATION });
  }
  if (typeof artifactText !== "string" || !artifactText) {
    if (requirement === ANCHOR_REQUIREMENT.REQUIRED) {
      reject(`shape requires a ${role} quotation but that artifact is not available here`);
    }
    return absentAnchor({ role, reason: ANCHOR_ABSENT_REASONS.ARTIFACT_NOT_AVAILABLE_TO_SURFACE });
  }

  if (useSnippet) {
    if (tally) tally.snippets_proposed++;
    const outcome = resolvePairedSnippet({ artifactText, snippet: s, context });
    if (outcome.ok) {
      if (tally) tally.snippets_resolved_unique++;
      return quotedAnchor({ role, quote: outcome.quote, span: outcome.span });
    }
    if (tally) {
      if (outcome.reason === SNIPPET_REJECTION.AMBIGUOUS_SNIPPET) tally.snippets_rejected_ambiguous++;
      else tally.snippets_rejected_unlocatable++;
    }
    return unresolvedAnchor({ role, supplied: s, rejection_reason: outcome.reason });
  }

  const span = resolveSpan(artifactText, s, role);
  if (span) return quotedAnchor({ role, quote: span.quote, span });
  return unresolvedAnchor({ role, supplied: s });
}

// ---------------------------------------------------------------------------
// Comparison direction (schema accommodation only). The deployed completeness
// probe at the recorded inspection_method_version produces PROBE_ONLY
// observations: material present under the probe, absent or thinner in the open
// answer. OPEN_ONLY and BOTH_DIFFERENT exist so a later pass can carry them
// without a schema migration. This pass does not detect, score, display, or count
// them, and adds no detector to produce them.
// ---------------------------------------------------------------------------

export const COMPARISON_DIRECTION = deepFreeze({
  PROBE_ONLY: "PROBE_ONLY",
  OPEN_ONLY: "OPEN_ONLY",
  BOTH_DIFFERENT: "BOTH_DIFFERENT",
});

const COMPARISON_DIRECTION_SET = new Set(Object.values(COMPARISON_DIRECTION));

// ---------------------------------------------------------------------------
// Claim register (item 6, correction #3). MATCHED_CONDITIONS is reachable only
// from an enumerated authorized basis plus an affirmative MATCHED determination.
//
// AUTHORIZED_CONDITIONS_SOURCES is deliberately a source no live surface supplies.
// The only conditions input that exists today is the client-side paste-back
// capture, which the server never observes; it is a REPORTED_CLIENT_DECLARATION
// and it does not authorize the matched register. Persisting an authoritative
// conditions field is a separate pass, blocked on a founder ruling. This module
// defines the semantic contract that pass will implement and creates no such field.
// ---------------------------------------------------------------------------

export const CLAIM_REGISTER = deepFreeze({
  MATCHED_CONDITIONS: "MATCHED_CONDITIONS",
  OBSERVED_DIFFERENCE: "OBSERVED_DIFFERENCE",
});

export const CLAIM_BASIS = deepFreeze({
  AUTHORIZED_MATCHED_BASIS: "AUTHORIZED_MATCHED_BASIS",
  REPORTED_CLIENT_DECLARATION: "REPORTED_CLIENT_DECLARATION",
  NO_AUTHORIZED_BASIS: "NO_AUTHORIZED_BASIS",
  UNRECOGNIZED_BASIS: "UNRECOGNIZED_BASIS",
});

export const CONDITIONS_STATUS = deepFreeze({
  MATCHED: "MATCHED",
  UNMATCHED: "UNMATCHED",
  UNVERIFIED: "UNVERIFIED",
  UNAVAILABLE: "UNAVAILABLE",
});

const CONDITIONS_STATUS_SET = new Set(Object.values(CONDITIONS_STATUS));

export const AUTHORIZED_CONDITIONS_SOURCES = deepFreeze(["server_observed_pair_conditions"]);
export const CLIENT_DECLARATION_SOURCES = deepFreeze(["pair_capture_client_declaration"]);

const AUTHORIZED_SOURCE_SET = new Set(AUTHORIZED_CONDITIONS_SOURCES);
const CLIENT_SOURCE_SET = new Set(CLIENT_DECLARATION_SOURCES);

// The whole normalization, in one place. Absent, unknown, unavailable, and
// unrecognized bases all land on OBSERVED_DIFFERENCE. There is no branch that
// raises a claim.
export function normalizeClaim({ conditions_source, conditions_status } = {}) {
  const source = str(conditions_source).trim();
  const basis = AUTHORIZED_SOURCE_SET.has(source)
    ? CLAIM_BASIS.AUTHORIZED_MATCHED_BASIS
    : CLIENT_SOURCE_SET.has(source)
      ? CLAIM_BASIS.REPORTED_CLIENT_DECLARATION
      : source
        ? CLAIM_BASIS.UNRECOGNIZED_BASIS
        : CLAIM_BASIS.NO_AUTHORIZED_BASIS;
  const status = CONDITIONS_STATUS_SET.has(conditions_status)
    ? conditions_status
    : CONDITIONS_STATUS.UNAVAILABLE;
  const register =
    basis === CLAIM_BASIS.AUTHORIZED_MATCHED_BASIS && status === CONDITIONS_STATUS.MATCHED
      ? CLAIM_REGISTER.MATCHED_CONDITIONS
      : CLAIM_REGISTER.OBSERVED_DIFFERENCE;
  return deepFreeze({ claim_register: register, claim_basis: basis, conditions_status: status });
}

// ---------------------------------------------------------------------------
// Two-axis claim state (item 7). Reader state is what the instrument observed;
// disposition is what a human review concluded. They are independent, and the
// live Reader owns only the first axis.
//
// Reader state is DERIVED, never passed in by a live caller: a paired finding with
// a verbatim probe-side quotation is an OBSERVED difference between two answers;
// everything else is a CANDIDATE nomination about one answer.
// ---------------------------------------------------------------------------

export const READER_STATE = deepFreeze({ OBSERVED: "OBSERVED", CANDIDATE: "CANDIDATE" });

export const DISPOSITION = deepFreeze({
  UNREVIEWED: "UNREVIEWED",
  VERIFIED: "VERIFIED",
  REJECTED: "REJECTED",
  UNRESOLVED: "UNRESOLVED",
});

const READER_STATE_SET = new Set(Object.values(READER_STATE));
const DISPOSITION_SET = new Set(Object.values(DISPOSITION));

export const ORIGIN = deepFreeze({ LIVE_READER: "live_reader", ARCHIVE: "archive" });

// ---------------------------------------------------------------------------
// Check Register disposition (item 10). Recorded, not displayed. Eligibility
// annotates a finding; it never decides whether the finding survives.
//
// The reason vocabulary is instrumentation. A later pass has to be able to tell
// whether the register produced nothing because the findings were weak or because
// it could not consume a valid anchor shape — opposite conclusions. A generic
// "below threshold" label would lose that distinction permanently, so there is no
// generic value here and no free-form prose in the payload.
// ---------------------------------------------------------------------------

export const REGISTER_STATUS = deepFreeze({
  ELIGIBLE: "ELIGIBLE",
  EMITTED: "EMITTED",
  SUPPRESSED: "SUPPRESSED",
  NOT_APPLICABLE: "NOT_APPLICABLE",
});

export const SUPPRESSION_REASONS = deepFreeze({
  // The finding's only verbatim quotation belongs to the probe answer, and the
  // register resolves every span against a single artifact. Not a weak finding —
  // a valid anchor shape the register cannot currently consume.
  PROBE_SIDE_ANCHOR_UNSUPPORTED: "PROBE_SIDE_ANCHOR_UNSUPPORTED",
  // The open side is explicitly ABSENT, so the register's dependent end has
  // nothing to resolve. Expected for omission-shaped findings by construction.
  OPEN_SIDE_ANCHOR_ABSENT: "OPEN_SIDE_ANCHOR_ABSENT",
  // The source supplied a quotation that does not occur verbatim in the artifact.
  ANCHOR_NOT_VERBATIM: "ANCHOR_NOT_VERBATIM",
  // The source finding carried no check block for the register to assemble.
  NO_CHECK_BLOCK: "NO_CHECK_BLOCK",
  // The finding's shape has no comparative detector in the register's vocabulary.
  SHAPE_NOT_REGISTER_ELIGIBLE: "SHAPE_NOT_REGISTER_ELIGIBLE",
  // The register does not run on this surface at all (paired mode today).
  REGISTER_NOT_BUILT_FOR_SURFACE: "REGISTER_NOT_BUILT_FOR_SURFACE",
  // Every supplied quotation resolved verbatim and the register still emitted no
  // card. Its assembler drops a block under several rules without reporting which
  // one fired, so the cause is genuinely unavailable here. Recorded as the
  // register's silence, never as a weak anchor — those are opposite conclusions.
  REGISTER_DROPPED_WITHOUT_REPORTING_CAUSE: "REGISTER_DROPPED_WITHOUT_REPORTING_CAUSE",
});

const SUPPRESSION_REASON_SET = new Set(Object.values(SUPPRESSION_REASONS));

export function registerDisposition({ status, card_id = null, suppression_reasons = [] }) {
  if (!Object.prototype.hasOwnProperty.call(REGISTER_STATUS, status)) {
    reject(`register status not enumerated: ${status}`);
  }
  const reasons = Array.isArray(suppression_reasons) ? suppression_reasons.slice() : [];
  for (const r of reasons) {
    if (!SUPPRESSION_REASON_SET.has(r)) reject(`suppression reason not enumerated: ${r}`);
  }
  const carries = status === REGISTER_STATUS.SUPPRESSED || status === REGISTER_STATUS.NOT_APPLICABLE;
  if (!carries && reasons.length > 0) {
    reject(`${status} cannot carry suppression reasons`);
  }
  if (status === REGISTER_STATUS.SUPPRESSED && reasons.length === 0) {
    reject("SUPPRESSED requires at least one enumerated suppression reason");
  }
  if (status === REGISTER_STATUS.EMITTED && !str(card_id).trim()) {
    reject("EMITTED requires a card_id");
  }
  if (status !== REGISTER_STATUS.EMITTED && card_id != null) {
    reject(`${status} cannot carry a card_id`);
  }
  return deepFreeze({ status, card_id: card_id == null ? null : str(card_id), suppression_reasons: reasons });
}

// Annotate one single-surface finding with what the Check Register did to it.
// Takes the raw check block the source supplied, the artifact the register
// resolved against, and the register's own cards; returns a disposition. The
// finding survives either way — this only records the outcome.
//
// The join is an exact content match on the three strings the card denormalizes
// from the block, so no ordering assumption is made about the register's ranking.
// When the block resolved verbatim yet produced no card, the register dropped it
// under a rule it does not report (failure-is-silence), and the disposition says
// exactly that rather than blaming the anchor.
export function classifyRegisterOutcome({ check, artifactText, cards = [] }) {
  if (!check || typeof check !== "object") {
    return registerDisposition({
      status: REGISTER_STATUS.SUPPRESSED,
      suppression_reasons: [SUPPRESSION_REASONS.NO_CHECK_BLOCK],
    });
  }
  const card = cards.find(
    (c) =>
      c &&
      c.dependency_statement === check.dependency_statement &&
      c.dependent_output &&
      c.dependent_output.text === check.dependent_output &&
      c.proposition &&
      c.proposition.text === check.supporting_proposition,
  );
  if (card) return registerDisposition({ status: REGISTER_STATUS.EMITTED, card_id: card.id });
  const quoted = [check.supporting_proposition, check.dependent_output];
  for (const q of quoted) {
    if (!resolveSpan(artifactText, q, ARTIFACT_ORIGINAL)) {
      return registerDisposition({
        status: REGISTER_STATUS.SUPPRESSED,
        suppression_reasons: [SUPPRESSION_REASONS.ANCHOR_NOT_VERBATIM],
      });
    }
  }
  return registerDisposition({
    status: REGISTER_STATUS.SUPPRESSED,
    suppression_reasons: [SUPPRESSION_REASONS.REGISTER_DROPPED_WITHOUT_REPORTING_CAUSE],
  });
}

// ---------------------------------------------------------------------------
// Finding-shape registry (item 8). Rendering and counting are driven by
// registration, not by a hardcoded list of the three shipped classes. A new
// finding type is added by registering a shape; no renderer changes.
// ---------------------------------------------------------------------------

const SHAPES = new Map();

export function registerFindingShape(def) {
  const id = str(def && def.id).trim();
  if (!id) reject("a finding shape requires an id");
  if (SHAPES.has(id)) reject(`finding shape already registered: ${id}`);
  const surface = str(def.surface).trim();
  if (surface !== "single" && surface !== "paired") reject(`shape surface must be single or paired: ${id}`);
  const anchors = {};
  for (const role of ARTIFACT_ROLES) {
    const req = (def.anchors || {})[role] || ANCHOR_REQUIREMENT.FORBIDDEN;
    if (!Object.prototype.hasOwnProperty.call(ANCHOR_REQUIREMENT, req)) {
      reject(`anchor requirement not enumerated for ${id}.${role}: ${req}`);
    }
    anchors[role] = req;
  }
  // The SURFACING contract, registered beside the construction contract and
  // separate from it. `anchors` governs what may be built; `quoted_to_surface`
  // governs what may be counted or displayed. A finding is always recorded, and
  // only these roles resolving verbatim let it into a surfaced quantity.
  const quoted_to_surface = Array.isArray(def.quoted_to_surface) ? def.quoted_to_surface.slice() : [];
  if (!quoted_to_surface.length) {
    reject(`a finding shape must name at least one role that must be quoted to surface: ${id}`);
  }
  for (const role of quoted_to_surface) {
    if (!ARTIFACT_ROLES.includes(role)) reject(`quoted_to_surface names an unenumerated role for ${id}: ${role}`);
    if (anchors[role] === ANCHOR_REQUIREMENT.FORBIDDEN) {
      reject(`quoted_to_surface names a forbidden role for ${id}: ${role}`);
    }
  }
  // A REQUIRED anchor can still come back UNRESOLVED: the source supplied text and
  // it did not occur verbatim. Such a finding is recorded, never surfaced, so every
  // REQUIRED role has to be in the surfacing set or an unresolved required anchor
  // could contribute to a visible count.
  for (const role of ARTIFACT_ROLES) {
    if (anchors[role] === ANCHOR_REQUIREMENT.REQUIRED && !quoted_to_surface.includes(role)) {
      reject(`a REQUIRED anchor must also be required to surface for ${id}: ${role}`);
    }
  }
  // Every shape declares its standing relationship to the Check Register, so a
  // finding is never annotated with a reason inferred from its surface. Validated
  // here, at registration, through the same constructor the adapters use.
  const register_default = registerDisposition(
    def.register_default || {
      status: REGISTER_STATUS.NOT_APPLICABLE,
      suppression_reasons: [SUPPRESSION_REASONS.SHAPE_NOT_REGISTER_ELIGIBLE],
    },
  );
  const shape = deepFreeze({
    id,
    surface,
    anchors,
    quoted_to_surface,
    directional: !!def.directional,
    register_default,
    label: str(def.label) || id,
  });
  SHAPES.set(id, shape);
  return shape;
}

export function getFindingShape(id) {
  return SHAPES.get(str(id)) || null;
}

export function listFindingShapeIds() {
  return Array.from(SHAPES.keys());
}

export const SHAPE_SINGLE_CANDIDATE = "single_candidate_item";
export const SHAPE_PAIRED_OBSERVED_DIFFERENCE = "paired_observed_difference";
export const SHAPE_PAIRED_COMPARATIVE_CONTRAST = "paired_comparative_contrast";

// THE TWO CONTRACTS, AND WHY THEY DIFFER.
//
// `anchors` is the construction contract. The two open-ended shapes permit an
// absent anchor so that an unanchored source finding is never dropped at the
// construction door, which is the defect this pass exists to close.
//
// `quoted_to_surface` is the surfacing contract. It names the roles that must
// resolve verbatim before the finding may enter a surfaced subset or any visible
// tally. recorded_findings preserves legacy and unresolved material; a finding
// reaches a person only through surfaced_findings.
//
// The two are separate on purpose. Permissive construction plus strict surfacing
// keeps the record complete without letting an unquotable finding inflate a count.
registerFindingShape({
  id: SHAPE_SINGLE_CANDIDATE,
  surface: "single",
  label: "Candidate item in one answer",
  anchors: { [ARTIFACT_ORIGINAL]: ANCHOR_REQUIREMENT.ABSENT_ALLOWED },
  quoted_to_surface: [ARTIFACT_ORIGINAL],
  directional: false,
  register_default: { status: REGISTER_STATUS.ELIGIBLE },
});

// The omission shape. An omission has nothing to quote on the open side — that is
// what makes it an omission — so ABSENT there is the truthful record and does not
// block surfacing. The probe-side quotation is what the finding rests on, so it is
// the one role that must resolve verbatim.
registerFindingShape({
  id: SHAPE_PAIRED_OBSERVED_DIFFERENCE,
  surface: "paired",
  label: "Difference observed under the probe",
  anchors: {
    [ARTIFACT_TARGETED]: ANCHOR_REQUIREMENT.ABSENT_ALLOWED,
    [ARTIFACT_ORIGINAL]: ANCHOR_REQUIREMENT.ABSENT_ALLOWED,
  },
  quoted_to_surface: [ARTIFACT_TARGETED],
  directional: true,
  register_default: {
    status: REGISTER_STATUS.SUPPRESSED,
    suppression_reasons: [SUPPRESSION_REASONS.PROBE_SIDE_ANCHOR_UNSUPPORTED],
  },
});

// The one shape with a hard REQUIRED side. A contrast claim is a claim about two
// quotations, so it cannot be constructed from one; an adapter selects this shape
// only when it holds both sides.
registerFindingShape({
  id: SHAPE_PAIRED_COMPARATIVE_CONTRAST,
  surface: "paired",
  label: "Contrast quotable on both sides",
  anchors: {
    [ARTIFACT_TARGETED]: ANCHOR_REQUIREMENT.REQUIRED,
    [ARTIFACT_ORIGINAL]: ANCHOR_REQUIREMENT.REQUIRED,
  },
  quoted_to_surface: [ARTIFACT_TARGETED, ARTIFACT_ORIGINAL],
  directional: true,
  register_default: {
    status: REGISTER_STATUS.SUPPRESSED,
    suppression_reasons: [SUPPRESSION_REASONS.PROBE_SIDE_ANCHOR_UNSUPPORTED],
  },
});

// ---------------------------------------------------------------------------
// The canonical finding.
// ---------------------------------------------------------------------------

// The shape's standing register relationship, refined by what this finding's
// anchors actually turned out to be. An omission-shaped paired finding carries
// both reasons: the register cannot consume its probe-side anchor, and its open
// side has nothing to resolve. Recording both keeps the two causes separable.
function defaultDisposition(shape, anchors) {
  const base = shape.register_default;
  if (base.status !== REGISTER_STATUS.SUPPRESSED) return base;
  const open = anchors.find((a) => a.role === ARTIFACT_ORIGINAL);
  if (!open || open.status !== ANCHOR_STATUS.ABSENT) return base;
  return registerDisposition({
    status: base.status,
    suppression_reasons: [...base.suppression_reasons, SUPPRESSION_REASONS.OPEN_SIDE_ANCHOR_ABSENT],
  });
}

function deriveReaderState(shape, anchors) {
  if (shape.surface !== "paired") return READER_STATE.CANDIDATE;
  const probe = anchors.find((a) => a.role === ARTIFACT_TARGETED);
  return probe && probe.status === ANCHOR_STATUS.QUOTED ? READER_STATE.OBSERVED : READER_STATE.CANDIDATE;
}

export function buildFinding({
  index,
  shape: shapeId,
  class_label,
  statement,
  materiality = "",
  quotations = {},
  snippets = {},
  artifacts = {},
  resolution_tally = null,
  comparison_direction = null,
  conditions_source = "",
  conditions_status = CONDITIONS_STATUS.UNAVAILABLE,
  origin = ORIGIN.LIVE_READER,
  reader_state = null,
  disposition = DISPOSITION.UNREVIEWED,
  check_register = null,
}) {
  const shape = getFindingShape(shapeId);
  if (!shape) reject(`finding shape not registered: ${shapeId}`);

  const cls = normalizeClass(class_label);
  if (!cls) reject(`class label not in the canonical vocabulary: ${class_label}`);

  const point = str(statement).trim();
  if (!point) reject("a finding requires a non-empty statement");

  const anchors = [];
  for (const role of ARTIFACT_ROLES) {
    const proposed = snippets[role];
    const anchor = buildAnchor({
      role,
      supplied: quotations[role],
      snippet: proposed ? proposed.verbatim_snippet : null,
      context: proposed ? proposed.disambiguating_context : "",
      artifactText: artifacts[role],
      requirement: shape.anchors[role],
      tally: resolution_tally,
    });
    if (anchor) anchors.push(anchor);
  }

  if (shape.directional) {
    if (!COMPARISON_DIRECTION_SET.has(comparison_direction)) {
      reject(`a directional shape requires an enumerated comparison_direction: ${comparison_direction}`);
    }
  } else if (comparison_direction != null) {
    reject(`a non-directional shape cannot carry a comparison_direction: ${shape.id}`);
  }

  const claim =
    shape.surface === "paired"
      ? normalizeClaim({ conditions_source, conditions_status })
      : deepFreeze({ claim_register: null, claim_basis: null, conditions_status: null });

  if (origin === ORIGIN.LIVE_READER) {
    if (disposition !== DISPOSITION.UNREVIEWED) {
      reject("the live Reader may only create UNREVIEWED findings");
    }
    if (reader_state != null) reject("the live Reader must let reader_state be derived, not supplied");
  } else if (origin !== ORIGIN.ARCHIVE) {
    reject(`origin not enumerated: ${origin}`);
  }
  if (!DISPOSITION_SET.has(disposition)) reject(`disposition not enumerated: ${disposition}`);
  if (check_register != null) {
    if (!Object.prototype.hasOwnProperty.call(REGISTER_STATUS, check_register.status)) {
      reject("check_register must be built by registerDisposition");
    }
  }
  const state = reader_state == null ? deriveReaderState(shape, anchors) : reader_state;
  if (!READER_STATE_SET.has(state)) reject(`reader_state not enumerated: ${state}`);

  return deepFreeze({
    id: `${shape.id}.${Number.isInteger(index) ? index : 0}`,
    shape: shape.id,
    surface: shape.surface,
    class_label: cls,
    statement: point,
    materiality: str(materiality).trim(),
    anchors,
    comparison_direction: shape.directional ? comparison_direction : null,
    claim_register: claim.claim_register,
    claim_basis: claim.claim_basis,
    conditions_status: claim.conditions_status,
    reader_state: state,
    disposition,
    origin,
    check_register: check_register || defaultDisposition(shape, anchors),
  });
}

// ---------------------------------------------------------------------------
// Generic rendering (item 8). A renderer asks this for everything it needs and
// branches on nothing. Adding a finding shape is a registerFindingShape call and
// no renderer change: the shape supplies its own label, and anchors describe
// themselves by role and status.
//
// The class vocabulary is NOT an extension point. Omission / Framing Drift /
// Deflection are a locked product decision (CLAUDE.md), so adding a fourth class
// is a product ruling rather than an architecture affordance. The shape axis is
// where new finding types register.
// ---------------------------------------------------------------------------

export function describeFinding(finding) {
  const shape = getFindingShape(finding && finding.shape);
  if (!shape) reject(`cannot describe an unregistered shape: ${finding && finding.shape}`);
  return deepFreeze({
    id: finding.id,
    shape: shape.id,
    shape_label: shape.label,
    surface: shape.surface,
    class_id: finding.class_label,
    class_display: FINDING_CLASSES[finding.class_label],
    statement: finding.statement,
    materiality: finding.materiality,
    anchors: finding.anchors.map((a) => ({
      role: a.role,
      status: a.status,
      quote: a.quote,
      absent_reason: a.absent_reason,
    })),
    directional: shape.directional,
    comparison_direction: finding.comparison_direction,
    claim_register: finding.claim_register,
    claim_basis: finding.claim_basis,
    conditions_status: finding.conditions_status,
    reader_state: finding.reader_state,
    disposition: finding.disposition,
  });
}

// ---------------------------------------------------------------------------
// Named counts (item 4). Each count names its eligibility predicate and its unit.
// A quantity that is not defined here does not get displayed, exported, or
// asserted anywhere.
// ---------------------------------------------------------------------------

export const COUNT_DEFS = deepFreeze({
  // The display subset, and the only subset a person is shown. Shape-agnostic:
  // membership is decided by each shape's own registered surfacing contract, so a
  // newly registered shape joins it without editing this file.
  surfaced_findings: {
    id: "surfaced_findings",
    unit_one: "finding",
    unit_many: "findings",
    predicate_id: "satisfies_registered_anchor_contract",
    predicate_note:
      "Findings whose shape's quoted_to_surface roles all resolve verbatim against their artifact. An unresolved required anchor is excluded.",
  },
  surfaced_candidate_items: {
    id: "surfaced_candidate_items",
    unit_one: "candidate item",
    unit_many: "candidate items",
    predicate_id: "single_surface_satisfying_anchor_contract",
    predicate_note:
      "surfaced_findings restricted to the single-answer surface. Same membership rule, stated in the unit a single-answer result reports.",
  },
  // The quantity a paired result may state. Restricted to PROBE_ONLY by the
  // predicate, so a later pass that begins carrying OPEN_ONLY or BOTH_DIFFERENT
  // cannot silently enlarge it. Named for what it counts rather than for the
  // Volunteer Gap construct, which is a human-scored ordinal and not this.
  probe_surfaced_differences: {
    id: "probe_surfaced_differences",
    unit_one: "difference",
    unit_many: "differences",
    predicate_id: "paired_probe_only_satisfying_anchor_contract",
    predicate_note:
      "surfaced_findings restricted to paired findings whose comparison_direction is PROBE_ONLY. The probe-side quotation is what every paired shape requires to surface.",
  },
  recorded_findings: {
    id: "recorded_findings",
    unit_one: "finding",
    unit_many: "findings",
    predicate_id: "every_canonical_finding",
    predicate_note:
      "The whole canonical collection, including findings the Check Register suppressed and findings whose supplied quotation did not resolve. This is what the durable record carries. It is not displayed.",
  },
});

// The surfacing rule, in one place. Every surfaced quantity delegates here, so the
// hero, the panel, and any later surface cannot each decide "surfaced" their own way.
// That divergence is what produced a hero count that disagreed with the rows beneath it.
export function satisfiesAnchorContract(finding) {
  const shape = getFindingShape(finding && finding.shape);
  if (!shape) return false;
  return shape.quoted_to_surface.every((role) => {
    const anchor = finding.anchors.find((a) => a.role === role);
    return !!anchor && anchor.status === ANCHOR_STATUS.QUOTED;
  });
}

const PREDICATES = {
  satisfies_registered_anchor_contract: (f) => satisfiesAnchorContract(f),
  single_surface_satisfying_anchor_contract: (f) => f.surface === "single" && satisfiesAnchorContract(f),
  paired_probe_only_satisfying_anchor_contract: (f) =>
    f.surface === "paired" &&
    f.comparison_direction === COMPARISON_DIRECTION.PROBE_ONLY &&
    satisfiesAnchorContract(f),
  every_canonical_finding: () => true,
};

// Named subset selector. Renderers call this; they never filter inline.
export function selectSubset(result, countId) {
  const def = COUNT_DEFS[countId];
  if (!def) reject(`count not defined: ${countId}`);
  const predicate = PREDICATES[def.predicate_id];
  const findings = (result && result.findings) || [];
  return findings.filter(predicate);
}

export function countOf(result, countId) {
  return selectSubset(result, countId).length;
}

// Per-class breakdown over a named subset, keyed by the one class vocabulary.
export function classBreakdown(result, countId) {
  const out = {};
  for (const key of Object.keys(FINDING_CLASSES)) out[key] = 0;
  for (const f of selectSubset(result, countId)) out[f.class_label]++;
  return out;
}

function computeCounts(findings) {
  const out = {};
  for (const def of Object.values(COUNT_DEFS)) {
    const subset = findings.filter(PREDICATES[def.predicate_id]);
    // The per-class split rides with the count so a serialized surface — receipt,
    // Review Packet, share record — restates it instead of recounting it.
    const class_breakdown = {};
    for (const key of Object.keys(FINDING_CLASSES)) class_breakdown[key] = 0;
    for (const f of subset) class_breakdown[f.class_label]++;
    out[def.id] = {
      value: subset.length,
      unit_one: def.unit_one,
      unit_many: def.unit_many,
      predicate_id: def.predicate_id,
      class_breakdown,
    };
  }
  return out;
}

// Plural-aware label for a named count. One place, so the three inline
// re-pluralizations that used to exist in the renderer have nothing to diverge from.
export function countLabel(result, countId) {
  const def = COUNT_DEFS[countId];
  if (!def) reject(`count not defined: ${countId}`);
  const n = countOf(result, countId);
  return `${n} ${n === 1 ? def.unit_one : def.unit_many}`;
}

// ---------------------------------------------------------------------------
// Version fields (item 9) and the legacy block (correction #5).
// ---------------------------------------------------------------------------

function buildProvenance({ inspection_method_version, provider, model, model_snapshot_or_build }) {
  return deepFreeze({
    result_schema_version: RESULT_SCHEMA_VERSION,
    inspection_method_version: str(inspection_method_version),
    provider: str(provider),
    model: str(model),
    model_snapshot_or_build: str(model_snapshot_or_build),
  });
}

// Historical figures ride verbatim with their provenance and no current claim is
// derived from them. A human-scored 0-3 is preserved exactly as recorded; a legacy
// machine estimate is preserved exactly as recorded. Neither is reinterpreted, and
// neither may be read as a property of the canonical collection.
function buildLegacyBlock(legacy) {
  if (!legacy || typeof legacy !== "object") return null;
  const out = { note: "Preserved verbatim from an earlier schema. No current claim derives from these fields." };
  for (const key of Object.keys(legacy)) {
    if (legacy[key] === undefined) continue;
    out[key] = legacy[key];
  }
  return deepFreeze(out);
}

// ---------------------------------------------------------------------------
// The canonical result. This is the only function that produces one.
// ---------------------------------------------------------------------------

// Per-run snippet instrumentation. Recorded in the result metadata, never displayed.
//
// This exists to answer one question the next calibration session has to be able to
// ask: did 2.0 reduce fabrication ATTEMPTS, or does the model fabricate at the same
// rate and the server now discards it? The surfaced count alone cannot distinguish
// those — both look like clean output. proposed-versus-resolved can.
//
// The 1.1 baseline to measure against: 3 of 7 probe runs emitted delta prose
// presented as quotation that does not occur in the attributed answer.
export function newResolutionTally() {
  return {
    snippets_proposed: 0,
    snippets_resolved_unique: 0,
    snippets_rejected_unlocatable: 0,
    snippets_rejected_ambiguous: 0,
  };
}

function buildResolutionBlock(tally) {
  const t = tally || newResolutionTally();
  return deepFreeze({
    snippets_proposed: t.snippets_proposed || 0,
    snippets_resolved_unique: t.snippets_resolved_unique || 0,
    snippets_rejected_unlocatable: t.snippets_rejected_unlocatable || 0,
    snippets_rejected_ambiguous: t.snippets_rejected_ambiguous || 0,
  });
}

export function buildCanonicalResult({
  surface,
  findings = [],
  inspection_method_version = "",
  provider = "",
  model = "",
  model_snapshot_or_build = "",
  resolution_tally = null,
  legacy = null,
}) {
  if (surface !== "single" && surface !== "paired") reject(`surface must be single or paired: ${surface}`);
  for (const f of findings) {
    if (!f || !getFindingShape(f.shape)) reject("findings must be built by buildFinding");
    if (f.surface !== surface) reject(`a ${f.surface} finding cannot ride on a ${surface} result`);
  }
  const collection = findings.slice();
  return deepFreeze({
    ...buildProvenance({ inspection_method_version, provider, model, model_snapshot_or_build }),
    surface,
    findings: collection,
    counts: computeCounts(collection),
    // Item 11: the verification-task slot exists and stays empty. This pass does
    // not generate tasks, change any prompt to produce them, or render the field.
    verification_tasks: [],
    snippet_resolution: buildResolutionBlock(resolution_tally),
    legacy: buildLegacyBlock(legacy),
  });
}
