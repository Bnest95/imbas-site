// What repaints a board frame that contains no changed element?
//
//   node scripts/qa/height-raster-proof.mjs --mode tail   # is it document height?
//   node scripts/qa/height-raster-proof.mjs --mode top    # is it sub-pixel phase?
//   node scripts/qa/height-raster-proof.mjs --scenario register-overflow-expanded --view desktop
//
// A CONTROLLED SEQUENCE, not an assertion. Some frames this lane moved contain no changed
// element and still differ from their baseline, with every differing pixel within a few
// levels. Document height was the standing explanation for that. It is a hypothesis about
// a mechanism, so it gets tested rather than repeated.
//
// ── The experiment ───────────────────────────────────────────────────────────
// One browser, one page load, one scroll anchor, one variable. An empty block is inserted
// and its height swept; it paints nothing, so the only thing it contributes is geometry.
//
//   --mode tail   appends the block after everything. The document gets taller and
//                 nothing else changes at all.
//   --mode top    puts the block before everything, so the whole page moves down by the
//                 height set, then re-anchors the scroll to the same element — which puts
//                 every painted thing back at the same viewport position. A whole CSS
//                 pixel should therefore change nothing; a fraction leaves the same
//                 content on a different device-pixel phase.
//
// Both modes are preceded by a control: two captures with nothing changed between them,
// which must be byte-identical or nothing measured afterwards can be attributed.
//
// ── Result on this board, both viewports ─────────────────────────────────────
// tail, to +200px:      0 pixels differ. Document height is NOT the mechanism.
// top, 1px and 2px:     0 pixels differ. Whole-pixel displacement is not either.
// top, 0.5/0.25/0.1px:  thousands to >100k pixels differ, most within two levels.
//
// So a frame with no changed element on it repaints when something ABOVE it changed height
// by a fraction of a CSS pixel, which re-phases every glyph and hairline below against the
// device pixel grid (dsf 2 desktop, dsf 3 mobile). Text sized in rem lands on fractional
// heights as a matter of course, so any inserted copy does this.

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
import { decodePng } from "./raster-policy.mjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const log = (s = "") => process.stdout.write(`${s}\n`);
const arg = (name, dflt) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? dflt : process.argv[i + 1];
};

const SCENARIO = arg("scenario", "single-empty");
const VIEW = arg("view", "mobile");
// tail: the block goes after everything, so only the document gets taller.
// top:  the block goes before everything, so the whole page moves down by exactly the
//       height set — and the scroll is then re-anchored to the same element, which puts
//       every painted thing back at the same place in the viewport. Whole CSS pixels
//       should therefore change nothing at all; fractions land the same content on a
//       different device-pixel phase. That is the second candidate mechanism, and the
//       two modes separate them.
const MODE = arg("mode", "tail");
const DELTAS = MODE === "top" ? [1, 2, 0.5, 0.25, 0.1] : [1, 2, 8, 64, 200];

const SPACER_ID = "__height-probe";
const addSpacer = (px) => `(() => {
  let el = document.getElementById(${JSON.stringify(SPACER_ID)});
  if (!el) {
    el = document.createElement("div");
    el.id = ${JSON.stringify(SPACER_ID)};
    el.style.cssText = "display:block;width:1px;background:none;border:0;margin:0;padding:0;";
    ${MODE === "top" ? "document.body.insertBefore(el, document.body.firstChild);" : "document.body.appendChild(el);"}
  }
  el.style.height = ${JSON.stringify(px)} + "px";
  return {
    docHeight: document.documentElement.scrollHeight,
    scrollY: Math.round(window.scrollY),
  };
})()`;

const readState = `(() => ({
  docHeight: document.documentElement.scrollHeight,
  scrollY: Math.round(window.scrollY),
}))()`;

async function shoot(cdp) {
  const shot = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  return decodePng(Buffer.from(shot.data, "base64"));
}

// The same two axes the frame classifier uses, so the numbers here are comparable with
// the numbers reported for the board's own frames.
function compare(a, b) {
  if (a.width !== b.width || a.height !== b.height) return { dims: false };
  const stride = a.width * 4;
  let count = 0;
  let maxDelta = 0;
  let faint = 0;
  let big = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    const d = Math.max(
      Math.abs(a.data[i] - b.data[i]),
      Math.abs(a.data[i + 1] - b.data[i + 1]),
      Math.abs(a.data[i + 2] - b.data[i + 2]),
    );
    if (!d) continue;
    count++;
    if (d > maxDelta) maxDelta = d;
    if (d <= 2) faint++;
    if (d > 16) big++;
  }
  return {
    dims: true,
    count,
    pct: +((100 * count) / (a.width * a.height)).toFixed(3),
    maxDelta,
    faintPct: count ? +((100 * faint) / count).toFixed(1) : 0,
    big,
    pixels: (a.width * a.height),
    stride,
  };
}

