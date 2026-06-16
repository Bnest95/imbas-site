import puppeteer from 'puppeteer';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const base = 'http://127.0.0.1:8765';
const outDir = __dirname;

const shots = [
  { file: 'case/003.html', name: 'case-003', width: 1440 },
  { file: 'case/013.html', name: 'case-013', width: 1440 },
];

const phase = process.argv[2] || 'revised';
await mkdir(outDir, { recursive: true });

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();

for (const { file, name, width } of shots) {
  await page.setViewport({ width, height: 900 });
  await page.goto(`${base}/${file}`, { waitUntil: 'networkidle0' });
  await page.screenshot({
    path: path.join(outDir, `${phase}-${name}-desktop-${width}.png`),
    fullPage: true,
  });
}

await browser.close();
console.log(`Saved ${phase} screenshots to ${outDir}`);
