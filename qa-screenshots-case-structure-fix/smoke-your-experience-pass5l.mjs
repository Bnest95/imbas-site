import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');

const COPY = [
  'The AI output: not wrong, exactly. But off. Maybe it was managing you instead of answering you.',
  'Something important is missing, or weirdly one-sided.',
  'Imbas is here to help. Bring us the topic and the answer.',
  "Got it. We'll be in touch when we have something.",
];

const compoundingEnd = index.indexOf('</section>', index.indexOf('class="compounding section-scene"'));
const experienceStart = index.indexOf('class="your-experience section-scene"');
const ephemeralStart = index.indexOf('<!-- EPHEMERAL BY DEFAULT');
const experienceEnd = index.indexOf('</section>', experienceStart);

const orderOk =
  compoundingEnd !== -1 &&
  experienceStart !== -1 &&
  ephemeralStart !== -1 &&
  compoundingEnd < experienceStart &&
  experienceStart < ephemeralStart &&
  experienceEnd < ephemeralStart;

const apiFiles = ['api/field-notes-signup.js', 'api/repository.js'].map((f) => {
  const p = path.join(root, f);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
});

const experienceBlock = experienceStart !== -1
  ? index.slice(experienceStart, experienceEnd + '</section>'.length)
  : '';

const report = {
  placement: {
    orderOk,
    hasExperienceSection: experienceStart !== -1,
    betweenThesisAndEphemeral: orderOk,
  },
  copy: {
    paragraph1: experienceBlock.includes('The AI output: not wrong, exactly. But off. Maybe it was <span class="ember">managing</span> you instead of answering you.'),
    paragraph2: experienceBlock.includes('It&rsquo;s hedging like a lawyer'),
    paragraph3: experienceBlock.includes('AI accountability starts with you.'),
    confirm: experienceBlock.includes('Got it. We&rsquo;ll be in touch when we have something.'),
    monoLabel: experienceBlock.includes('<span>Your Experience</span>'),
    managingAccent:
      experienceBlock.includes('<span class="ember">managing</span>') &&
      (experienceBlock.match(/<span class="ember">/g) || []).length === 1,
  },
  form: {
    topicField: experienceBlock.includes('name="topic"') && experienceBlock.includes('placeholder="The topic or question"'),
    answerField: experienceBlock.includes('name="ai_answer"') && experienceBlock.includes('placeholder="What the AI told you"'),
    emailField: experienceBlock.includes('type="email"') && experienceBlock.includes('placeholder="Email — so we can tell you what we find"'),
    submitButton: experienceBlock.includes('>Send it</span>'),
    intakePanel: experienceBlock.includes('class="experience-intake'),
    fieldLabels: experienceBlock.includes('experience-capture__label') &&
      experienceBlock.includes('>Topic</label>') &&
      experienceBlock.includes('>AI answer</label>') &&
      experienceBlock.includes('>Contact</label>'),
    splitLayout: experienceBlock.includes('your-experience__layout'),
    todoComment: index.includes('// TODO: connect capture endpoint'),
    noApiAction: !/<form[^>]*class="experience-capture[^"]*"[^>]*action=/.test(index) &&
      !/id="experience-capture-form"[^>]*action=/.test(index),
  },
  analytics: {
    noVaFormTracking: !/window\.va\([\s\S]*experience-capture/.test(index),
    noGtagForm: !/gtag\([\s\S]*experience/.test(index),
  },
  css: {
    hasExperienceStyles: styles.includes('.experience-intake {'),
    adjacencyRule: styles.includes('.your-experience + .stakes.section-scene'),
    desktopTopAlign: /\.your-experience__layout\s*\{[^}]*align-items:\s*start/.test(styles),
    labelInStakes: /<div class="your-experience__stakes">[\s\S]*section-label/.test(experienceBlock),
  },
  apiUnchanged: {
    fieldNotesSignup: !apiFiles[0].includes('experience-capture'),
    repository: !apiFiles[1].includes('experience-capture'),
  },
};

report.pass =
  report.placement.orderOk &&
  Object.values(report.copy).every(Boolean) &&
  Object.values(report.form).every(Boolean) &&
  Object.values(report.analytics).every(Boolean) &&
  Object.values(report.css).every(Boolean) &&
  Object.values(report.apiUnchanged).every(Boolean);

const outDir = path.join(__dirname, 'your-experience-pass5l');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'verification.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(report.pass ? 0 : 1);
