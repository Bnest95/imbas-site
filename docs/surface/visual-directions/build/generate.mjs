// Build step for the visual-direction lane.
//
// SCRATCH ONLY. Reads the repository at an absolute path; writes only inside
// /Users/brendan/Documents/Claude/scratch/imbas-visual-directions/.
//
// What it does, in order:
//   1. resolves every governed string against the repository packet and proves
//      byte-equality
//   2. resolves every QUOTED_SPAN quote and every PASSAGE_CONTEXT region in the
//      source body, exactly once, and segments the body so all three directions
//      receive identical segmentation
//   3. runs the repository's own lintUserFacingStrings, imported unmodified, over
//      every user-facing string
//   4. emits shared/fixture.data.js (plain script, one global — loads from file://)
//   5. emits the connective-copy inventory and the governed-string inventory as
//      separate files
//   6. records SHA-256 for the anatomy, the fixture and the emitted data file

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const LANE = resolve(HERE, "..");

const {
  REPO,
  ANATOMY_VERSION,
  ANATOMY_ARCHIVED_VERSION,
  ANATOMY_ARCHIVED_DIRECTIONS,
  ANCHOR_MODE,
  ANCHOR_CHANNEL,
  DECLARED_CHECKS,
  CHECK_OUTCOME,
  CHECK_REGISTER_VERSION,
  RECORD_CLASS,
  RECORD_CLASS_LABEL,
  BOUNDARIES,
  FIRST_RUN_LINE,
  RECORD_LEVEL_RULE,
  UI,
  RECORDS,
  PUBLIC_EXAMPLE,
  FINDING_CLASSES,
  ANCHOR_STATUS,
} = await import(resolve(LANE, "shared/fixture.mjs"));

const { lintUserFacingStrings, CHECK_VOCAB_VERSION } = await import(
  `${REPO}/reader-check-vocab.js`
);

const sha256 = (s) => createHash("sha256").update(s, "utf8").digest("hex");
const fileSha = (p) => createHash("sha256").update(readFileSync(p)).digest("hex");

const failures = [];
const fail = (msg) => failures.push(msg);

// ─────────────────────────────────────────────────────────────────────────────
// 1. GOVERNED STRINGS
// Every {text, src} pair with a src resolves against the live packet.
// ─────────────────────────────────────────────────────────────────────────────

const SRC_ROOTS = { PUBLIC_EXAMPLE };

function resolveSrc(path) {
  const parts = path.match(/[^.[\]]+/g);
  let node = SRC_ROOTS;
  for (const part of parts) {
    if (node == null) return undefined;
    node = node[part];
  }
  return node;
}

const governed = [];

function collectGoverned(node, where) {
  if (node == null || typeof node !== "object") return;
  if (typeof node.text === "string" && "src" in node) {
    if (node.src) {
      const actual = resolveSrc(node.src);
      const identical = actual === node.text;
      governed.push({
        at: where,
        src: node.src,
        chars: node.text.length,
        sha256: sha256(node.text),
        byte_identical: identical,
      });
      if (!identical) fail(`governed string diverged at ${where} (${node.src})`);
    }
    return;
  }
  for (const [k, v] of Object.entries(node)) collectGoverned(v, `${where}.${k}`);
}

for (const rec of RECORDS) collectGoverned(rec, rec.id);

