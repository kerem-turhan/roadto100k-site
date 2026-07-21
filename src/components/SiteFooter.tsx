import { config } from '@/config'
import rawLedger from '@/data/ledger.json'
import { parseLedger, trWeekEntries } from '@/lib/ledger'

// The Turkish summaries exist only for weeks that have one; without any,
// there is no /tr/ page to link to.
const hasTurkish = trWeekEntries(parseLedger(rawLedger)).length > 0

const LINKS: Array<{ label: string; href: string; external: boolean; lang?: string }> = [
  { label: 'X', href: config.X_URL, external: true },
  { label: 'GitHub', href: config.GITHUB_URL, external: true },
  { label: 'RSS', href: `${import.meta.env.BASE_URL}feed.xml`, external: false },
  ...(hasTurkish
    ? [{ label: 'Türkçe', href: `${import.meta.env.BASE_URL}tr/`, external: false, lang: 'tr' }]
    : []),
]

export function SiteFooter() {
  return (
    <footer className="border-t border-rule py-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-baseline">
        <p className="font-mono text-xs tracking-[0.2em] text-ink-muted uppercase">
          Kerem Turhan · Ankara, TR
        </p>
        <nav aria-label="Social links" className="flex gap-6">
          {LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              {...(link.external ? { target: '_blank', rel: 'noreferrer' } : {})}
              {...(link.lang ? { lang: link.lang, hrefLang: link.lang } : {})}
              className="-my-2 inline-block px-1 py-3.5 font-mono text-xs tracking-[0.2em] uppercase underline decoration-rule underline-offset-4 transition-colors hover:decoration-ledger-red"
            >
              {link.label}
              {link.external ? ' ↗' : ''}
            </a>
          ))}
        </nav>
      </div>
      <p className="mt-4 font-mono text-xs text-ink-muted">
        No cookies, no tracking, $0/mo hosting. Built in public.
      </p>
    </footer>
  )
}
