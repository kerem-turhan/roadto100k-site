import { describe, expect, it } from 'vitest'
import { LATIN_EXT_RANGE, LATIN_RANGE, fontFaceCss } from './fonts.ts'

describe('fontFaceCss', () => {
  const css = fontFaceCss({
    family: 'IBM Plex Mono',
    weight: '500',
    format: 'woff2',
    src: { latin: '/fonts/mono.woff2', ext: '/fonts/mono-ext.woff2' },
    display: 'swap',
  })

  it('emits two faces — one per subset — never one face with two sources', () => {
    // `src` is a fallback list, so a single face would only ever load the
    // latin file and leave İ, Ş and Ğ to a system font.
    expect(css.match(/@font-face/g)).toHaveLength(2)
    expect(css).toContain(`url('/fonts/mono.woff2') format('woff2');unicode-range:${LATIN_RANGE}`)
    expect(css).toContain(
      `url('/fonts/mono-ext.woff2') format('woff2');unicode-range:${LATIN_EXT_RANGE}`,
    )
  })

  it('covers the Turkish letters the latin subset lacks', () => {
    // İ U+0130, Ş U+015E, Ğ U+011E all sit inside U+0100-02BA.
    expect(LATIN_EXT_RANGE).toContain('U+0100-02BA')
    expect(LATIN_RANGE).not.toContain('U+0100-02BA')
    // ı U+0131 is in the latin subset and must not be duplicated.
    expect(LATIN_RANGE).toContain('U+0131')
  })

  it('carries the requested weight and display strategy', () => {
    expect(css).toContain('font-weight:500')
    expect(css).toContain('font-display:swap')
    const card = fontFaceCss({
      family: 'X',
      weight: '200 800',
      format: 'woff2-variations',
      src: { latin: 'a', ext: 'b' },
      display: 'block',
    })
    expect(card).toContain('font-display:block')
    expect(card).toContain("format('woff2-variations')")
  })
})
