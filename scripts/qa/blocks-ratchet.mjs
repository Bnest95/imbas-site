// The governed `blocks_before` ratchet.
//
//   node scripts/qa/blocks-ratchet.mjs           # measure and print
//   node scripts/qa/blocks-ratchet.mjs --json    # emit the artifact shape as JSON
//   node scripts/qa/blocks-ratchet.mjs --check   # measure and hold against the baseline
//   node scripts/qa/blocks-ratchet.mjs --write   # rewrite the baseline artifact
//
// ── What this is, and what it is not ─────────────────────────────────────────
// comprehension.mjs is a MEASUREMENT instrument. It reports seven numbers for eight
// hand-mapped states and sets them beside a frozen floor transcribed out of a scratch
// reference. It is not a ratchet and is not promoted into one here: it keeps its eight
// states, its floor table, its stand-in accounting and its own exit code. This file is
// a separate instrument with its own governed population, its own baseline measured on
// master, and hard-fail semantics.
//
// What the two share is exactly one thing: the definition of a block. `measureExpression`
// is imported from comprehension.mjs rather than transcribed, because two transcriptions
// of a walker are two definitions, and a ratchet that measures a quantity the floor does
// not measure governs nothing.
//
// ── Deriving the rule from frozen doctrine ───────────────────────────────────
// docs/surface/IMBAS-SURFACE-FINISH-COGNITIVE-DOCTRINE-FINAL-RECONCILIATION-CANDIDATE.md
// is the sole normative document (docs/surface/README.md). R2 reads, in full:
//
//   "## R2 — `blocks_before` is a governed ratchet, not a cognitive law
//    No change may increase `blocks_before` for any finding class without a recorded
//    founder ruling. Any numeric ceiling belongs to the instrument/configuration, not
//    to psychology.
//    - Evidence: progressive-disclosure support + existing Imbas measurement.
//    - Enforcement: MEASURABLE-NOW.
//    - Prevents: pre-evidence explanation creep."
//
// Four of the five things this instrument needs are determined by that text.
//
// 1. THE MEASURED TARGET is named by its identifier: `blocks_before`.
//
// 2. WHAT COUNTS AS A BLOCK is fixed by reference. R2's evidence line cites "existing
//    Imbas measurement" and its enforcement line says MEASURABLE-NOW — a rule that is
//    enforceable today against a measurement that exists today. Exactly one committed
//    definition of `blocks_before` exists in this repository: comprehension.mjs's
//    walker. Leaf text blocks, `checkVisibility` rather than client rects, strictly
//    above the boundary, the prompt excluded. That is the definition imported below.
//    Writing a second one would be choosing a definition, which R2 does not authorize.
//
// 3. THE RELATION is stated: "No change may increase". An increase is forbidden; a
//    decrease is not. That is a CEILING — measured <= committed — and it is neither
//    exact equality (which would forbid improvement) nor a floor. The committed value
//    per governed state IS the ceiling; R2's "Any numeric ceiling belongs to the
//    instrument/configuration" is what permits this file to carry the numbers at all.
//
// 4. GOVERNED SCENARIOS AND VIEWPORTS are delegated by the same sentence, to the
//    "instrument/configuration". The choices are made here and recorded in the
//    fingerprint rather than argued from psychology:
//
//    Scenarios: every scenario in the board registry, with no allowlist. A ratchet that
//    governs a hand-picked subset can be evaded by moving explanation into an
//    unregistered state, and Part 4's requirement that the registry cannot silently omit
//    a governed case is only satisfiable if the governed set IS the registry. Scenarios
//    that render neither governed region are recorded by name as ungoverned rather than
//    dropped, so the exclusion is visible in the artifact.
//
//    Viewports: comprehension.mjs's FLOOR_VIEWPORTS (1440x1000 and 390x844, dSF 1), not
//    the board's. One definition of a block deserves one measurement geometry: measured
//    at a different width, this instrument's numbers could not be set beside the only
//    other committed `blocks_before` numbers, and any divergence between them would be
//    unattributable. Device scale factor does not enter the count, and viewport height
//    does not either — the boundary is an absolute page offset. Width is the axis that
//    matters and these are the two committed widths.
//
// 5. "FOR ANY FINDING CLASS" is the one phrase R2 does not resolve into a slicing rule,
//    and it does not need a founder ruling to discharge. `blocks_before` is a per-arrival
//    count: one number for the whole region above the boundary, not a number per finding,
//    so it cannot be sliced by QUOTED/ABSENT/UNRESOLVED without inventing an aggregation
//    R2 does not state. This instrument avoids the choice by taking the strictly stronger
//    condition: no GOVERNED STATE may increase. Every aggregation of per-state values
//    into a per-class value that anyone would write — max, min, mean, sum — is monotone
//    non-decreasing in its inputs, so if no state increases, no class figure increases
//    under any of them. A per-state ceiling therefore implies the per-class ceiling R2
//    asks for, whichever slicing is later chosen, and the reverse does not hold: a
//    per-class maximum can hide an increase in one state behind a decrease in another.
//    The residual case — a class whose figure rises because a NEW scenario carrying it
//    joins the registry — is caught by the coverage fingerprint, which carries the
//    scenario list and the registry's content hash.
//
// ── The coverage fingerprint ─────────────────────────────────────────────────
// Four fields, the same form the census uses: governed target selectors, scenario list,
// viewport list, and the source path-and-content-hash set. Measured values are never
// part of it.
//
// The sources hashed are the ones that define the POPULATION, not the ones being
// measured. scenarios.mjs is the registry and its drive steps are what put each surface
// into the state it is counted in. comprehension.mjs contributes the block definition,
// hashed on the extracted `measureExpression` text rather than the whole file, so that
// editing the FLOOR table or the eight-state mapping — neither of which changes what a
// block is — does not churn this fingerprint.
//
// Product sources are deliberately absent. Hashing workbench-app.jsx here would make
// every product change a fingerprint change, and a ratchet whose baseline is invalid on
// exactly the commits it exists to govern governs nothing.
//
// ── The historical numbers ───────────────────────────────────────────────────
// Figures circulated for deposit-fixture, single-findings, export-single and share-single
// came from an instrument that was never committed and cannot be run. They are not
// treated as authoritative here and nothing below is fitted to them. The baseline is what
// master measured. See `notes.superseded_historical_figures` in the artifact.

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { SCENARIOS, resolvePayloads } from "./scenarios.mjs";
import { FLOOR_VIEWPORTS, measureExpression } from "./comprehension.mjs";
import {
  CDP,
  buildStubScript,
  evaluate,
  installInterception,
  launchBrowser,
  resolveBrowser,
  resolveNavigation,
  resolveReadiness,
  runSteps,
  settle,
  startStaticServer,
  waitUntil,
} from "./visual-acceptance.mjs";

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const BASELINE_PATH = "docs/qa/surface-measurements/blocks-ratchet.json";

