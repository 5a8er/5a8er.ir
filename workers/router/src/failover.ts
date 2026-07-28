/**
 * Failover decision logic, kept pure and separate from the fetch handler so it
 * can be unit-tested without a network, a Worker runtime, or a live origin.
 */

/**
 * Only idempotent methods are ever retried against the second origin.
 *
 * This is the single most important rule in the router. `POST /api/contact`
 * sends email and consumes rate-limit budget; if the primary times out *after*
 * having processed the request, a blind retry delivers the message twice and
 * charges the limiter twice. A failed write is surfaced to the caller instead,
 * because a visible error is cheaper than a silent duplicate.
 */
export const RETRYABLE_METHODS: ReadonlySet<string> = new Set(['GET', 'HEAD'])

export type OriginOutcome =
  | { kind: 'response'; status: number }
  | { kind: 'error' }

export function shouldFailover(method: string, outcome: OriginOutcome): boolean {
  if (!RETRYABLE_METHODS.has(method.toUpperCase())) return false
  if (outcome.kind === 'error') return true

  // 5xx means the origin failed to produce the page. 4xx means it produced a
  // correct answer that happens to be a refusal — the second origin, running
  // the identical commit, would say exactly the same thing.
  return outcome.status >= 500 && outcome.status <= 599
}

/**
 * Headers that describe a single hop and must not be copied onto a new one.
 * `content-length` is excluded because the retried request has no body and a
 * stale length would make the second origin wait for bytes that never arrive.
 */
const HOP_BY_HOP: ReadonlySet<string> = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'content-length',
])

export function forwardableHeaders(source: Headers, publicHost: string): Headers {
  const headers = new Headers()
  for (const [key, value] of source) {
    if (!HOP_BY_HOP.has(key.toLowerCase())) headers.set(key, value)
  }
  // The origin's hostname is an implementation detail. Canonical URLs, OG
  // image URLs, and form actions must all reflect the public apex, so the
  // public host travels with the request.
  headers.set('x-forwarded-host', publicHost)
  return headers
}
