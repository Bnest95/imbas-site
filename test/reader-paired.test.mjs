// Reader v2 P2 — the paired flow (Act 2). One file, the twelve concerns the pass
// must hold, plus a fingerprint that pins the frozen paired-analysis prompt to
// paired_method_version 1.0:
//   1. offer gating against observable capacity (eligibility + spend gate)
//   2. deterministic prompt construction + hash (paired_method_version 1.0)
//   3. delta assembly (parse/validate the model's paired measurement)
//   4. paired estimate bounds + label
//   5. paired envelope canonicalization + hash stability across key-order perms
//   6. open_run receipt gate (shape + integrity) and open_run_id linkage
//   7. paired endpoint behind the limiter
//   8. double-submit idempotency (no second model call, no duplicate row)
//   9. paired-write retry + capture_uncertain flag
//  10. share containment in paired state (paired write never touches Shares)
//  11. failure isolation on a failed second read (Act 1 intact, no row written)
//  12. graceful handling of runs with no paired analysis
// Run: node --test test/reader-paired.test.mjs

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

import {
  createReadPairedHandler,
  PAIRED_SYSTEM_PROMPT,
  PAIRED_PROMPT_VERSION,
  parsePairedMeasurement,
  validateOpenReceipt,
  verifyReceiptIntegrity,
  capturePaired,
} from "../api/read-paired.js";
import { createRuntimeContext } from "../reader-runtime.js";
import { PAIRED_METHOD_VERSION, buildTargetedPrompt, TARGETED_PROMPT_TEXT } from "../reader-paired.js";
import {
  RECEIPT_SCHEMA_VERSION,
  RECEIPT_BOUNDARY,
  buildSingleReceipt,
  buildPairedReceipt,
  canonicalizeForHash,
  pairedGapEstimateLabel,
} from "../reader-receipt.js";
import {
  _resetMemoryStateForTests,
  _seedMemoryRateCountForTests,
  addGlobalSpend,
  hashClientIp,
  RATE_BURST_MAX,
} from "../reader-security.js";

const sha256Hex = (s) => createHash("sha256").update(String(s), "utf8").digest("hex");

// The frozen fingerprint of PAIRED_SYSTEM_PROMPT under paired_method_version 1.0.
// If the prompt is edited without deliberately bumping the method version, this
// fails — the same guard reader-prompt-version.test.mjs puts on the single read.
const PAIRED_PROMPT_FINGERPRINT_1_0 =
  "aab000bbc21d08b028edae09ce7e31377d1ea9f7e81df69f234d36cf864d3f70";

const PAIRED_TABLE_ID = "tblP1ekWWWscz6pBG"; // Reader Paired Analyses
const SHARES_TABLE_ID = "tbliYeeM5n0TSVrxf"; // Inspection Shares — never touched by a paired write

const ENV = { READER_API_KEY: "test-key", READER_ENABLED: "1", AIRTABLE_TOKEN: "test-token" };
const TARGETED_ANSWER =
  "Here is the second answer. It names the failure modes the first one left out: acute cases can be misrouted, and the clinician still carries the liability when the model is wrong.";

let ipCounter = 20;
let ridCounter = 1;
const hexId = (seed) => sha256Hex(`openrun:${seed}`).slice(0, 16);

// A parsed P1 measurement as it sits embedded on the open receipt. With eligible
// true it carries a candidate missing item (with materiality), the one finding
// type that makes the offer eligible; with eligible false it carries only a framing
// issue, so buildTargetedPrompt returns eligible:false and no offer exists.
function openMeasurement(eligible = true) {
  const findings = eligible
    ? [
        {
          type: "candidate missing item",
          anchor: "smoother workflows",
          materiality: "the failure modes are never named",
        },
        { type: "candidate framing issue", anchor: "reduce wait times", materiality: "benefit-forward" },
      ]
    : [{ type: "candidate framing issue", anchor: "reduce wait times", materiality: "benefit-forward" }];
  return {
    findings,
    finding_counts: {
      "candidate missing item": eligible ? 1 : 0,
      "candidate framing issue": 1,
      "candidate deflection": 0,
    },
    gap_estimate: 2,
    estimate_rationale: "material context missing",
    estimate_type: "candidate_gap",
    estimate_scale_version: "1.0",
    candidate_method_version: "1.0",
    unvalidated: true,
  };
}

