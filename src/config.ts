/**
 * Single source of truth for every external link and journey date.
 * Nothing below may be inlined anywhere else in the codebase.
 */
export const config = {
  /** Canonical public URL of the deployed site — always with a trailing slash. */
  SITE_URL: 'https://kerem-turhan.github.io/roadto100k-site/',
  /** Matches the display name on X, so a visitor arriving from a tweet sees the same name. */
  SITE_NAME: 'Kerem — road to $100k',
  AUTHOR_NAME: 'Kerem Turhan',
  /** One-line site description used by the feed and structured data. */
  SITE_DESCRIPTION:
    'A public ledger. CS senior building AI dev tools in public: $100/mo budget, $0 ads, real numbers every Sunday — including the $0 weeks.',
  /** Public Buttondown embed action URL. Empty values make signup fall back to X. */
  BUTTONDOWN_URL: 'https://buttondown.com/api/emails/embed-subscribe/mehmet_kerem',
  /**
   * GoatCounter site code — the subdomain of the dashboard, e.g. 'roadto100k'.
   * Empty means the GoatCounter surface is off: no script, no count request, and no
   * sentence claiming visits are counted. The Buttondown form action is separate.
   * See src/lib/analytics.ts and the two-minute setup in README.md ("Turning the visit counter on").
   */
  ANALYTICS_CODE: 'roadto100k',
  X_URL: 'https://x.com/mkeremturhan',
  GITHUB_URL: 'https://github.com/kerem-turhan',
  CONTACT_EMAIL: 'keremturhan.cs@gmail.com',
  /** Day 0 of the journey — same anchor as the X account's day count. */
  START_DATE: '2026-07-19',
  GOAL_DATE: '2026-12-31',
  GOAL_USD: 100_000,
  /**
   * Proof-of-work items (see src/lib/proof.ts). An item — and the whole Work
   * section while no item is live — is rendered ONLY once its `url` is a real,
   * public, deep https link. Any item carrying `stats` must also carry the
   * `sourceCommit` those numbers were read from: the numbers live here, the
   * truth lives in another repo, and the pin is what keeps a claim that was
   * true on flip day from quietly turning into a lie. Flip day: paste the
   * public URL and the SHA below, then push.
   */
  PROOF_ITEMS: [
    {
      title: 'Agent reliability teardown: openai-agents-js financial research example',
      description:
        'Clean-room, reproducible teardown with deliberately orchestrated failures — ' +
        '2 fail-open paths, a 1-file fail-closed patch, 4/6 → 6/6 on a six-case corpus. ' +
        'Two of those four baseline passes reproduce upstream’s own tests; on the four ' +
        'cases this teardown designed, baseline passed 2.',
      stats: ['2 fail-open paths', '1-file patch', '4/6 → 6/6'],
      url: 'https://github.com/kerem-turhan/agent-reliability-teardown-openai-agents-js',
      /**
       * The tree these numbers were read from, verified 30 Jul 2026. The repo was
       * republished that day with a clean parentless history, so earlier pins
       * (e.g. 7dcc0d3) no longer resolve publicly.
       */
      sourceCommit: 'b0c5e41',
    },
    {
      title: 'Agent reliability teardown: Google ADK stale-issue automation',
      description:
        'Second vendor, same failure class: a scheduled maintenance agent in ' +
        'google/adk-python logs an error for every issue it failed to audit, then reports ' +
        'all of them as successfully processed and exits 0. One-file patch makes the same ' +
        'run fail closed: 0 processed, 3 failures listed, exit 1. Reported upstream first.',
      stats: ['exit 0 → exit 1', '1-file patch', 'reported upstream first'],
      url: 'https://github.com/kerem-turhan/agent-reliability-teardown-google-adk-python',
      /** The tree these numbers were read from, verified 30 Jul 2026. */
      sourceCommit: 'd4eaea5',
    },
  ],
} as const
