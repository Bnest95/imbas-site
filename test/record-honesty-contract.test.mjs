// Record honesty: the mark a person sets on a check has to reach the file they export,
// and the two export controls on a paired screen have to keep meaning two different files.
// Run: node --test test/record-honesty-contract.test.mjs
//
// ── Why this file exists ─────────────────────────────────────────────────────
// A paired result page renders three labels twice: "Copy JSON", "Download receipt", and
// "Export Review Record". Counted as an inventory that reads as duplication. Measured on
// the governed renderer against paired-matched at 1440x1000, it is not:
//
//   Copy JSON            y 2226  under "2 candidate items surfaced"   |  y 7293  under "Why this inspection matters"
//   Download receipt     y 2226  under "2 candidate items surfaced"   |  y 7293  under "Why this inspection matters"
//   Export Review Record y 3992  .wb-checks__export--single           |  y 7371  .wb-checks__export--paired
//
// Each pair sits in a different section, under a different heading, thousands of pixels
// apart, and each rendering exports a different artifact. The first receipt pair is the
// first answer's receipt against the two-question test's receipt — different envelope,
// different formatter (formatReceiptText vs formatPairedReceiptText), different filename.
// The Review Record pair is the sharper one, and it is the reason this file is a test
// rather than a note: the single-variant export is the ONLY one that carries checkStates,
// which is the marks the person set. The paired variant passes {} and carries the second
// answer instead. Neither file contains the other.
//
// So collapsing either pair does not remove a duplicate. It deletes an artifact, and for
// the Review Record it deletes the person's own marks from the record that claims to
// describe what they did. That is the defect class this test exists to make unrepeatable.
//
// What is left over is real but narrower than duplication: two receipt controls share a
// visible label with nothing beside them to say which file they mint. Export Review Record
// already solves exactly this with a generated support line under the button. Giving the
// receipt controls the same treatment is new user-facing copy, so it is recorded here and
// routed out rather than written in.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  assembleReviewRecord,
  buildReviewRecord,
  describeReviewRecordContents,
} from "../reader-review-record.js";
import { buildCheckRegister } from "../reader-checks.js";
import { buildPairCapture, PAIR_EDITS, PAIR_SAME_MODEL, PAIRED_METHOD_VERSION } from "../reader-paired.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const JSX = fs.readFileSync(path.join(ROOT, "workbench-app.jsx"), "utf8");

// ── Fixtures, built through the real assemblers ──────────────────────────────

const ANSWER =
  "The report recommends approval. " +
  "The recommendation rests on a projected figure of 4.2 million in the first year.";

const SECOND_ANSWER = "The projected figure of 4.2 million comes from the sponsor's own filing.";

const FINDING = {
  type: "omission",
  check: {
    supporting_proposition: "a projected figure of 4.2 million in the first year",
    dependent_output: "The report recommends approval",
    dependency_statement: "The recommendation rests on the projected figure.",
    verification_question: "What source gives the projected figure this recommendation depends on?",
    resolver: "authority",
    propagation: "recommendation_or_action",
  },
};

const INSPECTOR = { model: "claude-opus-4-8", model_version: "claude-opus-4-8", prompt_version: "reader.v3" };
const CREATED = "2026-07-17T12:00:00Z";

function buildRegister() {
  return buildCheckRegister({
    artifacts: { original_answer: ANSWER },
    artifactId: "original_answer",
    findings: [FINDING],
    inspector: INSPECTOR,
  });
}

// The `result` prop the single-mode export receives on the Check Register panel.
function singleResult() {
  const register = buildRegister();
  return {
    checks: register,
    receipt: {
      open_run: {
        answer: ANSWER,
        declared_model: "GPT-5",
        provenance: {
          request_id: "req_abc123",
          run_timestamp: "2026-07-17T11:59:00Z",
          reader_model_version: "claude-opus-4-8",
          inspector_prompt_version: "reader.v3",
        },
      },
    },
  };
}

