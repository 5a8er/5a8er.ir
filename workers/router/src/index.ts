/**
 * Apex router for 5a8er.ir.
 *
 * Serves the Cloudflare-hosted origin and transparently fails over to the
 * Vercel-hosted origin when it cannot. Both origins run the identical commit,
 * so failover is invisible apart from the `X-Served-By` header — which is
 * deliberately exposed so the behaviour can be verified from outside rather
 * than taken on trust.
 *
 * This is intentionally small. A load balancer that nobody can read is worth
 * less on a portfolio than forty lines someone can audit in a minute.
 */
import { forwardableHeaders, shouldFailover, type OriginOutcome } from './failover'

export interface Env {
  /** Service binding to the OpenNext Worker. Same-colo, no public hop. */
  SITE?: Fetcher
  /** Used when SITE is unbound — local dev and integration testing. */
  PRIMARY_ORIGIN?: string
  /** Absolute URL of the Vercel deployment, e.g. https://5a8er-ir.vercel.app */
  VERCEL_ORIGIN: string
  /** Public hostname the visitor actually typed. */
  PUBLIC_HOST: string
  PRIMARY_TIMEOUT_MS?: string
}

const DEFAULT_TIMEOUT_MS = 3_000

/**
 * The admin surface lives on its own hostname and is not routed through the
 * apex. Refusing it here is defence in depth: if a DNS record is ever
 * misconfigured, the failure mode is a 404 rather than an unauthenticated CMS.
 */
const BLOCKED_PREFIXES = ['/keystatic', '/api/keystatic']

async function callOrigin(
  request: Request,
  env: Env,
  target: 'cf' | 'vercel',
  timeoutMs: number,
): Promise<{ outcome: OriginOutcome; response?: Response }> {
  const url = new URL(request.url)
  const headers = forwardableHeaders(request.headers, env.PUBLIC_HOST)

  try {
    let response: Response

    if (target === 'cf' && env.SITE) {
      response = await env.SITE.fetch(
        new Request(url.toString(), { method: request.method, headers, redirect: 'manual' }),
      )
    } else {
      const base = target === 'cf' ? env.PRIMARY_ORIGIN : env.VERCEL_ORIGIN
      if (!base) return { outcome: { kind: 'error' } }

      const originUrl = new URL(url.pathname + url.search, base)
      response = await fetch(originUrl, {
        method: request.method,
        headers,
        redirect: 'manual',
        signal: AbortSignal.timeout(timeoutMs),
      })
    }

    return { outcome: { kind: 'response', status: response.status }, response }
  } catch {
    // Timeout, DNS failure, TLS failure, connection reset — all identical from
    // here: the origin did not answer, so try the other one.
    return { outcome: { kind: 'error' } }
  }
}

function stamp(response: Response, servedBy: 'cf' | 'vercel'): Response {
  const out = new Response(response.body, response)
  out.headers.set('X-Served-By', servedBy)
  return out
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (BLOCKED_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) {
      return new Response('Not Found', { status: 404 })
    }

    const timeoutMs = Number(env.PRIMARY_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS)

    const primary = await callOrigin(request, env, 'cf', timeoutMs)
    if (!shouldFailover(request.method, primary.outcome)) {
      // Either the primary answered acceptably, or the method is not safe to
      // retry and its answer — including its failure — is the real answer.
      if (primary.response) return stamp(primary.response, 'cf')
      return new Response('Bad Gateway', { status: 502, headers: { 'X-Served-By': 'cf' } })
    }

    console.warn(
      JSON.stringify({
        event: 'failover',
        path: url.pathname,
        method: request.method,
        primary: primary.outcome,
      }),
    )

    const secondary = await callOrigin(request, env, 'vercel', timeoutMs)
    if (secondary.response && secondary.outcome.kind === 'response') {
      return stamp(secondary.response, 'vercel')
    }

    // Both origins are down. Return the primary's response if it produced one
    // at all, so the visitor sees the app's own error page rather than ours.
    if (primary.response) return stamp(primary.response, 'cf')

    return new Response('Service Unavailable', {
      status: 503,
      headers: { 'Retry-After': '30', 'X-Served-By': 'none' },
    })
  },
} satisfies ExportedHandler<Env>
