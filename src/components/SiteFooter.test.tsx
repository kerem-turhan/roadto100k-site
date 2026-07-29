import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ANALYTICS_NOTE } from '@/lib/analytics'
import { SiteFooter } from './SiteFooter'

/*
 * The footer carries the site's privacy claim, so the claim has to track what
 * the site actually does. The counter's disclosure appears with the counter and
 * never without it — a page that says it counts visits while counting nothing
 * is the same shape of lie as a green check that never ran.
 */
describe('SiteFooter', () => {
  it('states the standing position, in both states', () => {
    for (const code of ['', 'roadto100k']) {
      expect(renderToStaticMarkup(<SiteFooter analyticsCode={code} />)).toContain(
        'No cookies, no personal data, $0/mo hosting.',
      )
    }
  })

  it('says nothing about counting while nothing is counted', () => {
    const html = renderToStaticMarkup(<SiteFooter analyticsCode="" />)
    expect(html).not.toContain('Visits are counted')
    expect(html).not.toContain('goatcounter')
  })

  it('discloses the counter as soon as one is configured', () => {
    expect(renderToStaticMarkup(<SiteFooter analyticsCode="roadto100k" />)).toContain(
      ANALYTICS_NOTE,
    )
  })

  it('no longer claims a blanket "no tracking" it cannot keep', () => {
    expect(renderToStaticMarkup(<SiteFooter analyticsCode="roadto100k" />)).not.toContain(
      'No cookies, no tracking',
    )
  })
})
