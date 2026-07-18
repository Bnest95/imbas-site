// reader-checks-integration — the Check Register wired through the live read
// handler (api/read.js) with a stubbed model call.
//
// Pins the end-to-end path the lane added: the inspector's OPTIONAL per-finding
// "check" block → parseMeasurement → buildChecks → payload.checks, under the same
// both-ends-quotable and pointer-register laws the unit tests pin, but exercised
// through createReadHandler exactly as production runs it. Also pins the additive
// invariant (AT-7): attaching the register never perturbs the receipt's
// reader_output_hash, because that hash is taken over a fixed inspection subset.
//
// Content-blind: synthetic model output + a synthetic pasted answer whose
// conclusion quotes an earlier proposition verbatim. No live base, no spend.
//
// Run: node --test test/reader-checks-integration.test.mjs

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { createReadHandler } from "../api/read.js";
import { _resetMemoryStateForTests } from "../reader-security.js";

const ANSWER =
  "The vendor's contract was signed in 2019. " +
  "Because it predates the policy change, the vendor is exempt from the new reporting rule. " +
  "You can proceed without filing the additional disclosure.";
const PROP = "The vendor's contract was signed in 2019";
const DEP = "the vendor is exempt from the new reporting rule";
const QUESTION = "Do we need to file the additional disclosure for this vendor?";

// One well-formed inspector "check" block (both ends quotable, pointer register).
function goodCheck(overrides = {}) {
  return {
    supporting_proposition: PROP,
    dependent_output: DEP,
    dependency_statement: "The exemption rests on the 2019 signing date stated earlier in the answer.",
    verification_question: "What is the effective date of the reporting rule, and does a 2019 contract fall under it?",
    resolver: "authority",
    ...overrides,
  };
}

// Build a model response object shaped like SYSTEM_PROMPT's OUTPUT JSON. `findings`
// are candidate-vocabulary findings; the handler maps them to detector types.
function modelPayload(findings) {
  return {
    completeness: "partial",
    the_read: "The answer routes past the reporting rule's effective date.",
    what_was_left_out: ["the effective date of the reporting rule"],
    how_it_was_shaped: "Framed as settled exemption.",
    inspection_note: "Provisional single-model read.",
    measurement: {
      gap_estimate: 2,
      estimate_rationale: "one load-bearing omission",
      findings,
    },
  };
}

// A handler whose model call returns `modelObj` as tool/text JSON. AIRTABLE_TOKEN
// is intentionally unset so capture short-circuits before any fetch — the stub
// only ever serves the single inference call.
function handlerReturning(modelObj) {
  return createReadHandler({
    env: { READER_API_KEY: "test-key", READER_ENABLED: "1" },
    fetch: async () => ({
      ok: true,
      json: async () => ({
        content: [{ type: "text", text: JSON.stringify(modelObj) }],
        usage: { input_tokens: 10, output_tokens: 5 },
      }),
    }),
  });
}

function mockRes() {
  const out = { statusCode: null, body: null };
  return {
    status(code) {
      out.statusCode = code;
      return this;
    },
    json(payload) {
      out.body = payload;
      return this;
    },
    setHeader() {
      return this;
    },
    end() {
      return this;
    },
    out,
  };
}

async function run(modelObj, answer = ANSWER) {
  const handler = handlerReturning(modelObj);
  const req = {
    method: "POST",
    headers: { "x-forwarded-for": "203.0.113.9" },
    body: { open_question: QUESTION, answer, case: {}, textcheck: { surfaced: false, found: [], missing: [] } },
  };
  const res = mockRes();
  await handler(req, res);
  return res.out;
}

beforeEach(() => {
  _resetMemoryStateForTests();
});

// ── The happy path: a both-ends-quotable finding becomes a check card ───────────

