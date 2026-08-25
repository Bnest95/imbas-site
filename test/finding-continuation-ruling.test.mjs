// Which findings may carry a local action, and the two records that say so.
//
// THE RULING. The founder amendment of 2026-08-22 partitions findings into three tiers.
// A Register-qualified finding gets a specific check grounded in the stronger evidence
// contract. A passage-anchored non-Register finding gets a continuation that is
// explicitly not a verification. A record-level finding gets neither, by ruling, and is
// picked up by the corrective steering layer instead.
//
// TIER TWO IS RULED AND NOT BUILT, and that is the state this file has to hold stable in
// both directions. It must not drift closed — a later pass must not quietly decide the
// tier gets nothing after all. And it must not drift open — the three strings the ruling
// stopped on are pinned verbatim against the live tree, so a founder who changes one of
// them fails this file and gets sent back to the gap record rather than leaving a
// resolved gap recorded as open.
//
// WHAT IS PROVEN BY RENDERING, not by reading. The confirmation the amendment asks for —
// that no record-level or ABSENT finding received a continuation — is a claim about what
// reaches a page, so it is made against rendered trees for every fixture that has one,
// with the row's real question control lifted rather than stubbed.
//
// Synthetic and QA fixtures only. No metered model calls.
//
// Run: node --test test/finding-continuation-ruling.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { transform } from "esbuild";

import {
  ANCHOR_CHANNEL,
  FINDING_CONTINUATION_RULING,
  MARK_ORIENTATION_NOTE,
  RECORD_LEVEL_ABSENCE_NOTE,
  buildSourceReading,
  describeFinding,
  selectSubset,
} from "../reader-result.js";
import { CHECK_UI } from "../reader-checks.js";
import { READER_EVENTS } from "../reader-telemetry.js";
import {
  MARK_NUMBER_ATTR,
  SPAN_SEGMENT_ATTR,
  SPAN_UI,
  resolveSelectionSpan,
  resolveSpanAction,
} from "../reader-span-selection.js";
import { READER_SPAN_BANK, SPAN_MODES, defaultSpanEntry } from "../reader-span-bank.js";
import { SCENARIOS } from "../scripts/qa/scenarios.mjs";
import {
  POPULATION_RESEAL_EVIDENCE_KEYS,
  POPULATION_RESEAL_RULE,
  PROVENANCE_RESEAL_RULE,
  SOURCE_RESEAL_EVIDENCE_KEYS,
} from "../scripts/qa/ember-census.mjs";

const SRC = readFileSync(
  process.env.WORKBENCH_APP_JSX || fileURLToPath(new URL("../workbench-app.jsx", import.meta.url)),
  "utf8",
);
const CENSUS = JSON.parse(
  readFileSync(fileURLToPath(new URL("../docs/qa/surface-measurements/ember-census.json", import.meta.url)), "utf8"),
);

function componentSource(text, name) {
  const start = text.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `workbench-app.jsx must define ${name}`);
  const rest = text.slice(start);
  const next = rest.indexOf("\nfunction ", 1);
  return next === -1 ? rest : rest.slice(0, next);
}

function stringConstant(text, name) {
  const m = new RegExp(`^const ${name} = ("(?:[^"\\\\]|\\\\.)*");$`, "m").exec(text);
  assert.ok(m, `workbench-app.jsx must define ${name} as a single-line string constant`);
  return JSON.parse(m[1]);
}

// ── 1. The ruling, recorded where the tier predicates are computed ───────────

test("the continuation ruling is recorded beside the fields that decide it", () => {
  assert.equal(FINDING_CONTINUATION_RULING.ruling.date, "2026-08-22");
  assert.equal(FINDING_CONTINUATION_RULING.ruling.authority, "founder");

  const text = FINDING_CONTINUATION_RULING.ruling.text;
  assert.match(text, /ONLY where the finding has a concrete passage in the answer/);
  assert.match(text, /Record-level and ABSENT findings get NO local continuation in this lane/);
  assert.match(text, /Do not manufacture a verification question, an evidence state/);
  assert.match(text, /corrective steering layer/);
  assert.match(FINDING_CONTINUATION_RULING.ruling.stop_clause, /STOP and return the precise copy or schema gap/);

  assert.equal(Object.isFrozen(FINDING_CONTINUATION_RULING), true);
  assert.equal(Object.isFrozen(FINDING_CONTINUATION_RULING.tiers), true);
  assert.throws(() => {
    FINDING_CONTINUATION_RULING.ruling.text = "something else";
  });
});

