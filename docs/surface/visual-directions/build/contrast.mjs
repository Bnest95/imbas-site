/* Measures rendered contrast, in the renderer, on the real pages.
 *
 *   node build/contrast.mjs
 *
 * Nothing here is computed from the token file. Every ratio comes from
 * getComputedStyle on a live node, with the background resolved by walking up
 * until an opaque colour is found — so a ratio reported here is the ratio a reader
 * actually gets, including whatever a direction layered underneath.
 *
 * Two passes.
 *   zones  — the worst text leaf inside each named zone, plus each anchor
 *            treatment and the focus ring. This is the per-zone report.
 *   pairs  — every distinct foreground-on-background pair that renders anywhere,
 *            with a count and an example. This is what finds a palette failure the
 *            zone list would miss.
 *
 * A focus ring with a positive outline-offset is drawn outside its own box, so it
 * is measured against the ground behind the element, not the element's own fill.
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromiumLaunch, LANE, VIEWPORTS, SETTLE_MS } from "./shoot.mjs";

const PROBE = String.raw`(() => {
  /* Open every disclosure before measuring anything.
   *
   * visible() below rejects display:none, which is right — an unrendered element has
   * no contrast to measure. But B's reading strata put record prose inside closed
   * <details>, and text a reader can reach by pressing one key still has to clear the
   * threshold. Left alone, the strata would have shrunk this file's coverage without
   * anyone deciding to shrink it.
   *
   * Force them open first, then probe. Coverage goes up, no threshold moves, and the
   * page is discarded afterwards so nothing needs restoring. */
  Array.from(document.querySelectorAll("details")).forEach((d) => { d.open = true; });

  const px = (c) => {
    const m = String(c).match(/[\d.]+/g) || [];
    return { r: +m[0] || 0, g: +m[1] || 0, b: +m[2] || 0, a: m.length > 3 ? +m[3] : 1 };
  };
  const over = (f, b) => ({ r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a), a: 1 });
  const hex = (c) => "#" + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase();
  const lum = (c) => {
    const ch = [c.r, c.g, c.b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  };
  const ratio = (f, b) => { const a = lum(f), c = lum(b); return +(((Math.max(a, c) + 0.05) / (Math.min(a, c) + 0.05))).toFixed(2); };

  const bgOf = (node) => {
    const stack = [];
    for (let n = node; n; n = n.parentElement) {
      const c = px(getComputedStyle(n).backgroundColor);
      if (c.a > 0) { stack.push(c); if (c.a === 1) break; }
    }
    stack.push({ r: 0, g: 0, b: 0, a: 1 });
    return stack.reduceRight((acc, c) => over(c, acc));
  };

  const visible = (n) => {
    const cs = getComputedStyle(n);
    if (cs.visibility === "hidden" || cs.display === "none" || cs.opacity === "0") return false;
    const r = n.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };

  const ownText = (n) => [...n.childNodes].filter((c) => c.nodeType === 3 && c.textContent.trim()).map((c) => c.textContent.trim()).join(" ");

  const measure = (n, opts = {}) => {
    const cs = getComputedStyle(n);
    const bg = opts.bgFrom ? bgOf(opts.bgFrom) : bgOf(n);
    const fg = over(px(opts.color || cs.color), bg);
    const fs = parseFloat(cs.fontSize);
    const fw = parseInt(cs.fontWeight, 10) || 400;
    const large = fs >= 24 || (fs >= 18.66 && fw >= 700);
    const r = ratio(fg, bg);
    const min = opts.nonText ? 3 : large ? 3 : 4.5;
    return {
      fg: hex(fg), bg: hex(bg), ratio: r,
      font_px: opts.nonText ? null : +fs.toFixed(1),
      large_text: opts.nonText ? null : large,
      threshold: min,
      wcag: r >= min ? "pass" : "fail",
      wcag_aaa: opts.nonText ? null : (r >= (large ? 4.5 : 7) ? "pass" : "fail"),
      sample: (opts.sample ?? ownText(n)).slice(0, 44),
    };
  };

  /* ── pass one · every rendered text leaf, grouped by zone ─────────────────── */

  const zoneOf = (n) => {
    for (let e = n; e; e = e.parentElement) {
      if (e.hasAttribute("data-zone")) return e.getAttribute("data-zone");
      if (e.hasAttribute("data-zone-group")) return e.getAttribute("data-zone-group");
    }
    return "unzoned";
  };

  const zones = {};
  const pairs = {};
  for (const n of document.querySelectorAll("body *")) {
    const t = ownText(n);
    if (!t || !visible(n)) continue;
    const m = measure(n);
    const z = zoneOf(n);
    if (!zones[z] || m.ratio < zones[z].ratio) zones[z] = { zone: z, ...m };
    const k = m.fg + " on " + m.bg;
    if (!pairs[k]) pairs[k] = { fg: m.fg, bg: m.bg, ratio: m.ratio, count: 0, example: m.sample, worst_font_px: m.font_px, threshold: m.threshold, wcag: m.wcag };
    pairs[k].count++;
    if (m.font_px < pairs[k].worst_font_px) { pairs[k].worst_font_px = m.font_px; pairs[k].threshold = m.threshold; pairs[k].wcag = m.wcag; }
  }

  /* ── pass two · the treatments the brief names by hand ────────────────────── */

  const named = [];
  const q = (s) => document.querySelector(s);

  const first = q("[data-anchor], [data-mark-trigger]");
  if (first) {
    first.focus();
    const cs = getComputedStyle(first);
    const offset = parseFloat(cs.outlineOffset) || 0;
    const outlined = cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0;
    const shadow = (cs.boxShadow.match(/rgba?\([^)]*\)/) || [])[0];
    const color = outlined ? cs.outlineColor : shadow;
    /* Positive offset puts the ring outside the element's own fill. */
    const ground = outlined && offset >= 0 && first.parentElement ? first.parentElement : first;
    named.push({
      zone: "focus ring",
      drawn_with: outlined ? "outline " + cs.outlineWidth + " offset " + cs.outlineOffset : "box-shadow",
      ...measure(first, { color, bgFrom: ground, nonText: true, sample: first.tagName.toLowerCase() }),
    });
    first.blur();
  }

  /* A decoration painted in the element's own background colour is extending the
   * ground, not carrying a mark, so it is not measured as one. */
  const decoOf = (n) => {
    const cs = getComputedStyle(n);
    const own = hex(over(px(cs.backgroundColor), bgOf(n)));
    const out = [];
    if (cs.textDecorationLine !== "none") out.push({ where: "text-decoration " + cs.textDecorationLine, color: cs.textDecorationColor });
    for (const p of ["::before", "::after"]) {
      const s = getComputedStyle(n, p);
      if (s.content && s.content !== "none" && s.content !== "normal") out.push({ where: p, color: s.color });
    }
    const shadow = (cs.boxShadow.match(/rgba?\([^)]*\)/) || [])[0];
    if (shadow) out.push({ where: "box-shadow", color: shadow });
    /* Bottom belongs here. It was left out while every ruled treatment in the lane
     * was a left rule or a top rule, and subordinating the dismiss control this pass
     * introduced the first border-bottom drawn as a mark — which the probe then
     * quietly declined to measure. A probe that skips the treatment a pass just
     * introduced is worse than no probe, because it reports a pass. */
    for (const side of ["Left", "Top", "Bottom"]) {
      if (parseFloat(cs["border" + side + "Width"]) > 0 && cs["border" + side + "Style"] !== "none") {
        out.push({ where: "border-" + side.toLowerCase(), color: cs["border" + side + "Color"] });
      }
    }
    return out.filter((d) => hex(over(px(d.color), bgOf(n))) !== own);
  };

  /* The dismiss control was made subordinate this pass, and subordinate is exactly
   * the direction in which a control stops being legible. It is measured as text and
   * as ink, so "quieter" has to stay above the threshold rather than merely look
   * calmer in a screenshot. */
  const dis = q("[data-dismiss]");
  if (dis) {
    named.push({ zone: "dismiss · label", drawn_with: "text", ...measure(dis, { sample: "dismiss" }) });
    for (const d of decoOf(dis)) {
      named.push({ zone: "dismiss · rule", drawn_with: d.where, ...measure(dis, { color: d.color, nonText: true, sample: "dismiss" }) });
    }
    dis.focus();
    const dcs = getComputedStyle(dis);
    const doutlined = dcs.outlineStyle !== "none" && parseFloat(dcs.outlineWidth) > 0;
    named.push({
      zone: "dismiss · focus ring",
      drawn_with: doutlined ? "outline " + dcs.outlineWidth + " offset " + dcs.outlineOffset : "box-shadow",
      ...measure(dis, {
        color: doutlined ? dcs.outlineColor : (dcs.boxShadow.match(/rgba?\([^)]*\)/) || [])[0],
        bgFrom: doutlined && (parseFloat(dcs.outlineOffset) || 0) >= 0 && dis.parentElement ? dis.parentElement : dis,
        nonText: true, sample: "dismiss",
      }),
    });
    dis.blur();
  }

  /* Every disclosure summary, measured as text, as ink and focused.
   *
   * Opening the disclosures above was necessary and not sufficient: this probe reads
   * a named list, and the summary line belongs to no zone, so the strata would have
   * introduced a line of readable prose that nothing measured. A summary is the one
   * line in a disclosure a reader has to read before deciding whether to open it, and
   * it is set quiet on purpose — which is exactly the direction in which quiet stops
   * being legible. Its marker glyph is ink and is measured as ink; its focus ring is
   * measured the same way the dismiss control's is, because it is the keyboard
   * entrance to everything filed behind it. */
  Array.from(document.querySelectorAll("details[data-strata] > summary")).forEach((sum, i) => {
    const name = sum.closest("details").getAttribute("data-strata-name") || String(i);
    named.push({ zone: "disclosure · " + name + " · summary", drawn_with: "text", ...measure(sum) });
    for (const d of decoOf(sum)) {
      named.push({ zone: "disclosure · " + name + " · marker", drawn_with: d.where, ...measure(sum, { color: d.color, nonText: true, sample: name }) });
    }
    sum.focus();
    const scs = getComputedStyle(sum);
    const soutlined = scs.outlineStyle !== "none" && parseFloat(scs.outlineWidth) > 0;
    named.push({
      zone: "disclosure · " + name + " · focus ring",
      drawn_with: soutlined ? "outline " + scs.outlineWidth + " offset " + scs.outlineOffset : "box-shadow",
      ...measure(sum, {
        color: soutlined ? scs.outlineColor : (scs.boxShadow.match(/rgba?\([^)]*\)/) || [])[0],
        bgFrom: soutlined && (parseFloat(scs.outlineOffset) || 0) >= 0 && sum.parentElement ? sum.parentElement.parentElement || sum.parentElement : sum,
        nonText: true, sample: name,
      }),
    });
    sum.blur();
  });

  for (const mode of ["QUOTED_SPAN", "PASSAGE_CONTEXT"]) {
    const n = q('[data-anchor-mode="' + mode + '"]');
    if (!n) { named.push({ zone: "anchor · " + mode, absent_on_this_record: true }); continue; }
    named.push({ zone: "anchor · " + mode + " · marked text", ...measure(n) });
    /* Some directions draw the mark on a pseudo-element inside their own fill and
     * some draw it in the gutter outside; measure each drawn part on its own
     * ground and keep the one a reader would find hardest. */
    for (const d of decoOf(n)) {
      const outside = d.where.indexOf("::") === 0 && getComputedStyle(n, d.where).position === "absolute";
      named.push({
        zone: "anchor · " + mode + " · mark ink",
        drawn_with: d.where,
        ...measure(n, { color: d.color, bgFrom: outside && n.parentElement ? n.parentElement : n, nonText: true, sample: d.where }),
      });
    }
  }

  const band = q('[data-absence="true"]');
  if (!band) named.push({ zone: "anchor · RECORD_LEVEL_ABSENCE", absent_on_this_record: true });
  else {
    const num = [...band.querySelectorAll("*")].find((e) => /^\d+$/.test(ownText(e)) && !e.children.length);
    const body = [...band.querySelectorAll("p, li, div")].filter((e) => { const t = ownText(e); return t.length > 40 && visible(e); });
    if (num) named.push({ zone: "anchor · RECORD_LEVEL_ABSENCE · mark numeral", drawn_with: "text node", ...measure(num) });
    if (body.length) {
      const worst = body.map((e) => ({ e, m: measure(e) })).sort((a, b) => a.m.ratio - b.m.ratio)[0];
      named.push({ zone: "anchor · RECORD_LEVEL_ABSENCE · entry text", ...worst.m });
    }
  }

  return { zones: Object.values(zones), named, pairs: Object.values(pairs) };
})()`;

const RECORDS = ["montana", "furnace", "deposit", "website"];
const VIEWS = ["desktop", "mobile"];

/* The zone names the brief asks for, mapped onto the anatomy's own zone ids so the
 * same selector works for all three directions. */
const ZONE_LABEL = {
  "Z1.1": "record class label",
  "Z1.2": "record context",
  "Z1.3": "metadata · address",
  "Z1.4": "finding sentence",
  "Z1.5": "scope boundary",
  "Z2.1": "count line",
  "Z2.2": "count rule",
  "Z2.4": "census",
  "Z2.3": "orientation",
  "Z3.1": "source · question",
  "Z3.2": "source · role label",
  "Z3.3": "source · capture shape",
  "Z3.4": "source · primary reading text",
  "Z3.5": "source · second artifact",
  "Z3.6": "source · expectation",
  Z4: "findings layer",
  "Z4.2": "findings · out-of-document block",
  "Z4.3": "findings · out-of-document rule",
  "Z4.4": "findings text",
  "Z5.1": "check register · heading",
  "Z5.2": "check register · density control",
  "Z5.3": "check register · entry",
  "Z5.4": "check register · field",
  "Z5.5": "check register · close",
  "Z5.6": "check register · applied checks",
  "Z6.1": "provenance · heading",
  "Z6.2": "provenance · row",
  "Z6.3": "provenance · record identity",
  "Z7.1": "foot · read again",
  "Z7.2": "foot · run your own",
  "Z7.3": "foot · version",
  "Z7.4": "foot · forwarded cold",
};

const browser = await chromiumLaunch();
const report = {};
const paletteAll = {};

for (const dir of ["a", "b", "c"]) {
  const zones = new Map();
  const named = new Map();
  for (const rec of RECORDS) {
    for (const view of VIEWS) {
      const ctx = await browser.newContext({ viewport: VIEWPORTS[view], deviceScaleFactor: 1, colorScheme: "dark" });
      const page = await ctx.newPage();
      await page.goto(`file://${resolve(LANE, dir + "/record.html")}?record=${rec}&open=1&density=professional`, { waitUntil: "load" });
      await page.waitForSelector('html[data-ready="true"]', { timeout: 5000 });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(SETTLE_MS);
      const res = await page.evaluate(PROBE);

      /* Worst case across every record and both viewports — the number a reader is
       * promised has to be the floor, not the best case. */
      for (const z of res.zones) {
        const prev = zones.get(z.zone);
        if (!prev || z.ratio < prev.ratio) zones.set(z.zone, { ...z, measured_on: `${rec}/${view}` });
      }
      for (const n of res.named) {
        if (n.absent_on_this_record) continue;
        const k = n.zone + (n.drawn_with ? " · " + n.drawn_with : "");
        const prev = named.get(k);
        if (!prev || n.ratio < prev.ratio) named.set(k, { ...n, zone: k, measured_on: `${rec}/${view}` });
      }
      for (const p of res.pairs) {
        const k = dir + " " + p.fg + " on " + p.bg;
        if (!paletteAll[k]) paletteAll[k] = { direction: dir, ...p, count: 0 };
        paletteAll[k].count += p.count;
        if (p.worst_font_px < paletteAll[k].worst_font_px) Object.assign(paletteAll[k], { worst_font_px: p.worst_font_px, threshold: p.threshold, wcag: p.wcag });
      }
      await ctx.close();
    }
  }

  const zoneRows = [...zones.values()]
    .filter((z) => ZONE_LABEL[z.zone])
    .map((z) => ({ ...z, label: ZONE_LABEL[z.zone] }))
    .sort((a, b) => a.zone.localeCompare(b.zone));

  report[dir] = { zones: zoneRows, treatments: [...named.values()] };
}

