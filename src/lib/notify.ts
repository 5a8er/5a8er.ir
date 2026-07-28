import type { ContactFields } from './contact-schema'

/**
 * Delivery transport for contact messages.
 *
 * The interface exists so the transport is swappable — Resend today, SMTP or a
 * Telegram bot tomorrow — without the route handler knowing. It also keeps the
 * one place that touches an API key small enough to read in full.
 *
 * Plain `fetch` rather than the `resend` SDK: this is a single POST with a
 * JSON body, and the SDK would be a dependency to audit and keep edge-safe
 * across two different runtimes for no gain. Contrast with the rate limiter,
 * where the library implements atomic Lua that is genuinely worth not
 * reimplementing.
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails'

export type NotifyResult = { ok: true } | { ok: false; reason: string }

export interface Notifier {
  send(message: ContactFields, meta: { originName: string }): Promise<NotifyResult>
}

/** Strips CR/LF so a submitted value cannot inject extra email headers. */
function singleLine(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim()
}

export const resendNotifier: Notifier = {
  async send(message, meta) {
    const apiKey = process.env.RESEND_API_KEY
    const to = process.env.CONTACT_TO_EMAIL
    const from = process.env.CONTACT_FROM_EMAIL

    if (!apiKey || !to || !from) return { ok: false, reason: 'not-configured' }

    /*
     * The sender is the verified domain address, never the submitter's. Using
     * their address as `from` would fail SPF and DKIM and land the whole
     * domain in spam folders. `reply_to` is what makes the reply go to them,
     * and it is the only place their address is trusted.
     */
    const payload = {
      from: `5a8er.ir contact <${from}>`,
      to: [to],
      reply_to: message.email,
      subject: `Contact form — ${singleLine(message.name)}`,
      text: [
        `From: ${singleLine(message.name)} <${singleLine(message.email)}>`,
        `Origin: ${meta.originName}`,
        '',
        message.message,
      ].join('\n'),
    }

    try {
      const response = await fetch(RESEND_ENDPOINT, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10_000),
      })

      if (response.ok) return { ok: true }

      /*
       * The status is recorded; the body is not. A provider error response can
       * echo back the payload, and the payload contains the sender's message.
       */
      return { ok: false, reason: `provider-${response.status}` }
    } catch {
      return { ok: false, reason: 'unreachable' }
    }
  },
}
