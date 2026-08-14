// reader-checks-actions — the per-finding action: the question a finding produced,
// rendered on the finding that produced it.
//
// WHAT THIS LANE ADDED, AND WHAT IT DID NOT. It added no generator. The Check Register
// already writes one non-leading verification question per emitted check, and
// buildCanonicalSingle already stamps every finding with the register's disposition, so
// an EMITTED finding already carries the id of the card its question lives on. That join
// was never rendered: the questions sit in a panel further down the page, ranked, most of
// them behind an expander, and a person reading a finding had no path from it to its
// question. findingCheckAction reports the join; FindingCheckAction renders it. No new
// question is written, no answer is produced, nothing is sent anywhere, and no consumer
// string is minted — every word on the new surface is a CHECK_UI string that already
// shipped, or the model's own question riding through verbatim.
//
// THE TWO-PART ELIGIBILITY RULE is what most of this file is about, because its two parts
// live in two different places and only one of them is inside findingCheckAction.
//
//   EMITTED — owned here. A finding whose check never emitted has no question to reach,
//   so it gets no action. This inherits the register's both-ends-quotable law and the
//   world-claim gate rather than relaxing either.
//
//   SURFACED — owned by the call site, and it has to be. check_register is stamped on
//   EVERY finding, including findings whose anchor never resolved, because the register
//   resolves the check block's own two quotations against the answer and that has nothing
//   to do with whether the finding's anchor resolved. An UNRESOLVED finding really can
//   carry status EMITTED and a real card_id. reader-result.js owns satisfiesAnchorContract
//   and publishes the answer as the surfaced_findings subset; reader-checks.js cannot
//   import it without closing a cycle, and must not re-derive it — a module second-guessing
//   reader-result.js about what may be shown is how absence findings were lost once
//   already. So the gate is the subset the panel maps, and it is pinned here three ways:
//   the panel's source, the rendered output, and the sharp edge itself.
//
// Content-blind: a synthetic answer and a synthetic model payload, driven through the real
// createReadHandler with a stubbed inference call. No live base, no spend.
//
// Run: node --test test/reader-checks-actions.test.mjs

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { transform } from "esbuild";

import { createReadHandler } from "../api/read.js";
import { _resetMemoryStateForTests } from "../reader-security.js";
import { CHECK_UI, REGISTER_EMITTED, findingCheckAction } from "../reader-checks.js";
import {
  ANCHOR_CHANNEL,
  MARK_ORIENTATION_NOTE,
  RECORD_LEVEL_ABSENCE_NOTE,
  REGISTER_STATUS,
  buildSourceReading,
  describeFinding,
  selectSubset,
} from "../reader-result.js";
import { READER_EVENTS } from "../reader-telemetry.js";
import { lintUserFacingStrings } from "../reader-check-vocab.js";

const ROOT = new URL("../", import.meta.url);
const SRC = readFileSync(process.env.WORKBENCH_APP_JSX || fileURLToPath(new URL("workbench-app.jsx", ROOT)), "utf8");
const CSS = readFileSync(fileURLToPath(new URL("workbench.css", ROOT)), "utf8");

// ── The fixture: one answer, three findings, one of each eligibility state ─────
//
// The answer's conclusion rests on a proposition stated earlier in the same answer, which
// is what the register's both-ends rule requires. Each finding carries its own well-formed
// check block, so the register emits a card for all three; what differs between them is
// the finding's own ANCHOR, which is the axis surfacing turns on.
//
//   ABSENT     — the source supplied no quotation. Surfaces as a record-level absence.
//   QUOTED     — the source supplied a quotation that is verbatim in the answer.
//   UNRESOLVED — the source supplied a quotation that is not in the answer. Never surfaces.
const ANSWER =
  "The vendor's contract was signed in 2019. " +
  "Because it predates the policy change, the vendor is exempt from the new reporting rule. " +
  "You can proceed without filing the additional disclosure.";
