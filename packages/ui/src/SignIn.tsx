import { useState, type FormEvent } from 'react'
import { Button, Field, Panel, inputClass } from './primitives'
import { Logo } from './Logo'
import { Turnstile } from './Turnstile'

/**
 * Sign-in gate.
 *
 * No self-service sign-up: accounts are created by an administrator, because
 * an account on this system grants access to other people's personal data.
 */
export function SignIn({
  onSignIn,
  product,
  heading = 'Sign in to start your shift',
  turnstileSiteKey,
}: {
  onSignIn: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>
  /** Shown beside the wordmark, e.g. "Agent" or "Admin". */
  product: string
  heading?: string
  /** Cloudflare Turnstile site key. Omit to disable the check. */
  turnstileSiteKey?: string
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [, setToken] = useState<string | null>(null)

  // Optional by design. If the key is missing the widget renders nothing and
  // sign-in still works — an unset environment variable should not lock the
  // whole floor out at the start of a shift.
  const siteKey = turnstileSiteKey

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    const result = await onSignIn(email, password)
    if (!result.ok) setError(result.message ?? 'Sign in failed.')
    setBusy(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <Panel className="w-full max-w-sm p-8">
        <div className="hairline -mx-8 -mt-8 mb-8" />

        <Logo variant="reversed" className="h-10 w-auto" showDescriptor={false} />
        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.22em] text-gold">
          {product}
        </p>
        <h1 className="mt-5 text-[1.4rem] leading-tight text-pearl">
          {heading}
        </h1>

        <form onSubmit={submit} className="mt-7 space-y-5">
          <Field label="Email" required>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              autoComplete="username"
              required
              autoFocus
            />
          </Field>

          <Field label="Password" required>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              autoComplete="current-password"
              required
            />
          </Field>

          {error && (
            <p className="border-l-2 border-danger bg-danger/[0.06] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-pearl">
              {error}
            </p>
          )}

          <Turnstile siteKey={siteKey} action="login" onToken={setToken} />

          <Button type="submit" fullWidth size="lg" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-7 border-t border-pearl/10 pt-5 text-[12px] leading-relaxed text-pearl-faint">
          Accounts are created by your administrator. If you cannot sign in,
          speak to your supervisor rather than trying another address.
        </p>
      </Panel>
    </div>
  )
}
