import { Section } from '@/components/ui/Section'
import { PROFILE } from '@/content/profile'

export function About() {
  return (
    <Section
      id="about"
      eyebrow="About"
      title="Building and breaking, from both sides"
    >
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-16">
        <div className="space-y-5">
          {PROFILE.bio.map((paragraph) => (
            <p
              key={paragraph.slice(0, 40)}
              className="max-w-[64ch] text-base leading-relaxed text-muted"
            >
              {paragraph}
            </p>
          ))}
        </div>

        <div className="space-y-8">
          {/*
            Placeholder until a real headshot exists. A grey box that says what
            it is beats a stock photo of somebody else, and beats a silhouette
            icon pretending to be a person.
          */}
          <div
            className="aspect-square w-full max-w-[18rem] rounded-lg border border-dashed border-line-strong bg-surface"
            role="img"
            aria-label={`Portrait of ${PROFILE.name} — placeholder`}
          >
            <div className="flex h-full items-center justify-center">
              <span className="font-mono text-xs text-subtle">headshot</span>
            </div>
          </div>

          <dl className="space-y-5">
            {PROFILE.focus.map((item) => (
              <div key={item.title}>
                <dt className="font-mono text-xs uppercase tracking-wider text-fg">
                  {item.title}
                </dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-muted">
                  {item.detail}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </Section>
  )
}