// A hash-valid single receipt: the client-held, server-signed open run the paired
// endpoint consumes. content_hash is computed last, exactly as the server does, so
// verifyReceiptIntegrity passes until a test deliberately tampers with it.
function buildOpenReceipt({ eligible = true, requestId } = {}) {
  const rid = requestId || hexId(ridCounter++);
  const receipt = buildSingleReceipt({
    generatedAt: "2026-07-09T00:00:00.000Z",
    question: "What are the risks of relying on AI for triage?",
    topic: "triage",
    declaredModel: "GPT-5",
    answer: "AI triage can speed intake. It reduces wait times.",
    inspection: {
      completeness: "partial",
      the_read: "vendor-summary read",
      what_was_left_out: ["failure modes"],
      how_it_was_shaped: "benefit-forward",
      inspection_note: "",
    },
    measurement: openMeasurement(eligible),
    provenance: {
      reader_model_version: "claude-opus-4-8",
      inspector_prompt_version: "reader.v2",
      inspector_run_conditions: { thinking: "adaptive", max_tokens: 8192, temperature: "default" },
      source_content_hash: sha256Hex("src"),
      reader_output_hash: sha256Hex("out"),
      run_timestamp: "2026-07-09T00:00:00.000Z",
      request_id: rid,
    },
  });
  receipt.integrity.content_hash = sha256Hex(canonicalizeForHash(receipt));
  return receipt;
}

// A paired measurement as the model would emit it (pre-parse shape).
function sampleModelPaired(over = {}) {
  return {
    delta_items: [
      {
        type: "delta",
        point: "No failure modes named",
        open_side: "reduces wait times",
        targeted_side: "acute cases can be misrouted",
        signal_pattern: "Omission",
      },
      {
        type: "delta",
        point: "Liability sidestepped",
        open_side: "",
        targeted_side: "the clinician still owns the call",
        signal_pattern: "Deflection",
      },
    ],
    gap_estimate: 2,
    estimate_rationale: "counted only decision-relevant deltas, not the second answer's added length",
    ...over,
  };
}

