/** The prototype catalog: the single place prototype metadata is written down.
 *
 * The index page and every documentation page read from this. The research
 * content itself is not here — it lives in each prototype's `doc.md`, which is
 * the source of truth. Adding a prototype means adding a `doc.md` and one entry
 * here, not editing HTML. */

export type PrototypeStatus = 'built' | 'planned'

export type Prototype = {
  id: string
  /** Display number, e.g. "01". */
  number: string
  title: string
  /** One line for the catalog card. Not a summary of the research record. */
  description: string
  status: PrototypeStatus
  /**
   * Path to the runnable prototype, relative to the site root. Null when the
   * prototype is planned and has no implementation yet — the index shows the
   * documentation link in that case rather than a dead link.
   */
  appPath: string | null
  /** Path to the Markdown research record, relative to the site root. */
  documentationPath: string
  /** Path to the rendered documentation page, relative to the site root. */
  docPagePath: string
}

/** The research question this repository exists to investigate. */
export const RESEARCH = {
  title: 'Evidence-grounded AI',
  question:
    "Does making the relationship between an answer's claims and its supporting evidence explicit improve human verification of AI-generated answers?",
} as const

export const PROTOTYPES: Prototype[] = [
  {
    id: 'proto-01',
    number: '01',
    title: 'Evidence Graph',
    description: 'Claim → Evidence → Source',
    status: 'built',
    appPath: '/prototypes/proto-01/app/',
    documentationPath: '/prototypes/proto-01/doc.md',
    docPagePath: '/prototypes/proto-01/doc.html',
  },
  {
    id: 'proto-02',
    number: '02',
    title: 'Provenance you can check',
    description: 'The behavioural research programme',
    status: 'planned',
    appPath: null,
    documentationPath: '/prototypes/proto-02/doc.md',
    docPagePath: '/prototypes/proto-02/doc.html',
  },
]
