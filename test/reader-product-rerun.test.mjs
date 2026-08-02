// The product rerun — "Run this exact question again" — and the seam that keeps it
// separate from the instrument rerun.
//
// Two reruns exist and they are not the same thing:
//
//   PRODUCT RERUN (here). A person reading a dated receipt carries that one published
//   question over to a blank inspection, re-asks their own system, and pastes what it
//   says today. Imbas asks nothing on anyone's behalf. The run it starts is a separate
//   record with its own date, related to the first only by the person who ran both.
//
//   INSTRUMENT RERUN (not here, and this file's job is to keep it not-here). A governed
//   re-ask of a tracked question under capture protocol, minting a new capture_id and
//   inheriting a question_group_id. It is lineage machinery and it never renders as a
//   product feature.
//
// So the two things that can go wrong are (1) the product rerun editing the record it
// was launched from, which would break the receipt's whole promise, and (2) capture
// lineage leaking into a user-facing control, which would let a product convenience
// pass itself off as a governed measurement. Both are held below.
//
// Run: node --test test/reader-product-rerun.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { parseArrival, LANE_CHIPS, LANE_INSPECT, STAGE_COMPARE } from "../reader-stage.js";

const TEST_TABLE = "tblTESTSHARES0001";
process.env.AIRTABLE_BASE = "appTESTBASE0000000";
process.env.AIRTABLE_TOKEN = "test-token";
process.env.AIRTABLE_INSPECTION_SHARES_TABLE = TEST_TABLE;

const shareEndpoint = (await import("../api/inspection/[shareId].js")).default;

const SHARE_ID = "Ab3-_xQ7zK9mNpR2sTuV";
const QUESTION = "What does the FDA advisory committee vote actually bind?";

const src = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

// The row a rerun reads from: a minted P4 single share, with the two facts that date it.
function shareRow() {
  return {
    id: "recSHARE001",
    fields: {
      "Share ID": SHARE_ID,
      Mode: "single",
      Question: QUESTION,
      "Receipt Hash": "a".repeat(64),
      "Findings JSON": JSON.stringify([
        { type: "omission", materiality: "high", anchor: "a preserved span" },
      ]),
      "Captured At": "2026-07-09T14:20:00.000Z",
      "AI Model": "ChatGPT",
      "Created At": "2026-07-09T14:31:00.000Z",
      Visibility: "unlisted",
      "Reviewed Status": "Unreviewed",
    },
  };
}

// Records every Airtable call so a test can assert which writes did not happen.
function airtableStub(rows) {
  const calls = [];
  const impl = async (url, init = {}) => {
    const method = (init.method || "GET").toUpperCase();
    calls.push({ url: String(url), method });
    if (method === "GET") return { ok: true, json: async () => ({ records: rows }) };
    throw new Error(`the rerun read issued a ${method}`);
  };
  return { impl, calls };
}

async function withFetch(stub, fn) {
  const original = global.fetch;
  global.fetch = stub.impl;
  try {
    return await fn();
  } finally {
    global.fetch = original;
  }
}

function mockRes() {
  return {
    statusCode: 0,
    body: undefined,
    headers: {},
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    status(c) { this.statusCode = c; return this; },
    json(o) { this.body = o; return this; },
  };
}

const getShare = (id) => shareEndpoint({ method: "GET", query: { shareId: id }, headers: {} }, mockRes());

// ── The arrival read ─────────────────────────────────────────────────────────

test("a rerun link names the record it carries a question from", () => {
  assert.equal(parseArrival({ search: `?rerun=${SHARE_ID}` }).rerunShareId, SHARE_ID);
});

test("a rerun param that is not a share id is not a rerun", () => {
  for (const bad of ["", "short", "a".repeat(33), "has spaces in it here", "../../etc/passwd", "<script>x</script>"]) {
    assert.equal(
      parseArrival({ search: `?rerun=${encodeURIComponent(bad)}` }).rerunShareId,
      "",
      `"${bad}" must not be read as a share id`,
    );
  }
});

test("the rerun read leaves every other arrival intent alone", () => {
  const both = parseArrival({ search: `?start=chips&rerun=${SHARE_ID}`, hash: "#stage=compare" });
  assert.equal(both.lane, LANE_CHIPS);
  assert.equal(both.stage, STAGE_COMPARE);
  assert.equal(both.rerunShareId, SHARE_ID);
  const neither = parseArrival({ search: "" });
  assert.equal(neither.lane, LANE_INSPECT);
  assert.equal(neither.rerunShareId, "");
});

