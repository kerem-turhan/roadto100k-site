import { Reveal } from '@/components/Reveal'
import { SectionHeader } from '@/components/SectionHeader'
import { config } from '@/config'
import type { ProofItem } from '@/lib/proof'
import { liveProofItems } from '@/lib/proof'

interface ProofSectionProps {
  items?: readonly ProofItem[]
  contactEmail?: string
}

const SERVICES = [
  {
    name: 'Reliability audit',
    text: 'A reproducible teardown of your agent: where it fails open, with receipts.',
  },
  {
    name: 'Eval harness setup',
    text: 'A deterministic corpus and a regression gate wired into your CI.',
  },
  {
    name: 'Ongoing reliability support',
    text: 'Keeping the numbers honest as the agent keeps changing.',
  },
] as const

/**
 * Proof of work. Renders nothing at all — no heading, no empty frame — until
 * at least one config.PROOF_ITEMS entry has a real public URL. Claims without
 * receipts don't belong on a ledger.
 */
export function ProofSection({
  items = config.PROOF_ITEMS,
  contactEmail = config.CONTACT_EMAIL,
}: ProofSectionProps = {}) {
  const live = liveProofItems(items)
  if (live.length === 0) return null

  return (
    <section
      id="work"
      aria-label="Proof of work"
      className="border-t border-rule py-[2.75rem] md:py-[4.125rem]"
    >
      <Reveal>
        <SectionHeader eyebrow="Receipts, not claims" title="The work" />
        <ul>
          {live.map((item, i) => (
            <li
              key={item.url}
              className={`border-t border-rule py-6 ${i === 0 ? 'border-t-0 pt-0' : ''}`}
            >
              <h3 className="max-w-[44ch] text-lg leading-snug font-medium">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-rule underline-offset-4 transition-colors hover:decoration-ledger-red"
                >
                  {item.title} ↗
                </a>
              </h3>
              <p className="mt-2 max-w-[56ch] leading-relaxed text-ink-muted">
                {item.description}
              </p>
              {item.stats.length > 0 && (
                <p className="mt-3 font-mono text-xs tracking-[0.15em] text-ledger-green uppercase">
                  {item.stats.join(' · ')}
                </p>
              )}
            </li>
          ))}
        </ul>

        <div className="mt-10 max-w-xl rounded-sm border border-rule bg-paper-raised p-6">
          <p className="mb-4 font-mono text-[0.6875rem] tracking-[0.2em] text-ink-muted uppercase">
            What I do
          </p>
          <ul className="space-y-3">
            {SERVICES.map((service) => (
              <li key={service.name} className="text-sm leading-relaxed">
                <span className="font-medium">{service.name}</span>
                <span className="text-ink-muted"> — {service.text}</span>
              </li>
            ))}
          </ul>
          {contactEmail && (
            <p className="mt-5 font-mono text-sm">
              <span className="text-ink-muted">For agent-reliability work → </span>
              <a
                href={`mailto:${contactEmail}`}
                className="-my-1.5 inline-block py-1.5 text-ledger-green underline decoration-rule underline-offset-4 transition-colors hover:decoration-ledger-green"
              >
                {contactEmail}
              </a>
            </p>
          )}
        </div>
      </Reveal>
    </section>
  )
}
