import { describe, expect, it } from 'vitest'
import { buildFeed, buildTrFeed } from './feed.ts'
import { FIXTURE_LEDGER, FIXTURE_META } from './fixtures.ts'
import { parseLedger } from './ledger.ts'

const feed = buildFeed(FIXTURE_LEDGER, FIXTURE_META)

describe('buildFeed', () => {
  it('declares RSS 2.0 with a self link', () => {
    expect(feed).toContain('<rss version="2.0"')
    expect(feed).toContain(
      '<atom:link href="https://example.test/site/feed.xml" rel="self" type="application/rss+xml"/>',
    )
  })

  it('has one item per ledger week, newest first', () => {
    expect(feed.match(/<item>/g)).toHaveLength(2)
    const newest = feed.indexOf('w/2026-07-26/')
    const oldest = feed.indexOf('w/2026-07-19/')
    expect(newest).toBeGreaterThan(-1)
    expect(oldest).toBeGreaterThan(newest)
  })

  it('uses real ledger numbers in titles and RFC 822 pubDates', () => {
    expect(feed).toContain('Week 1 — revenue $150 · spend $20')
    expect(feed).toContain('<pubDate>Sun, 26 Jul 2026 00:00:00 GMT</pubDate>')
    expect(feed).toContain('<lastBuildDate>Sun, 26 Jul 2026 00:00:00 GMT</lastBuildDate>')
  })

  it('escapes markup-significant characters in notes', () => {
    expect(feed).toContain('&lt;angles&gt;')
    expect(feed).toContain('&amp; ampersands')
    expect(feed).not.toContain('<angles>')
  })

  it('is deterministic for the same input', () => {
    expect(buildFeed(FIXTURE_LEDGER, FIXTURE_META)).toBe(feed)
  })
})

describe('buildTrFeed', () => {
  const trFeed = buildTrFeed(FIXTURE_LEDGER, FIXTURE_META)

  it('is a Turkish channel with its own self link', () => {
    expect(trFeed).toContain('<language>tr</language>')
    expect(trFeed).toContain(
      '<atom:link href="https://example.test/site/tr/feed.xml" rel="self" type="application/rss+xml"/>',
    )
  })

  it('carries only the weeks that have a Turkish summary', () => {
    expect(trFeed?.match(/<item>/g)).toHaveLength(1)
    expect(trFeed).toContain('<link>https://example.test/site/tr/w/2026-07-26/</link>')
    expect(trFeed).not.toContain('2026-07-19')
    expect(trFeed).toContain('Hafta 1 — gelir $150 · harcama $20')
    expect(trFeed).toContain('26 Temmuz 2026 haftası')
  })

  it('escapes the Turkish note', () => {
    expect(trFeed).toContain('&lt;açı&gt;')
    expect(trFeed).not.toContain('<açı>')
  })

  it('returns null — never an empty channel — when no week has a summary', () => {
    const englishOnly = parseLedger({
      ...FIXTURE_LEDGER,
      weeks: FIXTURE_LEDGER.weeks.map(({ trNote: _trNote, ...week }) => week),
    })
    expect(buildTrFeed(englishOnly, FIXTURE_META)).toBeNull()
  })
})
