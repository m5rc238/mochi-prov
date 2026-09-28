import { useEvidenceSelection } from '../hooks/useEvidenceSelection'

export const AnswerPanel = () => {
  const { demoCase } = useEvidenceSelection()

  return (
    <section aria-labelledby="answer-heading" data-testid="answer-panel">
      <h2 id="answer-heading" className="ds-label ds-section-heading">
        Answer
      </h2>
      <p
        className="ds-display ds-entity-answer border-l-[3px] border-l-[var(--ds-accent)] pl-3 text-[23px] leading-[1.2]"
        data-testid="answer-text"
      >
        {demoCase.answer}
      </p>
    </section>
  )
}
