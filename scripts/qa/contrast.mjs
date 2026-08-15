// Text contrast against the painted page, measured by pixel sampling.
//
//   node scripts/qa/contrast.mjs                  # every registered style, every state
//   node scripts/qa/contrast.mjs --json out.json  # also write the rows as JSON
//   node scripts/qa/contrast.mjs --state share-single --view 1440
//
// This is a MEASUREMENT instrument, not the acceptance board. It photographs to sample,
// writes no baseline, compares no bytes against one, and touches nothing in
// docs/qa/visual-acceptance-harness.
//
// ── Why pixel sampling and not axe-core ──────────────────────────────────────
// axe-core cannot answer this question on this site. Run against the Reader it returns
// zero violations and a wall of `incomplete` results, every one of them keyed
// `bgGradient` — "Element's background color could not be determined due to a background
// gradient." The umber system paints layered gradients behind almost every text style, so
// axe's background resolution gives up before it computes a single ratio. Publishing
// "0 violations" from that run would report the tool's blind spot as a result.
//
// So the background is taken from the pixels the renderer actually painted.
//
// ── Method ───────────────────────────────────────────────────────────────────
// 1. Drive a registered board scenario to its state through visual-acceptance.mjs's own
//    server, browser, stub and step machinery — one implementation of drive semantics,
//    not two.
// 2. Collect every painted instance of the registered text styles: its page-space rect,
//    its computed `color` (which keeps the declared alpha), its font size and weight.
// 3. Set `color` and `text-decoration-color` transparent on those elements ONLY, and
//    screenshot the whole document.
//    The glyphs vanish; everything painted behind them — the element's own background,
//    every ancestor, the gradients — is untouched. Every pixel inside an element's rect
//    in that frame is a background pixel it is read against. This is exact where modal
//    sampling is an estimate, and it produces the same two numbers: the modal band is
//    the most common of those pixels, the worst band is the one that gives the lowest
//    ratio.
// 4. Composite the declared rgba() foreground over each distinct background value the
//    way the compositor does — per channel, in sRGB, out = a·fg + (1−a)·bg — and take
//    the WCAG 2.x ratio.
//
// The device scale factor is 1 so that one image pixel is one CSS pixel and a rect needs
// no rescaling to be sampled.
//
// ── What it does not measure ─────────────────────────────────────────────────
// Elements that paint no pixel a person can read: zero-area rects, `<option>` children of
// a closed select, `<noscript>` content, and `aria-hidden` decoration. A ratio for an
// element nobody can see is not a finding, and treating one as a finding is what produced
// the 1.00:1 rows in the audit this instrument was written to answer.

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
import { decodePng } from "./raster-policy.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const log = (s = "") => process.stdout.write(`${s}\n`);

// ── The registered subjects ──────────────────────────────────────────────────
// The nine styles the audit measured below WCAG AA, and the states they were found on.
// The list is the sweep's input, not its output: a style that now passes still gets
// measured and still prints, because "it passes" is the finding.
//
// Text styles this lane introduced are registered here too. A remediation pass that
// shipped its own unmeasured copy would be adding to the list it was written to clear.
export const STYLES = [
  ".wb-field-label",
  ".wb-mark-n",
  ".wb-act2__reading-label",
  ".insp-receipt__section-title",
  ".insp-report__privacy",
  ".wb-prov__value",
  ".wb-loop__smallprint",
  ".wb-prov__label",
  ".insp-receipt__note",
  ".wb-capstrip__label",
  ".wb-capstrip__link",
  ".insp-actions__orientation",
  ".wb-chip__origin-label",
  ".wb-chip__origin-question",
  ".wb-chip__origin-note",
];

export const STATES = [
  "single-findings",
  "deposit-fixture",
  "paired-matched",
  "single-empty",
  "paired-empty",
  "share-single",
  "share-single-empty",
  "share-not-found",
  "read-error",
  "read-capacity",
  // Not an audit state. It is the only registered scenario that reaches the chip lane, so
  // it is where this lane's chip copy gets measured at all.
  "chip-arrival",
  "single-findings+chips",
];

