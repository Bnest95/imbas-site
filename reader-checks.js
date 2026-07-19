// reader-checks.js — Check Register v1 object model (Reader v3 R3).
//
// The R3 lane builds ONE family of checks: finding_derived comparative
// (vg.omission / vg.framing_drift / vg.deflection). Each qualifying
// inspector finding that carries a fully-quotable answer-internal dependency
// becomes a Check card. Local-integrity and profile detectors are NOT built
// here — but their storage shapes, validators, and family-separated queries
// are defined so the object model already distinguishes families and
// verification modes (schema AT-4 / AT-13 design conformance).
//
// Two hard laws from the schema and the lane brief:
//   1. Both-ends-quotable (finding_derived): a check emits only if BOTH the
//      supporting proposition and the dependent output resolve to exact spans
//      of the inspected answer. If either end can't be quoted, no check —
//      "silence, not degradation."
//   2. Pointer register: card copy says a conclusion "rests on" a proposition
//      and hands over a question "worth asking" / to "check against" a source.
//      It never rules a world-claim true/false. A model-written dependency
//      statement or verification question that asserts a world-claim verdict
//      drops the whole check (hasWorldClaimVerdict gate).
//
// Comparative events carry NO verification block; a verification block on a
// comparative event is a validation failure (AT-13). Comparative provenance
// rides the parent Inspection's inspector fields.
//
// Pure JS by contract (like reader-json.js / reader-telemetry.js): no node:
// imports, no DOM — importable by both the server (api/read.js) and the
// browser bundle (workbench-app.jsx). Deterministic: no Date.now, no random;
// fixed inputs produce identical ids, ordering, and top-3 (AT-9).

import { hasWorldClaimVerdict } from "./reader-check-vocab.js";

export const CHECK_MODEL_VERSION = "check-register.v1";
export const COMPARATIVE_DETECTOR_VERSION = "1.0";
export const DEFAULT_TOP_N = 3;

export const FAMILIES = new Set(["comparative", "local_integrity", "profile"]);
export const SUBCLASSES = new Set(["finding_derived", "local_integrity", "profile_derived"]);
export const RESOLVERS = new Set(["authority", "document", "calculation", "direct_question"]);
export const PROPAGATIONS = new Set([
  "final_conclusion",
  "recommendation_or_action",
  "calculation",
  "isolated_detail",
]);
export const STATUSES = new Set(["open", "resolved", "dismissed"]);
export const DEMONSTRABILITIES = new Set(["mechanical_verified", "model_nominated", "comparative"]);

// Only these inspector finding types map to a comparative detector. A finding
// of any other type gets no comparative check (the finding_derived comparative
// clause of the lane — the other families are later lanes).
export const FINDING_TYPE_TO_DETECTOR = {
  omission: { detector_id: "vg.omission", finding_type: "omission" },
  framing_drift: { detector_id: "vg.framing_drift", finding_type: "framing_drift" },
  deflection: { detector_id: "vg.deflection", finding_type: "deflection" },
};

// Ranking order (AT-9): demonstrability, then propagation, then conflict count,
// stable tiebreak = earliest span offset. Lower rank sorts first.
export const DEMONSTRABILITY_RANK = { mechanical_verified: 0, model_nominated: 1, comparative: 2 };
export const PROPAGATION_RANK = {
  final_conclusion: 0,
  recommendation_or_action: 1,
  calculation: 2,
  isolated_detail: 3,
};