test("the three tiers are stated, and only tier one renders anything today", () => {
  const tiers = FINDING_CONTINUATION_RULING.tiers;
  assert.deepEqual(
    tiers.map((t) => t.id),
    ["register_qualified", "passage_anchored_non_register", "record_level"],
  );

  const [one, two, three] = tiers;
  assert.match(one.gets, /a specific check/);
  assert.ok(one.renders, "tier one must name what it renders");
  assert.equal(one.status, "shipped");

  assert.match(two.gets, /NOT a verification/);
  assert.equal(two.renders, null, "tier two renders nothing while it is held");
  assert.match(two.status, /^held/);

  assert.match(three.gets, /neither, by ruling/);
  assert.equal(three.renders, null);
  assert.match(three.picked_up_by, /ChipLane/, "the ruling names a steering layer; the record must name which one");
});

test("the steering layer the ruling defers record-level findings to is a thing that exists", () => {
  // The ruling parks a whole tier on it, so "committed" has to mean committed.
  assert.notEqual(SRC.indexOf("function ChipLane("), -1, "ChipLane must be defined in workbench-app.jsx");
  assert.notEqual(SRC.indexOf("<ChipLane"), -1, "and mounted, not merely defined");
  assert.match(
    FINDING_CONTINUATION_RULING.tiers[2].picked_up_by,
    /takes the person's own answer as its input and needs no passage/,
  );
});

// ── 2. The gap, pinned against the live tree ─────────────────────────────────

test("the recorded gap quotes the strings that are actually in the tree", () => {
  // Each gap names a string. If that string changes, the gap may have been resolved and
  // the record has to be re-read rather than left standing.
  const gaps = new Map(FINDING_CONTINUATION_RULING.continuation_gap.gaps.map((g) => [g.id, g]));
  assert.deepEqual([...gaps.keys()].sort(), [
    "affordance_labels_presuppose_a_gesture",
    "attribution_line_inverts",
    "problem_entry_provenance",
  ]);

  const p1 = defaultSpanEntry(SPAN_MODES.PROBLEM);
  assert.equal(p1.id, "P1");
  assert.equal(gaps.get("problem_entry_provenance").string, p1.instruction_text);
  assert.match(p1.instruction_text, /^You marked this as the problem\./, "the false-in-a-row clause");

  assert.equal(gaps.get("attribution_line_inverts").string, SPAN_UI.attribution);
  assert.equal(
    gaps.get("affordance_labels_presuppose_a_gesture").string,
    `${SPAN_UI.problem_affordance} / ${SPAN_UI.desired_affordance}`,
  );

  // The DESIRED default is the one entry that composes without asserting who marked the
  // passage. Recorded because it is the near miss, and a near miss nobody wrote down is
  // the thing a later pass ships by accident.
  const d1 = defaultSpanEntry(SPAN_MODES.DESIRED);
  assert.equal(d1.id, "D1");
  assert.doesNotMatch(d1.instruction_text, /you marked|you selected/i);
  assert.match(
    gaps.get("problem_entry_provenance").what_would_resolve_it,
    /bank-level default decision that defaultSpanEntry explicitly reserves to the founder/,
  );
});

test("no bank entry supplies a row-level provenance-neutral PROBLEM instruction", () => {
  // The gap says the PROBLEM mode has no usable entry. That is a claim about the whole
  // bank, not just its default, so it is checked against the whole bank.
  const usable = READER_SPAN_BANK.filter(
    (e) => e.mode === SPAN_MODES.PROBLEM && !/\byou (marked|selected)\b/i.test(e.instruction_text),
  );
  // Several PROBLEM entries are provenance-neutral, and none is reachable: v1 composes
  // the mode default and nothing selects a sub-shape. That is the schema half of the gap.
  assert.ok(usable.length > 0, "provenance-neutral PROBLEM entries do exist in the bank");
  assert.equal(
    usable.some((e) => e.id === defaultSpanEntry(SPAN_MODES.PROBLEM).id),
    false,
    "but the composed default is not one of them, and only the default is reachable",
  );
  for (const e of READER_SPAN_BANK) {
    assert.equal(e.approved_ui_label, null, "and no entry carries an approved label to select one by");
  }
});

