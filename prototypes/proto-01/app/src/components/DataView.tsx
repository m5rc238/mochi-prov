import { useMemo } from 'react'

import { useEvidenceSelection } from '../hooks/useEvidenceSelection'
import type { DataPoint, DataSeries } from '../model/types'

const PILL_GRADIENT = 'linear-gradient(90deg, #F9E79F 0%, #B8C0FF 60%, #D6E4FF 100%)'

/* Off-path bars keep the brand gradient at a lower opacity instead of being
   swapped for a flat grey. A series backed by the unselected claim should
   still read as a chart, not as something that failed to render. */
const OFF_PATH_OPACITY = 0.45

const formatValue = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(1))

const EvidenceChips = ({
  point,
  onSelectEvidence,
}: {
  point: DataPoint
  onSelectEvidence: (evidenceId: string) => void
}) => (
  <span className="flex shrink-0 flex-wrap justify-center gap-1">
    {point.evidenceIds.map((evidenceId) => (
      <button
        key={evidenceId}
        type="button"
        onClick={() => onSelectEvidence(evidenceId)}
        data-testid={`data-point-${point.id}-evidence-${evidenceId}`}
        className="ds-chip ds-entity-evidence ds-chip-bg hover:border-ink"
      >
        {evidenceId}
      </button>
    ))}
  </span>
)

type SeriesProps = {
  series: DataSeries
  points: DataPoint[]
  onSelect: (id: string) => void
  onSelectEvidence: (id: string) => void
  isOnPath: (point: DataPoint) => boolean
  activePointId: string | null
}

const PLOT_H = 116

const VerticalSeries = ({ series, points, onSelect, onSelectEvidence, isOnPath, activePointId }: SeriesProps) => {
  const { min, max } = useMemo(() => {
    const values = points.map((p) => p.value)
    return { min: Math.min(0, ...values), max: Math.max(0, ...values) }
  }, [points])

  const span = max - min || 1
  const zeroY = (max / span) * PLOT_H
  const showTrend = series.kind === 'trend' && points.length > 1

  const trendPoints = points
    .map((point, index) => `${((index + 0.5) / points.length) * 100},${100 - ((point.value - min) / span) * 100}`)
    .join(' ')

  return (
    <div className="relative">
      <div className="flex">
      {points.map((point) => {
        const onPath = isOnPath(point)
        const isActive = point.id === activePointId
        const valueY = PLOT_H - ((point.value - min) / span) * PLOT_H
        const top = Math.min(valueY, zeroY)
        const barHeight = Math.max(3, Math.abs(valueY - zeroY))

        return (
          <div key={point.id} className="flex flex-1 flex-col items-center gap-1">
            <div className="relative w-full" style={{ height: PLOT_H }}>
              <span
                aria-hidden="true"
                className="absolute inset-x-0 border-t ds-divider"
                style={{ top: zeroY, borderTopWidth: 1 }}
              />
              <span
                aria-hidden="true"
                className="ds-caption absolute inset-x-0 text-center text-[10px] leading-none"
                style={{
                  // Sit above the bar, or inside its top when the bar reaches
                  // the ceiling and there is no headroom left.
                  top: top < 13 ? top + 3 : top - 13,
                  color: 'var(--color-ink)',
                }}
              >
                {formatValue(point.value)}
              </span>
              <button
                type="button"
                onClick={() => onSelect(point.id)}
                aria-pressed={isActive}
                aria-label={`${point.label}: ${formatValue(point.value)} ${series.unit}. Evidence ${point.evidenceIds.join(', ')}`}
                data-testid={`data-point-${point.id}`}
                data-on-path={onPath}
                data-active={isActive}
                className={[
                  'absolute inset-0 flex flex-col justify-end rounded-chip p-0.5',
                ].join(' ')}
              >
                <span
                  className="mx-auto w-[58%] rounded-t-[2px] transition-opacity duration-200"
                  style={{
                    height: barHeight,
                    backgroundImage: PILL_GRADIENT,
                    opacity: onPath ? 1 : OFF_PATH_OPACITY,
                    outline: isActive ? '1px solid var(--color-ink)' : undefined,
                    outlineOffset: '1px',
                  }}
                />
              </button>
              {showTrend ? (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-1/2 h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{ top: valueY, background: 'var(--color-ink)', opacity: onPath ? 1 : OFF_PATH_OPACITY }}
                />
              ) : null}
            </div>

            <p className="ds-caption text-center text-[10px] leading-tight">{point.label}</p>
            <EvidenceChips point={point} onSelectEvidence={onSelectEvidence} />
          </div>
        )
      })}
      </div>

      {showTrend ? (
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0"
          /* The width must be explicit. With only a height set, the square
             viewBox aspect ratio sizes the SVG to height x height, and
             `inset-x-0` does not stretch it — which squashed the whole
             0-100 x-range into the left edge of the plot. */
          style={{ width: '100%', height: PLOT_H }}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <polyline
            points={trendPoints}
            fill="none"
            stroke="var(--color-ink)"
            strokeWidth="1.5"
            strokeOpacity="0.5"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      ) : null}
    </div>
  )
}