// chip-arrival reaches the lane but arrives with no inspection behind it, so the origin
// block never paints there and its three styles would be registered-but-unmeasured — a
// hole that reads as a pass. This composed state presses the door on a finished single
// inspection, which is the one way that block appears. It photographs a live state the
// board does not cover; it is not a new board scenario and writes no baseline.
export const COMPOSED = {
  "single-findings+chips": { scenario: "single-findings", openLane: true },
};

const CLICK_DOOR = `(() => {
  const el = document.querySelector(".wb-chip-door");
  if (!el) return { ok: false };
  el.click();
  return { ok: true };
})()`;

// The audit's viewports, not the board's. dsf 1 so image pixels are CSS pixels.
export const VIEWS = {
  1440: { width: 1440, height: 1000, dsf: 1, mobile: false },
  390: { width: 390, height: 844, dsf: 1, mobile: true },
};

// WCAG AA for body text. Nothing in the registered set reaches the large-text threshold
// (18.66px at weight 700, or 24px at any weight), and the sweep asserts that rather than
// assuming it — `large` is reported per instance so an exemption can never be silent.
const AA_NORMAL = 4.5;
const AA_LARGE = 3.0;

// ── Colour ───────────────────────────────────────────────────────────────────
const srgbToLinear = (c) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

export function relativeLuminance([r, g, b]) {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

export function contrastRatio(a, b) {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

// How the compositor draws translucent text: per channel, in sRGB, no gamma round trip.
export function composite(fg, alpha, bg) {
  return [0, 1, 2].map((i) => Math.round(alpha * fg[i] + (1 - alpha) * bg[i]));
}

export function parseCssColor(str) {
  const m = String(str).match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,/\s]+([\d.%]+))?\s*\)/i);
  if (!m) return null;
  let a = 1;
  if (m[4] !== undefined) a = m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
  return { rgb: [Math.round(+m[1]), Math.round(+m[2]), Math.round(+m[3])], a };
}

const hex = ([r, g, b]) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
const r2 = (v) => Math.round(v * 100) / 100;

// ── In-page collection ───────────────────────────────────────────────────────
// One expression, run twice per state: once to collect and blank, once to restore. It
// keys each element by a data attribute rather than by index, so the rects it reports and
// the elements it blanked cannot drift apart across the screenshot in between.
function collectExpression(styles) {
  return `(() => {
  const SEL = ${JSON.stringify(styles)};
  const sx = window.scrollX, sy = window.scrollY;
  const out = [];
  let n = 0;
  let unpainted = 0;
  for (const sel of SEL) {
    for (const el of document.querySelectorAll(sel)) {
      const r = el.getBoundingClientRect();
      const visible = typeof el.checkVisibility === "function"
        ? el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })
        : true;
      const hidden = el.closest("[aria-hidden='true']") !== null;
      if (!visible || hidden || r.width < 1 || r.height < 1 || !el.textContent.trim()) { unpainted++; continue; }
      // getComputedStyle returns a LIVE declaration. Read every value out of it BEFORE
      // blanking the element, or the colour reported is the transparent one this loop
      // just wrote and every ratio comes back 1.00:1.
      const cs = getComputedStyle(el);
      const color = cs.color;
      const fontSize = parseFloat(cs.fontSize);
      const fontWeight = cs.fontWeight;
      const key = "c" + (n++);
      el.setAttribute("data-qa-contrast", key);
      // Descendants too. A child with its own colour rule does not inherit the blank,
      // and its glyphs would then be sampled as though they were background — which is
      // how a rect comes back reporting a 1.00:1 band that nothing is painted at.
      //
      // text-decoration-color goes with it. An underline set to currentColor disappears
      // with the glyphs, but one set to an explicit value stays painted, and its pixels
      // sit inside the rect where this reads background — so a style with an explicit
      // underline colour reports a worst band that is its own underline. A decoration is
      // part of the text; it is not ground the text is read against.
      el.style.setProperty("color", "transparent", "important");
      el.style.setProperty("text-decoration-color", "transparent", "important");
      for (const kid of el.querySelectorAll("*")) {
        kid.setAttribute("data-qa-contrast", key + "k");
        kid.style.setProperty("color", "transparent", "important");
        kid.style.setProperty("text-decoration-color", "transparent", "important");
      }
      out.push({
        key, sel,
        x: Math.round(r.left + sx), y: Math.round(r.top + sy),
        w: Math.round(r.width), h: Math.round(r.height),
        color, fontSize, fontWeight,
        text: el.textContent.trim().slice(0, 60),
      });
    }
  }
  return { elements: out, unpainted, doc: {
    width: Math.ceil(document.documentElement.scrollWidth),
    height: Math.ceil(document.documentElement.scrollHeight),
  } };
})()`;
}

