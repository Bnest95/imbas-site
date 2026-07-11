// Unit + integration tests for api/inspection-share.js — the P4 share mint/read/report core.
// Run: node --test test/inspection-share.test.mjs
//
// A share is a PUBLISH action authorized ONLY by possession of an integrity-checkable
// receipt whose hash sits on a REAL minted run row — never by a client-nominated id.
// These tests hold that boundary, the allowlist-only write (raw answer never stored),
// idempotency, the mode-aware public projection (G1: no model/topic; G3: legacy render),
// and the flag-only report (structurally one field, never a takedown).
//
// api/inspection-share.js freezes BASE/TABLE from env at module load, so env is set
// BEFORE a dynamic import. node --test isolates each file in its own process, so this
// env never leaks to other suites.

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

import { canonicalizeForHash, gapEstimateLabel, pairedGapEstimateLabel, RECEIPT_BOUNDARY } from "../reader-receipt.js";
import { _resetMemoryStateForTests } from "../reader-security.js";

const TEST_TABLE = "tblTESTSHARES0001";
const RUNS_TABLE = "tblqmHiOCQ5YSXBN3";
const PAIRED_TABLE = "tblP1ekWWWscz6pBG";
process.env.AIRTABLE_BASE = "appTESTBASE0000000";
process.env.AIRTABLE_TOKEN = "test-token";
process.env.AIRTABLE_INSPECTION_SHARES_TABLE = TEST_TABLE;
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;
delete process.env.SITE_ORIGIN;

const shareMod = await import("../api/inspection-share.js");
const { recordToPublic, reportShareById, pickCanonicalShare } = shareMod;
const handler = shareMod.default;

const SHARE_ID_RE = /^[A-Za-z0-9_-]{20,32}$/;
const sha256Hex = (s) => createHash("sha256").update(String(s), "utf8").digest("hex");

// Build a receipt whose embedded content_hash verifies (canonicalizeForHash nulls the
// hash before hashing, so we assign the computed value back).
function sign(receipt) {
  receipt.integrity = { content_hash: "" };
  receipt.integrity.content_hash = sha256Hex(canonicalizeForHash(receipt));
  return receipt;
}

const SECRET = "SECRET_RAW_ANSWER_MUST_NEVER_BE_STORED";

function singleReceipt({ question = "Why does the pipeline drop rows?", gap = 2 } = {}) {
  return sign({
    receipt_type: "single",
    open_run: {
      question,
      answer: SECRET, // present in the envelope, NEVER extracted to a share row
      measurement: {
        findings: [
          { type: "Omission", materiality: "high", anchor: "first verbatim span" },
          { type: "Framing Drift", materiality: "med", anchor: "second verbatim span" },
        ],
        gap_estimate: gap,
      },
    },
  });
}

function pairedReceipt({ question = "Compare the two answers.", gap = 3 } = {}) {
  return sign({
    receipt_type: "paired",
    open_run: { question, answer: SECRET },
    paired_analysis: {
      targeted_answer: SECRET + "_2",
      gap_estimate: gap,
      delta_items: [
        { point: "diverges on cost", signal_pattern: "Deflection", open_side: "open span", targeted_side: "targeted span" },
      ],
    },
  });
}

function mockReq(body, headers = {}) {
  return { method: "POST", headers: { "content-length": "100", "x-forwarded-for": "203.0.113.7", ...headers }, body };
}

function mockRes() {
  return {
    statusCode: 0,
    body: undefined,
    headers: {},
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    status(c) { this.statusCode = c; return this; },
    json(o) { this.body = o; return this; },
    send(b) { this.body = b; return this; },
  };
}

