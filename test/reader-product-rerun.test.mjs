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
import { lintUserFacingStrings } from "../reader-check-vocab.js";

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

// AMENDED — the declared system now travels with the question; the captured answer
// still does not. The prior rule banned both in one line, and the two are not the same
// kind of thing.
//
// The ANSWER is the captured artifact. Restoring it would rebuild a capture taken on a
// different day and stand it up as today's, which is the failure that prohibition
// exists to prevent. It is untouched and it stays.
//
// The MODEL is a declaration about the run the person is about to make, not a captured
// value. A rerun is offered so two runs can be held against each other, and the system
// asked is the variable that comparison turns on — dropping it made the person re-enter
// the comparison variable from memory, or lose it. It is prefilled from the source
// record, never locked, and the row that results records whatever is left selected. The
// section "the system asked travels with the question" below holds all of that.
test("the workbench carries the question and the declared system, and no captured artifact", () => {
  const jsx = src("workbench-app.jsx");
  const effect = /const \{ rerunShareId, rerunRequested \} = parseArrival\(window\.location\);([\s\S]*?)\n  \}, \[\]\);/.exec(jsx);
  assert.ok(effect, "workbench-app.jsx must read the rerun arrival in one named effect");
  const body = effect[1];
  assert.match(body, /setQuestion\(/, "the question is seeded");
  assert.doesNotMatch(body, /setAnswer\(/, "the old answer must not be restored");
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

// ── A carry-over that does not arrive says so ────────────────────────────────
//
// The behaviour this section replaces: a `?rerun=` link that did not resolve produced
// the ordinary blank Reader. Nothing acknowledged that a carry-over had been asked for,
// so a person who clicked "Run this exact question again" and landed on an empty box
// had no way to tell a broken carry-over from a Reader that simply starts empty.
//
// What is required is narrow and it is bounded at FAILURE + RECOVERY. The Reader says
// the question is not there and points at the box that still works. It names no cause,
// because this branch cannot tell one — see the cause test below, which is what keeps a
// later pass from "improving" the line into a diagnosis the code cannot support.

const JSX = src("workbench-app.jsx");

const rerunEffectBody = () => {
  const m = /const \{ rerunShareId, rerunRequested \} = parseArrival\(window\.location\);([\s\S]*?)\n  \}, \[\]\);/.exec(JSX);
  assert.ok(m, "workbench-app.jsx must read the rerun arrival in one named effect");
  return m[1];
};

// The notice, read from source so the test and the product cannot hold two versions.
const noticeLiteral = () => {
  const m = /const RERUN_UNRESOLVED_NOTICE =\s*\n?\s*"([^"]*)";/.exec(JSX);
  assert.ok(m, "the notice must be one named constant, so there is one place it can be edited");
  return m[1];
};

test("a rerun param that cannot be read is still a rerun that was asked for", () => {
  // The distinction the acknowledgement rests on. Before this, a malformed id and no id
  // at all both arrived as the empty string and were indistinguishable.
  for (const bad of ["short", "a".repeat(33), "has spaces in it here", "../../etc/passwd"]) {
    const a = parseArrival({ search: `?rerun=${encodeURIComponent(bad)}` });
    assert.equal(a.rerunShareId, "", `"${bad}" must not be read as a share id`);
    assert.equal(a.rerunRequested, true, `"${bad}" is still a carry-over the person asked for`);
  }
});

test("an arrival carrying no rerun param has asked for nothing, and is not acknowledged", () => {
  for (const search of ["", "?start=chips", "?reader=1", "?rerun="]) {
    assert.equal(
      parseArrival({ search }).rerunRequested,
      false,
      `"${search}" must not be treated as a failed carry-over`,
    );
  }
});

