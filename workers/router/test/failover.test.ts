import { describe, expect, it } from 'vitest'
import { forwardableHeaders, shouldFailover } from '../src/failover'

describe('shouldFailover', () => {
  describe('never retries a non-idempotent method', () => {
    // This is the rule that keeps a slow primary from sending the same
    // contact email twice. It matters more than any 5xx handling below.
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
      it(`${method} is not retried even when the origin errors`, () => {
        expect(shouldFailover(method, { kind: 'error' })).toBe(false)
      })

      it(`${method} is not retried on a 503`, () => {
        expect(shouldFailover(method, { kind: 'response', status: 503 })).toBe(false)
      })
    }
  })

  describe('retries safe methods when the origin fails', () => {
    it('retries GET on a transport error', () => {
      expect(shouldFailover('GET', { kind: 'error' })).toBe(true)
    })

    it('retries HEAD on a transport error', () => {
      expect(shouldFailover('HEAD', { kind: 'error' })).toBe(true)
    })

    it('is case-insensitive about the method', () => {
      expect(shouldFailover('get', { kind: 'error' })).toBe(true)
    })

    for (const status of [500, 502, 503, 504, 599]) {
      it(`retries GET on ${status}`, () => {
        expect(shouldFailover('GET', { kind: 'response', status })).toBe(true)
      })
    }
  })

  describe('treats a 4xx as a real answer, not a failure', () => {
    // Both origins run the identical commit, so a 404 from one is a 404 from
    // the other. Retrying doubles latency to reach the same conclusion.
    for (const status of [400, 401, 403, 404, 410, 429]) {
      it(`does not retry GET on ${status}`, () => {
        expect(shouldFailover('GET', { kind: 'response', status })).toBe(false)
      })
    }

    for (const status of [200, 204, 301, 304]) {
      it(`does not retry GET on ${status}`, () => {
        expect(shouldFailover('GET', { kind: 'response', status })).toBe(false)
      })
    }
  })
})

describe('forwardableHeaders', () => {
  it('overwrites the host with the public apex', () => {
    const source = new Headers({ host: 'cf.5a8er.ir', accept: 'text/html' })
    const result = forwardableHeaders(source, '5a8er.ir')

    expect(result.get('x-forwarded-host')).toBe('5a8er.ir')
    expect(result.get('accept')).toBe('text/html')
  })

  it('strips hop-by-hop headers that must not cross a hop', () => {
    const source = new Headers({
      connection: 'keep-alive',
      'transfer-encoding': 'chunked',
      upgrade: 'websocket',
      'x-real-ip': '203.0.113.7',
    })
    const result = forwardableHeaders(source, '5a8er.ir')

    expect(result.has('connection')).toBe(false)
    expect(result.has('transfer-encoding')).toBe(false)
    expect(result.has('upgrade')).toBe(false)
    expect(result.get('x-real-ip')).toBe('203.0.113.7')
  })

  it('drops content-length so a bodyless retry does not stall the origin', () => {
    const source = new Headers({ 'content-length': '512' })
    expect(forwardableHeaders(source, '5a8er.ir').has('content-length')).toBe(false)
  })
})
