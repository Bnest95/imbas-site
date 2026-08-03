REVIEW GRAPH — SCHEMA v0.3.3 (FROZEN)
Status: FROZEN. v0.3.3 issued 2026-08-02 as a DELIBERATE VERSIONED CHANGE
(not an erratum): PairRun's singular `declaration` becomes `declarations`, an
ordered array, because a pair collects declarations at more than one moment.
One replaced field —
- declarations: an ordered array of decl.2 declaration artifacts, oldest first.
  Present on EVERY PairRun; an empty array states that the record holds none.
  Declarations are APPEND-ONLY and one row equals one declaration event. The
  product surface discloses these questions progressively rather than
  front-loading provenance intake, so the same pair can be declared about at
  submission, at inspection, at review, and on a returning visit — and a
  correction is a DIFFERENT FACT from the original, not a better version of it.
  Earlier declarations are never updated, never overwritten, and never deleted.
  A correction points BACKWARD through `supersedes` at the declaration it
  replaces. No forward `superseded_by` pointer is ever written onto the earlier
  declaration, because writing one would mutate a record that already stands.
  Current state is DERIVED from the history every time it is needed and is
  never a second stored value. Where the log branches — two people correcting
  the same declaration, or two originals nobody reconciled — there is no single
  current declaration, and the branch conflict is preserved and surfaced rather
  than resolved by picking the newest. Naming a winner would report a history
  nobody recorded.
  Event sequence is governed by SERVER receipt order, tie-broken deterministically
  by declaration_id. Client timestamps remain declared evidence — what the person
  says about when they declared — and never order the log, because a clock the
  record cannot check cannot be allowed to reorder it.
  Receipts and shares are IMMUTABLE DATED RECORDS and are not updated when a later
  declaration arrives. Each states the declarations that existed when it was made.
  A share stores declaration IDENTITIES fixed at mint, never a snapshot of their
  content and never a pointer to "the latest": projecting a later declaration back
  onto an earlier share would claim the person had made it at an earlier time.
  Reading forward through the log from those identities finds any later correction;
  the earlier record stays as issued. So does an exported Review Record — it is a
  dated export of a history, not a live view of one.
  Storage lives outside this schema, in the Reader Run Declarations table, owned
  by the paired Inspection through the value-based join (Open Run ID, Targeted
  Answer Hash). No declaration state is stored on the paired-analysis row: two
  stores would be two answers to "what did this person say", and the analysis row
  would be the one that looked authoritative while holding a snapshot.
  decl.2 is the current declaration version. decl.1 is LEGACY: it is readable
  through a named compatibility adapter and is never written.
  Each declaration artifact carries:
  {declaration_version, declaration_id, declaration_source, status, status_label,
  stage, actor, same_model, model_version, edits, declared_at_client,
  received_at_server, supersedes}. status is one of two stable machine tokens:
  DECLARED_NOT_VERIFIED or NOT_DECLARED. status_label is the display copy for
  that token, carried inside the artifact so import-free render surfaces
  (reader-receipt.js, inspection.js) cannot invent their own wording.
  declaration_source is pair_capture_client_declaration — the vocabulary
  reader-result.js already defined for this input, which classifies the
  artifact as REPORTED_CLIENT_DECLARATION and therefore bars it from the
  matched-conditions register.
  The declaration is evidence of what the person REPORTED. It is not evidence
  that the conditions matched. It does not replace `capture`, which stays and
  stays derived: capture.conditions_matched is a CONCLUSION drawn from the
  answers, and capture flattens distinct reports (a "no", a "not sure", and a
  question never answered all reach the same boolean). declaration is the
  disclosure itself, lossless, and carries no conclusion. The two live in
  separate objects on the PairRun for exactly that reason and no validator
  makes them agree — a rule forcing agreement would be deriving a conclusion
  from a disclosure.
  Absence is stated, never inferred. No declaration → status NOT_DECLARED,
  which is NOT a negative declaration and NEVER renders as "unmatched". A
  partial declaration preserves the fields supplied and marks the rest
  undeclared field by field. If the form captured no client-side declaration
  time, declared_at_client is NOT_CAPTURED — never backfilled from
  received_at_server. A stage the surface did not record is
  STAGE_NOT_RECORDED and an actor it did not identify is ACTOR_NOT_IDENTIFIED;
  neither may be backfilled from the request location, the route, the receipt
  type, a server assumption, or a session identity that was never captured as
  the declaring actor. A declaration that corrects nothing carries
  NO_SUPERSESSION.
  Distinct from the cfp.1 family (inspector_run_conditions,
  condition_fingerprint), which covers the INSPECTOR call's sampling
  parameters, model version, and prompt version. Different subject, different
  names, never merged on a surface that renders both.
