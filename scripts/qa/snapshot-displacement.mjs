// Did the board's snapshot lose content, or did the content leave the photograph?
//
//   node scripts/qa/snapshot-displacement.mjs
//   node scripts/qa/snapshot-displacement.mjs --id share-consent--mobile
//
// READ-ONLY. Opens the committed baseline snapshots, re-renders each scenario, and writes
// nothing to docs/qa. No baseline is read for acceptance and none is written.
//
// ── Why this exists ──────────────────────────────────────────────────────────
// The board's text snapshot records only what is VISIBLE INSIDE THE CAPTURED RECTANGLE
// (scripts/qa/snapshot.mjs, EXTRACTOR_SOURCE). The board photographs a window, not the
// page. So when something is inserted above, whatever sat at the bottom of that window is
// pushed out of it and the snapshot diff prints it with a leading minus — identical in
// form to the diff you would get if the element had been deleted from the product.
//
// On this lane that produced lines like `- span "Omission"` and
// `- button "Mixes facts with assumptions"`, both of which name things the brief forbids
// touching. Read literally they say the lane deleted them. That reading has to be settled
// with a measurement, not with an assurance.
//
// ── The discriminator ────────────────────────────────────────────────────────
// Two extractions of the same rendered page at the same scroll:
//   VIEWPORT   the board's own extractor, unmodified — what the photograph can see.
//   DOCUMENT   the same extractor with its region test relaxed to "has a box" — what the
//              page actually contains, in or out of frame.
// Every baseline line missing from VIEWPORT is then looked for in DOCUMENT:
//   present  → DISPLACED. Still rendered; it left the window, not the page.
//   absent   → REMOVED. Real content loss, and the thing worth stopping for.

import { SCENARIOS, resolvePayloads } from "./scenarios.mjs";
import {
  CDP,
  VIEWPORTS,
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
import { EXTRACTOR_SOURCE, diffLines, normalizeEntries, parseSnapshot } from "./snapshot.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const BASELINES = path.join(REPO_ROOT, "docs/qa/visual-acceptance-harness");
const AS_JSON = process.argv.includes("--json");
const log = (s = "") => process.stdout.write(`${s}\n`);
const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? null : process.argv[i + 1];
};

// The frames whose snapshot moved in the compare-only run. Given explicitly rather than
// discovered, because re-rendering all 70 to find 10 costs a board run and answers nothing
// the board did not already print.
const DEFAULT_IDS = [
  "single-findings--desktop",
  "deposit-fixture--desktop",
  "deposit-fixture--mobile",
  "single-empty--desktop",
  "export-paired--mobile",
  "share-receipt--desktop",
  "share-consent--desktop",
  "share-consent--mobile",
  "chip-arrival--desktop",
  "chip-arrival--mobile",
];

// The board's extractor with one line changed: an element qualifies on having a painted
// box, wherever that box sits. The substitution is asserted rather than assumed — if
// snapshot.mjs is reworded, this must fail loudly instead of quietly measuring the
// viewport twice and reporting every line as displaced.
const REGION_TEST = "const inRegion = r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < H && r.right > 0 && r.left < W;";
const DOCUMENT_TEST = "const inRegion = r.width > 0 && r.height > 0;";
if (!EXTRACTOR_SOURCE.includes(REGION_TEST)) {
  throw new Error(
    "The board extractor no longer contains the region test this script relaxes. Re-read " +
      "scripts/qa/snapshot.mjs EXTRACTOR_SOURCE and update REGION_TEST before trusting any " +
      "result from here.",
  );
}
const DOCUMENT_EXTRACTOR = EXTRACTOR_SOURCE.replace(REGION_TEST, DOCUMENT_TEST);

const GEOMETRY = `(() => ({
  scrollY: Math.round(window.scrollY),
  viewportHeight: window.innerHeight,
  documentHeight: document.documentElement.scrollHeight,
}))()`;

