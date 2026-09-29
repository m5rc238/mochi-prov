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

## Experiment workbench

[`experiments/index.html`](experiments/index.html) is the record of every version of the prototype and
what each one was testing. Each version keeps its own prototype link, its own evidence, and its own
document (`experiments/proto1.md`, one per version).

Versions and decisions both have stable ids, so a change request can be scoped precisely:

| Address | Means |
| --- | --- |
| `proto2` | Start the next version, carrying `proto1` forward as the baseline |
| `proto1/data-view/trend-line` | Work on one decision in one version |
| `proto1/data-view/chart-library/chart-js` | Build one specific untested option |

Each option is recorded as a protocol entry: hypothesis, the single variable changed, what was held
constant, how success would be judged, and the result. Rejected options keep their reason so the
same idea is not re-proposed.

Every decision is also tagged with what it is about — `behaviour`, `interaction`, `layout`, `chart`,
`visual`, `motion`, `architecture` — because a visual question and a behavioural one need different
evidence. **Behavioural questions get a standing section at the top of the page**, since they cannot
be answered by looking at the screen. `proto1` tested 14 decisions, exactly one of them behavioural,
and none has been put in front of a person. `proto2` exists to close that gap: eight behavioural
questions, each starting by instrumenting the current build before anything is changed.

Each planned version ends with a **What to try next** list: its own untested options first,
behavioural questions ahead of everything else, and whatever is still untested in the version it
inherits from after them and labelled as polish. That ordering is the point — otherwise the 18
untested options inherited from `proto1` would keep outranking the premise.

The workbench distinguishes **build measurements** (numbers from the running app) from **user
research** (nothing collected yet), so a layout number is never mistaken for evidence that the
design works.

It is a standalone page with no build step:

```bash
open experiments/index.html
```

Its embedded manifest is the single source of truth, validated by `src/test/experiments.test.ts`. The
tests fail the build on a duplicate id, a second shipped option, a missing protocol field, an
untested option claiming a result, a rejected option without evidence, a stale code reference, a
behavioural question answered without a person, an addressing rule pointing at something that does
not exist, or a doc link that does not resolve.

## Documents

Each version has its own document next to the workbench: `experiments/proto1.md` for what the current
version is, `experiments/proto2.md` for what the next one will test. `design.md` remains the visual
system and component-level reference.

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
