/* The connective-copy inventory, and its lint result.
 *
 *   node build/copy-inventory.mjs
 *
 * Two lists, kept apart on purpose.
 *   governed  — strings that came out of the repository's own public-example
 *               packet. These are quoted, not written; a direction that changed one
 *               would be changing evidence.
 *   connective — every word written for this lane: labels, rules, orientation,
 *               register field names, entry copy, the forwarded note. Written once
 *               into the fixture before any direction existed, so all three say the
 *               same things and differ only in how they look.
 *
 * Both lists go through the repository's own lint, imported and run unmodified.
 */

import { createRequire } from "node:module";
import { writeFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { REPO, UI, RECORDS, PUBLIC_EXAMPLE, BOUNDARIES, RECORD_CLASS_LABEL, FIRST_RUN_LINE, RECORD_LEVEL_RULE } from "../shared/fixture.mjs";
import { LANE } from "./shoot.mjs";

const require = createRequire(import.meta.url);
const vocab = require(`${REPO}/reader-check-vocab.js`);

/* Some rendered strings are composed at build time and do not exist on the source
 * fixture — the count line is written from the mark total, so `RECORDS` carries a
 * mark array and no sentence. Reading the inventory off the source alone therefore
 * listed four `count_line` rows holding `undefined`, and `lintString(undefined)`
 * returns `[]`, so the inventory reported them clean. A checker that answers "no
 * violations" about a string it never saw is worse than one that skips it silently,
 * because it produces a receipt. The built file is what ships to the page, so the
 * built file is what gets read. */
const BUILT = (() => {
  const src = readFileSync(resolve(LANE, "shared/fixture.data.js"), "utf8");
  const window = {};
  new Function("window", src)(window);
  return window.IMBAS_FIXTURE;
})();
const BUILT_RECORD = new Map(BUILT.records.map((r) => [r.id, r]));

/* And the hole itself gets closed: every row in this inventory has to be a real
 * non-empty string before it reaches the lint. */
function requireText(path, text) {
  if (typeof text !== "string" || !text.trim()) {
    console.error(`FAIL ${path}: inventory row carries no string (${typeof text})`);
    process.exit(1);
  }
  return text;
}

/* Every leaf string in the packet, with its dotted path. */
function leaves(obj, prefix, out) {
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") out.push({ path, text: v });
    else if (v && typeof v === "object") leaves(v, path, out);
  }
  return out;
}

const governedPaths = new Set(leaves(PUBLIC_EXAMPLE, "PUBLIC_EXAMPLE", []).map((l) => l.text));

const connective = [];
for (const l of leaves(UI, "ui", [])) connective.push({ ...l, kind: "ui" });
for (const [k, v] of Object.entries(BOUNDARIES)) connective.push({ path: `boundary.${k}`, text: v, kind: "scope" });
for (const [k, v] of Object.entries(RECORD_CLASS_LABEL)) connective.push({ path: `record_class_label.${k}`, text: v, kind: "class label" });
connective.push({ path: "FIRST_RUN_LINE", text: FIRST_RUN_LINE, kind: "scope" });
connective.push({ path: "RECORD_LEVEL_RULE", text: RECORD_LEVEL_RULE, kind: "findings" });

/* Each record carries its own scope and provenance blocks, and those are
 * lane-written connective copy rather than record content — they say what the
 * record covers and how it was made, not what was found. They belong in this
 * list, and an earlier pass that swept only the shared BOUNDARIES constant let
 * three denials through to the screen. */
/* A field carrying a `src` is a quotation from the governed packet and belongs on
 * the other list; only the lane's own writing lands here. The label above a quoted
 * field is always the lane's, since the packet supplies no labels. */
const own = (f) => (f && f.src ? null : f && typeof f === "object" ? f.text : f);

for (const r of RECORDS) {
  /* First-contact metadata is lane-written prose about what was read and what it was
   * read against, so it is connective copy and goes through the same lint as the
   * rest. It was four mono identifiers until this pass, which is exactly why it
   * needs checking now: an identifier cannot violate a vocabulary rule, a sentence
   * can, and this one sits above the fold. */
  connective.push({ path: `${r.id}.inspected`, text: r.inspected, kind: "scope" });
  connective.push({ path: `${r.id}.condition`, text: r.condition, kind: "scope" });
  for (const p of r.provenance || []) {
    if (own(p.label) !== null) connective.push({ path: `${r.id}.provenance.${p.id}.label`, text: own(p.label), kind: "provenance" });
    if (own(p.body) !== null) connective.push({ path: `${r.id}.provenance.${p.id}.body`, text: own(p.body), kind: "provenance" });
  }
  r.register_close.forEach((c, i) => {
    connective.push({ path: `${r.id}.register_close[${i}].label`, text: c.label, kind: "scope" });
    if (!c.src) connective.push({ path: `${r.id}.register_close[${i}].text`, text: c.text, kind: "scope" });
  });
  if (r.capture_shape) {
    connective.push({ path: `${r.id}.capture_shape.heading`, text: r.capture_shape.heading, kind: "scope" });
    connective.push({ path: `${r.id}.capture_shape.body`, text: r.capture_shape.body, kind: "scope" });
  }
}

