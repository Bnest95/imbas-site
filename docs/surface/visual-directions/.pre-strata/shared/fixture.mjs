// Shared record fixture for the Imbas visual-direction lane.
//
// SCRATCH ONLY. Reads the repository at an absolute path and writes nothing to it.
//
// Montana's claim-carrying strings are not copied here. They are imported live from
// reader-public-example.js so byte-equality is a property of the build rather than
// something a person keeps true by hand. Every other record is lane-authored fixture
// and says so on its own surface.
//
// This file is the single owner of: every governed string reference, every connective
// UI string, finding counts and ordering, record metadata, provenance, scope language,
// assignment and artifact text, and Check Register contents. Directions A, B and C
// consume the emitted data file. None of them holds record copy.

export const REPO = "/Users/brendan/Documents/Claude/Projects/imbas-site";

const { PUBLIC_EXAMPLE } = await import(`${REPO}/reader-public-example.js`);
const { FINDING_CLASSES, ANCHOR_STATUS, ARTIFACT_ORIGINAL, ARTIFACT_TARGETED } = await import(
  `${REPO}/reader-result.js`
);
/* The declared checks are imported, not transcribed. A hand-written list of detector
 * ids would be a claim about the instrument that nothing keeps true; this one stops
 * building the moment the repository's own map changes. That is the whole reason the
 * Check Register can be offered as evidence of operation rather than as decoration. */
const { FINDING_TYPE_TO_DETECTOR, COMPARATIVE_DETECTOR_VERSION, CHECK_MODEL_VERSION } = await import(
  `${REPO}/reader-checks.js`
);

/* Two anatomies, because selection closed and the lane now holds a production
 * chassis and an archived pair rather than three candidates.
 *
 * B consumes ANATOMY.md at v2, which carries the reading strata. A and C consume
 * ANATOMY.v1.md, a byte-identical snapshot of the v1 text taken before the v2
 * amendment. Both are files on disk and both are hashed from disk at build time, so
 * "archived" means a document that still exists and can still be checked, not a
 * constant transcribed into a build script. The archive is what makes A and C's
 * renders re-provable; a hash with no document behind it would not.
 *
 * Which document a direction consumes is decided in one place — kit.js `boot()` —
 * and stamped on the document element, so no direction can claim an anatomy it was
 * not built against. */
export const ANATOMY_VERSION = "record-anatomy.v2";
export const ANATOMY_ARCHIVED_VERSION = "record-anatomy.v1";
export const ANATOMY_ARCHIVED_DIRECTIONS = Object.freeze(["a", "c"]);

// ── Anchor modes ─────────────────────────────────────────────────────────────
// These three names are the brief's vocabulary. They do not exist in the
// repository; recorded here so every surface can say so plainly.
export const ANCHOR_MODE = Object.freeze({
  QUOTED_SPAN: "QUOTED_SPAN",
  PASSAGE_CONTEXT: "PASSAGE_CONTEXT",
  RECORD_LEVEL_ABSENCE: "RECORD_LEVEL_ABSENCE",
});

// The one authorized visual channel per mode. A direction picks how the channel
// looks; it may not move a mode to another channel.
export const ANCHOR_CHANNEL = Object.freeze({
  [ANCHOR_MODE.QUOTED_SPAN]: "in-document-span",
  [ANCHOR_MODE.PASSAGE_CONTEXT]: "in-document-region",
  [ANCHOR_MODE.RECORD_LEVEL_ABSENCE]: "out-of-document",
});

// ── Declared checks ──────────────────────────────────────────────────────────
// Z5.6. The checks the current instrument actually carries, joined from the two
// repository maps by their shared key, so the identity, the label and the version
// on the page all come from the instrument rather than from a list beside it.
//
// One family is built: comparative / finding_derived. `local_integrity` and
// `profile` have validators and family-separated queries in reader-checks.js and are
// explicitly not built there, so they are not declared here either. The register
// shows what ran, and a check that does not exist yet did not run.
//
// APPLICATION IS NOT SELECTION. reader-checks.js routes every finding an inspection
// produced through FINDING_TYPE_TO_DETECTOR; there is no step that picks a subset of
// detectors for a given answer. All three are therefore in force over every
// single-surface record, which is what lets the register say a check ran and
// produced nothing rather than leaving it off the page.
export const DECLARED_CHECKS = Object.freeze(
  Object.keys(FINDING_CLASSES).map((key) =>
    Object.freeze({
      key,
      label: FINDING_CLASSES[key],
      detector_id: FINDING_TYPE_TO_DETECTOR[key].detector_id,
      detector_version: COMPARATIVE_DETECTOR_VERSION,
      family: "comparative",
      subclass: "finding_derived",
      /* A condition stated only where the instrument genuinely carries one. The
       * omission clause is the OPEN_SIDE_ANCHOR_ABSENT reason in reader-result.js,
       * whose comment reads "Expected for omission-shaped findings by construction."
       * The other two detectors have no condition of their own beyond the shared
       * one, so they carry none: a per-row condition invented for symmetry would be
       * the exact fabrication this zone exists to avoid. */
      condition:
        key === "omission"
          ? "An omission has no second end to quote, because the wording is not in the answer. It resolves against the record instead of against a span."
          : null,
    }),
  ),
);

export const CHECK_OUTCOME = Object.freeze({
  PRODUCED: "PRODUCED",
  NO_FINDING: "NO_FINDING",
  NOT_APPLICABLE: "NOT_APPLICABLE",
});

export const CHECK_REGISTER_VERSION = CHECK_MODEL_VERSION;

export const RECORD_CLASS = Object.freeze({
  GOVERNED_PUBLIC_EXAMPLE: "GOVERNED_PUBLIC_EXAMPLE",
  USER_SUPPLIED_RUN: "USER_SUPPLIED_RUN",
  PROTOCOL_MEASURED_CASE: "PROTOCOL_MEASURED_CASE",
  ADHERENCE_RECORD: "ADHERENCE_RECORD",
});

