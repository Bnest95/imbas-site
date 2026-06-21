import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'workbench-pass-b1');
const base = 'http://127.0.0.1:8792';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

fs.mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

async function capture(name, width, height, caseId = '005') {
  const page = await browser.newPage();
  await page.setViewport({ width, height, isMobile: width <= 480, deviceScaleFactor: 1 });
  await page.goto(`${base}/workbench.html`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.removeItem('imbas_wb_email'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await wait(500);
  if (caseId !== '005') {
    await page.evaluate((id) => {
      [...document.querySelectorAll('.wb-case-card')]
        .find((b) => b.textContent.includes(`CASE ${id}`))
        ?.click();
    }, caseId);
    await wait(350);
  }
  const clip = await page.evaluate(() => {
    const note = document.querySelector('.wb-console .wb-plate-note');
    const cards = document.querySelector('.wb-case-selector');
    if (!cards) return null;
    const nr = note?.getBoundingClientRect();
    const cr = cards.getBoundingClientRect();
    const x = Math.min(nr?.x ?? cr.x, cr.x);
    const y = (nr?.y ?? cr.y) - 6;
    return { x, y, width: Math.max(nr?.right ?? 0, cr.right) - x, height: cr.bottom - y + 8 };
  });
  if (clip) await page.screenshot({ path: path.join(outDir, name), clip });
  const metrics = await page.evaluate(() => {
    const active = document.querySelector('.wb-case-card.is-active');
    const inactive = document.querySelector('.wb-case-card:not(.is-active):not(.is-disabled)');
    const cs = (el) => (el ? getComputedStyle(el) : null);
    const ac = cs(active);
    const ic = cs(inactive);
    const at = active?.querySelector('.wb-case-card__title');
    const it = inactive?.querySelector('.wb-case-card__title');
    return {
      activeBorder: ac?.borderColor,
      activeBg: ac?.backgroundColor,
      activeTitle: at ? getComputedStyle(at).color : null,
      activeOpacity: ac?.opacity,
      inactiveOpacity: ic?.opacity,
      inactiveBg: ic?.backgroundColor,
      inactiveTitle: it ? getComputedStyle(it).color : null,
      activeBoxShadow: ac?.boxShadow?.slice(0, 80),
    };
  });
  await page.close();
  return metrics;
}

const desktop = await capture('case-selector-b1-desktop-1440.png', 1440, 900);
const mobile = await capture('case-selector-b1-mobile-375.png', 375, 812);

const report = { desktop, mobile };
fs.writeFileSync(path.join(outDir, 'verification.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

await browser.close();
