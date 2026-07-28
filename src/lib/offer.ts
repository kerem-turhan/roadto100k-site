import { escapeMarkup } from './text.ts'

/*
 * The conversion copy, in one place.
 *
 * These strings ship on three surfaces rendered by three different code paths —
 * the React homepage, the static /work/ page and every /silent-green/ page.
 * Typing the promise out once per surface is how a reader ends up being made
 * three slightly different promises by the same site.
 */

/** What is on sale, in two sentences. The second one is the whole method. */
export const POSITIONING = {
  claim: 'I make AI agents fail closed.',
  rule: 'When a check can’t look, it has to say no.',
} as const

/** Both sentences as one line, for places that show the positioning inline. */
export const POSITIONING_LINE = `${POSITIONING.claim} ${POSITIONING.rule}`

/**
 * ISO date this offer copy last changed — the sitemap's `lastmod` for /work/.
 * Bump it when the positioning or the services below change; leaving it stale
 * only understates the page's freshness, while a clock-derived date would claim
 * a change on every deploy and make builds non-deterministic.
 */
export const OFFER_UPDATED = '2026-07-28'

export interface Service {
  name: string
  text: string
}

/** Scope, not price. What a package costs is decided in the reply, not here. */
export const SERVICES: readonly Service[] = [
  {
    name: 'Reliability audit',
    text: 'A reproducible teardown of your agent: every path where a failed check still returns success, with a runnable case for each.',
  },
  {
    name: 'Eval harness setup',
    text: 'A deterministic eval corpus for your agent plus a regression gate in CI, so the same failure cannot land twice.',
  },
  {
    name: 'Ongoing reliability support',
    text: 'Model swaps and prompt rewrites re-run against the corpus before they ship, so an upgrade cannot quietly cost you accuracy.',
  },
]

/**
 * The newsletter promise, agreed word for word with the launch brief. A reader
 * who subscribes from a Show HN post and a reader who subscribes from a series
 * page must have been promised the same thing.
 *
 * The apostrophes here and in POSITIONING are typographic (U+2019) rather than
 * ASCII — the only edit made to the agreed wording. It is also what makes one
 * literal enough to test all three surfaces: React escapes `'` to `&#x27;` and
 * the static pages escape it to `&#39;`, so the ASCII version would appear as
 * three different byte sequences that no single assertion could pin down.
 */
export const NEWSLETTER_PROMISE =
  'One silent-green finding a week — a check that couldn’t look and said yes anyway.'

/** Frequency, spam stance and exit, in one line. Same stance as the footer. */
export const NEWSLETTER_TERMS = 'One email a week. No spam, no tracking, one click to leave.'

/** Series identity — the permanent home of the weekly finding. */
export const SERIES = {
  name: 'Silent green',
  /** Shown under the series H1. */
  dek: 'A check that returns success when it could not actually look. Ten of them across four projects taught me to distrust a green light more than a red one.',
  intro: [
    'Silent green is the bug class this ledger keeps running into: a guard that reports success ' +
      'when it never managed to run. A missing config reads as "clean". A moved directory reads ' +
      'as "no findings". An unbuilt output reads as "nothing to scan". Every one of them passes ' +
      'CI while verifying nothing.',
    'Green that means "I did not check" is worse than red, because it buys confidence nobody ' +
      'paid for. This series is one finding a week — the check, why it could not look, what it ' +
      'said anyway, and the smallest change that makes it fail honestly.',
    'The same rule runs this site: a guard that cannot look goes red. Its own leak scanner ' +
      'refuses to pass when it cannot read its word list, and its own proof section refuses to ' +
      'render a number that is not pinned to a commit.',
  ],
  /** Shown while no entry is published yet. Honest about the state. */
  awaiting: 'First entry coming this week.',
} as const

interface SignupFormOptions {
  /** Buttondown embed action. An empty value renders the X fallback instead. */
  buttondownUrl: string
  xUrl: string
  /** Unique per page — two forms in one document must not share an input id. */
  idPrefix?: string
}

/**
 * The signup form for statically generated pages — the same fields and the same
 * promise as the React one, as plain HTML.
 *
 * Kept beside the copy rather than in pageShell so that the promise, the terms
 * and the markup that carries them cannot drift apart. The action is Buttondown's
 * public embed endpoint: the only external request this site makes at all.
 */
export function signupFormMarkup({
  buttondownUrl,
  xUrl,
  idPrefix = 'signup',
}: SignupFormOptions): string {
  const id = `${idPrefix}-email`
  if (!buttondownUrl) {
    return `        <p class="promise">${escapeMarkup(NEWSLETTER_PROMISE)}</p>
        <p class="terms">The list isn't open yet — until then, the findings land on
        <a href="${escapeMarkup(xUrl)}" rel="noreferrer">X&nbsp;↗</a>.</p>`
  }
  return `        <p class="promise">${escapeMarkup(NEWSLETTER_PROMISE)}</p>
        <form class="signup" action="${escapeMarkup(buttondownUrl)}" method="post" target="_blank">
          <label class="sr-only" for="${id}">Email address</label>
          <input id="${id}" type="email" name="email" required placeholder="you@company.com" />
          <input type="hidden" name="embed" value="1" />
          <button type="submit">Subscribe</button>
        </form>
        <p class="terms">${escapeMarkup(NEWSLETTER_TERMS)} Confirmation opens in a new tab.</p>`
}
