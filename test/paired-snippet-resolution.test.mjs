// Guardrail: at paired_method_version 2.0, no text may render as a quotation unless
// the server resolved it to an exact span in the artifact it is attributed to.
//
// This is a claim about the EVIDENCE, and only about the evidence. It says the words
// shown really are in the answer named. It says nothing about whether the Reader's
// reading of them is correct — that is a separate judgment, it is labelled separately
// on the surface, and no test here asserts it.
//
// What changed, and why a test file exists for it. Through 1.1 the model returned the
// quotation text and the server printed it; across seven probe runs, three returned
// prose presented as quotation that does not occur in the attributed answer. Models
// are unreliable reproducers and reliable locators, so ownership inverted: the model
// proposes a short snippet and names the artifact, and the server looks it up. The
// point is not that fabrication is now caught. It is that fabrication is now
// unrepresentable — an unresolved snippet produces an anchor whose quote is the empty
// string, and every surfacing subset excludes it.
//
// Everything below runs the REAL resolver, the REAL construction door and the REAL
// paired adapter. A fixture that reimplements the mapping proves nothing about the
// product.
// Run: node --test test/paired-snippet-resolution.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  ANCHOR_STATUS,
  ARTIFACT_ORIGINAL,
  ARTIFACT_TARGETED,
  SNIPPET_REJECTION,
  classBreakdown,
  countOf,
  describeFinding,
  resolvePairedSnippet,
  selectSubset,
} from "../reader-result.js";
import { buildCanonicalPaired, parsePairedMeasurement } from "../api/read-paired.js";

const OPEN_ANSWER = "A landlord must return a security deposit within 30 days of the tenant moving out.";
const PROBE_ANSWER =
  "The deadline depends on the state. It runs from 14 days in some states to 60 days in others. " +
  "Several states also require the landlord to pay the tenant a penalty when the deadline is missed.";

// An answer that says the same short phrase twice, in two different places. This is
// the ordinary case the resolver must not guess at: "the deadline" alone identifies
// nothing, and picking the first hit would attribute the finding to a sentence the
// model may never have been looking at.
const REPEATED_ANSWER =
  "The deadline is set by state law, not federal law. " +
  "A tenant who misses the deadline loses the claim. " +
  "The deadline is also tolled while a dispute is open.";

function difference({ interpretation, open = null, targeted, targetedContext = "", signal_pattern = "Omission" }) {
  const probe = { artifact_role: ARTIFACT_TARGETED, status: "PRESENT", verbatim_snippet: targeted };
  if (targetedContext) probe.disambiguating_context = targetedContext;
  return {
    signal_pattern,
    interpretation,
    snippets: [
      probe,
      open === null
        ? { artifact_role: ARTIFACT_ORIGINAL, status: "ABSENT" }
        : { artifact_role: ARTIFACT_ORIGINAL, status: "PRESENT", verbatim_snippet: open },
    ],
  };
}

// Through the REAL parser and the REAL adapter, in that order — the exact path the
// endpoint takes between the model's reply and the door.
function canonicalFrom(differences, probeAnswer = PROBE_ANSWER) {
  const pm = parsePairedMeasurement({ differences, gap_estimate: 2, estimate_rationale: "r" });
  assert.ok(pm, "the fixture must parse");
  return buildCanonicalPaired(pm, { open: OPEN_ANSWER, targeted: probeAnswer });
}

function anchorFor(finding, role) {
  return finding.anchors.find((a) => a.role === role);
}

const RESOLVES = difference({
  interpretation: "The second answer names the deadline as state-set where the first gave one number.",
  open: "within 30 days",
  targeted: "The deadline depends on the state.",
});

// ── 1. An unlocatable required snippet cannot surface ─────────────────────────