v0.3.2 (2026-08-02) added the singular PairRun `declaration`, superseded within
the day by the v0.3.3 array above. Records exported under v0.3.2 remain valid
under their own declared versions.schema.
v0.3.1 (2026-07-21) added PairRun run provenance so a Review Record is
self-contained about how each pair was created. Four additive fields —
- initiator: inspection_followup | user_chip | legacy_unknown. The shipped
  inspection follow-up write stamps inspection_followup; the user-chip lane
  (schema-defined here, wired in a later lane) stamps user_chip; anything not
  attributable is legacy_unknown. Provenance is NEVER inferred for
  convenience — an absent or unknown initiator normalizes to legacy_unknown,
  never to inspection_followup.
- chip_id: the bank sq.* id of the selected instruction. Present (required)
  IFF initiator=user_chip; OMITTED otherwise.
- instruction_version: the immutable bank-entry version of that instruction.
  Present (required) IFF initiator=user_chip; OMITTED otherwise.
- targeted_prompt_hash: the lowercase-hex SHA-256 of the verbatim
  targeted_prompt. Present on EVERY PairRun and therefore carried in the
  ReviewRecord export (contents.pair_runs), so the digest binds the exact
  probe text without re-fetching it. Two initiator semantics for the SAME
  field: for inspection_followup it hashes the Reader-generated non-leading
  probe (the server already computes this on the receipt; it is threaded
  through, never recomputed); for user_chip it hashes the chip's instruction
  text carried as the targeted_prompt.
null vs omitted (decided against live c14n.v1): the chip fields, and any
gap-estimate or signal-pattern field, are OMITTED (structurally absent) when
they do not apply — NEVER serialized as null. Rationale: v0.3.0 already makes
structural absence the semantic (paired mode is a populated pair_runs array,
no mode field); under c14n.v1 an explicit null enters the hashed body and
falsely implies an empty-but-present slot, whereas absence keeps the
inspection-path bytes reproducible and states "not applicable" truthfully.
Binding: a chip selection may not, by itself, create a finding, behavior
classification, DetectorEvent, or any evidence-record (ResolutionEvidence)
entry — user_chip PairRuns therefore carry no gap estimate and no
signal-pattern classification (the Option B ceiling).
Records exported under v0.2.x, v0.3.0, v0.3.1 and v0.3.2 remain valid under
their own declared versions.schema; no retroactive migration or
reinterpretation. A record is a dated statement of what was known when it was
minted, and a later declaration is never projected backward onto it — doing so
would claim the person had made the later declaration at an earlier time.
Chain: v0.3.3 ← v0.3.2 (PairRun declaration, singular) ←
v0.3.1 (PairRun run provenance) ←
v0.3.0 (deflection rename; paired-mode marker convention) ←
v0.2.3 (AT-14 timestamp rule + c14n pinning) ← v0.2.2 (demonstration shapes)
← v0.2.1 (verification optional, per-family rules) ← v0.2 (four freeze-pass
corrections) ← v0.1 (PROPOSED).
Home: imbas-site, committed by the first R3 lane. Product object model — not
instrument doctrine; creates no instrument-repo file.
Governance base of record: imbas-instrument master
7c625c8c1c59200957698cdb382cd7b94dd9caba (D-033/D-034/D-035 §8 RECORDED
2026-07-17, all decisions PROPOSED; recording adopts nothing).
Sequencing preserved: finding-derived ships first; local-integrity detectors
ship only behind their negative suite and are the first cut under time
pressure; contradiction carries its own independent ship gate; the
deterministic Inspection Profile remains conditional.

