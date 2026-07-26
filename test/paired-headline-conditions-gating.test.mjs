// Guardrail: in the Workbench paired view, the reveal headline and the construct tag must
// answer to the SAME conditions_matched determination that fires the unmatched badge and
// warning. Founder ruling 2026-07-25 (docs/IMBAS-READER-OUTPUT-DESIGN.md §3): when
// conditions_matched is not true the paired view must not name the Volunteer Gap and must
// not assert volunteering behavior — it reports the observed difference descriptively.
//
// The bug this guards (seen in production): suggestLoopState picks the loop state from
// {gap_estimate, signal_counts} alone and never reads conditions_matched, so the headline
// "It answers when asked. It just didn't volunteer." and the tag "That's the Volunteer Gap
// — you just watched it happen in your own chat." rendered on runs whose conditions were
// never confirmed. Only the badge and warning BETWEEN them were gated, so the notice sat
// sandwiched between an assertion above it and the construct name below it. Meanwhile
// suggestChipState in the same file DID consult the flag: two lanes, opposite behavior.
//
// The fix gates at the render site: `unmatched` is determined once (pairConditionsUnmatched)
// and loopRevealCopy(state, unmatched) resolves the copy consumed by the headline, the tag
// AND the copied Inspection Card. suggestLoopState is unchanged — the conditions state is
// orthogonal to the gap reading, and folding them together would discard the gap reading.
//
// workbench-app.jsx is JSX and cannot be imported by Node, and the gate lives in the call
// site's expressions. So — following test/inspection-meaning-findings-source.test.mjs —
// this reads the source, extracts those exact expressions, and evaluates them against
// synthetic runs, feeding the REAL loopRevealCopy exactly as the component does.
//
// Pre-fix regression check: point WORKBENCH_APP_JSX at a pre-fix snapshot
// (`git show <base>:workbench-app.jsx > /tmp/pre.jsx`) and tests 1, 2, 3, 5, 7 and 9 fail.
// Run: node --test test/paired-headline-conditions-gating.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  LOOP_STATE_COPY,
  LOOP_CONSTRUCT_STATES,
  LOOP_UNMATCHED_HEADLINE,
  loopRevealCopy,
  suggestLoopState,
  pairConditionsUnmatched,
  buildPairCapture,
  LOOP_STATE_GAP_REVEALED,
  LOOP_STATE_STILL_MISSING,
  LOOP_STATE_NOT_CLEAR,
  LOOP_STATES,
  LOOP_PANEL_FIRST_LABEL,
  LOOP_PANEL_SECOND_LABEL,
  LOOP_DIDNT_COME_UP,
  PAIR_CAPTURE_UI,
} from "../reader-paired.js";
import { RECEIPT_BOUNDARY } from "../reader-receipt.js";

const SRC_PATH =
  process.env.WORKBENCH_APP_JSX ||
  fileURLToPath(new URL("../workbench-app.jsx", import.meta.url));
const SRC = readFileSync(SRC_PATH, "utf8");

// The construct string the ruling forbids on an unmatched run. Read from the live copy
// table so a reworded tag cannot slip past this guard.
const CONSTRUCT_TAG = LOOP_STATE_COPY[LOOP_STATE_GAP_REVEALED].tag;

// ── Source extraction ─────────────────────────────────────────────────────────
// Match a bracket pair from `fromIndex`, returning the closing index.
function matchPair(src, fromIndex, open, close) {
  const start = src.indexOf(open, fromIndex);
  assert.notEqual(start, -1, `expected ${open}`);
  let depth = 0;
  for (let i = start; i < src.length; i++) {
    if (src[i] === open) depth++;
    else if (src[i] === close && --depth === 0) return { start, end: i };
  }
  throw new Error(`unbalanced ${open}${close}`);
}

// Full source of a top-level function declaration. The parameter list is skipped
// explicitly, because these functions destructure their argument — so the first `{`
// after the name is the parameter pattern, not the body.
function functionSource(name) {
  const at = SRC.indexOf(`function ${name}(`);
  assert.notEqual(at, -1, `${name} must exist in workbench-app.jsx`);
  const params = matchPair(SRC, at, "(", ")");
  const body = matchPair(SRC, params.end, "{", "}");
  return SRC.slice(at, body.end + 1);
}

// The whole component, bounded by the next top-level declaration. Used for regex
// assertions about the render sites, so it must not bleed into the chip lane below.
const PAIRED_VIEW = (() => {
  const at = SRC.indexOf("function PairedDeltaView(");
  assert.notEqual(at, -1, "PairedDeltaView must exist in workbench-app.jsx");
  const next = SRC.indexOf("\nfunction ", at + 1);
  const region = SRC.slice(at, next === -1 ? SRC.length : next);
  assert.ok(!region.includes("CHIP_LOOP_STATE_COPY"), "the region must not bleed into the chip lane");
  return region;
})();

