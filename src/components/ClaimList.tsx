import { useEvidenceSelection } from '../hooks/useEvidenceSelection'

export const ClaimList = () => {
  const { demoCase, resolved, selectClaim, selectEvidence } = useEvidenceSelection()
  const onPath = new Set(resolved.pathClaimIds)
  const onEvidencePath = new Set(resolved.pathEvidenceIds)

  return (
    <section aria-labelledby="claims-heading" data-testid="claim-list">
      <h2 id="claims-heading" className="ds-label">
        Claims · {demoCase.claims.length}
      </h2>

      <ul className="flex flex-col gap-2">
        {demoCase.claims.map((claim) => {
          const isSelected = claim.id === resolved.claim?.id
          const isOnPath = onPath.has(claim.id)
          const isMuted = !isOnPath

          return (
            <li key={claim.id} className="ds-entity-claim flex gap-2" data-claim-id={claim.id}>
              <span
                aria-hidden="true"
                className="ds-accent-bar w-[3px] shrink-0 rounded-full transition-opacity duration-200"
                style={{ opacity: isSelected ? 1 : isOnPath ? 0.45 : 0.15 }}
              />
              <div
                className={[
                  'ds-panel min-w-0 flex-1 px-3 py-2.5 transition-opacity duration-200',
                  isSelected ? 'border-ink' : '',
                  isMuted ? 'opacity-55' : '',
                ].join(' ')}
                data-testid={`claim-${claim.id}`}
                data-on-path={isOnPath}
                data-selected={isSelected}
              >
                <button
                  type="button"
                  onClick={() => selectClaim(claim.id)}
                  aria-pressed={isSelected}
                  className="flex w-full items-start gap-2 text-left"
                >
                  <span
                    className="ds-chip ds-chip-bg shrink-0"
                    style={isSelected ? { backgroundColor: 'var(--color-accent-pink)' } : undefined}
                  >
                    {claim.id}
                  </span>
                  <span className="ds-body flex-1 text-ink">{claim.text}</span>
                </button>

                <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-0">
                  <span className="ds-label">Evidence</span>
                  {claim.evidenceIds.map((evidenceId) => {
                    const isActive = evidenceId === resolved.evidence?.id
                    const isOnEvidencePath = onEvidencePath.has(evidenceId)
                    return (
                      <button
                        key={evidenceId}
                        type="button"
                        onClick={() => selectEvidence(evidenceId)}
                        data-testid={`evidence-chip-${evidenceId}`}
                        aria-pressed={isActive}
                        className={[
                          'ds-chip ds-entity-evidence ds-chip-bg border transition-colors duration-150 hover:border-ink',
                          isActive ? 'border-ink font-bold' : 'border-transparent',
                        ].join(' ')}
                        style={
                          isActive
                            ? { backgroundColor: 'var(--color-accent-mint)' }
                            : isOnEvidencePath
                              ? undefined
                              : { opacity: 0.5 }
                        }
                      >
                        {evidenceId}
                      </button>
                    )
                  })}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