== 1. OBJECTS ==

Inspection
- id, created_at
- inspector: {model, model_version, prompt_version}
- mode: single | paired
- input_artifact_id, supplied_material_ids[]
- status: "provisional"   // constant; Reader output is never instrument-grade

Artifact   // answers and supplied materials share this
- id, role: original_answer | targeted_answer | supplied_source
- body   // verbatim as pasted
- source_model_user_reported: {name?, version?}, verified: false   // always false in Reader
- supplied_at

PairRun   // run-the-pair; mode = paired
- targeted_prompt   // Reader-generated, non-leading, v1.1 style
- original_artifact_id, targeted_artifact_id
- capture: {same_model_claimed: bool, model_version_user_reported?,
            user_edits_disclosed: bool, conditions_matched: true|false|unverified}
  // DERIVED. conditions_matched is a conclusion drawn from the answers, and the
  // booleans flatten distinct reports onto one value. Never treat it as the
  // person's words; `declaration` below holds those.
- declarations   // v0.3.3 (replaces the v0.3.2 singular `declaration`); what the
  // person REPORTED about how the pair was run, preserved as reported, as an
  // ORDERED ARRAY oldest first. Present on EVERY PairRun (never omitted — an
  // empty array states that the record holds no declaration, because "they did
  // not say" is itself the record). Append-only: one element per declaration
  // EVENT, earlier elements never rewritten. Ordering is by server receipt time,
  // tie-broken by declaration_id; array position alone is not the history.
  // Each element:
  //   declaration_version   // decl.2 (decl.1 is legacy, read-only)
  //   declaration_id        // stable identity, chosen before the record exists
  //                         // so a client retry re-uses it instead of appending
  //                         // a second event
  //   declaration_source    // pair_capture_client_declaration
  //   status                // DECLARED_NOT_VERIFIED | NOT_DECLARED
  //   status_label          // display copy for status, carried in-artifact so
  //                         // import-free renderers cannot reword it
  //   stage                 // submission | inspection | review | returning_visit,
  //                         // or STAGE_NOT_RECORDED. Supplied by the surface that
  //                         // asked; NEVER inferred from route or request shape
  //   actor                 // who declared, or ACTOR_NOT_IDENTIFIED. NEVER
  //                         // inferred from session identity
  //   same_model, model_version, edits   // the declared values, or NOT_DECLARED
  //                         // field by field when a partial declaration arrives
  //   declared_at_client    // ISO instant, or NOT_CAPTURED if the form captured
  //                         // none — NEVER backfilled from received_at_server
  //   received_at_server    // ISO instant the server received the declaration
  //   supersedes            // declaration_id this one corrects, or NO_SUPERSESSION.
  //                         // Backward only; both declarations must belong to the
  //                         // same paired Inspection. No self-reference, no cycle
  // The declaration is evidence of what was reported, NOT evidence that the
  // conditions matched. It never appears in the same field, object, or rendered
  // element as capture.conditions_matched in a way that could read as one, and
  // no validator makes the two agree — including no validator that makes a
  // declaration agree with the derived conditions, in either direction.
- initiator: inspection_followup | user_chip | legacy_unknown   // v0.3.1;
  // how this pair was created. inspection_followup = the shipped follow-up
  // write; user_chip = a bank instruction the reader selected; legacy_unknown
  // = not attributable. Normalized on build: an absent/unknown value falls to
  // legacy_unknown and is NEVER promoted to inspection_followup (provenance is
  // not inferred for convenience).
- targeted_prompt_hash   // v0.3.1; lowercase-hex SHA-256 of the verbatim
  // targeted_prompt. Present on EVERY PairRun, so the exported record binds the
  // exact probe text (self-contained). inspection_followup: the hash the
  // receipt already carries (threaded, not recomputed). user_chip: the hash of
  // the chip's instruction text carried as the targeted_prompt.
- chip_id?              // v0.3.1; bank sq.* id. Required IFF initiator=user_chip;
  // OMITTED otherwise (structurally absent, never null).
