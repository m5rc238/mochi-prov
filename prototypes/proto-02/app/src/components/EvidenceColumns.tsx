import { useEvidenceSelection } from '../../../../proto-01/app/src/hooks/useEvidenceSelection'
import { SourceDocument } from '../../../../proto-01/app/src/components/SourceDocument'
import { Workspace } from '../../../../proto-01/app/src/components/Workspace'
import type { Claim } from '../../../../proto-01/app/src/model/types'
import { CloseButton } from './CloseButton'

/** The second column: the evidence chain.
 *
 * This is Proto 01's centre workspace, unchanged, moved beside the conversation
 * instead of between two other panes. It carries the graph and the data view as
 * tabs, because they are two renderings of one selection rather than two steps
 * in checking it.
 *
 * There is no "show source" control here. Reaching the passage is not a mode the
 * reader switches on, it is the consequence of touching a piece of evidence —
 * the same short step from a claim to its citation that the products this
 * borrows from use, and one less control competing with the graph.
 */
export const EvidenceColumn = ({
  claim,
  onClose,
  onEvidenceFocus,
  onPointFocus,
}: {
  claim: Claim
  onClose: () => void
  onEvidenceFocus: (evidenceId: string) => void
  onPointFocus: (pointId: string) => void
}) => (
  <section
    aria-label={`Evidence for claim ${claim.id}`}
    className="pane-column-evidence flex min-h-0 shrink-0 flex-col border-l ds-divider bg-canvas pl-3 pt-3"
    data-testid="evidence-column"
    style={{ borderLeftWidth: 1 }}
  >
    <header className="mb-3 flex shrink-0 items-start justify-between gap-2">
      <div className="min-w-0">
        <h2 className="ds-label">Evidence · {claim.id}</h2>
        <p className="ds-body mt-0.5 truncate text-[14px] text-ink">{claim.text}</p>
      </div>
      <CloseButton label="Close the evidence column" onClick={onClose} testId="evidence-close" />
    </header>

    <div className="flex min-h-0 flex-1 flex-col">
      <Workspace
        compact
        onEvidenceFocus={onEvidenceFocus}
        onPointFocus={onPointFocus}
        tabLabel="Evidence chain"
      />
    </div>
  </section>
)

/** The third column: the source itself.
 *
 * Reached by selecting a piece of evidence in the column beside it, so it is the
 * last thing to appear: a reader who never touches a span never sees it.
 *
 * The dismiss control sits on the column, above the document panel, rather than
 * inside the panel's own header. The panel is a rendering of the source and its
 * header belongs to it; a control that closes the *column* does not belong
 * inside the thing it is closing, and it sat on the same row as the source title
 * where it read as a property of the document. */
export const SourceColumn = ({ onClose }: { onClose: () => void }) => {
  const { demoCase } = useEvidenceSelection()

  return (
    <div
      className="pane-column-source flex min-h-0 shrink-0 flex-col border-l ds-divider bg-canvas p-3"
      data-testid="source-column"
      style={{ borderLeftWidth: 1 }}
    >
      <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
        <span className="ds-label">Source · {demoCase.source.id}</span>
        <CloseButton label="Close the source column" onClick={onClose} testId="source-close" />
      </div>
      <SourceDocument footerNote="Every highlighted span is quoted from the evidence behind the claim you opened." />
    </div>
  )
}
