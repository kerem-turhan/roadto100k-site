import { Reveal } from '@/components/Reveal'
import { SectionHeader } from '@/components/SectionHeader'
import rawLedger from '@/data/ledger.json'
import { formatUsd, ledgerTotals, parseLedger } from '@/lib/ledger'

const ledger = parseLedger(rawLedger)
const totals = ledgerTotals(ledger)

const SUMMARY = [
  { label: 'Cumulative revenue', value: formatUsd(totals.cumulativeRevenue) },
  { label: 'MRR', value: formatUsd(totals.currentMrr) },
  { label: 'Total spend', value: formatUsd(totals.totalSpend) },
  { label: 'Email subs', value: String(totals.emailSubs) },
] as const

function formatWeekEnding(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const LABEL = 'font-mono text-[0.6875rem] tracking-[0.2em] text-ink-muted uppercase'

export function LedgerSection() {
  const progress = totals.cumulativeRevenue / ledger.goalUsd
  const newestFirst = [...ledger.weeks].reverse()

  return (
    <section aria-label="The ledger" className="border-t border-rule py-[2.75rem] md:py-[4.125rem]">
      <Reveal>
        <div className="flex items-baseline justify-between gap-4">
          <SectionHeader eyebrow={`Week ${totals.weekNumber}`} title="The ledger" />
          <p className="hidden shrink-0 font-mono text-xs tracking-widest text-ink-muted uppercase sm:block">
            Updated Sundays
          </p>
        </div>
        <p className="-mt-2 mb-10 max-w-[52ch] leading-relaxed text-ink-muted">
          Real numbers. Nothing rounded up, nothing hidden. A chart shows up once there's a
          curve worth drawing — an empty one would be decoration, not honesty.
        </p>

        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-rule bg-rule md:grid-cols-4">
          {SUMMARY.map((stat) => (
            <div key={stat.label} className="bg-paper px-4 py-5">
              <dt className={`mb-1 flex min-h-[2.1em] items-end ${LABEL}`}>{stat.label}</dt>
              <dd className="font-mono text-2xl font-medium md:text-3xl">{stat.value}</dd>
            </div>
          ))}
        </dl>

        {/* The goal line: a single rule with the $100k mark inked in red at the end. */}
        <div className="mt-6" aria-label={`Progress toward ${formatUsd(ledger.goalUsd)}`}>
          <div className="relative h-2">
            <div className="absolute inset-x-0 top-1/2 h-px bg-rule" />
            <div
              className="absolute top-1/2 h-px bg-ledger-green"
              style={{ width: `${Math.min(100, progress * 100)}%`, minWidth: progress > 0 ? '2px' : 0 }}
            />
            <div className="absolute top-0 right-0 h-2 w-px bg-ledger-red" />
          </div>
          <p className={`mt-2 ${LABEL} tracking-widest`}>
            {formatUsd(totals.cumulativeRevenue)} of {formatUsd(ledger.goalUsd)} ·{' '}
            {(progress * 100).toFixed(1)}%
          </p>
        </div>

        {/* Mobile: stacked ledger entries, so the weekly note never hides behind a scroll. */}
        <ul className="mt-10 sm:hidden">
          {newestFirst.map((week, idx) => (
            <li key={week.weekEnding} className="border-b border-rule py-4 first:border-t">
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-sm font-medium">
                  {formatWeekEnding(week.weekEnding)}
                </span>
                <span className={LABEL}>
                  № {String(ledger.weeks.length - idx).padStart(3, '0')}
                </span>
              </div>
              <dl className="mt-3 grid grid-cols-4 gap-2">
                {(
                  [
                    ['Rev', formatUsd(week.revenue), week.revenue > 0],
                    ['MRR', formatUsd(week.mrr), false],
                    ['Spend', formatUsd(week.spend), false],
                    ['Subs', String(week.emailSubs), false],
                  ] as const
                ).map(([label, value, positive]) => (
                  <div key={label}>
                    <dt className="font-mono text-[0.6875rem] tracking-[0.15em] text-ink-muted uppercase">
                      {label}
                    </dt>
                    <dd className={`font-mono text-sm ${positive ? 'text-ledger-green' : ''}`}>
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">{week.note}</p>
            </li>
          ))}
        </ul>

        <div className="mt-10 hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[38rem] border-collapse text-left">
            <thead>
              <tr className={`border-b border-rule ${LABEL}`}>
                <th scope="col" className="py-3 pr-3 font-normal">№</th>
                <th scope="col" className="py-3 pr-4 font-normal">Week ending</th>
                <th scope="col" className="py-3 pr-4 text-right font-normal">Revenue</th>
                <th scope="col" className="py-3 pr-4 text-right font-normal">MRR</th>
                <th scope="col" className="py-3 pr-4 text-right font-normal">Spend</th>
                <th scope="col" className="py-3 pr-4 text-right font-normal">Subs</th>
                <th scope="col" className="py-3 font-normal">Note</th>
              </tr>
            </thead>
            <tbody>
              {newestFirst.map((week, idx) => (
                <tr
                  key={week.weekEnding}
                  className="border-b border-rule align-baseline transition-colors duration-150 hover:bg-ledger-red/5"
                >
                  <td className="py-3.5 pr-3 font-mono text-xs text-ink-muted">
                    {String(ledger.weeks.length - idx).padStart(3, '0')}
                  </td>
                  <td className="py-3.5 pr-4 font-mono text-sm whitespace-nowrap">
                    {formatWeekEnding(week.weekEnding)}
                  </td>
                  <td
                    className={`py-3.5 pr-4 text-right font-mono text-sm ${week.revenue > 0 ? 'text-ledger-green' : ''}`}
                  >
                    {formatUsd(week.revenue)}
                  </td>
                  <td className="py-3.5 pr-4 text-right font-mono text-sm">{formatUsd(week.mrr)}</td>
                  <td className="py-3.5 pr-4 text-right font-mono text-sm">{formatUsd(week.spend)}</td>
                  <td className="py-3.5 pr-4 text-right font-mono text-sm">{week.emailSubs}</td>
                  <td className="min-w-[14rem] py-3.5 text-sm leading-relaxed text-ink-muted">
                    {week.note}
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Accounting convention: the final total sits on a double rule. */}
            <tfoot>
              <tr style={{ borderTop: '4px double var(--ink)' }}>
                <td className="pt-3.5" />
                <td className={`pt-3.5 pr-4 ${LABEL}`}>Total</td>
                <td
                  className={`pt-3.5 pr-4 text-right font-mono text-sm ${totals.cumulativeRevenue > 0 ? 'text-ledger-green' : ''}`}
                >
                  {formatUsd(totals.cumulativeRevenue)}
                </td>
                <td className="pt-3.5 pr-4 text-right font-mono text-sm">
                  {formatUsd(totals.currentMrr)}
                </td>
                <td className="pt-3.5 pr-4 text-right font-mono text-sm">
                  {formatUsd(totals.totalSpend)}
                </td>
                <td className="pt-3.5 pr-4 text-right font-mono text-sm">{totals.emailSubs}</td>
                <td className="pt-3.5" />
              </tr>
            </tfoot>
          </table>
        </div>
      </Reveal>
    </section>
  )
}