async function probe(cdp, origin, id) {
  const at = id.lastIndexOf("--");
  const scenarioName = id.slice(0, at);
  const viewportName = id.slice(at + 2);
  const scenario = SCENARIOS[scenarioName];
  if (!scenario) throw new Error(`unknown scenario: ${scenarioName}`);
  const vp = VIEWPORTS[viewportName];
  if (!vp) throw new Error(`unknown viewport: ${viewportName}`);

  const baseline = parseSnapshot(fs.readFileSync(path.join(BASELINES, `${id}.snapshot.txt`), "utf8"));

  const stub = await cdp.send("Page.addScriptToEvaluateOnNewDocument", {
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
  await waitUntil(cdp, `__qa.mounted(${JSON.stringify(resolveReadiness(nav.page).rendered)})`, {
    label: `rendered ${nav.page}`,
  });
  await runSteps(cdp, scenario.steps);
  await settle(cdp);

  // The board scrolls to the focus target before it shoots. Reproducing that is the whole
  // point: the window has to be the same window, or "outside the window" means nothing.
  const focus = scenario.focus || scenario.assertSelector;
  const scrolled = await evaluate(cdp, `__qa.scrollToDeterministic(${JSON.stringify(focus)})`);
  if (!scrolled.ok) throw new Error(`${id}: cannot scroll to ${focus}`);
  await settle(cdp);

  const geometry = await evaluate(cdp, GEOMETRY);
  const viewportLines = normalizeEntries(await evaluate(cdp, EXTRACTOR_SOURCE), origin);
  const documentLines = normalizeEntries(await evaluate(cdp, DOCUMENT_EXTRACTOR), origin);
  await cdp.send("Page.removeScriptToEvaluateOnNewDocument", { identifier: stub.identifier }).catch(() => {});

  // What the board would report for this frame, recomputed here rather than parsed out of
  // its log, so this instrument stands on its own render.
  // A "changed" op is a removed line paired with an added one by position, so its `from`
  // side is a baseline line that is no longer in the window and belongs in this count.
  const d = diffLines(baseline.render, viewportLines);
  const gone = [...d.removed.map((o) => o.line), ...d.changed.map((o) => o.from)];

  const inDocument = new Set(documentLines);
  const displaced = gone.filter((l) => inDocument.has(l));
  const removed = gone.filter((l) => !inDocument.has(l));

  return {
    id,
    focus,
    scrollY: geometry.scrollY,
    viewportHeight: geometry.viewportHeight,
    documentHeight: geometry.documentHeight,
    baselineLines: baseline.render.length,
    viewportLines: viewportLines.length,
    documentLines: documentLines.length,
    goneFromViewport: gone.length,
    displaced,
    removed,
  };
}

async function main() {
  const ids = arg("id") ? [arg("id")] : DEFAULT_IDS;
  const renderer = resolveBrowser();
  const { server, port } = await startStaticServer(REPO_ROOT);
  const { proc, port: cdpPort } = await launchBrowser(renderer.binary);
  const versionInfo = await (await fetch(`http://127.0.0.1:${cdpPort}/json/version`)).json();
  const version = versionInfo.Browser || "unknown";
  if (version !== `HeadlessChrome/${renderer.browserVersion}`) {
    proc.kill("SIGKILL");
    server.close();
    throw new Error(`Renderer identifies as "${version}", not the governed HeadlessChrome/${renderer.browserVersion}.`);
  }
  const targets = await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json();
  const cdp = await CDP.connect(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
  const origin = `http://127.0.0.1:${port}`;

  const rows = [];
  try {
    await installInterception(cdp, []);
    for (const id of ids) rows.push(await probe(cdp, origin, id));
  } finally {
    cdp.close?.();
    proc.kill("SIGKILL");
    server.close();
  }

  let removedTotal = 0;
  for (const r of rows) {
    removedTotal += r.removed.length;
    log("");
    log(`▶ ${r.id}`);
    log(
      `  window ${r.viewportHeight}px at scroll ${r.scrollY} of a ${r.documentHeight}px document ` +
        `— the photograph sees ${(100 * r.viewportHeight / r.documentHeight).toFixed(1)}% of the page`,
    );
    log(`  baseline ${r.baselineLines} lines; in-window now ${r.viewportLines}; on the page now ${r.documentLines}`);
    log(`  left the window: ${r.goneFromViewport}  →  displaced ${r.displaced.length}, REMOVED ${r.removed.length}`);
    for (const l of r.displaced) log(`      displaced  ${l}`);
    for (const l of r.removed) log(`      REMOVED    ${l}`);
  }

  log("");
  log(`Renderer: ${version}`);
  log(
    removedTotal === 0
      ? `Across ${rows.length} frames, every line the snapshot lost is still rendered on the page. ` +
          `No content was removed; it moved out of the photographed window.`
      : `${removedTotal} line(s) are absent from the page itself, not merely out of frame. Treat as content loss.`,
  );
  if (AS_JSON) log(JSON.stringify({ renderer: version, rows }, null, 2));
  process.exitCode = removedTotal === 0 ? 0 : 1;
}

main().catch((err) => {
  log(`snapshot-displacement: ${err && err.stack ? err.stack : err}`);
  process.exitCode = 1;
});
