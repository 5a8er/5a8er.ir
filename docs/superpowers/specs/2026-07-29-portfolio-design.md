# Design: 5a8er.ir portfolio and landing page

**Date:** 2026-07-29
**Status:** approved, in implementation

## Problem

Saber needs a personal site that works as evidence rather than decoration. The
audience is recruiters, security teams, and technical founders — readers who
will check claims. A portfolio that asserts "security-focused" while serving
`script-src 'unsafe-inline'` is worse than one that says nothing, because the
gap is trivially discoverable and it is the exact skill being claimed.

So the constraint that shapes everything: **anything the site claims about
itself must be verifiable with `curl`.**

## Scope

Five landing sections (Hero, About, Projects, Skills, Contact), plus a blog
with a CMS. Three project cards, not four — a fabricated card is an interview
liability, and every card invites questioning.

## Decisions

| Area | Decision |
|---|---|
| Framework | Next.js 16 App Router, React 19, TypeScript strict |
| Styling | Tailwind v4, tokens via `light-dark()` in CSS |
| Hosting | Cloudflare Workers **and** Vercel, one commit, failover |
| Traffic | Free Cloudflare router Worker at apex |
| CMS | Keystatic, git-backed, Markdoc bodies |
| Mail | Resend over `fetch`, behind `lib/notify.ts` |
| Anti-abuse | Honeypot + dwell trap + Turnstile + Upstash shared limiter |
| CSP | Per-request nonce + `strict-dynamic`, no `unsafe-inline` for scripts |

### The constraint that drove most of the others

Dual-origin deploy means two *different runtimes*. For them to be
interchangeable the application may hold **no origin-local state and touch no
filesystem at runtime**. That single rule decided:

- **Mail:** Resend over `fetch`, because `nodemailer` needs Node APIs.
- **Rate limiting:** Upstash Redis, because a per-process counter would let an
  attacker alternate origins for double the quota.
- **CMS:** git-backed, because a filesystem-writing CMS would desync the two
  origins immediately.

The CMS choice and the load-balancing choice were therefore the same decision,
not two.

### Accessibility correction to the brief

The brief specified `#4a90e2` on `#f5f5f5`. That measures **3.02:1** and fails
WCAG AA for body text. It is correct on `#1a1a1a` (5.29:1) and correct in
either theme for borders, rings, and large display type.

Resolved as a two-stop token: `#4a90e2` stays the brand colour and the full
dark-mode accent; light mode uses `#1c6dc7` (4.74:1) wherever the accent
carries text. Same identity, actually readable.

### CSP trade-off, taken deliberately

A nonce must be unique per response, so pages cannot be served as cached HTML.
The alternative — static HTML with `script-src 'unsafe-inline'` — was rejected:
it is the single most screenshot-able contradiction a security portfolio could
ship. Static assets still cache immutably and TTFB becomes edge-render time in
the tens of milliseconds, so the sub-2s target holds.

`style-src` still permits `'unsafe-inline'` because Next and Tailwind emit
inline style attributes. This is recorded in `SECURITY.md` as a gap, not
presented as a decision.

## Findings from Phase 1 (de-risk gate)

The gate ran before any feature work. Four things were learned that would each
have been expensive to discover later:

1. **Worker size is a non-issue.** 0.81 MiB gzipped, 27% of the free 3 MiB cap.
   The Cloudflare origin stays free.

2. **`proxy.ts` is unusable here.** Next 16 renamed middleware to `proxy` and
   recommends it in its own error output, but `proxy.ts` is hard-wired to the
   Node.js runtime and OpenNext's Cloudflare adapter supports only edge. The
   legacy `middleware.ts` filename compiles to edge and works — with no
   explicit `runtime` export, since naming `'edge'` makes Next demand
   `'experimental-edge'`.

3. **`pageExtensions` exclusion works at compile time**, not just routing.
   Proven by building a probe route into both targets and grepping the built
   Worker for a marker string: absent from Cloudflare, present in Vercel.

4. **wrangler requires Node ≥ 22** from 4.90.0 onward. Node 20 cannot build the
   Cloudflare target at all.

Two supply-chain issues surfaced while resolving these:

- `rclone.js`, an optional peer of `@opennextjs/cloudflare`, runs
  `node bin/rclone.js selfupdate` on install and hangs indefinitely on a
  restricted network. Disabled via `legacy-peer-deps`; it is only used for an
  R2 cache this project does not enable.
- The initially chosen `wrangler@4.115.0` had been published **three hours**
  earlier. Replaced with 4.112.0 (11 days old) and a release-age floor added to
  `.npmrc`.

## Verification

- **Vitest** — contact schema, honeypot and dwell logic, rate-limit key
  derivation, router failover decisions, Markdoc tag allowlist.
- **chrome-devtools MCP** — Lighthouse and a11y against local and both origins.
  Playwright was rejected: it did not resolve from this network and installs
  ~150 MB of browser binaries.
- **`scripts/verify-headers.sh`** — asserts the header set is identical across
  the apex and both origins.
- **Failover drill** — disable the Cloudflare origin, confirm the apex still
  serves with `X-Served-By: vercel`, restore, confirm it flips back.
