import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const TRACKED = [
  'index.html',
  'workbench.html',
  'archive.html',
  'methodology.html',
  'public-interest.html',
  'institutions.html',
  'for-readers.html',
  'contact.html',
  'field-notes/index.html',
  'field-notes/what-the-volunteer-gap-measures.html',
  'case/003.html',
  'case/005.html',
  'case/013.html',
  'case/018.html',
  'case/021.html',
  'privacy.html',
  'terms.html',
  'accessibility.html',
  'faq.html',
];

const SKIPPED = [
  'briefing/index.html',
  'briefing/post-1/index.html',
  'briefing/post-2/index.html',
  'briefing/post-3/index.html',
  'volunteer-gap.html',
  'how-it-works.html',
  '404.html',
];

const SNIPPET_MARK = '/_vercel/insights/script.js';
const VA_INIT = 'window.va = window.va || function ()';

const vercelJson = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

function headerCsp(block) {
  return block.headers.find((h) => h.key === 'Content-Security-Policy')?.value || '';
}

const trackedAudit = TRACKED.map((rel) => {
  const html = fs.readFileSync(path.join(root, rel), 'utf8');
  return {
    file: rel,
    hasSnippet: html.includes(SNIPPET_MARK) && html.includes(VA_INIT),
    hasGoogle: /googletagmanager|google-analytics|gtag\(/i.test(html),
    hasPlausible: /plausible\.io/i.test(html),
  };
});

const skippedAudit = SKIPPED.map((rel) => {
  const html = fs.readFileSync(path.join(root, rel), 'utf8');
  return {
    file: rel,
    hasSnippet: html.includes(SNIPPET_MARK),
  };
});

const privacy = fs.readFileSync(path.join(root, 'privacy.html'), 'utf8');
const apiChanged = ['api/field-notes-signup.js', 'api/repository.js', 'api/read.js'].some((f) => {
  const p = path.join(root, f);
  return fs.existsSync(p) && fs.readFileSync(p, 'utf8').includes('vercel');
});

const workbenchBlock = vercelJson.headers.find((h) => h.source === '/workbench.html') || { headers: [] };
const nonWorkbenchBlock = vercelJson.headers.find((h) => h.source.startsWith('/((')) || { headers: [] };
const nonWorkbenchCsp = headerCsp(nonWorkbenchBlock);
const workbenchCsp = headerCsp(workbenchBlock);

const report = {
  trackedAudit,
  skippedAudit,
  privacy: {
    mentionsVercel: /Vercel Web Analytics/i.test(privacy),
    deniesAnalytics: /does not currently use analytics/i.test(privacy),
    noGoogleClaim: /does not use Google Analytics/i.test(privacy),
  },
  csp: {
    nonWorkbenchConnect: nonWorkbenchCsp,
    workbenchConnect: workbenchCsp,
    nonWorkbenchHasVitals: nonWorkbenchCsp.includes('https://vitals.vercel-insights.com'),
    workbenchHasVitals: workbenchCsp.includes('https://vitals.vercel-insights.com'),
  },
  packageJson: {
    hasVercelAnalyticsDep:
      Boolean(pkg.dependencies?.['@vercel/analytics']) || Boolean(pkg.devDependencies?.['@vercel/analytics']),
  },
  apiChanged,
};

function privacyOk(html) {
  return (
    /Vercel Web Analytics/i.test(html) &&
    !/does not currently use analytics/i.test(html) &&
    /does not use Google Analytics/i.test(html)
  );
}

report.pass =
  trackedAudit.every((r) => r.hasSnippet && !r.hasGoogle && !r.hasPlausible) &&
  skippedAudit.every((r) => !r.hasSnippet) &&
  privacyOk(privacy) &&
  nonWorkbenchCsp.includes('https://vitals.vercel-insights.com') &&
  workbenchCsp.includes('https://vitals.vercel-insights.com') &&
  !pkg.dependencies?.['@vercel/analytics'] &&
  !pkg.devDependencies?.['@vercel/analytics'] &&
  !apiChanged;

const outDir = path.join(__dirname, 'vercel-analytics-pass5e1');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'verification.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(report.pass ? 0 : 1);
