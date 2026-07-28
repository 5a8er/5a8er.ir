import type { NextConfig } from 'next'

/**
 * The Keystatic admin UI is excluded from the Cloudflare build.
 *
 * Two reasons, in order of importance:
 *  1. Security — the admin surface then exists in exactly one deployment
 *     (Vercel, behind Cloudflare Access), not two. OAuth callbacks require a
 *     single fixed URL anyway, so a second copy could never be used, only
 *     attacked.
 *  2. Size — OpenNext bundles the entire Next server into one Worker script,
 *     and Cloudflare's free tier caps that at 3 MiB compressed. Keystatic's
 *     admin is the single largest thing we can drop.
 *
 * Mechanism: admin routes are named `page.admin.tsx` / `route.admin.ts`.
 * Next only treats a file as a route if its extension is in `pageExtensions`,
 * so omitting `admin.tsx`/`admin.ts` makes those files invisible to the
 * compiler — not routed, not bundled, not merely unreachable.
 */
const isCloudflare = process.env.DEPLOY_TARGET === 'cloudflare'

const nextConfig: NextConfig = {
  reactStrictMode: true,

  pageExtensions: isCloudflare
    ? ['tsx', 'ts']
    : ['admin.tsx', 'admin.ts', 'tsx', 'ts'],

  // There is an unrelated package-lock.json in a parent directory, and
  // Turbopack otherwise infers *that* as the workspace root. Pinning it keeps
  // the module graph identical no matter where the build is invoked from.
  turbopack: { root: process.cwd() },

  // Fail the build on type errors rather than shipping them.
  typescript: { ignoreBuildErrors: false },

  // We serve no third-party images and no remote patterns are allowed.
  images: {
    remotePatterns: [],
    formats: ['image/avif', 'image/webp'],
  },

  // Do not advertise the framework.
  poweredByHeader: false,
}

export default nextConfig
