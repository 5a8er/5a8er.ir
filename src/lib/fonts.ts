import localFont from 'next/font/local'

/**
 * Fonts are committed to the repository and loaded from disk, not fetched.
 *
 * `next/font/google` resolves at *build* time by downloading from Google. On a
 * network where Google is blocked that fails outright, so a local build would
 * break while CI succeeded — the worst kind of divergence. The woff2 files
 * came from the `@fontsource-variable/*` npm packages, which ship the fonts
 * inside the tarball; those packages were then uninstalled, since they were
 * only a delivery mechanism.
 *
 * Both are variable-weight latin subsets: 48 KB and 40 KB, one file each,
 * covering the whole weight range without a request per weight.
 */

export const inter = localFont({
  src: '../fonts/inter-latin-variable.woff2',
  variable: '--font-inter',
  weight: '100 900',
  style: 'normal',
  display: 'swap',
  fallback: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
})

export const jetbrainsMono = localFont({
  src: '../fonts/jetbrains-mono-latin-variable.woff2',
  variable: '--font-jetbrains',
  weight: '100 800',
  style: 'normal',
  display: 'swap',
  fallback: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
})
