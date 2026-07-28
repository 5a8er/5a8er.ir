import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllPosts, formatPostDate } from '@/lib/posts'

export const metadata: Metadata = {
  title: 'Writing',
  description:
    'Notes on web application security, infrastructure, and the systems behind both.',
  alternates: { canonical: '/blog' },
}

export default function BlogIndex() {
  const posts = getAllPosts()

  return (
    <div className="mx-auto max-w-6xl px-[var(--gutter)] py-[var(--section-y)]">
      <header className="max-w-[46rem]">
        <p className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-accent">
          Writing
          <span aria-hidden="true" className="h-px flex-1 bg-line" />
        </p>
        <h1 className="mt-5 text-3xl font-semibold tracking-[-0.025em] text-fg sm:text-4xl">
          Notes on things that broke, and why
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted">
          Write-ups on web application security and the infrastructure
          underneath it. Also available as{' '}
          <Link href="/feed.xml" className="text-accent underline">
            RSS
          </Link>
          .
        </p>
      </header>

      {posts.length === 0 ? (
        // An empty state that says what it is. A blog page that renders
        // nothing at all reads as a bug.
        <p className="mt-12 rounded-lg border border-dashed border-line-strong p-8 text-sm text-muted">
          Nothing published yet.
        </p>
      ) : (
        <ul className="mt-14 divide-y divide-line border-t border-line">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link href={`/blog/${post.slug}`} className="group block py-8">
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 font-mono text-xs text-subtle">
                  <time dateTime={post.publishedAt}>
                    {formatPostDate(post.publishedAt)}
                  </time>
                  <span>{post.readingMinutes} min read</span>
                  {post.draft ? (
                    <span className="rounded border border-accent px-1.5 py-0.5 text-accent">
                      draft
                    </span>
                  ) : null}
                </div>

                <h2 className="mt-3 text-xl font-semibold tracking-tight text-fg transition-colors group-hover:text-accent">
                  {post.title}
                </h2>

                <p className="mt-2 max-w-[68ch] text-sm leading-relaxed text-muted">
                  {post.summary}
                </p>

                {post.tags.length > 0 ? (
                  <ul className="mt-4 flex flex-wrap gap-1.5">
                    {post.tags.map((tag) => (
                      <li
                        key={tag}
                        className="rounded border border-line bg-inset px-2 py-0.5 font-mono text-[0.6875rem] text-subtle"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
