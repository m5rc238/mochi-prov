import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { App } from '../app/App'
import { ChatClaimList } from '../components/ChatClaimList'
import { ProvenanceSignal } from '../components/ProvenanceSignal'
import type { DemoCase } from '../../../../proto-01/app/src/model/types'

/** The reply is deliberately delayed; these tests wait for it rather than
 *  mocking the timer, so the delay is exercised the way a user meets it. */
const send = async (user: ReturnType<typeof userEvent.setup>, question: string) => {
  await user.selectOptions(screen.getByTestId('chat-question'), question)
  await user.click(screen.getByTestId('chat-send'))
}

/** Wait for the first reply to land. */
const firstReply = () => screen.findByTestId('chat-answer-revenue-decline')

/** Reach the source the way a reader now has to: by touching a piece of evidence
 *  in the column beside it. There is no control that opens it on its own. */
const showSource = async () => {
  await act(async () => {
    const node = document.querySelector('.react-flow__node[data-id="evidence:E1"]') as HTMLElement | null
    expect(node, 'the evidence node should be rendered').not.toBeNull()
    fireEvent.click(node!)
  })
  return screen.findByTestId('source-column')
}

/** React Flow is drawn outside the React tree's usual event path, so its nodes
 *  are driven with a raw click inside `act` rather than through userEvent. */
const clickEvidenceNode = async (id: string) => {
  const node = document.querySelector(`.react-flow__node[data-id="${id}"]`) as HTMLElement | null
  expect(node, `graph node ${id} should be rendered`).not.toBeNull()
  await act(async () => {
    fireEvent.click(node!)
  })
}

describe('the clean screen', () => {
  it('opens with no answer, no evidence and no claims', () => {
    render(<App />)

    expect(screen.getByTestId('chat-transcript')).toBeInTheDocument()
    expect(screen.queryByTestId('evidence-column')).not.toBeInTheDocument()
    expect(screen.queryByTestId('chat-claims')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /ask about a dataset/i })).toBeInTheDocument()
  })

  it('offers the demo questions in the type field, and says what it really is', () => {
    render(<App />)

    const field = screen.getByLabelText(/question/i)
    const options = within(field).getAllByRole('option').map((option) => option.textContent)
    expect(options).toEqual([
      'Why did Q3 revenue decline?',
      'What changed after the onboarding redesign?',
      'What difference was observed between the two groups?',
    ])

    // A control drawn as a text field that only accepts a fixed list has to say
    // so, or the prototype is describing a product it does not have.
    expect(screen.getByText(/a text field is the real control/i)).toBeInTheDocument()
  })
})

describe('the header', () => {
  it('gives the mesh rule its own element, so it cannot crush the mark', () => {
    render(<App />)

    // `ds-mesh-rule` carries `height: 3px`. Applied to the header itself it
    // squashes the content to nothing, which is not a failure jsdom can see —
    // so the rule is asserted to be a separate, empty sibling of the content.
    const rule = screen.getByTestId('mesh-rule')
    expect(rule).toBeEmptyDOMElement()
    expect(rule).toHaveClass('ds-mesh-rule')

    const header = screen.getByTestId('chat-header')
    expect(header).not.toHaveClass('ds-mesh-rule')
    expect(within(header).getByText('mochi')).toBeInTheDocument()
    // The header carries the mark and nothing else. A participant is meant to be
    // reading an answer here, not navigating, so the record lives on the catalog
    // page and the prototype does not offer a way out of itself.
    expect(within(header).queryAllByRole('link')).toHaveLength(0)
  })
})

describe('asking a question', () => {
  it('shows the question, then the answer, then the claims under it', async () => {
    const user = userEvent.setup()
    render(<App />)

    await send(user, 'revenue-decline')

    const answer = await firstReply()
    expect(answer).toHaveTextContent(/enterprise subscription revenue fell/i)
    // Scoped to the transcript: the same question is also an option in the
    // composer's field, and finding both would pass for the wrong reason.
    expect(
      within(screen.getByTestId('chat-transcript')).getByText('Why did Q3 revenue decline?'),
    ).toBeInTheDocument()

    const claims = screen.getByTestId('chat-claims')
    const rows = within(claims).getAllByRole('button')
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveTextContent('Enterprise subscription revenue declined.')
  })

  it('keeps a running transcript rather than replacing the last exchange', async () => {
    const user = userEvent.setup()
    render(<App />)

    await send(user, 'revenue-decline')
    await firstReply()
    await send(user, 'product-adoption')
    await screen.findByTestId('chat-answer-product-adoption')

    // Both questions and both answers remain on screen.
    expect(screen.getByTestId('chat-answer-revenue-decline')).toBeInTheDocument()
    expect(screen.getByTestId('chat-answer-product-adoption')).toBeInTheDocument()
    expect(screen.getAllByTestId(/^chat-turn-/)).toHaveLength(2)
  })

  it('will not send a second question while the first is still being answered', async () => {
    const user = userEvent.setup()
    render(<App />)

    await send(user, 'revenue-decline')
    expect(screen.getByTestId('chat-send')).toBeDisabled()
    expect(screen.getByLabelText(/question/i)).toBeDisabled()

    await firstReply()
    await waitFor(() => expect(screen.getByTestId('chat-send')).toBeEnabled())
  })
})