// The packet's own version fields travel with the record but carry no {text,src}
// wrapper, so they are proved directly.
if (RECORDS[0].packet_version !== PUBLIC_EXAMPLE.version) fail("packet version diverged");
if (RECORDS[0].run_id !== PUBLIC_EXAMPLE.run_id) fail("run id diverged");
governed.push(
  {
    at: "montana.packet_version",
    src: "PUBLIC_EXAMPLE.version",
    chars: PUBLIC_EXAMPLE.version.length,
    sha256: sha256(PUBLIC_EXAMPLE.version),
    byte_identical: true,
  },
  {
    at: "montana.run_id",
    src: "PUBLIC_EXAMPLE.run_id",
    chars: PUBLIC_EXAMPLE.run_id.length,
    sha256: sha256(PUBLIC_EXAMPLE.run_id),
    byte_identical: true,
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. ANCHOR RESOLUTION AND SEGMENTATION
// The generator, not the direction, decides where a mark sits in the body.
// Three directions therefore cannot disagree about it.
// ─────────────────────────────────────────────────────────────────────────────

function occurrences(haystack, needle) {
  if (!needle) return [];
  const out = [];
  let i = haystack.indexOf(needle);
  while (i !== -1) {
    out.push(i);
    i = haystack.indexOf(needle, i + 1);
  }
  return out;
}

function locateOnce(blocks, needle, label, where) {
  const hits = [];
  blocks.forEach((b, bi) => {
    for (const at of occurrences(b.text, needle)) hits.push({ block: bi, at });
  });
  if (hits.length !== 1) {
    fail(`${where}: ${label} resolves ${hits.length} times in the source body`);
    return null;
  }
  return hits[0];
}

function segmentRecord(rec) {
  const blocks = rec.source.blocks;
  const intervals = blocks.map(() => []);

  for (const mark of rec.marks) {
    const where = `${rec.id} mark ${mark.n}`;

    if (mark.anchor_mode === ANCHOR_MODE.RECORD_LEVEL_ABSENCE) {
      if (mark.quote || mark.region_start || mark.region_end)
        fail(`${where}: a record-level absence carries an in-document anchor`);
      continue;
    }

    if (mark.anchor_mode === ANCHOR_MODE.QUOTED_SPAN) {
      const hit = locateOnce(blocks, mark.quote, "quote", where);
      if (!hit) continue;
      intervals[hit.block].push({ start: hit.at, end: hit.at + mark.quote.length, mark: mark.n, mode: mark.anchor_mode });
      continue;
    }

    if (mark.anchor_mode === ANCHOR_MODE.PASSAGE_CONTEXT) {
      const a = locateOnce(blocks, mark.region_start, "region start", where);
      const b = locateOnce(blocks, mark.region_end, "region end", where);
      if (!a || !b) continue;
      if (a.block !== b.block) {
        fail(`${where}: region start and end sit in different blocks`);
        continue;
      }
      const end = b.at + mark.region_end.length;
      if (a.at >= end) {
        fail(`${where}: region end does not follow region start`);
        continue;
      }
      intervals[a.block].push({ start: a.at, end, mark: mark.n, mode: mark.anchor_mode });
      continue;
    }

    fail(`${where}: unknown anchor mode ${mark.anchor_mode}`);
  }

  return blocks.map((b, bi) => {
    const iv = intervals[bi].sort((x, y) => x.start - y.start);
    for (let i = 1; i < iv.length; i++) {
      if (iv[i].start < iv[i - 1].end) fail(`${rec.id} block ${bi}: marks ${iv[i - 1].mark} and ${iv[i].mark} overlap`);
    }
    const segments = [];
    let cursor = 0;
    for (const s of iv) {
      if (s.start > cursor) segments.push({ text: b.text.slice(cursor, s.start), mark: null, mode: null });
      segments.push({ text: b.text.slice(s.start, s.end), mark: s.mark, mode: s.mode });
      cursor = s.end;
    }
    if (cursor < b.text.length) segments.push({ text: b.text.slice(cursor), mark: null, mode: null });
    if (segments.length === 0) segments.push({ text: b.text, mark: null, mode: null });

    const rebuilt = segments.map((s) => s.text).join("");
    if (rebuilt !== b.text) fail(`${rec.id} block ${bi}: segmentation altered the source text`);

    return { type: b.type, segments };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. RECORD ASSEMBLY
// Derived fields are computed once here so no direction computes them.
// ─────────────────────────────────────────────────────────────────────────────

const EVIDENCE_TEXT = {
  evidence_quoted: UI.z5.evidence_quoted,
  evidence_absent: UI.z5.evidence_absent,
  evidence_probe: UI.z5.evidence_probe,
  evidence_region: UI.z5.evidence_region,
};

const text = (v) => (v && typeof v === "object" && "text" in v ? v.text : v);

function buildRecord(rec) {
  const n = rec.marks.length;
  const count_line = n === 1 ? UI.z2.count_one : UI.z2.count_many(n);

  /* The census is counted off the marks, in the anatomy's own channel order, and a
   * channel with no marks contributes no clause rather than a zero. A "0" would be
   * an absence rendered as a measurement, and it would make three records that found
   * different kinds of thing look like one template with different digits in it.
   * `census_counts` travels beside the sentence so the harness can check the prose
   * against the arithmetic rather than against another copy of the prose. */
  const CENSUS_ORDER = ["QUOTED_SPAN", "PASSAGE_CONTEXT", "RECORD_LEVEL_ABSENCE"];
  const census_counts = {};
  for (const m of rec.marks) census_counts[m.anchor_mode] = (census_counts[m.anchor_mode] || 0) + 1;
  const census_line =
    `${UI.z2.census_lead} ` +
    CENSUS_ORDER.filter((k) => census_counts[k]).map((k) => UI.z2.census_part[k](census_counts[k])).join(", ") +
    ".";
  const tallied = CENSUS_ORDER.reduce((s, k) => s + (census_counts[k] || 0), 0);
  if (tallied !== n) fail(`${rec.id}: census totals ${tallied} against ${n} marks`);

  /* Two tiers, same facts.
   *
   * `address` is what a person meets first, so it carries only what a person can
   * read: the date in words, what was inspected, and what it was inspected against.
   * `identifiers` carries the durable handles — run, packet, anatomy — and sits in
   * the provenance block. Nothing was dropped in the split. An opaque string above
   * the fold buys nothing from the reader who needs to understand the record and is
   * no less exact three screens down for the reader who needs to cite it. */
  const address = [
    { label: UI.z1.address_read, value: rec.read_human },
    { label: UI.z1.address_inspected, value: rec.inspected },
    { label: UI.z1.address_condition, value: rec.condition },
  ];
  for (const [k, v] of Object.entries({ read_human: rec.read_human, inspected: rec.inspected, condition: rec.condition })) {
    if (!v) fail(`${rec.id}: first-contact metadata is missing ${k}`);
  }

  const identifiers = [];
  if (rec.record_class === RECORD_CLASS.GOVERNED_PUBLIC_EXAMPLE) {
    identifiers.push({ label: UI.z6.address_run, value: rec.run_id });
    identifiers.push({ label: UI.z6.address_packet, value: rec.packet_version });
  } else {
    identifiers.push({ label: UI.z6.address_record, value: rec.run_id });
  }
  /* The anatomy handle is deliberately absent from this list. It is the one
   * identifier whose value depends on which direction is rendering — B cites v2, the
   * archived pair cites v1 — and a per-direction value cannot live in a per-record
   * fixture without the fixture growing a direction axis. The kit appends it in
   * `identity()` from the same source that stamps the document element, so the
   * handle a reader is told to cite and the hash the harness proves are one decision
   * made in one place. */

  const marks = rec.marks.map((m) => ({
    n: m.n,
    anchor_mode: m.anchor_mode,
    channel: ANCHOR_CHANNEL[m.anchor_mode],
    in_document: m.anchor_mode !== ANCHOR_MODE.RECORD_LEVEL_ABSENCE,
    mode_meaning: UI.z4.mode_meaning[m.anchor_mode],
    signal_class: m.signal_class ?? null,
    relation: m.relation ?? null,
    anchor_status: m.anchor_status,
    quote: m.quote ?? null,
    region_start: m.region_start ?? null,
    region_end: m.region_end ?? null,
    expectation_quote: m.expectation_quote ?? null,
    points_at: text(m.points_at),
    declared: m.declared ?? null,
    declared_by: m.declared_by ?? null,
    observed: text(m.observed) ?? null,
    materiality: text(m.materiality) ?? null,
    rests_on: m.rests_on ?? null,
    carries: m.carries ?? null,
    connect: m.connect ?? null,
    evidence_text: EVIDENCE_TEXT[m.evidence],
    worth_asking: m.worth_asking,
  }));

  for (const m of marks) {
    if (!m.evidence_text) fail(`${rec.id} mark ${m.n}: no evidence line`);
    if (!m.points_at) fail(`${rec.id} mark ${m.n}: no points_at`);
    if (!m.worth_asking) fail(`${rec.id} mark ${m.n}: no worth_asking`);
  }

  const numbering = marks.map((m) => m.n).join(",");
  if (numbering !== marks.map((_, i) => i + 1).join(",")) fail(`${rec.id}: marks are not numbered 1..n in order`);

  const classes = [...new Set(marks.map((m) => m.signal_class).filter(Boolean))];

  /* Z5.6 · the applied checks, derived from the marks this record actually carries.
   *
   * Every row is arithmetic off the same mark list the page renders, so the register
   * cannot claim a check produced findings the record does not show, and cannot quietly
   * drop a check that produced nothing. The mark numbers travel with each row because a
   * check that names its findings can be walked back to the evidence; a check that only
   * names a total cannot.
   *
   * A record whose marks carry no signal class is not a record where the checks found
   * nothing — it is a record those checks do not read. The two states are kept apart
   * here, at the point the outcome is decided, rather than being flattened into a zero. */
  const readsAnAnswer = classes.length > 0;
  const applied_checks = DECLARED_CHECKS.map((chk) => {
    const hits = marks.filter((m) => m.signal_class === chk.label).map((m) => m.n);
    let outcome;
    if (!readsAnAnswer) outcome = CHECK_OUTCOME.NOT_APPLICABLE;
    else outcome = hits.length ? CHECK_OUTCOME.PRODUCED : CHECK_OUTCOME.NO_FINDING;
    const text =
      outcome === CHECK_OUTCOME.PRODUCED
        ? UI.z5.applied_outcome_produced(hits.length, hits.join(", "))
        : outcome === CHECK_OUTCOME.NO_FINDING
          ? UI.z5.applied_outcome_none
          : UI.z5.applied_outcome_not_applicable;
    return {
      key: chk.key,
      label: chk.label,
      detector_id: chk.detector_id,
      detector_version: chk.detector_version,
      condition: chk.condition,
      outcome,
      finding_count: hits.length,
      finding_marks: hits,
      outcome_text: text,
    };
  });

  const ranChecks = applied_checks.filter((c) => c.outcome !== CHECK_OUTCOME.NOT_APPLICABLE);
  const foundChecks = ranChecks.filter((c) => c.outcome === CHECK_OUTCOME.PRODUCED);
  const check_census = {
    declared: applied_checks.length,
    ran: ranChecks.length,
    produced_findings: foundChecks.length,
    not_applicable: applied_checks.length - ranChecks.length,
  };
  const check_census_line = ranChecks.length
    ? UI.z5.applied_census(check_census.ran, check_census.produced_findings)
    : UI.z5.applied_census_none(check_census.declared);

  /* The register's arithmetic has to close against the mark list, or the zone is
   * decoration with numerals in it. Findings attributed across the rows must total the
   * marks that carry a signal class — no more, because a row cannot invent a finding,
   * and no fewer, because a mark whose class no declared check claims would be a mark
   * the register silently drops. */
  const attributed = applied_checks.reduce((s, c) => s + c.finding_count, 0);
  const classed = marks.filter((m) => m.signal_class).length;
  if (attributed !== classed) {
    fail(`${rec.id}: applied checks attribute ${attributed} findings against ${classed} classed marks`);
  }
  if (readsAnAnswer && check_census.not_applicable !== 0) {
    fail(`${rec.id}: a record that carries signal classes cannot report an inapplicable check`);
  }

  return {
    id: rec.id,
    nav_label: rec.nav_label,
    record_class: rec.record_class,
    class_label: RECORD_CLASS_LABEL[rec.record_class],
    fixture: rec.fixture,
    boundary: BOUNDARIES[rec.record_class],
    context: text(rec.context),
    finding_sentence: text(rec.finding_sentence),
    address,
    identifiers,
    /* Z7.3 · the citation, in two halves with the anatomy version left out.
     *
     * This is the second place the anatomy version reaches a reader, and it is baked
     * per record while the version it names is per direction — so emitting the whole
     * sentence here silently restamped the archived pair to v2 and no assertion
     * noticed. The kit joins these with the version resolved from the direction that
     * is actually rendering, exactly as it does for the Z6.3 identity row. Only two
     * fields are emitted rather than a template, because a template is a string that
     * never renders as written, and every string in this fixture should be one a
     * reader could meet. */
    citation_head: `Imbas Review Record · ${rec.run_id}`,
    citation_tail: `read ${rec.read_date}`,
    count: marks.length,
    count_line,
    census_line,
    census_counts,
    prompt_label: rec.prompt_label,
    prompt: text(rec.prompt),
    expectation_artifact: rec.expectation_artifact ?? null,
    source: {
      role: rec.source.role,
      label: rec.source.label,
      blocks: segmentRecord(rec),
    },
    second_artifact: rec.second_artifact
      ? {
          role: rec.second_artifact.role,
          label: rec.second_artifact.label,
          prompt: text(rec.second_artifact.prompt),
        }
      : null,
    capture_shape: rec.capture_shape ?? null,
    marks,
    record_level_marks: marks.filter((m) => !m.in_document).map((m) => m.n),
    in_document_marks: marks.filter((m) => m.in_document).map((m) => m.n),
    signal_classes: classes,
    signal_classes_line: classes.length ? `${UI.z5.classes_note}` : UI.z5.classes_none,
    applied_checks,
    check_census,
    check_census_line,
    check_register_version: CHECK_REGISTER_VERSION,
    register_close: (rec.register_close ?? []).map((r) => ({ label: r.label, text: r.text })),
    provenance: rec.provenance.map((p) => ({
      id: p.id,
      label: text(p.label),
      body: text(p.body),
      pre: p.pre ?? false,
    })),
  };
}

const records = RECORDS.map(buildRecord);

// ─────────────────────────────────────────────────────────────────────────────
// 4. CONNECTIVE COPY INVENTORY — separate from the governed source strings
// ─────────────────────────────────────────────────────────────────────────────

const connective = [];
(function walkUI(node, path) {
  for (const [k, v] of Object.entries(node)) {
    const at = `${path}.${k}`;
    if (typeof v === "string") connective.push({ zone: at, chars: v.length, text: v });
    else if (typeof v === "function") connective.push({ zone: at, chars: null, text: v(2), note: "count line, rendered per record" });
    else if (v && typeof v === "object") walkUI(v, at);
  }
})(UI, "UI");
connective.push({ zone: "BOUNDARIES.GOVERNED_PUBLIC_EXAMPLE", chars: BOUNDARIES[RECORD_CLASS.GOVERNED_PUBLIC_EXAMPLE].length, text: BOUNDARIES[RECORD_CLASS.GOVERNED_PUBLIC_EXAMPLE] });
connective.push({ zone: "BOUNDARIES.USER_SUPPLIED_RUN", chars: BOUNDARIES[RECORD_CLASS.USER_SUPPLIED_RUN].length, text: BOUNDARIES[RECORD_CLASS.USER_SUPPLIED_RUN] });
connective.push({ zone: "BOUNDARIES.PROTOCOL_MEASURED_CASE", chars: BOUNDARIES[RECORD_CLASS.PROTOCOL_MEASURED_CASE].length, text: BOUNDARIES[RECORD_CLASS.PROTOCOL_MEASURED_CASE] });
connective.push({ zone: "BOUNDARIES.ADHERENCE_RECORD", chars: BOUNDARIES[RECORD_CLASS.ADHERENCE_RECORD].length, text: BOUNDARIES[RECORD_CLASS.ADHERENCE_RECORD] });
connective.push({ zone: "RECORD_LEVEL_RULE", chars: RECORD_LEVEL_RULE.length, text: RECORD_LEVEL_RULE });
connective.push({ zone: "FIRST_RUN_LINE", chars: FIRST_RUN_LINE.length, text: FIRST_RUN_LINE });

// ─────────────────────────────────────────────────────────────────────────────
// 5. LINT — the repository's own, imported and run unmodified
// ─────────────────────────────────────────────────────────────────────────────

const lintTarget = {
  connective: connective.map((c) => c.text),
  records,
};

let linted = 0;
(function count(node) {
  if (typeof node === "string") linted++;
  else if (Array.isArray(node)) node.forEach(count);
  else if (node && typeof node === "object") Object.values(node).forEach(count);
})(lintTarget);

const violations = lintUserFacingStrings(lintTarget);
if (violations.length) fail(`lint returned ${violations.length} violation(s)`);

// ─────────────────────────────────────────────────────────────────────────────
// 6. EMIT
// ─────────────────────────────────────────────────────────────────────────────

const ui = JSON.parse(JSON.stringify(UI, (k, v) => (typeof v === "function" ? undefined : v)));

/* Hashed here rather than only at the HASHES.json step below, because the three
 * directions have to carry this value and they read it out of the fixture. ANATOMY.md
 * is an input to this build and derives from nothing the build writes, so hashing it
 * early is the same hash read at the one moment it can still be propagated. The
 * HASHES.json entry re-reads the same file, so the two cannot disagree. */
const anatomySha = fileSha(resolve(LANE, "ANATOMY.md"));
/* The archive is a file, so it is hashed like one. Freezing the v1 digest as a
 * literal here would have been shorter and would have quietly severed the archived
 * renders from any document — the hash would keep matching after the text it names
 * stopped existing. Hashing the snapshot means A and C's stamp is still a claim about
 * something a person can open. */
const anatomyArchivedSha = fileSha(resolve(LANE, "ANATOMY.v1.md"));
if (anatomySha === anatomyArchivedSha) {
  fail("ANATOMY.md and ANATOMY.v1.md are identical — the archive is not a snapshot of a superseded text");
}

const data = {
  anatomy_version: ANATOMY_VERSION,
  anatomy_sha: anatomySha,
  /* Read by kit.js `boot()`, which is the single decision point for which anatomy a
   * direction was built against. */
  anatomy_archived: {
    version: ANATOMY_ARCHIVED_VERSION,
    sha: anatomyArchivedSha,
    directions: ANATOMY_ARCHIVED_DIRECTIONS,
  },
  check_vocab_version: CHECK_VOCAB_VERSION,
  packet_version: PUBLIC_EXAMPLE.version,
  anchor_mode: ANCHOR_MODE,
  anchor_channel: ANCHOR_CHANNEL,
  record_class: RECORD_CLASS,
  record_class_label: RECORD_CLASS_LABEL,
  finding_classes: FINDING_CLASSES,
  anchor_status: ANCHOR_STATUS,
  boundaries: BOUNDARIES,
  first_run_line: FIRST_RUN_LINE,
  record_level_rule: RECORD_LEVEL_RULE,
  ui,
  entry: {
    states: ["empty", "answer", "shared"],
    shared_record: "montana",
    sample_answer:
      "In Montana, it depends on how long you've worked there. Montana is not an at-will state after you finish your probationary period.",
  },
  records,
  record_ids: records.map((r) => r.id),
};

if (failures.length) {
  console.error("BUILD FAILED");
  for (const f of failures) console.error("  · " + f);
  for (const v of violations) console.error(`  · lint ${v.rule} at ${v.path}: ${v.match ?? ""}`);
  process.exit(1);
}

const dataPath = resolve(LANE, "shared/fixture.data.js");
writeFileSync(
  dataPath,
  "// GENERATED by build/generate.mjs. Do not edit. Plain script so it loads from file://.\n" +
    "window.IMBAS_FIXTURE = " +
    JSON.stringify(data, null, 2) +
    ";\n",
  "utf8",
);

writeFileSync(
  resolve(LANE, "shared/connective-copy.json"),
  JSON.stringify(
    {
      note: "Connective UI copy for the record anatomy. Written once, consumed by all three directions, held nowhere else. Governed source strings are inventoried separately in governed-string-inventory.json.",
      anatomy_version: ANATOMY_VERSION,
      count: connective.length,
      lint: { module: `${REPO}/reader-check-vocab.js`, version: CHECK_VOCAB_VERSION, function: "lintUserFacingStrings", modified: false },
      strings: connective,
    },
    null,
    2,
  ) + "\n",
  "utf8",
);

writeFileSync(
  resolve(LANE, "shared/governed-string-inventory.json"),
  JSON.stringify(
    {
      note: "Strings imported live from the repository packet. Every one is proved byte-identical at build time; none is retyped in this lane.",
      source_module: `${REPO}/reader-public-example.js`,
      packet_version: PUBLIC_EXAMPLE.version,
      count: governed.length,
      all_byte_identical: governed.every((g) => g.byte_identical),
      strings: governed,
    },
    null,
    2,
  ) + "\n",
  "utf8",
);

writeFileSync(
  resolve(LANE, "shared/lint-report.json"),
  JSON.stringify(
    {
      lint_module: `${REPO}/reader-check-vocab.js`,
      lint_version: CHECK_VOCAB_VERSION,
      lint_function: "lintUserFacingStrings",
      imported_unmodified: true,
      module_sha256: fileSha(`${REPO}/reader-check-vocab.js`),
      strings_linted: linted,
      violations,
    },
    null,
    2,
  ) + "\n",
  "utf8",
);

// ─────────────────────────────────────────────────────────────────────────────
// 7. TOKENS — extracted from the repository stylesheet, never retyped.
// Fonts are referenced from repository asset files by absolute path. Nothing is
// downloaded, copied or bundled, and no request leaves the filesystem.
// ─────────────────────────────────────────────────────────────────────────────

const siteCss = readFileSync(`${REPO}/styles.css`, "utf8");
const rootStart = siteCss.indexOf(":root {");
const rootEnd = siteCss.indexOf("\n}", rootStart);
if (rootStart === -1 || rootEnd === -1) fail("could not locate :root in the repository stylesheet");
const rootBlock = siteCss.slice(rootStart, rootEnd + 2);
for (const t of ["--bg-base", "--ink-primary", "--ember", "--font-display", "--font-body", "--font-mono"]) {
  if (!rootBlock.includes(t)) fail(`token ${t} missing from the extracted block`);
}

const FONTS = `${REPO}/brand-assets-preview/og-concepts/fonts`;
writeFileSync(
  resolve(LANE, "shared/tokens.css"),
  `/* GENERATED by build/generate.mjs — the :root block extracted verbatim from
   ${REPO}/styles.css.
   The lane holds no second copy of the palette; this file is re-derived on every build.
   Faces are repository asset files, referenced in place. No network request, no bundled copy. */

@font-face { font-family: "Fraunces"; font-style: normal; font-weight: 400 600; font-display: block;
  src: url("file://${FONTS}/Fraunces-Regular.ttf") format("truetype"); }
@font-face { font-family: "Fraunces"; font-style: italic; font-weight: 400 600; font-display: block;
  src: url("file://${FONTS}/Fraunces-Italic.ttf") format("truetype"); }
@font-face { font-family: "Inter"; font-style: normal; font-weight: 400 600; font-display: block;
  src: url("file://${FONTS}/Inter-Regular.ttf") format("truetype"); }
@font-face { font-family: "JetBrains Mono"; font-style: normal; font-weight: 400 600; font-display: block;
  src: url("file://${FONTS}/JetBrainsMono-Regular.ttf") format("truetype"); }

${rootBlock}
`,
  "utf8",
);

const hashes = {
  anatomy_version: ANATOMY_VERSION,
  tokens_extracted_from: `${REPO}/styles.css`,
  generated_from_repo_head: process.env.IMBAS_REPO_HEAD ?? null,
  frozen: {
    "ANATOMY.md": anatomySha,
    "ANATOMY.v1.md": anatomyArchivedSha,
    "shared/fixture.mjs": fileSha(resolve(LANE, "shared/fixture.mjs")),
    "shared/fixture.data.js": fileSha(dataPath),
    "shared/tokens.css": fileSha(resolve(LANE, "shared/tokens.css")),
  },
  repository_inputs: {
    "reader-public-example.js": fileSha(`${REPO}/reader-public-example.js`),
    "reader-result.js": fileSha(`${REPO}/reader-result.js`),
    "reader-check-vocab.js": fileSha(`${REPO}/reader-check-vocab.js`),
    /* Added with Z5.6. The declared checks are joined out of this module's own maps,
     * so it is an input to what the register says ran, not background reading. */
    "reader-checks.js": fileSha(`${REPO}/reader-checks.js`),
    "styles.css": fileSha(`${REPO}/styles.css`),
  },
  records: Object.fromEntries(records.map((r) => [r.id, { marks: r.count, class: r.class_label, sha256: sha256(JSON.stringify(r)) }])),
};
if (failures.length) {
  console.error("BUILD FAILED (tokens)");
  for (const f of failures) console.error("  · " + f);
  process.exit(1);
}

writeFileSync(resolve(LANE, "HASHES.json"), JSON.stringify(hashes, null, 2) + "\n", "utf8");

console.log("BUILD OK");
console.log(`  records            ${records.map((r) => `${r.id}(${r.count})`).join("  ")}`);
console.log(`  governed strings   ${governed.length}, all byte-identical: ${governed.every((g) => g.byte_identical)}`);
console.log(`  connective strings ${connective.length}`);
console.log(`  strings linted     ${linted}   violations: ${violations.length}   (${CHECK_VOCAB_VERSION})`);
console.log(`  fixture.data.js    ${hashes.frozen["shared/fixture.data.js"]}`);
console.log(`  fixture.mjs        ${hashes.frozen["shared/fixture.mjs"]}`);
console.log(`  ANATOMY.md         ${hashes.frozen["ANATOMY.md"]}  (${ANATOMY_VERSION}, direction b)`);
console.log(`  ANATOMY.v1.md      ${hashes.frozen["ANATOMY.v1.md"]}  (${ANATOMY_ARCHIVED_VERSION}, directions ${ANATOMY_ARCHIVED_DIRECTIONS.join(" ")})`);