test("the duplication bar is real: the affordance pair and its attribution are pinned together", () => {
  const spec = readFileSync(fileURLToPath(new URL("./reader-span-selection.test.mjs", import.meta.url)), "utf8");
  assert.match(spec, /exactly one attribution line/);
  assert.match(FINDING_CONTINUATION_RULING.continuation_gap.duplication_bar, /Actionability v1 was rejected/);
});

// ── 3. The mechanism, measured — the half that is NOT blocked ────────────────

test("the span machinery already answers correctly for the whole held tier", () => {
  // Recorded because it separates the two halves of the STOP. The mechanism is available
  // and returns COMPOSE for every passage-anchored non-Register mark in every fixture,
  // touching zero cards. Nothing about tier two is waiting on machinery.
  let composed = 0;
  let other = 0;
  for (const { findings, reading, cardsById, answer } of eachFixture()) {
    for (const f of findings) {
      if (f.verification_card_id) continue;
      for (const m of reading.marks.filter((x) => x.finding_id === f.id && x.in_document && x.span)) {
        for (const mode of [SPAN_MODES.PROBLEM, SPAN_MODES.DESIRED]) {
          const act = resolveSpanAction({ span: m.span, reading, findings, cardsById, mode, answer });
          if (act.kind === "compose") composed += 1;
          else other += 1;
        }
      }
    }
  }
  assert.ok(composed > 0, "the held tier must be non-empty, or this proves nothing");
  assert.equal(other, 0, "every passage-anchored non-Register mark composes; none narrows and none degrades");
});

// ── 4. Every fixture finding lands in exactly one tier ───────────────────────

function* eachFixture() {
  for (const [name, scenario] of Object.entries(SCENARIOS)) {
    const route = scenario.routes && scenario.routes["/api/read"];
    if (typeof route !== "function") continue;
    let payload;
    try {
      payload = route();
    } catch {
      continue;
    }
    const answer = payload && payload.receipt && payload.receipt.open_run && payload.receipt.open_run.answer;
    if (!answer) continue;
    const findings = selectSubset(payload.result, "surfaced_findings").map(describeFinding);
    if (!findings.length) continue;
    const reading = buildSourceReading({ artifactText: answer, findings });
    const cards = (payload.checks && payload.checks.cards) || [];
    yield { name, payload, answer, findings, reading, cardsById: new Map(cards.map((c) => [c.id, c])) };
  }
}

// The tier a finding is in, derived from the record exactly as the ruling states it.
function tierOf(finding, reading) {
  if (finding.verification_card_id) return "register_qualified";
  const positioned = (reading.marks || []).some((m) => m.finding_id === finding.id && m.in_document && m.span);
  return positioned ? "passage_anchored_non_register" : "record_level";
}

test("the tier predicates partition every fixture finding, and all three tiers are populated", () => {
  const seen = { register_qualified: 0, passage_anchored_non_register: 0, record_level: 0 };
  for (const { findings, reading } of eachFixture()) {
    for (const f of findings) seen[tierOf(f, reading)] += 1;
  }
  for (const t of FINDING_CONTINUATION_RULING.tiers) {
    assert.ok(seen[t.id] > 0, `tier ${t.id} must be exercised by a fixture, saw ${seen[t.id]}`);
  }
});

// ── 5. What actually reaches the page ────────────────────────────────────────

const PANEL = componentSource(SRC, "MeasurementPanel");
const EVIDENCE = componentSource(SRC, "FindingEvidence");
const SOURCE_READING = componentSource(SRC, "SourceReading");
const MARK_NUMBER = componentSource(SRC, "MarkNumber");
const EXPLANATION_ID = componentSource(SRC, "findingExplanationId");
// Lifted, not stubbed: the whole question here is which rows carry a control.
const QUESTION_CONTROL = componentSource(SRC, "FindingQuestion");

