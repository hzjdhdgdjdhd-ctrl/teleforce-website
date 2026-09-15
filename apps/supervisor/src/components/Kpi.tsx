import { cn } from '@teleforce/ui'

/**
 * A single headline number.
 *
 * Sized to be read from across a room. The label sits above the value
 * because on a wall-mounted screen the eye lands on the largest element
 * first and needs the label already in view to interpret it.
 */
export function Kpi({
  label,
  value,
  suffix,
  tone = 'neutral',
  hint,
  tv,
}: {
  label: string
  value: string | number
  suffix?: string
  tone?: 'neutral' | 'ok' | 'warn' | 'danger' | 'gold'
  hint?: string
  tv?: boolean
}) {
  const colour = {
    neutral: 'text-pearl',
    ok: 'text-ok',
    warn: 'text-warn',
    danger: 'text-danger',
    gold: 'text-gold',
  }[tone]

  return (
    <div className="panel px-5 py-4 lg:px-6 lg:py-5">
      <p
        className={cn(
          'font-mono uppercase tracking-[0.18em] text-pearl-faint',
          tv ? 'text-[13px]' : 'text-[10px]',
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          'mt-2 font-display leading-none tabular-nums',
          colour,
          tv ? 'text-[clamp(2.6rem,4.4vw,4.6rem)]' : 'text-[clamp(1.6rem,2.4vw,2.3rem)]',
        )}
      >
        {value}
        {suffix && (
          <span className={cn('ml-1 text-pearl-faint', tv ? 'text-[0.4em]' : 'text-[0.5em]')}>
            {suffix}
          </span>
        )}
      </p>
      {hint && !tv && (
        <p className="mt-1.5 text-[11.5px] text-pearl-faint">{hint}</p>
      )}
    </div>
  )
}

/** Seconds as m:ss — an average handle time is read as minutes, not 247. */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

/** Live-ticking elapsed time since an ISO timestamp. */
export function elapsedSince(iso: string | null, now: number): string {
  if (!iso) return '—'
  const started = Date.parse(iso)
  if (Number.isNaN(started)) return '—'
  return formatDuration(Math.max(0, (now - started) / 1000))
}
