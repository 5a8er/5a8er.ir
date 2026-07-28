import { defineCloudflareConfig } from '@opennextjs/cloudflare'

/**
 * Deliberately minimal.
 *
 * No incremental cache, no tag cache, no queue: every page on this site is
 * either statically compiled at build time (blog posts) or rendered per
 * request because the CSP nonce makes it dynamic. There is nothing to
 * revalidate, so adding an R2/KV cache layer would buy latency and a binding
 * to misconfigure in exchange for nothing.
 */
export default defineCloudflareConfig()
