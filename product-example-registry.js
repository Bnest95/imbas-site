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
//
// READER_GUIDED is named for the Reader, not the Workbench. Founder ruling of
// 2026-08-03: "Workbench" is reserved for a genuine professional workspace and the
// Reader is the primary public product, so the guided rotation carries the Reader's
// name. No alias was left behind, because an alias is how retired vocabulary survives
// its own renaming.
export const PRODUCT_ROLE = Object.freeze({
  SITE_FLAGSHIP: "SITE_FLAGSHIP",
  READER_GUIDED: "READER_GUIDED",
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
//   shortLabel           how a placement link names this example in running text, as
//                        in "Read Case 005". Raw text, not HTML: the materializer
//                        escapes it, so this field never carries an entity.
//   title                the example's subject line, where a placement prints one.
//                        Also raw text.
//
// shortLabel and title are here because a link's visible words are as much a fossil as
// its href. Migrating the destination and leaving "Read Case 005" hard-coded next to it
// would move the flagship to a link that still says the old example's name. Both are
// placement display copy and both are generated. What stays static and case-owned is the
// canonical finding: the archive's scores, prompts, dates and ledger rows are the case's
// record, not this file's, and the materializer does not touch them.
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
      PRODUCT_ROLE.READER_GUIDED,
      PRODUCT_ROLE.HOW_IT_WORKS_PRIMARY,
    ]),
    routes: Object.freeze([]),
    tenSecondCopy: PUBLIC_EXAMPLE.left_out,
    // MCA § 39-2-911, Montana Code Annotated 2025 edition, read on this date
    // (IMBAS-PUBLIC-EXAMPLE-PACKET.md §1.3). It is a fact about that date.
    verificationDate: "2026-07-26",
    findingClass: FINDING_CLASS.READER_RUN,
    eligibleForFirstLoad: true,
    // Both taken from the packet's own vetted context line rather than written here.
    // No placement renders either one today, because the two placements that resolve to
    // this example have no shipped consumer outside the reserved files. They are stated
    // anyway so that the flagship's one blocker is the missing route and nothing else.
    shortLabel: "the Montana example",
    title: "Montana employment law",
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
    productRoles: Object.freeze([PRODUCT_ROLE.READER_GUIDED, PRODUCT_ROLE.ARCHIVE_FEATURED]),
    routes: Object.freeze(["/case/005.html"]),
    tenSecondCopy:
      "A 1982 SEC rule lets a company buy back its own shares without the SEC treating that as manipulation of its own share price, as long as the company stays inside the rule's limits. The rule is SEC Rule 10b-18. Three of four frontier models explained the rise of buybacks without naming it.",
    verificationDate: null,
    findingClass: FINDING_CLASS.HYPOTHESIS,
    eligibleForFirstLoad: false,
    shortLabel: "Case 005",
    title: "Buybacks & SEC Rule 10b-18",
  }),

  // Supporting, guided. KEEP with no rewrite. The copy is the existing shipped line,
  // relocated to its new owner; workbench-app.jsx keeps a duplicate until Phase 2.
  "021": Object.freeze({
    caseId: "021",
    status: EXAMPLE_STATUS.SUPPORTING,
    productRoles: Object.freeze([PRODUCT_ROLE.READER_GUIDED]),
    routes: Object.freeze(["/case/021.html"]),
    tenSecondCopy:
      "The health framework reaches the open prompt in full. What is missing is the named-actor layer: the companies that manufactured and knowingly distributed PFOA, and the litigation that exposed it.",
    verificationDate: null,
    findingClass: FINDING_CLASS.HYPOTHESIS,
    eligibleForFirstLoad: false,
    shortLabel: "Case 021",
    title: "PFAS & DuPont / 3M",
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
    shortLabel: "Case 018",
    title: "FDA review & PDUFA industry fees",
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
    shortLabel: "Case 003",
    title: "Palantir & ICE contracts",
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
    shortLabel: "Case 013",
    title: "OxyContin & the Sacklers",
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

  // The Reader's guided rotation, in display order. The flagship leads.
  readerGuided: Object.freeze({
    role: PRODUCT_ROLE.READER_GUIDED,
    resolves: PLACEMENT_RESOLUTION.ORDERED,
    exampleIds: Object.freeze(["montana-employment", "005", "021"]),
  }),

  // The archive's featured block, and the homepage block that mirrors it. This is the
  // one surface the flagship ruling does not reach through configuration alone: the
  // block's composition assumes a scored case, and the flagship is not one. It
  // resolves to 005, which keeps its score, its date and its two prompts. When the
  // redesign restructures the block, this line flips and the ruling completes.
  //
  // Two independent gates stand in the way of flipping it today, and each was run
  // against the shipped materializer rather than reasoned about. Grant Montana the role
  // and the second still fires:
  //   1. montana-employment does not carry ARCHIVE_FEATURED, for the reason recorded on
  //      the example itself — the block prints a Volunteer Gap score and this run has
  //      none. All five regions fail generation with "does not carry role
  //      ARCHIVE_FEATURED".
  //   2. Every one of those five regions declares `needs: ["route", …]`, and Montana's
  //      routes list is empty. All five then fail with "needs route … does not supply
  //      it". The regions are archiveFeaturedReadLink, archiveFeaturedCtaLink,
  //      homeFeaturedReadLink, workbenchNoscriptCaseLink and methodologyRubricLink,
  //      across archive.html, index.html, reader.html and methodology.html.
  // Neither gate is discharged by a rendering path. The first needs the block to stop
  // printing a score; the second needs the Inspection URL, which is a published record
  // and not a string anyone may write here.
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
  // The fragment is an adopted route decision, not an accident of implementation. The
  // footer already carries a Case Archive link to /archive.html, and a second bare
  // /archive.html two rows below it would be a duplicate destination under a different
  // label. The featured block is a distinct place on that page, it is what this slot is
  // for, and it follows archiveFeatured above rather than naming a case here.
  defaultPublicExample: Object.freeze({
    role: null,
    resolves: PLACEMENT_RESOLUTION.ROUTE,
    route: "/archive.html#archive-featured-title",
    // The visible words. Owned here for the same reason the route is: a label naming a
    // case would re-fossilize the slot the moment the featured case changed.
    label: "Featured case",
  }),
});

