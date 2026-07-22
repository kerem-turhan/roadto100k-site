import { describe, expect, it } from 'vitest'
import homepage from '../../index.html?raw'
import { FIXTURE_LEDGER, FIXTURE_META } from './fixtures.ts'
import { buildJournalPages } from './journal.ts'
import { buildTrPages } from './journalTr.ts'
import type { PageLang } from './pageShell.ts'
import { pageShell } from './pageShell.ts'

/*
 * The shell every generated page is poured into. journal.test.ts and
 * journalTr.test.ts cover what each page *says*; this covers what the shell
 * guarantees for all of them — language, canonical, share metadata, and the
 * theme control that a visitor landing on a shared /w/ link has to be able to
 * reach.
 */

const meta = { ...FIXTURE_META, hasTrPages: true }
const canonical = 'https://example.test/site/w/2026-07-26/'

function shell(overrides: Partial<Parameters<typeof pageShell>[0]> = {}): string {
  return pageShell({
    meta,
    lang: 'en',
    title: 'Week 1 — $150 revenue · Kerem — road to $100k',
    description: 'One week of the ledger.',
    canonical,
    jsonLd: { '@context': 'https://schema.org', '@id': canonical },
    body: '      <main></main>',
    ...overrides,
  })
}

/** The four page types the site publishes: week, archive, TR week, TR index. */
const published = [
  ...buildJournalPages(FIXTURE_LEDGER, meta),
  ...buildTrPages(FIXTURE_LEDGER, meta),
]

describe('pageShell head', () => {
  it('declares the page language', () => {
    expect(shell()).toContain('<html lang="en">')
    expect(shell({ lang: 'tr' })).toContain('<html lang="tr">')
    expect(published.map((page) => /<html lang="(\w+)">/.exec(page.html)?.[1])).toEqual([
      'en',
      'en',
      'en',
      'tr',
      'tr',
    ])
  })

  it('points canonical and og:url at the same URL', () => {
    const html = shell()
    expect(html).toContain(`<link rel="canonical" href="${canonical}" />`)
    expect(html).toContain(`<meta property="og:url" content="${canonical}" />`)
  })

  it('names the site and its locale on every published page', () => {
    for (const page of published) {
      expect(page.html).toContain('<meta property="og:site_name" content="Kerem — road to $100k" />')
      expect(page.html).toMatch(/<meta property="og:locale" content="(en_US|tr_TR)" \/>/)
    }
    expect(shell({ lang: 'tr' })).toContain('<meta property="og:locale" content="tr_TR" />')
    // The homepage is vite's own file, not this shell's — but a shared link
    // must not resolve to two different site names depending on which page it
    // was copied from.
    expect(homepage).toContain('<meta property="og:site_name" content="Kerem — road to $100k" />')
    expect(homepage).toContain('<meta property="og:locale" content="en_US" />')
  })

  it('falls back to the site-wide card and always declares its size', () => {
    const html = shell()
    expect(html).toContain(`<meta property="og:image" content="${FIXTURE_META.ogImage}" />`)
    expect(html).toContain('<meta property="og:image:width" content="1200" />')
    expect(html).toContain('<meta property="og:image:height" content="630" />')
    expect(shell({ ogImage: 'https://example.test/site/og/w/2026-07-26.png' })).toContain(
      '<meta name="twitter:image" content="https://example.test/site/og/w/2026-07-26.png" />',
    )
  })

  it('escapes every field it interpolates into the head', () => {
    const html = shell({ title: 'A "quoted" <title>', description: "it's & it isn't" })
    expect(html).toContain('<title>A &quot;quoted&quot; &lt;title&gt;</title>')
    expect(html).toContain('content="it&#39;s &amp; it isn&#39;t"')
    expect(html).not.toContain('<title>A "quoted"')
  })

  it('emits hreflang alternates in the order given', () => {
    const html = shell({
      alternates: [
        { hreflang: 'en', href: canonical },
        { hreflang: 'tr', href: 'https://example.test/site/tr/w/2026-07-26/' },
        { hreflang: 'x-default', href: canonical },
      ],
    })
    expect([...html.matchAll(/<link rel="alternate" hreflang="([\w-]+)"/g)].map((m) => m[1])).toEqual(
      ['en', 'tr', 'x-default'],
    )
    // No siblings, no tags — a lone page must not claim to have translations.
    expect(shell()).not.toContain('rel="alternate" hreflang=')
  })

  it('applies the stored theme before the first paint', () => {
    const html = shell()
    const script = html.indexOf("localStorage.getItem('theme')")
    expect(script).toBeGreaterThan(-1)
    expect(script).toBeLessThan(html.indexOf('<body>'))
    expect(html).toContain("window.matchMedia('(prefers-color-scheme: dark)')")
  })
})

