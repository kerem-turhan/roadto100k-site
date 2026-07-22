import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'

/*
 * `npm run build` prerenders this tree into dist/index.html (scripts/prerender.ts),
 * so whatever App renders on the server is what a crawler, a reader with
 * JavaScript off, and every link preview actually see. These assertions are
 * about the raw HTML, not about what hydration eventually produces.
 */
describe('the prerendered homepage', () => {
  const html = renderToString(<App />)

  it('ships the whole page as real markup, not an empty shell', () => {
    expect(html.length).toBeGreaterThan(5_000)
    for (const text of [
      'The rules',
      'The ledger',
      'Get the ledger by email',
      'Skip to the ledger',
    ]) {
      expect(html).toContain(text)
    }
  })

  it('ships the proof section and its commit pin', () => {
    expect(html).toContain('The work')
    expect(html).toContain('Receipts, not claims')
    expect(html).toContain('verified against commit')
    expect(html).toMatch(/href="https:\/\/github\.com\/[^"]+\/tree\/[0-9a-f]{7,40}"/)
  })

  it('ships the offer line that points at it', () => {
    expect(html).toContain('Open for agent-reliability work')
    expect(html).toContain('href="#work"')
  })
})

/*
 * The gate has to hold in prerendered HTML too. Hiding a section in the browser
 * while shipping it in the source would publish a claim to exactly the readers
 * who cannot see it being withdrawn.
 */
describe('the prerendered homepage with no live proof item', () => {
  afterEach(() => {
    vi.doUnmock('@/config')
    vi.resetModules()
  })

  it('contains no trace of the Work section', async () => {
    vi.resetModules()
    vi.doMock('@/config', async () => {
      const actual = await vi.importActual<typeof import('@/config')>('@/config')
      return { config: { ...actual.config, PROOF_ITEMS: [] } }
    })

    const { default: GatedApp } = await import('./App')
    const html = renderToString(<GatedApp />)

    expect(html).not.toContain('The work')
    expect(html).not.toContain('Receipts, not claims')
    expect(html).not.toContain('verified against commit')
    expect(html).not.toContain('What I do')
    expect(html).not.toContain('Reliability audit')
    // and no dead anchor left pointing at the section that is not there
    expect(html).not.toContain('href="#work"')
    expect(html).not.toContain('id="work"')

    // the rest of the page is untouched
    expect(html).toContain('The ledger')
    expect(html).toContain('Get the ledger by email')
  })
})
