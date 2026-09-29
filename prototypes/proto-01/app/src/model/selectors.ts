import { DEMO_CASES } from './cases'
import type { Claim, DataPoint, DemoCase, Evidence, SourceParagraph } from './types'

export const getCaseById = (id: string): DemoCase =>
  DEMO_CASES.find((c) => c.id === id) ?? DEMO_CASES[0]!

export const getClaim = (demoCase: DemoCase, claimId: string | null): Claim | null =>
  claimId ? (demoCase.claims.find((c) => c.id === claimId) ?? null) : null

export const getEvidence = (demoCase: DemoCase, evidenceId: string | null): Evidence | null =>
  evidenceId ? (demoCase.evidence.find((e) => e.id === evidenceId) ?? null) : null

export const getParagraph = (demoCase: DemoCase, paragraphId: string | null): SourceParagraph | null =>
  paragraphId
    ? (demoCase.source.paragraphs.find((p) => p.id === paragraphId) ?? null)
    : null

export const getDataPoint = (demoCase: DemoCase, dataPointId: string | null): DataPoint | null =>
  dataPointId ? (demoCase.dataView.data.find((d) => d.id === dataPointId) ?? null) : null

/** Evidence referenced by a claim, in the order the claim lists them. */
export const getClaimEvidence = (demoCase: DemoCase, claimId: string | null): Evidence[] => {
  const claim = getClaim(demoCase, claimId)
  if (!claim) return []
  return claim.evidenceIds
    .map((id) => getEvidence(demoCase, id))
    .filter((e): e is Evidence => e !== null)
}

/** Claims that rest on a given evidence item. An evidence item may support more
 *  than one claim; the graph renders every one of those edges. */
export const getEvidenceClaims = (demoCase: DemoCase, evidenceId: string | null): Claim[] => {
  if (!evidenceId) return []
  return demoCase.claims.filter((c) => c.evidenceIds.includes(evidenceId))
}

export type Selection = {
  claimId: string | null
  evidenceId: string | null
}

export type SelectionIds = {
  selectedClaimId: string | null
  selectedEvidenceId: string | null
}

export type ResolvedSelection = {
  hasSelection: boolean
  claim: Claim | null
  evidence: Evidence | null
  /** The single active evidence item — what the source pane scrolls to. */
  pathClaimIds: string[]
  pathEvidenceIds: string[]
  pathParagraphIds: string[]
  pathDataPointIds: string[]
  /** Every evidence item in the active path, in source-paragraph order. */
  sourceHighlightIds: string[]
}

const inOrder = <T extends { id: string }>(items: T[], wanted: Set<string>): T[] =>
  items.filter((item) => wanted.has(item.id))

/**
 * The single derivation of "what is active" for the whole application. The
 * graph, the Data View, the claim list and the source document all read this
 * object, so no pane can hold selection state that disagrees with another.
 */
export const resolveSelection = (demoCase: DemoCase, selection: Selection): ResolvedSelection => {
  const claim = getClaim(demoCase, selection.claimId)
  const evidence = getEvidence(demoCase, selection.evidenceId)

  const claimIds = new Set<string>()
  const evidenceIds = new Set<string>()

  if (claim) {
    claimIds.add(claim.id)
    for (const e of getClaimEvidence(demoCase, claim.id)) evidenceIds.add(e.id)
  }
  if (evidence) {
    evidenceIds.add(evidence.id)
    for (const c of getEvidenceClaims(demoCase, evidence.id)) claimIds.add(c.id)
  }

  const orderedEvidence = inOrder(demoCase.evidence, evidenceIds)
  const paragraphIds = new Set(orderedEvidence.map((e) => e.paragraphId))
  const dataPointIds = inOrder(
    demoCase.dataView.data,
    new Set(demoCase.dataView.data.filter((d) => d.evidenceIds.some((id) => evidenceIds.has(id))).map((d) => d.id)),
  )

  return {
    hasSelection: claim !== null || evidence !== null,
    claim,
    evidence,
    pathClaimIds: inOrder(demoCase.claims, claimIds).map((c) => c.id),
    pathEvidenceIds: orderedEvidence.map((e) => e.id),
    pathParagraphIds: demoCase.source.paragraphs.filter((p) => paragraphIds.has(p.id)).map((p) => p.id),
    pathDataPointIds: dataPointIds.map((d) => d.id),
    sourceHighlightIds: orderedEvidence.map((e) => e.id),
  }
}

