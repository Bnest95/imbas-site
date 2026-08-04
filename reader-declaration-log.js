// reader-declaration-log.js — the append-only store for run declarations.
//
// A declaration is what a person REPORTED about how they ran a pair: whether both
// answers came from the same AI, which model, whether they edited anything. It is
// evidence of what was reported. It is not evidence that the conditions actually
// matched, and nothing in this file computes, checks, or corrects toward the derived
// matched/unmatched state, which lives client-side and stays there.
//
// WHY A LOG AND NOT A FIELD. The product surface discloses these questions
// progressively — after someone has seen value, not before — so the same pair can
// collect a declaration at submission, another at inspection, another at review, and
// another when the person comes back a week later and remembers they had switched
// models. A correction is a DIFFERENT FACT from an original, not a better version of
// it. Storing one mutable value per pair would erase the earlier fact and leave no way
// to say when the person changed their account. So each declaration is its own
// immutable row, and a correction appends a row pointing backward at what it corrects.
//
// This module is the ONE owner of that store. Declaration state lives here and nowhere
// else: not in a column on the paired analysis, not in a snapshot on a share. A second
// store would be a second answer to "what did this person say", and two answers to that
// question is worse than none.
//
// WHY NOT A JSON ARRAY ON THE PAIRED ROW. Appending to a packed array means reading the
// row, adding an element, and PATCHing it back. Two declarations arriving close together
// both read the same array and the second write erases the first. A lost update is
// tolerable in a cache. It is not tolerable in a provenance record.
//
// Ownership is a VALUE JOIN on (Open Run ID, Targeted Answer Hash) — the same pair
// identity Reader Paired Analyses already uses as its double-submit key, and the same
// plain-text convention the whole base follows. The base has no link fields.
//
// Everything here fails CLOSED. A row this build cannot read is reported as unreadable,
// never dropped and never coerced into a thinner shape that would read as complete.

import {
  DECLARATION_VERSION,
  DECLARATION_STATUS,
  DECLARATION_NOT_DECLARED,
  DECLARATION_NOT_CAPTURED,
  DECLARATION_STAGE_NOT_RECORDED,
  DECLARATION_ACTOR_NOT_IDENTIFIED,
  DECLARATION_NO_SUPERSESSION,
  DECLARATION_READ,
  DECLARATION_HISTORY,
  DeclarationError,
  isDeclarationId,
  sanitizeRunDeclaration,
  resolveDeclarationHistory,
} from "./reader-paired.js";

export const AIRTABLE_BASE = "appfxHraqlcpP1AAP";
// Reader Run Declarations. Its own table, not columns on the paired analysis: the
// paired row is one row per PAIR and a declaration log needs one row per EVENT.
export const DECLARATIONS_TABLE = "tblMo8qwOVbDacLLd";

const REQUEST_TIMEOUT_MS = 4500;
const RETRY_BACKOFF_MS = 250;
// A pair with more declarations than this is not a person correcting themselves; it is
// something wrong. The read stops rather than paginating forever, and says it stopped.
export const DECLARATION_PAGE_MAX = 100;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// The ownership key halves are hex digests and hex request ids, so anything outside
// [a-f0-9] is stripped before it reaches a filter formula. Airtable formulas are built
// by string concatenation; a value carrying a quote or a paren would change the shape
// of the formula rather than the value inside it. Narrowing at the boundary is cheaper
// and more certain than escaping at every use.
const hexOnly = (s) => String(s || "").replace(/[^a-f0-9]/gi, "");

// The outcomes a write can have. Named rather than boolean because "we did not write a
// row" is three different facts: the same declaration was already there (fine), a
// different declaration already claims that id (a real conflict), or the store refused
// (unknown state). Collapsing them would let a caller report success for a conflict.
export const DECLARATION_WRITE = Object.freeze({
  CREATED: "CREATED",
  ALREADY_RECORDED: "ALREADY_RECORDED",
  ID_CONFLICT: "DECLARATION_ID_CONFLICT",
  INVALID: "DECLARATION_INVALID",
  SUPERSEDES_UNKNOWN: "SUPERSEDES_UNKNOWN",
  SUPERSEDES_FOREIGN: "SUPERSEDES_CROSS_INSPECTION",
  SUPERSEDES_CYCLE: "SUPERSEDES_CYCLE",
  UNCONFIGURED: "UNCONFIGURED",
  STORE_UNAVAILABLE: "STORE_UNAVAILABLE",
});