export const RECORD_CLASS_LABEL = Object.freeze({
  [RECORD_CLASS.GOVERNED_PUBLIC_EXAMPLE]: "GOVERNED PUBLIC EXAMPLE",
  [RECORD_CLASS.USER_SUPPLIED_RUN]: "USER-SUPPLIED RUN",
  [RECORD_CLASS.PROTOCOL_MEASURED_CASE]: "PROTOCOL-MEASURED CASE",
  [RECORD_CLASS.ADHERENCE_RECORD]: "ADHERENCE RECORD",
});

// Z1.5. Each boundary states what the record documents. None of them names a
// reading in order to refuse it: naming a verdict to disclaim it still puts the
// verdict on the page.
export const BOUNDARIES = Object.freeze({
  [RECORD_CLASS.GOVERNED_PUBLIC_EXAMPLE]:
    "This documents what the cited capture and the named sources show. It establishes neither intent nor every fact you would need to reach a conclusion.",
  [RECORD_CLASS.USER_SUPPLIED_RUN]:
    "This is a Second Look at one answer you supplied. Each mark here is provisional, and each one is a prompt for your own review.",
  [RECORD_CLASS.PROTOCOL_MEASURED_CASE]:
    "This describes behavior observed under the conditions recorded here, and nothing outside them.",
  [RECORD_CLASS.ADHERENCE_RECORD]:
    "This describes one produced artifact against one assignment. Its scope is that pair.",
});

// ── Z2.3, verbatim from the validated prototype ──────────────────────────────
export const FIRST_RUN_LINE =
  "Each mark points at something in this answer, or at something that isn't in it. Imbas records what was there and what wasn't.";

// ── Z4.3 ─────────────────────────────────────────────────────────────────────
export const RECORD_LEVEL_RULE = "Not anywhere in this answer.";

// ─────────────────────────────────────────────────────────────────────────────
// CONNECTIVE UI COPY — Z-addressed, written once, linted wholesale.
// No direction adds, shortens or restates any of it.
// ─────────────────────────────────────────────────────────────────────────────

