import { Reveal } from '@/components/Reveal'
import { SectionHeader } from '@/components/SectionHeader'

/**
 * No contact line here on purpose: "The work" owns the ask, so the same mailto
 * is not rendered twice ~600px apart. If the proof gate ever hides that section
 * the footer still carries the address.
 */
export function Building() {
  return (
    <section aria-label="What I'm building" className="border-t border-rule py-[2.75rem] md:py-[4.125rem]">
      <Reveal>
        <SectionHeader eyebrow="Two engines" title="What I'm building" />
        <div className="max-w-[56ch] space-y-5 leading-relaxed">
          <p>
            AI writes most of my code now. It's fast — and sometimes silently wrong:{' '}
            <em>tests green, build green, behavior quietly changed.</em> My first product catches
            that exact moment before it ships. Name and details when it's real — weeks away, not
            months.
          </p>
          <p>
            Second lane: I help AI teams make their agents actually reliable — evals, regression
            tests, guardrails. Consulting funds the road while the product grows.
          </p>
        </div>
      </Reveal>
    </section>
  )
}
