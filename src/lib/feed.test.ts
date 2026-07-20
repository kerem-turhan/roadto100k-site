import { describe, expect, it } from 'vitest'
import { buildFeed } from './feed.ts'
import { FIXTURE_LEDGER, FIXTURE_META } from './fixtures.ts'

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
