/**
 * The brand name, split for display.
 *
 * `config.SITE_NAME` is the single source for the name itself, but the wordmark
 * carries one red accent on the goal figure — the same accent the hero uses on
 * the arrow. Splitting here rather than hardcoding the name in three places
 * (the app header, the page shell, the share card) is what keeps those three
 * from drifting apart the next time the name changes; they did, and it took a
 * grep to find them all.
 */

export interface BrandParts {
  before: string
  /** The accented run, or '' when the name has no goal figure in it. */
  accent: string
  after: string
}

const ACCENT = /\$\d[\d,.]*k?/i

/** The wordmark as HTML, for the generated pages and the share cards. */
export function brandMarkup(siteName: string, escape: (value: string) => string): string {
  const { before, accent, after } = brandParts(siteName)
  if (!accent) return escape(before)
  return `${escape(before)}<span class="red">${escape(accent)}</span>${escape(after)}`
}

export function brandParts(siteName: string): BrandParts {
  const match = ACCENT.exec(siteName)
  if (!match) return { before: siteName, accent: '', after: '' }
  return {
    before: siteName.slice(0, match.index),
    accent: match[0],
    after: siteName.slice(match.index + match[0].length),
  }
}
