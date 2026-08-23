// Run-specific question promotion — the finding row reaches its own question.
//
// THE DEFECT THIS CLOSES. The Check Register derives a question per finding and put
// it only on the card, far below the marks. The fixed two-question probe sat below
// that again, and it was what a person reached first — so a register that had already
// named the thing worth asking about a finding never reached anyone's next action.
// The row now carries the question its own finding produced.
//
// TWO CLAIMS, AND THEY ARE SEPARATE.
//
//   DERIVATION — describeFinding narrows the record's register disposition to one
//   nullable id. EMITTED yields the card id; every other status and a missing
//   disposition yield null. The view never sees the status enum or the suppression
//   reasons.
//
//   RESOLUTION — the panel normalizes the register's cards to a Map once and resolves
//   that id against it. A row whose id is null, or whose id names no card, renders
//   nothing: no control, no placeholder, no focus stop.
//
// The second claim is proven by running the shipped component, not by reading it. A
// source assertion would pass on a panel that rendered an empty <p> for every row.
//
// Synthetic fixtures only. No metered model calls.
//
// Run: node --test test/finding-question-promotion.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { transform } from "esbuild";

import {
  ARTIFACT_ORIGINAL,
  REGISTER_STATUS,
  SUPPRESSION_REASONS,
  registerDisposition,
  buildFinding,
  describeFinding,
  SHAPE_SINGLE_CANDIDATE,
  buildSourceReading,
  ANCHOR_CHANNEL,
  RECORD_LEVEL_ABSENCE_NOTE,
  MARK_ORIENTATION_NOTE,
} from "../reader-result.js";
import { CHECK_UI } from "../reader-checks.js";
import { MARK_NUMBER_ATTR, SPAN_SEGMENT_ATTR, resolveSelectionSpan } from "../reader-span-selection.js";
import { READER_EVENTS } from "../reader-telemetry.js";

const SRC = readFileSync(
  process.env.WORKBENCH_APP_JSX || fileURLToPath(new URL("../workbench-app.jsx", import.meta.url)),
  "utf8",
);

function componentSource(text, name) {
  const start = text.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `workbench-app.jsx must define ${name}`);
  const rest = text.slice(start);
  const next = rest.indexOf("\nfunction ", 1);
  return next === -1 ? rest : rest.slice(0, next);
}

function stringConstant(text, name) {
  const m = new RegExp(`^const ${name} = ("(?:[^"\\\\]|\\\\.)*");$`, "m").exec(text);
  assert.ok(m, `workbench-app.jsx must define ${name} as a single-line string constant`);
  return JSON.parse(m[1]);
}

const ANSWER = "The filing window closes ninety days after the notice is served.";
const QUOTE = "ninety days after the notice is served";
const CARD_ID = "chk_abc1234_12_48";
const QUESTION = "What sets the filing window in this jurisdiction, and where is that written down?";

// ── Fixtures ─────────────────────────────────────────────────────────────────

function findingWith(check_register) {
  return buildFinding({
    index: 0,
    shape: SHAPE_SINGLE_CANDIDATE,
    class_label: "omission",
    statement: "The answer does not state the filing window.",
    materiality: "A reader who misses this misses the deadline.",
    quotations: { [ARTIFACT_ORIGINAL]: QUOTE },
    artifacts: { [ARTIFACT_ORIGINAL]: ANSWER },
    ...(check_register === undefined ? {} : { check_register }),
  });
}

function card(over = {}) {
  return {
    id: CARD_ID,
    finding_type: "omission",
    verification_question: QUESTION,
    ...over,
  };
}

// ── 1. Derivation ────────────────────────────────────────────────────────────

test("an EMITTED register disposition publishes its card id to the view", () => {
  const described = describeFinding(
    findingWith(registerDisposition({ status: REGISTER_STATUS.EMITTED, card_id: CARD_ID })),
  );
  assert.equal(described.verification_card_id, CARD_ID);
});

