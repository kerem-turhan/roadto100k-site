import type { ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  className?: string
}

/**
 * Scroll-in reveal. Pure CSS: default state is fully visible; where the
 * browser supports scroll-driven animations (and motion is welcome) the
 * .reveal rules animate it in off the compositor. No JS, no rAF — content can
 * never be held hostage by a stalled script.
 */
export function Reveal({ children, className }: RevealProps) {
  return <div className={className ? `reveal ${className}` : 'reveal'}>{children}</div>
}
