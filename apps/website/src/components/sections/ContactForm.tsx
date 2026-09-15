import { useState, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Turnstile } from '@teleforce/ui'
import { cn } from '@/lib/cn'
import { services } from '@/data/services'

/**
 * Enterprise enquiry form.
 *
 * Submits to the `enquiries` table in Supabase. There is deliberately no
 * mailto fallback: the only address available would be a personal one, and
 * a mailto link publishes it in the page source to every scraper that visits.
 *
 * If Supabase is not configured the form says so plainly rather than
 * pretending to send. Never replace that with a fake success state.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
const CONFIGURED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as
  | string
  | undefined

type Status = 'idle' | 'submitting' | 'sent' | 'error' | 'unconfigured'

interface Fields {
  name: string
  email: string
  organisation: string
  role: string
  interest: string
  volume: string
  message: string
  /** Honeypot — real users never fill this. */
  website: string
}

const EMPTY: Fields = {
  name: '',
  email: '',
  organisation: '',
  role: '',
  interest: '',
  volume: '',
  message: '',
  website: '',
}

const inputBase =
  'w-full border border-pearl/12 bg-pearl/[0.02] px-4 py-3.5 text-[14px] text-pearl ' +
  'placeholder:text-pearl-faint transition-colors duration-300 ' +
  'focus:border-gold/60 focus:bg-pearl/[0.04] focus:outline-none'

function Field({
  label,
  required,
  children,
  error,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
  error?: string
}) {
  return (
    <label className="block">
      <span className="flex items-baseline gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-pearl-faint">
        {label}
        {required && <span className="text-gold/80">*</span>}
      </span>
      <div className="mt-2.5">{children}</div>
      {error && (
        <span className="mt-2 block text-[12px] text-gold/90">{error}</span>
      )}
    </label>
  )
}

