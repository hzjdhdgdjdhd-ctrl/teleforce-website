import type { Disposition } from '@teleforce/core'
import { Button } from '@teleforce/ui'

/**
 * Closing a call that never reached the script — no answer, wrong number,
 * engaged. Always available, because most dials end this way.
 */
const QUICK: Array<{ id: Disposition; label: string; shortcut: string }> = [
  { id: 'no_answer', label: 'No answer', shortcut: 'N' },
  { id: 'engaged', label: 'Engaged', shortcut: 'E' },
  { id: 'wrong_number', label: 'Wrong number', shortcut: 'W' },
  { id: 'not_interested', label: 'Not interested', shortcut: 'I' },
  { id: 'callback', label: 'Callback', shortcut: 'B' },
  { id: 'do_not_call', label: 'Do not call', shortcut: 'D' },
]

export function DispositionBar({
  onDisposition,
  disabled,
}: {
  onDisposition: (d: Disposition) => void
  disabled?: boolean
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 font-mono text-[9.5px] uppercase tracking-[0.18em] text-pearl-faint">
        Close call
      </span>
      {QUICK.map((d) => (
        <Button
          key={d.id}
          size="sm"
          variant={d.id === 'do_not_call' ? 'danger' : 'secondary'}
          onClick={() => onDisposition(d.id)}
          disabled={disabled}
          shortcut={d.shortcut}
        >
          {d.label}
        </Button>
      ))}
    </div>
  )
}

export { QUICK as quickDispositions }
