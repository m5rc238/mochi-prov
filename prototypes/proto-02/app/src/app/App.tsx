import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

import { MochiLogo } from '../../../../proto-01/app/src/components/MochiLogo'
import {
  SelectionProvider,
  useEvidenceSelection,
} from '../../../../proto-01/app/src/hooks/useEvidenceSelection'
import { useReducedMotion } from '../../../../proto-01/app/src/hooks/useReducedMotion'
import { getCaseById, validateCase } from '../../../../proto-01/app/src/model/selectors'
import { DEFAULT_CASE_ID } from '../../../../proto-01/app/src/model/cases'
import type { Claim, DemoCase } from '../../../../proto-01/app/src/model/types'
import { ChatComposer } from '../components/ChatComposer'
import { ChatTurn } from '../components/ChatTurn'
import { EvidenceColumn, SourceColumn } from '../components/EvidenceColumns'

/** How long the reply takes to arrive.
 *
 * Not decoration for its own sake: a participant has to be able to tell that
 * they asked something and something answered, and an answer that is already on
 * screen when the button is pressed collapses that distinction. */
const REPLY_DELAY_MS = 420

type OpenClaim = { caseId: string; claim: Claim }

const Transcript = ({
  turns,
  activeClaim,
  panesOpen,
  onOpenClaim,
}: {
  turns: DemoCase[]
  activeClaim: OpenClaim | null
  panesOpen: boolean
  onOpenClaim: (demoCase: DemoCase, claim: Claim) => void
}) => {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()

  // Follow the conversation, the way a chat does. Without this the newest
  // exchange lands below the fold and the reply looks lost.
  //
  // Opening the panes narrows this column, so the same scroll runs again: the
  // answer being checked has to stay on screen while it is being checked.
  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return
    const target = scroller.scrollHeight
    if (reducedMotion) {
      scroller.scrollTop = target
      return
    }
    const tween = gsap.to(scroller, {
      scrollTop: target,
      duration: 0.35,
      ease: 'power2.out',
      overwrite: true,
    })
    return () => {
      tween.kill()
    }
  }, [turns.length, panesOpen, reducedMotion])

  return (
    <div className="min-h-0 flex-1 overflow-y-auto" data-testid="chat-transcript" ref={scrollerRef}>
      {turns.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center px-6 py-10 text-center">
          <MochiLogo size={30} />
          <h1 className="ds-display mt-5 text-[26px] leading-tight text-ink">
            Ask about a dataset
          </h1>
          <p className="ds-body mt-2.5 max-w-md text-[16px] leading-relaxed text-ink-muted">
            The answer arrives as prose. If you want to check it, open any claim beneath it and
            the evidence opens beside this conversation.
          </p>
        </div>
      ) : (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-6">
          {turns.map((demoCase, index) => (
            <ChatTurn
              activeClaimId={activeClaim?.caseId === demoCase.id ? activeClaim.claim.id : null}
              demoCase={demoCase}
              key={`${demoCase.id}-${index}`}
              onOpenClaim={onOpenClaim}
              turnIndex={index}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const Shell = () => {
  const { selectCase, selectClaim } = useEvidenceSelection()
  const [draftCaseId, setDraftCaseId] = useState(() => DEFAULT_CASE_ID)
  const [turns, setTurns] = useState<DemoCase[]>([])
  const [pendingCaseId, setPendingCaseId] = useState<string | null>(null)
  const [openClaim, setOpenClaim] = useState<OpenClaim | null>(null)
  // The third column is the last thing to arrive and the first thing to go.
  // Keeping it separate from `openClaim` is what makes that ordering real: the
  // source can be dismissed while the claim stays open.
  const [sourceOpen, setSourceOpen] = useState(false)
  const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (replyTimer.current) clearTimeout(replyTimer.current)
    },
    [],
  )

  // The same invariant as Proto 01: a case that cannot be rendered correctly is
  // a bug in the instrument, so it is reported rather than shown.
  useEffect(() => {
    if (!import.meta.env.DEV) return
    for (const demoCase of turns) {
      const problems = validateCase(demoCase)
      if (problems.length > 0) {
        console.error(`[provenance] case "${demoCase.id}" violates its invariants`, problems)
      }
    }
  }, [turns])

  const onSend = useCallback(() => {
    if (pendingCaseId) return
    const demoCase = getCaseById(draftCaseId)
    setPendingCaseId(demoCase.id)
    replyTimer.current = setTimeout(() => {
      setTurns((previous) => [...previous, demoCase])
      setPendingCaseId(null)
      replyTimer.current = null
    }, REPLY_DELAY_MS)
  }, [draftCaseId, pendingCaseId])

  /** Opening a claim has to select the case *and* the claim.
   *
   * `selectCase` deliberately resets the selection to that case's default, so
   * the order matters: selecting the claim second is what leaves the graph and
   * the source focused on the claim that was actually clicked. */
  const onOpenClaim = useCallback(
    (demoCase: DemoCase, claim: Claim) => {
      selectCase(demoCase.id)
      selectClaim(claim.id)
      setOpenClaim({ caseId: demoCase.id, claim })
      // A new claim means a new question, so the source starts closed. Reaching
      // it is a separate, deliberate step.
      setSourceOpen(false)
    },
    [selectCase, selectClaim],
  )

  // Closing the evidence also closes the source, so the columns empty right to
  // left instead of leaving a source with nothing to explain.
  const onCloseEvidence = useCallback(() => {
    setOpenClaim(null)
    setSourceOpen(false)
  }, [])

  // Touching a specific piece of evidence is an explicit request to read it, so
  // it is what opens the third column — from either workspace tab.
  const onShowSource = useCallback(() => setSourceOpen(true), [])

  // The source's own dismiss control, on the column above the document.
  const onCloseSource = useCallback(() => setSourceOpen(false), [])

  // Escape backs out one step rather than clearing everything at once. With both
  // columns open the reader is two steps deep, and a single key that emptied the
  // whole workspace would throw away the claim they had already opened.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !openClaim) return
      if (sourceOpen) setSourceOpen(false)
      else onCloseEvidence()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [openClaim, sourceOpen, onCloseEvidence])

  return (
    <div className="flex h-full flex-col bg-canvas" data-testid="chat-app">
      {/* The 3px mesh gradient is a rule and not a fill, and it is a sibling of
          the header rather than the header itself: `ds-mesh-rule` carries
          `height: 3px`, so putting it on an element that also holds the mark
          and the record link crushes them. */}
      <div aria-hidden="true" className="ds-mesh-rule shrink-0" data-testid="mesh-rule" />
      <header
        className="flex shrink-0 items-center justify-between gap-3 px-4 py-2.5"
        data-testid="chat-header"
      >
        <div className="flex min-w-0 items-center gap-2">
          <MochiLogo size={20} />
          <span className="ds-label">mochi</span>
        </div>
      </header>

      {/* The conversation holds its place and narrows. It is never covered and
          never scrolls out of reach, so a reader can go back to the sentence
          they are checking without closing anything. */}
      <div className="flex min-h-0 flex-1" data-testid="chat-columns">
        <div className="flex min-w-0 flex-1 flex-col">
          <Transcript
            activeClaim={openClaim}
            onOpenClaim={onOpenClaim}
            panesOpen={openClaim !== null}
            turns={turns}
          />

          <div aria-live="polite" className="sr-only" data-testid="chat-live">
            {pendingCaseId ? 'Composing an answer' : ''}
          </div>
          {pendingCaseId ? (
            <div className="mx-auto -mt-2 flex w-full max-w-3xl items-center gap-1.5 px-4 pb-1">
              <span aria-hidden="true" className="flex items-center gap-1.5">
                <span className="chat-pending-dot" />
                <span className="chat-pending-dot" />
                <span className="chat-pending-dot" />
              </span>
              <span className="ds-caption">Composing an answer</span>
            </div>
          ) : null}

          <ChatComposer
            onChange={setDraftCaseId}
            onSend={onSend}
            pending={pendingCaseId !== null}
            value={draftCaseId}
          />
        </div>

        {openClaim ? (
          <EvidenceColumn
            claim={openClaim.claim}
            onClose={onCloseEvidence}
            onEvidenceFocus={onShowSource}
            onPointFocus={onShowSource}
          />
        ) : null}
        {openClaim && sourceOpen ? <SourceColumn onClose={onCloseSource} /> : null}
      </div>
    </div>
  )
}

export const App = () => (
  <SelectionProvider>
    <Shell />
  </SelectionProvider>
)
