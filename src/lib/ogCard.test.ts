import { describe, expect, it } from 'vitest'
import { FIXTURE_LEDGER } from './fixtures.ts'
import { OG_HEIGHT, OG_WIDTH, weekOgCards, weekOgHtml } from './ogCard.ts'

const subsets = (tag: string) => ({ latin: `data:latin-${tag}`, ext: `data:ext-${tag}` })
const fonts = { display: subsets('display'), mono: subsets('mono'), body: subsets('body') }
const card = weekOgHtml({ ledger: FIXTURE_LEDGER, index: 1, fonts })

describe('weekOgHtml', () => {
  it('renders at the share-card size', () => {
    expect(OG_WIDTH).toBe(1200)
    expect(OG_HEIGHT).toBe(630)
    expect(card).toContain('width: 1200px; height: 630px')
  })

  it('carries the real numbers of that week', () => {
    expect(card).toContain('Week 1')
    expect(card).toContain('Week ending Jul 26, 2026 · day 7 of 165')
    expect(card).toContain('$150') // revenue
    expect(card).toContain('$50') // mrr
    expect(card).toContain('$20') // spend
    expect(card).toContain('>12<') // email subs
    expect(card).toContain('$150 of $100,000')
  })

  it('paints revenue green only when there is revenue', () => {
    expect(card).toContain('class="value green"')
    expect(weekOgHtml({ ledger: FIXTURE_LEDGER, index: 0, fonts })).not.toContain(
      'class="value green"',
    )
  })

  it('escapes the note instead of letting it break the markup', () => {
    expect(card).toContain('&lt;angles&gt;')
    expect(card).not.toContain('<angles>')
  })

  it('embeds both subsets of every face it was given', () => {
    for (const face of [fonts.display, fonts.mono, fonts.body]) {
      expect(card).toContain(`url('${face.latin}')`)
      expect(card).toContain(`url('${face.ext}')`)
    }
    // The ext file is what carries İ, Ş and Ğ for the Turkish card.
    expect(card).toContain('U+0100-02BA')
  })

  it('is deterministic — no clocks, no randomness', () => {
    expect(weekOgHtml({ ledger: FIXTURE_LEDGER, index: 1, fonts })).toBe(card)
  })
})

describe('weekOgCards', () => {
  it('produces an English card for every week', () => {
    const english = weekOgCards(FIXTURE_LEDGER, fonts).filter((c) => c.lang === 'en')
    expect(english.map((c) => c.weekEnding)).toEqual(['2026-07-19', '2026-07-26'])
    expect(english[1].html).toBe(card)
  })
})

describe('the Turkish card', () => {
  const tr = weekOgHtml({ ledger: FIXTURE_LEDGER, index: 1, fonts, lang: 'tr' })

  it('is built from the Turkish note and Turkish labels', () => {
    expect(tr).toContain('<html lang="tr">')
    expect(tr).toContain('Hafta 1')
    expect(tr).toContain('26 Temmuz 2026 haftası · gün 7/165')
    expect(tr).toContain('Gelir (hafta)')
    expect(tr).toContain('Aboneler')
    expect(tr).toContain('Türkçe özet: &lt;açı&gt;')
    expect(tr).not.toContain('Week ending')
    expect(tr).not.toContain('Email subs')
  })

  it('keeps the same real numbers as the English card', () => {
    expect(tr).toContain('$150')
    expect(tr).toContain('$100,000')
  })
})

describe('weekOgCards with Turkish notes', () => {
  it('adds a Turkish card only for the weeks that have one', () => {
    const cards = weekOgCards(FIXTURE_LEDGER, fonts)
    expect(cards.map((c) => `${c.lang}:${c.weekEnding}`)).toEqual([
      'en:2026-07-19',
      'en:2026-07-26',
      'tr:2026-07-26',
    ])
  })
})
