import Link from 'next/link'
import { ThemeToggle } from './ThemeToggle'

const NAV = [
  { href: '/#about', label: 'About' },
  { href: '/#projects', label: 'Projects' },
  { href: '/#skills', label: 'Skills' },
  { href: '/blog', label: 'Blog' },
  { href: '/#contact', label: 'Contact' },
] as const

/**
 * No hamburger menu, and no JavaScript.
 *
 * The site is one scrollable page plus a blog, so on small screens the nav
 * collapses to the only link that actually goes somewhere else. A drawer for
 * five anchors would be a client component, an open/close state, a focus trap,
 * and an escape-key handler — all to replace scrolling.
 */
export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-bg/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-[var(--gutter)]">
        <Link
          href="/"
          className="font-mono text-sm font-medium tracking-tight text-fg"
        >
          <span className="text-accent">~/</span>saber
        </Link>

        <nav aria-label="Primary" className="flex items-center gap-1">
          <ul className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="rounded-md px-3 py-2 text-sm text-muted transition-colors hover:text-fg"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* The blog is a separate route, so it stays reachable on mobile. */}
          <Link
            href="/blog"
            className="rounded-md px-3 py-2 text-sm text-muted transition-colors hover:text-fg md:hidden"
          >
            Blog
          </Link>

          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}
