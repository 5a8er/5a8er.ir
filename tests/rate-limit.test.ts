import { describe, expect, it } from 'vitest'
import { clientKey } from '@/lib/rate-limit'

/**
 * `clientKey` decides whose quota a request spends. If it can be steered by
 * the caller, the limiter is decoration — so these cases are about what the
 * function trusts and in what order.
 */
describe('clientKey', () => {
  it('prefers cf-connecting-ip, which only Cloudflare can set', () => {
    const headers = new Headers({
      'cf-connecting-ip': '203.0.113.5',
      'x-real-ip': '198.51.100.9',
      'x-forwarded-for': '192.0.2.1',
    })
    expect(clientKey(headers)).toBe('203.0.113.5')
  })

  it('falls back to x-real-ip when Cloudflare is not in front', () => {
    const headers = new Headers({
      'x-real-ip': '198.51.100.9',
      'x-forwarded-for': '192.0.2.1',
    })
    expect(clientKey(headers)).toBe('198.51.100.9')
  })

  it('takes the leftmost x-forwarded-for entry as the client address', () => {
    const headers = new Headers({ 'x-forwarded-for': '192.0.2.1, 10.0.0.1, 10.0.0.2' })
    expect(clientKey(headers)).toBe('192.0.2.1')
  })

  it('trims whitespace so a padded value cannot become a distinct key', () => {
    // Otherwise "192.0.2.1" and " 192.0.2.1" would hold separate quotas, and
    // an attacker could mint new buckets with a space.
    const headers = new Headers({ 'x-forwarded-for': '  192.0.2.1  , 10.0.0.1' })
    expect(clientKey(headers)).toBe('192.0.2.1')
  })

  it('groups requests with no address information under one key', () => {
    // Never returns something unique-per-request: that would hand every
    // caller a fresh quota, which is worse than having no limiter at all.
    expect(clientKey(new Headers())).toBe('unknown')
  })

  it('does not let an empty header skip to no key at all', () => {
    const headers = new Headers({ 'cf-connecting-ip': '', 'x-forwarded-for': '' })
    expect(clientKey(headers)).toBe('unknown')
  })

  it('is deterministic for the same headers', () => {
    const headers = new Headers({ 'cf-connecting-ip': '203.0.113.5' })
    expect(clientKey(headers)).toBe(clientKey(headers))
  })
})
