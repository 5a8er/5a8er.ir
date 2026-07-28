import { getAllPosts } from '@/lib/posts'
import { SITE, absoluteUrl } from '@/lib/site'
import { CONTACT_EMAIL } from '@/content/socials'

export const dynamic = 'force-static'

/**
 * XML has no HTML-entity vocabulary beyond these five, and an unescaped
 * ampersand or angle bracket in a title makes the whole document unparseable —
 * which is how most hand-rolled feeds break.
 */
function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function GET(): Response {
  const posts = getAllPosts().filter((post) => !post.draft)
  const updated = posts[0]?.publishedAt ?? new Date().toISOString()

  const items = posts
    .map((post) => {
      const url = absoluteUrl(`/blog/${post.slug}`)
      return [
        '    <item>',
        `      <title>${xmlEscape(post.title)}</title>`,
        `      <link>${xmlEscape(url)}</link>`,
        `      <guid isPermaLink="true">${xmlEscape(url)}</guid>`,
        `      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>`,
        `      <description>${xmlEscape(post.summary)}</description>`,
        ...post.tags.map((tag) => `      <category>${xmlEscape(tag)}</category>`),
        '    </item>',
      ].join('\n')
    })
    .join('\n')

  /*
   * Summaries only, not full post HTML. A reader that renders the body would
   * be rendering markup from this feed in its own origin, and a feed is a
   * strange place to widen a trust boundary for a marginal convenience.
   */
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${xmlEscape(SITE.name)} — Writing</title>`,
    `    <link>${xmlEscape(absoluteUrl('/blog'))}</link>`,
    `    <description>${xmlEscape(SITE.description)}</description>`,
    '    <language>en</language>',
    `    <lastBuildDate>${new Date(updated).toUTCString()}</lastBuildDate>`,
    `    <managingEditor>${xmlEscape(CONTACT_EMAIL)} (${xmlEscape(SITE.name)})</managingEditor>`,
    `    <atom:link href="${xmlEscape(absoluteUrl('/feed.xml'))}" rel="self" type="application/rss+xml"/>`,
    items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n')

  return new Response(xml, {
    headers: {
      'content-type': 'application/rss+xml; charset=utf-8',
      'cache-control': 'public, max-age=3600, must-revalidate',
    },
  })
}
