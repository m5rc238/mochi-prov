import { DEFAULT_CASE_ID } from '../model/cases'
import { defaultSelectionFor, getCaseById, getDataPoint, getEvidenceClaims } from '../model/selectors'

export type WorkspaceTab = 'graph' | 'data'

export type SelectionState = {
  selectedCaseId: string
  selectedClaimId: string | null
  selectedEvidenceId: string | null
  activeWorkspaceTab: WorkspaceTab
}

export type Action =
  | { type: 'select-case'; caseId: string }
  | { type: 'select-claim'; claimId: string }
  | { type: 'select-evidence'; evidenceId: string }
  | { type: 'select-data-point'; dataPointId: string }
  | { type: 'set-tab'; tab: WorkspaceTab }
  | { type: 'clear' }

export const initialState: SelectionState = {
  selectedCaseId: DEFAULT_CASE_ID,
  selectedClaimId: null,
  selectedEvidenceId: null,
  activeWorkspaceTab: 'graph',
}

/** The whole application reads selection from here, so the graph can never
 *  disagree with the claim list, the Data View or the source document. */
export const selectionReducer = (state: SelectionState, action: Action): SelectionState => {
  switch (action.type) {
    case 'select-case': {
      // Switching cases resets the selection to something valid for the new
      // case rather than leaving a stale id behind.
      const demoCase = getCaseById(action.caseId)
      return {
        ...state,
        selectedCaseId: demoCase.id,
        ...defaultSelectionFor(demoCase),
      }
    }
    case 'select-claim': {
      const demoCase = getCaseById(state.selectedCaseId)
      const claim = demoCase.claims.find((c) => c.id === action.claimId)
      if (!claim) return state
      return {
        ...state,
        selectedClaimId: claim.id,
        selectedEvidenceId: claim.evidenceIds[0] ?? null,
      }
    }
    case 'select-evidence': {
      const demoCase = getCaseById(state.selectedCaseId)
      const evidence = demoCase.evidence.find((e) => e.id === action.evidenceId)
      if (!evidence) return state
      return {
        ...state,
        selectedEvidenceId: evidence.id,
        selectedClaimId: getEvidenceClaims(demoCase, evidence.id)[0]?.id ?? null,
      }
    }
    case 'select-data-point': {
      const demoCase = getCaseById(state.selectedCaseId)
      const point = getDataPoint(demoCase, action.dataPointId)
      const evidenceId = point?.evidenceIds[0]
      if (!point || !evidenceId) return state
      return {
        ...state,
        selectedEvidenceId: evidenceId,
        selectedClaimId: getEvidenceClaims(demoCase, evidenceId)[0]?.id ?? null,
      }
    }
    case 'set-tab':
      return { ...state, activeWorkspaceTab: action.tab }
    case 'clear':
      return { ...state, selectedClaimId: null, selectedEvidenceId: null }
    default:
      return state
  }
}
