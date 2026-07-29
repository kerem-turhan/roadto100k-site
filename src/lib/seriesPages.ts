import { SERIES, signupFormMarkup } from './offer.ts'
import type { JournalMeta, StaticPage } from './pageShell.ts'
import { pageShell } from './pageShell.ts'
import type { Series, SeriesBlock, SeriesEntry } from './series.ts'
import { isCallout, isList } from './series.ts'
import { escapeMarkup, formatDateLong } from './text.ts'
import { basePath, seriesEntryUrl, seriesUrl } from './urls.ts'

/*
 * /silent-green/ — the permanent home of the weekly finding.
 *
 * Show HN and dev.to posts cite this path, so it is built whether or not an
 * entry exists yet: a URL that 404s for a week and then appears is worse than
 * one that says, in plain words, that the first entry is on its way. What it
 * never does is pretend — no placeholder entry, no fabricated archive.
 */

function signup(meta: JournalMeta, idPrefix: string): string {
  return signupFormMarkup({
    buttondownUrl: meta.buttondownUrl ?? '',
    xUrl: meta.xUrl,
    idPrefix,
  })
}

function prose(blocks: readonly SeriesBlock[]): string {
  return blocks
    .map((block) => {
      if (isCallout(block)) {
        return `          <p class="callout">${escapeMarkup(block.callout)}</p>`
      }
      if (isList(block)) {
        const steps = block.list
          .map((step) => `            <li>${escapeMarkup(step)}</li>`)
          .join('\n')
        return `          <ol class="steps">\n${steps}\n          </ol>`
      }
      return `          <p>${escapeMarkup(block)}</p>`
    })
    .join('\n')
}

function entryNumber(entry: SeriesEntry): string {
  return String(entry.number).padStart(3, '0')
}

function entryPage(series: Series, position: number, meta: JournalMeta): StaticPage {
  const entry = series.entries[position]
  const url = seriesEntryUrl(meta.siteUrl, entry.slug)
  const base = basePath(meta.siteUrl)
  const prev = position > 0 ? series.entries[position - 1] : null
  const next = position < series.entries.length - 1 ? series.entries[position + 1] : null

  const pager =
    prev || next
      ? `        <nav class="pager" aria-label="Adjacent entries">
          <span>${prev ? `<a href="${seriesEntryUrl(meta.siteUrl, prev.slug)}">← № ${entryNumber(prev)}</a>` : ''}</span>
          <span>${next ? `<a href="${seriesEntryUrl(meta.siteUrl, next.slug)}">№ ${entryNumber(next)} →</a>` : ''}</span>
        </nav>\n`
      : ''

  const title = `${entry.title} · ${SERIES.name}`
  const body = `      <main>
        <p class="eyebrow">${escapeMarkup(SERIES.name)} № ${entryNumber(entry)}</p>
        <h1>${escapeMarkup(entry.title)}</h1>
        <p class="dateline">${formatDateLong(entry.date)}</p>
        <p class="lede">${escapeMarkup(entry.dek)}</p>
        <div class="prose">
${prose(entry.body)}
        </div>
${pager}${signup(meta, `entry-${entry.slug}`)}
        <p class="terms"><a href="${base}silent-green/">Every finding in the series →</a></p>
      </main>`

  return {
    path: `silent-green/${entry.slug}/index.html`,
    html: pageShell({
      meta,
      lang: 'en',
      title,
      description: entry.dek,
      canonical: url,
      crumb: { href: `${base}silent-green/`, label: 'silent green' },
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        '@id': url,
        mainEntityOfPage: url,
        headline: entry.title,
        description: entry.dek,
        datePublished: entry.date,
        dateModified: entry.date,
        author: { '@type': 'Person', name: meta.authorName, url: meta.siteUrl },
        publisher: {
          '@type': 'Person',
          '@id': `${meta.siteUrl}#person`,
          name: meta.authorName,
          url: meta.siteUrl,
        },
        isPartOf: { '@id': seriesUrl(meta.siteUrl) },
        inLanguage: 'en',
      },
      body,
    }),
  }
}

function indexPage(series: Series, meta: JournalMeta): StaticPage {
  const url = seriesUrl(meta.siteUrl)
  const base = basePath(meta.siteUrl)

  const list =
    series.entries.length > 0
      ? `        <ul class="weeks">
${[...series.entries]
  .reverse()
  .map(
    (entry) => `          <li>
            <div class="row">
              <a href="${seriesEntryUrl(meta.siteUrl, entry.slug)}">№ ${entryNumber(entry)} — ${escapeMarkup(entry.title)}</a>
              <span>${formatDateLong(entry.date)}</span>
            </div>
            <p>${escapeMarkup(entry.dek)}</p>
          </li>`,
  )
  .join('\n')}
        </ul>`
      : `        <p class="awaiting">${escapeMarkup(SERIES.awaiting)} Each finding is listed here
        the day it is published — nothing is back-dated in, and nothing is listed before it
        exists.</p>`

  const description = `${SERIES.name}: ${SERIES.dek}`

  const body = `      <main>
        <p class="eyebrow">The series</p>
        <h1>${escapeMarkup(SERIES.name)}</h1>
        <p class="lede">${escapeMarkup(SERIES.dek)}</p>
        <div class="prose">
${prose(SERIES.intro)}
        </div>
${list}
${signup(meta, 'series')}
      </main>`

  return {
    path: 'silent-green/index.html',
    html: pageShell({
      meta,
      lang: 'en',
      title: `${SERIES.name} — one finding a week · ${meta.siteName}`,
      description,
      canonical: url,
      crumb: { href: base, label: 'the ledger' },
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Blog',
        '@id': url,
        name: SERIES.name,
        url,
        description,
        author: { '@id': `${meta.siteUrl}#person` },
        isPartOf: { '@id': `${meta.siteUrl}#website` },
        inLanguage: 'en',
        // Only what actually exists: an empty series advertises no posts.
        blogPost: series.entries.map((entry) => ({
          '@type': 'BlogPosting',
          '@id': seriesEntryUrl(meta.siteUrl, entry.slug),
          headline: entry.title,
          datePublished: entry.date,
        })),
      },
      body,
    }),
  }
}

/** The series index plus one page per published entry. */
export function buildSeriesPages(series: Series, meta: JournalMeta): StaticPage[] {
  return [
    ...series.entries.map((_, position) => entryPage(series, position, meta)),
    indexPage(series, meta),
  ]
}
