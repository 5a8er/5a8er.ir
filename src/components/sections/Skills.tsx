import { Section } from '@/components/ui/Section'
import { SKILL_GROUPS } from '@/content/skills'

/**
 * Every row is `technology — what it was used for`.
 *
 * No percentage bars, no star ratings, no "proficiency" meters. A number
 * invented for a portfolio is unfalsifiable, and anyone who has hired before
 * reads it as noise. An artifact is checkable in conversation, which is the
 * only place it matters.
 */
export function Skills() {
  return (
    <Section
      id="skills"
      eyebrow="Skills"
      title="What each of these was actually used for"
      lede="Grouped by the kind of problem it solves, with a concrete artifact against each entry rather than a rating nobody can verify."
    >
      <div className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {SKILL_GROUPS.map((group) => (
          <div key={group.id}>
            <h3 className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
              {group.title}
            </h3>
            <p className="mt-2.5 text-sm leading-relaxed text-subtle">
              {group.summary}
            </p>

            <ul className="mt-5 space-y-4 border-t border-line pt-5">
              {group.items.map((item) => (
                <li key={item.name}>
                  <p className="text-sm font-medium text-fg">{item.name}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    {item.artifact}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  )
}
