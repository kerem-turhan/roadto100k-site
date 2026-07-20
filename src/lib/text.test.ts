import { describe, expect, it } from 'vitest'
import { escapeMarkup, formatDateLong, formatDateShort, formatRfc822 } from './text.ts'

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