// ── Row shape ────────────────────────────────────────────────────────────────

// The declaration artifact, plus the two ownership columns. Nothing derived is written:
// no matched/unmatched state, no conclusion, no label. The status LABEL in particular
// stays out of the row — it is display copy owned by one mapping in reader-paired.js,
// and a copy of it here would be a second place for the wording to drift.
export function declarationToFields(declaration, { openRunId, answerHash } = {}) {
  const d = sanitizeRunDeclaration(declaration);
  const owner = ownershipKey({ openRunId, answerHash });
  return {
    "Declaration ID": d.declaration_id,
    "Declaration Version": d.declaration_version,
    "Declaration Source": d.declaration_source,
    "Open Run ID": owner.openRunId,
    "Targeted Answer Hash": owner.answerHash,
    Stage: d.stage,
    Actor: d.actor,
    "Declaration Status": d.status,
    "Declared Same Model": d.same_model,
    "Declared Model Version": d.model_version,
    "Declared Edits": d.edits,
    "Declared At Client": d.declared_at_client,
    "Received At Server": d.received_at_server,
    "Supersedes Declaration ID": d.supersedes,
  };
}

// Rebuild the artifact from a stored row.
//
// This is where the decl.1 doctrine narrows. That pass said "content is echoed, shape
// is stamped": the declared values came off the row, and the version was stamped fresh
// because it described the object being assembled. That was safe when there was one
// shape. It is not safe now. A row written under a version this build does not know
// would be re-stamped decl.2 and returned looking complete while its unknown fields
// went missing. So the VERSION is read off the row like everything else, and an
// unrecognized one raises rather than being overwritten.
//
// Absence tokens are read through unchanged, never re-derived. A blank cell is the one
// thing that gets a substitute, because a blank cannot be told apart from a column that
// did not exist when the row was written — and NOT_CAPTURED says exactly that.
export function declarationFromRow(recordFields) {
  const f = recordFields || {};
  const text = (v) => (typeof v === "string" ? v.trim() : "");
  const raw = {
    declaration_version: text(f["Declaration Version"]),
    declaration_id: text(f["Declaration ID"]),
    declaration_source: text(f["Declaration Source"]),
    status: text(f["Declaration Status"]),
    status_label: "",
    stage: text(f.Stage) || DECLARATION_STAGE_NOT_RECORDED,
    actor: text(f.Actor) || DECLARATION_ACTOR_NOT_IDENTIFIED,
    same_model: text(f["Declared Same Model"]) || DECLARATION_NOT_DECLARED,
    model_version: text(f["Declared Model Version"]) || DECLARATION_NOT_DECLARED,
    edits: text(f["Declared Edits"]) || DECLARATION_NOT_DECLARED,
    declared_at_client: text(f["Declared At Client"]) || DECLARATION_NOT_CAPTURED,
    received_at_server: text(f["Received At Server"]) || DECLARATION_NOT_CAPTURED,
    supersedes: text(f["Supersedes Declaration ID"]) || DECLARATION_NO_SUPERSESSION,
  };
  return sanitizeRunDeclaration(raw);
}

// The two-part pair identity. Both halves are required: a declaration that cannot say
// which pair it belongs to has no owner, and an unowned row in a provenance log is
// worse than a rejected write.
export function ownershipKey({ openRunId, answerHash } = {}) {
  const id = hexOnly(openRunId);
  const hash = hexOnly(answerHash);
  if (!id || !hash) {
    throw new DeclarationError(
      DECLARATION_READ.MALFORMED,
      "declaration ownership requires open_run_id and targeted_answer_hash",
    );
  }
  return { openRunId: id, answerHash: hash };
}