test("every status other than EMITTED publishes null", () => {
  // SUPPRESSED with a stated cause — the register looked and stayed quiet.
  const suppressed = describeFinding(
    findingWith(
      registerDisposition({
        status: REGISTER_STATUS.SUPPRESSED,
        suppression_reasons: [SUPPRESSION_REASONS.NO_CHECK_BLOCK],
      }),
    ),
  );
  assert.equal(suppressed.verification_card_id, null);

  // ELIGIBLE — the shape admits a card and this run produced none. The ordinary case.
  const eligible = describeFinding(findingWith(registerDisposition({ status: REGISTER_STATUS.ELIGIBLE })));
  assert.equal(eligible.verification_card_id, null);

  // NOT_APPLICABLE — the shape never produces a card at all.
  const na = describeFinding(findingWith(registerDisposition({ status: REGISTER_STATUS.NOT_APPLICABLE })));
  assert.equal(na.verification_card_id, null);
});

test("a finding carrying no register disposition at all publishes null", () => {
  // buildFinding always seats a default, so this is the shape of a record that reached
  // the view from somewhere else — an older payload, a hand-built object, a field lost
  // in transit. The descriptor answers it the same way it answers a suppressed check:
  // there is no question here. It does not throw and it does not guess.
  const bare = { ...findingWith(undefined), check_register: undefined };
  assert.equal(describeFinding(bare).verification_card_id, null);

  const nulled = { ...findingWith(undefined), check_register: null };
  assert.equal(describeFinding(nulled).verification_card_id, null);
});

test("an EMITTED status is necessary but not sufficient — the id must survive trimming", () => {
  // RULING: verification_card_id means a usable card relationship, not merely a register
  // that reached EMITTED. These two records claim EMITTED and address nothing, so the
  // field is null and the row renders nothing.
  //
  // Neither can be built through registerDisposition — see the guard test below — so
  // both are hand-seated, which is the same class of record as the missing-disposition
  // case above: an older payload, a hand-built object, a field lost in transit. The
  // point is that the descriptor answers them without throwing and without guessing.
  const empty = { ...findingWith(undefined), check_register: { status: REGISTER_STATUS.EMITTED, card_id: "" } };
  assert.equal(describeFinding(empty).verification_card_id, null, "an empty card id addresses nothing");

  const blank = { ...findingWith(undefined), check_register: { status: REGISTER_STATUS.EMITTED, card_id: "   " } };
  assert.equal(describeFinding(blank).verification_card_id, null, "a whitespace card id addresses nothing");

  // A non-string id is the same answer for the same reason.
  const numeric = { ...findingWith(undefined), check_register: { status: REGISTER_STATUS.EMITTED, card_id: 7 } };
  assert.equal(describeFinding(numeric).verification_card_id, null);
});

test("normalization happens once, in the derivation, so no consumer trims", () => {
  // This one IS canonically reachable. registerDisposition tests the id by its trimmed
  // length but stores what it was given, so a padded id passes the guard and travels
  // whole. The descriptor publishes it trimmed, which is what a Map lookup needs.
  const padded = registerDisposition({ status: REGISTER_STATUS.EMITTED, card_id: `  ${CARD_ID}  ` });
  assert.equal(padded.card_id, `  ${CARD_ID}  `, "the record keeps the id it was handed");
  assert.equal(
    describeFinding(findingWith(padded)).verification_card_id,
    CARD_ID,
    "the view receives the id it can actually look up",
  );
});