- instruction_version? // v0.3.1; immutable bank-entry version of that
  // instruction. Required IFF initiator=user_chip; OMITTED otherwise.
- rule: conditions_matched != true → unmatched-conditions warning renders
  on every surface derived from this run
- rule (v0.3.1): a user_chip PairRun carries no gap estimate and no
  signal-pattern classification, and by itself creates no finding, behavior
  classification, DetectorEvent, or ResolutionEvidence entry. Gap-estimate and
  signal-pattern fields are OMITTED, never null, when they do not apply.

DetectorEvent   // the gate: no Check exists without one
- id, family: comparative | local_integrity | profile
- detector_id + detector_version
  // named + versioned: vg.omission / vg.framing_drift / vg.deflection
  // (vg.deflection renamed from vg.active_foreclosure in v0.3.0 per the
  // founder naming ruling; the item-6 adjudication is resolved),
  // li.contradiction.v1 / li.arith.v1 / li.temporal.v1 / li.quote.v1,
  // prof.<profile_id>.<criterion_id>
- evidence_spans[]: {artifact_id, start, end, quote}   // verbatim, offsets must resolve
- verification?:
    mode: mechanical | model_nominated
    status: verified | nominated
    verifier_id?
    verifier_version?
  // binding family rules:
  // - comparative: verification MUST be absent. Inspector provenance
  //   (model, model_version, prompt_version) is carried through the parent
  //   Inspection and finding provenance. A comparative event FAILS
  //   VALIDATION if a verification block is attached.
  // - local_integrity:
  //   - li.arith / li.temporal / li.quote require mode=mechanical and
  //     status=verified; a Check may emit only at status=verified;
  //   - li.contradiction requires mode=model_nominated and status=nominated;
  //     its cards visibly state "model-nominated" and are never stored,
  //     rendered, exported, or queried as mechanically verified; the
  //     negative suite is mandatory but does not convert nomination into
  //     verification.
  // - profile: verification is REQUIRED when a profile criterion evaluator
  //   runs — mode=mechanical, status=verified, with verifier_id and
  //   verifier_version set to the criterion evaluator id and version.
  //   Profile verification remains profile-derived and is never queried or
  //   rendered as local-integrity verification; family remains
  //   independently binding.

Check   // the R3 card
- id, detector_event_id   // REQUIRED
- subclass: finding_derived | local_integrity | profile_derived
- proposition_at_issue: {text, spans[]}   // must quote the artifact
- dependent_output?: {text, spans[]}
  // binding rule:
  // - required when ranking.propagation is final_conclusion,
  //   recommendation_or_action, or calculation
  // - optional and normally absent when propagation is isolated_detail;
  //   absence must not suppress an otherwise demonstrable check
  // - when present, spans must resolve exactly
  // - subclass interaction: finding_derived ALWAYS requires dependent_output
  //   (the both-ends-quotable rule) — no demonstrable dependency, no check;
  //   the conditional rule above governs local_integrity and profile_derived
- demonstration: per-family structured block
  // For subclass=finding_derived, DetectorEvent.family=comparative:
  //   finding_type: omission | framing_drift | deflection
  //   proposition_span_refs[]      // resolve only to spans already present
  //                                // in proposition_at_issue
  //   dependent_output_span_refs[] // resolve only to spans already present
  //                                // in dependent_output
  //   dependency_statement: string // answer-internal only: how the quoted
  //                                // dependent output rests on the quoted
  //                                // proposition; must not assert either
  //                                // world-claim true, false, correct, or
  //                                // incorrect
  //   Binding: finding_type must agree with detector_id
  //   (vg.omission → omission; vg.framing_drift → framing_drift;
  //   vg.deflection → deflection); no comparative check
  //   emits unless both referenced span sets are non-empty and valid
  //   (satisfiable for every finding_derived check, which always carries
  //   dependent_output under the both-ends rule); this demonstration is
  //   inspector-derived and provisional — it is not mechanical verification.
  // For subclass=local_integrity, per detector:
  //   contradiction: both spans; arithmetic: stated numbers + operation +
  //   recompute; temporal: dates side by side + the impossible ordering;
  //   quotation: quoted text + normalized search result.
  // For subclass=profile_derived, DetectorEvent.family=profile:
  //   criterion_id                 // must equal the criterion segment of
  //                                // detector_id
  //   criterion_type: field_present | string_present | value_stated
  //   target                       // the profile-supplied expectation,
  //                                // restated verbatim
  //   observed: present | absent | value_mismatch
  //   evidence_spans[]             // exact spans when observed is present or
  //                                // value_mismatch; empty permitted only
  //                                // when observed=absent — the
  //                                // demonstration of an absence is the
  //                                // verbatim target plus the evaluator's
  //                                // verified search (verification block
  //                                // carries evaluator id/version)
