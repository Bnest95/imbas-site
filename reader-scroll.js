// reader-scroll.js — the one-time result-scroll decision, kept pure so the redesign
// rule "auto-scroll fires ONCE on the result transition, never on subsequent
// result-state rerenders" is unit-testable without a DOM.
//
// The Workbench holds a small { armed } state in a ref and feeds every readerResult
// change through nextResultScroll. scroll === true only on the transition INTO a
// result. A receipt tap, an Act 2 state change, or an async field update keeps
// hasResult === true across rerenders, so none of them re-fire the scroll. Clearing
// the result (editing an input, switching mode/case) re-arms the next scroll.
//
// Pure JS by contract, like reader-receipt.js / reader-paired.js: no DOM, no React,
// no imports — so a Node test can exercise the state machine directly.

export function initialScrollState() {
  return { armed: true };
}

// state: { armed: boolean }, hasResult: boolean
// -> { state, scroll }
export function nextResultScroll(state, hasResult) {
  const armed = state && typeof state.armed === "boolean" ? state.armed : true;
  if (!hasResult) {
    // Result cleared — re-arm so the next real result scrolls exactly once.
    return { state: { armed: true }, scroll: false };
  }
  if (armed) {
    // Transition into a result — scroll once, then disarm for this run.
    return { state: { armed: false }, scroll: true };
  }
  // Same run re-rendered (receipt tap, Act 2, async field update) — never yank.
  return { state: { armed: false }, scroll: false };
}
