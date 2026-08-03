// Generate the product-placement markup in the shipped HTML from the registry.
//
// The registry on its own only made hard-coding *detectable*. A placement change still
// meant editing every consumer by hand and then editing until the ratchet stopped
// complaining, which is consistency enforcement wearing the costume of ownership. This
// script is the other half: the registry states which example a surface shows and what
// the link says, and this turns that into the bytes that ship.
//
// The pattern is the one the repository already uses for workbench.bundle.js. A source
// of truth, a deterministic generator, a tracked output, and a check that fails when the
// output is not what the generator would produce. Nothing resolves at runtime: there is
// no fetch, no hydration and no flash, because the HTML that arrives at the browser is
// already final.
//
// Moving a placement is therefore:
//   1. edit PLACEMENTS in product-example-registry.js
//   2. npm run build:placements
//   3. commit the generated diff
//
// ── Regions ─────────────────────────────────────────────────────────────────
//
// Only text between markers is ever rewritten:
//
//   <!--imbas:placement REGION_ID--> ... <!--/imbas:placement-->
//
// Everything outside a marker pair is copied byte for byte. There is no document-wide
// search and replace, so a case id written in an archive ledger row, a citation or a
// case page's own prose cannot be caught by this script even by accident. That is the
// point of bounding it: the registry owns product placement, not every mention of a case.
//
// A region declares which placement it renders. It does not declare which example: that
// is what the registry decides, and hard-coding it here would rebuild the fossil one
// level up.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { makeRegistry } from "../product-example-registry.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(HERE, "..");

const OPEN = /<!--imbas:placement ([A-Za-z0-9_]+)-->/g;
const CLOSE = "<!--/imbas:placement-->";

// Raw registry text into HTML text. The registry stores "Buybacks & SEC Rule 10b-18";
// what ships is the escaped form. Keeping the entity out of the registry means the same
// string can later feed a non-HTML surface without carrying HTML's baggage into it.
const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const ARROW = '<span class="arrow" aria-hidden="true">&rarr;</span>';

// ── The region table ─────────────────────────────────────────────────────────
//
// One entry per marked region. `placement` names what the registry resolves; `render`
// composes the markup around it. The composition here is the composition already on the
// page — this pass materializes what ships, it does not redesign it. `needs` lists the
// registry data the renderer cannot do without, so a missing value fails by name instead
// of rendering "undefined" into a shipped page.
//
// `block: true` means the region spans lines and the renderer returns them unindented;
// the generator applies the indentation of the opening marker. Inline regions return one
// line and keep the markers on it, so no region adds a line to any page.
export const REGIONS = Object.freeze({
  // The site-wide public-example slot, in the footer of every page.
  footerDefaultPublicExample: Object.freeze({
    placement: "defaultPublicExample",
    needs: Object.freeze(["route", "label"]),
    block: false,
    render: ({ placementName, route, label }) =>
      `<a href="${esc(route)}" data-example-placement="${placementName}">${esc(label)}</a>`,
  }),

  // The archive's featured block: the read link at the foot of the block. The block's
  // own contents — question, prompts, score, date — are the case's record and are not
  // generated. Only the link that points at whichever example holds the role is.
  archiveFeaturedReadLink: Object.freeze({
    placement: "archiveFeatured",
    needs: Object.freeze(["route", "shortLabel"]),
    block: true,
    render: ({ route, example }) => [
      `<a href="${esc(route)}" class="arc-featured__link">`,
      `  <span>Read ${esc(example.shortLabel)}</span>`,
      `  ${ARROW}`,
      `</a>`,
    ],
  }),

  // The archive page's secondary call to action.
  archiveFeaturedCtaLink: Object.freeze({
    placement: "archiveFeatured",
    needs: Object.freeze(["route", "shortLabel"]),
    block: false,
    render: ({ placementName, route, example }) =>
      `<a class="hero__secondary" href="${esc(route)}" data-example-placement="${placementName}">` +
      `Read ${esc(example.shortLabel)} ${ARROW}</a>`,
  }),

  // The homepage's mirror of the featured block, same reasoning as above.
  homeFeaturedReadLink: Object.freeze({
    placement: "archiveFeatured",
    needs: Object.freeze(["route", "shortLabel"]),
    block: true,
    render: ({ route, example }) => [
      `<a href="${esc(route)}" class="hp-arc-featured__link">`,
      `  <span>Read ${esc(example.shortLabel)}</span>`,
      `  ${ARROW}`,
      `</a>`,
    ],
  }),

  // The workbench's no-JavaScript fallback list.
  workbenchNoscriptCaseLink: Object.freeze({
    placement: "archiveFeatured",
    needs: Object.freeze(["route", "shortLabel", "title"]),
    block: false,
    render: ({ placementName, route, example }) =>
      `<li data-example-placement="${placementName}">` +
      `<a href="${esc(route)}">${esc(example.shortLabel)} — ${esc(example.title)}</a></li>`,
  }),

  // Methodology's pointer at a worked application of the rubric.
  methodologyRubricLink: Object.freeze({
    placement: "archiveFeatured",
    needs: Object.freeze(["route", "shortLabel"]),
    block: false,
    render: ({ placementName, route, example }) =>
      `<p data-example-placement="${placementName}">` +
      `<a href="${esc(route)}" class="page__cta-link">See the rubric applied in ${esc(example.shortLabel)} ` +
      `${ARROW}</a></p>`,
  }),
});

