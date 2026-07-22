import { Building } from '@/components/Building'
import { Hero } from '@/components/Hero'
import { LedgerSection } from '@/components/LedgerSection'
import { ProofSection } from '@/components/ProofSection'
import { Rules } from '@/components/Rules'
import { Signup } from '@/components/Signup'
import { SiteFooter } from '@/components/SiteFooter'
import { ThemeToggle } from '@/components/ThemeToggle'
import { config } from '@/config'
import { brandParts } from '@/lib/brand'

const brand = brandParts(config.SITE_NAME)

function App() {
  return (
    <div className="relative mx-auto min-h-dvh max-w-3xl px-6 sm:px-12 md:px-16">
      {/* The ledger's red margin rule: a classic double line down the left edge. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-2 w-[3px] border-x border-ledger-red/70 bg-ledger-red/[0.04] sm:left-4"
      />
      <a
        href="#ledger"
        className="sr-only rounded-sm border border-rule bg-paper px-4 py-2 font-mono text-xs tracking-[0.18em] uppercase focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50"
      >
        Skip to the ledger
      </a>
      <header className="flex items-center justify-between pt-6">
        <p className="font-mono text-xs tracking-[0.25em] text-ink-muted uppercase">
          {brand.before}
          <span className="text-ledger-red">{brand.accent}</span>
          {brand.after}
        </p>
        <ThemeToggle />
      </header>
      <main>
        <Hero />
        <Rules />
        <LedgerSection />
        <Building />
        <ProofSection />
        <Signup />
      </main>
      <SiteFooter />
    </div>
  )
}

export default App
