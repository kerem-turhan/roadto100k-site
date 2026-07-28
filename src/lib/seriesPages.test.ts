import { describe, expect, it } from 'vitest'
import { FIXTURE_META } from './fixtures.ts'
import { parseSeries } from './series.ts'
import { buildSeriesPages } from './seriesPages.ts'

const META = {
  ...FIXTURE_META,
  buttondownUrl: 'https://buttondown.com/api/emails/embed-subscribe/x',
}

const EMPTY = parseSeries({ updated: '2026-07-28', entries: [] })
const TWO = parseSeries({
  updated: '2026-07-28',
  entries: [
    {
      number: 1,
      slug: 'the-missing-config',
      date: '2026-07-29',
      title: 'The guard that read a missing config as clean',
      dek: 'It could not find its word list, so it found nothing wrong.',
      body: ['What happened.', 'What it cost.'],
    },
    {
      number: 2,
      slug: 'the-empty-glob',
      date: '2026-08-05',
      title: 'The empty glob',
      dek: 'Nothing matched, so nothing failed. <angles> & "quotes" survive.',
      body: ['Body one.'],
    },
  ],
})

const indexOf = (pages: ReturnType<typeof buildSeriesPages>) =>
  pages.find((page) => page.path === 'silent-green/index.html')!

describe('the series index while nothing is published', () => {
  const pages = buildSeriesPages(EMPTY, META)
  const index = indexOf(pages)

  it('exists anyway — the URL is cited before the first entry lands', () => {
    expect(pages).toHaveLength(1)
    expect(index.html).toContain(
      '<link rel="canonical" href="https://example.test/site/silent-green/" />',
    )
  })

  it('says plainly that the first entry is still coming', () => {
    expect(index.html).toContain('First entry coming this week.')
  })

  it('invents no entry to fill the space', () => {
    expect(index.html).not.toContain('<ul class="weeks">')
    expect(index.html).not.toContain('№ 001')
    // …and claims no posts in its structured data either
    expect(index.html).toContain('"blogPost":[]')
  })

  it('still explains what the series is, and still takes subscribers', () => {
    expect(index.html).toContain('Silent green')
    expect(index.html).toContain('passes CI while verifying nothing')
    expect(index.html).toContain('action="https://buttondown.com/api/emails/embed-subscribe/x"')
  })
})

describe('the series once entries exist', () => {
  const pages = buildSeriesPages(TWO, META)
  const index = indexOf(pages)

  it('writes one page per entry, plus the index', () => {
    expect(pages.map((page) => page.path)).toEqual([
      'silent-green/the-missing-config/index.html',
      'silent-green/the-empty-glob/index.html',
      'silent-green/index.html',
    ])
  })

  it('lists them newest first, numbered', () => {
    expect(index.html).toContain('№ 002 — The empty glob')
    expect(index.html).toContain('№ 001 — The guard that read a missing config as clean')
    expect(index.html.indexOf('№ 002')).toBeLessThan(index.html.indexOf('№ 001'))
    expect(index.html).not.toContain('First entry coming this week.')
  })

  it('renders an entry as a real page: dek, body, canonical, date', () => {
    const entry = pages[0]
    expect(entry.html).toContain('The guard that read a missing config as clean')
    expect(entry.html).toContain('It could not find its word list, so it found nothing wrong.')
    expect(entry.html).toContain('<p>What happened.</p>')
    expect(entry.html).toContain('<p>What it cost.</p>')
    expect(entry.html).toContain(
      '<link rel="canonical" href="https://example.test/site/silent-green/the-missing-config/" />',
    )
    expect(entry.html).toContain('"datePublished":"2026-07-29"')
    expect(entry.html).toContain('"@type":"BlogPosting"')
  })

  it('pages between neighbours without inventing one at the ends', () => {
    const [first, second] = pages
    expect(first.html).toContain(
      'href="https://example.test/site/silent-green/the-empty-glob/">№ 002',
    )
    expect(first.html).not.toContain('← №')
    expect(second.html).toContain('← № 001')
    expect(second.html).not.toContain('№ 003')
  })

  it('carries the signup form at the bottom of every entry', () => {
    for (const page of pages) {
      expect(page.html).toContain('name="email"')
      expect(page.html).toContain(
        'One silent-green finding a week — a check that couldn’t look and said yes anyway.',
      )
    }
  })

  it('gives each page its own input id — two forms, two labels', () => {
    expect(pages[0].html).toContain('id="entry-the-missing-config-email"')
    expect(pages[1].html).toContain('id="entry-the-empty-glob-email"')
    expect(indexOf(pages).html).toContain('id="series-email"')
  })

  it('escapes entry text rather than letting it write markup', () => {
    expect(index.html).toContain('&lt;angles&gt; &amp; &quot;quotes&quot;')
    expect(index.html).not.toContain('<angles>')
  })
})
