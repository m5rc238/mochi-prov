import type { Claim, DemoCase } from '../../../../proto-01/app/src/model/types'

/** The claims under an answer, and the way into the evidence.
 *
 * These are the control: the user clicks a claim and the graph and source open
 * underneath. Each row states how much is behind the claim before it is
 * clicked, because a claim with no evidence has to read as unsupported *before*
 * anyone goes looking, not only after.
 */
export const ChatClaimList = ({
  demoCase,
  activeClaimId,
  onOpen,
}: {
  demoCase: DemoCase
  activeClaimId: string | null
  onOpen: (demoCase: DemoCase, claim: Claim) => void
}) => (
  <ul className="flex flex-col gap-1.5" data-testid="chat-claims">
    {demoCase.claims.map((claim) => {
      const count = claim.evidenceIds.length
      const isActive = claim.id === activeClaimId

      return (
        <li key={claim.id}>
          <button
            aria-label={
              count > 0
                ? `Open evidence for claim ${claim.id}: ${claim.text}`
                : `Open claim ${claim.id}, which has no evidence linked: ${claim.text}`
            }
            className="ds-panel group flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors duration-150 hover:bg-sunken"
            data-claim-id={claim.id}
            data-testid={`chat-claim-${claim.id}`}
            onClick={() => onOpen(demoCase, claim)}
            type="button"
          >
            <span
              aria-hidden="true"
              className="ds-accent-bar mt-0.5 h-4 w-[3px] shrink-0 rounded-full"
              style={{ opacity: isActive ? 1 : 0.4 }}
            />
            <span className="min-w-0 flex-1">
              <span className="ds-display block text-[15px] leading-snug text-ink">
                {claim.text}
              </span>
              <span className="ds-caption mt-1 block">
                {count > 0
                  ? `${claim.id} · ${count} supporting span${count === 1 ? '' : 's'}`
                  : `${claim.id} · no evidence linked`}
              </span>
            </span>
            <span
              aria-hidden="true"
              className="ds-caption mt-0.5 shrink-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
              style={{ opacity: isActive ? 1 : 0.45 }}
            >
              &rarr;
            </span>
          </button>
        </li>
      )
    })}
  </ul>
)
