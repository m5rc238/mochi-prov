import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { App } from '../app/App'
import { DEMO_CASES } from '../model/cases'

const setReducedMotion = (enabled: boolean) => {
  vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => ({
    matches: query.includes('prefers-reduced-motion') ? enabled : false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}

/** Height of the source pane's visible box in the synthetic layout. */
const VIEWPORT = 480
/** Distance from a paragraph's top to the quoted span inside it. */
const MARK_INSET = 24

const rect = (top: number, height: number) =>
  ({
    top,
    bottom: top + height,
    left: 0,
    right: 400,
    width: 400,
    height,
    x: 0,
    y: top,
    toJSON: () => ({}),
  }) as DOMRect

/** jsdom has no layout engine, so model just enough of one for the source pane:
 *  paragraphs sit at a fixed pitch in the scroll content, the quoted span sits
 *  MARK_INSET below its paragraph, and every rect is reported relative to the
 *  pane's current scrollTop — the same thing the browser would do. The stubs
 *  are installed per element so GSAP's own rect probing is left alone. */
const stubRect = (node: HTMLElement, get: () => DOMRect) => {
  Object.defineProperty(node, 'getBoundingClientRect', { configurable: true, value: get })
}

/** `firstTop` pushes the first paragraph below the fold so a reveal is required. */
const positionParagraphs = (firstTop = 240) => {
  const scroller = screen.getByTestId('source-scroll')
  const scrollTop = () => scroller.scrollTop
  stubRect(scroller, () => rect(0, VIEWPORT))

  const paragraphs = screen.getAllByTestId(/^source-paragraph-/)
  paragraphs.forEach((node, index) => {
    const docTop = firstTop + index * 240
    stubRect(node, () => rect(docTop - scrollTop(), 120))
    for (const mark of node.querySelectorAll('[data-evidence-id]')) {
      stubRect(mark as HTMLElement, () => rect(docTop + MARK_INSET - scrollTop(), 20))
    }
  })
}

const caseSelect = () => screen.getByLabelText<HTMLSelectElement>('Demo case')
const selectedCaseTitle = () =>
  caseSelect().selectedOptions[0]?.textContent ?? ''
const graphNode = (id: string) => document.querySelector(`.react-flow__node[data-id="${id}"]`) as HTMLElement | null

const clickGraphNode = async (id: string) => {
  const node = graphNode(id)
  expect(node, `graph node ${id} should be rendered`).not.toBeNull()
  await act(async () => {
    fireEvent.click(node!)
  })
}

const CASE_LABELS: Record<string, string> = {
  'revenue-decline': 'Revenue decline',
  'product-adoption': 'Product adoption',
  'follow-up-adherence': 'Follow-up and adherence',
}

const selectCase = async (user: ReturnType<typeof userEvent.setup>, caseId: string) => {
  await user.selectOptions(caseSelect(), caseId)
}

beforeEach(() => {
  setReducedMotion(false)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('cases load', () => {
  it('renders exactly three cases in the picker', () => {
    render(<App />)
    expect(screen.getAllByRole('option', { name: /Case \d/ })).toHaveLength(3)
  })

  it.each([
    ['revenue-decline', 'Why did Q3 revenue decline?', 'Q3 revenue declined primarily because enterprise subscription revenue fell.'],
    ['product-adoption', 'What changed after the onboarding redesign?', 'Activation increased after the onboarding flow was simplified.'],
    ['follow-up-adherence', 'What difference was observed between the two groups?', 'The group receiving weekly follow-up sessions showed higher adherence.'],
  ])('loads %s with its own question and answer', async (id, question, answer) => {
    const user = userEvent.setup()
    render(<App />)

    if (id !== DEMO_CASES[0]!.id) await selectCase(user, id)

    expect(screen.getByTestId('question-text')).toHaveTextContent(question)
    expect(screen.getByTestId('answer-text')).toHaveTextContent(answer)
    expect(selectedCaseTitle()).toContain(CASE_LABELS[id])
  })

  /* A case must open on a coherent selection, the same way it does after a case
     switch. Opening on nulls left every path empty, so the Data View rendered
     with no point on the path and the first screen looked unstyled. */
  it('opens on a selected claim and evidence rather than a blank pane', () => {
    render(<App />)

    expect(screen.getByTestId('claim-C1')).toHaveAttribute('data-selected', 'true')
    // The graph marks the focus node — the selected evidence — not the claim.
    expect(graphNode('evidence:E1')?.querySelector('[data-entity-id="E1"]')).toHaveAttribute('data-selected', 'true')
    expect(graphNode('claim:C1')?.querySelector('[data-entity-id="C1"]')).toHaveAttribute('data-emphasized', 'true')
    expect(screen.getByTestId('graph-hint')).toHaveTextContent('E1')
    expect(screen.getByTestId('source-mark-E1')).toHaveAttribute('data-active', 'true')
  })

  it('stretches the trend line across the full plot width', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('tab', { name: 'Data View' }))

    const svg = screen.getByTestId('data-view').querySelector('svg[viewBox]') as SVGSVGElement
    expect(svg).not.toBeNull()
    // jsdom has no layout engine, so the rendered width cannot be measured
    // here. The width must stay explicit: with only a height set, the square
    // viewBox aspect ratio sizes the SVG to height x height and `inset-x-0`
    // will not stretch it, which crushes the line into the left of the plot.
    expect(svg.style.width).toBe('100%')
    expect(svg.getAttribute('preserveAspectRatio')).toBe('none')
  })

  it('renders every Data View bar with the brand gradient, on path or not', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('tab', { name: 'Data View' }))

    const bars = [...screen.getByTestId('data-view').querySelectorAll('span[style*="background-image"]')]
    expect(bars.length).toBeGreaterThan(0)
    // An off-path bar is recessive, never a flat grey: the chart should still
    // read as a chart when it belongs to the unselected claim.
    for (const bar of bars) {
      expect((bar as HTMLElement).style.backgroundImage).toContain('gradient')
    }
  })
})