// ── The record does not change ───────────────────────────────────────────────

test("launching a rerun writes nothing to the record it was launched from", async () => {
  const stub = airtableStub([shareRow()]);
  const res = await withFetch(stub, () => getShare(SHARE_ID));
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.ok, true);
  assert.equal(res.body.record.question, QUESTION);
  assert.ok(stub.calls.length > 0, "the read must actually reach Airtable");
  for (const c of stub.calls) {
    assert.equal(c.method, "GET", `the rerun path issued a ${c.method}`);
  }
});

test("the receipt reads the same after a rerun is launched from it", async () => {
  const row = shareRow();
  const before = await withFetch(airtableStub([row]), () => getShare(SHARE_ID));
  const after = await withFetch(airtableStub([row]), () => getShare(SHARE_ID));
  assert.deepEqual(after.body.record.receipt, before.body.record.receipt);
  assert.equal(after.body.record.receipt.anchor.text, "Captured 9 July 2026, ChatGPT. Answers change; this record doesn't.");
});

test("a rerun cannot restore the old answer, because no share holds one", async () => {
  const res = await withFetch(airtableStub([shareRow()]), () => getShare(SHARE_ID));
  const rec = res.body.record;
  assert.ok(!("answer" in rec), "a P4 projection carries no answer to seed a rerun with");
  assert.equal(typeof rec.question, "string");
  assert.ok(rec.question.length > 0, "the question is the one thing a rerun carries");
});

// ── The link is derived from the id, and from nothing else ───────────────────

test("the rerun control carries a share id and no record content", () => {
  const js = src("inspection.js");
  const fn = /function rerunHref\(record\)\s*\{([\s\S]*?)\n\}/.exec(js);
  assert.ok(fn, "inspection.js must build the rerun link in one named place");
  const body = fn[1];
  assert.match(body, /share_id/, "the link is built from the share id");
  assert.match(body, /encodeURIComponent/, "the id is encoded into the URL");
  for (const leak of ["question", "findings", "anchor", "receipt", "captured_at", "ai_model"]) {
    assert.doesNotMatch(body, new RegExp(`\\b${leak}\\b`), `the rerun link must not carry ${leak}`);
  }
});

test("the receipt page says plainly that running it again does not revise this record", () => {
  const js = src("inspection.js");
  assert.match(js, /Run this exact question again/);
  assert.match(js, /Running it again starts a new record with its own date\. This one does not change\./);
});

test("the workbench carries the question over and nothing else", () => {
  const jsx = src("workbench-app.jsx");
  const effect = /const \{ rerunShareId \} = parseArrival\(window\.location\);([\s\S]*?)\n  \}, \[\]\);/.exec(jsx);
  assert.ok(effect, "workbench-app.jsx must read the rerun arrival in one named effect");
  const body = effect[1];
  assert.match(body, /setQuestion\(/, "the question is seeded");
  assert.doesNotMatch(body, /setAnswer\(/, "the old answer must not be restored");
  assert.doesNotMatch(body, /setModel\(/, "the declared system must not be restored");
  assert.doesNotMatch(body, /method:\s*["']POST["']/, "the rerun read is a GET");
});

// ── The seam: two reruns, two names, no leakage ──────────────────────────────

test("no capture-lineage identifier reaches a product surface", () => {
  const LINEAGE = /\b(capture_id|question_group_id|captureId|questionGroupId)\b/;
  for (const f of ["inspection.js", "inspection.css", "reader-stage.js", "workbench-app.jsx", "reader-receipt-page.js"]) {
    assert.doesNotMatch(src(f), LINEAGE, `${f} must carry no capture-lineage identifier`);
  }
});

test("the product rerun does not describe itself as a governed re-ask", () => {
  // The instrument rerun's vocabulary. A product convenience borrowing these words
  // would claim a measurement protocol it does not run.
  const INSTRUMENT = /governed re-ask|capture protocol|instrument rerun|inherits the group/i;
  for (const f of ["inspection.js", "workbench-app.jsx", "reader-stage.js"]) {
    assert.doesNotMatch(src(f), INSTRUMENT, `${f} must not borrow instrument-rerun vocabulary`);
  }
});

test("the rerun arrival is a query flag, not a new mechanism", () => {
  const js = src("reader-stage.js");
  assert.match(js, /params\.get\("rerun"\)/, "it reads the same URLSearchParams as every other arrival flag");
  assert.doesNotMatch(js, /localStorage|sessionStorage/, "nothing about a rerun persists");
});
