import { DEMO_CASES } from '../../../../proto-01/app/src/model/cases'

/** The composer.
 *
 * A text field is what this will be. There is no model behind it yet, so the
 * field holds the questions this demo can actually answer, chosen from the
 * same case material as every other prototype. The label says so: a control
 * that looks like a text field but only accepts a fixed list is a lie about
 * the product, and this prototype is a research instrument.
 */
export const ChatComposer = ({
  value,
  pending,
  onChange,
  onSend,
}: {
  value: string
  pending: boolean
  onChange: (caseId: string) => void
  onSend: () => void
}) => (
  <div className="shrink-0 border-t ds-divider bg-canvas px-4 py-3" style={{ borderTopWidth: 1 }}>
    <form
      className="mx-auto flex w-full max-w-3xl flex-col gap-1.5"
      onSubmit={(event) => {
        event.preventDefault()
        onSend()
      }}
    >
      <div className="chat-field">
        <label className="ds-label shrink-0" htmlFor="chat-question">
          Question
        </label>
        <select
          className="ds-select"
          data-testid="chat-question"
          id="chat-question"
          value={value}
          disabled={pending}
          onChange={(event) => onChange(event.target.value)}
        >
          {DEMO_CASES.map((demoCase) => (
            <option key={demoCase.id} value={demoCase.id}>
              {demoCase.question}
            </option>
          ))}
        </select>
        <button
          className="action action-primary shrink-0 px-4 py-2 text-[13px] font-medium"
          data-testid="chat-send"
          type="submit"
          disabled={pending}
        >
          {pending ? 'Sending' : 'Send'}
        </button>
      </div>
      <p className="ds-caption">
        A text field is the real control. Until there is a model behind it, this is the set of
        questions the demo can answer.
      </p>
    </form>
  </div>
)
