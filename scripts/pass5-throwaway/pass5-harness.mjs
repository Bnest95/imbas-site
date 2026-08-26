#!/usr/bin/env node
//
// PASS 5 CANDIDATE-MEASUREMENT HARNESS — THROWAWAY.
//
// Not product code. Nothing in the product imports this file, and this file
// modifies no product code path. It lives under scripts/, which .vercelignore
// excludes from deploy, so it cannot become a route even if it is merged.
//
// It reads an approved run sheet and makes the calls that sheet tables, one
// call per tabled run, one pass, no retries and no re-rolls. It writes the
// full unedited request and response for every run to its own file, plus a
// machine-readable index, plus its own exit code to its own file.
//
// Three guards are enforced in code below, not in comments:
//   GUARD 1  MAX_MODEL_CALLS, hard-coded at 54, checked before every call.
//   GUARD 2  refusal to execute if AIRTABLE_TOKEN is present in the environment.
//   GUARD 3  refusal to execute unless the SHA-256 of the given run sheet equals
//            EXPECTED_SHEET_SHA256, which ships empty.
// A fourth guard pins the only reachable endpoint.
//
// EXPECTED_SHEET_SHA256 is empty in this commit. While it is empty the harness
// refuses every execution mechanically. It is set only to the bytes of a run
// sheet the founder has approved.
//
// Usage:  node scripts/pass5-throwaway/pass5-harness.mjs <sheet.json> <outdir>

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash, randomBytes } from "node:crypto";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..", "..");

// ---------------------------------------------------------------------------
// GUARD 1 — hard-coded model-call ceiling.
// ---------------------------------------------------------------------------
const MAX_MODEL_CALLS = 54;
let modelCallsMade = 0;

// ---------------------------------------------------------------------------
// GUARD 3 — expected run-sheet hash. SHIPS EMPTY. Set only after founder
// approval, to the bytes of the approved sheet.
// ---------------------------------------------------------------------------
const EXPECTED_SHEET_SHA256 = "";

// ---------------------------------------------------------------------------
// GUARD 4 — the single reachable endpoint.
// ---------------------------------------------------------------------------
const ALLOWED_ORIGIN = "https://api.anthropic.com";
const ALLOWED_HOST = "api.anthropic.com";

// The shipped analysis artifacts live here and are read, never written.
const PRODUCT_SOURCE = resolve(REPO_ROOT, "api", "read-paired.js");

let exitCodePath = null;

function writeExitCode(code) {
  if (!exitCodePath) return;
  try {
    writeFileSync(exitCodePath, String(code) + "\n", "utf8");
  } catch {
    /* the exit code still leaves through process.exit */
  }
}

function refuse(code, reason) {
  process.stderr.write(`REFUSED (${code}): ${reason}\n`);
  writeExitCode(code);
  process.exit(code);
}

// ---------------------------------------------------------------------------
// GUARD 2 — capture must be unconfigured. Presence of the name is the trip,
// not truthiness, so AIRTABLE_TOKEN="" is refused too.
// ---------------------------------------------------------------------------
function guardCaptureUnconfigured() {
  if ("AIRTABLE_TOKEN" in process.env) {
    refuse(
      11,
      "AIRTABLE_TOKEN is present in the environment. This harness writes no capture rows and " +
        "refuses to run where it could. Unset it and run again. Nothing ran.",
    );
  }
}

// ---------------------------------------------------------------------------
// GUARD 3 body.
// ---------------------------------------------------------------------------
function guardSheetHash(sheetBytes) {
  const actual = createHash("sha256").update(sheetBytes).digest("hex");
  if (EXPECTED_SHEET_SHA256.length === 0) {
    refuse(
      12,
      "EXPECTED_SHEET_SHA256 is empty: no run sheet has been approved by the founder. " +
        `The sheet handed to this run hashes to ${actual}. Nothing ran, and no model call was made.`,
    );
  }
  if (actual !== EXPECTED_SHEET_SHA256) {
    refuse(
      13,
      `run sheet SHA-256 mismatch. expected=${EXPECTED_SHEET_SHA256} actual=${actual}. ` +
        "The sheet handed to this run is not the sheet the founder approved. Nothing ran.",
    );
  }
  return actual;
}

