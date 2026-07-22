import { calendarDaysBetween, parseIsoDate } from './days.ts'
import type { Ledger } from './ledger.ts'

export interface SparklineModel {
  width: number
  height: number
  /** Straight reference line: the pace $100k requires, start → goal. */
  goal: { x1: number; y1: number; x2: number; y2: number }
  /** SVG path of real cumulative revenue, one vertex per ledger week. */
  actualPath: string
  /** Last real data point — where the journey actually stands. */
  last: { x: number; y: number }
  /** X of the current date, clamped to the plot; null before day 0. */
  todayX: number | null
}

/**
 * Geometry for the quiet ledger sparkline: time (start → goal date) on x,
 * dollars (0 → goal) on y. Only real ledger points are plotted — the goal
 * line is visibly a reference, not data.
 *
 * Both scales divide by a ledger field, and both emit NaN into the live SVG at
 * zero (`M0 NaN L0 NaN`). There is deliberately no guard here: `parseLedger`
 * rejects `goalUsd <= 0` and `goalDate <= startDate`, and it is the only way a
 * Ledger is ever built. A second copy of that rule would be a second place to
 * keep it in sync, and it would dress a broken ledger.json up as a plausible
 * flat line instead of failing the build. sparkline.test.ts pins the
 * dependency, so relaxing the upstream guard turns this file's tests red.
 */
export function sparklineModel(
  ledger: Ledger,
  now: Date,
  width = 560,
  height = 120,
): SparklineModel {
  const start = parseIsoDate(ledger.startDate)
  const spanDays = calendarDaysBetween(start, parseIsoDate(ledger.goalDate))
  const x = (iso: string) =>
    Math.min(width, Math.max(0, (calendarDaysBetween(start, parseIsoDate(iso)) / spanDays) * width))
  const y = (usd: number) => height - Math.min(1, usd / ledger.goalUsd) * height

  let cumulative = 0
  const points: Array<[number, number]> = [[0, y(0)]]
  for (const week of ledger.weeks) {
    cumulative += week.revenue
    points.push([x(week.weekEnding), y(cumulative)])
  }

  const [lastX, lastY] = points[points.length - 1]
  const todayDays = calendarDaysBetween(start, now)
  return {
    width,
    height,
    goal: { x1: 0, y1: y(0), x2: width, y2: y(ledger.goalUsd) },
    actualPath: points
      .map(([px, py], i) => `${i === 0 ? 'M' : 'L'}${round(px)} ${round(py)}`)
      .join(' '),
    last: { x: round(lastX), y: round(lastY) },
    todayX: todayDays < 0 ? null : round(Math.min(width, (todayDays / spanDays) * width)),
  }
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}
