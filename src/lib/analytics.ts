import { escapeMarkup } from './text.ts'

/*
 * The visit counter.
 *
 * The site's stance was "no cookies, no tracking", and the second half of that
 * was costing more than it bought: launch traffic arrives once, and traffic
 * nobody counted is traffic nobody can learn from. Refusing to measure is not
 * privacy — it is blindness with better manners. So the counter is cookieless,
 * stores nothing that identifies a reader, and says so on every page it runs on.
 *
 * Provider: GoatCounter (goatcounter.com). Chosen because it is free for a site
 * this size, open source and self-hostable if that ever stops being true, sends
 * no cookies and stores no IP address or User-Agent, and because its stats page
 * can be made public — which is the same argument this whole site makes.
 * Primary sources, read 30 Jul 2026:
 *   goatcounter.com          — "Identify unique visits without cookies or
 *                               persistently storing any personal data"
 *   goatcounter.com/help/privacy — "No IP addresses, User-Agent headers, or
 *                               tracker IDs are stored in the database"
 *
 * Nothing here fires unless config.ANALYTICS_CODE is filled in. Empty means no
 * GoatCounter script, no count request and — importantly — no disclosure sentence
 * either: a page that says it counts visits while counting nothing is the exact
 * kind of green light this site exists to argue against. The Buttondown form action
 * is a separate, submit-time surface.
 */

/** GoatCounter's shared endpoint script. Self-hosted swaps only this constant. */
const COUNTER_SCRIPT = 'https://gc.zgo.at/count.js'

/** A GoatCounter site code is its subdomain: lowercase letters, digits, hyphens. */
const CODE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/

/**
 * The one honest sentence, shown wherever the counter runs. It has to survive
 * being read by somebody who came here *because* the footer said no tracking.
 */
export const ANALYTICS_NOTE =
  'Visits are counted without cookies, fingerprints, or anything that identifies you — because not measuring isn’t privacy, it’s blindness.'

/** Same sentence for the Turkish pages. */
export const ANALYTICS_NOTE_TR =
  'Ziyaretler çerezsiz sayılıyor — çerez yok, parmak izi yok, sizi tanımlayan hiçbir şey yok; çünkü ölçmemek gizlilik değil, körlüktür.'

/** Where a reader can check the claim above for themselves. */
export function counterEndpoint(code: string): string {
  return `https://${code}.goatcounter.com/count`
}

/**
 * The counter script's attributes, or null while no code is configured. The
 * static shell and the SPA's index.html inject the same tag by two different
 * mechanisms, so the endpoint is described once, here.
 *
 * A code that is set but malformed throws instead of shipping a dead beacon:
 * the failure mode of a silently broken counter is a dashboard reading zero,
 * which is indistinguishable from a launch nobody came to.
 */
export function counterScriptAttrs(code: string): Record<string, string> | null {
  if (code === '') return null
  if (!CODE.test(code)) {
    throw new Error(
      `Invalid ANALYTICS_CODE ${JSON.stringify(code)}: expected a GoatCounter site code ` +
        '(the subdomain of your goatcounter.com dashboard), e.g. "roadto100k".',
    )
  }
  // `async` and no inline state: with JavaScript off the page is unaffected,
  // which is also why the count is a floor and never a headline number.
  return { 'data-goatcounter': counterEndpoint(code), async: '', src: COUNTER_SCRIPT }
}

/** The same tag as HTML, for the statically generated pages. */
export function counterScriptTag(code: string): string {
  const attrs = counterScriptAttrs(code)
  if (!attrs) return ''
  const rendered = Object.entries(attrs)
    .map(([name, value]) => (value === '' ? name : `${name}="${escapeMarkup(value)}"`))
    .join(' ')
  return `<script ${rendered}></script>`
}
