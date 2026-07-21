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
[docs/plan.md](docs/plan.md). [ANLATIM.md](ANLATIM.md) is the owner's handbook (Turkish):
what the site is, what every part does, and the weekly ritual.

Fonts are self-hosted from `public/fonts` in two subsets per family — latin and latin-ext,
scoped by `unicode-range` in [src/lib/fonts.ts](src/lib/fonts.ts). The ext file carries the
Turkish letters (İ, Ş, Ğ) the latin subset omits; English-only pages never fetch it.

## Generated static pages (v2)

`vite build` also runs [scripts/static-pages.ts](scripts/static-pages.ts), which pre-renders
everything derived from the ledger:

- `feed.xml` — RSS 2.0, one item per ledger week.
- `sitemap.xml` + `robots.txt` — canonical URLs for every page.
- `w/<weekEnding>/index.html` — one plain-HTML journal page per week (indexable, no JS
  beyond the theme snippet) plus the `w/` archive index.
- `tr/w/<weekEnding>/index.html`, `tr/index.html`, `tr/feed.xml` — the Turkish summary of a
  week, built **only** for weeks whose ledger entry has a `trNote`. No `trNote` anywhere
  means no `/tr/` at all: the site never pads a missing summary with placeholder copy.
  English and Turkish pages cross-link with `hreflang`.
- JSON-LD (Person + WebSite + Dataset) injected into `index.html`.

The generators are pure functions in `src/lib/` (`feed.ts`, `sitemap.ts`, `journal.ts`,
`journalTr.ts`, `pageShell.ts`, `seo.ts`, `sparkline.ts`, `ogCard.ts`), each unit-tested with
Vitest. Appending a week to `ledger.json` automatically produces the new journal page, feed
item and sitemap entry on the next build.

## Share cards

- `public/og.png` — the site-wide card, rendered from
  [scripts/og-template.html](scripts/og-template.html) (screenshot at exactly 1200x630).
  Regenerate only when the card copy changes.
- `public/og/w/<weekEnding>.png` — one card per ledger week, carrying that week's real
  numbers, plus `public/og/w/tr/<weekEnding>.png` for every week that has a `trNote`.
  Generated **locally** by `npm run og`, which drives an already-installed Chrome in headless
  mode ([scripts/render-og.ts](scripts/render-og.ts) + `src/lib/ogCard.ts`), renders into a
  temp dir and only copies a card into `public/` after checking it is a complete 1200x630
  PNG. The PNGs are committed; **CI never runs a browser**, it only copies them. A week
  without a card falls back to `og.png` — a missed run costs a preview image, nothing else.

```sh
npm run og                     # render the cards that don't exist yet
npm run og -- --force          # re-render all of them (after a card design change)
npm run og -- --week=2026-07-26
CHROME_BIN=/path/to/chrome npm run og   # if Chrome lives somewhere unusual
```

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
     "note": "One honest sentence about the week.",
     "trNote": "Haftanın tek cümlelik Türkçe özeti (optional)."
   }
   ```

   `revenue` and `spend` are this week's USD amounts; `mrr` and `emailSubs` are the totals
   as of that Sunday. Real numbers only — zeros stay zeros. `trNote` is optional: with one,
   the week appears under `/tr/`; without one (or blank), it simply doesn't.

2. Render this week's share card:

   ```sh
   npm run og
   ```

3. Commit and push:

   ```sh
   git add src/data/ledger.json public/og
   git commit -m "chore(ledger): week of 2026-07-26"
   git push
   ```

4. GitHub Actions rebuilds and redeploys Pages automatically (~1 minute). The build fails
   loudly if an entry is malformed — `parseLedger` validates every field.

## Configuration

Every external link and journey date lives in [src/config.ts](src/config.ts):

- `BUTTONDOWN_URL` — empty until the Buttondown account exists; the signup section shows a
  "follow on X" fallback while it's empty. Paste the embed action URL to switch the form on.
- `X_URL`, `GITHUB_URL`, `CONTACT_EMAIL` — footer/contact links.
- `START_DATE` (day 0, 2026-07-19) and `GOAL_DATE` — the live day counter's anchors.

If a custom domain is ever added, also change `base` in [vite.config.ts](vite.config.ts) to `'/'`.