// Two declarations are the same logical event when every stored value matches. Used on
// the idempotency check: a client that retried after a timeout re-sends the same id and
// the same content, and gets the existing row back. A client that re-sends the same id
// with DIFFERENT content is not retrying — it is claiming one identity for two facts,
// and that fails loudly. received_at_server is excluded because the retry arrives at a
// later instant and the stored row keeps the first arrival, which is the honest one.
const IDENTITY_COMPARED = [
  "declaration_version",
  "declaration_source",
  "status",
  "stage",
  "actor",
  "same_model",
  "model_version",
  "edits",
  "declared_at_client",
  "supersedes",
];

export function sameDeclarationContent(a, b) {
  return IDENTITY_COMPARED.every((k) => a[k] === b[k]);
}

// ── Store access ─────────────────────────────────────────────────────────────

async function airtableGet(url, env, fetchImpl) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    const r = await fetchImpl(url, {
      headers: { Authorization: `Bearer ${env.AIRTABLE_TOKEN}` },
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!r.ok) return { ok: false, data: null };
    return { ok: true, data: await r.json() };
  } catch {
    clearTimeout(timer);
    return { ok: false, data: null };
  }
}

// Every declaration row owned by one pair, in whatever order Airtable returned them.
// Order is imposed afterward by the log's own rule; incidental return order decides
// nothing. Paginates to DECLARATION_PAGE_MAX and reports truncation rather than
// silently answering with part of the history.
export async function fetchDeclarationRows({ openRunId, answerHash }, deps = {}) {
  const env = deps.env || process.env;
  const fetchImpl = deps.fetch || fetch;
  if (!env.AIRTABLE_TOKEN) return { ok: false, reason: DECLARATION_WRITE.UNCONFIGURED, rows: [] };
  const owner = ownershipKey({ openRunId, answerHash });
  const formula = `AND({Open Run ID}='${owner.openRunId}',{Targeted Answer Hash}='${owner.answerHash}')`;
  const base =
    `https://api.airtable.com/v0/${AIRTABLE_BASE}/${DECLARATIONS_TABLE}` +
    `?filterByFormula=${encodeURIComponent(formula)}&pageSize=100`;
  const rows = [];
  let offset = "";
  for (let page = 0; page < 5; page++) {
    const url = offset ? `${base}&offset=${encodeURIComponent(offset)}` : base;
    const { ok, data } = await airtableGet(url, env, fetchImpl);
    if (!ok) return { ok: false, reason: DECLARATION_WRITE.STORE_UNAVAILABLE, rows: [] };
    for (const rec of Array.isArray(data.records) ? data.records : []) rows.push(rec);
    offset = data && data.offset ? data.offset : "";
    if (!offset || rows.length >= DECLARATION_PAGE_MAX) break;
  }
  return { ok: true, reason: "", rows, truncated: !!offset };
}

// One row by declaration id, scoped to nothing — ids are globally unique by contract,
// and the scoping check belongs to the caller that knows which pair it is asking about.
// Looking up unscoped is deliberate: it is how a cross-Inspection supersession attempt
// gets caught as FOREIGN rather than disappearing as UNKNOWN.
export async function fetchDeclarationById(declarationId, deps = {}) {
  const env = deps.env || process.env;
  const fetchImpl = deps.fetch || fetch;
  if (!env.AIRTABLE_TOKEN) return { ok: false, reason: DECLARATION_WRITE.UNCONFIGURED, record: null };
  if (!isDeclarationId(declarationId)) {
    throw new DeclarationError(DECLARATION_READ.MALFORMED, "declaration id required");
  }
  const formula = `{Declaration ID}='${declarationId}'`;
  const url =
    `https://api.airtable.com/v0/${AIRTABLE_BASE}/${DECLARATIONS_TABLE}` +
    `?filterByFormula=${encodeURIComponent(formula)}&maxRecords=1`;
  const { ok, data } = await airtableGet(url, env, fetchImpl);
  if (!ok) return { ok: false, reason: DECLARATION_WRITE.STORE_UNAVAILABLE, record: null };
  const record = Array.isArray(data.records) && data.records[0] ? data.records[0] : null;
  return { ok: true, reason: "", record };
}

