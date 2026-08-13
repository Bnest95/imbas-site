// How a single share record is composed for someone who arrives cold.
//
// The composition pass gave the share page the same reading order the run surface has —
// GLANCE, then READ, then INSPECT — and the move that made it possible was putting two
// paragraphs behind a disclosure. The record's address and its scope boundary used to
// stand third and fourth on the page, above the question; a stranger read two paragraphs
// about what the page is not before reaching a single finding. They are in the INSPECT
// disclosure now, whole and one key away.
//
// WHY THIS FILE EXISTS AND THE BOARD DOES NOT COVER IT. The visual board photographs the
// viewport, and `hasText` reads `document.body.innerText` — text inside a closed
// <details> is not in innerText and has no box, so the camera cannot see any of what
// moved. The share-single scenario correctly stopped asserting it. That is not the same
// as the words being unguarded, and this file is where they are guarded instead: below-
// fold and behind-disclosure surfaces need execution coverage, not board coverage.
//
// WHY IT EXECUTES THE PAGE RATHER THAN GREPPING IT. inspection.js is a plain browser
// script — no imports, no exports, nothing to require — so the functions under test are
// lifted out of the SHIPPED file and evaluated. What is asserted is the HTML the page
// emits. A source scan would prove only that the file contains the words, which is true
// of a string sitting in a function nothing calls.
//
// Run: node --test test/share-record-composition.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  ARTIFACT_ORIGINAL,
  COUNT_DEFS,
  SHAPE_SINGLE_CANDIDATE,
  buildCanonicalResult,
  buildFinding,
  countLabel,
} from "../reader-result.js";

const SRC = readFileSync(new URL("../inspection.js", import.meta.url), "utf8");

// Lift the whole single-record renderer, top of file through renderSingle, and evaluate
// it. The boundaries are function names rather than line numbers: line numbers are
// evidence for one tree only, and this file has to keep being true after the next edit
// above it.
//
// renderSingle calls two DOM wiring functions declared further down the file. They are
// stubbed rather than lifted — this asserts what the page composes, and a click handler
// is a different question with its own tests.
function loadSingleRenderer() {
  const a = SRC.indexOf("const MEASURE_FINDING_LABEL");
  const b = SRC.indexOf("function deltaItemHtml");
  assert.ok(a >= 0 && b > a, "could not lift the single-record renderer out of inspection.js");
  const body =
    SRC.slice(a, b) +
    "\nfunction wireCopyLink() {}\nfunction wireReport() {}\n" +
    "return { renderSingle, mastHtml, singleGlanceHtml, singleInspectHtml, singlePanelHtml," +
    " surfacedCountLabel, MARK_ORIENTATION_NOTE, TRUST_NOTE, SINGLE_EMPTY };";
  return new Function(body)();
}

const R = loadSingleRenderer();

// A share record as recordToPublic hands it to the page. Two findings, an address on the
// receipt, and a boundary — the ordinary case the board photographs.
const ADDRESS = "ChatGPT · captured 9 July 2026";

function record(over = {}) {
  return {
    share_id: "Ab3xQ7zK9mNpR2sTuV4w",
    mode: "single",
    question: "What are my rights if my landlord keeps my security deposit?",
    findings: [
      {
        type: "Omission",
        materiality: "The deadline is set by state law and varies.",
        anchor: "A landlord must return a security deposit within 30 days of the tenant moving out.",
      },
      {
        type: "Framing Drift",
        materiality: "The closing line lowers the stakes of a question the person asked.",
        anchor: "so there is usually nothing to worry about",
      },
    ],
    boundary: "This record covers one answer from one system on one day.",
    receipt: { anchor: { text: ADDRESS }, sections: [], closing: { heading: "", items: [] } },
    ...over,
  };
}

// renderSingle writes into a root element. Nothing here needs a DOM beyond the one
// property it sets, so the root is that property.
function renderedSingle(rec) {
  const root = { innerHTML: "" };
  R.renderSingle(root, rec);
  return root.innerHTML;
}

// ── 1 · GLANCE is the count, then what the count counts ──────────────────────
//
// A stranger never watched these marks being made. So the first thing the record states
// is how many are on it, and the second is what one of them is. Nothing stands between.
test("1) the cold arrival's first two lines are the count and the orientation line", () => {
  const html = renderedSingle(record());
  const count = html.indexOf("2 candidate items surfaced");
  const orient = html.indexOf(R.MARK_ORIENTATION_NOTE);
  assert.ok(count > 0, "the count is not on the page");
  assert.ok(orient > 0, "the orientation line is not on the page");
  assert.ok(count < orient, "the orientation line must follow the count it explains");
  // And both are in the open — inside the GLANCE block, not inside the disclosure.
  const glance = R.singleGlanceHtml(record());
  assert.ok(glance.includes("2 candidate items surfaced"));
  assert.ok(glance.includes(R.MARK_ORIENTATION_NOTE));
  assert.ok(!glance.includes("<details"), "GLANCE holds nothing behind a disclosure");
});

