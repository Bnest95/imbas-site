/* A and C did not move, except where a founder ruling moved them. This proves it.
 *
 *   node build/ac-parity.mjs               # measure against the re-baselined archive
 *   node build/ac-parity.mjs --rebaseline  # write that archive (needs a ruling)
 *
 * A and C do not own their own renderer: all three directions draw through
 * shared/kit.js and shared/fixture.mjs, so "we did not edit a/ or c/" is not the claim
 * that matters. The claim that matters is that nothing reaching an A or C reader
 * changed without a ruling. Two legs, because they answer two different questions.
 *
 * LEG 1 · ACCEPTANCE. Live render against shared/ac-archive.json, the re-baselined
 * archive. This is where A/C byte-identity is measured from now on. Any difference is
 * a finding. Each state is also rendered twice in the same run and the two renders
 * compared, so a nondeterministic render fails here rather than being frozen into an
 * archive that happens to record one of its outcomes.
 *
 * LEG 2 · HISTORY. Live render against .pre-strata/, the verbatim pre-pass copy, which
 * still answers "what did this pass do to the archived pair." Two differences are
 * expected and are enumerated rather than tolerated:
 *
 *   - data-anatomy-version on the document element. Additive, a stamp not prose, and
 *     it names v1 on both archived directions.
 *   - FIRST_RUN_LINE, recast by the ruling of 2026-08-10. It is one governed string
 *     that all three directions render by design, so the recast necessarily reaches A
 *     and C. The founder ruled they carry it: freezing the archive at the pre-recast
 *     text would preserve a copy-law violation and split a string the anatomy declares
 *     shared.
 *
 * Anything beyond those two is a finding in either leg.
 *
 * .pre-strata/ is NOT edited to absorb the recast, and that is deliberate:
 * comprehension.mjs measures B's BEFORE column against the same directory, and the
 * founder's "currently twelve" is a reading of it. Rewriting the before-snapshot to
 * settle an after-question would move the baseline of the acceptance table.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromiumLaunch, VIEWPORTS, SETTLE_MS, LANE, RENDERER } from "./shoot.mjs";

const ARCHIVE = resolve(LANE, "shared/ac-archive.json");
const REBASELINE = process.argv.includes("--rebaseline");

const DIRECTIONS = ["a", "c"];
const RECORDS = ["montana", "furnace", "deposit", "website"];
const VIEWS = ["desktop", "mobile"];

/* Serialise what a reader could meet, not the whole document object. Attributes are
 * sorted so attribute order — which is a parser artefact, not a rendered fact — cannot
 * masquerade as a difference. */
const SERIALISE = `(() => {
  const walk = (n, depth) => {
    if (n.nodeType === 3) { const t = n.nodeValue.replace(/\\s+/g, " "); return t.trim() ? "  ".repeat(depth) + "#text " + JSON.stringify(t) : ""; }
    if (n.nodeType !== 1) return "";
    const attrs = Array.from(n.attributes).map((a) => a.name + "=" + JSON.stringify(a.value)).sort().join(" ");
    const head = "  ".repeat(depth) + "<" + n.tagName.toLowerCase() + (attrs ? " " + attrs : "") + ">";
    const kids = Array.from(n.childNodes).map((k) => walk(k, depth + 1)).filter(Boolean);
    return [head, ...kids].join("\\n");
  };
  return walk(document.documentElement, 0);
})()`;

async function renderTree(root) {
  const browser = await chromiumLaunch();
  const out = new Map();
  for (const view of VIEWS) {
    const ctx = await browser.newContext({
      viewport: VIEWPORTS[view],
      deviceScaleFactor: 1,
      colorScheme: "dark",
      reducedMotion: "no-preference",
    });
    const page = await ctx.newPage();
    for (const d of DIRECTIONS) {
      for (const rec of RECORDS) {
        const url = `file://${resolve(root, d, "record.html")}?rec=${rec}`;
        await page.goto(url, { waitUntil: "load" });
        await page.waitForSelector('html[data-ready="true"]', { timeout: 5000 });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(SETTLE_MS);
        out.set(`${d}/${rec}/${view}`, await page.evaluate(SERIALISE));
      }
    }
    await ctx.close();
  }
  await browser.close();
  return out;
}

const live = await renderTree(LANE);
const repeat = await renderTree(LANE);
const before = await renderTree(resolve(LANE, ".pre-strata"));

/* The two sanctioned differences against .pre-strata, normalised out before diffing and
 * counted separately. Both are exact matches, so a changed value still shows as a
 * difference rather than being absorbed by a loose pattern. */
const STAMP = / data-anatomy-version="record-anatomy\.v1"/g;
const RECAST_OLD = "Each mark points at something in this answer, or at something that isn't in it. Imbas records what was there and what wasn't.";
const RECAST_NEW = "Each mark points at something in this answer, or at something absent from it. Imbas records both.";
const unrecast = (s) => s.split(RECAST_NEW).join(RECAST_OLD);

const firstDiffs = (L, B) => {
  const a = L.split("\n"), b = B.split("\n");
  const diff = [];
  for (let i = 0, j = 0; (i < a.length || j < b.length) && diff.length < 6; i++, j++) {
    if (a[i] !== b[j]) diff.push({ line: i + 1, live: a[i], other: b[j] });
  }
  return diff;
};

/* Determinism, established before anything is compared to a stored archive. A render
 * that varies between two runs must not be frozen into an archive that happens to
 * record one of its outcomes. */
const unstable = [];
for (const key of live.keys()) if (live.get(key) !== repeat.get(key)) unstable.push({ state: key, first_differences: firstDiffs(live.get(key), repeat.get(key)) });

