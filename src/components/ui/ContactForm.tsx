'use client'

import { useEffect, useRef, useState } from 'react'
import {
  HONEYPOT_FIELD,
  contactFieldsSchema,
  type ContactFields,
} from '@/lib/contact-schema'

type Status =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'sent' }
  | { kind: 'error'; message: string }

type FieldErrors = Partial<Record<keyof ContactFields, string>>

const FIELD_LABEL: Record<keyof ContactFields, string> = {
  name: 'Name',
  email: 'Email',
  message: 'Message',
}

export function ContactForm({ turnstileSiteKey }: { turnstileSiteKey?: string }) {
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const [errors, setErrors] = useState<FieldErrors>({})

  /*
   * Stamped on mount rather than at render so it reflects when the form
   * actually reached the visitor. It is only a signal, never a security
   * boundary — the value is client-supplied and trivially forged. It costs
   * nothing and stops unsophisticated scripts; the rate limiter and Turnstile
   * are what actually hold.
   */
  const renderedAt = useRef(0)
  useEffect(() => {
    renderedAt.current = Date.now()
  }, [])

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = event.currentTarget
    const data = new FormData(form)

    const candidate = {
      name: String(data.get('name') ?? ''),
      email: String(data.get('email') ?? ''),
      message: String(data.get('message') ?? ''),
    }

    const parsed = contactFieldsSchema.safeParse(candidate)
    if (!parsed.success) {
      const next: FieldErrors = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof ContactFields | undefined
        if (key && !next[key]) next[key] = issue.message
      }
      setErrors(next)
      setStatus({ kind: 'idle' })
      return
    }

    setErrors({})
    setStatus({ kind: 'sending' })

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...parsed.data,
          [HONEYPOT_FIELD]: String(data.get(HONEYPOT_FIELD) ?? ''),
          renderedAt: renderedAt.current,
          turnstileToken: String(data.get('cf-turnstile-response') ?? ''),
        }),
      })

      if (response.ok) {
        setStatus({ kind: 'sent' })
        form.reset()
        return
      }

      /*
       * The endpoint answers with generic, non-enumerable errors on purpose,
       * so there is nothing here to map beyond the status code. Telling a
       * sender exactly which check they failed is telling an attacker the
       * same thing.
       */
      setStatus({
        kind: 'error',
        message:
          response.status === 429
            ? 'Too many messages from this address recently. Try again a little later.'
            : 'That did not go through. Email me directly instead.',
      })
    } catch {
      setStatus({
        kind: 'error',
        message: 'Could not reach the server. Email me directly instead.',
      })
    }
  }

  const sending = status.kind === 'sending'

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {(['name', 'email'] as const).map((field) => (
        <div key={field}>
          <label
            htmlFor={field}
            className="block font-mono text-xs uppercase tracking-wider text-subtle"
          >
            {FIELD_LABEL[field]}
          </label>
          <input
            id={field}
            name={field}
            type={field === 'email' ? 'email' : 'text'}
            autoComplete={field === 'email' ? 'email' : 'name'}
            required
            aria-invalid={errors[field] ? true : undefined}
            aria-describedby={errors[field] ? `${field}-error` : undefined}
            className="mt-2 h-11 w-full rounded-md border border-line bg-surface px-3 text-sm text-fg outline-none transition-colors placeholder:text-subtle focus-visible:border-accent"
          />
          {errors[field] ? (
            <p id={`${field}-error`} className="mt-2 text-sm text-fg">
              {errors[field]}
            </p>
          ) : null}
        </div>
      ))}

      <div>
        <label
          htmlFor="message"
          className="block font-mono text-xs uppercase tracking-wider text-subtle"
        >
          {FIELD_LABEL.message}
        </label>
        <textarea
          id="message"
          name="message"
          rows={6}
          required
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? 'message-error' : undefined}
          className="mt-2 w-full resize-y rounded-md border border-line bg-surface px-3 py-2.5 text-sm leading-relaxed text-fg outline-none transition-colors placeholder:text-subtle focus-visible:border-accent"
        />
        {errors.message ? (
          <p id="message-error" className="mt-2 text-sm text-fg">
            {errors.message}
          </p>
        ) : null}
      </div>

      {/*
        Honeypot. Hidden from sight, from the accessibility tree, and from the
        tab order — a person cannot reach it by any route, so anything in it
        came from something filling every input it found.

        Positioned off-screen rather than `display: none`, because the more
        capable bots skip fields that are not rendered at all.
      */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={HONEYPOT_FIELD}>Company</label>
        <input
          id={HONEYPOT_FIELD}
          name={HONEYPOT_FIELD}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>

      {turnstileSiteKey ? (
        <div className="cf-turnstile" data-sitekey={turnstileSiteKey} data-theme="auto" />
      ) : null}

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={sending}
          className="inline-flex h-11 items-center rounded-md bg-accent px-5 text-sm font-medium text-accent-on transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sending ? 'Sending…' : 'Send message'}
        </button>

        {/*
          Announced to screen readers when it changes. Without `aria-live`, a
          non-sighted visitor gets no confirmation the message was ever sent.
        */}
        <p aria-live="polite" className="text-sm">
          {status.kind === 'sent' ? (
            <span className="text-accent">Sent. I will reply to the address above.</span>
          ) : null}
          {status.kind === 'error' ? (
            <span className="text-fg">{status.message}</span>
          ) : null}
        </p>
      </div>
    </form>
  )
}