// The `const copy = <expr>;` assignment that feeds the reveal. Pre-fix this reads
// `LOOP_STATE_COPY[userState] || {}` (which ignores the conditions); post-fix it reads
// `loopRevealCopy(userState, unmatched)`. Either way we run whatever is actually there.
const revealCopyExpr = (() => {
  const m = PAIRED_VIEW.match(/\n\s*const copy = ([^;]+);/);
  assert.ok(m, "PairedDeltaView must assign the reveal copy to `copy`");
  return m[1].trim();
})();

// eslint-disable-next-line no-new-func -- the guard's whole point is to run the real call-site expression.
const evalRevealCopy = new Function(
  "loopRevealCopy",
  "LOOP_STATE_COPY",
  "userState",
  "unmatched",
  `return (${revealCopyExpr});`,
);

// The real Inspection Card builder, lifted from source and run with its dependencies
// injected. Pre-fix it takes { state } and re-derives from LOOP_STATE_COPY; post-fix it
// takes the already-resolved { copy }. We pass both keys so either shape executes.
const buildCard = (() => {
  const fn = functionSource("formatInspectionCard");
  // eslint-disable-next-line no-new-func -- run the shipped string builder, not a copy of it.
  const make = new Function(
    "LOOP_STATE_COPY",
    "LOOP_PANEL_FIRST_LABEL",
    "LOOP_PANEL_SECOND_LABEL",
    "LOOP_DIDNT_COME_UP",
    "RECEIPT_BOUNDARY",
    "readerCreditLine",
    `${fn}; return formatInspectionCard;`,
  );
  return make(
    LOOP_STATE_COPY,
    LOOP_PANEL_FIRST_LABEL,
    LOOP_PANEL_SECOND_LABEL,
    LOOP_DIDNT_COME_UP,
    RECEIPT_BOUNDARY,
    () => "Inspected with the Imbas Reader · imbaslabs.com",
  );
})();

// One synthetic run, driven end to end exactly as the component drives it: the capture
// decides `unmatched` through the real predicate, the paired measurement decides the loop
// state through the real suggester, and the render site's own expression resolves the copy.
function render({ capture, gap_estimate, signal_counts = {}, state }) {
  const unmatched = pairConditionsUnmatched(capture);
  const userState = state || suggestLoopState({ gap_estimate, signal_counts });
  const copy = evalRevealCopy(loopRevealCopy, LOOP_STATE_COPY, userState, unmatched);
  return {
    unmatched,
    userState,
    headline: copy.headline,
    tag: copy.tag,
    badge: unmatched ? PAIR_CAPTURE_UI.unmatched_badge : null,
    card: buildCard({ copy, state: userState, firstText: "open span", secondText: "targeted span", smallPrint: "Run r_1 · 2026-07-25" }),
  };
}

// Captures that must all read as unmatched (conditions_matched !== true).
const CAPTURE_EDITED = buildPairCapture({ same_model: "yes", edits: "edited" }); // false
const CAPTURE_CROSS_MODEL = buildPairCapture({ same_model: "no", edits: "none" }); // false
const CAPTURE_UNVERIFIED = buildPairCapture({ same_model: "not_sure" }); // "unverified"
const CAPTURE_MATCHED = buildPairCapture({ same_model: "yes", edits: "none" }); // true

// A gap-revealed measurement: gap >= 1 with surfacing dominant.
const GAP_REVEALED_RUN = { gap_estimate: 2, signal_counts: { Omission: 2, "Framing Drift": 0, Deflection: 0 } };
// A not-clear measurement: gap >= 1 with framing drift dominant.
const NOT_CLEAR_RUN = { gap_estimate: 2, signal_counts: { Omission: 0, "Framing Drift": 3, Deflection: 0 } };
// A still-missing measurement: gap 0, no delta items.
const STILL_MISSING_RUN = { gap_estimate: 0, signal_counts: {} };

// ── The ruling ────────────────────────────────────────────────────────────────

test("1) unmatched GAP_REVEALED run renders the approved descriptive headline and no construct tag", () => {
  const r = render({ capture: CAPTURE_EDITED, ...GAP_REVEALED_RUN });
  assert.equal(r.userState, LOOP_STATE_GAP_REVEALED, "the gap reading itself is unchanged by the conditions");
  assert.equal(r.unmatched, true);
  assert.equal(r.headline, LOOP_UNMATCHED_HEADLINE);
  assert.equal(r.headline, "The targeted answer included information the open answer did not.");
  assert.ok(!r.tag, `no construct tag may render on an unmatched run; got: ${r.tag}`);
  assert.ok(
    !r.headline.includes("Volunteer Gap") && !/volunteer/i.test(r.headline),
    "the unmatched headline must not assert volunteering behavior",
  );
});

