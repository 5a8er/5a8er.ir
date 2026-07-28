import type { MetadataRoute } from 'next'
import { absoluteUrl } from '@/lib/site'
import { getAllPosts } from '@/lib/posts'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  // Drafts are excluded here as well as from the pages themselves. A sitemap
  // is a direct invitation to crawl, so an unpublished post listed here would
  // be indexed before anyone noticed.
  const posts = getAllPosts()
    .filter((post) => !post.draft)
    .map((post) => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: new Date(post.updatedAt ?? post.publishedAt),
      changeFrequency: 'yearly' as const,
      priority: 0.6,
    }))

  return [
    {
      url: absoluteUrl('/'),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: absoluteUrl('/blog'),
      lastModified: posts[0]?.lastModified ?? now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...posts,
  ]
}