// A named set of declarations, by identity.
//
// This is the read a dated record uses. A share stores WHICH declarations existed when
// it was minted, and reconstructs them here — so the share shows the state as of its own
// date even though the pair's log has kept growing since. Reconstruction is exact
// because declaration rows are immutable: the row read today is byte-for-byte the row
// that existed at mint.
//
// It fails closed in both directions. An id whose row cannot be found is not skipped —
// rows are never deleted, so a missing one means the answer would be shorter than the
// record, and a short provenance history reads as complete while being wrong. A row that
// cannot be parsed stops the read for the same reason.
export async function fetchDeclarationsByIds(ids, deps = {}) {
  const env = deps.env || process.env;
  const fetchImpl = deps.fetch || fetch;
  const wanted = (Array.isArray(ids) ? ids : []).filter(isDeclarationId);
  if (wanted.length === 0) {
    return { ok: true, reason: "", rows: [], missing: [] };
  }
  if (!env.AIRTABLE_TOKEN) return { ok: false, reason: DECLARATION_WRITE.UNCONFIGURED, rows: [], missing: wanted };
  if (wanted.length > DECLARATION_PAGE_MAX) {
    return { ok: false, reason: DECLARATION_WRITE.STORE_UNAVAILABLE, rows: [], missing: wanted };
  }
  // Batched rather than one request per id: a share with a long correction history would
  // otherwise fan out into a dozen serial round trips on a public page load. The batch is
  // small enough that the OR formula stays well inside Airtable's URL limit.
  const BATCH = 25;
  const found = new Map();
  for (let i = 0; i < wanted.length; i += BATCH) {
    const batch = wanted.slice(i, i + BATCH);
    const formula = `OR(${batch.map((id) => `{Declaration ID}='${id}'`).join(",")})`;
    const url =
      `https://api.airtable.com/v0/${AIRTABLE_BASE}/${DECLARATIONS_TABLE}` +
      `?filterByFormula=${encodeURIComponent(formula)}&pageSize=100`;
    const { ok, data } = await airtableGet(url, env, fetchImpl);
    if (!ok) return { ok: false, reason: DECLARATION_WRITE.STORE_UNAVAILABLE, rows: [], missing: batch };
    for (const rec of Array.isArray(data.records) ? data.records : []) {
      const id = rec && rec.fields ? String(rec.fields["Declaration ID"] || "") : "";
      if (id) found.set(id, rec);
    }
  }
  const missing = wanted.filter((id) => !found.has(id));
  if (missing.length) return { ok: false, reason: DECLARATION_WRITE.STORE_UNAVAILABLE, rows: [], missing };
  return { ok: true, reason: "", rows: wanted.map((id) => found.get(id)), missing: [] };
}

// The mint-time declaration state for a dated record: the named rows, read as a history.
//
// Ordering is re-derived here by the log's own rule rather than trusted from the stored
// id list, because a stored array's order is a convenience of how it was written, not a
// fact about when anything was declared. The set is closed under supersession by
// construction — a correction can only name a declaration that already existed, so its
// target was already in the record when the identities were captured.
export async function readDeclarationsByIds(ids, deps = {}) {
  const wanted = (Array.isArray(ids) ? ids : []).filter(isDeclarationId);
  if (wanted.length === 0) {
    return { ok: true, state: DECLARATION_HISTORY.NONE, reason: "", declarations: [], current: null, conflicts: [] };
  }
  const fetched = await fetchDeclarationsByIds(wanted, deps);
  if (!fetched.ok) {
    return {
      ok: false,
      state: DECLARATION_HISTORY.UNREADABLE,
      reason: fetched.reason,
      declarations: [],
      current: null,
      conflicts: [],
    };
  }
  const parsed = [];
  for (const rec of fetched.rows) {
    try {
      parsed.push(declarationFromRow(rec.fields));
    } catch (e) {
      const err = e instanceof DeclarationError ? e : null;
      return {
        ok: false,
        state: DECLARATION_HISTORY.UNREADABLE,
        reason: err ? `${err.kind}: ${err.reason}` : "unreadable declaration row",
        declarations: [],
        current: null,
        conflicts: [],
      };
    }
  }
  return resolveDeclarationHistory(parsed);
}

