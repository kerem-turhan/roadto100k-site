import { describe, expect, it } from 'vitest'
import { FIXTURE_LEDGER, FIXTURE_META } from './fixtures.ts'
import { weekOgImage } from './journal.ts'
import { serializeJsonLd, siteJsonLd, weekJsonLd } from './seo.ts'

describe('siteJsonLd', () => {
  const graph = (siteJsonLd(FIXTURE_LEDGER, FIXTURE_META) as { '@graph': any[] })['@graph']

  it('describes Person, WebSite and the ledger Dataset', () => {
    expect(graph.map((node) => node['@type'])).toEqual(['Person', 'WebSite', 'Dataset'])
  })

  it('links the person to their real profiles', () => {
    const person = graph[0]
    expect(person.name).toBe('Kerem Turhan')
    expect(person.sameAs).toEqual([
      'https://x.com/mkeremturhan',
      'https://github.com/kerem-turhan',
    ])
  })

  it('covers exactly the real data range', () => {
    const dataset = graph[2]
    expect(dataset.temporalCoverage).toBe('2026-07-19/2026-07-26')
    expect(dataset.variableMeasured).toContain('revenue')
  })

  it('serializes to JSON without loss', () => {
    const json = JSON.stringify(siteJsonLd(FIXTURE_LEDGER, FIXTURE_META))
    expect(json).not.toContain('undefined')
    expect(JSON.parse(json)).toBeTruthy()
  })
})

describe('serializeJsonLd', () => {
  it('never emits a raw < that could close the script tag', () => {
    const json = serializeJsonLd(weekJsonLd(FIXTURE_LEDGER.weeks[1], 1, FIXTURE_META))
    expect(json).not.toContain('<')
    expect(json).toContain('\\u003cangles>')
    expect(JSON.parse(json)).toMatchObject({ description: FIXTURE_LEDGER.weeks[1].note })
  })
})

describe('weekJsonLd', () => {
  it('builds a BlogPosting with real dates and numbers', () => {
    const post = weekJsonLd(FIXTURE_LEDGER.weeks[1], 1, FIXTURE_META) as Record<string, any>
    expect(post['@type']).toBe('BlogPosting')
    expect(post.headline).toBe('Week 1 — revenue $150 · spend $20')
    expect(post.datePublished).toBe('2026-07-26')
    expect(post.mainEntityOfPage).toBe('https://example.test/site/w/2026-07-26/')
    expect(post.author.name).toBe('Kerem Turhan')
  })

  it('names the same person as publisher, on the homepage graph’s node', () => {
    const post = weekJsonLd(FIXTURE_LEDGER.weeks[1], 1, FIXTURE_META) as Record<string, any>
    expect(post.publisher).toEqual({
      '@type': 'Person',
      '@id': 'https://example.test/site/#person',
      name: 'Kerem Turhan',
      url: 'https://example.test/site/',
    })
    // The posting itself still identifies as its own page.
    expect(post['@id']).toBe('https://example.test/site/w/2026-07-26/')
  })

  it('carries the very image the page shows a share preview', () => {
    // Two implementations of one fallback rule (journal.ts fills og:image,
    // seo.ts fills the JSON-LD); this is what keeps them from drifting.
    const week = FIXTURE_LEDGER.weeks[1]
    const cases = [
      { meta: FIXTURE_META, lang: 'en' as const },
      { meta: FIXTURE_META, lang: 'tr' as const },
      { meta: { ...FIXTURE_META, weekOgWeeks: ['2026-07-26'] }, lang: 'en' as const },
      { meta: { ...FIXTURE_META, trWeekOgWeeks: ['2026-07-26'] }, lang: 'tr' as const },
      // An English card must never stand in for a missing Turkish one.
      { meta: { ...FIXTURE_META, weekOgWeeks: ['2026-07-26'] }, lang: 'tr' as const },
    ]
    for (const { meta, lang } of cases) {
      const post = weekJsonLd(week, 1, meta, lang) as Record<string, any>
      expect(post.image).toBe(weekOgImage(week, meta, lang))
    }
    expect(
      (weekJsonLd(week, 1, { ...FIXTURE_META, weekOgWeeks: ['2026-07-26'] }) as Record<string, any>)
        .image,
    ).toBe('https://example.test/site/og/w/2026-07-26.png')
  })

  it('claims no image when the site has none to show', () => {
    const { ogImage: _ogImage, ...noCard } = FIXTURE_META
    expect(weekJsonLd(FIXTURE_LEDGER.weeks[1], 1, noCard)).not.toHaveProperty('image')
  })
})