/* ── leg 1 · acceptance against the re-baselined archive ─────────────────────── */
if (REBASELINE) {
  if (unstable.length) { console.error(`refusing to re-baseline: ${unstable.length} states did not render identically twice`); process.exit(2); }
  writeFileSync(ARCHIVE, JSON.stringify({
    what: "Rendered A/C reference bytes. A/C byte-identity is measured against this file.",
    re_baselined: "2026-08-10",
    why: "FIRST_RUN_LINE was recast by founder ruling. It is one governed string that all three directions render by design, so the recast reaches A and C. Freezing the archive at the pre-recast text would preserve a copy-law violation and split a string the anatomy declares shared. The direction ruling is not reopened: this is a copy correction propagating through a shared layer, not visual work on A or C.",
    renderer: RENDERER,
    states: Object.fromEntries([...live.entries()].sort(([x], [y]) => x.localeCompare(y))),
  }, null, 2) + "\n");
  console.log(`re-baselined ${live.size} A/C states → shared/ac-archive.json`);
  console.log(`each state rendered twice and identical both times`);
  process.exit(0);
}

if (!existsSync(ARCHIVE)) { console.error("no shared/ac-archive.json — run with --rebaseline under a ruling"); process.exit(2); }
const archive = JSON.parse(readFileSync(ARCHIVE, "utf8"));
const archRows = [];
let archMatch = 0;
for (const key of live.keys()) {
  const A = archive.states[key];
  if (A === undefined) { archRows.push({ state: key, verdict: "NOT IN ARCHIVE" }); continue; }
  if (A === live.get(key)) { archMatch++; archRows.push({ state: key, verdict: "matches archive" }); continue; }
  archRows.push({ state: key, verdict: "DIFFERS FROM ARCHIVE", first_differences: firstDiffs(live.get(key), A) });
}
const archFail = archRows.filter((r) => r.verdict !== "matches archive");

/* ── leg 2 · history against the verbatim pre-pass copy ──────────────────────── */
const rows = [];
let identical = 0;
let stampOnly = 0;
let stampAndRecast = 0;
let different = 0;

for (const key of live.keys()) {
  const L = live.get(key);
  const B = before.get(key);
  if (L === B) { identical++; rows.push({ state: key, verdict: "byte-identical" }); continue; }
  const stamps = (L.match(STAMP) || []).length;
  const stripped = L.replace(STAMP, "");
  if (stripped === B) {
    stampOnly++;
    rows.push({ state: key, verdict: "identical but for the added stamp", added_attribute: "data-anatomy-version=\"record-anatomy.v1\"", occurrences: stamps });
    continue;
  }
  if (unrecast(stripped) === B) {
    stampAndRecast++;
    rows.push({ state: key, verdict: "identical but for the added stamp and the ruled recast", added_attribute: "data-anatomy-version=\"record-anatomy.v1\"", occurrences: stamps, governed_string: "FIRST_RUN_LINE" });
    continue;
  }
  different++;
  rows.push({ state: key, verdict: "MATERIALLY DIFFERENT", first_differences: firstDiffs(L, B) });
}

const report = {
  question: "Does anything reaching an A or C reader differ from the ruled archive, and what did this pass change?",
  renderer: RENDERER,
  states: rows.length,
  determinism: { rendered_twice: true, states_that_varied: unstable.length, detail: unstable },
  acceptance_against_archive: {
    archive: "shared/ac-archive.json",
    re_baselined: archive.re_baselined,
    matches: archMatch,
    findings: archFail.length,
    detail: archFail,
  },
  history_against_pre_strata: {
    byte_identical: identical,
    identical_but_for_the_added_anatomy_version_stamp: stampOnly,
    identical_but_for_the_stamp_and_the_ruled_recast: stampAndRecast,
    materially_different: different,
    sanctioned_differences: [
      {
        kind: "attribute",
        attribute: "data-anatomy-version",
        value_on_a_and_c: "record-anatomy.v1",
        why_safe: "additive, on the document element only, never rendered as text, and it names the archived anatomy",
      },
      {
        kind: "governed string",
        name: "FIRST_RUN_LINE",
        ruled: "2026-08-10",
        why_it_reaches_a_and_c: "one governed string that all three directions render by design",
      },
    ],
    rows,
  },
};

writeFileSync(resolve(LANE, "shared/ac-parity-report.json"), JSON.stringify(report, null, 2) + "\n");

console.log(`${rows.length} A/C states, each rendered twice`);
console.log(`  states that did not render identically twice   ${unstable.length}`);
console.log(`\nacceptance · against shared/ac-archive.json, re-baselined ${archive.re_baselined}`);
console.log(`  matches archive                      ${archMatch}`);
console.log(`  findings                             ${archFail.length}`);
for (const r of archFail) {
  console.log(`  ! ${r.state}  ${r.verdict}`);
  for (const d of r.first_differences || []) console.log(`      line ${d.line}\n        live:    ${d.live}\n        archive: ${d.other}`);
}
console.log(`\nhistory · against .pre-strata/, the verbatim pre-pass copy`);
console.log(`  byte-identical                       ${identical}`);
console.log(`  identical but for the added stamp    ${stampOnly}`);
console.log(`  ...and the ruled FIRST_RUN_LINE recast ${stampAndRecast}`);
console.log(`  materially different                 ${different}`);
for (const r of rows.filter((r) => r.verdict === "MATERIALLY DIFFERENT")) {
  console.log(`  ! ${r.state}`);
  for (const d of r.first_differences) console.log(`      line ${d.line}\n        live:   ${d.live}\n        before: ${d.other}`);
}
process.exit(unstable.length === 0 && archFail.length === 0 && different === 0 ? 0 : 1);
