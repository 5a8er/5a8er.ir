import type { Project } from '@/content/types'

const STATUS_LABEL: Record<Project['status'], string> = {
  building: 'In progress',
  shipped: 'Shipped',
  maintained: 'Maintained',
}

function LabelledBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-subtle">
        {label}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted">{children}</p>
    </div>
  )
}

function BulletList({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-subtle">
        {label}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((item) => (
          <li
            key={item}
            className="relative ps-4 text-sm leading-relaxed text-muted before:absolute before:start-0 before:top-[0.6em] before:size-1 before:rounded-full before:bg-accent-edge"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Architecture and security detail sits behind a `<details>` disclosure.
 *
 * The two audiences want different things from the same card: a recruiter
 * skims three projects in twenty seconds, a security engineer wants to know
 * exactly what "secure" meant here. Showing everything makes the grid
 * unskimmable; showing only the summary throws away the strongest signal on
 * the page. A disclosure serves both, and its label advertises that the depth
 * exists.
 *
 * `<details>` rather than a state hook: it is keyboard operable, findable by
 * in-page search when open, and costs no JavaScript.
 */
export function ProjectCard({ project, wide = false }: { project: Project; wide?: boolean }) {
  return (
    <article
      className={`group flex flex-col rounded-lg border border-line bg-surface p-6 transition-colors hover:border-line-strong sm:p-7 ${
        wide ? 'lg:col-span-2' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-lg font-semibold tracking-tight text-fg">
          {project.name}
        </h3>
        <span className="mt-1 inline-flex shrink-0 items-center gap-1.5 font-mono text-[0.6875rem] uppercase tracking-wider text-subtle">
          <span
            aria-hidden="true"
            className={`size-1.5 rounded-full ${
              project.status === 'building' ? 'bg-accent' : 'bg-line-strong'
            }`}
          />
          {STATUS_LABEL[project.status]}
        </span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-fg">{project.summary}</p>

      <div className={`mt-6 grid gap-6 ${wide ? 'lg:grid-cols-2' : ''}`}>
        <LabelledBlock label="Problem">{project.problem}</LabelledBlock>
        <LabelledBlock label="Approach">{project.approach}</LabelledBlock>
      </div>

      <ul className="mt-6 flex flex-wrap gap-1.5">
        {project.stack.map((tech) => (
          <li
            key={tech}
            className="rounded border border-line bg-inset px-2 py-1 font-mono text-[0.6875rem] text-muted"
          >
            {tech}
          </li>
        ))}
      </ul>

      <details className="group/details mt-6 border-t border-line pt-5 [&_summary::-webkit-details-marker]:hidden">
        <summary className="flex cursor-pointer list-none items-center gap-2 font-mono text-xs text-accent transition-colors hover:text-accent-hover">
          <span
            aria-hidden="true"
            className="transition-transform group-open/details:rotate-90"
          >
            ›
          </span>
          Architecture &amp; security decisions
        </summary>

        <div className={`mt-5 grid gap-6 ${wide ? 'lg:grid-cols-2' : ''}`}>
          <BulletList label="Architecture" items={project.architecture} />
          <BulletList label="Security" items={project.security} />
        </div>
      </details>
    </article>
  )
}
