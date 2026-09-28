import type { Edge, Node } from '@xyflow/react'
import { MarkerType } from '@xyflow/react'

import { getClaimEvidence } from './selectors'
import type { ResolvedSelection } from './selectors'
import type { DemoCase } from './types'

/** The five node kinds the specification asks for. Nothing else is rendered. */
export type GraphNodeKind = 'question' | 'answer' | 'claim' | 'evidence' | 'source'

export type ProvenanceNodeData = {
  kind: GraphNodeKind
  /** Id of the underlying application entity, or null for the fixed nodes. */
  entityId: string | null
  label: string
  text: string
  meta: string
  /** Evidence contained by a source paragraph, rendered on the source node. */
  evidenceIds: string[]
  emphasized: boolean
  selected: boolean
}

export type ProvenanceNode = Node<ProvenanceNodeData, 'provenance'>
export type ProvenanceEdge = Edge

export const GRAPH_NODE_WIDTH = 184
export const GRAPH_NODE_HEIGHT = 132

const SLOT_WIDTH = 192
const GROUP_GAP = 44
const ROW_GAP = 164

export const nodeIdFor = {
  question: 'question',
  answer: 'answer',
  claim: (id: string) => `claim:${id}`,
  evidence: (id: string) => `evidence:${id}`,
  source: 'source',
} as const

const ROW_Y: Record<GraphNodeKind, number> = {
  question: 0,
  answer: ROW_GAP,
  claim: ROW_GAP * 2,
  evidence: ROW_GAP * 3,
  source: ROW_GAP * 4,
}

const baseNode = (
  id: string,
  kind: GraphNodeKind,
  entityId: string | null,
  label: string,
  text: string,
  meta: string,
  x: number,
  y: number,
): ProvenanceNode => ({
  id,
  type: 'provenance',
  position: { x, y },
  data: {
    kind,
    entityId,
    label,
    text,
    meta,
    evidenceIds: [],
    emphasized: false,
    selected: false,
  },
  draggable: false,
  connectable: false,
  selectable: true,
  focusable: true,
  style: { width: GRAPH_NODE_WIDTH, height: GRAPH_NODE_HEIGHT },
})

export type ProvenanceGraph = {
  nodes: ProvenanceNode[]
  edges: ProvenanceEdge[]
  bounds: { width: number; height: number }
}

/**
 * Derives the graph from the case. The layout is a plain top-to-bottom chain
 * with claim groups packed left to right — deterministic, with no layout
 * engine and no physics.
 */
export const buildProvenanceGraph = (demoCase: DemoCase): ProvenanceGraph => {
  const groups = demoCase.claims.map((claim) => {
    const evidence = getClaimEvidence(demoCase, claim.id)
    return { claim, evidence, width: GRAPH_NODE_WIDTH + Math.max(0, evidence.length - 1) * SLOT_WIDTH }
  })

  const totalWidth =
    groups.reduce((sum, g) => sum + g.width, 0) + Math.max(0, groups.length - 1) * GROUP_GAP
  const centerX = totalWidth / 2

  const nodes: ProvenanceNode[] = []
  const edges: ProvenanceEdge[] = []

  nodes.push(
    baseNode(
      nodeIdFor.question,
      'question',
      null,
      'Question',
      demoCase.question,
      'Asked',
      centerX - GRAPH_NODE_WIDTH / 2,
      ROW_Y.question,
    ),
  )

  nodes.push(
    baseNode(
      nodeIdFor.answer,
      'answer',
      null,
      'Answer',
      demoCase.answer,
      'One sentence',
      centerX - GRAPH_NODE_WIDTH / 2,
      ROW_Y.answer,
    ),
  )
  edges.push({
    id: 'e:question>answer',
    source: nodeIdFor.question,
    target: nodeIdFor.answer,
    type: 'smoothstep',
  })

  let cursor = 0
  for (const group of groups) {
    const groupCenter = cursor + group.width / 2
    const claimNodeId = nodeIdFor.claim(group.claim.id)

    nodes.push(
      baseNode(
        claimNodeId,
        'claim',
        group.claim.id,
        `Claim ${group.claim.id}`,
        group.claim.text,
        `${group.evidence.length} evidence`,
        groupCenter - GRAPH_NODE_WIDTH / 2,
        ROW_Y.claim,
      ),
    )
    edges.push({
      id: `e:answer>${claimNodeId}`,
      source: nodeIdFor.answer,
      target: claimNodeId,
      type: 'smoothstep',
    })

    group.evidence.forEach((evidence, index) => {
      const evidenceNodeId = nodeIdFor.evidence(evidence.id)
      const x = cursor + index * SLOT_WIDTH
      nodes.push(
        baseNode(
          evidenceNodeId,
          'evidence',
          evidence.id,
          `Evidence ${evidence.id}`,
          evidence.text,
          `${evidence.sourceId} · ${evidence.paragraphId}`,
          x,
          ROW_Y.evidence,
        ),
      )
      edges.push({
        id: `e:${claimNodeId}>${evidenceNodeId}`,
        source: claimNodeId,
        target: evidenceNodeId,
        type: 'smoothstep',
      })
      edges.push({
        id: `e:${evidenceNodeId}>source`,
        source: evidenceNodeId,
        target: nodeIdFor.source,
        type: 'smoothstep',
      })
    })

    cursor += group.width + GROUP_GAP
  }

  // The source node reports which paragraph the active evidence came from, so
  // the exact location is visible in the graph without a sixth node kind.
  const paragraphCount = demoCase.source.paragraphs.length
  nodes.push(
    baseNode(
      nodeIdFor.source,
      'source',
      null,
      'Source',
      demoCase.source.title,
      `${demoCase.source.section} · ${paragraphCount} paragraphs`,
      centerX - GRAPH_NODE_WIDTH / 2,
      ROW_Y.source,
    ),
  )

  return {
    nodes,
    edges,
    bounds: { width: Math.max(totalWidth, GRAPH_NODE_WIDTH), height: ROW_Y.source + GRAPH_NODE_HEIGHT },
  }
}

