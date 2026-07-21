import { fontFaceCss } from './fonts.ts'
import type { SiteIdentity } from './seo.ts'
import { serializeJsonLd } from './seo.ts'
import { escapeMarkup, formatDateLong, formatDateLongTr } from './text.ts'
import { basePath, feedUrl, trFeedUrl } from './urls.ts'

export interface JournalMeta extends SiteIdentity {
  xUrl: string
  goalDate: string
  goalUsd: number
  /** Absolute URL of the site-wide share image — the fallback for every page. */
  ogImage: string
  /**
   * Week-ending dates that have a committed per-week share card in
   * `public/og/w/`. Weeks not listed fall back to `ogImage`.
   */
  weekOgWeeks?: readonly string[]
  /** Week-ending dates that have a committed Turkish card in `public/og/w/tr/`. */
  trWeekOgWeeks?: readonly string[]
  /** True when at least one week has a Turkish summary, so /tr/ exists. */
  hasTrPages?: boolean
}

export interface StaticPage {
  /** Path relative to the build output root, e.g. `w/2026-07-19/index.html`. */
  path: string
  html: string
}

export interface AlternateLink {
  hreflang: string
  href: string
}

export type PageLang = 'en' | 'tr'

/*
 * Pre-rendered pages are plain HTML — no React, no JS beyond the theme
 * snippet — so every ledger week is a real, indexable URL on GitHub Pages.
 * Styling is the same locked token set as the app; English and Turkish pages
 * share this one shell.
 */

const THEME_SCRIPT = `;(function () {
  var stored = localStorage.getItem('theme')
  var dark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
  if (dark) document.documentElement.classList.add('dark')
})()`

/** All four families, latin + latin-ext, resolved against the site base. */
function fontFaces(base: string): string {
  const subsets = (name: string, ext = `${name}-ext`) => ({
    latin: `${base}fonts/${name}.woff2`,
    ext: `${base}fonts/${ext}.woff2`,
  })
  return [
    fontFaceCss({
      family: 'Bricolage Grotesque Variable',
      weight: '200 800',
      format: 'woff2-variations',
      src: subsets('bricolage-grotesque-latin'),
      display: 'swap',
    }),
    fontFaceCss({
      family: 'IBM Plex Mono',
      weight: '400',
      format: 'woff2',
      src: subsets('ibm-plex-mono-latin-400', 'ibm-plex-mono-latin-ext-400'),
      display: 'swap',
    }),
    fontFaceCss({
      family: 'IBM Plex Mono',
      weight: '500',
      format: 'woff2',
      src: subsets('ibm-plex-mono-latin-500', 'ibm-plex-mono-latin-ext-500'),
      display: 'swap',
    }),
    fontFaceCss({
      family: 'Public Sans Variable',
      weight: '100 900',
      format: 'woff2-variations',
      src: subsets('public-sans-latin'),
      display: 'swap',
    }),
  ].join('\n')
}

