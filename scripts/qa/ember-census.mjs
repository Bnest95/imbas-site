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
  open_for_founder_ruling:
    "Whether the ember left-rule idiom (.wb-loop__panel--second, .wb-loop__tag, " +
    ".wb-loop__unmatched) maps to R14 registry role 1, 'evidence signal/mark', is not " +
    "decided here. Doctrine section 6 judgment 6 reserves accent-token reconciliation to the " +
    "founder and section 7 risk 2 forbids an implementer renaming decoration as semantics. " +
    "See r14_adjudication for the full record.",
};

// ── The R14 adjudication ─────────────────────────────────────────────────────
// The census exists to serve R14, so the census file is where the adjudication belongs:
// an exception recorded in prose somewhere else is an exception preserved silently.
//
// The subject list is BUILT FROM THE MEASUREMENT below, never typed here, so a selector
// that stops painting free alpha in the region leaves this record on its own and a new
// one arrives without anybody remembering to add it.
export const R14_ADJUDICATION = {
  disposition: "held — founder ruling requested",
  changed_in_this_lane: "No CSS. No declaration below was substituted, retired, or moved.",
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
    "finding. This census reports it; R14 does not adjudicate it.",
  why_the_role_question_cannot_be_settled_here: [
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
    "authorizes the movement or the baselines it would need.",
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
  what_a_ruling_would_have_to_say: [
    "whether the 2px ember left-rule idiom is registry role 1, role 3, or not a registry role;",
    "whether hover feedback is an 'ember use' R14 governs at all, or interaction affordance " +
      "outside the registry;",
    "whether ember spends must route through declared ramp tokens, which R14 does not say and " +
      "which would be a new rule rather than an application of this one;",
    "if they must, whether the ramp gains tokens at the shipped alphas or the shipped alphas " +
      "move to the declared ones — the second moves product pixels and needs its own baseline " +
      "acceptance.",
  ],
};

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

  return {
    instrument: "scripts/qa/ember-census.mjs",
    rule: "R14 — ember spends only against the standing role registry",
    notes: CENSUS_NOTES,
    measured_at_master: headSha(),
    renderer: browserVersion,
    coverage_fingerprint: coverageFingerprint({ scenarios, viewports, sources: inv.sources }),
    source_extraction: inv.sources.map((s) => ({ path: s.path, extraction: s.extraction, sha256: s.sha256 })),
    declared_ramp: {
      paint_tokens: inv.ramp.paintTokens,
      channel_tokens: inv.ramp.channelTokens,
      hues: [...inv.ramp.hues].sort(),
    },
    scenarios_rendering_region: [...new Set(regionStates.map((s) => s.scenario))].sort(),
    counts: {
      declared_token_spends: declaredSpends.length,
      free_alpha_spends: freeSpends.length,
      distinct_free_alphas: distinctFree.length,
      free_alpha_spends_resting: restingFree.length,
      free_alpha_spends_pseudo_state_only: freeSpends.length - restingFree.length,
    },
    distinct_free_alphas: distinctFree,
    free_alpha_inventory: freeSpends.map((r) => ({
      source: r.source,
      selector: r.selector,
      property: r.property,
      value: r.value,
      media: r.media,
      scope: r.scope,
      pseudo_state_only: r.pseudo_state_only,
      alphas: r.free_alphas.map((f) => f.alpha),
    })),
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
    if (base.coverage_fingerprint.sha256 !== artifact.coverage_fingerprint.sha256) {
      diffs.push(
        `coverage fingerprint: ${base.coverage_fingerprint.sha256} → ${artifact.coverage_fingerprint.sha256}. ` +
          "The governed population moved. Compare unlike populations and every count below is meaningless.",
      );
    }
    for (const k of Object.keys(artifact.counts)) {
      if (base.counts[k] !== artifact.counts[k]) diffs.push(`${k}: ${base.counts[k]} → ${artifact.counts[k]}`);
    }
    const line = (r) => `${r.source}|${r.selector}|${r.property}|${r.value}`;
    const was = new Set(base.free_alpha_inventory.map(line));
    const now = new Set(artifact.free_alpha_inventory.map(line));
    for (const k of now) if (!was.has(k)) diffs.push(`new free-alpha spend: ${k}`);
    for (const k of was) if (!now.has(k)) diffs.push(`free-alpha spend gone: ${k}`);
    if (diffs.length) {
      log("\n  ✗ census diverges from the committed baseline:");
      for (const d of diffs) log(`      ${d}`);
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
