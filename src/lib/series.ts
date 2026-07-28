export interface SeriesEntry {
  /** 1-based, in publication order. Shown as № 001 and used for the pager. */
  number: number
  /** URL segment: lowercase, digits and single hyphens. Never changes. */
  slug: string
  /** ISO publication date. */
  date: string
  title: string
  /** One-sentence summary — the dek, the meta description and the feed blurb. */
  dek: string
  /** Body paragraphs, plain text. No markup: nothing here needs a parser yet. */
  body: string[]
}

export interface Series {
  /** ISO date the series index copy last changed — sitemap lastmod. */
  updated: string
  /** Oldest first. Empty is a valid, honest state: nothing published yet. */
  entries: SeriesEntry[]
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function isRealIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const utc = new Date(Date.UTC(year, month - 1, day))
  return (
    utc.getUTCFullYear() === year && utc.getUTCMonth() === month - 1 && utc.getUTCDate() === day
  )
}

function fail(path: string, detail: string): never {
  throw new Error(`Invalid series data at ${path}: ${detail}`)
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

/**
 * Validate raw JSON into a Series. Throws on anything malformed — the entry
 * pages are permanent URLs cited from elsewhere, so a typo in a slug is a dead
 * link somebody else already published, and a blank body is a page that
 * promises a finding and delivers whitespace. Both fail the build instead.
 */
export function parseSeries(raw: unknown): Series {
  if (typeof raw !== 'object' || raw === null) fail('$', 'not an object')
  const data = raw as Record<string, unknown>

  if (!isRealIsoDate(data.updated)) {
    fail('updated', 'expected a real calendar date as YYYY-MM-DD')
  }
  if (!Array.isArray(data.entries)) fail('entries', 'expected an array')

  const entries = data.entries.map((raw, i) => {
    const at = `entries[${i}]`
    if (typeof raw !== 'object' || raw === null) fail(at, 'not an object')
    const entry = raw as Record<string, unknown>

    if (entry.number !== i + 1) {
      fail(`${at}.number`, `expected ${i + 1} — entries are numbered in publication order`)
    }
    if (typeof entry.slug !== 'string' || !SLUG.test(entry.slug)) {
      fail(`${at}.slug`, 'expected lowercase words joined by single hyphens')
    }
    if (!isRealIsoDate(entry.date)) {
      fail(`${at}.date`, 'expected a real calendar date as YYYY-MM-DD')
    }
    for (const key of ['title', 'dek'] as const) {
      if (!nonEmptyString(entry[key])) fail(`${at}.${key}`, 'expected a non-empty string')
    }
    if (!Array.isArray(entry.body) || entry.body.length === 0) {
      fail(`${at}.body`, 'expected at least one paragraph')
    }
    entry.body.forEach((paragraph, p) => {
      if (!nonEmptyString(paragraph)) fail(`${at}.body[${p}]`, 'expected a non-empty string')
    })

    return {
      number: entry.number as number,
      slug: entry.slug,
      date: entry.date,
      title: entry.title as string,
      dek: entry.dek as string,
      body: entry.body as string[],
    } satisfies SeriesEntry
  })

  const slugs = new Set<string>()
  for (const entry of entries) {
    if (slugs.has(entry.slug)) fail('entries', `duplicate slug ${entry.slug}`)
    slugs.add(entry.slug)
  }

  return { updated: data.updated, entries }
}

/** ISO date the series surface last changed — the newest of index and entries. */
export function seriesLastModified(series: Series): string {
  return series.entries.reduce((latest, entry) => (entry.date > latest ? entry.date : latest), series.updated)
}
