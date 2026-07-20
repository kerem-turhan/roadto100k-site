import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite'
import { config } from '../src/config.ts'
import { buildFeed } from '../src/lib/feed.ts'
import type { JournalMeta } from '../src/lib/journal.ts'
import { buildJournalPages } from '../src/lib/journal.ts'
import { parseLedger } from '../src/lib/ledger.ts'
import { serializeJsonLd, siteJsonLd } from '../src/lib/seo.ts'
import { buildRobots, buildSitemap } from '../src/lib/sitemap.ts'

const LEDGER_PATH = fileURLToPath(new URL('../src/data/ledger.json', import.meta.url))

const META: JournalMeta = {
  siteUrl: config.SITE_URL,
  siteName: config.SITE_NAME,
  authorName: config.AUTHOR_NAME,
  description: config.SITE_DESCRIPTION,
  sameAs: [config.X_URL, config.GITHUB_URL],
  xUrl: config.X_URL,
  goalDate: config.GOAL_DATE,
  goalUsd: config.GOAL_USD,
  ogImage: `${config.SITE_URL}og.png`,
}

/**
 * Pre-renders everything GitHub Pages can serve as-is: feed.xml, sitemap.xml,
 * robots.txt and one static HTML journal page per ledger week. All content is
 * derived from src/data/ledger.json + src/config.ts at build time; a malformed
 * ledger fails the build via parseLedger.
 */
export function staticPagesPlugin(): Plugin {
  let outDir = ''
  return {
    name: 'roadto100k:static-pages',
    apply: 'build',
    configResolved(resolved) {
      outDir = path.resolve(resolved.root, resolved.build.outDir)
    },
    transformIndexHtml() {
      const ledger = parseLedger(JSON.parse(readFileSync(LEDGER_PATH, 'utf8')))
      return [
        {
          tag: 'script',
          attrs: { type: 'application/ld+json' },
          children: serializeJsonLd(siteJsonLd(ledger, META)),
          injectTo: 'head',
        },
      ]
    },
    closeBundle() {
      const ledger = parseLedger(JSON.parse(readFileSync(LEDGER_PATH, 'utf8')))
      const pages = [
        { path: 'feed.xml', html: buildFeed(ledger, META) },
        { path: 'sitemap.xml', html: buildSitemap(ledger, config.SITE_URL) },
        { path: 'robots.txt', html: buildRobots(config.SITE_URL) },
        ...buildJournalPages(ledger, META),
      ]
      for (const page of pages) {
        const target = path.join(outDir, page.path)
        mkdirSync(path.dirname(target), { recursive: true })
        writeFileSync(target, page.html)
      }
      this.info(`static pages: ${pages.map((p) => p.path).join(', ')}`)
    },
  }
}
