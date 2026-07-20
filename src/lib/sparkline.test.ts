import { describe, expect, it } from 'vitest'
import { parseIsoDate } from './days.ts'
import { FIXTURE_LEDGER } from './fixtures.ts'
import { parseLedger } from './ledger.ts'
import { sparklineModel } from './sparkline.ts'

const W = 560
const H = 120
const now = parseIsoDate('2026-07-26')
const model = sparklineModel(FIXTURE_LEDGER, now, W, H)

describe('sparklineModel', () => {
  it('draws the goal reference from $0 at the start to the goal at the end', () => {
    expect(model.goal).toEqual({ x1: 0, y1: H, x2: W, y2: 0 })
  })

  it('starts the actual line at day 0, $0', () => {
    expect(model.actualPath.startsWith(`M0 ${H}`)).toBe(true)
  })

  it('accumulates revenue week over week', () => {
    // Cumulative $150 of $100k after 7 of 165 days.
    const x = (7 / 165) * W
    const y = H - (150 / 100_000) * H
    expect(model.last.x).toBeCloseTo(x, 1)
    expect(model.last.y).toBeCloseTo(y, 1)
    expect(model.actualPath.match(/[ML]/g)).toHaveLength(3) // start + 2 weeks
  })

  it('keeps a zero-revenue ledger flat on the baseline', () => {
    const zeros = parseLedger({
      startDate: '2026-07-19',
      goalDate: '2026-12-31',
      goalUsd: 100_000,
      weeks: [
        { weekEnding: '2026-07-19', revenue: 0, mrr: 0, spend: 0, emailSubs: 0, note: 'zero' },
      ],
    })
    const flat = sparklineModel(zeros, now, W, H)
    expect(flat.actualPath).toBe(`M0 ${H} L0 ${H}`)
    expect(flat.last).toEqual({ x: 0, y: H })
  })

  it('marks today on the axis, clamped to the plot', () => {
    expect(model.todayX).toBeCloseTo((7 / 165) * W, 1)
    expect(sparklineModel(FIXTURE_LEDGER, parseIsoDate('2026-07-18'), W, H).todayX).toBeNull()
    expect(sparklineModel(FIXTURE_LEDGER, parseIsoDate('2027-06-01'), W, H).todayX).toBe(W)
  })

  it('clamps cumulative revenue above the goal to the top of the plot', () => {
    const rich = parseLedger({
      startDate: '2026-07-19',
      goalDate: '2026-12-31',
      goalUsd: 100_000,
      weeks: [
        {
          weekEnding: '2026-08-02',
          revenue: 250_000,
          mrr: 0,
          spend: 0,
          emailSubs: 0,
          note: 'hypothetical',
        },
      ],
    })
    expect(sparklineModel(rich, now, W, H).last.y).toBe(0)
  })
})
