import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Saber — Engineering Secure, Scalable Web Systems',
  description:
    'Software engineer and security practitioner working on web application security, DevSecOps, and backend systems.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
