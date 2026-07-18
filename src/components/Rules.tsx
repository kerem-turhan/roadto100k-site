import { Reveal } from '@/components/Reveal'
import { SectionHeader } from '@/components/SectionHeader'

const RULES = [
  {
    figure: '$100/mo',
    text: 'One hundred dollars a month, total. Everything runs on free tiers, and every dollar spent shows up in the ledger below.',
  },
  {
    figure: '$0 ads',
    text: "Not one dollar on ads. Growth comes from building in the open — or it doesn't come at all.",
  },
  {
    figure: '100% public',
    text: 'Every number is real and published. Revenue, spend, subscribers — including the $0 weeks. Especially the $0 weeks.',
  },
] as const

export function Rules() {
  return (
    <section aria-label="The rules" className="border-t border-rule py-[2.75rem] md:py-[4.125rem]">
      <Reveal>
        <SectionHeader eyebrow="Terms of the bet" title="The rules" />
        <ul>
          {RULES.map((rule, i) => (
            <li
              key={rule.figure}
              className={`grid gap-2 border-t border-rule py-6 sm:grid-cols-[10rem_1fr] sm:gap-6 ${i === 0 ? 'border-t-0 pt-0' : ''}`}
            >
              <span className="font-mono text-lg font-medium text-ledger-red">{rule.figure}</span>
              <p className="max-w-[52ch] leading-relaxed text-ink">{rule.text}</p>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  )
}
