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

export function LedgerSection() {
  const progress = totals.cumulativeRevenue / ledger.goalUsd
  const newestFirst = [...ledger.weeks].reverse()

  return (
    <section aria-label="The ledger" className="border-t border-rule py-16 md:py-20">
      <Reveal>
        <div className="flex items-baseline justify-between gap-4">
          <SectionHeader eyebrow={`Week ${totals.weekNumber}`} title="The ledger" />
          <p className="hidden shrink-0 font-mono text-xs tracking-widest text-ink-muted uppercase sm:block">
            Updated Sundays
          </p>
        </div>
        <p className="-mt-2 mb-10 max-w-[52ch] leading-relaxed text-ink-muted">
          Real numbers, nothing rounded up, nothing hidden. A chart appears once there's a curve
          worth drawing — an empty graph would be decoration, not honesty.
        </p>

        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-rule bg-rule md:grid-cols-4">
          {SUMMARY.map((stat) => (
            <div key={stat.label} className="bg-paper px-4 py-5">
              <dt className="mb-1 flex min-h-[2.1em] items-end font-mono text-[0.65rem] tracking-[0.2em] text-ink-muted uppercase">
                {stat.label}
              </dt>
              <dd className="font-mono text-2xl font-medium md:text-3xl">{stat.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-6" aria-label={`Progress toward ${formatUsd(ledger.goalUsd)}`}>
          <div className="h-1 w-full rounded-sm bg-paper-raised">
            <div
              className="h-1 rounded-sm bg-ledger-green"
              style={{ width: `${Math.min(100, progress * 100)}%`, minWidth: progress > 0 ? '2px' : 0 }}
            />
          </div>
          <p className="mt-2 font-mono text-xs tracking-widest text-ink-muted uppercase">
            {formatUsd(totals.cumulativeRevenue)} of {formatUsd(ledger.goalUsd)} ·{' '}
            {(progress * 100).toFixed(1)}%
          </p>
        </div>

        <div className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-rule font-mono text-[0.65rem] tracking-[0.2em] text-ink-muted uppercase">
                <th scope="col" className="py-3 pr-4 font-normal">Week ending</th>
                <th scope="col" className="py-3 pr-4 text-right font-normal">Revenue</th>
                <th scope="col" className="py-3 pr-4 text-right font-normal">MRR</th>
                <th scope="col" className="py-3 pr-4 text-right font-normal">Spend</th>
                <th scope="col" className="py-3 pr-4 text-right font-normal">Subs</th>
                <th scope="col" className="py-3 font-normal">Note</th>
              </tr>
            </thead>
            <tbody>
              {newestFirst.map((week) => (
                <tr key={week.weekEnding} className="border-b border-rule align-baseline">
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
                  <td className="min-w-[16rem] py-3.5 text-sm leading-relaxed text-ink-muted">
                    {week.note}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Reveal>
    </section>
  )
}
