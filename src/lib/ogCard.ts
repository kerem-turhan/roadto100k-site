import { calendarDaysBetween, parseIsoDate } from './days.ts'
import type { FontSubsets } from './fonts.ts'
import { fontFaceCss } from './fonts.ts'
import type { Ledger } from './ledger.ts'
import { formatUsd } from './ledger.ts'
import { escapeMarkup, formatDateLong, formatDateLongTr, truncate } from './text.ts'

/**
 * Source HTML for one week's 1200x630 share card. Rendered to PNG locally by
 * `npm run og` (scripts/render-og.ts) and committed to `public/og/w/` — CI
 * never runs a browser. Everything on the card is real ledger data.
 */

export interface OgFonts {
  /** Display face (variable woff2) — the heading. */
  display: FontSubsets
  /** IBM Plex Mono 500 (woff2) — labels and numbers. */
  mono: FontSubsets
  /** Body face (variable woff2) — the week's note. */
  body: FontSubsets
}

export type OgLang = 'en' | 'tr'

const COPY = {
  en: {
    entry: 'Ledger entry',
    dateline: (week: string, day: number, span: number) =>
      `Week ending ${formatDateLong(week)} · day ${day} of ${span}`,
    heading: (index: number) => `Week ${index}`,
    labels: ['Revenue (wk)', 'MRR', 'Spend (wk)', 'Email subs'],
    foot: (cumulative: string, goal: string) => `${cumulative} of ${goal} · every number public`,
  },
  tr: {
    entry: 'Defter kaydı',
    dateline: (week: string, day: number, span: number) =>
      `${formatDateLongTr(week)} haftası · gün ${day}/${span}`,
    heading: (index: number) => `Hafta ${index}`,
    labels: ['Gelir (hafta)', 'MRR', 'Gider (hafta)', 'Aboneler'],
    // No English words: CSS uppercase under lang="tr" would turn "public"
    // into "PUBLİC".
    foot: (cumulative: string, goal: string) => `${cumulative} / ${goal} · her rakam açık`,
  },
} as const

export interface WeekOgInput {
  ledger: Ledger
  /** Index into `ledger.weeks` — also the week number. */
  index: number
  fonts: OgFonts
  /** Turkish cards quote the week's `trNote`; only build one when it exists. */
  lang?: OgLang
}

export const OG_WIDTH = 1200
export const OG_HEIGHT = 630

/** Longest note that still fits the card's two lines. */
const NOTE_MAX = 104

/** A screenshot cannot re-flow, so card faces block instead of swapping. */
function cardFontFaces(fonts: OgFonts): string {
  return [
    fontFaceCss({
      family: 'Bricolage Grotesque Variable',
      weight: '200 800',
      format: 'woff2-variations',
      src: fonts.display,
      display: 'block',
    }),
    fontFaceCss({
      family: 'IBM Plex Mono',
      weight: '500',
      format: 'woff2',
      src: fonts.mono,
      display: 'block',
    }),
    fontFaceCss({
      family: 'Public Sans Variable',
      weight: '100 900',
      format: 'woff2-variations',
      src: fonts.body,
      display: 'block',
    }),
  ].join('\n')
}

function cell(label: string, value: string, positive = false): string {
  return `      <div class="cell">
        <p class="label">${label}</p>
        <p class="value${positive ? ' green' : ''}">${escapeMarkup(value)}</p>
      </div>`
}

