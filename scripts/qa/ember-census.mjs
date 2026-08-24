// The result-region ember census, measured from authored source.
//
//   node scripts/qa/ember-census.mjs            # measure and print
//   node scripts/qa/ember-census.mjs --json     # emit the artifact shape as JSON
//   node scripts/qa/ember-census.mjs --check    # measure and diff against the baseline
//   node scripts/qa/ember-census.mjs --write    # rewrite the baseline artifact
//
// R14 says every ember use must map to a role the standing accent law already
// authorizes, and names its enforcement: "accent-role census against registry". This is
// that census, scoped to one region, and it exists because the number that reached the
// record before it did not come from a committed instrument. It replaces nothing that
// runs; there was nothing to replace.
//
// ── Why the authored text and not the CSSOM ──────────────────────────────────
// Chrome serializes a var()-bearing shorthand followed by a same-family longhand as
// EMPTY longhands. `border-left: 2px solid rgba(var(--ember-rgb), 0.55)` read back
// through `rule.style.cssText` loses the colour entirely, so a CSSOM census reports a
// spend that is plainly on screen as absent. Every authored declaration below is
// recovered from the stylesheet TEXT. The renderer is asked one question only — does
// this selector match an element inside the region — and one secondary one, what the
// region actually computes at rest.
//
// ── The three questions, kept apart ──────────────────────────────────────────
// The brief this instrument answers is explicit that these must not collapse into one
// number, because they disagree and the disagreement is the finding:
//
//   (a) AUTHORED     — selectors that match at least one element inside the region
//                      under the driven scenarios. What the stylesheet spends here.
//   (b) PSEUDO-STATE — declarations that are only ever active under :hover, :focus and
//                      their kin. Real paint, but never resting paint, so a resting
//                      census that counted them would be overstating the surface.
//   (c) RESTING      — what getComputedStyle actually reports inside the region at
//                      rest. Computed values, not authored ones, and a different
//                      question: a declaration can be authored and lose the cascade.
//
// ── What counts as an ember spend ────────────────────────────────────────────
// The family is derived from the declared ramp rather than judged by eye. styles.css
// :root declares --ember and its relatives; this file reads their hues out of those
// declarations and treats exactly those hues as ember. Nothing else is folded in on a
// similarity judgement, because "close enough to ember" is a numeric threshold and
// doctrine section 8 forbids introducing one without a founder ruling. Adjacent accent
// hues found in the region are reported in their own inventory instead of being
// silently promoted or silently dropped.
//
//   declared-token spend — var(--ember), var(--ember-glow): the ramp, spent as the ramp
//   free-alpha spend     — rgba(var(--ember-rgb), 0.55) or rgba(222, 111, 56, 0.55):
//                          the ember hue at an alpha the author picked rather than one
//                          the ramp declares
//   literal-hue spend    — a bare #DE6F38: on-hue, off-token, but no chosen alpha
//
// --ember-rgb is a channel triple and not a paint token, so spending through it is a
// free-alpha spend and not a declared-token one. That distinction is the whole point:
// the token ramp is the governed surface and the channel is the hole in it.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { SCENARIOS, resolvePayloads } from "./scenarios.mjs";
import {
  BOARD_VIEWPORTS,
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

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const REGION = ".wb-reader-v2__result";
export const BASELINE_PATH = "docs/qa/surface-measurements/ember-census.json";

const log = (s = "") => process.stdout.write(`${s}\n`);
const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");

// ── Authored sources ─────────────────────────────────────────────────────────
// styles.css and workbench.css are linked by reader.html. workbench-app.jsx carries
// five CSS template literals that esbuild inlines into workbench.bundle.js; they are
// authored CSS by every test that matters and the census reads them as such. The
// bundle itself is build output and is deliberately not a source here.
export const SOURCE_PATHS = ["styles.css", "workbench.css", "workbench-app.jsx"];

// The five literals, by the name they are declared under. Named rather than discovered
// so that a sixth block added later fails the source-coverage assertion below instead
// of joining the census unannounced.
export const JSX_CSS_CONSTS = [
  "WORKBENCH_A11Y_CSS",
  "WORKBENCH_RESULT_GAP_CSS",
  "WORKBENCH_RESULT_LAYOUT_CSS",
  "WORKBENCH_FLOW_CSS",
  "WORKBENCH_TERMS_CSS",
];

// `const NAME = "value";` for the handful of string constants the CSS literals
// interpolate. An interpolation this cannot resolve is an error, not a silent gap.
export function readStringConsts(jsx) {
  const out = new Map();
  for (const m of jsx.matchAll(/^const ([A-Z][A-Z0-9_]*) = ("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*');$/gm)) {
    out.set(m[1], m[2].slice(1, -1));
  }
  const obj = jsx.match(/^const C = \{([\s\S]*?)^\};$/m);
  if (obj) {
    for (const m of obj[1].matchAll(/^\s*([A-Za-z][A-Za-z0-9]*):\s*"((?:[^"\\]|\\.)*)",?$/gm)) {
      out.set(`C.${m[1]}`, m[2]);
    }
  }
  return out;
}

export function extractJsxCss(jsx) {
  const consts = readStringConsts(jsx);
  const blocks = [];
  for (const name of JSX_CSS_CONSTS) {
    const open = jsx.indexOf(`const ${name} = \``);
    if (open < 0) throw new Error(`${name} is gone from workbench-app.jsx — the census lost a source it is declared to read.`);
    const from = jsx.indexOf("`", open) + 1;
    let i = from;
    for (; i < jsx.length; i++) {
      if (jsx[i] === "\\") { i++; continue; }
      if (jsx[i] === "`") break;
    }
    const raw = jsx.slice(from, i);
    const resolved = raw.replace(/\$\{([^}]*)\}/g, (whole, expr) => {
      const key = expr.trim();
      if (!consts.has(key)) {
        throw new Error(
          `${name} interpolates \${${key}} and the census cannot resolve it to a string. ` +
            "An unresolved interpolation would be a declaration measured with a hole in it.",
        );
      }
      return consts.get(key);
    });
    blocks.push({ name, css: resolved });
  }
  return blocks;
}

export function readSources(root = REPO_ROOT) {
  const out = [];
  for (const rel of SOURCE_PATHS) {
    const text = fs.readFileSync(path.join(root, rel), "utf8");
    if (rel.endsWith(".jsx")) {
      // The governed content is the CSS, not the 340KB of JavaScript around it. Hashing
      // the whole file would churn the fingerprint on every unrelated refactor and make
      // the baseline meaningless; hashing the extracted CSS changes the fingerprint on
      // exactly the edits the census governs.
      const blocks = extractJsxCss(text);
      const css = blocks.map((b) => `/* ${b.name} */\n${b.css}`).join("\n");
      out.push({ path: rel, extraction: `CSS template literals: ${JSX_CSS_CONSTS.join(", ")}`, css, sha256: sha256(css) });
    } else {
      out.push({ path: rel, extraction: "whole file", css: text, sha256: sha256(text) });
    }
  }
  return out;
}

// ── The declared ramp ────────────────────────────────────────────────────────
const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

function hexToTriple(hex) {
  let h = hex.slice(1);
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)].join(", ");
}

export function readEmberRamp(stylesCss) {
  const root = stylesCss.match(/:root\s*\{([\s\S]*?)\}/);
  if (!root) throw new Error("styles.css has no :root block — the ember ramp cannot be read.");
  const paintTokens = [];
  const channelTokens = [];
  const hues = new Set();
  for (const m of root[1].matchAll(/(--ember[a-z0-9-]*)\s*:\s*([^;]+);/g)) {
    const name = m[1];
    const value = m[2].trim();
    if (/^\d+\s*,\s*\d+\s*,\s*\d+$/.test(value)) {
      channelTokens.push({ name, value });
      hues.add(value.replace(/\s+/g, " "));
      continue;
    }
    paintTokens.push({ name, value });
    if (HEX.test(value)) hues.add(hexToTriple(value));
    const rgba = value.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (rgba) hues.add(`${rgba[1]}, ${rgba[2]}, ${rgba[3]}`);
  }
  if (!paintTokens.length) throw new Error("styles.css :root declares no --ember paint token.");
  return { paintTokens, channelTokens, hues };
}

// ── Authored CSS → declarations ──────────────────────────────────────────────
export function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

