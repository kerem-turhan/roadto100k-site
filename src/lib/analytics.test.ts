import { describe, expect, it } from 'vitest'
import { config } from '@/config'
import {
  ANALYTICS_NOTE,
  ANALYTICS_NOTE_TR,
  counterEndpoint,
  counterScriptAttrs,
  counterScriptTag,
} from './analytics.ts'
import { FIXTURE_META } from './fixtures.ts'
import { pageShell } from './pageShell.ts'

function shell(overrides: Record<string, unknown> = {}): string {
  return pageShell({
    meta: { ...FIXTURE_META, ...overrides },
    lang: 'en',
    title: 'A page',
    description: 'A page.',
    canonical: 'https://example.test/site/',
    jsonLd: { '@context': 'https://schema.org' },
    body: '      <main></main>',
  })
}

describe('the counter, unconfigured', () => {
  /*
   * The default. An empty code is not a broken counter — it is a site that
   * honestly does not count, and it must not make a third-party request or
   * claim otherwise.
   */
  it('emits nothing', () => {
    expect(counterScriptAttrs('')).toBeNull()
    expect(counterScriptTag('')).toBe('')
  })

  it('keeps the page free of any third-party request', () => {
    const html = shell()
    expect(html).not.toContain('goatcounter')
    expect(html).not.toContain('gc.zgo.at')
  })

  it('does not claim visits are counted', () => {
    expect(shell()).not.toContain('Visits are counted')
  })
})

describe('the counter, configured', () => {
  const html = shell({ analyticsCode: 'roadto100k' })

  it('loads the cookieless script and points it at this site', () => {
    expect(counterEndpoint('roadto100k')).toBe('https://roadto100k.goatcounter.com/count')
    expect(html).toContain('src="https://gc.zgo.at/count.js"')
    expect(html).toContain('data-goatcounter="https://roadto100k.goatcounter.com/count"')
  })

  /* Blocking first paint on a counter would make measuring cost the reader. */
  it('loads it asynchronously, after the page', () => {
    expect(html).toMatch(/<script data-goatcounter="[^"]+" async src="[^"]+"><\/script>/)
    expect(html.indexOf('goatcounter')).toBeGreaterThan(html.indexOf('</footer>'))
  })

  /* The disclosure is not optional decoration: it ships with the script. */
  it('says so, on the page, in one sentence', () => {
    expect(html).toContain(ANALYTICS_NOTE)
    expect(ANALYTICS_NOTE).toContain('without cookies')
    expect(ANALYTICS_NOTE.split('. ').length).toBe(1)
  })

  it('says the same thing in Turkish', () => {
    const tr = pageShell({
      meta: { ...FIXTURE_META, analyticsCode: 'roadto100k' },
      lang: 'tr',
      title: 'Bir sayfa',
      description: 'Bir sayfa.',
      canonical: 'https://example.test/site/tr/',
      jsonLd: { '@context': 'https://schema.org' },
      body: '      <main></main>',
    })
    expect(tr).toContain(ANALYTICS_NOTE_TR)
    expect(tr).not.toContain(ANALYTICS_NOTE)
    expect(ANALYTICS_NOTE_TR).toContain('çerezsiz')
  })
})

/*
 * A counter that is configured wrong reports zero, and zero visits and zero
 * measurement look identical from the dashboard. The build refuses instead.
 */
describe('a malformed code', () => {
  it.each([
    ['a full URL', 'https://roadto100k.goatcounter.com/count'],
    ['a hostname', 'roadto100k.goatcounter.com'],
    ['uppercase', 'RoadTo100k'],
    ['a placeholder with spaces', 'your code here'],
    ['a leading hyphen', '-roadto100k'],
    ['an underscore', 'road_to_100k'],
  ])('fails the build on %s', (_label, code) => {
    expect(() => counterScriptAttrs(code)).toThrow(/Invalid ANALYTICS_CODE/)
  })
})

describe('the shipped configuration', () => {
  /*
   * Not an assertion that the counter is on — that is Kerem's two-minute
   * account step. It is an assertion that whatever is in config either works
   * or fails loudly, never in between.
   */
  it('is either off or valid', () => {
    expect(() => counterScriptTag(config.ANALYTICS_CODE)).not.toThrow()
  })
})