const RESTORE = `(() => {
  for (const el of document.querySelectorAll("[data-qa-contrast]")) {
    el.style.removeProperty("color");
    el.style.removeProperty("text-decoration-color");
    el.removeAttribute("data-qa-contrast");
  }
  return true;
})()`;

// ── Sampling ─────────────────────────────────────────────────────────────────
// Every pixel of the element's rect in the blanked frame, tallied. The modal band is the
// background the style mostly sits on; the worst band is the one that gives the lowest
// ratio, and it is reported separately because a gradient means a single style has both.
function sampleRect(img, rect) {
  const counts = new Map();
  const x0 = Math.max(0, rect.x);
  const y0 = Math.max(0, rect.y);
  const x1 = Math.min(img.width, rect.x + rect.w);
  const y1 = Math.min(img.height, rect.y + rect.h);
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * img.width + x) * 4;
      const k = (img.data[i] << 16) | (img.data[i + 1] << 8) | img.data[i + 2];
      counts.set(k, (counts.get(k) || 0) + 1);
    }
  }
  if (!counts.size) return null;
  const bands = [...counts.entries()].map(([k, count]) => ({ rgb: [(k >> 16) & 255, (k >> 8) & 255, k & 255], count }));
  bands.sort((a, b) => b.count - a.count);
  return bands;
}

export function measureInstance(el, bands) {
  const fg = parseCssColor(el.color);
  if (!fg) return null;
  const large = el.fontSize >= 24 || (el.fontSize >= 18.66 && Number(el.fontWeight) >= 700);
  const needs = large ? AA_LARGE : AA_NORMAL;
  const rated = bands.map((b) => {
    const out = composite(fg.rgb, fg.a, b.rgb);
    return { bg: b.rgb, count: b.count, fg: out, ratio: contrastRatio(out, b.rgb) };
  });
  const modal = rated[0];
  const worst = rated.reduce((a, b) => (b.ratio < a.ratio ? b : a));
  return {
    sel: el.sel,
    declared: el.color,
    font: `${r2(el.fontSize)}px/${el.fontWeight}`,
    large,
    needs,
    modal_bg: hex(modal.bg),
    modal_fg: hex(modal.fg),
    ratio: r2(modal.ratio),
    worst_bg: hex(worst.bg),
    worst_ratio: r2(worst.ratio),
    // The gate is the MODAL band: the background this style mostly sits on, which is
    // the reading it is judged by and the column the audit's failure list was built
    // from. The worst band is reported beside it and never hidden, but a gradient
    // guarantees a handful of extreme pixels at the edge of every rect, and letting a
    // single pixel decide a pass would make the instrument report noise as a finding.
    passes: modal.ratio >= needs,
    bands: rated.length,
    text: el.text,
  };
}

