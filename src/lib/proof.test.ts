import { describe, expect, it } from 'vitest'
import { config } from '@/config'
import {
  isLiveProofItem,
  isLiveProofUrl,
  isValidSourceCommit,
  liveProofItems,
  sourceCommitUrl,
} from './proof.ts'

const REAL = 'https://github.com/kerem-turhan/agent-reliability-teardown-openai-agents-js'
const SHA = 'e4076e2'

const item = (url: string, over: Record<string, unknown> = {}) => ({
  title: 't',
  description: 'd',
  stats: [] as readonly string[],
  url,
  ...over,
})

describe('isLiveProofUrl', () => {
  it('accepts a real, public, deep https URL', () => {
    expect(isLiveProofUrl(REAL)).toBe(true)
    expect(isLiveProofUrl(`  ${REAL}  `)).toBe(true)
    expect(isLiveProofUrl('https://kerem-turhan.github.io/some-writeup/')).toBe(true)
    expect(isLiveProofUrl('https://sub.domain.co.uk/a/b?c=1#d')).toBe(true)
  })

  // Table of everything a half-finished config has ever looked like. Each of
  // these once passed the prefix-only check and would have shipped a dead link.
  const rejected: Array<[string, string]> = [
    ['empty', ''],
    ['whitespace', '   '],
    ['bare word', 'TBD'],
    ['prose', 'coming soon'],
    ['hash only', '#'],
    ['relative path', '/work/teardown'],
    ['scheme-relative', '//github.com/me/repo'],
    ['http, not https', 'http://github.com/me/repo'],
    ['ftp', 'ftp://github.com/me/repo'],
    ['no scheme', 'github.com/me/repo'],
    ['mailto', 'mailto:someone@example.org'],
    ['javascript', 'javascript:void(0)'],
    ['placeholder host', 'https://example.com/teardown'],
    ['placeholder subdomain', 'https://docs.example.com/teardown'],
    ['placeholder path', 'https://github.com/kerem-turhan/TODO'],
    ['placeholder deep in path', 'https://github.com/me/repo/tree/WIP'],
    ['placeholder in query', 'https://github.com/me/repo?ref=FIXME'],
    ['placeholder in fragment', 'https://github.com/me/repo#tbd'],
    ['bare domain, no path', 'https://github.com'],
    ['bare domain with slash', 'https://github.com/'],
    ['localhost', 'https://localhost/teardown'],
    ['loopback ip', 'https://127.0.0.1/teardown'],
    ['raw ip', 'https://192.168.1.10/teardown'],
    ['no tld', 'https://intranet/teardown'],
    ['credentials in url', 'https://user:pw@github.com/me/repo'],
    ['malformed', 'https://'],
  ]

  it.each(rejected)('rejects %s', (_label, url) => {
    expect(isLiveProofUrl(url)).toBe(false)
  })
})

describe('isValidSourceCommit', () => {
  it('accepts short and full lowercase hex SHAs', () => {
    expect(isValidSourceCommit('e4076e2')).toBe(true)
    expect(isValidSourceCommit('e4076e2e7988a76f95df62f87e8deb2536c01131')).toBe(true)
  })

  it('rejects anything that is not one', () => {
    for (const bad of [undefined, '', 'main', 'HEAD', 'e4076', 'E4076E2', 'zzzzzzz', 'v1.0.0']) {
      expect(isValidSourceCommit(bad)).toBe(false)
    }
  })
})

describe('isLiveProofItem', () => {
  it('requires a commit pin whenever the item makes a numeric claim', () => {
    const claim = { stats: ['4/6 → 6/6'] }
    expect(isLiveProofItem(item(REAL, { ...claim, sourceCommit: SHA }))).toBe(true)
    expect(isLiveProofItem(item(REAL, claim))).toBe(false)
    expect(isLiveProofItem(item(REAL, { ...claim, sourceCommit: 'main' }))).toBe(false)
  })

  it('lets a claim-free item through without a pin', () => {
    expect(isLiveProofItem(item(REAL))).toBe(true)
  })

  it('never lets a bad URL through, pinned or not', () => {
    expect(isLiveProofItem(item('https://example.com/x', { sourceCommit: SHA }))).toBe(false)
  })
})

describe('sourceCommitUrl', () => {
  it('points at the exact tree the numbers came from', () => {
    expect(sourceCommitUrl(item(REAL, { sourceCommit: SHA }))).toBe(`${REAL}/tree/${SHA}`)
  })

  it('returns nothing when there is no pin or the host is not GitHub', () => {
    expect(sourceCommitUrl(item(REAL))).toBeNull()
    expect(sourceCommitUrl(item('https://kerem-turhan.github.io/x/', { sourceCommit: SHA }))).toBeNull()
  })
})

describe('liveProofItems', () => {
  it('filters out every item the gate rejects', () => {
    const live = item(REAL)
    expect(liveProofItems([item(''), live, item('https://example.com/x')])).toEqual([live])
  })

  it('returns an empty list when nothing is live — the section must vanish', () => {
    expect(liveProofItems([item(''), item('WIP'), item('https://github.com/me/repo/tree/TODO')])).toEqual(
      [],
    )
  })
})

/*
 * The shipped config, checked against independent criteria rather than against
 * itself. `expect(url).toBe(config.url)` is a tautology — it passes for any
 * value, including a placeholder. These assertions do not read the config to
 * decide what is correct.
 */
describe('every shipped config.PROOF_ITEMS entry', () => {
  it('has at least one entry to check', () => {
    expect(config.PROOF_ITEMS.length).toBeGreaterThan(0)
  })

  it.each(config.PROOF_ITEMS.map((entry, i) => [i, entry] as const))(
    'entry %i passes the gate on its own merits',
    (_i, entry) => {
      expect(isLiveProofItem(entry)).toBe(true)

      const url = new URL(entry.url)
      expect(url.protocol).toBe('https:')
      expect(url.hostname).toMatch(/^[a-z0-9-]+(\.[a-z0-9-]+)+$/)
      expect(url.pathname.split('/').filter(Boolean).length).toBeGreaterThan(0)
      expect(entry.url).not.toMatch(/todo|tbd|wip|example|placeholder|fixme/i)

      expect(entry.title.trim().length).toBeGreaterThan(10)
      expect(entry.description.trim().length).toBeGreaterThan(20)

      // A numeric claim without a pinned commit is exactly the drift we are
      // guarding against.
      if (entry.stats.length > 0) {
        expect(isValidSourceCommit(entry.sourceCommit)).toBe(true)
      }
    },
  )
})
