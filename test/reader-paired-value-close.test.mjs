// The value close, and proof that its gate holds.
//
// PAIRED_VALUE_CLOSE — "A better answer, without already knowing what to ask." — is the
// one line that tells a person what they just got. It is also the one line on the paired
// surface that makes a claim about the product rather than about the run, so it is the
// line most able to lie. It lies the moment it renders over something that is not a
// better answer.
//
// The gate is two terms: `canonical && rows.length`. This file proves the five states the
// correction block names are excluded by those two terms, and it proves them by running
// the REAL parser, the REAL paired adapter, the REAL construction door and the REAL
// subset selector, then evaluating the gate expression EXTRACTED FROM workbench-app.jsx.
// Re-typing the gate here would prove a copy of it. The extraction is what makes this a
// proof of the shipped line.
//
// Each term does distinct work, which is why the proof is not one assertion:
//
//   `canonical`   excludes every record with no canonical result. A legacy pair still
//                 produces rows — it renders readings from delta_items — so rows.length
//                 alone would let the line render over a record whose excerpts do not
//                 exist and whose findings were never span-resolved. This term is
//                 load-bearing and test 2 proves it by building a legacy pair WITH rows.
//
//   `rows.length` excludes every canonical pair that surfaced nothing. Rows come from
//                 selectSubset(canonical, "probe_surfaced_differences"), whose predicate
//                 is paired_probe_only_satisfying_anchor_contract: a finding counts only
//                 if it is PROBE_ONLY and carries a probe-side quotation the server
//                 resolved to an exact span. Nothing weaker reaches the row list, so
//                 "at least one row" means "at least one quoted thing the second answer
//                 carried and the first did not".
//
// THE CONDITION THIS GATE CANNOT CHECK, stated plainly rather than asserted away.
// The line's second clause — "without already knowing what to ask" — is true because the
// product wrote the probe. Nothing in the render layer verifies that the text a person
// pasted as the second answer came from running TARGETED_PROMPT_TEXT. The product
// supplies the probe; the person supplies the paste; the conditions are reported, never
// observed. Test 6 pins that as a client-reported condition and states why the line
// survives it: the claim is that the product asked the question, which it did, in one
// fixed disclosed sentence at the recorded method version. It is not a claim that the
// person could not have asked something else. A server-side probe-equality check is an
// API-spec question and is queued as one; it is not built here, because strengthening
// this gate would mean changing api/ or reader-result.js semantics, which are frozen.
//
// Run: node --test test/reader-paired-value-close.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  ARTIFACT_ORIGINAL,
  ARTIFACT_TARGETED,
  countOf,
  selectSubset,
} from "../reader-result.js";
import { buildCanonicalPaired, parsePairedMeasurement } from "../api/read-paired.js";
import {
  PAIRED_VALUE_CLOSE,
  TARGETED_PROMPT_SOURCE_TYPE,
  TARGETED_PROMPT_TEXT,
  buildTargetedPrompt,
} from "../reader-paired.js";

const SRC = readFileSync(fileURLToPath(new URL("../workbench-app.jsx", import.meta.url)), "utf8");

const OPEN_ANSWER = "A landlord must return a security deposit within 30 days of the tenant moving out.";
const PROBE_ANSWER =
  "The deadline depends on the state. It runs from 14 days in some states to 60 days in others. " +
  "Several states also require the landlord to pay the tenant a penalty when the deadline is missed.";

// ── The gate, lifted out of the component ────────────────────────────────────
// One capture, anchored on the class name so it cannot match a different ternary.
// If the render site is rewritten, this throws rather than passing on a stale copy.
const GATE_SITE = /\{([^{}]+)\s*\?\s*<p className="wb-act2__close">\{PAIRED_VALUE_CLOSE\}<\/p>\s*:\s*null\}/;

function extractGate() {
  const m = SRC.match(GATE_SITE);
  assert.ok(m, "the value-close render site was not found — the gate moved and this proof is stale");
  return m[1].trim();
}

// Evaluate the extracted gate against a scope, exactly as the component would. Returns
// the truthiness of the rendered branch: truthy means the line renders.
function renders({ canonical, rows }) {
  // eslint-disable-next-line no-new-func
  const fn = new Function("canonical", "rows", `return Boolean(${extractGate()});`);
  return fn(canonical, rows);
}

// ── Fixtures, through the real path ──────────────────────────────────────────

