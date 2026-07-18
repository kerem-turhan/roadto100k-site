import { config } from '@/config'

const LINKS = [
  { label: 'X', href: config.X_URL },
  { label: 'GitHub', href: config.GITHUB_URL },
] as const

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
              target="_blank"
              rel="noreferrer"
              className="inline-block py-2 font-mono text-xs tracking-[0.2em] uppercase underline decoration-rule underline-offset-4 transition-colors hover:decoration-ledger-red"
            >
              {link.label} ↗
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
