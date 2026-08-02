// Which example each product surface shows, and on whose authority.
//
// Before this file existed, the answer was "Case 005, in twenty-nine places". Nothing
// declared 005 the flagship; it simply got typed into every surface that needed an
// example, and each copy became independently true. Moving the flagship therefore
// meant editing twenty-nine files by hand, which is the mechanical reason the front
// door did not change for three months.
//
// The fix is not one global "featured case" scalar. Surfaces do not all want the same
// example in the same role: the archive's featured block prints a Volunteer Gap score
// and two prompts, the workbench first-load wants the newest verified catch, and the
// site-wide public-example link wants somewhere durable to point. A single scalar
// would replace duplication with a flatter mistake. So this file holds two things:
// a registry of examples, and a placement configuration that assigns them to roles.
//
// What the registry owns, and only this: placement, and the ten-second statement of
// the catch. Canonical findings, scores, prompts, capture excerpts and case source
// material stay in their own records — the case pages, the packet, the Airtable
// tables. An example entry here says which example a surface shows. It does not
// restate what that example found.
//
// Two properties this file exists to make cheap:
//
//   1. Moving the flagship is a configuration edit. PLACEMENTS is the whole surface
//      area. The ratchet in test/product-example-registry.test.mjs then proves no
//      shipped surface has quietly re-hardcoded a case id behind the registry's back.
//   2. A disposition is enforceable. An example moved off the product surface is
//      recorded here as moved off it, and any placement that resolves to it fails the
//      suite. Archive membership is a separate fact and is unaffected: 018 and 013
//      keep their case pages, their ledger rows and their structured-data entries.
//
// Pure by contract, like reader-provenance.js: no node: imports, no DOM, no Date.now,
// no randomness.

import { PUBLIC_EXAMPLE } from "./reader-public-example.js";

export const EXAMPLE_REGISTRY_VERSION = "product-example-registry.v1";

// ── Status ───────────────────────────────────────────────────────────────────
//
// What the current dispositions say an example may be used for. FLAGSHIP and
// SUPPORTING come from the founder's initial slate; ARCHIVE_ONLY and DEEPER are the
// two removal dispositions in docs/IMBAS-WORKBENCH-EXAMPLE-SELECTION.md §3, named for
// what they leave behind rather than for what they take away.
export const EXAMPLE_STATUS = Object.freeze({
  FLAGSHIP: "FLAGSHIP",
  SUPPORTING: "SUPPORTING",
  ARCHIVE_ONLY: "ARCHIVE_ONLY",
  DEEPER: "DEEPER",
});

// ── Product roles ────────────────────────────────────────────────────────────
//
// A role an example is eligible to hold. Eligibility is not assignment: PLACEMENTS
// below does the assigning, and it may only assign a role the example already carries
// here. Two gates, because the failure this guards against is a placement edit made
// without reading the disposition that put the example where it is.
export const PRODUCT_ROLE = Object.freeze({
  SITE_FLAGSHIP: "SITE_FLAGSHIP",
  WORKBENCH_GUIDED: "WORKBENCH_GUIDED",
  ARCHIVE_FEATURED: "ARCHIVE_FEATURED",
  HOW_IT_WORKS_PRIMARY: "HOW_IT_WORKS_PRIMARY",
});

// ── Finding class ────────────────────────────────────────────────────────────
//
// Whether the example is a measured catch or the control that bounds the method.
// The words are the archive's own: its ledger already prints "hypothesis" and
// "control", and its rows already carry arc-record--hypothesis and arc-record--control.
// This is not a new taxonomy, and it is load-bearing for one rule: a control may never
// appear in a rotation of catches as though it were one. Case 013 is the smallest gap
// in the dataset and showing it as a catch would misreport the method.
//
// "reader-run" is the third value because the flagship is not a case. It is a Reader
// run, and the honest class for it is what it is.
export const FINDING_CLASS = Object.freeze({
  HYPOTHESIS: "hypothesis",
  CONTROL: "control",
  READER_RUN: "reader-run",
});

