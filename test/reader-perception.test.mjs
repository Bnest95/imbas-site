// Reader v2 P3 — the perception tap. One file, the concerns the pass must hold:
//   1. single-mode capture writes single_* to the Reader Runs row
//   2. paired-mode capture writes paired_* to the exact Reader Paired Analyses row
//   3. the correct field (Perception Tap ONLY) is written to the correct record
//   4. all five exact enums are accepted and stored verbatim
//   5. a mode/value mismatch is rejected server-side (single≠paired), no write
//   6. receipt integrity is verified BEFORE any write; a tampered receipt is refused
//   7. a receipt that matches no minted record is refused (possession, part 2)
//   8. the per-receipt write cap is enforced (replay guard)
//   9. paired targeting is by the unique Receipt Hash, never Open Run ID alone
//  10. mutable latest-wins: repeated taps overwrite one row, never a duplicate row
//  11. a skipped/absent value performs no write and blocks nothing
//  12. runs with no tap render gracefully (nothing pre-selected; untapped rows fine)
// plus: the shared client vocabulary is telemetry-only (no accuracy claim) and
// client and server provably agree on the five enums.
// Run: node --test test/reader-perception.test.mjs

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

import {
  createPerceptionHandler,
  verifyReceiptIntegrity,
  validateReceiptShape,
  findByReceiptHash,
  writePerceptionField,
} from "../api/reader-perception.js";
import {
  buildSingleReceipt,
  buildPairedReceipt,
  canonicalizeForHash,
} from "../reader-receipt.js";
import {
  perceptionTap,
  isPerceptionValueForMode,
  perceptionModeForValue,
  SINGLE_PERCEPTION_VALUES,
  PAIRED_PERCEPTION_VALUES,
  ALL_PERCEPTION_VALUES,
} from "../reader-perception-client.js";
import {
  _resetMemoryStateForTests,
  _seedPerceptionCapForTests,
  PERCEPTION_WRITE_MAX,
} from "../reader-security.js";

const sha256Hex = (s) => createHash("sha256").update(String(s), "utf8").digest("hex");

const RUNS_TABLE_ID = "tblqmHiOCQ5YSXBN3"; // Reader Runs — single-mode target
const PAIRED_TABLE_ID = "tblP1ekWWWscz6pBG"; // Reader Paired Analyses — paired-mode target
const ENV = { AIRTABLE_TOKEN: "test-token" }; // no Redis -> memory cap fallback

let ridCounter = 1;
const hexId = (seed) => sha256Hex(`percrun:${seed}`).slice(0, 16);

