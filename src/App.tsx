import { Building } from '@/components/Building'
import { Hero } from '@/components/Hero'
import { LedgerSection } from '@/components/LedgerSection'
import { Rules } from '@/components/Rules'
import { Signup } from '@/components/Signup'
import { SiteFooter } from '@/components/SiteFooter'
import { ThemeToggle } from '@/components/ThemeToggle'

function App() {
  return (
    <div className="relative mx-auto min-h-dvh max-w-3xl px-6 sm:px-12 md:px-16">
      {/* The ledger's red margin rule: a classic double line down the left edge. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-2 w-[3px] border-x border-ledger-red/50 sm:left-4"
      />
      <header className="flex items-center justify-between pt-6">
        <p className="font-mono text-xs tracking-[0.25em] text-ink-muted uppercase">
          roadto100k<span className="text-ledger-red">w</span>kerem
        </p>
        <ThemeToggle />
      </header>
      <main>
        <Hero />
        <Rules />
        <LedgerSection />
        <Building />
        <Signup />
      </main>
      <SiteFooter />
    </div>
  )
}

export default App
