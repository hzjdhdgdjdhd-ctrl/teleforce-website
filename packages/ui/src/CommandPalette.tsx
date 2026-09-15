import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { cn } from './cn'
import { Kbd } from './primitives'

/**
 * ⌘K command palette.
 *
 * Present in every app. An agent on a call should never reach for a mouse, so
 * navigation, dispositions and rebuttals are all reachable from here.
 */

export interface Command {
  id: string
  label: string
  /** Grouping header in the list. */
  group: string
  /** Extra words that should match this command, e.g. a phone number. */
  keywords?: string
  shortcut?: string
  run: () => void
  /** Hidden without removing it from the registry. */
  disabled?: boolean
}

/**
 * Subsequence match — typing "nc" finds "New Contact".
 *
 * Returns a score so exact prefix matches rank above scattered ones; -1 when
 * the query does not match at all.
 */
export function fuzzyScore(query: string, target: string): number {
  if (!query) return 0
  const q = query.toLowerCase()
  const t = target.toLowerCase()

  if (t.startsWith(q)) return 1000 - t.length
  const direct = t.indexOf(q)
  if (direct !== -1) return 500 - direct - t.length * 0.1

  let qi = 0
  let score = 0
  let lastHit = -1
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      // Consecutive and word-start matches are worth more.
      score += lastHit === ti - 1 ? 8 : 3
      if (ti === 0 || t[ti - 1] === ' ') score += 6
      lastHit = ti
      qi++
    }
  }
  return qi === q.length ? score : -1
}

export function CommandPalette({
  commands,
  open,
  onOpenChange,
  placeholder = 'Search commands…',
}: {
  commands: Command[]
  open: boolean
  onOpenChange: (open: boolean) => void
  placeholder?: string
}) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const results = useMemo(() => {
    const usable = commands.filter((c) => !c.disabled)
    if (!query.trim()) return usable

    return usable
      .map((c) => ({
        c,
        score: Math.max(
          fuzzyScore(query, c.label),
          fuzzyScore(query, c.keywords ?? '') - 50,
          fuzzyScore(query, c.group) - 100,
        ),
      }))
      .filter((r) => r.score > -1)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.c)
  }, [commands, query])

  // Reset when the palette opens so it never reopens mid-search.
  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  useEffect(() => setActive(0), [query])

  const runActive = useCallback(() => {
    const command = results[active]
    if (!command) return
    onOpenChange(false)
    command.run()
  }, [results, active, onOpenChange])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      runActive()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onOpenChange(false)
    }
  }

  // Keep the highlighted row in view when navigating by keyboard.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>('[data-active="true"]')
    el?.scrollIntoView({ block: 'nearest' })
  }, [active])

  if (!open) return null

  let lastGroup = ''

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-obsidian-900/80 px-4 pt-[12vh] backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false)
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div className="panel w-full max-w-xl overflow-hidden shadow-[0_32px_80px_-20px_rgba(0,0,0,0.95)]">
        <div className="hairline" />

        <div className="flex items-center gap-3 border-b border-pearl/10 px-4">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="shrink-0 text-pearl-faint" aria-hidden="true">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.4" />
            <path d="m11 11 3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            className="w-full bg-transparent py-3.5 text-[14.5px] text-pearl placeholder:text-pearl-faint focus:outline-none"
            aria-label="Search commands"
            autoComplete="off"
            spellCheck={false}
          />
          <Kbd className="shrink-0 text-pearl-faint">ESC</Kbd>
        </div>

        <div ref={listRef} className="max-h-[52vh] overflow-y-auto py-1.5">
          {results.length === 0 ? (
            <p className="px-4 py-8 text-center text-[13px] text-pearl-faint">
              No commands match “{query}”
            </p>
          ) : (
            results.map((c, i) => {
              const showGroup = c.group !== lastGroup
              lastGroup = c.group
              return (
                <div key={c.id}>
                  {showGroup && (
                    <p className="px-4 pb-1 pt-3 font-mono text-[9.5px] uppercase tracking-[0.18em] text-pearl-faint">
                      {c.group}
                    </p>
                  )}
                  <button
                    type="button"
                    data-active={i === active}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => {
                      onOpenChange(false)
                      c.run()
                    }}
                    className={cn(
                      'flex w-full items-center justify-between gap-4 px-4 py-2.5 text-left text-[13.5px]',
                      i === active
                        ? 'bg-gold/[0.10] text-pearl'
                        : 'text-pearl-dim hover:bg-pearl/[0.04]',
                    )}
                  >
                    <span className="truncate">{c.label}</span>
                    {c.shortcut && (
                      <Kbd className="shrink-0 text-pearl-faint">{c.shortcut}</Kbd>
                    )}
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Wires ⌘K / Ctrl+K to open the palette.
 *
 * Ignores the shortcut while the user is typing in a field, so it cannot fire
 * mid-note during a live call.
 */
export function useCommandPalette() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'k' || !(e.metaKey || e.ctrlKey)) return
      const el = document.activeElement
      const typing =
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        (el instanceof HTMLElement && el.isContentEditable)
      if (typing && !open) return
      e.preventDefault()
      setOpen((v) => !v)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return { open, setOpen }
}
