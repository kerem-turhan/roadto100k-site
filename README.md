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
npm run leaks      # leak guard — see below
npm run build      # production build into dist/
```

Design tokens and project rules live in [CLAUDE.md](CLAUDE.md); the full v1 plan and copy in
[docs/plan.md](docs/plan.md). [ANLATIM.md](ANLATIM.md) is the owner's handbook (Turkish):
what the site is, what every part does, and the weekly ritual.

Fonts are self-hosted from `public/fonts` in two subsets per family — latin and latin-ext,
scoped by `unicode-range` in [src/lib/fonts.ts](src/lib/fonts.ts). The ext file carries the
Turkish letters (İ, Ş, Ğ) the latin subset omits; English-only pages never fetch it.

## Leak guard

[CLAUDE.md](CLAUDE.md)'s leak-prevention rule — the unreleased product's name and the NDA'd
project names must never appear in this repo — is enforced by `npm run leaks`, not by trust.

```sh
npm run leaks              # scan sources
npm run leaks -- --dist    # also scan the built output (after npm run build)
npm run leaks -- --git     # also scan every commit message
npm run leaks:add          # add a term, read from stdin
```

The forbidden words are not in this repo.
[scripts/leak-denylist.json](scripts/leak-denylist.json) stores only salted, truncated SHA-256
hashes, which is what lets the denylist live in a public repo. **That is obfuscation, not
secrecy:** the salt sits next to the hashes, so a short term is recoverable by dictionary
attack. The guard stops accidental leaks — a stray paste, a forgotten comment, a string that
only shows up in the bundle — not a motivated attacker.

Matching normalises text to `[a-z0-9]` (lowercased, everything else deleted) and slides a
window of each denied length across every position, so a term is caught however it is written:
`Foo-Bar`, `foo_bar`, `Foo Bar`, `kerem@foobar.com`, `https://x.com/foobar/tree/main`,
`"foobar"` in JSON, or `foobar` inside a minified identifier. Looking *inside* email and URL
strings is the point: that is exactly where a sibling project's leak hid. The cost is an
occasional false positive when two ordinary words concatenate into a denied term — the correct
direction to fail. Hits print as `file:line` with the match replaced by `[REDACTED len=N]`;
the word itself is never printed, because CI logs on a public repo are public.

**A guard that cannot look goes red.** Every condition where the scan could not actually check
something exits 1 instead of passing: a missing, unreadable, malformed or empty denylist; a
scanned directory that moved; a target matching zero files; an unreadable file; `--dist`
without a build; a shallow clone under `--git`; an unknown flag. And on every run, before
scanning anything real, the guard pushes a plaintext canary through the same code path and
requires that it be flagged, that ordinary control text *not* be flagged, and that its own
report redact what it found. If it cannot prove it still works, the run fails.

### Adding a term

```sh
printf %s 'the-term' | npm run leaks:add
```

Read from stdin, never from arguments, which land in shell history. Only `added (len N)` is
printed back. The denylist currently covers the unreleased product's name, one NDA'd project
name, and the canary. **The NDA'd internship/employer names are not in it** — they are written
down nowhere — so add each one with `leaks:add` when you get the chance.

### Where it runs

CI runs `npm run leaks -- --git` before the build and `npm run leaks -- --dist` after it
([.github/workflows/deploy.yml](.github/workflows/deploy.yml)); the checkout uses
`fetch-depth: 0`, because a shallow clone hides most commit messages from the scan. CI alone
only blocks the *deploy* — by then the commit is already public — so a pre-push hook is the
other half:

```sh
git config core.hooksPath .githooks   # once per clone
```

[.githooks/pre-push](.githooks/pre-push) runs the same guard before anything leaves the
machine.

**Limits, stated plainly:** it matches literal strings, so a paraphrase, an abbreviation or an
encoding passes; it reads the working tree and commit *messages*, never commit *diffs*, so a
term committed and later deleted stays in history unseen; it cannot read PNGs; and
`package.json` / lockfiles are outside the scan set. The scan covers `src/`, `scripts/`,
`docs/`, `.github/workflows/`, `index.html`, root `*.md` and the text files under `public/` —
contents only, never file names.

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
   loudly if an entry is malformed — `parseLedger` rejects anything that is not a real
   calendar date (`2026-19-07` and `2026-02-30` both used to sail through), a week outside
   the journey window, a fractional subscriber count, or a missing/negative figure.

## Configuration

Every external link, journey date and public claim lives in [src/config.ts](src/config.ts):

- `SITE_URL` — canonical public URL, trailing slash included. Drives canonical tags,
  hreflang, sitemap, feed and every `og:` URL, including `index.html`'s (which carries a
  `%SITE_URL%` token the build fills — never paste an absolute URL back in).
- `SITE_NAME`, `AUTHOR_NAME`, `SITE_DESCRIPTION` — used by the feed, JSON-LD and share cards.
- `BUTTONDOWN_URL` — empty until the Buttondown account exists; the signup section shows a
  "follow on X" fallback while it's empty. Paste the embed action URL to switch the form on.
- `X_URL`, `GITHUB_URL`, `CONTACT_EMAIL` — footer/contact links.
- `START_DATE` (day 0, 2026-07-19), `GOAL_DATE` and `GOAL_USD` — the journey window. These
  are also in `src/data/ledger.json`; a test pins the two files to the same values, because
  different surfaces read different copies.
- `PROOF_ITEMS` — the "The work" section. An item renders only when its `url` is a real,
  public, deep `https://` link, and any item carrying `stats` must also carry the
  `sourceCommit` those numbers were read from, or it stays hidden. See
  [src/lib/proof.ts](src/lib/proof.ts).

Moving to a custom domain means changing `base` in [vite.config.ts](vite.config.ts) to `'/'`
**and** `SITE_URL` here. Nothing else — `index.html` and every generated page follow.
