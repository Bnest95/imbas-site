// Source-observation custody.
//
// An observation attaches to one capture's one artifact and says what was on
// the surface: which role it was carried under, where it sat, what it read,
// where it pointed. Purely structural — nothing here judges a source, ranks
// one, or scores a set (IMBAS-2BD-SCOPE-MEMO section 6).
//
// Every projected field records the field it was projected from, and the
// source item travels verbatim beside it, so the projection is auditable and
// never becomes the only copy. A field the artifact does not carry stays
// absent: resolution_status is declared by the model and by no Wave 0
// artifact, so no Wave 0 observation carries one.

import { carryPresentFields } from "./field-custody.mjs";

// Section 6's four roles plus amendment A1's fifth carriage mode. A domain
// named inside the answer prose is a different fact than a citation.
export const ARTIFACT_ROLES = Object.freeze([
  "inline_citation",
  "source_panel",
  "browser_result",
  "suggested_follow_up",
  "answer_text_mention",
]);

export const ARTIFACT_CLASS_TO_ROLE = Object.freeze({
  inline_citations: "inline_citation",
  source_panel: "source_panel",
  suggested_followups: "suggested_follow_up",
});

// Where an artifact enumerates its observations. Each shape is a different
// provider's rendering, not a different kind of claim.
//
// A panel that was collapsed on completion and opened by the session carries
// the items the protocol requires, and dropping them would leave a PRESENT
// panel with no observations. It is admitted under its own reading state
// instead. The artifact that records such a reading also records that it "must
// not be quoted as what the interface showed on completion", so the
// qualification travels on every row it produced rather than sitting in a note
// one level up where a later reader has to go looking for it.
export const OBSERVATION_LIST_SOURCES = Object.freeze([
  Object.freeze({ path: "items", reading_state: "AS_DISPLAYED", count_path: "count" }),
  Object.freeze({ path: "clusters", reading_state: "AS_DISPLAYED", count_path: "cluster_count" }),
  Object.freeze({
    path: "source_label_markers.detail",
    reading_state: "AS_DISPLAYED",
    count_path: "source_label_markers.count",
  }),
  Object.freeze({
    path: "expanded_state.items",
    reading_state: "SESSION_REVEALED",
    count_path: "expanded_state.items_displayed",
    captured_at_path: "expanded_state.read_at_utc",
    basis_path: "expanded_state.how_this_reading_is_to_be_read",
  }),
]);

export const OBSERVATION_LIST_PATHS = Object.freeze(
  OBSERVATION_LIST_SOURCES.map((source) => source.path),
);

export const READING_STATES = Object.freeze(["AS_DISPLAYED", "SESSION_REVEALED"]);

const DISPLAYED_TEXT_FIELDS = Object.freeze(["displayed_text", "label", "displayed_label"]);
const URL_FIELDS = Object.freeze(["href", "destination_url"]);
const DOMAIN_FIELDS = Object.freeze(["hostname", "host"]);

const PASSTHROUGH_FIELDS = Object.freeze([
  "placement",
  "attaches_to",
  "visually_emphasized",
  "emphasis_basis",
  "background_color",
  "font_weight",
  "resolution_status",
  "displayed_title",
  "displayed_snippet",
  "overflow_token_displayed",
  "is_anchor",
  "linked",
  "target",
  "rel",
  "destination_url_basis",
  "note",
]);

function firstPresent(item, fields) {
  for (const field of fields) {
    if (Object.hasOwn(item, field)) return { field, value: item[field] };
  }
  return null;
}

function readPath(object, path) {
  return path.split(".").reduce((node, key) => (node == null ? node : node[key]), object);
}

function normalizedDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

function projectObservation(item, context) {
  const displayed = firstPresent(item, DISPLAYED_TEXT_FIELDS);
  const url = firstPresent(item, URL_FIELDS);
  const domain = firstPresent(item, DOMAIN_FIELDS);
  const derivedDomain =
    domain === null && url !== null && typeof url.value === "string"
      ? normalizedDomain(url.value)
      : null;

  return Object.freeze({
    capture_id: context.capture_id,
    artifact_class: context.artifact_class,
    artifact_role: context.artifact_role,
    observation_list_path: context.list_path,
    reading_state: context.reading_state,
    ...(context.reading_state_basis === null
      ? {}
      : { reading_state_basis: context.reading_state_basis }),
    ...carryPresentFields(item, ["ordinal"]),
    ...(displayed
      ? { displayed_text: displayed.value, displayed_text_source: displayed.field }
      : {}),
    ...(url ? { url: url.value, url_source: url.field } : {}),
    ...(domain
      ? { normalized_domain: domain.value, normalized_domain_source: domain.field }
      : derivedDomain
        ? {
            normalized_domain: derivedDomain,
            normalized_domain_source: `derived_from_${url.field}`,
          }
        : {}),
    ...carryPresentFields(item, PASSTHROUGH_FIELDS),
    ...(context.captured_at === null
      ? {}
      : { captured_at: context.captured_at, captured_at_source: context.captured_at_source }),
    instrument_version: context.instrument_version,
    instrument_version_source: context.instrument_version_source,
    source_item: item,
  });
}

