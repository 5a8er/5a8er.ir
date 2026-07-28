import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAllPosts, getPost, formatPostDate } from '@/lib/posts'
import { absoluteUrl } from '@/lib/site'

type Params = { params: Promise<{ slug: string }> }

/**
 * Enumerates slugs at build time. The pages still render per request because
 * the CSP nonce makes everything dynamic, but this keeps the route's valid
 * inputs a closed set rather than anything a visitor types.
 */
export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) return {}

  return {
    title: post.title,
    description: post.summary,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.summary,
      url: absoluteUrl(`/blog/${post.slug}`),
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt ?? undefined,
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.summary,
    },
  }
}

export default async function PostPage({ params }: Params) {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) notFound()

  return (
    <article className="mx-auto max-w-[46rem] px-[var(--gutter)] py-[var(--section-y)]">
      <Link
        href="/blog"
        className="font-mono text-xs text-muted transition-colors hover:text-accent"
      >
        ← Writing
      </Link>

      <header className="mt-8 border-b border-line pb-8">
        <h1 className="text-3xl font-semibold leading-tight tracking-[-0.025em] text-fg sm:text-4xl">
          {post.title}
        </h1>

        <div className="mt-5 flex flex-wrap items-baseline gap-x-4 gap-y-1 font-mono text-xs text-subtle">
          <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time>
          <span>{post.readingMinutes} min read</span>
          {post.updatedAt ? (
            <span>updated {formatPostDate(post.updatedAt)}</span>
          ) : null}
        </div>
      </header>

      {/*
        The HTML was compiled from Markdoc at build time by
        scripts/build-posts.mjs. It is first-party content: publishing a post
        requires commit access to this repository, the same privilege as
        editing this component. Markdoc is used rather than MDX precisely
        because it does not pass raw HTML through and has an explicit tag
        allowlist. See the trust-boundary note in the build script.
      */}
      <div
        className="prose mt-10"
        dangerouslySetInnerHTML={{ __html: post.html }}
      />

      {post.tags.length > 0 ? (
        <footer className="mt-14 border-t border-line pt-6">
          <ul className="flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <li
                key={tag}
                className="rounded border border-line bg-inset px-2 py-0.5 font-mono text-[0.6875rem] text-subtle"
              >
                {tag}
              </li>
            ))}
          </ul>
        </footer>
      ) : null}
    </article>
  )
}