describe('the provenance signal', () => {
  it('signals that checking is possible without opening anything', async () => {
    const user = userEvent.setup()
    render(<App />)

    await send(user, 'revenue-decline')
    await firstReply()

    const signal = screen.getByTestId('provenance-signal')
    expect(signal).toHaveTextContent('2 of 2 claims traceable to the source')
    // It invites; it does not perform the check.
    expect(screen.queryByTestId('evidence-column')).not.toBeInTheDocument()
  })
})

describe('opening the evidence', () => {
  it('opens the evidence column beside the conversation, and only that', async () => {
    const user = userEvent.setup()
    render(<App />)

    await send(user, 'revenue-decline')
    await firstReply()
    await user.click(screen.getByTestId('chat-claim-C1'))

    const column = await screen.findByTestId('evidence-column')
    expect(within(column).getByTestId('evidence-graph')).toBeInTheDocument()
    expect(column).toHaveTextContent(/Evidence · C1/)
    // The source is the third step. It has not been asked for, so it is not here.
    expect(screen.queryByTestId('source-column')).not.toBeInTheDocument()
  })

  it('keeps the conversation and the composer in place beside the column', async () => {
    const user = userEvent.setup()
    render(<App />)

    await send(user, 'revenue-decline')
    await firstReply()
    await user.click(screen.getByTestId('chat-claim-C1'))
    await screen.findByTestId('evidence-column')

    // The column takes width, not the composer, so a reader can ask the next
    // question without dismissing the evidence.
    expect(screen.getByLabelText(/question/i)).toBeEnabled()
    expect(screen.getByTestId('chat-send')).toBeEnabled()
    expect(screen.getByTestId('chat-answer-revenue-decline')).toBeInTheDocument()
  })

  it('opens the source for the evidence that is touched, and follows the claim', async () => {
    const user = userEvent.setup()
    render(<App />)

    await send(user, 'revenue-decline')
    await firstReply()
    await user.click(screen.getByTestId('chat-claim-C1'))
    await screen.findByTestId('evidence-column')

    const source = await showSource()
    expect(within(source).getByTestId('source-title')).toHaveTextContent(/Q3 Business Review/i)
    expect(within(source).getByTestId('source-mark-E1')).toHaveAttribute('data-active', 'true')
  })

  it('offers no control that opens the source by itself', async () => {
    const user = userEvent.setup()
    render(<App />)

    await send(user, 'revenue-decline')
    await firstReply()
    await user.click(screen.getByTestId('chat-claim-C1'))
    const column = await screen.findByTestId('evidence-column')

    // Reaching the passage is the consequence of touching a span, not a mode.
    // A button here would be a second way in and would sit on the graph's row.
    expect(within(column).queryByTestId('open-source')).not.toBeInTheDocument()
    expect(within(column).queryByRole('button', { name: /show source/i })).not.toBeInTheDocument()
    // The header's only control is the one that dismisses the column. Scoped to
    // the header because the graph underneath brings its own pan and zoom.
    const header = within(column).getByRole('heading', { name: /evidence · c1/i }).closest('header')!
    expect(within(header).getAllByRole('button')).toHaveLength(1)
    expect(within(header).getByRole('button', { name: /close the evidence column/i })).toBeInTheDocument()
  })

  it('opens the source when a piece of evidence is selected in the graph', async () => {
    const user = userEvent.setup()
    render(<App />)

    await send(user, 'revenue-decline')
    await firstReply()
    await user.click(screen.getByTestId('chat-claim-C1'))
    await screen.findByTestId('evidence-column')
    expect(screen.queryByTestId('source-column')).not.toBeInTheDocument()

    // Asking for a specific passage is what reveals the third column, from
    // either workspace tab.
    await clickEvidenceNode('evidence:E2')
    const source = await screen.findByTestId('source-column')
    expect(within(source).getByTestId('source-mark-E2')).toHaveAttribute('data-active', 'true')
  })

  it('opens the source from the data view too', async () => {
    const user = userEvent.setup()
    render(<App />)

    await send(user, 'revenue-decline')
    await firstReply()
    await user.click(screen.getByTestId('chat-claim-C1'))
    await screen.findByTestId('evidence-column')

    await user.click(screen.getByRole('tab', { name: /Data View/i }))
    await screen.findByTestId('data-view')
    await user.click(screen.getAllByTestId('data-point-q1')[0])

    await screen.findByTestId('source-column')
  })

  it('closes the source from the source column, and leaves the evidence open', async () => {
    const user = userEvent.setup()
    render(<App />)

    await send(user, 'revenue-decline')
    await firstReply()
    await user.click(screen.getByTestId('chat-claim-C1'))
    await screen.findByTestId('evidence-column')
    await showSource()

    // The source closes itself; the claim being checked does not go with it.
    await user.click(screen.getByTestId('source-close'))
    await waitFor(() => expect(screen.queryByTestId('source-column')).not.toBeInTheDocument())
    expect(screen.getByTestId('evidence-column')).toBeInTheDocument()
  })

  it('follows the evidence when a second claim is clicked, and steps the source back', async () => {
    const user = userEvent.setup()
    render(<App />)

    await send(user, 'revenue-decline')
    await firstReply()
    await user.click(screen.getByTestId('chat-claim-C1'))
    await screen.findByTestId('evidence-column')
    const source = await showSource()
    expect(within(source).getByTestId('source-mark-E1')).toHaveAttribute('data-active', 'true')

    // A new claim is a new question, so the source closes and the evidence
    // column follows the click.
    await user.click(screen.getByTestId('chat-claim-C2'))
    await waitFor(() => expect(screen.queryByTestId('source-column')).not.toBeInTheDocument())
    const column = screen.getByTestId('evidence-column')
    expect(column).toHaveTextContent(/Evidence · C2/)
  })

  it('shows the evidence for the claim that was clicked, not the last one sent', async () => {
    const user = userEvent.setup()
    render(<App />)

    await send(user, 'revenue-decline')
    await firstReply()
    await send(user, 'product-adoption')
    await screen.findByTestId('chat-answer-product-adoption')

    // Open a claim from the *older* exchange: the column must follow the click
    // rather than whichever case happens to be most recent.
    await user.click(
      within(screen.getByTestId('chat-turn-revenue-decline-0')).getByTestId('chat-claim-C1'),
    )
    const column = await screen.findByTestId('evidence-column')
    expect(column).toHaveTextContent(/Evidence · C1/)

    await showSource()
    expect(await screen.findByTestId('source-title')).toHaveTextContent(/Q3 Business Review/i)
  })

  it('closes the columns on demand, leaving the conversation intact', async () => {
    const user = userEvent.setup()
    render(<App />)

    await send(user, 'revenue-decline')
    await firstReply()
    await user.click(screen.getByTestId('chat-claim-C1'))
    await screen.findByTestId('evidence-column')
    await showSource()

    // Closing the evidence empties the workspace right to left.
    await user.click(screen.getByTestId('evidence-close'))
    await waitFor(() => expect(screen.queryByTestId('source-column')).not.toBeInTheDocument())
    await waitFor(() => expect(screen.queryByTestId('evidence-column')).not.toBeInTheDocument())
    expect(screen.getByTestId('chat-answer-revenue-decline')).toBeInTheDocument()
  })

  it('backs out one column per Escape', async () => {
    const user = userEvent.setup()
    render(<App />)

    await send(user, 'revenue-decline')
    await firstReply()
    await user.click(screen.getByTestId('chat-claim-C1'))
    await screen.findByTestId('evidence-column')
    await showSource()

    // Two steps deep, so two presses: the source, then the evidence.
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByTestId('source-column')).not.toBeInTheDocument())
    expect(screen.getByTestId('evidence-column')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByTestId('evidence-column')).not.toBeInTheDocument())
    expect(screen.getByTestId('chat-answer-revenue-decline')).toBeInTheDocument()
  })
})