- verification_action: {question (copyable, non-leading),
                        resolver: authority | document | calculation | direct_question}
- status: open | resolved | dismissed
- resolution?: {at, evidence_ids[], note, dismissal_reason?}
- ranking: {demonstrability: mechanical_verified | model_nominated | comparative,
            propagation: final_conclusion | recommendation_or_action |
                         calculation | isolated_detail,
            independent_conflict_count}
  // demonstrability ranks in that order; v0.1's two-value enum could not
  // represent a nominated contradiction after the verification split

ResolutionEvidence
- id, check_id, body, supplied_at, provisional: true

Profile   // deterministic v1
- profile_id, org_supplied: true
- criteria[]: {criterion_id, description,
               type: field_present | string_present | value_stated, target}
- provenance: organization_profile_criterion   // NEVER "anchor"
- evaluation: criterion → DetectorEvent(family=profile) → Check(profile_derived)

ReviewRecord   // the export; "Review Packet"
- id, inspection_ids[], created_at
- contents: artifacts, pair runs, detector events, checks with status +
  demonstrations, resolution evidence, inspector provenance, versions,
  timestamps, method note
- mode representation (v0.3.0, no field): paired mode is expressed SOLELY by a
  populated pair_runs array — bijective with the presence of a targeted_answer
  artifact and validator-enforced (AT-12); single mode serializes pair_runs as
  []. This convention is the designated mode marker; no mode field exists on the
  export.
- self-containment (v0.3.1): each embedded PairRun carries targeted_prompt_hash,
  so the canonical body — and therefore the integrity digest — binds the exact
  probe text of every pair without re-fetching the live probe. initiator (and,
  for user_chip, chip_id + instruction_version) travels in the same PairRun,
  so the record states how each pair was created without any external lookup.
- self-containment (v0.3.3): each embedded PairRun also carries `declarations`,
  so the record states everything the person reported about the run conditions,
  in order, including the corrections — or states that they reported nothing —
  without any external lookup, and carries the display label for each status
  alongside the machine token. The array holds the declarations that existed when
  the record was minted. It is a dated statement and is never updated afterward:
  later declarations appear in later records, never retroactively in this one.
- integrity:
    algorithm: sha256
    canonicalization: review-record.c14n.v1
    digest: string
  // unkeyed integrity, stated as such — never "signature"
- vocabulary: "record of what was examined and resolved" —
  never defensibility / compliance / adequate-care claims

review-record.c14n.v1 (canonicalization contract)
- UTF-8
- fixed object-key ordering (recursive lexicographic)
- array order preserved
- timestamps normalized to RFC 3339 UTC; canonical form is millisecond
  precision, YYYY-MM-DDTHH:mm:ss.sssZ (the JavaScript Date#toISOString
  form); sub-millisecond precision is truncated; equivalent
  representations of the same instant canonicalize identically
- no insignificant whitespace (JSON structural whitespace only;
  whitespace inside string values is significant and preserved)
- normalization applies to timestamps only; every other string value,
  including Artifact.body ("verbatim as pasted"), hashes verbatim — no
  Unicode normalization, no trimming (span offsets depend on it)
- the integrity block itself is excluded from the hashed body

