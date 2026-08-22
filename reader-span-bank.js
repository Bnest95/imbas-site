// reader-span-bank.js — the standing span-directed requests a person can send back to
// their own AI after selecting a passage of the inspected answer. Reader span bank,
// authoring lane (site repo).
//
// WHAT THIS IS. A person reads an answer, drags across the words that are the problem
// (or the words they want something done to), and gets a composed message on the
// clipboard. Each entry pairs a mode — problem or desired — with the exact request that
// gets sent. The request is model-facing, but the person selects the passage and chooses
// the mode, so it is written as a plain, direct request, never a rubric.
//
// THE PRODUCER IS THE PERSON, NOT A CHECK. This is what separates the span lane from the
// Check Register and from the prior Actionability v1 that was rejected for duplicating
// register machinery. Nothing here is offered until a person has made a selection with
// their own cursor. The do-not-build list in docs/IMBAS-WORKBENCH-ARCHITECTURE-v3.1.md
// bans "AI-suggested chips"; a user-initiated selection is not a suggested action, and
// that carve-out is the ruling this module ships under.
//
// STANDALONE BY CONTRACT. Pure JS, exactly like reader-second-question-bank.js and
// reader-paired.js: no node: imports, no crypto, no DOM — so a Node test exercises the
// exports directly and the browser imports them unchanged. The hashing primitive lives
// with the test, not here.
//
// ── SEEDING PROVENANCE ───────────────────────────────────────────────────────────────
// These eleven were not authored here. They were produced by the read-only Phase 0
// reconnaissance session "Phase 0 reconnaissance, read-only, no writes, no code" and
// were never committed; that session's own log is their durable copy. They are seeded
// from it verbatim — no rewording, no normalization, no repair.
//
//   log:    ~/.claude/projects/-Users-brendan-Documents-Claude-Projects-imbas-site
//           --claude-worktrees-brave-chaplygin-c8a5b1/
//           ff9bdb58-01b1-4ab3-bdf3-358eac8a2180.jsonl
//   sha256: 0d20119ababfb9343322dc2ffc1afe758b82e4cce67dc3c123e122f8ad244ea6
//
// The log carries two independent copies of the candidate table — the Bash tool input
// that ran them through both lint lanes, and the final return's markdown table. All
// fourteen candidates are byte-identical across both copies; that diff is what licensed
// the transcription. Mode is taken from the return, which states it rather than implying
// it: the P-series is PROBLEM and the D-series is DESIRED.
//
// ── EXCLUDED BY FOUNDER RULING: P7, D5, P8 ───────────────────────────────────────────
// Three of the fourteen do not ship. Their ids are recorded; their texts are deliberately
// NOT reproduced here, so this module cannot become a back door to the strings the ruling
// kept out. Each exclusion is lint-grounded rather than taste-grounded:
//   P7 (PROBLEM/blunt)   — trips check-vocab.v2 `world-claim-verdict`. It states a verdict
//                          about the world, which the Reader is not entitled to make.
//   D5 (DESIRED/blunt)   — trips chip-vocab.v1 `chip-imbas-action`. It claims the action
//                          on the answer that the founder boundary reserves.
//   P8 (PROBLEM/reliance)— passes both lanes as the lanes stood at Phase 0, and passes
//                          ONLY through the `can-rely-verdict` intervening-subject gap
//                          that this same slice closes. Once that rule sees an intervening
//                          subject, P8 is a reliance verdict and fails. The exclusion and
//                          the lint fix are one act, not two.
//
// ── THE FOUNDER BOUNDARY, AND WHERE THESE SIT RELATIVE TO IT ────────────────────────
// Binding and verbatim: "Imbas stays on the question side of the line, never produces the
// improved answer." The boundary governs AUTHORSHIP of the improved answer, not whether
// the composed text requests one. Imbas composes the message; the person's own AI
// produces the answer. Every entry below is therefore inside the line even where it is
// imperative — D2 asks an AI to do the work, and it is the person's AI being asked.
//
// What the boundary forbids is this module claiming the replacement. That is enforced,
// not merely stated: the `span-answer-authorship` rule family in reader-check-vocab.js is
// scoped to instruction_text here and bans the answer-production imperatives. Every entry
// below passes it, and test/check-vocab-lint.test.mjs proves the rule catches its own
// fixture rather than passing vacuously.