async function main() {
  const scenario = SCENARIOS[SCENARIO];
  if (!scenario) throw new Error(`unknown scenario: ${SCENARIO}`);
  const vp = VIEWPORTS[VIEW];
  if (!vp) throw new Error(`unknown viewport: ${VIEW}`);

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

  try {
    await installInterception(cdp, []);
    await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: buildStubScript(resolvePayloads(scenario)) });
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
    await cdp.send("Page.navigate", { url: `http://127.0.0.1:${port}${nav.path}` });
    await waitUntil(cdp, "document.readyState === 'complete'", { label: "document ready" });
    await waitUntil(cdp, `__qa.mounted(${JSON.stringify(resolveReadiness(nav.page).rendered)})`, {
      label: `rendered ${nav.page}`,
    });
    await runSteps(cdp, scenario.steps);
    await settle(cdp);

    const focus = scenario.focus || scenario.assertSelector;
    const scrolled = await evaluate(cdp, `__qa.scrollToDeterministic(${JSON.stringify(focus)})`);
    if (!scrolled.ok) throw new Error(`cannot scroll to ${focus}: ${scrolled.why}`);
    await settle(cdp);

    const start = await evaluate(cdp, readState);
    log("");
    log(`scenario ${SCENARIO} @ ${VIEW} (${vp.width}x${vp.height} dsf ${vp.dsf})`);
    log(`focus ${focus}, scrolled to ${start.scrollY}, document ${start.docHeight}px`);
    log("");

    // A. Twice, before touching anything. Two captures of an untouched page must be
    // byte-identical or the instrument cannot attribute a later difference to the one
    // variable — this is the control, and it runs first so a noisy renderer is caught
    // before any conclusion rests on it.
    const a1 = await shoot(cdp);
    await settle(cdp);
    const a2 = await shoot(cdp);
    const control = compare(a1, a2);
    log(`control  two captures, nothing changed between them`);
    log(`         ${control.count} of ${control.pixels} pixels differ` + (control.count ? "  ← THE INSTRUMENT IS NOISY" : "  — identical, so any difference below is caused by the variable"));
    log("");

    if (control.count) {
      log("Stopping: a difference measured against a noisy control proves nothing.");
      process.exitCode = 1;
      return;
    }

    log(`added height   pixels differing        %   max Δ   faint%   >16 levels   document`);
    for (const px of DELTAS) {
      const s = await evaluate(cdp, addSpacer(px));
      await settle(cdp);
      // In top mode the page really did move, so the scroll is re-anchored to the same
      // element — that is the point of the mode, and without it this would be measuring
      // a scrolled page rather than a re-phased one.
      if (MODE === "top") {
        const re = await evaluate(cdp, `__qa.scrollToDeterministic(${JSON.stringify(focus)})`);
        if (!re.ok) throw new Error(`cannot re-anchor to ${focus}: ${re.why}`);
        await settle(cdp);
      }
      const landed = await evaluate(cdp, readState);
      if (MODE !== "top" && landed.scrollY !== start.scrollY) {
        log(`  ${String(px).padStart(4)}px   scroll moved ${start.scrollY} → ${landed.scrollY}; not a controlled comparison`);
        continue;
      }
      const b = await shoot(cdp);
      const d = compare(a1, b);
      log(
        `  ${String(px).padStart(4)}px   ${String(d.count).padStart(16)}   ${String(d.pct).padStart(6)}   ` +
          `${String(d.maxDelta).padStart(5)}   ${String(d.faintPct).padStart(6)}   ${String(d.big).padStart(10)}   ` +
          `${s.docHeight}px${MODE === "top" ? ` @${landed.scrollY}` : ""}`,
      );
    }

    // Put it back and prove the page returned to exactly where it started. Without this
    // the sweep could be measuring drift that accumulated across the captures rather than
    // the height it set each time.
    await evaluate(cdp, addSpacer(0));
    await settle(cdp);
    const back = await shoot(cdp);
    const restored = compare(a1, back);
    log("");
    log(
      `restored to 0px: ${restored.count} pixels differ from the first capture` +
        (restored.count === 0 ? " — the sweep left no residue" : " ← residue, treat the sweep as suspect"),
    );
    log("");
    log(`Renderer: ${version}`);
  } finally {
    cdp.close?.();
    proc.kill("SIGKILL");
    server.close();
  }
}

main().catch((e) => {
  log(String(e && e.stack ? e.stack : e));
  process.exitCode = 1;
});
