// file-intake-probe-fixture — carried verification from the probe review (Lane 1).
//
// ══ THE CLAIM THIS TEST EXISTS TO GROUND ═══════════════════════════════════════
//
// c8a and c8b are the covered-text discrimination pair. Both fixtures paint the SAME
// white text run and the SAME black rectangle over the same coordinates. They differ
// in one thing only: the order of the operators. In c8a the rectangle is painted
// after the text. In c8b it is painted before.
//
// The probe review took it for granted that c8a's operator list contains the white
// text run at all. If it did not — if the run were dropped, re-encoded, or never
// emitted — then the whole c8a/c8b discrimination would rest on assumed presence,
// and a covered_text finding built on it would be a finding about nothing. This test
// asserts the presence, by exact codepoints, so the discrimination rests on
// demonstrated evidence.
//
// ══ WHICH PATH WAS TAKEN ═══════════════════════════════════════════════════════
//
// The brief allowed two paths: use the probe fixtures at
// ~/Documents/Claude/Projects/Imbas/research/pdfjs-fidelity-probe/fixtures/ if they
// are reachable, or author an equivalent minimal pair in-repo if they are not.
//
// PATH TAKEN: the probe fixtures WERE reachable from this session, and both were
// vendored byte-for-byte into test/fixtures/file-intake/. Vendoring rather than
// reading across the path is deliberate: a test that reaches outside the repository
// passes on one machine and fails everywhere else, which would make this receipt
// unreproducible for exactly the reader it was written for. PROBE_SOURCE_SHA256
// records the source bytes, and the last test in this file re-checks the vendored
// copies against the probe directory whenever it is reachable, so drift on either
// side is caught rather than assumed away.
//
// ══ THE READER BELOW IS NOT A PARSER ═══════════════════════════════════════════
//
// Lane 1 ships no parser, and this is not one. It is a test-local tokenizer over an
// uncompressed content stream, sufficient to enumerate operators and their operands
// for these two hand-built fixtures. It does not handle filters, encryption, object
// streams, or inheritance, and nothing outside this file imports it.
//
// Run: node --test test/file-intake-probe-fixture.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

import { makeFinding, FILE_CANON_ERROR_PREFIX } from "../file-result.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const VENDORED_DIR = path.join(HERE, "fixtures", "file-intake");
const PROBE_DIR = path.join(
  process.env.HOME || "",
  "Documents/Claude/Projects/Imbas/research/pdfjs-fidelity-probe/fixtures",
);

const C8A = "c8a_covered_contrast.pdf";
const C8B = "c8b_ontop_contrast.pdf";

// The bytes as they stood in the probe directory when this test was written.
const PROBE_SOURCE_SHA256 = {
  [C8A]: "c974a827468a5a8dccf8e18255ed2d6d0641d2f086241e2b0e81bd99daa8dd96",
  [C8B]: "a77ebff296c4a94cca2b4e2e0676d02df1966eb74a5e87dc7af4cd0baac86f93",
};

// "CONTRAST-COVER-TEST", written as codepoints rather than as a string so the
// assertion is on the exact code points the fixture carries and cannot be satisfied
// by a normalized or re-encoded lookalike.
const WHITE_RUN_CODEPOINTS = [
  67, 79, 78, 84, 82, 65, 83, 84, 45, 67, 79, 86, 69, 82, 45, 84, 69, 83, 84,
];

const sha256 = (buf) => crypto.createHash("sha256").update(buf).digest("hex");

function readVendored(name) {
  return fs.readFileSync(path.join(VENDORED_DIR, name));
}

// ── A minimal content-stream tokenizer, test-local ──────────────────────────────

function contentStream(buf) {
  const text = buf.toString("latin1");
  const start = text.indexOf("stream");
  assert.notEqual(start, -1, "fixture carries no content stream");
  const bodyStart = text.indexOf("\n", start) + 1;
  const end = text.indexOf("endstream", bodyStart);
  assert.notEqual(end, -1, "fixture content stream is unterminated");
  return text.slice(bodyStart, end);
}

// Returns [{ op, operands }] in stream order. Operands are numbers, { name },
// { string, codepoints }, or arrays.
function operatorList(stream) {
  const ops = [];
  let operands = [];
  let i = 0;
  const isWS = (c) => " \t\r\n\f\0".includes(c);
  const isDelim = (c) => "()<>[]{}/%".includes(c);

  while (i < stream.length) {
    const c = stream[i];
    if (isWS(c)) {
      i += 1;
      continue;
    }
    if (c === "(") {
      let depth = 1;
      let out = "";
      i += 1;
      while (i < stream.length && depth > 0) {
        const ch = stream[i];
        if (ch === "\\") {
          out += stream[i + 1];
          i += 2;
          continue;
        }
        if (ch === "(") depth += 1;
        if (ch === ")") {
          depth -= 1;
          if (depth === 0) {
            i += 1;
            break;
          }
        }
        out += ch;
        i += 1;
      }
      operands.push({ string: out, codepoints: [...out].map((ch) => ch.codePointAt(0)) });
      continue;
    }
    if (c === "/") {
      let j = i + 1;
      while (j < stream.length && !isWS(stream[j]) && !isDelim(stream[j])) j += 1;
      operands.push({ name: stream.slice(i + 1, j) });
      i = j;
      continue;
    }
    if (c === "[") {
      operands.push([]);
      i += 1;
      continue;
    }
    if (c === "]") {
      i += 1;
      continue;
    }
    let j = i;
    while (j < stream.length && !isWS(stream[j]) && !isDelim(stream[j])) j += 1;
    const token = stream.slice(i, j);
    i = j;
    if (/^[-+]?(?:\d+\.?\d*|\.\d+)$/.test(token)) {
      operands.push(Number(token));
      continue;
    }
    ops.push({ op: token, operands });
    operands = [];
  }
  return ops;
}

