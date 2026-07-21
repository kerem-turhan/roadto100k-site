import type { JournalMeta } from './journal.ts'
import type { Ledger } from './ledger.ts'
import { parseLedger } from './ledger.ts'

/**
 * Shared test fixtures. The second week exists only here (tests), never in
 * ledger.json — real data on the site stays real.
 */

export const FIXTURE_LEDGER: Ledger = parseLedger({
  startDate: '2026-07-19',
  goalDate: '2026-12-31',
  goalUsd: 100_000,
  weeks: [
    {
      weekEnding: '2026-07-19',
      revenue: 0,
      mrr: 0,
      spend: 0,
      emailSubs: 0,
      note: 'Day 0 — plan done, site live, nothing sold yet.',
    },
    {
      weekEnding: '2026-07-26',
      revenue: 150,
      mrr: 50,
      spend: 20,
      emailSubs: 12,
      note: 'A note with <angles>, "quotes" & ampersands.',
      trNote: 'Türkçe özet: <açı>, "tırnak" ve & işareti.',
    },
  ],
})

export const FIXTURE_META: JournalMeta = {
  siteUrl: 'https://example.test/site/',
  siteName: 'roadto100kwkerem',
  authorName: 'Kerem Turhan',
  description: 'A public ledger of a $0 to $100k journey.',
  sameAs: ['https://x.com/mkeremturhan', 'https://github.com/kerem-turhan'],
  xUrl: 'https://x.com/mkeremturhan',
  goalDate: '2026-12-31',
  goalUsd: 100_000,
  ogImage: 'https://example.test/site/og.png',
}