// ---------------------------------------------------------------------------
// User-facing static copy for the register and cards. Every string here is
// linted by the AT-5 vocab test (lintUserFacingStrings over CHECK_UI): pointer
// register only, no world-claim verdicts, no reliance/defensibility claims.
// "Deflection" is the shipped label for the deflection family (detector id
// renamed in schema v0.3.0 per the founder naming ruling; "Active
// Foreclosure" is the v1-docs-only name).
// ---------------------------------------------------------------------------
export const CHECK_UI = {
  register_heading: "Questions worth asking",
  register_note:
    "Each card points at a place where the answer's own conclusion rests on something earlier in the same answer. Provisional pointers, not verdicts — copy a question and check it against a source.",
  top_label: "Worth asking first",
  expand_label: "Show the full register",
  collapse_label: "Show fewer",
  labels: {
    trigger: "Trigger",
    proposition: "Rests on",
    dependent: "Which carries",
    dependency: "How they connect",
    evidence: "Quoted from the answer",
    verification: "Worth asking",
    resolver: "Where to check",
    status: "Status",
  },
  provisional_label: "Provisional — a pointer, not a verdict",
  copy_affordance: "Copy the question",
  copied_affordance: "Copied",
  finding_labels: {
    omission: "Omission",
    framing_drift: "Framing Drift",
    deflection: "Deflection",
  },
  resolver_labels: {
    authority: "Check against an authority",
    document: "Check against the document",
    calculation: "Re-run the calculation",
    direct_question: "Ask the question directly",
  },
  status_labels: {
    open: "Open",
    resolved: "Resolved",
    dismissed: "Set aside",
  },
};

// ---------------------------------------------------------------------------
// Span resolution — the mechanical heart of the both-ends rule.
// ---------------------------------------------------------------------------

function asString(v) {
  return typeof v === "string" ? v : "";
}

// Accept a quote payload in the tolerant shapes a model might emit and return a
// clean array of candidate quote strings: string | string[] | {quotes:[...]} |
// {text} | {quote}. Empty/blank entries are dropped.
export function normalizeQuotes(input) {
  let arr;
  if (typeof input === "string") arr = [input];
  else if (Array.isArray(input)) arr = input;
  else if (input && typeof input === "object") {
    if (Array.isArray(input.quotes)) arr = input.quotes;
    else if (typeof input.text === "string") arr = [input.text];
    else if (typeof input.quote === "string") arr = [input.quote];
    else arr = [];
  } else arr = [];
  return arr.map(asString).filter((s) => s.trim().length > 0);
}

// Resolve one quote to an exact span of artifactText. Tries the raw quote first,
// then a trimmed variant (models often pad with whitespace/quotation marks).
// Returns {artifact_id, start, end, quote} whose quote === artifactText.slice
// (start, end), or null if it does not occur. Never fabricates offsets.
export function resolveSpan(artifactText, quote, artifactId) {
  const text = asString(artifactText);
  const raw = asString(quote);
  if (!text || !raw) return null;
  const candidates = [];
  candidates.push(raw);
  const trimmed = raw.trim();
  if (trimmed !== raw && trimmed.length > 0) candidates.push(trimmed);
  // Strip a single layer of wrapping quotation marks if present.
  const unquoted = trimmed.replace(/^["“”'']+/, "").replace(/["“”'']+$/, "").trim();
  if (unquoted && unquoted !== trimmed) candidates.push(unquoted);
  for (const cand of candidates) {
    const start = text.indexOf(cand);
    if (start !== -1) {
      const end = start + cand.length;
      return { artifact_id: artifactId, start, end, quote: text.slice(start, end) };
    }
  }
  return null;
}

// Resolve every quote in a list. All-or-nothing: if any quote fails to resolve,
// return null so the caller drops the whole check (silence, not degradation).
export function resolveSpans(artifactText, quotes, artifactId) {
  const spans = [];
  for (const q of quotes) {
    const span = resolveSpan(artifactText, q, artifactId);
    if (!span) return null;
    spans.push(span);
  }
  return spans;
}

// ---------------------------------------------------------------------------
// Assembly — one finding → {detector_event, check} or null.
// ---------------------------------------------------------------------------

function detectorShortName(detectorId) {
  return String(detectorId).replace(/^vg\./, "");
}