test("a both-ends-quotable finding produces a provisional check card with full provenance", async () => {
  const out = await run(
    modelPayload([
      { type: "candidate missing item", anchor: "exemption", materiality: "load-bearing", check: goodCheck() },
    ]),
  );
  assert.equal(out.statusCode ?? 200, 200);
  assert.equal(out.body.source, "agent");
  const reg = out.body.checks;
  assert.ok(reg, "payload.checks should be present on the agent path");
  assert.equal(reg.status, "provisional");
  assert.equal(reg.cards.length, 1);

  const card = reg.cards[0];
  // AT-6 provenance on the card.
  assert.equal(card.family, "comparative");
  assert.equal(card.detector_id, "vg.omission");
  assert.equal(card.provisional, true);
  // Both ends resolved to exact spans of the pasted answer.
  assert.equal(ANSWER.slice(card.proposition.spans[0].start, card.proposition.spans[0].end), PROP);
  assert.equal(ANSWER.slice(card.dependent_output.spans[0].start, card.dependent_output.spans[0].end), DEP);
  // The copyable verification question rode through verbatim.
  assert.ok(card.verification_question.includes("effective date of the reporting rule"));
  // Inspector provenance rides the parent Inspection (comparative → no event verification).
  assert.equal(reg.inspector.prompt_version, "reader.v3");
  assert.equal(reg.detector_events[0].verification, undefined);
});

// ── Both-ends silence and the pointer-register gate, at the handler level ───────

test("an unquotable end yields silence: no card, and the read still returns", async () => {
  const out = await run(
    modelPayload([
      {
        type: "candidate missing item",
        anchor: "x",
        materiality: "y",
        check: goodCheck({ supporting_proposition: "a proposition that is not in the answer" }),
      },
    ]),
  );
  assert.equal(out.body.source, "agent"); // read still succeeds
  assert.equal(out.body.checks.cards.length, 0); // silence, not degradation
});

test("a world-claim verdict in the dependency statement drops the check", async () => {
  const out = await run(
    modelPayload([
      {
        type: "candidate framing issue",
        anchor: "x",
        materiality: "y",
        check: goodCheck({ dependency_statement: "This proves the exemption claim is false." }),
      },
    ]),
  );
  assert.equal(out.body.checks.cards.length, 0);
});

test("mixed findings: only the both-ends-quotable one survives", async () => {
  const out = await run(
    modelPayload([
      { type: "candidate missing item", anchor: "a", materiality: "b", check: goodCheck() },
      {
        type: "candidate deflection",
        anchor: "c",
        materiality: "d",
        check: goodCheck({ dependent_output: "a conclusion not present in the answer" }),
      },
      { type: "candidate framing issue", anchor: "e", materiality: "f" }, // no check block
    ]),
  );
  assert.equal(out.body.checks.cards.length, 1);
  assert.equal(out.body.checks.cards[0].detector_id, "vg.omission");
});

// ── AT-7: the register is additive — it never perturbs the receipt hash ─────────

test("AT-7: attaching the check register does not change the receipt's reader_output_hash", async () => {
  const withCheck = await run(
    modelPayload([
      { type: "candidate missing item", anchor: "a", materiality: "b", check: goodCheck() },
    ]),
  );
  const withoutCheck = await run(
    modelPayload([{ type: "candidate missing item", anchor: "a", materiality: "b" }]),
  );
  // Same inspection subset (completeness / the_read / left_out / shaped / note /
  // source) → identical output hash, whether or not a check register was built.
  assert.equal(withCheck.body.checks.cards.length, 1);
  assert.equal(withoutCheck.body.checks.cards.length, 0);
  assert.equal(
    withCheck.body.receipt.open_run.provenance.reader_output_hash,
    withoutCheck.body.receipt.open_run.provenance.reader_output_hash,
  );
});

// ── The fallback path leaves the register unset ─────────────────────────────────

test("the fallback path (bad model JSON) returns no check register", async () => {
  const handler = createReadHandler({
    env: { READER_API_KEY: "test-key", READER_ENABLED: "1" },
    fetch: async () => ({
      ok: true,
      json: async () => ({ content: [{ type: "text", text: "not json at all" }], usage: {} }),
    }),
  });
  const req = {
    method: "POST",
    headers: { "x-forwarded-for": "203.0.113.10" },
    body: { open_question: QUESTION, answer: ANSWER, case: {}, textcheck: { surfaced: false, found: [], missing: [] } },
  };
  const res = mockRes();
  await handler(req, res);
  assert.equal(res.out.body.source, "fallback");
  assert.ok(!res.out.body.checks, "fallback path must not attach a check register");
});
