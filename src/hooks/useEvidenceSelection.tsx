import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react'

import {
  getCaseById,
  resolveSelection,
  type ResolvedSelection,
} from '../model/selectors'
import type { DemoCase } from '../model/types'
import {
  initialState,
  selectionReducer,
  type SelectionState,
  type WorkspaceTab,
} from '../state/selection'

export type { SelectionState, WorkspaceTab }

type SelectionContextValue = {
  demoCase: DemoCase
  resolved: ResolvedSelection
  state: SelectionState
  activeWorkspaceTab: WorkspaceTab
  selectCase: (caseId: string) => void
  selectClaim: (claimId: string) => void
  selectEvidence: (evidenceId: string) => void
  selectDataPoint: (dataPointId: string) => void
  setTab: (tab: WorkspaceTab) => void
  clearSelection: () => void
}

const SelectionContext = createContext<SelectionContextValue | null>(null)

export const SelectionProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(selectionReducer, initialState)

  const value = useMemo<SelectionContextValue>(() => {
    const demoCase = getCaseById(state.selectedCaseId)
    const resolved = resolveSelection(demoCase, {
      claimId: state.selectedClaimId,
      evidenceId: state.selectedEvidenceId,
    })
    return {
      demoCase,
      resolved,
      state,
      activeWorkspaceTab: state.activeWorkspaceTab,
      selectCase: (caseId) => dispatch({ type: 'select-case', caseId }),
      selectClaim: (claimId) => dispatch({ type: 'select-claim', claimId }),
      selectEvidence: (evidenceId) => dispatch({ type: 'select-evidence', evidenceId }),
      selectDataPoint: (dataPointId) => dispatch({ type: 'select-data-point', dataPointId }),
      setTab: (tab) => dispatch({ type: 'set-tab', tab }),
      clearSelection: () => dispatch({ type: 'clear' }),
    }
  }, [state])

  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>
}

// The consuming hook belongs beside the provider it reads from; splitting the
// pair across files would only hide the relationship between them.
// oxlint-disable-next-line react/only-export-components
export const useEvidenceSelection = (): SelectionContextValue => {
  const value = useContext(SelectionContext)
  if (!value) throw new Error('useEvidenceSelection must be used inside a SelectionProvider')
  return value
}