// ---------------------------------------------------------------------------
// GUARD 1 body — checked before every call, and again against the sheet size
// before any call is made.
// ---------------------------------------------------------------------------
function guardCallBudget(runId) {
  if (modelCallsMade >= MAX_MODEL_CALLS) {
    refuse(
      14,
      `model-call budget of ${MAX_MODEL_CALLS} is exhausted; refused before run ${runId}. ` +
        `${modelCallsMade} calls were made.`,
    );
  }
}

function guardSheetSize(runs) {
  if (!Array.isArray(runs) || runs.length === 0) {
    refuse(16, "the run sheet tables no runs.");
  }
  if (runs.length > MAX_MODEL_CALLS) {
    refuse(
      16,
      `the run sheet tables ${runs.length} runs, above the hard-coded ceiling of ${MAX_MODEL_CALLS}. Nothing ran.`,
    );
  }
}

// ---------------------------------------------------------------------------
// GUARD 5 — a fixture must carry runnable bytes, not a description of bytes.
//
// docs/second-question-bank-test-pack.md specifies its 24 inputs in prose and
// writes none of them out. A sheet that tables a specification where the input
// belongs would measure the model against a description of an input. This guard
// makes that refusal mechanical rather than advisory.
// ---------------------------------------------------------------------------
function guardFixtureComplete(run, fixture) {
  const required = ["supplied_material", "open_question", "open_answer"];
  if (run.call_shape === "shipped_paired") required.push("targeted_answer");
  for (const field of required) {
    if (typeof fixture[field] !== "string") {
      refuse(
        21,
        `fixture ${run.fixture} has no authored bytes for "${field}" (run ${run.run_id}). ` +
          "It carries a specification, not an input. No call was made for this run or any run after it.",
      );
    }
  }
}

// ---------------------------------------------------------------------------
// GUARD 4 body.
// ---------------------------------------------------------------------------
function guardEndpoint(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    refuse(15, `endpoint ${url} does not parse as a URL.`);
  }
  if (parsed.protocol !== "https:" || parsed.hostname !== ALLOWED_HOST) {
    refuse(
      15,
      `endpoint ${parsed.protocol}//${parsed.hostname} is not the single allowed endpoint ${ALLOWED_ORIGIN}.`,
    );
  }
  return parsed.toString();
}

// ---------------------------------------------------------------------------
// Shipped artifacts, read-only from the tree.
//
// CHIP_PAIRED_SYSTEM_PROMPT is exported, so it is imported.
//
// buildPairedUserMessage is NOT exported on master. It is read out of the
// product file's own bytes at run time: the tree is not modified, and no copy
// of the function's text lives in this file. The extracted bytes are hashed and
// the hash is written into the index, so the return can name exactly which
// bytes were measured.
// ---------------------------------------------------------------------------
async function loadShippedSystemPrompt() {
  const mod = await import(pathToFileURL(PRODUCT_SOURCE).href);
  if (typeof mod.CHIP_PAIRED_SYSTEM_PROMPT !== "string") {
    refuse(17, "CHIP_PAIRED_SYSTEM_PROMPT is not exported as a string by the product source.");
  }
  return {
    text: mod.CHIP_PAIRED_SYSTEM_PROMPT,
    version: mod.CHIP_PAIRED_PROMPT_VERSION,
    sha256: createHash("sha256").update(mod.CHIP_PAIRED_SYSTEM_PROMPT, "utf8").digest("hex"),
  };
}