// Build a comparative DetectorEvent + finding_derived Check from a single
// inspector finding, or return null if the finding does not qualify. Every
// null return is deliberate silence per the schema's failure-is-silence rule.
export function assembleComparativeCheck({ artifactId, artifactText, finding, index = 0 }) {
  const map = FINDING_TYPE_TO_DETECTOR[finding && finding.type];
  if (!map) return null; // not a comparative family → later lane, no check here

  const block = finding && finding.check;
  if (!block || typeof block !== "object") return null; // no check block → silence

  const propQuotes = normalizeQuotes(block.supporting_proposition);
  const depQuotes = normalizeQuotes(block.dependent_output);
  // finding_derived ALWAYS requires dependent_output (both-ends rule); a
  // proposition to rest on is equally required.
  if (propQuotes.length === 0 || depQuotes.length === 0) return null;

  const propSpans = resolveSpans(artifactText, propQuotes, artifactId);
  const depSpans = resolveSpans(artifactText, depQuotes, artifactId);
  if (!propSpans || !depSpans) return null; // an end could not be quoted → silence

  const dependency = asString(block.dependency_statement).trim();
  const question = asString(block.verification_question).trim();
  if (!dependency || !question) return null;
  // Pointer-register gate: a world-claim verdict in either the dependency
  // statement or the verification question drops the whole check.
  if (hasWorldClaimVerdict(dependency) || hasWorldClaimVerdict(question)) return null;

  // Resolver and propagation are render/rank affordances, not the demonstrable
  // core; an out-of-enum value defaults rather than suppressing a fully-quoted
  // check (direct_question always supports a copyable question; isolated_detail
  // is the lowest-propagation, most conservative default).
  const resolver = RESOLVERS.has(block.resolver) ? block.resolver : "direct_question";
  const propagation = PROPAGATIONS.has(block.propagation) ? block.propagation : "isolated_detail";

  const short = detectorShortName(map.detector_id);
  const evId = `de_${short}_${propSpans[0].start}_${depSpans[0].start}`;
  const chkId = `chk_${short}_${propSpans[0].start}_${depSpans[0].start}`;

  const detector_event = {
    id: evId,
    family: "comparative",
    detector_id: map.detector_id,
    detector_version: COMPARATIVE_DETECTOR_VERSION,
    evidence_spans: [...propSpans, ...depSpans],
    // NO verification block — comparative provenance rides the parent
    // Inspection's inspector fields. Attaching one fails validation (AT-13).
  };

  const proposition_at_issue = { text: propQuotes.join(" … "), spans: propSpans };
  const dependent_output = { text: depQuotes.join(" … "), spans: depSpans };

  const check = {
    id: chkId,
    detector_event_id: evId,
    subclass: "finding_derived",
    proposition_at_issue,
    dependent_output,
    demonstration: {
      finding_type: map.finding_type,
      // Span refs are indices into the Check's own span arrays — they resolve
      // only to spans already present in proposition_at_issue / dependent_output.
      proposition_span_refs: propSpans.map((_, i) => i),
      dependent_output_span_refs: depSpans.map((_, i) => i),
      dependency_statement: dependency,
    },
    verification_action: { question, resolver },
    status: "open",
    ranking: {
      demonstrability: "comparative",
      propagation,
      independent_conflict_count: 0,
    },
  };

  return { detector_event, check };
}

// ---------------------------------------------------------------------------
// Register assembly.
// ---------------------------------------------------------------------------

export function eventById(events, id) {
  return (events || []).find((e) => e && e.id === id) || null;
}

export function eventOf(register, check) {
  if (!register || !check) return null;
  return eventById(register.detector_events, check.detector_event_id);
}

// Earliest span offset across a check's evidence, via its detector event. Used
// as the stable ranking tiebreak (AT-9).
function earliestSpanOffset(check, events) {
  const ev = eventById(events, check.detector_event_id);
  const spans = (ev && ev.evidence_spans) || [];
  let min = Infinity;
  for (const s of spans) if (typeof s.start === "number" && s.start < min) min = s.start;
  return min === Infinity ? Number.MAX_SAFE_INTEGER : min;
}

