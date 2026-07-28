#!/usr/bin/env node
/**
 * Measures the compressed size of the Cloudflare Worker bundle against the
 * free-tier limit.
 *
 * Cloudflare caps a Worker script at 3 MiB gzipped on the Free plan and
 * 10 MiB on Paid. OpenNext bundles the whole Next server into that one script,
 * so this number decides whether the Cloudflare origin is viable for free.
 * It is checked before feature work starts and after every dependency bump.
 *
 * Run `npm run build:cf` first, then `npm run size:cf`.
 */
import { gzipSync } from 'node:zlib'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'
import { execFileSync } from 'node:child_process'

const FREE_LIMIT = 3 * 1024 * 1024
const PAID_LIMIT = 10 * 1024 * 1024
const OUT_DIR = '.wrangler/size-check'

const mib = (n) => `${(n / 1024 / 1024).toFixed(2)} MiB`

function walk(dir) {
  const found = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) found.push(...walk(full))
    else found.push(full)
  }
  return found
}

// `--dry-run` runs the real upload bundler without deploying, so this measures
// exactly what Cloudflare would receive rather than an approximation of it.
console.log('Bundling with wrangler --dry-run …')
execFileSync(
  'npx',
  ['wrangler', 'deploy', '--dry-run', `--outdir=${OUT_DIR}`],
  { stdio: 'inherit' },
)

const files = walk(OUT_DIR).filter((f) => ['.js', '.mjs', '.wasm'].includes(extname(f)))
if (files.length === 0) {
  console.error(`No bundle output found in ${OUT_DIR}. Did the build succeed?`)
  process.exit(1)
}

let total = 0
const rows = files
  .map((file) => {
    const size = gzipSync(readFileSync(file)).length
    total += size
    return { file, size }
  })
  .sort((a, b) => b.size - a.size)

console.log('\nLargest bundle entries (gzipped):')
for (const { file, size } of rows.slice(0, 10)) {
  console.log(`  ${mib(size).padStart(10)}  ${file}`)
}

const pct = ((total / FREE_LIMIT) * 100).toFixed(1)
console.log(`\nTotal gzipped: ${mib(total)}`)
console.log(`Free limit:    ${mib(FREE_LIMIT)}  (${pct}% used)`)
console.log(`Paid limit:    ${mib(PAID_LIMIT)}`)

if (total > FREE_LIMIT) {
  console.error(
    `\nOVER the free-tier limit by ${mib(total - FREE_LIMIT)}.\n` +
      'Trim before continuing: confirm the Keystatic admin is excluded ' +
      '(DEPLOY_TARGET=cloudflare), then audit the largest entries above.',
  )
  process.exit(1)
}

console.log(`\nWithin the free tier, with ${mib(FREE_LIMIT - total)} to spare.`)