/* -------------------------------------------------------------------------- */
/* Theme toggle                                                               */
/* -------------------------------------------------------------------------- */

/** The toggle's own script, i.e. the one inside the header. */
function toggleSource(html: string): string {
  const match = /<div class="header-end">[\s\S]*?<script>([\s\S]*?)<\/script>/.exec(html)
  if (!match) throw new Error('the header carries no toggle script')
  return match[1]
}

interface ToggleRun {
  type: string
  className: string
  label: () => string | undefined
  text: () => string
  isDark: () => boolean
  stored: () => string | undefined
  inHeader: boolean
  click: () => void
}

/**
 * Run the emitted script against the smallest DOM it actually touches. Tests
 * run in node, and a real DOM would be a dependency the $0 budget does not
 * have — but pattern-matching the source would only prove it was written, not
 * that it works. This runs the real string the browser gets.
 */
function runToggle(html: string, startDark: boolean): ToggleRun {
  const classes = new Set(startDark ? ['dark'] : [])
  const storage = new Map<string, string>()
  const listeners = new Map<string, () => void>()
  const button = {
    type: '',
    className: '',
    textContent: '',
    attributes: new Map<string, string>(),
    setAttribute(name: string, value: string) {
      this.attributes.set(name, value)
    },
    addEventListener(type: string, handler: () => void) {
      listeners.set(type, handler)
    },
  }
  const inserted: unknown[] = []
  const document = {
    currentScript: { parentNode: { insertBefore: (node: unknown) => inserted.push(node) } },
    documentElement: {
      classList: {
        contains: (name: string) => classes.has(name),
        toggle: (name: string, on: boolean) => (on ? classes.add(name) : classes.delete(name)),
      },
    },
    createElement: () => button,
  }
  const localStorage = { setItem: (key: string, value: string) => storage.set(key, value) }

  new Function('document', 'localStorage', toggleSource(html))(document, localStorage)

  return {
    type: button.type,
    className: button.className,
    label: () => button.attributes.get('aria-label'),
    text: () => button.textContent,
    isDark: () => classes.has('dark'),
    stored: () => storage.get('theme'),
    inHeader: inserted[0] === button,
    click: () => {
      const handler = listeners.get('click')
      if (!handler) throw new Error('the toggle registered no click handler')
      handler()
    },
  }
}

describe('theme toggle', () => {
  it('reaches every published page type', () => {
    for (const page of published) expect(() => toggleSource(page.html)).not.toThrow()
  })

  it('ships no control at all when JavaScript is off', () => {
    // A rendered <button> that nothing can wire up is worse than no button:
    // it invites a click that does nothing. The script writes its own control.
    for (const page of published) expect(page.html).not.toContain('<button')
    expect(runToggle(shell(), false).inHeader).toBe(true)
  })

  it('flips the theme, remembers it, and relabels itself', () => {
    const light = runToggle(shell(), false)
    expect(light.type).toBe('button')
    expect(light.text()).toBe('Dark')
    expect(light.label()).toBe('Switch to dark theme')
    light.click()
    expect(light.isDark()).toBe(true)
    expect(light.stored()).toBe('dark')
    expect(light.text()).toBe('Light')
    expect(light.label()).toBe('Switch to light theme')

    const dark = runToggle(shell(), true)
    expect(dark.text()).toBe('Light')
    dark.click()
    expect(dark.isDark()).toBe(false)
    expect(dark.stored()).toBe('light')
    expect(dark.label()).toBe('Switch to dark theme')
  })

  it('speaks Turkish on the Turkish pages', () => {
    const [trWeek] = buildTrPages(FIXTURE_LEDGER, meta)
    const toggle = runToggle(trWeek.html, false)
    expect(toggle.text()).toBe('Koyu')
    expect(toggle.label()).toBe('Koyu temaya geç')
    toggle.click()
    expect(toggle.text()).toBe('Açık')
    expect(toggle.label()).toBe('Açık temaya geç')
    // English copy under lang="tr" would be read aloud in Turkish.
    expect(toggleSource(trWeek.html)).not.toContain('Switch to')
  })

  it('is a 44px keyboard-operable target with a visible focus ring', () => {
    const html = shell()
    expect(runToggle(html, false).className).toBe('theme-toggle')
    expect(html).toContain('.theme-toggle{min-height:2.75rem')
    expect(html).toContain(':focus-visible{outline:2px solid var(--red)')
    // Radius stays inside the locked token rule: max 2px on interactive.
    expect(/\.theme-toggle\{[^}]*border-radius:2px/.test(html)).toBe(true)
  })
})

