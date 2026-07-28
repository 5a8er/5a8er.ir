import { CONTACT_EMAIL } from '@/content/socials'
import { absoluteUrl } from '@/lib/site'

/**
 * RFC 9116 security.txt.
 *
 * Served by a route handler rather than dropped in `public/`: Next's handling
 * of dotfile directories under `public/` is inconsistent across hosts, and
 * this site has two. A route is identical on both by construction.
 */

export const dynamic = 'force-static'

/**
 * RFC 9116 requires `Expires` and says it should be under a year out. A stale
 * security.txt is worse than none — it tells a researcher the contact details
 * are unmaintained. Regenerating it at build time means every deploy pushes
 * the date forward, so it cannot quietly rot.
 */
function expiresAt(): string {
  const expiry = new Date()
  expiry.setUTCMonth(expiry.getUTCMonth() + 6)
  expiry.setUTCMinutes(0, 0, 0)
  return expiry.toISOString().replace(/\.\d{3}Z$/, 'Z')
}

export function GET(): Response {
  const body = [
    `Contact: mailto:${CONTACT_EMAIL}`,
    `Expires: ${expiresAt()}`,
    'Preferred-Languages: en, fa',
    `Canonical: ${absoluteUrl('/.well-known/security.txt')}`,
    // `Policy:` is intentionally absent until there is a real page behind it.
    // A security.txt pointing at a 404 is a worse signal than an omitted
    // optional field. Add it when SECURITY.md is published at a stable URL.
    '',
    '# In scope: 5a8er.ir, cf.5a8er.ir, admin.5a8er.ir',
    '# Out of scope: denial of service, volumetric testing, social engineering,',
    '# and unverified automated scanner output.',
    '',
  ].join('\n')

  return new Response(body, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600, must-revalidate',
    },
  })
}
