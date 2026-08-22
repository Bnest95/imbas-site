// The comprehension floor, measured on production.
//
//   node scripts/qa/comprehension.mjs           # measure and print the side-by-side
//   node scripts/qa/comprehension.mjs --json    # also emit the rows as JSON
//
// This is a MEASUREMENT instrument, not the acceptance board. It photographs nothing,
// writes no baseline, and compares no bytes. It reports seven numbers per state and
// sets them beside the frozen floor.
//
// ── Provenance ───────────────────────────────────────────────────────────────
// Ported from build/comprehension.mjs in the read-only scratch reference at
// /Users/brendan/Documents/Claude/scratch/imbas-visual-directions. The seven metric
// definitions below are that file's definitions, not new ones — including the parts
// that look like details and are not: the first CHARACTER rather than the container
// box, the first LINE rather than the first pixel, the EARLIEST of source text and
// first mark, and checkVisibility rather than client-rect presence.
//
// The floor it is measured against is the after column of COMPREHENSION-RETURN.md §2
// in that same reference, transcribed into FLOOR below.
//
// ── The three mapping decisions, stated because they are the whole argument ───
//
// 1. ORIGIN. The scratch measured `b/record.html`, whose entire <body> is
//    `<main id="record">`. No site header, no nav, no compose block: page top was the
//    record's top. Production's `/reader` renders the result BELOW the compose fields
//    and then scrolls the reader to it (scrollWorkbenchAnchor, workbench-app.jsx). So
//    the production analogue of "page top" is the top of the result region — the point
//    the reader is actually placed at — and every pixel column here is measured from
//    there. Counting the compose block a reader has just finished using would not be a
//    stricter reading of the metric; it would be comparing an application to a record
//    page. The un-scoped figure is reported alongside, so nothing is hidden.
//
//    claim_to_proof_px is a difference between two offsets, so the origin cancels out
//    of it entirely. That column — the one the founder's ruling picked direction B for
//    — is comparable to the floor with no mapping argument at all.
//
// 2. THE PROMPT. The scratch's block boundary is Z3.1, the question, on the ground that
//    "the question is not explanatory burden, it is what the reader came for." On a
//    share the question renders in the record and the boundary holds. On `/reader` it
//    does not exist inside the result: the reader typed the question in the compose
//    block above and is not shown it again. The probe's OWN fallback governs there —
//    `boundary = prompt ? off(prompt) : answer.top` is ported verbatim — so on the
//    runner arrival the boundary is the first character of the answer. That is the
//    stricter of the two, since the scratch's prompt sat above its answer.
//
// 3. ANSWER IN FIRST SCREEN. The scratch measured `answer.bottom <= fold` at scrollY 0
//    on a page with nothing pinned. Production has a `position: sticky` site header
//    that occludes the top of the screen after the app's scroll. So the test here is
//    the reader's real first screen: the answer's first line below the sticky header's
//    bottom edge and above the fold. On a page with no sticky header and no scroll this
//    reduces to the scratch expression exactly.
//
// ── What it drives ───────────────────────────────────────────────────────────
// Registered board scenarios, through visual-acceptance.mjs's own server, browser,
// stub and drive-step machinery. One implementation of drive semantics, not two: a
// scenario driven two slightly different ways is two states, and comparing them would
// be a measurement error dressed as a finding.
//
// Viewports are the FLOOR's (1440x1000, 390x844, dSF 1), not the board's — a different
// instrument answering a different question. The board photographs 1440x900 dSF 2 and
// 375x812 dSF 3 and is untouched by this file.

import { SCENARIOS, resolvePayloads } from "./scenarios.mjs";
import {
  CDP,
  buildStubScript,
  evaluate,
  installInterception,
  launchBrowser,
  resolveBrowser,
  resolveNavigation,
  resolveReadiness,
  runSteps,
  settle,
  startStaticServer,
  waitUntil,
} from "./visual-acceptance.mjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const log = (s = "") => process.stdout.write(`${s}\n`);