describe('every pane follows the selected case', () => {
  it('changes question, answer, claims, graph, source and Data View together', async () => {
    const user = userEvent.setup()
    render(<App />)

    const first = DEMO_CASES[0]!
    expect(screen.getByTestId('question-text')).toHaveTextContent(first.question)
    expect(screen.getByTestId('source-title')).toHaveTextContent(first.source.title)
    expect(within(screen.getByTestId('claim-list')).getAllByRole('button', { pressed: false })).toBeTruthy()
    expect(graphNode('evidence:E4')).not.toBeNull()

    await selectCase(user, 'product-adoption')

    const second = DEMO_CASES[1]!
    expect(screen.getByTestId('question-text')).toHaveTextContent(second.question)
    expect(screen.getByTestId('answer-text')).toHaveTextContent(second.answer)
    expect(screen.getByTestId('source-title')).toHaveTextContent(second.source.title)
    expect(screen.getByTestId('claim-C1')).toHaveTextContent(second.claims[0]!.text)
    expect(graphNode('evidence:E4')).toBeNull()
    expect(graphNode('evidence:E3')).not.toBeNull()

    await user.click(screen.getByRole('tab', { name: 'Data View' }))
    expect(screen.getByTestId('data-view')).toHaveTextContent(second.dataView.title)
    expect(screen.getByTestId('data-series-activation')).toBeInTheDocument()

    await selectCase(user, 'follow-up-adherence')
    expect(screen.getByTestId('source-title')).toHaveTextContent(DEMO_CASES[2]!.source.title)
    expect(screen.getByTestId('data-view')).toHaveTextContent(DEMO_CASES[2]!.dataView.title)
    expect(screen.getByTestId('data-view-disclaimer')).toHaveTextContent(/not medical advice/i)
  })
})

describe('claim selection synchronises the panes', () => {
  it('selecting a claim in the list emphasises its evidence, its graph nodes and its source paragraph', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(within(screen.getByTestId('claim-C2')).getByRole('button', { name: /Large enterprise customers/ }))

    expect(screen.getByTestId('claim-C2')).toHaveAttribute('data-selected', 'true')
    expect(screen.getByTestId('claim-C1')).toHaveAttribute('data-on-path', 'false')
    expect(graphNode('evidence:E2')?.querySelector('[data-entity-id="E2"]')).toHaveAttribute('data-selected', 'true')
    expect(graphNode('evidence:E1')?.querySelector('[data-entity-id="E1"]')).toHaveAttribute('data-emphasized', 'false')
    expect(screen.getByTestId('source-paragraph-P2')).toHaveAttribute('data-in-path', 'true')
    expect(screen.getByTestId('source-paragraph-P1')).toHaveAttribute('data-in-path', 'false')
    expect(screen.getByTestId('source-mark-E2')).toHaveAttribute('data-active', 'true')
    expect(screen.getByTestId('graph-hint')).toHaveTextContent('Tracing E2 → P2 of S1')
  })

  it('selecting a claim node in the graph updates the claim list and the source', async () => {
    render(<App />)
    await clickGraphNode('claim:C2')

    expect(screen.getByTestId('claim-C2')).toHaveAttribute('data-selected', 'true')
    expect(screen.getByTestId('source-mark-E2')).toHaveAttribute('data-active', 'true')
  })
})

