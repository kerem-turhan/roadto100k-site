/**
 * Canonical URL layout of the deployed site. Every generated artifact
 * (sitemap, feed, journal pages) derives its links from these helpers so the
 * scheme lives in exactly one place.
 */

/** Absolute URL of one week's journal page, e.g. `…/w/2026-07-19/`. */
export function weekUrl(siteUrl: string, weekEnding: string): string {
  return `${siteUrl}w/${weekEnding}/`
}

/** Absolute URL of the journal archive index. */
export function archiveUrl(siteUrl: string): string {
  return `${siteUrl}w/`
}

/** Absolute URL of the RSS feed. */
export function feedUrl(siteUrl: string): string {
  return `${siteUrl}feed.xml`
}

/** Absolute URL of one week's share card, e.g. `…/og/w/2026-07-19.png`. */
export function weekOgUrl(siteUrl: string, weekEnding: string, lang: 'en' | 'tr' = 'en'): string {
  return `${siteUrl}${weekOgPath(weekEnding, lang)}`
}

/** Build-output path of one week's share card, relative to `public/`. */
export function weekOgPath(weekEnding: string, lang: 'en' | 'tr' = 'en'): string {
  return lang === 'tr' ? `og/w/tr/${weekEnding}.png` : `og/w/${weekEnding}.png`
}

/** Absolute URL of the Turkish summary index. */
export function trHomeUrl(siteUrl: string): string {
  return `${siteUrl}tr/`
}

/** Absolute URL of one week's Turkish summary page. */
export function trWeekUrl(siteUrl: string, weekEnding: string): string {
  return `${siteUrl}tr/w/${weekEnding}/`
}

/** Absolute URL of the Turkish RSS feed. */
export function trFeedUrl(siteUrl: string): string {
  return `${siteUrl}tr/feed.xml`
}

/**
 * Root-relative base path of the site with a trailing slash —
 * `/roadto100k-site/` on GitHub Pages, `/` on a custom domain. Generated
 * pages reference fonts and internal links through this so they work on any
 * same-origin preview, not just production.
 */
export function basePath(siteUrl: string): string {
  const path = new URL(siteUrl).pathname
  return path.endsWith('/') ? path : `${path}/`
}
