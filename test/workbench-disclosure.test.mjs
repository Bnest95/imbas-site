// The render tree must actually CONSUME the stage contract.
//
// test/reader-stage.test.mjs proves the model is sound: no reachable state exposes two
// answer-entry inputs. That proof is worth nothing if workbench-app.jsx renders its
// textareas unconditionally and ignores the model — which is exactly what produced the
// production bug (four answer textareas on one result page).
//
// workbench-app.jsx is JSX and cannot be imported by Node, so this reads it as source,
// following test/inspection-meaning-findings-source.test.mjs. Two kinds of assertion:
//
//   1. A PINNED INVENTORY of every answer-entry input in the file, keyed by its
//      enclosing function. Adding a textarea anywhere in the workbench fails this test
//      until someone writes down which stage owns it. That is the point: "four
//      textareas fixed" must not quietly become five.
//   2. BINDINGS — each input or panel is gated on the view flag that governs it, by
//      name. A gate on some other boolean would pass a count-the-boxes snapshot and
//      fail here.
//
// Run: node --test test/workbench-disclosure.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SRC_PATH =
  process.env.WORKBENCH_APP_JSX ||
  fileURLToPath(new URL("../workbench-app.jsx", import.meta.url));
const SRC = readFileSync(SRC_PATH, "utf8");
const LINES = SRC.split("\n");

