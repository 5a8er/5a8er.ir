import { config, collection, fields } from '@keystatic/core'

/**
 * Keystatic writes Markdoc files into `content/posts`, commits them to GitHub,
 * and the push rebuilds both origins. There is no runtime database and no
 * content API — which is what keeps the two origins byte-identical, since they
 * compile the same committed files.
 *
 * The admin UI reachable from this config exists in exactly ONE deployment.
 * `next.config.ts` switches `pageExtensions` on DEPLOY_TARGET, so the
 * `page.admin.tsx` and `route.admin.ts` files are invisible to the compiler on
 * the Cloudflare build — not merely unrouted, not present in the bundle.
 */
/**
 * `github` storage requires a GitHub App client ID, secret, and repo at BUILD
 * time — Keystatic fails the build outright without them, not at runtime.
 *
 * Keying the mode on whether those are actually present means the project
 * builds before the App exists, and switches to committing through GitHub the
 * moment it does. Selecting on NODE_ENV instead would make every production
 * build fail until someone had finished a setup step in a browser.
 *
 * Set KEYSTATIC_GITHUB_REPO to "owner/name" on the Vercel deployment.
 */
const githubRepo = process.env.KEYSTATIC_GITHUB_REPO
const hasGithubApp = Boolean(
  process.env.KEYSTATIC_GITHUB_CLIENT_ID &&
    process.env.KEYSTATIC_GITHUB_CLIENT_SECRET &&
    githubRepo?.includes('/'),
)

export default config({
  storage: hasGithubApp
    ? {
        kind: 'github',
        repo: githubRepo as `${string}/${string}`,
      }
    : // Writes straight to disk. Correct for local authoring, and the only
      // thing that can work before the GitHub App is configured.
      { kind: 'local' },

  ui: {
    brand: { name: '5a8er.ir' },
  },

  collections: {
    posts: collection({
      label: 'Posts',
      slugField: 'title',
      path: 'content/posts/*',
      format: { contentField: 'content' },
      entryLayout: 'content',

      schema: {
        title: fields.slug({
          name: {
            label: 'Title',
            validation: { length: { min: 8, max: 120 } },
          },
        }),

        summary: fields.text({
          label: 'Summary',
          description: 'Shown in the index, the feed, and link previews.',
          multiline: true,
          validation: { length: { min: 40, max: 300 } },
        }),

        publishedAt: fields.date({
          label: 'Published',
          defaultValue: { kind: 'today' },
          validation: { isRequired: true },
        }),

        updatedAt: fields.date({
          label: 'Updated',
          description: 'Leave empty unless the post changed materially.',
        }),

        tags: fields.array(fields.text({ label: 'Tag' }), {
          label: 'Tags',
          itemLabel: (item) => item.value,
        }),

        draft: fields.checkbox({
          label: 'Draft',
          description:
            'Drafts are visible in development only. They are excluded from the site, the sitemap, and the feed in production.',
          defaultValue: true,
        }),

        /*
         * Markdoc, not MDX. MDX compiles arbitrary JSX out of a content file;
         * Markdoc is data with an explicit tag allowlist and no code
         * execution. For content that is later injected as HTML, that
         * difference is the whole argument.
         */
        content: fields.markdoc({
          label: 'Content',
          options: {
            image: {
              directory: 'public/images/posts',
              publicPath: '/images/posts/',
            },
          },
        }),
      },
    }),
  },
})
