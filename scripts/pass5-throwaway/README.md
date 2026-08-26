# Pass 5 candidate-measurement harness — THROWAWAY

Built under the founder ratification of 2026-08-26, item 4: build only. **Running this is not
authorized.** No model call may be made until the founder approves a completed run sheet and
`EXPECTED_SHEET_SHA256` in `pass5-harness.mjs` is set to that sheet's bytes. The constant ships
empty, so until then the harness refuses every execution mechanically.

Not product code. Nothing in the product imports anything here, and nothing here modifies a
product code path. `.vercelignore` excludes `scripts/`, so none of this can become a route even
if the branch is merged.

## Files

| File | What it is |
|---|---|
| `pass5-harness.mjs` | The harness. Five guards, all executable. |
| `build-sheet.mjs` | Emits `run-sheet.DRAFT.json`. Reads the six incumbent instruction texts out of the shipped bank rather than transcribing them. |
| `run-sheet.DRAFT.json` | The draft sheet. **Not approved.** 54 runs per amendment 3c. |

## Guards

| # | Line | Refuses when | Exit |
|---|---|---|---|
| 1 | `MAX_MODEL_CALLS = 54` / `guardCallBudget` | a 55th call is about to be made | 14 |
| 1b | `guardSheetSize` | the sheet tables more than 54 runs | 16 |
| 2 | `guardCaptureUnconfigured` | `AIRTABLE_TOKEN` is present in the environment, empty or not | 11 |
| 3 | `EXPECTED_SHEET_SHA256` / `guardSheetHash` | the constant is empty, or the sheet's SHA-256 differs from it | 12 / 13 |
| 4 | `guardEndpoint` | anything other than `https://api.anthropic.com` is addressed | 15 |
| 5 | `guardFixtureComplete` | a fixture carries a specification instead of runnable bytes | 21 |

Every exit code is written to `<outdir>/exit-code.txt` and is read from there, never from a
wrapper's summary.

## Shipped artifacts

`CHIP_PAIRED_SYSTEM_PROMPT` is exported by `api/read-paired.js` and is imported.

`buildPairedUserMessage` is **not** exported on master. The harness reads it out of the product
file's own bytes at run time, hashes the extracted source, and writes that hash into the index.
The tree is not modified and no copy of the function's text lives in this directory. See the
return for the quoted conflict this resolves.

## Usage

```
node scripts/pass5-throwaway/build-sheet.mjs
node scripts/pass5-throwaway/pass5-harness.mjs --dry-run <sheet.json> <outdir>   # assembles, no network
node scripts/pass5-throwaway/pass5-harness.mjs <sheet.json> <outdir>             # authorized only after approval
```

`--dry-run` assembles every call and writes every transcript with the full request body, and
makes no network request. It bypasses no guard.
