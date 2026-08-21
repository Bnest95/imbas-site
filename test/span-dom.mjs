// A minimal node tree for exercising reader-span-selection.js in Node.
//
// WHY THIS EXISTS AT ALL. The repo has no DOM library — devDependencies are esbuild,
// pdfjs-dist and playwright-core — and reader-span-selection.js was written to need
// none: it reaches for nodeType, parentNode, childNodes, data, hasAttribute and
// getAttribute, and nothing else. This module is the other half of that contract, so
// the resolver is proven against a real tree rather than against a mock of itself.
//
// It lives here rather than inside either test file for the reason dead-prototypes.mjs
// gives: two tests keeping their own copy of a fixture is how one of them ends up
// proving a different thing from the other while both stay green.
//
// NOT A DOM IMPLEMENTATION, and deliberately not. It models exactly the surface the
// resolver uses. Anything the resolver does not touch is absent, so a change that
// starts reaching for `Node.contains` or `textContent` fails here loudly instead of
// silently passing against a helpful mock.

export const ELEMENT_NODE = 1;
export const TEXT_NODE = 3;

class TestText {
  constructor(data) {
    this.nodeType = TEXT_NODE;
    this.data = String(data);
    this.parentNode = null;
    this.childNodes = [];
  }
}

class TestElement {
  constructor(tagName, attrs = {}) {
    this.nodeType = ELEMENT_NODE;
    this.tagName = String(tagName).toUpperCase();
    this.childNodes = [];
    this.parentNode = null;
    this._attrs = new Map();
    for (const [k, v] of Object.entries(attrs)) {
      if (v === undefined || v === null || v === false) continue;
      this._attrs.set(k, String(v));
    }
  }

  hasAttribute(name) {
    return this._attrs.has(name);
  }

  getAttribute(name) {
    return this._attrs.has(name) ? this._attrs.get(name) : null;
  }

  appendChild(node) {
    node.parentNode = this;
    this.childNodes.push(node);
    return node;
  }
}

// The className→attribute mapping the renderer uses, plus the data-* attributes that
// arrive through the spread. Everything else is dropped: a style hook or an aria
// relationship is not something the resolver may key on, and letting it through would
// let a test accidentally depend on one.
function attrsFrom(props = {}) {
  const out = {};
  for (const [k, v] of Object.entries(props)) {
    if (k === "children" || k === "key" || k === "ref") continue;
    if (k === "className") {
      out.class = v;
      continue;
    }
    if (k.startsWith("data-") || k === "aria-details") out[k] = v;
  }
  return out;
}

// Turn the render harness's virtual tree into a node tree. The harness's `h` already
// called every function component, so what arrives here is host elements, strings,
// numbers, arrays, and the nulls a component returned.
export function toNodeTree(vnode, parent = null) {
  if (vnode === null || vnode === undefined || vnode === false || vnode === true) return null;
  if (Array.isArray(vnode)) {
    for (const child of vnode) toNodeTree(child, parent);
    return null;
  }
  if (typeof vnode === "string" || typeof vnode === "number") {
    const t = new TestText(vnode);
    if (parent) parent.appendChild(t);
    return t;
  }
  if (typeof vnode !== "object" || typeof vnode.type !== "string") return null;

  const el = new TestElement(vnode.type, attrsFrom(vnode.props));
  if (parent) parent.appendChild(el);
  const kids = vnode.children !== undefined ? vnode.children : (vnode.props || {}).children;
  toNodeTree(kids === undefined ? [] : kids, el);
  return el;
}

// Depth-first, document order.
export function walk(node, visit) {
  if (!node) return;
  visit(node);
  for (const kid of node.childNodes) walk(kid, visit);
}

export function findByClass(root, className) {
  let found = null;
  walk(root, (n) => {
    if (found) return;
    if (n.nodeType === ELEMENT_NODE && String(n.getAttribute("class") || "").split(/\s+/).includes(className)) {
      found = n;
    }
  });
  return found;
}

// Is this node inside a subtree marked as instrument chrome?
export function inChrome(node, root, markNumberAttr) {
  let n = node;
  while (n && n !== root) {
    if (n.nodeType === ELEMENT_NODE && n.hasAttribute(markNumberAttr)) return true;
    n = n.parentNode;
  }
  return false;
}

// Every text node under `root`, in document order, each tagged with whether it sits in
// instrument chrome. INDEPENDENT of reader-span-selection.js by design: the tests use
// this to derive an expected offset from raw DOM text and then check the module arrives
// at the same number from the other direction. A helper that called the module would
// prove only that the module agrees with itself.
export function textNodes(root, markNumberAttr) {
  const out = [];
  walk(root, (n) => {
    if (n.nodeType === TEXT_NODE) out.push({ node: n, chrome: inChrome(n, root, markNumberAttr) });
  });
  return out;
}

// The boundary point standing at answer-character `index`, derived by counting the
// rendered text and SKIPPING chrome. Returns null when the index is past the end.
//
// `includeChrome` is the negative control's switch: counting the mark numerals as
// answer characters is the exact defect the data-mark-number exclusion prevents, and a
// test can produce it here on purpose to show the resolver does not.
export function boundaryAtAnswerIndex(root, index, markNumberAttr, { includeChrome = false } = {}) {
  let seen = 0;
  for (const { node, chrome } of textNodes(root, markNumberAttr)) {
    if (chrome && !includeChrome) continue;
    const len = node.data.length;
    if (index <= seen + len) return { node, offset: index - seen };
    seen += len;
  }
  return null;
}

// The rendered answer text, chrome excluded — what a person's selection can actually
// cover. Must equal the artifact exactly.
export function renderedAnswerText(root, markNumberAttr) {
  return textNodes(root, markNumberAttr)
    .filter((t) => !t.chrome)
    .map((t) => t.node.data)
    .join("");
}

// A Range, as reader-span-selection.js consumes one: four fields, nothing else.
export function rangeOf(startPoint, endPoint) {
  return {
    startContainer: startPoint.node,
    startOffset: startPoint.offset,
    endContainer: endPoint.node,
    endOffset: endPoint.offset,
  };
}