const log = (s = "") => process.stdout.write(`${s}\n`);
const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");

// ── The two compositions ─────────────────────────────────────────────────────
// Only three of comprehension.mjs's selector fields reach `blocks_before`: the region,
// the prompt that sets the boundary, and the source whose first character is the
// fallback boundary where no prompt renders. The other fields resolve to null and the
// walker is unaffected by them, so they are omitted rather than restated wrongly.
//
// RUNNER is the /reader result. SHARE is the published record on /inspection. The share
// compositions P4 and legacy differ in what they carry, but not here: both render the
// question at `.insp-context__block`, so the prompt boundary governs on both and the
// source fallback never fires. `source` is still named for legacy, and which boundary
// actually fired is recorded per state rather than assumed.
export const COMPOSITIONS = [
  { name: "runner", region: ".wb-reader-v2__result", prompt: null, source: ".wb-source__body" },
  { name: "share", region: "#insp-record-root", prompt: ".insp-context__block", source: ".insp-context__text--answer" },
];

export const TARGET_SELECTORS = COMPOSITIONS.map((c) => c.region);

// Composition is detected in the page, not assigned from a table. A table is a second
// registry that can fall out of step with the first; asking the document which region it
// rendered cannot.
export const DETECT_EXPRESSION = `(() => {
  const order = ${JSON.stringify(COMPOSITIONS.map((c) => c.region))};
  for (const sel of order) if (document.querySelector(sel)) return sel;
  return null;
})()`;

export function governedScenarios() {
  return Object.keys(SCENARIOS).sort();
}

export function governedViewports() {
  return Object.keys(FLOOR_VIEWPORTS)
    .map(Number)
    .sort((a, b) => a - b);
}

// ── Population sources ───────────────────────────────────────────────────────
export function populationSources(root = REPO_ROOT) {
  const registryPath = "scripts/qa/scenarios.mjs";
  const registry = fs.readFileSync(path.join(root, registryPath), "utf8");
  return [
    { path: registryPath, extraction: "whole file", sha256: sha256(registry).slice(0, 16) },
    {
      path: "scripts/qa/comprehension.mjs",
      extraction: "measureExpression source text",
      sha256: sha256(measureExpression.toString()).slice(0, 16),
    },
  ];
}