function extractShippedUserMessageBuilder() {
  const text = readFileSync(PRODUCT_SOURCE, "utf8");
  const needle = "function buildPairedUserMessage(";
  const start = text.indexOf(needle);
  if (start < 0) {
    refuse(18, `${PRODUCT_SOURCE} no longer declares buildPairedUserMessage; extraction refused.`);
  }
  if (text.indexOf(needle, start + 1) >= 0) {
    refuse(18, "buildPairedUserMessage is declared more than once; extraction refused as ambiguous.");
  }
  let i = start + needle.length - 1;
  let paren = 0;
  let sigEnd = -1;
  for (; i < text.length; i++) {
    if (text[i] === "(") paren++;
    else if (text[i] === ")") {
      paren--;
      if (paren === 0) {
        sigEnd = i + 1;
        break;
      }
    }
  }
  if (sigEnd < 0) refuse(18, "buildPairedUserMessage parameter list does not close; extraction refused.");
  let depth = 0;
  let end = -1;
  for (i = text.indexOf("{", sigEnd); i < text.length; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}") {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  if (end < 0) refuse(18, "buildPairedUserMessage body does not close; extraction refused.");
  const source = text.slice(start, end);
  const fn = new Function("randomBytes", source + "\nreturn buildPairedUserMessage;")(randomBytes);
  return {
    fn,
    bytes: Buffer.byteLength(source, "utf8"),
    sha256: createHash("sha256").update(source, "utf8").digest("hex"),
  };
}

// ---------------------------------------------------------------------------
// Call assembly. The sheet tables the shape; the harness implements exactly two
// and refuses anything else.
//
//   "steering"        the model answers again under the arm's instruction. The
//                     system bytes come from the sheet, which the founder
//                     approves byte-for-byte, exactly as the instruction bytes do.
//   "shipped_paired"  the shipped chip analysis configuration: system is
//                     CHIP_PAIRED_SYSTEM_PROMPT from the tree, user is the
//                     tree-extracted buildPairedUserMessage over four blocks.
// ---------------------------------------------------------------------------
function assembleCall(run, sheet, shipped) {
  const fixture = sheet.fixtures[run.fixture];
  if (!fixture) refuse(19, `run ${run.run_id} names fixture ${run.fixture}, which the sheet does not table.`);
  const arm = sheet.arms[run.arm];
  if (!arm) refuse(19, `run ${run.run_id} names arm ${run.arm}, which the sheet does not table.`);
  guardFixtureComplete(run, fixture);

  if (run.call_shape === "steering") {
    return {
      system: [{ type: "text", text: sheet.steering_system_prompt }],
      user: [
        sheet.steering_user_template.material_header,
        fixture.supplied_material,
        "",
        sheet.steering_user_template.question_header,
        fixture.open_question,
        "",
        sheet.steering_user_template.answer_header,
        fixture.open_answer,
        "",
        sheet.steering_user_template.instruction_header,
        arm.instruction_text,
      ].join("\n"),
    };
  }

  if (run.call_shape === "shipped_paired") {
    return {
      system: [
        { type: "text", text: shipped.systemPrompt.text, cache_control: { type: "ephemeral" } },
      ],
      user: shipped.buildUserMessage({
        openQuestion: fixture.open_question,
        openAnswer: fixture.open_answer,
        targetedPrompt: arm.instruction_text,
        targetedAnswer: fixture.targeted_answer,
      }),
    };
  }

  refuse(
    19,
    `run ${run.run_id} names call_shape "${run.call_shape}". Only "steering" and "shipped_paired" are implemented.`,
  );
}

