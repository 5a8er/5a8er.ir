/**
 * Cloudflare Turnstile server-side verification.
 *
 * Plain `fetch` against the documented endpoint rather than an SDK. It is one
 * POST with three fields — a dependency here would be more code to audit than
 * the code it replaces, and it would have to be edge-safe on two runtimes.
 */

const VERIFY_ENDPOINT = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export type TurnstileResult =
  | { ok: true }
  | { ok: false; reason: 'not-configured' | 'missing-token' | 'rejected' | 'unreachable' }

/**
 * A token is single-use and short-lived, and Cloudflare rejects replays on its
 * side, so there is nothing to cache here.
 *
 * `remoteIp` is optional and passed when known: it lets Cloudflare correlate
 * the solve with the address presenting it, which catches tokens farmed on one
 * host and spent from another.
 */
export async function verifyTurnstile(
  token: string | undefined,
  remoteIp?: string,
): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY

  /*
   * With no secret configured — local development — the check is skipped
   * rather than failing closed, so the form stays usable without a Cloudflare
   * account. The caller decides what that means; in production the secret is
   * present and this branch is unreachable.
   */
  if (!secret) return { ok: false, reason: 'not-configured' }
  if (!token) return { ok: false, reason: 'missing-token' }

  const body = new FormData()
  body.append('secret', secret)
  body.append('response', token)
  if (remoteIp) body.append('remoteip', remoteIp)

  try {
    const response = await fetch(VERIFY_ENDPOINT, {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(5_000),
    })

    if (!response.ok) return { ok: false, reason: 'unreachable' }

    const result = (await response.json()) as { success?: boolean }
    return result.success === true ? { ok: true } : { ok: false, reason: 'rejected' }
  } catch {
    // Timeout or transport failure. Deliberately *not* treated as a pass:
    // an attacker who can make this endpoint unreachable should not thereby
    // switch the spam check off.
    return { ok: false, reason: 'unreachable' }
  }
}
