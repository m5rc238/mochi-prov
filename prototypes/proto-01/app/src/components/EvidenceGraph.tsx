import { useEffect, useMemo } from 'react'
import { Background, BackgroundVariant, Controls, ReactFlow, ReactFlowProvider, useReactFlow } from '@xyflow/react'
import type { NodeMouseHandler } from '@xyflow/react'

import { useEvidenceSelection } from '../hooks/useEvidenceSelection'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { applyGraphFocus, buildProvenanceGraph, getGraphFocus, type ProvenanceEdge, type ProvenanceNode } from '../model/graph'
import { ProvenanceNodeView } from './ProvenanceNodeView'

const nodeTypes = { provenance: ProvenanceNodeView }

/**
 * Node body copy is 14px. Below roughly this zoom it stops being legible, so on a
 * narrow centre pane the graph pans instead of shrinking any further.
 */
const MIN_FIT_ZOOM = 0.72

const GraphCanvas = ({ onEvidenceFocus }: { onEvidenceFocus?: (evidenceId: string) => void }) => {
  const { demoCase, resolved, selectClaim, selectEvidence } = useEvidenceSelection()
  const reducedMotion = useReducedMotion()
  const { fitView } = useReactFlow()
  const caseId = demoCase.id

  const graph = useMemo(() => buildProvenanceGraph(demoCase), [demoCase])
  const focus = useMemo(() => getGraphFocus(resolved), [resolved])
  const { nodes, edges } = useMemo(() => applyGraphFocus(graph, demoCase, focus), [graph, demoCase, focus])

  // A new case means new nodes: refit so the whole chain is on screen.
  useEffect(() => {
    fitView({ padding: 0.14, minZoom: MIN_FIT_ZOOM, maxZoom: 1, duration: reducedMotion ? 0 : 0.45 })
  }, [caseId, fitView, reducedMotion])

  const onNodeClick = useMemo<NodeMouseHandler<ProvenanceNode>>(
    () => (_event, node) => {
      const { kind, entityId } = node.data
      if (!entityId) return
      if (kind === 'claim') selectClaim(entityId)
      if (kind === 'evidence') {
        selectEvidence(entityId)
        // Proto 01 has the source document on screen already, so nothing needs to
        // be revealed. Proto 02 opens the source in a third column and uses this
        // to reveal it.
        onEvidenceFocus?.(entityId)
      }
    },
    [selectClaim, selectEvidence, onEvidenceFocus],
  )

  return (
    <div className="ds-panel relative min-h-0 flex-1 overflow-hidden" data-testid="evidence-graph">
      <ReactFlow<ProvenanceNode, ProvenanceEdge>
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        deleteKeyCode={null}
        selectionOnDrag={false}
        panOnScroll
        minZoom={0.3}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        fitView
        fitViewOptions={{ padding: 0.14, minZoom: MIN_FIT_ZOOM, maxZoom: 1 }}
      >
        <Background variant={BackgroundVariant.Dots} gap={18} size={1} color="var(--color-rule)" />
        <Controls showInteractive={false} position="bottom-right" />
      </ReactFlow>
    </div>
  )
}

export const EvidenceGraph = ({ onEvidenceFocus }: { onEvidenceFocus?: (evidenceId: string) => void } = {}) => {
  const { resolved } = useEvidenceSelection()

  const hint = resolved.evidence
    ? `Tracing ${resolved.evidence.id} → ${resolved.evidence.paragraphId} of ${resolved.evidence.sourceId}. Read-only view: select a node, pan, zoom, or fit.`
    : 'Read-only provenance view. Select a node to trace it back to the source.'

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <p className="ds-caption shrink-0" data-testid="graph-hint">
        {hint}
      </p>
      <ReactFlowProvider>
        <GraphCanvas onEvidenceFocus={onEvidenceFocus} />
      </ReactFlowProvider>
    </div>
  )
}
