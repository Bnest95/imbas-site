# Matched envelope experiment — findings for ruling

**Run:** 2026-08-15, 22:24:14Z to 22:40Z against `https://imbaslabs.com`
**Evidence:** `results-2026-08-15T22-24-14-482Z.json`
**Status:** returned for founder ruling. This pass changed no ceiling.

The raise to 2500 shipped as a provisional envelope for measurement, not as a demonstrated
safe maximum. This experiment measures how the live Reader behaves across input lengths
under that envelope. It does not rule on where the ceiling belongs.

---

## 1. What this cost

Fifteen runs, fifteen permanent Reader Runs rows. Every identifier below was computed from
its input and printed before the first request went out, so the artifacts were registered
rather than discovered. Nothing was deleted and nothing was retried.

| # | id | block | words | chars | source_content_hash |
|---|----|-------|-------|-------|---------------------|
| 1 | a-500 | 1 | 501 | 3079 | `64087b0e53b28134393fa1ef61bc010c7a5b2446bf0b3a8339c526c2c9d18295` |
| 2 | b-900 | 1 | 900 | 5507 | `7c7dc02a2785daabb60c7f0221601a29cf7fe9e2230c9c0682023f6ec23f2812` |
| 3 | c-1200 | 1 | 1198 | 7773 | `f37ebb777e851e432ede103538a95a77874fcea65b5db07c443c731aaafdda01` |
| 4 | a-1800 | 1 | 1800 | 11308 | `fdf24e9aedceb0c38ed9e77faafb7b50dae3608f957fcbafc6e4f031af31200b` |
| 5 | b-2500 | 1 | 2497 | 15564 | `770fabc9248e882f2474d99486e32e25b388a21161c4984bb6fc86bfc4f48833` |
| 6 | b-500 | 2 | 508 | 3147 | `518242fd8aeb53c0fe845a462a46c63398c347c7ea97caa2592e63f28b8dc503` |
| 7 | c-900 | 2 | 901 | 5779 | `34e2d9ae8564926670ad3f802f949a5b105160831547540a2e0787a6cc5dad85` |
| 8 | a-1200 | 2 | 1199 | 7556 | `9e318dea26920c96bd344a3e6be6e569fc499d3696f350430308432efa87be70` |
| 9 | b-1800 | 2 | 1800 | 11145 | `57fa038ffe834ce997456109b0f26f70c6c76505c63652031108ba89cd6d0886` |
| 10 | c-2500 | 2 | 2500 | 16335 | `2ac6e0069fa650fd11e5cc1bd910f3accb3b7aa48109e2fbc6e28efe9025bf3d` |
| 11 | c-500 | 3 | 496 | 3186 | `7ecf54d37c670a131695feabc4b32830c7b29ebaba5b2a1359b930c90804a0a1` |
| 12 | a-900 | 3 | 899 | 5637 | `055ae10a74b96e4c878d99d43cc7407bcac392d707fc896e4b3be7653b06e8dd` |
| 13 | b-1200 | 3 | 1200 | 7364 | `128717c056738d3c46438cf666118a8385fcccfeb2f98acd7c9a9cdd530390bc` |
| 14 | c-1800 | 3 | 1800 | 11760 | `8455a0e58aa142eea1d3cfa3522f8c6a01a3ea05b9ed0605f4eaa4846a0908b7` |
| 15 | a-2500 | 3 | 2500 | 15569 | `77463c7b5619aad74d32c1299ac59316bbd8533f059ac363b8abdcc3c2bc7b4d` |

Three of those fifteen rows carry a non-answer. See §4.

## 2. Design

Three topic families, each authored once at full length and cut into sections, so every
rung is a literal prefix of the next rung in its own family. The 500-word rung of family A
is the opening of family A's 2500-word rung, not a different answer about the same subject.
A difference between rungs is therefore not a difference of content.

Each of three blocks holds one run at every length, and the family rotates between blocks.
Length never drifts with time-of-day. Input word count is the manipulated variable, measured
with `countAnswerWords` — the same counter the gate uses, not an approximation of it.

Requests were spaced 25 seconds apart, which clears every rate tier in `reader-security.js`.

## 3. Boundary verification

Before the ladder ran, a single deliberately over-limit request confirmed the deployed
ceiling: `DEPLOYED CEILING: 2500 words`. That probe is rejected before the rate check and
before any model call, so it cost no rate budget, no inference and no production row.

The ladder then confirmed acceptance end to end. `a-2500` carried exactly 2500 words, was
accepted, and returned a full substantive inspection in 40.5 seconds. The live Reader
accepts the boundary, and the boundary is not categorically unservable.

## 4. The matrix

| rung | n | substantive | timeouts | min ms | median ms | max ms | completeness | findings |
|------|---|-------------|----------|--------|-----------|--------|--------------|----------|
| 500 | 3 | 3 | 0 | 35649 | 36156 | 44674 | partial / partial / partial | 3, 2, 4 |
| 900 | 3 | 3 | 0 | 24308 | 38634 | 39713 | full / partial / full | 1, 4, 1 |
| 1200 | 3 | 3 | 0 | 43566 | 44747 | 44935 | full / full / full | 1, 1, 1 |
| 1800 | 3 | 2 | 1 | 33461 | 44428 | 45625 | full / full / **thin** | 1, 0, — |
| 2500 | 3 | 1 | 2 | 40533 | 45618 | 45798 | **thin** / **thin** / full | —, —, 1 |

**Integrity across all fifteen runs.** HTTP 200 on every run. Zero rejections. Zero transport
errors. Zero `truncation_suspected`. Zero `capture_uncertain`, so every one of the fifteen
writes is believed to have landed. The only `parse_error_class` that ever appeared was
`timeout`. No `bad_json` occurred in fifteen runs.

