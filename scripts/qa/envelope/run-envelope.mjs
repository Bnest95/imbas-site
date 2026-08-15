// The matched envelope experiment: does the Reader stay reliable as the pasted answer
// gets longer?
//
// Input word count is the manipulated variable. Everything else is held: three topic
// families, each authored once and sectioned so that every rung is a literal prefix of
// the next. The 500-word rung of family A is the opening of its own 2500-word rung, not
// a different answer about the same subject, so a difference between rungs cannot be a
// difference of content.
//
// Three modes, and the order matters:
//   --plan   compose every rung, print its pre-registered artifact id. No network.
//   --probe  ask the live endpoint what ceiling it enforces. Rejected by design, so it
//            costs no rate budget, no inference and no production row.
//   --run    the 15 runs. Every one writes a permanent Reader Runs row.
//
// Nothing here deletes anything, and nothing here retries a run. A failed run is a
// result.

import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { ANSWER_WORD_MAX, countAnswerWords } from "../../../reader-input-envelope.js";
import familyA from "./family-a.js";
import familyB from "./family-b.js";
import familyC from "./family-c.js";

const HOST = process.env.ENVELOPE_HOST || "https://imbaslabs.com";
const RUNGS = [500, 900, 1200, 1800, 2500];
const FAMILIES = [familyA, familyB, familyC];

// Clear of every tier in reader-security.js: burst 3/10s, minute 12/60s, day 48/24h. At
// this spacing any 60-second window holds at most three requests.
const GAP_MS = 25_000;
const REQUEST_TIMEOUT_MS = 120_000;

const sha256Hex = (s) => createHash("sha256").update(String(s), "utf8").digest("hex");

// The identifier the Reader Runs row will carry, computed from the input alone. This is
// what lets every artifact be registered before the first request goes out rather than
// discovered after.
const sourceContentHash = (question, answer) => sha256Hex(`${question}\n${answer}`);

// The section prefix landing nearest the target, never above the ceiling. Nearest rather
// than largest-under, because sections run about a hundred words and largest-under can
// miss low by nearly a full section — a 500 rung delivered at 403 words is a fifth short
// on the one variable this experiment manipulates. The ceiling cap is absolute: a rung
// over it would measure the rejection path instead of the inspection path.
function composeRung(family, target) {
  let best = 0;
  let bestGap = Infinity;
  for (let n = 1; n <= family.sections.length; n += 1) {
    const words = countAnswerWords(family.sections.slice(0, n).join("\n\n"));
    if (words > ANSWER_WORD_MAX) break;
    const gap = Math.abs(words - target);
    if (gap < bestGap) {
      bestGap = gap;
      best = n;
    }
  }
  const answer = family.sections.slice(0, best).join("\n\n");
  return { answer, sections: best, words: countAnswerWords(answer), chars: answer.length };
}

// Each block holds one run at every length, and the family rotates. So length never
// drifts with time-of-day: if the service slows down halfway through, it slows down
// across all five lengths rather than only the long ones.
function buildSchedule() {
  const runs = [];
  for (let block = 0; block < 3; block += 1) {
    RUNGS.forEach((target, i) => {
      const family = FAMILIES[(block + i) % 3];
      const composed = composeRung(family, target);
      runs.push({
        id: `${family.id}-${target}`,
        family: family.id,
        topic: family.topic,
        question: family.question,
        target,
        block: block + 1,
        ...composed,
        source_content_hash: sourceContentHash(family.question, composed.answer),
      });
    });
  }
  return runs;
}

// A fallback states its reason in the read itself. That parenthetical is the only durable
// trace of what the runtime log calls parse_error_class, so it is read here rather than
// inferred: "(bad_json)" and "(timeout)" are different results and collapsing them would
// throw away the finding.
function fallbackReason(payload) {
  const m = /unavailable right now \(([^)]+)\)/.exec(payload?.the_read || "");
  return m ? m[1] : null;
}