// ── Resolution ───────────────────────────────────────────────────────────────

export class PlacementError extends Error {}

// Everything a renderer is allowed to read, assembled from the registry and checked
// before the renderer runs. A registry that cannot supply what a region needs fails here,
// named, rather than producing a page with a hole in it.
export function regionContext(regionId, registry) {
  const region = Object.prototype.hasOwnProperty.call(REGIONS, regionId) ? REGIONS[regionId] : null;
  if (!region) {
    throw new PlacementError(`unknown placement region "${regionId}"`);
  }

  const placementName = region.placement;
  if (!Object.prototype.hasOwnProperty.call(registry.PLACEMENTS, placementName)) {
    throw new PlacementError(`region "${regionId}" names unknown placement "${placementName}"`);
  }

  const resolved = registry.resolvePlacement(placementName);
  const exampleId = resolved.exampleIds[0] ?? null;
  const example = exampleId ? registry.getExample(exampleId) : null;
  if (exampleId && !example) {
    throw new PlacementError(
      `placement "${placementName}" resolves to unregistered example "${exampleId}"`,
    );
  }

  // Eligibility, enforced at generation and not only in the ratchet. A placement may
  // only be filled by an example that carries its role.
  const role = registry.PLACEMENTS[placementName].role;
  if (role && example && !example.productRoles.includes(role)) {
    throw new PlacementError(
      `placement "${placementName}" resolves to "${exampleId}", which does not carry role ${role}`,
    );
  }

  const route = resolved.route ?? (example && example.routes.length ? example.routes[0] : null);
  const label = registry.placementLabel(placementName);
  const ctx = { regionId, placementName, exampleId, example, route, label };

  for (const need of region.needs) {
    const value = need === "route" || need === "label" ? ctx[need] : example && example[need];
    if (value === null || value === undefined || value === "") {
      throw new PlacementError(
        `region "${regionId}" needs ${need}, and placement "${placementName}"` +
          (exampleId ? ` (example "${exampleId}")` : "") +
          ` does not supply it`,
      );
    }
  }

  return { region, ctx };
}

function renderRegion(regionId, indent, registry) {
  const { region, ctx } = regionContext(regionId, registry);
  const out = region.render(ctx);
  if (region.block) {
    const lines = out.map((line) => (line === "" ? "" : indent + line));
    return `\n${lines.join("\n")}\n${indent}`;
  }
  if (String(out).includes("\n")) {
    throw new PlacementError(`region "${regionId}" is inline but rendered more than one line`);
  }
  return out;
}

// ── The generator ────────────────────────────────────────────────────────────

