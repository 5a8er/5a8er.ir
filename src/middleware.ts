import { NextResponse, type NextRequest } from 'next/server'
import { buildCsp, generateNonce, SECURITY_HEADERS } from '@/lib/csp'
import { ORIGIN_NAME } from '@/lib/site'

/**
 * Security headers and the CSP nonce for every response.
 *
 * ── Why this file is `middleware.ts` and not `proxy.ts` ────────────────────
 *
 * Next 16 renamed this convention to `proxy` and its own error message pushes
 * you there. Do not follow it. `proxy.ts` is hard-wired to the Node.js runtime
 * — it rejects a `runtime` route-segment export outright with "Proxy always
 * runs on Node.js runtime" — and OpenNext's Cloudflare adapter supports only
 * the edge runtime, failing the build with "Node.js middleware is not
 * currently supported".
 *
 * The legacy `middleware.ts` name still compiles to the edge runtime, which is
 * what makes the Cloudflare origin possible at all. It must also carry NO
 * explicit `export const runtime`: naming 'edge' makes Next demand
 * 'experimental-edge' instead, and the implicit default is already correct.
 *
 * Verified on next@16.2.11 + @opennextjs/cloudflare@1.20.2. Re-check on any
 * bump of either, because this is the seam most likely to move.
 *
 * ── Why headers live here rather than in host config ───────────────────────
 *
 * The site runs on two different runtimes. A header set written once in
 * `vercel.json` and again in Workers config would drift, silently, and the
 * drift would be invisible until someone scanned one origin and not the other.
 * Defining it once in application code makes both origins provably identical,
 * which `scripts/verify-headers.sh` then asserts rather than assumes.
 */

/** Hosts allowed to be indexed. Everything else is an origin, not a site. */
const CANONICAL_HOSTS = new Set(['5a8er.ir', 'www.5a8er.ir'])

const ADMIN_PREFIXES = ['/keystatic', '/api/keystatic']

export default function middleware(request: NextRequest): NextResponse {
  const nonce = generateNonce()
  const { pathname } = request.nextUrl

  const isAdmin = ADMIN_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  const csp = buildCsp({ nonce, admin: isAdmin })

  /*
   * Next reads the nonce back out of the request's own
   * `content-security-policy` header and stamps it onto the script tags it
   * generates. Setting it only on the response would produce a policy that
   * blocks Next's own hydration bootstrap.
   */
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('content-security-policy', csp)
  requestHeaders.set('x-nonce', nonce)

  const response = NextResponse.next({ request: { headers: requestHeaders } })

  response.headers.set('content-security-policy', csp)
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(name, value)
  }

  // Makes failover observable from outside. The router Worker overwrites this
  // with its own view; when the origin is hit directly, this is the answer.
  response.headers.set('x-served-by', ORIGIN_NAME)

  /*
   * cf.5a8er.ir and the *.vercel.app hostname serve identical content to the
   * apex. Left indexable they would compete with it as duplicates, so only the
   * canonical hosts are crawlable.
   */
  const host = request.headers.get('x-forwarded-host') ?? request.nextUrl.host
  if (!CANONICAL_HOSTS.has(host)) {
    response.headers.set('x-robots-tag', 'noindex, nofollow')
  }

  return response
}

/*
 * Static assets are served straight from the CDN and never reach this
 * function. Excluding them keeps the hot path free and avoids paying for an
 * invocation per font file.
 *
 * The comment sits outside the literal deliberately: the same static parser
 * chokes on a comment inside it.
 */
export const config = {
  matcher: ['/((?!_next/static|_next/image|fonts/|images/|favicon\\.ico).*)'],
}