function endsClean(text) {
  return /[.!?"']\s*$/.test(String(text || "").trim());
}

function inspectionChars(p) {
  const leftOut = Array.isArray(p?.what_was_left_out) ? p.what_was_left_out.join(" ") : "";
  return [p?.the_read, leftOut, p?.how_it_was_shaped, p?.inspection_note]
    .map((s) => String(s || "").length)
    .reduce((a, b) => a + b, 0);
}

async function post(path, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const started = Date.now();
  try {
    const res = await fetch(`${HOST}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {}
    return { status: res.status, json, bytes: text.length, ms: Date.now() - started, aborted: false };
  } catch (err) {
    return {
      status: 0,
      json: null,
      bytes: 0,
      ms: Date.now() - started,
      aborted: err?.name === "AbortError",
      error: String(err?.message || err),
    };
  } finally {
    clearTimeout(timer);
  }
}

function record(run, res) {
  const p = res.json || {};
  const accepted = res.status === 200;
  const fallback = accepted && p.source === "fallback";
  const reason = fallback ? fallbackReason(p) : null;
  return {
    id: run.id,
    family: run.family,
    target_words: run.target,
    block: run.block,
    sections: run.sections,
    // Measured with the same counter the gate uses, not an approximation of it.
    input_words: run.words,
    input_chars: run.chars,
    source_content_hash: run.source_content_hash,
    accepted,
    http_status: res.status,
    rejection_error: accepted ? null : p.error || null,
    rejection_limit_words: accepted ? null : p.limit_words ?? null,
    request_id: p?.receipt?.provenance?.request_id || null,
    total_request_ms: res.ms,
    // Server-side inference duration and output token count live only in the runtime
    // log stream, which has no durable sink. Null here means unobservable, not zero.
    inference_ms: null,
    output_tokens: null,
    response_bytes: res.bytes,
    inspection_chars: accepted ? inspectionChars(p) : 0,
    parse_succeeded: accepted ? p.source === "agent" : null,
    parse_error_class: reason,
    fallback,
    timed_out: res.aborted || reason === "timeout",
    completeness: accepted ? p.completeness || null : null,
    findings_count: Array.isArray(p.what_was_left_out) ? p.what_was_left_out.length : 0,
    measurement_present: !!p.measurement,
    result_present: !!p.result,
    receipt_present: !!p.receipt,
    capture_uncertain: !!p.capture_uncertain,
    // A real inspection, as opposed to a 200 that carried the honest fallback.
    substantive: accepted && p.source === "agent" && !!p.measurement && String(p.the_read || "").trim().length > 0,
    // Truncation leaves a read that stops without terminal punctuation, or an agent run
    // whose measurement never arrived.
    truncation_suspected: accepted && p.source === "agent" && (!endsClean(p.the_read) || !p.measurement),
    transport_error: res.error || null,
  };
}

function table(rows, cols) {
  const head = cols.join("\t");
  return [head, ...rows.map((r) => cols.map((c) => r[c]).join("\t"))].join("\n");
}

async function plan() {
  const schedule = buildSchedule();
  console.log(`Envelope experiment plan — ${schedule.length} runs against ${HOST}\n`);
  console.log(
    table(schedule, ["id", "block", "family", "target", "sections", "words", "chars", "source_content_hash"]),
  );
  const over = schedule.filter((r) => r.words > ANSWER_WORD_MAX);
  console.log(`\nCeiling in this tree: ${ANSWER_WORD_MAX}. Rungs over it: ${over.length}`);
  console.log("Every hash above is a production artifact this experiment will create.");
}

// One request the endpoint is guaranteed to refuse, read for the limit it names. Rejection
// happens before the rate check and before any model call, so this costs nothing and
// creates nothing.
async function probe() {
  const filler = Array.from({ length: ANSWER_WORD_MAX + 1 }, (_, i) => `word${i}`).join(" ");
  const words = countAnswerWords(filler);
  console.log(`Probing ${HOST} with a ${words}-word answer (deliberately one over ${ANSWER_WORD_MAX}).`);
  const res = await post("/api/read", {
    open_question: "What ceiling does the deployed Reader enforce?",
    answer: filler,
  });
  console.log(`status ${res.status} in ${res.ms}ms`);
  if (res.status === 400 && res.json?.error === "too_long") {
    console.log(`DEPLOYED CEILING: ${res.json.limit_words} words`);
    console.log(
      res.json.limit_words === ANSWER_WORD_MAX
        ? "Matches this tree. The raise is live."
        : "Does NOT match this tree. The raise has not deployed yet.",
    );
  } else {
    console.log("Unexpected response — the probe proves nothing. Body:");
    console.log(JSON.stringify(res.json, null, 2));
  }
}

async function run() {
  const schedule = buildSchedule();
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const out = `scripts/qa/envelope/results-${stamp}.json`;

  console.log(`Registering ${schedule.length} production artifacts before any request:\n`);
  console.log(table(schedule, ["id", "block", "words", "chars", "source_content_hash"]));
  console.log(`\nResults will be written to ${out} after every run, so a crash keeps what landed.\n`);

  const rows = [];
  for (const [i, r] of schedule.entries()) {
    process.stdout.write(`[${i + 1}/${schedule.length}] ${r.id} (${r.words}w) ... `);
    const res = await post("/api/read", {
      open_question: r.question,
      answer: r.answer,
      case: { topic: r.topic },
    });
    const row = record(r, res);
    rows.push(row);
    writeFileSync(out, JSON.stringify({ host: HOST, started: stamp, runs: rows }, null, 2));
    console.log(
      row.accepted
        ? `${row.http_status} ${row.completeness} source=${row.parse_succeeded ? "agent" : row.parse_error_class} ${row.total_request_ms}ms`
        : `${row.http_status} ${row.rejection_error} ${row.total_request_ms}ms`,
    );
    if (i < schedule.length - 1) await new Promise((ok) => setTimeout(ok, GAP_MS));
  }

  console.log(`\n── results ──`);
  console.log(
    table(rows, [
      "id",
      "input_words",
      "accepted",
      "total_request_ms",
      "parse_succeeded",
      "parse_error_class",
      "fallback",
      "timed_out",
      "completeness",
      "findings_count",
      "substantive",
      "truncation_suspected",
    ]),
  );
  console.log(`\nWritten to ${out}`);
}

const mode = process.argv[2];
if (mode === "--plan") await plan();
else if (mode === "--probe") await probe();
else if (mode === "--run") await run();
else {
  console.log("usage: node scripts/qa/envelope/run-envelope.mjs [--plan|--probe|--run]");
  process.exit(1);
}
