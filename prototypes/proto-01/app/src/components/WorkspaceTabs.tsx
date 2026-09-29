import { useEvidenceSelection, type WorkspaceTab } from '../hooks/useEvidenceSelection'

const TABS: { id: WorkspaceTab; label: string; hint: string }[] = [
  { id: 'graph', label: 'Evidence Graph', hint: 'Question → answer → claim → evidence → source' },
  { id: 'data', label: 'Data View', hint: 'The same evidence, plotted' },
]

export const WorkspaceTabs = ({
  label = 'Center workspace',
  compact = false,
}: {
  label?: string
  compact?: boolean
}) => {
  const { activeWorkspaceTab, setTab } = useEvidenceSelection()

  return (
    <div className="flex shrink-0 items-end gap-5 border-b ds-divider" style={{ borderBottomWidth: 1 }}>
      <div role="tablist" aria-label={label} className="flex items-end gap-5">
        {TABS.map((tab) => {
          const isCurrent = tab.id === activeWorkspaceTab
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={isCurrent}
              onClick={() => setTab(tab.id)}
              data-tab={tab.id}
              title={tab.hint}
              className={[
                'ds-label -mb-px border-b-2 pb-2 pt-1 transition-colors duration-150',
                isCurrent
                  ? 'border-ink text-ink'
                  : 'border-transparent text-ink-muted hover:text-ink',
              ].join(' ')}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      {compact ? null : (
        <p className="ds-caption ml-auto truncate pb-2">
          {TABS.find((tab) => tab.id === activeWorkspaceTab)?.hint}
        </p>
      )}
    </div>
  )
}
