import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'institutions-cta-p4');
const base = 'http://127.0.0.1:8792';

fs.mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
  protocolTimeout: 180000,
});

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function captureCta(name, width) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900, isMobile: width <= 480, deviceScaleFactor: 1 });
  await page.goto(`${base}/institutions.html`, { waitUntil: 'load', timeout: 15000 });
  await page.waitForSelector('.inst-cta', { timeout: 10000 });
  await page.evaluate(() => {
    document.querySelector('.inst-cta')?.scrollIntoView({ block: 'center' });
  });
  await wait(500);
  const el = await page.$('.inst-cta');
  await el.screenshot({ path: path.join(outDir, name) });

  const report = await page.evaluate(() => {
    const cta = document.querySelector('.inst-cta');
    const links = [...cta.querySelectorAll('a')];
    const primary = cta.querySelector('.inst-cta__primary');
    const primaryStyle = primary ? getComputedStyle(primary) : null;
    const secondary = cta.querySelector('.hero__secondary');
    const secondaryStyle = secondary ? getComputedStyle(secondary) : null;
    const emberDeep = 'rgb(200, 88, 48)';
    return {
      count: links.length,
      order: links.map((a) => ({
        text: a.textContent.replace(/\s*→\s*$/, '').trim(),
        href: a.getAttribute('href'),
        isPrimary: a.classList.contains('inst-cta__primary'),
        isSecondary: a.classList.contains('hero__secondary'),
      })),
      primaryBg: primaryStyle?.backgroundColor,
      primaryIsFilled: primaryStyle?.backgroundColor === emberDeep,
      secondaryBg: secondaryStyle?.backgroundColor,
      secondaryIsTransparent: secondaryStyle?.backgroundColor === 'rgba(0, 0, 0, 0)' || secondaryStyle?.backgroundColor === 'transparent',
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    };
  });

  await page.close();
  return report;
}

const desktop = await captureCta('institutions-cta-desktop-1440.png', 1440);
const mobile = await captureCta('institutions-cta-mobile-375.png', 375);

const report = { desktop, mobile };
fs.writeFileSync(path.join(outDir, 'verification.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

await browser.close();
