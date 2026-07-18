import { motion, useReducedMotion } from 'motion/react'
import { DayStamp } from '@/components/DayStamp'

export function Hero() {
  const reduceMotion = useReducedMotion()
  const entrance = (delay: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, ease: 'easeOut' as const, delay },
        }

  return (
    <section aria-label="Intro" className="relative pt-16 pb-20 md:pt-24 md:pb-28">
      {/* Ruled ledger paper behind the headline, fading out toward the bottom. */}
      <div
        aria-hidden
        className="ledger-rules pointer-events-none absolute inset-0 opacity-40 [mask-image:linear-gradient(to_bottom,black_55%,transparent_95%)]"
      />
      <div className="relative">
        <motion.p
          {...entrance(0)}
          className="mb-6 font-mono text-xs tracking-[0.25em] text-ink-muted uppercase"
        >
          A public ledger — Ankara, TR
        </motion.p>
        <motion.h1
          {...entrance(0.08)}
          className="font-display text-[clamp(2.9rem,10vw,6rem)] leading-[0.98] font-extrabold tracking-tight"
        >
          $0 <span className="text-ledger-red">→</span> $100k
          <br />
          <span className="font-semibold text-ink-muted">by Dec 31, 2026.</span>
        </motion.h1>
        <motion.p {...entrance(0.16)} className="mt-8 max-w-[46ch] text-lg leading-relaxed">
          I'm Kerem — a CS senior building AI dev tools, with AI, in public. I've never shipped
          a product or earned $1 online. This page is the receipt trail.
        </motion.p>
        <motion.div {...entrance(0.24)}>
          <DayStamp />
        </motion.div>
      </div>
    </section>
  )
}