export function weekOgHtml({ ledger, index, fonts, lang = 'en' }: WeekOgInput): string {
  const week = ledger.weeks[index]
  const copy = COPY[lang]
  const note = lang === 'tr' ? (week.trNote ?? week.note) : week.note
  const cumulative = ledger.weeks.slice(0, index + 1).reduce((sum, w) => sum + w.revenue, 0)
  const day = calendarDaysBetween(parseIsoDate(ledger.startDate), parseIsoDate(week.weekEnding))
  const span = calendarDaysBetween(parseIsoDate(ledger.startDate), parseIsoDate(ledger.goalDate))

  return `<!doctype html>
<html lang="${lang}">
  <head>
    <meta charset="UTF-8" />
    <style>
${cardFontFaces(fonts)}
      * { box-sizing: border-box; margin: 0; }
      html, body { width: ${OG_WIDTH}px; height: ${OG_HEIGHT}px; overflow: hidden; }
      body {
        --paper: #edf2e7;
        --rule: #c7d6c2;
        --ink: #1b2620;
        --ink-muted: #55645b;
        --red: #bf3b2f;
        --green: #2f5c45;
        background: var(--paper);
        color: var(--ink);
        font-family: 'Bricolage Grotesque Variable', sans-serif;
        position: relative;
      }
      .lines {
        position: absolute;
        inset: 0;
        background-image: repeating-linear-gradient(
          to bottom, transparent 0, transparent 51px, var(--rule) 51px, var(--rule) 52px
        );
        opacity: 0.55;
      }
      .margin {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 88px;
        width: 5px;
        border-left: 2px solid var(--red);
        border-right: 2px solid var(--red);
        opacity: 0.75;
      }
      .content {
        position: absolute;
        left: 140px;
        right: 72px;
        top: 64px;
        bottom: 56px;
        display: flex;
        flex-direction: column;
      }
      .mono { font-family: 'IBM Plex Mono', monospace; font-weight: 500; font-variant-numeric: tabular-nums lining-nums; }
      .eyebrow {
        font-size: 21px;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        color: var(--red);
        white-space: nowrap;
      }
      h1 {
        margin-top: 14px;
        font-weight: 750;
        font-size: 92px;
        line-height: 1.02;
        letter-spacing: -0.02em;
        white-space: nowrap;
      }
      .dateline {
        margin-top: 12px;
        font-size: 21px;
        color: var(--ink-muted);
        white-space: nowrap;
      }
      .figures {
        display: flex;
        margin-top: 34px;
        border: 1px solid var(--rule);
        border-radius: 2px;
        background: var(--rule);
        gap: 1px;
      }
      .cell { flex: 1; background: var(--paper); padding: 18px 20px; }
      .label {
        font-family: 'IBM Plex Mono', monospace;
        font-weight: 500;
        font-size: 18px;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: var(--ink-muted);
      }
      .value {
        margin-top: 8px;
        font-family: 'IBM Plex Mono', monospace;
        font-weight: 500;
        font-size: 40px;
        font-variant-numeric: tabular-nums lining-nums;
      }
      .green { color: var(--green); }
      .note {
        font-family: 'Public Sans Variable', sans-serif;
        margin-top: 30px;
        border-left: 3px solid var(--red);
        padding-left: 22px;
        font-size: 28px;
        line-height: 1.4;
        max-height: 82px;
        overflow: hidden;
      }
      .foot {
        margin-top: auto;
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 24px;
        font-size: 22px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--ink-muted);
        white-space: nowrap;
      }
      .foot .brand { color: var(--ink); }
      .foot .red { color: var(--red); }
    </style>
  </head>
  <body>
    <div class="lines"></div>
    <div class="margin"></div>
    <div class="content">
      <p class="eyebrow mono">${copy.entry} № ${String(index + 1).padStart(3, '0')}</p>
      <h1>${copy.heading(index)}</h1>
      <p class="dateline mono">${copy.dateline(week.weekEnding, day, span)}</p>
      <div class="figures">
${cell(copy.labels[0], formatUsd(week.revenue), week.revenue > 0)}
${cell(copy.labels[1], formatUsd(week.mrr))}
${cell(copy.labels[2], formatUsd(week.spend))}
${cell(copy.labels[3], String(week.emailSubs))}
      </div>
      <p class="note">${escapeMarkup(truncate(note, NOTE_MAX))}</p>
      <div class="foot mono">
        <span class="brand">roadto100k<span class="red">w</span>kerem</span>
        <span>${escapeMarkup(copy.foot(formatUsd(cumulative), formatUsd(ledger.goalUsd)))}</span>
      </div>
    </div>
  </body>
</html>
`
}

/**
 * Every card the ledger needs: one English card per week, plus a Turkish one
 * for each week that has a `trNote`.
 */
export function weekOgCards(
  ledger: Ledger,
  fonts: OgFonts,
): Array<{ weekEnding: string; lang: OgLang; html: string }> {
  return ledger.weeks.flatMap((week, index) => [
    { weekEnding: week.weekEnding, lang: 'en' as const, html: weekOgHtml({ ledger, index, fonts }) },
    ...(week.trNote
      ? [
          {
            weekEnding: week.weekEnding,
            lang: 'tr' as const,
            html: weekOgHtml({ ledger, index, fonts, lang: 'tr' }),
          },
        ]
      : []),
  ])
}
