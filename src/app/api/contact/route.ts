import { contactRequestSchema, submittedTooFast, HONEYPOT_FIELD } from '@/lib/contact-schema'
import { verifyTurnstile } from '@/lib/turnstile'
import { getLimiters, clientKey } from '@/lib/rate-limit'
import { resendNotifier } from '@/lib/notify'
import { ORIGIN_NAME } from '@/lib/site'

/**
 * Contact endpoint.
 *
 * Checks run cheapest-first, so an abusive request is rejected before it costs
 * a Redis round trip or a Turnstile call — except where ordering matters more
 * than cost, noted inline.
 *
 * Every rejection returns the same shape and says nothing about which check
 * failed. Telling a sender they tripped the honeypot tells an attacker the
 * honeypot exists and exactly which field it is; distinguishing "rate limited"
 * from "invalid" hands them a probe. The one exception is 429, which is
 * actionable by a legitimate sender and reveals nothing they could not infer
 * from being blocked anyway.
 */

export const runtime = 'edge'

/** Never varies, never leaks. */
function respond(status: number, body: Record<string, unknown> = {}): Response {
  return new Response(JSON.stringify({ ok: status === 200, ...body }), {
    status,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store',
    },
  })
}

export async function POST(request: Request): Promise<Response> {
  // Reject anything that is not JSON before parsing it, which also blocks the
  // simple cross-origin form post that would otherwise reach this handler.
  const contentType = request.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) return respond(400)

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return respond(400)
  }

  const parsed = contactRequestSchema.safeParse(payload)
  if (!parsed.success) return respond(400)

  const submission = parsed.data

  /*
   * Honeypot and dwell trap, in that order. Both are free, both run before any
   * network call, and both are signals rather than boundaries — a competent
   * attacker defeats them trivially. They exist to make the cheap, high-volume
   * traffic cheap to reject.
   */
  if (submission[HONEYPOT_FIELD]) return respond(400)
  if (submittedTooFast(submission.renderedAt, Date.now())) return respond(400)

  /*
   * Rate limiting runs BEFORE Turnstile, even though Turnstile is the stronger
   * check. Verification is a network round trip to Cloudflare; letting an
   * unbounded number of requests reach it makes this endpoint a free amplifier
   * pointed at someone else's service.
   */
  const limiters = getLimiters()
  if (!limiters) {
    // Configured to fail closed. An unlimited contact form is not a degraded
    // contact form, it is an open relay into an inbox.
    console.error('contact: rate limiter unavailable, refusing submission')
    return respond(503)
  }

  const key = clientKey(request.headers)

  const [perIp, global] = await Promise.all([
    limiters.perIp.limit(key),
    limiters.global.limit('all'),
  ])

  if (!perIp.success || !global.success) {
    return respond(429, { retryAfter: Math.ceil((perIp.reset - Date.now()) / 1000) })
  }

  const turnstile = await verifyTurnstile(submission.turnstileToken, key)
  if (!turnstile.ok && turnstile.reason !== 'not-configured') return respond(400)

  const delivery = await resendNotifier.send(
    {
      name: submission.name,
      email: submission.email,
      message: submission.message,
    },
    { originName: ORIGIN_NAME },
  )

  if (!delivery.ok) {
    /*
     * Reason only — never the message body, and never the sender's address.
     * A log line is the easiest place for a contact form to leak the thing it
     * was built to keep private.
     */
    console.error(`contact: delivery failed (${delivery.reason})`)
    return respond(502)
  }

  return respond(200)
}

/** Anything other than POST is not a thing this endpoint does. */
export async function GET(): Promise<Response> {
  return respond(405)
}
