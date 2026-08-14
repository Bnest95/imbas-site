// Guardrail: the single-answer findings list must render from the canonical result's render
// descriptor ALONE, so a finding shape registered by a later pass appears in the list with no
// edit to the component. Pass 2B-A calls that registration-only rendering.
//
// The registry side of that claim is proven in test/reader-result.test.mjs, which registers a
// fixture-only synthetic shape and shows describeFinding, the named subsets, and the counts all
// carry it. This file proves the OTHER side: that the renderer consumes only what the descriptor
// offers. Without it, "generic" is a property the component happens to have today rather than one
// it cannot lose — the next hand that reaches past the descriptor for a legacy field, or branches
// on a shape id, reintroduces a component that has to be edited for every new finding type.
//
// workbench-app.jsx is JSX and cannot be imported by Node, so this reads the source, isolates the
// MeasurementPanel component, and checks every field the row expressions read against the actual
// key set of describeFinding's output. A field the descriptor does not publish fails the test.
// Run: node --test test/measurement-panel-generic-rendering.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { transform } from "esbuild";

import {
  ANCHOR_CHANNEL,
  ANCHOR_REQUIREMENT,
  ANCHOR_STATUS,
  ARTIFACT_ORIGINAL,
  FINDING_CLASSES,
  MARK_ORIENTATION_NOTE,
  RECORD_LEVEL_ABSENCE_NOTE,
  SHAPE_PAIRED_COMPARATIVE_CONTRAST,
  SHAPE_PAIRED_OBSERVED_DIFFERENCE,
  SHAPE_SINGLE_CANDIDATE,
  buildCanonicalResult,
  buildFinding,
  buildSourceReading,
  describeFinding,
  registerFindingShape,
  selectSubset,
} from "../reader-result.js";
import { findingCheckAction } from "../reader-checks.js";

const SRC = readFileSync(
  process.env.WORKBENCH_APP_JSX || fileURLToPath(new URL("../workbench-app.jsx", import.meta.url)),
  "utf8",
);

// From `function NAME(` to the next top-level `function ` declaration, so an assertion
// can never be satisfied by code in a neighbouring component.
function componentSource(text, name) {
  const start = text.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `workbench-app.jsx must define ${name}`);
  const rest = text.slice(start);
  const next = rest.indexOf("\nfunction ", 1);
  return next === -1 ? rest : rest.slice(0, next);
}

// A module-level string constant, read out of the source rather than restated here.
// The panel's free identifiers are supplied by hand below, and a hand-written copy of
// a UI string is a second place for it to live: this reads the shipped literal, so the
// sandbox renders the words production renders.
function stringConstant(text, name) {
  const m = new RegExp(`^const ${name} = ("(?:[^"\\\\]|\\\\.)*");$`, "m").exec(text);
  assert.ok(m, `workbench-app.jsx must define ${name} as a single-line string constant`);
  return JSON.parse(m[1]);
}

const PANEL = componentSource(SRC, "MeasurementPanel");

// The row's evidence element is its own component, so it is extracted on its own and
// carries the same prohibitions. Keeping the two slices separate is deliberate: a
// negative assertion about the panel must not be satisfiable by the evidence element's
// source, or vice versa.
const EVIDENCE = componentSource(SRC, "FindingEvidence");

// READ's two elements, sliced the same way and for the same reason. They are named
// separately so a negative assertion about the panel cannot be satisfied by their
// source, and so this file can say which component each claim is about.
const SOURCE_READING = componentSource(SRC, "SourceReading");
const MARK_NUMBER = componentSource(SRC, "MarkNumber");

// The descriptor's real key set, from a real finding built through the real door.
const DESCRIPTOR_KEYS = new Set(
  Object.keys(
    describeFinding(
      buildFinding({
        index: 0,
        shape: SHAPE_SINGLE_CANDIDATE,
        class_label: "omission",
        statement: "A statement.",
        quotations: { [ARTIFACT_ORIGINAL]: "the quoted span" },
        artifacts: { [ARTIFACT_ORIGINAL]: "a sentence with the quoted span inside it" },
      }),
    ),
  ),
);

test("the findings list is built from the named subset and the render descriptor", () => {
  assert.match(PANEL, /selectSubset\(canonical, "surfaced_findings"\)/, "list must come from the display subset");
  assert.match(PANEL, /\.map\(describeFinding\)/, "rows must be rendered from describeFinding");
  // recorded_findings is the durable record and holds unresolved material. A row
  // drawn from it would put an unquotable finding in front of a person.
  assert.equal(
    PANEL.includes("recorded_findings"),
    false,
    "MeasurementPanel must not list the record subset",
  );
});

