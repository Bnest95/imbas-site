// Capture tool. Project-governed renderer, resolved from the repository's own
// playwright-core install and its pinned chromium revision. Nothing is installed.
//
//   node build/shoot.mjs <out-dir> <spec.json>
//
// A spec entry is { file, query, viewport, motion, name, settle }.

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const HERE = dirname(fileURLToPath(import.meta.url));
const LANE = resolve(HERE, "..");
const REPO = "/Users/brendan/Documents/Claude/Projects/imbas-site";

const { chromium } = await import(`${REPO}/node_modules/playwright-core/index.mjs`);

const browsers = JSON.parse(readFileSync(`${REPO}/node_modules/playwright-core/browsers.json`, "utf8"));
const rev = browsers.browsers.find((b) => b.name === "chromium").revision;
const EXE = `${process.env.HOME}/Library/Caches/ms-playwright/chromium_headless_shell-${rev}/chrome-headless-shell-mac-arm64/chrome-headless-shell`;
const RENDERER = execSync(`"${EXE}" --version`).toString().trim();

export const VIEWPORTS = {
  desktop: { width: 1440, height: 1000 },
  mobile: { width: 390, height: 844 },
};

export const SETTLE_MS = 900;

export function chromiumLaunch() {
  return chromium.launch({
    executablePath: EXE,
    args: ["--allow-file-access-from-files", "--font-render-hinting=none", "--force-color-profile=srgb"],
  });
}

export async function shoot(specs, outDir, opts = {}) {
  mkdirSync(outDir, { recursive: true });
  const browser = await chromiumLaunch();

  const entries = [];
  let order = 0;

  for (const spec of specs) {
    const vp = VIEWPORTS[spec.viewport];
    const ctx = await browser.newContext({
      viewport: vp,
      deviceScaleFactor: 1,
      reducedMotion: spec.motion === "reduced" ? "reduce" : "no-preference",
      colorScheme: "dark",
    });
    const page = await ctx.newPage();
    const url = `file://${resolve(LANE, spec.file)}${spec.query ? "?" + spec.query : ""}`;
    await page.goto(url, { waitUntil: "load" });
    await page.waitForSelector('html[data-ready="true"]', { timeout: 5000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(spec.settle ?? SETTLE_MS);

    if (opts.beforeShot) await opts.beforeShot(page, spec);

    const file = `${outDir}/${spec.name}.png`;
    await page.screenshot({ path: file, fullPage: spec.full !== false });
    const buf = readFileSync(file);
    const dims = await page.evaluate(() => ({
      doc: document.documentElement.scrollHeight,
      vw: window.innerWidth,
    }));

    entries.push({
      order: ++order,
      name: spec.name,
      file: `${outDir.split("/").pop()}/${spec.name}.png`,
      url: url.replace(`file://${LANE}/`, ""),
      viewport: spec.viewport,
      viewport_px: `${vp.width}x${vp.height}`,
      device_scale_factor: 1,
      full_page: spec.full !== false,
      document_height_css_px: dims.doc,
      motion: spec.motion === "reduced" ? "reduced" : "ordinary",
      settle_ms: spec.settle ?? SETTLE_MS,
      settle_conditions: ['load', 'html[data-ready="true"]', "document.fonts.ready", "fixed timer"],
      bytes: statSync(file).size,
      sha256: createHash("sha256").update(buf).digest("hex"),
    });

    await ctx.close();
  }

  await browser.close();
  return { renderer: RENDERER, executable: EXE, chromium_revision: rev, entries };
}

export { EXE, RENDERER, LANE, REPO };

if (process.argv[1] === fileURLToPath(import.meta.url) && process.argv[2]) {
  const specs = JSON.parse(readFileSync(process.argv[3], "utf8"));
  const r = await shoot(specs, resolve(LANE, process.argv[2]));
  writeFileSync(resolve(LANE, process.argv[2], "MANIFEST.json"), JSON.stringify(r, null, 2) + "\n");
  console.log(r.renderer, "·", r.entries.length, "captures");
}
