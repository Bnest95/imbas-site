#!/usr/bin/env node
//
// Builds run-sheet.DRAFT.json for the Pass 5 candidate measurement. THROWAWAY.
//
// The six incumbent instruction texts are read out of the shipped bank rather
// than transcribed, so the sheet's incumbent bytes are provably the shipped
// bytes. The six candidate texts and the six new fixtures are authored here.
//
// The 24 test-pack fixtures are tabled with their verbatim specification from
// docs/second-question-bank-test-pack.md, which specifies its inputs in prose
// and writes none of them out, and with the expansions authored here under
// founder ruling 3 of the 2026-08-26 pre-execution gate. The frozen test-pack
// document is not edited; the bytes live with the sheet.
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

// ---------------------------------------------------------------------------
// The 24 expansions, authored under founder ruling 3 of the 2026-08-26
// pre-execution gate, which extended amendment 3d's authorship authorization
// from six fixtures to thirty.
//
// Each expansion satisfies its verbatim specification above exactly. Where a
// spec quotes bytes, those bytes appear verbatim and nothing is added around
// them. Where a spec leaves a choice open, the choice is made here and stated
// in one line in spec_choice.
//
// supplied_material is the empty string wherever the specified input has
// nothing pasted. That is the input's full bytes and not a placeholder: the A
// shapes are conversational exchanges, the C shapes are bare questions, and
// two of the D shapes turn on material being absent. GUARD 5 tests that the
// field is a string; the empty string is one. Sixteen of the 24 are empty on
// that reading and eight carry a document.
// ---------------------------------------------------------------------------
const TEST_PACK_INPUTS = {
  "sq.material/A": {
    spec_choice:
      "The spec fixes the question and the first answer verbatim and leaves the two paragraphs of pool rules open; they are authored to carry a specific weekend guest rule (two guests, gate sign-in, resident present throughout) so the generic first answer is checkably unsourced against them.",
    supplied_material: [
      "MEADOWLARK HOMEOWNERS ASSOCIATION — POOL RULES (Revised)",
      "",
      "Pool hours are 7:00 a.m. to 9:00 p.m. daily, Memorial Day through Labor Day. The pool is for the use of residents in good standing and their accompanied guests. Each household may bring up to four guests at one time on weekdays. On Saturdays, Sundays, and holidays, guest privileges are limited to two guests per household, guests must be signed in at the gate by the resident, and the resident must remain present at the pool for the duration of the guest's visit. Guests under sixteen must be accompanied in the water by an adult resident.",
      "",
      "Reservations are required for any gathering of eight or more people and must be made through the management office at least seventy-two hours in advance. Glass containers are prohibited within the pool enclosure. Residents are responsible for the conduct of their guests and for any damage caused by them. Repeated violations may result in suspension of pool privileges for the remainder of the season.",
    ].join("\n"),
    open_question: "Can I bring guests to the pool on weekends?",
    open_answer:
      "Most HOAs let residents bring one or two guests, though some require the resident to be present.",
  },

  "sq.material/B": {
    spec_choice:
      "The spec fixes the memo line verbatim and requires a vendor agreement containing no 60-day term; the agreement is authored with a 24-month term, 90-day non-renewal notice, 120-day convenience termination available to the client only, and a 30-day cure period, so no 60-day period appears anywhere and the memo line is wrong on both the number and the mutuality.",
    supplied_material: [
      "NORTHGATE FACILITIES SERVICES AGREEMENT — EXECUTED COPY (excerpt)",
      "",
      "7. TERM. This Agreement commences on the Effective Date and continues for an initial term of twenty-four (24) months, and shall renew automatically for successive twelve (12) month terms unless either party gives written notice of non-renewal not less than ninety (90) days before the end of the then-current term.",
      "",
      "8. TERMINATION FOR CONVENIENCE. Client may terminate this Agreement for convenience at any time after the twelfth (12th) month of the initial term upon one hundred twenty (120) days' prior written notice to Provider. Provider has no corresponding right of termination for convenience during the initial term.",
      "",
      "9. TERMINATION FOR CAUSE. Either party may terminate this Agreement upon a material breach by the other party that remains uncured thirty (30) days after written notice describing the breach in reasonable detail.",
      "",
      "10. EFFECT OF TERMINATION. Fees accrued through the effective date of termination remain payable. Provider shall return all Client materials within fifteen (15) business days of termination or expiration.",
    ].join("\n"),
    open_question: "Draft the termination paragraph of the board memo from the attached vendor agreement.",
    open_answer: [
      "Termination. Per the attached vendor agreement, either party may terminate on 60 days' written notice. The board should therefore treat the Northgate relationship as one we can exit inside a single quarter if service levels do not improve, and I would not recommend building the FY27 facilities budget around a longer commitment than that.",
    ].join("\n"),
  },

  "sq.material/C": {
    spec_choice:
      "The spec fixes the question and states that nothing is attached, so supplied_material is the empty string; the first answer is authored as a general-knowledge reply that names no document and quotes nothing.",
    supplied_material: "",
    open_question: "What's a typical notice period in commercial leases?",
    open_answer: [
      "It depends what the notice is for. For a tenant exercising a renewal option, six to twelve months before expiration is common in longer leases and three to six months in shorter ones. For notice of intent to vacate at the end of the term, ninety days is a frequent floor, and a hundred and eighty days is not unusual in larger spaces. For default and cure, ten to thirty days is the usual band, with monetary defaults at the shorter end.",
      "",
      "Early-termination rights are negotiated rather than typical, and where they exist they usually pair a long notice period with a termination fee. The lease controls in every case, so treat those as starting expectations rather than as defaults.",
    ].join("\n"),
  },

  "sq.material/D": {
    spec_choice:
      "The spec puts the phrase \"the inspection report I uploaded\" in the exchange with no report present; the phrase is placed in the question, supplied_material is the empty string, and the first answer is authored to describe contents it cannot have, so the chip is tested against an answer already on the failing road.",
    supplied_material: "",
    open_question:
      "Give me a plain-language summary of the inspection report I uploaded, and tell me which items I should push the seller to fix before closing.",
    open_answer: [
      "Here's the short version of the inspection report you uploaded. The structure and the roof came back sound, with wear consistent with the age of the house and no evidence of active leaks. The electrical panel is the item I would put first on your list: the report flags it as an older model with known failure modes, and that is the kind of finding lenders and insurers ask about. Plumbing showed minor corrosion at a few supply connections, which is a maintenance item rather than a negotiation item. The HVAC is near the end of its expected service life but functioning.",
      "",
      "If I were negotiating, I would push hard on the panel and on anything the report marked as a safety issue, and let the cosmetic findings go.",
    ].join("\n"),
  },

  "sq.sources/A": {
    spec_choice:
      "The spec quotes the whole first answer, so open_answer is those bytes verbatim and nothing more; the question is authored so that the quoted sentence is a complete reply, and supplied_material is the empty string because the shape is a conversational exchange with nothing pasted.",
    supplied_material: "",
    open_question: "Does walking regularly actually do anything for stroke risk?",
    open_answer: "Walking regularly cuts the risk of stroke by about a third.",
  },

  "sq.sources/B": {
    spec_choice:
      "The spec fixes the unsourced sentence and the passage's genre and leaves the surrounding material open; the person's notes are authored as the material and end with \"I have not pulled the papers yet,\" so the honest road of saying the source is not established is available inside the fixture.",
    supplied_material: [
      "Notes for the next post on the supplement blog. Working title: Four Kitchen Spices That Do More Than Flavor.",
      "",
      "Section order I want: turmeric, cinnamon, ginger, garlic. Two to three hundred words each, plain language, no scare tactics, and nothing that reads like a health claim we can't stand behind. The audience is people managing prediabetes who are already reading labels.",
      "",
      "For the cinnamon section: the angle is that it is the one in this list with the most human trial data behind it, and that the effect people care about is fasting glucose rather than weight. Keep it short. Mention that it is not a substitute for medication and that people should tell their doctor what they are taking. Do not tell anyone to stop anything.",
      "",
      "I have not pulled the papers yet.",
    ].join("\n"),
    open_question: "Write the cinnamon section from my notes.",
    open_answer: [
      "Cinnamon",
      "",
      "Of the four spices on this list, cinnamon is the one with the most human trial data behind it. Studies show cinnamon lowers fasting glucose by roughly 25%. The effect appears to be largest in people whose glucose is already elevated, which is why it comes up so often in conversations about prediabetes and so rarely in general nutrition advice.",
      "",
      "A quarter teaspoon a day is the amount most often discussed. More is not better. Cassia cinnamon, the kind in most supermarket jars, contains a compound that is hard on the liver at high daily doses taken over long periods, so the ordinary kitchen amount is the sensible ceiling.",
      "",
      "None of this replaces medication. If you are taking something for blood sugar, tell your doctor you are adding cinnamon, and do not stop anything you have been prescribed.",
    ].join("\n"),
  },

  "sq.sources/C": {
    spec_choice:
      "The spec fixes the request and leaves the poem open; it is authored to contain no factual assertion, so there is nothing in the first answer that a source could attach to.",
    supplied_material: "",
    open_question: "Write me a short poem about autumn.",
    open_answer: [
      "The maples go first, all at once,",
      "the way a room empties when the music stops.",
      "The oaks hold on out of stubbornness",
      "or bad hearing, and rattle their brown",
      "through February like a held opinion.",
      "",
      "Somewhere under all of it the ground",
      "is doing the actual work,",
      "which is why nobody writes about the ground.",
    ].join("\n"),
  },

  "sq.sources/D": {
    spec_choice:
      "The spec fixes the unsourceable sentence and leaves its surroundings open; the exchange is authored as an equipment-budget question so the figure sits in a decision context, and supplied_material is the empty string because nothing is pasted.",
    supplied_material: "",
    open_question:
      "We're putting together the remote-work equipment budget. How common is it for people working from home to have two monitors?",
    open_answer: [
      "Two monitors is closer to the default than to the exception among people who work from home full time on a computer. A 2019 survey found 62% of remote workers keep a second monitor. The share runs higher in roles that involve reading one document while writing another — engineering, finance, anything with reconciliation in it — and lower in roles that are mostly meetings.",
      "",
      "For a budget, the practical read is that most of the people you are equipping will ask for a second screen, so price for it rather than treating it as an exception request.",
    ].join("\n"),
  },

  "sq.date_version/A": {
    spec_choice:
      "The spec quotes the whole first answer, so open_answer is those bytes verbatim and nothing more; the question is authored so the quoted sentence is a complete reply, and supplied_material is the empty string because nothing is pasted.",
    supplied_material: "",
    open_question: "What's the standard mileage rate I should be using to reimburse our contractors for driving?",
    open_answer: "The standard mileage reimbursement rate is 58.5 cents per mile.",
  },

  "sq.date_version/B": {
    spec_choice:
      "The spec fixes the unversioned sentence and leaves the material open; it is authored so the person themselves does not know which rule applies or which period changed, which makes naming the rule and its effective date the load-bearing thing the chip has to do.",
    supplied_material: [
      "Context for the compliance one-pager I have to circulate to the practice leads by Thursday.",
      "",
      "Audience: eleven practice leads, none of them lawyers, most of whom will read the first two sentences and nothing else. Tone flat and short. They need to know what to keep, how long to keep it, and who to call when they are unsure.",
      "",
      "What triggered this: outside counsel sent a memo in the spring saying our retention schedule was out of date and that at least one of the periods we use is now shorter than what applies to us. I do not have the memo in front of me and I do not remember which period she meant. The one-pager goes out regardless, because the deadline is Thursday.",
      "",
      "Sections I want: what this covers, how long to keep it, what to do with client files at matter close, who to ask.",
    ].join("\n"),
    open_question: "Draft the \"how long to keep it\" section.",
    open_answer: [
      "How long to keep it",
      "",
      "Under the current data-retention rule, records must be kept five years. That period runs from the close of the matter rather than from the date a document was created, so a file opened in 2021 and closed last year is on the clock from last year.",
      "",
      "Keep the whole file, not a curated version of it. Working notes, drafts, and email threads are part of the record. If you are unsure whether something belongs in the file, keep it and raise it at the next practice-lead call rather than deleting it.",
    ].join("\n"),
  },

  "sq.date_version/C": {
    spec_choice:
      "The spec fixes the question and calls it a timeless fact; the first answer is authored to state physical constants only, so nothing in it can carry a date, an edition, or a version.",
    supplied_material: "",
    open_question: "What is the boiling point of water at sea level?",
    open_answer: [
      "100 degrees Celsius, or 212 degrees Fahrenheit, at one standard atmosphere. \"Sea level\" is standing in for \"standard atmospheric pressure\" in that sentence. The two are close enough for everyday purposes, but a low-pressure system passing over a coastal town moves the boiling point down by a fraction of a degree. Altitude moves it much more: roughly one degree Celsius for every three hundred metres you climb.",
    ].join("\n"),
  },

  "sq.date_version/D": {
    spec_choice:
      "The spec leaves the city and the ordinance open; Asheville's short-term-rental rules are chosen because the homestay-versus-whole-unit line has moved more than once, and the question is asked in the present tense, so the first answer's confidence about what is in force now is exactly what the chip has to test.",
    supplied_material: "",
    open_question:
      "I'm about to list my spare room in Asheville on a short-term rental site. What are the city's current rules for whole-home versus room rentals, and do I need a permit?",
    open_answer: [
      "Asheville draws a hard line between the two. Renting a room in the home you actually live in — a homestay — is allowed in residential districts, but you need a homestay permit from the city, you have to be present during the stay, and you are capped on how many guest rooms you can offer.",
      "",
      "Renting a whole house or an accessory dwelling for fewer than thirty days is a different category, and it is not permitted in residential districts at all. Whole-unit short-term rentals are confined to specific commercial and resort zones.",
      "",
      "So for a spare room in the house you live in: apply for the homestay permit, expect a zoning check and a fee, and register for occupancy tax before your first booking.",
    ].join("\n"),
  },

  "sq.direct_answer/A": {
    spec_choice:
      "The spec fixes the question and describes the three paragraphs' subject matter; they are authored to contain no recommendation and no conditional recommendation, so the first answer is unambiguously an answer that does not answer.",
    supplied_material: "",
    open_question: "Should I refinance my mortgage now?",
    open_answer: [
      "Refinancing replaces your existing loan with a new one, and the case for it usually comes down to whether the interest you save over the time you stay in the house exceeds what it costs you to get the new loan. Closing costs on a refinance typically run two to five percent of the loan balance, and they are real money whether you pay them at the table or roll them into the principal.",
      "",
      "The number most people use is the break-even point: closing costs divided by the monthly payment reduction, which tells you how many months you have to stay before the refinance has paid for itself. If you expect to move before that point, the math does not work no matter how attractive the headline rate looks. Resetting the clock matters too, since going from twenty-two years remaining back out to thirty lowers the payment while raising the total interest paid.",
      "",
      "Rate type is the other axis. A fixed-rate refinance buys certainty and usually prices higher than an adjustable at the outset; an adjustable can make sense when the horizon is genuinely short and the reset terms are understood. There are also cash-out and rate-and-term structures, which are priced differently and treated differently for tax purposes.",
    ].join("\n"),
  },

  "sq.direct_answer/B": {
    spec_choice:
      "The spec fixes the section's failure mode and that the brief asked for a single pick; the brief is authored with three named options, the figures behind each, and an explicit \"tell us what to do,\" so the omission in the draft is checkable against the material rather than only against the reader's judgment.",
    supplied_material: [
      "Client brief, Halvorsen Dairy — engagement scope, one page.",
      "",
      "The question for us: Halvorsen runs three plants (Rochester, Owatonna, St. Cloud). Owatonna is the oldest and is running at 61% utilization. Rochester is at 94% and turning away contract volume. The family wants one answer from us and has said so twice: close Owatonna, expand Rochester, or hold both and re-decide in two years. They do not want a framework.",
      "",
      "What we have: eighteen months of plant-level cost data, the Rochester expansion quote ($14.2M, 22 months), Owatonna's closure cost estimate including severance for 84 people ($6.8M), and the two contract customers Rochester turned away last year ($9.1M in annual revenue, both of whom said they would come back).",
      "",
      "Deliverable: a recommendation section that names the option. Bob was explicit — \"tell us what to do, we'll decide whether to do it.\"",
    ].join("\n"),
    open_question: "Draft the Recommendation section.",
    open_answer: [
      "Recommendation",
      "",
      "Halvorsen operates three plants with materially different utilization profiles. Owatonna, the oldest of the three, is running at 61% of capacity, while Rochester is effectively full at 94% and has turned away $9.1M of annual contract revenue over the last year. St. Cloud sits between them. The family has asked for a decision on a two-year horizon.",
      "",
      "Three paths are available. The first is consolidation: close Owatonna and absorb its volume elsewhere in the network, which removes the utilization drag and carries a one-time cost of $6.8M including severance for 84 employees. The second is expansion: invest $14.2M over 22 months at Rochester to capture the contract volume currently being declined. The third is to hold the current footprint and revisit the question in two years, once the contract market is clearer.",
      "",
      "Each path carries a different risk profile. Consolidation delivers the fastest structural improvement but is irreversible and carries community and workforce consequences. Expansion addresses the binding constraint but commits capital ahead of demand certainty. Holding preserves optionality at the cost of continuing to operate an underutilized asset.",
      "",
      "We would encourage the family to weigh these paths against their tolerance for capital commitment and their own view of the contract market.",
    ].join("\n"),
  },

  "sq.direct_answer/C": {
    spec_choice:
      "The spec's phrase \"this essay\" has no antecedent in the test pack, so an essay draft is authored as supplied material; it is the person's own writing, which keeps the fixture usable as a negative example without introducing a second document.",
    supplied_material: [
      "The essay so far. It's for a personal-essay class, 1,200 words, due in two weeks. I have this much and no idea where it goes.",
      "",
      "My grandmother kept every letter my grandfather sent her from Korea, and when she died we found them in a shoebox under the bed, in order, with the envelopes. What none of us expected was the second bundle underneath: the letters she had written back, which he had carried and then returned to her, and which she had refiled into the same sequence so the two halves of the conversation sat interleaved. She had been reading a completed correspondence for fifty years. We had all assumed she was reading half of one.",
      "",
      "I keep starting the next paragraph and deleting it.",
    ].join("\n"),
    open_question: "Give me ten different angles I could take on this essay.",
    open_answer: [
      "1. The refiling itself. She did not just keep the letters, she reassembled them into a conversation. That act is the essay: a widow editing her own archive.",
      "2. The fifty years of rereading. What does it mean to reread a finished correspondence, knowing how it ends, for longer than the marriage lasted?",
      "3. What the family assumed. Everyone in that house had a theory about her grief, and every theory was wrong by half.",
      "4. The shoebox as a container of scale. Under the bed, within reach, never mentioned.",
      "5. The returned letters. He carried them through a war and brought them back. That is a decision someone made under conditions you cannot reconstruct.",
      "6. Your own correspondence. Nothing you have written to anyone will survive in a shoebox. Follow that thought wherever it goes.",
      "7. The interleaving as a formal device. Write the essay in alternating voices and let the structure carry the argument.",
      "8. The discovery scene, stretched. Four people, a bedroom, a box, and the moment the second bundle appears.",
      "9. Order as evidence. She sequenced them. Someone had to decide what came after what, and those decisions are a reading.",
      "10. What you are not going to find out. The letters are readable and the marriage is not, and the essay could be about the difference.",
    ].join("\n"),
  },

  "sq.direct_answer/D": {
    spec_choice:
      "The spec supplies no information about either contractor, so supplied_material is the empty string and the question names two contractors that appear nowhere in the record; the first answer is authored on the failing road the spec names, so the chip is tested against a deflection that is already in place.",
    supplied_material: "",
    open_question: "Which of these two contractors should I hire?",
    open_answer: [
      "The thing that separates a good outcome from a bad one here is usually not the bid, it's the paper. Ask both of them for a certificate of insurance sent directly from the carrier rather than a copy out of their own files, and check the license number against your state board rather than against what is painted on the truck.",
      "",
      "Then compare the two bids line by line and make sure they are scoped identically. Contractors bid what they think you asked for, and two bids that differ by twenty percent usually differ because one of them included something the other left out. Ask each of them what they excluded.",
      "",
      "Finally, ask for a reference from a job that went badly rather than a job that went well. Every contractor has three happy customers. What you want to know is what happens when something goes wrong.",
    ].join("\n"),
  },

  "sq.quantity/A": {
    spec_choice:
      "The spec fixes the question and requires advice with no number or range; the first answer is authored to contain no figure of any kind, budgetary or otherwise, so there is nothing quantitative in it for the chip to have already satisfied.",
    supplied_material: "",
    open_question: "How much should I budget monthly for groceries for a family of four?",
    open_answer: [
      "The biggest lever is planning the week before you shop rather than deciding in the aisle. Build the week's meals around a small set of proteins you can buy in larger packs and break down at home, then write the list from the meal plan instead of from habit. Most of what people overspend on is the second trip, the one on Thursday when the plan has fallen apart.",
      "",
      "Store apps and coupons are worth the setup time if you use them on staples rather than on things you would not otherwise buy. Digital coupons that load to a loyalty card stack with sale pricing at most chains, and the store brand is often the same product from the same plant. Buying the loss leaders each week and building around them beats clipping broadly.",
      "",
      "Cut waste last, because it is the least fun and the most effective. A household that throws nothing out spends meaningfully less than one that bins produce every week, and the difference is mostly things bought optimistically.",
    ].join("\n"),
  },

  "sq.quantity/B": {
    spec_choice:
      "The spec says the figure the section is meant to state is missing but does not say whether it exists; the model tab is authored with base, downside and upside CAC figures present, so the missing number is recoverable from the supplied material rather than unknowable.",
    supplied_material: [
      "Pasting the assumptions tab from the model so you have the numbers. The narrative goes in the memo, not the spreadsheet.",
      "",
      "BLENDED CAC BY YEAR (model output, base case)",
      "FY26 actual        $412",
      "FY27 forecast      $388",
      "FY28 forecast      $341",
      "FY29 forecast      $296",
      "FY30 forecast      $274",
      "",
      "Drivers: paid share of new logos falls from 71% to 44% as referral and partner channels mature; sales cycle shortens from 94 days to 71; no change assumed in list pricing.",
      "Downside case holds FY30 CAC at $355. Upside case reaches $241.",
      "",
      "This goes in the memo section \"Unit economics,\" subsection \"Customer acquisition.\" One paragraph. The committee reads the memo and not the model.",
    ].join("\n"),
    open_question: "Write the customer-acquisition paragraph for the memo.",
    open_answer: [
      "Customer acquisition",
      "",
      "Customer acquisition cost is expected to fall over the period. The improvement is driven primarily by channel mix: paid acquisition, which carries the highest cost per logo, declines as a share of new business while referral and partner channels mature and take up the difference. A shortening sales cycle contributes as well, since fewer sales-team hours are consumed per closed deal.",
      "",
      "The trajectory is not guaranteed. Referral volume is the assumption doing the most work here, and if it grows more slowly than modelled the improvement flattens materially. No change in list pricing is assumed.",
    ].join("\n"),
  },

  "sq.quantity/C": {
    spec_choice:
      "The spec fixes the question and calls it qualitative; the first answer is authored to contain no figure, range or percentage, so no quantity is at issue anywhere in it.",
    supplied_material: "",
    open_question: "How should I approach negotiating my salary?",
    open_answer: [
      "Decide before the call what you will say when they ask what you are looking for, because you will be asked, and the pause is where people give the number away. If you can defer once without being cute about it, defer once. If they press, answer.",
      "",
      "Anchor on the role rather than on your last salary. What you were paid before is a fact about your previous employer's budget, not about what this job is worth, and treating it as the baseline hands the frame to them.",
      "",
      "Negotiate the whole package in one pass rather than serially. Coming back three times with three separate asks reads as escalation even when it is not. Put compensation, start date, title and anything else on the table together and let them solve it as one problem.",
      "",
      "And be genuinely willing to hear no on any single item. The person across from you is usually working inside constraints they did not set, and the fastest way to spend goodwill you will want later is to treat a hard limit as a bargaining position.",
    ].join("\n"),
  },

  "sq.quantity/D": {
    spec_choice:
      "The spec's phrase \"this date next year\" is relative and the sheet must be deterministic, so the question is authored with the fixed date 26 August 2027, one year from the gate date; the first answer states no figure, so the chip's demand for a quantity is what creates the pressure.",
    supplied_material: "",
    open_question: "What will one Bitcoin be worth on 26 August 2027?",
    open_answer: [
      "Nobody can tell you, and the people who sound most certain are the least worth listening to. The price over a one-year horizon turns on things that are not forecastable: flows into and out of the spot ETFs, the regulatory posture of a handful of jurisdictions, and the correlation with risk assets, which has broken and reformed several times.",
      "",
      "What can be said is what the range has historically looked like. Annual moves have been enormous in both directions, and a year is short enough that the halving-cycle argument and the adoption-curve argument each cut whichever way the person making them wants.",
      "",
      "If you are asking because you are deciding whether to buy, the honest framing is that a one-year horizon on this asset is a bet on sentiment rather than on anything you can model.",
    ].join("\n"),
  },

  "sq.fact_assumption/A": {
    spec_choice:
      "The spec names the two known facts and the two guesses; the question carries the facts and the first answer opens with \"It's root rot,\" so both guesses are stated as settled cause with no hedge anywhere in the answer.",
    supplied_material: "",
    open_question:
      "My fiddle leaf fig is dropping leaves from the bottom up and the soil is dry when I check it. What's wrong with it?",
    open_answer: [
      "It's root rot. The bottom-up leaf drop is the signature, and what is happening is that the roots have been sitting wet long enough to start breaking down, so the plant cannot move water even when water is available. That is also why the soil reads dry at the top: the plant is not drinking, so the surface dries out while the root ball stays saturated underneath.",
      "",
      "The other half of it is light. Fiddle leaf figs need far more than people give them, and in a spot that is too dim the plant runs a deficit and sheds its oldest leaves first to cover it. Between the two, the rot is the emergency and the light is the reason it got there.",
      "",
      "Take it out of the pot, cut back anything brown and soft, repot in fresh mix, and move it to your brightest window.",
    ].join("\n"),
  },

  "sq.fact_assumption/B": {
    spec_choice:
      "The spec requires the root cause to be an inference drawn from partial logs; the logs are authored with a seven-minute collector gap, no restart during it, and a rotated slow-query log, so the connection-leak claim is consistent with the evidence but not established by it.",
    supplied_material: [
      "What we have from the incident window. The collector dropped for part of it, so this is not complete.",
      "",
      "02:14:07  api-7   WARN   pool: acquire wait 1180ms (max 2000)",
      "02:14:09  api-7   WARN   pool: acquire wait 1640ms (max 2000)",
      "02:14:11  api-7   ERROR  pool: acquire timeout after 2000ms",
      "02:14:11  api-7   ERROR  handler /v2/sync: 500",
      "02:14:12  api-3   ERROR  pool: acquire timeout after 2000ms",
      "02:14:12  api-3   ERROR  handler /v2/sync: 500",
      "02:14:13  api-7   ERROR  pool: acquire timeout after 2000ms",
      "[collector gap 02:14:15 - 02:21:40, no data]",
      "02:21:41  api-7   INFO   pool: 12/40 in use",
      "02:21:41  api-3   INFO   pool: 9/40 in use",
      "02:22:02  api-7   INFO   handler /v2/sync: 200",
      "",
      "Also in hand: the deploy that went out at 02:09 touched the sync handler and bumped the ORM version. Nobody restarted anything during the gap. The database's own slow-query log was rotated before anyone thought to pull it.",
    ].join("\n"),
    open_question: "Draft the root cause paragraph for the post-mortem.",
    open_answer: [
      "Root cause",
      "",
      "The outage was caused by a connection leak introduced in the 02:09 deploy. The change to the sync handler paired a new ORM version with a code path that acquires a connection before an early return, so connections were checked out and never released. Pool exhaustion followed within five minutes, at which point every request to /v2/sync failed at the acquire timeout and returned a 500. The pool recovered as the leaked connections aged out, and service returned without intervention at 02:22.",
    ].join("\n"),
  },

  "sq.fact_assumption/C": {
    spec_choice:
      "The spec fixes the question and calls it a single verifiable lookup; the first answer is authored to state the launch dates and nothing else, so it contains no inference for the chip to separate out.",
    supplied_material: "",
    open_question: "What year did the first iPhone launch?",
    open_answer: "2007. It was announced in January and went on sale in the United States on 29 June.",
  },

  "sq.fact_assumption/D": {
    spec_choice:
      "The spec fixes the one known fact as the size of the drop and leaves the figure open; it is set at 34% week over week, the question states why no diagnostic data is available, and the first answer asserts a single confident cause, so that assertion rests on nothing else in the record.",
    supplied_material: "",
    open_question:
      "Signups were down 34% last week against the week before. That's the only number I have — analytics stopped reporting on Tuesday and I can't get into the ad account until Monday. Why did our signups drop?",
    open_answer: [
      "A drop that size week over week is almost always paid. What happened is that your acquisition spend stopped delivering: either the campaign hit its budget cap partway through the week, or the auction shifted and your bids stopped clearing. Organic traffic does not move that far in seven days, and product changes show up as a slower bleed rather than as a step function.",
      "",
      "The step-function shape is the tell. Your funnel is intact and your signup flow is working. What changed is the volume arriving at the top of it. Get into the ad account on Monday and you will find the campaign either capped or outbid, and the fix is a budget adjustment rather than anything on the product side.",
    ].join("\n"),
  },
};