function matchBrace(s, open) {
  let depth = 0;
  for (let i = open; i < s.length; i++) {
    if (s[i] === "{") depth++;
    else if (s[i] === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return s.length - 1;
}

// Paren-aware split, so `:is(a, b)` and `rgba(1, 2, 3)` survive intact.
export function splitTop(s, sep) {
  const out = [];
  let depth = 0;
  let cur = "";
  for (const ch of s) {
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    if (ch === sep && depth === 0) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

// Pseudo-classes that describe a transient user state. Everything else — :nth-child,
// :not, :is, :has, :root — is structural and stays, because stripping it would change
// which elements the selector is asking about.
export const PSEUDO_STATE = new Set([
  "hover", "focus", "focus-visible", "focus-within", "active", "visited", "link",
  "target", "checked", "indeterminate", "disabled", "enabled", "placeholder-shown",
  "autofill", "user-invalid", "user-valid", "default", "open",
]);

// Strip pseudo-elements and pseudo-state classes at the TOP level only. A `:hover`
// nested inside `:not(...)` is part of a structural question and removing it would
// invert the selector's meaning.
export function stripSelectorPart(part) {
  let out = "";
  let hadState = false;
  let i = 0;
  let depth = 0;
  while (i < part.length) {
    const ch = part[i];
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === ":" && depth === 0) {
      const isElement = part[i + 1] === ":";
      const start = i + (isElement ? 2 : 1);
      let j = start;
      while (j < part.length && /[a-zA-Z0-9-]/.test(part[j])) j++;
      const name = part.slice(start, j);
      let k = j;
      if (part[k] === "(") {
        let d = 0;
        for (; k < part.length; k++) {
          if (part[k] === "(") d++;
          else if (part[k] === ")") { d--; if (!d) { k++; break; } }
        }
      }
      if (isElement) { i = k; continue; }
      if (PSEUDO_STATE.has(name)) { hadState = true; i = k; continue; }
      out += part.slice(i, k);
      i = k;
      continue;
    }
    out += ch;
    i++;
  }
  const stripped = out.trim();
  return { stripped: stripped || "*", pseudoState: hadState };
}

export function parseDeclarations(css, sourcePath) {
  const text = stripComments(css);
  const out = [];
  const walk = (s, atStack) => {
    let i = 0;
    let prelude = "";
    while (i < s.length) {
      const ch = s[i];
      if (ch !== "{") { prelude += ch; i++; continue; }
      const end = matchBrace(s, i);
      const body = s.slice(i + 1, end);
      const sel = prelude.trim().replace(/\s+/g, " ");
      if (sel.startsWith("@")) {
        if (/^@(media|supports|layer|container|scope)\b/i.test(sel)) walk(body, [...atStack, sel]);
        else if (/^@keyframes\b/i.test(sel)) walk(body, [...atStack, sel]);
        // @font-face, @property and friends declare no selector-matchable paint.
      } else if (sel) {
        for (const decl of splitTop(body, ";")) {
          const c = decl.indexOf(":");
          if (c < 0) continue;
          const property = decl.slice(0, c).trim();
          const value = decl.slice(c + 1).trim().replace(/\s+/g, " ");
          if (!property || !value || property.startsWith("--")) continue;
          const parts = splitTop(sel, ",").map((p) => p.trim()).filter(Boolean).map((raw) => ({ raw, ...stripSelectorPart(raw) }));
          out.push({
            source: sourcePath,
            selector: sel,
            parts,
            media: atStack.filter((a) => /^@media/i.test(a)),
            keyframes: atStack.some((a) => /^@keyframes/i.test(a)),
            property,
            value,
          });
        }
      }
      i = end + 1;
      prelude = "";
    }
  };
  walk(text, []);
  return out;
}

// ── Classification ───────────────────────────────────────────────────────────
export function classify(value, ramp) {
  const paintNames = new Set(ramp.paintTokens.map((t) => t.name));
  const channelNames = new Set(ramp.channelTokens.map((t) => t.name));
  const declaredTokens = [];
  const freeAlphas = [];
  const literalHues = [];

  for (const m of value.matchAll(/var\(\s*(--[a-z0-9-]+)/g)) {
    if (paintNames.has(m[1])) declaredTokens.push(m[1]);
  }
  // rgba(var(--ember-rgb), a) — the channel spent with an author-chosen alpha.
  for (const m of value.matchAll(/rgba?\(\s*var\(\s*(--[a-z0-9-]+)\s*\)\s*,\s*([^,)]+)\)/g)) {
    if (channelNames.has(m[1])) freeAlphas.push({ hue: `var(${m[1]})`, alpha: m[2].trim(), text: m[0] });
  }
  // rgba(222, 111, 56, a) — the hue written out, alpha chosen.
  for (const m of value.matchAll(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([^,)]+))?\)/g)) {
    const hue = `${m[1]}, ${m[2]}, ${m[3]}`;
    if (!ramp.hues.has(hue)) continue;
    if (m[4] === undefined) literalHues.push({ hue, text: m[0] });
    else freeAlphas.push({ hue, alpha: m[4].trim(), text: m[0] });
  }
  for (const m of value.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
    if (!HEX.test(m[0])) continue;
    const hue = hexToTriple(m[0]);
    if (ramp.hues.has(hue)) literalHues.push({ hue, text: m[0] });
  }
  return { declaredTokens, freeAlphas, literalHues };
}

// Accent paint on a hue the ramp does not declare. Reported, never folded into the
// ember counts: calling it ember would need a similarity threshold, and inventing one
// is a founder ruling this instrument does not get to make.
export function adjacentHues(value, ramp) {
  const out = [];
  for (const m of value.matchAll(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([^,)]+))?\)/g)) {
    const [r, g, b] = [Number(m[1]), Number(m[2]), Number(m[3])];
    const hue = `${r}, ${g}, ${b}`;
    if (ramp.hues.has(hue)) continue;
    // Warm and chromatic: red dominant, blue lowest, and not a neutral.
    if (!(r > g && g > b && r - b >= 60)) continue;
    out.push({ hue, alpha: m[4] === undefined ? "1" : m[4].trim(), text: m[0] });
  }
  return out;
}

// ── The authored layer, with no renderer in it ───────────────────────────────
// Everything above runs on text alone, which is why the drift test can recompute it in
// the ordinary suite without launching Chrome.
export function authoredInventory(root = REPO_ROOT) {
  const sources = readSources(root);
  const styles = sources.find((s) => s.path === "styles.css");
  const ramp = readEmberRamp(styles.css);
  const rows = [];
  for (const src of sources) {
    for (const d of parseDeclarations(src.css, src.path)) {
      const c = classify(d.value, ramp);
      const adjacent = adjacentHues(d.value, ramp);
      if (!c.declaredTokens.length && !c.freeAlphas.length && !c.literalHues.length && !adjacent.length) continue;
      rows.push({ ...d, ...c, adjacent });
    }
  }
  rows.sort((a, b) => key(a).localeCompare(key(b)));
  return { sources, ramp, rows };
}

const key = (d) => `${d.source}|${d.media.join("&")}|${d.selector}|${d.property}|${d.value}`;

// ── The in-page question ─────────────────────────────────────────────────────
// Shipped as source text and injected, so the fixture tests run the same matcher the
// production census runs rather than a restatement of it.
export const MATCH_FN_SOURCE = `function __emberMatch(region, probes, hues) {
  const root = document.querySelector(region);
  if (!root) return { region: false, matched: {}, resting: [] };
  const matched = {};
  for (const p of probes) {
    let inRegion = false;
    let outside = false;
    let restingInRegion = false;
    for (const part of p.parts) {
      let nodes = [];
      try { nodes = Array.from(document.querySelectorAll(part.stripped)); } catch (e) { continue; }
      for (const n of nodes) {
        const within = root === n || root.contains(n);
        if (within) { inRegion = true; if (!part.pseudoState) restingInRegion = true; }
        else outside = true;
      }
    }
    const mediaHolds = p.media.every((m) => {
      const q = m.replace(/^@media\\s*/i, "");
      try { return window.matchMedia(q).matches; } catch (e) { return true; }
    });
    if (inRegion || outside) matched[p.id] = { inRegion, outside, restingInRegion, mediaHolds };
  }
  const PROPS = [
    "color", "background-color", "background-image", "border-top-color", "border-right-color",
    "border-bottom-color", "border-left-color", "outline-color", "box-shadow", "text-shadow",
    "text-decoration-color", "caret-color", "column-rule-color", "fill", "stroke",
    "-webkit-text-fill-color",
  ];
  // Filtered here rather than in Node: the region carries hundreds of elements and
  // sixteen properties each, and shipping every computed colour out of seventy-two
  // states would be megabytes of neutral greys to find a handful of ember.
  const onHue = (v) => hues.some((h) => v.indexOf("rgba(" + h + ",") >= 0 || v.indexOf("rgb(" + h + ")") >= 0);
  const resting = [];
  const seenResting = new Set();
  const all = [root, ...root.querySelectorAll("*")];
  for (const el of all) {
    if (!el.checkVisibility || !el.checkVisibility({ contentVisibilityAuto: true, opacityProperty: true, visibilityProperty: true })) continue;
    const cs = getComputedStyle(el);
    for (const prop of PROPS) {
      const v = cs.getPropertyValue(prop);
      if (!v || v === "none" || v === "rgba(0, 0, 0, 0)") continue;
      if (!onHue(v)) continue;
      const cls = typeof el.className === "string" ? el.className : "";
      const k = cls + "|" + prop + "|" + v;
      if (seenResting.has(k)) continue;
      seenResting.add(k);
      resting.push({ cls, tag: el.tagName.toLowerCase(), prop, value: v });
    }
  }
  return { region: true, matched, resting };
}`;

function buildProbes(rows) {
  return rows.map((d, i) => ({
    id: String(i),
    parts: d.parts.map((p) => ({ stripped: p.stripped, pseudoState: p.pseudoState })),
    media: d.media,
  }));
}

// ── Run ──────────────────────────────────────────────────────────────────────
export function governedScenarios() {
  return Object.keys(SCENARIOS).sort();
}

