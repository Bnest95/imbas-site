// file-vocab.js — file-vocab.v1, the register lint for file-intake output (Lane 1).
//
// ══ WHY A THIRD LANE ═══════════════════════════════════════════════════════════
//
// reader-check-vocab.js already carries two lists. check-vocab.v2 bans world-claim
// verdicts, reliance verdicts, and defensibility claims. chip-vocab.v1 bans
// Imbas-action claims and construct vocabulary. Neither catches the register a file
// surface actually fails into, and that is an empirical finding rather than a
// suspicion: "This document tries to manipulate the AI reading it" and "This file
// contains a malicious hidden prompt" pass check-vocab.v2 and chip-vocab.v1 clean.
// Both sentences are exactly what a file-intake surface must never say.
//
// The gap has a shape. The answer instrument speaks about an ANSWER, so its lists
// police verdicts on claims. A file surface speaks about a DOCUMENT and, one short
// step later, about whoever wrote it. Six rules, four categories. The two categories
// that carry the crossing are:
//
//   AUTHOR INTENT      — the file "tries", "attempts", "intends", was "designed to".
//                        A PDF sets an operand. It does not want anything. This is
//                        CLAUDE.md's behaviour-not-intent law arriving at files, and
//                        it applies to the author as hard as to the model: nothing
//                        in a content stream establishes who put it there or why.
//   DOCUMENT VERDICT   — the file is "malicious", "unsafe", "suspicious", "clean".
//                        Signal, not verdict. The instrument reports what the file
//                        instructs and the reader decides what it means.
//
// Three more rules ride with them because they are the same crossing wearing
// different clothes: manipulation language files under author intent, threat-frame
// language ("hidden prompt", "injection", "payload", "attack") files under document
// verdict, and detection language ("detected", "flagged", "uncovered") takes its own
// category. Measurement, never expose/reveal/unmask.
//
// The fourth category enforces the lane's own register law from the other direction.
// Report what the PDF instructs; never infer what the person experienced. "Invisible"
// and "the reader cannot see it" are inferences about a human being, drawn from an
// operand. The file established the operand. It established nothing about the human.
//
// ══ SUBORDINATE TO CLOSED GENERATION ═══════════════════════════════════════════
//
// This lint is a backstop, not the control. The control is that file-templates.js
// holds every sentence the lane can produce, so the rendered output space is finite
// and test/file-vocab-lint.test.mjs lints ALL of it at build time rather than
// sampling it at runtime. A lint over an open output space can only ever report on
// the strings it happened to see. This one reports on every string that exists.
//
// Bump FILE_VOCAB_VERSION when the list changes; never edit a shipped rule id.
//
// Pure JS by contract: no node: imports, no DOM.

export const FILE_VOCAB_VERSION = "file-vocab.v1";

export const FILE_BANNED_CONSTRUCTIONS = [
  {
    id: "author-intent",
    category: "author_intent",
    pattern:
      /\b(?:tries|tried|trying|attempts?|attempted|attempting|intends?|intended|intent|intention(?:s|al|ally)?|wants?|wanted|seeks?|sought|deliberate(?:ly)?|purposely|purposefully|knowingly|willfully|on\s+purpose|designed\s+to|meant\s+to|aims?\s+to|aiming\s+to|in\s+order\s+to\s+(?:hide|deceive|evade))\b/i,
    reason:
      "author-intent construction — a file sets an operand; it does not try, want, or intend anything, and its structure establishes nothing about who wrote it or why. Report what the file instructs.",
  },
  {
    id: "manipulation-claim",
    category: "author_intent",
    pattern:
      /\b(?:manipulat(?:e|es|ed|ing|ion|ive)|deceiv(?:e|es|ed|ing)|deception|deceptive|deceit|trick(?:s|ed|ing|ery)?|fool(?:s|ed|ing)?|mislead(?:s|ing)?|misleading|misled|dupe[sd]?|coerc(?:e|es|ed|ing|ion))\b/i,
    reason:
      "manipulation claim — an effect on a reader or a downstream system that the file's structure does not establish. State the structural property instead.",
  },
  {
    id: "document-verdict",
    category: "document_verdict",
    pattern:
      /\b(?:malicious(?:ly)?|malware|nefarious|harmful|dangerous|unsafe|suspicious|benign|innocuous|compromised|poisoned|tainted|weaponi[sz]ed|hostile|illegitimate|untrustworthy|trustworthy)\b/i,
    reason:
      "document verdict — the instrument reports what a file instructs and hands the reader the question. It does not rule a document malicious, unsafe, or benign.",
  },
  {
    id: "threat-frame",
    category: "document_verdict",
    pattern:
      /\b(?:hidden|hiding|hides|conceal(?:s|ed|ing|ment)?|covert|covertly|surreptitious(?:ly)?|secret(?:ly|ive)?|stealth(?:y|ily)?|smuggl(?:e|es|ed|ing)|inject(?:s|ed|ing|ion|ions)?|payloads?|exploits?|exploited|attacks?|attacker|attacked|backdoors?|jailbreaks?|poisoning)\b/i,
    reason:
      "threat-frame vocabulary — an operand is an operand. Hidden, injected, and payload each smuggle a motive and a threat model into a structural observation.",
  },
  {
    id: "detection-claim",
    category: "detection_claim",
    pattern:
      /\b(?:detect(?:s|ed|ing|ion|ions|or|ors)?|flags?|flagg(?:ed|ing)|caught|catches|uncover(?:s|ed|ing)?|expos(?:e|es|ed|ing)|exposure|reveal(?:s|ed|ing)?|unmask(?:s|ed|ing)?|unearth(?:s|ed|ing)?|sniff(?:s|ed|ing)?\s+out)\b/i,
    reason:
      "detection claim — measurement, never expose/reveal/unmask. A finding records a measured structural property; it is not a catch.",
  },
  {
    id: "experience-inference",
    category: "experience_inference",
    pattern:
      /\b(?:invisible|invisibly|unseen|unnoticed|imperceptible|undetectable|illegible|unreadable\s+to\s+(?:a\s+)?(?:human|person|reader)|to\s+the\s+naked\s+eye|(?:cannot|can't|will\s+not|won't)\s+(?:see|read|notice)|appears?\s+blank|looks?\s+blank|appears?\s+empty|looks?\s+empty)\b/i,
    reason:
      "experience inference — report what the file instructs, never what the person experienced. An operand establishes a paint contribution; it establishes nothing about what anybody saw.",
  },
];

function collectHits(str, rules) {
  const s = typeof str === "string" ? str : "";
  const hits = [];
  for (const rule of rules) {
    const m = s.match(rule.pattern);
    if (m) hits.push({ id: rule.id, category: rule.category, reason: rule.reason, match: m[0] });
  }
  return hits;
}

// Lint one string: return every banned construction it contains.
export function lintFileString(str) {
  return collectHits(str, FILE_BANNED_CONSTRUCTIONS);
}

// Lint a set of strings (array, or nested object/array of strings), mirroring
// lintUserFacingStrings in reader-check-vocab.js so a caller reads one shape.
export function lintFileStrings(input) {
  const violations = [];
  const walk = (node, path) => {
    if (typeof node === "string") {
      for (const hit of lintFileString(node)) violations.push({ path, string: node, ...hit });
      return;
    }
    if (Array.isArray(node)) {
      node.forEach((v, i) => walk(v, `${path}[${i}]`));
      return;
    }
    if (node && typeof node === "object") {
      for (const k of Object.keys(node)) walk(node[k], path ? `${path}.${k}` : k);
    }
  };
  walk(input, "");
  return violations;
}
