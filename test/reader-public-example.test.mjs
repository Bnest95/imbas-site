// The public example on the workbench door (PASS 2B-B item 6).
//
// This is the one place Imbas publishes someone else's AI answer, with our name on
// the framing. The packet that governs it — docs/IMBAS-PUBLIC-EXAMPLE-PACKET.md —
// spends most of its length on what the material does NOT support, so a test that
// only checked the copy read nicely would miss the entire point.
//
// So conformance here is checked against the packet file itself. Every line the
// module presents as preserved-as-supplied is asserted to appear in the packet, with
// markdown blockquote markers and line wraps normalized away. A door that drifts from
// its source fails here rather than at publication.
//
// The bars are asserted as absences, from the packet sections that impose them:
//   9   — the top-tier word appears nowhere, and the tier that did produce the answer
//         is named.
//   4.5 — the construct is not named. That call is Brendan's and the packet declines
//         to make it.
//   5.2 — the run's own gap figure is a score, so it does not appear. Neither does
//         any other N-of-M or 0-3 form (the pass-wide hard criterion).
//   8   — the superseded capture is a separate record. Its run id, its hashes, and
//         its barred notice-period figure are all absent.
//
// Run: node --test test/reader-public-example.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  PUBLIC_EXAMPLE,
  PUBLIC_EXAMPLE_UI,
  PUBLIC_EXAMPLE_PROVENANCE,
  PUBLIC_EXAMPLE_VERSION,
} from "../reader-public-example.js";
import { TARGETED_PROMPT_TEXT } from "../reader-paired.js";
import { RECEIPT_BOUNDARY } from "../reader-receipt.js";
import { lintUserFacingStrings } from "../reader-check-vocab.js";

const read = (rel) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");
const PACKET = read("../docs/IMBAS-PUBLIC-EXAMPLE-PACKET.md");
const SRC = read("../workbench-app.jsx");

