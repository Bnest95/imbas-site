// The one line that tells a share recipient what they are holding.
//
// A stranger handed this link reads a document produced by an instrument the page never
// describes. The masthead names it — "Reader inspection" — and stops. This states what the
// Reader does, and every bound below exists because an orientation line is the easiest
// place on the surface to accidentally make a claim.
//
// WHAT IS PINNED, AND WHY EACH BOUND EXISTS:
//   1. the string in full. It names the three things the Reader does and nothing else;
//   2. "once a person works through those questions" is load-bearing and asserted as such.
//      A shared record has not necessarily been worked or triaged, and the unconditioned
//      form — "produces a Review Record" — would tell a recipient this one was;
//   3. it is prose. No href, no button, no insp-btn: it adds no door to a surface whose
//      door count is itself governed, and it cannot become a second primary;
//   4. the rerun stays the row's only primary and the record's own forward move;
//   5. it makes no claim about the record being read. Imbas found nothing here, and
//      nothing a recipient does after reading it joins this record;
//   6. it renders on the single and paired records and nowhere else — the two states
//      where a recipient holds the thing the line describes.
//
// inspection.js is a plain browser script with no exports, so — following
// test/inspection-error-states.test.mjs — this reads the source, extracts the real
// declarations and evaluates them. The code under test is the shipped code.
// Run: node --test test/share-orientation-line.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { lintString } from "../reader-check-vocab.js";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SOURCE = readFileSync(`${ROOT}inspection.js`, "utf8");

const LINE =
  "This record came from a Reader inspection. The Reader hands over questions worth asking about an " +
  "AI answer and sets a second answer beside the first. Once a person works through those questions, " +
  "the Reader can produce a Review Record.";

function slice(startMarker, endMarker) {
  const start = SOURCE.indexOf(startMarker);
  assert.ok(start !== -1, `inspection.js no longer contains: ${startMarker}`);
  const end = SOURCE.indexOf(endMarker, start);
  assert.ok(end !== -1, `could not find the end of: ${startMarker}`);
  return SOURCE.slice(start, end + endMarker.length);
}

const { ORIENTATION_LINE, actionsHtml } = new Function(
  `${slice("function escapeHtml(", "\n}")}
   ${slice("function rerunHref(record) {", "\n}")}
   ${slice("const CHIP_LANE_DOOR =", "\n")}
   ${slice("const ORIENTATION_LINE =", ";\n")}
   ${slice("function actionsHtml(record) {", "\n}")}
   return { ORIENTATION_LINE, actionsHtml };`,
)();

const RECORD = { share_id: "abc123DEF456ghi789jk" };
const countOf = (haystack, needle) => haystack.split(needle).length - 1;

test("the line is pinned in full and renders verbatim", () => {
  assert.equal(ORIENTATION_LINE, LINE);
  // Nothing in it needs escaping, so the rendered text is the authored text.
  assert.ok(actionsHtml(RECORD).includes(`>${LINE}</p>`));
});

test("it names the three things the Reader does", () => {
  assert.match(LINE, /came from a Reader inspection/, "what the recipient is holding");
  assert.match(LINE, /questions worth asking/, "the questions");
  assert.match(LINE, /a second answer beside the first/, "the comparison");
  assert.match(LINE, /a Review Record/, "the worked record");
});

test("the Review Record is conditioned on someone having worked the questions", () => {
  // The load-bearing clause. Both halves are asserted: the capability is stated as one the
  // Reader CAN exercise, and the condition under which it produces one is named.
  assert.match(LINE, /can produce a Review Record/);
  assert.match(LINE, /Once a person works through those questions/);
  // And the unconditioned forms, which would report this record as worked, are absent.
  assert.doesNotMatch(LINE, /\b(?:produces|produced|includes|holds|carries|comes with)\s+a\s+Review Record\b/i);
  assert.doesNotMatch(LINE, /\b(?:worked|triaged|reviewed)\s+(?:by|record|inspection)\b/i);
});

