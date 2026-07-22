import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { HtmlTagDescriptor, Plugin } from 'vite'
import { config } from '../src/config.ts'
import { buildFeed, buildTrFeed } from '../src/lib/feed.ts'
import type { JournalMeta, StaticPage } from '../src/lib/journal.ts'
import { buildJournalPages } from '../src/lib/journal.ts'
import { buildTrPages } from '../src/lib/journalTr.ts'
import type { Ledger } from '../src/lib/ledger.ts'
import { parseLedger, trWeekEntries } from '../src/lib/ledger.ts'
import { serializeJsonLd, siteJsonLd } from '../src/lib/seo.ts'
import { buildRobots, buildSitemap } from '../src/lib/sitemap.ts'
import { injectSiteUrl, trHomeUrl, weekOgPath } from '../src/lib/urls.ts'

const LEDGER_PATH = fileURLToPath(new URL('../src/data/ledger.json', import.meta.url))
const PUBLIC_DIR = fileURLToPath(new URL('../public', import.meta.url))

function readLedger(): Ledger {
  return parseLedger(JSON.parse(readFileSync(LEDGER_PATH, 'utf8')))
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
  }
}

/**
 * Pre-renders everything GitHub Pages can serve as-is: feed.xml, sitemap.xml,
 * robots.txt, one static HTML journal page per ledger week and the Turkish
 * summary pages for the weeks that have a `trNote`. All content is derived
 * from src/data/ledger.json + src/config.ts at build time; a malformed ledger
 * fails the build via parseLedger.
 */
export function staticPagesPlugin(): Plugin {
  let outDir = ''
  return {
    name: 'roadto100k:static-pages',
    // Not build-only: transformIndexHtml also fills index.html's %SITE_URL%
    // token, and dev should serve the same head as production. closeBundle only
    // ever fires on a build anyway.
    configResolved(resolved) {
      outDir = path.resolve(resolved.root, resolved.build.outDir)
    },
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
    closeBundle() {
      const ledger = readLedger()
      const meta = metaFor(ledger)
      const trFeed = buildTrFeed(ledger, meta)
      const pages: StaticPage[] = [
        { path: 'feed.xml', html: buildFeed(ledger, meta) },
        { path: 'sitemap.xml', html: buildSitemap(ledger, config.SITE_URL) },
        { path: 'robots.txt', html: buildRobots(config.SITE_URL) },
        ...buildJournalPages(ledger, meta),
        ...buildTrPages(ledger, meta),
        ...(trFeed ? [{ path: 'tr/feed.xml', html: trFeed }] : []),
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