test("the derivation keys on the status, and the record makes that the only safe test", () => {
  // Why the descriptor tests the status rather than the id alone: the record refuses to
  // mint a card id on any other status, so status is the fact and the id is a
  // consequence of it. A view that read the id by itself would be reading a field the
  // record guarantees is null anyway — right by accident, and wrong the moment that
  // guarantee moved.
  assert.throws(
    () => registerDisposition({ status: REGISTER_STATUS.ELIGIBLE, card_id: CARD_ID }),
    /cannot carry a card_id/,
  );
  assert.throws(
    () =>
      registerDisposition({
        status: REGISTER_STATUS.SUPPRESSED,
        suppression_reasons: [SUPPRESSION_REASONS.NO_CHECK_BLOCK],
        card_id: CARD_ID,
      }),
    /cannot carry a card_id/,
  );
  assert.throws(() => registerDisposition({ status: REGISTER_STATUS.EMITTED }), /EMITTED requires a card_id/);

  // And the constructor already tests the id by its trimmed length, which is why the
  // empty and whitespace cases above have to be hand-seated to exist at all. The
  // descriptor's own check is defense against records that never came through here.
  assert.throws(
    () => registerDisposition({ status: REGISTER_STATUS.EMITTED, card_id: "" }),
    /EMITTED requires a card_id/,
  );
  assert.throws(
    () => registerDisposition({ status: REGISTER_STATUS.EMITTED, card_id: "   " }),
    /EMITTED requires a card_id/,
  );
});

test("the view contract stays narrow — no disposition object, no status enum", () => {
  const described = describeFinding(
    findingWith(registerDisposition({ status: REGISTER_STATUS.EMITTED, card_id: CARD_ID })),
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(described, "check_register"),
    false,
    "the descriptor must not hand a view the register disposition object",
  );
  const serialized = JSON.stringify(described);
  for (const status of Object.values(REGISTER_STATUS)) {
    assert.equal(
      serialized.includes(status),
      false,
      `the descriptor must not publish the ${status} status into the view contract`,
    );
  }
  for (const reason of Object.values(SUPPRESSION_REASONS)) {
    assert.equal(serialized.includes(reason), false, "the descriptor must not publish suppression reasons");
  }
});

// ── 2. Resolution ────────────────────────────────────────────────────────────

const PANEL = componentSource(SRC, "MeasurementPanel");
const EVIDENCE = componentSource(SRC, "FindingEvidence");
const SOURCE_READING = componentSource(SRC, "SourceReading");
const MARK_NUMBER = componentSource(SRC, "MarkNumber");
const EXPLANATION_ID = componentSource(SRC, "findingExplanationId");
// Lifted, not stubbed. This file's whole claim is about what this component does with
// what the panel hands it, so a stub would prove nothing.
const QUESTION_CONTROL = componentSource(SRC, "FindingQuestion");

// The panel compiled and evaluated, with the question control real. `h` records the
// tree rather than building DOM, and calls function types so a component's own output
// is what the assertions read. Free identifiers are supplied explicitly: a new one
// added to either component fails here loudly instead of reading undefined.
async function renderPanel({ findings, cards }) {
  const { code } = await transform(
    `${PANEL}\n${EVIDENCE}\n${SOURCE_READING}\n${MARK_NUMBER}\n${EXPLANATION_ID}\n${QUESTION_CONTROL}\nreturn MeasurementPanel;`,
    { loader: "jsx", jsxFactory: "h", jsxFragment: "Frag" },
  );
  const h = (type, props, ...children) => {
    if (typeof type === "function") return type({ ...(props || {}), children });
    return { type, props: props || {}, children };
  };
  const stub = () => null;
  const make = new Function(
    "h",
    "Frag",
    "useState",
    "selectSubset",
    "describeFinding",
    "buildSourceReading",
    "ANCHOR_CHANNEL",
    "RECORD_LEVEL_ABSENCE_NOTE",
    "MARK_ORIENTATION_NOTE",
    "MEASURE_SECTION_LABEL",
    "MEASURE_INSPECT_SUMMARY",
    "MEASURE_SOURCE_LABEL",
    "MEASURE_EMPTY_LINE",
    "RECEIPT_BOUNDARY",
    "CHECK_UI",
    "READER_EVENTS",
    "emitReaderEvent",
    "ProvenanceStrip",
    "ReaderReceiptActions",
    // The span lane. SourceReading resolves a person's selection through this module, so
    // its real exports are supplied rather than mocks of them.
    "SPAN_SEGMENT_ATTR",
    "MARK_NUMBER_ATTR",
    "resolveSelectionSpan",
    // The two remaining hooks. `useState` above already stands for FindingQuestion's;
    // SourceReading adds a ref and an effect, and with no DOM here the ref is null, the
    // effect never runs, and the selection state holds its initial null.
    "useRef",
    "useEffect",
    // Stubbed. This file is about which findings reach a question control by way of the
    // register; the span lane's own affordance answers a different question, is proven in
    // test/reader-span-selection.test.mjs, and returns null here regardless because no
    // selection exists.
    "SpanAffordances",
    code,
  );
  const Panel = make(
    h,
    "Frag",
    (init) => [init, () => {}],
    () => findings,
    (f) => f,
    buildSourceReading,
    ANCHOR_CHANNEL,
    RECORD_LEVEL_ABSENCE_NOTE,
    MARK_ORIENTATION_NOTE,
    stringConstant(SRC, "MEASURE_SECTION_LABEL"),
    stringConstant(SRC, "MEASURE_INSPECT_SUMMARY"),
    stringConstant(SRC, "MEASURE_SOURCE_LABEL"),
    stringConstant(SRC, "MEASURE_EMPTY_LINE"),
    "boundary",
    CHECK_UI,
    READER_EVENTS,
    () => {},
    stub,
    stub,
    SPAN_SEGMENT_ATTR,
    MARK_NUMBER_ATTR,
    resolveSelectionSpan,
    () => ({ current: null }),
    () => {},
    stub,
  );
  return Panel({
    result: {
      measurement: {},
      result: {},
      checks: cards === null ? null : { cards },
      receipt: { open_run: { answer: ANSWER } },
    },
    context: {},
  });
}