export default function ContactForm() {
  const [fields, setFields] = useState<Fields>(EMPTY)
  const [status, setStatus] = useState<Status>('idle')
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({})
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)

  const set = (key: keyof Fields) => (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFields((f) => ({ ...f, [key]: e.target.value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const validate = (): boolean => {
    const next: Partial<Record<keyof Fields, string>> = {}
    if (!fields.name.trim()) next.name = 'Please tell us who you are.'
    if (!fields.email.trim()) {
      next.email = 'We need an address to reply to.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(fields.email.trim())) {
      next.email = 'That does not look like a valid email address.'
    }
    if (!fields.organisation.trim())
      next.organisation = 'Which organisation are you enquiring for?'
    if (fields.message.trim().length < 20)
      next.message =
        'A sentence or two about the process you want supported helps us reply usefully.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()

    // Honeypot tripped — stop silently rather than telling the bot why.
    if (fields.website) return
    if (!validate()) return

    if (!CONFIGURED) {
      setStatus('unconfigured')
      return
    }

    setStatus('submitting')
    try {
      // Goes through the edge function so the Turnstile token is verified
      // against Cloudflare with the secret key, which cannot live in a
      // browser bundle. A token stored unverified would prove nothing.
      const res = await fetch(`${SUPABASE_URL}/functions/v1/submit-enquiry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          name: fields.name,
          email: fields.email,
          organisation: fields.organisation,
          role: fields.role,
          interest: fields.interest,
          volume: fields.volume,
          message: fields.message,
          sourcePage: window.location.pathname,
          turnstileToken,
          website: fields.website,
        }),
      })

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? `Request failed: ${res.status}`)
      }
      setStatus('sent')
      setFields(EMPTY)
    } catch {
      setStatus('error')
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="panel p-8 md:p-10 lg:p-12">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-xl text-pearl">Enquiry</h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-pearl-faint">
          * Required
        </span>
      </div>
      <div className="hairline mt-6" />

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <Field label="Full name" required error={errors.name}>
          <input
            type="text"
            value={fields.name}
            onChange={set('name')}
            className={cn(inputBase, errors.name && 'border-gold/50')}
            placeholder="Jordan Ellis"
            autoComplete="name"
          />
        </Field>

        <Field label="Work email" required error={errors.email}>
          <input
            type="email"
            value={fields.email}
            onChange={set('email')}
            className={cn(inputBase, errors.email && 'border-gold/50')}
            placeholder="jordan@company.co.uk"
            autoComplete="email"
          />
        </Field>

        <Field label="Organisation" required error={errors.organisation}>
          <input
            type="text"
            value={fields.organisation}
            onChange={set('organisation')}
            className={cn(inputBase, errors.organisation && 'border-gold/50')}
            placeholder="Company name"
            autoComplete="organization"
          />
        </Field>

        <Field label="Your role">
          <input
            type="text"
            value={fields.role}
            onChange={set('role')}
            className={inputBase}
            placeholder="Head of Operations"
            autoComplete="organization-title"
          />
        </Field>

        <Field label="Area of interest">
          <select
            value={fields.interest}
            onChange={set('interest')}
            className={cn(inputBase, 'appearance-none')}
          >
            <option value="">Select a service line</option>
            {services.map((s) => (
              <option key={s.id} value={s.title} className="bg-navy">
                {s.title}
              </option>
            ))}
            <option value="Not sure yet" className="bg-navy">
              Not sure yet
            </option>
          </select>
        </Field>

        <Field label="Indicative scale">
          <select
            value={fields.volume}
            onChange={set('volume')}
            className={cn(inputBase, 'appearance-none')}
          >
            <option value="">Select if known</option>
            {[
              'Exploring options',
              '1–5 people',
              '6–15 people',
              '16–40 people',
              '40+ people',
            ].map((v) => (
              <option key={v} value={v} className="bg-navy">
                {v}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="mt-6">
        <Field
          label="Which process would you like supported?"
          required
          error={errors.message}
        >
          <textarea
            value={fields.message}
            onChange={set('message')}
            rows={5}
            className={cn(inputBase, 'resize-y', errors.message && 'border-gold/50')}
            placeholder="Tell us what the process involves today, which systems it touches, and what good would look like."
          />
        </Field>
      </div>

      {/* Honeypot — visually and programmatically hidden from real users */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={fields.website}
            onChange={set('website')}
          />
        </label>
      </div>

      <div className="mt-9 flex flex-col gap-5 border-t border-pearl/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-sm text-[12px] leading-relaxed text-pearl-faint">
          We use the details you provide to respond to your enquiry. See our{' '}
          <a
            href="/data-protection"
            className="text-pearl-dim underline underline-offset-4 transition-colors hover:text-gold"
          >
            data protection statement
          </a>
          .
        </p>

        <Turnstile
          siteKey={TURNSTILE_SITE_KEY}
          action="contact"
          onToken={setTurnstileToken}
          className="w-full sm:w-auto"
        />

        <Button type="submit" disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Sending…' : 'Send enquiry'}
        </Button>
      </div>

      {/* ---- Status messaging ---- */}
      <AnimatePresence>
        {status !== 'idle' && status !== 'submitting' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            role="status"
            aria-live="polite"
            className={cn(
              'mt-7 border-l-2 p-5 text-[13.5px] leading-relaxed',
              status === 'sent' && 'border-gold bg-gold/[0.05] text-pearl',
              status === 'unconfigured' && 'border-exec-300 bg-exec/10 text-pearl-dim',
              status === 'error' && 'border-gold/70 bg-gold/[0.04] text-pearl-dim',
            )}
          >
            {status === 'sent' && (
              <>
                <strong className="font-medium text-gold">Enquiry received.</strong>{' '}
                Thank you — we read every enquiry ourselves and will come back to
                you directly.
              </>
            )}
            {status === 'unconfigured' && (
              <>
                <strong className="font-medium text-pearl">
                  This form is not connected yet.
                </strong>{' '}
                Enquiries cannot be submitted until the site is configured.
                Please try again shortly.
              </>
            )}
            {status === 'error' && (
              <>
                <strong className="font-medium text-pearl">
                  That did not send.
                </strong>{' '}
                Something went wrong at our end rather than yours. Please try
                again in a moment.
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  )
}