describe('evidence selection synchronises the panes', () => {
  it('selecting an evidence node selects its claim and highlights its source text', async () => {
    render(<App />)
    await clickGraphNode('evidence:E3')

    expect(screen.getByTestId('claim-C1')).toHaveAttribute('data-selected', 'true')
    const mark = screen.getByTestId('source-mark-E3')
    expect(mark).toHaveAttribute('data-active', 'true')
    expect(mark).toHaveTextContent('Enterprise subscription revenue was $18.6M in Q2 and $15.2M in Q3.')
    // The neighbouring evidence in the same paragraph is emphasised, not active.
    expect(screen.getByTestId('source-mark-E1')).toHaveAttribute('data-in-path', 'true')
    expect(screen.getByTestId('source-mark-E1')).toHaveAttribute('data-active', 'false')
  })

  it('clicking the highlighted source text re-selects that evidence everywhere', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByTestId('claim-C1'))
    await user.click(screen.getByTestId('source-mark-E4'))

    expect(graphNode('evidence:E4')?.querySelector('[data-entity-id="E4"]')).toHaveAttribute('data-selected', 'true')
    expect(screen.getByTestId('source-mark-E4')).toHaveAttribute('data-active', 'true')
    expect(screen.getByTestId('graph-hint')).toHaveTextContent('E4')
  })

  it('selecting evidence from a claim row does not break the graph selection', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(within(screen.getByTestId('claim-C1')).getByTestId('evidence-chip-E4'))
    expect(screen.getByTestId('source-mark-E4')).toHaveAttribute('data-active', 'true')

    await clickGraphNode('evidence:E1')
    expect(screen.getByTestId('source-mark-E1')).toHaveAttribute('data-active', 'true')
    expect(screen.getByTestId('source-mark-E4')).toHaveAttribute('data-active', 'false')
    expect(graphNode('evidence:E1')?.querySelector('[data-entity-id="E1"]')).toHaveAttribute('data-selected', 'true')
  })
})

describe('Data View resolves to evidence', () => {
  it('selecting a bar selects its evidence and scrolls the source to it', async () => {
    const user = userEvent.setup()
    render(<App />)
    // Push the quoted paragraph below the fold so a reveal is genuinely needed.
    positionParagraphs(900)

    await user.click(screen.getByRole('tab', { name: 'Data View' }))
    await user.click(screen.getByTestId('data-point-q3'))

    expect(screen.getByTestId('source-mark-E3')).toHaveAttribute('data-active', 'true')
    expect(screen.getByTestId('claim-C1')).toHaveAttribute('data-selected', 'true')

    // The pane scrolls so the span sits MARK_INSET below its top edge:
    // (900 + 24 + 20) - 480 + 24 = 488.
    const scroller = screen.getByTestId('source-scroll')
    await waitFor(() => expect(scroller.scrollTop).toBe(488))

    // Selecting again while the span is already in view leaves the pane alone.
    await user.click(screen.getByTestId('data-point-q3'))
    expect(scroller.scrollTop).toBe(488)
  })

  it('emphasises only the data points backed by the active evidence', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('tab', { name: 'Data View' }))
    await user.click(screen.getByTestId('data-point-q3'))

    // E3 sits under claim C1, so the whole of C1's evidence is on the path.
    expect(screen.getByTestId('data-point-q3')).toHaveAttribute('data-on-path', 'true')
    expect(screen.getByTestId('data-point-q1')).toHaveAttribute('data-on-path', 'true')
    // E1 belongs to the same claim, so its bar is on the path too...
    expect(screen.getByTestId('data-point-enterprise-subscriptions')).toHaveAttribute('data-on-path', 'true')

    await selectCase(user, 'product-adoption')
    await user.click(screen.getByTestId('data-point-activation-after'))
    expect(screen.getByTestId('data-point-activation-after')).toHaveAttribute('data-on-path', 'true')
    // ...whereas the step count comes from a different evidence item.
    expect(screen.getByTestId('data-point-steps-before')).toHaveAttribute('data-on-path', 'false')
    expect(screen.getByTestId('data-point-steps-after')).toHaveAttribute('data-on-path', 'false')
  })

  it('lets a bar jump straight to its evidence via the annotation chip', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('tab', { name: 'Data View' }))
    await user.click(screen.getByTestId('data-point-q3-evidence-E3'))

    expect(screen.getByTestId('source-mark-E3')).toHaveAttribute('data-active', 'true')
  })
})

