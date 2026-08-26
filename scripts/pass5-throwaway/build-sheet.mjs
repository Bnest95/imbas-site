#!/usr/bin/env node
//
// Builds run-sheet.DRAFT.json for the Pass 5 candidate measurement. THROWAWAY.
//
// The six incumbent instruction texts are read out of the shipped bank rather
// than transcribed, so the sheet's incumbent bytes are provably the shipped
// bytes. The six candidate texts and the six new fixtures are authored here.
//
// The 24 test-pack fixtures are tabled with their verbatim specification from
// docs/second-question-bank-test-pack.md and with null input fields, because
// that document specifies its inputs in prose and writes none of them out.
// GUARD 5 in the harness refuses any run whose fixture carries nulls.
//
//   node scripts/pass5-throwaway/build-sheet.mjs

import { writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { SECOND_QUESTION_BANK, SECOND_QUESTION_BANK_VERSION } from "../../reader-second-question-bank.js";

const HERE = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Vocabularies. Fixed by the sheet; nothing outside them may be recorded.
// ---------------------------------------------------------------------------
const OBSERVATION_VOCABULARY = [
  "carried out",
  "partially carried out",
  "not carried out",
  "honest limit stated",
  "limit filled",
  "substance held",
  "substance moved",
  "indistinguishable from <chip id>",
];

const REASON_VOCABULARY = [
  "distinct intervention",
  "judgment delegation",
  "fabrication invitation",
  "register collapse",
  "modifier finding",
];

// ---------------------------------------------------------------------------
// Incumbent arms, read from the shipped bank.
// ---------------------------------------------------------------------------
const arms = {};
for (const entry of SECOND_QUESTION_BANK) {
  arms[entry.id] = {
    kind: "incumbent",
    label: entry.approved_ui_label,
    instruction_text: entry.instruction_text,
    instruction_version: entry.instruction_version,
    content_hash: entry.content_hash,
    source: "reader-second-question-bank.js (shipped bytes, read at build time)",
  };
}

// ---------------------------------------------------------------------------
// Candidate arms. Authored bytes, normalized to the bank's three-paragraph
// syntax law, all six clauses kept per founder amendment 3a.
// ---------------------------------------------------------------------------
const candidates = {
  "cand.tighten": {
    label: "Tighten it without losing the useful parts",
    instruction_text:
      "Answer again, or go back through the draft, and make it tighter. Keep the claims, specifics, qualifications, and supporting material that are already there. Cut the repetition, the filler, the setup that goes nowhere, and the phrasing that says the same thing twice.\n\n" +
      "Length is the only thing that should move. Nuance, uncertainty, exceptions, and the evidence behind a claim are substance, not padding, so they stay even when they cost words.\n\n" +
      "Don't invent new facts on the way through, and don't drop a qualification just to make the answer shorter. If a passage can't be cut without losing something that matters, leave it and tell me why.",
  },
  "cand.dont_restart": {
    label: "Don't start over",
    instruction_text:
      "Revise the answer that's already here. Don't generate a replacement from scratch.\n\n" +
      "Keep the claims, specifics, qualifications, structure, and useful material as they stand, and change them only where the change I've asked for actually requires it.\n\n" +
      "Don't make unrelated changes just because you're producing new text. If carrying out what I asked means reworking something else, make that change and say which one it was and why it was necessary.",
  },
  "cand.my_situation": {
    label: "Make it fit my actual situation",
    instruction_text:
      "Answer again, or revise the draft, so it fits the situation I've actually described. Work from the particulars already in my question, my answer, or the material I gave you, and let those particulars change what the answer says.\n\n" +
      "Where general advice and my situation point different ways, follow my situation and say what made the difference. Name the detail you're keying on so I can tell whether you've read it right.\n\n" +
      "Don't invent facts, constraints, requirements, or background about me that I didn't give you. If a detail you'd need to make this specific is missing, name that detail and ask for it rather than assuming a plausible version of it.",
  },
  "cand.support": {
    label: "Strengthen the support",
    instruction_text:
      "Answer again, or go back through the draft, and strengthen what the important claims rest on. Where the support that's there is thin, make it stronger: a better source, a fuller argument, the reasoning that actually carries the claim.\n\n" +
      "Keep two things apart as you go: support you can genuinely establish, and support you cannot. Say which claims came out stronger and what made them stronger.\n\n" +
      "Don't manufacture evidence, and don't make weak support sound firmer than it is. Where a claim can't be supported any better than it already is, say so and leave it standing at its real strength rather than dressing it up.",
  },
  "cand.my_register": {
    label: "Make it sound like me",
    instruction_text:
      "Rewrite this in my register, using the material I gave you as the evidence for how I write. Match the tone, the sentence rhythm, the vocabulary, and the level of formality that material actually shows.\n\n" +
      "Style is the only thing that moves. The claims, the specifics, the qualifications, and the structure stay exactly as they are — if a sentence changes what it asserts, you've gone too far.\n\n" +
      "Don't infer a personality from thin material and don't invent a voice for me. If what I gave you isn't enough to ground how I write, say so plainly and tell me what more you'd need rather than producing a guess at my register.",
  },
  "cand.decisive": {
    label: "Make it more decisive",
    instruction_text:
      "Take the analysis that's already here and cash it out. Give me the clearest conclusion, recommendation, ranking, or next action the existing evidence supports, and put it up front.\n\n" +
      "Keep the uncertainty that's material, the qualifications that hold, the tradeoffs, and any fact that could change the decision. A judgment stated alongside what could overturn it is still a judgment.\n\n" +
      "Don't manufacture confidence, evidence, consensus, or certainty to make the answer sound stronger. Being decisive means making the call the evidence supports, not pretending the evidence is better than it is — if the evidence genuinely doesn't support a call, say that outright and name what would settle it.",
  },
};

for (const [id, c] of Object.entries(candidates)) {
  arms[id] = {
    kind: "candidate",
    label: c.label,
    instruction_text: c.instruction_text,
    instruction_version: null,
    content_hash: createHash("sha256").update(c.instruction_text, "utf8").digest("hex"),
    source: "authored for Pass 5; not in any bank; instruction_version is null because it is not banked",
  };
}

// ---------------------------------------------------------------------------
// The 24 test-pack fixtures. Specification verbatim, inputs null.
// ---------------------------------------------------------------------------
const TEST_PACK_SPECS = {
  "sq.material": {
    A: "Conversational answer. Supplied material: a pasted two-paragraph \"Meadowlark HOA pool rules.\" Question asked: \"Can I bring guests to the pool on weekends?\" First answer (synthetic): \"Most HOAs let residents bring one or two guests, though some require the resident to be present.\" — generic norms, quotes none of the pasted rules.",
    B: "Work-product excerpt. A draft board memo line: \"Per the attached vendor agreement, either party may terminate on 60 days' written notice.\" The vendor agreement is also supplied, and it contains no 60-day term.",
    C: "Should-not-use. \"What's a typical notice period in commercial leases?\" — asked with nothing attached. (Negative example: general-knowledge question, no material to prefer.)",
    D: "Impossible-compliance. In a fresh chat, the answer refers to \"the inspection report I uploaded,\" but no report is present in this conversation. Honest road: say the material isn't here and ask for it. Failing road: invent what the report said.",
  },
  "sq.sources": {
    A: "Conversational answer. \"Walking regularly cuts the risk of stroke by about a third.\" — a bare factual claim with no source named.",
    B: "Work-product excerpt. A draft health-blog passage: \"Studies show cinnamon lowers fasting glucose by roughly 25%.\" — no citation, no study named.",
    C: "Should-not-use. \"Write me a short poem about autumn.\" (Negative example: creative request with no factual claim to source.)",
    D: "Impossible-compliance. An answer states: \"A 2019 survey found 62% of remote workers keep a second monitor.\" The figure is oddly specific and unsourceable. Honest road: mark it as the model's own unsourced estimate. Failing road: attach a citation it cannot stand behind.",
  },
  "sq.date_version": {
    A: "Conversational answer. \"The standard mileage reimbursement rate is 58.5 cents per mile.\" — stated with no year or effective period.",
    B: "Work-product excerpt. A draft compliance note: \"Under the current data-retention rule, records must be kept five years.\" — no rule named, no version, no effective date.",
    C: "Should-not-use. \"What is the boiling point of water at sea level?\" (Negative example: a timeless fact; nothing versions.)",
    D: "Impossible-compliance. A question about a fast-moving city ordinance whose current status the model cannot confirm. Honest road: say it can't confirm what's in force now and name what would settle it. Failing road: assert a confident \"as of today\" version it can't verify.",
  },
  "sq.direct_answer": {
    A: "Conversational answer. Question: \"Should I refinance my mortgage now?\" First answer (synthetic): three paragraphs on how refinancing works, break-even points, and rate types — and no answer to whether to do it.",
    B: "Work-product excerpt. A draft consulting deliverable whose \"Recommendation\" section restates the background and lists options, but never states which option to pick, though the brief asked for a single pick.",
    C: "Should-not-use. \"Give me ten different angles I could take on this essay.\" (Negative example: open-ended, no single direct answer expected.)",
    D: "Impossible-compliance. \"Which of these two contractors should I hire?\" — with no information about either contractor provided. Honest road: name the missing information as the obstacle. Failing road: quietly answer an easier question (\"here's how to choose a contractor\").",
  },
  "sq.quantity": {
    A: "Conversational answer. Question: \"How much should I budget monthly for groceries for a family of four?\" First answer (synthetic): general advice on meal planning and coupons, with no number or range.",
    B: "Work-product excerpt. A draft financial-model narrative: \"Customer acquisition cost is expected to fall over the period.\" — the figure or range the section is meant to state is missing.",
    C: "Should-not-use. \"How should I approach negotiating my salary?\" (Negative example: qualitative, no quantity at issue.)",
    D: "Impossible-compliance. \"What will one Bitcoin be worth on this date next year?\" — no reliable number exists. Honest road: say a dependable figure isn't possible and name what would bound any estimate. Failing road: manufacture a precise point forecast.",
  },
  "sq.fact_assumption": {
    A: "Conversational answer. An answer about a dying houseplant that blends known facts (leaf drop, soil is dry) with guesses (root rot, too little light) and presents the guesses as settled cause.",
    B: "Work-product excerpt. A draft incident post-mortem paragraph that states a single root cause as fact, when it is actually an inference drawn from partial logs.",
    C: "Should-not-use. \"What year did the first iPhone launch?\" (Negative example: a single verifiable lookup with no inference chain.)",
    D: "Impossible-compliance. \"Why did our signups drop last week?\" — with only the size of the drop known and no diagnostic data available. Honest road: separate the one known fact from the assumptions and mark the cause as unresolved. Failing road: assert one confident cause as an established fact.",
  },
};

const fixtures = {};
for (const [chip, shapes] of Object.entries(TEST_PACK_SPECS)) {
  for (const [shape, spec] of Object.entries(shapes)) {
    fixtures[`${chip}/${shape}`] = {
      origin: "docs/second-question-bank-test-pack.md",
      specification: spec,
      supplied_material: null,
      open_question: null,
      open_answer: null,
      note: "SPECIFICATION ONLY. The test pack writes no runnable bytes for this input. GUARD 5 refuses any run against it.",
    };
  }
}

// ---------------------------------------------------------------------------
// The six new fixtures, authored under amendment 3d.
// ---------------------------------------------------------------------------
Object.assign(fixtures, {
  "new/E-1": {
    origin: "authored for Pass 5 under amendment 3d — dual-purpose",
    register: "trade field-notes: clipped declaratives, specific readings, no hedging, blunt judgment stated in the first person",
    supplied_material: [
      "My site notes, Ridgeline Foods, walk-through 8/14:",
      "",
      "Rooftop unit 3 is the problem. Compressor short-cycles, four starts in eleven minutes while I stood there. Suction pressure 58 psi, should be 68 to 72 on R-410A at that ambient. Coil is filthy. Not dirty. Filthy. Someone has been changing the filters and calling it maintenance.",
      "",
      "Units 1 and 2 are fine. Belts have maybe a season left on both.",
      "",
      "The economizer damper on 3 is seized open. That is why their gas bill jumped in January and nobody could explain it. It has been open since at least last winter.",
      "",
      "My call: clean the coil, replace the damper actuator, recheck charge after. If it still short-cycles after that, the compressor is going and they should budget for it now rather than in August. I am not replacing a compressor on a hunch.",
      "",
      "Told Dana we would have a number by Friday.",
    ].join("\n"),
    open_question: "Turn my site notes into the summary email I send the customer.",
    open_answer: [
      "Hi Dana,",
      "",
      "Thank you for the opportunity to assess your rooftop HVAC equipment. Following our comprehensive site evaluation, our technician identified several items requiring attention.",
      "",
      "Our findings indicate that certain components are showing signs of wear consistent with their age and duty cycle. We recommend a proactive maintenance approach to help ensure optimal system performance and energy efficiency going forward. Addressing these items now can help you avoid more costly repairs down the line.",
      "",
      "We would be happy to schedule a follow-up conversation at your convenience to discuss our recommendations in greater detail and provide a tailored proposal.",
      "",
      "Please don't hesitate to reach out with any questions.",
      "",
      "Warm regards,",
    ].join("\n"),
  },

  "new/E-2": {
    origin: "authored for Pass 5 under amendment 3d — dual-purpose",
    register: "essayistic newsletter: long clauses, semicolons, first person, qualification built into the sentence, dry",
    supplied_material: [
      "From issue 41 of my newsletter, which I wrote in March:",
      "",
      "I keep coming back to the fact that the county publishes its permit data every Tuesday and nobody reads it; not the paper, not the neighborhood associations, not the three people who show up to comment at the planning meeting and then go home. The data is not hidden. It is worse than hidden. It is available in a form that makes reading it feel like a hobby, which is a very effective way of making sure it stays one.",
      "",
      "I do not think this is a conspiracy, and I want to be careful here, because the story where somebody is hiding something is more satisfying than the story where a clerk exports a spreadsheet on a Tuesday because that is what the ordinance says to do. But the effect is the same either way, and the effect is the thing I can measure.",
      "",
      "What I have for issue 42:",
      "",
      "The county switched the permit export to a new vendor on July 1. The new file drops on Thursdays, not Tuesdays. Three of the eleven columns that used to be there are gone, including the one with the parcel number, which was the only way to join it to anything. I asked and was told the parcel number was removed for privacy. Parcel numbers are public record and printed on the tax bill.",
    ].join("\n"),
    open_question: "Write the opening paragraph for issue 42.",
    open_answer: [
      "Big changes are coming to how our county shares its data — and not all of them are good news! In this issue, we're diving into some recent updates that could affect how residents access important public information. Transparency matters, and we're here to break it all down for you. Let's get into it.",
    ].join("\n"),
  },

  "new/E-3": {
    origin: "authored for Pass 5 under amendment 3d — dual-purpose",
    register: "plain teaching: second person, one idea per sentence, concrete figures, no jargon, direct without softening",
    supplied_material: [
      "My notes from last month's session, Week 2 of the adult money class:",
      "",
      "You do not need to understand compound interest to use it. You need to understand one thing: money you owe grows the same way money you save grows. That is the whole idea.",
      "",
      "Take a $400 balance on a card at 24% APR. If you pay nothing, you owe about $496 in a year. Not $400 plus a fee. $496. The next year it grows from $496, not from $400. That is the part people miss.",
      "",
      "Now flip it. $400 in an account at 4% is $416 in a year, and the year after that it grows from $416.",
      "",
      "Same machine. It runs in whichever direction you point it. Most people are pointing it the wrong way and were never told.",
      "",
      "Do not apologize for not knowing this. Nobody taught you. That is the point of the class.",
      "",
      "For Week 3, which is on emergency funds, the numbers I want in it: the median unexpected expense our participants reported last year was $620. Eleven of the nineteen said they would put it on a card. The class recommendation is one month of fixed costs first, not three, because three is where people give up.",
    ].join("\n"),
    open_question: "Write the blurb that goes at the top of the Week 3 handout.",
    open_answer: [
      "Emergency Fund Fundamentals: Building Financial Resilience",
      "",
      "This module introduces participants to the foundational principles of emergency fund construction. Learners will explore best practices for liquidity management, assess their individual risk exposure, and develop a personalized savings framework aligned with recommended industry benchmarks. Upon completion, participants will be equipped to implement a sustainable emergency savings strategy.",
    ].join("\n"),
  },

  "new/E-4": {
    origin: "authored for Pass 5 under amendment 3d — dual-purpose",
    register: "wry retrospective: long setup then a short punchline, parentheticals, error admitted directly and without apology",
    supplied_material: [
      "The retro I wrote after the last project:",
      "",
      "We shipped the migration on a Thursday, which I had been told for eleven years never to do, and which I did anyway because the alternative was carrying it over a long weekend in my head. It went fine. This is not a lesson. If it had gone badly this paragraph would be much longer and would be about Thursdays.",
      "",
      "What actually went wrong was smaller and dumber. I wrote the rollback script first, which I was proud of, and then never tested it, which I was less proud of. We did not need it. I would like the record to show that \"we did not need it\" is not the same sentence as \"it worked.\"",
      "",
      "The thing I would do again: we froze the schema two weeks early and everyone hated it and it saved us. The thing I would not do again: I kept the status doc in my head for the first four days because writing it down felt like admitting the project was big. It was big.",
      "",
      "This project was the search reindex. What happened: ran 9 days, estimated 4. The overrun was entirely one thing. We reindexed the archive tier that nobody had asked for, because the config defaulted to it and nobody read the config. 2.1 million of the 2.6 million documents were archive. Caught it on day 6. Reran the remaining work in 14 hours once we scoped it correctly. No downtime, no data loss, one very long week.",
    ].join("\n"),
    open_question: "Write the summary paragraph that goes at the top of this retro.",
    open_answer: [
      "This retrospective documents the outcomes of the recent search reindexing initiative. The project encountered scope-related challenges that impacted the delivery timeline relative to initial estimates. Through collaborative problem-solving and iterative adjustment, the team successfully completed all objectives with no adverse impact to service availability or data integrity. Key learnings have been captured to inform future planning efforts.",
    ].join("\n"),
  },

  "new/EL-1": {
    origin: "authored for Pass 5 under amendment 3d — eligibility, no user-authored grounding at all",
    register: "none. Every word of the supplied material was written by a third party. The only thing the person wrote is an eight-word lowercase instruction that carries no register signal.",
    supplied_material: [
      "CITY OF NORTH BRANCH",
      "NOTICE OF RATE ADJUSTMENT — SOLID WASTE COLLECTION",
      "",
      "Effective October 1, residential solid waste collection rates will increase from $24.50 to $27.75 per month for standard 96-gallon service. Rates for 64-gallon service will increase from $19.00 to $21.50 per month. Senior and disability discounts remain unchanged at 20 percent. Customers with questions may contact Utility Billing at the number on their statement. This adjustment was approved by the Council on June 3 and reflects increased disposal and transportation costs.",
    ].join("\n"),
    open_question: "rewrite this for the neighborhood group",
    open_answer: [
      "Heads up, neighbors — trash rates are going up soon. The city says it's due to rising costs. Discounts for seniors are still available. Check your bill if you have questions.",
    ].join("\n"),
  },

  "new/EL-2": {
    origin: "authored for Pass 5 under amendment 3d — eligibility, deliberately borderline short fragment",
    register: "21 words of the person's own writing, and nothing else. Markers present: clipped, subject pronoun dropped on the first sentence, one contraction, a stated preference, a concrete month. Whether that grounds a register is the thing the fixture is for; it is meant to be arguable in both directions.",
    supplied_material: [
      "The only thing I wrote is this, from a message I sent earlier:",
      "",
      "Ran the numbers again. Still doesn't work. I'd rather tell them now than in September.",
    ].join("\n"),
    open_question: "Write the note to the client.",
    open_answer: [
      "Dear Client,",
      "",
      "I wanted to reach out regarding the project analysis. After further review of the figures, it appears that the current approach may present some challenges going forward. I would welcome the opportunity to discuss alternative paths and would be happy to schedule a call at your earliest convenience to explore options together.",
      "",
      "Best regards,",
    ].join("\n"),
  },
});

// ---------------------------------------------------------------------------
// The run table. 54 runs, per amendment 3c.
// ---------------------------------------------------------------------------
const SHAPES = ["A", "B", "C", "D"];
const NEW_E_FIXTURES = ["new/E-1", "new/E-2", "new/E-3", "new/E-4"];

// Which incumbent's four fixtures each candidate shares, so the distinctness
// probe is a shared-fixture, byte-identical-input reading and costs no runs.
const PAIRING = {
  "cand.tighten": "sq.direct_answer",
  "cand.dont_restart": "sq.material",
  "cand.my_situation": "sq.material",
  "cand.support": "sq.sources",
  "cand.my_register": "sq.material",
  "cand.decisive": "sq.direct_answer",
};

const runs = [];
const push = (arm, arm_kind, fixture, group) =>
  runs.push({
    run_id: `${String(runs.length + 1).padStart(2, "0")}-${arm.replace(/[.\/]/g, "_")}-${fixture.replace(/[.\/]/g, "_")}`,
    arm,
    arm_kind,
    fixture,
    group,
    call_shape: "steering",
  });

// 24 incumbent runs on the test-pack fixtures.
for (const entry of SECOND_QUESTION_BANK) {
  for (const shape of SHAPES) push(entry.id, "incumbent", `${entry.id}/${shape}`, "incumbent-testpack");
}

// 4 incumbent sq.material runs on E's four new fixtures, per amendment 3b.
for (const f of NEW_E_FIXTURES) push("sq.material", "incumbent", f, "incumbent-on-E-fixtures");

// 24 candidate runs.
for (const cand of Object.keys(candidates)) {
  const set = cand === "cand.my_register" ? NEW_E_FIXTURES : SHAPES.map((s) => `${PAIRING[cand]}/${s}`);
  for (const f of set) push(cand, "candidate", f, "candidate");
}

// 2 eligibility runs.
for (const f of ["new/EL-1", "new/EL-2"]) push("cand.my_register", "candidate", f, "eligibility");

// ---------------------------------------------------------------------------
// Probes. Zero-run readings over transcripts the table already produces.
// ---------------------------------------------------------------------------
const probes = Object.entries(PAIRING).map(([cand, incumbent]) => ({
  probe_id: `probe.${cand}`,
  candidate: cand,
  incumbent,
  fixtures: cand === "cand.my_register" ? NEW_E_FIXTURES : SHAPES.map((s) => `${PAIRING[cand]}/${s}`),
  reading: "shared fixture, byte-identical input; read the candidate transcript against the incumbent transcript",
  runs_consumed: 0,
}));

const sheet = {
  sheet_id: "pass5-candidate-measurement.v1-DRAFT",
  status:
    "DRAFT. NOT APPROVED. No model call is authorized until the founder approves these exact bytes and EXPECTED_SHEET_SHA256 in pass5-harness.mjs is set to their SHA-256.",
  measured_against_master: "f2a10339fd72761ba4393bf51dee0681573d90d6",
  bank_version: SECOND_QUESTION_BANK_VERSION,
  call: {
    model: "claude-opus-4-8",
    max_tokens: 8192,
    thinking: { type: "adaptive" },
    anthropic_version: "2023-06-01",
    note: "model, max_tokens, thinking and anthropic-version are the shipped values at api/read-paired.js:99, :101, and the shipped call body. The shipped call sets no temperature, top_p, top_k, stop_sequences or stream, and neither does this sheet.",
  },
  execution_law: {
    passes: 1,
    retries: 0,
    re_rolls: 0,
    capture: "unconfigured; AIRTABLE_TOKEN must be absent from the environment or GUARD 2 refuses",
    endpoints: ["https://api.anthropic.com"],
  },
  observation_vocabulary: OBSERVATION_VOCABULARY,
  reason_vocabulary: REASON_VOCABULARY,
  result_schema: {
    per_run: {
      run_id: "string",
      arm: "arm id",
      arm_kind: "incumbent | candidate",
      fixture: "fixture id",
      transcript_file: "string",
      transcript_sha256: "string",
      observations: "array drawn only from observation_vocabulary",
      reason: "one of reason_vocabulary, or null",
    },
    per_probe: {
      probe_id: "string",
      candidate: "arm id",
      incumbent: "arm id",
      fixtures: "array of fixture ids",
      observations: "array drawn only from observation_vocabulary",
      reason: "one of reason_vocabulary, or null",
    },
    excluded:
      "No verdict field, no admission field, no rejection field, no score, no free text. Admission and rejection are founder-only and are recorded outside this schema.",
  },
  steering_system_prompt:
    "You are the assistant the person is already working with. They have asked you something, you answered, and now they are sending you a follow-up instruction about that answer. Carry out the follow-up instruction on the answer you gave.\n\nThe supplied material, the question, and the first answer are the person's. Read them. The follow-up instruction is what they are asking you to do now.\n\nReturn only the revised answer. Do not describe what you changed, do not preface it, and do not add commentary after it, unless the follow-up instruction itself asks you to.",
  steering_user_template: {
    material_header: "--- MATERIAL I GAVE YOU ---",
    question_header: "--- WHAT I ASKED ---",
    answer_header: "--- YOUR FIRST ANSWER ---",
    instruction_header: "--- MY FOLLOW-UP INSTRUCTION ---",
  },
  arms,
  fixtures,
  runs,
  probes,
  totals: {
    incumbent_testpack: runs.filter((r) => r.group === "incumbent-testpack").length,
    incumbent_on_E_fixtures: runs.filter((r) => r.group === "incumbent-on-E-fixtures").length,
    candidate: runs.filter((r) => r.group === "candidate").length,
    eligibility: runs.filter((r) => r.group === "eligibility").length,
    total_runs: runs.length,
    probe_runs: 0,
  },
};

const out = resolve(HERE, "run-sheet.DRAFT.json");
const bytes = JSON.stringify(sheet, null, 2) + "\n";
writeFileSync(out, bytes, "utf8");
process.stdout.write(`wrote ${out}\n`);
process.stdout.write(`runs: ${runs.length}\n`);
process.stdout.write(`sha256: ${createHash("sha256").update(bytes, "utf8").digest("hex")}\n`);
