import { describe, expect, it } from 'vitest'

import { DEMO_CASES } from '../model/cases'
import { applyGraphFocus, buildProvenanceGraph, getGraphFocus, nodeIdFor } from '../model/graph'
import { resolveSelection } from '../model/selectors'
import { segmentParagraph } from '../model/source'

const resolve = (caseId: string, claimId: string | null, evidenceId: string | null) => {
  const demoCase = DEMO_CASES.find((c) => c.id === caseId)!
  return { demoCase, resolved: resolveSelection(demoCase, { claimId, evidenceId }) }
}

describe('graph derivation', () => {
  it('renders exactly one node per model entity, with no duplicates', () => {
    for (const demoCase of DEMO_CASES) {
      const { nodes } = buildProvenanceGraph(demoCase)
      const ids = nodes.map((n) => n.id)

      expect(new Set(ids).size).toBe(ids.length)
      expect(new Set(ids)).toEqual(
        new Set([
          'question',
          'answer',
          'source',
          ...demoCase.claims.map((c) => `claim:${c.id}`),
          ...demoCase.evidence.map((e) => `evidence:${e.id}`),
        ]),
      )
      expect(ids.slice(0, 2)).toEqual(['question', 'answer'])
      expect(ids.at(-1)).toBe('source')
    }
  })

  it('never contains a node for an entity that is not in the model', () => {
    for (const demoCase of DEMO_CASES) {
      const { nodes } = buildProvenanceGraph(demoCase)
      const claims = new Set(demoCase.claims.map((c) => c.id))
      const evidence = new Set(demoCase.evidence.map((e) => e.id))

      for (const node of nodes) {
        if (node.data.kind === 'claim') expect(claims.has(node.data.entityId!)).toBe(true)
        if (node.data.kind === 'evidence') expect(evidence.has(node.data.entityId!)).toBe(true)
      }
    }
  })

  it('only creates edges that exist in the data model', () => {
    for (const demoCase of DEMO_CASES) {
      const { edges } = buildProvenanceGraph(demoCase)
      const legal = new Set<string>(['question>answer', 'answer>source'])

      for (const claim of demoCase.claims) legal.add(`answer>claim:${claim.id}`)
      for (const evidence of demoCase.evidence) legal.add(`evidence:${evidence.id}>source`)
      for (const claim of demoCase.claims) {
        for (const evidenceId of claim.evidenceIds) {
          legal.add(`claim:${claim.id}>evidence:${evidenceId}`)
        }
      }

      for (const edge of edges) {
        expect(legal.has(`${edge.source}>${edge.target}`), `${demoCase.id}: ${edge.id}`).toBe(true)
      }
    }
  })

  it('links every claim to all of its evidence and every evidence to the source', () => {
    for (const demoCase of DEMO_CASES) {
      const { edges } = buildProvenanceGraph(demoCase)
      for (const claim of demoCase.claims) {
        for (const evidenceId of claim.evidenceIds) {
          expect(edges.some((e) => e.source === `claim:${claim.id}` && e.target === `evidence:${evidenceId}`)).toBe(true)
        }
      }
      for (const evidence of demoCase.evidence) {
        expect(edges.some((e) => e.source === `evidence:${evidence.id}` && e.target === 'source')).toBe(true)
      }
    }
  })

  it('carries the model text on each node rather than a copy of its own', () => {
    const demoCase = DEMO_CASES[0]!
    const { nodes } = buildProvenanceGraph(demoCase)
    const claim = nodes.find((n) => n.id === 'claim:C1')!
    const evidence = nodes.find((n) => n.id === 'evidence:E1')!

    expect(claim.data.text).toBe(demoCase.claims[0]!.text)
    expect(evidence.data.text).toBe(demoCase.evidence[0]!.text)
    expect(evidence.data.meta).toBe(`${evidence.data.entityId ? demoCase.evidence[0]!.sourceId : ''} · P1`)
  })

  it('produces a different graph for every case', () => {
    const shapes = DEMO_CASES.map((c) => {
      const { nodes, edges } = buildProvenanceGraph(c)
      return `${nodes.map((n) => n.id).join(',')}|${edges.length}`
    })
    expect(new Set(shapes).size).toBe(3)
  })

  it('is read-only: no node is draggable or connectable', () => {
    for (const node of buildProvenanceGraph(DEMO_CASES[0]!).nodes) {
      expect(node.draggable).toBe(false)
      expect(node.connectable).toBe(false)
    }
  })
})