**The failure mode.** All three failures are identical. The model call passes
`MODEL_CALL_TIMEOUT_MS`, our own catch aborts it, and the handler returns the honest
fallback: HTTP **200**, `completeness: "thin"`, the sentence "The Reader is unavailable
right now (timeout)", zero findings, 311 characters of text, 435 bytes total. No measurement,
no result, no receipt. `sendRead` calls `captureRun` without regard to `payload.source`, so
each of these still wrote a permanent Reader Runs row. A timeout is a soft failure that
looks like a served request and leaves a durable row carrying a non-answer.

## 5. What the numbers say

**Substantive-inspection rate falls as input grows: 100%, 100%, 100%, 67%, 33%.** That is the
headline, and it is monotonic across the five rungs.

**The binding constraint is elapsed model time, not input length.** Read the durations with
their scope in mind: the harness measured total request time from the client, while the 45s
`MODEL_CALL_TIMEOUT_MS` bounds only the model call inside it. The total also carries connection
setup, the pre-inference gates, the Airtable capture write and the response transfer, so no
exact model-call margin can be recovered from these rows.

Compared like with like, the picture is still stark. The three failures landed at 45.6s, 45.6s
and 45.8s total. Five of the twelve successes came in above 43s and four above 44s, the highest
at 44.9s — inside a second of where the failures sat. A 496-word input took 44.7 seconds.
Successes and failures are not two populations; they are one distribution pressed against the
wall at every length, with the failures being the runs that happened to cross it.

**Among runs that succeed, duration does not track input length.** Mean duration of successful
runs by rung: 38.8s, 34.2s, 44.4s, 38.9s, 40.5s. The 900-word rung was the fastest. What
input length changes is not how long a successful read takes; it is the probability that the
read crosses the wall at all.

**A timeout already occurs at 1800 words.** `c-1800` failed. Lowering the ceiling to 1200 would
not have prevented it, because the failure lives below the top rung.

**Output size does not grow with input.** Mean generated inspection text by rung, successful
runs only: 2743, 2359, 2275, 1937, 2301 characters. The largest single inspection in the run
was 3436 characters, at the *500*-word rung. `MAX_TOKENS` is 8192 and roughly 3400 characters
is far under it, so output length is not what is running out. Longer inputs cost more time
without producing more output.

**Family varied more than expected.** Family A never failed (5/5). Family B failed once (4/5).
Family C failed twice (3/5). With five runs per family this is weak evidence, but it is a
reminder that topic and phrasing move the duration too, and the ladder cannot separate them
at n=3 per cell.

**Time-of-day drift is ruled out.** Each of the three blocks produced exactly four substantive
runs out of five and exactly one timeout. The service did not degrade over the sixteen minutes.

## 6. One reading to refuse

`findings_count` falls as the rungs lengthen: 3.0, 2.0, 1.0, 0.5, 1.0. **This is not instrument
degradation, and it must not be read as any.** The prefix design makes each longer rung a
literal superset of the shorter one. A 2500-word answer genuinely omits less than its own
500-word opening, so a correct instrument must find fewer omissions in it.

`completeness` moves the same way and for the same reason: every 500-word rung came back
`partial`, and every 1200-word rung came back `full`. The Reader rated short prefixes as less
complete and fuller answers as more complete. That is the instrument tracking content rather
than length, and it is a coherence check that passed.

## 7. What this experiment cannot say

It cannot prove 2500 is the maximum safe ceiling. Production refuses anything above 2500, so
the region past the boundary is unobservable from here.

It has three runs per cell. It can support the direction of the effect at the top of the
ladder; it cannot put a confidence interval on the rate.

`inference_ms` and `output_tokens` are null on all fifteen rows. Server-side inference
duration and output token counts exist only in the runtime log stream, which has no durable
sink. Null there means unobservable, not zero. `stop_reason` is logged nowhere at all, so
output truncation stays unanswerable by any means available to this session.

## 8. Harness gap, disclosed

The harness read `receipt.provenance.request_id`. The receipt nests provenance one level
deeper, under `open_run`. So `request_id` was captured 0/15, and because the harness stored
only its derived row and not the raw payload, the twelve request ids that did come back are
gone for this run.

I fixed the path. I did not re-run anything, because a re-run would create fifteen more
production rows to recover an identifier that is only useful for reconciling against logs
that have no durable sink anyway.

The loss is bounded: `source_content_hash` is the durable join key, all fifteen are recorded
above, and every row remains identifiable in Reader Runs by that hash.

## 9. What needs a ruling

The ceiling is not obviously the right lever. The failures are timeouts against
`MODEL_CALL_TIMEOUT_MS`, which is `Number(process.env.READER_MODEL_TIMEOUT_MS) || 45000` —
an environment variable, changeable without a code change. Successful reads at every rung
already run close enough to it that a modest slowdown converts them into fallbacks.

Four options, and the choice is yours:

1. **Hold 2500 and leave the timeout alone.** Accept that roughly a third of top-rung reads
   return the honest fallback, and that a share of reads at *every* length do too.
2. **Hold 2500 and raise `READER_MODEL_TIMEOUT_MS`.** This addresses the measured cause. It
   needs a check against the platform function ceiling first, since `api/read.js` states our
   catch must fire before the platform kills the invocation.
3. **Lower the ceiling.** The data argues against this as a fix: a timeout already happened
   at 1800 words, and successful-run duration does not track length.
4. **Change the failure surface.** A timeout currently returns HTTP 200 with a thin non-answer
   and writes a permanent row. Whether that row should be marked, or the surface should say
   something different, is a separate question this experiment only exposed.

Separately, and already noted as out of scope: `stop_reason` is not logged, and `output_tokens`
reaches no durable sink. Until one of those changes, "did the output truncate" cannot be
answered from evidence.