export type GraphFocus = {
  mode: 'all' | 'path'
  /** Nodes on the active provenance path. Everything else stays visible but
   *  loses emphasis — the reader keeps their bearings. */
  pathNodeIds: Set<string>
  primaryNodeId: string | null
}

export const getGraphFocus = (resolved: ResolvedSelection): GraphFocus => {
  if (!resolved.hasSelection) {
    return { mode: 'all', pathNodeIds: new Set(), primaryNodeId: null }
  }

  const pathNodeIds = new Set<string>([
    nodeIdFor.question,
    nodeIdFor.answer,
    nodeIdFor.source,
    ...resolved.pathClaimIds.map(nodeIdFor.claim),
    ...resolved.pathEvidenceIds.map(nodeIdFor.evidence),
  ])

  const primaryNodeId = resolved.evidence
    ? nodeIdFor.evidence(resolved.evidence.id)
    : resolved.claim
      ? nodeIdFor.claim(resolved.claim.id)
      : null

  return { mode: 'path', pathNodeIds, primaryNodeId }
}

/** Emphasis is a rendering concern applied to a copy of the graph, never to the
 *  model. The node and edge arrays are rebuilt only when the case or the
 *  selection actually changes. */
export const applyGraphFocus = (
  graph: ProvenanceGraph,
  demoCase: DemoCase,
  focus: GraphFocus,
): ProvenanceGraph => {
  const sourceMetaPrefix = `${demoCase.source.section} ·`

  const nodes = graph.nodes.map((node): ProvenanceNode => {
    const onPath = focus.mode === 'all' || focus.pathNodeIds.has(node.id)
    let meta = node.data.meta
    if (node.data.kind === 'source' && focus.primaryNodeId) {
      const primaryEvidence = demoCase.evidence.find(
        (e) => nodeIdFor.evidence(e.id) === focus.primaryNodeId,
      )
      if (primaryEvidence) meta = `${sourceMetaPrefix} from ${primaryEvidence.paragraphId}`
    }

    return {
      ...node,
      data: {
        ...node.data,
        meta,
        emphasized: onPath,
        selected: node.id === focus.primaryNodeId,
      },
    }
  })

  const edges = graph.edges.map((edge): ProvenanceEdge => {
    const onPath = focus.mode === 'all' || (focus.pathNodeIds.has(edge.source) && focus.pathNodeIds.has(edge.target))
    const dim = focus.mode === 'all' ? false : !onPath
    return {
      ...edge,
      animated: false,
      style: {
        stroke: onPath && focus.mode === 'path' ? 'var(--color-ink)' : 'var(--color-rule)',
        strokeWidth: onPath && focus.mode === 'path' ? 1.75 : 1,
        opacity: dim ? 0.28 : 1,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 14,
        height: 14,
        color: onPath && focus.mode === 'path' ? 'var(--color-ink)' : 'var(--color-rule)',
      },
    }
  })

  return { ...graph, nodes, edges }
}