// Deterministic total order: demonstrability asc, propagation asc, conflict
// count DESC (more independent conflicts rank higher), earliest span offset asc,
// then id asc as a final total-order guarantee. Pure comparator — does not lean
// on Array.sort stability (AT-9: fixed inputs → identical top-3).
export function rankChecks(checks, events) {
  const keyed = (checks || []).map((c) => ({
    c,
    demo: DEMONSTRABILITY_RANK[c.ranking && c.ranking.demonstrability] ?? 99,
    prop: PROPAGATION_RANK[c.ranking && c.ranking.propagation] ?? 99,
    count: (c.ranking && c.ranking.independent_conflict_count) || 0,
    offset: earliestSpanOffset(c, events),
    id: c.id || "",
  }));
  keyed.sort((a, b) => {
    if (a.demo !== b.demo) return a.demo - b.demo;
    if (a.prop !== b.prop) return a.prop - b.prop;
    if (a.count !== b.count) return b.count - a.count; // higher count first
    if (a.offset !== b.offset) return a.offset - b.offset;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
  return keyed.map((k) => k.c);
}

// Denormalized render view for one card. Carries family + detector_id +
// provisional so a card screenshotted in isolation still shows its provenance
// (AT-6).
export function buildCard(check, event) {
  const findingType = check.demonstration && check.demonstration.finding_type;
  const resolver = check.verification_action && check.verification_action.resolver;
  return {
    id: check.id,
    // Provenance — always rendered, survives isolation (AT-6).
    family: event ? event.family : null,
    detector_id: event ? event.detector_id : null,
    detector_version: event ? event.detector_version : null,
    provisional: true,
    provisional_label: CHECK_UI.provisional_label,
    finding_type: findingType,
    finding_label: CHECK_UI.finding_labels[findingType] || findingType,
    proposition: check.proposition_at_issue,
    dependent_output: check.dependent_output,
    dependency_statement: check.demonstration && check.demonstration.dependency_statement,
    evidence_spans: event ? event.evidence_spans : [],
    verification_question: check.verification_action && check.verification_action.question,
    resolver,
    resolver_label: CHECK_UI.resolver_labels[resolver] || resolver,
    status: check.status,
    ranking: check.ranking,
    labels: CHECK_UI.labels,
  };
}

// Build the whole Check Register for one inspection: assemble every qualifying
// finding, validate it (defense in depth — an invalid object is dropped, not
// rendered), rank, and denormalize into render cards. status is the constant
// "provisional"; Reader output is never instrument-grade.
export function buildCheckRegister({
  artifactId,
  artifactText,
  findings,
  inspector = null,
  topN = DEFAULT_TOP_N,
}) {
  const detector_events = [];
  const checks = [];
  const seen = new Set();

  (findings || []).forEach((finding, index) => {
    const built = assembleComparativeCheck({ artifactId, artifactText, finding, index });
    if (!built) return;
    if (seen.has(built.check.id)) return; // identical span-derived id → dedup
    const evV = validateDetectorEvent(built.detector_event);
    const ckV = validateCheck(built.check, built.detector_event, artifactText);
    if (!evV.ok || !ckV.ok) return; // silence on any invalid object
    seen.add(built.check.id);
    detector_events.push(built.detector_event);
    checks.push(built.check);
  });

  const ranked = rankChecks(checks, detector_events);
  const cards = ranked.map((chk) => buildCard(chk, eventById(detector_events, chk.detector_event_id)));

  return {
    status: "provisional",
    mode: "single",
    inspector,
    detector_events,
    checks: ranked,
    cards,
    top: cards.slice(0, topN),
    default_top_n: topN,
    ui: CHECK_UI,
    version: CHECK_MODEL_VERSION,
  };
}

// ---------------------------------------------------------------------------
// Validators. Return {ok:boolean, reason?:string}. Tests assert both the
// positive path and each rejection reason.
// ---------------------------------------------------------------------------

function spanResolves(span, artifactText) {
  if (!span || typeof span.start !== "number" || typeof span.end !== "number") return false;
  if (span.end <= span.start) return false;
  return asString(artifactText).slice(span.start, span.end) === span.quote;
}

export function validateDetectorEvent(event) {
  if (!event || typeof event !== "object") return { ok: false, reason: "detector_event missing" };
  if (!FAMILIES.has(event.family)) return { ok: false, reason: `bad family: ${event.family}` };
  if (!event.detector_id || !event.detector_version)
    return { ok: false, reason: "detector_id/detector_version required" };
  if (!Array.isArray(event.evidence_spans) || event.evidence_spans.length === 0)
    return { ok: false, reason: "evidence_spans required" };

  if (event.family === "comparative") {
    // AT-13: a comparative event MUST NOT carry a verification block.
    if (event.verification != null)
      return { ok: false, reason: "comparative event must not carry a verification block" };
  } else if (event.family === "local_integrity") {
    // Design conformance (not built this lane): mechanical detectors must be
    // verified; contradiction must be model-nominated.
    const v = event.verification;
    if (!v || typeof v !== "object")
      return { ok: false, reason: "local_integrity requires a verification block" };
    if (event.detector_id === "li.contradiction") {
      if (v.mode !== "model_nominated" || v.status !== "nominated")
        return { ok: false, reason: "li.contradiction requires model_nominated/nominated" };
    } else {
      if (v.mode !== "mechanical" || v.status !== "verified")
        return { ok: false, reason: "mechanical local_integrity requires mechanical/verified" };
    }
  } else if (event.family === "profile") {
    // Design conformance: profile verification required, mechanical/verified,
    // with evaluator id + version. Family stays independently binding (AT-13).
    const v = event.verification;
    if (!v || v.mode !== "mechanical" || v.status !== "verified")
      return { ok: false, reason: "profile requires mechanical/verified verification" };
    if (!v.verifier_id || !v.verifier_version)
      return { ok: false, reason: "profile verification requires verifier_id/verifier_version" };
  }
  return { ok: true };
}

export function validateCheck(check, event, artifactText) {
  if (!check || typeof check !== "object") return { ok: false, reason: "check missing" };
  // AT-1: no check without a resolving detector_event_id.
  if (!check.detector_event_id) return { ok: false, reason: "detector_event_id required (AT-1)" };
  if (!event || event.id !== check.detector_event_id)
    return { ok: false, reason: "detector_event_id does not resolve (AT-1)" };
  if (!SUBCLASSES.has(check.subclass)) return { ok: false, reason: `bad subclass: ${check.subclass}` };

  // AT-2: proposition spans always resolve to exact substrings.
  const prop = check.proposition_at_issue;
  if (!prop || !Array.isArray(prop.spans) || prop.spans.length === 0)
    return { ok: false, reason: "proposition_at_issue.spans required" };
  for (const s of prop.spans)
    if (!spanResolves(s, artifactText)) return { ok: false, reason: "proposition span does not resolve (AT-2)" };

  // dependent_output binding rule (AT-2). finding_derived ALWAYS requires it;
  // otherwise required for high-propagation, optional for isolated_detail.
  const dep = check.dependent_output;
  const propagation = check.ranking && check.ranking.propagation;
  const depRequired =
    check.subclass === "finding_derived" ||
    propagation === "final_conclusion" ||
    propagation === "recommendation_or_action" ||
    propagation === "calculation";
  if (dep) {
    if (!Array.isArray(dep.spans) || dep.spans.length === 0)
      return { ok: false, reason: "dependent_output present but has no spans" };
    for (const s of dep.spans)
      if (!spanResolves(s, artifactText)) return { ok: false, reason: "dependent_output span does not resolve (AT-2)" };
  } else if (depRequired) {
    return { ok: false, reason: "dependent_output required for this subclass/propagation (AT-2)" };
  }

  // AT-3: demonstration per subclass.
  const demoV = validateDemonstration(check, event);
  if (!demoV.ok) return demoV;

  // verification_action.
  const va = check.verification_action;
  if (!va || !asString(va.question).trim()) return { ok: false, reason: "verification_action.question required" };
  if (!RESOLVERS.has(va.resolver)) return { ok: false, reason: `bad resolver: ${va.resolver}` };

  if (!STATUSES.has(check.status)) return { ok: false, reason: `bad status: ${check.status}` };

  const r = check.ranking;
  if (!r || !DEMONSTRABILITIES.has(r.demonstrability))
    return { ok: false, reason: "ranking.demonstrability required" };
  if (!PROPAGATIONS.has(r.propagation)) return { ok: false, reason: "ranking.propagation required" };
  if (typeof r.independent_conflict_count !== "number")
    return { ok: false, reason: "ranking.independent_conflict_count required" };

  return { ok: true };
}

export function validateDemonstration(check, event) {
  const d = check.demonstration;
  if (!d || typeof d !== "object") return { ok: false, reason: "demonstration required (AT-3)" };

  if (check.subclass === "finding_derived") {
    if (event.family !== "comparative")
      return { ok: false, reason: "finding_derived requires a comparative event (AT-3)" };
    // finding_type must agree with detector_id.
    const expected = FINDING_TYPE_TO_DETECTOR[d.finding_type];
    if (!expected || expected.detector_id !== event.detector_id)
      return { ok: false, reason: "finding_type does not match detector_id (AT-3)" };
    // Both span-ref sets non-empty and resolving to the Check's own spans.
    const pRefs = d.proposition_span_refs;
    const oRefs = d.dependent_output_span_refs;
    if (!Array.isArray(pRefs) || pRefs.length === 0 || !Array.isArray(oRefs) || oRefs.length === 0)
      return { ok: false, reason: "span-ref sets must be non-empty (AT-3)" };
    const propSpans = (check.proposition_at_issue && check.proposition_at_issue.spans) || [];
    const depSpans = (check.dependent_output && check.dependent_output.spans) || [];
    for (const r of pRefs)
      if (!Number.isInteger(r) || r < 0 || r >= propSpans.length)
        return { ok: false, reason: "proposition_span_ref out of range (AT-3)" };
    for (const r of oRefs)
      if (!Number.isInteger(r) || r < 0 || r >= depSpans.length)
        return { ok: false, reason: "dependent_output_span_ref out of range (AT-3)" };
    if (!asString(d.dependency_statement).trim())
      return { ok: false, reason: "dependency_statement required (AT-3)" };
    // Pointer register: the dependency statement must not rule a world-claim.
    if (hasWorldClaimVerdict(d.dependency_statement))
      return { ok: false, reason: "dependency_statement asserts a world-claim verdict (AT-3)" };
    return { ok: true };
  }

  if (check.subclass === "local_integrity") {
    // Design conformance: per-detector required fields.
    if (event.family !== "local_integrity")
      return { ok: false, reason: "local_integrity subclass requires a local_integrity event" };
    return { ok: true };
  }

  if (check.subclass === "profile_derived") {
    // Design conformance: criterion demonstration; criterion_id matches the
    // detector_id's criterion segment.
    if (event.family !== "profile")
      return { ok: false, reason: "profile_derived subclass requires a profile event" };
    if (!d.criterion_id) return { ok: false, reason: "profile_derived requires criterion_id" };
    const segment = String(event.detector_id).split(".").pop();
    if (d.criterion_id !== segment)
      return { ok: false, reason: "criterion_id must match detector_id criterion segment" };
    return { ok: true };
  }

  return { ok: false, reason: `unknown subclass: ${check.subclass}` };
}

// ---------------------------------------------------------------------------
// Family-separated queries (AT-4 / AT-13 design conformance). Even though only
// the comparative family is built this lane, these keep the families and
// verification modes from ever being conflated in query results.
// ---------------------------------------------------------------------------

function checksByFamily(register, family) {
  return (register.checks || []).filter((c) => {
    const ev = eventOf(register, c);
    return ev && ev.family === family;
  });
}

export function comparativeChecks(register) {
  return checksByFamily(register, "comparative");
}

export function localIntegrityChecks(register) {
  return checksByFamily(register, "local_integrity");
}

export function profileChecks(register) {
  return checksByFamily(register, "profile");
}

// AT-4: "measurement findings" are the comparative findings; this query never
// returns local_integrity or profile checks.
export function measurementFindings(register) {
  return comparativeChecks(register);
}

// AT-13: mechanically verified local-integrity checks — excludes contradiction
// (model-nominated) and never includes profile verification.
export function mechanicallyVerifiedChecks(register) {
  return (register.checks || []).filter((c) => {
    const ev = eventOf(register, c);
    if (!ev || ev.family !== "local_integrity") return false;
    if (ev.detector_id === "li.contradiction") return false;
    return ev.verification && ev.verification.mode === "mechanical" && ev.verification.status === "verified";
  });
}

// AT-13: model-nominated local-integrity checks — never surfaced as verified.
export function modelNominatedChecks(register) {
  return (register.checks || []).filter((c) => {
    const ev = eventOf(register, c);
    if (!ev || ev.family !== "local_integrity") return false;
    return ev.verification && ev.verification.mode === "model_nominated";
  });
}

// AT-13: profile verification stays profile-derived, never conflated with
// local-integrity verification.
export function profileVerifiedChecks(register) {
  return (register.checks || []).filter((c) => {
    const ev = eventOf(register, c);
    if (!ev || ev.family !== "profile") return false;
    return ev.verification && ev.verification.mode === "mechanical" && ev.verification.status === "verified";
  });
}
