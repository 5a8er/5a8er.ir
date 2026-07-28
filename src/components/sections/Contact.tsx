import { headers } from 'next/headers'
import { Section } from '@/components/ui/Section'
import { ContactForm } from '@/components/ui/ContactForm'
import { CONTACT_EMAIL, SOCIALS } from '@/content/socials'

/**
 * The "what happens to this message" note is not filler.
 *
 * It is the one place on the page where the security posture is described in
 * the second person, about the reader's own data. Saying plainly that the
 * message is rate limited, not logged, and not fed to an analytics vendor does
 * more for trust than the word "secure" appearing anywhere else on the site.
 */
export async function Contact() {
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  /*
   * Under `strict-dynamic`, the `https://challenges.cloudflare.com` entry in
   * `script-src` is ignored by any browser that understands the keyword —
   * trust propagates from nonce'd scripts instead. So the Turnstile loader
   * needs the nonce, or it is blocked on exactly the browsers the strict
   * policy was written for.
   */
  const nonce = (await headers()).get('x-nonce') ?? undefined

  return (
    <Section
      id="contact"
      eyebrow="Contact"
      title="Get in touch"
      lede="Work, security findings, or a question about something above."
    >
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-16">
        <div>
          {/*
            No `integrity` attribute, deliberately. Cloudflare ships this file
            continuously and publishes no stable hash for it, so pinning one
            would break the widget on their next release rather than protect
            anything. It is the only third-party script on the site; the CSP
            keeps it from reaching anywhere it should not, and nothing on the
            page depends on it except the spam check itself.
          */}
          {turnstileSiteKey ? (
            <script
              src="https://challenges.cloudflare.com/turnstile/v0/api.js"
              nonce={nonce}
              async
              defer
            />
          ) : null}

          <ContactForm turnstileSiteKey={turnstileSiteKey} />

          {/*
            Turnstile is a JavaScript widget, so a no-JS visitor cannot pass the
            spam check no matter how the form is built. Saying so and giving the
            address directly is more useful than a form that silently fails.
          */}
          <noscript>
            <p className="mt-6 rounded-md border border-line bg-inset p-4 text-sm leading-relaxed text-muted">
              The form needs JavaScript for its spam check. Email{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent underline">
                {CONTACT_EMAIL}
              </a>{' '}
              directly instead.
            </p>
          </noscript>
        </div>

        <div className="space-y-10">
          <div>
            <h3 className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
              Elsewhere
            </h3>
            <ul className="mt-5 space-y-3 border-t border-line pt-5">
              {SOCIALS.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    rel="me noopener noreferrer"
                    target="_blank"
                    className="group flex items-baseline justify-between gap-4 text-sm"
                  >
                    <span className="text-fg transition-colors group-hover:text-accent">
                      {social.label}
                    </span>
                    <span className="font-mono text-xs text-subtle">
                      {social.handle}
                    </span>
                  </a>
                </li>
              ))}
              <li>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="group flex items-baseline justify-between gap-4 text-sm"
                >
                  <span className="text-fg transition-colors group-hover:text-accent">
                    Email
                  </span>
                  <span className="font-mono text-xs text-subtle">
                    {CONTACT_EMAIL}
                  </span>
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
              What happens to this
            </h3>
            <ul className="mt-5 space-y-3 border-t border-line pt-5 text-sm leading-relaxed text-muted">
              <li>Delivered to one mailbox. No CRM, no mailing list.</li>
              <li>Rate limited per address, shared across both origins.</li>
              <li>Message bodies are not logged and not sent to analytics.</li>
              <li>
                Security reports are welcome — see{' '}
                <a href="/.well-known/security.txt" className="text-accent underline">
                  security.txt
                </a>
                .
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Section>
  )
}
