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

## Generated static pages (v2)

`vite build` also runs [scripts/static-pages.ts](scripts/static-pages.ts), which pre-renders
everything derived from the ledger:

- `feed.xml` — RSS 2.0, one item per ledger week.
- `sitemap.xml` + `robots.txt` — canonical URLs for every page.
- `w/<weekEnding>/index.html` — one plain-HTML journal page per week (indexable, no JS
  beyond the theme snippet) plus the `w/` archive index.
- JSON-LD (Person + WebSite + Dataset) injected into `index.html`.

The generators are pure functions in `src/lib/` (`feed.ts`, `sitemap.ts`, `journal.ts`,
`seo.ts`, `sparkline.ts`), each unit-tested with Vitest. Appending a week to `ledger.json`
automatically produces the new journal page, feed item and sitemap entry on the next build.

The share card `public/og.png` is rendered from [scripts/og-template.html](scripts/og-template.html)
(screenshot at exactly 1200x630) — regenerate only when the card copy changes.

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