// ── 2 · The count equals the marks rendered beneath it ───────────────────────
//
// Z2.1's invariant. A share row is a projection and carries no canonical result to
// count, so this page does the arithmetic itself over the findings it is about to draw.
// Two independent counts of one thing is exactly the shape that drifts, so it is pinned
// at three sizes rather than at the one the board photographs.
test("2) the count states the number of findings the page then draws", () => {
  for (const n of [0, 1, 2, 5]) {
    const findings = Array.from({ length: n }, (_, i) => ({
      type: "Omission",
      materiality: `materiality ${i}`,
      anchor: `anchor ${i}`,
    }));
    const html = renderedSingle(record({ findings }));
    const drawn = (html.match(/class="wb-measure__finding"/g) || []).length;
    assert.equal(drawn, n, `the page drew ${drawn} findings for a record holding ${n}`);
    assert.ok(
      html.includes(R.surfacedCountLabel(n)),
      `the count line does not state ${n}`,
    );
  }
});

// ── 3 · The count is worded the way the run surface words it ────────────────
//
// Not a similar sentence: the same one. A person who ran the inspection saw a count
// phrased by countLabel over COUNT_DEFS.surfaced_candidate_items, and the share page is
// where they send it. The units are read out of the module rather than typed here, so a
// change to either side has to change the other or this fails.
test("3) the share count uses the run surface's own units, singular and plural", () => {
  const def = COUNT_DEFS.surfaced_candidate_items;
  assert.equal(R.surfacedCountLabel(1), `1 ${def.unit_one} surfaced`);
  assert.equal(R.surfacedCountLabel(2), `2 ${def.unit_many} surfaced`);
  assert.equal(R.surfacedCountLabel(0), `0 ${def.unit_many} surfaced`);
  // And against the real function, over a real canonical result, so the comparison is
  // with the string a runner was actually shown rather than with a restatement of it.
  // The answer and the quotes are only scaffolding for the count — what is under test is
  // the phrase, at each n where the pluralization rule could go wrong.
  const ANSWER = "One. Two. Three. Four. Five. Six. Seven.";
  const WORDS = ["One", "Two", "Three", "Four", "Five", "Six", "Seven"];
  for (const n of [0, 1, 2, 7]) {
    const canonical = buildCanonicalResult({
      surface: "single",
      findings: WORDS.slice(0, n).map((quote, index) =>
        buildFinding({
          index,
          shape: SHAPE_SINGLE_CANDIDATE,
          class_label: "omission",
          statement: `statement ${index}`,
          quotations: { [ARTIFACT_ORIGINAL]: quote },
          artifacts: { [ARTIFACT_ORIGINAL]: ANSWER },
        }),
      ),
    });
    assert.equal(R.surfacedCountLabel(n), `${countLabel(canonical, "surfaced_candidate_items")} surfaced`);
  }
});

// ── 4 · INSPECT carries what moved, whole ────────────────────────────────────
//
// The two paragraphs that came off the top of the page are the reason this disclosure
// exists. Neither was deleted and neither was summarised. If a later edit drops one of
// them, the page gets shorter and reads fine, and this is what says otherwise.
test("4) the disclosure holds the record's address and its scope boundary, in full", () => {
  const html = R.singleInspectHtml(record());
  assert.ok(html.includes(ADDRESS), "the record's address is not in the disclosure");
  assert.ok(html.includes(R.TRUST_NOTE), "the scope boundary is not in the disclosure");
  // Whole, not an excerpt of itself. The trust note is three sentences and the middle one
  // is the one a summary would drop.
  assert.ok(R.TRUST_NOTE.includes("not a reviewed archive case"));
  assert.ok(R.TRUST_NOTE.includes("not professional advice"));
  assert.ok(R.TRUST_NOTE.includes("independently verified"));
});

test("5) the disclosure is native, so it opens with no script running and prints open", () => {
  const html = R.singleInspectHtml(record());
  assert.match(html, /<details class="insp-inspect">/);
  assert.match(html, /<summary class="insp-inspect__summary">/);
  // The summary names what is inside rather than inviting a click. "Show more" would
  // make a reader open it to find out whether they wanted to.
  assert.ok(html.includes("What this record is, and what it establishes"));
});