await browser.close();

const palette = Object.values(paletteAll).sort((a, b) => a.ratio - b.ratio);
const zoneFails = Object.entries(report).flatMap(([d, r]) =>
  [...r.zones, ...r.treatments].filter((x) => x.wcag === "fail").map((x) => ({ direction: d, ...x })),
);
const paletteFails = palette.filter((p) => p.wcag === "fail");

writeFileSync(
  resolve(LANE, "shared/contrast-report.json"),
  JSON.stringify(
    {
      method:
        "getComputedStyle in the governed renderer, on the real pages. Background composited from the first opaque ancestor. Worst ratio across four records × two viewports, register at full. Focus rings with a positive outline-offset are measured against the ground behind the element.",
      thresholds: { text: 4.5, large_text: 3, non_text: 3, note: "WCAG 2.2 AA" },
      directions: report,
      palette_pairs: palette,
      failures: { zones_and_treatments: zoneFails, palette_pairs: paletteFails },
    },
    null,
    2,
  ) + "\n",
);

for (const [d, r] of Object.entries(report)) {
  console.log("\n== direction " + d);
  for (const z of r.zones) console.log(`  ${String(z.ratio).padStart(6)}:1  ${(z.zone + " " + z.label).padEnd(46)} ${z.wcag}  ${z.fg} on ${z.bg}`);
  for (const t of r.treatments) console.log(`  ${String(t.ratio).padStart(6)}:1  ${t.zone.padEnd(46)} ${t.wcag}  ${t.fg} on ${t.bg}`);
}
console.log(`\n${palette.length} distinct colour pairs · ${paletteFails.length} below threshold`);
for (const p of paletteFails) console.log(`  FAIL ${p.direction}  ${p.ratio}:1  ${p.fg} on ${p.bg}  ${p.worst_font_px}px ×${p.count}  "${p.example}"`);
/* The zone and treatment failures were being written to the report and left out of
 * the console, so the run ended on "0 below threshold" while a named treatment was
 * failing four rows above it. A summary that can print a clean total over a failing
 * row is a summary that will eventually be believed. */
console.log(`${zoneFails.length} zone/treatment measurements below threshold`);
for (const z of zoneFails) console.log(`  FAIL ${z.direction}  ${z.ratio}:1  ${z.zone} ${z.label || ""}  ${z.fg} on ${z.bg}  (${z.measured_on || ""})`);
if (zoneFails.length || paletteFails.length) process.exitCode = 1;
