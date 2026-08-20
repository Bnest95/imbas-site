// file-templates — closed generation for file-result.v1 findings (Lane 1).
//
// Three jobs:
//   1. Field dependency is the eligibility rule, and an ineligible template renders
//      NOTHING. Not a shorter sentence, not a hedge, not a fallback.
//   2. A rendering consequence attaches only where a structural field establishes
//      it. Text render mode 3 earns the line. Metadata cannot get it at all.
//   3. No template interpolates document-supplied text, which is what keeps the
//      output space finite and the exhaustive lint honest.
//
// Run: node --test test/file-templates.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  FILE_TEMPLATE_REGISTRY_VERSION,
  FILE_TEMPLATES,
  TEMPLATE_FAMILIES,
  RENDERING_CONSEQUENCE_CLASSES,
  NO_RENDERING_CONSEQUENCE_CLASSES,
  TEMPLATE_LINT_FIXTURES,
  templatesForClass,
  renderTemplate,
  renderFinding,
  renderCompleteOutputSpace,
  outputSpaceCoverage,
  getPath,
} from "../file-templates.js";
import { PHENOMENON_CLASS_IDS, makeFinding } from "../file-result.js";

const cp = (t) => [...t].map((c) => c.codePointAt(0));
const fixture = (id) => TEMPLATE_LINT_FIXTURES.find((f) => f.id === id).finding;
const firstFor = (classLabel) => TEMPLATE_LINT_FIXTURES.find((f) => f.finding.class_label === classLabel).finding;

// A mutable copy with one dot path removed. Findings come back frozen from the
// schema, and the template gate must hold on any finding-shaped object, not only on
// one the schema blessed.
function withoutPath(finding, path) {
  const copy = structuredClone(finding);
  const keys = path.split(".");
  let node = copy;
  for (const key of keys.slice(0, -1)) node = node[key];
  delete node[keys.at(-1)];
  return copy;
}

// ── The registry is closed and versioned ────────────────────────────────────────

test("the registry is versioned, its ids are unique, and its families are the declared three", () => {
  assert.match(FILE_TEMPLATE_REGISTRY_VERSION, /^file-templates\.v\d+$/);
  const ids = FILE_TEMPLATES.map((t) => t.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const t of FILE_TEMPLATES) {
    assert.ok(TEMPLATE_FAMILIES.includes(t.family), `${t.id} declares family "${t.family}"`);
    assert.ok(Array.isArray(t.requires), `${t.id} must declare a field-dependency list`);
    assert.ok(t.classes.length > 0, `${t.id} must name at least one class`);
    for (const c of t.classes) assert.ok(PHENOMENON_CLASS_IDS.includes(c), `${t.id} names unknown class ${c}`);
  }
});

test("every phenomenon class has a structural template, and no class is left to a fallback", () => {
  for (const classLabel of PHENOMENON_CLASS_IDS) {
    const structural = templatesForClass(classLabel).filter((t) => t.family === "structural");
    assert.ok(structural.length >= 1, `${classLabel} has no structural template`);
  }
});

test("the fixture set reaches every template and covers every class", () => {
  const coverage = outputSpaceCoverage();
  assert.deepEqual(coverage.unreached_templates, []);
  assert.deepEqual(coverage.uncovered_classes, []);
});

// ── (b) per-template field-dependency enforcement ───────────────────────────────

test("a template whose declared field is absent renders nothing — every template, every field", () => {
  let checked = 0;
  for (const template of FILE_TEMPLATES) {
    for (const classLabel of template.classes) {
      const eligible = TEMPLATE_LINT_FIXTURES.map((f) => f.finding).find(
        (f) => f.class_label === classLabel && renderTemplate(template, f) !== null,
      );
      if (!eligible) continue;
      assert.equal(typeof renderTemplate(template, eligible), "string");

      for (const path of template.requires) {
        const starved = withoutPath(eligible, path);
        assert.equal(getPath(starved, path), undefined, `${template.id}: ${path} was not actually removed`);
        const rendered = renderTemplate(template, starved);
        assert.equal(
          rendered,
          null,
          `${template.id} rendered ${JSON.stringify(rendered)} with ${path} absent. ` +
            "Ineligibility renders nothing; it never falls back to prose.",
        );
        checked += 1;
      }
    }
  }
  assert.ok(checked >= FILE_TEMPLATES.length, `expected at least one starved case per template, ran ${checked}`);
});

