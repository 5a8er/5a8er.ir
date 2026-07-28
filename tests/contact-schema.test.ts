import { describe, expect, it } from 'vitest'
import {
  HONEYPOT_FIELD,
  MIN_DWELL_MS,
  contactFieldsSchema,
  contactRequestSchema,
  submittedTooFast,
} from '@/lib/contact-schema'

const validRequest = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  message: 'I read your write-up on idempotent payment state machines and had a question.',
  renderedAt: 1_700_000_000_000,
}

describe('contactFieldsSchema', () => {
  it('accepts a well-formed submission', () => {
    expect(contactFieldsSchema.safeParse(validRequest).success).toBe(true)
  })

  it('trims surrounding whitespace rather than counting it toward the minimum', () => {
    const parsed = contactFieldsSchema.safeParse({ ...validRequest, name: '  Ada  ' })
    expect(parsed.success && parsed.data.name).toBe('Ada')
  })

  it('rejects a message padded to length with whitespace', () => {
    // Without `.trim()` before `.min()`, 20 spaces would pass.
    const parsed = contactFieldsSchema.safeParse({ ...validRequest, message: ' '.repeat(40) })
    expect(parsed.success).toBe(false)
  })

  it.each([
    ['not-an-email', 'missing @ and domain'],
    ['ada@', 'missing domain'],
    ['@example.com', 'missing local part'],
    ['ada example@test.com', 'contains a space'],
  ])('rejects %s (%s)', (email) => {
    expect(contactFieldsSchema.safeParse({ ...validRequest, email }).success).toBe(false)
  })

  it.each([
    ['name', 'A'],
    ['message', 'too short'],
  ])('rejects %s below its minimum length', (field, value) => {
    expect(
      contactFieldsSchema.safeParse({ ...validRequest, [field]: value }).success,
    ).toBe(false)
  })

  it.each([
    ['name', 81],
    ['email', 200],
    ['message', 4001],
  ])('rejects %s above its maximum length', (field, length) => {
    const value = field === 'email' ? `${'a'.repeat(length)}@example.com` : 'a'.repeat(length)
    expect(
      contactFieldsSchema.safeParse({ ...validRequest, [field]: value }).success,
    ).toBe(false)
  })
})

describe('contactRequestSchema honeypot', () => {
  it('accepts an absent honeypot field', () => {
    expect(contactRequestSchema.safeParse(validRequest).success).toBe(true)
  })

  it('accepts an empty honeypot field', () => {
    expect(
      contactRequestSchema.safeParse({ ...validRequest, [HONEYPOT_FIELD]: '' }).success,
    ).toBe(true)
  })

  it('rejects a filled honeypot field', () => {
    // The whole trick: a person can never reach this input, so any value in it
    // came from something filling every field it found.
    expect(
      contactRequestSchema.safeParse({ ...validRequest, [HONEYPOT_FIELD]: 'Acme Inc' }).success,
    ).toBe(false)
  })

  it('rejects even a single space in the honeypot', () => {
    expect(
      contactRequestSchema.safeParse({ ...validRequest, [HONEYPOT_FIELD]: ' ' }).success,
    ).toBe(false)
  })
})

describe('contactRequestSchema renderedAt', () => {
  it.each([0, -1, 1.5])('rejects %s', (renderedAt) => {
    expect(contactRequestSchema.safeParse({ ...validRequest, renderedAt }).success).toBe(false)
  })

  it('rejects a missing timestamp', () => {
    const { renderedAt: _omitted, ...withoutTimestamp } = validRequest
    expect(contactRequestSchema.safeParse(withoutTimestamp).success).toBe(false)
  })
})

describe('submittedTooFast', () => {
  const rendered = 1_700_000_000_000

  it('rejects an instant submission', () => {
    expect(submittedTooFast(rendered, rendered)).toBe(true)
  })

  it('rejects one just inside the window', () => {
    expect(submittedTooFast(rendered, rendered + MIN_DWELL_MS - 1)).toBe(true)
  })

  it('accepts one exactly at the boundary', () => {
    expect(submittedTooFast(rendered, rendered + MIN_DWELL_MS)).toBe(false)
  })

  it('accepts a realistic typing delay', () => {
    expect(submittedTooFast(rendered, rendered + 45_000)).toBe(false)
  })

  it('does not treat a forged future timestamp as too fast', () => {
    // A clock-skewed or forged renderedAt in the future yields a negative
    // delta, which must not wrap around into "slow enough".
    expect(submittedTooFast(rendered + 60_000, rendered)).toBe(true)
  })
})
