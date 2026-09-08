// ethos-coverage.test.mjs — runs the ethos coverage checker with the suite.
//
// FOUR PARTS, DIFFERENT JOBS:
//
//   PART A — REGISTERED DOCUMENTS PASS. Every document the checker registers must
//   cover what it claims to describe, today.
//
//   PART B — NEGATIVE CONTROL. A copy of STATE.md with one material surface removed
//   (corrective steering), checked as company-level, must FAIL and must name the
//   missing surface. This proves the checker can see an omission.
//
//   PART C — REGISTRY COMPLETENESS. The concepts whose omission the brief says must
//   fail are actually in the registry, and company-level classification demands all
//   of them. A checker whose registry silently shrank would pass everything.
//
//   PART D — FOUNDER QUOTES VERBATIM. The founder framings supplied for
//   IMBAS-ETHOS.md appear in that file byte-for-byte. Quotes are never paraphrased.

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import {
  SURFACES,
  SPINE_LAWS,
  DOCUMENTS,
  checkText,
  checkDocument,
  requirementsFor,
} from "../scripts/qa/ethos-coverage.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

test("PART A — every registered document covers what it claims to describe", () => {
  for (const doc of DOCUMENTS) {
    const { missing } = checkDocument(doc, ROOT);
    assert.deepEqual(
      missing,
      [],
      `${doc.path} (${doc.class}) is missing: ${missing.map((m) => `${m.kind} ${m.id}`).join(", ")}`
    );
  }
});

test("PART B — negative control: STATE.md minus one surface fails, naming it", () => {
  const fixture = readFileSync(resolve(ROOT, "test/fixtures/ethos-state-missing-surface.md"), "utf8");
  const missing = checkText(fixture, requirementsFor({ class: "company-level" }));
  assert.ok(missing.length > 0, "fixture with a removed surface must fail company-level coverage");
  assert.ok(
    missing.some((m) => m.kind === "surface" && m.id === "corrective_steering"),
    `the failure must name corrective_steering; got: ${JSON.stringify(missing)}`
  );
  const unexpected = missing.filter((m) => m.id !== "corrective_steering");
  assert.deepEqual(unexpected, [], "only the removed surface may be missing from the fixture");
});

test("PART C — registry holds every concept whose omission must fail", () => {
  const requiredSurfaces = [
    "reader",
    "input_integrity",
    "corrective_steering",
    "substrate_record",
    "answer_layer",
    "professions",
    "advisory",
    "public_interest",
  ];
  const requiredLaws = [
    "signal_not_verdict",
    "behavior_not_intent",
    "discovery_not_evidence",
    "properties_not_certification",
    "independence_not_detection",
    "architecture_resonance",
    "claim_within_mechanism",
  ];
  assert.deepEqual(Object.keys(SURFACES).sort(), [...requiredSurfaces].sort());
  assert.deepEqual(Object.keys(SPINE_LAWS).sort(), [...requiredLaws].sort());

  const companyLevel = DOCUMENTS.filter((d) => d.class === "company-level");
  assert.ok(
    companyLevel.some((d) => d.path === "STATE.md"),
    "STATE.md must be classified company-level"
  );
  assert.ok(
    companyLevel.some((d) => d.path === "IMBAS-ETHOS.md"),
    "IMBAS-ETHOS.md must be classified company-level"
  );
  for (const doc of companyLevel) {
    const req = requirementsFor(doc);
    assert.deepEqual(req.surfaces.sort(), [...requiredSurfaces].sort(), `${doc.path} must require all surfaces`);
    assert.deepEqual(req.laws.sort(), [...requiredLaws].sort(), `${doc.path} must require all spine laws`);
  }
});

test("PART D — supplied founder framings appear verbatim in IMBAS-ETHOS.md", () => {
  const ethos = readFileSync(resolve(ROOT, "IMBAS-ETHOS.md"), "utf8");
  const quotes = [
    "Making AI for phronesis.",
    "multi-surface infrastructure (consumer plugin, institutional audit, research reference, regulatory citation) powered by one human-validated archive that doubles as AI training corpus. NOT a research project, NOT a static archive, NOT a single-use tool. Things can be more than one thing.",
    "You win by ruthlessly exposing undeniable drift, facts, manipulation and inconsistency. Accusation lets them play victim and claim conspiracy. Better info is how you win.",
    "easy low hanging fruit value add for people to wrestle an unruly ai",
    "a cool feature that captures ai things not just the basic shit",
    "Human judgment first. AI where it creates real leverage.",
    "Common sense before automation.",
    "AI is changing both sides of the business at once: how customers find you, and how the work gets done once they do.",
    "AI is entering workflows governed by external professional standards; the obligations have not changed.",
    "Imbas measures properties, never certifies systems.",
    "Architecture is real, resonance is hypothesis.",
    "Reader inspections are discovery, not evidence. Nothing enters the Imbas record without protocol capture and a recorded human review.",
  ];
  for (const quote of quotes) {
    assert.ok(ethos.includes(quote), `IMBAS-ETHOS.md must carry verbatim: "${quote}"`);
  }
});
