import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const base = process.env.BASE || 'http://127.0.0.1:8792';

const shots = [
  {
    name: 'homepage-proof-strip-desktop-1440.png',
    url: '/',
    selector: '.proof-strip--landing',
    viewport: { width: 1440, height: 900 },
    pad: { x: 24, y: 12 },
  },
  {
    name: 'homepage-proof-strip-mobile-375.png',
    url: '/',
    selector: '.proof-strip--landing',
    viewport: { width: 375, height: 812, deviceScaleFactor: 2 },
    pad: { x: 0, y: 8 },
  },
  {
    name: 'homepage-archive-metrics-desktop-1440.png',
    url: '/#archive',
    selector: '.hp-arc-metrics',
    viewport: { width: 1440, height: 900 },
    pad: { x: 0, y: 8 },
  },
  {
    name: 'homepage-archive-metrics-mobile-375.png',
    url: '/#archive',
    selector: '.hp-arc-metrics',
    viewport: { width: 375, height: 812, deviceScaleFactor: 2 },
    pad: { x: 0, y: 8 },
  },
  {
    name: 'archive-stat-strip-desktop-1440.png',
    url: '/archive.html',
    selector: '.arc-stat-strip',
    viewport: { width: 1440, height: 900 },
    pad: { x: 12, y: 10 },
  },
  {
    name: 'archive-stat-strip-mobile-375.png',
    url: '/archive.html',
    selector: '.arc-stat-strip',
    viewport: { width: 375, height: 812, deviceScaleFactor: 2 },
    pad: { x: 0, y: 8 },
  },
];

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

for (const shot of shots) {
  const page = await browser.newPage();
  const vp = shot.viewport;
  await page.setViewport({
    width: vp.width,
    height: vp.height,
    deviceScaleFactor: vp.deviceScaleFactor || 1,
  });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.goto(`${base}${shot.url}`, { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 300));

  await page.evaluate(() => {
    document.querySelectorAll('.reveal, [data-reveal-section] .reveal').forEach((el) => {
      el.classList.add('is-revealed');
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    document.querySelectorAll('[data-reveal-section]').forEach((el) => el.classList.add('is-revealed'));
  });

  const box = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    el.scrollIntoView({ block: 'center' });
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y + window.scrollY, width: r.width, height: r.height };
  }, shot.selector);

  if (!box) {
    console.error('Missing selector', shot.selector, shot.name);
    await page.close();
    continue;
  }

  const pad = shot.pad || { x: 0, y: 0 };
  await page.screenshot({
    path: path.join(__dirname, shot.name),
    clip: {
      x: Math.max(0, box.x - pad.x),
      y: Math.max(0, box.y - pad.y),
      width: Math.min(vp.width, box.width + pad.x * 2),
      height: box.height + pad.y * 2,
    },
  });
  console.log('Wrote', shot.name);
  await page.close();
}

await browser.close();