// Every node in the recorded tree, flattened, so a claim can be made about the whole
// render rather than about a path through it.
function nodes(node, out = []) {
  if (node == null || node === false) return out;
  if (Array.isArray(node)) {
    for (const n of node) nodes(n, out);
    return out;
  }
  if (typeof node === "object") {
    out.push(node);
    if (node.children) nodes(node.children, out);
  }
  return out;
}

function questionControls(tree) {
  return nodes(tree).filter(
    (n) => n.props && String(n.props.className || "").includes("wb-measure__question-link"),
  );
}

function questionTexts(tree) {
  return nodes(tree).filter(
    (n) => n.props && String(n.props.className || "").split(" ").includes("wb-measure__question-text"),
  );
}

// Every string in a subtree, concatenated. Used to read what a person would see.
function textOf(node, out = []) {
  if (node == null || node === false) return out;
  if (Array.isArray(node)) {
    for (const n of node) textOf(n, out);
    return out;
  }
  if (typeof node === "string" || typeof node === "number") {
    out.push(String(node));
    return out;
  }
  if (node.children) textOf(node.children, out);
  return out;
}

const EMITTED = () =>
  describeFinding(findingWith(registerDisposition({ status: REGISTER_STATUS.EMITTED, card_id: CARD_ID })));
const NO_CARD = () =>
  describeFinding(
    findingWith(
      registerDisposition({
        status: REGISTER_STATUS.SUPPRESSED,
        suppression_reasons: [SUPPRESSION_REASONS.ANCHOR_NOT_VERBATIM],
      }),
    ),
  );

test("a finding with an emitted card renders its question control", async () => {
  const tree = await renderPanel({ findings: [EMITTED()], cards: [card()] });
  const controls = questionControls(tree);
  assert.equal(controls.length, 1, "the row must carry exactly one question control");
  assert.equal(controls[0].type, "button", "the control must be a real button, not a styled span");
  assert.deepEqual(controls[0].children, [CHECK_UI.copy_affordance]);
});

test("a dangling id renders nothing — no control, no shell", async () => {
  // The finding says EMITTED and names a card the register does not carry. This is the
  // state a lane like this one creates if the join and the register ever drift, and the
  // answer is silence: the row loses its question and keeps everything else.
  const tree = await renderPanel({ findings: [EMITTED()], cards: [card({ id: "chk_someone_else_1_2" })] });
  assert.equal(questionControls(tree).length, 0, "a dangling id must resolve to nothing");
  const shells = nodes(tree).filter(
    (n) => n.props && String(n.props.className || "").includes("wb-measure__question"),
  );
  assert.equal(shells.length, 0, "a dangling id must not leave a spacing shell behind");
});