describe('graph focus', () => {
  it('emphasises everything when nothing is selected', () => {
    const focus = getGraphFocus(resolveSelection(DEMO_CASES[0]!, { claimId: null, evidenceId: null }))
    expect(focus.mode).toBe('all')
    expect(focus.primaryNodeId).toBeNull()

    const { demoCase } = resolve('revenue-decline', null, null)
    const graph = applyGraphFocus(buildProvenanceGraph(demoCase), demoCase, focus)
    expect(graph.nodes.every((n) => n.data.emphasized)).toBe(true)
    expect(graph.nodes.every((n) => !n.data.selected)).toBe(true)
  })

  it('keeps unrelated nodes visible but de-emphasised when a claim is traced', () => {
    const { demoCase, resolved } = resolve('revenue-decline', 'C2', 'E2')
    const focus = getGraphFocus(resolved)
    const graph = applyGraphFocus(buildProvenanceGraph(demoCase), demoCase, focus)

    const byId = new Map(graph.nodes.map((n) => [n.id, n]))
    expect(focus.primaryNodeId).toBe(nodeIdFor.evidence('E2'))
    expect(byId.get('evidence:E2')!.data.selected).toBe(true)
    expect(byId.get('evidence:E2')!.data.emphasized).toBe(true)
    expect(byId.get('claim:C1')!.data.emphasized).toBe(false)
    expect(byId.get('evidence:E3')!.data.emphasized).toBe(false)
    // Nothing is hidden — the reader keeps the surrounding chain in view.
    expect(graph.nodes).toHaveLength(buildProvenanceGraph(demoCase).nodes.length)
  })

  it('marks the edges on the traced path and dims the rest', () => {
    const { demoCase, resolved } = resolve('revenue-decline', 'C2', 'E2')
    const graph = applyGraphFocus(buildProvenanceGraph(demoCase), demoCase, getGraphFocus(resolved))
    const traced = graph.edges.find((e) => e.id === 'e:claim:C2>evidence:E2')!
    const unrelated = graph.edges.find((e) => e.id === 'e:claim:C1>evidence:E1')!

    expect((traced.style as { opacity?: number }).opacity).toBe(1)
    expect((unrelated.style as { opacity?: number }).opacity).toBeLessThan(1)
  })

  it('names the paragraph the traced evidence came from on the source node', () => {
    const { demoCase, resolved } = resolve('revenue-decline', 'C2', 'E2')
    const graph = applyGraphFocus(buildProvenanceGraph(demoCase), demoCase, getGraphFocus(resolved))
    const source = graph.nodes.find((n) => n.id === 'source')!
    expect(source.data.meta).toContain('from P2')
  })

  it('leaves no stale node behind when the case changes', () => {
    const first = buildProvenanceGraph(DEMO_CASES[0]!)
    const secondCase = DEMO_CASES[1]!
    const second = applyGraphFocus(
      buildProvenanceGraph(secondCase),
      secondCase,
      getGraphFocus(resolveSelection(secondCase, { claimId: 'C1', evidenceId: 'E1' })),
    )

    // The second graph contains exactly the entities of the second case, and
    // nothing that only existed in the first.
    expect(new Set(second.nodes.map((n) => n.id))).toEqual(
      new Set([
        'question',
        'answer',
        'source',
        ...secondCase.claims.map((c) => `claim:${c.id}`),
        ...secondCase.evidence.map((e) => `evidence:${e.id}`),
      ]),
    )
    expect(second.nodes.find((n) => n.id === 'evidence:E4')).toBeUndefined()
    expect(first.nodes.some((n) => n.id === 'evidence:E4')).toBe(true)
  })
})

describe('source segmentation', () => {
  it('produces one highlight per evidence item inside a paragraph', () => {
    const demoCase = DEMO_CASES[0]!
    const paragraph = demoCase.source.paragraphs[0]!
    const segments = segmentParagraph(paragraph, demoCase.evidence)
    const highlights = segments.filter((s) => s.kind === 'evidence')

    expect(highlights.map((s) => (s as { evidenceId: string }).evidenceId)).toEqual(['E1', 'E3', 'E4'])
  })

  it('rebuilds the paragraph text exactly', () => {
    for (const demoCase of DEMO_CASES) {
      for (const paragraph of demoCase.source.paragraphs) {
        const rebuilt = segmentParagraph(paragraph, demoCase.evidence)
          .map((s) => s.text)
          .join('')
        expect(rebuilt).toBe(paragraph.text)
      }
    }
  })

  it('highlights a single sentence without touching its neighbours', () => {
    const demoCase = DEMO_CASES[0]!
    const segments = segmentParagraph(demoCase.source.paragraphs[1]!, demoCase.evidence)
    expect(segments).toEqual([
      { kind: 'text', text: 'Customer concentration remained high. ' },
      {
        kind: 'evidence',
        text: 'Several large customers reduced their annual contract value.',
        evidenceId: 'E2',
      },
      { kind: 'text', text: ' No single account accounted for more than 6% of Q3 revenue.' },
    ])
  })

  it('leaves a paragraph untouched when it holds no evidence', () => {
    const demoCase = DEMO_CASES[1]!
    const segment = segmentParagraph(
      { id: 'PX', text: 'No evidence here.' },
      demoCase.evidence,
    )
    expect(segment).toEqual([{ kind: 'text', text: 'No evidence here.' }])
  })
})
