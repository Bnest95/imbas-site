// Guardrail: the share page must not tell a visitor their record does not exist when the
// real failure was their connection, the store, or an unconfigured deployment.
//
// The bug this guards (shipped): renderError hard-coded one title, "Inspection not found.",
// and every failure path called it. A dropped fetch, a 502 from the record store and a 503
// on an unconfigured deployment all rendered a sentence that made a claim about the record
// — a claim the page had no basis for in three of the four cases. The true cause reached a
// hint paragraph, which is not the sentence anyone reads first.
//
// What is pinned here:
//   1. every state's title, as a full string, so no state can be reworded silently;
//   2. the mapping from the API's own error vocabulary onto those states;
//   3. the paired check the fix exists for — "Inspection not found." renders for exactly
//      one condition and no other;
//   4. that the API cannot grow a new error code without this mapping being revisited;
//   5. that the not-found render is byte-identical to the pre-fix render, which is what
//      keeps the board's share-not-found frames from moving.
//
// inspection.js is a plain browser script with no exports, so — following
// test/inspection-meaning-findings-source.test.mjs — this reads the source, extracts the
// three real declarations, and evaluates them. The code under test is the shipped code,
// not a transcription of it.
// Run: node --test test/inspection-error-states.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SOURCE = readFileSync(`${ROOT}inspection.js`, "utf8");
const API_SOURCE = readFileSync(`${ROOT}api/inspection/[shareId].js`, "utf8");

// ── Extract and evaluate the real declarations ───────────────────────────────

function slice(startMarker, endMarker) {
  const start = SOURCE.indexOf(startMarker);
  assert.ok(start !== -1, `inspection.js no longer contains: ${startMarker}`);
  const end = SOURCE.indexOf(endMarker, start);
  assert.ok(end !== -1, `could not find the end of: ${startMarker}`);
  return SOURCE.slice(start, end + endMarker.length);
}

const ERROR_STATES_SRC = slice("const ERROR_STATES = {", "\n};");
const STATE_FOR_SRC = slice("function errorStateFor(data) {", "\n}");
const RENDER_SRC = slice("function renderError(root, state) {", "\n}");

const { ERROR_STATES, errorStateFor, renderError } = new Function(
  `${ERROR_STATES_SRC}\n${STATE_FOR_SRC}\n${RENDER_SRC}\nreturn { ERROR_STATES, errorStateFor, renderError };`
)();

function render(state) {
  const root = { innerHTML: "" };
  renderError(root, state);
  return root.innerHTML;
}

const STATES = Object.keys(ERROR_STATES);
const NOT_FOUND_TITLE = "Inspection not found.";

// ── 1. Full-string pin per state ─────────────────────────────────────────────

test("every error state pins its title as a full string", () => {
  assert.deepEqual(STATES.sort(), ["incomplete_link", "not_found", "unavailable", "unreachable"]);

  assert.equal(ERROR_STATES.not_found.title, "Inspection not found.");
  assert.equal(ERROR_STATES.incomplete_link.title, "This inspection link is incomplete.");
  assert.equal(ERROR_STATES.unavailable.title, "Inspections aren't available right now.");
  assert.equal(
    ERROR_STATES.unreachable.title,
    "Couldn't reach this inspection. Check your connection and try again."
  );

  // Only not-found makes a claim about the record, because only there is the claim true.
  assert.equal(ERROR_STATES.not_found.body, "This link may be incorrect, or the share was removed.");
  for (const key of ["incomplete_link", "unavailable", "unreachable"]) {
    assert.equal(ERROR_STATES[key].body, "", `${key} must not inherit the not-found body`);
  }
});

test("no title is written as a denial", () => {
  // "not available", "isn't found", "no record" all teach the reader the frame they are
  // being told does not apply. Each title here says what happened, positively.
  for (const [key, copy] of Object.entries(ERROR_STATES)) {
    assert.ok(copy.title.trim().length > 0, `${key} has no title`);
    assert.ok(copy.title.trim().endsWith("."), `${key} title is not a sentence: ${copy.title}`);
  }
});

// ── 2. The API's vocabulary maps onto the states ─────────────────────────────