test("a finding with no card renders nothing, with a full register on the page", async () => {
  // The mixed record: one finding cleared the both-ends-quotable rule and one did not,
  // and the register holds a card for the one that did. The row without a card must not
  // borrow it.
  const tree = await renderPanel({ findings: [NO_CARD()], cards: [card()] });
  assert.equal(questionControls(tree).length, 0);
});

test("a mixed record promotes only the findings that have cards", async () => {
  const emitted = EMITTED();
  const bare = { ...NO_CARD(), id: "single_candidate.1" };
  const tree = await renderPanel({ findings: [emitted, bare], cards: [card()] });
  assert.equal(questionControls(tree).length, 1, "exactly one of two rows may carry a question");
});

test("an absent register renders nothing and does not throw", async () => {
  const noChecks = await renderPanel({ findings: [EMITTED()], cards: null });
  assert.equal(questionControls(noChecks).length, 0, "a result with no register must render no question");
  const emptyRegister = await renderPanel({ findings: [EMITTED()], cards: [] });
  assert.equal(questionControls(emptyRegister).length, 0, "an empty register must render no question");
});

test("a card with an empty question renders nothing", async () => {
  // validateCard drops these before they reach a register, so this is defense in depth
  // rather than a live state — but a control that copies an empty string is worse than
  // no control, and the cost of holding it is one condition.
  const tree = await renderPanel({ findings: [EMITTED()], cards: [card({ verification_question: "   " })] });
  assert.equal(questionControls(tree).length, 0);
});

test("the empty state produces no question artifact at all", async () => {
  const tree = await renderPanel({ findings: [], cards: [card()] });
  assert.equal(questionControls(tree).length, 0);
});

// ── 2b. The question is legible where the finding is read ────────────────────
//
// THE SECOND HALF OF THE SAME DEFECT. Promotion put the question's CONTROL on the row
// and left its WORDS in the Check Register, so the row asked a person to copy something
// they could not read and travel to learn what they had taken. R10 already requires the
// derived question to render as literal, selectable final text before any control that
// acts on it, and the span-directed site renders it that way. This is the same treatment
// on the surface that produced the question.

test("a qualifying finding renders its verification question literally, in words", async () => {
  const tree = await renderPanel({ findings: [EMITTED()], cards: [card()] });
  const texts = questionTexts(tree);
  assert.equal(texts.length, 1, "the row must render exactly one question text");

  // The register's own string, character for character. Not a paraphrase, not a
  // truncation, not a tooltip.
  const printed = textOf(texts[0]).join("");
  assert.equal(printed, `${CHECK_UI.labels.verification}${QUESTION}`);
  assert.ok(printed.includes(QUESTION), "the exact question string must be on the page");

  // R10's ordering: the words come before the control that acts on them.
  const flat = nodes(tree);
  const textAt = flat.indexOf(texts[0]);
  const controlAt = flat.indexOf(questionControls(tree)[0]);
  assert.ok(textAt !== -1 && controlAt !== -1);
  assert.ok(textAt < controlAt, "the literal question must render before the control that copies it");
});

test("the control copies the string the row displays — one question, not two", async () => {
  // R22: one canonical full statement per finding. The row shows a question and offers
  // to copy a question, and if those could differ the row would be publishing two.
  // They cannot: both read card.verification_question, and nothing transforms either.
  const tree = await renderPanel({ findings: [EMITTED()], cards: [card()] });
  const displayed = textOf(questionTexts(tree)[0]).join("").replace(CHECK_UI.labels.verification, "");
  assert.equal(displayed, QUESTION);

  assert.match(
    QUESTION_CONTROL,
    /writeText\(card\.verification_question\)/,
    "the control must copy the card's question verbatim",
  );
  assert.match(
    QUESTION_CONTROL,
    /\{card\.verification_question\}/,
    "the displayed question must be the same expression the control copies",
  );

  // The component reads the question exactly three times — the guard that decides
  // whether to render at all, the display, and the copy. A fourth read is where a second
  // wording would enter. Counted against the code with its commentary removed, since the
  // comment explaining this names the same expression.
  const code = QUESTION_CONTROL.replace(/\{?\/\*[\s\S]*?\*\/\}?/g, "").replace(/^\s*\/\/.*$/gm, "");
  const reads = code.match(/card\.verification_question/g) || [];
  assert.equal(reads.length, 3, "the guard, the display, and the copy — and nothing else");
});

