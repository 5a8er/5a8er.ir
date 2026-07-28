/**
 * Content Security Policy and security response headers.
 *
 * Deliberately free of framework imports so the policy can be unit-tested as
 * data, and so the same builder can be reused by the router Worker if the two
 * ever need to agree on a header set.
 */

/** Turnstile is the only third-party origin this site talks to. */
const TURNSTILE_ORIGIN = 'https://challenges.cloudflare.com'

export type CspOptions = {
  nonce: string
  /**
   * The Keystatic admin is a bundled React application that needs looser rules
   * than the public site. It exists on exactly one hostname, behind Cloudflare
   * Access, so the relaxation is scoped rather than global.
   */
  admin?: boolean
}

/**
 * Builds the CSP header value.
 *
 * `'strict-dynamic'` means the host allowlist in `script-src` is ignored by
 * browsers that understand it: trust propagates from the nonce'd bootstrap
 * script to whatever it loads. The bare `https:` is a fallback for older
 * browsers that ignore `'strict-dynamic'` instead — it is intentionally there,
 * not an oversight.
 */
export function buildCsp({ nonce, admin = false }: CspOptions): string {
  const directives: Record<string, string[]> = {
    'default-src': ["'none'"],
    'script-src': [`'nonce-${nonce}'`, "'strict-dynamic'", 'https:'],
    // Next and Tailwind emit inline style attributes during hydration. This is
    // the one gap in the policy and it is documented in SECURITY.md rather
    // than quietly tolerated.
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:'],
    'font-src': ["'self'"],
    'connect-src': ["'self'", TURNSTILE_ORIGIN],
    'frame-src': [TURNSTILE_ORIGIN],
    'manifest-src': ["'self'"],
    'base-uri': ["'none'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'object-src': ["'none'"],
  }

  if (admin) {
    // Keystatic talks to the GitHub API directly from the browser and loads
    // avatars from GitHub's CDN.
    directives['connect-src'] = [
      "'self'",
      'https://api.github.com',
      'https://github.com',
    ]
    directives['img-src'] = ["'self'", 'data:', 'blob:', 'https://avatars.githubusercontent.com']
    directives['frame-src'] = ["'self'"]
  }

  const serialized = Object.entries(directives)
    .map(([directive, values]) => `${directive} ${values.join(' ')}`)
    .join('; ')

  return `${serialized}; upgrade-insecure-requests`
}

/**
 * Headers sent on every response regardless of route.
 *
 * `Permissions-Policy` denies rather than omits: an absent directive inherits
 * the browser default, which is usually "ask", not "no".
 */
export const SECURITY_HEADERS: Readonly<Record<string, string>> = Object.freeze({
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Permissions-Policy': [
    'accelerometer=()',
    'autoplay=()',
    'camera=()',
    'display-capture=()',
    'encrypted-media=()',
    'geolocation=()',
    'gyroscope=()',
    'magnetometer=()',
    'microphone=()',
    'midi=()',
    'payment=()',
    'usb=()',
    'xr-spatial-tracking=()',
  ].join(', '),
})

/**
 * 128 bits of randomness, base64'd. Web Crypto only — this runs on both the
 * Node and Workers runtimes and `node:crypto` is not available on both.
 */
export function generateNonce(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return btoa(String.fromCharCode(...bytes))
}