test("it is prose, so it adds no door and cannot become a primary", () => {
  const rendered = `<p class="insp-actions__orientation">${LINE}</p>`;
  assert.ok(actionsHtml(RECORD).includes(rendered), "the line renders as a paragraph, not a control");
  assert.doesNotMatch(ORIENTATION_LINE, /</, "the string carries no markup of its own");
  const block = slice("const ORIENTATION_LINE =", ";\n") + slice("function actionsHtml(record) {", "\n}");
  assert.equal(
    countOf(block, "insp-actions__orientation"),
    1,
    "one orientation line, rendered in one place",
  );

  // Door count on this surface is governed. Adding a line must not have added a route.
  assert.equal(countOf(SOURCE, "/reader.html?start=chips"), 1, "still one chip-lane entrance");
  assert.equal(countOf(SOURCE, "/reader.html?reader=1"), 3, "still three ?reader=1 doors");
  assert.equal(countOf(SOURCE, "/archive.html"), 3, "still three archive doors");
});

test("the rerun is still the row's only primary and reads before every control", () => {
  const html = actionsHtml(RECORD);
  assert.equal(countOf(html, "insp-btn--primary"), 1);
  assert.match(html, /insp-btn--primary[^>]*>Run this exact question again/);

  const lineAt = html.indexOf(LINE);
  const rerunAt = html.indexOf("Run this exact question again");
  assert.ok(lineAt !== -1 && rerunAt !== -1);
  assert.ok(lineAt < rerunAt, "orientation reads first because it explains the row beneath it");

  // A record with no share_id drops the rerun. The line is not promoted into the gap.
  const noRerun = actionsHtml({});
  assert.ok(noRerun.includes(LINE), "the line still renders");
  assert.equal(countOf(noRerun, "insp-btn--primary"), 0, "and no primary appears in the rerun's place");
  assert.doesNotMatch(noRerun, /insp-actions__orientation[^>]*insp-btn/);
});

test("it makes no claim about the record being read", () => {
  assert.deepEqual(lintString(LINE), [], "the line must pass the governed copy lint");
  // Imbas found nothing here. The line describes an instrument, not this document.
  assert.doesNotMatch(LINE, /\b(?:found|finds|detected|identified|revealed|exposed|uncovered)\b/i);
  assert.doesNotMatch(LINE, /\b(?:problem|problems|issue|issues|error|errors|flaw|flaws|mistake)\b/i);
  assert.doesNotMatch(LINE, /\bmissed\b/i);
  // Nothing a recipient does afterwards joins this record.
  assert.doesNotMatch(LINE, /\byou(?:r)?\b/i, "the line describes the Reader, it does not address the reader");
  assert.doesNotMatch(LINE, /\b(?:add|append|contribute|reply|respond|join)\w*\s+to\s+(?:this|the)\b/i);
  // Behaviour, not intent: no motive verb about a model.
  assert.doesNotMatch(LINE, /\b(?:wants|tries|hides|refuses|intends|avoids)\b/i);
});

test("it renders on the single and paired records, and nowhere else", () => {
  // Both live renders reach it through the same call, so one string serves both and the
  // two surfaces cannot drift apart.
  for (const fn of ["function renderSingle(root, record) {", "function renderPaired(root, record) {"]) {
    assert.match(slice(fn, "\n}"), /actionsHtml\(record\)/, `${fn} must render the shared action region`);
  }
  // The legacy render is a dated record of a retired format. Describing today's Reader —
  // a comparison and a Review Record that postdate it — would misdescribe what a recipient
  // of one of those links is actually holding.
  assert.doesNotMatch(slice("function renderLegacy(", "\n}"), /insp-actions__orientation/);
  // The error states hold no record to orient anyone about, and their markup is byte-pinned
  // in test/inspection-error-states.test.mjs because the board's share-not-found frames
  // depend on it.
  assert.doesNotMatch(slice("function renderError(root, state) {", "\n}"), /insp-actions__orientation/);
  assert.equal(countOf(SOURCE, "ORIENTATION_LINE"), 2, "declared once, rendered once");
});