test("a probe-side snippet that is not in the probe answer is recorded and cannot surface", () => {
  const canonical = canonicalFrom([
    RESOLVES,
    difference({
      interpretation: "The second answer weighs the risk differently.",
      targeted: "the model considered the downside carefully",
    }),
  ]);

  assert.equal(countOf(canonical, "recorded_findings"), 2, "the record keeps what it could not verify");
  assert.equal(countOf(canonical, "probe_surfaced_differences"), 1, "only the resolved one may surface");

  const rejected = anchorFor(canonical.findings[1], ARTIFACT_TARGETED);
  assert.equal(rejected.status, ANCHOR_STATUS.UNRESOLVED);
  assert.equal(rejected.rejection_reason, SNIPPET_REJECTION.UNLOCATABLE_SNIPPET);
  // The load-bearing property. There is no text on this anchor for a renderer to put
  // quotation marks around, so no renderer has to remember not to.
  assert.equal(rejected.quote, "");
  assert.equal(rejected.span, null);
});

// ── 2. A repeated snippet plus identifying context resolves to the right one ───

test("a repeated snippet with uniquely identifying context resolves to that occurrence", () => {
  const canonical = canonicalFrom(
    [
      difference({
        interpretation: "The second answer says the deadline can be paused.",
        targeted: "The deadline",
        targetedContext: "The deadline is also tolled while a dispute is open.",
      }),
    ],
    REPEATED_ANSWER,
  );

  const anchor = anchorFor(canonical.findings[0], ARTIFACT_TARGETED);
  assert.equal(anchor.status, ANCHOR_STATUS.QUOTED);
  assert.equal(anchor.quote, "The deadline");
  // Not the first occurrence. The third sentence is the one the context named, and
  // the span must land there rather than at index 0.
  assert.equal(anchor.span.start, REPEATED_ANSWER.lastIndexOf("The deadline"));
  assert.equal(REPEATED_ANSWER.slice(anchor.span.start, anchor.span.end), "The deadline");
});

// ── 3. Still ambiguous after context → rejected, never guessed ────────────────

test("a repeated snippet that context cannot narrow is rejected as AMBIGUOUS_SNIPPET", () => {
  const canonical = canonicalFrom(
    [
      difference({
        interpretation: "The second answer says something about the deadline.",
        targeted: "The deadline",
      }),
    ],
    REPEATED_ANSWER,
  );

  const anchor = anchorFor(canonical.findings[0], ARTIFACT_TARGETED);
  assert.equal(anchor.status, ANCHOR_STATUS.UNRESOLVED);
  assert.equal(anchor.rejection_reason, SNIPPET_REJECTION.AMBIGUOUS_SNIPPET);
  assert.equal(anchor.quote, "");
  assert.equal(countOf(canonical, "probe_surfaced_differences"), 0, "an unattributable span is not evidence");

  // And the resolver says so directly, with the occurrence count it saw.
  const outcome = resolvePairedSnippet({ artifactText: REPEATED_ANSWER, snippet: "The deadline" });
  assert.equal(outcome.ok, false);
  assert.equal(outcome.reason, SNIPPET_REJECTION.AMBIGUOUS_SNIPPET);
  assert.equal(outcome.occurrences, 2);
});

test("context that does not itself contain the snippet cannot be used to select an occurrence", () => {
  // A context passage that names one sentence but does not contain the snippet is not
  // evidence about which occurrence was meant, so the resolver refuses rather than
  // reaching for the nearest plausible hit.
  const outcome = resolvePairedSnippet({
    artifactText: REPEATED_ANSWER,
    snippet: "The deadline",
    context: "A tenant who misses the deadline loses the claim.",
  });
  assert.equal(outcome.ok, false);
  assert.equal(outcome.reason, SNIPPET_REJECTION.AMBIGUOUS_SNIPPET);
});

// ── 4. Fabrication cannot reach a render path, asserted at construction ───────

