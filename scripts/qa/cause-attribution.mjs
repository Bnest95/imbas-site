// Which of this lane's changes is actually on each frame the board flagged.
//
//   node scripts/qa/cause-attribution.mjs
//   node scripts/qa/cause-attribution.mjs --json
//
// READ-ONLY. It renders each flagged scenario at its own viewport and counts elements.
// It reads no baseline for acceptance and writes none.
//
// ── Why this exists ──────────────────────────────────────────────────────────
// The board says 53 frames differ. "Differ how" is answered by frame-movement.mjs.
// "Differ because of WHICH change" is a different question, and the honest answer to it
// is a count of what is on the page — not an inference from which item of the brief
// seems most likely to have touched that screen.
//
// Each frame is scored against the four surfaces this lane changed. A frame carrying
// only recoloured elements cannot have moved because of an insertion, and a frame
// carrying an insertion is not explained by a colour change alone.

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
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const AS_JSON = process.argv.includes("--json");
const log = (s = "") => process.stdout.write(`${s}\n`);

// The frames the compare-only board flagged, given explicitly. Reading them back out of
// the board's own log would make this instrument depend on that log's wording.
const FLAGGED = fs
  .readFileSync(path.join(REPO_ROOT, "scripts/qa/flagged-frames.txt"), "utf8")
  .split("\n")
  .map((s) => s.trim())
  .filter((s) => s && !s.startsWith("#"));

// A — item 1, the capability orientation strip.
// B — items 2 and 3, the chip lane's way back and its origin reference.
// C — item 5, the share surface's orientation line.
// D — item 6, the nine declarations whose colour this lane changed. Listed as the
//     selectors the stylesheet actually carries, so a rule that moved is caught by a
//     miss here rather than by a silent zero.
const CAUSES = {
  A: [".wb-capstrip"],
  B: [".wb-chip__return", ".wb-chip__origin"],
  C: [".insp-actions__orientation"],
  D: [
    '.insp-receipt__section[data-state="NOT_DECLARED"] .insp-receipt__section-title',
    '.insp-receipt__section[data-state="NOT_DECLARED"] .insp-receipt__note',
    ".insp-report__privacy",
    ".wb-prov__label",
    '.wb-prov__row[data-known="no"] .wb-prov__value',
    ".wb-mark-n",
    ".wb-act2__reading-label",
    ".wb-loop__smallprint",
    ".wb-shell--reader-v2 .wb-reader-confirm .wb-reader-v2__field--optional .wb-field-label",
  ],
};

const COUNT_SOURCE = `((sets) => {
  const out = {};
  for (const [cause, selectors] of Object.entries(sets)) {
    let n = 0;
    const hit = [];
    for (const sel of selectors) {
      const found = document.querySelectorAll(sel).length;
      if (found) hit.push(sel + " ×" + found);
      n += found;
    }
    out[cause] = { n, hit };
  }
  return out;
})(${JSON.stringify(CAUSES)})`;

async function probe(cdp, origin, id) {
  const at = id.lastIndexOf("--");
  const scenarioName = id.slice(0, at);
  const viewportName = id.slice(at + 2);
  const scenario = SCENARIOS[scenarioName];
  if (!scenario) throw new Error(`unknown scenario: ${scenarioName}`);
  const vp = VIEWPORTS[viewportName];
  if (!vp) throw new Error(`unknown viewport: ${viewportName}`);

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

  const counts = await evaluate(cdp, COUNT_SOURCE);
  await cdp.send("Page.removeScriptToEvaluateOnNewDocument", { identifier: stub.identifier }).catch(() => {});

  const present = Object.entries(counts)
    .filter(([, v]) => v.n > 0)
    .map(([k]) => k);
  return { id, counts, present };
}

async function main() {
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
    for (const id of FLAGGED) rows.push(await probe(cdp, origin, id));
  } finally {
    cdp.close?.();
    proc.kill("SIGKILL");
    server.close();
  }

  if (AS_JSON) {
    log(JSON.stringify({ renderer: `HeadlessChrome/${renderer.browserVersion}`, rows }, null, 2));
    return;
  }

  log(`${"frame".padEnd(38)} ${"A".padStart(4)} ${"B".padStart(4)} ${"C".padStart(4)} ${"D".padStart(5)}  causes`);
  log("─".repeat(90));
  for (const r of rows) {
    log(
      `${r.id.padEnd(38)} ${String(r.counts.A.n).padStart(4)} ${String(r.counts.B.n).padStart(4)} ` +
        `${String(r.counts.C.n).padStart(4)} ${String(r.counts.D.n).padStart(5)}  ${r.present.join("+") || "none"}`,
    );
  }

  const tally = {};
  for (const r of rows) {
    const key = r.present.join("+") || "none";
    tally[key] = (tally[key] || 0) + 1;
  }
  log("");
  log("── frames by cause set ──");
  for (const [k, v] of Object.entries(tally).sort((a, b) => b[1] - a[1])) {
    log(`  ${String(v).padStart(3)}  ${k}`);
  }
  const unexplained = rows.filter((r) => r.present.length === 0);
  log("");
  log(`Renderer: HeadlessChrome/${renderer.browserVersion}`);
  log(
    unexplained.length === 0
      ? `All ${rows.length} flagged frames carry at least one surface this lane changed. No frame moved for a reason this lane cannot name.`
      : `${unexplained.length} frame(s) carry NONE of this lane's changed surfaces: ${unexplained.map((r) => r.id).join(", ")}. That is unexplained movement and a STOP.`,
  );
  if (unexplained.length) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
