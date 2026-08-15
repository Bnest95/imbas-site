// The chip lane's one entrance from the published record.
//
// ?start=chips has been the lane's governed route since §D (reader-stage.js parses it on
// arrival and derives STAGE_CHIPS from it), and until this pass no surface in the product
// pointed at it: the route existed and only a hand-typed URL reached it. This adds exactly
// one door, on the share surface, and everything below is a bound rather than a feature.
//
// WHAT IS PINNED, AND WHY EACH BOUND EXISTS:
//   1. the href is /reader.html?start=chips exactly — one route, no hash surrogate, no
//      second parameter, so the lane keeps one entrance and the arrival parse keeps one
//      shape to read;
//   2. exactly one door in the file — three sibling doors already point at ?reader=1 and a
//      fourth continuation offer on the same page would be a second primary in disguise;
//   3. it is secondary — ghost class, and it renders after the rerun, which is the only
//      primary in the row. "Run this exact question again" is the record's own forward
//      move and must outrank a door that leaves the record behind;
//   4. it does not render on the error state. There is no record to follow up on there,
//      and that state's markup is byte-pinned in test/inspection-error-states.test.mjs
//      because the board's share-not-found frames depend on it;
//   5. the label carries no claim. It must not say Imbas found a problem in the record the
//      visitor is reading, and must not suggest the visitor's follow-up joins that record.
//
// inspection.js is a plain browser script with no exports, so — following
// test/inspection-error-states.test.mjs — this reads the source, extracts the real
// declarations and evaluates them. The code under test is the shipped code.
// Run: node --test test/share-chip-lane-door.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { lintString } from "../reader-check-vocab.js";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SOURCE = readFileSync(`${ROOT}inspection.js`, "utf8");

const HREF = "/reader.html?start=chips";
const LABEL = "Follow up on your own answer";

function slice(startMarker, endMarker) {
  const start = SOURCE.indexOf(startMarker);
  assert.ok(start !== -1, `inspection.js no longer contains: ${startMarker}`);
  const end = SOURCE.indexOf(endMarker, start);
  assert.ok(end !== -1, `could not find the end of: ${startMarker}`);
  return SOURCE.slice(start, end + endMarker.length);
}

const { CHIP_LANE_DOOR, actionsHtml } = new Function(
  `${slice("function escapeHtml(", "\n}")}
   ${slice("function rerunHref(record) {", "\n}")}
   ${slice("const CHIP_LANE_DOOR =", "\n")}
   ${slice("const ORIENTATION_LINE =", ";\n")}
   ${slice("function actionsHtml(record) {", "\n}")}
   return { CHIP_LANE_DOOR, actionsHtml };`,
)();

const RECORD = { share_id: "abc123DEF456ghi789jk" };
const countOf = (haystack, needle) => haystack.split(needle).length - 1;

test("the door points at the governed route and nothing else", () => {
  assert.match(CHIP_LANE_DOOR, new RegExp(`href="${HREF.replace("?", "\\?")}"`));
  // One route: no alternate path, no hash surrogate, no second parameter smuggled on.
  const hrefs = [...CHIP_LANE_DOOR.matchAll(/href="([^"]*)"/g)].map((m) => m[1]);
  assert.deepEqual(hrefs, [HREF], "the door carries exactly one href, and it is the governed route");
  assert.doesNotMatch(HREF, /#/, "a hash surrogate is not the route; reader-stage.js parses a query parameter");
  assert.equal(new URL(HREF, "https://www.imbaslabs.com").searchParams.get("start"), "chips");
  assert.equal([...new URL(HREF, "https://www.imbaslabs.com").searchParams].length, 1, "one parameter, not two");
});

test("one door, and the file's existing doors are untouched", () => {
  assert.equal(countOf(SOURCE, HREF), 1, "exactly one entrance to the chip lane may exist in inspection.js");
  assert.equal(
    countOf(SOURCE, '/reader.html?reader=1'),
    3,
    "the three sibling doors that predate this one must still be there: single/paired actions, legacy, error",
  );
});

test("the door is secondary: ghost, and behind the record's own primary", () => {
  const html = actionsHtml(RECORD);
  assert.match(CHIP_LANE_DOOR, /insp-btn--ghost/);
  assert.doesNotMatch(CHIP_LANE_DOOR, /insp-btn--primary/, "a second primary would put it level with the rerun");
  assert.equal(countOf(html, "insp-btn--primary"), 1, "the action row has one primary and it is not this door");

  const rerunAt = html.indexOf("Run this exact question again");
  const doorAt = html.indexOf(LABEL);
  assert.ok(rerunAt !== -1 && doorAt !== -1, "both controls must render on a found record");
  assert.ok(rerunAt < doorAt, "the rerun is the record's own forward move and reads first");
});

test("the door renders on the found record and nowhere else", () => {
  assert.match(actionsHtml(RECORD), new RegExp(HREF.replace("?", "\\?")));

  // A record with no share_id drops the rerun; the door is not promoted in its place.
  const noRerun = actionsHtml({});
  assert.match(noRerun, new RegExp(HREF.replace("?", "\\?")), "the door still renders");
  assert.equal(countOf(noRerun, "insp-btn--primary"), 0, "and it does not become the primary the rerun left behind");

  // The error render is pinned byte-for-byte in test/inspection-error-states.test.mjs
  // because the board's share-not-found frames depend on it. Nothing was added there.
  const renderErrorSrc = slice("function renderError(root, state) {", "\n}");
  assert.doesNotMatch(renderErrorSrc, /start=chips/, "the error state has no record to follow up on");
  // renderLegacy keeps its own action row, and one door means one door.
  const legacySrc = slice("function renderLegacy(", "\n}");
  assert.doesNotMatch(legacySrc, /start=chips/, "the legacy render keeps the single entrance rule");
});

test("the label makes no claim about the record being read", () => {
  assert.ok(CHIP_LANE_DOOR.includes(`>${LABEL}</a>`), "the door's visible string, pinned in full");
  assert.deepEqual(lintString(LABEL), [], "the label must pass the governed copy lint");
  // Imbas found nothing here: the label names the visitor's own answer, not this record,
  // and offers no remedy for it.
  assert.doesNotMatch(LABEL, /\b(?:found|detected|identified|fix|fixes|missed|problem|issue|error)\b/i);
  assert.doesNotMatch(LABEL, /\b(?:this|the)\s+(?:record|inspection|answer|finding)\b/i);
  // And nothing the visitor does through this door joins the record they are reading.
  assert.doesNotMatch(LABEL, /\b(?:add|contribute|append|reply|respond)\b/i);
});
