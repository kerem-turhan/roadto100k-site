import { describe, expect, it } from 'vitest'
import { injectPrerenderedHtml } from './prerender.ts'

const shell = '<html><body><div id="root"></div><script src="/x.js"></script></body></html>'

describe('injectPrerenderedHtml', () => {
  it('fills the mount point and leaves the rest of the document alone', () => {
    const out = injectPrerenderedHtml(shell, '<main>hello</main>')
    expect(out).toContain('<div id="root"><main>hello</main></div>')
    expect(out).toContain('<script src="/x.js">')
  })

  /*
   * Both failure modes ship a page that looks perfect in a browser with
   * JavaScript and is blank to a crawler, a preview bot, or a reader without
   * it — the exact class of bug this whole session has been closing. So they
   * fail the build instead of passing quietly.
   */
  it('throws when the mount point is gone rather than shipping an empty shell', () => {
    expect(() => injectPrerenderedHtml('<html><body></body></html>', '<main>x</main>')).toThrow(
      /no <div id="root"><\/div> to fill/,
    )
  })

  it('throws when the app rendered to nothing', () => {
    expect(() => injectPrerenderedHtml(shell, '   ')).toThrow(/empty string/)
  })

  it('is a pure substitution — same inputs, same bytes', () => {
    expect(injectPrerenderedHtml(shell, '<p>a</p>')).toBe(injectPrerenderedHtml(shell, '<p>a</p>'))
  })
})
