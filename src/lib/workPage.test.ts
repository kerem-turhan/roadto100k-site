import { describe, expect, it } from 'vitest'
import { config } from '@/config'
import { FIXTURE_META } from './fixtures.ts'
import type { ProofItem } from './proof.ts'
import { buildWorkPage } from './workPage.ts'

const META = { ...FIXTURE_META, contactEmail: 'hire@example.test' }

const LIVE_ITEM: ProofItem = {
  title: 'Agent reliability teardown: a real orchestration failure',
  description: 'Clean-room, reproducible teardown.',
  stats: ['2 fail-open paths', '4/6 → 6/6'],
  url: 'https://github.com/kerem-turhan/some-teardown',
  sourceCommit: 'abc1234',
}

const page = buildWorkPage({ meta: META, items: [LIVE_ITEM] })

describe('buildWorkPage', () => {
  it('lives at a permanent, indexable URL', () => {
    expect(page?.path).toBe('work/index.html')
    expect(page?.html).toContain('<link rel="canonical" href="https://example.test/site/work/" />')
  })

  it('leads with the positioning, not with a form', () => {
    expect(page?.html).toContain('I make AI agents fail closed.')
    expect(page?.html).toContain('When a check can’t look, it has to say no.')
  })

  it('says what can be bought, in three concrete pieces', () => {
    for (const name of ['Reliability audit', 'Eval harness setup', 'Ongoing reliability support']) {
      expect(page?.html).toContain(name)
    }
  })

  /* "I did this; I would do the same for your agent" only works with the receipt attached. */
  it('puts the proof beside the offer, pinned to the tree it was read from', () => {
    expect(page?.html).toContain(`href="${LIVE_ITEM.url}"`)
    expect(page?.html).toContain('2 fail-open paths · 4/6 → 6/6')
    expect(page?.html).toContain('verified against commit')
    expect(page?.html).toContain(`href="${LIVE_ITEM.url}/tree/abc1234"`)
  })

  it('offers one way in, and no questionnaire', () => {
    expect(page?.html).toContain('href="mailto:hire@example.test"')
    expect(page?.html).not.toContain('<form')
  })

  it('quotes no price', () => {
    // Prices are Kerem's call and are not published. Scoped to <main>: the
    // footer's "$0 weeks" and the $100k brand figure are goals, not rates.
    const html = page?.html ?? ''
    const body = html.slice(html.indexOf('<main>'), html.indexOf('</main>'))
    expect(body.length).toBeGreaterThan(500)
    expect(body).not.toMatch(/\$\s?\d/)
  })

  it('sends the reader to the series when they are not hiring yet', () => {
    expect(page?.html).toContain('href="/site/silent-green/"')
  })
})

/*
 * The gate. A service page is a claim to competence; the receipt is what makes
 * it something other than a claim. With nothing live, the page is not written at
 * all — so there is nothing for the sitemap or the footer to point at either.
 */
describe('buildWorkPage without a live receipt', () => {
  it.each([
    ['an empty list', [] as ProofItem[]],
    ['a placeholder URL', [{ ...LIVE_ITEM, url: 'https://example.com/soon' }]],
    ['no URL at all', [{ ...LIVE_ITEM, url: '' }]],
    ['a TODO link', [{ ...LIVE_ITEM, url: 'https://github.com/me/TODO' }]],
    ['numbers with no commit pin', [{ ...LIVE_ITEM, sourceCommit: undefined }]],
  ])('builds nothing from %s', (_label, items) => {
    expect(buildWorkPage({ meta: META, items })).toBeNull()
  })
})

describe('the shipped work page', () => {
  it('is live, because a shipped proof item passes the gate', () => {
    const shipped = buildWorkPage({ meta: META, items: config.PROOF_ITEMS })
    expect(shipped).not.toBeNull()
    expect(shipped?.html).toMatch(/href="https:\/\/github\.com\/[^"]+\/tree\/[0-9a-f]{7,40}"/)
  })
})
