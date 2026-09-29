/** Authoritative application data model.
 *
 * The evidence graph and the Data View are both *renderings* of these types.
 * Neither owns a copy of the text. */

export type Claim = {
  id: string
  text: string
  evidenceIds: string[]
}

export type Evidence = {
  id: string
  /** Must appear verbatim inside its source paragraph — this is what makes
   *  "jump to the exact source text" exact rather than approximate. */
  text: string
  sourceId: string
  paragraphId: string
}

export type SourceParagraph = {
  id: string
  text: string
  evidenceIds?: string[]
}

export type Source = {
  id: string
  title: string
  section: string
  paragraphs: SourceParagraph[]
}

/** How a series is drawn. Every value plotted must come from an evidence item. */
export type DataSeriesKind = 'bar' | 'trend' | 'funnel'

export type DataPoint = {
  id: string
  label: string
  value: number
  evidenceIds: string[]
  /** Which series in the Data View this point belongs to. */
  seriesId: string
}

export type DataSeries = {
  id: string
  label: string
  unit: string
  kind: DataSeriesKind
  /** Sub-caption stating what the chart does *not* establish. */
  caption?: string
}

export type DataView = {
  type: string
  title: string
  description: string
  data: DataPoint[]
  series: DataSeries[]
  /** Optional caution shown verbatim under the charts. */
  disclaimer?: string
}

export type DemoCase = {
  id: string
  title: string
  question: string
  answer: string
  claims: Claim[]
  evidence: Evidence[]
  source: Source
  dataView: DataView
}
