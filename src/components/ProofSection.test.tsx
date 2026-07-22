import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { config } from '@/config'
import { ProofSection } from './ProofSection'

const LIVE_ITEM = {
  title: 'Agent reliability teardown: a real orchestration failure',
  description: 'Clean-room, reproducible teardown.',
  stats: ['2 fail-open paths', '4/6 → 6/6'],
  url: 'https://github.com/kerem-turhan/some-teardown',
  sourceCommit: 'abc1234',
} as const

describe('ProofSection', () => {
  it('renders nothing at all while no item passes the gate', () => {
    for (const url of ['', 'TBD', 'http://github.com/me/repo', 'https://example.com/x']) {
      expect(renderToStaticMarkup(<ProofSection items={[{ ...LIVE_ITEM, url }]} />)).toBe('')
    }
  })

  it('renders nothing when an item claims numbers without pinning a commit', () => {
    const { sourceCommit: _sourceCommit, ...unpinned } = LIVE_ITEM
    expect(renderToStaticMarkup(<ProofSection items={[unpinned]} />)).toBe('')
  })

  it('renders the full section once a real, pinned URL exists', () => {
    const html = renderToStaticMarkup(<ProofSection items={[LIVE_ITEM]} contactEmail="a@b.c" />)

    expect(html).toContain('Proof of work')
    expect(html).toContain(`href="${LIVE_ITEM.url}"`)
    expect(html).toContain('Agent reliability teardown: a real orchestration failure')
    expect(html).toContain('2 fail-open paths · 4/6 → 6/6')
    // the What-I-do card ships with the section, tied to the contact line
    expect(html).toContain('Reliability audit')
    expect(html).toContain('Eval harness setup')
    expect(html).toContain('href="mailto:a@b.c"')
    expect(html).not.toMatch(/\$\s?\d/) // no prices anywhere in the card
  })

  it('shows the reader the exact tree the numbers came from', () => {
    const html = renderToStaticMarkup(<ProofSection items={[LIVE_ITEM]} />)

    expect(html).toContain('verified against commit')
    expect(html).toContain(`href="${LIVE_ITEM.url}/tree/${LIVE_ITEM.sourceCommit}"`)
    expect(html).toContain(LIVE_ITEM.sourceCommit)
  })

  it('hides only the dead items when some are live', () => {
    const html = renderToStaticMarkup(
      <ProofSection items={[LIVE_ITEM, { ...LIVE_ITEM, title: 'Hidden one', url: '' }]} />,
    )
    expect(html).toContain('Agent reliability teardown: a real orchestration failure')
    expect(html).not.toContain('Hidden one')
  })
})

/*
 * What the shipped config renders — asserted against independent facts, not
 * against the config's own values. `toContain(config.PROOF_ITEMS[0].url)` would
 * pass for a placeholder too; it only proves the component read the same object
 * the test did. src/lib/proof.test.ts checks the entries themselves.
 */
describe('the shipped Work section', () => {
  const html = renderToStaticMarkup(<ProofSection />)

  it('is live and links out to a public repo', () => {
    expect(html).toContain('Proof of work')
    expect(html).toMatch(/href="https:\/\/github\.com\/[^"]+\/[^"]+"/)
    expect(html).not.toMatch(/href="(#|)"/)
  })

  it('pins every numeric claim it makes to a commit', () => {
    const claims = config.PROOF_ITEMS.filter((entry) => entry.stats.length > 0)
    expect(claims.length).toBeGreaterThan(0)
    const pins = html.match(/verified against commit/g) ?? []
    expect(pins).toHaveLength(claims.length)
    expect(html).toMatch(/\/tree\/[0-9a-f]{7,40}"/)
  })

  it('never ships a placeholder link', () => {
    expect(html).not.toMatch(/href="[^"]*(todo|tbd|wip|example\.com|placeholder)[^"]*"/i)
  })
})

/* Literal expectations, so a silent edit to the shipped copy shows up as red. */
describe('config.PROOF_ITEMS', () => {
  it('carries the flip-day teardown copy, pinned to a commit', () => {
    const [teardown] = config.PROOF_ITEMS
    expect(teardown.title).toContain('openai-agents-js')
    expect(teardown.description).toContain('4/6 → 6/6')
    expect(teardown.url).toMatch(
      /^https:\/\/github\.com\/kerem-turhan\/agent-reliability-teardown-openai-agents-js$/,
    )
    expect(teardown.sourceCommit).toMatch(/^[0-9a-f]{7,40}$/)
  })
})
