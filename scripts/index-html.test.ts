import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { config } from '../src/config.ts'
import { SITE_URL_TOKEN, injectSiteUrl } from '../src/lib/urls.ts'

/*
 * index.html is the one page vite owns, and nothing used to read it. It spelled
 * the production URL out five times — canonical, og:url, og:image,
 * twitter:image, feed — so moving to a custom domain would have kept pointing
 * search engines and share cards at the old address, silently. It now carries a
 * token that the static-pages plugin fills at build time, and these assertions
 * are what keep an absolute URL from being pasted back in.
 */
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')

describe('index.html', () => {
  it('carries the token, never a hardcoded site URL', () => {
    expect(html).toContain(SITE_URL_TOKEN)
    expect(html).not.toMatch(/https:\/\/kerem-turhan\.github\.io/)
  })

  it('routes canonical, og:url, og:image, twitter:image and the feed through it', () => {
    expect(html.match(/%SITE_URL%/g)).toHaveLength(5)
    for (const attr of [
      /<link rel="canonical" href="%SITE_URL%"/,
      /href="%SITE_URL%feed\.xml"/,
      /<meta property="og:url" content="%SITE_URL%"/,
      /<meta property="og:image" content="%SITE_URL%og\.png"/,
      /<meta name="twitter:image" content="%SITE_URL%og\.png"/,
    ]) {
      expect(html).toMatch(attr)
    }
  })

  it('produces absolute production URLs once filled', () => {
    const built = injectSiteUrl(html, config.SITE_URL)
    expect(built).not.toContain(SITE_URL_TOKEN)
    expect(built).toContain(`<link rel="canonical" href="${config.SITE_URL}" />`)
    expect(built).toContain(`content="${config.SITE_URL}og.png"`)
  })
})