const FunnelSeries = ({ series, points, onSelect, onSelectEvidence, isOnPath, activePointId }: SeriesProps) => {
  const max = Math.max(1, ...points.map((p) => p.value))

  return (
    <ul className="flex flex-col gap-2">
      {points.map((point) => {
        const onPath = isOnPath(point)
        const isActive = point.id === activePointId
        return (
          <li
            key={point.id}
            className={[
              'flex items-center gap-3 rounded-chip p-1',
              isActive ? 'bg-sunken' : '',
            ].join(' ')}
          >
            <button
              type="button"
              onClick={() => onSelect(point.id)}
              aria-pressed={isActive}
              aria-label={`${point.label}: ${formatValue(point.value)} ${series.unit}. Evidence ${point.evidenceIds.join(', ')}`}
              data-testid={`data-point-${point.id}`}
              data-on-path={onPath}
              data-active={isActive}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
              <span className="ds-caption w-[78px] shrink-0 text-left text-[10px] leading-tight text-ink">
                {point.label}
              </span>
              {/* The bar's percentage has to resolve against the space left
                  over by the label and the value, not the whole row. A
                  `width: 100%` on the bar itself asked for the full row width
                  *plus* those two fixed columns, so the bar and the value were
                  pushed out through the card's edge. The track absorbs the
                  free space and the fill is measured against the track. */}
              <span className="min-w-0 flex-1">
                <span
                  className="block h-6 rounded-pill transition-opacity duration-200"
                  style={{
                    width: `${(point.value / max) * 100}%`,
                    backgroundImage: PILL_GRADIENT,
                    opacity: onPath ? 1 : OFF_PATH_OPACITY,
                    outline: isActive ? '1px solid var(--color-ink)' : undefined,
                    outlineOffset: '1px',
                  }}
                />
              </span>
              <span className="ds-caption w-[56px] shrink-0 text-[10px]">
                {formatValue(point.value)} {series.unit}
              </span>
            </button>
            <EvidenceChips point={point} onSelectEvidence={onSelectEvidence} />
          </li>
        )
      })}
    </ul>
  )
}

export const DataView = ({ onPointFocus }: { onPointFocus?: (pointId: string) => void } = {}) => {
  const { demoCase, resolved, selectDataPoint, selectEvidence } = useEvidenceSelection()
  const { dataView } = demoCase

  // Selecting a point is a request to see where the number came from, so the
  // host is told as well. Proto 01 needs no notification; Proto 02 opens a
  // source column in response.
  const onSelectPoint = (pointId: string) => {
    selectDataPoint(pointId)
    onPointFocus?.(pointId)
  }

  const onPathPoints = new Set(resolved.pathDataPointIds)
  const activePointId =
    dataView.data.find((point) => point.evidenceIds.includes(resolved.evidence?.id ?? ''))?.id ?? null

  return (
    <div
      className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto pr-1"
      data-testid="data-view"
    >
      <header>
        <h3 className="ds-display text-[19px] leading-tight">{dataView.title}</h3>
        <p className="ds-caption mt-1 max-w-[64ch]">{dataView.description}</p>
        {dataView.disclaimer ? (
          <p
            className="ds-body mt-2 rounded-card border border-rule bg-sunken px-3 py-2 text-[12px]"
            data-testid="data-view-disclaimer"
          >
            {dataView.disclaimer}
          </p>
        ) : null}
      </header>

      <div className="flex flex-col gap-4">
        {dataView.series.map((series) => {
          const points = dataView.data.filter((point) => point.seriesId === series.id)
          if (points.length === 0) return null
          const shared = {
            series,
            points,
            onSelect: onSelectPoint,
            onSelectEvidence: selectEvidence,
            isOnPath: (point: DataPoint) => onPathPoints.has(point.id),
            activePointId,
          }
          return (
            <figure
              key={series.id}
              className="ds-panel flex flex-col gap-2 px-3 py-3"
              data-testid={`data-series-${series.id}`}
            >
              <figcaption className="flex items-baseline justify-between gap-3">
                <span className="ds-label">{series.label}</span>
                <span className="ds-label">{series.unit}</span>
              </figcaption>
              {series.caption ? <p className="ds-caption">{series.caption}</p> : null}
              {series.kind === 'funnel' ? (
                <FunnelSeries {...shared} />
              ) : (
                <VerticalSeries {...shared} />
              )}
            </figure>
          )
        })}
      </div>
    </div>
  )
}
