/* B's comprehension measurement: the six numbers the founder asked for, taken the same
 * way before and after so the pair can be compared.
 *
 *   node build/comprehension.mjs            # measure the current build
 *   node build/comprehension.mjs --save X   # also write shared/comprehension-X.json
 *
 * The metrics, and why each is defined the way it is:
 *
 *   finding_px      document offset of Z1.4, the finding sentence. The claim.
 *   answer_px       document offset of the first character of the person's own answer.
 *                   Taken from the source body's first text node rather than from the
 *                   container, because a container can begin with padding and the
 *                   reader cannot read padding.
 *   first_mark_px   document offset of the first in-document mark.
 *   answer_in_fold  whether the answer's first LINE is fully inside the first screen.
 *                   The first line, not the first pixel: a reader who can see the top
 *                   two pixels of a glyph has not reached their answer.
 *   claim_to_proof  S6's method exactly — Z1.4 to whichever of the source text or the
 *                   first in-source mark the reader meets first. Taking the earliest is
 *                   the honest reading and it is also the choice that makes every number
 *                   smaller, so it cannot be accused of flattering a change.
 *   blocks_before   distinct rendered text blocks a reader passes before the question.
 *                   A "block" is a leaf: an element carrying text with no block-level
 *                   text-bearing child of its own, so a wrapper is never counted twice
 *                   and a label plus its value counts once. The boundary is Z3.1, the
 *                   prompt — the question is not explanatory burden, it is what the
 *                   reader came for. On the pre-pass build this returns 12 on B's
 *                   desktop opening state, which is the founder's own count, so the
 *                   definition is calibrated against the number it has to move.
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromiumLaunch, LANE, SETTLE_MS } from "./shoot.mjs";

const STATES = [
  { view: "1440", w: 1440, h: 1000, arrival: "as it opens", query: "" },
  { view: "1440", w: 1440, h: 1000, arrival: "forwarded cold", query: "&forwarded=1" },
  { view: " 390", w: 390, h: 844, arrival: "as it opens", query: "" },
  { view: " 390", w: 390, h: 844, arrival: "forwarded cold", query: "&forwarded=1" },
];

/* `root` exists so the same script can measure the snapshot in .pre-strata/ as well
 * as the live lane. A before and an after taken by two versions of a measurement are
 * two measurements, not a comparison, and this pass changed the block rule. */
