import { calendarDaysBetween, parseIsoDate } from './days.ts'
import type { Ledger, TrWeekEntry } from './ledger.ts'
import { formatUsd, trWeekEntries } from './ledger.ts'
import type { AlternateLink, JournalMeta, StaticPage } from './pageShell.ts'
import { pageShell } from './pageShell.ts'
import { weekJsonLd } from './seo.ts'
import { escapeMarkup, formatDateLongTr } from './text.ts'
import { basePath, trHomeUrl, trWeekUrl, weekUrl } from './urls.ts'
import { weekOgImage } from './journal.ts'

/*
 * Turkish summary pages. They exist only for weeks whose ledger entry carries
 * a `trNote` — a week without one is absent here rather than padded with a
 * "summary coming soon" placeholder. If no week has one, /tr/ is not built at
 * all.
 */

/*
 * One money convention for the whole Turkish surface: `formatUsd`, the same
 * one the figures, the TR feed and the TR share cards already use. The intro
 * used to spell the goal `$100.000` two paragraphs above `$100,000` — and in
 * tr-TR, where the comma is the decimal separator, that second one reads as a
 * hundred. The amounts are US dollars, so they are grouped the US way here too.
 * Goal and date come from `meta` for the same reason: a hardcoded copy of a
 * config value is how the two spellings drifted apart in the first place. The
 * date carries its suffix on `tarih`, not on the year, so it stays grammatical
 * whatever `goalDate` becomes.
 */
function trIntro(meta: JournalMeta): string {
  return (
    `Bu site, $0’dan ${formatDateLongTr(meta.goalDate)} tarihine kadar ${formatUsd(meta.goalUsd)}’a ` +
    'giden yolun halka açık defteri. Sitenin tamamı İngilizce; burada haftalık kayıtların kısa ' +
    'Türkçe özetleri var. Rakamlar gerçek — sıfır haftalar dahil.'
  )
}

function alternates(meta: JournalMeta, weekEnding: string): AlternateLink[] {
  const en = weekUrl(meta.siteUrl, weekEnding)
  return [
    { hreflang: 'en', href: en },
    { hreflang: 'tr', href: trWeekUrl(meta.siteUrl, weekEnding) },
    { hreflang: 'x-default', href: en },
  ]
}

function figure(label: string, value: string, positive = false): string {
  return `<div><dt>${label}</dt><dd${positive ? ' class="green"' : ''}>${value}</dd></div>`
}

function trWeekPage(
  ledger: Ledger,
  entries: readonly TrWeekEntry[],
  position: number,
  meta: JournalMeta,
): StaticPage {
  const { week, index, trNote } = entries[position]
  const base = basePath(meta.siteUrl)
  const upTo = ledger.weeks.slice(0, index + 1)
  const cumulativeRevenue = upTo.reduce((sum, w) => sum + w.revenue, 0)
  const totalSpend = upTo.reduce((sum, w) => sum + w.spend, 0)
  const day = calendarDaysBetween(parseIsoDate(ledger.startDate), parseIsoDate(week.weekEnding))
  const span = calendarDaysBetween(parseIsoDate(ledger.startDate), parseIsoDate(ledger.goalDate))
  const prev = position > 0 ? entries[position - 1] : null
  const next = position < entries.length - 1 ? entries[position + 1] : null

  const pager =
    prev || next
      ? `      <nav class="pager" aria-label="Komşu haftalar">
        <span>${prev ? `<a href="${trWeekUrl(meta.siteUrl, prev.week.weekEnding)}">← Hafta ${prev.index}</a>` : ''}</span>
        <span>${next ? `<a href="${trWeekUrl(meta.siteUrl, next.week.weekEnding)}">Hafta ${next.index} →</a>` : ''}</span>
      </nav>\n`
      : ''

  const title = `Hafta ${index} — ${formatUsd(week.revenue)} gelir · ${meta.siteName}`
  const description = `${trNote} ${formatDateLongTr(week.weekEnding)} haftası: gelir ${formatUsd(week.revenue)}, MRR ${formatUsd(week.mrr)}, harcama ${formatUsd(week.spend)}, e-posta abonesi ${week.emailSubs}.`

  const body = `      <main>
        <p class="eyebrow">Defter kaydı № ${String(index + 1).padStart(3, '0')}</p>
        <h1>Hafta ${index}</h1>
        <p class="dateline">${formatDateLongTr(week.weekEnding)} haftası · gün ${day}/${span}</p>
        <dl class="figures" aria-label="Bu haftanın rakamları">
          ${figure('Gelir (hafta)', formatUsd(week.revenue), week.revenue > 0)}
          ${figure('MRR', formatUsd(week.mrr))}
          ${figure('Gider (hafta)', formatUsd(week.spend))}
          ${figure('Aboneler', String(week.emailSubs))}
        </dl>
        <p class="totals">Bugüne dek: ${formatUsd(cumulativeRevenue)} kümülatif gelir · ${formatUsd(totalSpend)} toplam harcama · hedef ${formatUsd(meta.goalUsd)}</p>
        <figure class="note">
          <blockquote>${escapeMarkup(trNote)}</blockquote>
          <figcaption>Haftanın tek cümlelik özeti</figcaption>
        </figure>
        <p class="totals langlink"><a href="${escapeMarkup(weekUrl(meta.siteUrl, week.weekEnding))}" hreflang="en" lang="en">Full entry in English →</a></p>
${pager}      </main>`

  return {
    path: `tr/w/${week.weekEnding}/index.html`,
    html: pageShell({
      meta,
      lang: 'tr',
      title,
      description,
      canonical: trWeekUrl(meta.siteUrl, week.weekEnding),
      ogImage: weekOgImage(week, meta, 'tr'),
      alternates: alternates(meta, week.weekEnding),
      crumb: { href: `${base}tr/`, label: 'özetler' },
      jsonLd: weekJsonLd(week, index, meta, 'tr'),
      body,
    }),
  }
}