const QUESTION = "Do we need to file the additional disclosure for this vendor?";
const PROP = "The vendor's contract was signed in 2019";
const DEP = "the vendor is exempt from the new reporting rule";

const ABSENT_Q = "What is the effective date of the reporting rule, and does a 2019 contract fall under it?";
const QUOTED_Q = "Where does the answer's wording about the exemption come from?";
const UNRESOLVED_Q = "Which office is responsible for the disclosure?";

function checkBlock(overrides = {}) {
  return {
    supporting_proposition: PROP,
    dependent_output: DEP,
    dependency_statement: "The exemption rests on the 2019 signing date stated earlier in the answer.",
    verification_question: ABSENT_Q,
    resolver: "authority",
    ...overrides,
  };
}

// The three findings, in the shape the inspector emits them. `anchor` is the finding's own
// quotation and is the only field that differs in kind between them.
const FINDINGS = [
  {
    type: "candidate missing item",
    anchor: "",
    materiality: "The answer never states the rule's effective date.",
    check: checkBlock(),
  },
  {
    type: "candidate framing issue",
    anchor: DEP,
    materiality: "The exemption is stated as settled.",
    check: checkBlock({
      dependency_statement: "The wording rests on the signing date stated earlier in the answer.",
      verification_question: QUOTED_Q,
      resolver: "document",
    }),
  },
  {
    type: "candidate deflection",
    anchor: "a phrase that does not occur anywhere in the answer",
    materiality: "The answer routes past the filing office.",
    check: checkBlock({
      dependency_statement: "The routing rests on the exemption stated earlier in the answer.",
      verification_question: UNRESOLVED_Q,
      resolver: "authority",
    }),
  },
];

function modelPayload(findings) {
  return {
    completeness: "partial",
    the_read: "The answer routes past the reporting rule's effective date.",
    what_was_left_out: ["the effective date of the reporting rule"],
    how_it_was_shaped: "Framed as a settled exemption.",
    inspection_note: "Provisional single-model read.",
    measurement: { gap_estimate: 2, estimate_rationale: "one load-bearing omission", findings },
  };
}

function mockRes() {
  const out = { statusCode: null, body: null };
  return {
    status(code) { out.statusCode = code; return this; },
    json(payload) { out.body = payload; return this; },
    setHeader() { return this; },
    end() { return this; },
    out,
  };
}

// The real handler with the inference call stubbed. AIRTABLE_TOKEN is unset, so capture
// short-circuits before any fetch and the stub only ever serves the one inference call.
async function runRead(findings = FINDINGS, answer = ANSWER) {
  const handler = createReadHandler({
    env: { READER_API_KEY: "test-key", READER_ENABLED: "1", READER_SPEND_CEILING_USD: "8" },
    fetch: async () => ({
      ok: true,
      json: async () => ({
        content: [{ type: "text", text: JSON.stringify(modelPayload(findings)) }],
        usage: { input_tokens: 10, output_tokens: 5 },
      }),
    }),
  });
  const res = mockRes();
  await handler(
    {
      method: "POST",
      headers: { "x-forwarded-for": "203.0.113.9" },
      body: { open_question: QUESTION, answer, case: {}, textcheck: { surfaced: false, found: [], missing: [] } },
    },
    res,
  );
  assert.equal(res.out.statusCode ?? 200, 200);
  assert.equal(res.out.body.source, "agent");
  return res.out.body;
}

const anchorStatuses = (finding) => finding.anchors.map((a) => a.status);

beforeEach(() => {
  _resetMemoryStateForTests();
});

// ── 1. The literal mirrors the enum ────────────────────────────────────────────
//
// reader-checks.js cannot import REGISTER_STATUS: reader-result.js imports reader-checks.js,
// so naming it there would close a cycle. It therefore holds a literal, and this is the pin
// that stops the literal drifting from the enum it mirrors.