test("no question is manufactured where the register produced none", async () => {
  // The give-nothing-away line. A row without a card had no question before this change
  // and has none after it: no text, no label, no placeholder, no spacing shell.
  for (const [why, args] of [
    ["a finding with no card", { findings: [NO_CARD()], cards: [card()] }],
    ["a dangling id", { findings: [EMITTED()], cards: [card({ id: "chk_someone_else_1_2" })] }],
    ["an absent register", { findings: [EMITTED()], cards: null }],
    ["an empty register", { findings: [EMITTED()], cards: [] }],
    ["a card with a blank question", { findings: [EMITTED()], cards: [card({ verification_question: "   " })] }],
    ["the empty state", { findings: [], cards: [card()] }],
  ]) {
    const tree = await renderPanel(args);
    assert.equal(questionTexts(tree).length, 0, `${why}: no question text`);
    assert.equal(
      nodes(tree).filter((n) => textOf(n).join("").includes(CHECK_UI.labels.verification)).length,
      0,
      `${why}: not even the label`,
    );
  }
});

test("the mixed record shows one question, and the row without a card stays quiet", async () => {
  const tree = await renderPanel({
    findings: [EMITTED(), { ...NO_CARD(), id: "single_candidate.1" }],
    cards: [card()],
  });
  const texts = questionTexts(tree);
  assert.equal(texts.length, 1, "exactly one of two rows may show a question");
  assert.equal(textOf(texts[0]).join("").includes(QUESTION), true);
});

test("showing the question is not asking it", async () => {
  // GIVE NOTHING AWAY. Rendering the words changes nothing about what the product has
  // done: no stage advances, no run starts, no paste box opens, nothing is sent. The
  // component's prohibitions are already pinned above; this adds the one the display
  // could plausibly have broken, which is that reading a question is not running a check.
  const tree = await renderPanel({ findings: [EMITTED()], cards: [card()] });
  const text = questionTexts(tree)[0];
  assert.equal(text.type, "p", "the question is prose, not a control");
  assert.equal(Boolean(text.props.onClick), false, "the question text must not be clickable");
  assert.equal(Boolean(text.props.href), false, "the question text must not navigate");
  assert.equal(Boolean(text.props.role), false, "the question text must claim no widget role");

  // And it does not become a second primary CTA. One filled-accent moment on the page,
  // and it belongs to the run.
  assert.equal(QUESTION_CONTROL.includes("<Btn"), false);
  const CSS = readFileSync(fileURLToPath(new URL("../workbench.css", import.meta.url)), "utf8");
  const rule = /\.wb-measure__question-text \{([^}]*)\}/.exec(CSS);
  assert.ok(rule, "workbench.css must style the question text");
  assert.equal(/background/.test(rule[1]), false, "the question text must not be a filled block");
  assert.equal(/color:/.test(rule[1]), false, "the question text inherits the row's ink and spends no accent");
});

test("the local question ships no new user-facing string", async () => {
  // The label is the register's own — the same one the Check Register prints over the
  // same question — so nothing new entered the product vocabulary and AT-5's recursive
  // lint over CHECK_UI already covers it.
  assert.match(QUESTION_CONTROL, /CHECK_UI\.labels\.verification/);
  assert.equal(CHECK_UI.labels.verification, "Worth asking");

  const tree = await renderPanel({ findings: [EMITTED()], cards: [card()] });
  const printed = textOf(questionTexts(tree)[0]).join("");
  assert.equal(
    printed.replace(CHECK_UI.labels.verification, "").replace(QUESTION, ""),
    "",
    "the row prints the register's label and the register's question, and nothing of its own",
  );
});

