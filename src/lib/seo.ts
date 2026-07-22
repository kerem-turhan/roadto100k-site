import type { Ledger, LedgerWeek } from './ledger.ts'
import { formatUsd } from './ledger.ts'
import { trWeekUrl, weekOgUrl, weekUrl } from './urls.ts'

export interface SiteIdentity {
  /** Canonical site URL with trailing slash. */
  siteUrl: string
  siteName: string
  authorName: string
  description: string
  /** Other profiles that are the same person (X, GitHub). */
  sameAs: readonly string[]
}

/** Which share cards exist — the shell's `JournalMeta` carries these too. */
export interface ShareCards {
  /** Absolute URL of the site-wide share image — the fallback for every page. */
  ogImage?: string
  /**
   * Week-ending dates that have a committed per-week share card in
   * `public/og/w/`. Weeks not listed fall back to `ogImage`.
   */
  weekOgWeeks?: readonly string[]
  /** Week-ending dates that have a committed Turkish card in `public/og/w/tr/`. */
  trWeekOgWeeks?: readonly string[]
}

function personRef(id: SiteIdentity) {
  return { '@id': `${id.siteUrl}#person` }
}

/**
 * Serialize JSON-LD for embedding in a `<script>` tag. `<` is emitted as
 * `\u003c` so ledger text can never terminate the script element early.
 */
export function serializeJsonLd(value: object): string {
  return JSON.stringify(value).replaceAll('<', '\\u003c')
}

/**
 * schema.org JSON-LD for the root page: the Person behind the journey, the
 * WebSite, and the weekly ledger as a Dataset. Facts only — everything here
 * is either config or real ledger data.
 */
export function siteJsonLd(ledger: Ledger, id: SiteIdentity): object {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': `${id.siteUrl}#person`,
        name: id.authorName,
        url: id.siteUrl,
        sameAs: [...id.sameAs],
      },
      {
        '@type': 'WebSite',
        '@id': `${id.siteUrl}#website`,
        name: id.siteName,
        url: id.siteUrl,
        description: id.description,
        author: personRef(id),
        inLanguage: 'en',
      },
      {
        '@type': 'Dataset',
        '@id': `${id.siteUrl}#ledger`,
        name: `${id.siteName} — the weekly ledger`,
        description:
          'Weekly revenue, MRR, spend and email-subscriber numbers of a $0-to-$100k ' +
          'build-in-public journey, updated every Sunday. Zeros included.',
        url: id.siteUrl,
        creator: personRef(id),
        isAccessibleForFree: true,
        temporalCoverage: `${ledger.startDate}/${ledger.weeks[ledger.weeks.length - 1].weekEnding}`,
        variableMeasured: ['revenue', 'MRR', 'spend', 'email subscribers'],
      },
    ],
  }
}

/**
 * The image the page itself shows to a share preview: the week's own card when
 * one is committed, the site-wide card otherwise, and never the English card on
 * a Turkish page. Same rule as `weekOgImage` in journal.ts, which fills the
 * og:image tag — the two live apart because journal.ts imports this module, not
 * the other way round, and seo.test.ts asserts they still agree.
 */
function weekImage(week: LedgerWeek, id: SiteIdentity & ShareCards, lang: 'en' | 'tr'): string {
  const cards = lang === 'tr' ? id.trWeekOgWeeks : id.weekOgWeeks
  return cards?.includes(week.weekEnding)
    ? weekOgUrl(id.siteUrl, week.weekEnding, lang)
    : (id.ogImage ?? '')
}

/**
 * JSON-LD for one weekly journal page: a BlogPosting with real dates only.
 * The Turkish variant describes the `/tr/` page and quotes its own summary.
 */
export function weekJsonLd(
  week: LedgerWeek,
  weekNumber: number,
  id: SiteIdentity & ShareCards,
  lang: 'en' | 'tr' = 'en',
): object {
  const tr = lang === 'tr'
  const url = tr ? trWeekUrl(id.siteUrl, week.weekEnding) : weekUrl(id.siteUrl, week.weekEnding)
  const image = weekImage(week, id, lang)
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': url,
    mainEntityOfPage: url,
    headline: tr
      ? `Hafta ${weekNumber} — gelir ${formatUsd(week.revenue)} · harcama ${formatUsd(week.spend)}`
      : `Week ${weekNumber} — revenue ${formatUsd(week.revenue)} · spend ${formatUsd(week.spend)}`,
    description: tr ? (week.trNote ?? week.note) : week.note,
    // A page that shows a 1200x630 card should say so; an empty string would be
    // a claim to an image that does not exist, so the key is simply absent.
    ...(image ? { image } : {}),
    datePublished: week.weekEnding,
    dateModified: week.weekEnding,
    author: {
      '@type': 'Person',
      name: id.authorName,
      url: id.siteUrl,
    },
    // One person is both author and publisher here; the @id is the same node
    // the homepage graph defines, so the two pages describe one Person.
    publisher: {
      '@type': 'Person',
      '@id': `${id.siteUrl}#person`,
      name: id.authorName,
      url: id.siteUrl,
    },
    isPartOf: { '@id': `${id.siteUrl}#website` },
    inLanguage: lang,
  }
}