// A record with no receipt anchor has no address to give. The disclosure still renders,
// because the boundary is in it and the boundary is on every record.
test("6) a record with no address still discloses its boundary, and prints no empty line", () => {
  const html = R.singleInspectHtml(record({ receipt: { sections: [], closing: {} } }));
  assert.ok(html.includes(R.TRUST_NOTE), "the boundary went missing with the address");
  assert.ok(!html.includes(`class="insp-record__anchor"`), "an empty address line was rendered");
});

// ── 7 · The boundary is stated once ──────────────────────────────────────────
//
// It used to be in the masthead. It is in the disclosure now, and a copy left behind in
// the masthead would put the same paragraph on the page twice — which reads as two
// different claims to someone who does not know it is one string.
test("7) on a single record the scope boundary appears exactly once", () => {
  const html = renderedSingle(record());
  const occurrences = html.split(R.TRUST_NOTE).length - 1;
  assert.equal(occurrences, 1, `the scope boundary is on the page ${occurrences} times`);
  assert.ok(!R.mastHtml("single").includes(R.TRUST_NOTE), "the masthead kept a copy");
});

// The other two modes are not this lane's to recompose. Their mastheads still carry the
// boundary, and this is what proves the `mode` branch did not quietly change them.
test("8) paired and legacy mastheads still carry the boundary where they always did", () => {
  for (const mode of ["paired", "legacy", ""]) {
    assert.ok(
      R.mastHtml(mode).includes(R.TRUST_NOTE),
      `the ${mode || "default"} masthead lost the scope boundary`,
    );
  }
});

// ── 9 · GLANCE, then READ, then INSPECT ──────────────────────────────────────
//
// The order of the page is the ruling. Asserted on renderSingle's real output rather
// than on a list of calls, because the order that matters is the order in the document.
test("9) the page's order is identity, count, orientation, disclosure, question, marks", () => {
  const html = renderedSingle(record());
  const at = (needle, what) => {
    const i = html.indexOf(needle);
    assert.ok(i >= 0, `${what} is not on the page`);
    return i;
  };
  const order = [
    [at("Unlisted · Unreviewed", "the status line"), "status"],
    [at("2 candidate items surfaced", "the count"), "count"],
    [at(R.MARK_ORIENTATION_NOTE, "the orientation line"), "orientation"],
    [at("What this record is, and what it establishes", "the disclosure"), "disclosure"],
    [at("Question", "the question label"), "question"],
    [at("wb-measure__finding", "the findings"), "findings"],
  ];
  for (let i = 1; i < order.length; i += 1) {
    assert.ok(
      order[i - 1][0] < order[i][0],
      `${order[i][1]} renders before ${order[i - 1][1]}`,
    );
  }
});

// The question and the marks are the READ stratum, and nothing explanatory belongs
// between them. The disclosure closes above the question; anything of it appearing after
// would mean a body got split across the reading order.
test("10) nothing stands between the question and the marks it produced", () => {
  const html = renderedSingle(record());
  const q = html.indexOf(`class="insp-context__text"`);
  const first = html.indexOf(`class="wb-measure__finding"`);
  assert.ok(q >= 0 && first > q);
  const between = html.slice(q, first);
  assert.ok(!between.includes("<details"), "a disclosure opens between the question and the marks");
  assert.ok(!between.includes(R.TRUST_NOTE), "the boundary reappears between the question and the marks");
  assert.ok(
    !between.includes(R.MARK_ORIENTATION_NOTE),
    "the orientation line reappears between the question and the marks",
  );
});

// ── 11 · The empty record composes the same way ──────────────────────────────
//
// A share with nothing on it is the state most likely to be composed by accident, since
// it is the one nobody looks at. It gets the same three strata, and it says what it
// found in words rather than showing a blank panel.
test("11) an empty record states its count, its orientation, and what it found", () => {
  const html = renderedSingle(record({ findings: [] }));
  assert.ok(html.includes("0 candidate items surfaced"));
  assert.ok(html.includes(R.MARK_ORIENTATION_NOTE), "the empty record skipped the orientation line");
  assert.ok(html.includes(R.SINGLE_EMPTY), "the empty record does not say what it found");
  assert.ok(!html.includes(`class="wb-measure__finding"`), "an empty record drew a finding row");
});

// ── 12 · The panel is labelled, not headed ───────────────────────────────────
//
// The headings above the findings went with the composition pass: on GLANCE the count
// already says what the section holds, and a heading repeating it is a fourth block
// before the evidence. The section keeps its accessible name so the structure survives
// for anyone navigating by landmark.
test("12) the findings section keeps an accessible name after losing its heading", () => {
  const html = R.singlePanelHtml(record());
  assert.match(html, /aria-label="Candidate findings"/);
  assert.ok(!/<h[1-6][^>]*>/.test(html), "the findings panel grew a heading back");
});