test("ineligibility is null, never an empty string or a placeholder", () => {
  const template = FILE_TEMPLATES.find((t) => t.id === "tiny_text.structural");
  const starved = withoutPath(fixture("tiny_text.sub_point"), "thresholds_applied.effective_size_pt_max");
  const rendered = renderTemplate(template, starved);
  assert.equal(rendered, null);
  assert.notEqual(rendered, "");
});

test("a template renders nothing for a class it does not name", () => {
  const metadataTemplate = FILE_TEMPLATES.find((t) => t.id === "metadata_text.structural");
  assert.equal(renderTemplate(metadataTemplate, firstFor("invisible_render_mode")), null);
});

test("a value gate is a dependency too: the encoding templates do not cross categories", () => {
  const zeroWidth = FILE_TEMPLATES.find((t) => t.id === "encoding_control_structures.zero_width.structural");
  assert.equal(typeof renderTemplate(zeroWidth, fixture("encoding_control_structures.zero_width")), "string");
  assert.equal(renderTemplate(zeroWidth, fixture("encoding_control_structures.bidi_override")), null);
  assert.equal(renderTemplate(zeroWidth, fixture("encoding_control_structures.unicode_tag_block")), null);

  // Exactly one structural line per encoding finding, never three.
  for (const id of ["zero_width", "bidi_override", "unicode_tag_block"]) {
    const lines = renderFinding(fixture(`encoding_control_structures.${id}`)).filter((l) => l.family === "structural");
    assert.equal(lines.length, 1, `${id} rendered ${lines.length} structural lines`);
  }
});

// ── (b) the rendering-consequence gate ──────────────────────────────────────────

test("a render-mode-3 finding gets the rendering consequence", () => {
  const lines = renderFinding(firstFor("invisible_render_mode"));
  const consequence = lines.filter((l) => l.family === "rendering_consequence");
  assert.equal(consequence.length, 1);
  assert.equal(consequence[0].string, "The page's rendering instructions do not paint it.");
});

test("a metadata finding cannot get a rendering consequence", () => {
  // Not "does not today" — cannot. No template in the registry names the class, so
  // there is no field value that would turn the line on.
  const lines = renderFinding(firstFor("metadata_text"));
  assert.deepEqual(
    lines.filter((l) => l.family === "rendering_consequence"),
    [],
  );
  for (const template of FILE_TEMPLATES.filter((t) => t.family === "rendering_consequence")) {
    assert.equal(renderTemplate(template, firstFor("metadata_text")), null);
  }
});

test("metadata, annotation, and encoding-control classes take no rendering consequence at all", () => {
  const renderingTemplates = FILE_TEMPLATES.filter((t) => t.family === "rendering_consequence");
  for (const classLabel of NO_RENDERING_CONSEQUENCE_CLASSES) {
    for (const template of renderingTemplates) {
      assert.ok(
        !template.classes.includes(classLabel),
        `${template.id} names ${classLabel}; none of these classes is a page-painting instruction`,
      );
    }
  }
});

test("the rendering-consequence family is exactly the two classes whose operand settles the paint", () => {
  const named = new Set(
    FILE_TEMPLATES.filter((t) => t.family === "rendering_consequence").flatMap((t) => [...t.classes]),
  );
  assert.deepEqual([...named].sort(), [...RENDERING_CONSEQUENCE_CLASSES].sort());
  // The four refused classes, asserted rather than merely argued in the header.
  for (const refused of ["offpage_text", "hidden_ocg_text", "tiny_text", "near_zero_alpha", "white_fill_unbacked"]) {
    assert.ok(!named.has(refused), `${refused} acquired a rendering consequence`);
    assert.deepEqual(
      renderFinding(firstFor(refused)).filter((l) => l.family === "rendering_consequence"),
      [],
    );
  }
});