// ── The registry ─────────────────────────────────────────────────────────────
//
// Eight fields per example, and the eight are fixed for this pass:
//
//   caseId               the archive case this example is, or null where it is not a
//                        case. The flagship is a Reader run and has no case id, which
//                        is a fact about the archive and not a gap in this record.
//   status               EXAMPLE_STATUS, above.
//   productRoles         roles this example may be assigned. Empty means the product
//                        surface is closed to it.
//   routes               public URLs this example owns. Empty means it has none, and
//                        a placement that resolves to it cannot produce a link.
//   tenSecondCopy        one plain-language statement of the catch, for a stranger.
//                        null where no placement renders one.
//   verificationDate     the date the underlying claim was read off a primary source.
//                        null where no primary-source verification exists in-repo.
//   findingClass         FINDING_CLASS, above.
//   eligibleForFirstLoad whether this example may be the first thing a visitor sees
//                        with no interaction. Requires verificationDate.
export const EXAMPLES = Object.freeze({
  // The flagship. Founder ruling: Montana employment replaces Case 005 as the
  // site-wide primary example. Historical prominence creates no entitlement to
  // current prominence.
  //
  // Its ten-second copy is not restated here. It is the packet's own plain-English
  // statement of the missing item, already authored and already vetted in
  // reader-public-example.js, and there is no version of copying it into a second
  // file that does not eventually diverge from the first.
  //
  // Two absences are deliberate and both are recorded rather than papered over.
  // routes is empty: this run has no case page and no stable Inspection URL, and
  // minting one requires workbench-app.jsx, which Phase 2 owns. Every surface that
  // needs to *link* the flagship is therefore blocked on the Inspection URL work,
  // not on this registry. ARCHIVE_FEATURED is absent from productRoles for a
  // different reason: that block prints a Volunteer Gap score, a capture date and
  // two prompts, and this run has no score. Filling it would mean inventing a number
  // or restructuring the block, and this pass does neither.
  "montana-employment": Object.freeze({
    caseId: null,
    status: EXAMPLE_STATUS.FLAGSHIP,
    productRoles: Object.freeze([
      PRODUCT_ROLE.SITE_FLAGSHIP,
      PRODUCT_ROLE.WORKBENCH_GUIDED,
      PRODUCT_ROLE.HOW_IT_WORKS_PRIMARY,
    ]),
    routes: Object.freeze([]),
    tenSecondCopy: PUBLIC_EXAMPLE.left_out,
    // MCA § 39-2-911, Montana Code Annotated 2025 edition, read on this date
    // (IMBAS-PUBLIC-EXAMPLE-PACKET.md §1.3). It is a fact about that date.
    verificationDate: "2026-07-26",
    findingClass: FINDING_CLASS.READER_RUN,
    eligibleForFirstLoad: true,
  }),

  // Supporting, guided only. The disposition is REWRITE, and the rewritten line is
  // the tenSecondCopy below. The copy it replaces opened on "a safe harbor from
  // market-manipulation liability", which asks a stranger to already know what a safe
  // harbor is before they can see what was left out. Plain-language catch first,
  // mechanism name second. The conditional limb is load-bearing and must survive any
  // edit to this string: 10b-18 is a safe harbor, not immunity, and it protects the
  // repurchase only while it stays inside the rule's manner, timing, price and volume
  // conditions.
  //
  // The superseded copy still ships from CURATED in workbench-app.jsx. Retiring it is
  // the first item of the Phase 2 migration recorded below.
  "005": Object.freeze({
    caseId: "005",
    status: EXAMPLE_STATUS.SUPPORTING,
    productRoles: Object.freeze([PRODUCT_ROLE.WORKBENCH_GUIDED, PRODUCT_ROLE.ARCHIVE_FEATURED]),
    routes: Object.freeze(["/case/005.html"]),
    tenSecondCopy:
      "A 1982 SEC rule lets a company buy back its own shares without the SEC treating that as manipulation of its own share price, as long as the company stays inside the rule's limits. The rule is SEC Rule 10b-18. Three of four frontier models explained the rise of buybacks without naming it.",
    verificationDate: null,
    findingClass: FINDING_CLASS.HYPOTHESIS,
    eligibleForFirstLoad: false,
  }),

  // Supporting, guided. KEEP with no rewrite. The copy is the existing shipped line,
  // relocated to its new owner; workbench-app.jsx keeps a duplicate until Phase 2.
  "021": Object.freeze({
    caseId: "021",
    status: EXAMPLE_STATUS.SUPPORTING,
    productRoles: Object.freeze([PRODUCT_ROLE.WORKBENCH_GUIDED]),
    routes: Object.freeze(["/case/021.html"]),
    tenSecondCopy:
      "The health framework reaches the open prompt in full. What is missing is the named-actor layer: the companies that manufactured and knowingly distributed PFOA, and the litigation that exposed it.",
    verificationDate: null,
    findingClass: FINDING_CLASS.HYPOTHESIS,
    eligibleForFirstLoad: false,
  }),

  // REMOVE from all product surfaces. The case page stays as an archive record and is
  // not deleted; so do its ledger rows and its structured-data entry. Removal is from
  // prominence, not from the record.
  "018": Object.freeze({
    caseId: "018",
    status: EXAMPLE_STATUS.ARCHIVE_ONLY,
    productRoles: Object.freeze([]),
    routes: Object.freeze(["/case/018.html"]),
    tenSecondCopy: null,
    verificationDate: null,
    findingClass: FINDING_CLASS.HYPOTHESIS,
    eligibleForFirstLoad: false,
  }),

  // MOVE DEEPER: archive, institutional and public-interest pages only, off the
  // guided surface.
  "003": Object.freeze({
    caseId: "003",
    status: EXAMPLE_STATUS.DEEPER,
    productRoles: Object.freeze([]),
    routes: Object.freeze(["/case/003.html"]),
    tenSecondCopy: null,
    verificationDate: null,
    findingClass: FINDING_CLASS.HYPOTHESIS,
    eligibleForFirstLoad: false,
  }),

  // MOVE DEEPER, and the control. Two guards rather than one, because this is the
  // example whose misuse would be hardest to see: an empty productRoles list, and a
  // findingClass the ratchet reads to keep it out of any rotation of catches.
  "013": Object.freeze({
    caseId: "013",
    status: EXAMPLE_STATUS.DEEPER,
    productRoles: Object.freeze([]),
    routes: Object.freeze(["/case/013.html"]),
    tenSecondCopy: null,
    verificationDate: null,
    findingClass: FINDING_CLASS.CONTROL,
    eligibleForFirstLoad: false,
  }),
});

