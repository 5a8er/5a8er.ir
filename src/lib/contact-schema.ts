import { z } from 'zod'

/**
 * One schema, imported by both the browser and the route handler.
 *
 * Sharing it is the point: client-side validation is a courtesy to the person
 * typing, server-side validation is the actual control, and when the two drift
 * you get a form that accepts input the server then rejects with a generic
 * error. Defining the rules once makes that failure impossible.
 */

/**
 * A human filling in this form takes longer than this. A script does not.
 *
 * Cheap, silent, and it costs a legitimate visitor nothing — by the time
 * anyone has typed a twenty-character message, several seconds have passed.
 */
export const MIN_DWELL_MS = 3_000

/**
 * Name of the honeypot field. Rendered but hidden from people; bots that fill
 * every input give themselves away.
 *
 * Named `company` rather than something like `honeypot_field` because the
 * whole trick depends on it looking like an ordinary field worth filling in.
 */
export const HONEYPOT_FIELD = 'company'

/** The fields a person actually fills in. Used for live validation. */
export const contactFieldsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Please enter your name.')
    .max(80, 'That name is longer than 80 characters.'),
  email: z
    .email('That does not look like an email address.')
    .max(160, 'That address is longer than 160 characters.'),
  message: z
    .string()
    .trim()
    .min(20, 'Please write at least 20 characters, so I can reply usefully.')
    .max(4000, 'Please keep it under 4000 characters.'),
})

/** What the endpoint accepts. Adds the checks a person never sees. */
export const contactRequestSchema = contactFieldsSchema.extend({
  /*
   * Must be empty. `.max(0)` rather than a literal check so a bot filling it
   * fails validation identically to any other malformed field — the response
   * gives away nothing about why.
   */
  [HONEYPOT_FIELD]: z.string().max(0).optional().default(''),

  /** Epoch milliseconds stamped when the form was rendered. */
  renderedAt: z.number().int().positive(),

  /** Turnstile response token. Verified server-side before anything else. */
  turnstileToken: z.string().min(1).max(2048).optional(),
})

export type ContactFields = z.infer<typeof contactFieldsSchema>
export type ContactRequest = z.infer<typeof contactRequestSchema>

/** True when the submission arrived implausibly fast. */
export function submittedTooFast(renderedAt: number, now: number): boolean {
  return now - renderedAt < MIN_DWELL_MS
}