test("2) the literal \"unverified\" state is treated as unmatched", () => {
  assert.equal(CAPTURE_UNVERIFIED.conditions_matched, "unverified", "the third state is a string, not a boolean");
  const r = render({ capture: CAPTURE_UNVERIFIED, ...GAP_REVEALED_RUN });
  assert.equal(r.unmatched, true, "unverified is not matched");
  assert.equal(r.headline, LOOP_UNMATCHED_HEADLINE);
  assert.ok(!r.tag, "an unverified run may not name the construct");
});

test("3) a missing or absent capture is treated as unmatched (the conservative default holds)", () => {
  for (const capture of [undefined, null, {}, { conditions_matched: undefined }]) {
    const r = render({ capture, ...GAP_REVEALED_RUN });
    assert.equal(r.unmatched, true, `capture ${JSON.stringify(capture)} must read as unmatched`);
    assert.equal(r.headline, LOOP_UNMATCHED_HEADLINE, `capture ${JSON.stringify(capture)} must not assert the construct`);
    assert.ok(!r.tag, `capture ${JSON.stringify(capture)} must render no construct tag`);
  }
  // False wins: a cross-model pair and a disclosed edit are both hard false, never unverified.
  assert.equal(CAPTURE_CROSS_MODEL.conditions_matched, false);
  assert.equal(CAPTURE_EDITED.conditions_matched, false);
});

test("4) a matched run renders the existing headline and tag, unchanged", () => {
  const r = render({ capture: CAPTURE_MATCHED, ...GAP_REVEALED_RUN });
  assert.equal(r.unmatched, false);
  assert.equal(r.headline, "It answers when asked. It just didn't volunteer.");
  assert.equal(r.headline, LOOP_STATE_COPY[LOOP_STATE_GAP_REVEALED].headline);
  assert.equal(r.tag, CONSTRUCT_TAG);
  assert.equal(r.tag, "That's the Volunteer Gap — you just watched it happen in your own chat.");
});

test("5) every construct-asserting state is gated, not only GAP_REVEALED", () => {
  assert.deepEqual(
    [...LOOP_CONSTRUCT_STATES].sort(),
    [LOOP_STATE_GAP_REVEALED, LOOP_STATE_NOT_CLEAR].sort(),
    "GAP_REVEALED names the construct; NOT_CLEAR's \"the gap isn't clean\" presupposes one",
  );
  const notClear = render({ capture: CAPTURE_CROSS_MODEL, ...NOT_CLEAR_RUN });
  assert.equal(notClear.userState, LOOP_STATE_NOT_CLEAR);
  assert.equal(notClear.headline, LOOP_UNMATCHED_HEADLINE, "NOT_CLEAR must not presuppose a gap under unmatched conditions");
  assert.ok(!notClear.headline.includes("gap"), "the replacement headline names no gap");
  // Matched, it keeps its own copy.
  const matched = render({ capture: CAPTURE_MATCHED, ...NOT_CLEAR_RUN });
  assert.equal(matched.headline, LOOP_STATE_COPY[LOOP_STATE_NOT_CLEAR].headline);
});

test("6) unmatched STILL_MISSING keeps its own headline and never contradicts the \"No material gap\" body", () => {
  // STILL_MISSING fires only at gap_estimate 0, where the paired analysis returns no delta
  // items and the panel body reads "No material gap. The direct question surfaced nothing
  // decision-relevant the first answer left out." Substituting the approved headline here
  // would assert a difference that run did not find — the same headline-contra-body defect
  // this gate removes. It is excluded because it asserts no gap, NOT because it is exempt.
  const r = render({ capture: CAPTURE_UNVERIFIED, ...STILL_MISSING_RUN });
  assert.equal(r.userState, LOOP_STATE_STILL_MISSING);
  assert.equal(r.unmatched, true);
  assert.equal(r.headline, "You asked directly. It still didn't surface.");
  assert.notEqual(r.headline, LOOP_UNMATCHED_HEADLINE, "must not claim a difference on a zero-delta run");
  assert.ok(!r.tag, "STILL_MISSING carries no construct tag in any state");
  assert.ok(
    !r.headline.includes("Volunteer Gap") && !/included information/.test(r.headline),
    "the zero-delta headline neither names the construct nor asserts an addition",
  );
  // The body line this headline sits above, verbatim from the component.
  const BODY = "No material gap. The direct question surfaced nothing decision-relevant the first answer left out.";
  assert.ok(SRC.includes(BODY), "the zero-delta body line must still exist in the component");
  assert.ok(!SRC.includes(`{LOOP_UNMATCHED_HEADLINE}`), "the replacement headline is applied through loopRevealCopy, never inlined");
});