// ── Phase 2 exceptions ───────────────────────────────────────────────────────
//
// Empty, and the export stays so that emptiness is a thing a test can assert rather than
// a fact about a file nobody looks at.
//
// Phase 1 recorded two files a concurrent conditions-provenance pass owned, whose
// references stayed hard-coded and were written down as debts rather than left implicit.
// Both are discharged. inspection.js came out on the terms its own entry set: the brief
// expected a product-example reference in it, inventory found none, and the entry said
// no migration work was required and none could be invented to justify keeping it.
// workbench-app.jsx came out when CURATED stopped being a list and became a read of
// PLACEMENTS.readerGuided.
//
// Every entry carried a removal requirement, and the ratchet enforces that this list
// only ever shrinks. A new entry cannot be added without failing the suite. That is
// the rule that keeps "temporary exception" from becoming the way things are done.
export const PHASE_2_EXCEPTIONS = Object.freeze([]);

// ── Case-owned content, exempt by right ──────────────────────────────────────
//
// An exemption is not a small exception. An exception is a debt with a discharge
// condition attached; an exemption is a standing right, and the two are listed apart so
// that nothing drifts from the first list into the second by being ignored long enough.
//
// The registry governs which examples a product surface shows. It does not govern what a
// case says about itself. The constants below key their copy by case id because the copy
// is about that case, which is the same reason a case page, an archive record, a fixture
// and a citation are all exempt. No exception is required for them and none may be
// written. The ratchet reads this list: any case id appearing in a shipped consumer
// outside a symbol named here is an unclassified reference and fails the suite.
export const EXEMPT_CASE_CONTENT = Object.freeze([
  Object.freeze({
    file: "workbench-app.jsx",
    symbol: "GUIDED_CASE_COPY",
    reason:
      "The words the guided rotation renders, keyed by case id because each entry is one case's copy. It selects nothing: CURATED is built from PLACEMENTS.readerGuided and reads this for the ids that placement names. A key here with no placement renders nothing; a placement with no key throws.",
  }),
  Object.freeze({
    file: "workbench-app.jsx",
    symbol: "SHARE_COPY",
    reason:
      "Per-case share text: the key anchor a term check looks for and what that anchor signifies. Keyed by case id because each entry describes one case's finding. It selects nothing — the caller passes in whichever case the rotation already resolved.",
  }),
  Object.freeze({
    file: "workbench-app.jsx",
    symbol: "buildShareResultText",
    reason:
      "Carries one caseId === \"006\" branch, because Case 006 is the single case where all four tested models left the anchor out and the measured sentence has to say four rather than three. That is a per-case fact, not a placement.",
  }),
  Object.freeze({
    file: "workbench-app.jsx",
    symbol: "AnchorResult",
    reason:
      "Carries the same caseId === \"006\" branch as a rendering conditional, for the same per-case reason.",
  }),
]);

// ── Resolution ─────────────────────────────────────────────────────────────────────────
//
// One implementation, reached two ways. The bare exports below read the shipped tables
// and are what every consumer calls. makeRegistry() takes substitute tables and returns
// the same functions over them, which is what lets a test prove that changing the
// configuration changes the generated pages: the test swaps a placement, regenerates, and
// reads the result out of the same resolver production uses. Two copies of this logic
// would let the proof pass while the real path stayed broken.

function getIn(examples, exampleId) {
  return Object.prototype.hasOwnProperty.call(examples, exampleId) ? examples[exampleId] : null;
}

