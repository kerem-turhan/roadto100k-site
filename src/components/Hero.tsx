import { DayStamp } from '@/components/DayStamp'

/**
 * Entrances are CSS keyframes (hero-rise-*): they run off the compositor, so
 * a throttled or stalled JS thread can never hold the fold at opacity 0.
 */
export function Hero() {
  return (
    <section aria-label="Intro" className="relative pt-[4.125rem] pb-20 md:pt-[6.875rem] md:pb-28">
      {/* Ruled ledger paper on the baseline grid, fading out toward the bottom. */}
      <div
        aria-hidden
        className="ledger-lines-baseline pointer-events-none absolute inset-0 opacity-50 [mask-image:linear-gradient(to_bottom,black_55%,transparent_95%)]"
      />
      <div className="relative">
        <p className="hero-rise hero-rise-1 mb-[1.375rem] font-mono text-xs tracking-[0.25em] text-ink-muted uppercase">
          A public ledger — Ankara, TR
        </p>
        <h1 className="hero-rise hero-rise-2 font-display text-[clamp(2.9rem,10vw,6rem)] leading-[0.98] font-extrabold tracking-tight text-balance">
          $0 <span className="text-ledger-red">→</span> $100k
          <br />
          <span className="font-semibold text-ink-muted">by Dec 31, 2026.</span>
        </h1>
        <p className="hero-rise hero-rise-3 mt-[1.375rem] max-w-[46ch] text-[1rem] leading-[1.375rem] text-pretty">
          I'm Kerem — a CS senior building AI dev tools, with AI, in public. I've never shipped
          a product or earned a dollar online. This page is the receipt trail.
        </p>
        <div className="hero-rise hero-rise-4">
          <DayStamp />
        </div>
      </div>
    </section>
  )
}
