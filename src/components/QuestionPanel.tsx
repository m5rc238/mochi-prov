import { useEvidenceSelection } from '../hooks/useEvidenceSelection'

export const QuestionPanel = () => {
  const { demoCase } = useEvidenceSelection()

  return (
    <section aria-labelledby="question-heading" data-testid="question-panel">
      <h2 id="question-heading" className="ds-label">
        Question
      </h2>
      <p
        className="ds-display ds-entity-question border-l-[3px] border-l-[var(--ds-accent)] pl-3 text-[21px] leading-[1.25]"
        data-testid="question-text"
      >
        {demoCase.question}
      </p>
    </section>
  )
}
