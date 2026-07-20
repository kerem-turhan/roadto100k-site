import { useState } from 'react'
import type { Ledger } from '@/lib/ledger'
import { formatUsd, ledgerTotals } from '@/lib/ledger'
import { sparklineModel } from '@/lib/sparkline'
import { formatDateLong } from '@/lib/text'

interface LedgerSparklineProps {
  ledger: Ledger
  /** Injectable clock for tests; defaults to the real current date. */
  now?: Date
}

/**
 * Plot geometry (unitless viewBox). Labels are HTML outside the SVG so they
 * stay pixel-crisp instead of scaling down with the drawing on small screens.
 */
const PLOT = { w: 560, h: 120, top: 6, bottom: 1 }

const AXIS_LABEL = 'font-mono text-[0.6875rem] tracking-[0.2em] text-ink-muted uppercase'

/**
 * The quiet ledger chart: real cumulative revenue (green) against the
 * straight-line pace $100k demands (dashed). Static SVG — the truth needs no
 * animation frames.
 */
export function LedgerSparkline({ ledger, now }: LedgerSparklineProps) {
  const [mountedNow] = useState(() => now ?? new Date())
  const model = sparklineModel(ledger, mountedNow, PLOT.w, PLOT.h)
  const totals = ledgerTotals(ledger)
  const height = PLOT.top + PLOT.h + PLOT.bottom

  return (
    <div>
      <p aria-hidden className={`mb-1 text-right ${AXIS_LABEL}`}>
        {formatUsd(ledger.goalUsd)}
      </p>
      <svg
        viewBox={`0 0 ${PLOT.w} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Chart: cumulative revenue ${formatUsd(totals.cumulativeRevenue)}, plotted against the straight-line pace to ${formatUsd(ledger.goalUsd)} by ${formatDateLong(ledger.goalDate)}.`}
      >
        <g transform={`translate(0 ${PLOT.top})`}>
        {/* time axis */}
        <line
          x1={0}
          y1={PLOT.h}
          x2={PLOT.w}
          y2={PLOT.h}
          stroke="var(--rule)"
          vectorEffect="non-scaling-stroke"
        />
        {/* the pace $100k demands — a reference, visibly not data */}
        <line
          x1={model.goal.x1}
          y1={model.goal.y1}
          x2={model.goal.x2}
          y2={model.goal.y2}
          stroke="var(--ink-muted)"
          strokeDasharray="3 5"
          opacity={0.55}
          vectorEffect="non-scaling-stroke"
        />
        {/* the $100k mark, inked in red like the goal line before it */}
        <line
          x1={PLOT.w - 1}
          y1={model.goal.y2 - 5}
          x2={PLOT.w - 1}
          y2={model.goal.y2 + 5}
          stroke="var(--ledger-red)"
          strokeWidth={2}
        />
        {/* today's position on the time axis */}
        {model.todayX !== null && (
          <line
            x1={model.todayX}
            y1={PLOT.h - 5}
            x2={model.todayX}
            y2={PLOT.h}
            stroke="var(--ledger-red)"
            vectorEffect="non-scaling-stroke"
          />
        )}
        {/* what actually happened */}
        <path
          d={model.actualPath}
          fill="none"
          stroke="var(--ledger-green)"
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
        />
        <circle cx={model.last.x} cy={model.last.y} r={2.5} fill="var(--ledger-green)" />
        </g>
      </svg>
      <div aria-hidden className={`mt-1.5 flex justify-between ${AXIS_LABEL}`}>
        <span>{formatDateLong(ledger.startDate)}</span>
        <span>{formatDateLong(ledger.goalDate)}</span>
      </div>
    </div>
  )
}