describe('a claim with no evidence', () => {
  const unsupported: DemoCase = {
    id: 'test-unsupported',
    title: 'Unsupported',
    question: 'Does the redesign cause the increase?',
    answer: 'Yes, the redesign caused the increase.',
    claims: [
      { id: 'C1', text: 'The flow was simplified.', evidenceIds: ['E1'] },
      { id: 'C2', text: 'Simplification caused the increase.', evidenceIds: [] },
    ],
    evidence: [
      { id: 'E1', text: 'The flow was simplified.', sourceId: 'S1', paragraphId: 'P1' },
    ],
    source: {
      id: 'S1',
      title: 'A note',
      section: 'Fictional demonstration data only',
      paragraphs: [{ id: 'P1', text: 'The flow was simplified.', evidenceIds: ['E1'] }],
    },
    dataView: { type: 'n/a', title: 'None', description: 'None', data: [], series: [] },
  }

  it('counts it as untraced in the signal rather than giving it a filled dot', () => {
    render(<ProvenanceSignal demoCase={unsupported} />)
    expect(screen.getByTestId('provenance-signal')).toHaveTextContent(
      '1 of 2 claims traceable to the source · 1 with no evidence',
    )
  })

  it('says so on the claim itself, before it is clicked', () => {
    render(<ChatClaimList activeClaimId={null} demoCase={unsupported} onOpen={() => {}} />)

    const claim = screen.getByTestId('chat-claim-C2')
    expect(claim).toHaveTextContent('C2 · no evidence linked')
    expect(claim).toHaveAccessibleName(/has no evidence linked/i)
  })
})
