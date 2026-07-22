import { describe, expect, it } from 'vitest'
import {
  archiveUrl,
  basePath,
  injectSiteUrl,
  feedUrl,
  trFeedUrl,
  trHomeUrl,
  trWeekUrl,
  weekOgPath,
  weekOgUrl,
  weekUrl,
} from './urls.ts'

const site = 'https://example.test/site/'

describe('url helpers', () => {
  it('builds every canonical URL from the site root', () => {
    expect(weekUrl(site, '2026-07-19')).toBe('https://example.test/site/w/2026-07-19/')
    expect(archiveUrl(site)).toBe('https://example.test/site/w/')
    expect(feedUrl(site)).toBe('https://example.test/site/feed.xml')
    expect(trHomeUrl(site)).toBe('https://example.test/site/tr/')
    expect(trWeekUrl(site, '2026-07-19')).toBe('https://example.test/site/tr/w/2026-07-19/')
    expect(trFeedUrl(site)).toBe('https://example.test/site/tr/feed.xml')
    expect(weekOgUrl(site, '2026-07-19')).toBe('https://example.test/site/og/w/2026-07-19.png')
  })

  it('keeps the share-card path in step with its URL', () => {
    expect(weekOgUrl(site, '2026-07-19')).toBe(`${site}${weekOgPath('2026-07-19')}`)
  })

  it('derives the base path for project pages and custom domains alike', () => {
    expect(basePath(site)).toBe('/site/')
    expect(basePath('https://example.test/')).toBe('/')
    expect(basePath('https://example.test')).toBe('/')
  })
})

describe('injectSiteUrl', () => {
  it('fills every occurrence of the token', () => {
    const html = '<link href="%SITE_URL%" /><meta content="%SITE_URL%og.png" />'
    expect(injectSiteUrl(html, 'https://example.test/site/')).toBe(
      '<link href="https://example.test/site/" /><meta content="https://example.test/site/og.png" />',
    )
  })

  it('throws rather than silently shipping an unsubstituted head', () => {
    expect(() => injectSiteUrl('<link href="https://hardcoded.test/" />', 'https://x.test/')).toThrow(
      /carries no %SITE_URL% token/,
    )
  })
})

