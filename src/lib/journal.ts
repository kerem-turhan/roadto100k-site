import { calendarDaysBetween, parseIsoDate } from './days.ts'
import type { Ledger, LedgerWeek } from './ledger.ts'
import { formatUsd } from './ledger.ts'
import type { SiteIdentity } from './seo.ts'
import { serializeJsonLd, weekJsonLd } from './seo.ts'
import { escapeMarkup, formatDateLong } from './text.ts'
import { archiveUrl, basePath, feedUrl, weekUrl } from './urls.ts'

export interface JournalMeta extends SiteIdentity {
  xUrl: string
  goalDate: string
  goalUsd: number
  /** Absolute URL of the share image. */
  ogImage: string
}

export interface StaticPage {
  /** Path relative to the build output root, e.g. `w/2026-07-19/index.html`. */
  path: string
  html: string
}

/*
 * Weekly journal pages are plain pre-rendered HTML — no React, no JS beyond
 * the theme snippet — so every week of the ledger is a real, indexable URL
 * on GitHub Pages. Styling is the same locked token set as the app.
 */

const THEME_SCRIPT = `;(function () {
  var stored = localStorage.getItem('theme')
  var dark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
  if (dark) document.documentElement.classList.add('dark')
})()`

function css(base: string): string {
  return `
*{box-sizing:border-box;margin:0}
:root{--paper:#edf2e7;--paper-raised:#e4ebdc;--rule:#c7d6c2;--ink:#1b2620;--ink-muted:#55645b;--red:#bf3b2f;--green:#2f5c45}
.dark{--paper:#0f1511;--paper-raised:#151d17;--rule:#26332a;--ink:#e3ebdd;--ink-muted:#8fa096;--red:#e2604f;--green:#7fb89a}
@font-face{font-family:'Bricolage Grotesque Variable';font-style:normal;font-weight:200 800;font-display:swap;src:url('${base}fonts/bricolage-grotesque-latin.woff2') format('woff2-variations')}
@font-face{font-family:'IBM Plex Mono';font-style:normal;font-weight:400;font-display:swap;src:url('${base}fonts/ibm-plex-mono-latin-400.woff2') format('woff2')}
@font-face{font-family:'IBM Plex Mono';font-style:normal;font-weight:500;font-display:swap;src:url('${base}fonts/ibm-plex-mono-latin-500.woff2') format('woff2')}
@font-face{font-family:'Public Sans Variable';font-style:normal;font-weight:100 900;font-display:swap;src:url('${base}fonts/public-sans-latin.woff2') format('woff2-variations')}
body{background:var(--paper);color:var(--ink);font:400 1rem/1.375 'Public Sans Variable',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.mono,dt,dd{font-family:'IBM Plex Mono',ui-monospace,monospace;font-variant-numeric:tabular-nums lining-nums}
.margin-rule{position:absolute;top:0;bottom:0;left:8px;width:3px;border-left:1px solid var(--red);border-right:1px solid var(--red);opacity:.7;pointer-events:none}
.page{position:relative;max-width:44rem;margin:0 auto;min-height:100dvh;display:flex;flex-direction:column;padding:1.5rem 1.5rem 2.5rem}
@media(min-width:640px){.margin-rule{left:16px}.page{padding:1.5rem 3rem 2.5rem}}
main{flex:1}
a{color:inherit;text-decoration:underline;text-decoration-color:var(--rule);text-underline-offset:4px}
a:hover{text-decoration-color:var(--red)}
:focus-visible{outline:2px solid var(--red);outline-offset:2px}
::selection{background:var(--red);color:var(--paper)}
header{display:flex;justify-content:space-between;align-items:baseline;gap:1rem;padding-top:.25rem}
.brand,.crumb{font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:.75rem;letter-spacing:.25em;text-transform:uppercase;text-decoration:none}
.brand{color:var(--ink)}.crumb{color:var(--ink-muted)}
.brand:hover,.crumb:hover{text-decoration:underline;text-decoration-color:var(--red);text-underline-offset:4px}
.red{color:var(--red)}.green{color:var(--green)}
.eyebrow{margin-top:3.5rem;font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:.75rem;letter-spacing:.25em;text-transform:uppercase;color:var(--red)}
h1{margin-top:.5rem;font-family:'Bricolage Grotesque Variable',system-ui,sans-serif;font-weight:650;font-size:clamp(2.4rem,8vw,3.5rem);letter-spacing:-.02em;line-height:1.02}
.dateline{margin-top:.75rem;font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:.875rem;color:var(--ink-muted)}
.figures{display:grid;grid-template-columns:repeat(2,1fr);gap:1px;background:var(--rule);border:1px solid var(--rule);border-radius:2px;overflow:hidden;margin-top:2.75rem}
@media(min-width:640px){.figures{grid-template-columns:repeat(4,1fr)}}
.figures>div{background:var(--paper);padding:1.25rem 1rem}
dt{font-size:.6875rem;letter-spacing:.2em;text-transform:uppercase;color:var(--ink-muted);margin-bottom:.375rem}
dd{font-size:1.5rem;font-weight:500}
.totals{margin-top:1rem;font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:.8125rem;color:var(--ink-muted)}
.note{margin-top:2.75rem;border-left:2px solid var(--red);padding-left:1.25rem}
.note blockquote{font-size:1.125rem;line-height:1.6;text-wrap:pretty}
.note figcaption{margin-top:.75rem;font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:.6875rem;letter-spacing:.2em;text-transform:uppercase;color:var(--ink-muted)}
.pager{display:flex;justify-content:space-between;gap:1rem;margin-top:2.75rem;border-top:1px solid var(--rule);padding-top:1.25rem;font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:.8125rem}
.weeks{list-style:none;padding:0;margin-top:2.25rem}
.weeks li{border-bottom:1px solid var(--rule);padding:1.25rem 0}
.weeks li:first-child{border-top:1px solid var(--rule)}
.weeks .row{display:flex;flex-wrap:wrap;justify-content:space-between;gap:.5rem 1rem;font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:.875rem}
.weeks .row span{color:var(--ink-muted)}
.weeks p{margin-top:.625rem;font-size:.9375rem;color:var(--ink-muted);line-height:1.5;max-width:52ch}
footer{margin-top:4rem;border-top:1px solid var(--rule);padding-top:1.5rem;color:var(--ink-muted);font-size:.875rem;line-height:1.5}
footer nav{display:flex;flex-wrap:wrap;gap:1.5rem;margin-top:.875rem;font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:.75rem;letter-spacing:.2em;text-transform:uppercase}
`.trim()
}