async function renderPanel(payload) {
  const { code } = await transform(
    `${PANEL}\n${EVIDENCE}\n${SOURCE_READING}\n${MARK_NUMBER}\n${EXPLANATION_ID}\n${QUESTION_CONTROL}\nreturn MeasurementPanel;`,
    { loader: "jsx", jsxFactory: "h", jsxFragment: "Frag" },
  );
  const h = (type, props, ...children) => {
    if (typeof type === "function") return type({ ...(props || {}), children });
    return { type, props: props || {}, children };
  };
  const stub = () => null;
  const names = [
    "h", "Frag", "useState", "selectSubset", "describeFinding", "buildSourceReading",
    "ANCHOR_CHANNEL", "RECORD_LEVEL_ABSENCE_NOTE", "MARK_ORIENTATION_NOTE",
    "MEASURE_SECTION_LABEL", "MEASURE_INSPECT_SUMMARY", "MEASURE_SOURCE_LABEL", "MEASURE_EMPTY_LINE",
    "RECEIPT_BOUNDARY", "CHECK_UI", "READER_EVENTS", "emitReaderEvent",
    "ProvenanceStrip", "ReaderReceiptActions",
    "SPAN_SEGMENT_ATTR", "MARK_NUMBER_ATTR", "resolveSelectionSpan",
    "useRef", "useEffect",
    // Stubbed deliberately, and the stub is the point: the span affordance belongs to the
    // answer body and answers a different question. If a later pass renders it from a
    // finding row, that row's control appears in the tree below and section 5 fails.
    "SpanAffordances",
  ];
  const Panel = new Function(...names, code)(
    h,
    "Frag",
    (init) => [init, () => {}],
    selectSubset,
    describeFinding,
    buildSourceReading,
    ANCHOR_CHANNEL,
    RECORD_LEVEL_ABSENCE_NOTE,
    MARK_ORIENTATION_NOTE,
    stringConstant(SRC, "MEASURE_SECTION_LABEL"),
    stringConstant(SRC, "MEASURE_INSPECT_SUMMARY"),
    stringConstant(SRC, "MEASURE_SOURCE_LABEL"),
    stringConstant(SRC, "MEASURE_EMPTY_LINE"),
    "boundary",
    CHECK_UI,
    READER_EVENTS,
    () => {},
    stub,
    stub,
    SPAN_SEGMENT_ATTR,
    MARK_NUMBER_ATTR,
    resolveSelectionSpan,
    () => ({ current: null }),
    () => {},
    stub,
  );
  return Panel({ result: payload, context: {} });
}

function nodes(node, out = []) {
  if (node == null || node === false || node === true) return out;
  if (Array.isArray(node)) {
    for (const n of node) nodes(n, out);
    return out;
  }
  if (typeof node !== "object") return out;
  out.push(node);
  nodes(node.children, out);
  return out;
}

const cls = (n) => String((n.props || {}).className || "");
const controlsIn = (row) =>
  nodes(row).filter((n) => n !== row && (n.type === "button" || (n.type === "a" && (n.props || {}).href)));

test("no finding outside tier one renders a control, in any fixture", async () => {
  // The amendment's explicit confirmation. Checked by rendering, over every fixture that
  // mounts the panel, because "we did not build it" is a claim about the page.
  let tierOneRows = 0;
  let silentRows = 0;
  const scenarios = [];

  for (const { name, payload, findings, reading } of eachFixture()) {
    const tree = await renderPanel(payload);
    const rows = nodes(tree).filter((n) => n.type === "li" && cls(n).includes("wb-measure__finding"));
    if (!rows.length) continue;
    assert.equal(rows.length, findings.length, `${name}: every finding must render exactly one row`);
    scenarios.push(name);

    const byId = new Map(findings.map((f) => [`wb-finding-${f.id.replace(/[^A-Za-z0-9_-]/g, "-")}`, f]));
    for (const row of rows) {
      const finding = byId.get(String((row.props || {}).id));
      assert.ok(finding, `${name}: row ${(row.props || {}).id} must belong to a finding`);
      const tier = tierOf(finding, reading);
      const controls = controlsIn(row);

      if (tier === "register_qualified") {
        tierOneRows += 1;
        assert.ok(controls.length > 0, `${name}/${finding.id}: a Register finding must reach its check`);
        continue;
      }

      silentRows += 1;
      assert.deepEqual(
        controls.map((c) => c.type),
        [],
        `${name}/${finding.id}: tier ${tier} must render no control — ${FINDING_CONTINUATION_RULING.standing_instruction}`,
      );
    }
  }

  assert.ok(scenarios.length >= 2, `at least two fixtures must render the panel, saw ${scenarios.join(" ")}`);
  assert.ok(tierOneRows > 0, "a Register-qualified row must be exercised, or the negative proves nothing");
  assert.ok(silentRows > 0, "and a silent row, likewise");
});

