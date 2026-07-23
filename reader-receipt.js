// reader-receipt.js — shared, pure-JS receipt envelope + canonicalization.
//
// A Reader run is downloadable as a self-contained, timestamped record: the
// pasted answer, the inspection, the candidate measurement with quoted anchors,
// the unvalidated estimate, provenance, and an integrity block whose content_hash
// is a SHA-256 over the canonical JSON serialization. Two formats, one envelope:
// Copy JSON (the envelope verbatim) and a human-readable .txt receipt.
//
// This module is imported by BOTH runtimes:
//   - the server (api/read.js, Node) builds the envelope and computes content_hash
//     with node:crypto, then returns the finished envelope on the response;
//   - the client (workbench-app.jsx, browser, bundled by esbuild) uses it only to
//     render the panel/label and to format the downloadable receipt — it never
//     recomputes the hash, it displays the server's.
// Therefore this file MUST stay pure JS: no node: imports, no crypto, no DOM. The
// hash primitive lives with each caller; the canonicalization rules live here so
// both sides agree byte-for-byte.

// Envelope schema id. Bump on any change to the envelope shape (design §9); old
// hashes stay reproducible because canonicalization_version is recorded too.
export const RECEIPT_SCHEMA_VERSION = "reader-receipt-1.0";
// Canonicalization rules id. Bump only if the rules below change, so a hash
// recorded under the old rules can still be reproduced.
export const CANONICALIZATION_VERSION = "1.0";
export const RECEIPT_HASH_ALGORITHM = "sha256";

// The boundary line, verbatim. One sentence, three surfaces (panel, whitepaper §7,
// construct paper §5), zero drift. It travels inside the artifact because receipts
// travel.
export const RECEIPT_BOUNDARY =
  "Reader inspections are discovery, not evidence. Nothing enters the Imbas record without protocol capture and a recorded human review.";

// The unvalidated estimate label. Never softened, abbreviated, or moved below the
// fold (design §11). N is the 0-3 candidate gap estimate.
export function gapEstimateLabel(n) {
  return `Candidate gap estimate: ${n} of 3 (unvalidated)`;
}

// The paired-mode estimate label (Reader v2 P2). Distinct wording from the single
// label because the paired estimate is a measured open-to-targeted delta, not a
// candidate potential — but it is STILL unvalidated (a machine estimate over one
// answer pair, never a human-scored result). "Machine gap estimate" appears here
// and only here, exactly as the single label appears only in single mode.
export function pairedGapEstimateLabel(n) {
  return `Machine gap estimate: ${n} of 3 (unvalidated)`;
}

