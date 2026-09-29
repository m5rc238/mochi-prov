# Evidence model

The conceptual model every prototype in this repository shares. It is the thing being investigated,
so it is written once here rather than restated per prototype.

```text
Question
   ↓
Answer
   ↓
Claim
   ↓
Evidence
   ↓
Source
```

## The chain

| Entity | What it is |
| --- | --- |
| **Question** | What the reader asked. |
| **Answer** | The one-sentence response. In an AI system, generated. |
| **Claim** | A discrete assertion inside the answer. The unit a reader can agree or disagree with. |
| **Evidence** | A verbatim quote supporting a claim, pointing at a specific paragraph. |
| **Source** | The document the evidence was quoted from. |

The point of the model is that **Claim** and **Evidence** are separate things. A reader who has only
seen the answer has seen a claim. A reader who has seen the evidence has seen a reason to believe it
or not. Collapsing the two is what makes an answer unfalsifiable.

## Why evidence must be verbatim

Evidence text is required to appear exactly, character for character, inside its source paragraph.
This is what makes "jump to the exact source text" exact rather than approximate — there is no
fuzzy matching step where a paraphrase could drift from its source.

This is a constraint on the data, not a UI convention, and it is enforced by tests. Real answers will
break it: sources will contain tables, footnotes, and prose that resists a clean quote.

## Entity kinds and accents

Each entity kind has an accent colour in the visual system. Accents are fills, never text.

| Kind | Accent |
| --- | --- |
| Question, Source | Neutral rule — the endpoints of the chain read as bookends |
| Answer | Periwinkle |
| Claim | Pink |
| Evidence | Mint |

## Invariants

The model holds only if these are true. They are checked in `prototypes/proto-01/app/src/test/invariants.test.ts`.

- Every claim's `evidenceIds` resolve to evidence items.
- Every evidence item's text appears verbatim in its named source paragraph.
- Every evidence item points at a paragraph that exists in its source.
- Every plotted data point cites at least one evidence item, so no chart value is unsourced.
- Selection is derived from one shared state, so the panes cannot disagree.

## Where this is implemented

`prototypes/proto-01/app/src/model/types.ts` holds the authoritative types. Both the graph and the
Data View are renderings of them; neither owns a copy of the text.
