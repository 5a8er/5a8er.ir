import Link from 'next/link'
import { ResponsePanel } from '@/components/ui/ResponsePanel'

/**
 * The hero is a thesis: this person builds systems and can show you the seams.
 *
 * The largest visual object is a block of HTTP headers rather than a portrait,
 * a gradient, or an illustration. That is a deliberate risk. It is justified
 * by the audience — recruiters, security teams, and technical founders, people
 * who read headers for a living — and by the fact that it is the only hero
 * element that is decoration, proof, and content at once.
 */
export function Hero() {
  return (
    <section className="hero-grid relative isolate overflow-hidden border-b border-line">
      <div className="mx-auto grid max-w-6xl gap-14 px-[var(--gutter)] py-20 sm:py-28 lg:grid-cols-[minmax(0,1fr)_minmax(0,29rem)] lg:items-center lg:gap-16">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
            Software engineer · Security practitioner
          </p>

          <h1 className="mt-6 text-fg">
            <span className="block text-lg font-medium tracking-tight text-muted">
              Saber
            </span>
            <span className="mt-2 block text-[clamp(2.25rem,6vw,3.75rem)] font-semibold leading-[1.05] tracking-[-0.035em]">
              Engineering secure, scalable web systems
            </span>
          </h1>

          <p className="mt-7 max-w-[52ch] text-lg leading-relaxed text-muted">
            I build backend systems and then try to break them. Web application
            security, DevSecOps, and the infrastructure underneath both.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              href="#contact"
              className="inline-flex h-11 items-center rounded-md bg-accent px-5 text-sm font-medium text-accent-on transition-colors hover:bg-accent-hover"
            >
              Get in touch
            </Link>
            <Link
              href="#projects"
              className="inline-flex h-11 items-center rounded-md border border-line-strong px-5 text-sm font-medium text-fg transition-colors hover:border-accent hover:text-accent"
            >
              View projects
            </Link>
          </div>
        </div>

        <div className="lg:justify-self-end lg:self-start">
          <ResponsePanel />
        </div>
      </div>
    </section>
  )
}
