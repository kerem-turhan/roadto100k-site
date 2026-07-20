import type { Ledger, LedgerWeek } from './ledger.ts'
import { formatUsd } from './ledger.ts'
import { weekUrl } from './urls.ts'

export interface SiteIdentity {
  /** Canonical site URL with trailing slash. */
  siteUrl: string
  siteName: string
  authorName: string
  description: string
  /** Other profiles that are the same person (X, GitHub). */
  sameAs: readonly string[]
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

/** JSON-LD for one weekly journal page: a BlogPosting with real dates only. */
export function weekJsonLd(week: LedgerWeek, weekNumber: number, id: SiteIdentity): object {
  const url = weekUrl(id.siteUrl, week.weekEnding)
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': url,
    mainEntityOfPage: url,
    headline: `Week ${weekNumber} — revenue ${formatUsd(week.revenue)} · spend ${formatUsd(week.spend)}`,
    description: week.note,
    datePublished: week.weekEnding,
    dateModified: week.weekEnding,
    author: {
      '@type': 'Person',
      name: id.authorName,
      url: id.siteUrl,
    },
    isPartOf: { '@id': `${id.siteUrl}#website` },
    inLanguage: 'en',
  }
}
