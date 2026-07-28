import { Section } from '@/components/ui/Section'
import { ProjectCard } from '@/components/ui/ProjectCard'
import { PROJECTS } from '@/content/projects'

/**
 * Three cards, not four.
 *
 * The brief allowed up to four. A fabricated fourth is worse than a shorter
 * list, because every card here is an invitation to be questioned in depth —
 * and the "Security" bullets in particular are exactly what a security team
 * will open the conversation with.
 */
export function Projects() {
  return (
    <Section
      id="projects"
      eyebrow="Work"
      title="Three systems, and what could go wrong with each"
      lede="Each card leads with the constraint that made the problem hard, not the logos. Open the disclosure for the architecture and the specific controls."
    >
      {/*
        The flagship spans both columns and lays its problem and approach out
        side by side; the other two sit beside each other underneath. The
        asymmetry tracks how much each card actually has to say, rather than
        being variety for its own sake.
      */}
      <div className="grid gap-5 lg:grid-cols-2">
        {PROJECTS.map((project) => (
          <ProjectCard key={project.slug} project={project} wide={project.featured} />
        ))}
      </div>
    </Section>
  )
}
