// Executing the SHIPPED source-reading components in Node.
//
// WHY LIFT THE COMPONENT RATHER THAN COPY IT. A source scan proves the file contains the
// right words, which is also true of a component nothing mounts. These helpers pull
// SourceReading and SpanAffordances out of workbench-app.jsx by symbol name and compile
// them with the bundle's own JSX settings, so what the tests exercise is what ships.
//
// WHY IT LIVES HERE RATHER THAN IN EITHER TEST FILE. Two files need the same render:
// source-reading.test.mjs proves the offsets the surface emits, and
// reader-span-selection.test.mjs proves what a drag over that surface resolves to. Two
// copies of one harness is how one of them ends up proving a different thing from the
// other while both stay green — the same reason span-dom.mjs and dead-prototypes.mjs
// exist.
//
// THE HOOKS ARE STUBS, AND THAT IS THE HONEST SHAPE. There is no DOM here, so `useRef`
// yields a null ref, `useEffect` never runs, and `useState` holds its initial value. So
// SourceReading's own selection state is null in every render — the state of the surface
// before anyone has dragged a cursor — and SpanAffordances is rendered directly, with the
// span passed in, for the states after.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { transform } from "esbuild";

import { CHECK_UI } from "../reader-checks.js";
import {
  SPAN_SEGMENT_ATTR,
  MARK_NUMBER_ATTR,
  SPAN_UI,
  SPAN_ACTION,
  SPAN_AFFORDANCES,
  resolveSpanAction,
  resolveSelectionSpan,
} from "../reader-span-selection.js";

const SRC = readFileSync(
  process.env.WORKBENCH_APP_JSX || fileURLToPath(new URL("../workbench-app.jsx", import.meta.url)),
  "utf8",
);

export function componentSource(name, text = SRC) {
  const start = text.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `workbench-app.jsx must define ${name}`);
  const rest = text.slice(start);
  const next = rest.indexOf("\nfunction ", 1);
  return next === -1 ? rest : rest.slice(0, next);
}

export function stringConstant(name, text = SRC) {
  const m = new RegExp(`^const ${name} = ("(?:[^"\\\\]|\\\\.)*");$`, "m").exec(text);
  assert.ok(m, `workbench-app.jsx must define ${name} as a single-line string constant`);
  return JSON.parse(m[1]);
}

// The span lane's real exports, not mocks of them. A mock here would let the component and
// the module drift apart while every assertion below stayed green.
const SPAN_ENV = {
  SPAN_SEGMENT_ATTR,
  MARK_NUMBER_ATTR,
  SPAN_UI,
  SPAN_ACTION,
  SPAN_AFFORDANCES,
  resolveSpanAction,
  resolveSelectionSpan,
  CHECK_UI,
};

// The virtual node a host element becomes: {type, props, children}. Function components are
// called through, so what comes back is host elements all the way down.
function makeH() {
  return (type, props, ...children) => {
    if (typeof type === "function") return type({ ...(props || {}), children });
    return { type, props: props || {}, children };
  };
}

async function compile(names, entry, extraEnv = {}) {
  const { code } = await transform(`${names.map((n) => componentSource(n)).join("\n")}\nreturn ${entry};`, {
    loader: "jsx",
    jsxFactory: "h",
    jsxFragment: "Frag",
  });
  const env = {
    h: makeH(),
    Frag: "Frag",
    MEASURE_SOURCE_LABEL: stringConstant("MEASURE_SOURCE_LABEL"),
    useRef: () => ({ current: null }),
    useState: (initial) => [initial, () => {}],
    useEffect: () => {},
    ...SPAN_ENV,
    ...extraEnv,
  };
  return new Function(...Object.keys(env), code)(...Object.values(env));
}

// The whole READ region, as it renders before anyone has selected anything.
export async function renderSourceReading(reading, props = {}) {
  const SourceReading = await compile(
    ["SourceReading", "MarkNumber", "SpanAffordances", "findingExplanationId"],
    "SourceReading",
  );
  return SourceReading({ reading, ...props });
}

// The affordance block alone, with a resolved span handed in — the states that exist only
// after a person has dragged a cursor, which no stubbed hook can produce.
export async function renderSpanAffordances(props = {}) {
  const SpanAffordances = await compile(["SpanAffordances"], "SpanAffordances");
  return SpanAffordances(props);
}
