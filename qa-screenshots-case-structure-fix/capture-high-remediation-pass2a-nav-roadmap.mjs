import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const phase = process.argv[2] || 'after';
const outDir = path.join(__dirname, 'high-remediation-pass2a-nav-roadmap', phase);
const base = 'http://127.0.0.1:8792';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

fs.mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

async function captureHeader(url, name, width, openMore = false, openMobile = false) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900 });
  await page.goto(`${base}${url}`, { waitUntil: 'networkidle0' });
  await wait(450);
  if (openMobile) {
    await page.click('.nav__menu-btn');
    await wait(300);
  }
  if (openMore) {
    const toggle = await page.$('#nav-more-toggle');
    if (toggle) await toggle.click();
    await wait(250);
  }
  const header = await page.$('.site-header');
  if (header) await header.screenshot({ path: path.join(outDir, name) });
  const metrics = await page.evaluate(() => {
    const nav = document.getElementById('primary-nav');
    return {
      navHeight: nav?.getBoundingClientRect().height ?? null,
      overflow: nav ? nav.scrollWidth > nav.clientWidth + 1 : null,
      hasMore: !!document.getElementById('nav-more-toggle'),
    };
  });
  await page.close();
  return metrics;
}

async function captureRoadmap(name, width) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900 });
  await page.goto(`${base}/`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    document.querySelector('[data-reveal-section].roadmap')?.classList.add('is-revealed');
    document.querySelectorAll('.roadmap .reveal').forEach((el) => {
      el.classList.add('is-visible');
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    document.querySelector('.roadmap__inner')?.scrollIntoView({ block: 'center' });
  });
  await wait(400);
  const el = await page.$('.roadmap__inner');
  if (el) await el.screenshot({ path: path.join(outDir, name) });
  const copy = await page.evaluate(() => {
    const items = [...document.querySelectorAll('.roadmap__item')];
    return items.map((item) => ({
      label: item.querySelector('.roadmap__label')?.textContent?.replace(/\s+/g, ' ').trim(),
      text: item.querySelector('p')?.textContent?.trim(),
    }));
  });
  await page.close();
  return copy;
}

async function captureNavOpenClip(name, width) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900 });
  await page.goto(`${base}/`, { waitUntil: 'networkidle0' });
  await wait(400);
  const toggle = await page.$('#nav-more-toggle');
  if (toggle) await toggle.click();
  await wait(200);
  await page.screenshot({ path: path.join(outDir, name), clip: { x: 0, y: 0, width, height: 220 } });
  await page.close();
}

const report = { phase, nav: {}, roadmap: {} };
for (const w of [1440, 1280, 1024]) {
  report.nav[w] = await captureHeader('/', `nav-desktop-${w}.png`, w);
}
report.nav['1440-more'] = await captureNavOpenClip('nav-desktop-1440-more-open.png', 1440);
report.nav.mobileClosed = await captureHeader('/', 'nav-mobile-375-closed.png', 375);
report.nav.mobileOpen = await captureHeader('/', 'nav-mobile-375-open.png', 375, false, true);
report.nav.mobileMore = await captureHeader('/', 'nav-mobile-375-more-open.png', 375, true, true);

report.roadmap.desktop = await captureRoadmap('roadmap-desktop-1440.png', 1440);
report.roadmap.mobile = await captureRoadmap('roadmap-mobile-375.png', 375);

if (phase === 'after') {
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 900 });
  await page.goto(`${base}/`, { waitUntil: 'networkidle0' });
  report.mobileOverflow = await page.evaluate(() => ({
    doc: document.documentElement.scrollWidth <= window.innerWidth + 1,
    body: document.body.scrollWidth <= window.innerWidth + 1,
  }));
  await page.close();
}

fs.writeFileSync(path.join(outDir, 'verification.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await browser.close();
