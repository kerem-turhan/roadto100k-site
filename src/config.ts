/**
 * Single source of truth for every external link and journey date.
 * Nothing below may be inlined anywhere else in the codebase.
 */
export const config = {
  /** Canonical public URL of the deployed site — always with a trailing slash. */
  SITE_URL: 'https://kerem-turhan.github.io/roadto100k-site/',
  SITE_NAME: 'roadto100kwkerem',
  AUTHOR_NAME: 'Kerem Turhan',
  /** One-line site description used by the feed and structured data. */
  SITE_DESCRIPTION:
    'A public ledger. CS senior building AI dev tools in public: $100/mo budget, $0 ads, real numbers every Sunday — including the $0 weeks.',
  /** Public Buttondown embed action URL. Empty values make signup fall back to X. */
  BUTTONDOWN_URL: 'https://buttondown.com/api/emails/embed-subscribe/mehmet_kerem',
  X_URL: 'https://x.com/mkeremturhan',
  GITHUB_URL: 'https://github.com/kerem-turhan',
  CONTACT_EMAIL: 'keremturhan.cs@gmail.com',
  /** Day 0 of the journey — same anchor as the X account's day count. */
  START_DATE: '2026-07-19',
  GOAL_DATE: '2026-12-31',
  GOAL_USD: 100_000,
} as const