/* Record content that is not the governed packet: the three fixture records this
 * lane wrote so the anatomy could be tested at one finding and at nine.
 *
 * Every one of these fields is a `{ text, src }` pair, because record content
 * carries its provenance alongside it. They were being handed to the lint as whole
 * objects, and `lintString` returns `[]` for anything that is not a string, so this
 * list has been reporting "31 strings, 0 violations" while checking nothing at all.
 * The strings themselves are clean — `generate.mjs` lints the built output and G8
 * lints what renders, and both cover this content — but a receipt that says
 * "checked" about work that never happened is the failure, not the strings. */
const authored = [];
const val = (f) => (f && typeof f === "object" ? f.text : f);
for (const r of RECORDS) {
  const src = r.id === "montana" ? "governed" : "authored for this lane";
  const built = BUILT_RECORD.get(r.id);
  authored.push({ path: `${r.id}.finding_sentence`, text: val(r.finding_sentence), source: src });
  authored.push({ path: `${r.id}.count_line`, text: built.count_line, source: "composed at build from the mark total" });
  authored.push({ path: `${r.id}.context`, text: val(r.context), source: src });
  r.marks.forEach((m, i) => {
    authored.push({ path: `${r.id}.mark[${i + 1}].points_at`, text: val(m.points_at), source: src });
    if (m.materiality) authored.push({ path: `${r.id}.mark[${i + 1}].materiality`, text: val(m.materiality), source: src });
    if (m.ask) authored.push({ path: `${r.id}.mark[${i + 1}].ask`, text: val(m.ask), source: src });
  });
}

const governed = leaves(PUBLIC_EXAMPLE, "PUBLIC_EXAMPLE", []);

/* The standing composition rule: state positively what the record is and carries.
 * A denial teaches the misreading it is trying to prevent, so the inventory is
 * swept for the shapes a denial takes. */
const DENIAL = [
  /\bis not\b/i, /\bare not\b/i, /\bdoes not (say|mean|claim|prove|assert)\b/i,
  /\bdoesn't\b/i, /\bisn't\b/i, /\baren't\b/i, /\bnot a\b/i, /\bnot evidence\b/i,
  /\bno claim\b/i, /\bnever says\b/i,
  /\bno\b[^.]{0,44}?\b(ran|runs|exists?|is resolved|was scored|was run|was made)\b/i,
  /\bnothing here (is|does|means)\b/i,
];

function lint(list) {
  return list.map((s) => {
    requireText(s.path, s.text);
    const r = vocab.lintString(s.text);
    const denials = DENIAL.filter((re) => re.test(s.text)).map(String);
    return { ...s, violations: r.violations || r, denial_shapes: denials };
  });
}

const linted = lint(connective);
const lintedGoverned = lint(governed);
const lintedAuthored = lint(authored);

const all = [...linted, ...lintedGoverned, ...lintedAuthored];
const violations = all.filter((r) => (r.violations || []).length);
const denials = linted.filter((r) => r.denial_shapes.length);

const report = {
  lint: {
    module: `${REPO}/reader-check-vocab.js`,
    version: vocab.CHECK_VOCAB_VERSION,
    imported_unmodified: true,
    strings_checked: all.length,
    violations: violations.length,
    detail: violations,
  },
  positive_framing_sweep: {
    rule: "State positively what the record is, carries and supports. Do not deny a misreading by naming it.",
    connective_strings_checked: linted.length,
    denial_shapes_found: denials.length,
    detail: denials,
  },
  connective_copy: linted.map(({ path, text, kind }) => ({ path, kind, text })),
  governed_source_strings: lintedGoverned.map(({ path, text }) => ({ path, text, owner: "reader-public-example.js" })),
  authored_record_content: lintedAuthored.map(({ path, text, source }) => ({ path, text, source })),
};

writeFileSync(resolve(LANE, "shared/copy-inventory.json"), JSON.stringify(report, null, 2) + "\n");

console.log(`lint ${vocab.CHECK_VOCAB_VERSION} · ${all.length} strings · ${violations.length} violations`);
console.log(`connective copy: ${linted.length} strings · ${denials.length} denial shapes`);
console.log(`governed source strings: ${lintedGoverned.length}`);
console.log(`authored record content: ${lintedAuthored.length}`);
for (const v of violations) console.log("  VIOLATION", v.path, JSON.stringify(v.violations));
for (const d of denials) console.log("  DENIAL", d.path, JSON.stringify(d.text));
