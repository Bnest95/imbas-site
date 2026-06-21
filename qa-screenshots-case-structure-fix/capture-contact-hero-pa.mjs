import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'contact-hero-pa');
fs.mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

for (const [width, name] of [
  [1440, 'desktop-1440'],
  [375, 'mobile-375'],
]) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900 });
  await page.goto('http://127.0.0.1:8792/contact.html', { waitUntil: 'load' });
  await page.waitForSelector('.ct-masthead');
  await new Promise((r) => setTimeout(r, 400));

  const box = await page.evaluate(() => {
    const mast = document.querySelector('.ct-masthead');
    const routes = document.querySelector('.ct-routes');
    const mr = mast.getBoundingClientRect();
    const rr = routes.getBoundingClientRect();
    return {
      x: Math.max(0, mr.left - 12),
      y: mr.top + scrollY - 12,
      width: Math.max(mr.width, rr.width) + 24,
      height: rr.top - mr.top + 80,
    };
  });

  await page.screenshot({
    path: path.join(outDir, `contact-hero-${name}.png`),
    clip: box,
  });
  await page.close();
}

await browser.close();
console.log('Captured contact-hero-pa');
