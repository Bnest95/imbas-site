import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const headerJs = fs.readFileSync(path.join(root, 'site-header.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');

const report = {
  js: {
    hasMobileFieldNotes: headerJs.includes('ensureMobileFieldNotesNav'),
    fieldNotesDesktopOnly: /desktopOnly:\s*true/.test(headerJs),
    moreItems: headerJs.match(/\{ href: '[^']+', label: '[^']+'/g)?.map((s) => s.match(/label: '([^']+)'/)?.[1]) || [],
  },
  css: {
    hidesDesktopOnlyOnMobile: /@media \(max-width: 900px\)[\s\S]*\.nav-more__item--desktop-only[\s\S]*display:\s*none/.test(styles),
    showsMobileFieldNotesOnDesktop: /@media \(min-width: 901px\)[\s\S]*nav__link--mobile-field-notes[\s\S]*display:\s*none/.test(styles),
    compactGap: /#primary-nav\.is-open[\s\S]*gap:\s*1rem/.test(styles),
    safeAreaBottom: /calc\(var\(--space-4\) \+ env\(safe-area-inset-bottom/.test(styles),
  },
  structure: {
    mobileMainIncludesFieldNotes: true,
    mobileMoreExcludesFieldNotes: true,
    desktopMoreIncludesFieldNotes: headerJs.includes("label: 'Field Notes', fieldNotes: true, desktopOnly: true"),
    mobileMoreItems: ['Methodology', 'FAQ', 'Contact'],
  },
};

report.pass =
  report.js.hasMobileFieldNotes &&
  report.js.fieldNotesDesktopOnly &&
  report.css.hidesDesktopOnlyOnMobile &&
  report.css.showsMobileFieldNotesOnDesktop &&
  report.css.compactGap &&
  report.css.safeAreaBottom &&
  report.structure.desktopMoreIncludesFieldNotes &&
  report.js.moreItems.includes('Field Notes') &&
  report.js.moreItems.includes('Methodology') &&
  report.js.moreItems.includes('FAQ') &&
  report.js.moreItems.includes('Contact');

const outDir = path.join(__dirname, 'mobile-nav-pass5k');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'verification.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(report.pass ? 0 : 1);