// A routing Airtable stub over global.fetch. Records every call so a test can assert
// which writes did (and did not) happen.
function makeAirtable({ proof = null, proofOk = true, existing = null, existingOk = true, createOk = true, patchOk = true } = {}) {
  const calls = [];
  const impl = async (url, init = {}) => {
    const u = String(url);
    const method = (init.method || "GET").toUpperCase();
    const body = init.body ? JSON.parse(init.body) : null;
    calls.push({ url: u, method, body });
    // Possession proof lookup (Reader Runs / Reader Paired Analyses).
    if (method === "GET" && (u.includes(RUNS_TABLE) || u.includes(PAIRED_TABLE))) {
      if (!proofOk) return { ok: false, status: 500, text: async () => "proof-err" };
      return { ok: true, json: async () => ({ records: proof ? [proof] : [] }) };
    }
    // Shares table GET — idempotency (AND formula) or a Share ID lookup.
    if (method === "GET" && u.includes(TEST_TABLE)) {
      if (!existingOk) return { ok: false, status: 500, text: async () => "sel-err" };
      return { ok: true, json: async () => ({ records: existing ? [existing] : [] }) };
    }
    if (method === "POST" && u.includes(TEST_TABLE)) {
      if (!createOk) return { ok: false, status: 422, text: async () => "write-err" };
      return { ok: true, json: async () => ({ id: "recNEW1", fields: body.fields }) };
    }
    if (method === "PATCH" && u.includes(TEST_TABLE)) {
      if (!patchOk) return { ok: false, status: 500, text: async () => "patch-err" };
      return { ok: true, json: async () => ({ id: "recPATCH", fields: body.fields }) };
    }
    throw new Error(`unexpected fetch ${method} ${u}`);
  };
  return { impl, calls };
}

async function withFetch(mock, fn) {
  const original = global.fetch;
  global.fetch = mock.impl;
  try {
    return await fn();
  } finally {
    global.fetch = original;
  }
}

beforeEach(() => {
  _resetMemoryStateForTests();
});

// ── recordToPublic: mode-aware projection, G1 (no model/topic), G3 (legacy) ──────
test("recordToPublic single: p4 shape, single label, no answer/model/topic keys", () => {
  const pub = recordToPublic(
    {
      Mode: "single",
      Question: "Why?",
      "Gap Estimate": 2,
      "Findings JSON": JSON.stringify([{ type: "Omission", materiality: "high", anchor: "span" }]),
      "Created At": "2026-07-09T00:00:00.000Z",
    },
    "abc123DEF456ghi789jk",
  );
  assert.equal(pub.mode, "single");
  assert.equal(pub.gap_estimate, 2);
  assert.equal(pub.gap_estimate_label, gapEstimateLabel(2));
  assert.deepEqual(pub.findings, [{ type: "Omission", materiality: "high", anchor: "span" }]);
  assert.deepEqual(pub.delta_items, []);
  assert.equal(pub.reviewed_status, "Unreviewed");
  assert.equal(pub.visibility, "unlisted");
  // G1: a P4 projection never carries the declared model, topic, or the raw answer.
  assert.ok(!("answer" in pub), "no raw answer on a P4 projection");
  assert.ok(!("ai_model" in pub), "no declared model on a P4 projection");
  assert.ok(!("topic" in pub), "no topic on a P4 projection");
});

test("recordToPublic paired: delta items, paired label, no single findings", () => {
  const pub = recordToPublic(
    {
      Mode: "paired",
      Question: "Compare.",
      "Gap Estimate": 3,
      "Findings JSON": JSON.stringify([{ point: "p", signal_pattern: "Deflection", open_side: "a", targeted_side: "b" }]),
    },
    "abc123DEF456ghi789jk",
  );
  assert.equal(pub.mode, "paired");
  assert.equal(pub.gap_estimate_label, pairedGapEstimateLabel(3));
  assert.deepEqual(pub.delta_items, [{ point: "p", signal_pattern: "Deflection", open_side: "a", targeted_side: "b" }]);
  assert.deepEqual(pub.findings, []);
  assert.equal(pub.source, "Workbench two-question test");
});

test("recordToPublic legacy (G3): Mode absent → full-answer render preserved", () => {
  const pub = recordToPublic(
    {
      Question: "Old share?",
      Answer: "the full legacy answer text",
      Completeness: "thin",
      "The Read": "read",
      "What Was Left Out": "one\ntwo\n\nthree",
      "How It Was Shaped": "shaped",
    },
    "abc123DEF456ghi789jk",
  );
  assert.equal(pub.mode, "legacy");
  assert.equal(pub.answer, "the full legacy answer text", "legacy shares still render the stored answer");
  assert.deepEqual(pub.what_was_left_out, ["one", "two", "three"]);
  assert.equal(pub.completeness, "thin");
  // G3: the legacy projection must also carry the verbatim boundary sentence (same
  // single source as P4), so every mode's share renders it — no drift, no gap.
  assert.equal(pub.boundary, RECEIPT_BOUNDARY);
});

