import type { DemoCase } from '../../../../proto-01/app/src/model/types'

/** The subtle provenance signal.
 *
 * The point of the chat form is that the answer reads as an answer. If the
 * evidence arrived with it, the interface would be Proto 01 wearing a
 * conversation, and a participant could not tell whether they were reading
 * prose or an audit trail. So the signal stays quiet: one dot per claim, and a
 * short count.
 *
 * It is deliberately *not* the way in. The claims below the answer are the
 * control. This is the hint that checking is possible, and a truthful one — a
 * claim with nothing behind it is drawn hollow and counted as untraced, rather
 * than being given a dot it has not earned.
 */
export const ProvenanceSignal = ({ demoCase }: { demoCase: DemoCase }) => {
  const untraced = demoCase.claims.filter((claim) => claim.evidenceIds.length === 0)

  return (
    <div className="flex items-center gap-2" data-testid="provenance-signal">
      <span aria-hidden="true" className="flex items-center gap-[3px]">
        {demoCase.claims.map((claim) => {
          const traced = claim.evidenceIds.length > 0
          return (
            <span
              key={claim.id}
              className="h-1.5 w-1.5 rounded-full"
              style={
                traced
                  ? { backgroundColor: 'var(--color-accent-mint)' }
                  : {
                      backgroundColor: 'transparent',
                      boxShadow: 'inset 0 0 0 1px var(--color-status-scarlet)',
                    }
              }
            />
          )
        })}
      </span>
      <p className="ds-caption">
        {demoCase.claims.length - untraced.length} of {demoCase.claims.length} claims traceable to
        the source
        {untraced.length > 0 ? ` · ${untraced.length} with no evidence` : ''}
      </p>
    </div>
  )
}