test("REGISTER_EMITTED equals the canonical EMITTED status", () => {
  assert.equal(REGISTER_EMITTED, REGISTER_STATUS.EMITTED);
});

// ── 2. The join, on real output from the real handler ──────────────────────────

test("the fixture produces exactly the three eligibility states this file reasons about", async () => {
  const body = await runRead();
  const [absent, quoted, unresolved] = body.result.findings;
  assert.deepEqual(anchorStatuses(absent), ["ABSENT"]);
  assert.deepEqual(anchorStatuses(quoted), ["QUOTED"]);
  assert.deepEqual(anchorStatuses(unresolved), ["UNRESOLVED"]);
  // All three emitted: the register's verdict is about the check block, not the anchor.
  for (const f of body.result.findings) assert.equal(f.check_register.status, REGISTER_STATUS.EMITTED);
  // Only two of the three may be shown to anyone.
  assert.deepEqual(
    selectSubset(body.result, "surfaced_findings").map((f) => f.id),
    [absent.id, quoted.id],
  );
});

test("a surfaced ABSENT finding yields the missing-part question, with no positional field", async () => {
  const body = await runRead();
  const finding = selectSubset(body.result, "surfaced_findings")[0];
  const action = findingCheckAction({ finding, cards: body.checks.cards });
  assert.ok(action, "an emitted absence finding must reach its question");
  assert.equal(action.question, ABSENT_Q);
  assert.equal(action.finding_id, finding.id);
  // The whole absence grammar, enforced structurally: there is no field here that could
  // carry a quote or a position, so no later hand can point an absence at a passage.
  assert.deepEqual(Object.keys(action).sort(), [
    "card_id", "copied_label", "finding_id", "finding_type", "label", "question", "resolver", "resolver_label",
  ]);
});

test("a surfaced QUOTED finding yields the source-language question", async () => {
  const body = await runRead();
  const finding = selectSubset(body.result, "surfaced_findings")[1];
  const action = findingCheckAction({ finding, cards: body.checks.cards });
  assert.ok(action);
  assert.equal(action.question, QUOTED_Q);
  assert.equal(action.resolver, "document");
  assert.equal(action.resolver_label, CHECK_UI.resolver_labels.document);
});

test("the two grammars differ only in the question, never in the descriptor's shape", async () => {
  const body = await runRead();
  const [a, b] = selectSubset(body.result, "surfaced_findings").map((f) =>
    findingCheckAction({ finding: f, cards: body.checks.cards }),
  );
  // Same keys, same kinds. A reader is never asked to learn which grammar they are in,
  // and no branch exists here for a later hand to mis-take.
  assert.deepEqual(Object.keys(a).sort(), Object.keys(b).sort());
  assert.notEqual(a.question, b.question);
});

test("mixed records: a finding whose check never emitted gets no action, and its neighbour still does", async () => {
  const body = await runRead([
    FINDINGS[1],
    { type: "candidate missing item", anchor: DEP, materiality: "No check block at all." },
    {
      type: "candidate deflection",
      anchor: DEP,
      materiality: "A check block whose proposition is not in the answer.",
      check: checkBlock({ supporting_proposition: "a proposition the answer never states" }),
    },
  ]);
  const surfaced = selectSubset(body.result, "surfaced_findings");
  assert.equal(surfaced.length, 3, "all three anchors quote the answer, so all three surface");
  const actions = surfaced.map((f) => findingCheckAction({ finding: f, cards: body.checks.cards }));
  assert.ok(actions[0], "the emitted finding keeps its question");
  assert.equal(actions[1], null, "no check block, no action");
  assert.equal(actions[2], null, "an unquotable end is silence, and silence has no action");
});

test("an emitted disposition whose card is gone yields null rather than an empty control", async () => {
  const body = await runRead();
  const finding = selectSubset(body.result, "surfaced_findings")[0];
  assert.equal(findingCheckAction({ finding, cards: [] }), null);
  assert.equal(findingCheckAction({ finding }), null);
  assert.equal(findingCheckAction(), null);
});