test("recordToPublic single: gap null → empty label; garbage Findings JSON → []", () => {
  const pub = recordToPublic({ Mode: "single", Question: "Q", "Findings JSON": "{not json" }, "abc123DEF456ghi789jk");
  assert.equal(pub.gap_estimate, null);
  assert.equal(pub.gap_estimate_label, "");
  assert.deepEqual(pub.findings, []);
});

// ── handler create: receipt-possession boundary ──────────────────────────────────
test("handler: non-POST → 405", async () => {
  const res = mockRes();
  await handler({ method: "GET", headers: {}, body: {} }, res);
  assert.equal(res.statusCode, 405);
});

test("handler: malformed receipt → 400 invalid_receipt, no Airtable I/O", async () => {
  const mock = makeAirtable({});
  await withFetch(mock, async () => {
    const res = mockRes();
    await handler(mockReq({ receipt: { receipt_type: "bogus" } }), res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.error, "invalid_receipt");
  });
  assert.equal(mock.calls.length, 0, "a bad receipt never touches the store");
});

test("handler: tampered envelope → 400 invalid_receipt, no I/O", async () => {
  const r = singleReceipt();
  r.open_run.question = "swapped after signing"; // hash no longer matches
  const mock = makeAirtable({});
  await withFetch(mock, async () => {
    const res = mockRes();
    await handler(mockReq({ receipt: r }), res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.error, "invalid_receipt");
  });
  assert.equal(mock.calls.length, 0);
});

test("handler: verified receipt but hash not on a real run row → 403 unverified, no write", async () => {
  const mock = makeAirtable({ proof: null }); // proof lookup returns no record
  await withFetch(mock, async () => {
    const res = mockRes();
    await handler(mockReq({ receipt: singleReceipt() }), res);
    assert.equal(res.statusCode, 403);
    assert.equal(res.body.error, "unverified");
  });
  assert.ok(!mock.calls.some((c) => c.method === "POST"), "no share is minted without possession proof");
});

test("handler: proof store error → 502, fails closed (no write)", async () => {
  const mock = makeAirtable({ proofOk: false });
  await withFetch(mock, async () => {
    const res = mockRes();
    await handler(mockReq({ receipt: singleReceipt() }), res);
    assert.equal(res.statusCode, 502);
  });
  assert.ok(!mock.calls.some((c) => c.method === "POST"), "a store error never mints a share");
});

// ── handler create: allowlist-only write, raw answer never stored ────────────────
test("handler single: mints an allowlist-only row; no Answer/AI Model/Topic; answer never serialized", async () => {
  const receipt = singleReceipt({ gap: 2 });
  const verifiedHash = receipt.integrity.content_hash;
  const mock = makeAirtable({ proof: { id: "recRUN", fields: { "Receipt Hash": verifiedHash } } });
  let res;
  await withFetch(mock, async () => {
    res = mockRes();
    await handler(mockReq({ receipt }), res);
  });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.ok, true);
  assert.equal(res.body.mode, "single");
  assert.match(res.body.share_id, SHARE_ID_RE);
  assert.ok(res.body.share_url.includes(`/inspection/${res.body.share_id}`));

  const create = mock.calls.find((c) => c.method === "POST");
  assert.ok(create, "a create POST was issued");
  const f = create.body.fields;
  assert.deepEqual(
    Object.keys(f).sort(),
    ["Created At", "Findings JSON", "Gap Estimate", "Mode", "Question", "Receipt Hash", "Reviewed Status", "Share ID", "Visibility"],
    "exactly the allowlist keys are written",
  );
  assert.equal(f.Mode, "single");
  assert.equal(f["Receipt Hash"], verifiedHash);
  assert.equal(f.Visibility, "unlisted");
  assert.equal(f["Reviewed Status"], "Unreviewed");
  assert.equal(f["Gap Estimate"], 2);
  assert.deepEqual(JSON.parse(f["Findings JSON"]), [
    { type: "Omission", materiality: "high", anchor: "first verbatim span" },
    { type: "Framing Drift", materiality: "med", anchor: "second verbatim span" },
  ]);
  assert.ok(!("Answer" in f) && !("AI Model" in f) && !("Topic" in f), "no denormalized answer/model/topic on a P4 row");
  assert.ok(!JSON.stringify(create.body).includes(SECRET), "the raw answer is never serialized into the write");
});