// The shipped tables. A test may pass a registry built over substitute tables to prove
// that a configuration change reaches the pages; production never does.
const DEFAULT_REGISTRY = makeRegistry();

// Rewrite every marked region in one file's source. Text outside the markers is copied
// through untouched, which is what makes this safe to run over pages that also carry
// archive ledgers, citations and case prose.
export function materializeSource(src, { registry = DEFAULT_REGISTRY } = {}) {
  const regions = [];
  let out = "";
  let cursor = 0;

  OPEN.lastIndex = 0;
  let match;
  while ((match = OPEN.exec(src)) !== null) {
    const regionId = match[1];
    const bodyStart = match.index + match[0].length;
    const bodyEnd = src.indexOf(CLOSE, bodyStart);
    if (bodyEnd === -1) {
      throw new PlacementError(`region "${regionId}" is opened and never closed`);
    }

    // The indentation of the line the opening marker sits on, so a block region is
    // generated at the depth it lives at rather than at a depth written in this file.
    const lineStart = src.lastIndexOf("\n", match.index) + 1;
    const indent = /^[ \t]*/.exec(src.slice(lineStart, match.index))[0];

    const generated = renderRegion(regionId, indent, registry);
    out += src.slice(cursor, bodyStart) + generated;
    cursor = bodyEnd;
    regions.push({ regionId, generated, previous: src.slice(bodyStart, bodyEnd) });
    OPEN.lastIndex = bodyEnd;
  }

  out += src.slice(cursor);
  return { output: out, regions };
}

const SKIP_DIRS = new Set(["node_modules", ".git", ".claude", "docs", "scripts", "test"]);

export function htmlFiles(root = REPO_ROOT) {
  const found = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
      if (entry.name.startsWith(".") && entry.isDirectory()) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        walk(full);
      } else if (entry.name.endsWith(".html")) {
        found.push(full);
      }
    }
  };
  walk(root);
  return found;
}

// Materialize every marked region in every shipped page.
//
// `write: false` is the check mode the test and the CLI's --check both use: it computes
// the same bytes and compares them against what is tracked, touching nothing.
export function materializePlacements({ write = false, registry = DEFAULT_REGISTRY, root = REPO_ROOT } = {}) {
  const files = [];
  for (const full of htmlFiles(root)) {
    const src = fs.readFileSync(full, "utf8");
    if (!src.includes("<!--imbas:placement ")) continue;
    const { output, regions } = materializeSource(src, { registry });
    const changed = output !== src;
    if (changed && write) fs.writeFileSync(full, output, "utf8");
    files.push({ path: path.relative(root, full), changed, regions, output });
  }
  const stale = files.filter((f) => f.changed).map((f) => f.path);
  return {
    ok: stale.length === 0,
    files,
    stale,
    regionCount: files.reduce((n, f) => n + f.regions.length, 0),
  };
}

// CLI. Bare run writes; --check reports and exits 1 when the tracked pages are stale.
if (import.meta.url === `file://${process.argv[1]}`) {
  const check = process.argv.includes("--check");
  let result;
  try {
    result = materializePlacements({ write: !check });
  } catch (err) {
    console.error(`✗ ${err.message}`);
    process.exit(1);
  }

  if (check) {
    if (result.ok) {
      console.log(`✓ ${result.regionCount} placement regions across ${result.files.length} pages are in sync with the registry`);
      process.exit(0);
    }
    console.error("✗ shipped placement markup does not match the registry. Stale pages:");
    for (const p of result.stale) console.error(`    ${p}`);
    console.error("  Run: npm run build:placements  (then commit the generated diff)");
    process.exit(1);
  }

  if (result.stale.length === 0) {
    console.log(`✓ ${result.regionCount} placement regions across ${result.files.length} pages already match the registry`);
  } else {
    console.log(`✓ regenerated ${result.stale.length} of ${result.files.length} pages (${result.regionCount} placement regions)`);
    for (const p of result.stale) console.log(`    ${p}`);
  }
}
