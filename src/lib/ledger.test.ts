import { describe, expect, it } from 'vitest'
import rawLedger from '../data/ledger.json'
import { formatUsd, ledgerTotals, parseLedger, trWeekEntries } from './ledger'

const week = (overrides: Partial<Record<string, unknown>> = {}) => ({
  weekEnding: '2026-07-19',
  revenue: 0,
  mrr: 0,
  spend: 0,
  emailSubs: 0,
  note: 'seed',
  ...overrides,
})

const ledger = (weeks: unknown[]) => ({
  startDate: '2026-07-19',
  goalDate: '2026-12-31',
  goalUsd: 100000,
  weeks,
})

describe('parseLedger', () => {
  it('accepts the real ledger.json shipped with the site', () => {
    const parsed = parseLedger(rawLedger)
    expect(parsed.weeks.length).toBeGreaterThan(0)
    expect(parsed.goalUsd).toBe(100000)
  })

  it('sorts weeks by weekEnding ascending', () => {
    const parsed = parseLedger(
      ledger([week({ weekEnding: '2026-08-02' }), week({ weekEnding: '2026-07-26' })]),
    )
    expect(parsed.weeks.map((w) => w.weekEnding)).toEqual(['2026-07-26', '2026-08-02'])
  })

  it.each([
    ['missing revenue', ledger([week({ revenue: undefined })])],
    ['negative spend', ledger([week({ spend: -5 })])],
    ['NaN mrr', ledger([week({ mrr: Number.NaN })])],
    ['bad date format', ledger([week({ weekEnding: '19.07.2026' })])],
    ['missing note', ledger([week({ note: undefined })])],
    ['empty weeks', ledger([])],
    ['duplicate weekEnding', ledger([week(), week()])],
    ['not an object', 42],
  ])('rejects %s', (_name, raw) => {
    expect(() => parseLedger(raw)).toThrow(/Invalid ledger data/)
  })
})

describe('ledgerTotals', () => {
  it('sums revenue and spend across weeks, takes mrr/subs from the latest week', () => {
    const totals = ledgerTotals(
      parseLedger(
        ledger([
          week({ weekEnding: '2026-07-19' }),
          week({ weekEnding: '2026-07-26', revenue: 40, spend: 10, mrr: 5, emailSubs: 3 }),
          week({ weekEnding: '2026-08-02', revenue: 60, spend: 2, mrr: 25, emailSubs: 9 }),
        ]),
      ),
    )
    expect(totals).toEqual({
      cumulativeRevenue: 100,
      totalSpend: 12,
      currentMrr: 25,
      emailSubs: 9,
      weekNumber: 2,
    })
  })

  it('reports honest zeros for the seed-only ledger', () => {
    const totals = ledgerTotals(parseLedger(ledger([week()])))
    expect(totals).toEqual({
      cumulativeRevenue: 0,
      totalSpend: 0,
      currentMrr: 0,
      emailSubs: 0,
      weekNumber: 0,
    })
  })
})

describe('formatUsd', () => {
  it.each([
    [0, '$0'],
    [7, '$7'],
    [1234, '$1,234'],
    [100000, '$100,000'],
  ])('formats %d as %s', (input, expected) => {
    expect(formatUsd(input)).toBe(expected)
  })
})

describe('trNote', () => {
  it('is optional and kept when written', () => {
    const parsed = parseLedger(ledger([week({ trNote: '  Gün 0 — plan bitti.  ' })]))
    expect(parsed.weeks[0].trNote).toBe('Gün 0 — plan bitti.')
  })

  it('treats a blank summary as not written', () => {
    expect(parseLedger(ledger([week({ trNote: '   ' })])).weeks[0].trNote).toBeUndefined()
    expect(parseLedger(ledger([week()])).weeks[0].trNote).toBeUndefined()
  })

  it('rejects a non-string summary', () => {
    expect(() => parseLedger(ledger([week({ trNote: 42 })]))).toThrow(/trNote/)
  })
})

describe('trWeekEntries', () => {
  it('returns only the summarised weeks, keeping their week numbers', () => {
    const parsed = parseLedger(
      ledger([
        week({ weekEnding: '2026-07-19' }),
        week({ weekEnding: '2026-07-26', trNote: 'İkinci hafta.' }),
        week({ weekEnding: '2026-08-02' }),
      ]),
    )
    expect(trWeekEntries(parsed)).toEqual([
      { week: parsed.weeks[1], index: 1, trNote: 'İkinci hafta.' },
    ])
  })

  it('is empty when nothing has been summarised', () => {
    expect(trWeekEntries(parseLedger(ledger([week()])))).toEqual([])
  })
})