test("handler single: gap null omits the Gap Estimate field entirely", async () => {
  // A receipt whose measurement.gap_estimate is non-numeric clamps to null → field omitted.
  const receipt = sign({
    receipt_type: "single",
    open_run: { question: "no gap here please", answer: SECRET, measurement: { findings: [{ type: "Omission", materiality: "m", anchor: "s" }], gap_estimate: "n/a" } },
  });
  const mock = makeAirtable({ proof: { id: "recRUN", fields: {} } });
  let res;
  await withFetch(mock, async () => {
    res = mockRes();
    await handler(mockReq({ receipt }), res);
  });
  assert.equal(res.statusCode, 200);
  const f = mock.calls.find((c) => c.method === "POST").body.fields;
  assert.ok(!("Gap Estimate" in f), "a null estimate writes no Gap Estimate field");
});

test("handler paired: mints Mode=paired with delta items; no raw answer", async () => {
  const receipt = pairedReceipt();
  const verifiedHash = receipt.integrity.content_hash;
  const mock = makeAirtable({ proof: { id: "recPAIR", fields: { "Receipt Hash": verifiedHash } } });
  let res;
  await withFetch(mock, async () => {
    res = mockRes();
    await handler(mockReq({ receipt }), res);
  });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.mode, "paired");
  const f = mock.calls.find((c) => c.method === "POST").body.fields;
  assert.equal(f.Mode, "paired");
  assert.deepEqual(JSON.parse(f["Findings JSON"]), [
    { point: "diverges on cost", signal_pattern: "Deflection", open_side: "open span", targeted_side: "targeted span" },
  ]);
  assert.ok(!JSON.stringify(f).includes(SECRET), "neither open nor targeted answer is stored");
});

test("handler: idempotent — an existing (hash,mode) share dedupes and mints nothing", async () => {
  const receipt = singleReceipt();
  const verifiedHash = receipt.integrity.content_hash;
  const mock = makeAirtable({
    proof: { id: "recRUN", fields: { "Receipt Hash": verifiedHash } },
    existing: { id: "recOLD", fields: { "Share ID": "existing123ABCdef456ghi" } },
  });
  let res;
  await withFetch(mock, async () => {
    res = mockRes();
    await handler(mockReq({ receipt }), res);
  });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.deduped, true);
  assert.equal(res.body.share_id, "existing123ABCdef456ghi");
  assert.ok(!mock.calls.some((c) => c.method === "POST"), "no duplicate row is minted");
});

// ── create-then-requery reconciliation (Item 7a) ─────────────────────────────────
// Two concurrent first-time creates for one (Receipt Hash, Mode) can both miss the
// read-before-write idempotency check and both write. The handler re-reads the key
// after its own create and converges on the canonical row (earliest Created At,
// record-ID tie-break) — deleting ONLY its own just-created row if it lost, NEVER a
// pre-existing row and NEVER a row picked merely for sharing the key (binding safety
// rule). Together the "loser" and "winner" cases below are the two sides of one race.

test("pickCanonicalShare: earliest Created At wins; equal timestamps break by record ID; empty → null", () => {
  assert.equal(pickCanonicalShare([]), null);
  assert.equal(pickCanonicalShare(null), null);
  assert.equal(
    pickCanonicalShare([
      { id: "recB", fields: { "Created At": "2026-07-11T00:00:00.001Z" } },
      { id: "recA", fields: { "Created At": "2026-07-11T00:00:00.000Z" } },
      { id: "recC", fields: { "Created At": "2026-07-11T00:00:00.002Z" } },
    ]).id,
    "recA",
    "earliest Created At is canonical",
  );
  assert.equal(
    pickCanonicalShare([
      { id: "recZ", fields: { "Created At": "2026-07-11T00:00:00.000Z" } },
      { id: "recA", fields: { "Created At": "2026-07-11T00:00:00.000Z" } },
    ]).id,
    "recA",
    "a Created At tie breaks by lowest record ID",
  );
  assert.equal(
    pickCanonicalShare([{ fields: {} }, { id: "recX", fields: { "Created At": "2026-01-01T00:00:00.000Z" } }]).id,
    "recX",
    "rows without an id are ignored",
  );
});