// ── Run ──────────────────────────────────────────────────────────────────────
export async function sweep({ states = STATES, views = Object.keys(VIEWS), styles = STYLES } = {}) {
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
  const cdp = await CDP.connect(targets.find((t) => t.type === "page").webSocketDebuggerUrl);

  const rows = [];
  const blocked = [];
  try {
    await installInterception(cdp, blocked);
    for (const stateId of states) {
      const spec = COMPOSED[stateId] || { scenario: stateId };
      const scenario = SCENARIOS[spec.scenario];
      if (!scenario) throw new Error(`Unknown scenario "${spec.scenario}"`);
      for (const viewKey of views) {
        const vp = VIEWS[viewKey];
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
        if (spec.openLane) {
          const pressed = await evaluate(cdp, CLICK_DOOR);
          if (!pressed.ok) throw new Error(`${stateId}: no chip door to press`);
          await waitUntil(cdp, `!document.querySelector("#wb-chip-lane").hidden`, { label: "lane visible" });
        }
        await settle(cdp);

        const collected = await evaluate(cdp, collectExpression(styles));
        let measured = 0;
        if (collected.elements.length) {
          const shot = await cdp.send("Page.captureScreenshot", {
            format: "png",
            captureBeyondViewport: true,
            clip: { x: 0, y: 0, width: collected.doc.width, height: collected.doc.height, scale: 1 },
          });
          const img = decodePng(Buffer.from(shot.data, "base64"));
          for (const el of collected.elements) {
            const bands = sampleRect(img, el);
            if (!bands) continue;
            const m = measureInstance(el, bands);
            if (!m) continue;
            rows.push({ state: stateId, view: viewKey, ...m });
            measured++;
          }
        }
        await evaluate(cdp, RESTORE);
        await cdp.send("Page.removeScriptToEvaluateOnNewDocument", { identifier });
        const failing = rows.filter((r) => r.state === stateId && r.view === viewKey && !r.passes).length;
        log(`  ${stateId.padEnd(20)} @ ${String(viewKey).padStart(4)}  ${String(measured).padStart(3)} measured  ${String(failing).padStart(3)} below AA`);
      }
    }
  } finally {
    cdp.close();
    proc.kill("SIGKILL");
    server.close();
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch {
      /* best effort */
    }
  }
  if (blocked.length) log(`\n  (blocked ${blocked.length} off-allowlist request(s))`);
  return { rows, browserVersion };
}

// ── Report ───────────────────────────────────────────────────────────────────
function table(header, body) {
  const all = [header, ...body];
  const w = header.map((_, i) => Math.max(...all.map((row) => String(row[i]).length)));
  return all.map((row) => row.map((c, i) => String(c).padEnd(w[i])).join("  ")).join("\n");
}

const range = (vals) => {
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  return lo === hi ? lo.toFixed(2) : `${lo.toFixed(2)}–${hi.toFixed(2)}`;
};

// Grouped by selector AND declared colour, because a selector is not a style: several of
// these classes are re-coloured under a scoped parent, so one selector carries two
// populations with two different ratios. Collapsing them onto the selector alone prints a
// range that belongs to no element and hides which of the two is the one below AA.
export function summarize(rows) {
  const groups = new Map();
  for (const r of rows) {
    const k = `${r.sel} ${r.declared}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(r);
  }
  const order = new Map(STYLES.map((s, i) => [s, i]));
  return [...groups.values()]
    .map((set) => ({
      sel: set[0].sel,
      declared: set[0].declared,
      font: set[0].font,
      needs: set[0].needs,
      instances: set.length,
      failing: set.filter((r) => !r.passes).length,
      modal: range(set.map((r) => r.ratio)),
      worst: range(set.map((r) => r.worst_ratio)),
      states: [...new Set(set.map((r) => r.state))].sort().join(" "),
    }))
    .sort((a, b) => order.get(a.sel) - order.get(b.sel) || a.declared.localeCompare(b.declared));
}

function parseFlags(argv) {
  const out = { json: null, states: STATES, views: Object.keys(VIEWS) };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--json") out.json = argv[++i] || "contrast.json";
    else if (argv[i] === "--state") out.states = [argv[++i]];
    else if (argv[i] === "--view") out.views = [argv[++i]];
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const flags = parseFlags(process.argv.slice(2));
  log("Contrast sweep — pixel sampling against the painted page\n");
  const { rows, browserVersion } = await sweep(flags);
  const summary = summarize(rows);
  log(`\nRenderer: ${browserVersion}\n`);
  log(
    table(
      ["selector", "declared", "font", "needs", "n", "below AA", "modal ratio", "worst band"],
      summary.map((s) => [s.sel, s.declared, s.font, s.needs, s.instances, s.failing, s.modal, s.worst]),
    ),
  );
  const failing = rows.filter((r) => !r.passes);
  log(`\n${failing.length} failing instances of ${rows.length} measured.`);
  if (flags.json) {
    fs.writeFileSync(flags.json, JSON.stringify({ browserVersion, summary, rows }, null, 2));
    log(`\nwrote ${flags.json}`);
  }
  process.exit(failing.length ? 1 : 0);
}
