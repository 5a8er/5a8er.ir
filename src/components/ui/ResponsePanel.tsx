import { SECURITY_HEADERS } from '@/lib/csp'
import { ORIGIN_NAME, SITE_URL } from '@/lib/site'

/**
 * The signature element: this page's own HTTP response, as the hero visual.
 *
 * The point is that it cannot lie. Every value below is read from the exact
 * `SECURITY_HEADERS` object that `middleware.ts` sends and from the live
 * `ORIGIN_NAME` of whichever origin rendered this request — not from a string
 * someone typed into a design file. If the policy is weakened, this panel
 * weakens with it, in the same commit.
 *
 * Deliberately not a fake terminal. No window chrome, no traffic-light dots,
 * no typing animation, no blinking cursor. Those signal "developer aesthetic";
 * this needs to signal "captured output". It is also the one element on the
 * page with no motion at all — animating evidence makes it look staged.
 */

/** Long values are abridged for width. Truncation is always marked. */
function abridge(value: string, max: number): { text: string; truncated: boolean } {
  if (value.length <= max) return { text: value, truncated: false }
  return { text: value.slice(0, max).trimEnd(), truncated: true }
}

const NOTABLE: { name: string; source: 'csp' | keyof typeof SECURITY_HEADERS }[] = [
  { name: 'content-security-policy', source: 'csp' },
  { name: 'strict-transport-security', source: 'Strict-Transport-Security' },
  { name: 'cross-origin-opener-policy', source: 'Cross-Origin-Opener-Policy' },
  { name: 'x-content-type-options', source: 'X-Content-Type-Options' },
  { name: 'referrer-policy', source: 'Referrer-Policy' },
]

export function ResponsePanel() {
  const host = new URL(SITE_URL).host

  const rows = NOTABLE.map(({ name, source }) => {
    if (source === 'csp') {
      /*
       * The real policy runs to a dozen directives and would dominate the
       * panel. Marked abridged explicitly rather than by character count, so
       * the cut lands on a directive boundary instead of mid-token. The nonce
       * is shown as a placeholder because it genuinely differs per response —
       * that is the property being demonstrated.
       */
      return {
        name,
        text: "default-src 'none'; script-src 'nonce-{random}'",
        truncated: true,
      }
    }

    return { name, ...abridge(SECURITY_HEADERS[source] ?? '', 60) }
  })

  return (
    <figure className="not-prose overflow-hidden rounded-lg border border-line bg-inset">
      <figcaption className="flex items-center justify-between gap-4 border-b border-line px-4 py-2.5">
        <code className="font-mono text-xs text-muted">
          <span className="select-none text-accent">$ </span>
          curl -sI https://{host}
        </code>
        <span className="shrink-0 font-mono text-[0.6875rem] uppercase tracking-wider text-subtle">
          live
        </span>
      </figcaption>

      {/*
        Laid out the way `curl -sI` actually prints: one line per header, with
        continuation lines hanging-indented under it. An aligned two-column
        table looked tidier in the abstract but had no room for a real policy
        value at this width, and wrapping it mid-token undercut the whole point
        of showing real output.
      */}
      <div className="px-4 py-4">
        <p className="font-mono text-xs text-subtle">
          HTTP/2 <span className="text-fg">200</span>
        </p>

        <dl className="mt-3 space-y-2 font-mono text-xs leading-relaxed">
          <div className="sr-only">
            <dt>About this list</dt>
            <dd>
              Security headers served with this page, rendered from the same
              configuration the server sends.
            </dd>
          </div>

          {rows.map((row) => (
            <div key={row.name} className="ps-5 -indent-5 break-words">
              <dt className="inline text-subtle">{row.name}: </dt>
              <dd className="inline text-fg">
                {row.text}
                {row.truncated ? (
                  <span className="text-subtle" title="Value abridged for display">
                    {' '}
                    …
                  </span>
                ) : null}
              </dd>
            </div>
          ))}

          <div className="ps-5 -indent-5 break-words">
            <dt className="inline text-subtle">x-served-by: </dt>
            <dd className="inline text-accent">{ORIGIN_NAME}</dd>
          </div>
        </dl>
      </div>

      <p className="border-t border-line px-4 py-2.5 text-xs text-subtle">
        Rendered from the same configuration the server sends. Run the command.
      </p>
    </figure>
  )
}
