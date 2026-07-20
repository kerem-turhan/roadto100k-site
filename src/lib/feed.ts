import type { Ledger } from './ledger.ts'
import { formatUsd } from './ledger.ts'
import { escapeMarkup, formatDateLong, formatRfc822 } from './text.ts'
import { feedUrl, weekUrl } from './urls.ts'

export interface FeedMeta {
  /** Canonical site URL with trailing slash. */
  siteUrl: string
  siteName: string
  description: string
}

/**
 * RSS 2.0 feed of the weekly ledger, one item per week, newest first.
 * Fully deterministic: every date comes from the ledger itself, so the same
 * data always builds byte-identical XML.
 */
export function buildFeed(ledger: Ledger, meta: FeedMeta): string {
  const items = ledger.weeks
    .map((week, i) => {
      const url = weekUrl(meta.siteUrl, week.weekEnding)
      const title = `Week ${i} — revenue ${formatUsd(week.revenue)} · spend ${formatUsd(week.spend)}`
      const description =
        `${week.note} (Week ending ${formatDateLong(week.weekEnding)}: ` +
        `revenue ${formatUsd(week.revenue)}, MRR ${formatUsd(week.mrr)}, ` +
        `spend ${formatUsd(week.spend)}, email subs ${week.emailSubs}.)`
      return [
        '    <item>',
        `      <title>${escapeMarkup(title)}</title>`,
        `      <link>${escapeMarkup(url)}</link>`,
        `      <guid isPermaLink="true">${escapeMarkup(url)}</guid>`,
        `      <pubDate>${formatRfc822(week.weekEnding)}</pubDate>`,
        `      <description>${escapeMarkup(description)}</description>`,
        '    </item>',
      ].join('\n')
    })
    .reverse()

  const latest = ledger.weeks[ledger.weeks.length - 1]
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${escapeMarkup(meta.siteName)} — the weekly ledger</title>`,
    `    <link>${escapeMarkup(meta.siteUrl)}</link>`,
    `    <atom:link href="${escapeMarkup(feedUrl(meta.siteUrl))}" rel="self" type="application/rss+xml"/>`,
    `    <description>${escapeMarkup(meta.description)}</description>`,
    '    <language>en</language>',
    `    <lastBuildDate>${formatRfc822(latest.weekEnding)}</lastBuildDate>`,
    ...items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n')
}
