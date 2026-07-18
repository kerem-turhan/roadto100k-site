const MS_PER_DAY = 86_400_000

/** Parse an ISO `YYYY-MM-DD` string as a local-time date at midnight. */
export function parseIsoDate(iso: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) throw new Error(`Invalid ISO date: ${iso}`)
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

function atMidnight(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/**
 * Whole calendar days from `from` to `to`, DST-safe: a 23h or 25h day still
 * counts as exactly one day because we round the midnight-to-midnight delta.
 */
export function calendarDaysBetween(from: Date, to: Date): number {
  return Math.round((atMidnight(to).getTime() - atMidnight(from).getTime()) / MS_PER_DAY)
}

/** Day number of the journey; the start date itself is day 0. Never negative. */
export function dayNumber(start: Date, now: Date): number {
  return Math.max(0, calendarDaysBetween(start, now))
}

/** Calendar days remaining until the goal date. 0 on the goal date and after. */
export function daysLeft(goal: Date, now: Date): number {
  return Math.max(0, calendarDaysBetween(now, goal))
}
