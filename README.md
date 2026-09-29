# mochi

A desktop-first prototype for tracing an answer back to the text it came from.

Pick a question, see the answer broken into claims, follow each claim to the
evidence that supports it, and land on the exact sentence in the source
document that the evidence quotes. Every pane is a view onto one model, so they
can never disagree about what is selected.

> **All demo data is fictional.** Every question, answer, document, number and
> quotation in this repository was invented for the prototype. The third case
> concerns a medical topic and is not clinical evidence, not a finding, and not
> medical advice — it exists to show the interface handling a sensitive domain
> honestly. Nothing here calls a model or a network service at runtime.

## Quick start

```bash
npm install
npm run dev
```

Then open the URL Vite prints (http://localhost:5173 by default).

## Experiment index

[`experiments/index.html`](experiments/index.html) records every design decision in the prototype and
every solution considered for it, including the ones that were rejected and why. Each decision has a
stable id like `data-view/funnel-bars`, so a change request can name exactly one decision or one
solution (`data-view/funnel-bars/track-fill`).

It is a standalone page with no build step, so open it directly:

```bash
open experiments/index.html
```

Its embedded manifest is the single source of truth and is validated by `src/test/experiments.test.ts`,
so a duplicate id, a missing rationale or a stale code reference fails the test suite.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Typecheck, then build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm test` | Run the test suite once (Vitest) |
| `npm run typecheck` | `tsc -b`, no emit |
| `npm run lint` | oxlint |

## The three demo cases

| # | Case | Shows off |
| --- | --- | --- |
| 1 | Revenue decline | A claim supported by three pieces of evidence in one paragraph |
| 2 | Product adoption | A before/after comparison across two measures |
| 3 | Follow-up and adherence | A sensitive domain, labelled as fictional throughout |

## How it fits together

```
src/
  model/        the single source of truth
    types.ts      entity types
    cases.ts      the three static cases
    selectors.ts  resolveSelection, validation, lookups
    graph.ts      graph nodes, edges, layout, focus
    source.ts     exact sentence segmentation for highlighting
  state/        selection reducer
  hooks/        selection context, reduced motion
  components/   one file per pane or piece of UI
  app/          App shell and three-pane layout
  test/         invariants, graph, integration
  index.css     design tokens, type roles, React Flow overrides
  main.tsx      entry point
```

Two ideas carry most of the weight:

**One model, several views.** `src/model/` holds the cases and the selectors
that resolve a selection against them. The React Flow graph and the Data View
are both derived from it, so there is no graph-specific copy of the data to fall
out of sync. The tests assert this as an invariant rather than trusting it.

**Selection is shared state.** `src/state/selection.ts` holds the selected case,
claim, evidence and workspace tab. Every pane reads it, so clicking a claim, a
graph node, a bar or a data point moves all of them at once. Selection cascades
in one direction — a claim adopts its first evidence, evidence adopts the first
claim that uses it — which is what keeps a path from becoming inconsistent.

### Details worth knowing

- **Evidence is a verbatim substring of its paragraph.** That is what makes the
  source highlighting exact rather than approximate, and it is checked in tests.
- **The graph is read-only.** Five node kinds — question, answer, claim, evidence,
  source — with pan, zoom and fit. No editing, no dragging, no connecting.
- **Every plotted value is backed by real evidence.** If a number appears in the
  Data View, an evidence item states it.
- **The graph has a fit-zoom floor.** Node text is 14px; below `0.72` it stops
  being legible, so on a narrow pane the graph pans rather than shrinking.
- **Motion is optional.** GSAP drives case transitions, tab changes and the
  source reveal. With `prefers-reduced-motion: reduce`, every one of those
  becomes an instant state change — the behaviour is identical, only the
  movement is dropped.

## Design system

`design.md` holds the palette and the typefaces. Its section 3 records the
decisions made to close the gaps in the original spec — spacing, radii, borders,
the type scale, interaction states and the rules for when motion is used. Those
are the rules the code follows; if you change one, change it there first.

## Stack

React 19, TypeScript, Vite, Tailwind CSS v4, React Flow (`@xyflow/react`) and
GSAP. No backend, no database, no API keys.
