import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

const desc =
  'Imbas inspects what AI answers surface, omit, and reframe — across ChatGPT, Claude, Gemini, and Grok — building public records for accountability.';

const orgDesc =
  'Imbas inspects what AI answers surface, omit, and reframe — publishing public case records.';

const report = {
  meta: {
    descriptionPresent: new RegExp(`<meta name="description" content="${desc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`).test(index),
    ogDescriptionMatches: index.includes(`<meta property="og:description" content="${desc}"`),
    twitterDescriptionMatches: index.includes(`<meta name="twitter:description" content="${desc}"`),
    titleUnchanged: index.includes('<title>Imbas — Inspect what your AI surfaces and what it leaves out</title>'),
    orgDescription: index.includes(`"description": "${orgDesc}"`),
  },
  crawl: {
    yourExperienceLabel: index.includes('<span>Your Experience</span>'),
    paragraph1: index.includes('The AI output: not wrong, exactly.'),
    paragraph2: index.includes('hedging like a lawyer'),
    paragraph3: index.includes('AI accountability starts with you.'),
    placeholders: index.includes('placeholder="The topic or question"') &&
      index.includes('placeholder="What the AI told you"'),
    noNoindex: !/<meta[^>]+noindex/i.test(index),
  },
  analytics: {
    vercelPresent: index.includes('/_vercel/insights/script.js'),
    noGtag: !/googletagmanager|gtag\(/i.test(index),
  },
  stuffing: {
  accountabilityCount: (index.match(/accountability/gi) || []).length,
  },
};

report.stuffing.ok = report.stuffing.accountabilityCount <= 4;
report.pass =
  Object.values(report.meta).every(Boolean) &&
  Object.values(report.crawl).every(Boolean) &&
  Object.values(report.analytics).every(Boolean) &&
  report.stuffing.ok;

const outDir = path.join(__dirname, 'your-experience-pass5l3');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'verification.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(report.pass ? 0 : 1);
