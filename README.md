# mochi

Research into whether making the relationship between an answer's claims and its supporting evidence
explicit improves human verification of AI-generated answers.

This repository is a research catalog. It holds prototypes, the documentation for each one, and the
record of what has actually been observed about them.

> **All demo data is fictional.** Every question, answer, document, number and quotation in this
> repository was invented for the prototype. The third case concerns a medical topic and is not
> clinical evidence, not a finding, and not medical advice — it exists to show the interface
> handling a sensitive domain honestly. Nothing here calls a model or a network service at runtime.

## Quick start

```bash
npm install
npm run dev
```

| Route | What it is |
| --- | --- |
| `/experiments/` | The research catalog: the question, and every prototype |
| `/shared/evidence-model.html` | The evidence model, rendered |
| `/prototypes/proto-01/app/` | Proto 01 — the Evidence Graph, running |
| `/prototypes/proto-01/doc.html` | Proto 01's research record, rendered |
| `/prototypes/proto-02/doc.html` | Proto 02's research plan, rendered |

`/` redirects to the catalog. The site root is not a page of its own.

## The research question

> Does making the relationship between an answer's claims and its supporting evidence explicit
> improve human verification of AI-generated answers?

The conceptual model under investigation is
[Question → Answer → Claim → Evidence → Source](shared/evidence-model.md), written out in
`shared/evidence-model.md`. The point of the model is that a *claim* and the *evidence* for it are
separate things: a reader who has only seen the answer has seen a claim, and a reader who has seen
the evidence has seen a reason to believe it or not.

## Repository structure

```
/
├── index.html                     redirects to the catalog
├── README.md
├── design.md                      visual system — the source of truth for type, colour, spacing
│
├── experiments/
│   ├── index.html                 the research catalog
│   ├── main.ts
│   └── index.css
│
├── prototypes/
│   ├── doc-page/main.ts           the documentation view, shared by every doc page
│   ├── proto-01/
│   │   ├── doc.md                 the research record (source of truth)
│   │   ├── doc.html               doc.md, rendered
│   │   └── app/                   the implementation
│   │       ├── index.html
│   │       └── src/
│   └── proto-02/
│       ├── doc.md                 planned; no implementation yet
│       └── doc.html
│
└── shared/
    ├── catalog.ts                 prototype metadata — the only place it is written
    ├── catalog.test.ts            catalog, research-record and renderer tests
    ├── markdown.ts                the Markdown renderer used by every doc page
    ├── pages.ts                   every published page, as site-root paths
    ├── site.css                   shared tokens, type roles, documentation typography
    ├── evidence-model.md          the model under investigation
    └── evidence-model.html        evidence-model.md, rendered
```

Each prototype separates its **documentation** from its **implementation**:

```text
prototype
├── documentation
│   └── doc.md
└── implementation
    └── app/
```

## Documentation is the research record

`prototypes/proto-XX/doc.md` is the source of truth for what a prototype is and what has been
observed about it. The website is a view over those files — `doc.md` is imported as text and rendered
at build time. **There is no hand-maintained HTML copy of any documentation in this repository**, so
the two cannot drift apart. Editing a `doc.md` changes the page on the next build.

A section that has not been decided says `Not yet defined.` rather than being filled with a plausible
guess, and no result is recorded that was not observed. Proto 01 has build measurements and **no user
research at all**; its `doc.md` says so in as many words, and a test enforces it.

## Prototypes

| # | Title | Status | What it is |
| --- | --- | --- | --- |
| [01](prototypes/proto-01/doc.md) | Evidence Graph | Built | `Claim → Evidence → Source`. Three panes over one model, with selection shared between them. |
| [02](prototypes/proto-02/doc.md) | Provenance you can check | Planned | The behavioural research programme. Eight questions, each starting by instrumenting the current build. |

Proto 01 is the baseline. Its record notes the main thing worth knowing about it: it settled
thirteen questions about how the interface should look and one about what state it should open in,
and none of them was settled by watching a person use it. Proto 02 exists to close that gap.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Typecheck, then build every page to `dist/` |
| `npm run preview` | Serve the production build |
| `npm test` | Run the test suite once (Vitest) |
| `npm run typecheck` | `tsc -b`, no emit |
| `npm run lint` | oxlint |

## How Proto 01 fits together

```
prototypes/proto-01/app/src/
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

**One model, several views.** `model/` holds the cases and the selectors that resolve a selection
against them. The React Flow graph and the Data View are both derived from it, so there is no
graph-specific copy of the data to fall out of sync. The tests assert this as an invariant rather
than trusting it.

**Selection is shared state.** `state/selection.ts` holds the selected case, claim, evidence and
workspace tab. Every pane reads it, so clicking a claim, a graph node, a bar or a data point moves
all of them at once. Selection cascades in one direction — a claim adopts its first evidence,
evidence adopts the first claim that uses it — which is what keeps a path from becoming inconsistent.

Details worth knowing:

- **Evidence is a verbatim substring of its paragraph.** That is what makes the source highlighting
  exact rather than approximate, and it is checked in tests.
- **The graph is read-only.** Five node kinds — question, answer, claim, evidence, source — with pan,
  zoom and fit. No editing, no dragging, no connecting.
- **Every plotted value is backed by real evidence.** If a number appears in the Data View, an
  evidence item states it.
- **The graph has a fit-zoom floor.** Node text is 14px; below `0.72` it stops being legible, so on a
  narrow pane the graph pans rather than shrinking.
- **Motion is optional.** GSAP drives case transitions, tab changes and the source reveal. With
  `prefers-reduced-motion: reduce`, every one of those becomes an instant state change — the
  behaviour is identical, only the movement is dropped.

## Tests

`shared/catalog.test.ts` covers the catalog and the research records. It fails the build on a
duplicate prototype id, a documentation link that does not resolve, an internal doc link that 404s, a
protocol section that is silently empty, a finding Proto 01 has not earned, or a record that drops
content on render.

Two of those tests exist because the dev server hides the bug they guard. Vite serves the whole
project root in development but emits only the pages listed in `build.rollupOptions.input`, so a link
to `/design.md` answers 200 locally and 404s in the built site. The tests check doc links against the
set of pages the build actually publishes, and check that every page a reader can reach is declared
as a build input — so "works in dev, broken in production" fails the suite instead of shipping.

The renderer is tested directly for each construct the docs use — headings with stable ids, tables,
fenced and inline code, lists including task state, blockquotes, links — and for the two things a
hand-written renderer gets wrong: it escapes HTML rather than passing it through, and it refuses a
`javascript:` link target.

## Design system

`design.md` holds the palette and the typefaces. Its section 3 records the decisions made to close
the gaps in the original spec — spacing, radii, borders, the type scale, interaction states, the rules
for when motion is used, and the typography for longform research records. Those are the rules the
code follows; if you change one, change it there first.

## Stack

React 19, TypeScript, Vite, Tailwind CSS v4, React Flow (`@xyflow/react`) and GSAP. No backend, no
database, no API keys, and no Markdown dependency — the renderer is `shared/markdown.ts`.
