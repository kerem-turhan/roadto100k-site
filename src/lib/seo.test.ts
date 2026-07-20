import { describe, expect, it } from 'vitest'
import { FIXTURE_LEDGER, FIXTURE_META } from './fixtures.ts'
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
})