// ── Read path ────────────────────────────────────────────────────────────────

// The full declaration history for one pair, plus a current-effective projection where
// one exists.
//
// The projection is DERIVED, every time, from the log. It is not a second store and it
// is never written back. Where the log branches — two people correcting the same
// declaration, or two originals nobody ever reconciled — there is no single current
// value, and the honest answer is to say so and hand back both branches. Picking the
// row that happened to sort last would be inventing a history that nobody recorded.
export async function readDeclarationHistory({ openRunId, answerHash }, deps = {}) {
  const fetched = await fetchDeclarationRows({ openRunId, answerHash }, deps);
  if (!fetched.ok) {
    return {
      ok: false,
      state: DECLARATION_HISTORY.UNREADABLE,
      reason: fetched.reason,
      declarations: [],
      current: null,
      conflicts: [],
      truncated: false,
    };
  }
  // A row this build cannot read stops the whole answer. It is not skipped: a history
  // that silently omits the one declaration nobody could parse would read as complete
  // while being wrong in exactly the place that matters.
  const parsed = [];
  for (const rec of fetched.rows) {
    try {
      parsed.push(declarationFromRow(rec.fields));
    } catch (e) {
      const err = e instanceof DeclarationError ? e : null;
      return {
        ok: false,
        state: DECLARATION_HISTORY.UNREADABLE,
        reason: err ? `${err.kind}: ${err.reason}` : "unreadable declaration row",
        declarations: [],
        current: null,
        conflicts: [],
        truncated: !!fetched.truncated,
      };
    }
  }
  const resolved = resolveDeclarationHistory(parsed);
  return { ...resolved, truncated: !!fetched.truncated };
}

// ── Write path ───────────────────────────────────────────────────────────────

// Whether this declaration may point backward at the one it names.
//
// A correction only makes sense within one pair: a declaration about how you ran THIS
// pair cannot correct a declaration about a different one. So the parent must exist and
// must carry the same two ownership values. An id nobody has seen is UNKNOWN; an id
// belonging to another pair is FOREIGN. They are reported separately because they are
// different mistakes — a typo and a boundary violation.
//
// Cycles are checked against the pair's existing chain, walking backward from the named
// parent. Self-supersession is already refused when the artifact is built; what is left
// is A→B where B already reaches A, at any depth.
function checkSupersession(declaration, owner, existing) {
  if (declaration.supersedes === DECLARATION_NO_SUPERSESSION) return { ok: true };
  const byId = new Map(existing.map((d) => [d.declaration_id, d]));
  const parent = byId.get(declaration.supersedes);
  if (!parent) return { ok: false, outcome: DECLARATION_WRITE.SUPERSEDES_UNKNOWN };
  let hop = parent;
  const seen = new Set([declaration.declaration_id]);
  while (hop && hop.supersedes !== DECLARATION_NO_SUPERSESSION) {
    if (seen.has(hop.declaration_id)) break;
    seen.add(hop.declaration_id);
    if (hop.supersedes === declaration.declaration_id) {
      return { ok: false, outcome: DECLARATION_WRITE.SUPERSEDES_CYCLE };
    }
    hop = byId.get(hop.supersedes);
  }
  return { ok: true };
}

