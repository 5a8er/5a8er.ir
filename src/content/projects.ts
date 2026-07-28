import type { Project } from './types'

/**
 * ─── READ BEFORE PUBLISHING ────────────────────────────────────────────────
 *
 * These cards are drafted from the project brief, not transcribed from the
 * repositories. The engineering described is the standard shape of a correct
 * answer to each problem — which is exactly why it must be checked: anything
 * here that the real implementation does NOT do is a claim that will fall over
 * in an interview, and a security team will ask about every bullet under
 * "Security".
 *
 * Walk each card and either confirm the line or change it. Delete this comment
 * once that pass is done.
 *
 * Three cards, not four. A fabricated fourth project is worse than a shorter
 * list — every card is an invitation to be questioned in depth.
 */
export const PROJECTS: Project[] = [
  {
    slug: 'crypto-commerce',
    name: 'Crypto-wallet e-commerce platform',
    status: 'building',
    featured: true,
    summary: 'A storefront that settles in crypto without ever holding customer funds.',
    problem:
      'Card processing is effectively closed to a large set of merchants and buyers, and the usual workaround — a custodial payment gateway — swaps that problem for counterparty risk and a single point of seizure. Settling on-chain directly means owning three awkward details instead: a price that moves between quote and payment, a confirmation that is probabilistic rather than final, and a transfer that can arrive late, twice, or for the wrong amount.',
    approach:
      'An order locks a quote for a fixed window against an address derived for that order alone, which makes a payment attributable without requiring the buyer to hold an account. A chain watcher advances an explicit order state machine on confirmation depth rather than on first sight of a transaction, and every transition is idempotent so a replayed notification is a no-op instead of a second credit. The application server derives receive addresses from an extended public key and holds no signing capability at all.',
    stack: ['Django', 'Django REST Framework', 'PostgreSQL', 'Redis', 'Celery', 'Next.js', 'Docker'],
    architecture: [
      'Chain watching runs as a separate worker; the request path never blocks on a node RPC call',
      'Order state is append-only, so the current status is derived rather than overwritten and the history is auditable',
      'Dockerised services behind Nginx, which terminates TLS — the application never speaks plaintext to the internet',
      'Catalogue reads served from Redis with explicit invalidation on write, not a blind TTL',
    ],
    security: [
      'Extended public key only on the app server: a full compromise of the web tier yields no ability to move funds',
      'Payment notifications verified by signature and rejected outside a tolerated clock skew',
      'Idempotency keys on every write endpoint, so a replayed confirmation cannot double-credit an order',
      'Decimal arithmetic end to end — no float ever touches an amount or an exchange rate',
      'Quote endpoint rate-limited per IP and per order to stop it being scraped as a free price oracle',
    ],
  },
  {
    slug: 'marketplace',
    name: 'Marketplace platform',
    status: 'building',
    featured: true,
    summary: 'Multi-party marketplace where every field is attacker-controlled by definition.',
    problem:
      'A marketplace has no single trusted party. Every listing title, image, and message is input from one user that will be rendered to another, and the authorisation question is never "is this person signed in" — it is "does this person own this specific row". Get that wrong once and the failure is silent until someone enumerates an ID.',
    approach:
      'Ownership is enforced at the data-access layer rather than in route guards, so a forgotten check fails closed instead of returning someone else\'s record. Listing input is validated against a schema shared by client and server, and rendered strictly as text. Catalogue and search pages are server-rendered, which keeps query construction off the client and makes the pages crawlable at the same time.',
    stack: ['Next.js', 'TypeScript', 'PostgreSQL', 'Redis', 'Tailwind CSS', 'Docker'],
    architecture: [
      'Server components for catalogue and listing pages; client components confined to filters and the composer',
      'Uploads go straight to object storage through a signed URL constrained by size and content type, never through the app server',
      'Search results cached in Redis with tag-based invalidation when a listing changes',
    ],
    security: [
      'Object-level authorisation checked in the query layer, so a missing route guard cannot become an IDOR',
      'All user text rendered as text — no raw HTML injection point anywhere in the component tree',
      'Uploads validated by magic bytes as well as declared type, and served from a separate origin so a stored file cannot execute as same-origin script',
      'Rate limits on listing creation and messaging, which is what actually makes spam uneconomic',
    ],
  },
  {
    slug: 'recon-tooling',
    name: 'Recon and exposure tooling',
    status: 'maintained',
    summary: 'Personal tooling for attack-surface mapping and reproducible reporting.',
    problem:
      'Recon output is high volume and low signal. The bottleneck in a bug bounty workflow is not discovering hosts — it is deciding which of several thousand deserves a human, and being able to prove a finding weeks later when the target has already changed underneath you.',
    approach:
      'Small composable stages rather than one framework: enumerate from certificate transparency and DNS, normalise everything into one record shape, diff against the previous run, and surface only what changed. Findings capture the exact request and response alongside them, so a report stays reproducible after the target moves on.',
    stack: ['Python', 'asyncio', 'SQLite', 'Docker'],
    architecture: [
      'Every stage reads and writes the same normalised record, so stages compose without a bespoke adapter each time',
      'Runs are immutable and timestamped, which turns "what changed since last week" into a query rather than a rescan',
      'Concurrency bounded per target, because a scan that saturates a host is an outage you caused',
    ],
    security: [
      'Scope is an allowlist loaded per run; anything outside it is dropped before a single request is made',
      'Rate and concurrency ceilings enforced client-side rather than left for the target to absorb',
      'Evidence stored locally, with credentials stripped before anything reaches a report',
    ],
  },
]
