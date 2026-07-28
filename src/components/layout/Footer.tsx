import Link from 'next/link'
import { SOCIALS } from '@/content/socials'
import { SITE } from '@/lib/site'

/**
 * The security.txt and RSS links are not decoration.
 *
 * A security engineer landing here will look for RFC 9116 before they read the
 * bio, and finding it says more about the posture than the Skills section
 * does. It costs one line.
 */
export function Footer({ year }: { year: number }) {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-[var(--gutter)] py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted">
            © {year} {SITE.name}
          </p>
          <p className="font-mono text-xs text-subtle">
            <Link href="/.well-known/security.txt" className="hover:text-accent">
              security.txt
            </Link>
            <span aria-hidden="true"> · </span>
            <Link href="/feed.xml" className="hover:text-accent">
              rss
            </Link>
          </p>
        </div>

        <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {SOCIALS.map((social) => (
            <li key={social.label}>
              <a
                href={social.href}
                rel="me noopener noreferrer"
                target="_blank"
                className="text-sm text-muted transition-colors hover:text-accent"
              >
                {social.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  )
}
