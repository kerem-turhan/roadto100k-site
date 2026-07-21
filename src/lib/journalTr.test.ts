import { describe, expect, it } from 'vitest'
import { FIXTURE_LEDGER, FIXTURE_META } from './fixtures.ts'
import { buildTrPages } from './journalTr.ts'
import { parseLedger } from './ledger.ts'

const pages = buildTrPages(FIXTURE_LEDGER, FIXTURE_META)
const week = pages[0]
const index = pages[1]

/** The fixture's week 0 has no trNote; week 1 does. */
describe('buildTrPages', () => {
  it('builds a page only for weeks that have a Turkish summary', () => {
    expect(pages.map((p) => p.path)).toEqual(['tr/w/2026-07-26/index.html', 'tr/index.html'])
  })

  it('builds nothing at all when no week has one', () => {
    const englishOnly = parseLedger({
      ...FIXTURE_LEDGER,
      weeks: FIXTURE_LEDGER.weeks.map(({ trNote: _trNote, ...rest }) => rest),
    })
    expect(buildTrPages(englishOnly, FIXTURE_META)).toEqual([])
  })

  it('marks the pages as Turkish and canonicalises them under /tr/', () => {
    expect(week.html).toContain('<html lang="tr">')
    expect(week.html).toContain(
      '<link rel="canonical" href="https://example.test/site/tr/w/2026-07-26/" />',
    )
    expect(index.html).toContain('<link rel="canonical" href="https://example.test/site/tr/" />')
    expect(week.html).toContain('"inLanguage":"tr"')
  })

  it('cross-links the two languages with hreflang', () => {
    expect(week.html).toContain(
      '<link rel="alternate" hreflang="en" href="https://example.test/site/w/2026-07-26/" />',
    )
    expect(week.html).toContain(
      '<link rel="alternate" hreflang="tr" href="https://example.test/site/tr/w/2026-07-26/" />',
    )
    expect(week.html).toContain('<link rel="alternate" hreflang="x-default"')
    expect(week.html).toContain('href="https://example.test/site/w/2026-07-26/" hreflang="en"')
  })

  it('shows the real numbers with Turkish labels', () => {
    expect(week.html).toContain('26 Temmuz 2026 haftası · gün 7/165')
    expect(week.html).toContain('<dd class="green">$150</dd>')
    expect(week.html).toContain(
      'Bugüne dek: $150 kümülatif gelir · $20 toplam harcama · hedef $100,000',
    )
    expect(week.html).toContain('Aboneler')
  })

  it('keeps every figure label short enough to stay on one line', () => {
    // A wrapped label would push its value onto a second baseline and break
    // the ledger row. Turkish labels stay within the English label's width.
    const labels = [...week.html.matchAll(/<dt>([^<]+)<\/dt>/g)].map((match) => match[1])
    expect(labels).toEqual(['Gelir (hafta)', 'MRR', 'Gider (hafta)', 'Aboneler'])
    for (const label of labels) expect(label.length).toBeLessThanOrEqual(14)
  })

  it('escapes the Turkish note', () => {
    expect(week.html).toContain('Türkçe özet: &lt;açı&gt;, &quot;tırnak&quot; ve &amp; işareti.')
    expect(week.html).not.toContain('<açı>')
    expect(index.html).toContain('&lt;açı&gt;')
  })

  it('never invents a summary for a week without one', () => {
    const all = pages.map((p) => p.html).join('')
    expect(all).not.toContain('2026-07-19')
    expect(all).not.toContain('Hafta 0')
    expect(all.toLowerCase()).not.toContain('yakında')
  })

  it('uses the Turkish share card when one exists', () => {
    const withCard = buildTrPages(FIXTURE_LEDGER, {
      ...FIXTURE_META,
      trWeekOgWeeks: ['2026-07-26'],
    })
    expect(withCard[0].html).toContain(
      '<meta property="og:image" content="https://example.test/site/og/w/tr/2026-07-26.png" />',
    )
  })

  it('never borrows the English card — it would read English under og:locale tr_TR', () => {
    const englishCardOnly = buildTrPages(FIXTURE_LEDGER, {
      ...FIXTURE_META,
      weekOgWeeks: ['2026-07-26'],
    })
    expect(englishCardOnly[0].html).toContain(
      `<meta property="og:image" content="${FIXTURE_META.ogImage}" />`,
    )
  })

  it('is deterministic for the same input', () => {
    expect(buildTrPages(FIXTURE_LEDGER, FIXTURE_META)).toEqual(pages)
  })
})
