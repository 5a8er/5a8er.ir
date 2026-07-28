import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { inter, jetbrainsMono } from '@/lib/fonts'
import { SITE, SITE_URL } from '@/lib/site'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE.title,
    template: `%s — ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  authors: [{ name: SITE.name, url: SITE_URL }],
  creator: SITE.name,
  alternates: {
    canonical: '/',
    types: { 'application/rss+xml': '/feed.xml' },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: SITE.name,
    title: SITE.title,
    description: SITE.description,
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE.title,
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
}

/**
 * Runs before first paint to stop a stored dark preference flashing white.
 *
 * It only sets the attribute when there is an explicit stored choice —
 * `color-scheme: light dark` plus `light-dark()` already handle the system
 * default, so writing an attribute for that case would add nothing and would
 * break the "follow the system" state.
 *
 * Kept to one statement, wrapped in try/catch because reading localStorage
 * throws outright in some privacy modes.
 *
 * On the `dangerouslySetInnerHTML` below: this is a frozen module-scope string
 * literal with no interpolation and no reachable path from request data, so
 * there is nothing to sanitise — the "dangerous" in the prop name is about
 * untrusted input, and there is none here. It also cannot be a plain `<script
 * src>`: an external file would not have resolved before first paint, which is
 * the entire reason this exists. The value read back from localStorage is
 * compared against two literals and never interpolated into the DOM.
 */
const THEME_INIT = `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  /*
   * The nonce is minted per request in middleware.ts. Reading it here is what
   * opts the tree into dynamic rendering — the deliberate cost of a CSP with
   * no 'unsafe-inline'. See SECURITY.md.
   */
  const nonce = (await headers()).get('x-nonce') ?? undefined

  return (
    <html
      lang={SITE.locale}
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        {/*
          First thing in the tab order, visible only once focused. Without it,
          a keyboard user pays for the whole nav on every page.
        */}
        <a
          href="#main"
          className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:start-4 focus-visible:top-4 focus-visible:z-[100] focus-visible:rounded-md focus-visible:bg-surface focus-visible:px-4 focus-visible:py-2 focus-visible:text-sm focus-visible:text-fg focus-visible:shadow-lg"
        >
          Skip to content
        </a>

        <Header />

        <main id="main" className="flex-1">
          {children}
        </main>

        {/*
          `new Date()` is evaluated during the render rather than at module
          scope so the year cannot be frozen into a build from December.
        */}
        <Footer year={new Date().getFullYear()} />
      </body>
    </html>
  )
}
