import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { config } from '@/config'
import { Signup } from './Signup'

describe('Signup', () => {
  it('renders the complete Buttondown embed contract from config', () => {
    const html = renderToStaticMarkup(<Signup />)

    expect(html).toContain(`action="${config.BUTTONDOWN_URL}"`)
    expect(html).toContain('method="post"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('<label for="signup-email"')
    expect(html).toContain('type="email"')
    expect(html).toContain('name="email"')
    expect(html).toContain('required=""')
    expect(html).toContain('type="hidden"')
    expect(html).toContain('name="embed"')
    expect(html).toContain('value="1"')
    expect(html).toContain('type="submit"')
  })

  it('preserves the X fallback while the Buttondown action is empty', () => {
    const html = renderToStaticMarkup(<Signup buttondownUrl="" xUrl="https://x.com/test" />)

    expect(html).not.toContain('<form')
    expect(html).toContain('href="https://x.com/test"')
    expect(html).toContain('Follow along on X')
  })
})
