import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { HtmlTagDescriptor, Plugin } from 'vite'
import { config } from '../src/config.ts'
import { buildFeed, buildTrFeed } from '../src/lib/feed.ts'
import type { JournalMeta, StaticPage } from '../src/lib/journal.ts'
import { buildJournalPages } from '../src/lib/journal.ts'
import { OFFER_UPDATED } from '../src/lib/offer.ts'
import { buildTrPages } from '../src/lib/journalTr.ts'
import type { Ledger } from '../src/lib/ledger.ts'
import { parseLedger, trWeekEntries } from '../src/lib/ledger.ts'
import { serializeJsonLd, siteJsonLd } from '../src/lib/seo.ts'
import type { Series } from '../src/lib/series.ts'
import { parseSeries, seriesLastModified } from '../src/lib/series.ts'
import { buildSeriesPages } from '../src/lib/seriesPages.ts'
import type { SitemapEntry } from '../src/lib/sitemap.ts'
import { buildRobots, buildSitemap } from '../src/lib/sitemap.ts'
import { injectSiteUrl, seriesUrl, trHomeUrl, weekOgPath, workUrl } from '../src/lib/urls.ts'
import { buildWorkPage } from '../src/lib/workPage.ts'
import { liveProofItems } from '../src/lib/proof.ts'

const LEDGER_PATH = fileURLToPath(new URL('../src/data/ledger.json', import.meta.url))
const SERIES_PATH = fileURLToPath(new URL('../src/data/series.json', import.meta.url))
const PUBLIC_DIR = fileURLToPath(new URL('../public', import.meta.url))

function readLedger(): Ledger {
  return parseLedger(JSON.parse(readFileSync(LEDGER_PATH, 'utf8')))
}

function readSeries(): Series {
  return parseSeries(JSON.parse(readFileSync(SERIES_PATH, 'utf8')))
}

/**
 * Week-ending dates that have a committed share card in that language. Cards
 * are rendered locally with `npm run og`; a week without one falls back to the
 * site-wide og.png, so a missing card never breaks the build.
 */
function committedWeekCards(ledger: Ledger, lang: 'en' | 'tr'): string[] {
  return ledger.weeks
    .map((week) => week.weekEnding)
    .filter((weekEnding) => existsSync(path.join(PUBLIC_DIR, weekOgPath(weekEnding, lang))))
}

function metaFor(ledger: Ledger): JournalMeta {
  return {
    siteUrl: config.SITE_URL,
    siteName: config.SITE_NAME,
    authorName: config.AUTHOR_NAME,
    description: config.SITE_DESCRIPTION,
    sameAs: [config.X_URL, config.GITHUB_URL],
    xUrl: config.X_URL,
    goalDate: config.GOAL_DATE,
    goalUsd: config.GOAL_USD,
    ogImage: `${config.SITE_URL}og.png`,
    weekOgWeeks: committedWeekCards(ledger, 'en'),
    trWeekOgWeeks: committedWeekCards(ledger, 'tr'),
    hasTrPages: trWeekEntries(ledger).length > 0,
    // The service page lives or dies by the same gate the homepage section uses.
    hasWorkPage: liveProofItems(config.PROOF_ITEMS).length > 0,
    hasSeriesPage: true,
    buttondownUrl: config.BUTTONDOWN_URL,
    contactEmail: config.CONTACT_EMAIL,
  }
}

/**
 * Pre-renders everything GitHub Pages can serve as-is: feed.xml, sitemap.xml,
 * robots.txt, one static HTML journal page per ledger week and the Turkish
 * summary pages for the weeks that have a `trNote`. All content is derived
 * from src/data/ledger.json + src/config.ts at build time; a malformed ledger
 * fails the build via parseLedger.
 */