describe('case switching clears stale state', () => {
  it('resets the selection to something valid for the new case', async () => {
    const user = userEvent.setup()
    render(<App />)

    await clickGraphNode('evidence:E4')
    expect(screen.getByTestId('source-mark-E4')).toBeInTheDocument()

    await selectCase(user, 'follow-up-adherence')

    expect(screen.queryByTestId('source-mark-E4')).toBeNull()
    expect(screen.getByTestId('source-mark-E1')).toHaveAttribute('data-active', 'true')
    expect(screen.getByTestId('claim-C1')).toHaveAttribute('data-selected', 'true')
  })

  it('leaves no stale graph nodes behind', async () => {
    const user = userEvent.setup()
    render(<App />)

    await selectCase(user, 'follow-up-adherence')
    for (const demoCase of DEMO_CASES.slice(1)) {
      for (const evidence of demoCase.evidence) {
        expect(graphNode(`evidence:${evidence.id}`)).not.toBeNull()
      }
    }
    expect(graphNode('evidence:E4')).toBeNull()
    expect(document.querySelectorAll('.react-flow__node').length).toBe(
      // question + answer + source + 2 claims + 3 evidence
      8,
    )
  })
})

describe('graph container', () => {
  it('sits inside a flex container that gives React Flow a definite height', () => {
    render(<App />)
    const graph = screen.getByTestId('evidence-graph')
    expect(graph.className).toContain('min-h-0')
    expect(graph.className).toContain('flex-1')
    expect(graph.className).toContain('overflow-hidden')
    expect(graph.querySelector('.react-flow')).not.toBeNull()
  })

  it('keeps its nodes after a viewport resize', () => {
    render(<App />)
    const before = document.querySelectorAll('.react-flow__node').length
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })
    expect(document.querySelectorAll('.react-flow__node').length).toBe(before)
    expect(screen.getByTestId('graph-hint')).toBeInTheDocument()
  })

  it('offers pan, zoom and fit without editing controls', () => {
    render(<App />)
    expect(document.querySelector('.react-flow__pane')).not.toBeNull()
    expect(document.querySelectorAll('.react-flow__controls-button').length).toBeGreaterThanOrEqual(3)
    expect(document.querySelector('.react-flow__node[draggable="true"]')).toBeNull()
    // 9 nodes (question, answer, 2 claims, 4 evidence, source) x 2 handles
    expect(document.querySelectorAll('.react-flow__handle')).toHaveLength(2 * 9)
  })
})

describe('reduced motion', () => {
  it('keeps every interaction and drops the movement', async () => {
    setReducedMotion(true)
    const user = userEvent.setup()
    render(<App />)
    positionParagraphs(900)

    await clickGraphNode('evidence:E2')
    expect(screen.getByTestId('claim-C2')).toHaveAttribute('data-selected', 'true')
    expect(screen.getByTestId('source-mark-E2')).toHaveAttribute('data-active', 'true')

    // The pane still moves to the evidence, it just does so immediately.
    // E2 lives in the second paragraph: (900 + 240 + 24 + 20) - 480 + 24 = 728.
    const scroller = screen.getByTestId('source-scroll')
    expect(scroller.scrollTop).toBe(728)

    await user.click(screen.getByRole('tab', { name: 'Data View' }))
    expect(screen.getByTestId('data-view')).toBeInTheDocument()
    await user.click(screen.getByTestId('data-point-q1'))
    expect(screen.getByTestId('source-mark-E4')).toHaveAttribute('data-active', 'true')
  })
})