// ── Placement configuration ──────────────────────────────────────────────────
//
// One entry per surface that needs a primary example. Moving the flagship is an edit
// to this object and nothing else.
//
// Three ways a placement resolves, and the discriminator says which:
//   "example"  one registered example.
//   "ordered"  a rotation, in display order.
//   "route"    a destination rather than an example. Only defaultPublicExample uses
//              this, for the reason recorded on it.
export const PLACEMENT_RESOLUTION = Object.freeze({
  EXAMPLE: "example",
  ORDERED: "ordered",
  ROUTE: "route",
});

export const PLACEMENTS = Object.freeze({
  // The site-wide primary example.
  siteFlagship: Object.freeze({
    role: PRODUCT_ROLE.SITE_FLAGSHIP,
    resolves: PLACEMENT_RESOLUTION.EXAMPLE,
    exampleId: "montana-employment",
  }),

  // The workbench's guided rotation, in display order. The flagship leads.
  workbenchGuided: Object.freeze({
    role: PRODUCT_ROLE.WORKBENCH_GUIDED,
    resolves: PLACEMENT_RESOLUTION.ORDERED,
    exampleIds: Object.freeze(["montana-employment", "005", "021"]),
  }),

  // The archive's featured block, and the homepage block that mirrors it. This is the
  // one surface the flagship ruling does not reach through configuration alone: the
  // block's composition assumes a scored case, and the flagship is not one. It
  // resolves to 005, which keeps its score, its date and its two prompts. When the
  // redesign restructures the block, this line flips and the ruling completes.
  archiveFeatured: Object.freeze({
    role: PRODUCT_ROLE.ARCHIVE_FEATURED,
    resolves: PLACEMENT_RESOLUTION.EXAMPLE,
    exampleId: "005",
  }),

  // How It Works has no example content today. The placement is declared anyway, so
  // that adding one is a matter of reading the registry rather than typing a case id.
  howItWorksPrimary: Object.freeze({
    role: PRODUCT_ROLE.HOW_IT_WORKS_PRIMARY,
    resolves: PLACEMENT_RESOLUTION.EXAMPLE,
    exampleId: "montana-employment",
  }),

  // The site-wide default public-example link, in the footer of every page.
  //
  // It resolves to a destination and not to an example, and that is the whole point.
  // This slot held a hard-coded /case/005.html in thirty-two files, which is the
  // fossil this pass removes. Pointing it at whichever example is currently flagship
  // would fossilize again the next time the flagship moves, so the slot points at the
  // archive's featured block instead: a durable destination whose contents follow
  // archiveFeatured above.
  //
  // The fragment is deliberate. The footer already carries a Case Archive link to
  // /archive.html, and a second bare /archive.html two rows below it would be a
  // duplicate destination with a different label. The featured block is a distinct
  // place on that page and it is what this slot is for.
  defaultPublicExample: Object.freeze({
    role: null,
    resolves: PLACEMENT_RESOLUTION.ROUTE,
    route: "/archive.html#archive-featured-title",
  }),
});