// A hash-valid single receipt, minted exactly as api/read.js does: content_hash
// computed last over the canonical envelope, then stored — so it equals the row's
// "Receipt Hash" field and verifyReceiptIntegrity passes until a test tampers it.
function buildSingle({ requestId } = {}) {
  const rid = requestId || hexId(`s${ridCounter++}`);
  const r = buildSingleReceipt({
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
    measurement: {
      findings: [{ type: "candidate missing item", anchor: "smoother workflows", materiality: "failure modes unnamed" }],
      finding_counts: { "candidate missing item": 1, "candidate framing issue": 0, "candidate deflection": 0 },
      gap_estimate: 2,
      estimate_rationale: "material context missing",
      estimate_type: "candidate_gap",
      estimate_scale_version: "1.0",
      candidate_method_version: "1.0",
      unvalidated: true,
    },
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
  r.integrity.content_hash = sha256Hex(canonicalizeForHash(r));
  return r;
}

// A hash-valid paired receipt, minted exactly as api/read-paired.js does. Its
// content_hash equals the paired row's "Receipt Hash" field.
function buildPaired({ openRunId } = {}) {
  const openRun = buildSingle({ requestId: openRunId }).open_run;
  const r = buildPairedReceipt({
    generatedAt: "2026-07-09T00:00:00.000Z",
    openRun,
    pairedAnalysis: {
      open_run_id: openRun.provenance.request_id,
      targeted_prompt: "line one\r\nline two",
      targeted_prompt_hash: sha256Hex("p"),
      targeted_answer: "second answer",
      targeted_answer_hash: sha256Hex("second answer"),
      delta_items: [
        { point: "No failure modes named", open_side: "reduces wait times", targeted_side: "acute cases misrouted", signal_pattern: "Omission" },
      ],
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

// One mock fetch, two branches: the locate (Airtable GET, filterByFormula) and the
// write (Airtable PATCH /recordId). Every url/method/body is recorded so field- and
// table-targeting can be asserted. checkPerceptionWriteCap never fetches (memory
// fallback with no Redis), so these are the only two calls.
function makePerceptionFetch(opts = {}) {
  const stats = { get: 0, patch: 0, post: 0, put: 0, urls: [], getUrls: [], patchUrls: [], patchBodies: [] };
  const record = () =>
    opts.notFound ? null : { id: opts.recordId || "recPerc1", fields: opts.recordFields || {} };
  const fetchImpl = async (url, o = {}) => {
    const u = String(url);
    const method = (o && o.method) || "GET";
    stats.urls.push(u);
    if (method === "GET") {
      stats.get++;
      stats.getUrls.push(u);
      if (opts.locateHttpError) return { ok: false, status: opts.locateHttpError };
      const rec = record();
      return { ok: true, json: async () => ({ records: rec ? [rec] : [] }) };
    }
    if (method === "PATCH") {
      stats.patch++;
      stats.patchUrls.push(u);
      stats.patchBodies.push(o && o.body ? JSON.parse(o.body) : null);
      return opts.write ? opts.write(stats.patch) : { ok: true, json: async () => ({ id: opts.recordId || "recPerc1" }) };
    }
    if (method === "POST") stats.post++;
    if (method === "PUT") stats.put++;
    return { ok: true, json: async () => ({}) };
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
    out,
  };
}

async function runPerception({ receipt, value, fetchOpts = {}, env = ENV, method = "POST", body } = {}) {
  const { fetchImpl, stats } = makePerceptionFetch(fetchOpts);
  const handler = createPerceptionHandler({ env, fetch: fetchImpl });
  const req = { method, headers: {}, body: body !== undefined ? body : { receipt, value } };
  const res = mockRes();
  await handler(req, res);
  return { status: res.out.statusCode, body: res.out.body, stats };
}

beforeEach(() => {
  _resetMemoryStateForTests();
});

// ── 1/2/3/4. Capture: correct enum -> correct field -> correct record ──────────

test("single-mode single_yes writes only Perception Tap to the Reader Runs row", async () => {
  const receipt = buildSingle();
  const { status, body, stats } = await runPerception({ receipt, value: "single_yes" });
  assert.equal(status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.value, "single_yes");
  assert.equal(stats.get, 1);
  assert.equal(stats.patch, 1);
  assert.equal(stats.post, 0, "never a new row");
  assert.equal(stats.put, 0, "PATCH, never PUT — other fields untouched");
  // located in Reader Runs by the verified receipt hash
  assert.ok(decodeURIComponent(stats.getUrls[0]).includes(RUNS_TABLE_ID));
  // wrote ONLY Perception Tap, exact enum, to the located record id
  const patch = stats.patchBodies[0];
  assert.deepEqual(Object.keys(patch.fields), ["Perception Tap"]);
  assert.equal(patch.fields["Perception Tap"], "single_yes");
  assert.ok(stats.patchUrls[0].includes(RUNS_TABLE_ID));
  assert.ok(stats.patchUrls[0].endsWith("/recPerc1"));
});

test("single-mode single_no is stored verbatim", async () => {
  const { status, stats } = await runPerception({ receipt: buildSingle(), value: "single_no" });
  assert.equal(status, 200);
  assert.equal(stats.patchBodies[0].fields["Perception Tap"], "single_no");
});

test("paired-mode paired_noticeable writes only Perception Tap to the Paired Analyses row", async () => {
  const receipt = buildPaired();
  const { status, body, stats } = await runPerception({ receipt, value: "paired_noticeable" });
  assert.equal(status, 200);
  assert.equal(body.value, "paired_noticeable");
  assert.equal(stats.patch, 1);
  assert.equal(stats.post, 0);
  assert.ok(decodeURIComponent(stats.getUrls[0]).includes(PAIRED_TABLE_ID));
  const patch = stats.patchBodies[0];
  assert.deepEqual(Object.keys(patch.fields), ["Perception Tap"]);
  assert.equal(patch.fields["Perception Tap"], "paired_noticeable");
  assert.ok(stats.patchUrls[0].includes(PAIRED_TABLE_ID));
});

test("all five exact enums are accepted and written verbatim to the right table", async () => {
  for (const value of SINGLE_PERCEPTION_VALUES) {
    _resetMemoryStateForTests();
    const { status, stats } = await runPerception({ receipt: buildSingle(), value });
    assert.equal(status, 200, `single enum ${value} accepted`);
    assert.equal(stats.patchBodies[0].fields["Perception Tap"], value);
    assert.ok(stats.patchUrls[0].includes(RUNS_TABLE_ID));
  }
  for (const value of PAIRED_PERCEPTION_VALUES) {
    _resetMemoryStateForTests();
    const { status, stats } = await runPerception({ receipt: buildPaired(), value });
    assert.equal(status, 200, `paired enum ${value} accepted`);
    assert.equal(stats.patchBodies[0].fields["Perception Tap"], value);
    assert.ok(stats.patchUrls[0].includes(PAIRED_TABLE_ID));
  }
});

// ── 5. Mode/value mismatch rejected server-side, before any write ──────────────

test("a single receipt cannot write a paired_* value (mode/value mismatch)", async () => {
  const { status, body, stats } = await runPerception({ receipt: buildSingle(), value: "paired_large" });
  assert.equal(status, 400);
  assert.equal(body.error, "mode_mismatch");
  assert.equal(stats.get, 0, "rejected before any locate");
  assert.equal(stats.patch, 0, "and before any write");
});

test("a paired receipt cannot write a single_* value (mode/value mismatch)", async () => {
  const { status, body, stats } = await runPerception({ receipt: buildPaired(), value: "single_yes" });
  assert.equal(status, 400);
  assert.equal(body.error, "mode_mismatch");
  assert.equal(stats.get, 0);
  assert.equal(stats.patch, 0);
});

// ── 6. Integrity verified before any write ─────────────────────────────────────

test("verifyReceiptIntegrity fails once a signed receipt is tampered with", () => {
  const r = buildSingle();
  assert.equal(verifyReceiptIntegrity(r), true);
  r.open_run.answer += " tampered after signing";
  assert.equal(verifyReceiptIntegrity(r), false);
});

test("a tampered receipt is rejected on the integrity hash, before any Airtable call", async () => {
  const receipt = buildSingle();
  receipt.open_run.answer += " tampered";
  const { status, body, stats } = await runPerception({ receipt, value: "single_yes" });
  assert.equal(status, 400);
  assert.equal(body.error, "invalid_receipt");
  assert.equal(body.detail, "integrity");
  assert.equal(stats.get, 0, "no locate against an unverified receipt");
  assert.equal(stats.patch, 0);
});

test("a receipt whose integrity.content_hash was swapped is rejected", async () => {
  const receipt = buildSingle();
  receipt.integrity.content_hash = "f".repeat(64); // a plausible-looking but wrong hash
  const { status, body, stats } = await runPerception({ receipt, value: "single_no" });
  assert.equal(status, 400);
  assert.equal(body.error, "invalid_receipt");
  assert.equal(stats.patch, 0);
});

// ── 7. A verified receipt that matches no minted record is refused ─────────────

test("a hash-valid receipt matching no stored row is refused (possession, part 2), no write", async () => {
  const { status, body, stats } = await runPerception({
    receipt: buildSingle(),
    value: "single_yes",
    fetchOpts: { notFound: true },
  });
  assert.equal(status, 404);
  assert.equal(body.error, "not_found");
  assert.equal(stats.get, 1, "the locate ran");
  assert.equal(stats.patch, 0, "but nothing was written");
});

test("a locate store error refuses the write rather than guessing a target", async () => {
  const { status, stats } = await runPerception({
    receipt: buildSingle(),
    value: "single_yes",
    fetchOpts: { locateHttpError: 500 },
  });
  assert.equal(status, 404);
  assert.equal(stats.patch, 0);
});

// ── 8. Per-receipt write cap (replay guard) ────────────────────────────────────

test(`the ${PERCEPTION_WRITE_MAX + 1}th write to one receipt is rejected; the cap holds`, async () => {
  const receipt = buildSingle(); // one receipt -> one content_hash -> one cap bucket
  const statuses = [];
  let lastStats;
  for (let i = 0; i < PERCEPTION_WRITE_MAX + 1; i++) {
    const out = await runPerception({ receipt, value: i % 2 ? "single_no" : "single_yes" });
    statuses.push(out.status);
    lastStats = out.stats;
  }
  assert.deepEqual(statuses, [...Array(PERCEPTION_WRITE_MAX).fill(200), 429], "5 writes, then capped");
  assert.equal(lastStats.patch, 0, "the capped request writes nothing");
});

test("a request over the cap is rejected before locate or write", async () => {
  const receipt = buildSingle();
  _seedPerceptionCapForTests(receipt.integrity.content_hash, PERCEPTION_WRITE_MAX);
  const { status, body, stats } = await runPerception({ receipt, value: "single_yes" });
  assert.equal(status, 429);
  assert.equal(body.error, "capacity");
  assert.equal(stats.get, 0);
  assert.equal(stats.patch, 0);
});

test("a configured cap store error fails closed (rejects)", async () => {
  // Redis 'configured' but every command errors -> checkPerceptionWriteCap fails closed.
  const redisEnv = { AIRTABLE_TOKEN: "t", UPSTASH_REDIS_REST_URL: "https://x", UPSTASH_REDIS_REST_TOKEN: "y" };
  const { fetchImpl, stats } = makePerceptionFetch({});
  // Wrap fetch so the Upstash pipeline call returns an error shape.
  const wrapped = async (url, o) => {
    if (String(url).includes("x")) return { ok: false, status: 500 };
    return fetchImpl(url, o);
  };
  const handler = createPerceptionHandler({ env: redisEnv, fetch: wrapped });
  const res = mockRes();
  await handler({ method: "POST", headers: {}, body: { receipt: buildSingle(), value: "single_yes" } }, res);
  assert.equal(res.out.statusCode, 429);
  assert.equal(res.out.body.error, "capacity");
  assert.equal(res.out.body.store_error, true);
  assert.equal(stats.patch, 0);
});

// ── 9. Paired targeting by the unique Receipt Hash, never Open Run ID ──────────

test("paired locate queries {Receipt Hash}, never {Open Run ID} (one open run may back many pairs)", async () => {
  const receipt = buildPaired();
  const hash = receipt.integrity.content_hash;
  const { status, stats } = await runPerception({ receipt, value: "paired_small" });
  assert.equal(status, 200);
  const q = decodeURIComponent(stats.getUrls[0]);
  assert.ok(q.includes(`{Receipt Hash}='${hash}'`), "targets the unique receipt hash");
  assert.ok(!q.includes("Open Run ID"), "never targets by Open Run ID");
});

test("single locate also targets by the verified Receipt Hash", async () => {
  const receipt = buildSingle();
  const { stats } = await runPerception({ receipt, value: "single_yes" });
  const q = decodeURIComponent(stats.getUrls[0]);
  assert.ok(q.includes(`{Receipt Hash}='${receipt.integrity.content_hash}'`));
  assert.ok(!q.includes("Request ID"), "not by request_id — the hash is the possession proof");
});

// ── 10. Mutable latest-wins: overwrite one row, never a duplicate ──────────────

test("repeated taps overwrite the same row (latest-wins), never appending a row", async () => {
  const receipt = buildSingle();
  const seq = ["single_yes", "single_no", "single_yes"];
  const patchIds = [];
  let lastBody;
  for (const value of seq) {
    const { status, stats } = await runPerception({ receipt, value });
    assert.equal(status, 200);
    assert.equal(stats.post, 0, "never a POST -> never a duplicate row");
    patchIds.push(stats.patchUrls[0]);
    lastBody = stats.patchBodies[0];
  }
  assert.equal(new Set(patchIds).size, 1, "every write targets the same record id");
  assert.equal(lastBody.fields["Perception Tap"], "single_yes", "the latest selection is what stands");
});

// ── 11. A skipped / absent value performs no write and blocks nothing ──────────

test("an absent value performs no Airtable call at all (skip = no telemetry)", async () => {
  const { status, body, stats } = await runPerception({ body: { receipt: buildSingle() } });
  assert.equal(status, 400);
  assert.equal(body.error, "invalid_value");
  assert.equal(stats.get, 0);
  assert.equal(stats.patch, 0);
});

test("an unknown value (never a 'skipped' sentinel) is refused with no write", async () => {
  const { status, body, stats } = await runPerception({ receipt: buildSingle(), value: "skipped" });
  assert.equal(status, 400);
  assert.equal(body.error, "invalid_value");
  assert.equal(stats.get, 0);
  assert.equal(stats.patch, 0);
});

// ── 12. Runs with no tap render gracefully ─────────────────────────────────────

test("a located row that has no Perception Tap field yet writes fine (untapped/old rows)", async () => {
  // recordFields is empty — the field is absent, exactly as on every pre-P3 row.
  const { status, stats } = await runPerception({
    receipt: buildSingle(),
    value: "single_yes",
    fetchOpts: { recordFields: {}, recordId: "recOld" },
  });
  assert.equal(status, 200);
  assert.ok(stats.patchUrls[0].endsWith("/recOld"));
  assert.equal(stats.patchBodies[0].fields["Perception Tap"], "single_yes");
});

test("the client tap model pre-selects nothing (null value is not valid for any mode)", () => {
  assert.equal(isPerceptionValueForMode("single", null), false);
  assert.equal(isPerceptionValueForMode("paired", undefined), false);
  assert.equal(isPerceptionValueForMode("single", ""), false);
});

// ── Endpoint guards ────────────────────────────────────────────────────────────

test("a non-POST method is refused", async () => {
  const { status, body } = await runPerception({ receipt: buildSingle(), value: "single_yes", method: "GET" });
  assert.equal(status, 405);
  assert.equal(body.error, "method");
});

test("a non-object body is refused", async () => {
  const { status, body, stats } = await runPerception({ body: "not an object" });
  assert.equal(status, 400);
  assert.equal(body.error, "invalid");
  assert.equal(stats.get, 0);
});

test("a structurally invalid receipt is refused before any hash work", async () => {
  const { status, body, stats } = await runPerception({ receipt: { receipt_type: "single" }, value: "single_yes" });
  assert.equal(status, 400);
  assert.equal(body.error, "invalid_receipt");
  assert.equal(body.detail, "integrity");
  assert.equal(stats.get, 0);
});

test("validateReceiptShape rejects wrong shape, unknown type, and missing integrity", () => {
  assert.equal(validateReceiptShape(null).reason, "shape");
  assert.equal(validateReceiptShape({ receipt_type: "triple", integrity: { content_hash: "x" } }).reason, "type");
  const noInteg = buildSingle();
  delete noInteg.integrity;
  assert.equal(validateReceiptShape(noInteg).reason, "integrity");
});

// ── Direct unit checks on the write/locate helpers ─────────────────────────────

test("writePerceptionField PATCHes only Perception Tap and retries once on a 5xx", async () => {
  let n = 0;
  const fetch = async (url, o) => {
    n += 1;
    assert.equal(o.method, "PATCH");
    assert.deepEqual(Object.keys(JSON.parse(o.body).fields), ["Perception Tap"]);
    if (n === 1) return { ok: false, status: 500 };
    return { ok: true, json: async () => ({ id: "recR" }) };
  };
  const r = await writePerceptionField(RUNS_TABLE_ID, "recR", "single_yes", { env: ENV, fetch });
  assert.equal(r.ok, true);
  assert.equal(n, 2, "one retry on the transient 5xx");
});

test("a final write failure returns write_failed 502 (the client swallows it)", async () => {
  const { status, body } = await runPerception({
    receipt: buildSingle(),
    value: "single_yes",
    fetchOpts: { write: () => ({ ok: false, status: 500 }) },
  });
  assert.equal(status, 502);
  assert.equal(body.error, "write_failed");
});

test("findByReceiptHash returns no record when AIRTABLE_TOKEN is unset (no persistence)", async () => {
  const r = await findByReceiptHash(RUNS_TABLE_ID, "ab".repeat(32), { env: {}, fetch: async () => ({ ok: true, json: async () => ({ records: [] }) }) });
  assert.equal(r.record, null);
});

// ── Shared client vocabulary: telemetry-only, and server agrees with it ─────────

test("perceptionTap returns the honest per-mode question and the exact enums", () => {
  const single = perceptionTap("single");
  assert.equal(single.prompt, "Did this surface something you hadn't considered?");
  assert.deepEqual(single.options.map((o) => o.value), SINGLE_PERCEPTION_VALUES);
  const paired = perceptionTap("paired");
  assert.equal(paired.prompt, "How big did the difference feel?");
  assert.deepEqual(paired.options.map((o) => o.value), PAIRED_PERCEPTION_VALUES);
  assert.equal(perceptionTap("nope"), null);
});

test("no tap copy implies validation or accuracy (banned interpretation)", () => {
  const surfaces = [];
  for (const mode of ["single", "paired"]) {
    const t = perceptionTap(mode);
    surfaces.push(t.prompt, ...t.options.map((o) => o.label), ...t.options.map((o) => o.value));
  }
  const banned = /accura|confirm|correct|valid|verif|proof|prove|accura|is right|our accuracy/i;
  for (const s of surfaces) {
    assert.ok(!banned.test(s), `tap surface must not imply validation: "${s}"`);
  }
});

test("perceptionModeForValue and isPerceptionValueForMode agree across all five enums", () => {
  assert.equal(perceptionModeForValue("single_yes"), "single");
  assert.equal(perceptionModeForValue("paired_large"), "paired");
  assert.equal(perceptionModeForValue("bogus"), null);
  for (const v of SINGLE_PERCEPTION_VALUES) assert.ok(isPerceptionValueForMode("single", v));
  for (const v of PAIRED_PERCEPTION_VALUES) assert.ok(isPerceptionValueForMode("paired", v));
  assert.ok(!isPerceptionValueForMode("single", "paired_small"));
  assert.ok(!isPerceptionValueForMode("paired", "single_yes"));
});

test("client and server agree: every value the client can emit, the server accepts for its mode", async () => {
  for (const mode of ["single", "paired"]) {
    const t = perceptionTap(mode);
    for (const opt of t.options) {
      _resetMemoryStateForTests();
      const receipt = mode === "single" ? buildSingle() : buildPaired();
      const { status } = await runPerception({ receipt, value: opt.value });
      assert.equal(status, 200, `${mode} value ${opt.value} accepted end to end`);
    }
  }
  assert.equal(ALL_PERCEPTION_VALUES.length, 5);
});
