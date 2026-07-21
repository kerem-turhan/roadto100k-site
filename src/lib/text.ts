/** Escape a string for safe interpolation into HTML or XML text/attributes. */
export function escapeMarkup(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

const MONTHS_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
] as const

function utcParts(iso: string): { date: Date; y: number; m: number; d: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) throw new Error(`Invalid ISO date: ${iso}`)
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])]
  return { date: new Date(Date.UTC(y, m - 1, d)), y, m, d }
}

/** `2026-07-19` → `Jul 19, 2026` (locale-independent, deterministic). */
export function formatDateLong(iso: string): string {
  const { m, d, y } = utcParts(iso)
  return `${MONTHS[m - 1]} ${d}, ${y}`
}

/** `2026-07-19` → `Jul 19` — short axis/label form. */
export function formatDateShort(iso: string): string {
  const { m, d } = utcParts(iso)
  return `${MONTHS[m - 1]} ${d}`
}

/** `2026-07-19` → `19 Temmuz 2026` (Turkish pages; no Intl dependency). */
export function formatDateLongTr(iso: string): string {
  const { m, d, y } = utcParts(iso)
  return `${d} ${MONTHS_TR[m - 1]} ${y}`
}

/**
 * Shorten to at most `max` characters on a word boundary, appending an
 * ellipsis. Used where layout is fixed (share cards) — never for the ledger
 * itself, which always shows the full note.
 */
export function truncate(value: string, max: number): string {
  const text = value.trim()
  if (text.length <= max) return text
  const cut = text.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > max / 2 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.—-]+$/, '')}…`
}

/** `2026-07-19` → `Sun, 19 Jul 2026 00:00:00 GMT` (RFC 822, as RSS requires). */
export function formatRfc822(iso: string): string {
  const { date, y, m, d } = utcParts(iso)
  const dd = String(d).padStart(2, '0')
  return `${WEEKDAYS[date.getUTCDay()]}, ${dd} ${MONTHS[m - 1]} ${y} 00:00:00 GMT`
}