// ── The frozen floor ─────────────────────────────────────────────────────────
// COMPREHENSION-RETURN.md §2, after column, transcribed. `in_fold` is that table's
// "answer's first line in first screen"; all eight cells read yes.
const FLOOR = {
  "montana 1440 as it opens": { blocks: 3, finding: 22, answer: 386, mark: 852, in_fold: true, c2p: 364, screens: 0.36 },
  "montana 1440 forwarded cold": { blocks: 7, finding: 97, answer: 493, mark: 959, in_fold: true, c2p: 397, screens: 0.4 },
  "montana 390 as it opens": { blocks: 3, finding: 23, answer: 402, mark: 1007, in_fold: true, c2p: 379, screens: 0.45 },
  "montana 390 forwarded cold": { blocks: 7, finding: 180, answer: 612, mark: 1217, in_fold: true, c2p: 433, screens: 0.51 },
  "deposit 1440 as it opens": { blocks: 3, finding: 22, answer: 426, mark: 541, in_fold: true, c2p: 404, screens: 0.4 },
  "deposit 1440 forwarded cold": { blocks: 7, finding: 97, answer: 533, mark: 648, in_fold: true, c2p: 437, screens: 0.44 },
  "deposit 390 as it opens": { blocks: 3, finding: 23, answer: 430, mark: 858, in_fold: true, c2p: 407, screens: 0.48 },
  "deposit 390 forwarded cold": { blocks: 7, finding: 204, answer: 664, mark: 1093, in_fold: true, c2p: 460, screens: 0.55 },
};

export const FLOOR_VIEWPORTS = {
  1440: { width: 1440, height: 1000, dsf: 1, mobile: false },
  390: { width: 390, height: 844, dsf: 1, mobile: true },
};

// ── Where each metric lives, per composition ─────────────────────────────────
// Production carries no data-zone attributes. They are the scratch's names for the
// things the metrics are about, and this table is where those names are resolved to
// production's own classes. `prompt: null` is a real value and not an omission — see
// mapping decision 2.
// `claim_referent` records whether the element under `claim` is the floor's own thing or
// a stand-in. The floor's `finding px` column measures the offset of direction B's Z1.4:
// a prose claim headline (`el("h1", {zone:"Z1.4", text: rec.finding_sentence})`, e.g.
// "Nine marks sit on this answer. Five point at wording it carries, and four at terms it
// does not."), which B placed ABOVE its arithmetic count line (Z2.1, "9 marks on this
// record"). Production inverts that order and carries no prose claim headline at all.
// Where that is the case the column is measured and printed but scored as a mapping
// question, not as a pass or a miss — see the verdict.
const RUNNER = {
  region: ".wb-reader-v2__result",
  claim: ".wb-result-hero__summary",
  // Stand-in. Production's GLANCE is arithmetic first (`.wb-result-hero__estimate`,
  // "N candidate items surfaced" — B's Z2.1), then one sentence saying what the count
  // counts. Neither is B's Z1.4. Mapping Z1.4 onto the count instead moves the number
  // from 100/76 to 46/35 against a floor of 22/23 and still does not reach it, by the
  // result section's own top padding alone.
  claim_referent: "stand-in: production carries no Z1.4 prose claim headline",
  source: ".wb-source__body",
  mark: "[data-mark]",
  prompt: null,
};

const SHARE_P4 = {
  region: "#insp-record-root",
  claim: ".insp-glance__orientation",
  claim_referent: "stand-in: same inversion as RUNNER — .insp-glance__count leads",
  source: null, // A P4 share row stores no raw answer. api/inspection-share.js.
  mark: null, // And so nothing on this surface carries a position.
  prompt: ".insp-context__block",
};

const SHARE_LEGACY = {
  region: "#insp-record-root",
  claim: ".wb-reader-result__archival-notice",
  // The legacy composition carries no claim line of any kind. The archival notice is the
  // first prose block in the record, which is the closest thing there is and is not the
  // same thing. Its number is uninterpretable rather than failing.
  claim_referent: "stand-in: the legacy composition has no claim line at all",
  source: ".insp-context__text--answer",
  mark: null,
  prompt: ".insp-context__block",
};