test("no row names a verification for a finding that produced none", async () => {
  // The ruling's second prohibition: do not manufacture a verification question, an
  // evidence state, or any wording implying passage-level evidence.
  for (const { name, payload, findings, reading } of eachFixture()) {
    const tree = await renderPanel(payload);
    const rows = nodes(tree).filter((n) => n.type === "li" && cls(n).includes("wb-measure__finding"));
    const byId = new Map(findings.map((f) => [`wb-finding-${f.id.replace(/[^A-Za-z0-9_-]/g, "-")}`, f]));
    for (const row of rows) {
      const finding = byId.get(String((row.props || {}).id));
      if (!finding || tierOf(finding, reading) === "register_qualified") continue;
      const text = nodes(row)
        .flatMap((n) => [].concat(n.children || []))
        .filter((c) => typeof c === "string")
        .join(" ");
      assert.equal(text.includes(CHECK_UI.labels.verification), false, `${name}/${finding.id}: no verification label`);
      assert.equal(text.includes(CHECK_UI.copy_affordance), false, `${name}/${finding.id}: no copy affordance`);
      for (const s of [SPAN_UI.problem_affordance, SPAN_UI.desired_affordance, SPAN_UI.attribution]) {
        assert.equal(text.includes(s), false, `${name}/${finding.id}: no span-lane copy in a finding row`);
      }
    }
  }
});

// ── 6. Ruling two — the provenance reseal ────────────────────────────────────

test("the reseal rule is recorded with the measurement governance it governs", () => {
  assert.equal(PROVENANCE_RESEAL_RULE.ruling.date, "2026-08-22");
  assert.equal(PROVENANCE_RESEAL_RULE.ruling.authority, "founder");
  const text = PROVENANCE_RESEAL_RULE.ruling.text;
  assert.match(text, /may be resealed only after the governed instrument proves/);
  assert.match(text, /every measured value and every governed inventory is unchanged/);
  assert.match(text, /attributable to an identified authorized change/);
  assert.match(text, /it is never a response to a failing test/);
  assert.deepEqual(PROVENANCE_RESEAL_RULE.ruling.record_requirements.length, 3);
  assert.match(PROVENANCE_RESEAL_RULE.what_this_is_not, /provenance maintenance, not baseline acceptance/);
  assert.match(PROVENANCE_RESEAL_RULE.standing_instruction, /Never reseal because a custody seal in the suite went red/);
});

test("every recorded source reseal proves a hash that moved", () => {
  const reseals = CENSUS.provenance && CENSUS.provenance.reseals;
  assert.ok(Array.isArray(reseals) && reseals.length >= 1, "the artifact must carry the reseal log");
  assert.deepEqual(CENSUS.provenance.reseal_rule.ruling.text, PROVENANCE_RESEAL_RULE.ruling.text);

  const byPath = new Map(CENSUS.source_extraction.map((s) => [s.path, s.sha256]));
  for (const r of reseals) {
    assert.equal(r.measured_state_moved, false, "a reseal is only ever recorded over unmoved measurement");
    assert.equal(r.counts_identical, true);
    assert.equal(r.free_alpha_inventory_identical, true);
    assert.deepEqual(r.counts_after, r.counts_before);
    assert.deepEqual([...r.free_alpha_inventory_after].sort(), [...r.free_alpha_inventory_before].sort());
    assert.notEqual(r.fingerprint_before, r.fingerprint_after);

    // A source reseal's whole case is a hash that moved. No fabricated delta survives this:
    // the after-hash has to be the one the artifact currently holds.
    assert.ok(r.authorized_edits.length >= 1, "a source reseal must name what moved the hash");
    for (const e of r.authorized_edits) {
      assert.equal(byPath.get(e.source), e.sha256_after, `${e.source}: the artifact must hold the after-hash`);
      assert.notEqual(e.sha256_before, e.sha256_after);
      assert.ok(e.edit && e.edit.length > 20, `${e.source}: the edit must be described, not merely named`);
    }
    // And every source the reseal says did NOT move is still sitting at its unchanged hash.
    for (const e of r.edits_that_moved_no_governed_source || []) {
      assert.equal(byPath.get(e.source), e.sha256_unchanged, `${e.source}: recorded as unmoved, so it must be unmoved`);
    }
  }
});

// ── 7. Ruling of 2026-08-23 — the population reseal ──────────────────────────
// The fingerprint hashes sources AND the driven scenario population, and until this ruling
// only source movement had a rule. A population change arriving at the source rule can only
// pass by naming an edit that did not happen, so the second event got its own route.

