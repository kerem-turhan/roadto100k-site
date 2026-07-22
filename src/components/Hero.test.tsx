import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Hero } from './Hero'

/*
 * The audit measured the offer at 63% scroll depth on a 375x812 screen, with
 * zero interactive elements in the hero: a visitor had to scroll 3.2 viewports
 * before anything said work was for sale. The hero now carries one quiet line
 * pointing at #work — and it must never point at a section the proof gate has
 * hidden, which is what these assertions hold in place.
 */
describe('Hero', () => {
  const html = renderToStaticMarkup(<Hero />)

  it('offers the work above the fold, once, pointing at #work', () => {
    expect(html).toContain('href="#work"')
    expect(html.match(/href="#work"/g)).toHaveLength(1)
    expect(html).toContain('Open for agent-reliability work')
  })

  it('keeps the headline readable as one sentence to a screen reader', () => {
    // <br/> contributes no whitespace to the accessible name, so without the
    // explicit space this read as "$100kby Dec 31, 2026."
    const text = html
      .replace(/<br\/?>/g, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&#x27;/g, "'")
    expect(text).toContain('$0 → $100k by Dec 31, 2026.')
  })
})