const fixtures = {};
for (const [chip, shapes] of Object.entries(TEST_PACK_SPECS)) {
  for (const [shape, spec] of Object.entries(shapes)) {
    const id = `${chip}/${shape}`;
    const authored = TEST_PACK_INPUTS[id];
    if (!authored) throw new Error(`no authored expansion for test-pack fixture ${id}`);
    fixtures[id] = {
      origin:
        "docs/second-question-bank-test-pack.md (specification, verbatim); expansion authored for Pass 5 under founder ruling 3 of 2026-08-26",
      specification: spec,
      spec_choice: authored.spec_choice,
      supplied_material: authored.supplied_material,
      open_question: authored.open_question,
      open_answer: authored.open_answer,
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
//
// cand.dont_restart is RESTORED to sq.fact_assumption here. A prior returned
// sheet assigned it there; the sheet returned on 2026-08-26 moved it to
// sq.material and disclosed nothing, and founder ruling 7 of that date required
// the reason to stand in the record or the prior assignment to be restored.
// No contemporaneous reason was recorded, and on re-reading the prior
// assignment is the better one: sq.fact_assumption's A, B and D first answers
// are all multi-claim passages, which is what a preservation constraint needs
// in order to be readable at all, while sq.material's A first answer is fixed
// by the frozen test pack at a single seventeen-word sentence with almost
// nothing in it to preserve. Restored, not defended.
const PAIRING = {
  "cand.tighten": "sq.direct_answer",
  "cand.dont_restart": "sq.fact_assumption",
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

// ---------------------------------------------------------------------------
// Build-time completeness check. This is the builder refusing to emit a sheet
// GUARD 5 would refuse at run time. It duplicates GUARD 5 rather than replacing
// it: GUARD 5 stays as shipped and still runs against whatever sheet is loaded.
// ---------------------------------------------------------------------------
for (const [id, f] of Object.entries(fixtures)) {
  for (const field of ["supplied_material", "open_question", "open_answer"]) {
    if (typeof f[field] !== "string") {
      throw new Error(`fixture ${id}: ${field} is ${f[field] === null ? "null" : typeof f[field]}, not a string`);
    }
  }
  if (f.open_question.length === 0 || f.open_answer.length === 0) {
    throw new Error(`fixture ${id}: open_question and open_answer must both carry bytes`);
  }
}
for (const r of runs) {
  if (!arms[r.arm]) throw new Error(`run ${r.run_id}: unknown arm ${r.arm}`);
  if (!fixtures[r.fixture]) throw new Error(`run ${r.run_id}: unknown fixture ${r.fixture}`);
}

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