/** Every invariant from the specification, checked against one case.
 *  Returns a list of human-readable violations; empty means valid. */
export const validateCase = (demoCase: DemoCase): string[] => {
  const problems: string[] = []
  const evidenceById = new Map(demoCase.evidence.map((e) => [e.id, e]))

  // 1. every claim references at least one evidence item
  for (const claim of demoCase.claims) {
    if (claim.evidenceIds.length === 0) {
      problems.push(`claim ${claim.id} has no evidence`)
    }
    for (const id of claim.evidenceIds) {
      if (!evidenceById.has(id)) problems.push(`claim ${claim.id} references unknown evidence ${id}`)
    }
  }

  const referencedEvidence = new Set(demoCase.claims.flatMap((c) => c.evidenceIds))

  for (const evidence of demoCase.evidence) {
    // 2 / 3. exactly one source and one paragraph, both of which exist
    if (evidence.sourceId !== demoCase.source.id) {
      problems.push(`evidence ${evidence.id} points at source ${evidence.sourceId}, expected ${demoCase.source.id}`)
    }
    const paragraph = demoCase.source.paragraphs.find((p) => p.id === evidence.paragraphId)
    if (!paragraph) {
      problems.push(`evidence ${evidence.id} points at unknown paragraph ${evidence.paragraphId}`)
    } else {
      // 4. the paragraph identifies the evidence, and the evidence text is
      //    present verbatim so the source highlight is exact
      if (!paragraph.evidenceIds?.includes(evidence.id)) {
        problems.push(`paragraph ${paragraph.id} does not list evidence ${evidence.id}`)
      }
      if (!paragraph.text.includes(evidence.text)) {
        problems.push(`evidence ${evidence.id} is not quoted verbatim in paragraph ${paragraph.id}`)
      }
    }
    // 13. no orphan evidence
    if (!referencedEvidence.has(evidence.id)) {
      problems.push(`evidence ${evidence.id} is not referenced by any claim`)
    }
  }

  // every paragraph's evidence list resolves
  for (const paragraph of demoCase.source.paragraphs) {
    for (const id of paragraph.evidenceIds ?? []) {
      const evidence = evidenceById.get(id)
      if (!evidence) {
        problems.push(`paragraph ${paragraph.id} lists unknown evidence ${id}`)
      } else if (evidence.paragraphId !== paragraph.id) {
        problems.push(`paragraph ${paragraph.id} lists evidence ${id} which points elsewhere`)
      }
    }
  }

  // 5. every data point references known evidence; 12. nothing unsourced
  for (const point of demoCase.dataView.data) {
    if (point.evidenceIds.length === 0) problems.push(`data point ${point.id} has no evidence`)
    for (const id of point.evidenceIds) {
      if (!evidenceById.has(id)) problems.push(`data point ${point.id} references unknown evidence ${id}`)
    }
    if (!demoCase.dataView.series.some((s) => s.id === point.seriesId)) {
      problems.push(`data point ${point.id} references unknown series ${point.seriesId}`)
    }
  }

  return problems
}

/** The first claim and the first evidence of that claim — a case always opens
 *  with a coherent, valid selection rather than a blank pane. */
export const defaultSelectionFor = (demoCase: DemoCase): SelectionIds => {
  const claim = demoCase.claims[0]
  return { selectedClaimId: claim?.id ?? null, selectedEvidenceId: claim?.evidenceIds[0] ?? null }
}

export { DEMO_CASES }
export type { Claim, DataPoint, DemoCase, Evidence, SourceParagraph }
