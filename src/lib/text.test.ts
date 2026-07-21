import { describe, expect, it } from 'vitest'
import {
  escapeMarkup,
  formatDateLong,
  formatDateLongTr,
  formatDateShort,
  formatRfc822,
  truncate,
} from './text.ts'

describe('escapeMarkup', () => {
  it('escapes every markup-significant character', () => {
    expect(escapeMarkup(`<a href="x">&'`)).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&#39;')
  })

  it('leaves plain text untouched', () => {
    expect(escapeMarkup('Day 0 — plan done.')).toBe('Day 0 — plan done.')
  })
})

describe('date formatting', () => {
  it('formats long dates deterministically', () => {
    expect(formatDateLong('2026-07-19')).toBe('Jul 19, 2026')
    expect(formatDateLong('2026-12-31')).toBe('Dec 31, 2026')
  })

  it('formats short dates', () => {
    expect(formatDateShort('2026-07-19')).toBe('Jul 19')
  })

  it('formats RFC 822 dates with the correct weekday', () => {
    // 2026-07-19 and 2026-07-26 are both Sundays — the ledger's cadence.
    expect(formatRfc822('2026-07-19')).toBe('Sun, 19 Jul 2026 00:00:00 GMT')
    expect(formatRfc822('2026-07-26')).toBe('Sun, 26 Jul 2026 00:00:00 GMT')
    expect(formatRfc822('2026-12-31')).toBe('Thu, 31 Dec 2026 00:00:00 GMT')
  })

  it('rejects malformed dates', () => {
    expect(() => formatRfc822('2026/07/19')).toThrow()
  })
})

describe('formatDateLongTr', () => {
  it('formats Turkish dates without an Intl dependency', () => {
    expect(formatDateLongTr('2026-07-19')).toBe('19 Temmuz 2026')
    expect(formatDateLongTr('2026-12-31')).toBe('31 Aralık 2026')
    expect(formatDateLongTr('2026-03-01')).toBe('1 Mart 2026')
  })

  it('rejects malformed dates', () => {
    expect(() => formatDateLongTr('19.07.2026')).toThrow()
  })
})

describe('truncate', () => {
  it('leaves short text untouched', () => {
    expect(truncate('Day 0 — nothing sold yet.', 40)).toBe('Day 0 — nothing sold yet.')
  })

  it('cuts on a word boundary and marks the cut', () => {
    const result = truncate('one two three four five six seven eight', 20)
    expect(result.length).toBeLessThanOrEqual(20)
    expect(result.endsWith('…')).toBe(true)
    expect(result).toBe('one two three four…')
  })

  it('never leaves dangling punctuation before the ellipsis', () => {
    expect(truncate('shipped the thing, then broke it', 20)).toBe('shipped the thing…')
  })
})
