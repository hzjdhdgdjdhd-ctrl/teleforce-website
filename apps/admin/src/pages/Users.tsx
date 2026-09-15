import { useCallback, useEffect, useState } from 'react'
import type { SupabaseAdmin, ManagedUser } from '@teleforce/data'
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Panel,
  cn,
  inputClass,
} from '@teleforce/ui'

/**
 * User and agent management.
 *
 * An account here grants access to other people's personal data, so there is
 * no self-service signup anywhere in the product — every account is created
 * on this screen by an administrator.
 */

const ROLES: Array<{ id: ManagedUser['role']; label: string; blurb: string }> = [
  { id: 'agent', label: 'Agent', blurb: 'Works calls. Sees only the contact assigned to them.' },
  { id: 'qa', label: 'QA', blurb: 'Reviews calls and scores compliance. Read-only on leads.' },
  { id: 'supervisor', label: 'Supervisor', blurb: 'Runs the floor: contacts, leads, rebuttals, reporting.' },
  { id: 'admin', label: 'Administrator', blurb: 'Everything, including creating and removing users.' },
]

export function Users({
  admin,
  currentUserId,
}: {
  admin: SupabaseAdmin | null
  currentUserId: string
}) {
  const [users, setUsers] = useState<ManagedUser[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const refresh = useCallback(async () => {
    if (!admin) {
      setUsers([])
      return
    }
    try {
      setUsers(await admin.listUsers())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load users.')
      setUsers([])
    }
  }, [admin])

  useEffect(() => {
    void refresh()
  }, [refresh])

  if (!admin) {
    return (
      <Panel className="p-10">
        <EmptyState
          title="User management needs Supabase"
          description="This app is running on browser-local storage, which has no accounts. Configure Supabase to manage users."
        />
      </Panel>
    )
  }

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[1.9rem] leading-tight text-pearl">
            Users &amp; agents
          </h1>
          <p className="mt-2.5 max-w-xl text-[14px] leading-[1.7] text-pearl-dim">
            Every account is created here. There is no signup form anywhere in
            the product, because an account grants access to other people's
            personal data.
          </p>
        </div>
        <Button onClick={() => setCreating((v) => !v)}>
          {creating ? 'Cancel' : 'Add user'}
        </Button>
      </header>

      {creating && (
        <CreateUser
          admin={admin}
          onDone={() => {
            setCreating(false)
            void refresh()
          }}
        />
      )}

      {error && (
        <p className="mb-5 border-l-2 border-danger bg-danger/[0.06] px-4 py-3 text-[13px] text-pearl">
          {error}
        </p>
      )}

      <Panel className="overflow-hidden">
        {users === null ? (
          <p className="px-6 py-14 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-pearl-faint">
            Loading…
          </p>
        ) : users.length === 0 ? (
          <EmptyState
            title="No users yet"
            description="Add your first agent to get started."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-pearl/10 text-pearl-faint">
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Role</Th>
                  <Th>Status</Th>
                  <Th> </Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pearl/8">
                {users.map((u) => (
                  <UserRow
                    key={u.id}
                    user={u}
                    admin={admin}
                    isSelf={u.id === currentUserId}
                    onChanged={refresh}
                    onError={setError}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  )
}

/* ------------------------------------------------------------------ */

function UserRow({
  user,
  admin,
  isSelf,
  onChanged,
  onError,
}: {
  user: ManagedUser
  admin: SupabaseAdmin
  isSelf: boolean
  onChanged: () => void
  onError: (message: string | null) => void
}) {
  const [busy, setBusy] = useState(false)

  const apply = async (patch: Parameters<SupabaseAdmin['updateUser']>[0]) => {
    setBusy(true)
    onError(null)
    const result = await admin.updateUser(patch)
    if (!result.ok) onError(result.error ?? 'Update failed.')
    setBusy(false)
    onChanged()
  }

  return (
    <tr className={cn('text-pearl-dim', !user.active && 'opacity-50')}>
      <Td className="text-pearl">
        {user.displayName}
        {isSelf && <span className="ml-2 text-[11px] text-gold">you</span>}
      </Td>
      <Td className="font-mono text-[12px]">{user.email}</Td>
      <Td>
        <select
          value={user.role}
          disabled={busy || isSelf}
          onChange={(e) =>
            void apply({
              userId: user.id,
              role: e.target.value as ManagedUser['role'],
            })
          }
          className="border border-pearl/12 bg-navy-700 px-2.5 py-1 text-[12.5px] text-pearl focus:border-gold/60 focus:outline-none disabled:opacity-60"
          // Changing your own role would lock you out of this screen with no
          // way back short of the database.
          title={isSelf ? 'You cannot change your own role' : undefined}
        >
          {ROLES.map((r) => (
            <option key={r.id} value={r.id} className="bg-navy">
              {r.label}
            </option>
          ))}
        </select>
      </Td>
      <Td>
        <Badge tone={user.active ? 'ok' : 'neutral'}>
          {user.active ? 'Active' : 'Disabled'}
        </Badge>
      </Td>
      <Td>
        <Button
          size="sm"
          variant={user.active ? 'danger' : 'success'}
          disabled={busy || isSelf}
          onClick={() => void apply({ userId: user.id, active: !user.active })}
        >
          {user.active ? 'Disable' : 'Enable'}
        </Button>
      </Td>
    </tr>
  )
}

/* ------------------------------------------------------------------ */

function CreateUser({
  admin,
  onDone,
}: {
  admin: SupabaseAdmin
  onDone: () => void
}) {
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [role, setRole] = useState<ManagedUser['role']>('agent')
  const [password, setPassword] = useState(() => suggestPassword())
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)

    const result = await admin.createUser({
      email,
      password,
      displayName,
      role,
      campaignIds: ['hhcro'],
    })

    setBusy(false)
    if (!result.ok) {
      setError(result.error ?? 'Could not create that user.')
      return
    }
    onDone()
  }

  return (
    <Panel className="mb-6 p-7">
      <form onSubmit={submit} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Full name" required>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={inputClass}
              placeholder="Priya Nair"
              required
              autoFocus
            />
          </Field>
          <Field label="Email" required>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="priya@teleforcetechnology.org"
              autoComplete="off"
              required
            />
          </Field>
        </div>

        <Field
          label="Temporary password"
          required
          hint="Give this to the agent directly. They should change it after first sign-in."
        >
          <div className="flex gap-2">
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn(inputClass, 'font-mono')}
              minLength={12}
              required
            />
            <Button
              type="button"
              variant={copied ? 'success' : 'secondary'}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(password)
                  setCopied(true)
                  window.setTimeout(() => setCopied(false), 1600)
                } catch {
                  setError('Clipboard blocked — select the password to copy it.')
                }
              }}
            >
              {copied ? 'Copied' : 'Copy'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setPassword(suggestPassword())}
            >
              New
            </Button>
          </div>
        </Field>

        <fieldset>
          <legend className="font-mono text-[10px] uppercase tracking-[0.16em] text-pearl-faint">
            Role
          </legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {ROLES.map((r) => (
              <label
                key={r.id}
                className={cn(
                  'cursor-pointer border px-4 py-3 transition-colors',
                  role === r.id
                    ? 'border-gold/60 bg-gold/[0.06]'
                    : 'border-pearl/12 hover:border-pearl/25',
                )}
              >
                <input
                  type="radio"
                  name="role"
                  value={r.id}
                  checked={role === r.id}
                  onChange={() => setRole(r.id)}
                  className="sr-only"
                />
                <span
                  className={cn(
                    'block text-[13.5px]',
                    role === r.id ? 'text-gold' : 'text-pearl',
                  )}
                >
                  {r.label}
                </span>
                <span className="mt-1 block text-[12px] leading-relaxed text-pearl-faint">
                  {r.blurb}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {error && (
          <p className="border-l-2 border-danger bg-danger/[0.06] px-4 py-3 text-[13px] leading-relaxed text-pearl">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2.5 border-t border-pearl/10 pt-5">
          <Button type="submit" disabled={busy}>
            {busy ? 'Creating…' : 'Create user'}
          </Button>
        </div>
      </form>
    </Panel>
  )
}

/**
 * Suggest a strong temporary password.
 *
 * Uses crypto.getRandomValues rather than Math.random: this value protects a
 * real account, briefly, and a predictable one is worth nothing.
 */
function suggestPassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  const bytes = new Uint32Array(18)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (n) => alphabet[n % alphabet.length]).join('')
}

const Th = ({ children }: { children: React.ReactNode }) => (
  <th className="px-5 py-3 font-mono text-[9.5px] font-normal uppercase tracking-[0.16em]">
    {children}
  </th>
)

const Td = ({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) => <td className={cn('px-5 py-3', className)}>{children}</td>