// ---------------------------------------------------------------------------
// One pass. No retries, no re-rolls. A failed call is recorded as a failed call
// and the harness moves to the next tabled run.
// ---------------------------------------------------------------------------
async function runOne(run, sheet, shipped, apiKey, outDir, dryRun) {
  guardCallBudget(run.run_id);

  const call = assembleCall(run, sheet, shipped);
  const requestBody = {
    model: sheet.call.model,
    max_tokens: sheet.call.max_tokens,
    thinking: sheet.call.thinking,
    system: call.system,
    messages: [{ role: "user", content: call.user }],
  };
  const url = guardEndpoint(ALLOWED_ORIGIN + "/v1/messages");

  const startedAt = new Date().toISOString();
  modelCallsMade += 1;

  let status = null;
  let responseText = null;
  let transportError = null;
  if (!dryRun) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": sheet.call.anthropic_version,
          "content-type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
      status = res.status;
      responseText = await res.text();
    } catch (err) {
      transportError = String(err && err.stack ? err.stack : err);
    }
  }
  const finishedAt = new Date().toISOString();

  const transcript = {
    run_id: run.run_id,
    arm: run.arm,
    arm_kind: run.arm_kind,
    fixture: run.fixture,
    call_shape: run.call_shape,
    call_index: modelCallsMade,
    dry_run: Boolean(dryRun),
    started_at: startedAt,
    finished_at: finishedAt,
    endpoint: url,
    request_headers_sent: ["x-api-key (redacted)", "anthropic-version", "content-type"],
    request_body: requestBody,
    response_status: status,
    response_body_raw: responseText,
    transport_error: transportError,
    retries: 0,
  };

  const file = join(outDir, `${run.run_id}.json`);
  const bytes = JSON.stringify(transcript, null, 2) + "\n";
  writeFileSync(file, bytes, "utf8");

  return {
    run_id: run.run_id,
    arm: run.arm,
    arm_kind: run.arm_kind,
    fixture: run.fixture,
    call_shape: run.call_shape,
    call_index: modelCallsMade,
    transcript_file: `${run.run_id}.json`,
    transcript_sha256: createHash("sha256").update(bytes, "utf8").digest("hex"),
    response_status: status,
    transport_error: transportError,
    // Fixed per the gate. Filled by the founder from the transcript, never by
    // this harness and never by the model.
    observations: [],
    reason: null,
  };
}

// ---------------------------------------------------------------------------
async function main() {
  const argv = process.argv.slice(2);
  // --dry-run assembles every call and writes every transcript, and makes no
  // network request. It bypasses no guard: all five still run, in the same
  // order, before anything is assembled.
  const dryRun = argv.includes("--dry-run");
  const [sheetArg, outArg] = argv.filter((a) => a !== "--dry-run");
  if (!sheetArg || !outArg) {
    process.stderr.write("usage: pass5-harness.mjs [--dry-run] <sheet.json> <outdir>\n");
    process.exit(2);
  }
  const outDir = resolve(process.cwd(), outArg);
  mkdirSync(outDir, { recursive: true });
  exitCodePath = join(outDir, "exit-code.txt");

  guardCaptureUnconfigured();

  const sheetPath = resolve(process.cwd(), sheetArg);
  const sheetBytes = readFileSync(sheetPath);
  const sheetSha = guardSheetHash(sheetBytes);
  const sheet = JSON.parse(sheetBytes.toString("utf8"));

  guardSheetSize(sheet.runs);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey && !dryRun) refuse(20, "ANTHROPIC_API_KEY is not set. Nothing ran.");

  const systemPrompt = await loadShippedSystemPrompt();
  const builder = extractShippedUserMessageBuilder();
  const shipped = {
    systemPrompt,
    buildUserMessage: builder.fn,
  };

  const results = [];
  for (const run of sheet.runs) {
    results.push(await runOne(run, sheet, shipped, apiKey, outDir, dryRun));
  }

  const index = {
    sheet_path: sheetPath,
    sheet_sha256: sheetSha,
    sheet_id: sheet.sheet_id,
    dry_run: dryRun,
    max_model_calls: MAX_MODEL_CALLS,
    model_calls_made: modelCallsMade,
    product_source: "api/read-paired.js",
    product_source_sha256: createHash("sha256").update(readFileSync(PRODUCT_SOURCE)).digest("hex"),
    shipped_system_prompt_version: systemPrompt.version,
    shipped_system_prompt_sha256: systemPrompt.sha256,
    shipped_user_builder_bytes: builder.bytes,
    shipped_user_builder_sha256: builder.sha256,
    observation_vocabulary: sheet.observation_vocabulary,
    reason_vocabulary: sheet.reason_vocabulary,
    runs: results,
  };
  writeFileSync(join(outDir, "index.json"), JSON.stringify(index, null, 2) + "\n", "utf8");

  const failures = dryRun
    ? 0
    : results.filter((r) => r.transport_error || r.response_status !== 200).length;
  writeExitCode(failures === 0 ? 0 : 1);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  process.stderr.write(String(err && err.stack ? err.stack : err) + "\n");
  writeExitCode(70);
  process.exit(70);
});
