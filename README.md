# roadto100k-site

The public journey site for **roadto100kwkerem** — $0 → $100k by Dec 31, 2026, built in
public. One page, honest numbers: a live day counter, the rules of the bet, and a weekly
ledger of real revenue/spend figures (including the $0 weeks).

**Live:** https://kerem-turhan.github.io/roadto100k-site/

## Stack

Vite · React 19 · TypeScript (strict) · Tailwind CSS v4 · shadcn/ui · Motion · Vitest.
Static site, deployed to GitHub Pages by [.github/workflows/deploy.yml](.github/workflows/deploy.yml)
on every push to `main`. No backend, no analytics, no cookies.

## Development

```sh
npm install
npm run dev        # local dev server
npm run typecheck  # tsc -b
npm run lint       # oxlint
npm run test       # vitest (day counter + ledger parsing)
npm run build      # production build into dist/
```

Design tokens and project rules live in [CLAUDE.md](CLAUDE.md); the full v1 plan and copy in
[docs/plan.md](docs/plan.md).

## Weekly ledger update (the Sunday ritual)

All numbers on the site come from one file: [src/data/ledger.json](src/data/ledger.json).

1. Append a new object to the `weeks` array:

   ```json
   {
     "weekEnding": "2026-07-26",
     "revenue": 0,
     "mrr": 0,
     "spend": 0,
     "emailSubs": 0,
     "note": "One honest sentence about the week."
   }
   ```

   `revenue` and `spend` are this week's USD amounts; `mrr` and `emailSubs` are the totals
   as of that Sunday. Real numbers only — zeros stay zeros.

2. Commit and push:

   ```sh
   git add src/data/ledger.json
   git commit -m "chore(ledger): week of 2026-07-26"
   git push
   ```

3. GitHub Actions rebuilds and redeploys Pages automatically (~1 minute). The build fails
   loudly if an entry is malformed — `parseLedger` validates every field.

## Configuration

Every external link and journey date lives in [src/config.ts](src/config.ts):

- `BUTTONDOWN_URL` — empty until the Buttondown account exists; the signup section shows a
  "follow on X" fallback while it's empty. Paste the embed action URL to switch the form on.
- `X_URL`, `GITHUB_URL`, `CONTACT_EMAIL` — footer/contact links.
- `START_DATE` (day 0, 2026-07-19) and `GOAL_DATE` — the live day counter's anchors.

If a custom domain is ever added, also change `base` in [vite.config.ts](vite.config.ts) to `'/'`.
