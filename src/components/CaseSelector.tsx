import { DEMO_CASES } from '../model/cases'
import { useEvidenceSelection } from '../hooks/useEvidenceSelection'
import { MochiLogo } from './MochiLogo'

export const CaseSelector = () => {
  const { selectCase, state } = useEvidenceSelection()

  return (
    <header className="ds-panel relative flex shrink-0 items-center gap-6 rounded-none border-x-0 border-t-0 px-6 py-3">
      <div className="flex items-center gap-3">
        <MochiLogo />
        <h1 className="ds-display text-[19px] font-semibold leading-none">mochi</h1>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <label className="ds-label" htmlFor="demo-case">
          Demo case
        </label>
        <div className="relative">
          <select
            id="demo-case"
            name="demo-case"
            value={state.selectedCaseId}
            onChange={(event) => selectCase(event.target.value)}
            className="ds-select appearance-none rounded-card border border-rule bg-surface py-1.5 pl-3 pr-9 text-[13px] font-medium text-ink transition-colors duration-150 hover:bg-sunken"
          >
            {DEMO_CASES.map((item, index) => (
              <option key={item.id} value={item.id}>
                Case {index + 1} — {item.title}
              </option>
            ))}
          </select>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
          >
            <svg width="10" height="6" viewBox="0 0 10 6" focusable="false">
              <path
                d="M1 1l4 4 4-4"
                fill="none"
                stroke="var(--color-ink-muted)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </div>

      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px]"
        style={{
          backgroundImage:
            'linear-gradient(135deg, #FFA07A 0%, #F4A261 35%, #E8A5C8 70%, #A5C4F0 100%)',
        }}
      />
    </header>
  )
}
