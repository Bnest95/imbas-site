import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const base = process.env.BASE || 'http://127.0.0.1:8791';
const outDir = __dirname;

const shots = [
  {
    name: 'post-hero-hero-proof-375.png',
    selector: '.proof-strip--landing',
    offset: 280,
    clip: { x: 0, y: 0, width: 375, height: 680 },
  },
  {
    name: 'post-hero-exists-375.png',
    selector: '#exists-heading',
    offset: 56,
    clip: { x: 0, y: 0, width: 375, height: 700 },
  },
  {
    name: 'post-hero-compounding-375.png',
    selector: '#compound-h2',
    offset: 72,
    clip: { x: 0, y: 0, width: 375, height: 820 },
  },
];

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 });
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
await page.goto(`${base}/`, { waitUntil: 'networkidle0', timeout: 60000 });

for (const shot of shots) {
  if (shot.selector) {
    await page.evaluate(({ sel, offset }) => {
      const el = document.querySelector(sel);
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - (offset ?? 48);
        window.scrollTo(0, Math.max(0, y));
      }
    }, { sel: shot.selector, offset: shot.offset });
    await new Promise((r) => setTimeout(r, 400));
  } else {
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise((r) => setTimeout(r, 300));
  }

  await page.evaluate(() => {
    document.querySelectorAll('.reveal, [data-reveal-section] .reveal').forEach((el) => {
      el.classList.add('is-revealed');
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    document.querySelectorAll('[data-reveal-section]').forEach((el) => el.classList.add('is-revealed'));
  });

  const scrollY = await page.evaluate(() => window.scrollY);
  await page.screenshot({
    path: path.join(outDir, shot.name),
    clip: { ...shot.clip, y: scrollY },
  });
  console.log('Wrote', shot.name);
}

await browser.close();