test("the population-reseal rule is recorded with the eligibility it turns on", () => {
  assert.equal(POPULATION_RESEAL_RULE.ruling.date, "2026-08-23");
  assert.equal(POPULATION_RESEAL_RULE.ruling.authority, "founder");
  const text = POPULATION_RESEAL_RULE.ruling.text;
  assert.match(text, /conflates two distinct provenance events inside one fingerprint/);
  assert.match(text, /governed source movement and governed scenario-population movement/);
  assert.match(text, /existing reseal rule remains unchanged and governs the first/);
  assert.match(text, /not permission to loosen the census/);
  assert.match(text, /Do not fabricate an authorized source edit where no governed source hash moved/);
  assert.equal(POPULATION_RESEAL_RULE.ruling.eligibility.length, 8, "all eight conditions, recorded");
  assert.match(POPULATION_RESEAL_RULE.standing_instruction, /neither may satisfy the other/);

  // The ruling left the source rule alone, and the artifact has to show that it did.
  assert.equal(PROVENANCE_RESEAL_RULE.ruling.date, "2026-08-22");
  assert.deepEqual(CENSUS.provenance.population_reseal_rule.ruling.text, POPULATION_RESEAL_RULE.ruling.text);
});

test("every recorded population reseal proves a population that moved and nothing else", () => {
  const reseals = CENSUS.provenance.population_reseals;
  assert.ok(Array.isArray(reseals) && reseals.length >= 1, "the artifact must carry the population-reseal log");

  const byPath = new Map(CENSUS.source_extraction.map((s) => [s.path, s.sha256]));
  for (const [i, r] of reseals.entries()) {
    const isNewest = i === reseals.length - 1;
    // The instrument's own verdict, recomputed at write time against the live measurement.
    assert.deepEqual(r.failures, [], `${r.date}: a recorded population reseal must have been eligible`);
    assert.equal(r.eligible, true);

    // (1) No governed source moved — and each named hash is the one the artifact holds.
    assert.equal(r.source_hashes_identical, true);
    assert.equal(r.sources_unchanged.length, CENSUS.source_extraction.length, "every governed source accounted for");
    for (const s of r.sources_unchanged) {
      assert.equal(byPath.get(s.path), s.sha256, `${s.path}: recorded as unmoved, so it must be unmoved`);
    }
    // (2, 3) Measurement stood still.
    assert.equal(r.measured_state_moved, false);
    assert.equal(r.counts_identical, true);
    assert.equal(r.free_alpha_inventory_identical, true);
    assert.deepEqual(r.counts_after, r.counts_before);
    assert.deepEqual([...r.free_alpha_inventory_after].sort(), [...r.free_alpha_inventory_before].sort());
    // (4) The population is the only fingerprint input that moved — demonstrated by
    // recomputation at write time, not asserted.
    assert.equal(r.population_is_the_only_moved_input, true);
    assert.equal(r.fingerprint_before_recomputed, r.fingerprint_before);
    assert.equal(r.fingerprint_after_recomputed, r.fingerprint_after);
    assert.notEqual(r.fingerprint_before, r.fingerprint_after);
    // (5) The delta is enumerated and matches what the instrument observed.
    assert.equal(r.population_delta_matches_record, true);
    assert.deepEqual([...r.scenarios_added].sort(), r.scenarios_added_observed);
    assert.deepEqual([...r.scenarios_removed].sort(), r.scenarios_removed_observed);
    assert.ok(r.scenarios_added.length || r.scenarios_removed.length, "a population reseal must move a population");
    // (6) Every addition's region disposition is recorded and measured true.
    assert.equal(r.added_scenario_dispositions_hold, true);
    assert.deepEqual(r.added_scenario_dispositions.map((d) => d.scenario).sort(), [...r.scenarios_added].sort());
    for (const d of r.added_scenario_dispositions) {
      assert.equal(typeof d.renders_region, "boolean", `${d.scenario}: the disposition is a measured fact`);
      assert.equal(CENSUS.scenarios_rendering_region.includes(d.scenario), d.renders_region);
    }
    // (7) Tied to a named change.
    assert.ok(r.authorizing_change && r.authorizing_change.length > 20, "the authorizing change must be described");
    // (8) Nothing existing left or changed classification quietly.
    assert.equal(r.retained_scenarios_unchanged, true);
    assert.deepEqual(r.region_rendering_after, CENSUS.scenarios_rendering_region);

    // Which population this entry answers for — founder ruling of 2026-08-24. The newest
    // entry answers for today and has to produce exactly what the instrument measured. A
    // superseded entry answers for its own move, and its link to today is the next entry
    // starting where it finished. Asking every entry to reproduce the live population is
    // what closed this route on its second use, and re-imposing it here would close it
    // again with the instrument standing open.
    assert.equal(r.is_newest_entry, isNewest, `${r.date}: the artifact records which entry answers for today`);
    if (isNewest) {
      assert.deepEqual(r.population_after, CENSUS.coverage_fingerprint.scenarios);
    } else {
      assert.deepEqual(r.population_after, [...reseals[i + 1].population_before].sort(),
        `${r.date}: a superseded entry hands its population to the entry after it`);
    }
  }

  // The same walk the instrument refuses to write without, asserted against what it wrote.
  assert.deepEqual(CENSUS.provenance.population_reseal_chain, { intact: true, failures: [] });
});

