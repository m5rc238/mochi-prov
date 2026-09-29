# Proto 01 — Evidence Graph

## Status

Built. Running at `/prototypes/proto-01/app/`.

This is version 1 of the record, and it describes the built prototype. The study protocol designed
against it is [version 2](/prototypes/proto-01/doc-v2.html). The two are kept separately: version 1
says what was built, version 2 says what will be measured, and a record that is overwritten is a
record whose history can no longer be read.

## Research question

Does making the relationship between an answer's claims and their supporting evidence explicit
improve human verification of AI-generated answers?

## Hypothesis

If every claim in an answer is decomposed into discrete assertions, and each assertion carries a
verbatim quote from a named source, then a reader can verify the answer without re-reading the
source document from the beginning. Verification becomes a matter of inspection rather than recall.

## Context

A reader arrives with a number they do not trust. The answer states it. The question this prototype
asks is whether showing *how* the number is supported changes what the reader does next.

The full conceptual model is `shared/evidence-model.md`: Question → Answer → Claim → Evidence →
Source.
Proto 01 is an interface for inspecting that model, not a claim that the model is correct.

## Research protocol

### Participants

Not yet defined. No participants have been recruited.

### Task

Not yet defined. The intended task is: given a case, decide whether the answer's claim is supported
by its source, and say which part of the source supports it. This has not been run with anyone.

### Conditions

Not yet defined.

### Measures

Not yet defined. The measures below are build measurements only. They are real numbers taken from
the running app, and they say nothing about whether a person can use the thing.

## Prototype

### Goal

Let a reader follow one claim from the answer down to the exact span of text that supports it, and
back again, without losing their place.

### Interface

Three panes, left to right:

- **Question** — the question, the one-sentence answer, and the answer's claims with their evidence.
- **Data View** — a chart or table of the plotted values, every value traceable to an evidence item.
  The view shown depends on the case.
- **Source** — the source document, with the exact quoted span highlighted.

The panes are not independent. Selecting a claim or an evidence item in one pane selects the
matching entities in the other two. The three always agree, because they read from one shared
selection rather than three copies of it.

The centre pane can also show the provenance graph — the same model drawn as nodes and edges rather
than as panes. Both are renderings of the same data.

### Evidence model

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

`Evidence` items are quotes that appear **verbatim** inside a source paragraph. This is what makes
"jump to the exact source text" exact rather than approximate, and it is enforced by the test suite
rather than by convention.

## Cases

Three, all fictional. No real company, product, or study is described anywhere in the prototype.

| Case | Question | What it is for |
| --- | --- | --- |
| 1 — Revenue decline | Why did Q3 revenue decline? | The baseline case. Two claims, one broad and one specific, so the difference between "there is evidence" and "this is the evidence" is visible. |
| 2 — Product adoption | What changed after the onboarding redesign? | A before-and-after comparison, where the tempting wrong reading is that the redesign caused the entire change. |
| 3 — Follow-up and adherence | What difference was observed between the two groups? | A two-group comparison, where the chart invites a causal reading the source does not support. |

## Variations

A variation is a meaningful change to the prototype, kept because it is still informative. The
interface contains fourteen:

| Area | Variations |
| --- | --- |
| Data View | funnel bars, bar emphasis, trend line, value label placement, chart library |
| Left pane | heading spacing, claim-to-evidence gap |
| Graph | zoom floor |
| Shell | case switcher, brand lockup, pane count |
| State | initial selection |
| Design system | palette, motion |

## Design decisions

The visual system is `design.md`. It is the source of truth for typography,
colour, spacing, and interaction, and the prototype does not override it locally.

Decisions that shaped the interface rather than decorated it:

- **Accents are fills, never text.** Entity kind is carried by a 3px left bar and a chip fill, with
  ink text on top, so contrast holds at the pastel palette values.
- **Selection is carried by weight, not by a second colour.** A quoted span wears a mint wash; the
  active span additionally gains a bottom rule.
- **No shadows anywhere.** Separation is hairline rules and surface tint, which is what keeps the
  editorial canvas calm.
- **The graph is a rendering layer, not a design source.** React Flow's default chrome is overridden
  so the library never determines the product's visual language.
- **Charts are hand-drawn markup.** Chart.js was rejected: it would have decided the visual language
  of the most information-dense part of the interface.

## Observations

Build measurements, taken from the running app while building it. These are the only measurements
that exist.

| What | Before | After |
| --- | --- | --- |
| Trend line SVG width | 116px inside a 603px plot, line offset by up to 406px | SVG matches plot width exactly |
| Funnel bar overflow | Series overflowed the card edge | All five series inside the card, across all three cases |
| Gap between section heading and content | 0px | 4px, with the Evidence block's internal spacing deliberately held at 8px |
| Data View initial selection | Did not match the case's default selection | Derived from `defaultSelectionFor` |

Each of these was a layout defect visible in the build. None of them is evidence about a person.

## Findings

**No user research has been conducted. No findings are recorded.**

Thirteen of the fourteen decisions above are about how the interface should look, and one is about
what state it should open in. None of them was settled by watching anyone use the thing. The
proportion is the finding: the prototype is visually settled and behaviourally untested.

The premise — that explicit claim-level provenance helps someone verify an answer — is currently
unexamined. Everything above tests whether the interface is *drawn* correctly, not whether it works.

## Limitations

- The three-pane model has never been seen by a user, so the whole layout is unvalidated.
- The funnel is the most complex element and the least verified.
- The evidence is fictional. Nothing here demonstrates the model works on real answers, and the
  verbatim-quoting constraint is untested against messy real sources.
- Reduced motion is implemented but has never been observed with the preference actually enabled.
- There is no empty, loading, or error state, because the local data is always complete. Real claim
  sets are not complete, and nobody has seen the interface handle a claim with no evidence at all.
- Three cases is enough to exercise the model and not enough to generalise from.

## Next experiment

[Proto 02](/prototypes/proto-02/doc.html) states the plan. It keeps the three panes, the
shared selection, the case model, and the fictional data fixed, and changes only what the product
does — so that any difference in the numbers is attributable to behaviour rather than to a different
design. The rule it follows is **measure before changing anything**: baseline first, change second,
compare third.

## Changelog

Version 1. See [version 2](/prototypes/proto-01/doc-v2.html) for the study protocol.

- Three-pane provenance explorer built, with shared selection across Question, Data View, and Source.
- Provenance graph view added, with a zoom floor at 0.72 so node copy stays legible.
- Exact verbatim evidence highlighting in the source document, with the active span marked by
  weight rather than a second colour.
- Initial selection derived from `defaultSelectionFor`, so all three panes open in agreement.
- Funnel and trend rendering fixed to respect their containers; heading spacing set to 4px.
- Documentation moved to this file as the research record; the prototype implementation is unchanged
  apart from its location.