// ── 3. The rulings this lane was given, held in source ────────────────────────

test("the panel normalizes the register once and never re-derives the join", () => {
  assert.match(PANEL, /new Map\(/, "the panel must normalize the register's cards to a Map");
  assert.match(
    PANEL,
    /cardsById\.get\(f\.verification_card_id\)/,
    "the row must resolve the descriptor's id against that Map",
  );
  // Content-matching is how the SERVER built the join, once, in classifyRegisterOutcome.
  // A view that repeated it would be deriving a relationship the record already states.
  for (const field of ["dependency_statement", "supporting_proposition", "dependent_output", "proposition"]) {
    assert.equal(
      PANEL.includes(field),
      false,
      `the panel must not re-derive the finding-to-card join on ${field}`,
    );
  }
});

test("the promoted action does not advance the stage machine", () => {
  // The fixed two-question probe remains the one wired path into COMPARE. Copying a
  // row's question puts it on the clipboard and stops — no paste box, no stage change,
  // no new workflow state.
  for (const advance of ["onOpen", "setStage", "setLane", "setView", "STAGE_", "scrollIntoView"]) {
    assert.equal(
      QUESTION_CONTROL.includes(advance),
      false,
      `the row's question control must not ${advance} — this lane adds no return path`,
    );
  }
});

test("the row action is link treatment, never a second filled CTA", () => {
  // Accent law: the page keeps one filled-accent moment and it belongs to the primary
  // CTA. This control is ember text with a rule under it.
  assert.equal(QUESTION_CONTROL.includes("<Btn"), false, "the row action must not be a Btn");
  assert.equal(QUESTION_CONTROL.includes("kind=\"primary\""), false, "the row action must not be a primary CTA");
  assert.match(QUESTION_CONTROL, /type="button"/, "the row action must be a real button for keyboard operation");

  const CSS = readFileSync(fileURLToPath(new URL("../workbench.css", import.meta.url)), "utf8");
  const rule = /\.wb-measure__question-link \{([^}]*)\}/.exec(CSS);
  assert.ok(rule, "workbench.css must style the row's question control");
  assert.match(rule[1], /color:\s*var\(--ember\)/, "the control must carry the ember accent as text");
  assert.match(rule[1], /text-decoration:\s*underline/, "the control must carry an underline");
  assert.match(rule[1], /background:\s*none/, "the control must not be filled");
});

test("the question text itself is untouched — no phrase assertions, no rewriting", () => {
  // The question is model-authored: api/read.js instructs it, reader-checks.js gates it
  // on hasWorldClaimVerdict and copies it verbatim. This lane moved where it renders.
  // Nothing here asserts a phrase inside it, and the control writes the card's string
  // to the clipboard with no transform.
  assert.match(
    QUESTION_CONTROL,
    /writeText\(card\.verification_question\)/,
    "the control must copy the card's question verbatim",
  );
  assert.equal(
    QUESTION_CONTROL.includes("replace("),
    false,
    "the control must not rewrite the model-authored question",
  );
});

test("the copy uses the register's own shipped vocabulary, adding none", () => {
  // No new consumer string enters the product for this lane. The row reuses the two the
  // register already ships, which are already inside AT-5's recursive lint over
  // CHECK_UI and already pinned in test/reader-copy-cures.test.mjs.
  assert.match(QUESTION_CONTROL, /CHECK_UI\.copy_affordance/);
  assert.match(QUESTION_CONTROL, /CHECK_UI\.copied_affordance/);
  const literals = QUESTION_CONTROL.match(/"[A-Z][a-z]+ [a-z][^"]*"/g) || [];
  assert.deepEqual(
    literals.filter((s) => s !== '"Could not copy"'),
    [],
    "the row action must ship no new user-facing string literal",
  );
});
