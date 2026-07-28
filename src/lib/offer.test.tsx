import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Signup } from '@/components/Signup'
import { FIXTURE_META } from './fixtures.ts'
import {
  NEWSLETTER_PROMISE,
  NEWSLETTER_TERMS,
  OFFER_UPDATED,
  POSITIONING,
  POSITIONING_LINE,
  SERVICES,
  signupFormMarkup,
} from './offer.ts'
import { buildSeriesPages } from './seriesPages.ts'
import { parseSeries } from './series.ts'

const META = { ...FIXTURE_META, buttondownUrl: 'https://buttondown.com/api/emails/embed-subscribe/x' }
const EMPTY_SERIES = parseSeries({ updated: '2026-07-28', entries: [] })

/*
 * The promise was agreed word for word in the launch brief, and it is rendered
 * by three unrelated code paths. Asserting it against a literal — never against
 * the constant the renderer itself read — is what makes this a check rather
 * than a mirror: `toContain(NEWSLETTER_PROMISE)` alone would pass for any
 * string, including a truncated or reworded one.
 */
const AGREED_PROMISE =
  'One silent-green finding a week — a check that couldn’t look and said yes anyway.'

describe('the newsletter promise', () => {
  it('is exactly the sentence the launch brief agreed on', () => {
    expect(NEWSLETTER_PROMISE).toBe(AGREED_PROMISE)
  })

  it('reaches the reader on the homepage form', () => {
    expect(renderToStaticMarkup(<Signup />)).toContain(AGREED_PROMISE)
  })

  it('reaches the reader on the series index too', () => {
    const [index] = buildSeriesPages(EMPTY_SERIES, META)
    expect(index.html).toContain(AGREED_PROMISE)
  })

  it('says how often, and how to leave', () => {
    const html = renderToStaticMarkup(<Signup />)
    expect(NEWSLETTER_TERMS).toMatch(/One email a week/)
    expect(NEWSLETTER_TERMS).toMatch(/one click to leave/i)
    expect(html).toContain(NEWSLETTER_TERMS)
  })
})

describe('the positioning', () => {
  it('is the sentence the launch brief agreed on', () => {
    expect(POSITIONING_LINE).toBe(
      'I make AI agents fail closed. When a check can’t look, it has to say no.',
    )
    expect(POSITIONING_LINE).toBe(`${POSITIONING.claim} ${POSITIONING.rule}`)
  })
})

describe('the services', () => {
  it('names the three concrete things on offer', () => {
    expect(SERVICES).toHaveLength(3)
    const all = SERVICES.map((service) => `${service.name} ${service.text}`).join(' ')
    for (const term of ['eval', 'CI', 'audit', 'Model swaps']) {
      expect(all).toContain(term)
    }
  })

  it('quotes no price — what a package costs is decided in the reply', () => {
    for (const service of SERVICES) {
      expect(`${service.name} ${service.text}`).not.toMatch(/\$\s?\d/)
    }
  })
})

describe('signupFormMarkup', () => {
  const html = signupFormMarkup({
    buttondownUrl: 'https://buttondown.com/api/emails/embed-subscribe/x',
    xUrl: 'https://x.com/test',
    idPrefix: 'series',
  })

  /*
   * Static pages post to Buttondown directly, with no code of ours in between —
   * exactly like the React form, and with exactly the same failure mode: rename
   * a field and nothing breaks until subscribers stop arriving. Literals again.
   */
  it('sends the fields Buttondown expects', () => {
    expect(html).toContain('action="https://buttondown.com/api/emails/embed-subscribe/x"')
    expect(html).toContain('method="post"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('type="email" name="email" required')
    expect(html).toContain('<input type="hidden" name="embed" value="1" />')
    expect(html).toContain('<button type="submit">')
  })

  it('labels its field and keeps ids unique per page', () => {
    expect(html).toContain('<label class="sr-only" for="series-email">')
    expect(html).toContain('id="series-email"')
    const other = signupFormMarkup({ buttondownUrl: 'https://b.test/x', xUrl: '', idPrefix: 'work' })
    expect(other).toContain('id="work-email"')
  })

  it('falls back to X rather than showing a form that posts nowhere', () => {
    const fallback = signupFormMarkup({ buttondownUrl: '', xUrl: 'https://x.com/test' })
    expect(fallback).not.toContain('<form')
    expect(fallback).toContain('href="https://x.com/test"')
    // and still tells the reader what they would be signing up for
    expect(fallback).toContain(AGREED_PROMISE)
  })
})

describe('OFFER_UPDATED', () => {
  it('is a fixed calendar date, not something read off the clock', () => {
    expect(OFFER_UPDATED).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(new Date(`${OFFER_UPDATED}T00:00:00Z`).toISOString()).toContain(OFFER_UPDATED)
  })
})