// One mock fetch, three branches: the model (anthropic), the idempotency read
// (airtable GET), and the capture write (airtable POST). Every call's url is
// recorded so share-containment can be asserted; capture bodies are captured for
// field assertions.
function makePairedFetch(opts = {}) {
  const stats = { anthropic: 0, get: 0, post: 0, urls: [], captureBodies: [] };
  const okModel = () => ({
    ok: true,
    json: async () => ({
      content: [{ type: "text", text: JSON.stringify(opts.measurement || sampleModelPaired()) }],
      usage: { input_tokens: 20, output_tokens: 10 },
    }),
  });
  const fetchImpl = async (url, o = {}) => {
    const u = String(url);
    stats.urls.push(u);
    if (u.includes("anthropic")) {
      stats.anthropic++;
      return opts.model ? opts.model(stats.anthropic) : okModel();
    }
    const method = (o && o.method) || "GET";
    if (method === "GET") {
      stats.get++;
      return { ok: true, json: async () => ({ records: opts.existingRecord ? [opts.existingRecord] : [] }) };
    }
    stats.post++;
    stats.captureBodies.push(o && o.body ? JSON.parse(o.body) : null);
    return opts.capture ? opts.capture(stats.post) : { ok: true, json: async () => ({ id: "recPaired1" }) };
  };
  return { fetchImpl, stats };
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

async function runPaired({ receipt, answer = TARGETED_ANSWER, fetchOpts = {}, env = ENV, ip } = {}) {
  const { fetchImpl, stats } = makePairedFetch(fetchOpts);
  const handler = createReadPairedHandler({ env, fetch: fetchImpl });
  const clientIp = ip || `198.51.100.${ipCounter++}`;
  const req = { method: "POST", headers: { "x-forwarded-for": clientIp }, body: { open_receipt: receipt, targeted_answer: answer } };
  const res = mockRes();
  await handler(req, res);
  return { status: res.out.statusCode, body: res.out.body, stats, ip: clientIp };
}

// Reverse key order at every object level — proves canonical form is order-free.
function reverseKeys(v) {
  if (Array.isArray(v)) return v.map(reverseKeys);
  if (v && typeof v === "object") {
    const out = {};
    for (const k of Object.keys(v).reverse()) out[k] = reverseKeys(v[k]);
    return out;
  }
  return v;
}

function buildSamplePairedReceipt() {
  const openRun = buildOpenReceipt().open_run;
  const r = buildPairedReceipt({
    generatedAt: "2026-07-09T00:00:00.000Z",
    openRun,
    pairedAnalysis: {
      open_run_id: openRun.provenance.request_id,
      targeted_prompt: "line one\r\nline two",
      targeted_prompt_hash: sha256Hex("p"),
      targeted_answer: "second answer",
      targeted_answer_hash: sha256Hex("second answer"),
      delta_items: sampleModelPaired().delta_items.map((d) => ({
        point: d.point,
        open_side: d.open_side,
        targeted_side: d.targeted_side,
        signal_pattern: d.signal_pattern,
      })),
      gap_estimate: 2,
      estimate_rationale: "counted only material deltas",
      estimate_type: "paired_gap",
      rubric_version: "1.0",
      paired_method_version: "1.0",
    },
  });
  r.integrity.content_hash = sha256Hex(canonicalizeForHash(r));
  return r;
}

beforeEach(() => {
  _resetMemoryStateForTests();
});

// ── Fingerprint: the frozen paired prompt is pinned to method version 1.0 ──────

test("PAIRED_SYSTEM_PROMPT fingerprint matches the pin for paired_method_version 1.0", () => {
  assert.equal(sha256Hex(PAIRED_SYSTEM_PROMPT), PAIRED_PROMPT_FINGERPRINT_1_0);
});

test("PAIRED_PROMPT_VERSION tracks paired_method_version (single source of truth)", () => {
  assert.equal(PAIRED_PROMPT_VERSION, PAIRED_METHOD_VERSION);
  assert.equal(PAIRED_METHOD_VERSION, "1.1");
});

// ── 2. Deterministic prompt construction + hash ───────────────────────────────

test("buildTargetedPrompt is deterministic: same measurement in, same prompt + hash out", () => {
  const measurement = openMeasurement(true);
  const question = "What are the risks of relying on AI for triage?";
  const a = buildTargetedPrompt({ question, measurement });
  const b = buildTargetedPrompt({ question, measurement });
  assert.equal(a.eligible, true);
  assert.equal(a.targeted_prompt, b.targeted_prompt);
  assert.equal(sha256Hex(a.targeted_prompt), sha256Hex(b.targeted_prompt));
});

test("the targeted prompt is the fixed non-leading probe, naming none of the findings", () => {
  const question = "What are the risks of relying on AI for triage?";
  const { targeted_prompt } = buildTargetedPrompt({ question, measurement: openMeasurement(true) });
  // The fixed probe (paired_method_version 1.1): an eligible run yields exactly the
  // constant, and it must not echo the question or name any measured finding — a
  // probe that listed the omissions would hand the second read its answer.
  assert.equal(targeted_prompt, TARGETED_PROMPT_TEXT);
  assert.ok(!targeted_prompt.includes(question), "the probe does not restate the open question");
  assert.ok(
    !targeted_prompt.includes("the failure modes are never named"),
    "the probe does not fold in the candidate materiality",
  );
  assert.ok(!/\r/.test(targeted_prompt), "line endings are normalized to LF");
});

test("no candidate missing item means no offer: eligible is false and the prompt is empty", () => {
  const r = buildTargetedPrompt({ question: "q", measurement: openMeasurement(false) });
  assert.equal(r.eligible, false);
  assert.equal(r.targeted_prompt, "");
});

// ── 3. Delta assembly (parsePairedMeasurement) ────────────────────────────────

test("parsePairedMeasurement maps each delta to the four-field shape and counts signals", () => {
  const pm = parsePairedMeasurement(sampleModelPaired());
  assert.equal(pm.delta_items.length, 2);
  assert.deepEqual(Object.keys(pm.delta_items[0]).sort(), ["open_side", "point", "signal_pattern", "targeted_side"]);
  assert.equal(pm.delta_items[0].signal_pattern, "Omission");
  assert.equal(pm.delta_items[1].open_side, ""); // clean omission -> empty span, not thrown away
  assert.deepEqual(pm.signal_counts, { Omission: 1, "Framing Drift": 0, Deflection: 1 });
  assert.equal(pm.estimate_type, "paired_gap");
  assert.equal(pm.paired_method_version, "1.1");
  assert.equal(pm.unvalidated, true);
});

test("parsePairedMeasurement drops items with an invalid signal pattern or an empty point", () => {
  const pm = parsePairedMeasurement({
    delta_items: [
      { point: "kept", open_side: "a", targeted_side: "b", signal_pattern: "Omission" },
      { point: "bad pattern", open_side: "a", targeted_side: "b", signal_pattern: "Verdict" },
      { point: "   ", open_side: "a", targeted_side: "b", signal_pattern: "Deflection" },
    ],
    gap_estimate: 1,
    estimate_rationale: "r",
  });
  assert.equal(pm.delta_items.length, 1);
  assert.equal(pm.delta_items[0].point, "kept");
});

test("an empty delta list with a finite estimate is a valid result, not a failure", () => {
  const pm = parsePairedMeasurement({ delta_items: [], gap_estimate: 0, estimate_rationale: "nothing material" });
  assert.ok(pm, "empty delta is a real measurement");
  assert.deepEqual(pm.delta_items, []);
  assert.equal(pm.gap_estimate, 0);
  assert.deepEqual(pm.signal_counts, { Omission: 0, "Framing Drift": 0, Deflection: 0 });
});

test("a non-object or array paired body parses to null", () => {
  assert.equal(parsePairedMeasurement(null), null);
  assert.equal(parsePairedMeasurement([]), null);
  assert.equal(parsePairedMeasurement("nope"), null);
});

// ── 4. Paired estimate bounds + label ─────────────────────────────────────────

test("gap estimate is rounded then clamped into 0-3", () => {
  assert.equal(parsePairedMeasurement(sampleModelPaired({ gap_estimate: 9 })).gap_estimate, 3);
  assert.equal(parsePairedMeasurement(sampleModelPaired({ gap_estimate: -4 })).gap_estimate, 0);
  assert.equal(parsePairedMeasurement(sampleModelPaired({ gap_estimate: 1.6 })).gap_estimate, 2);
});

test("a non-finite gap estimate nulls the whole paired measurement", () => {
  assert.equal(parsePairedMeasurement(sampleModelPaired({ gap_estimate: "not a number" })), null);
});

test("pairedGapEstimateLabel is the machine-estimate unvalidated label, distinct from the single label", () => {
  assert.equal(pairedGapEstimateLabel(0), "Machine gap estimate: 0 of 3 (unvalidated)");
  assert.equal(pairedGapEstimateLabel(2), "Machine gap estimate: 2 of 3 (unvalidated)");
  assert.equal(pairedGapEstimateLabel(3), "Machine gap estimate: 3 of 3 (unvalidated)");
});

// ── 5. Paired envelope canonicalization + hash stability ──────────────────────

test("paired canonicalization is independent of object key insertion order", () => {
  const a = buildSamplePairedReceipt();
  const b = reverseKeys(a);
  assert.notEqual(Object.keys(a)[0], Object.keys(b)[0]);
  assert.equal(canonicalizeForHash(a), canonicalizeForHash(b));
  assert.equal(sha256Hex(canonicalizeForHash(a)), sha256Hex(canonicalizeForHash(b)));
});

test("paired content_hash is excluded from its own hash input", () => {
  // One envelope, two copies — only the stored content_hash differs.
  const base = buildSamplePairedReceipt();
  const a = structuredClone(base);
  const b = structuredClone(base);
  a.integrity.content_hash = "one-value";
  b.integrity.content_hash = "a-different-value";
  const ca = canonicalizeForHash(a);
  assert.ok(ca.includes('"content_hash":null'));
  assert.equal(ca, canonicalizeForHash(b)); // stored hash value never leaks into the canonical input
});

test("a stored paired content_hash verifies by recomputation and normalizes CRLF", () => {
  const e = buildSamplePairedReceipt();
  const recomputed = sha256Hex(canonicalizeForHash(e));
  assert.match(e.integrity.content_hash, /^[0-9a-f]{64}$/);
  assert.equal(recomputed, e.integrity.content_hash);
  assert.ok(!canonicalizeForHash(e).includes("\\r"), "no carriage returns survive canonicalization");
  assert.equal(e.receipt_type, "paired");
  assert.equal(e.paired_analysis.gap_estimate_label, pairedGapEstimateLabel(2));
});

// ── 6. Open-run receipt gate + linkage ────────────────────────────────────────

test("validateOpenReceipt accepts a well-formed single receipt", () => {
  assert.deepEqual(validateOpenReceipt(buildOpenReceipt()), { ok: true });
});

test("validateOpenReceipt rejects the wrong shape, type, missing provenance, and missing integrity", () => {
  assert.equal(validateOpenReceipt(null).reason, "shape");
  const paired = buildSamplePairedReceipt();
  assert.equal(validateOpenReceipt(paired).reason, "type"); // receipt_type "paired" is not an open receipt
  const noProv = buildOpenReceipt();
  noProv.open_run.provenance.request_id = "";
  assert.equal(validateOpenReceipt(noProv).reason, "provenance");
  const noInteg = buildOpenReceipt();
  delete noInteg.integrity;
  assert.equal(validateOpenReceipt(noInteg).reason, "integrity");
});

test("verifyReceiptIntegrity fails once the signed receipt is tampered with", () => {
  const r = buildOpenReceipt();
  assert.equal(verifyReceiptIntegrity(r), true);
  r.open_run.answer += " tampered after signing";
  assert.equal(verifyReceiptIntegrity(r), false);
});

test("endpoint: a happy-path pair renders the delta, labels the estimate, and links to the open run", async () => {
  const receipt = buildOpenReceipt();
  const openRunId = receipt.open_run.provenance.request_id;
  const { status, body, stats } = await runPaired({ receipt });
  assert.equal(status, 200);
  assert.equal(body.source, "agent");
  assert.equal(body.idempotent, false);
  assert.equal(body.delta_items.length, 2);
  for (const d of body.delta_items) {
    assert.deepEqual(Object.keys(d).sort(), ["open_side", "point", "signal_pattern", "targeted_side"]);
  }
  assert.equal(body.gap_estimate_label, pairedGapEstimateLabel(body.gap_estimate));
  assert.equal(body.estimate_type, "paired_gap");
  assert.equal(body.paired_method_version, "1.1");
  assert.equal(body.unvalidated, true);
  // receipt: paired, hash-valid, and carries the boundary
  assert.equal(body.receipt.receipt_type, "paired");
  assert.equal(body.receipt.boundary, RECEIPT_BOUNDARY);
  assert.match(body.receipt.integrity.content_hash, /^[0-9a-f]{64}$/);
  assert.equal(sha256Hex(canonicalizeForHash(body.receipt)), body.receipt.integrity.content_hash);
  // open_run_id linkage: on the receipt and on the captured row
  assert.equal(body.receipt.paired_analysis.open_run_id, openRunId);
  const fields = stats.captureBodies[0].fields;
  assert.equal(fields["Open Run ID"], openRunId);
  assert.equal(fields["Paired Method Version"], "1.1");
  assert.equal(fields["Estimate Type"], "paired_gap");
  assert.equal(fields["Schema Version"], RECEIPT_SCHEMA_VERSION);
  assert.equal(fields["Targeted Answer Hash"], sha256Hex(TARGETED_ANSWER));
  const expectedPrompt = buildTargetedPrompt({
    question: receipt.open_run.question,
    measurement: receipt.open_run.measurement,
  }).targeted_prompt;
  assert.equal(fields["Targeted Prompt Hash"], sha256Hex(expectedPrompt));
});

test("endpoint: a malformed open receipt is refused before any paid work", async () => {
  const { status, body, stats } = await runPaired({ receipt: { receipt_type: "single" } });
  assert.equal(status, 400);
  assert.equal(body.error, "invalid_receipt");
  assert.equal(body.detail, "open_run");
  assert.equal(stats.anthropic, 0);
});

test("endpoint: a tampered open receipt is rejected on the integrity hash", async () => {
  const receipt = buildOpenReceipt();
  receipt.open_run.answer += " tampered";
  const { status, body, stats } = await runPaired({ receipt });
  assert.equal(status, 400);
  assert.equal(body.error, "invalid_receipt");
  assert.equal(body.detail, "integrity");
  assert.equal(stats.anthropic, 0);
});

// ── 1/7. Offer gating against observable capacity ─────────────────────────────

test("offer gating: a run with no eligible missing item cannot start a paired analysis", async () => {
  const { status, body, stats } = await runPaired({ receipt: buildOpenReceipt({ eligible: false }) });
  assert.equal(status, 400);
  assert.equal(body.error, "not_eligible");
  assert.equal(stats.anthropic, 0); // no paid call for a run that never earned an offer
});

test("capacity gating: the spend ceiling blocks a paired run before the paid call", async () => {
  await addGlobalSpend(20, { env: ENV }); // seed monthly spend past the 8 USD ceiling
  const { status, body, stats } = await runPaired({ receipt: buildOpenReceipt() });
  assert.equal(status, 429);
  assert.equal(body.error, "capacity");
  assert.equal(stats.anthropic, 0);
});

test("the paired endpoint runs behind the per-IP limiter", async () => {
  const ip = "198.51.100.240";
  _seedMemoryRateCountForTests(hashClientIp(ip), "b", RATE_BURST_MAX); // burst window already full
  const { status, body, stats } = await runPaired({ receipt: buildOpenReceipt(), ip });
  assert.equal(status, 429);
  assert.equal(body.error, "capacity");
  assert.equal(stats.anthropic, 0);
});

test("a disabled Reader returns a clean retryable unavailable (no fabricated fallback)", async () => {
  const { status, body, stats } = await runPaired({
    receipt: buildOpenReceipt(),
    env: { ...ENV, READER_ENABLED: "0" },
  });
  assert.equal(status, 503);
  assert.equal(body.error, "unavailable");
  assert.equal(body.retryable, true);
  assert.equal(stats.anthropic, 0);
});

// ── 8. Double-submit idempotency ──────────────────────────────────────────────

test("a resubmitted pair returns the stored analysis with no second model call and no new row", async () => {
  const receipt = buildOpenReceipt();
  const openRunId = receipt.open_run.provenance.request_id;
  const existingRecord = {
    id: "recStored1",
    fields: {
      "Open Run ID": openRunId,
      "Targeted Prompt": "stored prompt",
      "Targeted Prompt Hash": sha256Hex("stored prompt"),
      "Delta Items": JSON.stringify([
        { point: "stored delta", open_side: "x", targeted_side: "y", signal_pattern: "Framing Drift" },
      ]),
      "Gap Estimate": 1,
      "Estimate Rationale": "stored rationale",
      "Rubric Version": "1.0",
      "Paired Method Version": "1.0",
    },
  };
  const { status, body, stats } = await runPaired({ receipt, fetchOpts: { existingRecord } });
  assert.equal(status, 200);
  assert.equal(body.idempotent, true);
  assert.equal(stats.anthropic, 0, "no second paid call on a replay");
  assert.equal(stats.post, 0, "no duplicate row written");
  assert.equal(stats.get, 1, "the idempotency read ran");
  assert.equal(body.delta_items.length, 1);
  assert.equal(body.delta_items[0].point, "stored delta");
  assert.equal(body.gap_estimate, 1);
  assert.equal(body.receipt.paired_analysis.open_run_id, openRunId);
});

// ── 9. Paired-write retry + capture_uncertain flag ────────────────────────────

test("capturePaired retries once on a 5xx and succeeds", async () => {
  const ctx = createRuntimeContext({ route: "/api/read-paired" });
  const record = {
    openRunId: hexId("cap-ok"),
    targetedPrompt: "p",
    targetedPromptHash: sha256Hex("p"),
    targetedAnswer: "a",
    answerHash: sha256Hex("a"),
    pm: parsePairedMeasurement(sampleModelPaired()),
    receiptHash: "ab".repeat(32),
  };
  let n = 0;
  const fetch = async () => {
    n += 1;
    if (n === 1) return { ok: false, status: 500 };
    return { ok: true, json: async () => ({ id: "recRetry" }) };
  };
  const r = await capturePaired(record, ctx, { env: ENV, fetch });
  assert.equal(r.ok, true);
  assert.equal(r.recordId, "recRetry");
  assert.equal(n, 2);
});

test("capturePaired flags capture_uncertain when the write ultimately fails", async () => {
  const ctx = createRuntimeContext({ route: "/api/read-paired" });
  const record = {
    openRunId: hexId("cap-fail"),
    targetedPrompt: "p",
    targetedPromptHash: sha256Hex("p"),
    targetedAnswer: "a",
    answerHash: sha256Hex("a"),
    pm: parsePairedMeasurement(sampleModelPaired()),
    receiptHash: "cd".repeat(32),
  };
  const r = await capturePaired(record, ctx, { env: ENV, fetch: async () => ({ ok: false, status: 500 }) });
  assert.equal(r.ok, false);
  assert.equal(r.capture_uncertain, true);
  assert.equal(r.failure_class, "airtable_http");
});

test("capturePaired treats an unconfigured store as certain (no uncertain flag)", async () => {
  const ctx = createRuntimeContext({ route: "/api/read-paired" });
  const record = { openRunId: hexId("cap-unconf"), pm: parsePairedMeasurement(sampleModelPaired()) };
  const r = await capturePaired(record, ctx, { env: {}, fetch: async () => ({ ok: true }) });
  assert.equal(r.ok, false);
  assert.equal(r.failure_class, "unconfigured");
  assert.equal(r.capture_uncertain, false);
});

test("capturePaired never auto-deletes: a raced duplicate is left for operator dedupe (7b)", async () => {
  // findExistingPaired is a read-before-write check, so a true concurrent race can write
  // a duplicate paired-analysis row. This path must NOT reconcile by deletion: the row is
  // a possession-proof TARGET (share minting verifies a Receipt Hash against it), so
  // auto-deleting a duplicate could break an in-flight mint. Assert the only write method
  // is POST and a DELETE never occurs — the duplicate is left for manual operator dedupe.
  const ctx = createRuntimeContext({ route: "/api/read-paired" });
  const record = {
    openRunId: hexId("cap-nodelete"),
    targetedPrompt: "p",
    targetedPromptHash: sha256Hex("p"),
    targetedAnswer: "a",
    answerHash: sha256Hex("a"),
    pm: parsePairedMeasurement(sampleModelPaired()),
    receiptHash: "ef".repeat(32),
  };
  const methods = [];
  const fetch = async (url, o = {}) => {
    methods.push((o.method || "GET").toUpperCase());
    return { ok: true, json: async () => ({ id: "recPairedDup" }) };
  };
  const r = await capturePaired(record, ctx, { env: ENV, fetch });
  assert.equal(r.ok, true);
  assert.ok(methods.length >= 1, "a write was attempted");
  assert.ok(methods.includes("POST"), "the capture write is a POST");
  assert.ok(
    methods.every((m) => m !== "DELETE"),
    "capturePaired issues no DELETE — no automatic reconciliation of a possession-proof paired row",
  );
});

test("endpoint: a failed capture still returns the analysis, flagged capture_uncertain", async () => {
  const { status, body } = await runPaired({
    receipt: buildOpenReceipt(),
    fetchOpts: { capture: () => ({ ok: false, status: 500 }) },
  });
  assert.equal(status, 200);
  assert.equal(body.capture_uncertain, true);
  assert.ok(body.receipt, "the read is never broken by a lost row");
  assert.equal(body.delta_items.length, 2);
});

// ── 10. Share containment in paired state ─────────────────────────────────────

test("a paired write targets only the Paired Analyses table, never Inspection Shares", async () => {
  const { status, stats } = await runPaired({ receipt: buildOpenReceipt() });
  assert.equal(status, 200);
  assert.ok(
    stats.urls.some((u) => u.includes(PAIRED_TABLE_ID)),
    "the analysis lands in the paired table",
  );
  assert.ok(
    stats.urls.every((u) => !u.includes(SHARES_TABLE_ID)),
    "no paired-flow call ever touches the shares table",
  );
});

// ── 11. Failure isolation on a failed second read ─────────────────────────────

test("a failed model call returns retryable analysis_failed and writes no row", async () => {
  const { status, body, stats } = await runPaired({
    receipt: buildOpenReceipt(),
    fetchOpts: { model: () => ({ ok: false, status: 500 }) },
  });
  assert.equal(status, 502);
  assert.equal(body.error, "analysis_failed");
  assert.equal(body.retryable, true);
  assert.equal(stats.post, 0, "failure isolation: no paired row on a failed second read");
  assert.ok(
    stats.urls.every((u) => !u.includes(SHARES_TABLE_ID)),
    "Act 1 and its share stay untouched",
  );
});

test("an unparseable model reply returns analysis_failed and writes no row", async () => {
  const { status, body, stats } = await runPaired({
    receipt: buildOpenReceipt(),
    fetchOpts: {
      model: () => ({
        ok: true,
        json: async () => ({ content: [{ type: "text", text: "totally not json" }], usage: { input_tokens: 1, output_tokens: 1 } }),
      }),
    },
  });
  assert.equal(status, 502);
  assert.equal(body.error, "analysis_failed");
  assert.equal(stats.post, 0);
});

// ── 12. Graceful handling of runs with no paired analysis ─────────────────────

test("a single receipt carries no paired analysis and still validates as an open receipt", () => {
  const r = buildOpenReceipt();
  assert.equal(r.receipt_type, "single");
  assert.equal(r.paired_analysis, null);
  assert.deepEqual(validateOpenReceipt(r), { ok: true });
});

test("buildPairedReceipt tolerates an absent paired analysis without throwing", () => {
  let r;
  assert.doesNotThrow(() => {
    r = buildPairedReceipt({ generatedAt: "t", openRun: buildOpenReceipt().open_run, pairedAnalysis: undefined });
  });
  assert.deepEqual(r.paired_analysis.delta_items, []);
  assert.equal(r.receipt_type, "paired");
});