// Markdown quoting is layout, not content: blockquote markers and hard wraps have to
// come off before a quoted line can be compared to the string that renders. Curly
// punctuation is folded to straight so a typographic edit on either side is not
// mistaken for a change in the quote.
function flatten(text) {
  return String(text)
    .replace(/^[ \t]*>[ \t]?/gm, "")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

const FLAT_PACKET = flatten(PACKET);

// Every string the module presents as coming from the packet, with the anatomy
// element it is drawn from.
const PRESERVED = [
  { field: "question", element: "5.1(1) the question", text: PUBLIC_EXAMPLE.question },
  { field: "open_answer", element: "5.1(2) one line from the first answer", text: PUBLIC_EXAMPLE.open_answer },
  { field: "left_out", element: "5.1(3) the missing item in plain English", text: PUBLIC_EXAMPLE.left_out },
  { field: "targeted_prompt", element: "5.1(4) the probe", text: PUBLIC_EXAMPLE.targeted_prompt },
  { field: "surfaced", element: "5.1(5) one line from the second answer", text: PUBLIC_EXAMPLE.surfaced },
  { field: "why_it_mattered", element: "5.1(6) why the difference mattered", text: PUBLIC_EXAMPLE.why_it_mattered },
];

// Everything a visitor reads on the door.
function userFacingStrings() {
  const strings = [
    PUBLIC_EXAMPLE.context,
    PUBLIC_EXAMPLE.headline,
    PUBLIC_EXAMPLE.counts_line,
    PUBLIC_EXAMPLE.tag,
    PUBLIC_EXAMPLE.source_line,
    ...PRESERVED.map((p) => p.text),
    ...PUBLIC_EXAMPLE_PROVENANCE.flatMap((row) => [row.label, row.body]),
    ...Object.values(PUBLIC_EXAMPLE_UI),
  ];
  return strings;
}

test("every preserved line appears verbatim in the packet", () => {
  for (const { field, element, text } of PRESERVED) {
    assert.ok(
      FLAT_PACKET.includes(flatten(text)),
      `${field} is presented as ${element} but does not appear in the packet:\n  ${text}`,
    );
  }
});

test("the probe and the boundary line are the shipped constants, not copies", () => {
  // The packet reports the probe is the constant every paired row carried, so the
  // door reuses it rather than transcribing it. A transcription would drift.
  assert.equal(PUBLIC_EXAMPLE.targeted_prompt, TARGETED_PROMPT_TEXT);
  assert.ok(FLAT_PACKET.includes(flatten(RECEIPT_BOUNDARY)), "the boundary line left the packet's 5.1(8)");
  assert.ok(SRC.includes("{RECEIPT_BOUNDARY}"), "the door stopped rendering the boundary line");
});

test("the four provenance facts are kept apart, in the order the brief names them", () => {
  assert.deepEqual(
    PUBLIC_EXAMPLE_PROVENANCE.map((r) => r.id),
    ["capture_conditions", "model_and_date", "artifact_identity", "no_matched_field"],
  );
  const bodies = PUBLIC_EXAMPLE_PROVENANCE.map((r) => r.body);
  assert.equal(new Set(bodies).size, bodies.length, "two provenance rows say the same thing");
});

test("the conditions row reports a declaration and claims no observation", () => {
  const { body } = PUBLIC_EXAMPLE_PROVENANCE[0];
  assert.match(body, /declared/i, "packet 4.2(1): these conditions were reported by a person");
  assert.match(body, /did not observe/i, "the row must say Imbas did not observe the session");
  assert.doesNotMatch(body, /\bverified\b|\bconfirmed\b|\bmatched\b/i, "a declaration is not a determination");
});

test("the model row states what was displayed, and states the tier", () => {
  const { body } = PUBLIC_EXAMPLE_PROVENANCE[1];
  assert.match(body, /gpt-5-5-mini/, "packet 9.1: the flagship's model identity was read from the DOM");
  assert.match(body, /data-message-model-slug/, "the row must name where the identity was read from");
  assert.match(body, /2026-07-26/, "the capture date");
  // Packet Section 11: state the tier on any surface built from these captures.
  assert.match(body, /small tier/i, "packet 9: the tier has to be stated");
});

test("the hash row fixes bytes and disclaims everything else", () => {
  // Packet 4.3, and the editorial under 5.3 that calls it the whole point.
  const { body } = PUBLIC_EXAMPLE_PROVENANCE[2];
  assert.match(body, /does not establish which model/i, "hashes do not prove same model");
  assert.match(body, /edited/i, "hashes do not prove nothing was edited");
  assert.doesNotMatch(body, /\bproves?\b/i, "the door does not say a hash proves anything");
});

test("the matched-conditions row says the field does not exist", () => {
  // Packet 4.1 and 4.2(3): the field does not exist end to end, so it cannot be
  // evaluated. The packet states that as "not satisfied and not failed"; the row
  // states it as what the example does carry, because naming an outcome the record
  // has no field for puts that outcome on the page.
  const { body } = PUBLIC_EXAMPLE_PROVENANCE[3];
  assert.match(body, /no authoritative matched-conditions field/i);
  assert.match(body, /the whole of what this example carries on conditions/i);
});

test("the door does not name the construct", () => {
  // Packet 4.5. The naming call is Brendan's; a page that sits here is not the live
  // session the adopted ruling licenses.
  for (const s of userFacingStrings()) {
    assert.doesNotMatch(s, /volunteer/i, `the construct is named on the door: "${s}"`);
  }
});

test("the door makes no top-tier claim", () => {
  // Packet 9, stated as a bar on the word itself.
  for (const s of userFacingStrings()) {
    assert.doesNotMatch(s, /frontier/i, `packet 9 bars this word on any surface built from these captures: "${s}"`);
  }
});

test("the door presents no score", () => {
  // The pass-wide hard criterion, and packet 5.2's own figure is exactly the shape it
  // bars. Act 1's figures are absent for the same reason, which is also how the door
  // avoids presenting the two acts as agreeing (packet 5.5).
  for (const s of userFacingStrings()) {
    assert.doesNotMatch(s, /\b\d+\s*(?:of|\/)\s*3\b/i, `an N-of-3 score reached the door: "${s}"`);
    assert.doesNotMatch(s, /gap estimate/i, `a gap estimate reached the door: "${s}"`);
  }
});

test("the superseded capture stays out", () => {
  // Packet 8: a separate record. Do not merge its excerpts, metadata, conditions, or
  // hashes. Its delta 2 quotes a notice period the current codified text contradicts.
  const module = read("../reader-public-example.js");
  assert.ok(!module.includes("02dd49e7b60c0144"), "the superseded run id is in the module");
  assert.ok(!module.includes("reccj1e4ljZD7CcXA"), "a superseded Airtable id is in the module");
  for (const s of userFacingStrings()) {
    assert.doesNotMatch(s, /\b7[-\s]?days?\b/i, `the barred notice-period figure reached the door: "${s}"`);
  }
});

test("the counts name the three signals and their unit", () => {
  const line = PUBLIC_EXAMPLE.counts_line;
  for (const term of ["Omission", "Framing Drift", "Deflection"]) {
    assert.ok(line.includes(term), `the counts line does not name ${term}`);
  }
  assert.match(line, /four Omission items/, "packet 5.2 counted four, and the unit has to be named");
  // One delta of four renders. Saying so is what stops the single line reading as the
  // whole difference.
  assert.match(line, /One of the four/);
});

test("the close claims nothing about what remains absent", () => {
  const banned = [
    /you now have both/i,
    /complete picture/i,
    /you now have everything/i,
    /nothing (?:else )?(?:is|was) missing/i,
  ];
  for (const re of banned) {
    assert.doesNotMatch(PUBLIC_EXAMPLE.tag, re, `the close overstates: ${re}`);
    assert.doesNotMatch(PUBLIC_EXAMPLE.headline, re, `the headline overstates: ${re}`);
  }
});

test("the source line carries its retrieval date", () => {
  // Packet 5.4 and 11: verified 2026-07-26 is a fact about 2026-07-26, and a
  // publication pass re-pulls the section on the day it publishes.
  assert.match(PUBLIC_EXAMPLE.source_line, /MCA § 39-2-911/);
  assert.match(PUBLIC_EXAMPLE.source_line, /Montana Code Annotated 2025/);
  assert.match(PUBLIC_EXAMPLE.source_line, /2026-07-26/);
});

test("the takeaway keeps the qualifier the statute needs", () => {
  // Packet 1.3, Result C: § 39-2-911(2) is conditional on the employer maintaining
  // written internal procedures. "generally" is doing that work and must survive.
  assert.match(PUBLIC_EXAMPLE.left_out, /you generally have to use your employer's internal appeal/);
});

test("every user-facing string passes the AT-5 lint", () => {
  assert.deepEqual(lintUserFacingStrings(userFacingStrings()), []);
});

test("the component renders this example and the retired one is gone", () => {
  assert.ok(SRC.includes('from "./reader-public-example.js"'), "the door no longer imports the example");
  assert.ok(SRC.includes("const d = PUBLIC_EXAMPLE;"), "ReaderDemo no longer reads the example module");
  assert.ok(SRC.includes(`data-example={d.version}`), "the rendered example carries no version marker");
  assert.equal(PUBLIC_EXAMPLE.version, PUBLIC_EXAMPLE_VERSION);

  // The Chevron/Loper Bright demo this replaced, and the construct tag it carried.
  for (const dead of ["Chevron", "Loper Bright", "DEMO_EXAMPLE", "That's the Volunteer Gap — the open answer"]) {
    assert.ok(!SRC.includes(dead), `retired demo copy is back in workbench-app.jsx: "${dead}"`);
  }
});
