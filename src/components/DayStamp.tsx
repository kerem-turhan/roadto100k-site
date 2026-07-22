import { useEffect, useState } from 'react'
import { animate, useReducedMotion } from 'motion/react'
import { config } from '@/config'
import { dayNumber, daysLeft, parseIsoDate } from '@/lib/days'

interface DayStampProps {
  /** Injectable clock for tests; defaults to the real current date. */
  now?: Date
}

/**
 * The signature element: a rubber-stamp day counter anchored to day 0 =
 * 2026-07-19 (same count as the X account).
 *
 * The true values render synchronously on first paint. The count-up is a
 * decoration layer only — rAF can be throttled or fully paused (hidden tabs,
 * battery saver), so the displayed number must never depend on an animation
 * frame ever firing.
 */
export function DayStamp({ now }: DayStampProps) {
  const [mountedNow] = useState(() => now ?? new Date())
  const start = parseIsoDate(config.START_DATE)
  const goal = parseIsoDate(config.GOAL_DATE)
  const day = dayNumber(start, mountedNow)
  const left = daysLeft(goal, mountedNow)
  const totalSpan = daysLeft(goal, start)
  const reduceMotion = useReducedMotion()
  const [displayLeft, setDisplayLeft] = useState(left)

  useEffect(() => {
    // Decoration only: skip when motion is unwelcome or the tab can't paint.
    if (reduceMotion || document.visibilityState === 'hidden' || totalSpan === left) return
    // A countdown drains downward: from the full span to today's remainder.
    const controls = animate(totalSpan, left, {
      duration: 0.9,
      ease: 'circOut',
      onUpdate: (value) => setDisplayLeft(Math.round(value)),
    })
    // If frames stall mid-count, snap back to the real value.
    const failsafe = window.setTimeout(() => {
      controls.stop()
      setDisplayLeft(left)
    }, 1600)
    return () => {
      window.clearTimeout(failsafe)
      controls.stop()
      setDisplayLeft(left)
    }
  }, [left, totalSpan, reduceMotion])

  return (
    <p className="mt-10">
      {/*
        The only clock-dependent text on the page. Prerendered HTML carries the
        build day, the browser corrects it to today on hydration — a visitor two
        days after a deploy would otherwise get a mismatch warning for a counter
        that is behaving exactly as intended.
      */}
      <span
        suppressHydrationWarning
        className="day-stamp inline-block -rotate-2 rounded-sm border-2 border-ledger-red px-4 py-2 font-mono text-sm font-medium tracking-[0.2em] text-ledger-red uppercase"
      >
        Day {day} · {displayLeft} days left
      </span>
    </p>
  )
}