test("7) the copied Inspection Card matches the screen: descriptive headline, no construct tag", () => {
  const unmatched = render({ capture: CAPTURE_EDITED, ...GAP_REVEALED_RUN });
  assert.ok(
    unmatched.card.includes(LOOP_UNMATCHED_HEADLINE),
    `the card must carry the descriptive headline; got:\n${unmatched.card}`,
  );
  // Assert the ABSENCE explicitly — this artifact leaves the page without the badge or
  // warning attached, so a regression here is invisible in the UI.
  assert.ok(
    !unmatched.card.includes(CONSTRUCT_TAG),
    `the copied card must not carry the construct tag on an unmatched run; got:\n${unmatched.card}`,
  );
  assert.ok(!unmatched.card.includes("Volunteer Gap"), "no construct name may travel in the unmatched artifact");
  assert.ok(!unmatched.card.includes("didn't volunteer"), "no volunteering claim may travel in the unmatched artifact");
  assert.ok(unmatched.card.includes(RECEIPT_BOUNDARY), "the boundary sentence still ships with the card");

  // Matched, the card is unchanged.
  const matched = render({ capture: CAPTURE_MATCHED, ...GAP_REVEALED_RUN });
  assert.ok(matched.card.includes(CONSTRUCT_TAG), "a matched run's card is unchanged");
  assert.ok(matched.card.includes(LOOP_STATE_COPY[LOOP_STATE_GAP_REVEALED].headline));
});

test("8) the headline and the badge cannot disagree: both derive from one determination", () => {
  // Exhaustive over every capture shape x every loop state. Whenever the badge fires, no
  // construct claim may render; whenever it does not, the state's own copy must be intact.
  const captures = [
    CAPTURE_MATCHED,
    CAPTURE_EDITED,
    CAPTURE_CROSS_MODEL,
    CAPTURE_UNVERIFIED,
    { conditions_matched: true },
    { conditions_matched: false },
    { conditions_matched: "unverified" },
    {},
    null,
    undefined,
  ];
  for (const capture of captures) {
    for (const state of LOOP_STATES) {
      const r = render({ capture, state, ...GAP_REVEALED_RUN });
      const badgeShown = r.badge !== null;
      assert.equal(badgeShown, r.unmatched, "the badge tracks the determination");
      if (badgeShown) {
        assert.ok(!r.tag, `state ${state}: the tag must not survive the badge`);
        assert.ok(!String(r.headline).includes("Volunteer Gap"), `state ${state}: headline must not name the construct beside the badge`);
        assert.ok(!/didn't volunteer/.test(String(r.headline)), `state ${state}: headline must not assert volunteering beside the badge`);
        assert.ok(!r.card.includes("Volunteer Gap"), `state ${state}: the card must not name the construct beside the badge`);
      } else {
        assert.equal(r.headline, LOOP_STATE_COPY[state].headline, `state ${state}: matched copy is untouched`);
        assert.equal(r.tag, LOOP_STATE_COPY[state].tag, `state ${state}: matched tag is untouched`);
      }
    }
  }
});

test("9) the render site is wired to the one determination, and suggestLoopState stays orthogonal", () => {
  // The badge/warning and the reveal copy must read the SAME variable. A second derivation
  // of conditions_matched anywhere in the view is how the two drifted apart originally.
  assert.match(
    PAIRED_VIEW,
    /const unmatched = pairConditionsUnmatched\(capture\);/,
    "the view determines unmatched exactly once, through the shared predicate",
  );
  assert.equal(
    (PAIRED_VIEW.match(/pairConditionsUnmatched\(/g) || []).length,
    1,
    "exactly one derivation of the conditions state in the paired view",
  );
  assert.ok(
    revealCopyExpr.includes("unmatched"),
    `the reveal copy must consume the determination; got: const copy = ${revealCopyExpr};`,
  );
  assert.match(PAIRED_VIEW, /<h3 className="wb-loop__headline">\{copy\.headline\}<\/h3>/, "the headline renders the resolved copy");
  assert.match(PAIRED_VIEW, /\{copy\.tag \?/, "the tag renders the resolved copy");
  assert.match(PAIRED_VIEW, /\{unmatched \?/, "the badge and warning gate on the same variable");
  assert.match(PAIRED_VIEW, /copy=\{copy\}/, "the Inspection Card receives the resolved copy, never a bare state");

  // suggestLoopState is deliberately NOT conditions-aware: the gap reading and the
  // conditions reading are orthogonal, and folding them together would discard the former.
  assert.equal(
    suggestLoopState({ ...GAP_REVEALED_RUN }),
    LOOP_STATE_GAP_REVEALED,
    "the suggester still reads only the measurement",
  );
  assert.equal(suggestLoopState({ gap_estimate: 2, signal_counts: { Omission: 2 }, conditions_matched: false }), LOOP_STATE_GAP_REVEALED);
  assert.equal(LOOP_STATES.length, 3, "no fourth loop state was introduced");
});