export async function measure({ root = REPO_ROOT, scenarios = governedScenarios(), viewports = BOARD_VIEWPORTS } = {}) {
  const inv = authoredInventory(root);
  const probes = buildProbes(inv.rows);
  const renderer = resolveBrowser();
  const { server, port } = await startStaticServer(root);
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

  const states = [];
  const blocked = [];
  try {
    await installInterception(cdp, blocked);
    for (const name of scenarios) {
      const scenario = SCENARIOS[name];
      if (!scenario) throw new Error(`Unknown scenario "${name}"`);
      for (const vpName of viewports) {
        const vp = VIEWPORTS[vpName];
        await cdp.send("Page.removeScriptToEvaluateOnNewDocument", { identifier: "1" }).catch(() => {});
        const { identifier } = await cdp.send("Page.addScriptToEvaluateOnNewDocument", {
          source: buildStubScript(resolvePayloads(scenario)),
        });
        await cdp.send("Emulation.setDeviceMetricsOverride", {
          width: vp.width, height: vp.height, deviceScaleFactor: vp.dsf, mobile: vp.mobile,
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
        await settle(cdp);
        const res = await evaluate(
          cdp,
          `(() => { ${MATCH_FN_SOURCE}; return __emberMatch(${JSON.stringify(REGION)}, ${JSON.stringify(probes)}, ${JSON.stringify([...inv.ramp.hues])}); })()`,
        );
        states.push({ scenario: name, viewport: vpName, ...res });
        log(`  swept ${name.padEnd(28)} @ ${vpName}${res.region ? "" : "   (region absent)"}`);
        await cdp.send("Page.removeScriptToEvaluateOnNewDocument", { identifier });
      }
    }
  } finally {
    cdp.close();
    proc.kill("SIGKILL");
    server.close();
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch { /* best effort */ }
  }
  return { inv, states, browserVersion, scenarios, viewports };
}

// ── The artifact ─────────────────────────────────────────────────────────────
export const CENSUS_NOTES = {
  what_the_counts_mean:
    "A spend is one authored declaration — source, selector, property, value — that " +
    "references the ember family. A declaration can be both a declared-token spend and a " +
    "free-alpha spend; it is counted under each. Free-alpha spends split into resting and " +
    "pseudo-state-only, and those two never sum into a single headline number, because a " +
    ":hover border is real paint and is not paint the resting surface carries.",
  superseded_claim:
    "The prior claim of record — 26 declared-token spends, 4 free-alpha spends, 4 distinct " +
    "free alphas — came from an uncommitted instrument that no longer exists and does not " +
    "reproduce. It is not treated as authoritative and is superseded by this instrument and " +
    "the measured values in this file. Nothing here was tuned to recover it.",
  family_boundary:
    "The ember family is exactly the hues the styles.css :root ramp declares. Warm accent " +
    "hues off that ramp are listed under adjacent_hue_inventory and are NOT counted as " +
    "ember, because folding them in would need a hue-similarity threshold and doctrine " +
    "section 8 forbids a new numeric threshold without a founder ruling.",
  not_cssom:
    "Every authored declaration here is recovered from stylesheet TEXT. Chrome serializes a " +
    "var()-bearing shorthand followed by a same-family longhand as empty longhands, so a " +
    "CSSOM cssText census reports border-left: 2px solid rgba(var(--ember-rgb), 0.55) as absent.",
  withdrawn_claim:
    "The historical claim that every surviving result-region free alpha also painted outside " +
    "the region is WITHDRAWN as inaccurate, by the founder ruling of 2026-08-22. This census " +
    "measures the opposite: most free-alpha spends in the region are region-only. The scope " +
    "field on every row of free_alpha_inventory carries the measured answer per declaration.",
  what_the_free_alpha_count_is_not:
    "The free-alpha count is NOT a pass/fail R14 compliance threshold. Per the founder ruling " +
    "of 2026-08-22 it is a governed measurement and a technical-debt and reconciliation " +
    "signal. A rising count is a thing to look at, never on its own a thing to fix. " +
    "See r14_adjudication for the ruling in full.",
};

// ── The R14 adjudication ─────────────────────────────────────────────────────
// The census exists to serve R14, so the census file is where the adjudication belongs:
// an exception recorded in prose somewhere else is an exception preserved silently.
//
// The subject list is BUILT FROM THE MEASUREMENT below, never typed here, so a selector
// that stops painting free alpha in the region leaves this record on its own and a new
// one arrives without anybody remembering to add it.
export const R14_ADJUDICATION = {
  disposition: "ruled — founder ruling of 2026-08-22; every subject below stands unchanged",
  changed_in_this_lane: "No CSS. No declaration below was substituted, retired, or moved.",

  // Recorded verbatim. This is the governing text; everything else in this object is the
  // evidence that prompted it or the reading that follows from it, and where they differ
  // the ruling wins.
  ruling: {
    date: "2026-08-22",
    authority: "founder",
    recorded_against: "PR #126 — Make Surface Finish measurements reproducible",
    text:
      "Free ember alpha values are not, by themselves, an R14 violation. R14 governs the " +
      "semantic role in which ember is spent. The frozen doctrine does not establish a " +
      "universal requirement that every ember alpha inside .wb-reader-v2__result map onto one " +
      "of the declared alpha-ramp tokens, and section 0 correction 1 left the registry " +
      "unseeded while section 6 judgment 6 reserves accent-token reconciliation to the founder.",
    therefore: [
      "the committed ember census remains a governed measurement and a technical-debt and " +
        "reconciliation signal;",
      "its free-alpha count is NOT a pass/fail R14 compliance threshold;",
      "do not change .wb-loop__panel--second, .wb-loop__tag, .wb-loop__unmatched, " +
        ".wb-share-consent__panel, .wb-share-consent__confirm, .wb-perception__option:hover, " +
        "or any other product CSS merely to reduce that count;",
      "any future change to those spends requires either a semantic-role finding under R14 or " +
        "a separately adopted founder rule governing alpha-token consolidation, which does not " +
        "exist today;",
      "the historical claim that every surviving result-region free alpha also painted outside " +
        "the region is withdrawn as inaccurate;",
      "the census numbers remain whatever the committed instrument measures; do not normalize " +
        "them to any prior target, including 26/4/4.",
    ],
  },

  // What the ruling means for anyone who opens this file with a diff in hand.
  standing_instruction:
    "A free alpha in this region is not a defect to be closed. Only two things license a " +
    "change to the spends listed under subjects: a semantic-role finding under R14 — that the " +
    "ember is spent in a role the standing registry does not authorize — or a founder rule on " +
    "alpha-token consolidation, which does not exist today. Reducing the count is not a " +
    "reason. If a future pass proposes touching one of these declarations, it must name which " +
    "of those two licenses it holds.",

  rule_text:
    "R14 — Ember spends only against the standing role registry. 'Every ember use must " +
    "map to a role already authorized by the standing accent law.' Seed registry: 1. evidence " +
    "signal/mark, including its numeral; 2. one ruled keyword within a heading where explicitly " +
    "authorized; 3. a consequential gap/figure where explicitly ruled; 4. a mono/status pill " +
    "where appropriate and ruled; 5. the primary CTA/action. 'New ember roles require founder " +
    "ruling. No numeric ceiling is claimed by research.'",
  what_r14_governs:
    "R14 governs WHICH ROLE may receive ember. It does not require that an ember spend route " +
    "through a declared custom property, it names no permitted alpha set, and it closes with " +
    "'No numeric ceiling is claimed by research.' So an authored rgba() at an alpha the ramp " +
    "does not declare is not, by itself, an R14 violation. Free alpha is a token-hygiene " +
    "finding. This census reports it; R14 does not adjudicate it. AFFIRMED by the ruling above.",
  evidence_the_ruling_was_made_on: [
    "Section 0 correction 1: 'the registry must be seeded from the actual standing accent law. " +
      "A behavior-class label is not automatically entitled to ember merely because the live " +
      "surface currently uses it.' The registry these selectors would be judged against is " +
      "therefore not yet seeded, and the live surface's own usage cannot seed it.",
    "Section 5 intake item 4: 'broad ember use / many variants — reproduce against R14 " +
      "registry.' This is an OPEN intake item. Section 8 makes reproducing or clearing the 11 " +
      "intake items a precondition of freezing the doctrine, not an outcome of it.",
    "Section 5 intake item 10: 'documented versus shipped accent divergence — reproduce; " +
      "founder/design-system ruling if still real.' The divergence is real and this file is the " +
      "reproduction: the ramp declares alphas 0.30, 0.14 and 0.62, and the region ships nine " +
      "distinct free alphas. Doctrine names the remedy as a ruling, not an implementer edit.",
    "Section 6 judgment 6 reserves 'accent-token reconciliation if divergence persists' to the " +
      "founder. Substituting a declared token here would decide exactly that judgment.",
    "Section 7 risk 2: 'implementers cannot rename decoration as semantics.' Holding these " +
      "declarations by asserting they are role-1 evidence marks is the named failure. The " +
      "symmetric error — retiring them by asserting they are decoration — is the same move with " +
      "the sign flipped. Both are the implementer deciding the registry.",
  ],
  why_no_substitution_was_made:
    "Three of the subjects paint rgba(var(--ember-rgb), 0.55) and the declared ramp holds no " +
    "0.55 token: --ember-glow is 0.30, --ember-trace is 0.14, --ember-pulse is 0.62 on a " +
    "different hue. Every available substitution therefore moves pixels, and no ruling " +
    "authorizes the movement or the baselines it would need. The ruling now forecloses the " +
    "substitution outright, so this stands as the record of why none was made rather than as " +
    "an obstacle somebody should try to clear.",
  per_subject_notes: {
    ".wb-btn--primary:disabled":
      "Not named in the brief. Region-only, pseudo-state-only: the dimmed rendering of the " +
      "primary action while it cannot be pressed. Role 5 is the least contested reading in the " +
      "whole subject list, and it carries no 'where ruled' qualifier.",
    ".wb-loop__panel--second":
      "A 2px ember left-rule on the second of the two evidence panels in the delta reveal. It " +
      "discriminates which answer a panel holds. Candidate role 1 (evidence signal/mark) or 3 " +
      "(a consequential gap/figure) — and role 3 reads 'where explicitly ruled'.",
    ".wb-loop__tag":
      "The same 2px left-rule on the construct tag, a paragraph of reveal prose. Prose is the " +
      "weakest fit of the five seed roles.",
    ".wb-loop__unmatched":
      "The same 2px left-rule on the unmatched-conditions note. The authored comment states the " +
      "intent — 'Ember left-rule, same idiom as the return strip — a mark, not a fill' — which " +
      "is a claim of role 1. Not named in the brief; the census found it carrying the identical " +
      "declaration, which is why the three named selectors could not have been fixed as a set.",
    ".wb-perception__option:hover":
      "Named in the brief as a region-scoped spend. It is region-scoped, but the census " +
      "classifies it PSEUDO-STATE-ONLY: it is hover feedback and paints nothing on the resting " +
      "surface. It is also off the declared ramp's channel token, authored as a literal " +
      "rgba(222, 111, 56, 0.5).",
    ".wb-share-consent__confirm.wb-btn--ghost:not(:disabled)":
      "Not named in the brief. Region-only resting free alpha on the share-consent confirm " +
      "button — background 0.16, border 0.55. Candidate role 5 (the primary CTA/action), which " +
      "carries no 'where ruled' qualifier.",
    ".wb-share-consent__panel":
      "Not named in the brief. Region-only resting free alpha, a 1px 0.22 border on the consent " +
      "panel. A container edge fits none of the five seed roles.",
  },
  settled_by_the_ruling: [
    "whether ember spends must route through declared ramp tokens — NO. The frozen doctrine " +
      "establishes no such universal requirement, and adopting one would be a new rule rather " +
      "than an application of R14.",
    "whether a free alpha is on its own an R14 violation — NO.",
    "what the free-alpha count is for — a technical-debt and reconciliation signal, and never " +
      "a pass/fail compliance threshold.",
    "whether the surviving spends should be edited to bring the count down — NO, explicitly, " +
      "for all six named selectors and for any other product CSS.",
    "whether the region-only spends also paint outside the region — the historical claim that " +
      "they all did is withdrawn as inaccurate. The measured scope field governs.",
  ],
  still_open: [
    "whether the 2px ember left-rule idiom is registry role 1, role 3, or not a registry role. " +
      "The ruling leaves this open and makes it moot for now: a semantic-role finding is one of " +
      "the only two things that could license a change here, and none has been made.",
    "whether hover feedback is an 'ember use' R14 governs at all, or interaction affordance " +
      "outside the registry.",
    "whether a founder rule on alpha-token consolidation is ever adopted. It does not exist " +
      "today, and until it does the shipped alphas stand.",
  ],
};

// ── The provenance-reseal rule ───────────────────────────────────────────────
// The coverage fingerprint hashes the region selector, the driven scenarios, the driven
// viewports, and the sha256 of every governed source. So ANY authorized edit to a governed
// source moves the fingerprint, including one that moves no measured value — and this
// census has exactly one governed source that product work touches routinely.
//
// That recurs, and it has one honest response and one dishonest one. The honest response
// records why the hash moved. The dishonest one rewrites the artifact because a seal went
// red. They produce the same file, which is why the rule below has to be recorded rather
// than remembered.
export const PROVENANCE_RESEAL_RULE = {
  disposition: "ruled — founder ruling of 2026-08-22, recorded against the Reader value-seam amendment",

  // Verbatim.
  ruling: {
    date: "2026-08-22",
    authority: "founder",
    recorded_against: "Reader value-seam correction — amendment, ruling two",
    text:
      "A source-fingerprint change may be resealed only after the governed instrument proves " +
      "that every measured value and every governed inventory is unchanged, and the source " +
      "movement is attributable to an identified authorized change. The reseal records " +
      "provenance; it does not convert a changed measurement into an accepted one, and it is " +
      "never a response to a failing test.",
    record_requirements: [
      "state that measured state did not move;",
      "name the authorized edit that moved the source hash;",
      "show the before-and-after governed counts and inventory as identical.",
    ],
  },

  what_this_is_not:
    "This is provenance maintenance, not baseline acceptance. A reseal carries no authority " +
    "over a measured value. If any count or any free-alpha inventory line differs, the " +
    "condition for a reseal is absent and the difference is a finding to report, whatever the " +
    "test output looks like.",

  standing_instruction:
    "Before resealing, run --check and read WHICH lines it printed. A fingerprint line alone is " +
    "the reseal condition. A fingerprint line accompanied by any count or inventory line is not " +
    "— reseal nothing, and report the measurement. Never reseal because a custody seal in the " +
    "suite went red: the red seal is the prompt to look, and the proof is the instrument's own " +
    "--check output, never the test result.",
};

// Every reseal this artifact has carried, appended, never rewritten. Each entry names its
// authorized edit; the identity evidence beside it is COMPUTED at write time in
// buildArtifact against the live measurement, so an entry cannot claim an identity the
// instrument does not currently reproduce.
export const PROVENANCE_RESEALS = [
  {
    date: "2026-08-22",
    reason: "authorized source edits in commit da2f238, 'Close the Reader finding-to-action seam'",
    fingerprint_before: "9724adaa442524d6078f2e4de180bd9a2e5eb78a99adf0c1df13041e41e97078",
    fingerprint_after: "2195fcd9d4b888665e3f9ad68eff9b0ced6b9954f8c378bb6918ce85e39e2229",
    // ONE governed source moved. The commit edited others; only this one is hashed here.
    authorized_edits: [
      {
        source: "workbench.css",
        extraction: "whole file",
        sha256_before: "c9977aa19c998ea97efe7c59a87969c007a8014234f7e86567d8965272a54b61",
        sha256_after: "5241926ea97f88d52dd5fe9b703152cca4c229d17e484f9b74ba11c6d588822d",
        edit:
          "added the .wb-measure__question-text rule — margin, font-size, line-height, max-width. " +
          "It declares no colour and no border, so it introduces no ember spend of any kind: not a " +
          "declared-token spend, not a free alpha, not a literal hue.",
      },
    ],
    // Recorded so a later reader does not infer a second contribution from the commit's own
    // diff. workbench-app.jsx changed in da2f238 and its governed hash did NOT move, because
    // this census hashes an extraction of that file rather than the file: the five CSS
    // template literals named in source_extraction, which the commit left byte-identical.
    edits_that_moved_no_governed_source: [
      {
        source: "workbench-app.jsx",
        extraction: "CSS template literals only",
        sha256_unchanged: "2a50618370aa4b9e93ffa976970d9e373ce3ae04ebde1748e3b1dff7cb2b0146",
        edit:
          "MeasurementPanel sorts its finding rows by the numeral they already carry, and " +
          "FindingQuestion renders the card's literal verification_question above the copy control. " +
          "One new className, wb-measure__question-text, and no change to any ember-bearing class.",
      },
    ],
    // The measured state as the committed baseline held it, typed from that file. buildArtifact
    // compares the live measurement against these and publishes the verdict, so a wrong
    // transcription here fails visibly instead of passing quietly.
    counts_before: {
      declared_token_spends: 33,
      free_alpha_spends: 13,
      distinct_free_alphas: 9,
      free_alpha_spends_resting: 7,
      free_alpha_spends_pseudo_state_only: 6,
    },
    free_alpha_inventory_before: [
      "workbench.css|.wb-btn--ghost:not(:disabled):hover|background|rgba(var(--ember-rgb), 0.06) !important",
      "workbench.css|.wb-btn--ghost:not(:disabled):hover|border-color|rgba(var(--ember-rgb), 0.42) !important",
      "workbench.css|.wb-btn--primary:disabled|background|rgba(var(--ember-rgb), 0.12) !important",
      "workbench.css|.wb-btn--primary:disabled|border-color|rgba(248, 168, 102, 0.22) !important",
      "workbench.css|.wb-demo-trigger:hover|border-color|rgba(var(--ember-rgb), 0.7)",
      "workbench.css|.wb-demo-trigger|border|1px solid rgba(var(--ember-rgb), 0.34)",
      "workbench.css|.wb-loop__panel--second|border-left|2px solid rgba(var(--ember-rgb), 0.55)",
      "workbench.css|.wb-loop__tag|border-left|2px solid rgba(var(--ember-rgb), 0.55)",
      "workbench.css|.wb-loop__unmatched|border-left|2px solid rgba(var(--ember-rgb), 0.55)",
      "workbench.css|.wb-perception__option:hover|border-color|rgba(222, 111, 56, 0.5)",
      "workbench.css|.wb-share-consent__confirm.wb-btn--ghost:not(:disabled)|background|rgba(var(--ember-rgb), 0.16) !important",
      "workbench.css|.wb-share-consent__confirm.wb-btn--ghost:not(:disabled)|border-color|rgba(248, 168, 102, 0.55) !important",
      "workbench.css|.wb-share-consent__panel|border|1px solid rgba(248, 168, 102, 0.22)",
    ],
  },
];

// ── The population-reseal rule ───────────────────────────────────────────────
// The fingerprint hashes four fields and two of them move for unrelated reasons. A governed
// source hash moves when someone edits a stylesheet. The governed scenario population moves
// when someone adds a board scenario, because governedScenarios() returns the whole registry
// — this census consumes the registry as a population, not as a source.
//
// Until 2026-08-23 only the first had a rule, and the second inherited it. A pass that added
// three scenarios found the seal red, PROVENANCE_RESEAL_RULE demanding the source whose hash
// moved, and no source whose hash had moved. Both doors were shut: write the reseal and it
// names an edit that did not happen, write nothing and the artifact stays behind the
// instrument. It stopped and reported instead, and this is the ruling that came back.
export const POPULATION_RESEAL_RULE = {
  disposition: "ruled — founder ruling of 2026-08-23, recorded against the Input Integrity acceptance",

  // Verbatim.
  ruling: {
    date: "2026-08-23",
    authority: "founder",
    recorded_against: "Input Integrity baseline acceptance — the census population gap",
    text:
      "The census conflates two distinct provenance events inside one fingerprint: governed " +
      "source movement and governed scenario-population movement. The existing reseal rule " +
      "remains unchanged and governs the first. A population reseal governs the second, and " +
      "it is not permission to loosen the census: it is eligible only when every governed " +
      "source hash is byte-identical, every measured count is identical, every governed " +
      "inventory line is identical, the only fingerprint input that changed is the governed " +
      "scenario population, the exact additions and removals are enumerated, each added " +
      "scenario's governed-region disposition is recorded, the movement is tied to an " +
      "explicit founder-authorized product or QA change, and no existing scenario disappears " +
      "or changes classification silently. Do not fabricate an authorized source edit where " +
      "no governed source hash moved.",
    eligibility: [
      "every governed source hash byte-identical before and after;",
      "every measured count identical;",
      "every governed inventory line identical;",
      "the only fingerprint input that changed is the governed scenario population;",
      "the exact scenario additions and removals enumerated;",
      "each added scenario's governed-region disposition recorded;",
      "the population movement tied to an explicit founder-authorized product or QA change;",
      "no existing scenario disappears or changes classification silently.",
    ],
  },

  // The route the ruling above opened closed itself on its own second use. Verbatim.
  amendment: {
    date: "2026-08-24",
    authority: "founder",
    recorded_against: "the homepage and Advisory board coverage — the stacked population move",
    text:
      "A superseded population reseal is validated against the population it claims to have " +
      "produced (population_before + scenarios_added − scenarios_removed). Only the newest " +
      "entry must reproduce the live population. The array stays append-only.",
    guarantees_that_survive: [
      "a record cannot claim a move it did not make;",
      "the newest entry must reproduce the live population exactly;",
      "--write still refuses population movement that has no appended record;",
      "no entry is deleted, moved, or rewritten.",
    ],
    // Nothing new is stored to carry this. Each entry already names what it started from,
    // what it added and what it removed, which is the whole of what a link needs.
    chain_continuity:
      "Each entry's population_before equals the population produced by the entry before it, " +
      "and the newest entry's produced population equals the live one. populationResealChain() " +
      "asserts both from the fields the records already carry.",
  },

  what_this_is_not:
    "This is not a second way to reach the same door. A population reseal carries no authority " +
    "over a measured value and none over a source hash. If a governed source moved, this is the " +
    "wrong route and the source rule governs; if any count or inventory line moved, neither " +
    "route is open and the difference is a finding to report.",

  standing_instruction:
    "The two routes are told apart by the evidence they carry, and neither may satisfy the " +
    "other. A record that carries both is refused rather than read twice. Before recording a " +
    "population reseal, run --check and confirm the fingerprint line stands alone; then confirm " +
    "which of its inputs moved, because a fingerprint line alone still does not say which rule " +
    "governs.",
};

// A population reseal proves its case with the scenario population; a source reseal proves
// its case with a hash delta. Keeping the key sets disjoint is what makes "neither route may
// satisfy the other" a property of the data rather than a habit of the reader — a record
// carrying both would satisfy whichever check ran first.
export const SOURCE_RESEAL_EVIDENCE_KEYS = ["authorized_edits", "edits_that_moved_no_governed_source"];
export const POPULATION_RESEAL_EVIDENCE_KEYS = [
  "population_before",
  "scenarios_added",
  "scenarios_removed",
  "added_scenario_dispositions",
  "region_rendering_before",
  "sources_unchanged",
];

// Every population reseal this artifact has carried, appended, never rewritten. As with the
// source reseals, the identity evidence beside each entry is COMPUTED at write time against
// the live measurement, so an entry cannot claim a population the instrument does not drive
// or an identity it does not reproduce.
export const POPULATION_RESEALS = [
  {
    date: "2026-08-23",
    authorizing_change:
      "PR #131, branch claude/input-integrity-surface — the Input Integrity route registered its " +
      "three states on the acceptance board. governedScenarios() is the board registry, so the " +
      "census population grew with it. The route renders no .wb-reader-v2__result region and " +
      "input-integrity.css is deliberately outside this census's source list, so the route " +
      "contributes no ember spend to measure.",
    fingerprint_before: "2195fcd9d4b888665e3f9ad68eff9b0ced6b9954f8c378bb6918ce85e39e2229",
    fingerprint_after: "6ac3134106ac7de7c823b53d4ea86bd49fd7cf507192d7649cab208ece773967",
    population_before: [
      "chip-arrival", "chips-from-inspection", "claim-authorized-match", "claim-authorized-mismatch",
      "claim-client-declaration", "claim-unrecognized-source", "curated-readout", "deposit-fixture",
      "export-paired", "export-single", "first-load", "paired-empty", "paired-legacy",
      "paired-legacy-rows", "paired-matched", "paired-rejected-snippet", "paired-unmatched",
      "provenance-complete", "provenance-partial", "public-example", "public-example-provenance",
      "read-capacity", "read-error", "read-in-flight", "register-overflow",
      "register-overflow-expanded", "share-consent", "share-legacy", "share-not-found",
      "share-paired-no-model", "share-receipt", "share-single", "share-single-empty",
      "single-empty", "single-empty-read", "single-findings",
    ],
    scenarios_added: ["input-integrity-intake", "input-integrity-sample", "input-integrity-zero"],
    scenarios_removed: [],
    // The disposition of each addition against the governed region, recorded because a
    // scenario that DID render the region would move counts, and a reseal is not the place
    // that gets discovered.
    added_scenario_dispositions: [
      { scenario: "input-integrity-intake", renders_region: false, note: "input-integrity.html before a file — the Reader result region is not on this page." },
      { scenario: "input-integrity-sample", renders_region: false, note: "input-integrity.html after the sample PDF surfaces a finding — still no Reader result region." },
      { scenario: "input-integrity-zero", renders_region: false, note: "input-integrity.html after a file that surfaces nothing — still no Reader result region." },
    ],
    // Which scenarios rendered the region BEFORE, so a swap that holds the count at 24 while
    // changing which scenarios make it up is caught. A count alone would not see that.
    region_rendering_before: [
      "chips-from-inspection", "claim-authorized-match", "claim-authorized-mismatch",
      "claim-client-declaration", "claim-unrecognized-source", "deposit-fixture", "export-paired",
      "export-single", "paired-empty", "paired-legacy", "paired-legacy-rows", "paired-matched",
      "paired-rejected-snippet", "paired-unmatched", "provenance-complete", "provenance-partial",
      "read-capacity", "read-error", "register-overflow", "register-overflow-expanded",
      "share-consent", "single-empty", "single-empty-read", "single-findings",
    ],
    // No sha256_before/sha256_after pair, because no hash moved. Each entry is one hash,
    // asserted to be where the source both started and ended, and checked against the live
    // extraction at write time.
    sources_unchanged: [
      { path: "styles.css", extraction: "whole file", sha256: "210fd6d5d1ffad0c4ce520251877c93ce6ff2b1595235507c3805c47d862b48d" },
      { path: "workbench.css", extraction: "whole file", sha256: "5241926ea97f88d52dd5fe9b703152cca4c229d17e484f9b74ba11c6d588822d" },
      { path: "workbench-app.jsx", extraction: "CSS template literals only", sha256: "2a50618370aa4b9e93ffa976970d9e373ce3ae04ebde1748e3b1dff7cb2b0146" },
    ],
    counts_before: {
      declared_token_spends: 33,
      free_alpha_spends: 13,
      distinct_free_alphas: 9,
      free_alpha_spends_resting: 7,
      free_alpha_spends_pseudo_state_only: 6,
    },
    free_alpha_inventory_before: [
      "workbench.css|.wb-btn--ghost:not(:disabled):hover|background|rgba(var(--ember-rgb), 0.06) !important",
      "workbench.css|.wb-btn--ghost:not(:disabled):hover|border-color|rgba(var(--ember-rgb), 0.42) !important",
      "workbench.css|.wb-btn--primary:disabled|background|rgba(var(--ember-rgb), 0.12) !important",
      "workbench.css|.wb-btn--primary:disabled|border-color|rgba(248, 168, 102, 0.22) !important",
      "workbench.css|.wb-demo-trigger:hover|border-color|rgba(var(--ember-rgb), 0.7)",
      "workbench.css|.wb-demo-trigger|border|1px solid rgba(var(--ember-rgb), 0.34)",
      "workbench.css|.wb-loop__panel--second|border-left|2px solid rgba(var(--ember-rgb), 0.55)",
      "workbench.css|.wb-loop__tag|border-left|2px solid rgba(var(--ember-rgb), 0.55)",
      "workbench.css|.wb-loop__unmatched|border-left|2px solid rgba(var(--ember-rgb), 0.55)",
      "workbench.css|.wb-perception__option:hover|border-color|rgba(222, 111, 56, 0.5)",
      "workbench.css|.wb-share-consent__confirm.wb-btn--ghost:not(:disabled)|background|rgba(var(--ember-rgb), 0.16) !important",
      "workbench.css|.wb-share-consent__confirm.wb-btn--ghost:not(:disabled)|border-color|rgba(248, 168, 102, 0.55) !important",
      "workbench.css|.wb-share-consent__panel|border|1px solid rgba(248, 168, 102, 0.22)",
    ],
  },
  {
    date: "2026-08-24",
    authorizing_change:
      "Branch claude/practical-elion-94731d — the homepage and Advisory registered four states on " +
      "the acceptance board ahead of their structural rebuilds, so a rebuild reseals a named frame " +
      "rather than discovering the old one was never photographed. governedScenarios() is the board " +
      "registry, so the census population grew with it. All four are document surfaces on " +
      "index.html and advisory.html; neither page mounts the workbench, so none of them renders a " +
      ".wb-reader-v2__result region and none contributes ember spend to measure. Nothing under this " +
      "census's source list was edited: styles.css, workbench.css and workbench-app.jsx are " +
      "byte-identical to the hashes the previous entry recorded.",
    fingerprint_before: "6ac3134106ac7de7c823b53d4ea86bd49fd7cf507192d7649cab208ece773967",
    fingerprint_after: "c3b0c9bcf58638c30c0eab560c065e31e7b58eea7df5654c1c98f028f0e9d9a6",
    population_before: [
      "chip-arrival", "chips-from-inspection", "claim-authorized-match", "claim-authorized-mismatch",
      "claim-client-declaration", "claim-unrecognized-source", "curated-readout", "deposit-fixture",
      "export-paired", "export-single", "first-load", "input-integrity-intake",
      "input-integrity-sample", "input-integrity-zero", "paired-empty", "paired-legacy",
      "paired-legacy-rows", "paired-matched", "paired-rejected-snippet", "paired-unmatched",
      "provenance-complete", "provenance-partial", "public-example", "public-example-provenance",
      "read-capacity", "read-error", "read-in-flight", "register-overflow",
      "register-overflow-expanded", "share-consent", "share-legacy", "share-not-found",
      "share-paired-no-model", "share-receipt", "share-single", "share-single-empty",
      "single-empty", "single-empty-read", "single-findings",
    ],
    scenarios_added: ["advisory-boundaries", "advisory-masthead", "home-archive-preview", "home-experience"],
    scenarios_removed: [],
    added_scenario_dispositions: [
      { scenario: "advisory-boundaries", renders_region: false, note: "advisory.html, the governance and commercial-boundary region — advisory.html mounts no workbench, so the Reader result region is not on this page." },
      { scenario: "advisory-masthead", renders_region: false, note: "advisory.html, the masthead, lede and thesis — same page, same absence." },
      { scenario: "home-archive-preview", renders_region: false, note: "index.html, the archive preview above the featured case — the homepage links to the Reader and does not embed its result region." },
      { scenario: "home-experience", renders_region: false, note: "index.html, the Your Experience region — it carries the route into the Reader, not the Reader itself." },
    ],
    region_rendering_before: [
      "chips-from-inspection", "claim-authorized-match", "claim-authorized-mismatch",
      "claim-client-declaration", "claim-unrecognized-source", "deposit-fixture", "export-paired",
      "export-single", "paired-empty", "paired-legacy", "paired-legacy-rows", "paired-matched",
      "paired-rejected-snippet", "paired-unmatched", "provenance-complete", "provenance-partial",
      "read-capacity", "read-error", "register-overflow", "register-overflow-expanded",
      "share-consent", "single-empty", "single-empty-read", "single-findings",
    ],
    sources_unchanged: [
      { path: "styles.css", extraction: "whole file", sha256: "210fd6d5d1ffad0c4ce520251877c93ce6ff2b1595235507c3805c47d862b48d" },
      { path: "workbench.css", extraction: "whole file", sha256: "5241926ea97f88d52dd5fe9b703152cca4c229d17e484f9b74ba11c6d588822d" },
      { path: "workbench-app.jsx", extraction: "CSS template literals only", sha256: "2a50618370aa4b9e93ffa976970d9e373ce3ae04ebde1748e3b1dff7cb2b0146" },
    ],
    counts_before: {
      declared_token_spends: 33,
      free_alpha_spends: 13,
      distinct_free_alphas: 9,
      free_alpha_spends_resting: 7,
      free_alpha_spends_pseudo_state_only: 6,
    },
    free_alpha_inventory_before: [
      "workbench.css|.wb-btn--ghost:not(:disabled):hover|background|rgba(var(--ember-rgb), 0.06) !important",
      "workbench.css|.wb-btn--ghost:not(:disabled):hover|border-color|rgba(var(--ember-rgb), 0.42) !important",
      "workbench.css|.wb-btn--primary:disabled|background|rgba(var(--ember-rgb), 0.12) !important",
      "workbench.css|.wb-btn--primary:disabled|border-color|rgba(248, 168, 102, 0.22) !important",
      "workbench.css|.wb-demo-trigger:hover|border-color|rgba(var(--ember-rgb), 0.7)",
      "workbench.css|.wb-demo-trigger|border|1px solid rgba(var(--ember-rgb), 0.34)",
      "workbench.css|.wb-loop__panel--second|border-left|2px solid rgba(var(--ember-rgb), 0.55)",
      "workbench.css|.wb-loop__tag|border-left|2px solid rgba(var(--ember-rgb), 0.55)",
      "workbench.css|.wb-loop__unmatched|border-left|2px solid rgba(var(--ember-rgb), 0.55)",
      "workbench.css|.wb-perception__option:hover|border-color|rgba(222, 111, 56, 0.5)",
      "workbench.css|.wb-share-consent__confirm.wb-btn--ghost:not(:disabled)|background|rgba(var(--ember-rgb), 0.16) !important",
      "workbench.css|.wb-share-consent__confirm.wb-btn--ghost:not(:disabled)|border-color|rgba(248, 168, 102, 0.55) !important",
      "workbench.css|.wb-share-consent__panel|border|1px solid rgba(248, 168, 102, 0.22)",
    ],
  },
];

// ── THE SECOND POPULATION MOVE FOUND THE ROUTE CLOSED, 2026-08-24 ────────────────
// The homepage and Advisory added four board scenarios, moving the population a second
// time. The move was textbook: fingerprint alone, every source hash byte-identical, every
// count identical, every inventory line identical, nothing removed, nothing reclassified.
// A record for it satisfied all eight conditions — measured, not assumed.
//
// --write refused anyway, and not because of the new record. The 2026-08-23 entry ABOVE
// failed conditions 4 and 5, because both read the LIVE population rather than the one the
// record itself claims to have produced. Condition 4 computed fpAfter from live.scenarios,
// forcing every entry's fingerprint_after to equal the current fingerprint; condition 5
// computed the delta as live minus the record's own population_before, forcing every entry
// to claim every scenario added since. Against a 43-scenario population the 2026-08-23
// entry was required to claim it ended at c3b0c9bc… (it ended at 6ac31341…) and to claim
// it added the four homepage and Advisory scenarios (it added the three Input Integrity
// ones). Only the newest entry could ever satisfy them, the array is append-only, and
// --write refuses if ANY entry fails — three properties that cannot hold together once a
// second move happens. The source route never had this: PROVENANCE_RESEALS entries record
// their verdicts and do not gate the write.
//
// Because test/ember-census-fixtures.test.mjs asserts the committed artifact against the
// live registry, the closed route meant any pass adding a board scenario reddened the
// suite with no governed way to green. The finding went to the gate rather than being
// worked around, and the ruling below came back. It is implemented in
// populationResealEvidence() and populationResealChain(); read those for the mechanics.

// The key --check compares inventory lines on. One definition, so the reseal evidence and
// the drift check cannot disagree about what "the same spend" means.
export const inventoryLine = (r) => `${r.source}|${r.selector}|${r.property}|${r.value}`;

function headSha() {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

export function coverageFingerprint({ region = REGION, scenarios, viewports, sources }) {
  const fields = {
    region_selector: region,
    scenarios: [...scenarios].sort(),
    viewports: [...viewports].sort(),
    sources: sources.map((s) => ({ path: s.path, sha256: s.sha256 })).sort((a, b) => a.path.localeCompare(b.path)),
  };
  return { ...fields, sha256: sha256(JSON.stringify(fields)) };
}

// The population a record claims to have produced: what it started from, less what it says
// it removed, plus what it says it added. Derived from the three fields the record already
// carries — no new field, and no way for a record to name a population it did not compute.
export function producedPopulation(record) {
  const removed = new Set(record.scenarios_removed || []);
  const kept = (record.population_before || []).filter((s) => !removed.has(s));
  return [...new Set([...kept, ...(record.scenarios_added || [])])].sort();
}

// The chain that carries the guarantee across every recorded move: each entry starts from
// the population the entry before it produced, and the last entry produces the population
// the instrument measures today. Nothing can be smuggled between two links, and a live move
// with no appended record breaks the final link rather than passing silently.
//
// This is what lets a superseded entry stop being asked about the present. Its own case is
// checked against the population it claims; its connection to today is this chain.
export function populationResealChain(records, livePopulation) {
  const failures = [];
  const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
  records.forEach((r, i) => {
    if (i === 0) return;
    const handedOver = producedPopulation(records[i - 1]);
    const startedFrom = [...(r.population_before || [])].sort();
    if (!same(handedOver, startedFrom)) {
      failures.push({
        link: `${records[i - 1].date} → ${r.date}`,
        detail:
          `the ${records[i - 1].date} entry produced ${handedOver.length} scenarios and the ` +
          `${r.date} entry starts from ${startedFrom.length}; they are not the same population`,
      });
    }
  });
  const last = records[records.length - 1];
  if (last) {
    const produced = producedPopulation(last);
    const measured = [...livePopulation].sort();
    if (!same(produced, measured)) {
      failures.push({
        link: `${last.date} → live`,
        detail:
          `the newest entry produces ${produced.length} scenarios and the instrument measures ` +
          `${measured.length}; a population move with no appended record`,
      });
    }
  }
  return { intact: failures.length === 0, failures };
}

// A population reseal's whole case. Each of the ruling's eight conditions gets its own
// verdict and its own failure line, so a refused reseal says which condition refused it.
// Pure and renderer-free: the negative fixture drives it directly with populations that
// must not be resealable.
//
// WHICH POPULATION A CONDITION ASKS ABOUT — founder ruling of 2026-08-24. Conditions 4, 5
// and the disappearance half of 8 originally read the LIVE population for every entry. That
// is right for the entry being written and a category error for a superseded one: it asks a
// record about a move that happened after it, and since only the newest entry can ever
// answer, the second population move closed the route for good. The array is append-only and
// --write refuses if any entry fails, so those two properties could not both hold once a
// second move happened. The ruling: a superseded entry is validated against the population
// IT claims to have produced, only the newest must reproduce the live population, and the
// array stays append-only. Nothing is loosened — a record still cannot claim a move it did
// not make, and populationResealChain() pins every entry to the next and the last to today.
//
// isNewest defaults true, so a caller checking a single record in isolation gets the
// live-anchored reading unchanged.
export function populationResealEvidence(record, live, { isNewest = true } = {}) {
  const failures = [];
  const fail = (condition, detail) => failures.push({ condition, detail });
  const sorted = (a) => [...(a || [])].sort();
  const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

  // Before any of the record's own claims are read: a record carrying the other route's
  // evidence is refused. Reading it twice is the route-around the ruling forbids.
  const contaminated = SOURCE_RESEAL_EVIDENCE_KEYS.filter((k) => k in record);
  if (contaminated.length) {
    fail("route separation", `carries source-reseal evidence: ${contaminated.join(", ")}`);
  }

  // (1) Every governed source hash byte-identical. The record names one hash per source, not
  // a delta, and every source the instrument hashes has to appear.
  const liveHashes = new Map(live.sources.map((s) => [s.path, s.sha256]));
  const recordedHashes = new Map((record.sources_unchanged || []).map((s) => [s.path, s.sha256]));
  const movedSources = [...liveHashes].filter(([p, h]) => recordedHashes.get(p) !== h).map(([p]) => p);
  const unnamedSources = [...liveHashes.keys()].filter((p) => !recordedHashes.has(p));
  const sourceHashesIdentical = movedSources.length === 0 && unnamedSources.length === 0 && recordedHashes.size === liveHashes.size;
  if (!sourceHashesIdentical) {
    fail(
      "1 — governed source hashes unchanged",
      movedSources.length
        ? `source hash moved: ${movedSources.join(", ")} — the source rule governs this, not the population rule`
        : `governed sources not accounted for: ${unnamedSources.join(", ") || "record names sources the instrument does not hash"}`,
    );
  }

  // (2) Every measured count identical.
  const countsIdentical = Object.keys(live.counts).every((k) => record.counts_before[k] === live.counts[k]);
  if (!countsIdentical) {
    const moved = Object.keys(live.counts).filter((k) => record.counts_before[k] !== live.counts[k]);
    fail("2 — measured counts unchanged", moved.map((k) => `${k}: ${record.counts_before[k]} → ${live.counts[k]}`).join("; "));
  }

  // (3) Every governed inventory line identical.
  const inventoryBefore = sorted(record.free_alpha_inventory_before);
  const inventoryAfter = sorted(live.inventory);
  const inventoryIdentical = same(inventoryBefore, inventoryAfter);
  if (!inventoryIdentical) fail("3 — governed inventory unchanged", "a free-alpha inventory line moved");

  // (4) The population is the only fingerprint input that moved. Not asserted — demonstrated:
  // swapping ONLY the scenario list, against the live region, viewports and source hashes,
  // has to reproduce both ends of the claimed fingerprint move. If the region selector, a
  // viewport or a source had also moved, neither end would come back. Both ends come from
  // the record's own populations, so the demonstration is about the move the record claims
  // rather than about whatever the board holds today.
  const claimedAfter = producedPopulation(record);
  const fpBefore = coverageFingerprint({
    region: live.region, scenarios: record.population_before || [], viewports: live.viewports, sources: live.sources,
  }).sha256;
  const fpAfter = coverageFingerprint({
    region: live.region, scenarios: claimedAfter, viewports: live.viewports, sources: live.sources,
  }).sha256;
  const populationIsOnlyMovedInput = fpBefore === record.fingerprint_before && fpAfter === record.fingerprint_after;
  if (!populationIsOnlyMovedInput) {
    fail(
      "4 — population is the only moved fingerprint input",
      `recomputing with the recorded population gives ${fpBefore} (record claims ${record.fingerprint_before}); ` +
        `with the population it claims to have produced ${fpAfter} (record claims ${record.fingerprint_after})`,
    );
  }

  // And the newest entry alone answers for today: the population it produced has to be the
  // one the instrument just measured. This is the check that refuses a live population move
  // carrying no appended record, and it is why moving 4 off live costs nothing.
  if (isNewest && !same(claimedAfter, [...live.scenarios].sort())) {
    fail(
      "4 — the newest entry reproduces the live population",
      `it produces ${claimedAfter.length} scenarios and the instrument measures ${live.scenarios.length}`,
    );
  }

  // (5) The exact additions and removals, enumerated. Against the record's own produced
  // population for the same reason as (4).
  const before = new Set(record.population_before || []);
  const after = new Set(claimedAfter);
  const addedObserved = claimedAfter.filter((s) => !before.has(s)).sort();
  const removedObserved = [...before].filter((s) => !after.has(s)).sort();
  const deltaMatchesRecord =
    same(addedObserved, sorted(record.scenarios_added)) && same(removedObserved, sorted(record.scenarios_removed));
  if (!deltaMatchesRecord) {
    fail(
      "5 — additions and removals enumerated",
      `observed added [${addedObserved.join(", ")}] removed [${removedObserved.join(", ")}]; ` +
        `record says added [${sorted(record.scenarios_added).join(", ")}] removed [${sorted(record.scenarios_removed).join(", ")}]`,
    );
  }

  // (6) Each added scenario's governed-region disposition, recorded and true.
  const liveRegion = new Set(live.scenariosRenderingRegion);
  const dispositions = record.added_scenario_dispositions || [];
  const dispositionsCoverAdditions = same(sorted(dispositions.map((d) => d.scenario)), sorted(record.scenarios_added));
  const wrongDispositions = dispositions.filter((d) => d.renders_region !== liveRegion.has(d.scenario));
  const dispositionsHold = dispositionsCoverAdditions && wrongDispositions.length === 0;
  if (!dispositionsHold) {
    fail(
      "6 — each addition's region disposition recorded",
      wrongDispositions.length
        ? wrongDispositions.map((d) => `${d.scenario}: recorded renders_region=${d.renders_region}, measured ${liveRegion.has(d.scenario)}`).join("; ")
        : "the dispositions do not cover exactly the enumerated additions",
    );
  }

  // (7) Tied to an explicit authorized change.
  const authorized = typeof record.authorizing_change === "string" && record.authorizing_change.trim().length > 20;
  if (!authorized) fail("7 — tied to an authorized change", "the authorizing change must be named and described, not merely asserted");

  // (8) Nothing existing disappeared or changed classification silently. The retained
  // scenarios are checked one at a time against the recorded region list, so a swap that
  // holds the region count still is caught — a count alone would not see it.
  //
  // Disappearance is asked of the newest entry against the live board, where it has teeth:
  // a scenario gone without being enumerated is caught there. Asking it of a superseded
  // entry against the live board is the same category error as (4), and asking it against
  // that entry's own produced population answers itself. So for superseded entries the
  // question is carried by populationResealChain(), which pins each entry's starting
  // population to the one before it and catches exactly the same disappearance.
  const declaredRemoved = new Set(record.scenarios_removed || []);
  const retained = (record.population_before || []).filter((s) => !declaredRemoved.has(s));
  const liveSet = new Set(live.scenarios);
  const vanished = isNewest ? retained.filter((s) => !liveSet.has(s)) : [];
  const regionBefore = new Set(record.region_rendering_before || []);
  const reclassified = retained.filter((s) => after.has(s) && regionBefore.has(s) !== liveRegion.has(s));
  const retainedUnchanged = vanished.length === 0 && reclassified.length === 0;
  if (!retainedUnchanged) {
    fail(
      "8 — no silent disappearance or reclassification",
      [
        vanished.length ? `gone without being enumerated: ${vanished.join(", ")}` : "",
        reclassified.length ? `region disposition changed: ${reclassified.join(", ")}` : "",
      ].filter(Boolean).join("; "),
    );
  }

  return {
    ...record,
    // The population this entry produced, which for the newest is the one just measured.
    population_after: claimedAfter,
    is_newest_entry: isNewest,
    scenarios_added_observed: addedObserved,
    scenarios_removed_observed: removedObserved,
    region_rendering_after: [...live.scenariosRenderingRegion].sort(),
    counts_after: live.counts,
    free_alpha_inventory_after: inventoryAfter,
    fingerprint_before_recomputed: fpBefore,
    fingerprint_after_recomputed: fpAfter,
    source_hashes_identical: sourceHashesIdentical,
    counts_identical: countsIdentical,
    free_alpha_inventory_identical: inventoryIdentical,
    measured_state_moved: !(countsIdentical && inventoryIdentical),
    population_is_the_only_moved_input: populationIsOnlyMovedInput,
    population_delta_matches_record: deltaMatchesRecord,
    added_scenario_dispositions_hold: dispositionsHold,
    retained_scenarios_unchanged: retainedUnchanged,
    eligible: failures.length === 0,
    failures,
  };
}

export function buildArtifact({ inv, states, browserVersion, scenarios, viewports }) {
  const regionStates = states.filter((s) => s.region);
  const seen = new Map();
  for (const st of regionStates) {
    for (const [id, m] of Object.entries(st.matched)) {
      const prev = seen.get(id) || { inRegion: false, outside: false, restingInRegion: false, states: [] };
      prev.inRegion ||= m.inRegion && m.mediaHolds;
      prev.outside ||= m.outside && m.mediaHolds;
      prev.restingInRegion ||= m.restingInRegion && m.mediaHolds;
      if (m.inRegion && m.mediaHolds) prev.states.push(`${st.scenario}@${st.viewport}`);
      seen.set(id, prev);
    }
  }

  const inRegion = [];
  inv.rows.forEach((d, i) => {
    const m = seen.get(String(i));
    if (!m || !m.inRegion) return;
    inRegion.push({
      source: d.source,
      selector: d.selector,
      property: d.property,
      value: d.value,
      media: d.media,
      pseudo_state_only: d.parts.every((p) => p.pseudoState),
      resting: m.restingInRegion,
      scope: m.outside ? "also-outside" : "region-only",
      declared_tokens: d.declaredTokens,
      free_alphas: d.freeAlphas,
      literal_hues: d.literalHues,
      adjacent_hues: d.adjacent,
      states: m.states.sort(),
    });
  });
  inRegion.sort((a, b) => `${a.source}|${a.selector}|${a.property}`.localeCompare(`${b.source}|${b.selector}|${b.property}`));

  const declaredSpends = inRegion.filter((r) => r.declared_tokens.length);
  const freeSpends = inRegion.filter((r) => r.free_alphas.length);
  const restingFree = freeSpends.filter((r) => r.resting && !r.pseudo_state_only);
  const distinctFree = [...new Set(freeSpends.flatMap((r) => r.free_alphas.map((f) => f.alpha)))].sort();

  const restingPaint = [];
  const restingSeen = new Set();
  for (const st of regionStates) {
    for (const r of st.resting || []) {
      for (const m of String(r.value).matchAll(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/g)) {
        const hue = `${m[1]}, ${m[2]}, ${m[3]}`;
        if (!inv.ramp.hues.has(hue)) continue;
        const alpha = m[4] === undefined ? "1" : m[4];
        if (alpha === "1") continue;
        const k = `${r.cls}|${r.prop}|${hue}|${alpha}`;
        if (restingSeen.has(k)) continue;
        restingSeen.add(k);
        restingPaint.push({ cls: r.cls, tag: r.tag, property: r.prop, hue, alpha });
      }
    }
  }
  restingPaint.sort((a, b) => `${a.cls}|${a.property}|${a.alpha}`.localeCompare(`${b.cls}|${b.property}|${b.alpha}`));

  const counts = {
    declared_token_spends: declaredSpends.length,
    free_alpha_spends: freeSpends.length,
    distinct_free_alphas: distinctFree.length,
    free_alpha_spends_resting: restingFree.length,
    free_alpha_spends_pseudo_state_only: freeSpends.length - restingFree.length,
  };
  const freeAlphaInventory = freeSpends.map((r) => ({
    source: r.source,
    selector: r.selector,
    property: r.property,
    value: r.value,
    media: r.media,
    scope: r.scope,
    pseudo_state_only: r.pseudo_state_only,
    alphas: r.free_alphas.map((f) => f.alpha),
  }));
  const inventoryNow = freeAlphaInventory.map(inventoryLine).sort();
  const regionScenarios = [...new Set(regionStates.map((s) => s.scenario))].sort();

  return {
    instrument: "scripts/qa/ember-census.mjs",
    rule: "R14 — ember spends only against the standing role registry",
    notes: CENSUS_NOTES,
    measured_at_master: headSha(),
    renderer: browserVersion,
    coverage_fingerprint: coverageFingerprint({ scenarios, viewports, sources: inv.sources }),
    // Why this fingerprint is the one it is. The rule is static; the identity evidence
    // beside each reseal is measured here, against this run, so an entry that claims an
    // identity the instrument no longer reproduces says so in the artifact it is written into.
    provenance: {
      reseal_rule: PROVENANCE_RESEAL_RULE,
      reseals: PROVENANCE_RESEALS.map((r) => {
        const countsIdentical = Object.keys(counts).every((k) => r.counts_before[k] === counts[k]);
        const before = [...r.free_alpha_inventory_before].sort();
        const inventoryIdentical =
          before.length === inventoryNow.length && before.every((k, i) => k === inventoryNow[i]);
        return {
          ...r,
          counts_after: counts,
          counts_identical: countsIdentical,
          free_alpha_inventory_after: inventoryNow,
          free_alpha_inventory_identical: inventoryIdentical,
          measured_state_moved: !(countsIdentical && inventoryIdentical),
          // The mirror of the population route's route-separation check. A source reseal
          // that reached for population evidence would be claiming the other rule's ground.
          carries_population_evidence: POPULATION_RESEAL_EVIDENCE_KEYS.filter((k) => k in r),
        };
      }),
      population_reseal_rule: POPULATION_RESEAL_RULE,
      population_reseals: POPULATION_RESEALS.map((r, i) =>
        populationResealEvidence(
          r,
          {
            region: REGION,
            scenarios: [...scenarios].sort(),
            viewports: [...viewports].sort(),
            sources: inv.sources,
            scenariosRenderingRegion: regionScenarios,
            counts,
            inventory: inventoryNow,
          },
          { isNewest: i === POPULATION_RESEALS.length - 1 },
        ),
      ),
      // What ties the superseded entries to today: link by link, and the last link to the
      // live population. Written into the artifact so the chain is a receipt, not a claim.
      population_reseal_chain: populationResealChain(POPULATION_RESEALS, [...scenarios].sort()),
    },
    source_extraction: inv.sources.map((s) => ({ path: s.path, extraction: s.extraction, sha256: s.sha256 })),
    declared_ramp: {
      paint_tokens: inv.ramp.paintTokens,
      channel_tokens: inv.ramp.channelTokens,
      hues: [...inv.ramp.hues].sort(),
    },
    scenarios_rendering_region: regionScenarios,
    counts,
    distinct_free_alphas: distinctFree,
    free_alpha_inventory: freeAlphaInventory,
    declared_token_inventory: declaredSpends.map((r) => ({
      source: r.source, selector: r.selector, property: r.property, tokens: r.declared_tokens, scope: r.scope,
    })),
    literal_hue_inventory: inRegion
      .filter((r) => r.literal_hues.length)
      .map((r) => ({ source: r.source, selector: r.selector, property: r.property, value: r.value, scope: r.scope })),
    adjacent_hue_inventory: inRegion
      .filter((r) => r.adjacent_hues.length)
      .map((r) => ({ source: r.source, selector: r.selector, property: r.property, hues: r.adjacent_hues.map((a) => a.hue), scope: r.scope })),
    resting_computed_free_alpha: restingPaint,
    r14_adjudication: {
      ...R14_ADJUDICATION,
      subjects: freeSpends
        .filter((r) => r.scope === "region-only")
        .map((r) => ({
          selector: r.selector,
          property: r.property,
          value: r.value,
          resting_paint: !r.pseudo_state_only,
          note: R14_ADJUDICATION.per_subject_notes[r.selector] || null,
        })),
    },
    in_region: inRegion,
  };
}

// ── The drift contract ───────────────────────────────────────────────────────
// The authored half recomputes from text alone, so the suite checks it on every run
// without a renderer. The driven half — which selectors reach the region — needs Chrome
// and is checked by `--check`.
export function authoredProjection(artifact) {
  return {
    fingerprint: artifact.coverage_fingerprint.sha256,
    sources: artifact.source_extraction.map((s) => `${s.path}:${s.sha256}`).sort(),
    ramp: artifact.declared_ramp.hues,
    governed: artifact.in_region
      .map((r) => `${r.source}|${r.media.join("&")}|${r.selector}|${r.property}|${r.value}`)
      .sort(),
  };
}

export function recomputeAuthored(artifact, root = REPO_ROOT) {
  const inv = authoredInventory(root);
  const fp = coverageFingerprint({
    scenarios: artifact.coverage_fingerprint.scenarios,
    viewports: artifact.coverage_fingerprint.viewports,
    sources: inv.sources,
  });
  const present = new Set(inv.rows.map(key));
  return {
    fingerprint: fp.sha256,
    sources: inv.sources.map((s) => `${s.path}:${s.sha256}`).sort(),
    ramp: [...inv.ramp.hues].sort(),
    governed: artifact.in_region
      .map((r) => `${r.source}|${r.media.join("&")}|${r.selector}|${r.property}|${r.value}`)
      .filter((k) => present.has(k))
      .sort(),
  };
}

// ── CLI ──────────────────────────────────────────────────────────────────────
function report(a) {
  log("\n── Result-region ember census ──\n");
  log(`  region                      ${REGION}`);
  log(`  coverage fingerprint        ${a.coverage_fingerprint.sha256}`);
  log(`  scenarios driven            ${a.coverage_fingerprint.scenarios.length}`);
  log(`  scenarios rendering region  ${a.scenarios_rendering_region.length}`);
  log(`  viewports                   ${a.coverage_fingerprint.viewports.join(", ")}\n`);
  log(`  declared-token spends       ${a.counts.declared_token_spends}`);
  log(`  free-alpha spends           ${a.counts.free_alpha_spends}`);
  log(`  distinct free alphas        ${a.counts.distinct_free_alphas}  (${a.distinct_free_alphas.join(", ")})`);
  log(`    of those, resting paint   ${a.counts.free_alpha_spends_resting}`);
  log(`    of those, pseudo-state    ${a.counts.free_alpha_spends_pseudo_state_only}\n`);
  log("  free-alpha inventory:");
  for (const r of a.free_alpha_inventory) {
    const flags = [r.scope, r.pseudo_state_only ? "pseudo-state only" : "resting"].join(", ");
    log(`    ${r.selector}`);
    log(`      ${r.property}: ${r.value}`);
    log(`      ${flags} · ${r.source}`);
  }
  if (a.adjacent_hue_inventory.length) {
    log("\n  adjacent accent hues in region (NOT counted as ember — off the declared ramp):");
    for (const r of a.adjacent_hue_inventory) log(`    ${r.selector} · ${r.property} · ${r.hues.join(" ")}`);
  }
  log(`\n  resting computed free-alpha ember paint: ${a.resting_computed_free_alpha.length} distinct (element class, property, alpha)`);
}

async function main() {
  const args = process.argv.slice(2);
  const out = await measure();
  const artifact = buildArtifact(out);
  const target = path.join(REPO_ROOT, BASELINE_PATH);

  if (args.includes("--json")) {
    log(JSON.stringify(artifact, null, 2));
    return 0;
  }
  report(artifact);

  if (args.includes("--write")) {
    // A reseal path that cannot refuse asserts a result it never computed. Every population
    // reseal in the artifact has to hold against THIS run before the artifact is written,
    // and a source reseal that reached for population evidence is refused the same way.
    const refused = artifact.provenance.population_reseals.filter((r) => !r.eligible);
    const crossed = artifact.provenance.reseals.filter((r) => r.carries_population_evidence.length);
    const chain = artifact.provenance.population_reseal_chain;
    if (refused.length || crossed.length || !chain.intact) {
      log("\n  ✗ refusing to write: a recorded reseal does not hold against this measurement.");
      for (const r of refused) {
        log(`      population reseal ${r.date} — ${r.failures.length} condition(s) refused it:`);
        for (const f of r.failures) log(`        ${f.condition}: ${f.detail}`);
      }
      for (const f of chain.failures) {
        log(`      population reseal chain broken at ${f.link}: ${f.detail}`);
      }
      for (const r of crossed) {
        log(`      source reseal ${r.date} carries population evidence: ${r.carries_population_evidence.join(", ")}`);
      }
      log("\n      Neither route may satisfy the other. Fix the record or report the finding;");
      log("      do not move the artifact to meet it.");
      return 1;
    }
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, `${JSON.stringify(artifact, null, 2)}\n`);
    log(`\n  wrote ${BASELINE_PATH}`);
    return 0;
  }

  if (args.includes("--check")) {
    if (!fs.existsSync(target)) {
      log(`\n  ✗ no baseline at ${BASELINE_PATH}`);
      return 1;
    }
    const base = JSON.parse(fs.readFileSync(target, "utf8"));
    const diffs = [];
    let fingerprintOnly = false;
    if (base.coverage_fingerprint.sha256 !== artifact.coverage_fingerprint.sha256) {
      diffs.push(
        `coverage fingerprint: ${base.coverage_fingerprint.sha256} → ${artifact.coverage_fingerprint.sha256}. ` +
          "The governed population moved. Compare unlike populations and every count below is meaningless.",
      );
      // Which of the two things this is depends entirely on whether any line follows it.
      fingerprintOnly = true;
    }
    for (const k of Object.keys(artifact.counts)) {
      if (base.counts[k] !== artifact.counts[k]) diffs.push(`${k}: ${base.counts[k]} → ${artifact.counts[k]}`);
    }
    const was = new Set(base.free_alpha_inventory.map(inventoryLine));
    const now = new Set(artifact.free_alpha_inventory.map(inventoryLine));
    for (const k of now) if (!was.has(k)) diffs.push(`new free-alpha spend: ${k}`);
    for (const k of was) if (!now.has(k)) diffs.push(`free-alpha spend gone: ${k}`);
    if (diffs.length) {
      log("\n  ✗ census diverges from the committed baseline:");
      for (const d of diffs) log(`      ${d}`);
      // The reseal condition, stated where an operator reads the failure rather than
      // only in the rule they would have to already know to go and read. A fingerprint line
      // alone does not say WHICH rule governs, and sending a population change to the source
      // rule is what produced the 2026-08-23 ruling: the only way through that door was to
      // name a source edit that had not happened.
      if (fingerprintOnly && diffs.length === 1) {
        const hashes = (fp) => fp.sources.map((s) => `${s.path}:${s.sha256}`).sort().join("\n");
        const sourcesMoved = hashes(base.coverage_fingerprint) !== hashes(artifact.coverage_fingerprint);
        const populationMoved =
          base.coverage_fingerprint.scenarios.join("\n") !== artifact.coverage_fingerprint.scenarios.join("\n");
        log("\n      Fingerprint only: no count moved and no inventory line moved.");
        if (sourcesMoved && !populationMoved) {
          log("      A governed source hash moved. Per PROVENANCE_RESEAL_RULE this is resealable");
          log("      with --write once the movement is attributed to an identified authorized edit");
          log("      and recorded in PROVENANCE_RESEALS.");
        } else if (populationMoved && !sourcesMoved) {
          const was = new Set(base.coverage_fingerprint.scenarios);
          const now = new Set(artifact.coverage_fingerprint.scenarios);
          const added = artifact.coverage_fingerprint.scenarios.filter((s) => !was.has(s));
          const gone = base.coverage_fingerprint.scenarios.filter((s) => !now.has(s));
          log(`      The governed scenario population moved and no governed source hash did:`);
          log(`        ${base.coverage_fingerprint.scenarios.length} → ${artifact.coverage_fingerprint.scenarios.length} scenarios`);
          if (added.length) log(`        added:   ${added.join(", ")}`);
          if (gone.length) log(`        removed: ${gone.join(", ")}`);
          log("      Per POPULATION_RESEAL_RULE this is resealable with --write once the movement");
          log("      is tied to an authorized change and recorded in POPULATION_RESEALS with its");
          log("      enumerated delta. Do NOT record it as a source reseal: no source hash moved,");
          log("      and there is no authorized source edit to name.");
        } else if (populationMoved && sourcesMoved) {
          log("      BOTH a governed source hash and the governed scenario population moved. Neither");
          log("      rule governs a compound move on its own — separate the two changes and report.");
        }
        log("      A reseal records provenance; it accepts nothing.");
      }
      return 1;
    }
    log("\n  ✓ census matches the committed baseline.");
    return 0;
  }
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  main().then((c) => process.exit(c), (e) => { log(`\n  ✗ ${e.stack || e.message}`); process.exit(1); });
}
