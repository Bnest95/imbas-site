/* The mechanical half of the 34-point acceptance gate.
 *
 *   node build/gate.mjs
 *
 * The gate is 10 research principles plus 24 anti-patterns, per direction. Many of
 * those are judgements a script cannot make. Several are not: a forbidden lexicon,
 * a forbidden glyph set, and the palette are all decidable against the rendered
 * DOM, and deciding them there is stronger than deciding them against the source,
 * because it catches anything a stylesheet draws as well as anything the fixture
 * says.
 *
 * Every row of the capture matrix is loaded in the governed renderer and swept.
 * The judgement half of the gate is written up in GATE.md and cites this output.
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromiumLaunch, VIEWPORTS, SETTLE_MS, LANE, RENDERER } from "./shoot.mjs";
import { specs } from "./matrix.mjs";

/* Words and shapes that carry a judgement about the world, a compression of the
 * record into a number, a motive, or a borrowed authority. Checked against every
 * rendered user-facing string, including strings a stylesheet draws. */
const LEXICON = [
  { ap: "AP1",  label: "verdict language",     re: /\b(wrong|false|untrue|misleading|debunk\w*|busted|caught|exposed?|failed the|gets it wrong|lie[sd]?)\b/i },
  { ap: "AP2",  label: "score compression",    re: /\b(score[ds]?|scoring|grade[ds]?|rating|rated|out of (ten|five|10|5)|confidence|accuracy)\b/i },
  { ap: "AP2",  label: "numeric compression",  re: /\d\s?%|\b\d+(\.\d+)?\s?\/\s?(5|10|100)\b/ },
  { ap: "AP6",  label: "urgency mechanics",    re: /\b(urgent|act now|hurry|don'?t wait|last chance|expires? in|countdown|time is running|before it'?s too late)\b/i },
  { ap: "AP17", label: "fake precision",       re: /\b\d+\.\d{2,}\b/ },
  /* Motive is the thing forbidden, and motive is a claim about the model. Second
   * person is the reader's own intent and carries none, so "the answer you want to
   * look at" is not a motive verb and the pattern steps over it. */
  { ap: "AP18", label: "motive verbs",         re: /(?<!\b(you|i|we|they)\s)\b(hid|hide[sd]?|hiding|conceal\w*|withh\w*|refus\w*|wants? to|wanted to|tr(y|ies|ied) to|intend\w*|deliberat\w*|avoid(s|ed)? (say|admit|mention)\w*|chose to)\b/i },
  { ap: "AP19", label: "borrowed authority",   re: /\b(certified|accredited|iso ?\d|verified by|trusted by|as seen in|award-winning|peer[- ]reviewed by|endorsed)\b/i },
  { ap: "AP10", label: "leaderboard framing",  re: /\b(leaderboard|rank(ed|ing)?|top \d|#\d\b|beats?|outperform\w*|head[- ]to[- ]head|versus\b|\bvs\.?\b)\b/i },
  { ap: "AP9",  label: "chatbot framing",      re: /\b(chat with|ask me|talk to (the|our)|type your message|send a message|conversation with)\b/i },
  { ap: "AP23", label: "silent correction",    re: /\b(should have (said|appeared|been)|should say|correct(ed)? version|the right answer is|instead of that|here'?s what it missed)\b/i },
  { ap: "AP5",  label: "alarm register",       re: /\b(alarming|shocking|disturbing|dangerous|scandal|crisis|red flag|beware|warning:)\b/i },
  /* The counting doctrine the Check Register arrives with. A literal census is
   * permitted — "N checks ran. M produced one or more findings." — and every form
   * that turns that census into a verdict is not. The distinction is the reason the
   * zone can exist at all: "3 checks ran, 1 produced findings" records what was
   * examined, and "1 of 3 failed" grades the answer, from the same two integers.
   *
   * `pass` and `fail` are word-anchored so "passage", "PASSAGE_CONTEXT" and "bypass"
   * go through untouched — the register speaks about passages constantly.
   *
   * A bare `percent` is deliberately not here. AP2 already owns the numeric form,
   * `\d\s?%`, which is what "X% passed" actually looks like; the spelled-out word on
   * its own belongs to whatever the record is talking about, and one of these records
   * is about a repair guidance rule stated in percent. A rule that cannot tell those
   * apart teaches the wrong lesson to whoever reads its output. */
  { ap: "COUNT", label: "checks as a grade",   re: /\b\d+\s*(?:of|out of|\/)\s*\d+\b|\b(?:failure|success|pass|error|hit|miss)[-\s]rates?\b|\b(?:passed|passes|failed|fails|failing|pass|fail)\b|\b\d+(?:\.\d+)?\s*percent\s+(?:of\s+)?(?:the\s+)?(?:checks?|tests?|findings?|records?)\b|\bratio\s+of\b/i },
];

/* Glyphs that render a verdict, a pass/fail or a severity, whatever the words
 * around them say. Written as escapes: the traffic-light and siren emoji are
 * astral, and pasting them into a character class splits their surrogate pairs
 * into two unrelated BMP characters that then match ordinary digits. */
const GLYPHS = new RegExp(
  "[\\u2713\\u2714\\u2715\\u2716\\u2717\\u2718\\u274C\\u2705\\u26A0\\u26D4\\u2B50\\u2757\\u203C\\u2691]" +
    "|[\\u{1F6A9}\\u{1F534}\\u{1F535}\\u{1F7E0}\\u{1F7E1}\\u{1F7E2}\\u{1F6A6}\\u{1F6A8}\\u{1F3C1}\\u{1F44D}\\u{1F44E}]",
  "u",
);

/* The palette, as the frozen token file defines it. Four rule tokens and four
 * ember washes carry alpha, so what reaches the screen is a composite rather than
 * a token — the allowed set is therefore every ink over every ground, computed
 * the same way the renderer computes it. A severity ramp or a traffic light
 * cannot be introduced without a colour outside this closure. */
const GROUNDS = ["#120E0D", "#2A211E", "#3C302C", "#4E403C", "#61514C"];
const INKS = [
  "#FCF8EC", "#F2E8DC", "#D4CFC2", "#B9B1AA", "#A59A8F",
  "#DE6F38", "#C85830", "#F08F58", "#F8A866",
  "rgba(242,232,220,0.09)", "rgba(242,232,220,0.15)", "rgba(242,232,220,0.24)", "rgba(252,248,236,0.38)",
  "rgba(222,111,56,0.30)", "rgba(222,111,56,0.14)", "rgba(248,168,102,0.62)", "rgba(240,143,88,0.36)",
  "#000000", "#FFFFFF",
];

function parse(c) {
  if (c[0] === "#") return { r: parseInt(c.slice(1, 3), 16), g: parseInt(c.slice(3, 5), 16), b: parseInt(c.slice(5, 7), 16), a: 1 };
  const p = c.match(/[\d.]+/g).map(Number);
  return { r: p[0], g: p[1], b: p[2], a: p[3] ?? 1 };
}
function flatten(fg, bg) {
  return fg.a >= 1 ? fg : { r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 };
}
function toHex(c) {
  return "#" + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase();
}

/* Rules stack: a hairline over a ground becomes a ground for the next hairline, so
 * the closure is taken to two levels before it stops producing new colours. */
const PALETTE = new Set(GROUNDS);
for (let pass = 0; pass < 3; pass += 1) {
  for (const g of [...PALETTE]) for (const i of INKS) PALETTE.add(toHex(flatten(parse(i), parse(g))));
}

const sweep = `(() => {
  /* Open every disclosure before reading a single character.
   *
   * The loop below skips display:none, which is correct — it exists so the sweep
   * reports the colours a reader can actually see. But B's reading strata put real
   * record prose inside closed <details>, and a string is not exempt from this gate
   * because a reader has not opened the section it lives in. Left alone, introducing
   * the strata would have quietly narrowed what this file inspects.
   *
   * So: force every disclosure open first, then sweep. The gate now sees strictly
   * more than it saw before the strata existed, and no rule was loosened to get
   * there. Nothing is restored afterwards because the page is discarded. */
  const opened = Array.from(document.querySelectorAll("details"));
  opened.forEach((d) => { d.open = true; });

  const LEX = __LEX__.map((d) => ({ ap: d.ap, label: d.label, re: new RegExp(d.src, d.flags) }));
  const GLY = new RegExp(__GLY_SRC__, __GLY_FLAGS__);
  const hits = [];
  const colours = new Set();

  const px = (s) => {
    const m = String(s).match(/rgba?\\(([^)]+)\\)/);
    if (!m) return null;
    const p = m[1].split(",").map((v) => parseFloat(v));
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const hex = (c) => "#" + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase();
  const over = (fg, bg) => fg.a >= 1 ? fg : { r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 };
  const bgOf = (n) => {
    let e = n, acc = { r: 18, g: 14, b: 13, a: 1 };
    const chain = [];
    while (e) { chain.unshift(e); e = e.parentElement; }
    for (const el of chain) {
      const c = px(getComputedStyle(el).backgroundColor);
      if (c && c.a > 0) acc = over(c, acc);
    }
    return acc;
  };

  /* Whose words these are.
   *
   * The counting doctrine constrains what the record says in its own voice. It does
   * not, and cannot, constrain the artifact: the anatomy's strongest invariant is
   * that the inspected answer renders verbatim, so a rule that fires on the artifact
   * can only ever produce pressure to edit evidence. The artifact and the fields that
   * requote it are therefore read as quotation, and only the COUNT rule steps over
   * them — every other rule here is about the record's own presentation and stays in
   * force everywhere, which is why AP18 still reports on a record sentence that
   * happens to sit next to a quote.
   *
   * Determined from data attributes the anatomy already stamps, never from a
   * direction's class names: Z3 is the source material, Z4.1 marks are slices of it,
   * and the quote / region / observed / expectation / declared fields are the entry
   * showing the reader the same characters again. */
  const QUOTING_ZONES = ["Z3.1", "Z3.2", "Z3.4", "Z3.5", "Z4.1"];
  const QUOTING_FIELDS = '[data-field="quote"],[data-field="region"],[data-field="observed"],[data-field="expectation"],[data-field="declared"]';
  const quotes = (n) => {
    if (!n || !n.closest) return false;
    if (n.closest("[data-source-body]") || n.closest("[data-block]")) return true;
    if (n.closest(QUOTING_FIELDS)) return true;
    const z = n.closest("[data-zone]");
    return !!z && QUOTING_ZONES.indexOf(z.getAttribute("data-zone")) >= 0;
  };

  const note = (where, text, quoted) => {
    if (!text || !text.trim()) return;
    for (const d of LEX) {
      if (quoted && d.ap === "COUNT") continue;
      const m = text.match(d.re);
      if (m) hits.push({ ap: d.ap, label: d.label, where, match: m[0], text: text.slice(0, 160) });
    }
    const g = text.match(GLY);
    if (g) hits.push({ ap: "glyph", label: "verdict glyph", where, match: g[0], text: text.slice(0, 160) });
  };

  const addr = (n) => {
    const z = n.closest && n.closest("[data-zone]");
    return (z ? z.getAttribute("data-zone") + " · " : "") + n.tagName.toLowerCase() + (n.className && typeof n.className === "string" ? "." + n.className.trim().split(/\\s+/)[0] : "");
  };

  for (const n of document.querySelectorAll("body *")) {
    const cs = getComputedStyle(n);
    if (cs.display === "none" || cs.visibility === "hidden") continue;

    const q = quotes(n);
    for (const kid of n.childNodes) if (kid.nodeType === 3) note(addr(n), kid.nodeValue, q);
    for (const a of ["aria-label", "title", "alt", "placeholder"]) {
      if (n.hasAttribute && n.hasAttribute(a)) note(addr(n) + " [" + a + "]", n.getAttribute(a), q);
    }
    for (const pseudo of ["::before", "::after"]) {
      const c = getComputedStyle(n, pseudo).content;
      if (c && c !== "none" && c !== "normal") note(addr(n) + " " + pseudo, c.replace(/^"|"$/g, ""), q);
    }

    const ground = bgOf(n);
    const has = [...n.childNodes].some((k) => k.nodeType === 3 && k.nodeValue.trim());
    if (has) { const f = px(cs.color); if (f) colours.add(hex(over(f, ground)) + " on " + hex(ground)); }
    const ownBg = px(cs.backgroundColor);
    if (ownBg && ownBg.a > 0) colours.add("bg " + hex(over(ownBg, bgOf(n.parentElement || document.body))));
    for (const pseudo of ["::before", "::after"]) {
      const ps = getComputedStyle(n, pseudo);
      if (ps.content && ps.content !== "none") { const f = px(ps.color); if (f) colours.add(hex(over(f, ground)) + " on " + hex(ground)); }
    }
    const shadow = cs.boxShadow;
    if (shadow && shadow !== "none") {
      for (const m of shadow.matchAll(/rgba?\\([^)]+\\)/g)) { const f = px(m[0]); if (f) colours.add(hex(over(f, ground)) + " on " + hex(ground)); }
    }
    for (const side of ["borderTopColor", "borderRightColor", "borderBottomColor", "borderLeftColor", "outlineColor", "textDecorationColor"]) {
      const w = side === "outlineColor" ? parseFloat(cs.outlineWidth) : side.startsWith("border") ? parseFloat(cs[side.replace("Color", "Width")]) : 1;
      if (!w || cs[side] === "rgba(0, 0, 0, 0)") continue;
      const f = px(cs[side]); if (f && f.a > 0) colours.add(hex(over(f, ground)) + " on " + hex(ground));
    }
  }

  return { hits, colours: [...colours], disclosures: opened.length };
})()`;

const src = sweep
  .replace("__LEX__", JSON.stringify(LEXICON.map((d) => ({ ap: d.ap, label: d.label, src: d.re.source, flags: d.re.flags }))))
  .replace("__GLY_SRC__", JSON.stringify(GLYPHS.source))
  .replace("__GLY_FLAGS__", JSON.stringify(GLYPHS.flags));

const browser = await chromiumLaunch();
const rows = specs();
const byDirection = { a: { pages: 0, hits: [], colours: new Set() }, b: { pages: 0, hits: [], colours: new Set() }, c: { pages: 0, hits: [], colours: new Set() } };

for (const s of rows) {
  const ctx = await browser.newContext({
    viewport: VIEWPORTS[s.viewport],
    deviceScaleFactor: 1,
    reducedMotion: s.motion === "reduced" ? "reduce" : "no-preference",
    colorScheme: "dark",
  });
  const page = await ctx.newPage();
  await page.goto(`file://${resolve(LANE, s.file)}?${s.query}`, { waitUntil: "load" });
  await page.waitForSelector('html[data-ready="true"]');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(SETTLE_MS);

  /* Every expandable finding is opened, so the gate reads the detail text too and
   * not only what the record shows at rest. */
  await page.evaluate(() => {
    for (const b of document.querySelectorAll('[aria-expanded="false"]')) b.click();
  });
  await page.waitForTimeout(200);

  const r = await page.evaluate(src);
  const d = byDirection[s.meta.direction];
  d.pages += 1;
  d.disclosures = Math.max(d.disclosures || 0, r.disclosures);
  for (const h of r.hits) d.hits.push({ ...h, frame: s.name });
  for (const c of r.colours) d.colours.add(c);
  await ctx.close();
}
await browser.close();

const report = {
  renderer: RENDERER,
  pages_swept: rows.length,
  lexicon: LEXICON.map((d) => ({ ap: d.ap, label: d.label, pattern: String(d.re) })),
  glyph_set: String(GLYPHS),
  palette_closure: { grounds: GROUNDS, inks: INKS, distinct_allowed: PALETTE.size },
  directions: {},
};

let bad = 0;
for (const dir of ["a", "b", "c"]) {
  const d = byDirection[dir];
  const offPalette = [...d.colours].filter((c) => {
    const parts = c.replace(/^bg /, "").split(" on ");
    return parts.some((p) => !PALETTE.has(p.trim()));
  });

  /* One finding per distinct string in a distinct place; the same label repeated
   * across 22 frames is one thing to look at, not 22. */
  const seen = new Map();
  for (const h of d.hits) {
    const k = `${h.ap}|${h.match}|${h.where}`;
    if (!seen.has(k)) seen.set(k, { ...h, frames: [] });
    seen.get(k).frames.push(h.frame);
  }
  const distinct = [...seen.values()].map((h) => ({ ...h, frames: h.frames.length, first_frame: h.frames[0] }));

  report.directions[dir] = {
    pages_swept: d.pages,
    disclosures_forced_open: d.disclosures || 0,
    distinct_findings: distinct.length,
    total_occurrences: d.hits.length,
    detail: distinct,
    distinct_colours: d.colours.size,
    off_palette: offPalette,
  };
  bad += distinct.length + offPalette.length;
  console.log(
    `${dir}  ${String(d.pages).padStart(2)} pages · ${distinct.length} distinct findings (${d.hits.length} occurrences) · ${d.colours.size} colours · ${offPalette.length} off-palette`,
  );
  for (const h of distinct) console.log(`     ${h.ap} ${h.label} — ${JSON.stringify(h.match)} @ ${h.where}\n        ${JSON.stringify(h.text)}`);
  for (const c of offPalette) console.log(`     OFF-PALETTE ${c}`);
}

writeFileSync(resolve(LANE, "shared/gate-machine-report.json"), JSON.stringify(report, null, 2) + "\n");
console.log(`\n${rows.length} pages · ${bad} findings`);