// Deep-freeze so nothing — the array, an entry, or any nested object or array — can be
// mutated after load. Same discipline as reader-second-question-bank.js: the repo's other
// constants use a shallow Object.freeze; a bank needs the whole tree frozen so no mutable
// reference escapes.
function deepFreeze(value) {
  if (value && (typeof value === "object" || typeof value === "function") && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const key of Object.keys(value)) deepFreeze(value[key]);
  }
  return value;
}

// Bump when the SET of entries changes (an entry added, removed, or reordered). A single
// entry's wording is versioned per-entry by instruction_version, not by this version.
export const READER_SPAN_BANK_VERSION = "reader-span-bank.v1";

// The two modes, and the only place their values live. A mode is what the person chose
// when they pressed one of the two affordances, never something inferred from the words.
export const SPAN_MODES = deepFreeze({
  PROBLEM: "problem",
  DESIRED: "desired",
});

const M = SPAN_MODES;

// One provenance tag, shared by all eleven, because all eleven came from one recovery of
// one log. It names the log and pins its hash, so a later pass can tell whether it holds
// the same corpus rather than a similar one.
export const PHASE0_SEED_LOG =
  "~/.claude/projects/-Users-brendan-Documents-Claude-Projects-imbas-site--claude-worktrees-" +
  "brave-chaplygin-c8a5b1/ff9bdb58-01b1-4ab3-bdf3-358eac8a2180.jsonl";
export const PHASE0_SEED_LOG_SHA256 =
  "0d20119ababfb9343322dc2ffc1afe758b82e4cce67dc3c123e122f8ad244ea6";
export const PHASE0_SEEDING_TAG =
  `seeded from Phase 0 recon session log ${PHASE0_SEED_LOG}, log sha256 ${PHASE0_SEED_LOG_SHA256}`;

// The ids the founder ruling kept out. Recorded so a later pass cannot re-derive them by
// accident and think it found something new. Texts deliberately absent.
export const PHASE0_EXCLUDED_IDS = deepFreeze(["P7", "P8", "D5"]);

const INITIAL_INSTRUCTION_VERSION = "v1";

// approved_ui_label is null on every entry, and that is a recorded gap rather than an
// oversight. The Phase 0 return supplied an id, a mode, a sub-shape, and an instruction
// for each candidate; it supplied no per-entry UI label, and no founder ruling has
// approved one. A label invented here would be an unapproved string wearing the word
// "approved". v1 needs none: the two affordances are labelled at MODE level, and a person
// never sees a per-entry label. The field stays in the shape so the later lane that adds
// sub-shape selection has somewhere to put an approved label, and the lint test skips
// nulls rather than treating absence as clean.
const NO_APPROVED_LABEL = null;