export const UI = Object.freeze({
  /* First contact. Three facts a person can read without knowing anything about
   * Imbas: when this was read, what was read, and what it was read against. The
   * durable identifiers are the same record's identifiers and they keep every
   * character, but they answer a question nobody asks first, so they sit in the
   * provenance block at z6 where a citing reader goes looking for them. */
  z1: Object.freeze({
    address_read: "Read",
    address_inspected: "Inspected",
    address_condition: "Condition",
    boundary_label: "What this record covers",
    fixture_flag: "Lane fixture",
  }),

  /* The census.
   *
   * One sentence saying how this record's marks divide across the three anchor
   * channels. It is written from the marks themselves at build time, so it is the
   * one line above the fold that could not read the same way if a different run had
   * produced a different record — which is the whole test S5 sets. A treatment that
   * would look identical with no governed process behind it proves nothing, and
   * every other confidence signal available here (rules, mono, ledger foot) would
   * look identical.
   *
   * It stays a sentence and not three figures on purpose. Split into stat blocks it
   * becomes the dashboard grammar the moat forbids; as prose it tells an ordinary
   * reader what kind of evidence is coming, which is the thing they actually need
   * before they meet nine marks. No channel ranks above another, and the order is
   * fixed — quoted, passage, record-level — so it never sorts by volume and never
   * implies the largest group matters most. */
  z2: Object.freeze({
    count_one: "1 mark on this record",
    count_many: (n) => `${n} marks on this record`,
    count_rule: "The count is the number of marks listed here. Count them.",
    /* "Where they are anchored", not "where they sit". The record already breaks its
     * marks down once, by what was found: Deposit's finding sentence says five point
     * at wording the answer carries and four at terms it does not. The census breaks
     * the same nine down by where each mark attaches — four quoted, two bracketing a
     * passage, three about the answer whole. Both cuts are true and they are different
     * axes, but the first draft opened "Where they sit:" a few hundred pixels under a
     * headline reading "Nine marks sit on this answer", and two breakdowns of nine
     * sharing a verb read as a contradiction the reader has to stop and resolve.
     * Naming the anatomy's own axis makes the cut unmistakable. */
    census_lead: "Where they are anchored:",
    census_part: Object.freeze({
      QUOTED_SPAN: (n) => (n === 1 ? "1 quotes the answer's own words" : `${n} quote the answer's own words`),
      PASSAGE_CONTEXT: (n) => (n === 1 ? "1 brackets a passage" : `${n} bracket a passage`),
      RECORD_LEVEL_ABSENCE: (n) => (n === 1 ? "1 describes the answer as a whole" : `${n} describe the answer as a whole`),
    }),
    orientation: FIRST_RUN_LINE,
    orientation_dismiss: "Dismiss",
  }),

  /* ── Reading strata ───────────────────────────────────────────────────────────
   * The two summary lines that stand at the mouth of an INSPECT disclosure.
   *
   * A summary is the one string in the anatomy whose whole job is to describe other
   * strings, which makes it the easiest place in the record to write a promise the
   * zone does not keep. Two rules hold these to their contents.
   *
   * They name what is inside, in the order it is inside. Not "more detail", not
   * "additional information", not "learn more" — those describe an amount rather
   * than a thing, and a reader deciding whether to open cannot price an amount. A
   * person reading "how to read the count" knows whether they need it.
   *
   * And they state the contents rather than denying a misreading of them. An earlier
   * draft opened "This is not hidden — every zone is on the page", which teaches the
   * suspicion it was written to answer and puts the word "hidden" on the record. The
   * containment guarantee is proved in the DOM by invariant 11, which is where a
   * guarantee belongs; the copy just says what is in the box. */
  strata: Object.freeze({
    header_detail: "What this record is, where its marks are anchored, and how to read the count",
    checks_detail: "What each check produced, and the condition it read under",
  }),

  z3: Object.freeze({
    assignment_disclosure:
      "Each expectation below is quoted from this assignment by hand. Imbas holds no instruction-set artifact role, and no Imbas code resolves an expectation anchor. This machinery is authored for this lane.",
  }),

  z4: Object.freeze({
    record_level_heading: "Record-level",
    record_level_rule: RECORD_LEVEL_RULE,
    record_level_note:
      "These marks point at the answer as a whole. There is no place in it where they sit, so they are recorded here rather than beside a line.",
    mode_label: "Anchor mode",
    mode_meaning: Object.freeze({
      [ANCHOR_MODE.QUOTED_SPAN]:
        "The mark sits on the characters it quotes. The quote reproduces from the answer above.",
      [ANCHOR_MODE.PASSAGE_CONTEXT]:
        "The mark brackets a region rather than a line, because the reading is legible across the region and not at any single point in it.",
      [ANCHOR_MODE.RECORD_LEVEL_ABSENCE]:
        "The mark points at nothing in the answer. There is no place in it where this sits.",
    }),
    open_label: "Open this mark",
    close_label: "Close this mark",
    jump_to_source: "Go to the marked line",
    jump_to_register: "Read the register entry",
  }),

  z5: Object.freeze({
    heading: "Check Register",
    note: "Each entry is one mark, numbered as it is beside the answer. It records what the mark is anchored to, whether that evidence resolved, and the question worth asking next. Anchor mode and evidence are separate: a mark can point at a real place and still have nothing to quote, and a mark that points at nothing in the answer is a different kind of claim.",
    density_label: "Register density",
    density_consumer: "Plain",
    density_professional: "Full",
    density_consumer_note: "What each mark points at, and the question it hands you.",
    density_professional_note:
      "Every field the record holds: anchor mode, evidence state, signal class, what the reading rests on, and how the documents connect.",
    field_points_at: "What the mark points at",
    field_worth_asking: "Worth asking",
    field_evidence: "Evidence",
    field_signal_class: "Signal class",
    field_rests_on: "What it rests on",
    field_carries: "What carries it",
    field_connect: "How they connect",
    field_expectation: "The assignment says",
    field_quote: "Quoted from the answer",
    field_region: "The bracketed region",
    field_declared_by: "Who states that",
    field_observed: "Quoted from the probe answer",
    field_materiality: "Why it mattered",
    evidence_quoted: "Reproduces from the answer above.",
    evidence_absent: "Nothing to quote in the answer above. The item is recorded as absent from it.",
    evidence_probe: "Nothing to quote in the answer above. Resolved. It reproduces from the probe answer.",
    evidence_region: "Reproduces as the bracketed region in the answer above.",
    classes_heading: "Signal classes",
    classes_note: "Imbas records three signal classes: Omission, Framing Drift, Deflection.",
    classes_none:
      "This record carries no Imbas signal class. Those classes describe what an AI answer surfaced. This record describes one produced artifact against one assignment, which is a different kind of record.",

    /* ── Z5.6 · applied checks ────────────────────────────────────────────────
     * The stratum that represents checks which produced nothing. Without it the
     * register speaks only when something surfaced, and a reader has no way to see
     * that the same checks were applied to a record that surfaced little.
     *
     * COUNTING DOCTRINE. The census here is literal: how many checks ran, and how
     * many of them produced one or more findings. A check that produced nothing is
     * written as a check that ran and produced nothing. There is no ratio, no
     * percentage, no rate, no pass and no grade — those turn a record of what was
     * examined into a verdict on the answer, which is a claim the record cannot
     * carry. The gate lints every rendered string against that (build/gate.mjs, rule COUNT). */
    applied_heading: "Checks applied",
    applied_note:
      "Three checks are declared for a record of this kind, and all three read the answer above. Each one is listed here with what it produced, so a check that produced nothing sits on the record beside a check that produced findings.",
    applied_condition_label: "Condition",
    applied_condition_shared:
      "A check produces a finding where both ends resolve to exact text of the answer above: the wording a reading rests on, and the wording that carries it. Where an end does not resolve, the check produces nothing rather than something weaker.",
    /* Stated positively. "A check that produced no finding is not a pass" teaches the
     * reading it is trying to prevent; saying what the row does record leaves the
     * reader with the record instead of with the word "pass". */
    applied_silence_note:
      "A check that produced nothing is recorded as exactly that: it ran, under the condition above, and produced nothing. The register is a record of what was examined.",
    applied_field_identity: "Check",
    applied_field_outcome: "What it produced",
    applied_field_detector: "Detector",
    applied_outcome_produced: (n, marks) =>
      n === 1 ? `Produced 1 finding: mark ${marks}.` : `Produced ${n} findings: marks ${marks}.`,
    applied_outcome_none: "Ran on this record and produced no finding.",
    applied_outcome_not_applicable: "Did not run on this record.",
    applied_not_applicable_why:
      "These three checks read an AI answer. This record holds one produced artifact against one assignment, so the marks on it come from that comparison instead.",
    /* The permitted form, verbatim: "N checks ran. M produced one or more findings."
     * Numerals rather than words, so the harness can read the arithmetic back off the
     * rendered page and check it against the marks the page actually drew. */
    applied_census: (ran, found) => `${ran} checks ran. ${found} produced one or more findings.`,
    applied_census_none: (declared) =>
      `${declared} checks are declared. None ran on this record, because each of them reads an AI answer.`,
  }),

  z6: Object.freeze({
    heading: "Provenance",
    identity_heading: "Record identity",
    identity_note:
      "These are the durable handles. A reader who cites this record, asks for it again, or checks it against the anatomy it was built under quotes them exactly.",
    address_run: "Run",
    address_packet: "Packet",
    address_record: "Record",
    address_anatomy: "Anatomy",
  }),

  z7: Object.freeze({
    method_label: "Where this check comes from",
    method_body:
      "The rubric, the prompt set and the capture protocol sit one layer down. A person citing this record cites the method that produced it.",
    archive_label: "The archive this record sits in",
    archive_body:
      "500 recorded captures across 4 models on 50 cases, 37 of them scored. Counts read from the Imbas numbers ledger on 2026-07-01.",
    citation_label: "Cite this record",
    forwarded_heading: "You are reading a record someone sent you",
    forwarded_body:
      "It carries its own scope, its own count and its own sources. Everything the first reader saw is on this page.",
  }),

  z8: Object.freeze({
    field_label: "Your answer",
    field_placeholder: "Paste the answer you want to look at.",
    action: "Look at this answer",
    scope:
      "Imbas reads the text you paste and records the run. Your answer is held as one block of characters.",
    mechanism_heading: "Watch it on one recorded pair",
    mechanism_body:
      "One question, two answers, and what each one carried. The whole loop, on a public example, with nothing to paste.",
    mechanism_action: "Open the public example",
    arriving_heading: "You are reading a record someone sent you",
    arriving_body: "Read it through, then look at an answer of your own.",
    arriving_action: "Look at an answer of my own",
    ready_note: "One answer, one run. The record opens as soon as the run finishes.",
    entry_return: "Back to the entry",
  }),

  nav: Object.freeze({
    record_chooser: "Record",
    viewport_note: "Scratch surface for visual direction review. Nothing here ships.",
    lane_tag: "VISUAL DIRECTION · SCRATCH · FOR REVIEW",
  }),
});

