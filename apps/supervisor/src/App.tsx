import { useCallback, useEffect, useRef, useState } from 'react'
import type { UserProfile } from '@teleforce/core'
import { can } from '@teleforce/core'
import {
  createRepository,
  SupabaseAuth,
  SupabaseRepository,
  WallboardClient,
  type WallboardAgent,
  type WallboardMetrics,
} from '@teleforce/data'
import {
  Badge,
  Button,
  EmptyState,
  GlobeMark,
  Panel,
  SignIn,
  IdleWarning,
  useIdleTimeout,
  StatusDot,
  cn,
} from '@teleforce/ui'
import { AgentTable } from './components/AgentTable'
import { Kpi, formatDuration } from './components/Kpi'

const { repo, backend } = createRepository(
  import.meta.env as Record<string, string | undefined>,
)
const supa = repo instanceof SupabaseRepository ? repo : null
const auth = supa ? new SupabaseAuth(supa) : null
const wallboard = supa ? new WallboardClient(supa) : null

/**
 * Supervisor wallboard.
 *
 * Realtime only — there is no refresh button and no polling loop. Changes
 * arrive over a Postgres subscription and are coalesced before refetching,
 * because a bulk import fires hundreds of events and nobody can read a board
 * that redraws hundreds of times a second.
 */
