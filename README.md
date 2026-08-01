# roadto100k-site

The public journey site for **Kerem — road to $100k** — $0 → $100k by Dec 31, 2026, built in
public. One page, honest numbers: a live day counter, the rules of the bet, and a weekly
ledger of real revenue/spend figures (including the $0 weeks).

**Live:** https://kerem-turhan.github.io/roadto100k-site/

## Stack

Vite · React 19 · TypeScript (strict) · Tailwind CSS v4 · shadcn/ui · Motion · Vitest.
Static site, deployed to GitHub Pages by [.github/workflows/deploy.yml](.github/workflows/deploy.yml)
on every push to `main`. No backend, no cookies. Runtime has two external surfaces: the
cookieless GoatCounter visit counter and the Buttondown form action on submit.

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

All three families are OFL-1.1, and that licence permits redistribution only with the
copyright notice and licence alongside. `public/fonts/OFL-*.txt` are the upstream
`@fontsource*` licence files, copied verbatim and served next to the `.woff2` files they
cover. A test in [src/lib/pageShell.test.ts](src/lib/pageShell.test.ts) fails if a family the
shell serves has no notice.

## Leak guard

[CLAUDE.md](CLAUDE.md)'s rule that nothing third-party or confidential ships from this repo is
enforced by `npm run leaks`, not by trust.

```sh
npm run leaks              # scan sources
npm run leaks -- --dist    # also scan the built output (after npm run build)
npm run leaks -- --git     # also scan every commit message
npm run leaks:add          # add a term, read from stdin
```

**The terms are not in this repository, in any form.** They come from `$LEAK_DENYLIST` — a
repository secret in CI — or from a gitignored `.leak-denylist.local.json` when you run it
locally. Nothing else works: no source means a red run, never a quiet pass.

They used to be committed as salted hashes, on the theory that a hash is not a word. That was
wrong, and it was demonstrated rather than argued: the same file also carried the salt, a
known-plaintext canary that confirms the construction is `sha256(salt + term)`, each term's
exact length, and a note naming its category. A term in it was recovered by brute force in
seconds, and any single guess could be confirmed against it. A committed denylist is a
confirmation oracle for exactly the words it is meant to protect.

What remains committed is the canary, under its own separate salt — it is a liveness probe,
not a secret, and it must not share a scheme with the real terms.

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
printed back, and `--add` refuses to run against the CI secret — it writes to the local file,
which you then use to update the secret (`gh secret set LEAK_DENYLIST < .leak-denylist.local.json`).

What is and is not in the list is deliberately not documented here: a README that enumerates
the categories it protects hands over the shape of the answer. The list itself is the record.
Terms shorter than about six characters are a bad idea regardless — a four-character one fired
on ordinary English (`is imported` normalises to contain it) until it was removed.

### Where it runs

CI runs `npm run leaks -- --git` before the build and `npm run leaks -- --dist` after it
([.github/workflows/deploy.yml](.github/workflows/deploy.yml)); the checkout uses
`fetch-depth: 0`, because a shallow clone hides most commit messages from the scan, and both
steps receive the denylist through `env: LEAK_DENYLIST`. CI alone
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
  beyond the two theme snippets) plus the `w/` archive index.
- `tr/w/<weekEnding>/index.html`, `tr/index.html`, `tr/feed.xml` — the Turkish summary of a
  week, built **only** for weeks whose ledger entry has a `trNote`. No `trNote` anywhere
  means no `/tr/` at all: the site never pads a missing summary with placeholder copy.
  English and Turkish pages cross-link with `hreflang`.
- `work/index.html` — the service page ("work with me"), built **only** while a
  `PROOF_ITEMS` entry passes the same gate the homepage section uses
  ([src/lib/workPage.ts](src/lib/workPage.ts)). No receipts, no page — and nothing in the
  sitemap or the footer pointing at one.
- `silent-green/index.html` plus `silent-green/<slug>/index.html` per published entry — the
  permanent home of the weekly finding, driven by
  [src/data/series.json](src/data/series.json). The index is built whether or not an entry
  exists: the URL is cited from posts elsewhere, so it says "first entry coming this week"
  rather than 404ing for a week. It never invents an entry to fill the space.
- JSON-LD (Person + WebSite + Dataset) injected into `index.html`.

Both new pages carry the newsletter form and the promise from
[src/lib/offer.ts](src/lib/offer.ts) — one module holds the positioning sentence, the three
services, the promise and the terms, because the React homepage and these static pages are
three renderers that would otherwise drift into three slightly different promises.

Every generated page carries the same theme control as the app: an inline script writes a
`<button>` into the header, flips the `dark` class, stores the choice in `localStorage.theme`
and relabels itself — in Turkish on `/tr/` pages. The button is written by the script rather
than shipped as markup: with JavaScript off there is no control at all, instead of a dead one.
Anyone landing on a shared `/w/…` link can now leave their OS preference behind.

### The homepage is prerendered too