// Append one declaration. Never updates a row, here or anywhere: the whole point of the
// log is that what someone said stays said.
//
// The order matters. Validate the artifact, then read the pair's existing chain, then
// settle identity and supersession against it, and only then create. Reading first is
// what makes the idempotency check and the supersession check possible at all — neither
// can be answered by looking at the incoming declaration alone.
//
// The idempotency key is the declaration_id, chosen by the caller BEFORE this runs. A
// client whose request timed out re-sends the same id; the row is already there with
// the same content; it gets that row back and no second event enters the record. That
// is the whole guarantee: a flaky network cannot manufacture a correction the person
// never made.
export async function appendDeclaration({ openRunId, answerHash, declaration }, deps = {}) {
  const env = deps.env || process.env;
  const fetchImpl = deps.fetch || fetch;

  let owner;
  let decl;
  try {
    owner = ownershipKey({ openRunId, answerHash });
    decl = sanitizeRunDeclaration(declaration);
  } catch (e) {
    const err = e instanceof DeclarationError ? e : null;
    return {
      ok: false,
      outcome: DECLARATION_WRITE.INVALID,
      reason: err ? `${err.kind}: ${err.reason}` : "invalid declaration",
      declaration: null,
      record_id: "",
    };
  }
  if (!env.AIRTABLE_TOKEN) {
    return {
      ok: false,
      outcome: DECLARATION_WRITE.UNCONFIGURED,
      reason: "no store configured",
      declaration: decl,
      record_id: "",
    };
  }

  const history = await readDeclarationHistory(owner, deps);
  // A branched or broken chain does NOT block an append — the log is append-only, and
  // refusing to record what someone said because an earlier chain is tangled would lose
  // the newer fact to protect the older one. What is refused is an append that would
  // make the tangle worse, which is what the supersession checks below cover. An
  // unreadable store is different: without the existing chain, neither the idempotency
  // check nor the supersession check can run, and writing blind could duplicate an
  // event. That fails.
  if (!history.ok && history.state === DECLARATION_HISTORY.UNREADABLE) {
    return {
      ok: false,
      outcome: DECLARATION_WRITE.STORE_UNAVAILABLE,
      reason: history.reason || "declaration history unreadable",
      declaration: decl,
      record_id: "",
    };
  }
  const existing = history.declarations || [];

  const priorSameId = existing.find((d) => d.declaration_id === decl.declaration_id);
  if (priorSameId) {
    if (sameDeclarationContent(priorSameId, decl)) {
      return {
        ok: true,
        outcome: DECLARATION_WRITE.ALREADY_RECORDED,
        reason: "",
        // The STORED declaration, not the resubmitted one. A replay reports what the
        // record holds, including the first arrival time, because that is the fact.
        declaration: priorSameId,
        record_id: "",
      };
    }
    return {
      ok: false,
      outcome: DECLARATION_WRITE.ID_CONFLICT,
      reason: "declaration id already recorded with different content",
      declaration: priorSameId,
      record_id: "",
    };
  }

  // An id that belongs to a DIFFERENT pair is a boundary violation, not a new event.
  // Checked before the supersession rules because reusing an identity across pairs
  // breaks the log regardless of what this declaration points at.
  const foreign = await fetchDeclarationById(decl.declaration_id, deps);
  if (!foreign.ok) {
    return {
      ok: false,
      outcome: DECLARATION_WRITE.STORE_UNAVAILABLE,
      reason: foreign.reason,
      declaration: decl,
      record_id: "",
    };
  }
  if (foreign.record) {
    return {
      ok: false,
      outcome: DECLARATION_WRITE.ID_CONFLICT,
      reason: "declaration id already recorded under a different pair",
      declaration: null,
      record_id: "",
    };
  }

  if (decl.supersedes !== DECLARATION_NO_SUPERSESSION) {
    const inPair = existing.some((d) => d.declaration_id === decl.supersedes);
    if (!inPair) {
      // Not in this pair. Either it does not exist at all, or it belongs to another
      // pair — and those are different refusals, so ask the store which one it is.
      const target = await fetchDeclarationById(decl.supersedes, deps);
      if (!target.ok) {
        return {
          ok: false,
          outcome: DECLARATION_WRITE.STORE_UNAVAILABLE,
          reason: target.reason,
          declaration: decl,
          record_id: "",
        };
      }
      return {
        ok: false,
        outcome: target.record ? DECLARATION_WRITE.SUPERSEDES_FOREIGN : DECLARATION_WRITE.SUPERSEDES_UNKNOWN,
        reason: target.record
          ? "supersedes a declaration belonging to a different pair"
          : "supersedes an unknown declaration",
        declaration: decl,
        record_id: "",
      };
    }
    const chain = checkSupersession(decl, owner, existing);
    if (!chain.ok) {
      return {
        ok: false,
        outcome: chain.outcome,
        reason: chain.outcome === DECLARATION_WRITE.SUPERSEDES_CYCLE ? "supersession would close a cycle" : "invalid supersession",
        declaration: decl,
        record_id: "",
      };
    }
  }

  const fields = declarationToFields(decl, owner);
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${DECLARATIONS_TABLE}`;
  const body = JSON.stringify({ fields, typecast: true });
  const MAX_ATTEMPTS = 2;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const canRetry = attempt < MAX_ATTEMPTS;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
    let r;
    try {
      r = await fetchImpl(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${env.AIRTABLE_TOKEN}`, "Content-Type": "application/json" },
        body,
        signal: ctrl.signal,
      });
    } catch {
      clearTimeout(timer);
      if (canRetry) {
        await delay(RETRY_BACKOFF_MS);
        continue;
      }
      // The retry is safe precisely because the id is stable: if the first attempt did
      // land and only the response was lost, the next call's idempotency check finds
      // the row and returns ALREADY_RECORDED rather than appending a twin.
      return {
        ok: false,
        outcome: DECLARATION_WRITE.STORE_UNAVAILABLE,
        reason: "declaration write failed",
        declaration: decl,
        record_id: "",
      };
    }
    clearTimeout(timer);
    if (!r.ok) {
      if (canRetry && r.status >= 500) {
        await delay(RETRY_BACKOFF_MS);
        continue;
      }
      return {
        ok: false,
        outcome: DECLARATION_WRITE.STORE_UNAVAILABLE,
        reason: `declaration write rejected (${r.status})`,
        declaration: decl,
        record_id: "",
      };
    }
    // Read the created row back and return what the STORE holds, not what was sent.
    // If the two ever differ, the record is the one that will be read by everything
    // afterward, so it is the one that gets reported.
    let created = null;
    try {
      created = await r.json();
    } catch {}
    let stored = decl;
    let recordId = "";
    if (created && created.id) recordId = created.id;
    if (created && created.fields) {
      try {
        stored = declarationFromRow(created.fields);
      } catch (e) {
        const err = e instanceof DeclarationError ? e : null;
        return {
          ok: false,
          outcome: DECLARATION_WRITE.STORE_UNAVAILABLE,
          reason: err ? `stored row unreadable: ${err.reason}` : "stored row unreadable",
          declaration: decl,
          record_id: recordId,
        };
      }
    }
    return { ok: true, outcome: DECLARATION_WRITE.CREATED, reason: "", declaration: stored, record_id: recordId };
  }
  return {
    ok: false,
    outcome: DECLARATION_WRITE.STORE_UNAVAILABLE,
    reason: "declaration write exhausted attempts",
    declaration: decl,
    record_id: "",
  };
}

// The declaration identities a share should carry, in canonical order. Identity only,
// never content: a share records which declarations existed when it was minted, and
// reading forward through the log from those ids discovers anything that came later.
// The share itself never changes. Answers change; this record does not.
export function declarationIdList(declarations) {
  return (Array.isArray(declarations) ? declarations : []).map((d) => d && d.declaration_id).filter(isDeclarationId);
}

// Serialized for a plain-text Airtable cell, newline-joined — the house convention for
// list values in this base (api/read.js does the same for captures). Written once, at
// mint, and read back with the matching parser so the separator lives in one place.
export function serializeDeclarationIds(ids) {
  return (Array.isArray(ids) ? ids : []).filter(isDeclarationId).join("\n");
}

export function parseDeclarationIds(cell) {
  return String(cell || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(isDeclarationId);
}

export { DECLARATION_HISTORY, DECLARATION_VERSION, DECLARATION_STATUS };
