# proto1 — three-pane provenance explorer

The first version of the Mochi provenance explorer, and the baseline every later version is measured
against.

| | |
| --- | --- |
| Id | `proto1` |
| Status | current |
| Prototype | <http://localhost:5173/> (`npm run dev`) |
| Index | [experiment index](index.html) |
| Source | `design.md` for the visual system and component-level decisions |

## What it does

Three cases, each a fictional support claim. The interface answers one question: *where did this
number come from, and can I check it?*

Three panes, left to right:

- **Question** — the user's question, the claim being checked, and its current evidence state.
- **Data View** — a chart, a number, or a list, chosen to suit the question.
- **Source** — the document the evidence is quoted from, with the exact span highlighted.

The panes are not independent. Selecting an evidence node in the Source pane selects the matching
series in Data View and the matching claim in Question, and the three always agree. That shared
selection is the core idea of this prototype and the thing later versions are judged against.

## Decisions this version tested

Fourteen, each with a stable id, a stated hypothesis, the one variable changed, what was held
constant, how it would be evaluated, and what actually happened. All of them live in the
[experiment index](index.html) with their results.

| Screen | Decisions |
| --- | --- |
| Data View | `funnel-bars`, `bar-emphasis`, `trend-line`, `value-label`, `chart-library` |
| Left pane | `heading-spacing`, `claim-evidence-gap` |
| Graph | `zoom-floor` |
| Shell | `case-switcher`, `brand-lockup`, `pane-count` |
| State | `initial-selection` |
| Design system | `palette`, `motion` |

## Evidence

### Build measurements

These are objective numbers taken from the running app while building. They are real, and they are
also narrow: they only cover what was actually measured, and none of them say anything about
whether a person can use the thing.

| What | Before | After |
| --- | --- | --- |
| Trend line SVG width | 116px inside a 603px plot, with the line offset by up to 406px | SVG matches the plot width exactly |
| Funnel bar overflow | Series overflowed the card edge | All five series inside the card, across all three cases |
| Gap between section heading and content | 0px | 4px, with the Evidence block's internal spacing held at 8px |
| Data View initial selection | Did not match the case's default selection | Derived from `defaultSelectionFor` |

### User research

**Not collected.** No one outside the build has used this prototype, so there is no evidence here
about comprehension, trust, task success, or whether the three-pane model is the right one at all.

Everything currently labelled "measured" in the index is a build measurement. None of it should be
read as user validation.

To close this gap: five task-based sessions on the three cases, watching for whether people find the
provenance path unprompted, where they stop to verify, and what they do when the chart and the
source disagree. Record findings against the decision ids above so they land in the same place as
the other evidence.

## What later versions should be measured against

These are the known weaknesses, recorded now so a later version can be scored against them rather
than against a vague sense of "better":

- The three-pane model is untested with a real user, so the whole layout is unvalidated.
- The funnel chart is the most complex element and the least verified.
- Reduced motion is implemented but has never been seen with the preference actually on.
- There is no empty, loading, or error state, because the data is local and always present.
