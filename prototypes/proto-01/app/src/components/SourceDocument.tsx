import { useCallback, useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'

import { useEvidenceSelection } from '../hooks/useEvidenceSelection'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { segmentParagraph } from '../model/source'

gsap.registerPlugin(ScrollToPlugin)

const FLASH_REST = 'rgba(164, 231, 208, 0.45)'
const FLASH_PEAK = 'rgba(164, 231, 208, 1)'

/** Breathing room left between the highlighted span and the edge of the pane. */
const SCROLL_EDGE = 24

export const SourceDocument = ({ footerNote }: { footerNote?: string }) => {
  const { demoCase, resolved, selectEvidence } = useEvidenceSelection()
  const reducedMotion = useReducedMotion()
  const { source } = demoCase

  const scrollerRef = useRef<HTMLDivElement>(null)
  const paragraphRefs = useRef(new Map<string, HTMLElement>())
  const scrollTween = useRef<gsap.core.Tween | null>(null)
  const flashTween = useRef<gsap.core.Tween | null>(null)

  const activeEvidenceId = resolved.evidence?.id ?? null
  const paragraphId = resolved.evidence?.paragraphId ?? null

  const registerParagraph = useCallback((id: string) => (node: HTMLElement | null) => {
    if (node) paragraphRefs.current.set(id, node)
    else paragraphRefs.current.delete(id)
  }, [])

  // Coordinated move: bring the quoted span into view, then let the highlight
  // settle. Under reduced motion both happen immediately.
  useEffect(() => {
    const scroller = scrollerRef.current
    const paragraph = paragraphId ? paragraphRefs.current.get(paragraphId) : null
    scrollTween.current?.kill()
    flashTween.current?.kill()

    if (!scroller || !paragraph) return

    const mark = paragraph.querySelector<HTMLElement>('[data-active="true"]')
    const anchor = mark ?? paragraph

    // Measured against the scroller's own box: the panel above is positioned, so
    // offsetTop would be relative to that instead of the scrolling content.
    const scrollerRect = scroller.getBoundingClientRect()
    const anchorRect = anchor.getBoundingClientRect()
    const above = anchorRect.top - scrollerRect.top
    const below = anchorRect.bottom - scrollerRect.bottom
    const isOutOfView = above < SCROLL_EDGE || below > -SCROLL_EDGE
    const targetScroll = Math.max(0, scroller.scrollTop + (above < SCROLL_EDGE ? above - SCROLL_EDGE : below + SCROLL_EDGE))

    if (isOutOfView) {
      if (reducedMotion) {
        scroller.scrollTop = targetScroll
      } else {
        scrollTween.current = gsap.to(scroller, {
          duration: 0.5,
          ease: 'power2.out',
          scrollTo: { y: targetScroll, autoKill: false },
        })
      }
    }

    if (!mark) return
    mark.style.transition = 'none'
    flashTween.current = gsap.fromTo(
      mark,
      { backgroundColor: FLASH_PEAK },
      {
        backgroundColor: FLASH_REST,
        duration: 0.9,
        ease: 'power2.out',
        onComplete: () => {
          mark.style.transition = ''
        },
      },
    )
  }, [activeEvidenceId, paragraphId, reducedMotion, demoCase.id])

  useEffect(
    () => () => {
      scrollTween.current?.kill()
      flashTween.current?.kill()
    },
    [],
  )

  const onPath = new Set(resolved.pathParagraphIds)
  const highlightIds = new Set(resolved.sourceHighlightIds)

  return (
    <section
      aria-labelledby="source-heading"
      className="ds-panel flex min-h-0 flex-1 flex-col"
      data-testid="source-document"
    >
      <header className="shrink-0 border-b ds-divider px-4 py-3" style={{ borderBottomWidth: 1 }}>
        <h2 id="source-heading" className="ds-label">
          Source document
        </h2>
        <p className="ds-display mt-1 text-[17px] leading-tight" data-testid="source-title">
          {source.title}
        </p>
        <p className="ds-caption mt-0.5" data-testid="source-section">
          {source.section}
        </p>
      </header>

      <p className="ds-caption shrink-0 bg-sunken px-4 py-2" data-testid="source-notice">
        Fictional demo document. Written for this prototype; it does not describe a real
        organisation, product, or study.
      </p>

      <div ref={scrollerRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4" data-testid="source-scroll">
        {source.paragraphs.map((paragraph) => {
          const segments = segmentParagraph(paragraph, demoCase.evidence)
          const inPath = onPath.has(paragraph.id)
          return (
            <article
              key={paragraph.id}
              ref={registerParagraph(paragraph.id)}
              data-testid={`source-paragraph-${paragraph.id}`}
              data-in-path={inPath}
              className="mb-5 rounded-card px-2 py-2 transition-colors duration-300"
            >
              <h3 className="ds-label mb-1.5 flex items-center gap-2">
                <span>{paragraph.id}</span>
                {inPath ? <span className="ds-chip ds-entity-evidence ds-chip-bg">on path</span> : null}
              </h3>
              <p className="ds-display text-[16px] leading-[1.65] text-ink">
                {segments.map((segment, index) =>
                  segment.kind === 'text' ? (
                    <span key={`t-${index}`}>{segment.text}</span>
                  ) : (
                    <mark
                      key={`e-${segment.evidenceId}-${index}`}
                      data-testid={`source-mark-${segment.evidenceId}`}
                      data-evidence-id={segment.evidenceId}
                      data-active={segment.evidenceId === activeEvidenceId}
                      data-in-path={highlightIds.has(segment.evidenceId)}
                      className="source-mark cursor-pointer px-[1px]"
                      onClick={() => selectEvidence(segment.evidenceId)}
                      title={`${segment.evidenceId} — click to trace`}
                    >
                      {segment.text}
                    </mark>
                  ),
                )}
              </p>
            </article>
          )
        })}

        <footer className="ds-caption border-t ds-divider pt-3" style={{ borderTopWidth: 1 }}>
          {footerNote ??
            'End of document. Every highlighted span is quoted from the evidence items listed in the claim panel.'}
        </footer>
      </div>
    </section>
  )
}