function trIndexPage(entries: readonly TrWeekEntry[], meta: JournalMeta): StaticPage {
  const list = [...entries]
    .reverse()
    .map(({ week, index, trNote }) => {
      const summary = `gelir ${formatUsd(week.revenue)} · harcama ${formatUsd(week.spend)} · abone ${week.emailSubs}`
      return `          <li>
            <div class="row">
              <a href="${trWeekUrl(meta.siteUrl, week.weekEnding)}">Hafta ${index} — ${formatDateLongTr(week.weekEnding)}</a>
              <span>${summary}</span>
            </div>
            <p>${escapeMarkup(trNote)}</p>
          </li>`
    })
    .join('\n')

  const body = `      <main>
        <p class="eyebrow">Türkçe özet</p>
        <h1>Haftalık defter</h1>
        <p class="lede">${trIntro(meta)}</p>
        <ul class="weeks">
${list}
        </ul>
        <p class="totals">Özeti yazılmamış haftalar burada görünmez; tam kayıt her zaman
        <a href="${escapeMarkup(meta.siteUrl)}" hreflang="en">İngilizce defterde ↗</a>.</p>
      </main>`

  return {
    path: 'tr/index.html',
    html: pageShell({
      meta,
      lang: 'tr',
      title: `Haftalık defter — Türkçe özet · ${meta.siteName}`,
      description:
        'Halka açık $0 → $100k defterinin haftalık Türkçe özetleri: gelir, MRR, harcama ve e-posta abonesi — gerçek rakamlar, sıfırlar dahil.',
      canonical: trHomeUrl(meta.siteUrl),
      alternates: [
        { hreflang: 'en', href: meta.siteUrl },
        { hreflang: 'tr', href: trHomeUrl(meta.siteUrl) },
        { hreflang: 'x-default', href: meta.siteUrl },
      ],
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        '@id': trHomeUrl(meta.siteUrl),
        name: `Haftalık defter — Türkçe özet · ${meta.siteName}`,
        url: trHomeUrl(meta.siteUrl),
        isPartOf: { '@id': `${meta.siteUrl}#website` },
        inLanguage: 'tr',
      },
      body,
    }),
  }
}

/** Turkish index + one page per week that has a `trNote`; empty when none do. */
export function buildTrPages(ledger: Ledger, meta: JournalMeta): StaticPage[] {
  const entries = trWeekEntries(ledger)
  if (entries.length === 0) return []
  return [
    ...entries.map((_, position) => trWeekPage(ledger, entries, position, meta)),
    trIndexPage(entries, meta),
  ]
}
