import { describe, expect, it } from 'vitest'
import { FIXTURE_LEDGER, FIXTURE_META } from './fixtures.ts'
import { buildJournalPages, weekOgImage } from './journal.ts'

const pages = buildJournalPages(FIXTURE_LEDGER, FIXTURE_META)
const week0 = pages[0]
const week1 = pages[1]
const archive = pages[2]

describe('buildJournalPages', () => {
  it('renders one page per week plus the archive index', () => {
    expect(pages.map((p) => p.path)).toEqual([
      'w/2026-07-19/index.html',
      'w/2026-07-26/index.html',
      'w/index.html',
    ])
  })

  it('gives every page a canonical URL and JSON-LD', () => {
    expect(week0.html).toContain(
      '<link rel="canonical" href="https://example.test/site/w/2026-07-19/" />',
    )
    expect(archive.html).toContain('<link rel="canonical" href="https://example.test/site/w/" />')
    expect(week1.html).toContain('"@type":"BlogPosting"')
    expect(week1.html).toContain('"datePublished":"2026-07-26"')
  })

  it('shows real weekly numbers and running totals', () => {
    expect(week1.html).toContain('Week ending Jul 26, 2026 · day 7 of 165')
    expect(week1.html).toContain('<dd class="green">$150</dd>')
    expect(week1.html).toContain(
      'To date: $150 cumulative revenue · $20 total spend · goal $100,000',
    )
    // Week 0 has no revenue: the figure must not be painted green.
    expect(week0.html).not.toContain('class="green">$0')
  })

  it('escapes ledger notes in HTML output', () => {
    expect(week1.html).toContain('&lt;angles&gt;, &quot;quotes&quot; &amp; ampersands')
    expect(week1.html).not.toContain('<angles>')
  })

  it('links adjacent weeks both ways', () => {
    expect(week0.html).toContain('href="https://example.test/site/w/2026-07-26/">Week 1 →')
    expect(week0.html).not.toContain('← Week -1')
    expect(week1.html).toContain('href="https://example.test/site/w/2026-07-19/">← Week 0')
  })

  it('lists every week in the archive, newest first', () => {
    const newest = archive.html.indexOf('Week 1 — Jul 26, 2026')
    const oldest = archive.html.indexOf('Week 0 — Jul 19, 2026')
    expect(newest).toBeGreaterThan(-1)
    expect(oldest).toBeGreaterThan(newest)
  })

  it('references fonts and internal links through the site base path', () => {
    expect(week0.html).toContain("url('/site/fonts/ibm-plex-mono-latin-400.woff2')")
    expect(week0.html).toContain('href="/site/#signup"')
  })
})

describe('journal share cards and language links', () => {
  it('falls back to the site-wide card when a week has none', () => {
    expect(week0.html).toContain(
      '<meta property="og:image" content="https://example.test/site/og.png" />',
    )
  })

  it('uses the per-week card once it is committed', () => {
    const withCards = buildJournalPages(FIXTURE_LEDGER, {
      ...FIXTURE_META,
      weekOgWeeks: ['2026-07-26'],
    })
    expect(withCards[1].html).toContain(
      '<meta property="og:image" content="https://example.test/site/og/w/2026-07-26.png" />',
    )
    // Week 0 still has no card of its own.
    expect(withCards[0].html).toContain(
      '<meta property="og:image" content="https://example.test/site/og.png" />',
    )
    expect(weekOgImage(FIXTURE_LEDGER.weeks[1], { ...FIXTURE_META, weekOgWeeks: [] })).toBe(
      FIXTURE_META.ogImage,
    )
  })

  it('links to the Turkish page only for weeks that have one', () => {
    expect(week1.html).toContain(
      '<link rel="alternate" hreflang="tr" href="https://example.test/site/tr/w/2026-07-26/" />',
    )
    expect(week1.html).toContain('Bu haftanın Türkçe özeti →')
    expect(week0.html).not.toContain('hreflang="tr"')
    expect(week0.html).not.toContain('/tr/')
  })
})

describe('shell chrome', () => {
  it('links English pages to the Turkish summaries once they exist', () => {
    const [withTr] = buildJournalPages(FIXTURE_LEDGER, { ...FIXTURE_META, hasTrPages: true })
    expect(withTr.html).toContain('<a href="/site/tr/" lang="tr" hreflang="tr">Türkçe</a>')
    expect(week0.html).not.toContain('>Türkçe<')
  })

  it('never points the brand and the breadcrumb at the same page', () => {
    for (const page of pages) {
      const hrefs = [...page.html.matchAll(/class="(?:brand|crumb)" href="([^"]+)"/g)].map(
        (match) => match[1],
      )
      expect(new Set(hrefs).size).toBe(hrefs.length)
    }
    // The archive is the brand's own destination, so it carries no crumb.
    expect(archive.html).not.toContain('class="crumb"')
    expect(week0.html).toContain('class="crumb" href="/site/w/"')
  })

  it('serves both font subsets so Turkish glyphs are not left to a fallback', () => {
    expect(week0.html).toContain('ibm-plex-mono-latin-ext-500.woff2')
    expect(week0.html).toContain('unicode-range:U+0100-02BA')
  })
})