// Nearest preceding top-level `function Name(`. Every component in this file is declared
// that way, so this names the owner of any line without parsing JSX.
function enclosingFunction(lineIndex) {
  for (let i = lineIndex; i >= 0; i--) {
    const m = /^function ([A-Za-z0-9_]+)\s*\(/.exec(LINES[i]);
    if (m) return m[1];
  }
  return "(top level)";
}

// Every answer-entry input in the file, as `Owner:tagOrComponent`, in source order.
function inputInventory() {
  const out = [];
  LINES.forEach((line, i) => {
    const m = /<(textarea|PasteField)\b/.exec(line);
    if (m) out.push(`${enclosingFunction(i)}:${m[1]}`);
  });
  return out;
}

// The self-closing tag that CONTAINS `anchor`, for attribute assertions. Searches
// backwards from the anchor, so an anchor on an inner attribute line resolves to its own
// element rather than the next one down the file.
function tagBlock(anchor, tag) {
  const at = SRC.indexOf(anchor);
  assert.notEqual(at, -1, `source must contain: ${anchor}`);
  const open = SRC.lastIndexOf(`<${tag}`, at);
  assert.notEqual(open, -1, `${anchor}: expected an enclosing <${tag}`);
  const end = SRC.indexOf("/>", open);
  assert.notEqual(end, -1, `${anchor}: <${tag} must be self-closing`);
  assert.ok(end > at, `${anchor}: must sit inside the <${tag} that precedes it`);
  return SRC.slice(open, end);
}

const COLLAPSED = SRC.replace(/\s+/g, " ");

// ── The pinned inventory ───────────────────────────────────────────────────────

test("every textarea in the workbench is accounted for, by owner", () => {
  assert.deepEqual(inputInventory(), [
    // The shared primitive. Every PasteField below renders through this one element,
    // which is why gating readOnly here covers all of them.
    "PasteField:textarea",
    // The curated case-contribution flow, deep inside a step-gated wizard on a separate
    // page section. Never on screen with the Reader console.
    "Curated:PasteField",
    // "Suggest an Investigation" — a suggestion form, not an answer-entry field, and
    // collapsed behind an explicit expand in both variants.
    "SuggestInvestigation:textarea",
    "SuggestInvestigation:textarea",
    // The inspection lane's paired answer. Stage: compare.
    "PairedTest:PasteField",
    // The chip lane's two boxes. The first goes read-only the moment the second appears.
    "ChipLane:PasteField",
    "ChipLane:PasteField",
    // The console's own compose fields: guided answer, own answer, own question.
    "ReaderWorkbench:PasteField",
    "ReaderWorkbench:PasteField",
    "ReaderWorkbench:textarea",
  ], "a new answer-entry input must name the stage that owns it before this test passes");
});

// ── The stage is derived, and the gate reads from it ───────────────────────────

test("the stage is derived from the data, never stored as state", () => {
  assert.ok(
    /const stage = deriveStage\(\{/.test(SRC),
    "stage must come from deriveStage, so it cannot drift from what exists",
  );
  assert.ok(
    !/useState\([^)]*STAGE_/.test(SRC),
    "no useState may hold a stage: a stored stage is a second source of truth",
  );
  assert.ok(/const view = stageView\(stage\);/.test(SRC), "the view must come from the stage");
});

test("composeLive is read off the view, not hand-rolled from local flags", () => {
  assert.ok(
    /const composeLive = view\.answerEntry === "compose-answer";/.test(SRC),
    "the compose gate must be the contract's own answer, not a parallel condition",
  );
});

// ── The compose fields ─────────────────────────────────────────────────────────

test("the shared PasteField forwards read-only to the element and announces it", () => {
  assert.ok(
    /function PasteField\(\{[^}]*readOnly = false/.test(SRC),
    "PasteField must accept readOnly",
  );
  const block = tagBlock("readOnly={readOnly || undefined}", "textarea");
  assert.ok(/readOnly=\{readOnly \|\| undefined\}/.test(block), "readOnly must reach the element");
  assert.ok(
    /aria-readonly=\{readOnly \|\| undefined\}/.test(block),
    "a screen reader must be told the field stopped accepting input",
  );
  assert.ok(/ref=\{inputRef\}/.test(block), "focus management needs a handle on the element");
});

test("all three compose inputs stop accepting input once compose is not the live stage", () => {
  const gated = LINES.filter((l) => /readOnly=\{!composeLive/.test(l));
  assert.equal(gated.length, 3, "guided answer, own answer, and own question — all three");
  // The question field is a bare textarea, so it needs its own aria-readonly.
  assert.ok(
    LINES.some((l) => /aria-readonly=\{!composeLive \|\| undefined\}/.test(l)),
    "the question textarea must announce its own read-only state",
  );
});

test("the answer stays visible as context, and there is a way back to editing it", () => {
  // Read-only without a reversal control is a trap: the compose fields are the only
  // route to a second answer, and a page reload must not be the way to reach them.
  assert.ok(/const editAnswer = \(\) => \{/.test(SRC), "an explicit edit control must exist");
  assert.ok(/onClick=\{editAnswer\}/.test(SRC), "and must be wired to something clickable");
  assert.ok(
    /setReaderResult\(null\);/.test(SRC.slice(SRC.indexOf("const editAnswer"), SRC.indexOf("const editAnswer") + 400)),
    "editing clears the result, which is what returns the stage to compose",
  );
});

// ── The paired lane ────────────────────────────────────────────────────────────

test("the paired answer input renders only when the follow-up stage is open", () => {
  assert.ok(
    /open=\{followUpOpen\}/.test(SRC),
    "Act2Offer must be told whether the compare stage is open",
  );
  const at = SRC.indexOf("<PairedTest");
  assert.notEqual(at, -1);
  const before = SRC.slice(Math.max(0, at - 400), at);
  assert.ok(
    /open \? \(/.test(before),
    "PairedTest must sit behind the open gate, not render alongside the offer",
  );
});

test("both doors into the compare stage exist, and both go through one handler", () => {
  // Gating on copy alone locks out anyone who reads the question and retypes it.
  assert.ok(
    /<Btn kind="ghost" onClick=\{onOpen\}>Paste what came back<\/Btn>/.test(COLLAPSED),
    "the second door must be a visible control, not a hidden fallback",
  );
  assert.ok(/if \(onOpen\) onOpen\(\);/.test(SRC), "the copy action must open the same stage");
  assert.ok(
    /const openFollowUp = \(\) => \{ if \(followUpOpen\) return; advance\(\); setFollowUpOpen\(true\); \};/.test(
      COLLAPSED,
    ),
    "one handler for both doors, so two entry points cannot emit two advances",
  );
});

// ── The chip lane ──────────────────────────────────────────────────────────────

test("the chip lane renders behind the view's own door, never unconditionally", () => {
  // `view.chipDoor` is still the stage decision that governs the door, and the reason it
  // exists is unchanged: it goes false at compare, where a paired answer box is already
  // live, so the lane's own answer box can never turn up beside it.
  //
  // The door now has two mount points and this is the late one, so the condition reads
  // with the follow-up stand-down attached. That subtracts one stage, and only because the
  // follow-up stage mounts the same control earlier, inside the result block. It adds no
  // stage: nothing here can put the door on a stage `stageView` withheld it from. See
  // test/chip-door-contract.test.mjs for the two mount points and the shared control.
  //
  // CORRECTED — the stand-down stage. It read STAGE_RESULT for one pass. STAGE_RESULT is
  // the degraded fallback path (act2 is null only when there is no measurement), so that
  // cut moved the door on error and capacity surfaces and left the successful read — which
  // is where the buried door was measured — alone. RESULT now keeps its late door.
  assert.ok(
    /\{view\.chipDoor && stage !== STAGE_FOLLOWUP \? chipDoorControl\(\) : null\}/.test(SRC),
    "the door is a stage decision: it closes where a paired input is live",
  );
  assert.ok(
    /\{stage === STAGE_FOLLOWUP \? chipDoorControl\(\) : null\}/.test(SRC),
    "and the stage it stands down for must be the one that mounts the same control earlier",
  );
  const at = SRC.indexOf("<ChipLane />");
  assert.notEqual(at, -1, "the lane must still exist");
  const before = SRC.slice(Math.max(0, at - 400), at);
  assert.ok(
    /\{chipMounted \? \(/.test(before),
    "the lane must not mount until it is opened — mounting it on first load put two answer boxes on the page, and fired chip_row_rendered for visitors who never saw the row",
  );
  assert.ok(
    /hidden=\{!view\.chipLane\}/.test(before),
    "and its visibility must be the view's decision, so a live paired input is never joined by a second box",
  );
});

test("closing the chip lane hides it instead of unmounting its answers", () => {
  // Closing is a reversal. A reversal that eats a half-typed answer is the same one-way
  // door the read-only fields would have been without an edit control.
  assert.ok(
    /const \[chipMounted, setChipMounted\] = useState\(\(\) => parseArrival\(window\.location\)\.lane === LANE_CHIPS\);/.test(
      SRC,
    ),
    "a ?start=chips arrival lands with the lane already mounted",
  );
  assert.ok(/setChipMounted\(true\);/.test(SRC), "opening the lane latches it mounted");
  assert.equal(
    (SRC.match(/setChipMounted\(/g) || []).length,
    1,
    "nothing may unlatch it: unmounting is what loses the answer",
  );
  assert.ok(
    /const closeChipLane = \(\) => setLane\(LANE_INSPECT\);/.test(SRC),
    "closing moves the lane, never the mount",
  );
});

test("the chip lane's first answer goes read-only as soon as its second box appears", () => {
  const block = tagBlock("CHIP_UI.compose.first_answer_label", "PasteField");
  assert.ok(
    /readOnly=\{!!entry\}/.test(block),
    "picking a follow-up opens a second box; the first must stop competing for keystrokes",
  );
  assert.ok(
    /CHIP_UI\.compose\.edit_first_answer/.test(SRC),
    "and a labelled way back out, so read-only is not a trap",
  );
});

// ── The standing loop ──────────────────────────────────────────────────────────

test("the restart loop renders only where the view allows it", () => {
  const at = SRC.indexOf("<SecondRunLoop");
  assert.notEqual(at, -1);
  const before = SRC.slice(Math.max(0, at - 200), at);
  assert.ok(
    /\{view\.loop \? \(/.test(before),
    "at the compare stage the loop offers a second question above a box meant for the first",
  );
});

// ── Focus and history ──────────────────────────────────────────────────────────

test("focus moves on a stage change and never on first paint", () => {
  assert.ok(
    /const focusStageRef = useRef\(null\);/.test(SRC),
    "the focus effect needs its own mount guard: prevStageRef is already consumed by then",
  );
  const at = SRC.indexOf("focusStageRef.current = stage;");
  assert.notEqual(at, -1);
  const after = SRC.slice(at, at + 300);
  assert.ok(
    /if \(prev === null \|\| prev === stage\) return;/.test(after),
    "no focus move on mount, and none when the stage did not move",
  );
  assert.ok(
    /focus\(\{ preventScroll: true \}\)/.test(after),
    "focus must not fight the scroll spine for the viewport",
  );
});

test("no stage change pushes a history entry", () => {
  assert.ok(
    !/history\.pushState/.test(SRC),
    "pushState would make browser Back unmount a stage and take typed content with it",
  );
  assert.ok(/window\.history\.replaceState/.test(SRC), "the hash is mirrored, not stacked");
});

test("the hash sync leaves the arriving hash alone on mount", () => {
  // replaceState fires no hashchange, so writing on mount would silently eat the
  // #wb-reader-console deep link before its handler ever reads it.
  assert.ok(/const hashSyncedRef = useRef\(false\);/.test(SRC));
  const at = SRC.indexOf("if (!hashSyncedRef.current) {");
  assert.notEqual(at, -1, "the hash effect must skip its first run");
  assert.ok(/return;/.test(SRC.slice(at, at + 500)));
});

// ── The result's own flags ─────────────────────────────────────────────────────

test("the follow-up flags are cleared by the result going away, in one place", () => {
  // Otherwise a second run inherits an open follow-up and skips its own result stage.
  const at = SRC.indexOf("if (readerResult) return;");
  assert.notEqual(at, -1, "one effect owns the reset");
  const block = SRC.slice(at, at + 200);
  assert.ok(/setFollowUpOpen\(false\);/.test(block));
  assert.ok(/setHasDelta\(false\);/.test(block));
  assert.equal(
    (SRC.match(/setFollowUpOpen\(false\)/g) || []).length,
    1,
    "a second reset site is a second thing to forget",
  );
});
