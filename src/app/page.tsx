import { Hero } from '@/components/sections/Hero'
import { About } from '@/components/sections/About'
import { Projects } from '@/components/sections/Projects'
import { Skills } from '@/components/sections/Skills'
import { Contact } from '@/components/sections/Contact'
import { PROFILE } from '@/content/profile'
import { SITE, SITE_URL, absoluteUrl } from '@/lib/site'
import { SOCIALS } from '@/content/socials'

/**
 * Person schema for search engines and for the knowledge panels that read it.
 * Emitted as JSON-LD rather than microdata so the markup above stays clean.
 */
function personJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: SITE.name,
    jobTitle: PROFILE.role,
    description: SITE.description,
    url: SITE_URL,
    sameAs: SOCIALS.map((social) => social.href),
    knowsAbout: [
      'Web application security',
      'DevSecOps',
      'Backend engineering',
      'OSINT',
      'Network engineering',
    ],
    mainEntityOfPage: absoluteUrl('/'),
  }
}

/**
 * `JSON.stringify` does not escape `</script>`, so a string containing it
 * would close the block early and everything after would be parsed as markup.
 *
 * Nothing here is request-derived — the payload is built from typed module
 * constants — so this is defence against a future edit rather than a live bug.
 * That is exactly when it is cheapest to add.
 */
function safeJsonLd(payload: unknown): string {
  return JSON.stringify(payload).replace(/</g, '\\u003c')
}

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(personJsonLd()) }}
      />

      <Hero />
      <About />
      <Projects />
      <Skills />
      <Contact />
    </>
  )
}