`npm run build` ends with [scripts/prerender.ts](scripts/prerender.ts), which renders the real
`App` to HTML and fills `index.html`'s `<div id="root">`. Until then the one page people
actually land on was a 42-byte shell: the ledger, the rules and the whole proof section
existed only after JavaScript ran, so a crawler, a link preview or a reader with JS off saw
nothing.

It loads the app through a throwaway Vite server in SSR mode — same resolution as the client
build, so aliases, TSX and CSS imports behave identically and there is no second bundle to
keep in sync. No new dependency; vite is already here. `src/main.tsx` calls `hydrateRoot`
when the container has markup and `createRoot` when it does not, so dev still works.

Two things this must never break, both tested:

- **The proof gate holds in raw HTML.** With no live `PROOF_ITEMS` entry, the prerendered
  markup contains no "The work", no "What I do", not even a `#work` anchor
  ([src/App.test.tsx](src/App.test.tsx)). Hiding a section in the browser while shipping it in
  the source would publish a claim to exactly the readers who cannot see it withdrawn.
- **The build stays deterministic.** Two consecutive builds produce a byte-identical
  `dist/index.html`. The only clock-dependent text is the day stamp, which carries the build
  day in the HTML and is corrected to today by the browser on hydration —
  `suppressHydrationWarning` on that one element, and nowhere else.

`injectPrerenderedHtml` throws if the mount point is missing or the app renders empty, rather
than shipping a blank shell that looks fine in a browser and is invisible to everything else.
The leak guard's `--dist` pass now covers this markup: prerendering turned generated output
into a new place a forbidden string could surface.

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
- `BUTTONDOWN_URL` — the public Buttondown embed action; if empty, the signup section shows a
  "follow on X" fallback.
- `ANALYTICS_CODE` — the visit counter, off while empty (see below).
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

Conversion copy lives one level up from config, in [src/lib/offer.ts](src/lib/offer.ts):
`POSITIONING`, `SERVICES`, `NEWSLETTER_PROMISE`, `NEWSLETTER_TERMS`, `SERIES` and
`OFFER_UPDATED` (the sitemap `lastmod` for `/work/` — a fixed date, bumped by hand when the
offer changes, never read off the clock).

## Turning the visit counter on (two minutes, once)

The site counts visits with [GoatCounter](https://www.goatcounter.com/): free at this size,
open source, self-hostable, no cookies, and no IP address or User-Agent kept in its database.
The stance in the footer did not soften — it got accurate. Refusing to measure is not privacy,
it is blindness, and launch traffic arrives exactly once.

1. Sign up at [goatcounter.com](https://www.goatcounter.com/) and pick a site code — the
   subdomain of your dashboard, e.g. `roadto100k` → `roadto100k.goatcounter.com`.
2. Set `ANALYTICS_CODE: 'roadto100k'` in [src/config.ts](src/config.ts). That is the whole
   integration; nothing else to paste.
3. Commit and push. Actions redeploys, and `npm run build` prints
   `visit counter: on (roadto100k.goatcounter.com)`.

Optional and very much in the spirit of the place: in GoatCounter's settings, tick
*"Make statistics publicly available"* so the traffic numbers are as public as the ledger.

What the build guarantees, so a broken counter can't read as a quiet launch:

- Empty code → no GoatCounter script or count request, **and no sentence claiming visits are
  counted.** The Buttondown form action remains the separate submit-time surface. A page that
  advertises a counter it doesn't have is the same lie as a green check that never ran.
- Malformed code (a full URL, a hostname, uppercase, a placeholder) → the **build fails** with
  `Invalid ANALYTICS_CODE`. A dead beacon would report zero, and zero visits is
  indistinguishable from zero measurement.
- Every build prints the counter's state, on or `OFF`.
- The script is `async` and skips localhost, so dev and preview never pollute the numbers.
- The counted number is a floor: readers with JavaScript off are never counted.

## Publishing a silent-green entry

Entries live in [src/data/series.json](src/data/series.json), oldest first:

```json
{
  "number": 1,
  "slug": "the-guard-that-could-not-look",
  "date": "2026-07-29",
  "title": "The guard that could not look",
  "dek": "One sentence — used as the meta description and the index blurb.",
  "body": [
    "A paragraph.",
    { "callout": "The rule: silence is its own state." },
    { "list": ["Break an import.", "Run the whole pipeline.", "Read the report."] }
  ]
}
```

A `body` block is one of three shapes and nothing else — no Markdown, no parser:

- a **string** → a paragraph;
- `{ "callout": "…" }` → the rule the finding produced, set against the red margin;
- `{ "list": ["…"] }` → the numbered probe. A finding nobody can reproduce is an anecdote,
  so entries carry the steps that find the same bug in the reader's own pipeline.

`parseSeries` rejects an out-of-order `number`, a slug that is not lowercase-hyphenated, an
impossible date, a duplicate slug, a blank title/dek, an empty body, a blank paragraph, a
block that is neither shape, a block claiming to be both, and an empty or blank list step —
the build stops rather than shipping a dead link or a page of whitespace to somebody who
followed a citation. Push, and the entry page, the index row and the sitemap entry appear
together.

Slugs are permanent: `/silent-green/<slug>/` is the address other people link to.