interface ShellOptions {
  meta: JournalMeta
  title: string
  description: string
  canonical: string
  jsonLd: object
  body: string
}

function pageShell({ meta, title, description, canonical, jsonLd, body }: ShellOptions): string {
  const base = basePath(meta.siteUrl)
  const feed = feedUrl(meta.siteUrl)
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeMarkup(title)}</title>
    <meta name="description" content="${escapeMarkup(description)}" />
    <link rel="canonical" href="${escapeMarkup(canonical)}" />
    <link rel="icon" type="image/svg+xml" href="${base}favicon.svg" />
    <link rel="alternate" type="application/rss+xml" title="${escapeMarkup(meta.siteName)} — the weekly ledger" href="${escapeMarkup(feed)}" />
    <meta name="theme-color" media="(prefers-color-scheme: light)" content="#edf2e7" />
    <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0f1511" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${escapeMarkup(title)}" />
    <meta property="og:description" content="${escapeMarkup(description)}" />
    <meta property="og:url" content="${escapeMarkup(canonical)}" />
    <meta property="og:image" content="${escapeMarkup(meta.ogImage)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeMarkup(title)}" />
    <meta name="twitter:description" content="${escapeMarkup(description)}" />
    <meta name="twitter:image" content="${escapeMarkup(meta.ogImage)}" />
    <script>${THEME_SCRIPT}</script>
    <style>${css(base)}</style>
    <script type="application/ld+json">${serializeJsonLd(jsonLd)}</script>
  </head>
  <body>
    <div class="page">
      <div class="margin-rule" aria-hidden="true"></div>
      <header>
        <a class="brand" href="${base}">roadto100k<span class="red">w</span>kerem</a>
        <a class="crumb" href="${base}w/">archive</a>
      </header>
${body}
      <footer>
        <p>Real numbers every Sunday — including the $0 weeks — and one honest post-mortem
        on ${formatDateLong(meta.goalDate)}, whatever the final number is.</p>
        <nav aria-label="Site links">
          <a href="${base}">The ledger</a>
          <a href="${base}#signup">Email</a>
          <a href="${escapeMarkup(feed)}">RSS</a>
          <a href="${escapeMarkup(meta.xUrl)}" rel="noreferrer">X&nbsp;↗</a>
        </nav>
      </footer>
    </div>
  </body>
</html>
`
}

function figure(label: string, value: string, positive = false): string {
  return `<div><dt>${label}</dt><dd${positive ? ' class="green"' : ''}>${value}</dd></div>`
}

function weekPage(ledger: Ledger, index: number, meta: JournalMeta): StaticPage {
  const week = ledger.weeks[index]
  const url = weekUrl(meta.siteUrl, week.weekEnding)
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
${pager}      </main>`

  return {
    path: `w/${week.weekEnding}/index.html`,
    html: pageShell({
      meta,
      title,
      description,
      canonical: url,
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
