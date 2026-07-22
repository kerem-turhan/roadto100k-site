import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { config } from '@/config'
import { ProofSection } from './ProofSection'

const LIVE_ITEM = {
  title: 'Agent reliability teardown: example',
  description: 'Clean-room, reproducible teardown.',
  stats: ['2 fail-open paths', '4/6 → 6/6'],
  url: 'https://github.com/kerem-turhan/example-teardown',
} as const

describe('ProofSection', () => {
  it('renders nothing at all while no item has a live URL', () => {
    expect(renderToStaticMarkup(<ProofSection items={[{ ...LIVE_ITEM, url: '' }]} />)).toBe('')
    expect(
      renderToStaticMarkup(<ProofSection items={[{ ...LIVE_ITEM, url: 'TBD' }]} />),
    ).toBe('')
  })

  it('is live since the 22 Jul flip: the checked-in config renders the teardown', () => {
    const html = renderToStaticMarkup(<ProofSection />)

    expect(html).toContain('Proof of work')
    expect(html).toContain(config.PROOF_ITEMS[0].url)
  })

  it('renders the full section once a real URL exists', () => {
    const html = renderToStaticMarkup(<ProofSection items={[LIVE_ITEM]} contactEmail="a@b.c" />)

    expect(html).toContain('Proof of work')
    expect(html).toContain(`href="${LIVE_ITEM.url}"`)
    expect(html).toContain('Agent reliability teardown: example')
    expect(html).toContain('2 fail-open paths · 4/6 → 6/6')
    // the What-I-do card ships with the section, tied to the contact line
    expect(html).toContain('Reliability audit')
    expect(html).toContain('Eval harness setup')
    expect(html).toContain('href="mailto:a@b.c"')
    expect(html).not.toMatch(/\$\s?\d/) // no prices anywhere in the card
  })

  it('hides only the dead items when some are live', () => {
    const html = renderToStaticMarkup(
      <ProofSection items={[LIVE_ITEM, { ...LIVE_ITEM, title: 'Hidden one', url: '' }]} />,
    )
    expect(html).toContain('Agent reliability teardown: example')
    expect(html).not.toContain('Hidden one')
  })
})

describe('config.PROOF_ITEMS', () => {
  it('carries the flip-day teardown copy', () => {
    const [teardown] = config.PROOF_ITEMS
    expect(teardown.title).toContain('openai-agents-js')
    expect(teardown.description).toContain('4/6 → 6/6')
    // flipped public on 22 Jul 2026 — a real https URL, not a placeholder
    expect(teardown.url).toMatch(
      /^https:\/\/github\.com\/kerem-turhan\/agent-reliability-teardown-openai-agents-js$/,
    )
  })
})