// Walks the artifact for every array of objects, so that a list this module
// does not extract is reported rather than silently dropped.
export function inventoryEnumerableLists(artifact) {
  const found = [];
  const walk = (node, path) => {
    if (Array.isArray(node)) {
      if (node.some((entry) => entry !== null && typeof entry === "object")) {
        found.push({ path, length: node.length });
      }
      node.forEach((entry, index) => walk(entry, `${path}[${index}]`));
      return;
    }
    if (node !== null && typeof node === "object") {
      for (const [key, value] of Object.entries(node)) {
        walk(value, path === "" ? key : `${path}.${key}`);
      }
    }
  };
  walk(artifact, "");
  return found;
}

export function extractSourceObservations(artifact, { capture_id, capture_instrument_ref }) {
  const artifact_class = artifact?.artifact_class;
  const artifact_role = ARTIFACT_CLASS_TO_ROLE[artifact_class] ?? null;
  if (artifact_role === null) {
    return Object.freeze({
      capture_id,
      artifact_class: artifact_class ?? null,
      artifact_role: null,
      admitted: false,
      reason: "artifact_class does not carry a source-observation role",
      observations: Object.freeze([]),
      unextracted_lists: Object.freeze([]),
    });
  }

  const artifactInstrument = artifact.instrument_ref;
  const instrument_version = artifactInstrument ?? capture_instrument_ref ?? null;
  if (instrument_version === null) {
    throw new RangeError(
      `${capture_id} ${artifact_class}: no instrument_ref on the artifact or its capture. ` +
        "Every observation row carries an instrument version; observations read " +
        "under an unknown instrument are not admitted.",
    );
  }

  const observations = [];
  const extractedPaths = new Set();
  const lists = [];

  for (const source of OBSERVATION_LIST_SOURCES) {
    const list = readPath(artifact, source.path);
    if (!Array.isArray(list)) continue;
    extractedPaths.add(source.path);

    const captured_at_path = source.captured_at_path ?? "read_at_utc";
    const captured_at = readPath(artifact, captured_at_path) ?? null;
    const declared = readPath(artifact, source.count_path) ?? null;
    const before = observations.length;

    for (const item of list) {
      if (item === null || typeof item !== "object") continue;
      observations.push(
        projectObservation(item, {
          capture_id,
          artifact_class,
          artifact_role,
          list_path: source.path,
          reading_state: source.reading_state,
          reading_state_basis: source.basis_path
            ? (readPath(artifact, source.basis_path) ?? null)
            : null,
          captured_at,
          captured_at_source: captured_at === null ? null : `artifact.${captured_at_path}`,
          instrument_version,
          instrument_version_source: artifactInstrument ? "artifact" : "capture",
        }),
      );
    }

    const extracted = observations.length - before;
    lists.push(
      Object.freeze({
        path: source.path,
        reading_state: source.reading_state,
        extracted,
        declared,
        declared_from: declared === null ? null : source.count_path,
        agrees: declared === null ? null : declared === extracted,
      }),
    );
  }

  const unextracted = inventoryEnumerableLists(artifact).filter(
    (entry) => !extractedPaths.has(entry.path),
  );

  return Object.freeze({
    capture_id,
    artifact_class,
    artifact_role,
    admitted: true,
    observations: Object.freeze(observations),
    lists: Object.freeze(lists),
    unextracted_lists: Object.freeze(unextracted),
  });
}

// The artifact declares how many it carries. A list that disagrees with its
// own artifact's count is a custody failure, not something to reconcile.
export function checkDeclaredCounts(extraction) {
  return Object.freeze(
    (extraction.lists ?? [])
      .filter((list) => list.declared !== null)
      .map((list) =>
        Object.freeze({
          capture_id: extraction.capture_id,
          artifact_class: extraction.artifact_class,
          path: list.path,
          declared: list.declared,
          extracted: list.extracted,
          agrees: list.agrees,
        }),
      ),
  );
}
