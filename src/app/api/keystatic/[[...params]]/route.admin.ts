import { makeRouteHandler } from '@keystatic/next/route-handler'
import config from '../../../../../keystatic.config'

/**
 * Keystatic's GitHub OAuth exchange and content read/write endpoints.
 *
 * Excluded from the Cloudflare build by the same `.admin.ts` extension trick
 * used for the UI — see the note in page.admin.tsx. This handler holds the
 * GitHub App client secret, so having it exist in only one place is the point,
 * not a side effect.
 */
export const { POST, GET } = makeRouteHandler({ config })
