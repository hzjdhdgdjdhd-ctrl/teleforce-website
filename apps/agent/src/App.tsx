import { useEffect, useMemo, useState } from 'react'
import { isComplete, type Disposition, type Rebuttal } from '@teleforce/core'
import {
  Badge,
  Button,
  CommandPalette,
  EmptyState,
  Panel,
  StatusDot,
  useCommandPalette,
  type Command,
} from '@teleforce/ui'
import { LocalRepository } from './data/localRepository'
import { useCallSession } from './useCallSession'
import { ContactPanel } from './components/ContactPanel'
import { ScriptRunner } from './components/ScriptRunner'
import { RebuttalRail } from './components/RebuttalRail'
import { DispositionBar, quickDispositions } from './components/DispositionBar'

const repo = new LocalRepository()

/**
 * Agent workspace.
 *
 * Three columns: who you are calling, what to say, and the objection
 * handling. Everything an agent needs during a call is on one screen with no
 * navigation, because navigating mid-call is how calls get lost.
 */
export default function App() {
  // Until Firebase Auth is wired, the agent identity comes from the local
  // profile the supervisor sets on the machine.
  const agentId = 'agent-local'

  const session = useCallSession(repo, agentId)
  const [rebuttals, setRebuttals] = useState<Rebuttal[]>([])
  const palette = useCommandPalette()

  useEffect(() => {
    void repo.listRebuttals('hhcro').then(setRebuttals)
  }, [])

  const scriptComplete = session.script ? isComplete(session.script) : false

  /* Quick dispositions by single keypress, but never while typing. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const el = document.activeElement
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return
      const match = quickDispositions.find(
        (d) => d.shortcut.toLowerCase() === e.key.toLowerCase(),
      )
      if (match && session.contact) {
        e.preventDefault()
        void session.close(match.id)
      }
      if (e.key.toLowerCase() === 'c' && session.contact) {
        e.preventDefault()
        void navigator.clipboard.writeText(session.contact.phone).catch(() => {})
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [session])

  const commands = useMemo<Command[]>(() => {
    const list: Command[] = [
      {
        id: 'next',
        group: 'Call',
        label: 'Skip to next contact',
        run: () => void session.loadNext(),
      },
    ]

    if (session.contact) {
      list.push({
        id: 'copy',
        group: 'Call',
        label: `Copy number ${session.contact.phone}`,
        keywords: session.contact.phone,
        shortcut: 'C',
        run: () => void navigator.clipboard.writeText(session.contact!.phone).catch(() => {}),
      })
      for (const d of quickDispositions) {
        list.push({
          id: `disp-${d.id}`,
          group: 'Disposition',
          label: d.label,
          shortcut: d.shortcut,
          run: () => void session.close(d.id),
        })
      }
    }

    for (const r of rebuttals) {
      list.push({
        id: `reb-${r.id}`,
        group: 'Rebuttals',
        label: r.label,
        keywords: r.say,
        run: () => session.useRebuttal(r.id),
      })
    }

    return list
  }, [session, rebuttals])

  const customerName = session.contact
    ? [session.contact.title, session.contact.lastName].filter(Boolean).join(' ')
    : ''

  return (
    <div className="flex min-h-screen flex-col bg-obsidian">
      <Header elapsed={session.elapsed} hasCall={Boolean(session.contact)} />

      <main className="flex-1 px-5 pb-5">
        {session.loading ? (
          <Panel className="flex h-[70vh] items-center justify-center">
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-pearl-faint">
              Loading queue…
            </span>
          </Panel>
        ) : !session.contact ? (
          <Panel className="flex h-[70vh] items-center justify-center">
            <EmptyState
              title="No contacts in your queue"
              description="Your administrator uploads the day's contacts each morning. Once a list is loaded, the next number appears here automatically."
              action={
                <Button variant="secondary" onClick={() => void session.loadNext()}>
                  Check again
                </Button>
              }
            />
          </Panel>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[minmax(300px,0.9fr)_minmax(0,1.9fr)_minmax(260px,0.8fr)]">
            <ContactPanel contact={session.contact} elapsed={session.elapsed} />

            <div className="flex min-h-[70vh] flex-col gap-4">
              {session.script && (
                <div className="min-h-0 flex-1">
                  <ScriptRunner
                    state={session.script}
                    onAnswer={session.answer}
                    customerName={customerName}
                  />
                </div>
              )}

              <Panel className="p-5">
                {scriptComplete && session.outcomeSummary && (
                  <OutcomeSummary
                    summary={session.outcomeSummary}
                    onSubmit={() =>
                      void session.close(
                        session.script!.outcome === 'qualified'
                          ? 'qualified'
                          : (session.script!.outcome as Disposition),
                      )
                    }
                  />
                )}

                <label className="mt-4 block first:mt-0">
                  <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-pearl-faint">
                    Call notes
                  </span>
                  <textarea
                    value={session.notes}
                    onChange={(e) => session.setNotes(e.target.value)}
                    rows={2}
                    placeholder="Anything the surveyor or the next agent should know."
                    className="mt-2 w-full resize-y border border-pearl/12 bg-pearl/[0.02] px-3.5 py-2.5 text-[13.5px] text-pearl placeholder:text-pearl-faint focus:border-gold/60 focus:outline-none"
                  />
                </label>

                <div className="mt-4 border-t border-pearl/10 pt-4">
                  <DispositionBar onDisposition={(d) => void session.close(d)} />
                </div>
              </Panel>
            </div>

            <RebuttalRail
              rebuttals={rebuttals}
              onUse={(r) => session.useRebuttal(r.id)}
            />
          </div>
        )}
      </main>

      <CommandPalette
        commands={commands}
        open={palette.open}
        onOpenChange={palette.setOpen}
        placeholder="Dispositions, rebuttals, actions…"
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */

function Header({ elapsed, hasCall }: { elapsed: string; hasCall: boolean }) {
  return (
    <header className="flex items-center justify-between gap-6 border-b border-pearl/10 px-5 py-3.5">
      <div className="flex items-center gap-4">
        <span className="font-display text-[15px] font-semibold tracking-tight text-pearl">
          Teleforce <span className="text-gold">Agent</span>
        </span>
        <span className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-pearl-faint sm:inline">
          HHCRO Insulation
        </span>
      </div>

      <div className="flex items-center gap-4">
        {hasCall && (
          <Badge tone="gold">
            <StatusDot tone="gold" />
            {elapsed}
          </Badge>
        )}
        <span className="hidden font-mono text-[10px] uppercase tracking-[0.16em] text-pearl-faint md:inline">
          ⌘K commands
        </span>
      </div>
    </header>
  )
}

function OutcomeSummary({
  summary,
  onSubmit,
}: {
  summary: NonNullable<ReturnType<typeof import('@teleforce/core').scoreCall>>
  onSubmit: () => void
}) {
  return (
    <div className="border-b border-pearl/10 pb-4">
      <div className="flex flex-wrap items-center gap-3">
        <Badge tone={summary.billable ? 'ok' : 'danger'}>
          {summary.billable ? 'Billable' : 'Not billable'}
        </Badge>
        <Badge tone={summary.score === 100 ? 'ok' : 'warn'}>
          Compliance {summary.score}%
        </Badge>
        <Button size="sm" onClick={onSubmit} className="ml-auto">
          Close call & save
        </Button>
      </div>

      <p className="mt-3 text-[13px] leading-relaxed text-pearl-dim">
        {summary.summary}
      </p>

      {summary.missedCritical.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {summary.missedCritical.map((c) => (
            <li key={c.key} className="flex gap-2.5 text-[12.5px] text-danger">
              <span aria-hidden="true">✕</span>
              <span>{c.title} — {c.requirement}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
