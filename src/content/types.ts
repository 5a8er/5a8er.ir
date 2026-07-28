/**
 * Shapes for everything the site renders as content.
 *
 * Content lives in typed modules rather than a CMS or a database because both
 * origins must compile byte-identical output from the same commit. A runtime
 * fetch would let the two drift.
 */

export type SkillItem = {
  name: string
  /**
   * What this was actually used to build or find — not a proficiency claim.
   *
   * The brief bans percentage bars and rating meters for a good reason: they
   * assert a number nobody can verify. A concrete artifact is checkable in
   * conversation, which is the only place it matters.
   */
  artifact: string
}

export type SkillGroup = {
  id: string
  title: string
  /** One line on what problems this category actually solves. */
  summary: string
  items: SkillItem[]
}

export type ProjectStatus = 'building' | 'shipped' | 'maintained'

export type Project = {
  slug: string
  name: string
  status: ProjectStatus
  /** One line, rendered under the name. */
  summary: string
  /** The constraint that made this non-trivial. */
  problem: string
  /** The shape of the answer, and why that shape. */
  approach: string
  stack: string[]
  /** Deployment and structural decisions worth defending in an interview. */
  architecture: string[]
  /** Specific controls, not the word "secure". */
  security: string[]
  links?: { label: string; href: string }[]
  /** Featured cards get the wide cell in the bento grid. */
  featured?: boolean
}

export type SocialLink = {
  label: string
  href: string
  handle: string
}