// The idempotency GET (maxRecords=1) misses so the handler creates; the POST returns
// recMINE; the post-create requery (maxRecords=10) returns whatever concurrent snapshot
// the test wants; DELETEs are recorded so a test can assert exactly which id was removed.
function reconcileAirtable({ verifiedHash, requeryOk = true, requery = [] }) {
  const calls = [];
  const impl = async (url, init = {}) => {
    const u = String(url);
    const method = (init.method || "GET").toUpperCase();
    const body = init.body ? JSON.parse(init.body) : null;
    calls.push({ url: u, method, body });
    if (method === "GET" && (u.includes(RUNS_TABLE) || u.includes(PAIRED_TABLE))) {
      return { ok: true, json: async () => ({ records: [{ id: "recRUN", fields: { "Receipt Hash": verifiedHash } }] }) };
    }
    if (method === "GET" && u.includes(TEST_TABLE)) {
      if (u.includes("maxRecords=10")) {
        if (!requeryOk) return { ok: false, status: 500, text: async () => "requery-err" };
        return { ok: true, json: async () => ({ records: requery }) };
      }
      return { ok: true, json: async () => ({ records: [] }) }; // idempotency miss → create
    }
    if (method === "POST" && u.includes(TEST_TABLE)) {
      return { ok: true, json: async () => ({ id: "recMINE", fields: body.fields }) };
    }
    if (method === "DELETE" && u.includes(TEST_TABLE)) {
      return { ok: true, json: async () => ({ deleted: true }) };
    }
    throw new Error(`unexpected fetch ${method} ${u}`);
  };
  return { impl, calls };
}

test("reconcile: my row loses the tie-break → delete ONLY my own row, return the canonical URL (deduped)", async () => {
  const receipt = singleReceipt();
  const verifiedHash = receipt.integrity.content_hash;
  const CANON = "canonWIN12345678abcd"; // 20 chars, valid Share ID
  const mock = reconcileAirtable({
    verifiedHash,
    requery: [
      { id: "recWIN", fields: { "Share ID": CANON, "Created At": "2000-01-01T00:00:00.000Z" } }, // earlier → canonical
      { id: "recMINE", fields: { "Share ID": "mineLATE0000000000000", "Created At": "2099-01-01T00:00:00.000Z" } },
    ],
  });
  let res;
  await withFetch(mock, async () => {
    res = mockRes();
    await handler(mockReq({ receipt }), res);
  });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.deduped, true);
  assert.equal(res.body.share_id, CANON, "converges on the canonical URL");
  assert.ok(res.body.share_url.includes(`/inspection/${CANON}`));
  const deletes = mock.calls.filter((c) => c.method === "DELETE");
  assert.equal(deletes.length, 1, "exactly one delete");
  assert.ok(deletes[0].url.endsWith("/recMINE"), "deletes ONLY this request's own just-created row");
  assert.ok(!mock.calls.some((c) => c.method === "DELETE" && c.url.includes("recWIN")), "never deletes the canonical row");
});

test("reconcile: my row IS canonical → keep it, delete nothing (never touches a concurrent duplicate)", async () => {
  const receipt = singleReceipt();
  const verifiedHash = receipt.integrity.content_hash;
  const mock = reconcileAirtable({
    verifiedHash,
    requery: [
      { id: "recMINE", fields: { "Share ID": "mineEARLY00000000000", "Created At": "2000-01-01T00:00:00.000Z" } }, // canonical
      { id: "recLATE", fields: { "Share ID": "otherDUP0000000000000", "Created At": "2099-01-01T00:00:00.000Z" } },
    ],
  });
  let res;
  await withFetch(mock, async () => {
    res = mockRes();
    await handler(mockReq({ receipt }), res);
  });
  assert.equal(res.statusCode, 200);
  assert.notEqual(res.body.deduped, true, "the winner mints normally, not a dedupe");
  assert.match(res.body.share_id, SHARE_ID_RE);
  assert.ok(
    !mock.calls.some((c) => c.method === "DELETE"),
    "the winner deletes nothing — the concurrent duplicate is the loser's/operator's to remove, never touched here",
  );
});

