# roadto100kwkerem — journey site v1 plan

Single-page, English, static. The page's one job: convince an AI-dev / indie-hacker visitor
that this journey is worth following — via email signup or X follow — by showing radical,
verifiable transparency.

Brand voice (from ../marketing/X-LANSMAN.md, binding): honest numbers, "the boring middle",
no hype, $0 written as $0. Leak rules (§6, binding until M3): no product name, no mechanism,
no repo link — category only.

---

## 1. Design direction — "The Honest Ledger"

The page is styled as a sheet of classic accounting ledger paper: pale green stock, ruled
rows, a red margin rule. The subject *is* a public ledger — the design is the content.

### Signature element
The hero is the top of a ledger sheet: faint ruled baselines run behind the headline, a red
vertical margin rule anchors the left edge, and a live **day stamp** (`DAY 1 · 165 DAYS
LEFT`, monospace, stamp-like bordered label) is the only moving part — it counts up once on
load. Zeros in the ledger are rendered proudly, never hidden.

### Color tokens (palette cap: 5 + neutrals derived from these)
| Token | Light ("ledger paper") | Dark ("night ledger") | Role |
|---|---|---|---|
| `--paper` | `#EDF2E7` | `#0F1511` | page background |
| `--rule` | `#C7D6C2` | `#26332A` | ledger row rules, borders |
| `--ink` | `#1B2620` | `#E3EBDD` | primary text |
| `--ink-muted` | `#55645B` | `#8FA096` | secondary text, captions |
| `--red` | `#BF3B2F` | `#E2604F` | margin rule, goal line, emphasis, focus ring |
| `--green` | `#2F5C45` | `#7FB89A` | links, positive deltas (used sparingly) |

### Type (3 roles, all self-hosted via @fontsource — $0)
- **Display — Bricolage Grotesque** (variable): H1/H2 only. Tight tracking, heavy weights.
- **Data — IBM Plex Mono**: every number, the day stamp, table cells, eyebrows/section
  labels (uppercase, letter-spaced), footer meta. Tabular numerals everywhere.
- **Body — Public Sans** (variable): paragraphs. Quiet on purpose.

### Layout & structure
Single column, max-width ~68ch, generous whitespace. A continuous red margin rule runs down
the left edge (desktop; collapses to a top rule on mobile). Sections are separated by 1px
ledger rules — the rules encode "entries in a book", which is literally what the content is.
Section labels sit in the margin gutter in mono caps. Radius ≈ 0 (2px on interactive
elements only) — paper has no rounded corners.

### Motion (Motion lib, restrained)
One orchestrated load sequence: margin rule draws in → ledger rows fade up in order → day
counter counts 0→N (~0.8s). Hover micro-interactions on links/buttons only.
`prefers-reduced-motion` disables all of it (counter renders final value instantly).

### Self-critique vs AI-default looks
Rules + near-zero radius risk reading as the generic "broadsheet" default. What keeps this
specific: the accounting-paper palette (pale green stock + ledger red — not cream/terracotta,
not black/acid-green), the day-stamp signature, and rules that mean something (ledger rows).
Boldness is spent in exactly one place: the hero-as-ledger-sheet. Everything else stays quiet.

---

## 2. Content (final copy, English)

### Hero
- Eyebrow (mono caps): `A PUBLIC LEDGER — ANKARA, TR`
- H1: **$0 → $100k by Dec 31, 2026.**
- Day stamp (live): `DAY {n} · {daysLeft} DAYS LEFT`
- One-liner: *I'm Kerem — CS senior building AI dev tools, with AI, in public. I've never
  shipped a product or earned $1 online. This page is the receipt trail.*

### The rules (3 ledger entries)
1. **$100/month budget.** Everything runs on free tiers; every dollar spent shows up in the
   ledger below.
2. **$0 on ads.** Growth has to come from building in the open — or not at all.
3. **Every number is public.** Revenue, spend, subscribers — including the $0 weeks.
   Especially the $0 weeks.

### The ledger
- Intro: *Updated every Sunday. Real numbers, nothing rounded up, nothing hidden.*
- Summary strip (mono, large): `CUMULATIVE REVENUE $0 · TOTAL SPEND $0 · WEEK 0`
- Table: Week ending · Revenue · MRR · Spend · Email subs · Note
- Seed row (real zeros): `2026-07-19 · $0 · $0 · $0 · 0 · "Day 0 — plan done, site live,
  nothing sold yet."`
- Data source: `src/data/ledger.json` (validated at runtime; unit-tested parser).
  Chart appears automatically once there are ≥4 weeks with a non-zero value; until then the
  table alone is more honest than an empty graph.

### What I'm building (leak-safe — category only)
> AI writes most of my code now. It's fast — and sometimes silently wrong: tests green,
> build green, behavior quietly changed. My first product catches that exact moment before
> it ships. Name and details when it's real — weeks away, not months.
>
> Second lane: I help AI teams make their agents actually reliable — evals, regression
> tests, guardrails. Consulting funds the road while the product grows.
> *(+ one contact line, rendered only if `CONTACT_EMAIL` is set in config.)*

### Get the Sunday numbers (email)
- *One email a week: the full ledger, plus the lesson that cost the most to learn. The $0
  weeks arrive on schedule too.*
- Buttondown embed form; action URL from `src/config.ts` → `BUTTONDOWN_URL` (single source).
- Empty-URL fallback: *"The list isn't open yet — follow along on X."* (X link also from config.)

### Footer
`X · GitHub` + *No cookies, no tracking, $0/mo hosting. Built in public.*

---

## 3. Config (single source of truth — `src/config.ts`)
```ts
BUTTONDOWN_URL = ""   // Kerem fills after creating the Buttondown account
X_URL          = "https://x.com/mkeremturhan"
GITHUB_URL     = "https://github.com/kerem-turhan"
CONTACT_EMAIL  = "keremturhan.cs@gmail.com"
START_DATE     = "2026-07-19" // day 0, same anchor as the X account
GOAL_DATE      = "2026-12-31"
```

## 4. Task list (Phase 1)
1. Theme tokens in `index.css` (Tailwind v4 `@theme`) + dark mode + fonts
2. Layout shell: margin rule, section scaffolding, container
3. Hero + day counter (`src/lib/days.ts` + Vitest unit tests, incl. timezone edges)
4. Rules section
5. Ledger: `ledger.json` seed, parser/validator in `src/lib/ledger.ts` + Vitest tests, table + summary strip
6. Building + signup (Buttondown/fallback) + footer
7. Load animation sequence + reduced-motion path
8. Meta: title/description, OG tags, OG image (1200×630, rendered from the design), SVG+PNG favicon
9. A11y pass: landmarks, focus-visible (red ring), contrast check, keyboard
10. README: what this is + **weekly ledger update flow** (edit `ledger.json` → commit → push → Pages redeploys)
11. `git init` (main) → conventional commits → `gh repo create roadto100k-site --public --push`
12. GitHub Pages via Actions workflow (`base: '/roadto100k-site/'` already set)
13. Verify live URL myself; run design-reviewer (Opus 4.8 high); fix findings; re-run if needed

## 5. Risks / open points
- **Buttondown URL is empty at launch** — fallback (follow on X) handles it; Kerem plugs the
  URL in later (one-line config edit).
- **GH Pages project path** (`/roadto100k-site/`): asset base is set; switch `base` to `'/'` if a custom domain arrives later.
- **All-zero ledger**: charts deferred by design until data exists — honesty over decoration.