// Inverted in 2B-C. This assertion used to REQUIRE a class breakdown here, on the
// argument that a visible tally must come from the same subset as the rows. The
// founder ruling (queue item 12) withdraws the tally itself: an aggregate across the
// class vocabulary is not a claim the Reader makes, on any user-facing surface, and a
// count a person cannot verify by looking at the screen is the wrong thing to show
// whichever subset it came from. The rows are the account; each carries its own label
// and the words it was anchored to.
test("the panel renders no aggregate across the class vocabulary", () => {
  assert.equal(PANEL.includes("classBreakdown"), false, "MeasurementPanel must not break findings down by class");
  for (const label of Object.values(FINDING_CLASSES)) {
    assert.equal(PANEL.includes(label), false, `MeasurementPanel must not name the class ${label}`);
  }
  // The row label came from a three-entry map in the component, keyed by class id, that
  // held the same strings describeFinding already publishes. A second copy of the
  // vocabulary is a second place to edit for every new finding type.
  assert.equal(PANEL.includes("f.class_id"), false, "the row must not key its label off the class id");
  assert.match(PANEL, /f\.class_display/, "the row label must be the descriptor's own");
});

test("every finding field the rows read is a key the descriptor publishes", () => {
  const read = new Set();
  for (const m of PANEL.matchAll(/\bf\.([A-Za-z_$][\w$]*)/g)) read.add(m[1]);
  assert.ok(read.size > 0, "the row must read at least one field off the finding");
  for (const key of read) {
    assert.ok(
      DESCRIPTOR_KEYS.has(key),
      `MeasurementPanel reads f.${key}, which describeFinding does not publish — the row has reached past the descriptor`,
    );
  }
});

test("the rows branch on no shape id, so a newly registered shape needs no edit here", () => {
  for (const id of [SHAPE_SINGLE_CANDIDATE, SHAPE_PAIRED_OBSERVED_DIFFERENCE, SHAPE_PAIRED_COMPARATIVE_CONTRAST]) {
    assert.equal(PANEL.includes(id), false, `MeasurementPanel must not name the shape ${id}`);
    assert.equal(EVIDENCE.includes(id), false, `FindingEvidence must not name the shape ${id}`);
  }
  assert.equal(PANEL.includes("f.shape"), false, "MeasurementPanel must not switch on a finding's shape");
});

// The evidence element used to find its anchor by role and status: it asked for the
// original answer's anchor and took it only if it was QUOTED. Both halves were a
// renderer re-deriving a rule reader-result.js already owns, and the second half is
// how absence findings were lost — "not QUOTED" swept up the truthful absences with
// the failed quotations. The dispatch is now the channel and nothing else, so the
// component cannot disagree with the surfacing predicate about what may be shown.
test("the evidence element dispatches on the anchor channel, not on role or status", () => {
  // QUOTED_SPAN contains QUOTED, so a bare substring search for the status would be
  // tripped by the channel that is supposed to replace it. The channel names come out
  // first, and what is left is searched for the statuses.
  const withoutChannels = (src) =>
    Object.values(ANCHOR_CHANNEL).reduce((acc, channel) => acc.split(channel).join(""), src);
  for (const [name, src] of [["MeasurementPanel", PANEL], ["FindingEvidence", EVIDENCE]]) {
    const bare = withoutChannels(src);
    for (const status of Object.values(ANCHOR_STATUS)) {
      assert.equal(bare.includes(status), false, `${name} must not name the anchor status ${status}`);
    }
    assert.equal(src.includes("ANCHOR_STATUS"), false, `${name} must not read the status vocabulary`);
    assert.equal(src.includes("ARTIFACT_ORIGINAL"), false, `${name} must not single out an artifact role`);
    assert.equal(src.includes("a.role"), false, `${name} must not select an anchor by role`);
  }
  assert.match(EVIDENCE, /anchor\.channel/, "the evidence element must read the channel");
  for (const channel of Object.values(ANCHOR_CHANNEL)) {
    assert.ok(EVIDENCE.includes(channel), `the evidence element must handle the ${channel} channel`);
  }
});

