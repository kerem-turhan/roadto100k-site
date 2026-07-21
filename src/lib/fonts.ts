/*
 * Font subsets shared by the generated pages and the share cards.
 *
 * Each family ships two files. The latin subset lacks the Turkish letters
 * İ, Ş and Ğ, so a latin-ext face is declared alongside it, scoped by
 * `unicode-range` — the browser fetches the ext file only for pages that
 * actually contain those glyphs. A single @font-face with two `src` entries
 * would NOT work: `src` is a fallback list, not a union of coverage.
 */

export const LATIN_RANGE =
  'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,' +
  'U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'

export const LATIN_EXT_RANGE =
  'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,' +
  'U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,' +
  'U+A720-A7FF'

export interface FontSubsets {
  /** CSS source URL of the latin subset. */
  latin: string
  /** CSS source URL of the latin-ext subset. */
  ext: string
}

export interface FontFaceOptions {
  family: string
  /** `400`, `500`, or a variable range like `200 800`. */
  weight: string
  format: 'woff2' | 'woff2-variations'
  src: FontSubsets
  /** `swap` for pages, `block` for share cards (a screenshot cannot re-flow). */
  display: 'swap' | 'block'
}

/** The latin + latin-ext @font-face pair for one family/weight. */
export function fontFaceCss({ family, weight, format, src, display }: FontFaceOptions): string {
  const face = (url: string, range: string) =>
    `@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};` +
    `font-display:${display};src:url('${url}') format('${format}');unicode-range:${range}}`
  return `${face(src.latin, LATIN_RANGE)}\n${face(src.ext, LATIN_EXT_RANGE)}`
}