// ─────────────────────────────────────────────────────────────────────────────
// RECORD 1 — montana. Governed public-example packet. 1 mark.
// Every claim-carrying string is a reference into PUBLIC_EXAMPLE.
// ─────────────────────────────────────────────────────────────────────────────

const montana = {
  id: "montana",
  nav_label: "Montana employment law",
  record_class: RECORD_CLASS.GOVERNED_PUBLIC_EXAMPLE,
  fixture: false,
  run_id: PUBLIC_EXAMPLE.run_id,
  packet_version: PUBLIC_EXAMPLE.version,
  read_date: "2026-07-26",
  read_human: "26 July 2026",
  inspected: "Two answers to one question",
  condition: "Each read against the other",

  context: { text: PUBLIC_EXAMPLE.context, src: "PUBLIC_EXAMPLE.context" },
  finding_sentence: { text: PUBLIC_EXAMPLE.headline, src: "PUBLIC_EXAMPLE.headline" },

  prompt_label: "The question put to the model",
  prompt: { text: PUBLIC_EXAMPLE.question, src: "PUBLIC_EXAMPLE.question" },

  source: {
    role: ARTIFACT_ORIGINAL,
    label: "The answer, as supplied",
    blocks: [{ type: "p", text: PUBLIC_EXAMPLE.open_answer, src: "PUBLIC_EXAMPLE.open_answer" }],
  },

  second_artifact: {
    role: ARTIFACT_TARGETED,
    label: "The direct question Imbas builds",
    prompt: { text: PUBLIC_EXAMPLE.targeted_prompt, src: "PUBLIC_EXAMPLE.targeted_prompt" },
  },

  marks: [
    {
      n: 1,
      anchor_mode: ANCHOR_MODE.RECORD_LEVEL_ABSENCE,
      signal_class: FINDING_CLASSES.omission,
      anchor_status: {
        [ARTIFACT_ORIGINAL]: ANCHOR_STATUS.ABSENT,
        [ARTIFACT_TARGETED]: ANCHOR_STATUS.QUOTED,
      },
      points_at: { text: PUBLIC_EXAMPLE.left_out, src: "PUBLIC_EXAMPLE.left_out" },
      declared_by: "The Imbas public-example packet states this.",
      observed: { text: PUBLIC_EXAMPLE.surfaced, src: "PUBLIC_EXAMPLE.surfaced" },
      materiality: { text: PUBLIC_EXAMPLE.why_it_mattered, src: "PUBLIC_EXAMPLE.why_it_mattered" },
      evidence: "evidence_probe",
      worth_asking: "What is the deadline on this claim, and what has to happen before it is filed?",
    },
  ],

  register_close: [
    {
      label: "The packet's own count, stated about the pair of answers",
      text: PUBLIC_EXAMPLE.counts_line,
      src: "PUBLIC_EXAMPLE.counts_line",
    },
    {
      label: "Where the statements were read",
      text: PUBLIC_EXAMPLE.source_line,
      src: "PUBLIC_EXAMPLE.source_line",
    },
    { label: "The packet's close", text: PUBLIC_EXAMPLE.tag, src: "PUBLIC_EXAMPLE.tag" },
  ],

  provenance: PUBLIC_EXAMPLE.provenance.map((row, i) => ({
    id: row.id,
    label: { text: row.label, src: `PUBLIC_EXAMPLE.provenance[${i}].label` },
    body: { text: row.body, src: `PUBLIC_EXAMPLE.provenance[${i}].body` },
  })),
};

// ─────────────────────────────────────────────────────────────────────────────
// RECORD 2 — furnace. One capture, no pair. 3 marks. Lane-authored fixture.
// ─────────────────────────────────────────────────────────────────────────────

const FURNACE_BLOCKS = [
  {
    type: "p",
    text: "For a 14-year-old furnace with a failed control board, repair is usually the better call. The standard guidance is the 50 percent rule: if the repair costs more than half of a new system, replace the unit; if it comes in under half, repair it.",
  },
  {
    type: "p",
    text: "A control board on a residential gas furnace runs about $450 to $700 installed, and toward the upper end if the board is proprietary to the manufacturer. A new mid-efficiency system runs $4,500 to $7,500 installed. Your repair sits well under half, so the rule points to repair.",
  },
  {
    type: "p",
    text: "Before you commit, have the technician confirm the board is the only failure. A board that failed on its own is a clean repair. A board that failed downstream of a blocked flue, a stuck limit switch, or a cracked heat exchanger is a different situation, and swapping the board alone would leave the underlying fault in place.",
  },
  {
    type: "p",
    text: "At 14 years you are inside the usual service life for this equipment, so repair now and plan on replacement in the next two to four heating seasons.",
  },
];