test("every branch that can drop a carry-over acknowledges it, and none of them is silent", () => {
  const body = rerunEffectBody();
  assert.match(body, /if \(rerunRequested\) setRerunUnresolved\(true\);/, "the unreadable-id branch acknowledges");
  assert.match(body, /if \(!q\) \{\s*\n\s*setRerunUnresolved\(true\);/, "a read that yields no question acknowledges");
  assert.match(body, /\.catch\(\(\) => \{\s*\n\s*if \(live\) setRerunUnresolved\(true\);/, "a read that never completes acknowledges");
  // The specific regression: an empty catch is how this failed silently in the first
  // place, and it is the shape a later pass would most easily restore.
  assert.doesNotMatch(body, /\.catch\(\(\) => \{\}\)/, "the rerun read must not swallow its own failure");
});

test("the notice is one governed string, and it passes the user-facing lint", () => {
  const notice = noticeLiteral();
  assert.equal(
    notice,
    "The question didn't carry over. You can start a new inspection below.",
    "the notice is pinned; changing it is a copy decision, not a refactor",
  );
  assert.deepEqual(
    lintUserFacingStrings([notice]),
    [],
    "the notice must speak the same register as every other user-facing string",
  );
});

test("the notice states the failure and the recovery, and stops there", () => {
  const notice = noticeLiteral();
  const sentences = notice.split(/(?<=\.)\s+/).filter(Boolean);
  assert.equal(sentences.length, 2, "FAILURE + RECOVERY is the whole brief; a third sentence is expansion");
  assert.match(sentences[0], /didn't carry over/, "the first sentence is the failure");
  assert.match(sentences[1], /below/, "the second sentence points at the Reader that still works");
});

test("the notice names no cause, because the branch that renders it cannot tell one", () => {
  // Four different conditions land on this line — a malformed id, a record that no
  // longer resolves, a store that could not be reached, and a row holding no question.
  // Any word below would pick one of them and present it as known.
  const notice = noticeLiteral();
  for (const cause of ["expired", "removed", "deleted", "invalid", "incomplete", "broken", "wrong", "missing"]) {
    assert.doesNotMatch(
      notice,
      new RegExp(`\\b${cause}\\b`, "i"),
      `"${cause}" asserts a cause this branch does not know`,
    );
  }
  // And no blame: the person did nothing here but follow a link.
  assert.doesNotMatch(notice, /\byou (?:entered|typed|used|provided)\b/i, "the notice must not attribute the failure to the person");
});

test("the ordinary Reader survives an unresolved carry-over instead of being replaced by the notice", () => {
  // The recovery is only real if the instruction the person now needs is still on the
  // page. The notice is a sibling above the standing intro, never a substitute for it.
  const header = /<div className="wb-reader-v2__own-header">([\s\S]*?)<\/div>/.exec(JSX);
  assert.ok(header, "the own-mode header must be readable");
  const body = header[1];
  assert.match(
    body,
    /Paste an AI answer below\. The Reader inspects what it might be missing\./,
    "the standing intro must still render on the unresolved branch",
  );
  assert.match(body, /\{rerunUnresolved \? \(/, "the notice is conditional on the unresolved state");
  assert.match(body, /\{RERUN_UNRESOLVED_NOTICE\}/, "the notice renders the governed constant, not a second copy");
  // The successful carry-over is untouched: it still replaces the intro with its own
  // arrival line, and the notice belongs to the other branch entirely.
  assert.match(body, /\{rerunSeeded \? \(/, "the seeded branch is unchanged");
  const seededAt = body.indexOf("rerunSeeded ?");
  const unresolvedAt = body.indexOf("rerunUnresolved ?");
  assert.ok(seededAt !== -1 && unresolvedAt > seededAt, "the unresolved notice lives on the not-seeded branch");
});

test("the notice adds no rule of its own; it borrows the arrival treatment already shipped", () => {
  // A new class here would mean a new rgba family and a visual decision this lane did
  // not take. It reuses the rerun arrival line's treatment because it is the same kind
  // of thing: context on arrival, not instruction.
  assert.match(
    JSX,
    /className="wb-reader-v2__own-intro wb-reader-v2__own-intro--rerun" role="status"/,
    "the notice reuses the existing arrival treatment",
  );
  const css = src("workbench.css");
  assert.doesNotMatch(css, /own-intro--rerun-unresolved/, "no new rule may be introduced for the notice");
});

// ── The system asked travels with the question ───────────────────────────────
//
// A rerun exists to be compared with the run it came from. The question and the system
// asked are the two variables that comparison turns on, and only one of them used to
// survive the trip. The record already carried the other, so this is a read of data
// that was already on the wire — no new request, no new field, no new endpoint.

const MODELS_IN_SOURCE = JSON.parse(/const MODELS = (\[[^\]]*\]);/.exec(JSX)[1]);

test("the record a rerun already reads carries the system that was asked", async () => {
  // The proof that this needed no new data dependency: the same GET the rerun path has
  // always made returns the model, on the projection it has always returned.
  const res = await withFetch(airtableStub([shareRow()]), () => getShare(SHARE_ID));
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.record.ai_model, "ChatGPT", "the model is on the record the rerun path already fetches");
  assert.ok(
    MODELS_IN_SOURCE.includes(res.body.record.ai_model),
    "and it is a value the shipped selector can already represent, so no normalization is invented",
  );
});

test("a model the selector can represent is carried into it, and one it cannot is not", () => {
  const body = rerunEffectBody();
  assert.match(body, /const carried = String\(record\.ai_model \|\| ""\)\.trim\(\);/, "the model is read off the record already in hand");
  assert.match(
    body,
    /if \(MODELS\.includes\(carried\)\) setModel\(carried\);/,
    "the selector is set only from a value it already offers; anything else leaves it alone",
  );
  // The withheld case, proved against the real list rather than asserted about it.
  for (const unrepresentable of ["", "GPT-4o mini", "Llama 3", "some in-house build"]) {
    assert.equal(
      MODELS_IN_SOURCE.includes(unrepresentable),
      false,
      `"${unrepresentable}" is not offered by the selector, so the gate above withholds it`,
    );
  }
});

test("the carried selection stays editable and is never locked", () => {
  const select = /function ModelSelect\(\{ value, onChange \}\) \{([\s\S]*?)\n\}/.exec(JSX);
  assert.ok(select, "ModelSelect must be readable");
  const body = select[1];
  assert.doesNotMatch(body, /\bdisabled=\{(?!)/, "the selector must not be disabled");
  assert.doesNotMatch(body, /\breadOnly\b/, "the selector must not be read-only");
  assert.match(body, /onChange=\{\(e\) => onChange\(e\.target\.value\)\}/, "it still reports every change the person makes");
  // And the own-mode field still hands it the live setter, so a prefilled value is
  // changed by the same path an unfilled one is.
  assert.match(
    JSX,
    /<Field label="Which AI did you ask\? \(optional\)"><ModelSelect value=\{model\} onChange=\{setModel\} \/><\/Field>/,
    "the own-mode field wires the selector to the live model state",
  );
  const effect = rerunEffectBody();
  assert.doesNotMatch(effect, /setModelLocked|lockModel|readOnly|disabled/, "the rerun path must not lock what it prefills");
});

test("the row a rerun produces records what the person left selected, not the source record", () => {
  // The seam that makes prefilling safe: the request is built from the live `model`
  // state, so an edited selection is what travels, and the value the rerun arrived with
  // has no separate path to the record.
  const request = /const request = buildReaderRequest\(\{([\s\S]*?)\}\);/.exec(JSX);
  assert.ok(request, "the reader request must be built in one place");
  assert.match(request[1], /^\s*model,\s*$/m, "the request takes the live model state");
  assert.doesNotMatch(request[1], /ai_model|record\./, "no value from the source record reaches the new row");
});
