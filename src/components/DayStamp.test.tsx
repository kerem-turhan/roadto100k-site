import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import { DayStamp } from './DayStamp'

/**
 * Regression guard for the "DAY 0 · 0 DAYS LEFT" bug: the stamp once started
 * at 0 and only reached the real number via a rAF-driven animation, so
 * throttled browsers showed 0 forever. renderToString exercises exactly the
 * synchronous first render — no effects, no animation frames — which is what
 * every user must see even if all script animation stalls.
 */
describe('DayStamp first synchronous render', () => {
  const textOf = (html: string) => html.replace(/<[^>]+>/g, '')

  it('shows the true day/days-left on day 0 (2026-07-19 → 165 left)', () => {
    const text = textOf(renderToString(<DayStamp now={new Date(2026, 6, 19, 9, 0)} />))
    expect(text).toContain('Day 0')
    expect(text).toContain('165 days left')
  })

  it('computes both numbers from the date anchors mid-journey (2026-08-01)', () => {
    const text = textOf(renderToString(<DayStamp now={new Date(2026, 7, 1, 12, 0)} />))
    expect(text).toContain('Day 13')
    expect(text).toContain('152 days left')
  })

  it('bottoms out at 0 days left on the goal date, never negative after', () => {
    const onGoal = textOf(renderToString(<DayStamp now={new Date(2026, 11, 31)} />))
    expect(onGoal).toContain('Day 165')
    expect(onGoal).toContain('0 days left')

    const after = textOf(renderToString(<DayStamp now={new Date(2027, 0, 15)} />))
    expect(after).toContain('0 days left')
  })
})