describe('page links', () => {
  const links = (html: string) =>
    [...html.matchAll(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)].map((match) => ({
      href: match[1],
      text: match[2].replaceAll(/<[^>]+>|&nbsp;|\s+/g, ' ').trim(),
    }))

  it('never sends the brand and the breadcrumb to the same page', () => {
    for (const page of published) {
      const chrome = [...page.html.matchAll(/class="(?:brand|crumb)" href="([^"]+)"/g)].map(
        (match) => match[1],
      )
      expect(new Set(chrome).size).toBe(chrome.length)
    }
  })

  it('never lists the same link twice with the same words', () => {
    // The brand and one footer entry do share a destination on every page —
    // a logo and a named nav item, which read differently in a link list. Two
    // *identical* links are the ones that make a screen-reader list useless.
    for (const page of published) {
      const seen = links(page.html).map((link) => `${link.text} → ${link.href}`)
      expect(new Set(seen).size).toBe(seen.length)
    }
  })

  it('gives every link somewhere to go and something to say', () => {
    for (const page of published) {
      for (const link of links(page.html)) {
        expect(link.href).not.toBe('')
        expect(link.href).not.toBe('#')
        expect(link.text.length).toBeGreaterThan(0)
      }
    }
  })
})

describe('page chrome', () => {
  it('resolves fonts and internal links through the site base path', () => {
    const html = shell()
    expect(html).toContain("url('/site/fonts/public-sans-latin.woff2')")
    expect(html).toContain('<a class="brand" href="/site/">')
    expect(html).toContain('href="/site/favicon.svg"')
  })

  it('carries the right feed for its language', () => {
    expect(shell()).toContain('href="https://example.test/site/feed.xml"')
    const tr = shell({ lang: 'tr' as PageLang })
    expect(tr).toContain('href="https://example.test/site/tr/feed.xml"')
    expect(tr).not.toContain('"https://example.test/site/feed.xml"')
  })

  it('is byte-identical for identical input', () => {
    expect(shell()).toBe(shell())
  })
})

/*
 * The shell is what redistributes the fonts: it serves eight .woff2 files from
 * public/fonts to every visitor. OFL-1.1 §2 lets it do that only with the
 * copyright notice and licence alongside, so the notice is part of the shell's
 * contract, not a paperwork detail.
 */
describe('font licensing', () => {
  const licenses = import.meta.glob<string>('../../public/fonts/OFL-*.txt', {
    eager: true,
    query: '?raw',
    import: 'default',
  })
  const faces = import.meta.glob('../../public/fonts/*.woff2')
  const name = (path: string) => path.slice(path.lastIndexOf('/') + 1)

  it('ships the OFL notice for every font family it serves', () => {
    const covered = Object.keys(licenses).map((path) => name(path).replace(/^OFL-|\.txt$/g, ''))
    expect(covered.length).toBeGreaterThan(0)
    const served = Object.keys(faces).map(name)
    expect(served.length).toBe(8)
    for (const face of served) {
      expect(covered.some((family) => face.startsWith(`${family}-`))).toBe(true)
    }
  })

  it('keeps the copyright line the licence is worthless without', () => {
    for (const [path, text] of Object.entries(licenses)) {
      expect(text, path).toContain('SIL OPEN FONT LICENSE Version 1.1')
      expect(text, path).toMatch(/^Copyright \d{4} /)
      expect(text, path).toContain('PERMISSION & CONDITIONS')
    }
  })
})