CandidateSubmission   // schema-only; runtime dark
- id, inspection_id, explicit_consent: bool, submitted_at
- admission_status: "none"
- activation_decision_id?: string
- no write path activates until a separate, dated founder decision expressly
  authorizes governed candidate intake and names:
  - the permitted source surface
  - required consent
  - custody destination
  - provenance fields
  - human review boundary
  - retention/deletion rule
- absent activation_decision_id → the write path throws
- the authorizing decision is an instrument-ledger act and must satisfy the
  instrument's telemetry-boundary law; no such decision exists today, and
  this schema does not invent one. D-033 (downstream corpus eligibility) and
  D-034 (financial independence) do NOT authorize intake and are not this gate.

== 2. DETECTOR PIPELINE (binding — kills "deterministic" drift) ==
Extraction may be model-assisted; emission is family-specific:
- mechanical families (li.arith, li.temporal, li.quote): a code verifier must
  run and reach status=verified before any Check emits —
  arithmetic: recompute from stated numbers/units/operation, rounding
  tolerance honored;
  temporal: date parse + ordering check — impossible, not merely unusual;
  quotation: normalized string search per norm.v1 (quote marks, whitespace,
  line breaks, hyphenation, ellipses); fixed output string:
  "The quoted language was not found as quoted in the supplied source."
- li.contradiction: no mechanical verifier exists; model-nominated only,
  both-spans demonstration mandatory, ships only behind the green negative
  suite; if it cannot pass, it drops to v1.1 alone — the other three do not
  wait for it. Nomination never upgrades to mechanical verification.
- comparative (vg.*): emitted from the inspector's findings under its own
  model + prompt_version provenance, carried on the parent Inspection;
  comparative events carry no verification block; their checks carry the
  finding_derived comparative demonstration.
- profile (prof.*): criterion evaluator runs as code; verification block
  carries evaluator id/version; checks carry the profile_derived
  demonstration.
V1 cost shape: R3 rides the existing inspector call; mechanical verification
is code; no second model call.

== 3. ACCEPTANCE TESTS (lane build gates) ==
AT-1  Gating: Check creation without a resolving detector_event_id fails
      validation. No ambient checks.
AT-2  Quotability: proposition spans always resolve to exact substrings.
      dependent_output follows the binding rule — required for
      final_conclusion / recommendation_or_action / calculation propagation
      and for every finding_derived check (no demonstrable dependency → not
      emitted); optional for isolated_detail, and its absence must not
      suppress an otherwise demonstrable check; when present, spans resolve
      exactly. Failure mode is silence, not degradation.
AT-3  Demonstration: the required structured demonstration for the event
      family and Check subclass is enforced. finding_derived comparative:
      finding_type must match detector_id, both span-reference sets must
      resolve to the Check's exact quoted spans, and the dependency
      statement must be present. local_integrity: per-detector required
      fields. profile_derived: criterion demonstration with criterion_id
      matching the detector_id's criterion segment. Missing or inconsistent
      fields → invalid and no Check emitted.
AT-4  Separation: local_integrity and profile_derived stored and rendered
      apart from comparative findings; "measurement findings" queries never
      return them.
AT-5  Vocabulary lint (CI, site repo): banned constructions on all
      user-facing strings — true/false/correct/incorrect/wrong for
      world-claims; safe/unsafe-to-rely; defensible/compliance-proof/
      adequate-review; reliance-verdict forms. Lint list versioned; this is
      the v1 slice of the claims compiler.
AT-6  Provenance rendering: every card shows family + detector_id +
      provisional status; a screenshotted card in isolation still carries them.
AT-7  Provisional invariant: no instrument-grade language anywhere in
      Reader/R3 output; the packet states unkeyed integrity honestly.
AT-8  Intake dark: no CandidateSubmission write path exists in v1; a
      guardrail test pins that any future write path throws absent an
      activation_decision_id referencing a dated founder intake-activation
      decision; the dark default is pinned by test. This gate is the generic
      intake-activation decision — not D-033/D-034 adoption.
AT-9  Ranking determinism: fixed inputs → identical top-3
      (demonstrability, then propagation, then count; stable tiebreak =
      earliest span offset).
