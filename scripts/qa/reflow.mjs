// Narrow-width reflow for the surfaces this lane changed.
//
//   node scripts/qa/reflow.mjs
//   node scripts/qa/reflow.mjs --json
//
// A MEASUREMENT instrument, not the acceptance board: no baseline, no byte comparison,
// nothing written under docs/qa.
//
// ── What it answers ──────────────────────────────────────────────────────────
// Four items added visible elements — a capability strip under the result hero, a return
// control and an origin block in the chip lane, an orientation line above the share's
// action row — and every one of them is text that can be too wide. The question at a
// narrow width is not whether they look right; it is whether they made the page scroll
// sideways, which is the failure a person cannot work around.
//
// Two widths. 390 is the board's mobile viewport, so a failure here would also be a
// failure on a governed frame. 320 is WCAG 1.4.10's reflow width, which no board frame
// covers — the narrowest width the content is required to work at.
//
// ── Attribution, which is the whole design ───────────────────────────────────
// "The document scrolls sideways at 320" is not by itself a finding about this lane. So
// every run reports the document's own overflow AND the widest element causing it, and
// separately measures each element this lane introduced against the viewport. A page
// that already overflowed at 320 is reported as exactly that, with the element named,
// rather than being charged to the new copy sitting on it.

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
const AS_JSON = process.argv.includes("--json");

// 390 is the board's mobile frame; 320 is the WCAG reflow width. Heights are the board's
// mobile height and a short one, since reflow is a width question.
const VIEWS = {
  390: { width: 390, height: 844, dsf: 1, mobile: true },
  320: { width: 320, height: 640, dsf: 1, mobile: true },
};

// Sub-pixel layout rounding puts a full-bleed element a fraction over the viewport on
// some widths. One pixel absorbs that and nothing larger: a real overflow is many.
const SLACK = 1;

// The elements this lane put on the page, by the item that added them. Absent is not a
// failure — most scenarios render only some of these — but a present one that overflows
// is this lane's to answer for.
const OWNED = {
  1: [".wb-capstrip", ".wb-capstrip__label", ".wb-capstrip__link"],
  2: [".wb-chip__return", ".wb-chip__return-btn"],
  3: [".wb-chip__origin", ".wb-chip__origin-label", ".wb-chip__origin-question", ".wb-chip__origin-note"],
  5: [".insp-actions__orientation"],
};
const ALL_OWNED = [...new Set(Object.values(OWNED).flat())];

// Which scenarios exercise which items. `openLane` presses the chip door first, because
// the return control and the origin block do not exist until the lane is open — and
// chip-arrival, which opens with no inspection behind it, renders no origin block at all.
const CASES = [
  { scenario: "single-findings", items: [1, 2, 3], openLane: true },
  { scenario: "single-empty", items: [1], openLane: false },
  { scenario: "paired-matched", items: [1], openLane: false },
  { scenario: "register-overflow", items: [1], openLane: false },
  { scenario: "chip-arrival", items: [2], openLane: false },
  { scenario: "share-single", items: [5], openLane: false },
  { scenario: "share-paired-no-model", items: [5], openLane: false },
];

const q = (s) => JSON.stringify(s);

// One round trip: the document's own overflow, the widest element responsible for it,
// and the rect of every element this lane owns that is currently on the page.
const MEASURE = (owned) => `(() => {
  const de = document.documentElement;
  const vw = window.innerWidth;
  const docWidth = Math.max(de.scrollWidth, document.body ? document.body.scrollWidth : 0);

  // The widest offender, so an overflow can be attributed rather than merely reported.
  // Elements with no box and those clipped by an ancestor are skipped: an element inside
  // an overflow:hidden or overflow:auto box cannot widen the document.
  let worst = null;
  const clipped = (el) => {
    for (let p = el.parentElement; p; p = p.parentElement) {
      const o = getComputedStyle(p).overflowX;
      if (o === "hidden" || o === "auto" || o === "scroll" || o === "clip") return true;
    }
    return false;
  };
  for (const el of document.body.querySelectorAll("*")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    const over = Math.round(r.right - vw);
    if (over <= ${SLACK}) continue;
    if (clipped(el)) continue;
    if (!worst || over > worst.over) {
      worst = {
        over,
        tag: el.tagName.toLowerCase(),
        cls: (typeof el.className === "string" ? el.className : "") .slice(0, 80),
        width: Math.round(r.width),
      };
    }
  }

  const owned = {};
  for (const sel of ${JSON.stringify(owned)}) {
    const els = [...document.querySelectorAll(sel)];
    if (!els.length) { owned[sel] = { present: 0 }; continue; }
    let right = -Infinity;
    let left = Infinity;
    let width = 0;
    for (const el of els) {
      const r = el.getBoundingClientRect();
      right = Math.max(right, r.right);
      left = Math.min(left, r.left);
      width = Math.max(width, r.width);
    }
    owned[sel] = {
      present: els.length,
      right: Math.round(right),
      left: Math.round(left),
      width: Math.round(width),
      overflows: Math.round(right) > vw + ${SLACK} || Math.round(left) < -${SLACK},
    };
  }

  return { vw, docWidth, docOverflow: Math.max(0, docWidth - vw), worst, owned };
})()`;