// ── (b) the extraction-consequence family is field-gated ────────────────────────

test("the extraction consequence attaches wherever the parser emitted a span", () => {
  for (const classLabel of PHENOMENON_CLASS_IDS) {
    const lines = renderFinding(firstFor(classLabel)).filter((l) => l.family === "extraction_consequence");
    assert.equal(lines.length, 1, `${classLabel} produced ${lines.length} extraction-consequence lines`);
    assert.equal(lines[0].string, "A system that reads this file by extracting its text receives this text.");
  }
});

test("the extraction consequence is gated on the span, not asserted by class", () => {
  const template = FILE_TEMPLATES.find((t) => t.id === "extraction_consequence");
  assert.deepEqual(template.requires, ["extraction.text"]);
  assert.equal(renderTemplate(template, withoutPath(firstFor("metadata_text"), "extraction.text")), null);
});

// ── (b) no document-supplied text reaches a rendered sentence ───────────────────

test("no template weaves document-supplied text into a sentence", () => {
  const SENTINELS = {
    text: "ZZQXSENTINELSPANZZQX",
    metadata_key: "ZZQXMETAKEYZZQX",
    annotation_subtype: "ZZQXSUBTYPEZZQX",
    ocg_name: "ZZQXOCGNAMEZZQX",
  };
  const marked = [
    makeFinding({
      class_label: "metadata_text",
      extraction: { text: SENTINELS.text, codepoints: cp(SENTINELS.text) },
      graphics_state: { container_kind: "metadata", metadata_key: SENTINELS.metadata_key },
      checks_run: ["metadata_inventory"],
      thresholds_applied: {},
    }),
    makeFinding({
      class_label: "annotation_text",
      extraction: { text: SENTINELS.text, codepoints: cp(SENTINELS.text), page_index: 0, position: { x: 1, y: 2 } },
      graphics_state: { container_kind: "annotation", annotation_subtype: SENTINELS.annotation_subtype },
      checks_run: ["annotation_inventory"],
      thresholds_applied: {},
    }),
    makeFinding({
      class_label: "hidden_ocg_text",
      extraction: {
        text: SENTINELS.text,
        codepoints: cp(SENTINELS.text),
        page_index: 0,
        position: { x: 1, y: 2 },
        effective_size_pt: 12,
      },
      graphics_state: {
        container_kind: "optional_content_group",
        ocg_name: SENTINELS.ocg_name,
        ocg_default_state: "off",
      },
      checks_run: ["optional_content_group_state"],
      thresholds_applied: {},
    }),
    makeFinding({
      class_label: "invisible_render_mode",
      extraction: {
        text: SENTINELS.text,
        codepoints: cp(SENTINELS.text),
        page_index: 0,
        position: { x: 1, y: 2 },
        effective_size_pt: 12,
      },
      graphics_state: { render_mode: 3 },
      checks_run: ["text_render_mode"],
      thresholds_applied: {},
    }),
  ];

  let rendered = 0;
  for (const finding of marked) {
    for (const line of renderFinding(finding)) {
      rendered += 1;
      for (const sentinel of Object.values(SENTINELS)) {
        assert.ok(
          !line.string.includes(sentinel),
          `${line.template_id} interpolated document-supplied text (${sentinel}): ${line.string}`,
        );
      }
    }
  }
  assert.ok(rendered > 0, "the sentinel findings rendered nothing, so the test proved nothing");
});

test("the rendered output space is finite and enumerable", () => {
  const space = renderCompleteOutputSpace();
  assert.ok(space.length > 0);
  for (const row of space) {
    assert.equal(typeof row.string, "string");
    assert.ok(row.string.length > 0);
    assert.ok(FILE_TEMPLATES.some((t) => t.id === row.template_id));
  }
  // Deterministic: same registry, same fixtures, same strings.
  assert.deepEqual(renderCompleteOutputSpace(), space);
});
