import type { ReactNode } from 'react'

/**
 * Section heading pattern: a mono eyebrow, then a *claim*, then the evidence.
 *
 * The headings are sentences rather than single nouns ("Three systems, and
 * what could go wrong with each", not "Projects") because the whole page is
 * arranged as claim-then-proof. A one-word label would throw that away and
 * make the section indistinguishable from any other portfolio's.
 *
 * No 01 / 02 / 03 markers: the sections are not a sequence, so numbering them
 * would assert an order the reader does not need.
 */
export function Section({
  id,
  eyebrow,
  title,
  lede,
  children,
  className = '',
}: {
  id: string
  eyebrow: string
  title: string
  lede?: string
  children: ReactNode
  className?: string
}) {
  const headingId = `${id}-heading`

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={`border-t border-line py-[var(--section-y)] ${className}`}
    >
      <div className="mx-auto max-w-6xl px-[var(--gutter)]">
        <header className="max-w-[46rem]">
          <p className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-accent">
            {eyebrow}
            <span aria-hidden="true" className="h-px flex-1 bg-line" />
          </p>

          <h2
            id={headingId}
            className="mt-5 text-3xl font-semibold tracking-[-0.025em] text-fg sm:text-4xl"
          >
            {title}
          </h2>

          {lede ? (
            <p className="mt-4 text-base leading-relaxed text-muted">{lede}</p>
          ) : null}
        </header>

        <div className="mt-12">{children}</div>
      </div>
    </section>
  )
}