const clickDoor = `(() => {
  const el = document.querySelector(".wb-chip-door");
  if (!el) return { ok: false };
  el.click();
  return { ok: true };
})()`;

const rows = [];
let failures = 0;
let stubId = null;

async function measure(cdp, caseDef, viewKey) {
  const vp = VIEWS[viewKey];
  const scenario = SCENARIOS[caseDef.scenario];
  if (!scenario) throw new Error(`unknown scenario: ${caseDef.scenario}`);

  // Remove the PREVIOUS scenario's stub by the identifier the browser gave for it. Every
  // case here runs a different scenario down one page target, and stubs left stacked would
  // let one scenario's payloads answer another scenario's reads.
  if (stubId) await cdp.send("Page.removeScriptToEvaluateOnNewDocument", { identifier: stubId }).catch(() => {});
  const added = await cdp.send("Page.addScriptToEvaluateOnNewDocument", {
    source: buildStubScript(resolvePayloads(scenario)),
  });
  stubId = added.identifier;
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
  await cdp.send("Page.navigate", { url: `${nav.path.startsWith("http") ? "" : cdp.__origin}${nav.path}` });
  await waitUntil(cdp, "document.readyState === 'complete'", { label: "document ready" });
  await waitUntil(cdp, `__qa.mounted(${JSON.stringify(resolveReadiness(nav.page).rendered)})`, {
    label: `rendered ${nav.page}`,
  });
  await runSteps(cdp, scenario.steps);
  await settle(cdp);

  if (caseDef.openLane) {
    const opened = await evaluate(cdp, clickDoor);
    if (!opened.ok) throw new Error(`${caseDef.scenario}: no chip door to open`);
    await waitUntil(cdp, `!document.querySelector("#wb-chip-lane").hidden`, { label: "lane visible" });
    await settle(cdp);
  }

  const owned = [...new Set(caseDef.items.flatMap((i) => OWNED[i]))];
  const m = await evaluate(cdp, MEASURE(owned));

  const offenders = Object.entries(m.owned).filter(([, v]) => v.overflows);
  const present = Object.entries(m.owned).filter(([, v]) => v.present > 0);
  const ok = offenders.length === 0;
  if (!ok) failures += 1;

  rows.push({
    scenario: caseDef.scenario,
    view: Number(viewKey),
    items: caseDef.items,
    viewportWidth: m.vw,
    documentWidth: m.docWidth,
    documentOverflowPx: m.docOverflow,
    widestOffender: m.worst,
    owned: m.owned,
    ownedOverflowing: offenders.map(([sel]) => sel),
    pass: ok,
  });

  const laneNote = caseDef.openLane ? " (lane open)" : "";
  log(
    `  ${ok ? "PASS" : "FAIL"}  ${caseDef.scenario}${laneNote} @ ${viewKey}  ` +
      `— items ${caseDef.items.join("/")}; ${present.length}/${Object.keys(m.owned).length} present; ` +
      `document ${m.docWidth}px in ${m.vw}px`,
  );
  if (m.docOverflow > SLACK) {
    const w = m.worst;
    log(
      `        the document itself overflows by ${m.docOverflow}px` +
        (w ? `, widest element <${w.tag} class="${w.cls}"> at ${w.width}px, ${w.over}px past the edge` : ""),
    );
    const mine = w && ALL_OWNED.some((sel) => w.cls.split(/\s+/).includes(sel.slice(1)));
    log(`        attribution: ${mine ? "THIS LANE" : "pre-existing — no element of this lane is the widest offender"}`);
  }
  for (const [sel, v] of present) {
    log(`        ${sel} ×${v.present}: ${v.width}px wide, right edge ${v.right} of ${m.vw}${v.overflows ? "  ← OVERFLOWS" : ""}`);
  }
}

// Setup is a copy of scripts/qa/chip-lane-return.mjs, deliberately: the board's own
// renderer identity check runs here too, so a measurement taken on some other Chrome
// cannot be quoted beside the board's numbers as though they came off one instrument.
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
  cdp.__origin = `http://127.0.0.1:${port}`;

  try {
    await installInterception(cdp, []);
    for (const viewKey of Object.keys(VIEWS)) {
      log("");
      log(`── ${viewKey}px ──────────────────────────────────────────────────────`);
      for (const caseDef of CASES) await measure(cdp, caseDef, viewKey);
    }
  } finally {
    cdp.close?.();
    proc.kill("SIGKILL");
    server.close();
  }

  log("");
  log(`Renderer: ${version}`);
  log(`${rows.length - failures} of ${rows.length} measurements clear of overflow.`);
  if (AS_JSON) log(JSON.stringify({ renderer: version, slack: SLACK, rows }, null, 2));
  process.exitCode = failures === 0 ? 0 : 1;
}

main().catch((err) => {
  log(`reflow: ${err && err.stack ? err.stack : err}`);
  process.exitCode = 1;
});
