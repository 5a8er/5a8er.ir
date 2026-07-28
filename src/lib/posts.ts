import { POSTS } from '@/content/generated/posts'
import type { Post } from '@/content/post-types'

/**
 * Access to the compiled post index.
 *
 * Everything here is a plain array operation over a module constant — no
 * filesystem, no database, no fetch. That is what lets the same code run
 * identically on the Vercel origin and inside a Cloudflare Worker.
 */

/**
 * Drafts are visible in development and never in production.
 *
 * The check is on NODE_ENV rather than a build flag so it cannot be switched
 * on by an environment variable someone sets on one origin and forgets on the
 * other.
 */
const includeDrafts = process.env.NODE_ENV !== 'production'

export function getAllPosts(): Post[] {
  return POSTS.filter((post) => includeDrafts || !post.draft)
}

export function getPost(slug: string): Post | undefined {
  return getAllPosts().find((post) => post.slug === slug)
}

export function getAllTags(): { tag: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const post of getAllPosts()) {
    for (const tag of post.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
}

/** Stable across locales and time zones, unlike toLocaleDateString defaults. */
export function formatPostDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
