import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'workbench-precompile-pass3d');
const base = 'http://127.0.0.1:8792';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

fs.mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

async function captureResult(page) {
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Ran it'))?.click());
  await wait(400);
  await page.select('select', 'ChatGPT');
  const paste =
    'Stock buybacks return cash to shareholders and can lift earnings per share by reducing share count. ' +
    'Companies often repurchase shares when they believe the stock is undervalued. SEC Rule 10b-18 provides a safe harbor from market manipulation claims for buybacks meeting certain conditions.';
  await page.type('textarea', paste);
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Compare with what Imbas observed'))?.click());
  await wait(4500);
}

async function shot(page, file, selector = '.wb-shell', fullPage = false) {
  const el = selector ? await page.$(selector) : null;
  if (el) await el.screenshot({ path: path.join(outDir, file) });
  else await page.screenshot({ path: path.join(outDir, file), fullPage });
}

const report = { network: {}, console: [] };

// Desktop landing
const deskLand = await browser.newPage();
deskLand.on('console', (msg) => {
  if (msg.type() === 'error') report.console.push(msg.text());
});
deskLand.on('requestfailed', (req) => {
  if (req.url().includes('babel')) report.network.babelRequest = req.url();
});
await deskLand.setViewport({ width: 1440, height: 900 });
await deskLand.goto(`${base}/workbench.html`, { waitUntil: 'networkidle0' });
await deskLand.evaluate(() => localStorage.removeItem('imbas_wb_email'));
await deskLand.reload({ waitUntil: 'networkidle0' });
await wait(500);
report.network.babel = await deskLand.evaluate(() => [...performance.getEntriesByType('resource')].some((e) => e.name.includes('babel')));
report.network.bundle = await deskLand.evaluate(() => [...performance.getEntriesByType('resource')].some((e) => e.name.includes('workbench.bundle.js')));
await shot(deskLand, 'workbench-desktop-landing-1440.png', '.wb-stage');
await deskLand.close();

// Desktop result
const deskRes = await browser.newPage();
deskRes.on('console', (msg) => {
  if (msg.type() === 'error') report.console.push(msg.text());
});
await deskRes.setViewport({ width: 1440, height: 900 });
await deskRes.goto(`${base}/workbench.html`, { waitUntil: 'networkidle0' });
await deskRes.evaluate(() => localStorage.setItem('imbas_wb_email', 'pass3d@imbaslabs.com'));
await deskRes.reload({ waitUntil: 'networkidle0' });
await wait(500);
await captureResult(deskRes);
await shot(deskRes, 'workbench-desktop-result-1440.png', '.wb-run-plate.is-result');
await deskRes.close();

// Mobile landing
const mobLand = await browser.newPage();
mobLand.on('console', (msg) => {
  if (msg.type() === 'error') report.console.push(msg.text());
});
await mobLand.setViewport({ width: 375, height: 812, isMobile: true });
await mobLand.goto(`${base}/workbench.html`, { waitUntil: 'networkidle0' });
await mobLand.evaluate(() => localStorage.removeItem('imbas_wb_email'));
await mobLand.reload({ waitUntil: 'networkidle0' });
await wait(500);
const mobOverflow = await mobLand.evaluate(() => ({
  overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  scrollWidth: document.documentElement.scrollWidth,
  clientWidth: document.documentElement.clientWidth,
}));
report.mobileOverflow = mobOverflow;
await shot(mobLand, 'workbench-mobile-landing-375.png', '.wb-stage');
await mobLand.close();

// Mobile result
const mobRes = await browser.newPage();
mobRes.on('console', (msg) => {
  if (msg.type() === 'error') report.console.push(msg.text());
});
await mobRes.setViewport({ width: 375, height: 812, isMobile: true });
await mobRes.goto(`${base}/workbench.html`, { waitUntil: 'networkidle0' });
await mobRes.evaluate(() => localStorage.setItem('imbas_wb_email', 'pass3d@imbaslabs.com'));
await mobRes.reload({ waitUntil: 'networkidle0' });
await wait(500);
await captureResult(mobRes);
await shot(mobRes, 'workbench-mobile-result-375.png', '.wb-run-plate.is-result');
await mobRes.close();

// Noscript fallback
const noscript = await browser.newPage();
await noscript.setJavaScriptEnabled(false);
await noscript.setViewport({ width: 375, height: 812, isMobile: true });
await noscript.goto(`${base}/workbench.html`, { waitUntil: 'domcontentloaded' });
await wait(300);
const noscriptCheck = await noscript.evaluate(() => ({
  visible: !!document.querySelector('.wb-noscript-fallback'),
  h1: document.querySelector('.wb-noscript-fallback h1')?.textContent?.trim(),
  links: [...document.querySelectorAll('.wb-noscript-fallback a')].map((a) => a.getAttribute('href')),
}));
report.noscript = noscriptCheck;
await noscript.screenshot({ path: path.join(outDir, 'workbench-noscript-fallback-375.png'), fullPage: true });
await noscript.close();

await browser.close();

console.log(JSON.stringify({ outDir, report }, null, 2));
