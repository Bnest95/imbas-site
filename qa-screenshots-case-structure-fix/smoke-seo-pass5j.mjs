import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const TRACKED_ANALYTICS = [
  'index.html',
  'workbench.html',
  'archive.html',
  'methodology.html',
  'public-interest.html',
  'field-notes/index.html',
  'field-notes/what-the-volunteer-gap-measures.html',
];

const INDEXABLE = [
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
  'faq.html',
  'privacy.html',
  'terms.html',
  'accessibility.html',
  'volunteer-gap.html',
  'how-it-works.html',
];

const CANONICAL_PAGES = [
  { file: 'index.html', canonical: 'https://www.imbaslabs.com/' },
  { file: 'workbench.html', canonical: 'https://www.imbaslabs.com/workbench.html' },
  { file: 'archive.html', canonical: 'https://www.imbaslabs.com/archive.html' },
  { file: 'methodology.html', canonical: 'https://www.imbaslabs.com/methodology.html' },
  { file: 'public-interest.html', canonical: 'https://www.imbaslabs.com/public-interest.html' },
  {
    file: 'field-notes/what-the-volunteer-gap-measures.html',
    canonical: 'https://www.imbaslabs.com/field-notes/what-the-volunteer-gap-measures.html',
  },
  { file: 'case/005.html', canonical: 'https://www.imbaslabs.com/case/005.html' },
];

const SITEMAP_LASTMOD = [
  { loc: 'https://www.imbaslabs.com/', lastmod: '2026-05-29' },
  { loc: 'https://www.imbaslabs.com/workbench.html', lastmod: '2026-05-29' },
  { loc: 'https://www.imbaslabs.com/public-interest.html', lastmod: '2026-05-29' },
  { loc: 'https://www.imbaslabs.com/field-notes/', lastmod: '2026-05-29' },
  {
    loc: 'https://www.imbaslabs.com/field-notes/what-the-volunteer-gap-measures.html',
    lastmod: '2026-05-29',
  },
  { loc: 'https://www.imbaslabs.com/case/005.html', lastmod: '2026-05-09' },
  { loc: 'https://www.imbaslabs.com/case/018.html', lastmod: '2026-05-19' },
  { loc: 'https://www.imbaslabs.com/case/003.html', lastmod: '2026-05-16' },
  { loc: 'https://www.imbaslabs.com/case/021.html', lastmod: '2026-05-21' },
  { loc: 'https://www.imbaslabs.com/case/013.html', lastmod: '2026-05-17' },
];

function walkHtml(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith('.') || ent.name === 'node_modules' || ent.name === 'qa-screenshots-case-structure-fix') continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkHtml(p, acc);
    else if (ent.name.endsWith('.html')) acc.push(path.relative(root, p));
  }
  return acc;
}

const robots = fs.readFileSync(path.join(root, 'robots.txt'), 'utf8');
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const privacy = fs.readFileSync(path.join(root, 'privacy.html'), 'utf8');
const fnArticle = fs.readFileSync(path.join(root, 'field-notes/what-the-volunteer-gap-measures.html'), 'utf8');
const fnIndex = fs.readFileSync(path.join(root, 'field-notes/index.html'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

const allHtml = walkHtml(root);
const ghostHits = allHtml.filter((rel) => {
  const html = fs.readFileSync(path.join(root, rel), 'utf8');
  return /\bghost\b/i.test(html) && !/is-ghost|trace ghost/i.test(html);
});

const noindexIndexable = INDEXABLE.filter((rel) => {
  const html = fs.readFileSync(path.join(root, rel), 'utf8');
  return /noindex/i.test(html);
});

const missingDescription = INDEXABLE.filter((rel) => {
  const html = fs.readFileSync(path.join(root, rel), 'utf8');
  return !/<meta name="description" content="[^"]+"/.test(html);
});

const canonicalAudit = CANONICAL_PAGES.map(({ file, canonical }) => {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const m = html.match(/<link rel="canonical" href="([^"]+)"/);
  return { file, expected: canonical, actual: m?.[1] || null, ok: m?.[1] === canonical };
});

