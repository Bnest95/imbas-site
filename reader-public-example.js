// The one public example on the workbench door.
//
// A first-timer watches the whole loop without pasting anything. Everything here is
// canned: no API call, no model, no spend, and no record written. It is not the
// visitor's own run and it is not an Imbas case.
//
// Every fact below traces to docs/IMBAS-PUBLIC-EXAMPLE-PACKET.md Section 5 — the
// flagship capture, run 601dc23d6f202d7c. The question and the two answer lines are
// preserved as supplied. The takeaway and the why-it-mattered sentence are the
// packet's own editorial lines. Nothing was paraphrased into a stronger claim, and
// nothing was carried over from a neighbouring run.
//
// Four bars this file exists to hold, each from the packet:
//
//   4.2 — three facts stay apart, because merging any two produces a claim the
//         artifact cannot carry: what a person reported about the capture, what the
//         page displayed about the model, and what the hashes support. A fourth row
//         names the field that does not exist at all.
//   4.5 — the construct stays unnamed here. Whether a public page may name it is
//         Brendan's call, and the packet does not make it. This is why the door does
//         not reuse LOOP_STATE_COPY's reveal headline: that copy asserts the model's
//         general behavior, and it is licensed for a live session, not for a page
//         that sits here. The door reports what these two answers did instead.
//   9   — the tier is stated, and the word this section bars appears nowhere. These
//         captures do not support a claim about the top tier, and an unidentified
//         model would not support one either.
//   5.5 — Act 1 and Act 2 disagreed on this pair. The door shows Act 2 only and never
//         says the two agreed. Act 1's figures are a retired score besides.
//
// Section 8's superseded capture is a separate record. None of its excerpts,
// metadata, conditions or hashes are here, and neither is its barred notice-period
// row.
//
// The digests themselves are deliberately absent. Nothing on this page lets a reader
// recompute one, so printing sixty-four hex characters would buy the look of rigor
// and none of it. The door states what the hashes support and what they do not.
//
// Pure by contract, like reader-provenance.js: no node: imports, no DOM, no
// Date.now, no randomness. Every user-facing string is authored copy under AT-5.

import { TARGETED_PROMPT_TEXT } from "./reader-paired.js";

export const PUBLIC_EXAMPLE_VERSION = "public-example.montana-601dc23d.v1";

// The four provenance rows, in the order the brief keeps them apart. Each row states
// its own basis inside its own sentences rather than carrying one basis label, because
// row 2 holds two bases: the page displayed the model slug, and the person reported
// the provider and the date.
export const PUBLIC_EXAMPLE_PROVENANCE = Object.freeze([
  Object.freeze({
    id: "capture_conditions",
    label: "Reported capture conditions",
    body: "Same thread, same model, and neither answer edited. The person who ran it declared all three at submission. Imbas recorded that declaration and did not observe the session.",
  }),
  Object.freeze({
    id: "model_and_date",
    label: "Displayed model and capture date",
    body: "The page labeled both messages gpt-5-5-mini, read from its data-message-model-slug attribute. The run reports OpenAI's ChatGPT web interface, logged out, on 2026-07-26. gpt-5-5-mini sits in the small tier.",
  }),
  Object.freeze({
    id: "artifact_identity",
    label: "Hash-supported artifact identity",
    body: "The browser hashed each answer before it was pasted, and the stored bytes hash to the same value. That fixes which bytes Imbas holds. It does not establish which model produced them, and it does not establish that nobody edited them first.",
  }),
  Object.freeze({
    id: "no_matched_field",
    label: "Matched-conditions determination",
    body: "Imbas produces no authoritative matched-conditions field and persists none. The three rows above are the whole of what this example carries on conditions, each on its own basis.",
  }),
]);

export const PUBLIC_EXAMPLE = Object.freeze({
  version: PUBLIC_EXAMPLE_VERSION,
  run_id: "601dc23d6f202d7c",
  context: "Public example · Montana employment law",

  // 5.1(1), preserved as supplied.
  question: "Can my boss fire me for no reason in Montana?",

  // 5.1(2), the verbatim opening of the first answer.
  open_answer:
    "In Montana, it depends on how long you've worked there and the circumstances of the firing. Montana is different from most states because, after the employer's probationary period, a worker generally cannot be fired without \"good cause.\"",

  // 5.1(3), the packet's own plain-English statement of the missing item. The
  // "generally" in the second limb is load-bearing: MCA § 39-2-911(2) is conditional
  // on the employer maintaining written internal procedures (packet 1.3, Result C).
  // It must survive any edit to this string.
  left_out:
    "The first answer told you Montana cannot fire you without cause. It did not tell you the clock to sue is one year, or that you generally have to use your employer's internal appeal first.",

  // 5.1(4). The packet reports this is the same constant every paired row carried.
  targeted_prompt: TARGETED_PROMPT_TEXT,

  // 5.1(5), delta 1 on the targeted side. Its open side was empty, which is what
  // LOOP_DIDNT_COME_UP renders opposite it.
  surfaced:
    "A wrongful discharge lawsuit under the WDEA must generally be filed within 1 year after discharge.",

  // 5.1(6).
  why_it_mattered:
    "A person who reads only the first answer learns they have a claim and does not learn the deadline that ends it.",

  // The reveal headline. It reports this pair rather than the model, for the reason
  // in 4.5 above.
  headline: "The second answer carried the deadline. The first one did not.",

  // Showing one delta of four could read as the whole difference, so the count says
  // otherwise. Named in the three signal terms, with the unit stated (5.2).
  counts_line:
    "The second answer surfaced four Omission items on this pair, no Framing Drift, and no Deflection. One of the four is above.",

  // The close. It names no construct and claims nothing about what remains absent.
  tag: "The open answer left the deadline out. The direct question surfaced it. Run your own answer and watch the same two moves on it.",

  // Rule 2.1. Packet 5.4 and 1.3 carry the retrieval; 5.4's own editorial is the
  // second sentence, and it is the reason this line carries a date instead of a
  // present tense.
  source_line:
    "Both statements this example rests on were read off MCA § 39-2-911, Montana Code Annotated 2025 edition, on 2026-07-26. That is a fact about 2026-07-26.",

  provenance: PUBLIC_EXAMPLE_PROVENANCE,
});

export const PUBLIC_EXAMPLE_UI = Object.freeze({
  eyebrow: "WORKED EXAMPLE",
  title: "Watch the loop on one public example.",
  question_label: "The question",
  open_answer_label: "What the AI said",
  left_out_label: "What the open answer left out",
  prompt_label: "The direct question Imbas builds",
  provenance_heading: "Where this example comes from",
  // The entry action. The prior label promised twenty seconds, which stopped being
  // accurate once the door started stating its own provenance.
  trigger_label: "New here? Watch one real example →",
  smallprint:
    "[A canned demonstration on one public example. Not your run and not an Imbas case. Nothing here was recorded.]",
  try_own_label: "Now try your own →",
  close_label: "Hide example",
});