// The `pair` prop the paired export receives below the delta.
function buildPair() {
  return {
    targeted_answer: SECOND_ANSWER,
    targeted_prompt: "List anything material the first answer left out.",
    targeted_prompt_hash: "a".repeat(64),
    targeted_source_model: { name: "claude-opus-4-8", version: "" },
    capture: buildPairCapture({ same_model: PAIR_SAME_MODEL.YES, edits: PAIR_EDITS.NONE }),
    inspector: { model: "claude-opus-4-8", model_version: "claude-opus-4-8", prompt_version: PAIRED_METHOD_VERSION },
  };
}

test("fixture sanity: the synthetic finding yields exactly one check to mark", () => {
  const register = buildRegister();
  assert.equal(register.checks.length, 1, "the record-honesty tests below need a check with an id to mark");
});

// ── A4: the mark reaches the file ────────────────────────────────────────────

test("a mark set through the surviving control is the status the exported record states", () => {
  // The path under test, end to end: CheckCard.setStatusTo calls onStatus(card.id, next),
  // the register panel holds that map, ReviewRecordExport hands it over as checkStates,
  // and assembleReviewRecord writes it onto the exported check. Every status the control
  // can produce is exercised, because a path that carries "resolved" and silently drops
  // "dismissed" is still a record that misstates what the person did.
  const result = singleResult();
  const checkId = result.checks.checks[0].id;

  for (const mark of ["open", "resolved", "dismissed"]) {
    const record = assembleReviewRecord({ result, checkStates: { [checkId]: mark }, createdAt: CREATED });
    assert.equal(record.contents.checks.length, 1);
    assert.equal(record.contents.checks[0].id, checkId, "the exported check is the one the person marked");
    assert.equal(
      record.contents.checks[0].status,
      mark,
      `a check marked "${mark}" must export as "${mark}"`,
    );
  }
});

test("an export that loses the status map reports every check as untouched", () => {
  // This is the failure mode stated positively, so the cost of dropping the prop is a
  // number in this file rather than a discovery in someone's exported record. A collapse
  // that keeps the paired control and retires the single one produces exactly this: the
  // person resolved a check, and the file says they left it open.
  const result = singleResult();
  const checkId = result.checks.checks[0].id;

  const marked = assembleReviewRecord({ result, checkStates: { [checkId]: "resolved" }, createdAt: CREATED });
  const dropped = assembleReviewRecord({ result, checkStates: {}, createdAt: CREATED });

  assert.equal(marked.contents.checks[0].status, "resolved");
  assert.equal(dropped.contents.checks[0].status, "open");
  assert.notDeepEqual(
    marked.contents.checks,
    dropped.contents.checks,
    "the status map is load-bearing: without it the record cannot state what the person did",
  );
});

test("the register panel lifts the status write, and the export reads that same map", () => {
  // The two ends of the path, asserted where they live. CheckCard does not hold status —
  // it calls up — and ReviewRecordExport passes what it is given straight into the
  // assembler under the name the assembler reads.
  assert.match(
    JSX,
    /onStatus\(card\.id,\s*next\)/,
    "CheckCard must lift the mark to the register panel rather than holding it locally",
  );
  assert.match(
    JSX,
    /checkStates:\s*statuses/,
    "ReviewRecordExport must hand the lifted map to buildReviewRecord as checkStates",
  );
});

// ── A4: one operation, one mutation ──────────────────────────────────────────

