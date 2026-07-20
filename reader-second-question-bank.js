// reader-second-question-bank.js — the six standing follow-up instructions a person
// can send back to an AI answer (or an AI-assisted draft) when a specific kind of
// weakness shows up. Reader "second question" bank, authoring lane (site repo).
//
// WHAT THIS IS. Six fixed, human-written instructions — one per named weakness a
// reader recognizes in an answer: it didn't use the material I gave it, it doesn't
// show where its claims came from, it doesn't say what date or version applies, it
// didn't answer what I asked, it didn't give the number I asked for, it mixes facts
// with assumptions. Each entry pairs a short label the person taps with the exact
// instruction that gets sent. The instruction is model-facing, but the person reads
// it and chooses it, so it is written as a plain, direct request, never a rubric.
//
// STANDALONE BY CONTRACT. This module is a data bank and nothing more. It is NOT
// imported by workbench-app.jsx, the bundle, or api/** in this change; the UI that
// renders these chips, the endpoint that sends them, and the schema that records the
// resulting pair all belong to a later implementation lane. Pure JS, exactly like
// reader-paired.js / reader-explain-panel.js: no node: imports, no crypto, no DOM —
// so a Node test exercises the exports directly and the browser can import them
// unchanged later. The hashing primitive lives with the test, not here.
//
// EVERY TEMPLATE IS ANCHOR-FREE BY NECESSITY. The instrument's captured cases each
// name a specific thing an answer left out — a named study, a dated rule, a specific
// figure. A reader tapping one of these chips cannot name that thing; the whole point
// is that they do not know what is missing. So each instruction generalizes the
// captured behavior to the answer's OWN claims, dates, and numbers, and never asks the
// person to supply an anchor they don't have. Each entry's abstraction_note records
// that generalization in full: what the seed did, what the template generalizes, and
// what is lost (the specific anchor).
//
// SEEDING PROVENANCE (quarantine qualifier, applies to every capture cited below).
// Every capture referenced in this module is a quarantine-tier candidate observation
// from the instrument's archive/quarantine/ tree. Instrument custody holds no higher,
// human-admitted tier; nothing in this module is human-admitted evidence. Cross-repo
// files are cited as external, namespaced references (imbas-instrument:...); those
// files are NOT present in this repository and were supplied by a documented, read-only
// instrument-repo pass dated 2026-07-20.
//
// MUST NOT (carried from the seeding pass, binding on this module):
//   - do not describe any generic template as captured or preregistered merely because
//     a case-specific analogue exists;
//   - do not treat the 67 case-bank candidates or the tx-/sg- dossiers as captures;
//   - do not treat a .validation.md as a capture or disposition;
//   - do not upgrade a capture_derived tag toward human-admitted evidence;
//   - do not claim the constitution §1 chain as a Class-6 analogue;
//   - do not infer imbas-site-external or Airtable state.
// (The seeding pass phrases the fourth MUST NOT with a word this module bans; the
// wording here keeps its meaning and drops that one word. See the word ban below.)
//
// WORD BAN. The three words that would overstate this evidence do not appear anywhere
// in this module, its entries, or its comments. A weakness label or instruction that
// smuggled in a world-claim verdict, a reliance verdict, or a defensibility claim would
// also fail the AT-5 vocabulary lint (test/check-vocab-lint.test.mjs); the labels and
// instruction texts are registered there.

// Deep-freeze so nothing — the array, an entry, or any nested object or array — can be
// mutated after load. The repo's other constants use a shallow Object.freeze; this bank
// needs the whole tree frozen so no mutable reference escapes.
function deepFreeze(value) {
  if (value && (typeof value === "object" || typeof value === "function") && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const key of Object.keys(value)) deepFreeze(value[key]);
  }
  return value;
}

// Bank version, namespaced like EXPLAIN_PANEL_VERSION / CHECK_VOCAB_VERSION. Bump when
// the SET of entries changes (an entry added, removed, or reordered). A single entry's
// wording is versioned per-entry by instruction_version, not by this bank version.
export const SECOND_QUESTION_BANK_VERSION = "second-question-bank.v1";

// The four provenance tags an entry can carry. This is the ONLY place the valid values
// live; each entry names one of these on its own seeding_tag field — never duplicated
// into a second per-entry structure.
//   capture_derived  — the final mechanism is a defensible generalization of one or more
//                      quarantine-tier captures.
//   dossier_derived  — descends only from an uncaptured dossier (no capture backs it).
//   practice_derived — no case analogue exists; the instruction is a standing best practice.
//   mixed            — distinct clauses descend from different provenance classes.
export const SECOND_QUESTION_SEEDING_TAGS = deepFreeze({
  CAPTURE_DERIVED: "capture_derived",
  DOSSIER_DERIVED: "dossier_derived",
  PRACTICE_DERIVED: "practice_derived",
  MIXED: "mixed",
});

