import { describe, expect, it } from 'vitest'

import { DEMO_CASES } from '../model/cases'
import { getClaimEvidence, getEvidenceClaims, resolveSelection, validateCase } from '../model/selectors'

describe('demo data', () => {
  it('ships exactly three fictional cases', () => {
    expect(DEMO_CASES).toHaveLength(3)
    expect(DEMO_CASES.map((c) => c.id)).toEqual([
      'revenue-decline',
      'product-adoption',
      'follow-up-adherence',
    ])
  })

  it('satisfies every invariant for every case', () => {
    for (const demoCase of DEMO_CASES) {
      expect(validateCase(demoCase), demoCase.id).toEqual([])
    }
  })

  it('gives each case a question, a one-sentence answer and claims', () => {
    for (const demoCase of DEMO_CASES) {
      expect(demoCase.question.length).toBeGreaterThan(0)
      expect(demoCase.answer.length).toBeGreaterThan(0)
      expect(demoCase.claims.length).toBeGreaterThanOrEqual(2)
      expect(demoCase.source.title.length).toBeGreaterThan(0)
    }
  })

  it('quotes every evidence item verbatim inside its own paragraph', () => {
    for (const demoCase of DEMO_CASES) {
      for (const evidence of demoCase.evidence) {
        const paragraph = demoCase.source.paragraphs.find((p) => p.id === evidence.paragraphId)
        expect(paragraph, `${demoCase.id}/${evidence.id}`).toBeDefined()
        expect(paragraph!.text).toContain(evidence.text)
      }
    }
  })

  it('has no orphan evidence in any case', () => {
    for (const demoCase of DEMO_CASES) {
      const referenced = new Set(demoCase.claims.flatMap((c) => c.evidenceIds))
      for (const evidence of demoCase.evidence) {
        expect(referenced.has(evidence.id), `${demoCase.id}/${evidence.id}`).toBe(true)
      }
    }
  })

  it('supports multiple evidence items inside a single paragraph', () => {
    const withMultiple = DEMO_CASES.some((demoCase) =>
      demoCase.source.paragraphs.some((p) => (p.evidenceIds?.length ?? 0) > 1),
    )
    expect(withMultiple).toBe(true)
  })

  it('references only existing evidence from every data point', () => {
    for (const demoCase of DEMO_CASES) {
      const known = new Set(demoCase.evidence.map((e) => e.id))
      expect(demoCase.dataView.data.length).toBeGreaterThan(0)
      for (const point of demoCase.dataView.data) {
        expect(point.evidenceIds.length).toBeGreaterThan(0)
        for (const id of point.evidenceIds) {
          expect(known.has(id), `${demoCase.id}/${point.id} -> ${id}`).toBe(true)
        }
      }
    }
  })

  it('labels the adherence case as fictional and gives no medical advice', () => {
    const demoCase = DEMO_CASES.find((c) => c.id === 'follow-up-adherence')!
    expect(demoCase.source.section.toLowerCase()).toContain('fictional')
    expect(demoCase.source.paragraphs[0]!.text.toLowerCase()).toContain('fictional')
    expect(demoCase.dataView.disclaimer?.toLowerCase()).toContain('not medical evidence')
    expect(demoCase.dataView.disclaimer?.toLowerCase()).toContain('not medical advice')
  })
})

describe('selection resolution', () => {
  it('resolves a claim to its evidence and their source paragraph', () => {
    const demoCase = DEMO_CASES[1]!
    const resolved = resolveSelection(demoCase, { claimId: 'C1', evidenceId: null })

    expect(resolved.claim?.id).toBe('C1')
    expect(resolved.pathClaimIds).toEqual(['C1'])
    expect(resolved.pathEvidenceIds).toEqual(getClaimEvidence(demoCase, 'C1').map((e) => e.id))
    expect(resolved.pathParagraphIds).toContain('P1')
    expect(resolved.hasSelection).toBe(true)
  })

  it('resolves evidence back to the claims that rest on it', () => {
    const demoCase = DEMO_CASES[0]!
    const resolved = resolveSelection(demoCase, { claimId: null, evidenceId: 'E2' })

    expect(resolved.evidence?.id).toBe('E2')
    expect(resolved.pathClaimIds).toEqual(getEvidenceClaims(demoCase, 'E2').map((c) => c.id))
    expect(resolved.pathParagraphIds).toEqual(['P2'])
  })

  it('maps a data point back to the evidence that produced its value', () => {
    const demoCase = DEMO_CASES[0]!
    const point = demoCase.dataView.data.find((d) => d.id === 'q3')!
    const evidenceId = point.evidenceIds[0]!
    const resolved = resolveSelection(demoCase, { claimId: null, evidenceId })

    expect(resolved.pathEvidenceIds).toContain(evidenceId)
    expect(resolved.pathParagraphIds).toEqual([resolved.evidence!.paragraphId])
    expect(resolved.pathDataPointIds).toEqual(
      demoCase.dataView.data.filter((d) => d.evidenceIds.includes(evidenceId)).map((d) => d.id),
    )
  })

  it('reports no path when nothing is selected', () => {
    const resolved = resolveSelection(DEMO_CASES[0]!, { claimId: null, evidenceId: null })
    expect(resolved.hasSelection).toBe(false)
    expect(resolved.pathClaimIds).toEqual([])
    expect(resolved.pathEvidenceIds).toEqual([])
  })

  it('ignores ids that do not belong to the case', () => {
    const resolved = resolveSelection(DEMO_CASES[0]!, { claimId: 'C9', evidenceId: 'E9' })
    expect(resolved.claim).toBeNull()
    expect(resolved.evidence).toBeNull()
    expect(resolved.hasSelection).toBe(false)
  })
})

describe('validateCase', () => {
  it('reports a claim with no evidence', () => {
    const broken = { ...DEMO_CASES[0]!, claims: [{ id: 'C1', text: 'x', evidenceIds: [] }] }
    expect(validateCase(broken).join(' ')).toContain('has no evidence')
  })

  it('reports a paragraph that does not list its evidence', () => {
    const base = DEMO_CASES[0]!
    const broken = {
      ...base,
      source: {
        ...base.source,
        paragraphs: base.source.paragraphs.map((p) =>
          p.id === 'P2' ? { ...p, evidenceIds: [] } : p,
        ),
      },
    }
    expect(validateCase(broken).join(' ')).toContain('does not list evidence E2')
  })

  it('reports evidence quoted nowhere in its paragraph', () => {
    const base = DEMO_CASES[0]!
    const broken = {
      ...base,
      source: {
        ...base.source,
        paragraphs: base.source.paragraphs.map((p) =>
          p.id === 'P2' ? { ...p, text: 'Customer concentration remained high.' } : p,
        ),
      },
    }
    expect(validateCase(broken).join(' ')).toContain('not quoted verbatim')
  })

  it('reports a data point pointing at evidence that does not exist', () => {
    const base = DEMO_CASES[0]!
    const broken = {
      ...base,
      dataView: {
        ...base.dataView,
        data: [{ id: 'ghost', label: 'Ghost', value: 1, evidenceIds: ['E99'], seriesId: 'q3-change' }],
      },
    }
    expect(validateCase(broken).join(' ')).toContain('references unknown evidence E99')
  })

  it('reports orphan evidence', () => {
    const base = DEMO_CASES[0]!
    const broken = { ...base, claims: base.claims.map((c) => ({ ...c, evidenceIds: ['E1'] })) }
    expect(validateCase(broken).join(' ')).toContain('not referenced by any claim')
  })
})
