import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const pages = [
  { file: 'privacy.html', types: ['WebPage', 'BreadcrumbList'], url: 'https://www.imbaslabs.com/privacy.html' },
  { file: 'terms.html', types: ['WebPage', 'BreadcrumbList'], url: 'https://www.imbaslabs.com/terms.html' },
  { file: 'accessibility.html', types: ['WebPage', 'BreadcrumbList'], url: 'https://www.imbaslabs.com/accessibility.html' },
  { file: 'contact.html', types: ['ContactPage', 'BreadcrumbList'], url: 'https://www.imbaslabs.com/contact.html' },
  { file: '404.html', types: [], url: null, expectNoSchema: true },
];

function extractJsonLd(html) {
  const match = html.match(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/);
  if (!match) return null;
  return JSON.parse(match[1]);
}

function validatePage(page) {
  const html = fs.readFileSync(path.join(root, page.file), 'utf8');
  const data = extractJsonLd(html);
  const issues = [];

  if (page.expectNoSchema) {
    if (data) issues.push('unexpected JSON-LD present');
    return { file: page.file, pass: issues.length === 0, issues, note: 'no action — noindex page' };
  }

  if (!data) {
    issues.push('missing JSON-LD block');
    return { file: page.file, pass: false, issues };
  }

  if (data['@context'] !== 'https://schema.org') issues.push('invalid @context');
  if (!Array.isArray(data['@graph'])) issues.push('missing @graph array');

  const graph = data['@graph'] || [];
  const types = graph.map((node) => node['@type']).filter(Boolean);

  for (const t of page.types) {
    if (!types.includes(t)) issues.push(`missing @type ${t}`);
  }

  if (types.includes('FAQPage')) issues.push('FAQPage must not be used on utility pages');

  const webpage = graph.find((n) => n['@type'] === 'WebPage' || n['@type'] === 'ContactPage');
  if (webpage) {
    if (webpage.url !== page.url) issues.push(`webpage.url mismatch: ${webpage.url}`);
    if (!webpage['@id']?.startsWith('https://www.imbaslabs.com/')) issues.push('webpage @id must use www.imbaslabs.com');
    if (!webpage.publisher?.['@id']?.includes('#organization')) issues.push('webpage.publisher must reference #organization');
    if (!webpage.isPartOf?.['@id']?.includes('#website')) issues.push('webpage.isPartOf must reference #website');
  }

  const crumbs = graph.find((n) => n['@type'] === 'BreadcrumbList');
  if (crumbs) {
    const items = crumbs.itemListElement || [];
    if (items.length < 2) issues.push('breadcrumb needs at least 2 items');
    for (const item of items) {
      if (!item.item?.startsWith('https://www.imbaslabs.com')) issues.push(`breadcrumb item not canonical: ${item.item}`);
    }
    if (items[0]?.item !== 'https://www.imbaslabs.com/') issues.push('breadcrumb must start at home');
    if (items.at(-1)?.item !== page.url) issues.push('breadcrumb must end at page url');
  }

  const orgs = graph.filter((n) => n['@type'] === 'Organization');
  if (orgs.length !== 1) issues.push(`expected 1 Organization stub, found ${orgs.length}`);

  const jsonValid = (() => {
    try {
      JSON.stringify(data);
      return true;
    } catch {
      return false;
    }
  })();
  if (!jsonValid) issues.push('JSON not serializable');

  return {
    file: page.file,
    pass: issues.length === 0,
    issues,
    types,
    webpageUrl: webpage?.url,
    breadcrumbCount: crumbs?.itemListElement?.length ?? 0,
  };
}

const results = pages.map(validatePage);
const report = {
  pass: results.every((r) => r.pass),
  results,
};

const outDir = path.join(__dirname, 'pass3a-utility-schema');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'validation.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(report.pass ? 0 : 1);