test("reconcile: a requery error fails safe → keep my row, delete nothing", async () => {
  const receipt = singleReceipt();
  const verifiedHash = receipt.integrity.content_hash;
  const mock = reconcileAirtable({ verifiedHash, requeryOk: false });
  let res;
  await withFetch(mock, async () => {
    res = mockRes();
    await handler(mockReq({ receipt }), res);
  });
  assert.equal(res.statusCode, 200);
  assert.notEqual(res.body.deduped, true);
  assert.match(res.body.share_id, SHARE_ID_RE);
  assert.ok(!mock.calls.some((c) => c.method === "DELETE"), "never delete on an uncertain view");
});

test("reconcile: my own row absent from the snapshot → keep it, delete nothing (never delete on a partial view)", async () => {
  const receipt = singleReceipt();
  const verifiedHash = receipt.integrity.content_hash;
  const mock = reconcileAirtable({
    verifiedHash,
    requery: [{ id: "recOTHER", fields: { "Share ID": "otherONLY00000000000", "Created At": "2000-01-01T00:00:00.000Z" } }],
  });
  let res;
  await withFetch(mock, async () => {
    res = mockRes();
    await handler(mockReq({ receipt }), res);
  });
  assert.equal(res.statusCode, 200);
  assert.notEqual(res.body.deduped, true);
  assert.match(res.body.share_id, SHARE_ID_RE);
  assert.ok(
    !mock.calls.some((c) => c.method === "DELETE"),
    "my row is not in the snapshot → it cannot be proven non-canonical → it is kept, nothing is deleted",
  );
});

// ── reportShareById: flag-only, never a takedown, never reverts an operator ───────
test("report: sets ONLY Report Flag=reported (single-field PATCH)", async () => {
  const mock = makeAirtable({ existing: { id: "recRPT", fields: { "Share ID": "s", Visibility: "unlisted" } } });
  let result;
  await withFetch(mock, async () => {
    result = await reportShareById("abc123DEF456ghi789jk");
  });
  assert.deepEqual(result, { ok: true, changed: true, state: "reported" });
  const patch = mock.calls.find((c) => c.method === "PATCH");
  assert.ok(patch, "a PATCH was issued");
  assert.deepEqual(Object.keys(patch.body.fields), ["Report Flag"], "exactly one field is written");
  assert.equal(patch.body.fields["Report Flag"], "reported");
  assert.ok(!("Visibility" in patch.body.fields), "a report can never touch visibility");
});

test("report: already 'reported' is a no-op (no PATCH)", async () => {
  const mock = makeAirtable({ existing: { id: "recRPT", fields: { "Report Flag": "reported" } } });
  let result;
  await withFetch(mock, async () => {
    result = await reportShareById("abc123DEF456ghi789jk");
  });
  assert.deepEqual(result, { ok: true, changed: false, state: "reported" });
  assert.ok(!mock.calls.some((c) => c.method === "PATCH"), "no write on a repeat report");
});

test("report: 'reviewed-kept' is never reverted (no PATCH)", async () => {
  const mock = makeAirtable({ existing: { id: "recRPT", fields: { "Report Flag": "reviewed-kept" } } });
  let result;
  await withFetch(mock, async () => {
    result = await reportShareById("abc123DEF456ghi789jk");
  });
  assert.deepEqual(result, { ok: true, changed: false, state: "reviewed-kept" });
  assert.ok(!mock.calls.some((c) => c.method === "PATCH"), "an operator's keep decision is never overwritten");
});

test("report: unknown share → not_found, no write", async () => {
  const mock = makeAirtable({ existing: null });
  let result;
  await withFetch(mock, async () => {
    result = await reportShareById("abc123DEF456ghi789jk");
  });
  assert.equal(result.ok, false);
  assert.equal(result.reason, "not_found");
  assert.ok(!mock.calls.some((c) => c.method === "PATCH"));
});

test("report: lookup store error → reason 'store', fails safe (no write)", async () => {
  const mock = makeAirtable({ existingOk: false });
  let result;
  await withFetch(mock, async () => {
    result = await reportShareById("abc123DEF456ghi789jk");
  });
  assert.equal(result.ok, false);
  assert.equal(result.reason, "store");
  assert.ok(!mock.calls.some((c) => c.method === "PATCH"));
});
