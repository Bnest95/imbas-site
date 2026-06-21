import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'workbench-pass-a');
const base = 'http://127.0.0.1:8792';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

fs.mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
  protocolTimeout: 180000,
});

async function loadWorkbench(page) {
  await page.goto(`${base}/workbench.html`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.evaluate(() => localStorage.removeItem('imbas_wb_email'));
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 });
  await wait(600);
}

async function captureHeroAndSelector(name, width, height) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, isMobile: width <= 480, deviceScaleFactor: 1 });
  await loadWorkbench(page);
  await page.screenshot({ path: path.join(outDir, name), fullPage: false });
  await page.close();
}

async function captureSelectedFlow(name, width, height) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, isMobile: width <= 480, deviceScaleFactor: 1 });
  await loadWorkbench(page);
  await page.evaluate(() => {
    [...document.querySelectorAll('.wb-case-card')]
      .find((b) => b.textContent.includes('CASE 005'))
      ?.click();
  });
  await wait(400);
  const metrics = await page.evaluate(() => {
    const hero = document.querySelector('h1');
    const confirm = document.querySelector('.wb-confirm-block');
    const prov = document.querySelector('.wb-flow-case-prov__case');
    const active = document.querySelector('.wb-case-card.is-active');
    const primaryBtn = document.querySelector('.wb-confirm-block .wb-btn--primary');
    const hr = hero?.getBoundingClientRect();
    const cr = confirm?.getBoundingClientRect();
    const ar = active?.getBoundingClientRect();
    const pr = primaryBtn?.getBoundingClientRect();
    return {
      provLine: prov?.textContent?.trim(),
      provSubLines: document.querySelectorAll('.wb-flow-case-prov__sub').length,
      heroBottom: hr?.bottom,
      confirmTop: cr?.top,
      confirmBottom: cr?.bottom,
      primaryBtnBottom: pr?.bottom,
      activeCardBottom: ar?.bottom,
      viewportHeight: window.innerHeight,
      confirmTopVisible: cr ? cr.top < window.innerHeight : false,
      primaryBtnVisible: pr ? pr.bottom <= window.innerHeight : false,
      scrollNeededForPrimary: pr ? Math.max(0, pr.bottom - window.innerHeight) : null,
    };
  });
  await page.screenshot({ path: path.join(outDir, name), fullPage: false });
  await page.close();
  return metrics;
}

await captureHeroAndSelector('workbench-pass-a-hero-desktop-1440.png', 1440, 900);
await captureHeroAndSelector('workbench-pass-a-hero-mobile-375.png', 375, 812);

const desktopMetrics = await captureSelectedFlow('workbench-pass-a-selected-005-desktop-1440.png', 1440, 900);
const mobileMetrics = await captureSelectedFlow('workbench-pass-a-selected-005-mobile-375.png', 375, 812);

const report = { desktop: desktopMetrics, mobile: mobileMetrics };
fs.writeFileSync(path.join(outDir, 'verification.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

await browser.close();
