#!/usr/bin/env node
// scripts/build-og-home.mjs — writes og-home.png, the homepage share image (1200×630).
//
//   node scripts/build-og-home.mjs
//
// og-image.png is the mark alone, so a link preview of the homepage never says what
// Imbas is. This one carries the mark, the IMBAS wordmark and the homepage H1, set in
// the site's own fonts and colours: the umber ground, the hero's ember glow, Fraunces
// for the wordmark with the hero's luminous-to-ink gradient, and the H1 in Fraunces
// italic. It is rendered from HTML by the playwright-core the repository already pins,
// against a local server on the repository root, so /brand-mark.png and the Google
// Fonts link are the same ones the pages use. No package is added.

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { chromium } from "playwright-core";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "og-home.png");

const PAGE = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..500&display=swap">
<style>
  :root { --bg-base: #2A211E; --bg-deep: #120E0D; --ink-primary: #F2E8DC; --ink-luminous: #FCF8EC; --ember-rgb: 222, 111, 56; }
  html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; }
  body {
    background:
      radial-gradient(ellipse 46% 58% at 50% 62%, rgba(var(--ember-rgb), 0.20), transparent 70%),
      radial-gradient(ellipse 90% 80% at 50% 50%, var(--bg-base), var(--bg-deep) 100%);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    font-family: "Fraunces", Georgia, serif;
  }
  .mark { height: 150px; width: auto; margin-bottom: 26px; }
  .wordmark {
    font-weight: 400; font-size: 168px; line-height: 0.83; letter-spacing: -0.044em;
    background: linear-gradient(180deg, var(--ink-luminous) 0%, var(--ink-primary) 55%, rgba(201, 194, 187, 0.55) 100%);
    -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; color: transparent;
    margin: 0 0 38px;
  }
  .line { font-style: italic; font-weight: 400; font-size: 46px; line-height: 1.2; letter-spacing: -0.008em; color: var(--ink-primary); margin: 0; }
</style></head>
<body>
  <img class="mark" src="/brand-mark.png" alt="">
  <div class="wordmark">IMBAS</div>
  <p class="line">Making AI work for you.</p>
</body></html>`;

const MIME = { ".png": "image/png", ".svg": "image/svg+xml", ".css": "text/css", ".js": "text/javascript" };
const server = createServer(async (req, res) => {
  const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p === "/__og-home.html") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(PAGE);
    return;
  }
  const f = join(ROOT, p);
  try {
    await stat(f);
    res.writeHead(200, { "content-type": MIME[extname(f)] || "application/octet-stream" });
    res.end(await readFile(f));
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.goto(`http://127.0.0.1:${server.address().port}/__og-home.html`, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
const fraunces = await page.evaluate(() => document.fonts.check('400 168px "Fraunces"'));
if (!fraunces) throw new Error("Fraunces did not load; the image would fall back to Georgia.");
await page.screenshot({ path: OUT, clip: { x: 0, y: 0, width: 1200, height: 630 } });
await browser.close();
server.close();
console.log(`wrote ${path.relative(ROOT, OUT)}`);