// The rows hand every anchor the descriptor publishes to the evidence element, so a
// shape with one anchor and a shape with two both render with no edit here. A row that
// picked one anchor out of the list would go quiet the day a shape surfaced on a side
// the picker did not name.
test("the row renders every anchor the descriptor publishes", () => {
  assert.match(PANEL, /f\.anchors\.map\(/, "the row must render over the descriptor's anchors");
});

// ── The extensibility proof (2B-C §2) ────────────────────────────────────────
//
// The three tests above read the component's source and argue from what it does not
// contain. This one runs it. The panel is compiled out of workbench-app.jsx with the
// same JSX settings the shipped bundle uses, handed a finding of a kind that did not
// exist when the panel was written, and its output is read back. Nothing in
// workbench-app.jsx is touched to make it pass — that is the whole claim.
//
// Two axes, and they are not the same axis:
//
//   SHAPE — open by design. registerFindingShape is the extension point, and a shape
//   registered here goes through buildFinding, describeFinding, and the named subsets
//   untouched by any list of shipped shapes.
//
//   CLASS — closed at the construction door. reader-result.js rejects a class outside
//   Omission / Framing Drift / Deflection, because the vocabulary is a product ruling
//   and not an architecture affordance. So the class leg is proven where it applies:
//   at the render layer, by handing the panel a descriptor whose class_display is a
//   string the vocabulary does not contain and watching it render. That is what "do
//   not hardcode three classes" means for a view — it reads the label the descriptor
//   gives it and asks no further questions.
//
// This shape and this label are test fixtures. They add no production detector, no
// public class, no taxonomy term, and no shipped copy.
const SYNTHETIC_SHAPE = "synthetic_fixture_single_signal";
const SYNTHETIC_CLASS_DISPLAY = "Fixture Signal";

registerFindingShape({
  id: SYNTHETIC_SHAPE,
  surface: "single",
  label: "A finding type that did not exist when the panel was written",
  anchors: { [ARTIFACT_ORIGINAL]: ANCHOR_REQUIREMENT.REQUIRED },
  quoted_to_surface: [ARTIFACT_ORIGINAL],
});

const ANSWER = "The filing window closes ninety days after the notice is served.";
const QUOTE = "ninety days after the notice is served";

// The panel compiled and evaluated. `h` records the tree instead of building DOM; a
// stub stands in for each child component, since this is a test of THIS component's
// rows. The free identifiers are supplied explicitly, so a new one added to the panel
// makes this fail loudly rather than silently reading undefined.
// SourceReading and MarkNumber come along because the panel mounts one and the evidence
// element renders the other. Both are lifted from the shipped file, not stubbed: a stub
// would let the panel pass this test while the READ stratum it now leads with was
// broken. buildSourceReading is imported rather than lifted — it is model code in
// reader-result.js, and the panel gets the real one.
//
// findingCheckAction is imported for the same reason as buildSourceReading: it is model
// code in reader-checks.js, so the panel gets the real one and the row's action map is
// built by the real join. FindingCheckAction itself IS stubbed, and the difference from
// SourceReading is the claim each file makes. This file's claim is that a row is built
// from the render descriptor alone, and the action element takes no descriptor field —
// it takes a check-register join keyed by finding id. Rendering it here would prove
// nothing about descriptor-genericity and would drag React state, Btn and the telemetry
// vocabulary into a sandbox that exists to isolate the row. It renders for real in
// test/reader-checks-actions.test.mjs, which is where its own claims live.
async function renderPanel(findings) {
  const { code } = await transform(
    `${PANEL}\n${EVIDENCE}\n${SOURCE_READING}\n${MARK_NUMBER}\nreturn MeasurementPanel;`,
    {
      loader: "jsx",
      jsxFactory: "h",
      jsxFragment: "Frag",
    },
  );
  const h = (type, props, ...children) => {
    // The evidence element is a component, not a host tag, so a recording `h` would
    // stop at its name and never see the blockquote or the absence note. Calling it
    // here is what makes the assertions below read the real dispatch instead of a
    // placeholder for it.
    if (typeof type === "function") return type({ ...(props || {}), children });
    return { type, props: props || {}, children };
  };
  const stub = () => null;
  const make = new Function(
    "h",
    "Frag",
    "selectSubset",
    "describeFinding",
    "buildSourceReading",
    "findingCheckAction",
    "FindingCheckAction",
    "ANCHOR_CHANNEL",
    "RECORD_LEVEL_ABSENCE_NOTE",
    "MARK_ORIENTATION_NOTE",
    "MEASURE_SECTION_LABEL",
    "MEASURE_INSPECT_SUMMARY",
    "MEASURE_SOURCE_LABEL",
    "RECEIPT_BOUNDARY",
    "ProvenanceStrip",
    "ReaderReceiptActions",
    code,
  );
  const Panel = make(
    h,
    "Frag",
    () => findings,
    (f) => f,
    buildSourceReading,
    findingCheckAction,
    stub,
    ANCHOR_CHANNEL,
    RECORD_LEVEL_ABSENCE_NOTE,
    MARK_ORIENTATION_NOTE,
    stringConstant(SRC, "MEASURE_SECTION_LABEL"),
    stringConstant(SRC, "MEASURE_INSPECT_SUMMARY"),
    stringConstant(SRC, "MEASURE_SOURCE_LABEL"),
    "boundary",
    stub,
    stub,
  );
  // The receipt carries the artifact the spans were resolved against, so the panel is
  // handed one here. A panel with no receipt renders the list and no body, which is a
  // real state and not the one these assertions are about.
  return Panel({
    result: { measurement: {}, result: {}, receipt: { open_run: { answer: ANSWER } } },
    context: {},
  });
}

function textOf(node, out = []) {
  if (node == null || node === false) return out;
  if (Array.isArray(node)) {
    for (const n of node) textOf(n, out);
    return out;
  }
  if (typeof node === "string" || typeof node === "number") {
    out.push(String(node));
    return out;
  }
  if (node.children) textOf(node.children, out);
  return out;
}

test("a finding of a kind the panel has never seen renders through it unedited", async () => {
  const finding = buildFinding({
    index: 0,
    shape: SYNTHETIC_SHAPE,
    class_label: "omission",
    statement: "The answer does not state the filing window.",
    materiality: "A reader who misses this misses the deadline.",
    quotations: { [ARTIFACT_ORIGINAL]: QUOTE },
    artifacts: { [ARTIFACT_ORIGINAL]: ANSWER },
  });
  const canonical = buildCanonicalResult({ surface: "single", findings: [finding] });

  // The synthetic shape reaches the display subset on its own registered contract,
  // with no entry for it anywhere in reader-result.js's shipped list.
  assert.equal(selectSubset(canonical, "surfaced_findings").length, 1);

  const described = describeFinding(finding);
  const text = textOf(await renderPanel([described])).join(" ");
  assert.match(text, /A reader who misses this misses the deadline\./, "the row must carry the finding");
  assert.match(text, new RegExp(`"${QUOTE}"`), "the row must quote the anchored text");
  assert.doesNotMatch(text, /No candidate finding surfaced/, "the panel must not report an empty list");
});

test("the row prints whatever label the descriptor gives it, inside the vocabulary or outside it", async () => {
  const inside = describeFinding(
    buildFinding({
      index: 0,
      shape: SYNTHETIC_SHAPE,
      class_label: "omission",
      statement: "A statement.",
      quotations: { [ARTIFACT_ORIGINAL]: QUOTE },
      artifacts: { [ARTIFACT_ORIGINAL]: ANSWER },
    }),
  );
  assert.match(textOf(await renderPanel([inside])).join(" "), /Omission/);

  // Same descriptor, one field changed. The construction door will not mint a class
  // outside the vocabulary, so the substitution happens here — which is precisely the
  // layer the claim is about. A view that branched on the three names would drop this
  // row or print the wrong word; this one prints what it was handed.
  const outside = { ...inside, class_id: "fixture_signal", class_display: SYNTHETIC_CLASS_DISPLAY };
  assert.equal(Object.values(FINDING_CLASSES).includes(SYNTHETIC_CLASS_DISPLAY), false);
  const text = textOf(await renderPanel([outside])).join(" ");
  assert.match(text, new RegExp(SYNTHETIC_CLASS_DISPLAY), "the row must print the label it was given");
  assert.match(text, new RegExp(`"${QUOTE}"`), "the row must still quote the anchored text");
});

test("the legacy measurement fields are gone from the rows", () => {
  // measurement.findings entries carry .type and .anchor. Reading either would bypass the
  // construction door: .type is an un-normalized class string and .anchor is text that may not
  // occur in the answer at all.
  assert.equal(PANEL.includes("f.type"), false, "rows must not read the inspector's raw class string");
  assert.equal(PANEL.includes("f.anchor)"), false, "rows must not read the raw anchor text");
  assert.equal(PANEL.includes("f.anchor "), false, "rows must not read the raw anchor text");
});
