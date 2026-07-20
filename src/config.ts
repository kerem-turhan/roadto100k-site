/**
 * Single source of truth for every external link and journey date.
 * Nothing below may be inlined anywhere else in the codebase.
 */
export const config = {
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
