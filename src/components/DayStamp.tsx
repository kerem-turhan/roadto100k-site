import { useEffect, useState } from 'react'
import { animate, useReducedMotion } from 'motion/react'
import { config } from '@/config'
import { dayNumber, daysLeft, parseIsoDate } from '@/lib/days'

/**
 * The signature element: a rubber-stamp day counter anchored to day 0 =
 * 2026-07-19 (same count as the X account). Days-left counts up once on load.
 */
export function DayStamp() {
  const reduceMotion = useReducedMotion()
  const [now] = useState(() => new Date())
  const day = dayNumber(parseIsoDate(config.START_DATE), now)
  const left = daysLeft(parseIsoDate(config.GOAL_DATE), now)
  const [shownLeft, setShownLeft] = useState(() => (reduceMotion ? left : 0))

  useEffect(() => {
    if (reduceMotion) {
      setShownLeft(left)
      return
    }
    const controls = animate(0, left, {
      duration: 0.9,
      ease: 'circOut',
      onUpdate: (value) => setShownLeft(Math.round(value)),
    })
    return () => controls.stop()
  }, [left, reduceMotion])

  return (
    <p className="mt-10">
      <span className="inline-block -rotate-2 rounded-sm border-2 border-ledger-red px-4 py-2 font-mono text-sm font-medium tracking-[0.2em] text-ledger-red uppercase ring-1 ring-ledger-red ring-offset-2 ring-offset-paper">
        Day {day} · {shownLeft} days left
      </span>
    </p>
  )
}
