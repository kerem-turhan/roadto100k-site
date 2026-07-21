import type { Ledger } from './ledger.ts'
import { formatUsd, trWeekEntries } from './ledger.ts'
import { escapeMarkup, formatDateLong, formatDateLongTr, formatRfc822 } from './text.ts'
import { feedUrl, trFeedUrl, trWeekUrl, weekUrl } from './urls.ts'

export interface FeedMeta {
  /** Canonical site URL with trailing slash. */
  siteUrl: string
  siteName: string
  description: string
}

interface FeedItem {
  title: string
  url: string
  /** ISO date the entry covers; drives pubDate. */
  date: string
  description: string
}

interface ChannelOptions {
  title: string
  link: string
  self: string
  description: string
  language: string
  /** Oldest first; the channel emits them newest first. */
  items: readonly FeedItem[]
}

function channel({ title, link, self, description, language, items }: ChannelOptions): string {
  const latest = items[items.length - 1]
  const rendered = items
    .map((item) =>
      [
        '    <item>',
        `      <title>${escapeMarkup(item.title)}</title>`,
        `      <link>${escapeMarkup(item.url)}</link>`,
        `      <guid isPermaLink="true">${escapeMarkup(item.url)}</guid>`,
        `      <pubDate>${formatRfc822(item.date)}</pubDate>`,
        `      <description>${escapeMarkup(item.description)}</description>`,
        '    </item>',
      ].join('\n'),
    )
    .reverse()

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${escapeMarkup(title)}</title>`,
    `    <link>${escapeMarkup(link)}</link>`,
    `    <atom:link href="${escapeMarkup(self)}" rel="self" type="application/rss+xml"/>`,
    `    <description>${escapeMarkup(description)}</description>`,
    `    <language>${language}</language>`,
    `    <lastBuildDate>${formatRfc822(latest.date)}</lastBuildDate>`,
    ...rendered,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n')
}

/**
 * RSS 2.0 feed of the weekly ledger, one item per week, newest first.
 * Fully deterministic: every date comes from the ledger itself, so the same
 * data always builds byte-identical XML.
 */
export function buildFeed(ledger: Ledger, meta: FeedMeta): string {
  return channel({
    title: `${meta.siteName} — the weekly ledger`,
    link: meta.siteUrl,
    self: feedUrl(meta.siteUrl),
    description: meta.description,
    language: 'en',
    items: ledger.weeks.map((week, i) => ({
      title: `Week ${i} — revenue ${formatUsd(week.revenue)} · spend ${formatUsd(week.spend)}`,
      url: weekUrl(meta.siteUrl, week.weekEnding),
      date: week.weekEnding,
      description:
        `${week.note} (Week ending ${formatDateLong(week.weekEnding)}: ` +
        `revenue ${formatUsd(week.revenue)}, MRR ${formatUsd(week.mrr)}, ` +
        `spend ${formatUsd(week.spend)}, email subs ${week.emailSubs}.)`,
    })),
  })
}

/**
 * Turkish feed — only the weeks that actually have a Turkish summary.
 * Returns null when none do, so no empty channel is ever published.
 */
export function buildTrFeed(ledger: Ledger, meta: FeedMeta): string | null {
  const entries = trWeekEntries(ledger)
  if (entries.length === 0) return null

  return channel({
    title: `${meta.siteName} — haftalık defter (TR)`,
    link: `${meta.siteUrl}tr/`,
    self: trFeedUrl(meta.siteUrl),
    description:
      'Halka açık $0 → $100k defterinin haftalık Türkçe özetleri — gerçek rakamlar, sıfırlar dahil.',
    language: 'tr',
    items: entries.map(({ week, index, trNote }) => ({
      title: `Hafta ${index} — gelir ${formatUsd(week.revenue)} · harcama ${formatUsd(week.spend)}`,
      url: trWeekUrl(meta.siteUrl, week.weekEnding),
      date: week.weekEnding,
      description:
        `${trNote} (${formatDateLongTr(week.weekEnding)} haftası: ` +
        `gelir ${formatUsd(week.revenue)}, MRR ${formatUsd(week.mrr)}, ` +
        `harcama ${formatUsd(week.spend)}, e-posta abonesi ${week.emailSubs}.)`,
    })),
  })
}