test("no surfaced finding can carry a quotation absent from the artifact it names", () => {
  const canonical = canonicalFrom([
    RESOLVES,
    difference({
      interpretation: "Fabricated probe quotation.",
      open: "a phrase the first answer never uses",
      targeted: "a phrase the second answer never uses",
    }),
  ]);
  const artifacts = { [ARTIFACT_ORIGINAL]: OPEN_ANSWER, [ARTIFACT_TARGETED]: PROBE_ANSWER };

  // The property, stated over everything a render path can reach. describeFinding is
  // the only door a renderer has, so asserting it here covers every surface at once.
  for (const f of selectSubset(canonical, "probe_surfaced_differences").map(describeFinding)) {
    for (const a of f.anchors) {
      if (a.status !== ANCHOR_STATUS.QUOTED) {
        assert.equal(a.quote, "", "a non-QUOTED anchor may never carry text");
        continue;
      }
      assert.ok(a.quote, "a QUOTED anchor must carry the text it resolved to");
      assert.ok(
        artifacts[a.role].includes(a.quote),
        `quoted text must occur in ${a.role}: ${JSON.stringify(a.quote)}`,
      );
    }
  }

  assert.equal(countOf(canonical, "probe_surfaced_differences"), 1);
  assert.equal(countOf(canonical, "recorded_findings"), 2);
});

// ── 5. A span reproduces the original artifact exactly, under the declared rule ─

test("every resolved span reproduces the original artifact text exactly", () => {
  // Deliberately awkward source text: a curly apostrophe, a non-breaking space, a
  // line break inside the passage, and an emoji ahead of it so the offsets sit past a
  // surrogate pair. The declared convention is UTF-16 code units into the STORED
  // string, so slice() must still reproduce the original bytes — including the curly
  // apostrophe the model folded to an ASCII one when it copied.
  const artifact =
    "\u{1F4CB} Checklist.\nThe landlord’s deadline is set by\nstate law, not by the lease.";
  const outcome = resolvePairedSnippet({
    artifactText: artifact,
    snippet: "The landlord's deadline is set by state law",
  });

  assert.equal(outcome.ok, true);
  assert.equal(artifact.slice(outcome.span.start, outcome.span.end), outcome.quote);
  // The quote is the ORIGINAL substring, not the normalized lookup key: the curly
  // apostrophe, the non-breaking space and the newline all survive. Normalization is
  // for matching only, and its offsets are never stored.
  assert.ok(outcome.quote.includes("’"), "the original curly apostrophe survives");
  assert.ok(outcome.quote.includes(" "), "the original non-breaking space survives");
  assert.ok(outcome.quote.includes("\n"), "the original line break survives");
  assert.notEqual(outcome.quote, "The landlord's deadline is set by state law");
});

test("a span resolved through the door reproduces its artifact under slice()", () => {
  const canonical = canonicalFrom([RESOLVES]);
  const artifacts = { [ARTIFACT_ORIGINAL]: OPEN_ANSWER, [ARTIFACT_TARGETED]: PROBE_ANSWER };
  for (const a of canonical.findings[0].anchors) {
    if (a.status !== ANCHOR_STATUS.QUOTED) continue;
    assert.equal(artifacts[a.role].slice(a.span.start, a.span.end), a.quote);
  }
});

// ── 6. A pre-2.0 record renders through the legacy path, with no quotation ────