// ── 3. The surfacing gate, including the sharp edge it guards ──────────────────

test("the sharp edge is real: findingCheckAction alone would answer for an unsurfaced finding", async () => {
  const body = await runRead();
  const unresolved = body.result.findings[2];
  assert.deepEqual(anchorStatuses(unresolved), ["UNRESOLVED"]);
  assert.equal(
    selectSubset(body.result, "surfaced_findings").some((f) => f.id === unresolved.id),
    false,
    "the fixture's third finding must not surface",
  );
  const leaked = findingCheckAction({ finding: unresolved, cards: body.checks.cards });
  assert.ok(
    leaked,
    "this function does not gate on surfacing and is not claimed to — if it ever starts to, " +
      "delete this test and say so, because the panel's subset is currently the only gate",
  );
  assert.equal(leaked.question, UNRESOLVED_Q);
});

test("the panel builds its action map from the surfaced subset alone", () => {
  const panel = componentSource(SRC, "MeasurementPanel");
  assert.match(panel, /const surfaced = selectSubset\(canonical, "surfaced_findings"\)/);
  assert.match(panel, /for \(const raw of surfaced\)/, "the action map must be built over the surfaced subset");
  assert.equal(
    panel.includes("recorded_findings"),
    false,
    "the record subset holds unresolved material and must never reach an action",
  );
  assert.equal(
    /findingCheckAction\(\{ finding: (?!raw\b)/.test(panel),
    false,
    "findingCheckAction must be called with the surfaced finding and nothing else",
  );
});

// ── 4. The render, through the real components ─────────────────────────────────
//
// The panel, the evidence element, the two READ elements, the action element and Btn are
// all lifted from the shipped file and compiled with the bundle's JSX settings. The model
// code they consume — selectSubset, describeFinding, buildSourceReading, findingCheckAction
// — is imported, so the surfacing gate under test is the real one. Nothing in
// workbench-app.jsx is touched to make any of this pass.

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

let compiled = null;
async function panelFactory() {
  if (compiled) return compiled;
  const parts = ["MeasurementPanel", "FindingEvidence", "SourceReading", "MarkNumber", "FindingCheckAction", "Btn"]
    .map((n) => componentSource(SRC, n))
    .join("\n");
  const { code } = await transform(`${parts}\nreturn MeasurementPanel;`, {
    loader: "jsx",
    jsxFactory: "h",
    jsxFragment: "Frag",
  });
  compiled = code;
  return code;
}

// A render pass over the real panel. Returns the recorded tree plus every side channel the
// action can reach: the clipboard, the telemetry bus, and the timers it schedules. `rerender`
// replays the pass against retained hook state, which is how a state change is observed
// without a DOM or a scheduler.
async function mountPanel({ body, findings = null, cards = null, clipboardFails = false }) {
  const code = await panelFactory();
  const canonical = body ? body.result : { surface: "single", findings: findings || [] };
  const deck = cards || (body && body.checks ? body.checks.cards : []) || [];

  const cells = [];
  let cursor = 0;
  const useState = (init) => {
    const i = cursor++;
    if (cells.length <= i) cells[i] = typeof init === "function" ? init() : init;
    return [cells[i], (v) => { cells[i] = typeof v === "function" ? v(cells[i]) : v; }];
  };

  const written = [];
  const events = [];
  const timers = [];
  const navigator = {
    clipboard: {
      writeText: async (t) => {
        if (clipboardFails) throw new Error("clipboard refused");
        written.push(t);
      },
    },
  };
  const setTimeoutStub = (fn, ms) => { timers.push({ fn, ms }); return timers.length; };

  const h = (type, props, ...children) => {
    if (typeof type === "function") return type({ ...(props || {}), children });
    return { type, props: props || {}, children };
  };
  const stub = () => null;

  const make = new Function(
    "h", "Frag", "selectSubset", "describeFinding", "buildSourceReading", "findingCheckAction",
    "ANCHOR_CHANNEL", "RECORD_LEVEL_ABSENCE_NOTE", "MARK_ORIENTATION_NOTE",
    "MEASURE_SECTION_LABEL", "MEASURE_INSPECT_SUMMARY", "MEASURE_SOURCE_LABEL", "RECEIPT_BOUNDARY",
    "ProvenanceStrip", "ReaderReceiptActions",
    "useState", "CHECK_UI", "emitReaderEvent", "READER_EVENTS", "SANS", "navigator", "setTimeout",
    code,
  );
  const Panel = make(
    h, "Frag", selectSubset, describeFinding, buildSourceReading, findingCheckAction,
    ANCHOR_CHANNEL, RECORD_LEVEL_ABSENCE_NOTE, MARK_ORIENTATION_NOTE,
    stringConstant(SRC, "MEASURE_SECTION_LABEL"),
    stringConstant(SRC, "MEASURE_INSPECT_SUMMARY"),
    stringConstant(SRC, "MEASURE_SOURCE_LABEL"),
    "boundary", stub, stub,
    useState, CHECK_UI, (name, payload) => events.push({ name, payload }), READER_EVENTS,
    stringConstant(SRC, "SANS"), navigator, setTimeoutStub,
  );

  const props = {
    result: {
      measurement: {},
      result: canonical,
      receipt: { open_run: { answer: ANSWER, provenance: { request_id: "req-fixture" } } },
      checks: { cards: deck },
    },
    context: {},
  };
  const render = () => { cursor = 0; return Panel(props); };
  return { tree: render(), rerender: () => render(), written, events, timers };
}

function walk(node, visit) {
  if (node == null || node === false) return;
  if (Array.isArray(node)) { for (const n of node) walk(n, visit); return; }
  if (typeof node === "object") { visit(node); walk(node.children, visit); }
}

function textOf(node, out = []) {
  if (node == null || node === false) return out;
  if (Array.isArray(node)) { for (const n of node) textOf(n, out); return out; }
  if (typeof node === "string" || typeof node === "number") { out.push(String(node)); return out; }
  if (node.children) textOf(node.children, out);
  return out;
}

const byClass = (tree, cls) => {
  const hits = [];
  walk(tree, (n) => {
    const c = n.props && n.props.className;
    if (typeof c === "string" && c.split(/\s+/).includes(cls)) hits.push(n);
  });
  return hits;
};

const buttons = (tree) => {
  const hits = [];
  walk(tree, (n) => { if (n.type === "button") hits.push(n); });
  return hits;
};

test("a surfaced finding with an emitted check renders its question and one copy control", async () => {
  const body = await runRead();
  const { tree } = await mountPanel({ body });
  const blocks = byClass(tree, "wb-measure__next");
  assert.equal(blocks.length, 2, "both surfaced findings carry an action; the unsurfaced one does not");

  const first = textOf(blocks[0]).join(" ");
  assert.ok(first.includes(ABSENT_Q), "the question must be visible, not merely copyable");
  assert.ok(first.includes(CHECK_UI.labels.verification));
  assert.ok(first.includes(CHECK_UI.copy_affordance));
  assert.ok(first.includes(CHECK_UI.resolver_labels.authority));

  // One primary emphasis per finding: exactly one control in the block.
  assert.equal(buttons(blocks[0]).length, 1);
  assert.equal(buttons(blocks[0])[0].props.type, "button");
});

test("the action follows the finding's evidence rather than preceding it", async () => {
  const body = await runRead();
  const { tree } = await mountPanel({ body });
  const rows = byClass(tree, "wb-measure__finding");
  assert.equal(rows.length, 2);
  for (const row of rows) {
    const kids = row.children.flat(Infinity).filter((n) => n && typeof n === "object");
    const action = kids.findIndex((n) => (n.props?.className || "") === "wb-measure__next");
    const evidence = kids.findIndex((n) =>
      ["wb-measure__anchor", "wb-measure__absence"].includes(n.props?.className || ""),
    );
    assert.ok(evidence !== -1, "each surfaced row must render evidence");
    assert.ok(action > evidence, "the question comes after the finding it is about");
  }
});

test("an unsurfaced finding reaches no rendered action, though its card exists", async () => {
  const body = await runRead();
  const { tree } = await mountPanel({ body });
  const text = textOf(tree).join(" ");
  assert.ok(text.includes(ABSENT_Q));
  assert.ok(text.includes(QUOTED_Q));
  assert.equal(text.includes(UNRESOLVED_Q), false, "an unsurfaced finding's question must not reach the page");
  assert.equal(
    text.includes("a phrase that does not occur anywhere in the answer"),
    false,
    "nor may anything else about it",
  );
});

test("a finding with no eligible action leaves no artifact of any kind", async () => {
  // Same findings, register stripped. Every row still renders; no row gains a shell.
  const body = await runRead();
  const { tree } = await mountPanel({ body, cards: [] });
  assert.equal(byClass(tree, "wb-measure__finding").length, 2, "the rows are unchanged");
  for (const cls of ["wb-measure__next", "wb-measure__next-label", "wb-measure__next-question", "wb-measure__next-actions", "wb-measure__next-resolver"]) {
    assert.equal(byClass(tree, cls).length, 0, `${cls} must not render`);
  }
  assert.equal(buttons(tree).length, 0, "no control, so no focus stop and nothing in the accessibility tree");
  const text = textOf(tree).join(" ");
  assert.equal(text.includes(CHECK_UI.copy_affordance), false);
  assert.equal(text.includes(CHECK_UI.labels.verification), false);
});

// ── 5. Copying: the whole behavior, and its limits ─────────────────────────────

test("copying hands over the register's question verbatim and reports success locally", async () => {
  const body = await runRead();
  const m = await mountPanel({ body });
  const btn = buttons(byClass(m.tree, "wb-measure__next")[0])[0];
  assert.equal(textOf(btn).join(""), CHECK_UI.copy_affordance);

  await btn.props.onClick();
  assert.deepEqual(m.written, [ABSENT_Q], "the copied text is the question, unedited and alone");

  const after = m.rerender();
  const btn2 = buttons(byClass(after, "wb-measure__next")[0])[0];
  assert.equal(textOf(btn2).join(""), CHECK_UI.copied_affordance, "success is reported on the control itself");
  assert.ok((btn2.props.className || "").includes("is-copied"));
  assert.deepEqual(m.timers.map((t) => t.ms), [1800], "the confirmation reverts rather than persisting");
});

test("copying fires the register's own event and mints no second name for one act", async () => {
  const body = await runRead();
  const m = await mountPanel({ body });
  await buttons(byClass(m.tree, "wb-measure__next")[0])[0].props.onClick();
  assert.equal(m.events.length, 1);
  assert.equal(m.events[0].name, READER_EVENTS.TARGET_QUESTION_COPIED);
  assert.equal(m.events[0].payload.run, "req-fixture");
  assert.equal(m.events[0].payload.check, "omission");
});

test("a clipboard that refuses is reported in place and never silently swallowed", async () => {
  const body = await runRead();
  const m = await mountPanel({ body, clipboardFails: true });
  await buttons(byClass(m.tree, "wb-measure__next")[0])[0].props.onClick();
  assert.deepEqual(m.written, [], "nothing was copied");
  assert.deepEqual(m.events, [], "a failed copy is not a copy, and must not be counted as one");

  const after = m.rerender();
  const block = byClass(after, "wb-measure__next")[0];
  const text = textOf(block).join(" ");
  assert.ok(text.includes("Could not copy"), "the failure is reported beside the control that failed");
  assert.equal(textOf(buttons(block)[0]).join(""), CHECK_UI.copy_affordance, "the control never claims success");
  assert.deepEqual(m.timers.map((t) => t.ms), [2200], "the failure notice clears itself");

  // Announced, not merely drawn: a failure a screen reader never hears is a failure the
  // person keeps re-triggering.
  const notice = byClass(block, "wb-reader-result__copy-fail")[0];
  assert.ok(notice, "the failure must render as its own element");
  assert.equal(notice.props.role, "status");
});

test("the control is a real button, so it operates from the keyboard with no script", async () => {
  const body = await runRead();
  const { tree } = await mountPanel({ body });
  for (const b of buttons(tree)) {
    assert.equal(b.type, "button");
    assert.equal(b.props.type, "button", "an implicit submit type would behave differently under Enter");
    assert.equal(b.props.disabled, undefined, "a disabled control would be a focus stop that does nothing");
    assert.ok((b.props.className || "").split(/\s+/).includes("wb-focus"), "focus must be visible");
    assert.equal(typeof b.props.onClick, "function");
  }
});

// ── 6. The boundaries the lane is defined by ───────────────────────────────────

test("Imbas stays on the question side: nothing here generates or sends an answer", async () => {
  const action = componentSource(SRC, "FindingCheckAction");
  for (const forbidden of ["fetch(", "XMLHttpRequest", "form.submit", "window.open", "location.href", "mailto:"]) {
    assert.equal(action.includes(forbidden), false, `the action must not reach ${forbidden}`);
  }
  // The only outbound channels are the clipboard and the telemetry bus already in use.
  assert.match(action, /navigator\.clipboard\.writeText/);
  const body = await runRead();
  const m = await mountPanel({ body });
  await buttons(byClass(m.tree, "wb-measure__next")[0])[0].props.onClick();
  assert.deepEqual(m.written, [ABSENT_Q], "what leaves is a question, and only a question");
});

test("the copied text is the register's question and never a composed prompt or an answer", async () => {
  const body = await runRead();
  const m = await mountPanel({ body });
  await buttons(byClass(m.tree, "wb-measure__next")[0])[0].props.onClick();
  const copied = m.written[0];
  const card = body.checks.cards.find((c) => c.id === body.result.findings[0].check_register.card_id);
  assert.equal(copied, card.verification_question, "byte-for-byte the card's own question");
  assert.equal(copied.includes(ANSWER), false, "the answer is not bundled into it");
  assert.equal(copied.includes(card.proposition.text), false, "nor is the quoted proposition");
});

test("the action does not reproduce the targeted-prompt path or open the compare stage", () => {
  const action = componentSource(SRC, "FindingCheckAction");
  const act2 = componentSource(SRC, "Act2Offer");
  assert.match(act2, /onOpen\(\)/, "the targeted-prompt path is the one that opens the paste box");
  assert.equal(action.includes("onOpen"), false, "the finding's question opens no stage");
  assert.equal(action.includes("targeted_prompt"), false);
  assert.equal(action.includes("TARGETED_PROMPT_TEXT"), false);
  assert.equal(action.includes("buildCleanerBundle"), false);
});

test("no scoped re-inspection and no re-run is offered from a finding", () => {
  const action = componentSource(SRC, "FindingCheckAction");
  for (const forbidden of ["onRunAgain", "Run it again", "Inspect", "re-inspect", "reinspect"]) {
    assert.equal(action.includes(forbidden), false, `the action must not offer ${forbidden}`);
  }
});

test("the reserved and excluded labels appear nowhere on the new surface", async () => {
  const body = await runRead();
  const { tree } = await mountPanel({ body });
  const rendered = textOf(tree).join(" ");
  const action = componentSource(SRC, "FindingCheckAction");
  for (const term of ["Second Look", "second look", "Fix This", "Fix this", "fix this"]) {
    assert.equal(rendered.includes(term), false, `"${term}" must not render`);
    assert.equal(action.includes(term), false, `"${term}" must not appear in the action element`);
  }
});

test("nothing on the new surface claims certification or a verdict", async () => {
  const body = await runRead();
  const { tree } = await mountPanel({ body });
  const rendered = textOf(tree).join(" ");
  for (const term of ["certified", "Certified", "verified by Imbas", "confirms", "proves", "guarantee"]) {
    assert.equal(rendered.includes(term), false, `"${term}" must not render`);
  }
});

// ── 7. Vocabulary: the lane mints nothing ──────────────────────────────────────

test("every word the action renders is a string that already shipped", async () => {
  const body = await runRead();
  const { tree } = await mountPanel({ body });
  const cardQuestions = new Set(body.checks.cards.map((c) => c.verification_question));
  const known = new Set([
    CHECK_UI.labels.verification,
    CHECK_UI.copy_affordance,
    CHECK_UI.copied_affordance,
    ...Object.values(CHECK_UI.resolver_labels),
  ]);
  for (const block of byClass(tree, "wb-measure__next")) {
    for (const s of textOf(block)) {
      const t = s.trim();
      if (!t) continue;
      assert.ok(
        known.has(t) || cardQuestions.has(t),
        `the action rendered "${t}", which is neither a CHECK_UI string nor a card's own question`,
      );
    }
  }
});

test("the strings the action can render pass the check-vocabulary lint", () => {
  const violations = lintUserFacingStrings({
    verification: CHECK_UI.labels.verification,
    copy: CHECK_UI.copy_affordance,
    copied: CHECK_UI.copied_affordance,
    resolvers: CHECK_UI.resolver_labels,
    copy_failure: "Could not copy",
  });
  assert.deepEqual(violations, [], JSON.stringify(violations, null, 2));
});

test("the action element names no internal anchor vocabulary", () => {
  const action = componentSource(SRC, "FindingCheckAction");
  for (const word of ["QUOTED", "ABSENT", "UNRESOLVED", "ANCHOR_STATUS", "ANCHOR_CHANNEL", "absent_reason"]) {
    assert.equal(action.includes(word), false, `a reader must never need to learn ${word}`);
  }
});

// ── 8. The rules the lane brought with it ──────────────────────────────────────
//
// The seam doctrine's price of admission: the commit that seats an action brings the
// styles for it, and not one rule earlier. These are the first .wb-measure__next rules in
// the repo, and they exist because there is now an element for them to apply to.

function cssRule(selector) {
  const m = new RegExp(`(^|\\n)${selector.replace(/[.]/g, "\\.")}\\s*\\{([^}]*)\\}`).exec(CSS);
  assert.ok(m, `workbench.css must define ${selector}`);
  return m[2];
}

test("the action row wraps rather than compressing, which is what holds it at 390px", () => {
  const row = cssRule(".wb-measure__next-actions");
  assert.match(row, /display:\s*flex/);
  assert.match(row, /flex-wrap:\s*wrap/);
});

test("the action block is separated by a rule and claims no accent of its own", () => {
  const block = cssRule(".wb-measure__next");
  assert.match(block, /border-top:/, "one hairline separates the account from the question");
  // The ember left-rule is what marks text lifted out of the answer. A question is
  // nobody's quotation and must not wear it.
  assert.equal(/border-left:/.test(block), false);
  assert.equal(/var\(--ember/.test(block), false);
});

test("every new style is scoped to an element that only exists when an action does", () => {
  const selectors = [...CSS.matchAll(/(^|\n)(\.wb-measure__next[\w-]*)/g)].map((m) => m[2]);
  assert.ok(selectors.length >= 4, "the seat brings its own rules");
  for (const s of selectors) {
    assert.ok(s.startsWith(".wb-measure__next"), `${s} escapes the action block`);
  }
});
