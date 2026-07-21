import { calendarDaysBetween, parseIsoDate } from './days.ts'
import type { Ledger, LedgerWeek } from './ledger.ts'
import { formatUsd } from './ledger.ts'
import type { AlternateLink, JournalMeta, StaticPage } from './pageShell.ts'
import { pageShell } from './pageShell.ts'
import { weekJsonLd } from './seo.ts'
import { escapeMarkup, formatDateLong } from './text.ts'
import { archiveUrl, basePath, trWeekUrl, weekOgUrl, weekUrl } from './urls.ts'

export type { AlternateLink, JournalMeta, StaticPage } from './pageShell.ts'

/**
 * Share image for one week: its own committed card when it exists, the
 * site-wide card otherwise. Cards are generated locally (`npm run og`) and
 * committed — CI never runs a browser. A Turkish page never falls back to the
 * English card; it would show English copy under a `tr_TR` locale.
 */
export function weekOgImage(week: LedgerWeek, meta: JournalMeta, lang: 'en' | 'tr' = 'en'): string {
  const cards = lang === 'tr' ? meta.trWeekOgWeeks : meta.weekOgWeeks
  return cards?.includes(week.weekEnding)
    ? weekOgUrl(meta.siteUrl, week.weekEnding, lang)
    : meta.ogImage
}

/** hreflang siblings for a week that may or may not have a Turkish page. */
function weekAlternates(week: LedgerWeek, meta: JournalMeta): AlternateLink[] {
  const en = weekUrl(meta.siteUrl, week.weekEnding)
  if (!week.trNote) return []
  return [
    { hreflang: 'en', href: en },
    { hreflang: 'tr', href: trWeekUrl(meta.siteUrl, week.weekEnding) },
    { hreflang: 'x-default', href: en },
  ]
}

function figure(label: string, value: string, positive = false): string {
  return `<div><dt>${label}</dt><dd${positive ? ' class="green"' : ''}>${value}</dd></div>`
}

function weekPage(ledger: Ledger, index: number, meta: JournalMeta): StaticPage {
  const week = ledger.weeks[index]
  const url = weekUrl(meta.siteUrl, week.weekEnding)
  const base = basePath(meta.siteUrl)
  const upTo = ledger.weeks.slice(0, index + 1)
  const cumulativeRevenue = upTo.reduce((sum, w) => sum + w.revenue, 0)
  const totalSpend = upTo.reduce((sum, w) => sum + w.spend, 0)
  const day = calendarDaysBetween(parseIsoDate(ledger.startDate), parseIsoDate(week.weekEnding))
  const span = calendarDaysBetween(parseIsoDate(ledger.startDate), parseIsoDate(ledger.goalDate))
  const prev = index > 0 ? ledger.weeks[index - 1] : null
  const next = index < ledger.weeks.length - 1 ? ledger.weeks[index + 1] : null

  const pager =
    prev || next
      ? `      <nav class="pager" aria-label="Adjacent weeks">
        <span>${prev ? `<a href="${weekUrl(meta.siteUrl, prev.weekEnding)}">← Week ${index - 1}</a>` : ''}</span>
        <span>${next ? `<a href="${weekUrl(meta.siteUrl, next.weekEnding)}">Week ${index + 1} →</a>` : ''}</span>
      </nav>\n`
      : ''

  const turkish = week.trNote
    ? `        <p class="totals langlink"><a href="${escapeMarkup(trWeekUrl(meta.siteUrl, week.weekEnding))}" hreflang="tr" lang="tr">Bu haftanın Türkçe özeti →</a></p>\n`
    : ''

  const title = `Week ${index} — ${formatUsd(week.revenue)} revenue · ${meta.siteName}`
  const description = `${week.note} Week ending ${formatDateLong(week.weekEnding)}: revenue ${formatUsd(week.revenue)}, MRR ${formatUsd(week.mrr)}, spend ${formatUsd(week.spend)}, email subs ${week.emailSubs}.`

  const body = `      <main>
        <p class="eyebrow">Ledger entry № ${String(index + 1).padStart(3, '0')}</p>
        <h1>Week ${index}</h1>
        <p class="dateline">Week ending ${formatDateLong(week.weekEnding)} · day ${day} of ${span}</p>
        <dl class="figures" aria-label="This week's numbers">
          ${figure('Revenue (wk)', formatUsd(week.revenue), week.revenue > 0)}
          ${figure('MRR', formatUsd(week.mrr))}
          ${figure('Spend (wk)', formatUsd(week.spend))}
          ${figure('Email subs', String(week.emailSubs))}
        </dl>
        <p class="totals">To date: ${formatUsd(cumulativeRevenue)} cumulative revenue · ${formatUsd(totalSpend)} total spend · goal ${formatUsd(meta.goalUsd)}</p>
        <figure class="note">
          <blockquote>${escapeMarkup(week.note)}</blockquote>
          <figcaption>The week in one honest sentence</figcaption>
        </figure>
${turkish}${pager}      </main>`

  return {
    path: `w/${week.weekEnding}/index.html`,
    html: pageShell({
      meta,
      lang: 'en',
      title,
      description,
      canonical: url,
      ogImage: weekOgImage(week, meta),
      alternates: weekAlternates(week, meta),
      crumb: { href: `${base}w/`, label: 'archive' },
      jsonLd: weekJsonLd(week, index, meta),
      body,
    }),
  }
}

function archivePage(ledger: Ledger, meta: JournalMeta): StaticPage {
  const newestFirst = ledger.weeks
    .map((week, index) => ({ week, index }))
    .reverse()
    .map(({ week, index }) => {
      const summary = `revenue ${formatUsd(week.revenue)} · spend ${formatUsd(week.spend)} · subs ${week.emailSubs}`
      return `          <li>
            <div class="row">
              <a href="${weekUrl(meta.siteUrl, week.weekEnding)}">Week ${index} — ${formatDateLong(week.weekEnding)}</a>
              <span>${summary}</span>
            </div>
            <p>${escapeMarkup(week.note)}</p>
          </li>`
    })
    .join('\n')

  const body = `      <main>
        <p class="eyebrow">The archive</p>
        <h1>Week by week</h1>
        <p class="dateline">Every entry since ${formatDateLong(ledger.startDate)} — one page per Sunday.</p>
        <ul class="weeks">
${newestFirst}
        </ul>
      </main>`

  return {
    path: 'w/index.html',
    html: pageShell({
      meta,
      lang: 'en',
      title: `The weekly ledger archive · ${meta.siteName}`,
      description:
        'Every weekly entry of the $0 → $100k ledger: revenue, MRR, spend and email subscribers, one indexable page per week.',
      canonical: archiveUrl(meta.siteUrl),
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        '@id': archiveUrl(meta.siteUrl),
        name: `The weekly ledger archive · ${meta.siteName}`,
        url: archiveUrl(meta.siteUrl),
        isPartOf: { '@id': `${meta.siteUrl}#website` },
        inLanguage: 'en',
      },
      body,
    }),
  }
}

/** One page per ledger week plus the archive index. */
export function buildJournalPages(ledger: Ledger, meta: JournalMeta): StaticPage[] {
  return [
    ...ledger.weeks.map((_: LedgerWeek, index: number) => weekPage(ledger, index, meta)),
    archivePage(ledger, meta),
  ]
}
