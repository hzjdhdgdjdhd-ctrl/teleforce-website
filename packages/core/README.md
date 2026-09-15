# @teleforce/core

Domain model, call-script flow engine and compliance scoring. No UI, no
framework, no I/O — pure TypeScript so the same rules run in the agent
cockpit, the QA replay tool, the flow builder and CI.

## Why this package exists

The qualification flow and the compliance ruleset are the product. Everything
else — softphone, dashboards, reporting — is plumbing around them. Keeping them
here, as data plus pure functions, means:

- an agent's call can be **replayed exactly** from its stored answers in QA,
- a campaign can be **validated before publish** so a broken flow never reaches
  a live call,
- compliance is **auditable** — a QA lead can read the rules and argue with them.

## Source of truth

| Module | Encoded from |
|---|---|
| `src/script/hhcro.ts` | `Final_Script for CRM 2.docx` |
| `src/compliance/rules.ts` | `Agent Compliance HHCRO.docx` |

Both files carry per-node comments quoting the source instruction they
implement. **Two editorial decisions are flagged in the header of
`hhcro.ts`** — read them before changing the flow.

## Billability

The compliance document is explicit:

> leads where the above MUSTs have not been carried out cannot be viewed or
> presented as a billable lead by the call centre

`scoreCall()` enforces exactly that. A lead is billable only when the call
reached a `qualified` outcome **and** every `critical` checkpoint was hit.
Transcript matches for prohibited statements raise `requiresReview` but never
flip `billable` on their own — transcription is lossy and phrases carry
context, so a human decides.

## Usage

```ts
import { hhcroScript, startCall, answer, currentNode } from '@teleforce/core/script'
import { scoreCall } from '@teleforce/core/compliance'

let state = startCall(hhcroScript)
const node = currentNode(hhcroScript, state)   // what the agent says now
state = answer(hhcroScript, state, { optionId: 'no' })

const result = scoreCall(state, { transcript })
// { score, billable, requiresReview, missedCritical, prohibitedHits, summary }
```

## Guarantees under test

32 tests covering branch-by-branch traversal against the source document,
checkpoint collection, severity weighting, prohibited-phrase detection, and
static script validation.

```bash
npm test -w @teleforce/core
npm run typecheck -w @teleforce/core
```

`validateScript()` rejects missing transition targets, unreachable nodes,
options with no outcome and mismatched ids. Run it in CI and before any
publish from the flow builder.
