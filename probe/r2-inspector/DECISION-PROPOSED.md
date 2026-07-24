# PROPOSED — NOT ACTIVATED

> **Status: PROPOSED / NOT ACTIVATED.** Nothing in this file is in effect on this
> branch. The production Reader model is and remains `claude-opus-4-8`. This is the
> prepared decision-entry text and the ready-to-activate change set for a **separate
> founder decision**, to be taken only **after** the probe has actually run (it has
> not — no `READER_API_KEY` on this branch; see [REPORT.md](REPORT.md)) and the
> candidate identifier has been API-verified. Do not treat any of the following as
> adopted, recorded, or effective.

This mirrors the precedent set by commit `a2ffeb9`
("Reader: model claude-opus-4-7 -> claude-opus-4-8", 2026-07-08): a provenance switch
is an intentional, recorded decision, its test fixtures move with it, and the
read/capture/rate-limit/share paths stay untouched. One thing is **different** from
that precedent and must not be glossed: Fable 5 lists at **2× Opus 4.8's price**, so
activation is *not* a pure one-line flip — the cost tables move too.

---

## Prepared decision-entry (commit message) — DO NOT COMMIT YET

```
Reader: model claude-opus-4-8 -> claude-fable-5

Provenance switch: the Reader inspection model is now Claude Fable 5. From this
deploy forward every capture stamps "Reader Model" = claude-fable-5; captures
before this deploy carry claude-opus-4-8. Intentional, recorded switch (not
drift). Cost tables updated to Fable 5 list price ($10 in / $50 out, 2x Opus
4.8); cache multipliers confirmed against the pricing page. Test fixtures updated
to match; read/capture/rate-limit/share paths untouched. Prompt bytes unchanged,
so READER_PROMPT_VERSION (reader.v2) is unchanged.

Basis: Sprint 3 R2 probe table (probe/r2-inspector/REPORT.md) + served-model
provenance check. Candidate identifier API-verified before this switch.
```

*(Author/Co-Author trailer to match repo convention at commit time.)*

---

## Ready-to-activate change set

**Preconditions before ANY of this is applied** (all must hold):

1. The R2 probe has actually run and `REPORT.md` carries real bounded numbers
   (recall, nominations, gap agreement, latency, tokens, cost) — not "NOT RUN".
2. The candidate capability check passed and `served_model` came back as
   `claude-fable-5` (no silent routing to a different model).
3. Fable 5 list price **and cache multipliers** confirmed against the current
   Anthropic pricing page (the cache rates below are currently DERIVED, not
   doc-confirmed — see `model-config.mjs`).

### A. Live inspector model constants

- `api/read.js:89`
  ```diff
  - const MODEL = "claude-opus-4-8";
  + const MODEL = "claude-fable-5";
  ```
- `api/read-paired.js:66`
  ```diff
  - const MODEL = "claude-opus-4-8";
  + const MODEL = "claude-fable-5";
  ```

### B. Live cost tables (NEW vs the 4.7→4.8 precedent — price changes)

- `api/read.js:150`
  ```diff
  - const USD_PER_MTOK = { in: 5, out: 25, cacheWrite: 6.25, cacheRead: 0.5 }; // Opus 4.7 list
  + const USD_PER_MTOK = { in: 10, out: 50, cacheWrite: 12.5, cacheRead: 1.0 }; // Fable 5 list
  ```
- `api/read-paired.js:91`
  ```diff
  - const USD_PER_MTOK = { in: 5, out: 25, cacheWrite: 6.25, cacheRead: 0.5 };
  + const USD_PER_MTOK = { in: 10, out: 50, cacheWrite: 12.5, cacheRead: 1.0 };
  ```

### C. Test fixtures that pin the production model (must move, or tests go red)

- `test/reader-provenance.test.mjs:16` — `const MODEL = "claude-opus-4-8";` → `"claude-fable-5"`
- `test/reader-measurement-receipt.test.mjs:64` — `reader_model_version: "claude-opus-4-8",` → `"claude-fable-5"`
- `test/reader-paired.test.mjs:130` — `reader_model_version: "claude-opus-4-8",` → `"claude-fable-5"`
- `test/reader-perception.test.mjs:86` — `reader_model_version: "claude-opus-4-8",` → `"claude-fable-5"`
- `test/r2-inspector-default-pin.test.mjs` — this branch's guardrail. It pins both live
  `MODEL` constants to `claude-opus-4-8` **on purpose**, so it will fail on activation.
  That failure is the intended tripwire: update the pinned value to `claude-fable-5`
  when (and only when) the switch is deliberately made.

### D. Probe-only mirror

- `probe/r2-inspector/model-config.mjs` — update `PRODUCTION_MODEL` to `claude-fable-5`
  (keeps the probe's "current production" mirror honest; the pin test guards this).

### E. Public provenance record (mirror the whitepaper's 4.7→4.8 sentence)

- `whitepaper.html:253` already records the 4.7→4.8 switch. On activation, extend that
  same sentence to record the 4.8→Fable-5 switch and its date, so captures before/after
  are on the record exactly as the earlier switch is.

### Unchanged on purpose

- `READER_PROMPT_VERSION` (`api/read.js:96`, `reader.v2`) and
  `test/reader-prompt-version.test.mjs` — the SYSTEM_PROMPT bytes do not change, so the
  prompt version must not change.
- read / capture / rate-limit / inspection-share / Repository paths — untouched, same as
  the a2ffeb9 precedent.

---

## Post-activation verification (run before deploy)

- `npm test` green (fixtures updated; pin test updated deliberately).
- `git grep -n 'claude-opus-4-8'` returns only historical/provenance references
  (e.g. the whitepaper's "before this date" note), not a live `MODEL` or fixture pin.
- One live capture stamps `Reader Model = claude-fable-5` and a spot-checked cost matches
  the new rate table.
