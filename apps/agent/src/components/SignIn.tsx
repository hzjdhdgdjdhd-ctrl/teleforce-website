import { useState, type FormEvent } from 'react'
import { Button, Field, Panel, inputClass } from '@teleforce/ui'

/**
 * Sign-in gate.
 *
 * No self-service sign-up: accounts are created by an administrator, because
 * an account on this system grants access to other people's personal data.
 */
export function SignIn({
  onSignIn,
}: {
  onSignIn: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

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

        <p className="font-display text-[15px] font-semibold tracking-tight text-pearl">
          Teleforce <span className="text-gold">Agent</span>
        </p>
        <h1 className="mt-5 text-[1.4rem] leading-tight text-pearl">
          Sign in to start your shift
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
