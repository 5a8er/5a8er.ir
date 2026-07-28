import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

/**
 * Rate limiting, backed by Upstash Redis over its REST API.
 *
 * The store is shared, and that is the entire point. This site runs on two
 * independent origins — a Cloudflare Worker and a Vercel deployment — so a
 * counter in process memory would give an attacker exactly double the quota
 * for free, simply by alternating between them. It would also reset on every
 * cold start, which on Workers is often.
 *
 * This is the one place a library earns its keep over plain `fetch`: sliding
 * window is implemented as atomic Lua on the server. Hand-rolling it over REST
 * means a read-then-write race, and a limiter with a race is decoration.
 */

let cached: { perIp: Ratelimit; global: Ratelimit } | null = null

/**
 * Built lazily so a missing configuration is a runtime decision rather than an
 * import-time crash: the site should still serve pages when Upstash is not set
 * up, it just must not accept form posts.
 */
export function getLimiters(): { perIp: Ratelimit; global: Ratelimit } | null {
  if (cached) return cached

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null

  const redis = new Redis({ url, token })

  cached = {
    /*
     * Three an hour per address. A real person sending a second message
     * because they forgot something is fine; anyone needing a fourth within
     * the hour is not writing by hand.
     */
    perIp: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, '1 h'),
      prefix: 'contact:ip',
      analytics: false,
    }),

    /*
     * A ceiling across every sender, so a distributed flood cannot turn the
     * inbox — or the Resend quota — into the failure. Deliberately generous:
     * it should only ever fire under attack, never under real traffic.
     */
    global: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, '1 d'),
      prefix: 'contact:global',
      analytics: false,
    }),
  }

  return cached
}

/**
 * Derives the rate-limit key from the client address.
 *
 * `x-forwarded-for` is a client-supplied header and is forgeable in general.
 * It is trustworthy here only because every request arrives through
 * Cloudflare or Vercel, both of which overwrite it at the edge — so the
 * leftmost entry is the address the platform observed, not one the client
 * chose. Behind the self-hosted nginx path this same assumption requires
 * `set_real_ip_from` to be configured, or the limiter becomes bypassable.
 *
 * Falls back to a constant so a request with no address information is
 * limited as a group rather than escaping the limiter entirely.
 */
export function clientKey(headers: Headers): string {
  const candidates = [
    headers.get('cf-connecting-ip'),
    headers.get('x-real-ip'),
    headers.get('x-forwarded-for')?.split(',')[0],
  ]

  for (const candidate of candidates) {
    const value = candidate?.trim()
    if (value) return value
  }

  return 'unknown'
}
