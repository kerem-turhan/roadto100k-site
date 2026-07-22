import { describe, expect, it } from 'vitest'
import { config } from '@/config'
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

  /*
   * Dates that match /^\d{4}-\d{2}-\d{2}$/ but are not days. These used to be
   * accepted: `2026-19-07` published "Wed, 07 undefined 2026" as a pubDate into
   * the live RSS feed, and the whole gauntlet stayed green.
   */
  it.each([
    ['month 19 (transposed day/month)', '2026-19-07'],
    ['month 00', '2026-00-15'],
    ['month 13', '2026-13-01'],
    ['day 00', '2026-07-00'],
    ['day 32', '2026-07-32'],
    ['30 February', '2026-02-30'],
    ['29 February in a common year', '2026-02-29'],
    ['31 April', '2026-04-31'],
  ])('rejects an impossible weekEnding: %s', (_name, weekEnding) => {
    expect(() => parseLedger(ledger([week({ weekEnding })]))).toThrow(/real calendar date/)
  })

  it('rejects an impossible startDate or goalDate too', () => {
    expect(() => parseLedger({ ...ledger([week()]), startDate: '2026-19-07' })).toThrow(
      /startDate.*real calendar date/,
    )
    expect(() => parseLedger({ ...ledger([week()]), goalDate: '2026-02-30' })).toThrow(
      /goalDate.*real calendar date/,
    )
  })

  it('still accepts real leap days', () => {
    const parsed = parseLedger({
      ...ledger([week({ weekEnding: '2028-02-29' })]),
      goalDate: '2028-12-31',
    })
    expect(parsed.weeks[0].weekEnding).toBe('2028-02-29')
  })

  /*
   * Numbers that parse but cannot be true. Each of these used to render: a week
   * outside the window printed "day -2387 of 165", and 2.7 subscribers printed
   * as "2.7" on a page that claims every figure is real.
   */
  it.each([
    ['a week before the journey started', ledger([week({ weekEnding: '2020-01-05' })])],
    ['a week after the goal date', ledger([week({ weekEnding: '2027-06-30' })])],
    ['a fractional subscriber count', ledger([week({ emailSubs: 2.7 })])],
    ['a zero goal', { ...ledger([week()]), goalUsd: 0 }],
    ['a goal date before the start', { ...ledger([week()]), goalDate: '2026-07-18' }],
    ['a goal date equal to the start', { ...ledger([week()]), goalDate: '2026-07-19' }],
  ])('rejects %s', (_name, raw) => {
    expect(() => parseLedger(raw)).toThrow(/Invalid ledger data/)
  })
})

/*
 * The journey window is written down twice — src/config.ts and
 * src/data/ledger.json — and different surfaces read different copies: the day
 * stamp and the static-page generator read the config, while the week pages,
 * share cards and sparkline read the ledger. Changing one alone used to publish
 * two contradictory numbers on the same page ("day 0 of 346" beside a footer
 * promising Dec 31, 2026) with the whole suite still green.
 */
describe('config.ts and ledger.json', () => {
  it('agree on the journey window', () => {
    const shipped = parseLedger(rawLedger)
    expect(shipped.startDate).toBe(config.START_DATE)
    expect(shipped.goalDate).toBe(config.GOAL_DATE)
    expect(shipped.goalUsd).toBe(config.GOAL_USD)
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