const indexOfOp = (ops, name) => ops.findIndex((o) => o.op === name);

// ── The receipt ─────────────────────────────────────────────────────────────────

test("c8a's operator list contains the white text run, by exact codepoints", () => {
  const ops = operatorList(contentStream(readVendored(C8A)));
  const showText = ops.filter((o) => o.op === "Tj");
  assert.equal(showText.length, 1, "c8a should show exactly one text run");

  const operand = showText[0].operands.at(-1);
  assert.ok(operand && Array.isArray(operand.codepoints), "the Tj operand is not a literal string");
  assert.deepEqual(
    operand.codepoints,
    WHITE_RUN_CODEPOINTS,
    "c8a's shown text run does not carry the expected codepoints. The c8a/c8b discrimination " +
      "would be resting on assumed presence, which is the thing this test exists to prevent.",
  );
});

test("the run c8a shows is the WHITE one — the fill is set before it, in the same text object", () => {
  const ops = operatorList(contentStream(readVendored(C8A)));
  const tjIndex = indexOfOp(ops, "Tj");
  const fills = ops.map((o, i) => ({ ...o, i })).filter((o) => o.op === "rg" && o.i < tjIndex);
  assert.ok(fills.length > 0, "no fill colour is set before the text run");
  assert.deepEqual(fills.at(-1).operands, [1, 1, 1], "the fill in force at the text run is not white");
});

test("c8a and c8b differ in operator ORDER, not in content", () => {
  const a = operatorList(contentStream(readVendored(C8A)));
  const b = operatorList(contentStream(readVendored(C8B)));

  // Same operators, same multiset.
  assert.deepEqual([...a.map((o) => o.op)].sort(), [...b.map((o) => o.op)].sort());
  // Same text run in both.
  assert.deepEqual(
    b.find((o) => o.op === "Tj").operands.at(-1).codepoints,
    WHITE_RUN_CODEPOINTS,
  );
  // Opposite paint order: c8a fills after the text, c8b fills before it.
  assert.ok(indexOfOp(a, "f") > indexOfOp(a, "Tj"), "c8a should paint its rectangle AFTER the text run");
  assert.ok(indexOfOp(b, "f") < indexOfOp(b, "Tj"), "c8b should paint its rectangle BEFORE the text run");
});

test("the discrimination reaches the schema: c8a constructs covered_text, c8b cannot", () => {
  const a = operatorList(contentStream(readVendored(C8A)));
  const b = operatorList(contentStream(readVendored(C8B)));

  const rectOperands = (ops) => ops.find((o) => o.op === "re").operands;
  const [rx, ry, rw, rh] = rectOperands(a);
  const coveringBox = [rx, ry, rx + rw, ry + rh];
  const textBox = [50, 96, 175, 114];
  const run = a.find((o) => o.op === "Tj").operands.at(-1);

  const findingFrom = (ops) => ({
    class_label: "covered_text",
    extraction: {
      text: run.string,
      codepoints: [...run.codepoints],
      page_index: 0,
      position: { x: 50, y: 100 },
      effective_size_pt: 12,
    },
    graphics_state: {
      text_bbox: textBox,
      covering_object_bbox: coveringBox,
      covering_object_kind: "filled_path",
      z_order_delta: indexOfOp(ops, "f") - indexOfOp(ops, "Tj"),
    },
    checks_run: ["paint_order", "bbox_overlap"],
    thresholds_applied: { bbox_overlap_min: 0.9 },
  });

  const covered = makeFinding(findingFrom(a));
  assert.equal(covered.class_label, "covered_text");
  assert.ok(covered.graphics_state.z_order_delta > 0);
  assert.deepEqual(covered.extraction.codepoints, WHITE_RUN_CODEPOINTS);

  // c8b paints the rectangle first, so the delta is negative and the class is not
  // constructible. Refused by the schema, not softened into a weaker finding.
  assert.throws(
    () => makeFinding(findingFrom(b)),
    (err) => {
      assert.ok(err.message.startsWith(FILE_CANON_ERROR_PREFIX));
      assert.ok(err.message.includes("z_order_delta"), `expected a z_order_delta rejection, got: ${err.message}`);
      return true;
    },
  );
});

// ── Provenance of the vendored bytes ────────────────────────────────────────────

test("the vendored fixtures match the sha256 recorded when they were vendored", () => {
  for (const name of [C8A, C8B]) {
    assert.equal(sha256(readVendored(name)), PROBE_SOURCE_SHA256[name], `${name} has drifted since it was vendored`);
  }
});

test("the vendored fixtures still match the probe directory, when it is reachable", (t) => {
  if (!fs.existsSync(PROBE_DIR)) {
    t.skip(`probe directory not reachable at ${PROBE_DIR} — the vendored copies are the record`);
    return;
  }
  for (const name of [C8A, C8B]) {
    const source = path.join(PROBE_DIR, name);
    if (!fs.existsSync(source)) {
      t.skip(`${name} is no longer in the probe directory`);
      return;
    }
    assert.equal(
      sha256(fs.readFileSync(source)),
      sha256(readVendored(name)),
      `${name} differs between the probe directory and the vendored copy`,
    );
  }
});
