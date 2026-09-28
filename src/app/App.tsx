import { useEffect, useRef } from 'react'
import gsap from 'gsap'

import { CaseSelector } from '../components/CaseSelector'
import { AnswerPanel } from '../components/AnswerPanel'
import { ClaimList } from '../components/ClaimList'
import { QuestionPanel } from '../components/QuestionPanel'
import { SourceDocument } from '../components/SourceDocument'
import { Workspace } from '../components/Workspace'
import { SelectionProvider, useEvidenceSelection } from '../hooks/useEvidenceSelection'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { validateCase } from '../model/selectors'

const Shell = () => {
  const { demoCase } = useEvidenceSelection()
  const reducedMotion = useReducedMotion()
  const mainRef = useRef<HTMLElement>(null)
  const tween = useRef<gsap.core.Tween | null>(null)
  const caseId = demoCase.id

  // A short settle when the case changes, so the three panes read as one
  // replaced document rather than three unrelated edits.
  useEffect(() => {
    const element = mainRef.current
    if (reducedMotion || !element) return
    tween.current?.kill()
    tween.current = gsap.fromTo(
      element,
      { opacity: 0.4, y: 6 },
      { opacity: 1, y: 0, duration: 0.32, ease: 'power2.out', overwrite: true },
    )
    return () => {
      tween.current?.kill()
    }
  }, [caseId, reducedMotion])

  useEffect(() => {
    if (!import.meta.env.DEV) return
    const problems = validateCase(demoCase)
    if (problems.length > 0) {
      console.error(`[provenance] case "${demoCase.id}" violates its invariants`, problems)
    }
  }, [demoCase])

  return (
    <div className="flex h-full flex-col bg-canvas">
      <CaseSelector />
      <main
        ref={mainRef}
        data-testid="app-main"
        data-case-id={caseId}
        className="grid min-h-0 flex-1 grid-cols-[clamp(264px,22vw,336px)_minmax(0,1fr)_clamp(300px,26vw,404px)] gap-3 p-3"
      >
        <div
          className="ds-panel flex min-h-0 flex-col gap-5 overflow-y-auto px-4 py-4"
          data-testid="left-pane"
        >
          <QuestionPanel />
          <AnswerPanel />
          <ClaimList />
        </div>

        <Workspace />

        <SourceDocument />
      </main>
    </div>
  )
}

export const App = () => (
  <SelectionProvider>
    <Shell />
  </SelectionProvider>
)
