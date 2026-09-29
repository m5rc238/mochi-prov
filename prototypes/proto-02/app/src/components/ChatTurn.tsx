import { useEffect, useRef } from 'react'
import gsap from 'gsap'

import { useReducedMotion } from '../../../../proto-01/app/src/hooks/useReducedMotion'
import type { Claim, DemoCase } from '../../../../proto-01/app/src/model/types'
import { ChatClaimList } from './ChatClaimList'
import { ProvenanceSignal } from './ProvenanceSignal'

/** One exchange: the question that was asked, and the reply.
 *
 * The reply is prose. The provenance is underneath it, quiet, and available.
 */
export const ChatTurn = ({
  demoCase,
  turnIndex,
  activeClaimId,
  onOpenClaim,
}: {
  demoCase: DemoCase
  turnIndex: number
  activeClaimId: string | null
  onOpenClaim: (demoCase: DemoCase, claim: Claim) => void
}) => {
  const reducedMotion = useReducedMotion()
  const replyRef = useRef<HTMLDivElement>(null)

  // A reply that arrives with no movement reads as the page redrawing rather
  // than as the answer coming back.
  useEffect(() => {
    const element = replyRef.current
    if (reducedMotion || !element) return
    const tween = gsap.fromTo(
      element,
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out', overwrite: true },
    )
    return () => {
      tween.kill()
    }
  }, [demoCase.id, reducedMotion])

  return (
    // Indexed, because the same question can legitimately be asked twice and
    // the two exchanges are then two different places to open evidence from.
    <article
      className="flex flex-col gap-3"
      data-testid={`chat-turn-${demoCase.id}-${turnIndex}`}
    >
      <div className="flex justify-end">
        <p className="ds-panel ds-body max-w-[85%] rounded-card px-3.5 py-2 text-[15px] leading-snug">
          {demoCase.question}
        </p>
      </div>

      <div ref={replyRef} className="flex flex-col gap-2.5">
        <p
          className="ds-display ds-entity-answer border-l-[3px] border-l-[var(--ds-accent)] pl-3 text-[19px] leading-[1.35]"
          data-testid={`chat-answer-${demoCase.id}`}
        >
          {demoCase.answer}
        </p>
        <ProvenanceSignal demoCase={demoCase} />
        <ChatClaimList
          activeClaimId={activeClaimId}
          demoCase={demoCase}
          onOpen={onOpenClaim}
        />
      </div>
    </article>
  )
}
