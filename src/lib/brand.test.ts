import { describe, expect, it } from 'vitest'
import { config } from '@/config'
import { brandMarkup, brandParts } from './brand.ts'

const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;')

describe('brandParts', () => {
  it('accents the goal figure and nothing else', () => {
    expect(brandParts('Kerem — road to $100k')).toEqual({
      before: 'Kerem — road to ',
      accent: '$100k',
      after: '',
    })
    expect(brandParts('$100k or bust')).toEqual({ before: '', accent: '$100k', after: ' or bust' })
  })

  it('leaves a name with no figure whole rather than inventing an accent', () => {
    expect(brandParts('Kerem')).toEqual({ before: 'Kerem', accent: '', after: '' })
  })

  it('reassembles into exactly the name it was given', () => {
    for (const name of ['Kerem — road to $100k', 'Kerem', '$1 start', 'a $12,500 goal here']) {
      const { before, accent, after } = brandParts(name)
      expect(before + accent + after).toBe(name)
    }
  })
})

describe('brandMarkup', () => {
  it('wraps only the accent, and escapes what it is given', () => {
    expect(brandMarkup('Kerem — road to $100k', escape)).toBe(
      'Kerem — road to <span class="red">$100k</span>',
    )
    expect(brandMarkup('<script> $1k', escape)).toBe('&lt;script> <span class="red">$1k</span>')
  })

  it('emits no empty span for a name without a figure', () => {
    expect(brandMarkup('Kerem', escape)).toBe('Kerem')
  })
})

/*
 * The wordmark used to be typed out in three places — the app header, the page
 * shell and the share card — while config.SITE_NAME claimed to be the single
 * source. Renaming the brand meant finding all four by grep; one missed copy
 * would have shipped a stale name on the surface people screenshot.
 */
describe('the shipped brand', () => {
  it('is the name a visitor arriving from X already saw', () => {
    expect(config.SITE_NAME).toBe('Kerem — road to $100k')
  })

  it('has an accent for the wordmark to hang on', () => {
    expect(brandParts(config.SITE_NAME).accent).toBe('$100k')
  })
})