// ── The eight states, mapped ─────────────────────────────────────────────────
// `substitution` is filled in wherever the production record is not the floor's record.
// It prints in the return. A substitution that is not named is a reduction.
export const STATES = [
  {
    floor: "montana 1440 as it opens",
    scenario: "single-findings",
    view: 1440,
    sel: RUNNER,
    substitution:
      "The floor's low-density record is montana, 1 mark. Production's montana is the " +
      "public example door (ReaderDemo / PUBLIC_EXAMPLE_UI): a curated surface with no " +
      "anchors, no measurement panel and no positioned marks, so it can carry three of " +
      "the seven columns and not the other four. Production's lowest-density MEASURED " +
      "record is single-findings, 2 marks.",
  },
  { floor: "montana 390 as it opens", scenario: "single-findings", view: 390, sel: RUNNER, substitution: "As above." },
  { floor: "deposit 1440 as it opens", scenario: "deposit-fixture", view: 1440, sel: RUNNER, substitution: null },
  { floor: "deposit 390 as it opens", scenario: "deposit-fixture", view: 390, sel: RUNNER, substitution: null },
  {
    floor: "montana 1440 forwarded cold",
    scenario: "share-single",
    view: 1440,
    sel: SHARE_P4,
    substitution:
      "The forwarded arrival is a published share on /inspection/:shareId, not a record " +
      "on /reader — production has no query-parameter arrival and this lane was ruled " +
      "not to invent one. share-single is the current mint path (P4).",
  },
  { floor: "montana 390 forwarded cold", scenario: "share-single", view: 390, sel: SHARE_P4, substitution: "As above." },
  {
    floor: "deposit 1440 forwarded cold",
    scenario: "share-legacy",
    view: 1440,
    sel: SHARE_LEGACY,
    substitution:
      "No dense-record share scenario exists, and registering one would fill none of " +
      "the cells that are empty here, because the cause is the composition and the " +
      "projection rather than the density of the record. Per branch: share-single (P4, " +
      "api/inspection-share.js p4RecordToPublic) carries no answer onto the published " +
      "record, so that path receives no source body at all and a positioned mark has " +
      "nothing to be positioned in. share-legacy (pre-P4, legacyRecordToPublic) does " +
      "carry the answer under G3, and inspection.js renders it at " +
      ".insp-context__text--answer as escaped plain text in a single paragraph — a body " +
      "with no span structure a positioned mark could sit in either. [data-mark] occurs " +
      "zero times across inspection.js. share-legacy is measured because that carried " +
      "answer is what makes the answer columns resolvable.",
  },
  { floor: "deposit 390 forwarded cold", scenario: "share-legacy", view: 390, sel: SHARE_LEGACY, substitution: "As above." },
];

