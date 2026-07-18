interface SectionHeaderProps {
  eyebrow: string
  title: string
}

export function SectionHeader({ eyebrow, title }: SectionHeaderProps) {
  return (
    <div className="mb-8">
      <p className="mb-2 font-mono text-xs tracking-[0.25em] text-ledger-red uppercase">
        {eyebrow}
      </p>
      <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">{title}</h2>
    </div>
  )
}
