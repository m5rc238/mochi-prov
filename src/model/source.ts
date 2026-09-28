import type { Evidence, SourceParagraph } from './types'

export type SourceSegment =
  | { kind: 'text'; text: string }
  | { kind: 'evidence'; text: string; evidenceId: string }

/**
 * Splits a paragraph into plain runs and exact evidence runs so the source
 * document can highlight the quoted text rather than the whole paragraph.
 * Several evidence items in one paragraph produce several highlights.
 */
export const segmentParagraph = (
  paragraph: SourceParagraph,
  evidence: Evidence[],
): SourceSegment[] => {
  const quotes = evidence
    .filter((item) => item.paragraphId === paragraph.id)
    .map((item) => ({ id: item.id, text: item.text }))
    .filter((quote) => quote.text.length > 0)
    .sort((a, b) => b.text.length - a.text.length)

  const segments: SourceSegment[] = []
  const text = paragraph.text
  let cursor = 0
  let plain = ''

  while (cursor < text.length) {
    const match = quotes.find((quote) => text.startsWith(quote.text, cursor))
    if (match) {
      if (plain) {
        segments.push({ kind: 'text', text: plain })
        plain = ''
      }
      segments.push({ kind: 'evidence', text: match.text, evidenceId: match.id })
      cursor += match.text.length
    } else {
      plain += text[cursor]
      cursor += 1
    }
  }

  if (plain) segments.push({ kind: 'text', text: plain })
  return segments
}