export default function App() {
  const [signedIn, setSignedIn] = useState<boolean | null>(auth ? null : true)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [metrics, setMetrics] = useState<WallboardMetrics | null>(null)
  const [agents, setAgents] = useState<WallboardAgent[]>([])
  const [error, setError] = useState<string | null>(null)
  const [live, setLive] = useState(false)
  const [tv, setTv] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  const refetchTimer = useRef<number | null>(null)

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
    if (!wallboard) return
    try {
      const [m, a] = await Promise.all([wallboard.metrics(), wallboard.agents()])
      setMetrics(m)
      setAgents(a)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the wallboard.')
    }
  }, [])

  /* Coalesce bursts of changes into one refetch. */
  const scheduleLoad = useCallback(() => {
    if (refetchTimer.current !== null) return
    refetchTimer.current = window.setTimeout(() => {
      refetchTimer.current = null
      void load()
    }, 400)
  }, [load])

  useEffect(() => {
    if (!wallboard || signedIn !== true || !profile) return
    if (!can(profile.role, 'report.view')) return

    void load()
    const unsubscribe = wallboard.subscribe(scheduleLoad)
    setLive(true)

    // Agents who closed a laptop never send a disconnect, so the board asks
    // the server to expire stale presence rather than showing a floor that
    // went home an hour ago.
    const sweep = window.setInterval(() => {
      void wallboard.expireStale().then(scheduleLoad)
    }, 60_000)

    return () => {
      unsubscribe()
      window.clearInterval(sweep)
      setLive(false)
    }
  }, [signedIn, profile, load, scheduleLoad])

  /* One ticking clock drives every live timer on the board. */
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  /* TV mode: full screen, controls out of the way. */
  const toggleTv = useCallback(async () => {
    const next = !tv
    setTv(next)
    try {
      if (next && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen()
      } else if (!next && document.fullscreenElement) {
        await document.exitFullscreen()
      }
    } catch {
      // Fullscreen can be refused by policy; the layout still changes.
    }
  }, [tv])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'f' && !e.metaKey && !e.ctrlKey) {
        const el = document.activeElement
        if (el instanceof HTMLInputElement) return
        e.preventDefault()
        void toggleTv()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggleTv])

  /* ---- Idle timeout ----
     Suspended in TV mode: a wall-mounted board has nobody touching it, and
     signing it out defeats the point of putting it on the wall. */
  const idle = useIdleTimeout({
    onTimeout: () => void auth?.signOut('idle_timeout'),
    paused: tv,
  })

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
        product="Supervisor"
        turnstileSiteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined}
        heading="Sign in to the wallboard"
        onSignIn={(e, p) => auth.signIn(e, p)}
      />
    )
  }

  if (profile && !can(profile.role, 'report.view')) {
    return (
      <div className="flex min-h-screen items-center justify-center px-5">
        <Panel className="max-w-md p-10">
          <EmptyState
            title="The wallboard is for supervisors"
            description={`Your account is set up as ${profile.role}. Ask an administrator if you need floor visibility.`}
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

  const q = metrics?.queue

  const idleOverlay = idle.warning ? (
    <IdleWarning
      remaining={idle.remaining}
      onStay={idle.staySignedIn}
      onSignOut={() => void auth?.signOut('manual')}
    />
  ) : null

  return (
    <div className={cn('min-h-screen bg-obsidian', tv && 'select-none')}>
      {idleOverlay}
      {/* Controls hide themselves in TV mode until the mouse moves. */}
      <header
        className={cn(
          'flex items-center justify-between gap-6 border-b border-pearl/10 px-6 py-3.5 transition-opacity duration-500',
          tv && 'fixed inset-x-0 top-0 z-20 bg-obsidian/90 opacity-0 backdrop-blur hover:opacity-100',
        )}
      >
        <span className="flex items-center gap-2.5">
          <GlobeMark className="h-6 w-6 shrink-0" idPrefix="sup-hdr" />
          <span className="font-display text-[15px] font-semibold tracking-tight text-pearl">
            Teleforce <span className="text-gold">Wallboard</span>
          </span>
        </span>

        <div className="flex items-center gap-4">
          {backend === 'local' && (
            <Badge tone="warn">Local storage — no live data</Badge>
          )}
          <Badge tone={live ? 'ok' : 'neutral'}>
            <StatusDot tone={live ? 'ok' : 'neutral'} />
            {live ? 'Live' : 'Connecting'}
          </Badge>
          <Button size="sm" variant="ghost" onClick={() => void toggleTv()} shortcut="F">
            {tv ? 'Exit TV mode' : 'TV mode'}
          </Button>
          {auth && !tv && (
            <Button size="sm" variant="ghost" onClick={() => void auth.signOut()}>
              Sign out
            </Button>
          )}
        </div>
      </header>

      <main className={cn('px-6 py-6', tv && 'px-8 py-8')}>
        {error && (
          <p className="mb-5 border-l-2 border-danger bg-danger/[0.06] px-4 py-3 text-[13px] text-pearl">
            {error}
          </p>
        )}

        {!metrics ? (
          <p className="py-24 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-pearl-faint">
            Loading the floor…
          </p>
        ) : (
          <div className={cn('space-y-6', tv && 'space-y-8')}>
            {/* Headline numbers */}
            <section
              className={cn(
                'grid gap-3',
                tv
                  ? 'grid-cols-2 md:grid-cols-4'
                  : 'grid-cols-2 md:grid-cols-4 xl:grid-cols-8',
              )}
            >
              <Kpi tv={tv} label="Agents online" value={metrics.agents.online} tone="ok" />
              <Kpi tv={tv} label="Talking now" value={metrics.agents.talking} tone="gold" />
              <Kpi tv={tv} label="Calls today" value={metrics.calls.today} />
              <Kpi tv={tv} label="Qualified" value={metrics.leads.qualified} tone="gold" />
              <Kpi
                tv={tv}
                label="Conversion"
                value={metrics.conversionRate}
                suffix="%"
                tone={metrics.conversionRate >= 10 ? 'ok' : 'neutral'}
                hint="Qualified per connected call"
              />
              <Kpi
                tv={tv}
                label="Avg handle"
                value={formatDuration(metrics.calls.averageHandleSeconds)}
                hint="Connected calls only"
              />
              <Kpi tv={tv} label="Callbacks" value={q?.callback ?? 0} tone="warn" />
              <Kpi
                tv={tv}
                label="Appointments"
                value={metrics.leads.appointments}
                tone="gold"
              />
            </section>

            {/* Queue */}
            <section>
              <h2
                className={cn(
                  'mb-3 font-mono uppercase tracking-[0.2em] text-gold/80',
                  tv ? 'text-[13px]' : 'text-[10px]',
                )}
              >
                Queue · {q?.total ?? 0} contacts
              </h2>
              <div className="panel overflow-hidden">
                <div className="flex h-3 w-full overflow-hidden">
                  <Segment value={q?.waiting} total={q?.total} className="bg-ice" />
                  <Segment value={q?.claimed} total={q?.total} className="bg-gold/70" />
                  <Segment value={q?.inCall} total={q?.total} className="bg-ok" />
                  <Segment value={q?.completed} total={q?.total} className="bg-exec-300" />
                  <Segment value={q?.callback} total={q?.total} className="bg-warn" />
                  <Segment value={q?.dnc} total={q?.total} className="bg-danger" />
                </div>
                <dl
                  className={cn(
                    'grid divide-pearl/10 sm:grid-cols-3 lg:grid-cols-6 lg:divide-x',
                  )}
                >
                  <QueueStat tv={tv} label="Waiting" value={q?.waiting} tone="text-ice" />
                  <QueueStat tv={tv} label="Claimed" value={q?.claimed} tone="text-gold" />
                  <QueueStat tv={tv} label="In call" value={q?.inCall} tone="text-ok" />
                  <QueueStat tv={tv} label="Completed" value={q?.completed} tone="text-pearl-dim" />
                  <QueueStat tv={tv} label="Callback" value={q?.callback} tone="text-warn" />
                  <QueueStat tv={tv} label="Do not call" value={q?.dnc} tone="text-danger" />
                </dl>
              </div>
            </section>

            {/* The floor */}
            <section>
              <h2
                className={cn(
                  'mb-3 font-mono uppercase tracking-[0.2em] text-gold/80',
                  tv ? 'text-[13px]' : 'text-[10px]',
                )}
              >
                Agents
              </h2>
              <AgentTable agents={agents} now={now} tv={tv} />
            </section>
          </div>
        )}
      </main>
    </div>
  )
}

function Segment({
  value,
  total,
  className,
}: {
  value?: number
  total?: number
  className: string
}) {
  if (!value || !total) return null
  return (
    <span
      className={cn('transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]', className)}
      style={{ width: `${(value / total) * 100}%` }}
    />
  )
}

function QueueStat({
  label,
  value,
  tone,
  tv,
}: {
  label: string
  value?: number
  tone: string
  tv?: boolean
}) {
  return (
    <div className={cn('px-5', tv ? 'py-5' : 'py-4')}>
      <dt
        className={cn(
          'font-mono uppercase tracking-[0.16em] text-pearl-faint',
          tv ? 'text-[12px]' : 'text-[9.5px]',
        )}
      >
        {label}
      </dt>
      <dd
        className={cn(
          'mt-1.5 font-display leading-none tabular-nums',
          tone,
          tv ? 'text-[2.2rem]' : 'text-[1.35rem]',
        )}
      >
        {value ?? 0}
      </dd>
    </div>
  )
}
