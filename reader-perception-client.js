// reader-perception-client.js — pure, shared perception-tap vocabulary + option
// model (Reader v2 P3).
//
// ── THE PERCEPTION TAP IS TELEMETRY, NEVER VALIDATION (design §4). ─────────────
// These labels are the ONLY user-facing tap copy. None of them may imply the tap
// confirms accuracy: no "accurate", "correct", "confirmed", "right", "validated".
// The sentence "users confirm our accuracy" and every paraphrase are BANNED. The
// single-mode question asks whether the read LANDED (the only honest question when
// the person holds just one answer and cannot judge omission); the paired-mode
// question asks how big the delta FELT (real data — they hold both answers). A
// feeling, not a score.
//
// The five exact stored enums live here as the single source of truth, imported by
// BOTH the browser (workbench-app.jsx renders these options and emits the enum) and
// the server (api/reader-perception.js validates against them), so client and server
// provably agree on the vocabulary. Pure JS by contract — no DOM, no React, no
// node:, no imports — so a Node test exercises it directly.

export const SINGLE_PERCEPTION_VALUES = ["single_yes", "single_no"];
export const PAIRED_PERCEPTION_VALUES = ["paired_small", "paired_noticeable", "paired_large"];
export const ALL_PERCEPTION_VALUES = [...SINGLE_PERCEPTION_VALUES, ...PAIRED_PERCEPTION_VALUES];

// The tap prompt + options for a mode ("single" | "paired"), or null for anything
// else. Each option carries the exact enum it emits, so the client can never send a
// value outside the five above.
export function perceptionTap(mode) {
  if (mode === "single") {
    return {
      mode: "single",
      prompt: "Did this surface something you hadn't considered?",
      options: [
        { id: "yes", label: "Yes", value: "single_yes" },
        { id: "no", label: "No", value: "single_no" },
      ],
    };
  }
  if (mode === "paired") {
    return {
      mode: "paired",
      prompt: "How big did the difference feel?",
      options: [
        { id: "small", label: "Small", value: "paired_small" },
        { id: "noticeable", label: "Noticeable", value: "paired_noticeable" },
        { id: "large", label: "Large", value: "paired_large" },
      ],
    };
  }
  return null;
}

// Is `value` a legal enum for `mode`? The server's mode/value guard and the client
// both call this, so a single receipt can only ever carry single_* and a paired
// receipt only paired_*. A null/absent value (no tap made) is not legal for any
// mode — that is the graceful "nothing selected" state, never written.
export function isPerceptionValueForMode(mode, value) {
  if (mode === "single") return SINGLE_PERCEPTION_VALUES.includes(value);
  if (mode === "paired") return PAIRED_PERCEPTION_VALUES.includes(value);
  return false;
}

// The mode a given enum belongs to, or null. Lets the server derive the expected
// mode from a value without a receipt, and the client pick the right store.
export function perceptionModeForValue(value) {
  if (SINGLE_PERCEPTION_VALUES.includes(value)) return "single";
  if (PAIRED_PERCEPTION_VALUES.includes(value)) return "paired";
  return null;
}
