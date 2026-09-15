import { useCallback, useEffect, useRef, useState } from 'react'
import { Button, Panel } from './primitives'

/**
 * Idle timeout.
 *
 * Every console here shows other people's personal data, and a call floor is
 * a shared room where agents walk away from unlocked screens. So an
 * abandoned session signs itself out.
 *
 * The warning is deliberate: signing someone out mid-call with no notice
 * loses work and teaches them to distrust the tool. They get a countdown and
 * a way to stay.
 */

export interface IdleTimeoutOptions {
  /** Inactivity before the warning appears. */
  idleMs?: number
  /** How long the warning shows before signing out. */
  graceMs?: number
  onTimeout: () => void
  /** Suspend while a call is live — see the note in the agent app. */
  paused?: boolean
}

const ACTIVITY_EVENTS = [
  'mousedown',
  'keydown',
  'touchstart',
  'wheel',
] as const

export function useIdleTimeout({
  idleMs = 15 * 60_000,
  graceMs = 60_000,
  onTimeout,
  paused = false,
}: IdleTimeoutOptions) {
  const [warning, setWarning] = useState(false)
  const [remaining, setRemaining] = useState(graceMs)
  const lastActive = useRef(Date.now())
  const firedRef = useRef(false)

  const staySignedIn = useCallback(() => {
    lastActive.current = Date.now()
    setWarning(false)
    setRemaining(graceMs)
  }, [graceMs])

  /* Reset the clock on real interaction. Mouse movement alone is not
     activity — a nudged desk should not keep a session alive all night. */
  useEffect(() => {
    if (paused) return
    const onActivity = () => {
      lastActive.current = Date.now()
      // Only clear the warning if the user is actually acting on it.
      setWarning((w) => (w ? w : false))
    }
    for (const e of ACTIVITY_EVENTS) {
      window.addEventListener(e, onActivity, { passive: true })
    }
    return () => {
      for (const e of ACTIVITY_EVENTS) window.removeEventListener(e, onActivity)
    }
  }, [paused])

  useEffect(() => {
    if (paused) {
      setWarning(false)
      lastActive.current = Date.now()
      return
    }

    const id = window.setInterval(() => {
      const idle = Date.now() - lastActive.current

      if (idle >= idleMs + graceMs) {
        if (!firedRef.current) {
          firedRef.current = true
          onTimeout()
        }
        return
      }

      if (idle >= idleMs) {
        setWarning(true)
        setRemaining(idleMs + graceMs - idle)
      } else {
        setWarning(false)
      }
    }, 1000)

    return () => window.clearInterval(id)
  }, [idleMs, graceMs, onTimeout, paused])

  return { warning, remaining, staySignedIn }
}

export function IdleWarning({
  remaining,
  onStay,
  onSignOut,
}: {
  remaining: number
  onStay: () => void
  onSignOut: () => void
}) {
  const seconds = Math.max(0, Math.ceil(remaining / 1000))

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-obsidian-900/85 px-5 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="idle-title"
    >
      <Panel className="w-full max-w-sm p-8">
        <div className="hairline -mx-8 -mt-8 mb-7" />
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">
          Still there?
        </p>
        <h2 id="idle-title" className="mt-4 text-[1.35rem] leading-tight text-pearl">
          You will be signed out in {seconds} second{seconds === 1 ? '' : 's'}
        </h2>
        <p className="mt-3 text-[13.5px] leading-relaxed text-pearl-dim">
          Sessions end automatically when a screen is left unattended, because
          this one shows customer details.
        </p>

        <div className="mt-7 flex gap-2.5">
          <Button fullWidth onClick={onStay} autoFocus>
            Stay signed in
          </Button>
          <Button variant="secondary" onClick={onSignOut}>
            Sign out
          </Button>
        </div>
      </Panel>
    </div>
  )
}