function difference({ interpretation, open = null, targeted, signal_pattern = "Omission" }) {
  return {
    signal_pattern,
    interpretation,
    snippets: [
      { artifact_role: ARTIFACT_TARGETED, status: "PRESENT", verbatim_snippet: targeted },
      open === null
        ? { artifact_role: ARTIFACT_ORIGINAL, status: "ABSENT" }
        : { artifact_role: ARTIFACT_ORIGINAL, status: "PRESENT", verbatim_snippet: open },
    ],
  };
}

function canonicalFrom(differences) {
  const pm = parsePairedMeasurement({ differences, gap_estimate: differences.length, estimate_rationale: "r" });
  assert.ok(pm, "the fixture must parse");
  return buildCanonicalPaired(pm, OPEN_ANSWER, PROBE_ANSWER);
}

// The row derivation, read off the component's own source so the shapes cannot diverge:
// PairedDeltaView builds rows from selectSubset(canonical, "probe_surfaced_differences")
// when canonical exists, and from paired.delta_items when it does not.
function rowsFor(paired) {
  const canonical = paired.result || null;
  if (canonical) return selectSubset(canonical, "probe_surfaced_differences");
  return (Array.isArray(paired.delta_items) ? paired.delta_items : []).map((d, i) => ({ key: `legacy.${i}` }));
}

function gateFor(paired) {
  return renders({ canonical: paired.result || null, rows: rowsFor(paired) });
}

const SURFACING_DELTA = difference({
  interpretation: "The second answer names a penalty; the first did not mention one.",
  targeted: "Several states also require the landlord to pay the tenant a penalty when the deadline is missed.",
});

// ── Proof ────────────────────────────────────────────────────────────────────

test("0) the gate in the component is still the two terms this file reasons about", () => {
  const gate = extractGate();
  assert.equal(gate, "canonical && rows.length", `the gate changed to \`${gate}\` — re-derive the proof below`);
  // The line is a constant, imported. An inlined string would be a second copy able to
  // drift from the one every other surface reads.
  assert.ok(SRC.includes("{PAIRED_VALUE_CLOSE}"), "the close must render from the shared constant");
  assert.ok(!SRC.includes(PAIRED_VALUE_CLOSE), "the close must not also appear inlined in the component");
  // The retired line, killed for word economy by founder ruling. It does not come back.
  assert.ok(
    !SRC.includes("You now have a fuller picture"),
    "the retired value close must not come back",
  );
});

test("1) the line renders on the state it is about: a canonical pair with surfaced rows", () => {
  const canonical = canonicalFrom([SURFACING_DELTA]);
  assert.equal(countOf(canonical, "probe_surfaced_differences"), 1);
  assert.equal(gateFor({ result: canonical }), true);
  // Positive control. Without this, every exclusion below could pass on a gate that is
  // simply always false, which would "prove" the line can never lie by never shipping.
});

test("2) EXCLUDED — a legacy pair, even though it has rows", () => {
  // The state that makes `canonical` load-bearing. A pre-2.0 record renders its readings
  // from delta_items: rows.length is 2, and no excerpt on screen was ever resolved to a
  // span. "A better answer" over unquotable readings is the claim this term refuses.
  const legacy = {
    delta_items: [
      { signal_pattern: "Omission", point: "The second answer named a penalty." },
      { signal_pattern: "Omission", point: "The second answer named a state-by-state range." },
    ],
  };
  assert.equal(rowsFor(legacy).length, 2, "the fixture must actually produce rows, or it proves nothing");
  assert.equal(gateFor(legacy), false);
});

test("3) EXCLUDED — a canonical pair that surfaced nothing", () => {
  // parsePairedMeasurement accepts an empty differences list: the run completed, the
  // probe returned, and nothing met the surfacing contract. This is the state that
  // renders PAIRED_EMPTY_CLOSE, and the value close must be absent from that frame.
  const canonical = canonicalFrom([]);
  assert.ok(canonical, "an empty paired measurement still produces a canonical result");
  assert.equal(countOf(canonical, "probe_surfaced_differences"), 0);
  assert.equal(gateFor({ result: canonical }), false);
});

