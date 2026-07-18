import { describe, expect, it } from 'vitest'
import { calendarDaysBetween, dayNumber, daysLeft, parseIsoDate } from './days'

const START = parseIsoDate('2026-07-19')
const GOAL = parseIsoDate('2026-12-31')

describe('parseIsoDate', () => {
  it('parses as local midnight', () => {
    const d = parseIsoDate('2026-07-19')
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 6, 19])
    expect([d.getHours(), d.getMinutes()]).toEqual([0, 0])
  })

  it('rejects malformed input', () => {
    expect(() => parseIsoDate('19-07-2026')).toThrow()
    expect(() => parseIsoDate('2026-7-19')).toThrow()
    expect(() => parseIsoDate('')).toThrow()
  })
})

describe('dayNumber', () => {
  it('is 0 on the start date, at any time of day', () => {
    expect(dayNumber(START, new Date(2026, 6, 19, 0, 0))).toBe(0)
    expect(dayNumber(START, new Date(2026, 6, 19, 23, 59))).toBe(0)
  })

  it('is 1 the next day and 165 on the goal date', () => {
    expect(dayNumber(START, new Date(2026, 6, 20, 8, 0))).toBe(1)
    expect(dayNumber(START, GOAL)).toBe(165)
  })

  it('never goes negative before the start', () => {
    expect(dayNumber(START, new Date(2026, 6, 18))).toBe(0)
  })
})

describe('daysLeft', () => {
  it('is 165 on day 0 and 0 on the goal date', () => {
    expect(daysLeft(GOAL, new Date(2026, 6, 19, 12, 0))).toBe(165)
    expect(daysLeft(GOAL, new Date(2026, 11, 31, 9, 0))).toBe(0)
  })

  it('clamps to 0 after the goal date', () => {
    expect(daysLeft(GOAL, new Date(2027, 0, 2))).toBe(0)
  })
})

describe('calendarDaysBetween (DST safety)', () => {
  it('counts a whole month correctly across the EU DST fallback (Oct 2026)', () => {
    // Europe/Istanbul has no DST, but the math must hold in any TZ the site is built in.
    expect(calendarDaysBetween(new Date(2026, 9, 1), new Date(2026, 10, 1))).toBe(31)
  })

  it('counts single days around the US spring-forward date (Mar 2026)', () => {
    expect(calendarDaysBetween(new Date(2026, 2, 7), new Date(2026, 2, 9))).toBe(2)
  })
})
