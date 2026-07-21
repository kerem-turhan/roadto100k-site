import { describe, expect, it } from 'vitest'
import { FIXTURE_LEDGER, FIXTURE_META } from './fixtures.ts'
import { parseLedger } from './ledger.ts'
import { buildRobots, buildSitemap } from './sitemap.ts'

const sitemap = buildSitemap(FIXTURE_LEDGER, FIXTURE_META.siteUrl)

describe('buildSitemap', () => {
  it('lists the root, the archive and every week page', () => {
    expect(sitemap).toContain('<loc>https://example.test/site/</loc>')
    expect(sitemap).toContain('<loc>https://example.test/site/w/</loc>')
    expect(sitemap).toContain('<loc>https://example.test/site/w/2026-07-19/</loc>')
    expect(sitemap).toContain('<loc>https://example.test/site/w/2026-07-26/</loc>')
  })

  it('lists the Turkish index and only the weeks that have a summary', () => {
    // The fixture's second week has a trNote; the first one does not.
    expect(sitemap).toContain('<loc>https://example.test/site/tr/</loc>')
    expect(sitemap).toContain('<loc>https://example.test/site/tr/w/2026-07-26/</loc>')
    expect(sitemap).not.toContain('<loc>https://example.test/site/tr/w/2026-07-19/</loc>')
    expect(sitemap.match(/<url>/g)).toHaveLength(6)
  })

  it('omits the Turkish section entirely when no week has a summary', () => {
    const englishOnly = parseLedger({
      ...FIXTURE_LEDGER,
      weeks: FIXTURE_LEDGER.weeks.map(({ trNote: _trNote, ...week }) => week),
    })
    const xml = buildSitemap(englishOnly, FIXTURE_META.siteUrl)
    expect(xml).not.toContain('/tr/')
    expect(xml.match(/<url>/g)).toHaveLength(4)
  })

  it('stamps lastmod from ledger dates only', () => {
    // Root, archive and the Turkish index move with the latest week;
    // week pages carry their own date.
    expect(sitemap.match(/<lastmod>2026-07-26<\/lastmod>/g)).toHaveLength(5)
    expect(sitemap).toContain('<lastmod>2026-07-19</lastmod>')
  })
})

describe('buildRobots', () => {
  it('allows everything and advertises the sitemap', () => {
    const robots = buildRobots(FIXTURE_META.siteUrl)
    expect(robots).toContain('User-agent: *')
    expect(robots).toContain('Allow: /')
    expect(robots).toContain('Sitemap: https://example.test/site/sitemap.xml')
  })
})