// ── The in-page measurement ──────────────────────────────────────────────────
// One expression, evaluated in the real page after the real drive steps. Everything
// inside it is the scratch's code with the selectors and the origin parameterised.
//
// Exported because blocks-ratchet.mjs governs `blocks_before` and must count a block
// the same way this file does. Two transcriptions of a walker are two definitions, and
// a ratchet measuring a quantity the floor does not measure governs nothing.
export function measureExpression(sel, fold) {
  return `(() => {
  const CFG = ${JSON.stringify(sel)};
  const FOLD = ${fold};
  const region = document.querySelector(CFG.region);
  if (!region) return { error: "region not found: " + CFG.region };
  const q = (s) => (s ? region.querySelector(s) : null);
  const originTop = region.getBoundingClientRect().top + window.scrollY;
  const off = (n) => (n ? Math.round(n.getBoundingClientRect().top + window.scrollY) : null);

  /* The first character, not the first box. A Range over the first text node
   * gives the glyph box, which is what a reader actually meets. */
  const firstCharBox = (host) => {
    if (!host) return null;
    const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (!node.nodeValue || !node.nodeValue.trim()) continue;
      const i = node.nodeValue.search(/\\S/);
      const r = document.createRange();
      r.setStart(node, i);
      r.setEnd(node, i + 1);
      const b = r.getBoundingClientRect();
      if (b.height || b.width) return { top: b.top + window.scrollY, bottom: b.bottom + window.scrollY };
    }
    return null;
  };

  const finding = q(CFG.claim);
  const source = q(CFG.source);
  const firstMark = q(CFG.mark);
  const prompt = q(CFG.prompt);

  const answer = firstCharBox(source);
  const findingBox = firstCharBox(finding);

  /* Earliest of source text and first in-source mark. */
  const markTop = off(firstMark);
  const proof = [answer ? answer.top : null, markTop].filter((x) => x !== null);
  const proofTop = proof.length ? Math.min(...proof) : null;
  const claimTop = findingBox ? findingBox.top : off(finding);

  /* Leaf text blocks strictly above the question — or above the answer where the
   * composition shows the reader no question. The scratch's own fallback. */
  const boundary = prompt ? off(prompt) : (answer ? answer.top : Infinity);
  const blocks = [];
  const walk = (n) => {
    for (const c of n.children) {
      const text = (c.textContent || "").trim();
      if (!text) continue;
      /* checkVisibility, not client rects. Chrome collapses a closed <details> by
       * skipping its ::details-content subtree rather than removing it from layout,
       * so every descendant still reports a real rect at a plausible coordinate and
       * a rect-counting metric counts blocks nobody can see. This returns false for
       * display:none, for a skipped content-visibility subtree, and — with these
       * options — for visibility:hidden and opacity:0. The disclosure's own summary
       * line IS visible and IS counted: it is a line of prose standing between the
       * reader and their evidence, which is what this metric exists to count. */
      if (!c.checkVisibility({ contentVisibilityAuto: true, opacityProperty: true, visibilityProperty: true })) continue;
      if (prompt && (prompt === c || prompt.contains(c))) continue;
      const top = c.getBoundingClientRect().top + window.scrollY;
      if (top >= boundary) continue;
      const hasBlockTextChild = Array.from(c.children).some((x) => {
        const st = getComputedStyle(x);
        return st.display !== "inline" && (x.textContent || "").trim();
      });
      if (hasBlockTextChild) walk(c);
      else blocks.push({ cls: c.className, top: Math.round(top - originTop), text: text.slice(0, 70) });
    }
  };
  walk(region);

  /* Everything above the region, counted the same way, so the scoping decision is
   * visible in the return rather than argued for in a comment. */
  const scoped = blocks.length;
  const unscopedBlocks = [];
  const walkAll = (n) => {
    for (const c of n.children) {
      const text = (c.textContent || "").trim();
      if (!text) continue;
      if (!c.checkVisibility({ contentVisibilityAuto: true, opacityProperty: true, visibilityProperty: true })) continue;
      if (region === c || region.contains(c)) continue;
      const top = c.getBoundingClientRect().top + window.scrollY;
      if (top >= originTop) continue;
      const hasBlockTextChild = Array.from(c.children).some((x) => {
        const st = getComputedStyle(x);
        return st.display !== "inline" && (x.textContent || "").trim();
      });
      if (hasBlockTextChild) walkAll(c);
      else unscopedBlocks.push(1);
    }
  };
  walkAll(document.body);

  /* The reader's real first screen: below whatever is pinned at the top of the
   * viewport, above the fold. On a page with nothing pinned and no scroll this is
   * the scratch's answer.bottom <= fold exactly. */
  let pinnedBottom = 0;
  for (const el of document.body.querySelectorAll("*")) {
    const st = getComputedStyle(el);
    if (st.position !== "fixed" && st.position !== "sticky") continue;
    if (!el.checkVisibility({ contentVisibilityAuto: true, opacityProperty: true, visibilityProperty: true })) continue;
    const r = el.getBoundingClientRect();
    if (r.top > 1 || r.bottom <= 0 || r.width < 1) continue;
    /* Full-viewport decorative overlays (grain, aurora) are pinned and occlude
     * nothing readable; a band that covers the whole screen is not a header. */
    if (r.height >= FOLD * 0.9) continue;
    if (r.bottom > pinnedBottom) pinnedBottom = r.bottom;
  }
  const answerTopVp = answer ? answer.top - window.scrollY : null;
  const answerBottomVp = answer ? answer.bottom - window.scrollY : null;

  return {
    origin_px: Math.round(originTop),
    scroll_y: Math.round(window.scrollY),
    pinned_px: Math.round(pinnedBottom),
    finding_px: claimTop === null ? null : Math.round(claimTop - originTop),
    answer_px: answer ? Math.round(answer.top - originTop) : null,
    first_mark_px: markTop === null ? null : Math.round(markTop - originTop),
    answer_in_fold: answer ? answerBottomVp <= FOLD && answerTopVp >= pinnedBottom : false,
    claim_to_proof_px: proofTop !== null && claimTop !== null ? Math.round(proofTop - claimTop) : null,
    claim_to_proof_screens:
      proofTop !== null && claimTop !== null ? Math.round(((proofTop - claimTop) / FOLD) * 100) / 100 : null,
    blocks_before: scoped,
    blocks_above_region: unscopedBlocks.length,
    blocks,
    region_px: Math.round(region.getBoundingClientRect().height),
  };
})()`;
}

