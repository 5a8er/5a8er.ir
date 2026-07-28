/**
 * Shape of a compiled post.
 *
 * Kept in its own module because `generated/posts.ts` imports it, and that
 * file is rewritten by `scripts/build-posts.mjs` on every build — nothing
 * hand-written should live where a generator will overwrite it.
 */
export type Post = {
  slug: string
  title: string
  summary: string
  /** ISO 8601, UTC. */
  publishedAt: string
  updatedAt: string | null
  tags: string[]
  draft: boolean
  readingMinutes: number
  /** Compiled at build time from Markdoc. See scripts/build-posts.mjs. */
  html: string
}
