import { describe, expect, it } from 'vitest'
import rawSeries from '../data/series.json'
import { isCallout, isList, parseSeries, seriesLastModified } from './series.ts'

const VALID = {
  updated: '2026-07-28',
  entries: [
    {
      number: 1,
      slug: 'the-check-that-could-not-look',
      date: '2026-07-29',
      title: 'The check that could not look',
      dek: 'A guard read a missing config as a clean bill of health.',
      body: ['First paragraph.', 'Second paragraph.'],
    },
  ],
}

const withEntry = (patch: Record<string, unknown>) => ({
  ...VALID,
  entries: [{ ...VALID.entries[0], ...patch }],
})

describe('parseSeries', () => {
  it('accepts a well-formed series', () => {
    const series = parseSeries(VALID)
    expect(series.entries).toHaveLength(1)
    expect(series.entries[0].slug).toBe('the-check-that-could-not-look')
  })

  it('accepts an empty series — nothing published is a real state', () => {
    expect(parseSeries({ updated: '2026-07-28', entries: [] }).entries).toEqual([])
  })

  /* A finding is prose, the rule it produced, and steps somebody else can run. */
  it('accepts the three block shapes an entry is made of', () => {
    const body = ['A paragraph.', { callout: 'The rule.' }, { list: ['One.', 'Two.'] }]
    expect(parseSeries(withEntry({ body })).entries[0].body).toEqual(body)
  })

  /*
   * Entry URLs are permanent and cited from other people's posts, so every one
   * of these is a dead link, a broken pager or a page of whitespace shipped to a
   * reader who followed a citation. The build stops instead.
   */
  it.each([
    ['not an object', 42],
    ['no updated date', { entries: [] }],
    ['an impossible updated date', { updated: '2026-02-30', entries: [] }],
    ['entries that are not a list', { updated: '2026-07-28', entries: {} }],
    ['an entry numbered out of order', { ...VALID, entries: [{ ...VALID.entries[0], number: 2 }] }],
    ['an empty slug', withEntry({ slug: '' })],
    ['a slug with a slash', withEntry({ slug: 'a/b' })],
    ['a slug in caps', withEntry({ slug: 'The-Entry' })],
    ['a slug with a trailing hyphen', withEntry({ slug: 'entry-' })],
    ['an impossible date', withEntry({ date: '2026-13-01' })],
    ['a date that is only shaped like one', withEntry({ date: 'this week' })],
    ['a blank title', withEntry({ title: '   ' })],
    ['a missing dek', withEntry({ dek: undefined })],
    ['a body that is not a list', withEntry({ body: 'one long string' })],
    ['an empty body', withEntry({ body: [] })],
    ['a blank paragraph', withEntry({ body: ['real', '  '] })],
    ['a block that is neither', withEntry({ body: [{ quote: 'nope' }] })],
    ['a block claiming to be two things', withEntry({ body: [{ callout: 'a', list: ['b'] }] })],
    ['a blank callout', withEntry({ body: [{ callout: ' ' }] })],
    ['a callout that is not a string', withEntry({ body: [{ callout: ['a'] }] })],
    ['a list with no steps', withEntry({ body: [{ list: [] }] })],
    ['a list that is not a list', withEntry({ body: [{ list: 'step one' }] })],
    ['a blank step', withEntry({ body: [{ list: ['real', ''] }] })],
    ['a nested array where a block belongs', withEntry({ body: [['a']] })],
    ['a null block', withEntry({ body: [null] })],
    [
      'two entries sharing a slug',
      {
        updated: '2026-07-28',
        entries: [
          VALID.entries[0],
          { ...VALID.entries[0], number: 2, date: '2026-08-05' },
        ],
      },
    ],
  ])('refuses %s', (_label, raw) => {
    expect(() => parseSeries(raw)).toThrow(/Invalid series data/)
  })
})

describe('seriesLastModified', () => {
  it('follows the newest entry once one exists', () => {
    expect(seriesLastModified(parseSeries(VALID))).toBe('2026-07-29')
  })

  it('falls back to the index date while nothing is published', () => {
    expect(seriesLastModified(parseSeries({ updated: '2026-07-28', entries: [] }))).toBe(
      '2026-07-28',
    )
  })
})

describe('the shipped series data', () => {
  it('parses — a malformed file must fail here, not in production', () => {
    expect(() => parseSeries(rawSeries)).not.toThrow()
  })

  /*
   * The launch gate, as a test. A Show HN post cites /silent-green/, and an
   * index that says "first entry coming this week" to a few thousand arrivals
   * spends the one burst of attention the launch gets. Deleting this assertion
   * to make a build pass is deleting the gate.
   */
  it('has the first entry published, not promised', () => {
    const series = parseSeries(rawSeries)
    expect(series.entries.length).toBeGreaterThanOrEqual(1)
    const [first] = series.entries
    expect(first.slug).toBe('counting-silence-as-success')
    expect(first.body.length).toBeGreaterThanOrEqual(8)
  })

  /* Every entry carries the rule it produced and the probe that finds it. */
  it('gives that entry a rule and a runnable probe', () => {
    const [first] = parseSeries(rawSeries).entries
    expect(first.body.filter(isCallout)).toHaveLength(1)
    const [probe] = first.body.filter(isList)
    expect(probe.list.length).toBeGreaterThanOrEqual(3)
  })
})
