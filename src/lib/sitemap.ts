import type { Ledger } from './ledger.ts'
import { escapeMarkup } from './text.ts'
import { archiveUrl, weekUrl } from './urls.ts'

/**
 * sitemap.xml for the root page, the journal archive and every weekly page.
 * `lastmod` is driven by ledger dates only — deterministic across builds.
 */
export function buildSitemap(ledger: Ledger, siteUrl: string): string {
  const latest = ledger.weeks[ledger.weeks.length - 1].weekEnding
  const entries: Array<{ loc: string; lastmod: string }> = [
    { loc: siteUrl, lastmod: latest },
    { loc: archiveUrl(siteUrl), lastmod: latest },
    ...ledger.weeks.map((week) => ({
      loc: weekUrl(siteUrl, week.weekEnding),
      lastmod: week.weekEnding,
    })),
  ]

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map((entry) =>
      [
        '  <url>',
        `    <loc>${escapeMarkup(entry.loc)}</loc>`,
        `    <lastmod>${entry.lastmod}</lastmod>`,
        '  </url>',
      ].join('\n'),
    ),
    '</urlset>',
    '',
  ].join('\n')
}

/** robots.txt: everything crawlable, sitemap advertised. */
export function buildRobots(siteUrl: string): string {
  return ['User-agent: *', 'Allow: /', '', `Sitemap: ${siteUrl}sitemap.xml`, ''].join('\n')
}
