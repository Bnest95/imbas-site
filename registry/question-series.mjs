// The question-series registry.
//
// A series is the durable object: the frozen primary prompt, why it is asked,
// which wordings are authorized, and what counts as a material change. It
// outlives any wave's schedule, so slot and capture order are not series
// fields — they move to the wave object (IMBAS-2BD-SCOPE-MEMO section 3).
//
// The registry adopts the bank's family registration verbatim. Nothing here
// reads a capture or compares two answers; the material/immaterial lists are
// stored as the series' preregistered review threshold, and D1 never applies
// them.

import { createHash } from "node:crypto";
import { carryPresentFields, presentKeys } from "./field-custody.mjs";

export const HASH_CONVENTION =
  "SHA-256 over UTF-8 bytes of the exact string, no trailing newline, no normalisation.";

// Adopted from the bank unchanged.
export const SERIES_RECORD_KEYS = Object.freeze([
  "question_group_id",
  "family",
  "class",
  "research_status",
  "prompt_role",
  "prompt",
  "prompt_byte_length",
  "question_sha256",
  "information_need",
  "wording_sensitivity",
  "durable_authority",
  "neutral_comparison_variant",
  "publicly_circulating_variant",
  "pressure",
  "material",
  "immaterial",
  "material_extra",
  "immaterial_extra",
  "notes",
  "protocol_version",
  "frozen_at",
]);

// Normalized out of the series and onto the wave, with the mapping recorded.
export const WAVE_SCHEDULE_KEYS = Object.freeze(["slot", "capture_order"]);

export const SERIES_FIELD_MAPPING = Object.freeze([
  Object.freeze({
    from: "variants + variant_hashes",
    to: "variants[] of { role, prompt, registered_sha256 }",
    reason: "authorized variants carry a role and a hash per variant",
  }),
  Object.freeze({
    from: "slot",
    to: "wave_schedule.slot",
    reason: "a series outlives any wave's schedule",
  }),
  Object.freeze({
    from: "capture_order",
    to: "wave_schedule.capture_order",
    reason: "a series outlives any wave's schedule",
  }),
]);

export function sha256Utf8(text) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

function registerVariants(family) {
  const variants = family.variants ?? {};
  const hashes = family.variant_hashes ?? {};
  return Object.freeze(
    Object.keys(variants).map((role) =>
      Object.freeze({
        role,
        prompt: variants[role],
        ...(Object.hasOwn(hashes, role) ? { registered_sha256: hashes[role] } : {}),
      }),
    ),
  );
}

export function registerQuestionSeries(family) {
  if (typeof family?.question_group_id !== "string" || family.question_group_id.length === 0) {
    throw new TypeError("a question series requires a question_group_id");
  }
  return Object.freeze({
    ...carryPresentFields(family, SERIES_RECORD_KEYS),
    variants: registerVariants(family),
  });
}

export function waveScheduleFromBankEntry(family, wave) {
  return Object.freeze({
    wave,
    question_group_id: family.question_group_id,
    ...carryPresentFields(family, WAVE_SCHEDULE_KEYS),
  });
}

// The acceptance proof: the registry regenerates the bank's frozen hashes from
// the prompts it stores. A mismatch means the registry no longer holds the
// question that was asked.
export function regenerateBankHashes(series) {
  const primary = Object.hasOwn(series, "prompt")
    ? {
        question_sha256: sha256Utf8(series.prompt),
        prompt_byte_length: Buffer.byteLength(series.prompt, "utf8"),
      }
    : {};
  const variant_hashes = {};
  for (const variant of series.variants ?? []) {
    variant_hashes[variant.role] = sha256Utf8(variant.prompt);
  }
  return Object.freeze({ ...primary, variant_hashes: Object.freeze(variant_hashes) });
}

export function verifyBankRegeneration(series) {
  const regenerated = regenerateBankHashes(series);
  const mismatches = [];
  if (
    Object.hasOwn(series, "question_sha256") &&
    regenerated.question_sha256 !== series.question_sha256
  ) {
    mismatches.push({
      field: "question_sha256",
      registered: series.question_sha256,
      regenerated: regenerated.question_sha256,
    });
  }
  if (
    Object.hasOwn(series, "prompt_byte_length") &&
    regenerated.prompt_byte_length !== series.prompt_byte_length
  ) {
    mismatches.push({
      field: "prompt_byte_length",
      registered: series.prompt_byte_length,
      regenerated: regenerated.prompt_byte_length,
    });
  }
  for (const variant of series.variants ?? []) {
    if (!Object.hasOwn(variant, "registered_sha256")) continue;
    const regeneratedHash = regenerated.variant_hashes[variant.role];
    if (regeneratedHash !== variant.registered_sha256) {
      mismatches.push({
        field: `variant_hashes.${variant.role}`,
        registered: variant.registered_sha256,
        regenerated: regeneratedHash,
      });
    }
  }
  return Object.freeze({
    question_group_id: series.question_group_id,
    reproduced: mismatches.length === 0,
    variants_checked: (series.variants ?? []).filter((v) =>
      Object.hasOwn(v, "registered_sha256"),
    ).length,
    mismatches: Object.freeze(mismatches),
  });
}

export function seriesPresentKeys(family) {
  return presentKeys(family, SERIES_RECORD_KEYS);
}