const sitemapLastmodAudit = SITEMAP_LASTMOD.map(({ loc, lastmod }) => {
  const block = sitemap.split('<loc>').find((chunk) => chunk.startsWith(loc));
  const ok = Boolean(block && block.includes(`<lastmod>${lastmod}</lastmod>`));
  return { loc, lastmod, ok };
});

const analyticsAudit = TRACKED_ANALYTICS.map((rel) => {
  const html = fs.readFileSync(path.join(root, rel), 'utf8');
  return {
    file: rel,
    hasVercel: html.includes('/_vercel/insights/script.js'),
    hasGoogle: /googletagmanager|google-analytics|gtag\(/i.test(html),
    hasPlausible: /plausible\.io/i.test(html),
  };
});

const caseCtaAudit = ['case/003.html', 'case/005.html', 'case/013.html', 'case/018.html', 'case/021.html'].map(
  (rel) => {
    const html = fs.readFileSync(path.join(root, rel), 'utf8');
    return {
      file: rel,
      hasArchive: html.includes('href="/archive.html"'),
      hasMethodology: html.includes('href="/methodology.html"'),
      hasVolunteerGap: html.includes('href="/volunteer-gap.html"'),
    };
  }
);

let sitemapXmlValid = false;
try {
  sitemapXmlValid = sitemap.includes('<?xml') && sitemap.includes('</urlset>') && !sitemap.includes('&amp;amp;');
} catch {
  sitemapXmlValid = false;
}

const report = {
  robots: {
    hasSitemap: robots.includes('Sitemap: https://www.imbaslabs.com/sitemap.xml'),
    allowsRoot: /^Allow: \/$/m.test(robots),
    blocksNothingCritical: !/Disallow: \/(|field-notes|case|workbench|archive|methodology)/i.test(robots),
  },
  sitemap: { xmlValid: sitemapXmlValid, lastmodAudit: sitemapLastmodAudit },
  canonicalAudit,
  internalLinks: {
    fnArticle: {
      methodology: fnArticle.includes('href="/methodology.html"'),
      archive: fnArticle.includes('href="/archive.html"'),
      workbench: fnArticle.includes('href="/workbench.html"'),
      breadcrumb: fnArticle.includes('"@type": "BreadcrumbList"'),
    },
    fnIndex: {
      article: fnIndex.includes('href="/field-notes/what-the-volunteer-gap-measures.html"'),
    },
    caseCtaAudit,
  },
  metadata: { ghostHits, noindexIndexable, missingDescription },
  analyticsAudit,
  packageJson: {
    hasVercelAnalyticsDep:
      Boolean(pkg.dependencies?.['@vercel/analytics']) || Boolean(pkg.devDependencies?.['@vercel/analytics']),
  },
  privacyMentionsVercel: /Vercel Web Analytics/i.test(privacy),
};

report.pass =
  report.robots.hasSitemap &&
  report.robots.allowsRoot &&
  report.sitemap.xmlValid &&
  sitemapLastmodAudit.every((r) => r.ok) &&
  canonicalAudit.every((r) => r.ok) &&
  report.internalLinks.fnArticle.methodology &&
  report.internalLinks.fnArticle.archive &&
  report.internalLinks.fnArticle.workbench &&
  report.internalLinks.fnIndex.article &&
  caseCtaAudit.every((r) => r.hasArchive && r.hasMethodology && r.hasVolunteerGap) &&
  ghostHits.length === 0 &&
  noindexIndexable.length === 0 &&
  missingDescription.length === 0 &&
  analyticsAudit.every((r) => r.hasVercel && !r.hasGoogle && !r.hasPlausible) &&
  !report.packageJson.hasVercelAnalyticsDep &&
  report.privacyMentionsVercel;

const outDir = path.join(__dirname, 'seo-pass5j');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'verification.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(report.pass ? 0 : 1);
