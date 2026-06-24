import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const base = 'http://127.0.0.1:8792';

const OLD_FONT =
  'family=Fraunces:opsz,wght@9..144,400;9..144,450;9..144,500&family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;500';
const NEW_FONT =
  'family=Fraunces:opsz,wght@9..144,400..500&family=Inter:wght@400..500&family=JetBrains+Mono:wght@400..500';

const htmlFiles = [];
function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith('.') || ent.name === 'node_modules' || ent.name === 'qa-screenshots-case-structure-fix') continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (ent.name.endsWith('.html')) htmlFiles.push(p);
  }
}
walk(root);

const fontAudit = htmlFiles.map((f) => {
  const html = fs.readFileSync(f, 'utf8');
  return {
    file: path.relative(root, f),
    hasOldFont: html.includes(OLD_FONT),
    hasNewFont: html.includes(NEW_FONT),
    hasDisplaySwap: html.includes('display=swap'),
    hasPreconnectGoogle: html.includes('href="https://fonts.googleapis.com"'),
    hasPreconnectGstatic: html.includes('href="https://fonts.gstatic.com" crossorigin'),
  };
});

const homepageHtml = await fetch(`${base}/index.html`).then((r) => r.text());
const workbenchHtml = await fetch(`${base}/workbench.html`).then((r) => r.text());

const report = {
  fontUrl: {
    before: `https://fonts.googleapis.com/css2?${OLD_FONT}&display=swap`,
    after: `https://fonts.googleapis.com/css2?${NEW_FONT}&display=swap`,
  },
  families: { before: ['Fraunces', 'Inter', 'JetBrains Mono'], after: ['Fraunces', 'Inter', 'JetBrains Mono'] },
  weights: {
    before: { Fraunces: [400, 450, 500], Inter: [400, 500], 'JetBrains Mono': [400, 500] },
    after: { Fraunces: '400..500 (variable)', Inter: '400..500 (variable)', 'JetBrains Mono': '400..500 (variable)' },
  },
  ogImage: {
    path: 'og-image.png',
    bytes: fs.statSync(path.join(root, 'og-image.png')).size,
    dimensions: '1200x630',
    optimized: false,
    note: 'Lossless compression tools unavailable in audit environment; no file change',
  },
  homepageAssets: {
    stylesheets: [...homepageHtml.matchAll(/href="([^"]*\.css[^"]*)"/g)].map((m) => m[1]),
    scripts: [...homepageHtml.matchAll(/src="([^"]+\.js[^"]*)"/g)].map((m) => m[1]),
    hasWorkbenchCss: homepageHtml.includes('workbench.css'),
    hasWorkbenchBundle: homepageHtml.includes('workbench.bundle'),
    hasGhost: /ghost/i.test(homepageHtml),
  },
  workbenchAssets: {
    stylesheets: [...workbenchHtml.matchAll(/href="([^"]*\.css[^"]*)"/g)].map((m) => m[1]).filter((h) => h.includes('styles') || h.includes('workbench')),
    hasWorkbenchBundle: workbenchHtml.includes('workbench.bundle'),
  },
  fontAudit,
};

report.pass =
  fontAudit.every((f) => !f.hasOldFont) &&
  fontAudit.filter((f) => f.hasNewFont).length >= 21 &&
  !report.homepageAssets.hasWorkbenchCss &&
  !report.homepageAssets.hasWorkbenchBundle;

const outDir = path.join(__dirname, 'font-pass5i');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'verification.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