const T = SECOND_QUESTION_SEEDING_TAGS;

// Every entry's initial wording version. Stays here until an instruction's text is first
// used in a saved pair record; after that, any text change must bump it (the later lane
// enforces the "no silent edit after first use" rule; the test pins {version → hash} now
// so a text change without a bump fails CI today).
const INITIAL_INSTRUCTION_VERSION = "v1";
const AUTHORED_DATE = "2026-07-20";
const REVIEW_STATUS = "authored, pending founder review and bounded testing";

// The ordered six. Stable id first (a fixed internal identifier, never the visible
// label); approved_ui_label verbatim as adopted; instruction_text is the final authored
// wording. content_hash is a lowercase-hex SHA-256 over the exact UTF-8 bytes of
// instruction_text (no trimming, no normalization) — computed and pinned by the test.
export const SECOND_QUESTION_BANK = deepFreeze([
  {
    id: "sq.material",
    approved_ui_label: "Didn't use the material I provided",
    instruction_text:
      "Answer my question again, or revise the draft, using the document, text, or data I gave you as your main source. Build your claims on what that material actually says.\n\n" +
      "Point to the exact parts you drew on: the section, passage, or figure behind each claim. Keep what comes from my material separate from anything you add from general knowledge.\n\n" +
      "Where my material already answers the question, don't reach for a generic assumption instead. If you can't open or read part of what I gave you, or it isn't here in this conversation, say so plainly and ask for it rather than filling the gap.",
    instruction_version: INITIAL_INSTRUCTION_VERSION,
    seeding_tag: T.PRACTICE_DERIVED,
    seed_case_ids: [],
    abstraction_note:
      "Class 1: the documented 2026-07-20 instrument pass found no captured analogue (0/90 prompt-bearing files; the corpus names anchors but supplies no material). Practice-derived and anchor-free by necessity — the person can point at 'the document I gave you' without naming what it should have contained. Generalizes the always-true instruction: prefer the supplied material as the primary source, expose which parts were used, and admit when the material is inaccessible. No anchor is lost because none was ever captured for this class.",
    author: "Imbas",
    date: AUTHORED_DATE,
    review_status: REVIEW_STATUS,
    known_misuse_risks: [
      "Used on an answer where the person supplied no document, text, or data — there is no material to prefer, so the instruction has nothing to bind to.",
      "Read as a demand to treat the supplied material as the only allowable source even where it is silent, pushing the model to over-claim from a thin document.",
    ],
    negative_examples: [
      "A general-knowledge question asked with no attachment or pasted source ('What is the capital of Australia?').",
      "A request for the model's own opinion or a brainstorm, where no external material was offered or intended.",
    ],
    content_hash: "d9e7d15b3d88d9998913b581de2d520300221df4cfc91d1750134ec09556994a",
  },
  {
    id: "sq.sources",
    approved_ui_label: "Doesn't show where its claims came from",
    instruction_text:
      "As you answer again, or go back through the draft, show me where each important factual claim comes from. Name the source behind it: a citation, a document, a study, or another specific reference someone could look up.\n\n" +
      "Mark clearly which claims rest on a real source and which are your own inference or estimate.\n\n" +
      "Don't invent a citation, and don't imply a source backs a claim when you haven't checked that it does. Where you don't have a genuine source for something, say so and label it as your own reasoning rather than dressing it up as sourced.",
    instruction_version: INITIAL_INSTRUCTION_VERSION,
    seeding_tag: T.CAPTURE_DERIVED,
    seed_case_ids: [
      "imbas-instrument:registry/cases/case-006",
      "imbas-instrument:registry/cases/case-012",
    ],
    abstraction_note:
      "Seeds: case-006 (targeted prompt naming Kennan/Burns/Matlock/Gates; capture og-006-B-claude-targeted.md reproduces each authority with a citation, L5/17/28/37) and case-012 (naming Hviid 2019 and IOM 2011; capture og-012-B-gpt-targeted.md, inline citations L2/5/13/18); structural analogues in cases 002, 010, 013. Those captures name a specific omitted authority. The template generalizes to the anchor-free form: source the model's OWN claims, whatever they are. Lost: the named authority — the person cannot supply the very source they don't know is missing. Dossier reinforcement only, not a capture: sg-ctr-currency-over-10k.md L58-66 states the mechanism (name the source, add no new triggering fact).",
    author: "Imbas",
    date: AUTHORED_DATE,
    review_status: REVIEW_STATUS,
    known_misuse_risks: [
      "Pushed onto a purely subjective or creative answer (a poem, an opinion) where source attribution does not apply.",
      "Read as requiring a formal citation for every sentence, driving the model to attach nominal references that don't actually support the point.",
    ],
    negative_examples: [
      "A creative-writing or opinion request with no factual claim to source.",
      "A step in a math derivation where each line follows from the previous, not from an external source.",
    ],
    content_hash: "42a23c8211cb2a1a1592a30dcf03cb42edfbfc9ca6a398c4ae760db8d99e9c81",
  },
  {
    id: "sq.date_version",
    approved_ui_label: "Doesn't say what date or version applies",
    instruction_text:
      "Answer again, or revise the draft, and for every rule, standard, policy, or figure that can change over time, say which date, edition, or version it applies to.\n\n" +
      "Then check whether the version you're using has since been amended, replaced, or updated, and name the one that applies now wherever you can confirm it.\n\n" +
      "If you can't tell whether something is still current, say that plainly. Don't present an old rule or figure as the one in force today when you haven't confirmed that it is.",
    instruction_version: INITIAL_INSTRUCTION_VERSION,
    seeding_tag: T.MIXED,
    seed_case_ids: [
      "imbas-instrument:registry/cases/case-005",
      "imbas-instrument:registry/cases/case-009",
    ],
    abstraction_note:
      "Two clauses, two provenances, so the tag is mixed. The date/version clause descends from captures: case-005 (SEC Rule 10b-18, 1982; og-005-B-gpt-targeted.md L3/L26) and case-009 (2023 ODNI declassified summary; og-009-B-claude-targeted.md L14-16/48) — each anchors a specific dated authority. The supersession clause descends from dossier-only material with no capture: imbas-instrument:registry/annex/tx-ctc-permanence-vol-asym.md L39-42 (Public Law 119-21 permanence; L220 'No capture exists') and the case-bank repeal subset. The template generalizes both to the anchor-free form: date every time-sensitive point in the model's own answer and check it for supersession. Lost: the named rule and the named repeal.",
    author: "Imbas",
    date: AUTHORED_DATE,
    review_status: REVIEW_STATUS,
    known_misuse_risks: [
      "Applied to a timeless fact (a definition, a settled physical constant) where no date or version is meaningful.",
      "Read as a demand to assert the current version even where the model cannot check it, inviting a fabricated 'latest as of' claim.",
    ],
    negative_examples: [
      "A question about a mathematical identity or a fixed historical date, where nothing versions.",
      "An answer that already carries explicit, dated sourcing for every time-sensitive point.",
    ],
    content_hash: "dc6f07c835c92b5ddffb8cdc9c3261866c2f20370e825340f703e8470ae40ff8",
  },
  {
    id: "sq.direct_answer",
    approved_ui_label: "Didn't answer the question I actually asked",
    instruction_text:
      "Start by answering the exact question I asked. Restate that question back to me in one line first, so I can see it hasn't been quietly narrowed, widened, or swapped for a nearby one. If you're revising a draft, do the same for the question the draft is meant to answer.\n\n" +
      "Give the direct answer up front. Add only the background that answer actually needs, and put it after the answer, not before.\n\n" +
      "If the question can't be answered as I asked it, or something it needs is missing, name the specific thing that's in the way. Don't quietly trade my question for an easier one you can answer instead.",
    instruction_version: INITIAL_INSTRUCTION_VERSION,
    seeding_tag: T.PRACTICE_DERIVED,
    seed_case_ids: [],
    abstraction_note:
      "Class 4: no captured analogue by the documented 2026-07-20 search. The instrument's design is between-condition across fresh conversations, not a re-ask; case-003 v2 is a framing test, not a re-ask; the single regex hit was a false positive inside captured answer prose. Practice-derived and anchor-free by necessity. Generalizes the always-true instruction: answer the exact question first, restate it so any substitution is visible, and name the obstacle instead of swapping in an easier question. No anchor is lost because none was captured.",
    author: "Imbas",
    date: AUTHORED_DATE,
    review_status: REVIEW_STATUS,
    known_misuse_risks: [
      "Used when the person's question is genuinely ambiguous, where restating one reading as 'the exact question' can lock in the wrong one.",
      "Read as a ban on all context, producing a bare answer that drops caveats the question actually needed.",
    ],
    negative_examples: [
      "An open-ended brainstorming prompt where no single direct answer is expected.",
      "A request that explicitly asks for broad exploration or a set of options rather than one answer.",
    ],
    content_hash: "98fa2a649b3776c6deec3e40c06e218223624849601a823483568dade94a1e8a",
  },
  {
    id: "sq.quantity",
    approved_ui_label: "Didn't give the number or range I asked for",
    instruction_text:
      "Give the number, range, or threshold I asked for. If you're revising a draft, make sure that figure is actually stated in it, not left implied. Where a single figure is fair, give the figure; where it isn't, give a realistic range instead of a single point.\n\n" +
      "Show your work: the inputs and assumptions behind the figure, and the calculation where there is one. Keep the values you actually know apart from the ones you're estimating.\n\n" +
      "If the evidence doesn't get you to a solid number or range, say so outright and name what you'd need to get there. Don't invent a precise figure just to look more certain than you are.",
    instruction_version: INITIAL_INSTRUCTION_VERSION,
    seeding_tag: T.CAPTURE_DERIVED,
    seed_case_ids: [
      "imbas-instrument:registry/cases/case-004",
      "imbas-instrument:registry/cases/case-010",
    ],
    abstraction_note:
      "Seeds: case-004 (NNT literature; og-004-B-claude-targeted.md L14/15/36-39/42, NNT about 9, 20-33, 10-30, Cochrane figures) and case-010 (combined voting power; og-010-B-claude-targeted.md L7/19/39, 20-40% figures); reinforced by og-005 L26 ($942B, 2024) and og-012 L5 (HR 0.93, 95% CI 0.85-1.02). The captured sub-mechanisms diverge — a single settled figure versus an empirical range — and the template deliberately covers both: give the figure where one is fair, the realistic range where it isn't, with inputs shown. Anchor-free: the person asks for 'the number I wanted' without knowing it. Lost: the specific quantity and its source literature.",
    author: "Imbas",
    date: AUTHORED_DATE,
    review_status: REVIEW_STATUS,
    known_misuse_risks: [
      "Applied to a question that is not quantitative, manufacturing a number where none belongs.",
      "Read as always requiring a range, so a well-established single figure gets diluted into a vague band.",
    ],
    negative_examples: [
      "A qualitative 'how should I approach this?' question with no quantity at issue.",
      "A definitional or yes/no question where a number is not responsive.",
    ],
    content_hash: "12051d77dd1190464a0404f82fde0b225efa802f732425233181ed6f6bf7a06e",
  },
  {
    id: "sq.fact_assumption",
    approved_ui_label: "Mixes facts with assumptions",
    instruction_text:
      "Answer again, or go back through the draft, and keep three things apart: what you actually know, what you're assuming, and what you're inferring from those. Say which is which as you go.\n\n" +
      "For each main conclusion, show what it rests on: the facts and the assumptions it depends on. Where something is still unsettled, name it as an open question instead of smoothing it over.\n\n" +
      "Don't hand me an assumption, an inference, or an estimate dressed up as an established fact.",
    instruction_version: INITIAL_INSTRUCTION_VERSION,
    seeding_tag: T.PRACTICE_DERIVED,
    seed_case_ids: [],
    abstraction_note:
      "Class 6: no captured analogue by the documented 2026-07-20 search (0/90). The instrument constitution's epistemic chain is instrument-internal review discipline, never a model-directed prompt, and is deliberately NOT claimed as an analogue here. Practice-derived and anchor-free by necessity. Generalizes the always-true instruction: separate what is known from what is assumed or inferred, tie each conclusion to what it rests on, and never present an assumption as an established fact. No anchor is lost because none was captured.",
    author: "Imbas",
    date: AUTHORED_DATE,
    review_status: REVIEW_STATUS,
    known_misuse_risks: [
      "Forced onto a simple factual answer that has no assumptions to separate, adding empty scaffolding.",
      "Read as a demand to label ordinary settled facts as 'assumptions', overstating how uncertain they are.",
    ],
    negative_examples: [
      "A single verifiable lookup ('What year did X happen?') with no inference chain.",
      "A creative or opinion answer where a fact/assumption split does not apply.",
    ],
    content_hash: "e07d9fc87aec3e94797a7398ad175cc157436560101243024e0f5f6b108d1309",
  },
]);
