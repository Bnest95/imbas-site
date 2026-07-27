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

import {
  ARTIFACT_ORIGINAL,
  SHAPE_PAIRED_COMPARATIVE_CONTRAST,
  SHAPE_PAIRED_OBSERVED_DIFFERENCE,
  SHAPE_SINGLE_CANDIDATE,
  buildFinding,
  describeFinding,
} from "../reader-result.js";

const SRC = readFileSync(
  process.env.WORKBENCH_APP_JSX || fileURLToPath(new URL("../workbench-app.jsx", import.meta.url)),
  "utf8",
);

// From `function MeasurementPanel(` to the next top-level `function ` declaration, so an
// assertion can never be satisfied by code in a neighbouring component.
function measurementPanelSource(text) {
  const start = text.indexOf("function MeasurementPanel(");
  assert.notEqual(start, -1, "workbench-app.jsx must define MeasurementPanel");
  const rest = text.slice(start);
  const next = rest.indexOf("\nfunction ", 1);
  return next === -1 ? rest : rest.slice(0, next);
}

const PANEL = measurementPanelSource(SRC);

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
  assert.match(PANEL, /classBreakdown\(canonical, "surfaced_findings"\)/, "counts must come from the display subset");
  // recorded_findings is the durable record and holds unresolved material. A row or a
  // tally drawn from it would put an unquotable finding in front of a person.
  assert.equal(
    PANEL.includes("recorded_findings"),
    false,
    "MeasurementPanel must not list or tally the record subset",
  );
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
  }
  assert.equal(PANEL.includes("f.shape"), false, "MeasurementPanel must not switch on a finding's shape");
});

test("the legacy measurement fields are gone from the rows", () => {
  // measurement.findings entries carry .type and .anchor. Reading either would bypass the
  // construction door: .type is an un-normalized class string and .anchor is text that may not
  // occur in the answer at all.
  assert.equal(PANEL.includes("f.type"), false, "rows must not read the inspector's raw class string");
  assert.equal(PANEL.includes("f.anchor)"), false, "rows must not read the raw anchor text");
  assert.equal(PANEL.includes("f.anchor "), false, "rows must not read the raw anchor text");
});
