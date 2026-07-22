import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { config } from '@/config'
import { Signup } from './Signup'

/*
 * The signup form is the site's only conversion surface, and it is submitted by
 * the browser straight to Buttondown — there is no code path of ours that would
 * notice if a refactor renamed a field or dropped a hidden input. It also
 * cannot be tested end to end: a real POST creates a real subscriber and
 * inflates the number this site publishes. So these assertions are the whole
 * safety net, and they are written as literals rather than read back from the
 * component's own config: `toContain(config.BUTTONDOWN_URL)` passes for any
 * value, including a broken one.
 */
describe('Signup', () => {
  const html = renderToStaticMarkup(<Signup />)

  it('posts to a real Buttondown embed endpoint', () => {
    expect(config.BUTTONDOWN_URL).toMatch(
      /^https:\/\/buttondown\.com\/api\/emails\/embed-subscribe\/[A-Za-z0-9_-]+$/,
    )
    expect(html).toContain(`action="${config.BUTTONDOWN_URL}"`)
    expect(html).toContain('method="post"')
    expect(html).toContain('target="_blank"')
  })

  it('sends exactly the fields Buttondown expects', () => {
    // Attribute order is React's business, so match the tag then its contents.
    const emailInput = html.match(/<input[^>]*id="signup-email"[^>]*>/)?.[0] ?? ''
    expect(emailInput).toContain('type="email"')
    expect(emailInput).toContain('name="email"')
    expect(emailInput).toContain('required=""')

    expect(html).toMatch(/<input type="hidden" name="embed" value="1"\/?>/)
    expect(html).toContain('<label for="signup-email"')
    expect(html).toContain('type="submit"')
  })

  it('tells the visitor where the confirmation goes', () => {
    // target="_blank" puts success and failure in a popup. Without this line a
    // blocked popup looks exactly like a broken button.
    expect(html).toContain('aria-live="polite"')
    expect(html).toMatch(/Confirmation opens in a new tab/)
  })

  it('preserves the X fallback while the Buttondown action is empty', () => {
    const fallback = renderToStaticMarkup(<Signup buttondownUrl="" xUrl="https://x.com/test" />)

    expect(fallback).not.toContain('<form')
    expect(fallback).toContain('href="https://x.com/test"')
    expect(fallback).toContain('Follow along on X')
  })
})