// ── Canonicalization ──────────────────────────────────────────────────────────
// Deterministic serialization so the same logical envelope always hashes the same:
//   1. object keys sorted (recursively); arrays keep their order;
//   2. string values line-ending-normalized (CRLF / lone CR -> LF);
//   3. compact JSON (no incidental whitespace).
// The content_hash is computed OVER the envelope with integrity.content_hash set to
// null, so the stored hash never depends on itself (documented + tested).
function normalizeLineEndings(s) {
  return s.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function canonicalValue(v) {
  if (typeof v === "string") return normalizeLineEndings(v);
  if (Array.isArray(v)) return v.map(canonicalValue);
  if (v && typeof v === "object") {
    const out = {};
    for (const k of Object.keys(v).sort()) out[k] = canonicalValue(v[k]);
    return out;
  }
  return v; // number | boolean | null | undefined
}

// The exact string the content_hash is taken over. Always nulls
// integrity.content_hash first, so verifying a received envelope reproduces the
// stored hash regardless of whether the hash is present.
export function canonicalizeForHash(envelope) {
  const copy = canonicalValue(envelope);
  if (copy && typeof copy === "object" && copy.integrity && typeof copy.integrity === "object") {
    copy.integrity.content_hash = null;
  }
  return JSON.stringify(copy);
}

// ── Envelope assembly (single mode) ───────────────────────────────────────────
// Pure structure — no hashing here. The caller computes content_hash from
// canonicalizeForHash(envelope) and assigns it to integrity.content_hash. Every
// field is denormalized so the artifact resolves nothing against Imbas infra.
export function buildSingleReceipt({
  generatedAt,
  question,
  topic,
  declaredModel,
  answer,
  inspection,
  measurement,
  provenance,
}) {
  const insp = inspection || {};
  const measurementBlock = measurement
    ? {
        findings: (measurement.findings || []).map((f) => ({
          type: f.type,
          anchor: f.anchor || "",
          materiality: f.materiality || "",
        })),
        finding_counts: measurement.finding_counts || {},
        gap_estimate: measurement.gap_estimate,
        gap_estimate_label: gapEstimateLabel(measurement.gap_estimate),
        estimate_rationale: measurement.estimate_rationale || "",
        estimate_type: measurement.estimate_type,
        estimate_scale_version: measurement.estimate_scale_version,
        candidate_method_version: measurement.candidate_method_version,
        unvalidated: true,
      }
    : null;

  return {
    receipt_type: "single",
    schema_version: RECEIPT_SCHEMA_VERSION,
    generated_at: generatedAt,
    open_run: {
      question: question || "",
      topic: topic || "",
      declared_model: declaredModel || "",
      answer: answer || "",
      inspection: {
        completeness: insp.completeness || "",
        the_read: insp.the_read || "",
        what_was_left_out: Array.isArray(insp.what_was_left_out) ? insp.what_was_left_out : [],
        how_it_was_shaped: insp.how_it_was_shaped || "",
        inspection_note: insp.inspection_note || "",
      },
      measurement: measurementBlock,
      provenance: {
        reader_model_version: (provenance && provenance.reader_model_version) || "",
        inspector_prompt_version: (provenance && provenance.inspector_prompt_version) || "",
        inspector_run_conditions: (provenance && provenance.inspector_run_conditions) || null,
        source_content_hash: (provenance && provenance.source_content_hash) || "",
        reader_output_hash: (provenance && provenance.reader_output_hash) || "",
        run_timestamp: (provenance && provenance.run_timestamp) || generatedAt,
        request_id: (provenance && provenance.request_id) || "",
      },
    },
    paired_analysis: null,
    boundary: RECEIPT_BOUNDARY,
    integrity: {
      algorithm: RECEIPT_HASH_ALGORITHM,
      canonicalization_version: CANONICALIZATION_VERSION,
      content_hash: null,
    },
  };
}

// ── Envelope assembly (paired mode, Reader v2 P2) ─────────────────────────────
// The paired receipt is the SAME envelope with receipt_type "paired": the full
// open-run record is embedded verbatim (openRun, passed whole from the open
// receipt) so the artifact travels whole with nothing to resolve against Imbas
// infrastructure, and paired_analysis is populated instead of null. The caller
// computes content_hash from canonicalizeForHash(envelope) exactly as in single
// mode — the hash rule and canonicalization_version are identical.
//
// delta_items is the structured itemized delta: each entry names one thing the
// targeted answer surfaced that the open one did not, quotes both sides where a
// span applies, and carries the machine's signal-pattern classification for that
// delta (Omission / Framing Drift / Deflection). The paired gap_estimate (0-3,
// estimate_type "paired_gap") is a machine estimate over this one pair — labelled
// unvalidated, never a human-scored result.
export function buildPairedReceipt({ generatedAt, openRun, pairedAnalysis }) {
  const pa = pairedAnalysis || {};
  const deltaItems = Array.isArray(pa.delta_items)
    ? pa.delta_items.map((d) => ({
        point: (d && d.point) || "",
        open_side: (d && d.open_side) || "",
        targeted_side: (d && d.targeted_side) || "",
        signal_pattern: (d && d.signal_pattern) || "",
      }))
    : [];
  return {
    receipt_type: "paired",
    schema_version: RECEIPT_SCHEMA_VERSION,
    generated_at: generatedAt,
    open_run: openRun || null,
    paired_analysis: {
      open_run_id: pa.open_run_id || "",
      targeted_prompt: pa.targeted_prompt || "",
      targeted_prompt_hash: pa.targeted_prompt_hash || "",
      targeted_answer: pa.targeted_answer || "",
      targeted_answer_hash: pa.targeted_answer_hash || "",
      delta_items: deltaItems,
      gap_estimate: pa.gap_estimate,
      gap_estimate_label: pairedGapEstimateLabel(pa.gap_estimate),
      estimate_rationale: pa.estimate_rationale || "",
      estimate_type: pa.estimate_type || "paired_gap",
      rubric_version: pa.rubric_version || "",
      paired_method_version: pa.paired_method_version || "",
      unvalidated: true,
    },
    boundary: RECEIPT_BOUNDARY,
    integrity: {
      algorithm: RECEIPT_HASH_ALGORITHM,
      canonicalization_version: CANONICALIZATION_VERSION,
      content_hash: null,
    },
  };
}

// ── Envelope assembly (user-chip paired mode) ─────────────────────────────────
// The SAME "paired" envelope, built for a USER-DIRECTED follow-up instead of an
// inspection-generated probe. It is descriptive, not measured: paired_analysis
// carries the delta items (what visibly changed between the two answers) but NO
// gap estimate, NO estimate rationale, and NO signal-pattern classification — a
// chip pair asserts no inspection finding. Its provenance fields (initiator,
// chip_id, instruction_version) mark it as a user_chip run per the review-graph
// schema (v0.3.1), and it carries the human-facing chip_label — the approved label
// the person actually tapped — so the receipt names the follow-up in plain words,
// not by id alone (the id and version stay as explicit provenance beside it). The
// initiator literal "user_chip" is inlined rather than
// imported so this module stays a pure leaf (it imports nothing), exactly as the
// receipt_type "single"/"paired" literals are; the value is schema-frozen.
//
// The suggested loop state is deliberately NOT stored here. It depends on the
// person's paste-back conditions (a client-side capture the server never sees) and
// this artifact is hashed, so the state is derived at render — never frozen into a
// receipt where it could contradict the conditions actually disclosed. The caller
// computes content_hash from canonicalizeForHash(envelope) exactly as in
// single/paired mode; canonicalization_version is identical.
export function buildChipPairedReceipt({ generatedAt, openRun, chipAnalysis }) {
  const ca = chipAnalysis || {};
  const deltaItems = Array.isArray(ca.delta_items)
    ? ca.delta_items.map((d) => ({
        point: (d && d.point) || "",
        open_side: (d && d.open_side) || "",
        targeted_side: (d && d.targeted_side) || "",
      }))
    : [];
  return {
    receipt_type: "paired",
    schema_version: RECEIPT_SCHEMA_VERSION,
    generated_at: generatedAt,
    open_run: openRun || null,
    paired_analysis: {
      initiator: "user_chip",
      chip_id: ca.chip_id || "",
      chip_label: ca.chip_label || "",
      instruction_version: ca.instruction_version || "",
      open_run_id: ca.open_run_id || "",
      targeted_prompt: ca.targeted_prompt || "",
      targeted_prompt_hash: ca.targeted_prompt_hash || "",
      targeted_answer: ca.targeted_answer || "",
      targeted_answer_hash: ca.targeted_answer_hash || "",
      delta_items: deltaItems,
      paired_method_version: ca.paired_method_version || "",
      unvalidated: true,
    },
    boundary: RECEIPT_BOUNDARY,
    integrity: {
      algorithm: RECEIPT_HASH_ALGORITHM,
      canonicalization_version: CANONICALIZATION_VERSION,
      content_hash: null,
    },
  };
}

// ── Human-readable receipt (.txt) ─────────────────────────────────────────────
// Plain text so it is universally readable and self-contained. Carries the
// boundary line AND the unvalidated label inside the artifact, not just the UI.
const COMPLETENESS_UPPER = { full: "FULL", partial: "PARTIAL", thin: "THIN" };

// The open-run body: the answer inspected, the read, the candidate measurement,
// and the run provenance. Shared by BOTH text receipts so the embedded open run
// renders identically whether it stands alone (single) or is wrapped by a paired
// receipt. Returns an array of lines (no leading/trailing blank) the caller folds
// between its own header and integrity footer.
function openRunBodyLines(run) {
  const r = run || {};
  const insp = r.inspection || {};
  const m = r.measurement;
  const prov = r.provenance || {};
  const L = [];
  L.push("—— THE ANSWER INSPECTED ——");
  L.push(`Question: ${(r.question || "").trim()}`);
  if ((r.topic || "").trim()) L.push(`Topic / context: ${r.topic.trim()}`);
  if ((r.declared_model || "").trim()) L.push(`AI used: ${r.declared_model.trim()}`);
  L.push("");
  L.push("Answer:");
  L.push((r.answer || "").trim());
  L.push("");
  L.push("—— THE READ ——");
  L.push(`Completeness: ${COMPLETENESS_UPPER[insp.completeness] || (insp.completeness || "").toUpperCase()}`);
  L.push((insp.the_read || "").trim());
  L.push("");
  L.push("What was left out:");
  const left = Array.isArray(insp.what_was_left_out) ? insp.what_was_left_out.filter(Boolean) : [];
  if (left.length) for (const item of left) L.push(`- ${item}`);
  else L.push("- (none identified)");
  L.push("");
  L.push(`How it was shaped: ${(insp.how_it_was_shaped || "").trim() || "(none detected)"}`);
  if ((insp.inspection_note || "").trim()) L.push(`Inspection note: ${insp.inspection_note.trim()}`);
  L.push("");
  L.push("—— MEASUREMENT (candidate observations, unvalidated) ——");
  if (m) {
    L.push(gapEstimateLabel(m.gap_estimate));
    if ((m.estimate_rationale || "").trim()) L.push(`Rationale: ${m.estimate_rationale.trim()}`);
    const c = m.finding_counts || {};
    L.push(
      "Findings by type: " +
        `candidate missing item: ${c["candidate missing item"] || 0} · ` +
        `candidate framing issue: ${c["candidate framing issue"] || 0} · ` +
        `candidate deflection: ${c["candidate deflection"] || 0}`,
    );
    const findings = Array.isArray(m.findings) ? m.findings : [];
    if (findings.length) {
      L.push("");
      findings.forEach((f, i) => {
        L.push(`${i + 1}. [${f.type}] ${(f.materiality || "").trim()}`);
        if ((f.anchor || "").trim()) L.push(`   anchor: "${f.anchor.trim()}"`);
      });
    }
    L.push("");
    L.push("These are inspection hypotheses about a single answer, not validated classifications or evidence.");
  } else {
    L.push("No measurement layer was produced for this run.");
  }
  L.push("");
  L.push("—— PROVENANCE ——");
  L.push(`Reader model: ${prov.reader_model_version || ""}`);
  L.push(`Inspector prompt version: ${prov.inspector_prompt_version || ""}`);
  if (prov.inspector_run_conditions) {
    L.push(`Inspector run conditions: ${JSON.stringify(prov.inspector_run_conditions)}`);
  }
  L.push(`Source content hash: ${prov.source_content_hash || ""}`);
  L.push(`Reader output hash: ${prov.reader_output_hash || ""}`);
  L.push(`Run timestamp: ${prov.run_timestamp || ""}`);
  if (prov.request_id) L.push(`Request ID: ${prov.request_id}`);
  return L;
}

function integrityLines(integ) {
  const i = integ || {};
  return [
    "—— INTEGRITY ——",
    `Algorithm: ${i.algorithm || RECEIPT_HASH_ALGORITHM}`,
    `Canonicalization version: ${i.canonicalization_version || CANONICALIZATION_VERSION}`,
    `Content hash: ${i.content_hash || ""}`,
  ];
}

export function formatReceiptText(envelope) {
  const e = envelope || {};
  const run = e.open_run || {};
  const L = [];
  L.push("IMBAS READER — INSPECTION RECEIPT");
  L.push(`Generated: ${e.generated_at || ""}`);
  L.push(`Schema: ${e.schema_version || ""}`);
  L.push("");
  L.push(RECEIPT_BOUNDARY);
  L.push("");
  for (const line of openRunBodyLines(run)) L.push(line);
  L.push("");
  for (const line of integrityLines(e.integrity)) L.push(line);
  L.push("");
  L.push(RECEIPT_BOUNDARY);
  return L.join("\n");
}

// Human-readable paired receipt (.txt). Same header/boundary/integrity frame as
// the single receipt; the embedded open run renders via the shared body helper so
// the first-answer record reads identically, and the paired delta section is added
// beneath it. The estimate carries the "Machine gap estimate: N of 3 (unvalidated)"
// label — the paired label, which appears only in paired mode.
export function formatPairedReceiptText(envelope) {
  const e = envelope || {};
  const run = e.open_run || {};
  const pa = e.paired_analysis || {};
  const L = [];
  L.push("IMBAS READER — PAIRED INSPECTION RECEIPT");
  L.push(`Generated: ${e.generated_at || ""}`);
  L.push(`Schema: ${e.schema_version || ""}`);
  L.push("");
  L.push(RECEIPT_BOUNDARY);
  L.push("");
  L.push("—— THE FIRST (OPEN) ANSWER ——");
  L.push("");
  for (const line of openRunBodyLines(run)) L.push(line);
  L.push("");
  L.push("—— THE TWO-QUESTION TEST (paired, machine estimate) ——");
  if (pa.open_run_id) L.push(`Open run ID: ${pa.open_run_id}`);
  L.push(pairedGapEstimateLabel(pa.gap_estimate));
  if ((pa.estimate_rationale || "").trim()) L.push(`Rationale: ${pa.estimate_rationale.trim()}`);
  L.push("");
  L.push("Targeted prompt (deterministic, from the open answer's candidate gaps):");
  L.push((pa.targeted_prompt || "").trim());
  L.push("");
  L.push("Delta — what the second answer surfaced that the first did not:");
  const deltas = Array.isArray(pa.delta_items) ? pa.delta_items : [];
  if (deltas.length) {
    deltas.forEach((d, i) => {
      const pat = (d.signal_pattern || "").trim();
      L.push(`${i + 1}. ${pat ? `[${pat}] ` : ""}${(d.point || "").trim()}`);
      if ((d.open_side || "").trim()) L.push(`   first answer: "${d.open_side.trim()}"`);
      if ((d.targeted_side || "").trim()) L.push(`   second answer: "${d.targeted_side.trim()}"`);
    });
  } else {
    L.push("- (no delta — the second answer added nothing material over the first)");
  }
  L.push("");
  L.push(
    "These are machine estimates over a single answer pair, not validated classifications or evidence.",
  );
  L.push("");
  for (const line of integrityLines(e.integrity)) L.push(line);
  L.push("");
  L.push(RECEIPT_BOUNDARY);
  return L.join("\n");
}

// Human-readable user-chip paired receipt (.txt). Same header/boundary/integrity
// frame as the paired receipt; the embedded open run renders via the shared body
// helper so the first-answer record reads identically. The chip section is
// DESCRIPTIVE: it names the follow-up the person chose and lists what visibly
// changed between the two answers — no gap estimate, no signal-pattern label, no
// verdict on either answer. The closing disclaimer is authored to the chip copy
// law (it never says the first answer failed or that the second is better).
export function formatChipPairedReceiptText(envelope) {
  const e = envelope || {};
  const run = e.open_run || {};
  const pa = e.paired_analysis || {};
  const L = [];
  L.push("IMBAS READER — USER-DIRECTED FOLLOW-UP RECEIPT");
  L.push(`Generated: ${e.generated_at || ""}`);
  L.push(`Schema: ${e.schema_version || ""}`);
  L.push("");
  L.push(RECEIPT_BOUNDARY);
  L.push("");
  // The first answer only — verbatim, no inspection layer. A chip pair asserts no
  // inspection finding, so THE READ / MEASUREMENT / inspector provenance are never
  // rendered here and are never blank-filled; the receipt carries only the answer
  // the follow-up actually ran against.
  L.push("—— THE FIRST ANSWER ——");
  L.push("");
  if ((run.question || "").trim()) {
    L.push(`Question: ${run.question.trim()}`);
    L.push("");
  }
  L.push((run.answer || "").trim());
  L.push("");
  // The follow-up the person chose: the human-facing label leads (what they tapped,
  // in plain words), with the stable chip_id and instruction_version kept beside it
  // as explicit provenance — the id is never replaced by the label.
  L.push("—— THE FOLLOW-UP YOU CHOSE ——");
  if ((pa.chip_label || "").trim()) L.push(pa.chip_label.trim());
  L.push("");
  if (pa.chip_id) L.push(`Chip ID: ${pa.chip_id}`);
  if (pa.instruction_version) L.push(`Instruction version: ${pa.instruction_version}`);
  if (pa.open_run_id) L.push(`Open run ID: ${pa.open_run_id}`);
  L.push("");
  L.push("Instruction you sent:");
  L.push((pa.targeted_prompt || "").trim());
  L.push("");
  L.push("What changed in the second answer:");
  const deltas = Array.isArray(pa.delta_items) ? pa.delta_items : [];
  if (deltas.length) {
    deltas.forEach((d, i) => {
      L.push(`${i + 1}. ${(d.point || "").trim()}`);
      if ((d.open_side || "").trim()) L.push(`   first answer: "${d.open_side.trim()}"`);
      if ((d.targeted_side || "").trim()) L.push(`   second answer: "${d.targeted_side.trim()}"`);
    });
  } else {
    L.push("- (nothing visibly changed under this instruction)");
  }
  L.push("");
  L.push(
    "This is a user-directed follow-up, not an Imbas inspection finding. It shows what changed under the conditions you recorded; it does not establish that the second answer is correct, complete, or better supported.",
  );
  L.push("");
  for (const line of integrityLines(e.integrity)) L.push(line);
  L.push("");
  L.push(RECEIPT_BOUNDARY);
  return L.join("\n");
}