function css(base: string): string {
  return `
*{box-sizing:border-box;margin:0}
:root{--paper:#edf2e7;--paper-raised:#e4ebdc;--rule:#c7d6c2;--ink:#1b2620;--ink-muted:#55645b;--red:#bf3b2f;--green:#2f5c45}
.dark{--paper:#0f1511;--paper-raised:#151d17;--rule:#26332a;--ink:#e3ebdd;--ink-muted:#8fa096;--red:#e2604f;--green:#7fb89a}
${fontFaces(base)}
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
header a,footer nav a{display:inline-block;padding:.5rem 0;margin:-.5rem 0}
.brand,.crumb{font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:.75rem;letter-spacing:.25em;text-transform:uppercase;text-decoration:none}
.brand{color:var(--ink)}.crumb{color:var(--ink-muted)}
.brand:hover,.crumb:hover{text-decoration:underline;text-decoration-color:var(--red);text-underline-offset:4px}
.red{color:var(--red)}.green{color:var(--green)}
.eyebrow{margin-top:3.5rem;font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:.75rem;letter-spacing:.25em;text-transform:uppercase;color:var(--red)}
h1{margin-top:.5rem;font-family:'Bricolage Grotesque Variable',system-ui,sans-serif;font-weight:650;font-size:clamp(2.4rem,8vw,3.5rem);letter-spacing:-.02em;line-height:1.02}
.dateline{margin-top:.75rem;font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:.875rem;color:var(--ink-muted)}
.lede{margin-top:1.25rem;max-width:56ch;line-height:1.6;color:var(--ink-muted);text-wrap:pretty}
.figures{display:grid;grid-template-columns:repeat(2,1fr);gap:1px;background:var(--rule);border:1px solid var(--rule);border-radius:2px;overflow:hidden;margin-top:2.75rem}
@media(min-width:640px){.figures{grid-template-columns:repeat(4,1fr)}}
.figures>div{background:var(--paper);padding:1.25rem 1rem;display:flex;flex-direction:column;justify-content:flex-end}
dt{font-size:.6875rem;letter-spacing:.2em;text-transform:uppercase;color:var(--ink-muted);margin-bottom:.375rem}
dd{font-size:1.5rem;font-weight:500}
.langlink{margin-top:2.25rem}
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
  lang: PageLang
  title: string
  description: string
  canonical: string
  jsonLd: object
  body: string
  /** Overrides the site-wide share image (per-week cards). */
  ogImage?: string
  /** hreflang siblings; `x-default` is added for the English page. */
  alternates?: readonly AlternateLink[]
  /**
   * Optional top-right breadcrumb — the archive on English week pages, the
   * summary index on Turkish ones. Omitted where it would only repeat the
   * brand link.
   */
  crumb?: { href: string; label: string; lang?: string }
}

function footerFor(lang: PageLang, meta: JournalMeta, base: string): string {
  const x = escapeMarkup(meta.xUrl)
  if (lang === 'tr') {
    return `        <p>Her Pazar gerçek rakamlar — $0 haftaları dahil — ve ${formatDateLongTr(meta.goalDate)}
        tarihinde, sonuç ne olursa olsun dürüst bir post-mortem.</p>
        <nav aria-label="Site bağlantıları">
          <a href="${base}tr/">Türkçe özet</a>
          <a href="${base}" lang="en" hreflang="en">English</a>
          <a href="${escapeMarkup(trFeedUrl(meta.siteUrl))}">RSS</a>
          <a href="${x}" rel="noreferrer">X&nbsp;↗</a>
        </nav>`
  }
  return `        <p>Real numbers every Sunday — including the $0 weeks — and one honest post-mortem
        on ${formatDateLong(meta.goalDate)}, whatever the final number is.</p>
        <nav aria-label="Site links">
          <a href="${base}">The ledger</a>
          <a href="${base}#signup">Email</a>
          <a href="${escapeMarkup(feedUrl(meta.siteUrl))}">RSS</a>${
            meta.hasTrPages ? `\n          <a href="${base}tr/" lang="tr" hreflang="tr">Türkçe</a>` : ''
          }
          <a href="${x}" rel="noreferrer">X&nbsp;↗</a>
        </nav>`
}

export function pageShell({
  meta,
  lang,
  title,
  description,
  canonical,
  jsonLd,
  body,
  ogImage,
  alternates = [],
  crumb,
}: ShellOptions): string {
  const base = basePath(meta.siteUrl)
  const feed = lang === 'tr' ? trFeedUrl(meta.siteUrl) : feedUrl(meta.siteUrl)
  const feedTitle =
    lang === 'tr' ? `${meta.siteName} — haftalık defter (TR)` : `${meta.siteName} — the weekly ledger`
  const image = ogImage ?? meta.ogImage
  // Root-relative so generated pages also work on a same-origin preview.
  const home = base
  const alternateTags = alternates
    .map(
      (alt) =>
        `\n    <link rel="alternate" hreflang="${alt.hreflang}" href="${escapeMarkup(alt.href)}" />`,
    )
    .join('')

  return `<!doctype html>
<html lang="${lang}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeMarkup(title)}</title>
    <meta name="description" content="${escapeMarkup(description)}" />
    <link rel="canonical" href="${escapeMarkup(canonical)}" />${alternateTags}
    <link rel="icon" type="image/svg+xml" href="${base}favicon.svg" />
    <link rel="alternate" type="application/rss+xml" title="${escapeMarkup(feedTitle)}" href="${escapeMarkup(feed)}" />
    <meta name="theme-color" media="(prefers-color-scheme: light)" content="#edf2e7" />
    <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0f1511" />
    <meta property="og:type" content="article" />
    <meta property="og:locale" content="${lang === 'tr' ? 'tr_TR' : 'en_US'}" />
    <meta property="og:title" content="${escapeMarkup(title)}" />
    <meta property="og:description" content="${escapeMarkup(description)}" />
    <meta property="og:url" content="${escapeMarkup(canonical)}" />
    <meta property="og:image" content="${escapeMarkup(image)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeMarkup(title)}" />
    <meta name="twitter:description" content="${escapeMarkup(description)}" />
    <meta name="twitter:image" content="${escapeMarkup(image)}" />
    <script>${THEME_SCRIPT}</script>
    <style>${css(base)}</style>
    <script type="application/ld+json">${serializeJsonLd(jsonLd)}</script>
  </head>
  <body>
    <div class="page">
      <div class="margin-rule" aria-hidden="true"></div>
      <header>
        <a class="brand" href="${escapeMarkup(home)}">roadto100k<span class="red">w</span>kerem</a>
${crumb ? `        <a class="crumb" href="${escapeMarkup(crumb.href)}"${crumb.lang ? ` lang="${crumb.lang}" hreflang="${crumb.lang}"` : ''}>${escapeMarkup(crumb.label)}</a>\n` : ''}
      </header>
${body}
      <footer>
${footerFor(lang, meta, base)}
      </footer>
    </div>
  </body>
</html>
`
}