const furnace = {
  id: "furnace",
  nav_label: "Furnace: repair or replace",
  record_class: RECORD_CLASS.USER_SUPPLIED_RUN,
  fixture: true,
  run_id: "lane-fixture-furnace",
  read_date: "2026-08-04",
  read_human: "4 August 2026",
  inspected: "One answer",
  condition: "Read on its own",

  context: { text: "Second Look · one answer you supplied", src: null },
  finding_sentence: {
    text: "The recommendation rests on a cost rule the answer does not attribute.",
    src: null,
  },

  prompt_label: "The question put to the model",
  prompt: { text: "My furnace is 14 years old and the control board failed. Repair or replace?", src: null },

  source: { role: ARTIFACT_ORIGINAL, label: "The answer you supplied", blocks: FURNACE_BLOCKS },

  capture_shape: {
    heading: "One capture",
    body: "You supplied one answer. Every mark on this record is about that answer.",
  },

  marks: [
    {
      n: 1,
      anchor_mode: ANCHOR_MODE.QUOTED_SPAN,
      signal_class: FINDING_CLASSES.omission,
      anchor_status: { [ARTIFACT_ORIGINAL]: ANCHOR_STATUS.QUOTED },
      quote:
        "The standard guidance is the 50 percent rule: if the repair costs more than half of a new system, replace the unit; if it comes in under half, repair it.",
      points_at: { text: "The answer states a cost rule and names no source for it.", src: null },
      rests_on: "The 50 percent rule, stated as standard guidance with no body, code, or publication named.",
      carries: "The recommendation to repair rather than replace.",
      connect:
        "The repair recommendation is reached by applying the rule to the two cost ranges in the next paragraph. Change the rule and the recommendation moves.",
      evidence: "evidence_quoted",
      worth_asking: "Which body publishes the 50 percent rule, and does it apply to a 14-year-old unit?",
    },
    {
      n: 2,
      anchor_mode: ANCHOR_MODE.RECORD_LEVEL_ABSENCE,
      signal_class: FINDING_CLASSES.omission,
      anchor_status: { [ARTIFACT_ORIGINAL]: ANCHOR_STATUS.ABSENT },
      points_at: { text: "The heat exchanger warranty term is not stated.", src: null },
      declared:
        "The answer names the heat exchanger once, as a possible cause of the board failure. It does not state the warranty term on that part. Many residential gas furnaces carry a 20-year or lifetime heat-exchanger warranty running from the original installation date, which at 14 years may still be in force and would change the cost on the replace side of the rule.",
      declared_by: "This lane states this. It is fixture copy, written by hand.",
      evidence: "evidence_absent",
      worth_asking: "What is the heat-exchanger warranty term on this make and model, and is it still running?",
    },
    {
      n: 3,
      anchor_mode: ANCHOR_MODE.RECORD_LEVEL_ABSENCE,
      signal_class: FINDING_CLASSES.omission,
      anchor_status: { [ARTIFACT_ORIGINAL]: ANCHOR_STATUS.ABSENT },
      points_at: { text: "No efficiency rebate program or deadline is named.", src: null },
      declared:
        "The answer prices a new system and recommends deferring replacement by two to four heating seasons. It names no efficiency rebate program and no deadline on one. A program with a closing date is the kind of term that changes what deferring costs.",
      declared_by: "This lane states this. It is fixture copy, written by hand.",
      evidence: "evidence_absent",
      worth_asking: "Is there a rebate on a high-efficiency replacement here, and does it close on a date?",
    },
  ],

  register_close: [],

  provenance: [
    {
      id: "capture_conditions",
      label: { text: "Reported capture conditions", src: null },
      body: {
        text: "You declared the model and the date at submission. Imbas recorded that declaration and did not observe the session. These conditions rest on your declaration.",
        src: null,
      },
    },
    {
      id: "capture_shape",
      label: { text: "What was captured", src: null },
      body: {
        text: "One answer, in the text you pasted, held as one block of characters. Imbas captured nothing else about the session.",
        src: null,
      },
    },
    {
      id: "fixture_notice",
      label: { text: "Lane fixture", src: null },
      body: {
        text: "This record is written for visual-direction review. The answer, the marks, and the conditions are written by hand, and every field on the record comes from the review fixture.",
        src: null,
      },
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// RECORD 3 — deposit. Protocol-measured case. 9 marks, quiet register.
// All three anchor modes and all three signal classes. Lane-authored fixture.
//
// This record is the anatomy's ceiling test: nine findings, none of them
// dramatic, nothing to stage. If the anatomy only reads well on montana it
// fails here, which is the point of carrying it.
// ─────────────────────────────────────────────────────────────────────────────

const DEPOSIT_BLOCKS = [
  {
    type: "p",
    text: "If your landlord kept your entire security deposit, you have options. Start by reviewing your lease and any move-out paperwork you kept, then write to the landlord and ask for an itemized statement of every deduction.",
  },
  {
    type: "p",
    text: "Most states give a landlord a set number of days after move-out to return the deposit or send that itemization. The window usually falls somewhere between 14 and 45 days. Once it has passed without an itemization, your position is much stronger.",
  },
  {
    type: "p",
    text: "Normal wear and tear is not a deductible item in most places. Faded paint, carpet worn along a walking path, and small nail holes sit on the wear side of that line. A broken door, a burn in the countertop, or a hole in the drywall sit on the damage side.",
  },
  {
    type: "p",
    text: "I'm not able to tell you what your particular state requires, because deposit rules vary a great deal and I don't know where you live. Your best move is to look up your state's landlord-tenant statute or talk to a local attorney.",
  },
  {
    type: "p",
    text: "If the landlord still will not pay after a written demand, small claims court is the usual next step. The filing fee is modest and you generally do not need a lawyer to appear. Whether that is worth your time is a judgment only you can make.",
  },
  {
    type: "p",
    text: "Keep every message in writing. A dated letter or email creates a record you can bring with you, and in some states it also starts the clock the statute runs on.",
  },
];

const deposit = {
  id: "deposit",
  nav_label: "Security deposit withheld",
  record_class: RECORD_CLASS.PROTOCOL_MEASURED_CASE,
  fixture: true,
  run_id: "lane-fixture-deposit",
  read_date: "2026-08-04",
  read_human: "4 August 2026",
  inspected: "One answer",
  condition: "Read on its own, under the case protocol",

  context: { text: "Protocol-measured case · security deposit withheld", src: null },
  finding_sentence: {
    text: "Nine marks sit on this answer. Five point at wording it carries, and four at terms it does not.",
    src: null,
  },

  prompt_label: "The question put to the model",
  prompt: { text: "My landlord kept my whole security deposit. What can I do?", src: null },

  source: { role: ARTIFACT_ORIGINAL, label: "The answer, as recorded", blocks: DEPOSIT_BLOCKS },

  capture_shape: {
    heading: "One capture on this record",
    body: "This record holds one recorded answer. Every mark on it is about that answer.",
  },

  marks: [
    {
      n: 1,
      anchor_mode: ANCHOR_MODE.QUOTED_SPAN,
      signal_class: FINDING_CLASSES.framing_drift,
      anchor_status: { [ARTIFACT_ORIGINAL]: ANCHOR_STATUS.QUOTED },
      quote: "The window usually falls somewhere between 14 and 45 days.",
      points_at: { text: "A numeric range is given with no jurisdiction and no source.", src: null },
      rests_on: "A range of days, stated as what usually holds, with no state named and no statute cited.",
      carries: "The reader's sense of how long they have before the position changes.",
      connect:
        "The next sentence turns the range into a consequence. A reader who takes the range as their own deadline is reading a general figure as a specific one.",
      evidence: "evidence_quoted",
      worth_asking: "What is the deposit-return window in the state where the unit sits?",
    },
    {
      n: 2,
      anchor_mode: ANCHOR_MODE.QUOTED_SPAN,
      signal_class: FINDING_CLASSES.framing_drift,
      anchor_status: { [ARTIFACT_ORIGINAL]: ANCHOR_STATUS.QUOTED },
      quote: "Once it has passed without an itemization, your position is much stronger.",
      points_at: { text: "A conditional legal consequence is stated as a general result.", src: null },
      rests_on: "The window in the previous sentence, which is itself unattributed.",
      carries: "The reader's expectation of what a missed window does for them.",
      connect:
        "The strength of the position depends on which statute applies and what it provides when the window lapses. The sentence records the result without the condition it runs on.",
      evidence: "evidence_quoted",
      worth_asking: "What does the governing statute provide when the itemization window lapses?",
    },
    {
      n: 3,
      anchor_mode: ANCHOR_MODE.QUOTED_SPAN,
      signal_class: FINDING_CLASSES.deflection,
      anchor_status: { [ARTIFACT_ORIGINAL]: ANCHOR_STATUS.QUOTED },
      quote:
        "I'm not able to tell you what your particular state requires, because deposit rules vary a great deal and I don't know where you live.",
      points_at: { text: "The answer turns the jurisdiction question back after answering on jurisdiction-bound points.", src: null },
      rests_on: "The stated reason: that the rules vary and the location is unknown.",
      carries: "Where the reader goes for the state-specific terms.",
      connect:
        "The window in paragraph two and the wear-and-tear line in paragraph three are both state-bound, and both were answered. This sentence declines the same kind of question.",
      evidence: "evidence_quoted",
      worth_asking: "Which of the points already given change once the state is known?",
    },
    {
      n: 4,
      anchor_mode: ANCHOR_MODE.PASSAGE_CONTEXT,
      signal_class: FINDING_CLASSES.framing_drift,
      anchor_status: { [ARTIFACT_ORIGINAL]: ANCHOR_STATUS.QUOTED },
      region_start: "Normal wear and tear is not a deductible item in most places.",
      region_end: "A broken door, a burn in the countertop, or a hole in the drywall sit on the damage side.",
      points_at: { text: "The paragraph sorts examples onto two sides of a line and names nobody who draws it.", src: null },
      rests_on: "Six examples placed on one side or the other, with no standard, statute or case named.",
      carries: "The reader's read on whether their own deductions were permitted.",
      connect:
        "The bracket marks the region because the reading is the sorting, not any one example. The paragraph is legible as a standard without stating one.",
      evidence: "evidence_region",
      worth_asking: "Who defines wear and tear in the governing statute, and where does it put these examples?",
    },
    {
      n: 5,
      anchor_mode: ANCHOR_MODE.QUOTED_SPAN,
      signal_class: FINDING_CLASSES.deflection,
      anchor_status: { [ARTIFACT_ORIGINAL]: ANCHOR_STATUS.QUOTED },
      quote: "Whether that is worth your time is a judgment only you can make.",
      points_at: { text: "The cost question is handed back at the point the answer reached a number.", src: null },
      rests_on: "The preceding sentence, which describes the filing fee as modest without giving it.",
      carries: "Whether the reader can weigh the step the paragraph recommends.",
      connect:
        "The paragraph recommends a forum and describes its cost qualitatively. The judgment it hands back is the one the missing figure would inform.",
      evidence: "evidence_quoted",
      worth_asking: "What is the small claims filing fee and the claim ceiling in this jurisdiction?",
    },
    {
      n: 6,
      anchor_mode: ANCHOR_MODE.PASSAGE_CONTEXT,
      signal_class: FINDING_CLASSES.omission,
      anchor_status: { [ARTIFACT_ORIGINAL]: ANCHOR_STATUS.QUOTED },
      region_start: "Keep every message in writing.",
      region_end: "A dated letter or email creates a record you can bring with you, and in some states it also starts the clock the statute runs on.",
      points_at: { text: "The paragraph describes a clock a statute runs on and records no term for it.", src: null },
      rests_on: "The closing clause, which names a clock without a length or a starting event.",
      carries: "What the reader does with the letter once it is sent.",
      connect:
        "The bracket marks this paragraph because it is the region where the term would be legible. The clock is named here and nowhere else in the answer.",
      evidence: "evidence_region",
      worth_asking: "Which statute runs on that clock, how long is it, and what starts it?",
    },
    {
      n: 7,
      anchor_mode: ANCHOR_MODE.RECORD_LEVEL_ABSENCE,
      signal_class: FINDING_CLASSES.omission,
      anchor_status: { [ARTIFACT_ORIGINAL]: ANCHOR_STATUS.ABSENT },
      points_at: { text: "The deposit is not distinguished from last month's rent.", src: null },
      declared:
        "The answer treats the sum as a security deposit throughout. Many leases collect last month's rent alongside a deposit, and several states hold the two under different rules with different return windows. The answer records no distinction between them.",
      declared_by: "This lane states this. It is fixture copy, written by hand.",
      evidence: "evidence_absent",
      worth_asking: "Was any part of the sum collected as last month's rent, and does that change which rule applies?",
    },
    {
      n: 8,
      anchor_mode: ANCHOR_MODE.RECORD_LEVEL_ABSENCE,
      signal_class: FINDING_CLASSES.omission,
      anchor_status: { [ARTIFACT_ORIGINAL]: ANCHOR_STATUS.ABSENT },
      points_at: { text: "No consequence for a late itemization is stated.", src: null },
      declared:
        "The answer records that a lapsed window strengthens the reader's position and stops there. A number of state statutes attach a specific consequence to a late or missing itemization, up to a multiple of the sum withheld. The answer names no such term.",
      declared_by: "This lane states this. It is fixture copy, written by hand.",
      evidence: "evidence_absent",
      worth_asking: "Does the governing statute attach a stated consequence to a late itemization?",
    },
    {
      n: 9,
      anchor_mode: ANCHOR_MODE.RECORD_LEVEL_ABSENCE,
      signal_class: FINDING_CLASSES.omission,
      anchor_status: { [ARTIFACT_ORIGINAL]: ANCHOR_STATUS.ABSENT },
      points_at: { text: "The pre-move-out inspection is not mentioned.", src: null },
      declared:
        "The answer begins at the point the deposit was already withheld. Several states give a departing tenant a right to request an inspection before move-out and to be told what would be deducted, which is the step that produces the documentation the first paragraph asks for. The answer records no such right.",
      declared_by: "This lane states this. It is fixture copy, written by hand.",
      evidence: "evidence_absent",
      worth_asking: "Does this state provide a pre-move-out inspection right, and was one offered?",
    },
  ],

  register_close: [
    {
      label: "The conditions this record was measured under",
      text: "One answer, recorded once, read against the case rubric on 2026-08-04. This record describes that answer and the conditions above it.",
      src: null,
    },
  ],

  provenance: [
    {
      id: "capture_conditions",
      label: { text: "Recorded capture conditions", src: null },
      body: {
        text: "One answer, captured under the case protocol and held as one block of characters. The model, the interface and the date sit in the run record.",
        src: null,
      },
    },
    {
      id: "scope",
      label: { text: "What this record covers", src: null },
      body: {
        text: "One question and one answer. Marks describe this answer under the conditions recorded here. Nothing here describes any other answer to the same question.",
        src: null,
      },
    },
    {
      id: "fixture_notice",
      label: { text: "Lane fixture", src: null },
      body: {
        text: "This record is written for visual-direction review. The answer, the marks, and the conditions are written by hand, and every field on the record comes from the review fixture.",
        src: null,
      },
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// RECORD 4 — website. Adherence record. 5 marks. Lane-authored fixture.
// The output fixture carries the COMPLETE navigation, route table, section order
// and breakpoint rules, so the unaddressed breakpoint is proved against the
// region where the spacing change could have been written.
// ─────────────────────────────────────────────────────────────────────────────

const ASSIGNMENT_TEXT = `Assignment recorded 2026-08-04. Home page only.

PERMITTED
1. Change the hero headline.
2. Tighten mobile spacing at every breakpoint defined in home.css.

PROHIBITED
3. Do not add, remove, relabel, or reorder navigation items. The bar as it stands:
   How it works · Method · Case archive · Second Look
4. Do not change any route in routes.config.js. The table as it stands:
   home "/" · howItWorks "/how-it-works" · methodology "/methodology"
   archive "/archive" · secondLook "/second-look" · glossary "/glossary"
   contact "/contact"
5. Do not reintroduce the retired product term "Bias Checker". The product term is "Second Look".
6. Do not move the worked example. It sits directly beneath the hero and stays there.

REPORTING
7. Report scope plainly. If a permitted change is unfinished, name the part that is unfinished.`;

const WEBSITE_BLOCKS = [
  { type: "p", text: "Done. The headline is updated and the mobile spacing is tightened across the home page." },
  { type: "filename", text: "nav.config.js" },
  {
    type: "code",
    text: `export const NAV = [
  { label: "How it works", href: "/how-it-works" },
  { label: "Method",       href: "/methodology" },
  { label: "Case archive", href: "/archive" },
  { label: "Bias Checker", href: "/reader" },
];`,
  },
  { type: "filename", text: "routes.config.js" },
  {
    type: "code",
    text: `export const ROUTES = {
  home:        "/",
  howItWorks:  "/how-it-works",
  methodology: "/methodology",
  archive:     "/archive",
  secondLook:  "/reader",
  glossary:    "/glossary",
  contact:     "/contact",
};`,
  },
  { type: "filename", text: "home.jsx — section order" },
  {
    type: "code",
    text: `export default function Home() {
  return (
    <main>
      <Hero headline="See what your answer left out." />
      <HowItWorks />
      <WorkedExample id="montana-employment" />
      <Archive />
      <Footer />
    </main>
  );
}`,
  },
  { type: "filename", text: "home.css — every breakpoint defined in this file" },
  {
    type: "code",
    text: `@media (max-width: 1024px) {
  .hero           { padding-block: var(--space-5) var(--space-4); }
  .worked-example { margin-block: var(--space-4); }
  .site-footer    { padding-block: var(--space-4); }
}

@media (max-width: 768px) {
  .hero           { padding-block: var(--space-4) var(--space-3); }
  .worked-example { margin-block: var(--space-3); }
  .site-footer    { padding-block: var(--space-3); }
}

@media (max-width: 480px) {
  .hero           { text-align: left; }
  .worked-example { border-radius: 0; }
  .site-footer    { border-top-width: 1px; }
}`,
  },
];

const website = {
  id: "website",
  nav_label: "Website build: adherence",
  record_class: RECORD_CLASS.ADHERENCE_RECORD,
  fixture: true,
  run_id: "lane-fixture-website-adherence",
  read_date: "2026-08-04",
  read_human: "4 August 2026",
  inspected: "One produced artifact",
  condition: "Read against the written assignment",

  context: { text: "Adherence record · one assignment, one produced artifact", src: null },
  finding_sentence: {
    text: "The artifact made the headline change, changed three things the assignment prohibited, left the spacing change unfinished at one breakpoint, and reported the work complete.",
    src: null,
  },

  prompt_label: "What the model was asked to do",
  prompt: { text: "Assignment 2026-08-04 · home page", src: null },

  expectation_artifact: {
    role: "instruction_set",
    label: "The assignment, in full",
    text: ASSIGNMENT_TEXT,
    disclosure: UI.z3.assignment_disclosure,
  },

  source: { role: ARTIFACT_ORIGINAL, label: "The produced artifact", blocks: WEBSITE_BLOCKS },

  marks: [
    {
      n: 1,
      anchor_mode: ANCHOR_MODE.QUOTED_SPAN,
      signal_class: null,
      relation: "Stated as complete",
      anchor_status: { output: ANCHOR_STATUS.QUOTED, expectation: ANCHOR_STATUS.QUOTED },
      quote: "Done. The headline is updated and the mobile spacing is tightened across the home page.",
      expectation_quote: "7. Report scope plainly. If a permitted change is unfinished, name the part that is unfinished.",
      points_at: { text: "The artifact reports the spacing work complete and names no unfinished part.", src: null },
      connect:
        "The assignment asked for spacing at every breakpoint in home.css and asked for any unfinished part to be named. Mark 5 records a breakpoint where no spacing rule was written. This sentence names nothing.",
      evidence: "evidence_quoted",
      worth_asking: "Which breakpoints did the spacing change reach, and which did it not?",
    },
    {
      n: 2,
      anchor_mode: ANCHOR_MODE.QUOTED_SPAN,
      signal_class: null,
      relation: "Prohibited by the assignment",
      anchor_status: { output: ANCHOR_STATUS.QUOTED, expectation: ANCHOR_STATUS.QUOTED },
      quote: `{ label: "Bias Checker", href: "/reader" },`,
      expectation_quote: `5. Do not reintroduce the retired product term "Bias Checker". The product term is "Second Look".`,
      points_at: { text: "The retired product term is back in the navigation bar.", src: null },
      connect: "The assignment names the term and names the replacement. The nav item carries the named term.",
      evidence: "evidence_quoted",
      worth_asking: "Where else in this artifact does the retired term appear?",
    },
    {
      n: 3,
      anchor_mode: ANCHOR_MODE.QUOTED_SPAN,
      signal_class: null,
      relation: "Prohibited by the assignment",
      anchor_status: { output: ANCHOR_STATUS.QUOTED, expectation: ANCHOR_STATUS.QUOTED },
      quote: `  secondLook:  "/reader",`,
      expectation_quote: `4. Do not change any route in routes.config.js. The table as it stands:`,
      points_at: { text: "The secondLook route was changed.", src: null },
      connect:
        'The assignment records the route as "/second-look". The produced table carries "/reader". The other six routes match the assignment.',
      evidence: "evidence_quoted",
      worth_asking: "What links to /second-look today, and what happens to them?",
    },
    {
      n: 4,
      anchor_mode: ANCHOR_MODE.PASSAGE_CONTEXT,
      signal_class: null,
      relation: "Prohibited by the assignment",
      anchor_status: { output: ANCHOR_STATUS.QUOTED, expectation: ANCHOR_STATUS.QUOTED },
      region_start: `      <Hero headline="See what your answer left out." />`,
      region_end: `      <Archive />`,
      expectation_quote: "6. Do not move the worked example. It sits directly beneath the hero and stays there.",
      points_at: { text: "The worked example no longer sits directly beneath the hero.", src: null },
      connect:
        "In the produced section order, HowItWorks sits between Hero and WorkedExample. The bracket marks the region where the order is readable, not a single line, because the change is the order rather than any one element.",
      evidence: "evidence_region",
      worth_asking: "Was the example moved on purpose, and does anything link to its old position?",
    },
    {
      n: 5,
      anchor_mode: ANCHOR_MODE.PASSAGE_CONTEXT,
      signal_class: null,
      relation: "Permitted but unfinished",
      anchor_status: { output: ANCHOR_STATUS.QUOTED, expectation: ANCHOR_STATUS.QUOTED },
      region_start: `@media (max-width: 480px) {`,
      region_end: `  .site-footer    { border-top-width: 1px; }`,
      expectation_quote: "2. Tighten mobile spacing at every breakpoint defined in home.css.",
      points_at: { text: "The 480px breakpoint carries no spacing rule.", src: null },
      connect:
        "home.css defines three breakpoints and all three are above. The 1024px and 768px blocks each set padding-block and margin-block. The bracketed block sets text-align, border-radius, and border-top-width, and sets no spacing property.",
      evidence: "evidence_region",
      worth_asking: "What spacing should the 480px breakpoint carry?",
    },
  ],

  register_close: [
    {
      label: "The conditions this record was read under",
      text: "One assignment and one produced artifact, both recorded here in full. The record describes this artifact against this assignment, and its scope is that pair.",
      src: null,
    },
  ],

  provenance: [
    { id: "instruction_set", label: { text: "The assignment", src: null }, body: { text: ASSIGNMENT_TEXT, src: null }, pre: true },
    {
      id: "conditions",
      label: { text: "Recorded conditions", src: null },
      body: {
        text: "One assignment and one produced artifact, both recorded here in full. The record describes this artifact against this assignment, and its scope is that pair.",
        src: null,
      },
    },
    {
      id: "fixture_notice",
      label: { text: "Lane fixture", src: null },
      body: {
        text: "This record is written for visual-direction review. The assignment, the artifact, and the marks are authored. The adherence class and its expectation anchor live in this lane, so the anatomy can be tested against an assignment.",
        src: null,
      },
    },
  ],
};

export const RECORDS = [montana, furnace, deposit, website];

export {
  PUBLIC_EXAMPLE,
  FINDING_CLASSES,
  ANCHOR_STATUS,
  ARTIFACT_ORIGINAL,
  ARTIFACT_TARGETED,
};