test("the two reseal routes carry disjoint evidence, so neither can satisfy the other", () => {
  // A record that carried both key sets would pass whichever check ran first. Both
  // directions are asserted, because the route-around works in both directions.
  for (const r of CENSUS.provenance.reseals) {
    assert.deepEqual(r.carries_population_evidence, [], `${r.date}: a source reseal may not claim population evidence`);
    assert.ok(r.authorized_edits, `${r.date}: a source reseal is identified by the hash it moved`);
  }
  for (const r of CENSUS.provenance.population_reseals) {
    for (const k of SOURCE_RESEAL_EVIDENCE_KEYS) {
      assert.equal(k in r, false, `${r.date}: a population reseal may not claim source evidence (${k})`);
    }
    for (const k of POPULATION_RESEAL_EVIDENCE_KEYS) {
      assert.ok(k in r, `${r.date}: a population reseal must carry ${k}`);
    }
  }
  // The key sets themselves stay disjoint, or the check above measures nothing.
  for (const k of SOURCE_RESEAL_EVIDENCE_KEYS) {
    assert.equal(POPULATION_RESEAL_EVIDENCE_KEYS.includes(k), false, `${k} cannot belong to both routes`);
  }
});

test("the fingerprint the artifact carries is the end of an unbroken reseal chain", () => {
  // Every reseal, both routes, linked before-to-after. A record whose before-hash nothing
  // produced, or a fork where two records claim the same start, breaks the walk — which is
  // how a reseal quietly inserted over an unrecorded fingerprint gets caught.
  const all = [
    ...CENSUS.provenance.reseals.map((r) => ({ ...r, route: "source" })),
    ...CENSUS.provenance.population_reseals.map((r) => ({ ...r, route: "population" })),
  ];
  const afters = new Set(all.map((r) => r.fingerprint_after));
  const heads = all.filter((r) => !afters.has(r.fingerprint_before));
  assert.equal(heads.length, 1, "the chain has exactly one starting point");

  const byBefore = new Map();
  for (const r of all) {
    assert.equal(byBefore.has(r.fingerprint_before), false, `two reseals claim to start at ${r.fingerprint_before}`);
    byBefore.set(r.fingerprint_before, r);
  }

  const walked = [];
  let cursor = heads[0];
  while (cursor) {
    walked.push(cursor);
    cursor = byBefore.get(cursor.fingerprint_after);
  }
  assert.equal(walked.length, all.length, "the walk reaches every recorded reseal");
  assert.equal(walked[walked.length - 1].fingerprint_after, CENSUS.coverage_fingerprint.sha256,
    "the chain must end at the fingerprint the artifact actually carries");

  // And the terminal record proved its case on its own route, not the other one.
  const terminal = walked[walked.length - 1];
  if (terminal.route === "source") {
    assert.ok(terminal.authorized_edits.length >= 1, "a source reseal produced this fingerprint, so a hash must have moved");
    assert.deepEqual(terminal.carries_population_evidence, []);
  } else {
    assert.equal(terminal.eligible, true, "a population reseal produced this fingerprint, so it must have been eligible");
    assert.equal(terminal.source_hashes_identical, true, "no source hash moved, or this was the wrong route");
    assert.deepEqual(terminal.population_after, CENSUS.coverage_fingerprint.scenarios);
  }
});
