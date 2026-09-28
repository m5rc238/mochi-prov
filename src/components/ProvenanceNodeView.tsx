import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { Node } from '@xyflow/react'

import type { ProvenanceNodeData } from '../model/graph'

const KIND_LABEL: Record<ProvenanceNodeData['kind'], string> = {
  question: 'Question',
  answer: 'Answer',
  claim: 'Claim',
  evidence: 'Evidence',
  source: 'Source',
}

/** A custom node so the graph speaks the same design language as the rest of
 *  the product: hairline surface, mono type label, one accent bar. */
export const ProvenanceNodeView = ({ data }: NodeProps<Node<ProvenanceNodeData, 'provenance'>>) => {
  const { kind, label, text, meta, emphasized, selected } = data

  return (
    <div
      className={[
        'ds-entity-' + kind,
        'h-full w-full overflow-hidden rounded-card border bg-surface pl-[9px] transition-opacity duration-200',
        selected ? 'border-ink' : 'border-rule',
        emphasized ? 'opacity-100' : 'opacity-40',
      ].join(' ')}
      data-node-kind={kind}
      data-entity-id={data.entityId ?? ''}
      data-emphasized={emphasized}
      data-selected={selected}
    >
      <Handle type="target" position={Position.Top} />

      <span aria-hidden="true" className="ds-accent-bar absolute inset-y-0 left-0 w-[3px]" />

      <div className="flex h-full flex-col gap-1.5 pr-2.5 py-2.5">
        <span className="ds-chip ds-chip-bg w-fit" title={KIND_LABEL[kind]}>
          {label}
        </span>
        <p className="ds-body line-clamp-4 flex-1 text-ink" title={text}>
          {text}
        </p>
        <span className="ds-label line-clamp-1">{meta}</span>
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
