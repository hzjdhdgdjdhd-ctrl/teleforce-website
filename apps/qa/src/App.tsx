import { useCallback, useEffect, useMemo, useState } from 'react'
import type { UserProfile } from '@teleforce/core'
import { can } from '@teleforce/core'
import {
  createRepository,
  SupabaseAuth,
  SupabaseQa,
  SupabaseRepository,
  type QaQueueRow,
} from '@teleforce/data'
import {
  Badge,
  Button,
  EmptyState,
  GlobeMark,
  IdleWarning,
  Panel,
  SignIn,
  cn,
  useIdleTimeout,
} from '@teleforce/ui'
import { ReviewPanel } from './components/ReviewPanel'

const { repo, backend } = createRepository(
  import.meta.env as Record<string, string | undefined>,
)
const supa = repo instanceof SupabaseRepository ? repo : null
const auth = supa ? new SupabaseAuth(supa) : null
const qa = supa ? new SupabaseQa(supa) : null

/**
 * QA console.
 *
 * A worklist, not a dashboard. Unreviewed billable leads come first because
 * those are the ones being invoiced, and a reviewer working top-down should
 * be clearing commercial risk rather than browsing.
 */
export default function App() {
  const [signedIn, setSignedIn] = useState<boolean | null>(auth ? null : true)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [rows, setRows] = useState<QaQueueRow[] | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [onlyUnreviewed, setOnlyUnreviewed] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const idle = useIdleTimeout({
    onTimeout: () => void auth?.signOut('idle_timeout'),
  })

  useEffect(() => {
    if (!auth) return
    void auth.hasSession().then(setSignedIn)
    return auth.onChange(setSignedIn)
  }, [])

  useEffect(() => {
    if (!signedIn) {
      setProfile(null)
      return
    }
    void repo.currentUser().then(setProfile)
  }, [signedIn])

  const load = useCallback(async () => {
    if (!qa) {
      setRows([])
      return
    }
    try {
      const data = await qa.queue({ onlyUnreviewed })
      setRows(data)
      setError(null)
      setSelected((current) =>
        current && data.some((r) => r.call_id === current)
          ? current
          : (data[0]?.call_id ?? null),
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the queue.')
      setRows([])
    }
  }, [onlyUnreviewed])

  useEffect(() => {
    if (signedIn !== true || !profile) return
    if (!can(profile.role, 'qa.review')) return
    void load()
  }, [signedIn, profile, load])

  const current = useMemo(
    () => rows?.find((r) => r.call_id === selected) ?? null,
    [rows, selected],
  )

  const submit = useCallback(
    async (input: {
      passed: boolean
      coaching: string
      overridden: string[]
      supervisorNote?: string
    }) => {
      if (!qa || !current) return
      setBusy(true)
      try {
        await qa.submit({ callId: current.call_id, ...input })
        await load()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not save that review.')
      }
      setBusy(false)
    },
    [current, load],
  )

  if (signedIn === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-pearl-faint">
          Checking session…
        </span>
      </div>
    )
  }

  if (!signedIn && auth) {
    return (
      <SignIn
        product="QA"
        heading="Sign in to the QA console"
        turnstileSiteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined}
        onSignIn={(e, p) => auth.signIn(e, p)}
      />
    )
  }

  if (profile && !can(profile.role, 'qa.review')) {
    return (
      <div className="flex min-h-screen items-center justify-center px-5">
        <Panel className="max-w-md p-10">
          <EmptyState
            title="The QA console is for reviewers"
            description={`Your account is set up as ${profile.role}. Ask an administrator if you need review access.`}
            action={
              auth && (
                <Button variant="secondary" onClick={() => void auth.signOut()}>
                  Sign out
                </Button>
              )
            }
          />
        </Panel>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-obsidian">
      {idle.warning && (
        <IdleWarning
          remaining={idle.remaining}
          onStay={idle.staySignedIn}
          onSignOut={() => void auth?.signOut('manual')}
        />
      )}

      <header className="flex items-center justify-between gap-6 border-b border-pearl/10 px-6 py-3.5">
        <span className="flex items-center gap-2.5">
          <GlobeMark className="h-6 w-6 shrink-0" idPrefix="qa-hdr" />
          <span className="font-display text-[15px] font-semibold tracking-tight text-pearl">
            Teleforce <span className="text-gold">QA</span>
          </span>
        </span>

        <div className="flex items-center gap-4">
          {backend === 'local' && <Badge tone="warn">Local storage — no live data</Badge>}
          {profile && (
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.16em] text-pearl-faint md:inline">
              {profile.displayName} · {profile.role}
            </span>
          )}
          {auth && (
            <Button size="sm" variant="ghost" onClick={() => void auth.signOut()}>
              Sign out
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 px-6 py-6">
        {error && (
          <p className="mb-5 border-l-2 border-danger bg-danger/[0.06] px-4 py-3 text-[13px] text-pearl">
            {error}
          </p>
        )}

        <div className="mb-5 flex flex-wrap items-center gap-3">
          <h1 className="text-[1.6rem] leading-tight text-pearl">Call reviews</h1>
          <label className="ml-auto flex cursor-pointer items-center gap-2.5 text-[13px] text-pearl-dim">
            <input
              type="checkbox"
              checked={onlyUnreviewed}
              onChange={(e) => setOnlyUnreviewed(e.target.checked)}
              className="accent-gold"
            />
            Unreviewed only
          </label>
          <Button size="sm" variant="secondary" onClick={() => void load()}>
            Refresh
          </Button>
        </div>

        {rows === null ? (
          <p className="py-20 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-pearl-faint">
            Loading…
          </p>
        ) : rows.length === 0 ? (
          <Panel className="p-10">
            <EmptyState
              title={onlyUnreviewed ? 'Nothing waiting for review' : 'No calls to review'}
              description={
                onlyUnreviewed
                  ? 'Every scripted call has been reviewed. Untick the filter to see the history.'
                  : 'Reviews appear here once agents complete calls that reached the script.'
              }
            />
          </Panel>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[minmax(300px,0.8fr)_minmax(0,1.2fr)]">
            {/* Worklist */}
            <Panel className="max-h-[76vh] overflow-y-auto">
              <ul className="divide-y divide-pearl/8">
                {rows.map((r) => (
                  <li key={r.call_id}>
                    <button
                      type="button"
                      onClick={() => setSelected(r.call_id)}
                      className={cn(
                        'w-full px-5 py-3.5 text-left transition-colors',
                        selected === r.call_id
                          ? 'bg-gold/[0.08]'
                          : 'hover:bg-pearl/[0.03]',
                      )}
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span
                          className={cn(
                            'truncate text-[13.5px]',
                            selected === r.call_id ? 'text-gold' : 'text-pearl',
                          )}
                        >
                          {r.customer_name ?? 'Unknown'}
                        </span>
                        {r.reviewed ? (
                          <Badge tone={r.review_passed ? 'ok' : 'danger'}>
                            {r.review_passed ? 'passed' : 'failed'}
                          </Badge>
                        ) : r.billable ? (
                          <Badge tone="gold">billable</Badge>
                        ) : (
                          <Badge tone="neutral">review</Badge>
                        )}
                      </span>
                      <span className="mt-1 block truncate font-mono text-[10.5px] text-pearl-faint">
                        {r.agent_name} · {new Date(r.started_at).toLocaleDateString('en-GB')}
                        {r.compliance_score != null && ` · ${r.compliance_score}%`}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </Panel>

            {/* Review */}
            <div className="max-h-[76vh] overflow-y-auto">
              {current ? (
                <ReviewPanel row={current} onSubmit={(i) => void submit(i)} busy={busy} />
              ) : (
                <Panel className="p-10">
                  <EmptyState
                    title="Select a call"
                    description="Pick one from the list to review its compliance and responses."
                  />
                </Panel>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
