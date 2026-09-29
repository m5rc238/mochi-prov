import { useEffect, useRef } from 'react'
import gsap from 'gsap'

import { useEvidenceSelection } from '../hooks/useEvidenceSelection'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { DataView } from './DataView'
import { EvidenceGraph } from './EvidenceGraph'
import { WorkspaceTabs } from './WorkspaceTabs'

export const Workspace = ({
  tabLabel,
  compact,
  onEvidenceFocus,
  onPointFocus,
}: {
  /** Names this workspace for assistive technology. Proto 01 is the centre
   *  column; in Proto 02 it is the middle one. */
  tabLabel?: string
  /** Drops the tab hint, which does not fit a narrow column. */
  compact?: boolean
  onEvidenceFocus?: (evidenceId: string) => void
  onPointFocus?: (pointId: string) => void
} = {}) => {
  const { activeWorkspaceTab } = useEvidenceSelection()
  const reducedMotion = useReducedMotion()
  const contentRef = useRef<HTMLDivElement>(null)
  const tween = useRef<gsap.core.Tween | null>(null)

  // One short entrance per tab change. It exists to show that the two tabs are
  // two views of the same evidence, not two different screens.
  useEffect(() => {
    const element = contentRef.current
    if (reducedMotion || !element) return
    tween.current?.kill()
    tween.current = gsap.fromTo(
      element,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out', overwrite: true },
    )
    return () => {
      tween.current?.kill()
    }
  }, [activeWorkspaceTab, reducedMotion])

  return (
    <section aria-label="Evidence workspace" className="flex h-full min-h-0 flex-col gap-3">
      <WorkspaceTabs compact={compact} label={tabLabel} />
      <div ref={contentRef} className="min-h-0 flex-1" data-testid={`workspace-panel-${activeWorkspaceTab}`}>
        {activeWorkspaceTab === 'graph' ? (
          <EvidenceGraph onEvidenceFocus={onEvidenceFocus} />
        ) : (
          <DataView onPointFocus={onPointFocus} />
        )}
      </div>
    </section>
  )
}