/**
 * Fills index.html's head — the %SITE_URL% token and the site's JSON-LD.
 *
 * Separate from the page writer below because this half must also run in dev,
 * so the served head matches production. The writing half must NOT: vitest
 * loads this config too, and its `build.outDir` default is a placeholder
 * directory — leaving them in one plugin meant `npm run test` quietly emitted a
 * copy of the whole site into the repo root.
 */
export function siteHeadPlugin(): Plugin {
  return {
    name: 'roadto100k:site-head',
    transformIndexHtml(html) {
      const ledger = readLedger()
      const meta = metaFor(ledger)
      const tags: HtmlTagDescriptor[] = [
        {
          tag: 'script',
          attrs: { type: 'application/ld+json' },
          children: serializeJsonLd(siteJsonLd(ledger, meta)),
          injectTo: 'head',
        },
      ]
      if (trWeekEntries(ledger).length > 0) {
        tags.push(
          {
            tag: 'link',
            attrs: { rel: 'alternate', hreflang: 'en', href: config.SITE_URL },
            injectTo: 'head',
          },
          {
            tag: 'link',
            attrs: { rel: 'alternate', hreflang: 'tr', href: trHomeUrl(config.SITE_URL) },
            injectTo: 'head',
          },
          {
            tag: 'link',
            attrs: { rel: 'alternate', hreflang: 'x-default', href: config.SITE_URL },
            injectTo: 'head',
          },
        )
      }
      return { html: injectSiteUrl(html, config.SITE_URL), tags }
    },
  }
}

export function staticPagesPlugin(): Plugin {
  let outDir = ''
  return {
    name: 'roadto100k:static-pages',
    apply: 'build',
    configResolved(resolved) {
      outDir = path.resolve(resolved.root, resolved.build.outDir)
    },
    closeBundle() {
      // Refuse to scatter a copy of the site somewhere unexpected: anything but
      // the real output directory means this hook fired in a context it was
      // never meant to run in.
      if (path.basename(outDir) !== 'dist') {
        this.error(`static pages: refusing to write into ${outDir} — expected dist/`)
      }
      const ledger = readLedger()
      const series = readSeries()
      const meta = metaFor(ledger)
      const trFeed = buildTrFeed(ledger, meta)
      const workPage = buildWorkPage({ meta, items: config.PROOF_ITEMS })
      const seriesPages = buildSeriesPages(series, meta)
      // Only the pages this build actually wrote get advertised; a gated-out
      // /work/ must not appear in the sitemap as a URL that 404s.
      const extraUrls: SitemapEntry[] = [
        ...(workPage ? [{ loc: workUrl(config.SITE_URL), lastmod: OFFER_UPDATED }] : []),
        { loc: seriesUrl(config.SITE_URL), lastmod: seriesLastModified(series) },
        ...series.entries.map((entry) => ({
          loc: `${seriesUrl(config.SITE_URL)}${entry.slug}/`,
          lastmod: entry.date,
        })),
      ]
      const pages: StaticPage[] = [
        { path: 'feed.xml', html: buildFeed(ledger, meta) },
        { path: 'sitemap.xml', html: buildSitemap(ledger, config.SITE_URL, extraUrls) },
        { path: 'robots.txt', html: buildRobots(config.SITE_URL) },
        ...buildJournalPages(ledger, meta),
        ...buildTrPages(ledger, meta),
        ...(trFeed ? [{ path: 'tr/feed.xml', html: trFeed }] : []),
        ...(workPage ? [workPage] : []),
        ...seriesPages,
      ]
      for (const page of pages) {
        const target = path.join(outDir, page.path)
        mkdirSync(path.dirname(target), { recursive: true })
        writeFileSync(target, page.html)
      }
      this.info(`static pages: ${pages.map((p) => p.path).join(', ')}`)
      this.info(
        `week share cards: ${meta.weekOgWeeks?.length ?? 0}/${ledger.weeks.length} en, ` +
          `${meta.trWeekOgWeeks?.length ?? 0}/${trWeekEntries(ledger).length} tr`,
      )
    },
  }
}