test("errorStateFor reads the API's own error codes", () => {
  assert.equal(errorStateFor({ error: "not_found" }), "not_found");
  assert.equal(errorStateFor({ error: "invalid" }), "incomplete_link");

  // Service-side failures. None of these means the record is missing.
  assert.equal(errorStateFor({ error: "unconfigured" }), "unavailable");
  assert.equal(errorStateFor({ error: "airtable" }), "unavailable");
  assert.equal(errorStateFor({ error: "method" }), "unavailable");

  // A body that failed to parse, a 200 with no record, an unrecognised code: all of them
  // are the service failing to answer, so none of them may fall through to not-found.
  assert.equal(errorStateFor({}), "unavailable");
  assert.equal(errorStateFor({ error: "something_new" }), "unavailable");
  assert.equal(errorStateFor(undefined), "unavailable");
  assert.equal(errorStateFor(null), "unavailable");
});

// ── 3. The paired check this fix exists for ──────────────────────────────────

test("the not-found title renders for exactly one condition and no other", () => {
  const conditions = [
    // Every state renderError can be handed, by name.
    ...STATES.map((s) => ({ label: `state ${s}`, state: s, expectNotFound: s === "not_found" })),
    // Every response shape that reaches it through errorStateFor.
    ...[
      { error: "not_found" },
      { error: "invalid" },
      { error: "unconfigured" },
      { error: "airtable" },
      { error: "method" },
      { error: "something_new" },
      {},
      undefined,
      null,
    ].map((data) => ({
      label: `response ${JSON.stringify(data)}`,
      state: errorStateFor(data),
      expectNotFound: !!(data && data.error === "not_found"),
    })),
    // The two call sites in main() that name their state outright.
    { label: "missing share id", state: "incomplete_link", expectNotFound: false },
    { label: "fetch rejected", state: "unreachable", expectNotFound: false },
    // And an unknown key, which must not degrade to a claim about the record.
    { label: "unknown state key", state: "not_a_state", expectNotFound: false },
  ];

  for (const c of conditions) {
    const html = render(c.state);
    const shows = html.includes(NOT_FOUND_TITLE);
    assert.equal(
      shows,
      c.expectNotFound,
      c.expectNotFound
        ? `${c.label} should render the not-found title and did not`
        : `${c.label} still renders "${NOT_FOUND_TITLE}"`
    );
  }
});

test("main() hands renderError a state name, never a free-text message", () => {
  // Lookbehind skips the declaration, `function renderError(root, state) {`; the lazy
  // capture runs to the statement's `);` so a nested call arrives whole.
  const calls = [...SOURCE.matchAll(/(?<!function )renderError\(root,\s*(.+?)\);/g)].map((m) =>
    m[1].trim()
  );
  assert.equal(calls.length, 3, `expected 3 renderError call sites, found ${calls.length}`);
  assert.deepEqual(calls.sort(), ['"incomplete_link"', '"unreachable"', "errorStateFor(data)"]);
});

// ── 4. A new API error code must force a decision here ───────────────────────

test("the API's GET path emits no error code this mapping has not seen", () => {
  // The GET half of api/inspection/[shareId].js, up to the report action.
  const getHalf = API_SOURCE.slice(0, API_SOURCE.indexOf('action !== "report"'));
  const codes = new Set([...getHalf.matchAll(/error:\s*"([^"]+)"/g)].map((m) => m[1]));
  assert.deepEqual(
    [...codes].sort(),
    ["airtable", "invalid", "method", "not_found", "unconfigured"],
    "the inspection endpoint's error vocabulary changed — map the new code in errorStateFor"
  );
});

// ── 5. Frame safety for the one state the board photographs ──────────────────

test("the not-found render is byte-identical to the pre-fix render", () => {
  // The exact markup renderError produced before the state split, with message "" — which
  // is what the not-found path always passed. docs/qa/visual-acceptance-harness/
  // share-not-found--{desktop,mobile} photograph this and nothing else on this surface,
  // so any drift here is a frame change, not a wording change. The empty hint paragraph
  // is load-bearing: its bottom margin sets the gap above the actions.
  const PRE_FIX = `
    <div class="insp-error" role="status">
      <h1 class="insp-error__title">Inspection not found.</h1>
      <p class="insp-error__body">This link may be incorrect, or the share was removed.</p>
      <p class="insp-error__hint"></p>
      <div class="insp-actions">
        <a class="insp-btn insp-btn--primary" href="/reader.html?reader=1">Test another answer</a>
        <a class="insp-btn insp-btn--ghost" href="/archive.html">Explore reviewed archive</a>
      </div>
    </div>`;
  assert.equal(render("not_found"), PRE_FIX);
});

test("every state keeps the hint paragraph, empty", () => {
  for (const state of STATES) {
    assert.ok(
      render(state).includes('<p class="insp-error__hint"></p>'),
      `${state} dropped the hint paragraph, which would move the gap above the actions`
    );
  }
});
