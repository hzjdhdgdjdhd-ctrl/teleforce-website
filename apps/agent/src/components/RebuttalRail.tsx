import { useEffect, useState } from 'react'
import type { Rebuttal } from '@teleforce/core'
import { Kbd, Panel, cn } from '@teleforce/ui'

/**
 * One-click rebuttals.
 *
 * An objection arrives mid-sentence, so the wording has to be on screen
 * before the agent needs it. Alt+1…9 selects without leaving the keyboard.
 */
export function RebuttalRail({
  rebuttals,
  onUse,
}: {
  rebuttals: Rebuttal[]
  onUse: (rebuttal: Rebuttal) => void
}) {
  const [openId, setOpenId] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.altKey || e.metaKey || e.ctrlKey) return
      const n = Number(e.key)
      if (n >= 1 && n <= rebuttals.length) {
        e.preventDefault()
        const r = rebuttals[n - 1]!
        setOpenId((id) => (id === r.id ? null : r.id))
        onUse(r)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [rebuttals, onUse])

  if (rebuttals.length === 0) return null

  return (
    <Panel className="flex flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-pearl/10 px-5 py-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-gold/80">
          Rebuttals
        </span>
        <span className="font-mono text-[9.5px] text-pearl-faint">ALT + N</span>
      </div>

      <div className="max-h-[38vh] overflow-y-auto p-3">
        <div className="grid gap-2">
          {rebuttals.map((r, i) => {
            const open = openId === r.id
            return (
              <div key={r.id}>
                <button
                  type="button"
                  onClick={() => {
                    setOpenId(open ? null : r.id)
                    onUse(r)
                  }}
                  className={cn(
                    'group flex w-full items-center justify-between gap-3 border px-3.5 py-2.5 text-left text-[13px] transition-all duration-150',
                    open
                      ? 'border-gold/60 bg-gold/[0.08] text-gold'
                      : 'border-pearl/12 text-pearl-dim hover:border-gold/40 hover:text-pearl',
                  )}
                  aria-expanded={open}
                >
                  <span className="truncate">{r.label}</span>
                  {i < 9 && (
                    <Kbd className="shrink-0 text-pearl-faint">{i + 1}</Kbd>
                  )}
                </button>

                {open && (
                  <p className="border-x border-b border-gold/25 bg-gold/[0.03] px-3.5 py-3 text-[13px] leading-relaxed text-pearl">
                    {r.say}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </Panel>
  )
}
