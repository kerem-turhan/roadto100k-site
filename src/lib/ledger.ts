export interface LedgerWeek {
  /** ISO date (Sunday) the entry covers up to. */
  weekEnding: string
  /** Revenue earned this week, USD. */
  revenue: number
  /** MRR at the end of this week, USD. */
  mrr: number
  /** Money spent this week, USD. */
  spend: number
  /** Email list size at the end of this week. */
  emailSubs: number
  note: string
  /**
   * Optional one-sentence Turkish summary. Present only for weeks Kerem
   * actually wrote one for — a week without it is simply absent from the
   * Turkish pages, never padded with placeholder copy.
   */
  trNote?: string
}

export interface Ledger {
  startDate: string
  goalDate: string
  goalUsd: number
  weeks: LedgerWeek[]
}

export interface LedgerTotals {
  cumulativeRevenue: number
  totalSpend: number
  currentMrr: number
  emailSubs: number
  /** 0-based: the seed entry on day 0 is week 0. */
  weekNumber: number
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/**
 * A shape check is not a date check. `2026-19-07` (month and day transposed)
 * and `2026-02-30` both match the regex, and both used to sail through the
 * build: the first published `<pubDate>Wed, 07 undefined 2026</pubDate>` into
 * the live RSS feed, because month 19 has no name. Round-tripping through
 * Date.UTC is what makes "validates every field" true.
 */
function isRealIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const utc = new Date(Date.UTC(year, month - 1, day))
  return (
    utc.getUTCFullYear() === year && utc.getUTCMonth() === month - 1 && utc.getUTCDate() === day
  )
}

function isFiniteNonNegative(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

function fail(path: string, detail: string): never {
  throw new Error(`Invalid ledger data at ${path}: ${detail}`)
}

/**
 * Validate raw JSON into a Ledger. Throws with a precise message on any
 * malformed entry — a broken ledger must fail the build, not render nonsense.
 */
export function parseLedger(raw: unknown): Ledger {
  if (typeof raw !== 'object' || raw === null) fail('$', 'not an object')
  const data = raw as Record<string, unknown>

  for (const key of ['startDate', 'goalDate'] as const) {
    if (!isRealIsoDate(data[key])) {
      fail(key, 'expected a real calendar date as YYYY-MM-DD')
    }
  }
  if (!isFiniteNonNegative(data.goalUsd) || data.goalUsd <= 0) {
    fail('goalUsd', 'expected a positive number')
  }
  if ((data.goalDate as string) <= (data.startDate as string)) {
    fail('goalDate', 'expected a date after startDate')
  }
  if (!Array.isArray(data.weeks) || data.weeks.length === 0) {
    fail('weeks', 'expected a non-empty array')
  }

  const weeks = data.weeks.map((entry, i) => {
    const at = `weeks[${i}]`
    if (typeof entry !== 'object' || entry === null) fail(at, 'not an object')
    const week = entry as Record<string, unknown>
    if (!isRealIsoDate(week.weekEnding)) {
      fail(`${at}.weekEnding`, 'expected a real calendar date as YYYY-MM-DD')
    }
    // A week outside the journey window renders nonsense ("day -2387 of 165").
    if (week.weekEnding < (data.startDate as string)) {
      fail(`${at}.weekEnding`, `expected a date on or after startDate ${data.startDate as string}`)
    }
    if (week.weekEnding > (data.goalDate as string)) {
      fail(`${at}.weekEnding`, `expected a date on or before goalDate ${data.goalDate as string}`)
    }
    for (const key of ['revenue', 'mrr', 'spend', 'emailSubs'] as const) {
      if (!isFiniteNonNegative(week[key])) fail(`${at}.${key}`, 'expected a non-negative number')
    }
    // Subscribers are people; 2.7 of them is a typo, not a number.
    if (!Number.isInteger(week.emailSubs)) {
      fail(`${at}.emailSubs`, 'expected a whole number — subscribers are people')
    }
    if (typeof week.note !== 'string') fail(`${at}.note`, 'expected a string')
    if (week.trNote !== undefined && typeof week.trNote !== 'string') {
      fail(`${at}.trNote`, 'expected a string when present')
    }
    // A blank trNote means "not written yet", not "empty summary".
    const trNote = typeof week.trNote === 'string' ? week.trNote.trim() : ''
    return {
      weekEnding: week.weekEnding,
      revenue: week.revenue as number,
      mrr: week.mrr as number,
      spend: week.spend as number,
      emailSubs: week.emailSubs as number,
      note: week.note,
      ...(trNote ? { trNote } : {}),
    } satisfies LedgerWeek
  })

  const sorted = [...weeks].sort((a, b) => a.weekEnding.localeCompare(b.weekEnding))
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].weekEnding === sorted[i - 1].weekEnding) {
      fail('weeks', `duplicate weekEnding ${sorted[i].weekEnding}`)
    }
  }

  return {
    startDate: data.startDate as string,
    goalDate: data.goalDate as string,
    goalUsd: data.goalUsd as number,
    weeks: sorted,
  }
}

export function ledgerTotals(ledger: Ledger): LedgerTotals {
  const latest = ledger.weeks[ledger.weeks.length - 1]
  return {
    cumulativeRevenue: ledger.weeks.reduce((sum, w) => sum + w.revenue, 0),
    totalSpend: ledger.weeks.reduce((sum, w) => sum + w.spend, 0),
    currentMrr: latest.mrr,
    emailSubs: latest.emailSubs,
    weekNumber: ledger.weeks.length - 1,
  }
}

export interface TrWeekEntry {
  week: LedgerWeek
  /** Week number on the English side — the two languages stay in sync. */
  index: number
  trNote: string
}

/**
 * The weeks that have a Turkish summary, oldest first. Weeks without one are
 * dropped entirely: the Turkish pages show real notes or nothing at all.
 */
export function trWeekEntries(ledger: Ledger): TrWeekEntry[] {
  return ledger.weeks.flatMap((week, index) =>
    week.trNote ? [{ week, index, trNote: week.trNote }] : [],
  )
}

/** $0, $1,234 — whole dollars; the ledger tracks real money, not cents. */
export function formatUsd(amount: number): string {
  return `$${Math.round(amount).toLocaleString('en-US')}`
}
