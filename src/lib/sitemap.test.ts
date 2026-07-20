import { describe, expect, it } from 'vitest'
import { FIXTURE_LEDGER, FIXTURE_META } from './fixtures.ts'
import { buildRobots, buildSitemap } from './sitemap.ts'

const sitemap = buildSitemap(FIXTURE_LEDGER, FIXTURE_META.siteUrl)

describe('buildSitemap', () => {
  it('lists the root, the archive and every week page', () => {
    expect(sitemap.match(/<url>/g)).toHaveLength(4)
    expect(sitemap).toContain('<loc>https://example.test/site/</loc>')
    expect(sitemap).toContain('<loc>https://example.test/site/w/</loc>')
    expect(sitemap).toContain('<loc>https://example.test/site/w/2026-07-19/</loc>')
    expect(sitemap).toContain('<loc>https://example.test/site/w/2026-07-26/</loc>')
  })

  it('stamps lastmod from ledger dates only', () => {
    // Root and archive move with the latest week; week pages carry their own date.
    expect(sitemap.match(/<lastmod>2026-07-26<\/lastmod>/g)).toHaveLength(3)
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