test("4) EXCLUDED — an unavailable second answer, at both the mount and the gate", () => {
  // Two layers, and the outer one is the real reason. When the paired call does not
  // return an analysis, `paired` is falsy and PairedDeltaView never mounts — the source
  // check below pins that, because a gate proof that only reasons about the inner layer
  // would miss a regression that mounts the view on a fallback shape.
  assert.ok(
    /if \(paired\) \{\s*return \(/.test(SRC),
    "PairedDeltaView must remain behind a truthy-paired mount guard",
  );
  // And if a degraded or fallback shape did reach the view, it carries no canonical
  // result, so the first term stops it anyway.
  for (const shape of [{}, { error: "capacity" }, { delta_items: [] }, { result: null }]) {
    assert.equal(gateFor(shape), false, `an unavailable-answer shape rendered the close: ${JSON.stringify(shape)}`);
  }
});

test("5) EXCLUDED — a noncanonical result object", () => {
  // A truthy `paired.result` that never went through the construction door. The first
  // term passes; the second cannot, because selectSubset filters on findings and the
  // predicate reads fields the door is the only thing that writes. Nothing here is
  // upgraded and nothing throws — it simply yields no rows.
  for (const junk of [
    { surface: "paired" },
    { surface: "paired", findings: [] },
    { surface: "paired", findings: [{ class_label: "Omission", statement: "made up" }] },
    { findings: [{ comparison_direction: "PROBE_ONLY" }] },
  ]) {
    assert.equal(selectSubset(junk, "probe_surfaced_differences").length, 0);
    assert.equal(gateFor({ result: junk }), false, `a noncanonical result rendered the close: ${JSON.stringify(junk)}`);
  }
});

test("6) NOT MECHANICALLY EXCLUDED — the probe path is a reported condition, and the line still fits", () => {
  // The honest one. The gate cannot establish that the pasted second answer was produced
  // by running the fixed probe. There is no field on the paired record that carries a
  // server observation of it, and the correction block freezes api/ and reader-result.js,
  // so this pass does not add one.
  //
  // What IS established, and what the clause actually claims: the product wrote the
  // question. TARGETED_PROMPT_TEXT is one fixed sentence at the recorded method version,
  // built with no model call and no randomness, and the surface hands it to the person to
  // run. "Without already knowing what to ask" says the person did not have to compose
  // the follow-up. That is true of every run that reaches this gate, whatever the person
  // then chose to paste.
  //
  // The failure this leaves open is a person pasting an unrelated answer, and its result
  // is rows about a comparison they constructed. The line would then overclaim on a run
  // the person themselves fabricated. That is the same trust boundary every pasted
  // artifact on this surface already sits behind, and the claim row above the delta
  // states it in words on every paired result.
  assert.equal(typeof TARGETED_PROMPT_TEXT, "string");
  assert.ok(TARGETED_PROMPT_TEXT.length > 0, "the probe must be a real fixed sentence");
  assert.equal(TARGETED_PROMPT_TEXT, TARGETED_PROMPT_TEXT.trim());

  // "Fixed" as a checked property rather than a comment: the builder returns the same
  // sentence on two different eligible runs, so the question a person is handed does not
  // vary with what their answer happened to contain.
  const eligible = (item) =>
    buildTargetedPrompt({ measurement: { findings: [{ type: TARGETED_PROMPT_SOURCE_TYPE, item }] } });
  const a = eligible("the statutory deadline");
  const b = eligible("the penalty provision");
  assert.equal(a.eligible, true, "the fixture must reach the eligible branch, or this checks nothing");
  assert.equal(b.eligible, true);
  assert.equal(a.targeted_prompt, TARGETED_PROMPT_TEXT);
  assert.equal(b.targeted_prompt, TARGETED_PROMPT_TEXT);

  // A pair built from an answer that did not come from the probe reaches the gate. This
  // asserts the open state rather than pretending it is closed.
  const offProbe = canonicalFrom([
    difference({
      interpretation: "The second answer names a penalty the first did not.",
      targeted: "Several states also require the landlord to pay the tenant a penalty when the deadline is missed.",
    }),
  ]);
  assert.equal(gateFor({ result: offProbe }), true, "documented: the render layer cannot see which question was asked");
});

test("7) the line itself claims only what the two terms establish", () => {
  // Word-level, because the gate proof is worthless if the sentence drifts into a claim
  // the gate does not carry. No completeness, no sufficiency, no verdict on either answer.
  assert.equal(PAIRED_VALUE_CLOSE, "A better answer, without already knowing what to ask.");
  assert.doesNotMatch(PAIRED_VALUE_CLOSE, /\bcomplete\b|\bfull\b|\ball\b|\beverything\b/i);
  assert.doesNotMatch(PAIRED_VALUE_CLOSE, /\bbest\b|\bcorrect\b|\baccurate\b|\btrue\b/i);
});
