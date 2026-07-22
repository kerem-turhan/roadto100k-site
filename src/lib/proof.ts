/**
 * Proof-of-work visibility rules.
 *
 * The gate is deliberately paranoid: an item renders ONLY when its `url` is a
 * real, public, deep https link, and — if it makes a numeric claim — only when
 * it also pins the commit those numbers were read from. Everything else stays
 * completely hidden, section included.
 *
 * Why this much machinery for a filter: the first version of this file only
 * checked the `https://` prefix while its own comment promised "no placeholder
 * ever renders". An audit added a second item pointing at a placeholder URL and
 * the whole gauntlet stayed green while a dead link shipped to production. A
 * gate that cannot say no is documentation, not a gate.
 */

export interface ProofItem {
  title: string
  description: string
  /** Short ledger-style figures, e.g. "4/6 → 6/6". */
  stats: readonly string[]
  /** Empty or placeholder = hidden. Only a real deep https URL makes it live. */
  url: string
  /**
   * Commit SHA of the linked repo that the `stats` were read from. Our numbers
   * live in this config; the truth lives in another repo that can change under
   * us. Pinning the commit turns an unbounded present-tense claim ("it scores
   * 6/6") into a bounded historical one ("it scored 6/6 at e4076e2"), which
   * stays true no matter what that repo does later. Required whenever `stats`
   * is non-empty — see `isLiveProofItem`.
   */
  sourceCommit?: string
}

/** Hosts that only ever appear in copy-paste templates, never in real proof. */
const PLACEHOLDER_HOSTS = new Set([
  'example.com',
  'example.org',
  'example.net',
  'example.edu',
  'test.com',
  'placeholder.com',
  'yoursite.com',
  'your-site.com',
  'localhost',
])

/**
 * Words that mean "not filled in yet". Matched against whole tokens of the URL
 * (split on every non-alphanumeric), so `example.com/TODO` and
 * `github.com/me/repo/tree/WIP` are caught while `.../agent-reliability-teardown`
 * is not.
 */
const PLACEHOLDER_TOKENS = new Set([
  'todo',
  'tbd',
  'tba',
  'wip',
  'xxx',
  'fixme',
  'placeholder',
  'changeme',
  'example',
  'sample',
  'dummy',
  'lorem',
  'ipsum',
  'foo',
  'bar',
  'baz',
  'soon',
  'draft',
  'untitled',
  'yourrepo',
  'yourname',
  'username',
])

const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/
const SOURCE_COMMIT = /^[0-9a-f]{7,40}$/

function hasPlaceholderToken(url: URL): boolean {
  const surface = `${url.hostname}${url.pathname}${url.search}${url.hash}`.toLowerCase()
  return surface
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .some((token) => PLACEHOLDER_TOKENS.has(token))
}

/**
 * True only for a public https URL that actually points AT something: a real
 * registrable host and at least one path segment. A bare domain is a homepage,
 * not a receipt.
 */
export function isLiveProofUrl(url: string): boolean {
  const trimmed = url.trim()
  if (!trimmed.startsWith('https://')) return false

  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return false
  }

  if (parsed.protocol !== 'https:') return false
  // Credentials in a proof link mean it is not public.
  if (parsed.username || parsed.password) return false

  const host = parsed.hostname.toLowerCase()
  if (!host.includes('.') || host.endsWith('.')) return false
  if (IPV4.test(host)) return false
  if (!/\.[a-z]{2,}$/.test(host)) return false
  if (PLACEHOLDER_HOSTS.has(host)) return false
  if ([...PLACEHOLDER_HOSTS].some((placeholder) => host.endsWith(`.${placeholder}`))) return false

  const segments = parsed.pathname.split('/').filter(Boolean)
  if (segments.length === 0) return false

  return !hasPlaceholderToken(parsed)
}

/** A commit pin is a short-or-full lowercase hex SHA, or nothing at all. */
export function isValidSourceCommit(sha: string | undefined): boolean {
  return typeof sha === 'string' && SOURCE_COMMIT.test(sha.trim())
}

/**
 * The full gate. An item making a numeric claim must also pin the commit it
 * read those numbers from — an unpinned claim about someone else's repo is
 * exactly the thing that goes stale without anyone noticing.
 */
export function isLiveProofItem(item: ProofItem): boolean {
  if (!isLiveProofUrl(item.url)) return false
  if (item.stats.length > 0 && !isValidSourceCommit(item.sourceCommit)) return false
  return true
}

/**
 * Where a reader can see the exact tree the numbers came from. Only GitHub's
 * URL shape is known to us, so anything else renders the SHA as plain text.
 */
export function sourceCommitUrl(item: ProofItem): string | null {
  if (!isValidSourceCommit(item.sourceCommit)) return null
  let parsed: URL
  try {
    parsed = new URL(item.url.trim())
  } catch {
    return null
  }
  if (parsed.hostname.toLowerCase() !== 'github.com') return null
  return `${parsed.href.replace(/\/+$/, '')}/tree/${item.sourceCommit?.trim()}`
}

export function liveProofItems<T extends ProofItem>(items: readonly T[]): T[] {
  return items.filter((item) => isLiveProofItem(item))
}
