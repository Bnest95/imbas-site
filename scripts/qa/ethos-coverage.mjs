// Does each governed document still carry the full picture of what Imbas is?
//
//   node scripts/qa/ethos-coverage.mjs
//   node scripts/qa/ethos-coverage.mjs --json
//
// READ-ONLY. It reads documents and reports; it writes nothing.
//
// ── Why this exists ──────────────────────────────────────────────────────────
// IMBAS-ETHOS.md records what Imbas is, in the founder's words: the surfaces the
// company operates and the spine every surface obeys. Documents drift by omission —
// a rewrite drops corrective steering, a positioning pass forgets the answer-layer
// lane — and nothing fails. This checker makes that omission fail, by name.
//
// Coverage is conceptual, not verbatim. Each surface and each spine law carries a
// set of accepted indicators; a document covers the concept if any indicator
// matches. Do not solve a coverage failure by pasting checklist language or
// homogenizing documents — restore the concept in the document's own register.
//
// Classification:
//   company-level    — positioning records of the whole company. Must preserve the
//                      complete surface model and every spine law, by concept.
//   surface-specific — documents that describe one surface. Checked only for what
//                      they claim to describe.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

export const SURFACES = {
  reader: {
    name: "The Reader",
    indicators: [/\breader\b/i],
  },
  input_integrity: {
    name: "Input Integrity",
    indicators: [/input integrity/i, /what the file carries under the page/i],
  },
  corrective_steering: {
    name: "Corrective steering",
    indicators: [/corrective steering/i, /chip lane/i],
  },
  substrate_record: {
    name: "The substrate and the record",
    indicators: [/\bsubstrate\b/i, /record that can make the inspection layer smarter/i],
  },
  answer_layer: {
    name: "The answer-layer lane",
    indicators: [/answer[ -]layer/i, /\bobservatory\b/i],
  },
  professions: {
    name: "Professional use (the professions wedge)",
    indicators: [/profession/i, /external professional standards/i],
  },
  advisory: {
    name: "Advisory and field practice",
    indicators: [/advisor/i, /field practice/i, /common sense before automation/i],
  },
  public_interest: {
    name: "The public record in the public interest",
    indicators: [/public[ -]interest/i, /public record/i, /public good/i],
  },
};

export const SPINE_LAWS = {
  signal_not_verdict: {
    name: "Signal, not verdict",
    indicators: [/signal,? not verdict/i, /reaches no verdict/i],
  },
  behavior_not_intent: {
    name: "Behavior, not intent",
    indicators: [/behavior,? not intent/i, /does not infer model intent/i],
  },
  discovery_not_evidence: {
    name: "Discovery, not evidence",
    indicators: [/discovery,? not evidence/i],
  },
  properties_not_certification: {
    name: "Measures properties, never certifies systems",
    indicators: [/measures properties, never certifies/i, /never certifies/i, /does not certify/i],
  },
  independence_not_detection: {
    name: "Independence, not detection",
    indicators: [/independen/i],
  },
  architecture_resonance: {
    name: "Architecture is real, resonance is hypothesis",
    indicators: [/architecture is real/i, /resonance is hypothesis/i],
  },
  claim_within_mechanism: {
    name: "Every visible claim within the evidentiary strength of its mechanism",
    indicators: [/evidentiary strength/i, /evidence beside every statement/i],
  },
};

// Documents that can never carry a coverage demand, with the reason on record.
export const EXCLUDED = [
  { path: "IMBAS-CANON.md", reason: "LAW class — never edited; a coverage demand on it would be a standing red." },
  { path: "whitepaper.html", reason: "Frozen publication — supersession by later version only, never edited." },
];

export const DOCUMENTS = [
  { path: "IMBAS-ETHOS.md", class: "company-level" },
  { path: "STATE.md", class: "company-level" },
  { path: "advisory.html", class: "surface-specific", surfaces: ["advisory"], laws: ["independence_not_detection"] },
  { path: "independence.html", class: "surface-specific", surfaces: ["advisory", "public_interest"], laws: ["independence_not_detection"] },
  { path: "input-integrity.html", class: "surface-specific", surfaces: ["input_integrity"], laws: ["signal_not_verdict", "claim_within_mechanism"] },
  { path: "institutions.html", class: "surface-specific", surfaces: ["professions"], laws: ["behavior_not_intent", "signal_not_verdict", "properties_not_certification"] },
  { path: "public-interest.html", class: "surface-specific", surfaces: ["public_interest"], laws: [] },
  { path: "how-it-works.html", class: "surface-specific", surfaces: ["reader"], laws: ["discovery_not_evidence"] },
];

export function checkText(text, { surfaces, laws }) {
  const missing = [];
  for (const id of surfaces) {
    if (!SURFACES[id].indicators.some((rx) => rx.test(text))) {
      missing.push({ kind: "surface", id, name: SURFACES[id].name });
    }
  }
  for (const id of laws) {
    if (!SPINE_LAWS[id].indicators.some((rx) => rx.test(text))) {
      missing.push({ kind: "spine law", id, name: SPINE_LAWS[id].name });
    }
  }
  return missing;
}

export function requirementsFor(doc) {
  if (doc.class === "company-level") {
    return { surfaces: Object.keys(SURFACES), laws: Object.keys(SPINE_LAWS) };
  }
  return { surfaces: doc.surfaces, laws: doc.laws };
}

export function checkDocument(doc, root = ROOT) {
  const text = readFileSync(resolve(root, doc.path), "utf8");
  return { path: doc.path, class: doc.class, missing: checkText(text, requirementsFor(doc)) };
}

function main() {
  const json = process.argv.includes("--json");
  const results = DOCUMENTS.map((doc) => checkDocument(doc));
  const failures = results.filter((r) => r.missing.length > 0);

  if (json) {
    console.log(JSON.stringify({ results, excluded: EXCLUDED, pass: failures.length === 0 }, null, 2));
  } else {
    for (const r of results) {
      if (r.missing.length === 0) {
        console.log(`PASS  ${r.path} (${r.class})`);
      } else {
        console.log(`FAIL  ${r.path} (${r.class})`);
        for (const m of r.missing) {
          console.log(`      missing ${m.kind}: ${m.name} [${m.id}]`);
        }
      }
    }
    for (const e of EXCLUDED) {
      console.log(`SKIP  ${e.path} — ${e.reason}`);
    }
    console.log(
      failures.length === 0
        ? `ethos-coverage: ${results.length} documents, all cover what they claim to describe.`
        : `ethos-coverage: ${failures.length} of ${results.length} documents missing named concepts.`
    );
  }
  process.exitCode = failures.length === 0 ? 0 : 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
