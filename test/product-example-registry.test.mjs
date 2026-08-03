// The ratchet. It is the point of the registry pass.
//
// A registry that only the honest consult is a comment. What makes flagship selection
// a configuration change rather than a convention is this file: it reads every shipped
// surface, finds every product-example reference, and fails the suite on any that
// selects, features, routes, labels or links an example outside
// product-example-registry.js.
//
// What it deliberately does not police. The registry owns placement and the
// ten-second statement of the catch, and nothing else. Case pages, archive ledger
// rows, structured-data membership entries, findings prose that cites a case by
// number, fixtures and other tests are case-owned records, and they stay where they
// are. Case 021's page cites held records 002 and 007, which are not registered and
// never will be while they are unpublished; a rule that failed on that would be
// policing scholarship, not placement.
//
// The line between the two is drawn in the markup and it is invisible to a reader.
// Every /case/NNN.html link in a shipped page body sits inside an element carrying
// one of two attributes:
//
//   data-example-placement="<name>"   a product placement. The linked case must be
//                                     the one PLACEMENTS resolves that name to.
//   data-case-record                  a case-owned record or cross-reference. Exempt
//                                     from placement rules, and unaffected by a
//                                     disposition: moving a case off the product
//                                     surface never removes its archive record.
//
// A link with neither is the failure this file exists to catch. It is what all
// thirty-two footers looked like before this pass.
//
// Run: node --test test/product-example-registry.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
  EXAMPLE_REGISTRY_VERSION,
  EXAMPLE_STATUS,
  PRODUCT_ROLE,
  FINDING_CLASS,
  EXAMPLES,
  PLACEMENTS,
  PLACEMENT_RESOLUTION,
  PHASE_2_EXCEPTIONS,
  getExample,
  resolvePlacement,
  placementRoute,
  placementLinkBlocker,
  makeRegistry,
} from "../product-example-registry.js";
import {
  REGIONS,
  PlacementError,
  materializeSource,
  materializePlacements,
  regionContext,
} from "../scripts/materialize-placements.mjs";
import { lintUserFacingStrings } from "../reader-check-vocab.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const shippedHtml = () =>
  execFileSync("git", ["ls-files", "*.html"], { cwd: ROOT, encoding: "utf8" })
    .trim()
    .split("\n")
    .filter(Boolean);

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");

// ── Reading the markup ───────────────────────────────────────────────────────

// The span of the element whose opening tag starts at `from`. Depth-counted on the
// tag name, so a nested <p data-case-record> inside <article data-example-placement>
// closes before the article does and the innermost annotation wins.
function elementSpan(src, from, tag) {
  const openEnd = src.indexOf(">", from);
  if (openEnd === -1) return null;
  if (src[openEnd - 1] === "/") return { start: from, end: openEnd + 1 };
  const re = new RegExp(`<${tag}(?=[\\s>/])|</${tag}(?=[\\s>])`, "g");
  re.lastIndex = openEnd + 1;
  let depth = 1;
  let m;
  while ((m = re.exec(src))) {
    depth += m[0][1] === "/" ? -1 : 1;
    if (depth === 0) return { start: from, end: re.lastIndex };
  }
  return null;
}

