/* The stress pass: eighteen frames as they open, and the pause measured on the same
 * loads that produced them.
 *
 *   node build/stress.mjs
 *
 * Two things the founder asked for come from one set of page loads, because they have
 * to describe the same rendered composition. A fold capture taken from one load and a
 * distance measured on another would eventually disagree, and the disagreement would
 * be invisible.
 *
 * S10 · the eighteen.
 *   Deposit, nine marks across all three channels, for A/B/C at:
 *     1440 as it opens · 1440 forwarded cold · 390 as it opens · 390 forwarded cold
 *   Furnace, one mark, for A/B/C at:
 *     1440 as it opens · 390 as it opens
 *
 * Every frame is clipped to the viewport, because "as it opens" is a claim about the
 * first screen and a full-page capture answers a different question. The full-page
 * frames still exist beside these in screenshots/.
 *
 * S6 · the pause.
 *   The distance a reader crosses between the first consequential claim and the first
 *   thing they can check for themselves, reported in viewport heights.
 *
 *   FIRST CLAIM is the finding sentence at Z1.4. It is the first thing on the page
 *   that asserts something about the answer rather than about the record.
 *
 *   FIRST PROOF is the earliest of two things, whichever a reader meets first: the
 *   source text they can read themselves, or the first mark sitting on it. Taking the
 *   earliest rather than the source block alone is the honest reading — a mark
 *   rendered above the source is still inspectable evidence — and it is the choice
 *   that makes the number smaller, so it cannot be accused of inflating a direction's
 *   pause to flatter another.
 *
 * Nothing here is tuned per direction. The same selectors run against all three, and
 * a direction that hides a zone simply reports a longer distance.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromiumLaunch, LANE, VIEWPORTS, SETTLE_MS } from "./shoot.mjs";

const OUT = resolve(LANE, "screenshots/stress");
mkdirSync(OUT, { recursive: true });

/* record · viewport · forwarded. The six states, times three directions. */
const STATES = [
  { record: "deposit", view: "desktop", forwarded: false, label: "1440 as it opens" },
  { record: "deposit", view: "desktop", forwarded: true, label: "1440 forwarded cold" },
  { record: "deposit", view: "mobile", forwarded: false, label: "390 as it opens" },
  { record: "deposit", view: "mobile", forwarded: true, label: "390 forwarded cold" },
  { record: "furnace", view: "desktop", forwarded: false, label: "1440 as it opens" },
  { record: "furnace", view: "mobile", forwarded: false, label: "390 as it opens" },
];

const MEASURE = () => {
  const doc = document;
  const y = (n) => {
    if (!n) return null;
    const b = n.getBoundingClientRect();
    return { top: Math.round(b.top + scrollY), bottom: Math.round(b.bottom + scrollY) };
  };
  const first = (sel) => {
    /* Earliest in document order that actually renders. A direction may carry a zone
     * it does not paint, and an unpainted node is not evidence a reader can reach. */
    const seen = Array.from(doc.querySelectorAll(sel)).filter((n) => n.getClientRects().length > 0);
    if (!seen.length) return null;
    return seen.map(y).sort((a, b) => a.top - b.top)[0];
  };

  const claim = first('[data-zone="Z1.4"]');
  const sourceText = first("[data-source-body]");
  const firstMark = first("[data-anchor]");
  /* Whichever the reader meets first. */
  const proofs = [sourceText, firstMark].filter(Boolean).sort((a, b) => a.top - b.top);
  const proof = proofs[0] || null;

  return {
    fold: window.innerHeight,
    page_height: doc.documentElement.scrollHeight,
    claim,
    source_text: sourceText,
    first_mark: firstMark,
    proof,
    proof_is: proof && sourceText && proof.top === sourceText.top ? "source text" : proof ? "first mark" : null,
    claim_in_fold: claim ? claim.top < window.innerHeight : null,
    proof_in_fold: proof ? proof.top < window.innerHeight : null,
  };
};

const browser = await chromiumLaunch();
const rows = [];

for (const dir of ["a", "b", "c"]) {
  for (const st of STATES) {
    const ctx = await browser.newContext({
      viewport: VIEWPORTS[st.view], deviceScaleFactor: 1, colorScheme: "dark",
    });
    const page = await ctx.newPage();
    const q = `record=${st.record}${st.forwarded ? "&forwarded=1" : ""}`;
    await page.goto(`file://${resolve(LANE, dir, "record.html")}?${q}`, { waitUntil: "load" });
    await page.waitForSelector('html[data-ready="true"]', { timeout: 5000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(SETTLE_MS);

    const m = await page.evaluate(MEASURE);
    const name = [dir, st.record, st.view === "desktop" ? "1440" : "390", st.forwarded ? "forwarded" : "opens"].join("__");
    await page.screenshot({ path: resolve(OUT, `${name}.png`) });

    /* The number the founder asked for: how far past the first screen the proof sits.
     * Zero means a reader who never scrolls has already reached something checkable. */
    const gapPx = m.claim && m.proof ? m.proof.top - m.claim.top : null;
    rows.push({
      direction: dir, record: st.record, view: st.view, state: st.label, frame: `${name}.png`,
      fold_px: m.fold, page_px: m.page_height,
      claim_top: m.claim ? m.claim.top : null,
      proof_top: m.proof ? m.proof.top : null,
      proof_is: m.proof_is,
      claim_to_proof_px: gapPx,
      claim_to_proof_screens: gapPx === null ? null : +(gapPx / m.fold).toFixed(2),
      proof_below_fold_screens: m.proof ? +Math.max(0, (m.proof.top - m.fold) / m.fold).toFixed(2) : null,
      claim_in_fold: m.claim_in_fold,
      proof_in_fold: m.proof_in_fold,
    });
    await ctx.close();
  }
}
await browser.close();

writeFileSync(
  resolve(LANE, "shared/stress-report.json"),
  JSON.stringify(
    {
      method:
        "Governed renderer, viewport-clipped frames. FIRST CLAIM = Z1.4 finding sentence. FIRST PROOF = whichever of the source text or the first in-source mark a reader meets first. Distances are document offsets, so they are what a reader scrolls, not what a layout intends.",
      first_claim_zone: "Z1.4",
      first_proof_candidates: ["[data-source-body]", "[data-anchor]"],
      frames: rows.length,
      rows,
    },
    null,
    2,
  ) + "\n",
);

/* The same rows again as a script that assigns a global, so the review page opens
 * from the filesystem as well as over the local server. A page that fetches JSON
 * works on one of those two and fails silently on the other, and the reviewer who
 * hits the failing one concludes the frames were never made. */
writeFileSync(
  resolve(LANE, "compare/stress.data.js"),
  "window.IMBAS_STRESS = " + JSON.stringify({ frames: rows.length, rows }, null, 2) + ";\n",
);

console.log("dir rec      view     state                 claim   proof  proof is      gap px  screens  in fold");
for (const r of rows) {
  console.log(
    `${r.direction}   ${r.record.padEnd(8)} ${String(r.fold_px).padStart(4)}px  ${r.state.padEnd(20)} ` +
      `${String(r.claim_top).padStart(5)}  ${String(r.proof_top).padStart(6)}  ${String(r.proof_is).padEnd(12)} ` +
      `${String(r.claim_to_proof_px).padStart(6)}  ${String(r.claim_to_proof_screens).padStart(6)}   ${r.proof_in_fold ? "yes" : "NO "}`,
  );
}
const missed = rows.filter((r) => !r.proof_in_fold).length;
console.log(`\n${rows.length} stress frames · ${missed} where the first proof sits past the first screen`);