// The eleven, in the order the Phase 0 return recorded them. Order is load-bearing:
// composeSpanRequest takes the first entry of the requested mode, so this order is what
// makes the default deterministic and traceable to the log rather than chosen here.
export const READER_SPAN_BANK = deepFreeze([
  {
    id: "P1",
    mode: M.PROBLEM,
    sub_shape: "generic",
    approved_ui_label: NO_APPROVED_LABEL,
    instruction_text:
      "You marked this as the problem. Ask your AI: what is this based on, and what is the source and date?",
    instruction_version: INITIAL_INSTRUCTION_VERSION,
    seeding_tag: PHASE0_SEEDING_TAG,
    abstraction_note:
      "The mode-general problem request, and the PROBLEM default by recorded order. Asks what the selected words rest on and when they were true — interrogative, inspection-adjacent, and the one entry that overlaps cleanly with the Check Register's own register when a mark is present. Carried verbatim from the Phase 0 log; no capture backs it, and none is claimed. NOTE, reported rather than repaired: its first two sentences address the person ('You marked this as the problem. Ask your AI:') while the rest addresses the AI that receives the paste. The founder ruling said seed verbatim and fabricate nothing, so the addressee mix is preserved exactly as recorded and flagged for founder review rather than silently edited here.",
    content_hash: "80ac2946f520584f47050d941bc01cd49b92acea1971143b8f932a4878fe9fc8",
  },
  {
    id: "P2",
    mode: M.PROBLEM,
    sub_shape: "wrong",
    approved_ui_label: NO_APPROVED_LABEL,
    instruction_text:
      "This does not match what I know. Name the source and the date for it, and if the source says something different, say what it says.",
    instruction_version: INITIAL_INSTRUCTION_VERSION,
    seeding_tag: PHASE0_SEEDING_TAG,
    abstraction_note:
      "The disagreement sub-shape, and one of the two the founder named as shipping through pure composition. It states the person's disagreement as the person's own ('does not match what I know') and asks for source and date rather than asserting the answer is untrue — which is why it clears check-vocab.v2 where the blunt form of the same intent does not. No finding class stands behind it: a world claim is outside the instrument by design, so this entry composes something useful to the person while asserting nothing Imbas measured.",
    content_hash: "4376472b8c5de7177e976efe8804de1c9fa38848bc8c7bde7f9d67145c75a243",
  },
  {
    id: "P3",
    mode: M.PROBLEM,
    sub_shape: "missing",
    approved_ui_label: NO_APPROVED_LABEL,
    instruction_text:
      "This leaves out something I need. What conditions, exceptions, deadlines, or steps apply here that are not stated above?",
    instruction_version: INITIAL_INSTRUCTION_VERSION,
    seeding_tag: PHASE0_SEEDING_TAG,
    abstraction_note:
      "The omission sub-shape, and the one with full instrument support behind it: it maps cleanly onto the registered `omission` finding class, so when the selection overlaps a mark this request and the Reader's own reading are about the same behavior. Anchor-free by necessity — the person names that something is missing without being able to name what, which is the whole condition the request is written for.",
    content_hash: "3d0af979c18747215ce234df32a47df82a7c44419afcc93eb691dee6db53afc3",
  },
  {
    id: "P4",
    mode: M.PROBLEM,
    sub_shape: "refused",
    approved_ui_label: NO_APPROVED_LABEL,
    instruction_text:
      "You declined this. Say plainly what you cannot do and why, and then do the part you can.",
    instruction_version: INITIAL_INSTRUCTION_VERSION,
    seeding_tag: PHASE0_SEEDING_TAG,
    abstraction_note:
      "The refusal sub-shape. Adjacent to the registered `deflection` class but not the same behavior: deflection covers answering an easier question than the one asked, while a flat refusal answers none. Recorded as approximate rather than mapped, so no surface can claim this request is backed by a deflection finding. Asks for the boundary to be named and the remainder done, rather than contesting the refusal.",
    content_hash: "d2e2ffc4819ffa4b50c1bb406a2246a1d311b695c0fe4a006659b146b3b52499",
  },
  {
    id: "P5",
    mode: M.PROBLEM,
    sub_shape: "not-done",
    approved_ui_label: NO_APPROVED_LABEL,
    instruction_text:
      "You said this was done. Show me the exact change: the file, the lines, and the result of running it.",
    instruction_version: INITIAL_INSTRUCTION_VERSION,
    seeding_tag: PHASE0_SEEDING_TAG,
    abstraction_note:
      "The claimed-work sub-shape — an agent said it made a change it did not make. This is the founder's sharpest originating case and the second of the two that ship as pure composition. It has NO measurement behind it and cannot acquire one: a claim about work outside the text is unverifiable from a transcript in principle, not merely today. That is precisely why it is safe to compose — it asks the person's AI for evidence and asserts nothing on Imbas's behalf.",
    content_hash: "3cacda5c79127a03012537ad5209859401c01c76023b4a46660afb65fea5216e",
  },
  {
    id: "P6",
    mode: M.PROBLEM,
    sub_shape: "loop",
    approved_ui_label: NO_APPROVED_LABEL,
    instruction_text:
      "We have been round this twice. State your current position in one sentence, name what you are unsure about, and ask me the one question you need answered to proceed.",
    instruction_version: INITIAL_INSTRUCTION_VERSION,
    seeding_tag: PHASE0_SEEDING_TAG,
    abstraction_note:
      "The loop-breaker, and the entry that most directly serves the originating scenario of a person mid-fight with a circling AI. Worth recording as an oddity: it is the only entry that is about the CONVERSATION rather than about the selected words, so the span it is composed against is context rather than subject. It is kept because the founder's case names looping explicitly, and because it clears both lanes clean.",
    content_hash: "83bfefd3b9de25a2e59d07122000038929df01241e51272f1a61261d5ec9e420",
  },
  {
    id: "D1",
    mode: M.DESIRED,
    sub_shape: "expand",
    approved_ui_label: NO_APPROVED_LABEL,
    instruction_text:
      "Take this part and go deeper: give the full detail, the steps, and the conditions that apply.",
    instruction_version: INITIAL_INSTRUCTION_VERSION,
    seeding_tag: PHASE0_SEEDING_TAG,
    abstraction_note:
      "The expansion request, and the DESIRED default by recorded order. Asks for more of what is already there rather than a replacement of it, which makes it the mildest entry in the mode and the one furthest from the boundary. Imperative, like every DESIRED entry, and inside the line for the same reason: the person's AI does the producing.",
    content_hash: "b7d8c8bf03098a69a57c80319c0a133ae42c3213ad2b01693716c441c104b6dd",
  },
  {
    id: "D2",
    mode: M.DESIRED,
    sub_shape: "do-it",
    approved_ui_label: NO_APPROVED_LABEL,
    instruction_text:
      "Do this now, in full. Do not describe it, do not summarise it, and do not stop partway. If you cannot complete it, say which part and why.",
    instruction_version: INITIAL_INSTRUCTION_VERSION,
    seeding_tag: PHASE0_SEEDING_TAG,
    abstraction_note:
      "The completion request, and the entry that makes the founder boundary maximally load-bearing: the Phase 0 return records it as 'one edit away from here it is, done.' It is inside the line as written because it asks the person's AI to do the work and never offers Imbas's own version. The `span-answer-authorship` rule exists so that the one edit which would cross the line fails CI rather than shipping.",
    content_hash: "bd726cf337e757806a8147e64afddaa7b0853f799116a26eaf5197a5fd431e3b",
  },
  {
    id: "D3",
    mode: M.DESIRED,
    sub_shape: "properly",
    approved_ui_label: NO_APPROVED_LABEL,
    instruction_text:
      "Redo this part properly: complete, with the source for each claim and the date it applies to.",
    instruction_version: INITIAL_INSTRUCTION_VERSION,
    seeding_tag: PHASE0_SEEDING_TAG,
    abstraction_note:
      "The redo request. Its verb is the reason the `span-answer-authorship` rule bans a named list rather than a semantic category: 'redo' asks for the same thing 'rewrite' asks for, and this founder-ratified entry uses it. The rule's boundary is recorded beside the rule itself, so a later pass that widens the list to cover 'redo' has to overrule an entry the founder included rather than tidy up an oversight.",
    content_hash: "fbf61a2aff3600703e29215b8b60c7c91113ab8de95523e648c300e16c64d1ad",
  },
  {
    id: "D4",
    mode: M.DESIRED,
    sub_shape: "artifact",
    approved_ui_label: NO_APPROVED_LABEL,
    instruction_text: "Give me this as the finished output, not as a description of it.",
    instruction_version: INITIAL_INSTRUCTION_VERSION,
    seeding_tag: PHASE0_SEEDING_TAG,
    abstraction_note:
      "The artifact request: the person wants the thing itself rather than an account of the thing. Shortest entry in the bank. Names no quality bar and asks for no improvement, so it carries none of the authorship risk the mode's blunter forms do.",
    content_hash: "506bb3a1b7743196dc02508b3fcf2d146006d9afe1311cd5a1f2d63c30c65eb0",
  },
  {
    id: "D6",
    mode: M.DESIRED,
    sub_shape: "narrow",
    approved_ui_label: NO_APPROVED_LABEL,
    instruction_text:
      "Everything else stays as it is. Change only this part, and show me just that part changed.",
    instruction_version: INITIAL_INSTRUCTION_VERSION,
    seeding_tag: PHASE0_SEEDING_TAG,
    abstraction_note:
      "The containment request, and the entry that most depends on the selection actually existing: 'only this part' is meaningless without a resolved span, so this is the entry that proves the span lane is doing work no mode-level chip could do. Asks for a bounded change and a bounded report of it.",
    content_hash: "a3ad73bb677809380167b67ecd4c8ca0be86267849a68cb40a003fbdb6b23d4d",
  },
]);

// The entries of one mode, in recorded order.
export function spanEntriesForMode(mode) {
  return READER_SPAN_BANK.filter((e) => e.mode === mode);
}

// The entry a mode composes with when the person has not chosen a sub-shape — which, in
// v1, is always, because the two affordances are mode-level and nothing selects a
// sub-shape yet. FIRST OF THE MODE IN RECORDED ORDER, deliberately: it makes the default
// a property of the Phase 0 log rather than a preference expressed here. P1 is the
// PROBLEM default and is the one candidate the return labelled "generic"; D1 is the
// DESIRED default and is the mildest of its mode. Which entry each mode SHOULD default to
// is a founder decision this module does not make — it only makes the current answer
// deterministic and traceable.
export function defaultSpanEntry(mode) {
  return spanEntriesForMode(mode)[0] || null;
}