export async function measure(directions = ["b"], records = ["montana", "deposit"], root = LANE) {
  const browser = await chromiumLaunch();
  const rows = [];

  for (const dir of directions) {
    for (const record of records) {
      for (const s of STATES) {
        const ctx = await browser.newContext({
          viewport: { width: s.w, height: s.h },
          deviceScaleFactor: 1,
          colorScheme: "dark",
        });
        const page = await ctx.newPage();
        await page.goto(`file://${resolve(root, dir, "record.html")}?record=${record}${s.query}`, { waitUntil: "load" });
        await page.waitForSelector('html[data-ready="true"]', { timeout: 5000 });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(SETTLE_MS);

        const m = await page.evaluate((fold) => {
          const off = (n) => (n ? Math.round(n.getBoundingClientRect().top + window.scrollY) : null);

          /* The first character, not the first box. A Range over the first text node
           * gives the glyph box, which is what a reader actually meets. */
          const firstCharBox = (host) => {
            if (!host) return null;
            const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
            let node;
            while ((node = walker.nextNode())) {
              if (!node.nodeValue || !node.nodeValue.trim()) continue;
              const i = node.nodeValue.search(/\S/);
              const r = document.createRange();
              r.setStart(node, i);
              r.setEnd(node, i + 1);
              const b = r.getBoundingClientRect();
              if (b.height || b.width) return { top: b.top + window.scrollY, bottom: b.bottom + window.scrollY };
            }
            return null;
          };

          const finding = document.querySelector('[data-zone="Z1.4"]');
          const source = document.querySelector("[data-source-body]");
          const firstMark = document.querySelector("[data-mark]");
          const prompt = document.querySelector('[data-zone="Z3.1"]');

          const answer = firstCharBox(source);
          const findingBox = firstCharBox(finding);

          /* S6's proof: earliest of source text and first in-source mark. */
          const markTop = off(firstMark);
          const proof = [answer ? answer.top : null, markTop].filter((x) => x !== null);
          const proofTop = proof.length ? Math.min(...proof) : null;
          const claimTop = findingBox ? findingBox.top : off(finding);

          /* Leaf text blocks strictly above the question. */
          const boundary = prompt ? off(prompt) : (answer ? answer.top : Infinity);
          const blocks = [];
          const walk = (n) => {
            for (const c of n.children) {
              const text = (c.textContent || "").trim();
              if (!text) continue;
              /* A block a reader does not pass is not a block a reader passes.
               *
               * The obvious test — no client rects — is wrong here, and measuring
               * caught it. Chrome 148 collapses a closed <details> by skipping its
               * ::details-content subtree, not by removing it from layout: the
               * disclosure's own box is 34px high, the summary only, yet every
               * descendant still reports a real non-zero rect at a plausible
               * coordinate. Counting rects therefore counted eleven blocks nobody
               * could see and reported the recomposition as half the size it is.
               *
               * checkVisibility() is the browser's own answer to the question this
               * metric is actually asking, and it is not a rule about <details>: it
               * returns false for display:none, for a skipped content-visibility
               * subtree, and — with these options — for visibility:hidden and
               * opacity:0 as well. Anything a future direction hides by any means is
               * excluded on the same terms, and nothing is excluded merely for being
               * inside a disclosure.
               *
               * The summary line of that disclosure IS visible and IS counted — it is
               * a line of prose standing between the reader and the question, and this
               * metric exists to count exactly that. So the strata cost one block and
               * refund nine; they do not launder ten.
               *
               * Applied identically to the pre-strata snapshot in .pre-strata/, where
               * it changes no number: nothing above the question in that build was
               * hidden by any mechanism. Before and after are one metric. */
              if (!c.checkVisibility({ contentVisibilityAuto: true, opacityProperty: true, visibilityProperty: true })) continue;
              /* The question is not explanatory burden, so neither it nor anything
               * inside it counts — including its label, whose box can start a pixel
               * above its own container's and would otherwise slip past a purely
               * positional test. */
              if (prompt && (prompt === c || prompt.contains(c))) continue;
              const top = c.getBoundingClientRect().top + window.scrollY;
              if (top >= boundary) continue;
              const hasBlockTextChild = Array.from(c.children).some((x) => {
                const st = getComputedStyle(x);
                return st.display !== "inline" && (x.textContent || "").trim();
              });
              if (hasBlockTextChild) walk(c);
              else blocks.push({ zone: c.getAttribute("data-zone"), cls: c.className, top: Math.round(top), text: text.slice(0, 70) });
            }
          };
          walk(document.body);

          return {
            finding_px: Math.round(claimTop),
            answer_px: answer ? Math.round(answer.top) : null,
            answer_line_bottom: answer ? Math.round(answer.bottom) : null,
            first_mark_px: markTop,
            answer_in_fold: answer ? answer.bottom <= fold : false,
            claim_to_proof_px: proofTop !== null ? Math.round(proofTop - claimTop) : null,
            claim_to_proof_screens: proofTop !== null ? Math.round(((proofTop - claimTop) / fold) * 100) / 100 : null,
            blocks_before: blocks.length,
            blocks,
            page_px: Math.round(document.documentElement.scrollHeight),
          };
        }, s.h);

        rows.push({ direction: dir, record, view: s.view.trim(), arrival: s.arrival, fold: s.h, ...m });
        await ctx.close();
      }
    }
  }

  await browser.close();
  return rows;
}

function table(rows) {
  const H = ["rec", "view", "arrival", "finding", "answer", "mark", "in-fold", "c→p px", "screens", "blocks"];
  console.log(H[0].padEnd(8) + H[1].padStart(5) + "  " + H[2].padEnd(15) + H[3].padStart(8) + H[4].padStart(8) +
    H[5].padStart(7) + H[6].padStart(9) + H[7].padStart(8) + H[8].padStart(9) + H[9].padStart(8));
  for (const r of rows) {
    console.log(
      r.record.padEnd(8) + String(r.view).padStart(5) + "  " + r.arrival.padEnd(15) +
      String(r.finding_px).padStart(8) + String(r.answer_px).padStart(8) +
      String(r.first_mark_px).padStart(7) + (r.answer_in_fold ? "yes" : "no").padStart(9) +
      String(r.claim_to_proof_px).padStart(8) + String(r.claim_to_proof_screens).padStart(9) +
      String(r.blocks_before).padStart(8),
    );
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = process.argv.indexOf("--root");
  const root = r > 0 && process.argv[r + 1] ? resolve(LANE, process.argv[r + 1]) : LANE;
  console.log(`measuring ${root}\n`);
  const rows = await measure(["b"], ["montana", "deposit"], root);
  table(rows);
  const i = process.argv.indexOf("--save");
  if (i > 0 && process.argv[i + 1]) {
    const path = resolve(LANE, "shared", `comprehension-${process.argv[i + 1]}.json`);
    writeFileSync(path, JSON.stringify(rows, null, 2) + "\n");
    console.log(`\nsaved ${path}`);
  }
}
