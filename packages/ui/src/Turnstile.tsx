import { useEffect, useRef, useState } from 'react'

/**
 * Cloudflare Turnstile.
 *
 * Invisible by default: a challenge a real person has to solve costs
 * conversions on a contact form and costs an agent thirty seconds at the
 * start of every shift. Turnstile only interrupts when it is genuinely
 * unsure.
 *
 * Absent a site key this renders nothing and reports no token. Callers must
 * decide what that means — a public form can proceed without one rather than
 * locking out every visitor because an environment variable was missed.
 */

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string
      remove: (id: string) => void
      reset: (id: string) => void
    }
    onTurnstileReady?: () => void
  }
}

const SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileReady'

let scriptPromise: Promise<void> | null = null

function loadTurnstile(): Promise<void> {
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise((resolve, reject) => {
    if (window.turnstile) return resolve()
    window.onTurnstileReady = () => resolve()
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onerror = () => reject(new Error('Turnstile failed to load'))
    document.head.appendChild(script)
  })
  return scriptPromise
}

export function Turnstile({
  siteKey,
  onToken,
  action,
  className,
}: {
  siteKey: string | undefined
  onToken: (token: string | null) => void
  /** Labels the challenge in Cloudflare's analytics, e.g. "login". */
  action?: string
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!siteKey || !ref.current) return
    let cancelled = false

    void loadTurnstile()
      .then(() => {
        if (cancelled || !ref.current || !window.turnstile) return
        widgetId.current = window.turnstile.render(ref.current, {
          sitekey: siteKey,
          action,
          size: 'flexible',
          theme: 'dark',
          callback: (token: string) => onToken(token),
          'error-callback': () => {
            setFailed(true)
            onToken(null)
          },
          'expired-callback': () => onToken(null),
        })
      })
      .catch(() => {
        // A blocked script must not make the form unusable.
        setFailed(true)
        onToken(null)
      })

    return () => {
      cancelled = true
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current)
        widgetId.current = null
      }
    }
  }, [siteKey, action, onToken])

  if (!siteKey) return null

  return (
    <div className={className}>
      <div ref={ref} />
      {failed && (
        <p className="mt-2 text-[11.5px] text-pearl-faint">
          The verification check could not load. You can still continue.
        </p>
      )}
    </div>
  )
}