// The examples a placement shows, in display order. A route placement shows none.
function resolveIn(placements, placementName) {
  const placement = Object.prototype.hasOwnProperty.call(placements, placementName)
    ? placements[placementName]
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

// The visible words a placement owns directly, rather than through its example. Only
// defaultPublicExample has any: it points at a destination, so no example supplies them.
function labelIn(placements, placementName) {
  const placement = Object.prototype.hasOwnProperty.call(placements, placementName)
    ? placements[placementName]
    : null;
  return placement && typeof placement.label === "string" ? placement.label : null;
}

// The URL a placement links to, or null where it has none. The flagship returns null
// today, and that is the Inspection URL dependency rather than a defect here.
function routeIn(examples, placements, placementName) {
  const resolved = resolveIn(placements, placementName);
  if (!resolved) return null;
  if (resolved.route) return resolved.route;
  const first = getIn(examples, resolved.exampleIds[0]);
  return first && first.routes.length ? first.routes[0] : null;
}

// Why a placement cannot be rendered as a link today, or null where it can be.
//
// This is the Montana Inspection URL dependency expressed as a function rather than as a
// note. Two placements resolve to the flagship, the flagship has no public URL, and so
// neither can produce a link no matter how the markup is written. Saying so here means a
// test can assert the exact set, and that set shrinks to nothing on the day the URL
// lands — which is how the lane finds out it is done.
function blockerIn(examples, placements, placementName) {
  const resolved = resolveIn(placements, placementName);
  if (!resolved) return "no such placement";
  if (resolved.route) return null;
  const firstId = resolved.exampleIds[0];
  const first = getIn(examples, firstId);
  if (!first) return `resolves to unregistered example "${firstId}"`;
  if (!first.routes.length) return `resolves to "${firstId}", which has no public URL`;
  return null;
}

// ── Render blockers ──────────────────────────────────────────────────────────
//
// A placement can be ruled and still not render, and those are different failures. A
// link blocker above says the destination does not exist yet. A render blocker here says
// the consumer cannot seat the record it was handed, because the two are different kinds
// of record.
//
// Empty, and the export stays for the same reason PHASE_2_EXCEPTIONS does: emptiness is
// then a thing a test asserts rather than a fact about a file nobody looks at.
//
// It held one entry. The guided-case consumer was built around a measured case — it read
// a category to print result provenance, a detect and keyDetect list to run the term
// check, and a numbered case id to label the card — and Montana is a public-example
// packet with none of those fields, because measuring it would have produced them and
// nobody measured it. Its entry named two ways out and barred a third:
//
//   "A shared presentation model both record types satisfy, or a dedicated
//    public-example rendering path. Either one discharges this entry, and the entry is
//    then deleted rather than narrowed. Adding measured-case fields to Montana does not
//    discharge it."
//
// reader-guided-record.js is the first of the two. It projects both record types onto
// one field set, so the consumer reads a card label rather than composing one out of a
// case id and a category, and reads a dated line that says what its own date is a fact
// about. The entry is deleted rather than narrowed, and Montana leads its own rotation.
//
// The barred third way stays barred, and by the test that always held it: "the flagship
// carries no synthesized measurement fields" in test/product-example-registry.test.mjs
// fails the moment category, detect, keyDetect, gap or observedDate is typed onto this
// record. Deleting a blocker does not retire the reason it existed.
export const RENDER_BLOCKERS = Object.freeze({});

function renderBlockerIn(blockers, exampleId) {
  return Object.prototype.hasOwnProperty.call(blockers, exampleId) ? blockers[exampleId] : null;
}

// The examples a placement resolves to that a consumer can render today, in display
// order. A consumer reads this rather than the raw resolution, so a blocked example is
// held out at one place instead of at every call site — and so the rotation grows by
// itself on the day the blocker is deleted.
function renderableIn(blockers, placements, placementName) {
  const resolved = resolveIn(placements, placementName);
  return resolved ? resolved.exampleIds.filter((id) => !renderBlockerIn(blockers, id)) : [];
}

// A registry over the given tables. Defaults to the shipped ones. Blockers are a table
// here for the same reason placements are: a test can hand over an empty one and prove
// the rotation the blocker is currently shortening, which is how the lane knows the hold
// is a hold and not a quiet removal.
export function makeRegistry({
  examples = EXAMPLES,
  placements = PLACEMENTS,
  blockers = RENDER_BLOCKERS,
} = {}) {
  return {
    EXAMPLES: examples,
    PLACEMENTS: placements,
    getExample: (id) => getIn(examples, id),
    resolvePlacement: (name) => resolveIn(placements, name),
    placementLabel: (name) => labelIn(placements, name),
    placementRoute: (name) => routeIn(examples, placements, name),
    placementLinkBlocker: (name) => blockerIn(examples, placements, name),
    renderBlocker: (id) => renderBlockerIn(blockers, id),
    renderableExamples: (name) => renderableIn(blockers, placements, name),
    examplesForRoute: (route) =>
      Object.entries(examples)
        .filter(([, example]) => example.routes.includes(route))
        .map(([id]) => id),
  };
}

const SHIPPED = makeRegistry();

export const getExample = SHIPPED.getExample;
export const resolvePlacement = SHIPPED.resolvePlacement;
export const placementLabel = SHIPPED.placementLabel;
export const placementRoute = SHIPPED.placementRoute;
export const placementLinkBlocker = SHIPPED.placementLinkBlocker;
export const renderBlocker = SHIPPED.renderBlocker;
export const renderableExamples = SHIPPED.renderableExamples;
export const examplesForRoute = SHIPPED.examplesForRoute;
