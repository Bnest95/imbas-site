import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'contact-institutions-pb');
fs.mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

for (const [width, name] of [
  [1440, 'desktop-after-1440'],
  [375, 'mobile-after-375'],
]) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900 });
  await page.goto('http://127.0.0.1:8792/contact.html', { waitUntil: 'load' });
  await page.waitForSelector('.ct-routes');
  await page.evaluate(() =>
    document.querySelector('.ct-routes').scrollIntoView({ block: 'start' }),
  );
  await new Promise((r) => setTimeout(r, 400));

  const box = await page.evaluate(() => {
    const el = document.querySelector('.ct-routes');
    const r = el.getBoundingClientRect();
    return {
      x: Math.max(0, r.left - 12),
      y: r.top + scrollY - 12,
      width: r.width + 24,
      height: r.height + 24,
    };
  });

  await page.screenshot({
    path: path.join(outDir, `contact-routes-${name}.png`),
    clip: box,
  });
  await page.close();
}

await browser.close();
console.log('Captured contact-institutions-pb');
