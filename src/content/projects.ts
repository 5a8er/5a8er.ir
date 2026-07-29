import type { Project } from './types'

/**
 * Transcribed from the repositories, not drafted.
 *
 * Every stack entry, architecture line, and security bullet below was read out
 * of the project's own README, docs, or package manifest. Where a repo states
 * a control, it is quoted here in the repo's own terms so the two cannot
 * disagree.
 *
 * All three repositories are currently PRIVATE, which is why no card carries a
 * source link — a dead GitHub link costs more credibility than a missing one.
 * If any is made public, add it to `links` on that card.
 *
 * Three cards, not four. Every card is an invitation to be questioned in
 * depth, and the "Security" bullets are where that questioning starts.
 */
export const PROJECTS: Project[] = [
  {
    slug: 'coinguard',
    name: 'CoinGuard',
    status: 'building',
    featured: true,
    summary:
      'Django storefront selling hardware crypto wallets, built for buyers most payment rails will not serve.',
    problem:
      'The product is itself a security device, and the buyers are largely people mainstream payment processors decline. That means supporting Stripe, PayPal, Zarinpal, and on-chain payment side by side — four rails with four different failure modes — while the storefront stays trustworthy enough that somebody will hand it a shipping address for the device that will hold their keys.',
    approach:
      'One order state machine sits behind every payment gateway, so adding a rail is an adapter rather than a second branch through checkout. The whole stack ships as containers behind Nginx, which terminates TLS with automatically renewed Let\'s Encrypt certificates, and separate dev and production compose files keep the two from drifting into each other.',
    stack: [
      'Django 4.2',
      'PostgreSQL',
      'Gunicorn',
      'Tailwind CSS',
      'Docker Compose',
      'Nginx',
      'Stripe / PayPal / Zarinpal',
    ],
    architecture: [
      'Nginx terminates TLS and serves static assets; Gunicorn runs the application behind it, never exposed directly',
      'Separate dev and production compose files, so a local convenience cannot accidentally ship',
      'Multiple payment gateways behind one checkout flow rather than one code path per provider',
      'Automated deployment and monitoring scripts, so a release is repeatable rather than remembered',
    ],
    security: [
      'CSRF protection on every state-changing form; sessions hardened rather than left at defaults',
      'Parameterised queries throughout — no SQL assembled from strings',
      'Uploads validated on the way in, since a storefront that accepts files accepts whatever it does not check',
      'HSTS, X-Frame-Options, and X-Content-Type-Options set at the edge, with HTTP redirected to HTTPS',
      'Payment details tokenised rather than stored; role-based access control on the admin surface',
      'Security events audit-logged, so an incident has a record to read rather than a guess',
    ],
  },
  {
    slug: 'trusthub',
    name: 'TrustHub',
    status: 'building',
    summary:
      'Multi-vendor marketplace across six service markets, where the thing actually being sold is trust.',
    problem:
      'Providers list across VPN, VPS, domain, outbound, crypto, and Starlink markets, and buyers choose on verified badges and reviews. That makes authorisation the product rather than a feature of it: a provider must reach only their own listings, a review is worthless if it can be manufactured, and an admin route must not be reachable by guessing a URL.',
    approach:
      'Google OAuth is the only self-serve way in, and it grants at most the USER role — signing in can never award itself provider or admin. Password login exists solely for ADMIN, is restricted to that role in production, and is kept off the public navigation. TOTP two-factor sits on top, and a ban applies across both sign-in paths at once rather than closing one door.',
    stack: [
      'Next.js',
      'TypeScript',
      'Prisma',
      'PostgreSQL',
      'NextAuth',
      'Upstash Redis',
      'Zod',
      'Stripe',
      'Playwright',
      'Docker',
    ],
    architecture: [
      'Prisma schema is the single source of truth for roles, so the permission model lives in one file rather than scattered through handlers',
      'Provider logos go to object storage, so uploaded files never sit on the application server',
      'Catalogue browsable by provider or by location, server-rendered so it stays crawlable',
      'Playwright end-to-end tests covering the authentication flows, which are the part most expensive to get wrong',
    ],
    security: [
      'OAuth grants at most USER — privilege escalation is not something a sign-in can perform',
      'Admin credential login is production-restricted to ADMIN and absent from public navigation',
      'Passwords bcrypt-hashed; TOTP two-factor available on top',
      'Rate limiting in middleware across the auth POST routes, backed by Redis rather than process memory',
      'A ban blocks both authentication providers, so closing one route does not leave the other open',
      "/api/auth kept same-origin so the CSP's form-action 'self' posture survives the OAuth redirect",
    ],
  },
  {
    slug: 'azadrahinternet',
    name: 'azadrahinternet',
    status: 'maintained',
    summary:
      'Persian-language Telegram referral bot for a VPN channel: one Cloudflare Worker, no framework, no build step, no database.',
    problem:
      'A referral system invites exactly one attack — counting the same person twice. Rejoins, several invite links, and members who leave and return all have to collapse into one number nobody can inflate. It also has to keep running for an audience whose network actively interferes with the infrastructure most services assume.',
    approach:
      'A single Worker with one fetch handler and Cloudflare KV as the only datastore. No framework, no build step, and nothing in the dependency tree to keep patched. Referrals are counted from Telegram\'s chat_member updates and deduplicated globally, so a given person counts once ever and a rejoin never recounts.',
    stack: ['Cloudflare Workers', 'Cloudflare KV', 'Plain ES modules', 'Telegram Bot API', 'Wrangler'],
    architecture: [
      'One `export default { fetch }` entry point — no framework, no build step, no bundler to trust',
      'Cloudflare KV holds configuration and referral state; there is no second datastore to keep consistent',
      'Webhook-driven rather than polling, so the bot costs nothing while idle',
      'Referral counting deduplicated globally rather than per invite link',
    ],
    security: [
      'Secrets compared in constant time, never with `===`, for both the webhook token and the admin bearer',
      'Header-based authentication only — `?secret=` query parameters are refused outright, since URLs end up in logs',
      'Every user-controlled string HTML-escaped before it reaches a `parse_mode: HTML` message',
      'Strict security headers on every response: CSP, HSTS, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`',
      'Clients see a generic 401/404/500; the real detail goes to logs, so errors are not a reconnaissance tool',
      'Length caps on every admin write, and per-IP rate limiting on the admin surface via the Workers binding',
    ],
  },
]