// Every annotated region in a file, innermost-resolvable.
function annotatedRegions(src) {
  const regions = [];
  const re = /<([a-zA-Z][\w-]*)((?:"[^"]*"|'[^']*'|[^>"'])*?\bdata-(example-placement|case-record)\b(?:"[^"]*"|'[^']*'|[^>"'])*)>/g;
  let m;
  while ((m = re.exec(src))) {
    const span = elementSpan(src, m.index, m[1]);
    if (!span) continue;
    const placement = /\bdata-example-placement="([^"]+)"/.exec(m[2]);
    regions.push({ ...span, kind: placement ? "placement" : "record", placement: placement ? placement[1] : null });
  }
  return regions;
}

// Regions a product-example rule has no business reading: the document head, and
// structured-data blocks, which are membership records and carry no markup to
// annotate.
function exemptRegions(src) {
  const spans = [];
  const head = /<head[\s>]/.exec(src);
  if (head) {
    const span = elementSpan(src, head.index, "head");
    if (span) spans.push(span);
  }
  const ld = /<script[^>]*type="application\/ld\+json"[^>]*>/g;
  let m;
  while ((m = ld.exec(src))) {
    const span = elementSpan(src, m.index, "script");
    if (span) spans.push(span);
  }
  return spans;
}

const CASE_HREF = /href="(\/case\/(\d{3})\.html)"/g;

// Every governed case link in a file, with the annotation that classifies it.
function caseLinks(rel) {
  const src = read(rel);
  const exempt = exemptRegions(src);
  const regions = annotatedRegions(src);
  const found = [];
  let m;
  CASE_HREF.lastIndex = 0;
  while ((m = CASE_HREF.exec(src))) {
    const at = m.index;
    if (exempt.some((s) => at >= s.start && at < s.end)) continue;
    const containing = regions
      .filter((r) => at >= r.start && at < r.end)
      .sort((a, b) => b.start - a.start)[0];
    found.push({ file: rel, at, href: m[1], caseId: m[2], region: containing || null });
  }
  return found;
}

const footerOf = (src) => {
  const m = /<footer[^>]*class="[^"]*site-footer[^"]*"[^>]*>/.exec(src);
  if (!m) return null;
  const span = elementSpan(src, m.index, "footer");
  return span ? src.slice(span.start, span.end) : null;
};

// ── The registry is well formed ──────────────────────────────────────────────

const REQUIRED_FIELDS = [
  "caseId",
  "status",
  "productRoles",
  "routes",
  "tenSecondCopy",
  "verificationDate",
  "findingClass",
  "eligibleForFirstLoad",
  "shortLabel",
  "title",
];

test("the registry is versioned and frozen", () => {
  assert.match(EXAMPLE_REGISTRY_VERSION, /^product-example-registry\.v\d+$/);
  assert.ok(Object.isFrozen(EXAMPLES));
  assert.ok(Object.isFrozen(PLACEMENTS));
  for (const [id, example] of Object.entries(EXAMPLES)) {
    assert.ok(Object.isFrozen(example), `${id} is not frozen`);
  }
});

test("every example carries exactly the registry's fields, and no extra", () => {
  for (const [id, example] of Object.entries(EXAMPLES)) {
    assert.deepEqual(
      Object.keys(example).slice().sort(),
      REQUIRED_FIELDS.slice().sort(),
      `${id} does not carry exactly the ${REQUIRED_FIELDS.length} fields`,
    );
  }
});

test("every field holds a value its own vocabulary allows", () => {
  const statuses = new Set(Object.values(EXAMPLE_STATUS));
  const roles = new Set(Object.values(PRODUCT_ROLE));
  const classes = new Set(Object.values(FINDING_CLASS));
  for (const [id, e] of Object.entries(EXAMPLES)) {
    assert.ok(e.caseId === null || /^\d{3}$/.test(e.caseId), `${id} has a malformed caseId`);
    assert.ok(statuses.has(e.status), `${id} has an unknown status`);
    assert.ok(classes.has(e.findingClass), `${id} has an unknown findingClass`);
    assert.equal(typeof e.eligibleForFirstLoad, "boolean", `${id} eligibleForFirstLoad is not a boolean`);
    assert.ok(Array.isArray(e.productRoles), `${id} productRoles is not a list`);
    for (const role of e.productRoles) assert.ok(roles.has(role), `${id} claims unknown role ${role}`);
    assert.ok(Array.isArray(e.routes), `${id} routes is not a list`);
    for (const route of e.routes) assert.match(route, /^\//, `${id} route ${route} is not site-absolute`);
    assert.ok(
      e.tenSecondCopy === null || (typeof e.tenSecondCopy === "string" && e.tenSecondCopy.length > 0),
      `${id} tenSecondCopy is neither absent nor written`,
    );
    assert.ok(
      e.verificationDate === null || /^\d{4}-\d{2}-\d{2}$/.test(e.verificationDate),
      `${id} verificationDate is neither absent nor a date`,
    );
    // Display copy is raw text. An entity here would ship double-escaped, because the
    // materializer escapes what it is given.
    for (const field of ["shortLabel", "title"]) {
      assert.equal(typeof e[field], "string", `${id} ${field} is not written`);
      assert.ok(e[field].length > 0, `${id} ${field} is empty`);
      assert.ok(!/&[a-z]+;|&#\d+;/i.test(e[field]), `${id} ${field} carries an HTML entity`);
    }
  }
});

test("a route belongs to at most one example", () => {
  const seen = new Map();
  for (const [id, e] of Object.entries(EXAMPLES)) {
    for (const route of e.routes) {
      assert.ok(!seen.has(route), `${route} is claimed by both ${seen.get(route)} and ${id}`);
      seen.set(route, id);
    }
  }
});

test("the ten-second copy on the product surface passes the AT-5 vocabulary lint", () => {
  const copy = Object.fromEntries(
    Object.entries(EXAMPLES)
      .filter(([, e]) => e.tenSecondCopy)
      .map(([id, e]) => [id, e.tenSecondCopy]),
  );
  assert.deepEqual(lintUserFacingStrings(copy), []);
});

// The rewrite disposition, held to its own standard. The line it replaced opened on
// "a safe harbor from market-manipulation liability", which asks a stranger to know
// what a safe harbor is before they can see what was left out.
test("Case 005's ten-second copy states the catch before it names the mechanism", () => {
  const copy = EXAMPLES["005"].tenSecondCopy;
  assert.ok(!/safe harbor/i.test(copy), "the superseded technical framing is back");
  const mechanismAt = copy.indexOf("Rule 10b-18");
  assert.ok(mechanismAt > 0, "the mechanism is never named");
  const firstSentenceEnd = copy.indexOf(". ");
  assert.ok(mechanismAt > firstSentenceEnd, "the mechanism is named before the catch is stated");
});

// ── Placements resolve, and only to what the dispositions allow ──────────────

test("every placement resolves to a registered example", () => {
  for (const [name, placement] of Object.entries(PLACEMENTS)) {
    const resolved = resolvePlacement(name);
    assert.ok(resolved, `${name} does not resolve`);
    if (placement.resolves === PLACEMENT_RESOLUTION.ROUTE) {
      assert.match(placement.route, /^\//, `${name} route is not site-absolute`);
      assert.equal(resolved.exampleIds.length, 0);
      continue;
    }
    assert.ok(resolved.exampleIds.length > 0, `${name} resolves to nothing`);
    for (const id of resolved.exampleIds) {
      assert.ok(getExample(id), `${name} resolves to unregistered example ${id}`);
    }
  }
});

test("a placement may only assign a role the example is eligible to hold", () => {
  for (const [name, placement] of Object.entries(PLACEMENTS)) {
    if (!placement.role) continue;
    for (const id of resolvePlacement(name).exampleIds) {
      assert.ok(
        getExample(id).productRoles.includes(placement.role),
        `${name} assigns ${placement.role} to ${id}, which is not eligible for it`,
      );
    }
  }
});

test("exactly one example carries SITE_FLAGSHIP", () => {
  const flagships = Object.entries(EXAMPLES).filter(([, e]) =>
    e.productRoles.includes(PRODUCT_ROLE.SITE_FLAGSHIP),
  );
  assert.equal(flagships.length, 1, `SITE_FLAGSHIP is carried by ${flagships.length} examples`);
  assert.equal(flagships[0][1].status, EXAMPLE_STATUS.FLAGSHIP);
  assert.equal(PLACEMENTS.siteFlagship.exampleId, flagships[0][0]);
});

test("a first-load example has a verification date", () => {
  for (const [id, e] of Object.entries(EXAMPLES)) {
    if (!e.eligibleForFirstLoad) continue;
    assert.ok(e.verificationDate, `${id} is a first-load example with no verificationDate`);
  }
});

test("an example dispositioned off the product surface holds no placement", () => {
  const placed = new Set();
  for (const name of Object.keys(PLACEMENTS)) {
    for (const id of resolvePlacement(name).exampleIds) placed.add(id);
  }
  for (const [id, e] of Object.entries(EXAMPLES)) {
    if (e.productRoles.length > 0) continue;
    assert.ok(
      !placed.has(id),
      `${id} is dispositioned ${e.status} and off the product surface, but a placement resolves to it`,
    );
  }
});

// Case 013 is the smallest gap in the dataset. Showing it in a rotation of catches
// would report the control as a finding.
test("a control never appears in a rotation", () => {
  for (const [name, placement] of Object.entries(PLACEMENTS)) {
    if (placement.resolves !== PLACEMENT_RESOLUTION.ORDERED) continue;
    for (const id of placement.exampleIds) {
      assert.notEqual(
        getExample(id).findingClass,
        FINDING_CLASS.CONTROL,
        `${name} rotates ${id}, which is the control`,
      );
    }
  }
});

// ── Shipped surfaces route through the registry ──────────────────────────────

test("every case link in a shipped page body is classified", () => {
  const unclassified = [];
  for (const file of shippedHtml()) {
    for (const link of caseLinks(file)) {
      if (!link.region) unclassified.push(`${file} → ${link.href}`);
    }
  }
  assert.deepEqual(
    unclassified,
    [],
    `hard-coded product-example links outside the registry:\n${unclassified.join("\n")}`,
  );
});

test("a placement's links point at the case that placement resolves to", () => {
  const wrong = [];
  for (const file of shippedHtml()) {
    for (const link of caseLinks(file)) {
      if (!link.region || link.region.kind !== "placement") continue;
      const resolved = resolvePlacement(link.region.placement);
      assert.ok(resolved, `${file} names undeclared placement ${link.region.placement}`);
      const allowed = resolved.exampleIds.map((id) => getExample(id).caseId);
      if (!allowed.includes(link.caseId)) {
        wrong.push(`${file} → ${link.region.placement} links case ${link.caseId}, expected ${allowed.join("/")}`);
      }
    }
  }
  assert.deepEqual(wrong, [], wrong.join("\n"));
});

test("a placement's own copy names no case but the one it resolves to", () => {
  const wrong = [];
  for (const file of shippedHtml()) {
    const src = read(file);
    for (const region of annotatedRegions(src)) {
      if (region.kind !== "placement") continue;
      const resolved = resolvePlacement(region.placement);
      if (!resolved) continue;
      const allowed = new Set(resolved.exampleIds.map((id) => getExample(id).caseId));
      // The placement's own copy, not a case-record cross-reference nested inside it.
      // The archive's featured block wraps a note that cites two other case records,
      // and those citations belong to the note, not to the placement.
      const nested = annotatedRegions(src).filter(
        (r) => r.kind === "record" && r.start > region.start && r.end <= region.end,
      );
      let inner = "";
      let cursor = region.start;
      for (const r of nested.sort((a, b) => a.start - b.start)) {
        inner += src.slice(cursor, r.start);
        cursor = r.end;
      }
      inner += src.slice(cursor, region.end);
      for (const m of inner.matchAll(/\bCase (\d{3})\b/g)) {
        if (!allowed.has(m[1])) wrong.push(`${file} → ${region.placement} names Case ${m[1]}`);
      }
    }
  }
  assert.deepEqual(wrong, [], wrong.join("\n"));
});

test("every shipped footer carries the default public-example slot and no case link", () => {
  const route = PLACEMENTS.defaultPublicExample.route;
  let footers = 0;
  for (const file of shippedHtml()) {
    const footer = footerOf(read(file));
    if (!footer) continue;
    footers += 1;
    const slots = [...footer.matchAll(/<a\s+href="([^"]+)"[^>]*\bdata-example-placement="defaultPublicExample"/g)];
    assert.equal(slots.length, 1, `${file} has ${slots.length} default public-example slots`);
    assert.equal(slots[0][1], route, `${file} footer slot points at ${slots[0][1]}`);
    assert.equal(
      /href="\/case\//.test(footer),
      false,
      `${file} footer still hard-codes a case link`,
    );
  }
  assert.ok(footers >= 32, `only ${footers} shipped footers were found; the fossil was in 32`);
});

test("the route records list every route the registry claims", () => {
  const sitemap = read("sitemap.xml");
  const vercel = read("vercel.json");
  for (const [id, e] of Object.entries(EXAMPLES)) {
    for (const route of e.routes) {
      assert.ok(sitemap.includes(route), `sitemap.xml has no entry for ${id} (${route})`);
      assert.ok(vercel.includes(route), `vercel.json has no redirect target for ${id} (${route})`);
    }
  }
});

test("the archive's featured placement is the only surface that resolves to a scored case", () => {
  // The flagship has no route, so nothing can link it yet. That is the Inspection URL
  // dependency, and this test records it rather than hiding it: when the flagship
  // gains a route, this assertion is the one that says so.
  assert.equal(placementRoute("siteFlagship"), null);
  assert.equal(placementRoute("archiveFeatured"), "/case/005.html");
});

// ── The two Phase 2 exceptions, and no third ─────────────────────────────────

const RESERVED = ["workbench-app.jsx", "inspection.js"];

test("the exception list holds exactly the two reserved files", () => {
  assert.deepEqual(
    PHASE_2_EXCEPTIONS.map((e) => e.file).sort(),
    RESERVED.slice().sort(),
    "a placement exception was added or removed without migrating it",
  );
});

test("every exception carries a removal requirement", () => {
  for (const exception of PHASE_2_EXCEPTIONS) {
    assert.ok(Object.isFrozen(exception), `${exception.file} exception is not frozen`);
    assert.ok(exception.reason.length > 0, `${exception.file} exception states no reason`);
    assert.ok(
      exception.removalRequirement.length > 0,
      `${exception.file} exception states no removal requirement`,
    );
    assert.ok(Array.isArray(exception.references), `${exception.file} exception lists no references`);
  }
});

test("the reserved files are still the only unmigrated product-example consumers", () => {
  // If a reserved file stops hard-coding case ids, its exception is discharged and the
  // entry comes out. If a third file starts, the list above fails first.
  const hardCoded = (rel) => /(["'])0(03|05|13|18|21)\1|href="\/case\/\d{3}\.html"/.test(read(rel));
  assert.equal(hardCoded("workbench-app.jsx"), true, "workbench-app.jsx no longer needs its exception");
  assert.equal(hardCoded("inspection.js"), false, "inspection.js now hard-codes a case id");
});

// ── Materialization ──────────────────────────────────────────────────────────
//
// The half above proves no surface has re-hardcoded a case id. On its own that is only
// consistency enforcement: it fails until someone edits the HTML by hand, which is the
// work the registry exists to abolish. This half proves the other direction — that the
// shipped markup is generated from the registry, so a placement moves by configuration.
//
// Every test here runs the real generator. None of them compares hand-written HTML to a
// hand-written expectation, because two hand-written things agreeing proves nothing about
// what a third would produce.

const MARKED = /<!--imbas:placement ([A-Za-z0-9_]+)-->/g;

test("every shipped placement region is exactly what the registry generates", () => {
  const result = materializePlacements({ write: false });
  assert.deepEqual(
    result.stale,
    [],
    `these pages do not match the registry — run npm run build:placements:\n${result.stale.join("\n")}`,
  );
  assert.ok(result.files.length >= 32, `only ${result.files.length} pages carry a placement region`);
  assert.ok(result.regionCount >= 37, `only ${result.regionCount} placement regions were generated`);
});

test("generating twice produces the same bytes", () => {
  for (const file of materializePlacements({ write: false }).files) {
    const again = materializeSource(file.output);
    assert.equal(again.output, file.output, `${file.path} is not idempotent`);
  }
});

test("every region the markup names is a declared region, and every declared region ships", () => {
  const inMarkup = new Set();
  for (const file of shippedHtml()) {
    for (const m of read(file).matchAll(MARKED)) inMarkup.add(m[1]);
  }
  const declared = new Set(Object.keys(REGIONS));
  for (const id of inMarkup) assert.ok(declared.has(id), `markup names undeclared region "${id}"`);
  for (const id of declared) assert.ok(inMarkup.has(id), `region "${id}" is declared and rendered nowhere`);
});

test("every declared region names a declared placement and renders one line unless it is a block", () => {
  for (const [id, region] of Object.entries(REGIONS)) {
    assert.ok(PLACEMENTS[region.placement], `region "${id}" names undeclared placement "${region.placement}"`);
    const { ctx } = regionContext(id, makeRegistry());
    const out = region.render(ctx);
    if (region.block) assert.ok(Array.isArray(out), `block region "${id}" did not render lines`);
    else assert.ok(!String(out).includes("\n"), `inline region "${id}" rendered more than one line`);
  }
});

// The four hand-edit perturbations, run against the real generator rather than described.
// Each mutates one shipped page in memory the way a person would in an editor, and the
// generator's output must disagree with it.
for (const [what, mutate] of [
  ["a link", (s) => s.replace('href="/case/005.html" class="arc-featured__link"', 'href="/case/018.html" class="arc-featured__link"')],
  ["a label", (s) => s.replace("<span>Read Case 005</span>", "<span>Read Case 018</span>")],
  ["placement-owned copy", (s) => s.replace("Read Case 005 <span class=\"arrow\"", "Read the buybacks case <span class=\"arrow\"")],
]) {
  test(`hand-editing ${what} inside a generated region no longer survives generation`, () => {
    const src = read("archive.html");
    const edited = mutate(src);
    assert.notEqual(edited, src, `the perturbation for ${what} matched nothing`);
    assert.equal(
      materializeSource(edited).output,
      src,
      `a hand edit to ${what} survived generation`,
    );
  });
}

test("hand-editing a footer slot no longer survives generation", () => {
  const src = read("faq.html");
  const edited = src.replace(
    '<a href="/archive.html#archive-featured-title" data-example-placement="defaultPublicExample">Featured case</a>',
    '<a href="/case/005.html" data-example-placement="defaultPublicExample">Case 005</a>',
  );
  assert.notEqual(edited, src, "the footer perturbation matched nothing");
  assert.equal(materializeSource(edited).output, src, "a re-fossilized footer survived generation");
});

// A real move of the archive's featured placement, as a person would have to make it.
// Two edits, not one, and the second is not optional: an example may only be given a
// placement it is eligible for, so moving the role means granting it. Writing only the
// PLACEMENTS half throws, which is the two-gate design working — see the eligibility
// test below, which asserts exactly that failure.
const movedTo021 = () =>
  makeRegistry({
    examples: {
      ...EXAMPLES,
      "021": { ...EXAMPLES["021"], productRoles: [...EXAMPLES["021"].productRoles, PRODUCT_ROLE.ARCHIVE_FEATURED] },
    },
    placements: {
      ...PLACEMENTS,
      archiveFeatured: { ...PLACEMENTS.archiveFeatured, exampleId: "021" },
    },
  });

// The claim the whole pass is for: one configuration edit, one command, every consumer.
test("moving a placement in the registry moves every consumer of it, and nothing else", () => {
  const moved = movedTo021();

  const before = materializePlacements({ write: false });
  const after = materializePlacements({ write: false, registry: moved });

  const consumers = [];
  for (const file of after.files) {
    const was = before.files.find((f) => f.path === file.path);
    for (const [i, region] of file.regions.entries()) {
      if (region.generated === was.regions[i].generated) continue;
      consumers.push(`${file.path}:${region.regionId}`);
      assert.equal(REGIONS[region.regionId].placement, "archiveFeatured");
      assert.match(region.generated, /\/case\/021\.html/, `${file.path} did not follow the move`);
      assert.ok(!/Case 005/.test(region.generated), `${file.path} still names the old example`);
    }
  }

  // Every archiveFeatured region moved. No defaultPublicExample region did: the two are
  // different roles, which is the distinction the footer fossil came from collapsing.
  const expected = Object.entries(REGIONS)
    .filter(([, r]) => r.placement === "archiveFeatured")
    .map(([id]) => id);
  assert.deepEqual(
    [...new Set(consumers.map((c) => c.split(":")[1]))].sort(),
    expected.slice().sort(),
    "a registry move did not reach every consumer of that placement",
  );
  assert.equal(consumers.length, expected.length, `${consumers.length} regions moved, expected ${expected.length}`);

  // And the case-owned content on the same pages is untouched: the archive ledger still
  // lists Case 005, because a ledger row is the archive's record and not a placement.
  const archiveAfter = after.files.find((f) => f.path === "archive.html").output;
  assert.match(archiveAfter, /<span class="arc-record__title">Buybacks &amp; SEC Rule 10b-18<\/span>/);
  assert.match(archiveAfter, /data-case-record>Earlier case records include <a href="\/case\/005\.html">/);
});

test("the generated regions are the only thing a registry change rewrites", () => {
  const moved = movedTo021();
  for (const file of materializePlacements({ write: false, registry: moved }).files) {
    // Substitute each generated region back for what ships. What is left must be the
    // tracked file, byte for byte — proof that generation touched nothing outside a
    // marker pair.
    let restored = file.output;
    for (const region of file.regions) {
      restored = restored.replace(region.generated, region.previous);
    }
    assert.equal(restored, read(file.path), `${file.path} changed outside its placement regions`);
  }
});

test("no placement value is maintained by hand outside a generated region", () => {
  const route = PLACEMENTS.defaultPublicExample.route;
  // The label as a link, not as prose. The archive's featured section is headed
  // "Featured case" and that heading is the page's own words — the slot points at it,
  // which is the opposite of a duplicate to police.
  const labelLink = new RegExp(`<a\\b[^>]*>${PLACEMENTS.defaultPublicExample.label}</a>`);
  for (const file of shippedHtml()) {
    const src = read(file);
    if (!src.includes(route) && !labelLink.test(src)) continue;
    const { regions } = materializeSource(src);
    const generated = regions.map((r) => r.generated).join("\n");
    let outside = src;
    for (const region of regions) outside = outside.replace(region.generated, "");
    assert.ok(!outside.includes(route), `${file} carries the default public-example route outside a region`);
    assert.ok(!labelLink.test(outside), `${file} carries a second default public-example link outside a region`);
    assert.ok(generated.includes(route), `${file} was expected to generate the route`);
  }
});

// ── The generator refuses to invent data ─────────────────────────────────────

test("generation fails on a placement that resolves to an unregistered example", () => {
  const broken = makeRegistry({
    placements: { ...PLACEMENTS, archiveFeatured: { ...PLACEMENTS.archiveFeatured, exampleId: "999" } },
  });
  assert.throws(
    () => materializeSource(read("methodology.html"), { registry: broken }),
    (err) => err instanceof PlacementError && /unregistered example "999"/.test(err.message),
  );
});

test("generation fails on an example that is not eligible for the role", () => {
  const broken = makeRegistry({
    placements: { ...PLACEMENTS, archiveFeatured: { ...PLACEMENTS.archiveFeatured, exampleId: "018" } },
  });
  assert.throws(
    () => materializeSource(read("methodology.html"), { registry: broken }),
    (err) => err instanceof PlacementError && /does not carry role ARCHIVE_FEATURED/.test(err.message),
  );
});

test("generation fails when the registry cannot supply what a region needs", () => {
  const broken = makeRegistry({
    examples: { ...EXAMPLES, "005": { ...EXAMPLES["005"], routes: [] } },
  });
  assert.throws(
    () => materializeSource(read("methodology.html"), { registry: broken }),
    (err) => err instanceof PlacementError && /needs route/.test(err.message),
  );
});

test("generation fails on a marker that names no declared region", () => {
  assert.throws(
    () => materializeSource('<!--imbas:placement notARegion-->x<!--/imbas:placement-->'),
    (err) => err instanceof PlacementError && /unknown placement region "notARegion"/.test(err.message),
  );
});

test("generation fails on a region that is opened and never closed", () => {
  assert.throws(
    () => materializeSource("<!--imbas:placement methodologyRubricLink-->x"),
    (err) => err instanceof PlacementError && /never closed/.test(err.message),
  );
});

// ── What the missing Inspection URL blocks ───────────────────────────────────

// The single most useful assertion in this file for a future lane. The flagship has no
// public URL, so every placement that resolves to it can be configured and not rendered.
// This names that set exactly. When the Inspection URL work lands and Montana gains a
// route, this test fails — which is how that lane learns it is finished, rather than by
// remembering to check.
test("the placements blocked on the flagship's missing Inspection URL are exactly three", () => {
  const blocked = Object.keys(PLACEMENTS).filter((name) => placementLinkBlocker(name) !== null);
  assert.deepEqual(
    blocked.sort(),
    ["howItWorksPrimary", "siteFlagship", "workbenchGuided"],
    "the set of placements blocked on the Montana Inspection URL changed",
  );
  // All three for one reason and the same one: each leads with the flagship, and the
  // flagship has no public URL. workbenchGuided is here because its rotation leads with
  // Montana; its other two entries have routes and are not what blocks it.
  for (const name of blocked) {
    assert.match(placementLinkBlocker(name), /has no public URL/);
    assert.equal(resolvePlacement(name).exampleIds[0], "montana-employment");
  }
  // And no shipped region renders either of them, which is why the blocker is a
  // dependency rather than a broken page.
  const rendered = new Set(Object.values(REGIONS).map((r) => r.placement));
  for (const name of blocked) {
    assert.ok(!rendered.has(name), `${name} has a shipped region but cannot produce a link`);
  }
});