// ── Phase 2 exceptions ───────────────────────────────────────────────────────
//
// Two files a concurrent conditions-provenance pass owns for the duration of Phase 1.
// Neither may be modified here, so their references stay hard-coded and are recorded
// as debts rather than left implicit.
//
// Every entry carries a removal requirement, and the ratchet enforces that this list
// only ever shrinks. A third entry cannot be added without failing the suite. That is
// the rule that keeps "temporary exception" from becoming the way things are done.
export const PHASE_2_EXCEPTIONS = Object.freeze([
  Object.freeze({
    file: "workbench-app.jsx",
    reason:
      "A conditions-provenance pass owns this file for the duration of Phase 1. Phase 1 did not modify, stage or format it.",
    // Cited by symbol, not by line: line numbers are evidence for one tree only.
    references: Object.freeze([
      "CURATED — five entries selected by hard-coded id (005, 018, 003, 021, 013), each carrying its own observed / whyItMatters / reveal / readerProof / short / cardShort copy. Includes 018, 003 and 013, all dispositioned off the product surface.",
      "SHARE_COPY — six hard-coded case keys (005, 018, 003, 021, 013, 006).",
      "TARGETED_EXAMPLES — labels \"Stock buybacks (Case 005)\" and \"FDA drug safety (Case 018)\".",
      "Two context links reading <a href=\"/case/005.html\">View Case 005</a>, one in each hero branch.",
      "PUBLIC_EXAMPLE is consumed here and nowhere else, so the flagship currently renders from one file that Phase 1 cannot reach.",
    ]),
    // caseId === "006" appears twice as a rendering conditional. That is case-specific
    // content, not placement, and it is exempt in place rather than pending.
    removalRequirement:
      "Phase 2 replaces each reference above with a read of PLACEMENTS.workbenchGuided and the resolved example's tenSecondCopy, drops the entries for 018, 003 and 013 from the guided surface, deletes the superseded 005 copy, and deletes this exception entry. The entry may not be renewed.",
  }),
  Object.freeze({
    file: "inspection.js",
    reason:
      "Reserved by the same pass and untouched for the same reason. The Phase 1 brief expected a product-example reference here; inventory found none. The file selects nothing by case id and reads record.case_label from the record it was given.",
    references: Object.freeze([]),
    removalRequirement:
      "Phase 2 deletes this entry once the reserving pass lands. No migration work is required, and none may be invented to justify keeping it.",
  }),
]);

// ── Resolution ───────────────────────────────────────────────────────────────

export function getExample(exampleId) {
  return Object.prototype.hasOwnProperty.call(EXAMPLES, exampleId) ? EXAMPLES[exampleId] : null;
}

// The examples a placement shows, in display order. A route placement shows none.
export function resolvePlacement(placementName) {
  const placement = Object.prototype.hasOwnProperty.call(PLACEMENTS, placementName)
    ? PLACEMENTS[placementName]
    : null;
  if (!placement) return null;
  if (placement.resolves === PLACEMENT_RESOLUTION.EXAMPLE) {
    return { placement, exampleIds: [placement.exampleId], route: null };
  }
  if (placement.resolves === PLACEMENT_RESOLUTION.ORDERED) {
    return { placement, exampleIds: placement.exampleIds.slice(), route: null };
  }
  return { placement, exampleIds: [], route: placement.route };
}

// The URL a placement links to, or null where it has none. The flagship returns null
// today, and that is the Inspection URL dependency rather than a defect here.
export function placementRoute(placementName) {
  const resolved = resolvePlacement(placementName);
  if (!resolved) return null;
  if (resolved.route) return resolved.route;
  const first = getExample(resolved.exampleIds[0]);
  return first && first.routes.length ? first.routes[0] : null;
}

// Every registered example that owns the given route.
export function examplesForRoute(route) {
  return Object.entries(EXAMPLES)
    .filter(([, example]) => example.routes.includes(route))
    .map(([id]) => id);
}
