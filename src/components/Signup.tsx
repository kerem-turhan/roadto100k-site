import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Reveal } from '@/components/Reveal'
import { SectionHeader } from '@/components/SectionHeader'
import { config } from '@/config'

export function Signup() {
  return (
    <section aria-label="Email signup" className="border-t border-rule py-[2.75rem] md:py-[4.125rem]">
      <Reveal>
        <SectionHeader eyebrow="The Sunday numbers" title="Get the ledger by email" />
        <p className="mb-8 max-w-[52ch] leading-relaxed">
          One email a week: the full ledger, and the lesson that cost the most to learn. The $0
          weeks arrive on schedule too.
        </p>
        {config.BUTTONDOWN_URL ? (
          <form
            action={config.BUTTONDOWN_URL}
            method="post"
            target="_blank"
            className="flex max-w-md flex-col gap-3 sm:flex-row"
          >
            <label htmlFor="signup-email" className="sr-only">
              Email address
            </label>
            <Input
              id="signup-email"
              type="email"
              name="email"
              required
              placeholder="you@company.com"
              className="h-11 font-mono text-sm"
            />
            <Button type="submit" size="lg" className="h-11 shrink-0 px-6 font-mono uppercase tracking-widest">
              Subscribe
            </Button>
          </form>
        ) : (
          <div className="max-w-md rounded-sm border border-rule bg-paper-raised p-6">
            <p className="mb-4 text-sm leading-relaxed text-ink-muted">
              The list isn't open yet — until then, the numbers land every Sunday on X.
            </p>
            <Button asChild variant="outline" size="lg" className="h-11 px-6 font-mono uppercase tracking-widest">
              <a href={config.X_URL} target="_blank" rel="noreferrer">
                Follow along on X ↗
              </a>
            </Button>
          </div>
        )}
      </Reveal>
    </section>
  )
}
