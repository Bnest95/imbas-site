import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'production-copy-audit');
const base = 'http://127.0.0.1:8792';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

fs.mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

async function revealAll(page) {
  await page.evaluate(() => {
    document.querySelectorAll('[data-reveal-section]').forEach((s) => s.classList.add('is-revealed'));
    document.querySelectorAll('.reveal, .reveal-l, .reveal-r').forEach((el) => el.classList.add('is-visible'));
  });
  await wait(300);
}

async function shotElement(page, url, name, width, sectionSel, scrollTo) {
  await page.setViewport({
    width,
    height: width <= 480 ? 812 : 900,
    isMobile: width <= 480,
    deviceScaleFactor: 1,
  });
  await page.goto(`${base}${url}`, { waitUntil: 'load', timeout: 15000 });
  await wait(400);
  if (scrollTo) {
    await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (el) el.scrollIntoView({ block: 'start', behavior: 'instant' });
    }, scrollTo);
    await wait(500);
  }
  await revealAll(page);
  const handle = await page.$(sectionSel);
  if (handle) await handle.screenshot({ path: path.join(outDir, name) });
  else console.warn(`Missing selector: ${sectionSel} on ${url}`);
}

const page = await browser.newPage();

await shotElement(page, '/index.html', 'homepage-exists-bridge-desktop-1440.png', 1440, '.exists-bridge', '#exists-heading');
await shotElement(page, '/index.html', 'homepage-roadmap-desktop-1440.png', 1440, '.roadmap', '#roadmap-h2');
await shotElement(page, '/index.html', 'homepage-field-notes-desktop-1440.png', 1440, '.close__signup', '#fn-h2');
await shotElement(page, '/workbench.html', 'workbench-top-desktop-1440.png', 1440, '.wb-shell', '.wb-shell h1');
await shotElement(page, '/field-notes/', 'field-notes-index-desktop-1440.png', 1440, 'main.page--field-notes', '.fn-masthead');
await shotElement(page, '/public-interest.html', 'public-interest-measured-desktop-1440.png', 1440, '.pi-how-measured', '.pi-how-measured');

await page.setViewport({ width: 375, height: 812, isMobile: true, deviceScaleFactor: 1 });
await page.goto(`${base}/index.html`, { waitUntil: 'load', timeout: 15000 });
await wait(400);
await page.evaluate(() => document.querySelector('#fn-h2')?.scrollIntoView({ block: 'start', behavior: 'instant' }));
await wait(500);
await revealAll(page);
const mobHandle = await page.$('.close__signup');
if (mobHandle) await mobHandle.screenshot({ path: path.join(outDir, 'mobile-field-notes-375.png') });

const verify = await page.evaluate(() => {
  const body = document.body.innerText.toLowerCase();
  return {
    wired: body.includes('being wired'),
    comingSoon: body.includes('coming soon'),
    buildNote: document.querySelectorAll('.wb-build-note').length,
  };
});

await page.setViewport({ width: 1440, height: 900 });
await page.goto(`${base}/workbench.html`, { waitUntil: 'load' });
const wbVerify = await page.evaluate(() => ({
  buildNote: document.querySelectorAll('.wb-build-note').length,
  comingSoon: document.body.innerText.toLowerCase().includes('coming soon'),
  agentic: document.body.innerText.toLowerCase().includes('agentic tools'),
}));

fs.writeFileSync(path.join(outDir, 'verification.json'), JSON.stringify({ homepageMobile: verify, workbench: wbVerify }, null, 2));
console.log(JSON.stringify({ homepageMobile: verify, workbench: wbVerify }, null, 2));

await browser.close();
