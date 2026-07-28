import { makePage } from '@keystatic/next/ui/app'
import config from '../../../../keystatic.config'

/**
 * The CMS admin UI.
 *
 * The `.admin.tsx` extension is load-bearing. `next.config.ts` only lists
 * `admin.tsx` in `pageExtensions` when DEPLOY_TARGET is not cloudflare, so on
 * the Cloudflare build this file is not a route, not compiled, and not in the
 * bundle. The admin surface therefore exists in exactly one deployment rather
 * than two — which is also forced by OAuth needing a single fixed callback URL.
 *
 * Deploy this behind Cloudflare Access on admin.5a8er.ir, so a visitor is
 * authenticated before Keystatic's GitHub OAuth flow is even reachable.
 */
export default makePage(config)