// ── Run ──────────────────────────────────────────────────────────────────────
export async function measure(states = STATES) {
  const renderer = resolveBrowser();
  const { server, port } = await startStaticServer(REPO_ROOT);
  const origin = `http://127.0.0.1:${port}`;
  const { proc, userDataDir, port: cdpPort } = await launchBrowser(renderer.binary);
  const versionInfo = await (await fetch(`http://127.0.0.1:${cdpPort}/json/version`)).json();
  const browserVersion = versionInfo.Browser || "unknown";
  if (browserVersion !== `HeadlessChrome/${renderer.browserVersion}`) {
    proc.kill("SIGKILL");
    server.close();
    throw new Error(`Renderer identifies as "${browserVersion}", not the governed HeadlessChrome/${renderer.browserVersion}.`);
  }
  const targets = await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json();
  const target = targets.find((t) => t.type === "page");
  const cdp = await CDP.connect(target.webSocketDebuggerUrl);

  const rows = [];
  const blocked = [];
  try {
    await installInterception(cdp, blocked);

    for (const st of states) {
      const scenario = SCENARIOS[st.scenario];
      if (!scenario) throw new Error(`Unknown scenario "${st.scenario}"`);
      const vp = FLOOR_VIEWPORTS[st.view];

      await cdp.send("Page.removeScriptToEvaluateOnNewDocument", { identifier: "1" }).catch(() => {});
      const { identifier } = await cdp.send("Page.addScriptToEvaluateOnNewDocument", {
        source: buildStubScript(resolvePayloads(scenario)),
      });

      await cdp.send("Emulation.setDeviceMetricsOverride", {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: vp.dsf,
        mobile: vp.mobile,
      });
      await cdp.send("Emulation.setLocaleOverride", { locale: "en-US" }).catch(() => {});
      await cdp.send("Emulation.setTimezoneOverride", { timezoneId: "UTC" }).catch(() => {});
      // reduced-motion is load-bearing and not cosmetic: the app's scroll to the
      // result is smooth under motion and instant under reduce, and a measurement
      // taken mid-scroll is a measurement of nothing.
      await cdp
        .send("Emulation.setEmulatedMedia", {
          features: [
            { name: "prefers-color-scheme", value: "light" },
            { name: "prefers-reduced-motion", value: "reduce" },
          ],
        })
        .catch(() => {});

      const nav = resolveNavigation(scenario);
      await cdp.send("Page.navigate", { url: `${origin}${nav.path}` });
      await waitUntil(cdp, "document.readyState === 'complete'", { label: "document ready" });
      const ready = resolveReadiness(nav.page);
      await waitUntil(cdp, `__qa.mounted(${JSON.stringify(ready.rendered)})`, { label: `rendered ${nav.page}` });
      await runSteps(cdp, scenario.steps);
      await settle(cdp);

      const m = await evaluate(cdp, measureExpression(st.sel, vp.height));
      if (m && m.error) throw new Error(`${st.floor}: ${m.error}`);
      rows.push({ ...st, fold: vp.height, browserVersion, ...m });
      log(`  measured ${st.floor.padEnd(30)} via ${st.scenario} @ ${st.view}`);

      await cdp.send("Page.removeScriptToEvaluateOnNewDocument", { identifier });
    }
  } finally {
    cdp.close();
    proc.kill("SIGKILL");
    server.close();
    try {
      const fs = await import("node:fs");
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch {
      /* best effort */
    }
  }
  if (blocked.length) log(`\n  (blocked ${blocked.length} off-allowlist request(s))`);
  return rows;
}

// ── The side-by-side ─────────────────────────────────────────────────────────
// The acceptance law gates on four things: pre-answer blocks, answer-in-first-screen,
// claim→proof screens, and total screens (which per founder ruling 2 is claim→proof
// normalized by viewport height, not a separate metric). §4's other three columns are
// reported, not gated. Both sets print; the split governs only the exit code, and a
// reported miss is still a miss and still prints as one.
const GATED = new Set(["blocks", "answer in first screen", "claim→proof px", "screens"]);

const n = (v) => (v === null || v === undefined ? "—" : String(v));
const cell = (got, floorVal, betterIsLower = true) => {
  if (got === null || got === undefined) return `— / ${floorVal}  no ref`;
  const ok = betterIsLower ? got <= floorVal : got === floorVal;
  return `${got} / ${floorVal}  ${ok ? "meets" : "MISSES"}`;
};

// Widths are measured off the content, not guessed. A table whose columns run into each
// other is a table nobody reads, and the whole point of the return is that it is read.
function table(header, body) {
  const all = [header, ...body];
  const w = header.map((_, i) => Math.max(...all.map((row) => String(row[i]).length)));
  return all.map((row) => row.map((c, i) => (i === 0 ? String(c).padEnd(w[i]) : String(c).padStart(w[i]))).join("  ")).join("\n");
}

function report(rows) {
  log("\n── The eight-state floor, measured against the frozen after column ──\n");
  const H = ["state", "blocks", "finding px", "answer px", "mark px", "in screen", "c→p px", "screens"];
  const misses = [];
  const reported = [];
  const standIn = [];
  const body = [];
  for (const r of rows) {
    const f = FLOOR[r.floor];
    const inFold = r.answer_px === null ? `— / yes  no ref` : `${r.answer_in_fold ? "yes" : "NO"} / yes  meets`;
    // `finding px` prints its raw number always. Where the element under `claim` is a
    // stand-in it prints with a * and is not scored, because scoring a stand-in against
    // the floor's own element would be reporting a mapping difference as a regression.
    const findingCell = r.sel.claim_referent
      ? `${n(r.finding_px)} / ${f.finding}  *stand-in`
      : cell(r.finding_px, f.finding);
    body.push([
      r.floor,
      cell(r.blocks_before, f.blocks),
      findingCell,
      cell(r.answer_px, f.answer),
      cell(r.first_mark_px, f.mark),
      inFold,
      cell(r.claim_to_proof_px, f.c2p),
      cell(r.claim_to_proof_screens, f.screens),
    ]);
    const check = (name, got, floorVal) => {
      if (got === null || got === undefined) return;
      if (got <= floorVal) return;
      (GATED.has(name) ? misses : reported).push(`${r.floor} · ${name}: ${got} > ${floorVal}`);
    };
    check("blocks", r.blocks_before, f.blocks);
    if (r.sel.claim_referent) {
      standIn.push(`${r.floor} · finding px: ${n(r.finding_px)} against ${f.finding} — ${r.sel.claim_referent}`);
    } else {
      check("finding px", r.finding_px, f.finding);
    }
    check("answer px", r.answer_px, f.answer);
    check("first mark px", r.first_mark_px, f.mark);
    check("claim→proof px", r.claim_to_proof_px, f.c2p);
    check("screens", r.claim_to_proof_screens, f.screens);
    if (r.answer_px !== null && !r.answer_in_fold) {
      misses.push(`${r.floor} · answer in first screen: no, floor says yes`);
    }
  }
  log(table(H, body));

  log("\n── Working figures ──\n");
  log(
    table(
      ["state", "scenario", "origin", "scrollY", "pinned", "above", "region h"],
      rows.map((r) => [
        r.floor,
        r.scenario,
        n(r.origin_px),
        n(r.scroll_y),
        n(r.pinned_px),
        n(r.blocks_above_region),
        n(r.region_px),
      ]),
    ),
  );

  const subs = rows.filter((r) => r.substitution && r.substitution !== "As above.");
  if (subs.length) {
    log("\n── Substitutions, named ──");
    for (const s of subs) log(`\n  ${s.floor}\n    ${s.substitution.replace(/\s+/g, " ")}`);
  }

  if (standIn.length) {
    log("\n── * finding px: measured, printed, not scored ──\n");
    log("  The floor's finding px is the offset of direction B's Z1.4, a prose claim headline");
    log("  placed ABOVE the arithmetic count line (Z2.1). Production carries the arithmetic");
    log("  first and no prose claim headline at all, so there is no like-for-like element to");
    log("  measure. Reported under founder ruling 10, not self-cleared:\n");
    for (const s of standIn) log(`    * ${s}`);
  }

  log("\n── Verdict ──\n");
  if (misses.length) {
    log(`  ${misses.length} GATED cell(s) miss the floor:`);
    for (const m of misses) log(`    ✗ ${m}`);
  } else {
    log("  Gated: every cell with a production referent meets or beats its frozen floor cell.");
    log("  (blocks · answer in first screen · claim→proof px · screens)");
  }
  if (reported.length) {
    log(`\n  ${reported.length} reported-column cell(s) miss the floor:`);
    for (const m of reported) log(`    ✗ ${m}`);
  }
  const noRef = rows.filter((r) => r.first_mark_px === null || r.answer_px === null);
  if (noRef.length) {
    log(`\n  ${noRef.length} state(s) carry a cell with no production referent — see the table.`);
  }
  return misses;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const rows = await measure();
  const misses = report(rows);
  if (process.argv.includes("--json")) log(`\n${JSON.stringify(rows, null, 2)}`);
  process.exitCode = misses.length ? 1 : 0;
}
