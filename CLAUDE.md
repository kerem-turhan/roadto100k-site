# roadto100k-site — project rules

Single-page journey site for the roadto100kwkerem brand. Vite + React + TS strict +
Tailwind v4 + shadcn/ui + Motion. Static, deployed to GitHub Pages.
Full plan & copy: [docs/plan.md](docs/plan.md).

## Hard rules (binding)
- **Write scope:** this directory only. The parent planning repo (`../`) is read-only.
- **Leak prevention** (binding until the product's soft launch; source: the parent repo's
  launch docs, §6): the unreleased product's name, its mechanism, repo links, and
  plugin/marketplace details must NEVER appear in this site's code, copy, meta tags,
  comments, or commit messages. Category language only ("the tool that catches AI silently
  breaking your code"). This file is public too — keep it name-free.
- **No fake data.** Ledger numbers come from `src/data/ledger.json` and are real — zeros
  stay zeros. No invented testimonials, follower counts, or projections.
- **No internship-employer content** (NDA). The internship email address never appears
  publicly.
- **[ANLATIM.md](ANLATIM.md) is the owner's handbook** (Turkish, public — same leak rules).
  Any significant change (new section, new page type, new/changed ritual step, new config
  knob) updates it **in the same commit**. A stale handbook is a lying handbook.
- **Budget $0:** free tiers only — no paid fonts, APIs, analytics, or CDNs. Fonts are
  self-hosted via @fontsource. No external requests at runtime except the Buttondown form
  action.

## Design tokens (locked — see docs/plan.md §1 for rationale)
- Palette (light / dark): paper `#EDF2E7`/`#0F1511` · rule `#C7D6C2`/`#26332A` · ink
  `#1B2620`/`#E3EBDD` · ink-muted `#55645B`/`#8FA096` · red `#BF3B2F`/`#E2604F` · green
  `#2F5C45`/`#7FB89A`. No colors outside these tokens.
- Type: Bricolage Grotesque (display, H1/H2 only) · IBM Plex Mono (all numbers, labels,
  tables — tabular numerals) · Public Sans (body). No other families.
- Radius ≈ 0 (max 2px on interactive). Rules are 1px `--rule`. Spacing on a 4px base.
- The red margin rule + day stamp is the signature; keep everything else quiet.
- Dark mode via `.dark` class on `<html>` (system preference + toggle), both modes first-class.
- All config knobs (Buttondown URL, X URL, GitHub URL, contact email, dates) live in
  `src/config.ts` — never inline them elsewhere.

## Verification (before claiming anything done)
`npm run typecheck` → `npm run lint` → `npm run test` → `npm run build`. All green, always.
Logic (day counter, ledger parsing) is unit-tested with Vitest.

## Weekly ledger update (Kerem's Sunday ritual)
Append a week object to `src/data/ledger.json` → commit (`chore(ledger): week of YYYY-MM-DD`)
→ push to main → GitHub Actions redeploys Pages. Details in README.md.