test("PairedDeltaView renders a record with no canonical result through the legacy path", () => {
  const src = readFileSync(
    process.env.WORKBENCH_APP_JSX || fileURLToPath(new URL("../workbench-app.jsx", import.meta.url)),
    "utf8",
  );
  const start = src.indexOf("function PairedDeltaView(");
  assert.notEqual(start, -1, "workbench-app.jsx must define PairedDeltaView");
  const rest = src.slice(start);
  const next = rest.indexOf("\nfunction ", 1);
  const view = next === -1 ? rest : rest.slice(0, next);

  // The legacy branch is keyed on the absence of a canonical result, not on a version
  // string, so a record this build cannot verify never depends on a label being right.
  assert.match(view, /const legacy = !canonical;/);

  // Its rows carry no quotation on either side, by construction.
  const legacyRows = view.slice(view.indexOf(": legacyItems.map("));
  const legacyRowBlock = legacyRows.slice(0, legacyRows.indexOf("}));") + 4);
  assert.match(legacyRowBlock, /openQuote: "",/);
  assert.match(legacyRowBlock, /probeQuote: "",/);

  // And the two surfaces that would put its text in front of someone else are withheld.
  assert.match(view, /\{legacy \? null : \(\s*<InspectionCardAction/);
  assert.match(view, /\{legacy \? null : <ReaderShareAction/);
});

test("a legacy notice names the method version it is refusing to trust, and never invents one", () => {
  const src = readFileSync(
    process.env.WORKBENCH_APP_JSX || fileURLToPath(new URL("../workbench-app.jsx", import.meta.url)),
    "utf8",
  );
  const fn = src.slice(src.indexOf("function legacyPairedNotice("));
  const body = fn.slice(0, fn.indexOf("\n}") + 2);
  // eslint-disable-next-line no-new-func
  const legacyPairedNotice = new Function(`${body}; return legacyPairedNotice;`)();

  assert.match(legacyPairedNotice("1.1"), /an earlier method \(1\.1\)/);
  assert.match(legacyPairedNotice(""), /an earlier method that/);
  assert.equal(legacyPairedNotice("").includes("2.0"), false, "an unversioned row is never labelled 2.0");
  assert.match(legacyPairedNotice("1.1"), /excerpts are withheld/);
});

// ── 7. The visible tally equals the visible rows ──────────────────────────────

test("the paired tally and the paired rows are one collection, not two counts", () => {
  const canonical = canonicalFrom([
    RESOLVES,
    difference({
      interpretation: "The second answer names a penalty; the first did not mention one.",
      targeted: "pay the tenant a penalty",
      signal_pattern: "Deflection",
    }),
    difference({
      interpretation: "Unverifiable, so it may not be counted.",
      targeted: "words the probe answer does not contain anywhere",
      signal_pattern: "Framing Drift",
    }),
  ]);

  const rows = selectSubset(canonical, "probe_surfaced_differences");
  const breakdown = classBreakdown(canonical, "probe_surfaced_differences");
  const tally = Object.values(breakdown).reduce((t, n) => t + n, 0);

  assert.equal(rows.length, 2);
  assert.equal(tally, rows.length, "the tally is the row list, summed — it cannot exceed it");
  assert.equal(breakdown.framing_drift, 0, "the rejected item contributes to no class");
  assert.equal(countOf(canonical, "recorded_findings"), 3, "and the record still holds all three");
});

// ── The rate itself, recorded and not displayed ───────────────────────────────

test("the four resolution counters record what the model proposed against what resolved", () => {
  const canonical = canonicalFrom(
    [
      // Two sides, both resolve.
      difference({ interpretation: "resolves both sides", open: "within 30 days", targeted: "The deadline" }),
      // Probe side unlocatable, open side ABSENT (which proposes no snippet at all).
      difference({ interpretation: "unlocatable", targeted: "not present in this answer" }),
    ],
    // A probe answer where "The deadline" occurs exactly once, so the first resolves.
    "The deadline depends on the state.",
  );

  assert.deepEqual(canonical.snippet_resolution, {
    snippets_proposed: 3,
    snippets_resolved_unique: 2,
    snippets_rejected_unlocatable: 1,
    snippets_rejected_ambiguous: 0,
  });
});

test("an ambiguous rejection is counted apart from an unlocatable one", () => {
  const canonical = canonicalFrom(
    [difference({ interpretation: "ambiguous", targeted: "The deadline" })],
    REPEATED_ANSWER,
  );
  assert.equal(canonical.snippet_resolution.snippets_proposed, 1);
  assert.equal(canonical.snippet_resolution.snippets_rejected_ambiguous, 1);
  assert.equal(canonical.snippet_resolution.snippets_rejected_unlocatable, 0);
});
