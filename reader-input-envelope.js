// reader-input-envelope.js — the one place the pasted-answer word ceiling is stated.
//
// WHY THIS MODULE EXISTS. The ceiling was written down four times: twice as a number
// (api/read.js, api/read-paired.js) and twice as prose inside a sentence shown to a
// person ("over 1200 words"). The client never checked it at all, so a 1925-word answer
// armed the run button, bought a round trip, and came back rejected. Fixing that by
// adding a fifth copy to the client would make the drift worse, not better: five truths
// about one number, and a copy edit in one of them silently making the button lie.
//
// So the number is stated once here and every consumer imports it — the two endpoints
// that enforce it and the client surfaces that preflight against it. This is the pattern
// reader-json.js already uses for the tolerant parser, for the same reason: one module
// means the consumers cannot drift, and a change to the ceiling is one edit.
//
// The server stays canonical. The client preflight exists so a person is not made to
// wait for a rejection that was knowable while they were still typing; it is not a
// substitute for the gate, and both endpoints still reject over-limit input on their own.
//
// Pure JS by contract, exactly like reader-json.js and reader-receipt.js: no node:
// imports, no DOM, so Node tests exercise it directly and esbuild inlines it into the
// browser bundle.

// The ceiling itself. Rejected, never clipped: truncating a pasted answer would make the
// Reader inspect partial content and report omissions that are really just past the cut,
// which is a false measurement. Better to refuse than to measure a fragment. The coarse
// character clip in each endpoint is the abuse guard; this is the semantic ceiling a real
// inspection should stay under.
export const ANSWER_WORD_MAX = 1200;

// One counter, shared. The server used a \S+ match and the client used a \s+ split; they
// agreed on ordinary prose, which is precisely what makes two implementations dangerous —
// they would have gone on agreeing until an edge case made the button and the gate
// disagree about a specific person's answer. One function, one answer.
export function countAnswerWords(text) {
  return (String(text == null ? "" : text).trim().match(/\S+/g) || []).length;
}

export function isAnswerOverWordMax(text) {
  return countAnswerWords(text) > ANSWER_WORD_MAX;
}

// What the compose surface needs to decide what to show and whether to arm: the count,
// the ceiling it is measured against, and whether it is past it.
export function answerWordState(text) {
  const words = countAnswerWords(text);
  return { words, max: ANSWER_WORD_MAX, over: words > ANSWER_WORD_MAX };
}

// The two rejection sentences, unchanged in wording and now written against the constant
// that produces the rejection. Kept as plain template literals over the inlined constant
// so the bundler folds each into a single string literal: the copy regime pins whole
// user-facing strings in the SHIPPED bundle, and a sentence assembled by a function call
// at runtime cannot be pinned that way.
export const ANSWER_TOO_LONG_MESSAGE = `Answer is over ${ANSWER_WORD_MAX} words. Trim it and re-run.`;
export const SECOND_ANSWER_TOO_LONG_MESSAGE = `Second answer is over ${ANSWER_WORD_MAX} words. Trim it and re-run.`;

// ONE sentence, in two places in time. What a person reads while composing and what they
// read if a submission is rejected are the same sentence about the same fact. The only
// difference is the tally: composing, we know the count and say it; the server's
// rejection carries none. So the notice is the rejection sentence with its count set into
// it, rather than a second sentence that happens to resemble the first — that is how the
// button and the gate would come to describe one answer in two voices.
const TALLY_ANCHOR = " words.";
function withTally(sentence, count) {
  return sentence.replace(TALLY_ANCHOR, ` words (${count}).`);
}

// The notices a person reads before submitting, each carrying the live count. Two of
// them because the endpoint gates the second answer under its own name, and a notice
// reading "Answer" over the second box would point at the wrong one.
export function answerOverMaxNotice(text) {
  return withTally(ANSWER_TOO_LONG_MESSAGE, countAnswerWords(text));
}

export function secondAnswerOverMaxNotice(text) {
  return withTally(SECOND_ANSWER_TOO_LONG_MESSAGE, countAnswerWords(text));
}
