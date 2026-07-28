# 5a8er.ir

Personal site for Saber — software engineer and security practitioner.

It is also, deliberately, a working example of the things it claims: the
failover router, the content security policy, and the contact pipeline are all
readable in this repository rather than asserted in a bullet point.

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router, React Server Components) |
| Language | TypeScript, strict, `noUncheckedIndexedAccess` |
| Styling | Tailwind CSS v4 — tokens in CSS, no JS config |
| Content | Typed modules for site copy; Keystatic + Markdoc for the blog |
| Hosting | Cloudflare Workers **and** Vercel, same commit, with failover |

## Requirements

**Node 22 or newer.** `.nvmrc` pins it — run `nvm use`. This is not optional:
wrangler dropped Node 20 support at 4.90.0, so the Cloudflare half of the build
will not run on Node 20.

```bash
nvm use
npm ci
npm run dev
```

## Commands

| Command | Does |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Production build, Vercel target (includes the CMS admin) |
| `npm run build:cf` | Production build, Cloudflare target (excludes the CMS admin) |
| `npm run size:cf` | Measures the Worker bundle against Cloudflare's free-tier cap |
| `npm run preview:cf` | Runs the built Worker locally in workerd |
| `npm run deploy:cf` | Deploys the Worker |
| `npm run typecheck` | Typechecks the app and the router Worker |
| `npm run types:worker` | Regenerates Workers runtime types (see below) |
| `npm test` | Vitest |

`workers/router/worker-configuration.d.ts` is generated, not committed. Run
`npm run types:worker` once after cloning, and again after editing
`workers/router/wrangler.jsonc`.

## Architecture

```
              5a8er.ir / www.5a8er.ir
                        │
              ┌─────────▼──────────┐
              │  router Worker     │  workers/router
              │  GET/HEAD failover │
              └────┬──────────┬────┘
   service binding │          │ https, on 5xx / timeout / transport error
            ┌──────▼───┐  ┌───▼────────────┐
            │ Workers  │  │ Vercel         │
            │ OpenNext │  │ same commit    │
            └──────────┘  └────────────────┘

admin.5a8er.ir ─► Vercel only, behind Cloudflare Access ─► /keystatic
```

Two origins running one commit. The apex is a small Worker that serves the
Cloudflare origin and re-fetches from Vercel when it cannot. Every response
carries `X-Served-By`, so which origin answered is externally observable.

**Only `GET` and `HEAD` are ever retried.** A `POST /api/contact` that fails is
surfaced to the caller, because retrying it would send the message twice and
consume the rate-limit budget twice. That rule is the point of
`workers/router/src/failover.ts`, and it is the part with tests.

## Decisions worth knowing

**No origin-local state, anywhere.** Two independent runtimes mean anything
held in process memory diverges between them. Rate limiting therefore lives in
Upstash Redis, not a local counter — otherwise alternating between origins
would hand an attacker double the quota. Blog content is compiled into the
build from git for the same reason.

**The CMS admin is compiled out of the Cloudflare build.** `next.config.ts`
switches `pageExtensions` on `DEPLOY_TARGET`, so `page.admin.tsx` and
`route.admin.ts` are invisible to the compiler there — not routed, not
bundled, not present. Verified by grepping the built Worker for a marker
string. The result is that the admin surface exists in exactly one deployment
instead of two.

**`middleware.ts`, not `proxy.ts`.** Next 16 renamed the convention and its own
error message recommends `proxy`. Following that recommendation breaks the
Cloudflare build: `proxy.ts` is hard-wired to the Node.js runtime, and
OpenNext's Cloudflare adapter supports only edge. The legacy filename still
compiles to edge, and must carry no explicit `runtime` export. See the comment
at the top of `src/middleware.ts`.

**`next/font/local`, not `next/font/google`.** `next/font/google` fetches from
Google at build time, which fails outright on a network where Google is
blocked. Fonts are committed to the repo.

**Exact pins on `next` and `@opennextjs/cloudflare`.** OpenNext 1.20.2 declares
`next: ">=15.5.21 <16 || >=16.2.11"` — a narrow window a routine minor bump
falls straight out of. Bump the pair together and re-run `npm run build:cf &&
npm run size:cf`.

**`.npmrc` sets a 7-day release-age floor** so a compromised-maintainer publish
has a week to be caught before this project would resolve it. It needs npm
≥ 11.10 to take effect; Node 22 ships 10.9.8, so until npm is upgraded the real
control is that pinned versions were age-checked by hand and `package-lock.json`
is committed and installed with `npm ci`.

## Worker budget

Cloudflare caps a Worker script at 3 MiB gzipped on the free plan. `npm run
size:cf` measures the real upload bundle via `wrangler deploy --dry-run` and
exits non-zero if it is over.

Last measured: **0.81 MiB, 27% of the free limit.**

Re-run it after adding any dependency that reaches the server.

## Security

See [`SECURITY.md`](./SECURITY.md) for the full posture, the reporting process,
and — more usefully — the two places the policy is knowingly weaker than it
could be.

## Before deploying

- Fill in `src/content/socials.ts` (all handles are `TODO`) and
  `src/content/profile.ts`
- Verify every bullet in `src/content/projects.ts` against the real
  repositories; the cards are drafted, not transcribed
- Add a headshot at `public/images/`
- Copy `.env.example` to `.env.local` and fill it
