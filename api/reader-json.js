// reader-json.js — shared, pure-JS tolerant JSON extraction for the Reader.
//
// Both paid Reader endpoints (api/read.js single mode, api/read-paired.js paired
// mode) ask Opus for JSON-only and then have to survive the two things it most
// often adds anyway: inline // and /* */ comments echoed from the schema, and
// trailing commas. Keeping the tolerant parser in ONE module means the two
// endpoints cannot drift — a fix to the extractor protects both, and the parser
// is unit-testable in isolation.
//
// Pure JS by contract, exactly like reader-receipt.js and reader-paired.js: no
// node: imports, no crypto, no DOM. Moved here verbatim from api/read.js
// (behavior-preserving); read.js now imports these instead of defining them.

// Single forward pass that removes the two things Opus most often adds to
// otherwise-valid JSON: // and /* */ comments (it echoes the schema's inline
// comments), and trailing commas before } or ]. Everything INSIDE a string
// literal is copied byte-for-byte, so URLs ("https://…") and commas or braces
// in the prose are never touched. Only " toggles string state — never ' — so
// an apostrophe in the read ("don't") can't desync the scan.
export function cleanJsonish(s) {
  let out = "";
  let inStr = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    const next = s[i + 1];

    if (inStr) {
      out += c;
      if (c === "\\") {
        // copy the escaped char verbatim so \" / \\ can't end the string early
        if (i + 1 < s.length) { out += s[i + 1]; i++; }
      } else if (c === '"') {
        inStr = false;
      }
      continue;
    }

    if (c === '"') { inStr = true; out += c; continue; }

    // // line comment — skip to (and re-emit) the newline
    if (c === "/" && next === "/") {
      while (i < s.length && s[i] !== "\n") i++;
      if (i < s.length) out += "\n";
      continue;
    }
    // /* block comment */ — skip through the closer
    if (c === "/" && next === "*") {
      i += 2;
      while (i < s.length && !(s[i] === "*" && s[i + 1] === "/")) i++;
      i += 1; // sit on the '*'; loop ++ steps past the '/'
      continue;
    }
    // trailing comma — drop a comma whose next non-space char closes a list/object
    if (c === ",") {
      let j = i + 1;
      while (j < s.length && /\s/.test(s[j])) j++;
      if (s[j] === "}" || s[j] === "]") continue;
    }

    out += c;
  }
  return out;
}

// Tolerant extraction: the model is told JSON-only, but if it ever wraps the
// object in prose or a ``` code fence, take the outermost {...} (the fence and
// any prose sit outside the braces, so the slice drops them for free). Try a
// strict parse first so already-valid JSON is never mutated; only on failure
// run the comment/trailing-comma cleaner and parse again.
export function extractJson(text) {
  if (typeof text !== "string") return null;
  const a = text.indexOf("{");
  const b = text.lastIndexOf("}");
  if (a === -1 || b === -1 || b <= a) return null;
  const candidate = text.slice(a, b + 1);
  try {
    return JSON.parse(candidate);
  } catch {}
  try {
    return JSON.parse(cleanJsonish(candidate));
  } catch {}
  return null;
}