test("re-picking the mark a check already carries writes nothing and emits nothing", () => {
  const guard = /const setStatusTo = \(next\) => \{\s*if \(next === status\) return;/;
  assert.match(
    JSX,
    guard,
    "a no-op pick must return before onStatus and before the event, or one click can bill twice",
  );
});

test("closing a check counts once, however many times it is reopened and closed again", () => {
  // completedRef is the cardinality guard. Without it, a person who resolves a check,
  // reopens it to read the question again, and resolves it once more shows up in the
  // funnel as two completed loops — the same operation counted twice.
  const start = JSX.indexOf("const setStatusTo = (next) =>");
  assert.notEqual(start, -1, "CheckCard must still own setStatusTo");
  const body = JSX.slice(start, JSX.indexOf("return (", start));
  assert.match(body, /if \(next === "resolved" && !completedRef\.current\)/, "the completion event must be guarded");
  assert.match(body, /completedRef\.current = true;/, "the guard must latch");
  assert.equal(
    (body.match(/emitReaderEvent\(/g) || []).length,
    1,
    "one status operation may emit at most one canonical event",
  );
});

// ── The two exports are two files ────────────────────────────────────────────

test("the single and paired Review Record exports each hold what the other does not", async () => {
  // Neither file is a superset, which is why there is nothing here to collapse. The
  // single-mode record carries the marks; the paired record carries the second answer and
  // the capture conditions. One control cannot mint both without becoming a new artifact.
  const result = singleResult();
  const checkId = result.checks.checks[0].id;
  const openReceipt = result.receipt;

  const single = await buildReviewRecord({
    result,
    checkStates: { [checkId]: "resolved" },
    createdAt: CREATED,
  });
  const paired = await buildReviewRecord({
    result: { receipt: openReceipt },
    checkStates: {},
    createdAt: CREATED,
    pair: buildPair(),
  });

  assert.equal(single.contents.checks.length, 1, "the single record carries the marked check");
  assert.equal(single.contents.checks[0].status, "resolved");
  assert.equal(single.contents.pair_runs.length, 0, "no pair rode along");
  assert.equal(single.contents.artifacts.length, 1, "one answer");

  assert.equal(paired.contents.checks.length, 0, "the paired export carries no register, by design");
  assert.equal(paired.contents.pair_runs.length, 1, "the paired record carries the capture block");
  assert.deepEqual(
    paired.contents.artifacts.map((a) => a.role),
    ["original_answer", "targeted_answer"],
    "the paired record is the only one holding the second answer",
  );
  // Asserted on the shape first: a digest field that is absent compares equal to another
  // absent one, and the inequality below would pass while proving nothing.
  assert.match(single.integrity.digest, /^[0-9a-f]{64}$/, "the single record must carry a real digest");
  assert.match(paired.integrity.digest, /^[0-9a-f]{64}$/, "the paired record must carry a real digest");
  assert.notEqual(single.integrity.digest, paired.integrity.digest, "two records, two digests");
});

test("both Review Record controls render, and each declares which variant it is", () => {
  // The modifier is what lets a camera and a reader tell them apart, and it is also the
  // proof that the second rendering is deliberate rather than an accident of layout.
  assert.match(
    JSX,
    /<ReviewRecordExport result=\{result\} statuses=\{statuses\} variant="single" \/>/,
    "the Check Register panel keeps the export that carries the marks",
  );
  assert.match(
    JSX,
    /<ReviewRecordExport result=\{\{ receipt: openReceipt \}\} statuses=\{\{\}\} pair=\{pair\} variant="paired" \/>/,
    "the delta keeps the export that carries the second answer",
  );
});

test("the support line under each export names that file's own contents", () => {
  // The differentiator already shipped for this pair: same button label, a generated line
  // beneath it stating what THIS file will hold. The two lines must not converge, or the
  // label collision the receipt controls have becomes this pair's problem too.
  const result = singleResult();
  const singleLine = describeReviewRecordContents({ result });
  const pairedLine = describeReviewRecordContents({ result: { receipt: result.receipt }, pair: buildPair() });

  assert.notEqual(singleLine, pairedLine, "two controls, two files, two descriptions");
  assert.match(singleLine, /the answer as pasted/, "the single record holds one answer");
  assert.match(singleLine, /with the marks you set/, "and it is the file that carries the marks");
  assert.match(pairedLine, /both answers as pasted/, "the paired record holds two");
  assert.match(pairedLine, /the capture conditions you reported/, "and the conditions the person declared");
});

// ── R11: provenance stays inspectable, and stays subordinate ─────────────────
//
// Measured on the governed renderer against single-findings at 1440x1000, the two
// things R11 forbids are both absent. Nothing that reads as a hash, a record id or
// custody data renders before the first finding — the first such string on the page is
// the prompt version at y1966, and the first finding is at y1810. And every export
// group is the closing node of the block that produced it: the receipt controls end the
// measurement panel, the copy and share controls end the Reader's reading, and the
// Review Record export ends the check register.
//
// The strata that makes that a compliance claim rather than an opinion is the tree's
// own, stated where the three blocks mount: the hero is GLANCE, the measurement panel
// is READ, the register is INSPECT. So "after the last interpretive block of their
// stratum" resolves against those blocks, and nothing here had to move. What follows
// pins the two orderings a later pass could quietly reverse.

function componentSource(name) {
  const start = JSX.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `workbench-app.jsx must define ${name}`);
  const rest = JSX.slice(start);
  const next = rest.indexOf("\nfunction ", 1);
  return next === -1 ? rest : rest.slice(0, next);
}

test("the receipt controls close the panel that produced them", () => {
  const panel = componentSource("MeasurementPanel");
  const list = panel.indexOf('className="wb-measure__list"');
  const boundary = panel.indexOf("wb-measure__boundary");
  const actions = panel.indexOf("<ReaderReceiptActions");
  assert.ok(list > 0 && boundary > 0 && actions > 0, "the panel must still mount all three");
  assert.ok(actions > list, "an export offered above the marks is an artifact offered before its meaning");
  assert.ok(actions > boundary, "the scope line closes the panel's reading; the export follows it");
  assert.equal(
    panel.slice(actions).replace(/\s/g, "").startsWith("<ReaderReceiptActionsreceipt={receipt}/></section>"),
    true,
    "and nothing interpretive may be added after it without moving it",
  );
});

test("the prompt version renders inside the INSPECT disclosure, not in the open READ flow", () => {
  // Methodological depth stays INSPECT-level. The strip holds the inspector prompt
  // version and the rest of the run's custody, and a native <details> is what keeps it
  // reachable without putting it in front of someone reading their own marks.
  const panel = componentSource("MeasurementPanel");
  const open = panel.indexOf('<details className="wb-measure__inspect"');
  const strip = panel.indexOf("<ProvenanceStrip");
  const close = panel.indexOf("</details>", open);
  assert.ok(open > 0, "the INSPECT disclosure must still exist");
  assert.ok(strip > open && strip < close, "the provenance strip belongs inside the disclosure");
  assert.equal(
    /<details className="wb-measure__inspect"[^>]*\bopen\b/.test(panel),
    false,
    "a disclosure that mounts open puts custody data in front of the marks again",
  );
});

// ── The residue, recorded ────────────────────────────────────────────────────

test("the two receipt controls mint different files from the same two labels", () => {
  // Recorded, not resolved. Both renderings say "Copy JSON" and "Download receipt", and
  // unlike the Review Record pair there is no line beneath either one saying which file it
  // is. Someone navigating by control hears the same two names twice. Fixing that means
  // new user-facing copy or a changed label, so it belongs to the copy lane and not here.
  //
  // What this test does hold is the part that is not a copy question: the two call sites
  // must keep passing different receipts, formatters and filenames. If they ever converge,
  // the label collision stops being a naming problem and becomes a wrong-file problem.
  assert.match(
    JSX,
    /<ReaderReceiptActions receipt=\{receipt\} \/>/,
    "the marks panel keeps the first answer's receipt",
  );
  assert.match(
    JSX,
    /<ReaderReceiptActions receipt=\{paired\.receipt\} formatter=\{formatPairedReceiptText\} filePrefix="imbas-reader-paired-receipt" \/>/,
    "the delta keeps the paired receipt, its own formatter and its own filename",
  );

  const start = JSX.indexOf("function ReaderReceiptActions(");
  assert.notEqual(start, -1);
  const body = JSX.slice(start, JSX.indexOf("\n}", start));
  assert.match(body, /formatter = formatReceiptText/, "the default formatter is the single-run one");
  assert.match(body, /filePrefix = "imbas-reader-receipt"/, "and the default filename is the single-run one");
  assert.equal(
    /wb-checks__export-hint|aria-label/.test(body),
    false,
    "there is still nothing beside these labels telling the two files apart — copy lane, not this one",
  );
});