AT-10 Negative suite (ship gate, local-integrity only): all four detectors
      silent on the apparent-but-not-actual set — scoped claims, rounding
      within tolerance, legitimate hedging, restatement/paraphrase. Suite
      ships with the feature.
AT-11 norm.v1: quotation-normalization test vectors included and pinned.
AT-12 Pair capture: unmatched or unverified conditions always render the
      warning; source model stored user-reported, verified: false.
AT-13 Mode and family non-conflation: a comparative event cannot carry a
      verification block — attaching one fails validation; mechanically
      verified and model-nominated local-integrity checks cannot be
      conflated in storage, rendering, export, or query results — a
      nominated check never surfaces as verified anywhere; profile
      mechanical verification cannot be conflated with local-integrity
      mechanical verification, because family remains independently binding.
AT-14 Integrity digest: identical logical records produce identical
      digests; timestamp strings representing the same instant produce
      identical digests after RFC 3339 UTC normalization (offset forms
      and fractional-zero forms included); changing the represented
      instant changes the digest; any artifact, span, status, resolution,
      provenance, version, or other canonical-body value mutation changes
      the digest; presentation-only formatting outside the canonical body
      does not; changes confined to the excluded integrity block do not
      alter the digest recomputed from the canonical body. Test vectors
      pinned, including: 2026-07-17T12:00:00Z ≡ 2026-07-17T08:00:00-04:00
      ≡ 2026-07-17T12:00:00.000Z (identical digests);
      2026-07-17T12:00:00Z vs 2026-07-17T12:00:01Z (different digests);
      integrity-block-only mutation (recomputed digest unchanged).
AT-15 Pair provenance (v0.3.1): every PairRun carries initiator ∈
      {inspection_followup, user_chip, legacy_unknown} and a 64-char
      lowercase-hex targeted_prompt_hash over the verbatim targeted_prompt;
      chip_id and instruction_version are present IFF initiator=user_chip and
      absent otherwise (a present chip field under any other initiator fails
      validation). An absent or unknown initiator normalizes to legacy_unknown,
      never to inspection_followup — provenance is not inferred. A chip
      selection alone creates no finding, behavior classification,
      DetectorEvent, or ResolutionEvidence entry. Records exported under an
      earlier versions.schema remain valid unchanged.
AT-16 Declaration history (v0.3.3): every PairRun carries `declarations`, an
      ARRAY (possibly empty — an empty array is the stated absence, and never
      normalizes to an unmatched or negative reading).
      Each element must satisfy all of:
      - declaration_version is a recognized version (decl.2 current, decl.1
        legacy and readable only through the named compatibility adapter);
      - declaration_id is present, well-formed, and UNIQUE within the array;
      - status ∈ {DECLARED_NOT_VERIFIED, NOT_DECLARED} and status_label is the
        display copy for that status;
      - declaration_source, same_model, model_version, edits and
        declared_at_client are each non-empty (stated absence counts as stated:
        NOT_DECLARED / NOT_CAPTURED are values, blanks are not);
      - received_at_server is present, or explicitly absent under NOT_CAPTURED —
        and declared_at_client is NEVER manufactured from it;
      - stage is a defined stage or the explicit STAGE_NOT_RECORDED token, and
        actor is present or carries ACTOR_NOT_IDENTIFIED. Neither is inferred.
      Across the array:
      - every `supersedes` reference resolves to a declaration in the SAME paired
        Inspection (cross-Inspection supersession is invalid);
      - no declaration supersedes itself;
      - the supersession graph contains no cycle, direct or indirect;
      - the canonical ordering is deterministic: server receipt time, tie-broken
        by declaration_id. Client timestamps never order the log;
      - concurrent branches — two declarations superseding the same parent — are
        DETECTABLE and preserved. A validator may not collapse a branch into a
        single current declaration, and no surface may silently name a winner.
      Declaration and derivation remain separate objects with separate
      vocabularies: no validator checks a declaration against
      capture.conditions_matched, in either direction, because a rule making them
      agree would derive a conclusion from a disclosure. Records exported under
      an earlier versions.schema remain valid unchanged.
