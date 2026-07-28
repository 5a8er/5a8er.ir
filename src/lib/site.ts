/**
 * Single source of truth for site-level constants.
 *
 * Anything that appears in more than one of: metadata, sitemap, RSS, OG
 * images, security.txt, or the router Worker belongs here rather than being
 * retyped at each call site.
 */

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://5a8er.ir'
).replace(/\/$/, '')

/** Which origin rendered this response. Surfaced as `X-Served-By`. */
export const ORIGIN_NAME = process.env.ORIGIN_NAME ?? 'local'

export const SITE = {
  name: 'Saber',
  title: 'Saber — Engineering Secure, Scalable Web Systems',
  tagline: 'Engineering Secure, Scalable Web Systems',
  description:
    'Software engineer and security practitioner. Web application security, DevSecOps, and backend systems that hold up under real traffic and real adversaries.',
  locale: 'en',
  url: SITE_URL,
} as const

export function absoluteUrl(path = '/'): string {
  return new URL(path, SITE_URL).toString()
}