export function coverageFingerprint({ targets = TARGET_SELECTORS, scenarios, viewports, sources }) {
  const fields = {
    target_selectors: [...targets].sort(),
    scenarios: [...scenarios].sort(),
    viewports: [...viewports].sort((a, b) => a - b),
    sources: sources
      .map((s) => ({ path: s.path, sha256: s.sha256 }))
      .sort((a, b) => a.path.localeCompare(b.path)),
  };
  return { ...fields, sha256: sha256(JSON.stringify(fields)) };
}

function headSha() {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

// ── Run ──────────────────────────────────────────────────────────────────────
export async function measure({ scenarios = governedScenarios(), viewports = governedViewports() } = {}) {
  const renderer = resolveBrowser();
  const { server, port } = await startStaticServer(REPO_ROOT);
  const origin = `http://127.0.0.1:${port}`;
  const { proc, userDataDir, port: cdpPort } = await launchBrowser(renderer.binary);
  const versionInfo = await (await fetch(`http://127.0.0.1:${cdpPort}/json/version`)).json();
  const browserVersion = versionInfo.Browser || "unknown";
  if (browserVersion !== `HeadlessChrome/${renderer.browserVersion}`) {
    proc.kill("SIGKILL");
    server.close();
    throw new Error(`Renderer identifies as "${browserVersion}", not the governed HeadlessChrome/${renderer.browserVersion}.`);
  }
  const targets = await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json();
  const target = targets.find((t) => t.type === "page");
  const cdp = await CDP.connect(target.webSocketDebuggerUrl);

  const states = [];
  const blocked = [];
  try {
    await installInterception(cdp, blocked);

    for (const name of scenarios) {
      const scenario = SCENARIOS[name];
      if (!scenario) throw new Error(`Unknown scenario "${name}"`);
      for (const view of viewports) {
        const vp = FLOOR_VIEWPORTS[view];
        if (!vp) throw new Error(`Unknown viewport "${view}"`);

        await cdp.send("Page.removeScriptToEvaluateOnNewDocument", { identifier: "1" }).catch(() => {});
        const { identifier } = await cdp.send("Page.addScriptToEvaluateOnNewDocument", {
          source: buildStubScript(resolvePayloads(scenario)),
        });

        await cdp.send("Emulation.setDeviceMetricsOverride", {
          width: vp.width,
          height: vp.height,
          deviceScaleFactor: vp.dsf,
          mobile: vp.mobile,
        });
        await cdp.send("Emulation.setLocaleOverride", { locale: "en-US" }).catch(() => {});
        await cdp.send("Emulation.setTimezoneOverride", { timezoneId: "UTC" }).catch(() => {});
        await cdp
          .send("Emulation.setEmulatedMedia", {
            features: [
              { name: "prefers-color-scheme", value: "light" },
              { name: "prefers-reduced-motion", value: "reduce" },
            ],
          })
          .catch(() => {});

        const nav = resolveNavigation(scenario);
        await cdp.send("Page.navigate", { url: `${origin}${nav.path}` });
        await waitUntil(cdp, "document.readyState === 'complete'", { label: "document ready" });
        const ready = resolveReadiness(nav.page);
        await waitUntil(cdp, `__qa.mounted(${JSON.stringify(ready.rendered)})`, { label: `rendered ${nav.page}` });
        await runSteps(cdp, scenario.steps);
        await settle(cdp);

        const region = await evaluate(cdp, DETECT_EXPRESSION);
        const comp = COMPOSITIONS.find((c) => c.region === region) || null;
        if (!comp) {
          states.push({ scenario: name, view, composition: null, region: null, blocks_before: null });
        } else {
          const m = await evaluate(cdp, measureExpression(comp, vp.height));
          if (m && m.error) throw new Error(`${name} @ ${view}: ${m.error}`);
          states.push({
            scenario: name,
            view,
            composition: comp.name,
            region: comp.region,
            // Which of the two boundaries actually fired. `prompt` means the question
            // rendered inside the region and bounded the count; `answer` means it did
            // not and the walker's own fallback took the first character of the source.
            boundary: comp.prompt ? "prompt" : "answer",
            blocks_before: m.blocks_before,
            blocks_above_region: m.blocks_above_region,
            blocks: m.blocks.map((b) => ({ cls: String(b.cls || ""), text: b.text })),
          });
        }
        log(`  measured ${name.padEnd(26)} @ ${String(view).padEnd(5)} ${region ? `${comp.name} ${states[states.length - 1].blocks_before}` : "no governed region"}`);

        await cdp.send("Page.removeScriptToEvaluateOnNewDocument", { identifier });
      }
    }
  } finally {
    cdp.close();
    proc.kill("SIGKILL");
    server.close();
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch {
      /* best effort */
    }
  }
  if (blocked.length) log(`\n  (blocked ${blocked.length} off-allowlist request(s))`);
  return { states, browserVersion, scenarios, viewports };
}

export const RATCHET_NOTES = {
  rule: "R2 — no change may increase blocks_before for any finding class without a recorded founder ruling.",
  relation:
    "CEILING. A governed state passes when measured blocks_before <= the committed value. " +
    "A decrease passes and does not rewrite the ceiling automatically; --write does that, and " +
    "refuses when a state common to both baselines has increased.",
  block_definition:
    "scripts/qa/comprehension.mjs measureExpression — imported, not transcribed. Leaf text " +
    "blocks inside the region, checkVisibility-gated, strictly above the boundary, prompt excluded.",
  finding_class_quantifier:
    "R2 says 'for any finding class'. blocks_before is a per-arrival count and cannot be sliced " +
    "by finding class without inventing an aggregation R2 does not state. This instrument holds " +
    "every governed STATE, which is strictly stronger: every monotone aggregation of per-state " +
    "values into a per-class figure is bounded by the per-state ceilings, so no per-class figure " +
    "can rise while every state holds. No founder ruling is required to discharge the phrase.",
  viewports:
    "comprehension.mjs FLOOR_VIEWPORTS (1440x1000, 390x844, dSF 1), not the board's. One block " +
    "definition, one measurement geometry, so the two instruments' numbers can be set beside each " +
    "other. Device scale factor and viewport height do not enter the count.",
  fingerprint_sources:
    "The population's sources, not the measured product's. scenarios.mjs is the registry and its " +
    "drive steps; comprehension.mjs contributes the block definition, hashed on the extracted " +
    "measureExpression text so unrelated edits to that file do not churn this fingerprint. Product " +
    "sources are excluded on purpose: a baseline invalidated by every product change would be " +
    "invalid on exactly the commits this instrument exists to govern.",
  superseded_historical_figures:
    "Figures circulated before this instrument existed — deposit-fixture 7/13/22, single-findings " +
    "10/14, export-single 10/14, share-single 7/10 — were produced by an uncommitted instrument " +
    "that cannot be run and whose population, viewports and block definition are unknown. They are " +
    "NOT authoritative, were not used to calibrate anything here, and are superseded by the " +
    "measured baseline in this artifact. They are recorded so that a future reader meeting them in " +
    "an older document knows they were retired rather than lost.",
  ungoverned_scenarios:
    "A registered scenario that renders neither governed region is listed by name under " +
    "ungoverned_scenarios rather than dropped. The scenario list in the fingerprint is the WHOLE " +
    "registry, so a scenario cannot leave the governed population without changing the fingerprint.",
};

export function buildArtifact({ states, browserVersion, scenarios, viewports }) {
  const governed = states
    .filter((s) => s.composition)
    .map((s) => ({
      scenario: s.scenario,
      view: s.view,
      composition: s.composition,
      region: s.region,
      boundary: s.boundary,
      blocks_before: s.blocks_before,
      blocks_above_region: s.blocks_above_region,
      block_classes: s.blocks.map((b) => b.cls),
    }))
    .sort((a, b) => a.scenario.localeCompare(b.scenario) || a.view - b.view);

  const ungoverned = [...new Set(states.filter((s) => !s.composition).map((s) => s.scenario))].sort();
  const sources = populationSources();

  return {
    instrument: "scripts/qa/blocks-ratchet.mjs",
    rule: "R2",
    doctrine:
      "docs/surface/IMBAS-SURFACE-FINISH-COGNITIVE-DOCTRINE-FINAL-RECONCILIATION-CANDIDATE.md",
    measured_at_master: headSha(),
    browser: browserVersion,
    coverage_fingerprint: coverageFingerprint({ scenarios, viewports, sources }),
    sources,
    counts: {
      governed_states: governed.length,
      governed_scenarios: new Set(governed.map((g) => g.scenario)).size,
      ungoverned_scenarios: ungoverned.length,
      max_blocks_before: governed.length ? Math.max(...governed.map((g) => g.blocks_before)) : null,
    },
    ceilings: governed,
    ungoverned_scenarios: ungoverned,
    notes: RATCHET_NOTES,
  };
}

// ── Holding the ceiling ──────────────────────────────────────────────────────
// Two distinct failures, because they mean different things. A fingerprint mismatch says
// the governed population moved and the numbers below are not comparable; a violation
// says the population held and a state got worse.
export function hold(artifact, base) {
  const failures = [];
  if (base.coverage_fingerprint.sha256 !== artifact.coverage_fingerprint.sha256) {
    failures.push({
      kind: "population",
      message:
        `coverage fingerprint ${base.coverage_fingerprint.sha256.slice(0, 12)} → ` +
        `${artifact.coverage_fingerprint.sha256.slice(0, 12)}. The governed population moved; ` +
        "the ceilings below are not comparable until it is re-accepted.",
    });
  }
  const key = (g) => `${g.scenario} @ ${g.view}`;
  const was = new Map(base.ceilings.map((g) => [key(g), g]));
  const now = new Map(artifact.ceilings.map((g) => [key(g), g]));
  for (const [k, g] of now) {
    const b = was.get(k);
    if (!b) {
      failures.push({ kind: "population", message: `governed state not in the baseline: ${k}` });
      continue;
    }
    if (g.blocks_before > b.blocks_before) {
      failures.push({
        kind: "violation",
        message: `${k}: blocks_before ${b.blocks_before} → ${g.blocks_before}. R2 forbids an increase without a recorded founder ruling.`,
      });
    }
  }
  for (const k of was.keys()) {
    if (!now.has(k)) failures.push({ kind: "population", message: `baseline state no longer governed: ${k}` });
  }
  return failures;
}

function report(a) {
  log("\n── blocks_before, every registered scenario at both floor viewports ──\n");
  log(`  rule                  R2 · ceiling (measured <= committed)`);
  log(`  block definition      comprehension.mjs measureExpression (imported)`);
  log(`  fingerprint           ${a.coverage_fingerprint.sha256}`);
  log(`  governed states       ${a.counts.governed_states} (${a.counts.governed_scenarios} scenarios × ${a.coverage_fingerprint.viewports.length} viewports)`);
  log(`  highest blocks_before ${a.counts.max_blocks_before}\n`);
  const rows = [["scenario", "view", "composition", "boundary", "blocks_before", "above region"]];
  for (const g of a.ceilings) {
    rows.push([g.scenario, String(g.view), g.composition, g.boundary, String(g.blocks_before), String(g.blocks_above_region)]);
  }
  const w = rows[0].map((_, i) => Math.max(...rows.map((r) => r[i].length)));
  for (const r of rows) log(`  ${r.map((c, i) => (i < 4 ? c.padEnd(w[i]) : c.padStart(w[i]))).join("  ")}`);
  if (a.ungoverned_scenarios.length) {
    log(`\n  ungoverned — no governed region rendered (${a.ungoverned_scenarios.length}):`);
    log(`    ${a.ungoverned_scenarios.join(", ")}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const out = await measure();
  const artifact = buildArtifact(out);
  const target = path.join(REPO_ROOT, BASELINE_PATH);

  if (args.includes("--json")) {
    log(JSON.stringify(artifact, null, 2));
    return 0;
  }
  report(artifact);

  if (args.includes("--write")) {
    // A population change is the one moment a ratchet can be laundered: the fingerprint
    // no longer matches, --write looks like the obvious repair, and an increase rides in
    // under it. Any state present in both baselines must still hold.
    if (fs.existsSync(target)) {
      const base = JSON.parse(fs.readFileSync(target, "utf8"));
      const violations = hold(artifact, base).filter((f) => f.kind === "violation");
      if (violations.length) {
        log("\n  ✗ refusing to write: a governed state carried over from the committed baseline increased.");
        for (const v of violations) log(`      ${v.message}`);
        return 1;
      }
    }
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, `${JSON.stringify(artifact, null, 2)}\n`);
    log(`\n  wrote ${BASELINE_PATH}`);
    return 0;
  }

  if (args.includes("--check")) {
    if (!fs.existsSync(target)) {
      log(`\n  ✗ no baseline at ${BASELINE_PATH}`);
      return 1;
    }
    const failures = hold(artifact, JSON.parse(fs.readFileSync(target, "utf8")));
    if (failures.length) {
      const violations = failures.filter((f) => f.kind === "violation");
      const population = failures.filter((f) => f.kind === "population");
      if (violations.length) {
        log(`\n  ✗ R2 ceiling violated by ${violations.length} governed state(s):`);
        for (const f of violations) log(`      ${f.message}`);
      }
      if (population.length) {
        log(`\n  ✗ the governed population moved:`);
        for (const f of population) log(`      ${f.message}`);
      }
      return 1;
    }
    log("\n  ✓ every governed state holds at or below its committed ceiling.");
    return 0;
  }
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  main().then(
    (c) => process.exit(c),
    (e) => {
      log(`\n  ✗ ${e.stack || e.message}`);
      process.exit(1);
    },
  );
}
