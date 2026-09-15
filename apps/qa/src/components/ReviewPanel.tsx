import { useEffect, useMemo, useState } from 'react'
import { mandatoryCheckpoints, hhcroScript } from '@teleforce/core'
import type { QaQueueRow } from '@teleforce/data'
import { Badge, Button, Panel, cn, inputClass } from '@teleforce/ui'

/**
 * Reviewing one call.
 *
 * The compliance result is rebuilt from the checkpoints the call actually
 * recorded rather than read from a stored score, so a reviewer sees which
 * mandatory statements were reached and which were not. A single number
 * cannot be argued with; a list of named failures can.
 */
export function ReviewPanel({
  row,
  onSubmit,
  busy,
}: {
  row: QaQueueRow
  onSubmit: (input: {
    passed: boolean
    coaching: string
    overridden: string[]
    supervisorNote?: string
  }) => void
  busy: boolean
}) {
  const [coaching, setCoaching] = useState('')
  const [supervisorNote, setSupervisorNote] = useState('')
  const [overridden, setOverridden] = useState<string[]>([])

  useEffect(() => {
    setCoaching('')
    setSupervisorNote('')
    setOverridden([])
  }, [row.call_id])

  const reached = useMemo(
    () => new Set(row.checkpoints_reached ?? []),
    [row.checkpoints_reached],
  )

  const missedCritical = mandatoryCheckpoints.filter(
    (c) => c.severity === 'critical' && !reached.has(c.key),
  )

  // A reviewer can mark a checkpoint failed that the system recorded as met —
  // the agent said the words but not meaningfully. The reverse is not
  // offered: a statement that was never reached cannot be passed on appeal.
  const toggleOverride = (key: string) =>
    setOverridden((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    )

  const effectivePass =
    missedCritical.length === 0 &&
    !overridden.some(
      (k) => mandatoryCheckpoints.find((c) => c.key === k)?.severity === 'critical',
    )

  return (
    <div className="space-y-5">
      {/* Header */}
      <Panel className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-[1.4rem] leading-tight text-pearl">
              {row.customer_name ?? 'Unknown customer'}
            </h2>
            <p className="mt-1.5 font-mono text-[13px] text-pearl-dim">
              {row.customer_phone ?? '—'}
            </p>
            <p className="mt-3 text-[13px] text-pearl-faint">
              {row.agent_name} · {new Date(row.started_at).toLocaleString('en-GB')}
              {row.duration_seconds != null && ` · ${formatDuration(row.duration_seconds)}`}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge tone={row.billable ? 'ok' : 'danger'}>
              {row.billable ? 'Billable' : 'Not billable'}
            </Badge>
            {row.compliance_score != null && (
              <Badge tone={row.compliance_score === 100 ? 'ok' : 'warn'}>
                {row.compliance_score}%
              </Badge>
            )}
            {row.reviewed && (
              <Badge tone={row.review_passed ? 'ok' : 'danger'}>
                {row.review_passed ? 'Passed' : 'Failed'} by {row.reviewer_name}
              </Badge>
            )}
          </div>
        </div>

        {/* Recording. Stated plainly rather than shown as a dead player. */}
        <div className="mt-6 border-t border-pearl/10 pt-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-pearl-faint">
            Recording
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-pearl-dim">
            Calls are placed on the desk phone, so recordings live with your
            telephony provider. This review scores the captured responses and
            compliance checkpoints, not audio.
          </p>
        </div>
      </Panel>

      {/* Compliance */}
      <Panel className="p-6">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-gold/80">
          Mandatory statements
        </h3>
        <ul className="mt-4 space-y-2.5">
          {mandatoryCheckpoints.map((c) => {
            const met = reached.has(c.key)
            const overriddenHere = overridden.includes(c.key)
            return (
              <li
                key={c.key}
                className={cn(
                  'flex items-start gap-3.5 border p-3.5 transition-colors',
                  overriddenHere
                    ? 'border-danger/45 bg-danger/[0.06]'
                    : met
                      ? 'border-ok/25 bg-ok/[0.04]'
                      : 'border-danger/35 bg-danger/[0.05]',
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 shrink-0 font-mono text-[13px]',
                    met && !overriddenHere ? 'text-ok' : 'text-danger',
                  )}
                  aria-hidden="true"
                >
                  {met && !overriddenHere ? '✓' : '✕'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] text-pearl">
                    {c.title}
                    {c.severity === 'critical' && (
                      <span className="ml-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-gold/70">
                        critical
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-[12px] leading-relaxed text-pearl-faint">
                    {c.requirement}
                  </p>
                </div>
                {met && (
                  <button
                    type="button"
                    onClick={() => toggleOverride(c.key)}
                    className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-pearl-faint underline-offset-4 hover:text-danger hover:underline"
                  >
                    {overriddenHere ? 'Restore' : 'Mark failed'}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      </Panel>

      {/* What the customer actually answered */}
      <Panel className="p-6">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-gold/80">
          Responses · {row.answers?.length ?? 0}
        </h3>
        <ol className="mt-4 divide-y divide-pearl/8">
          {(row.answers ?? []).map((a, i) => {
            const node = hhcroScript.nodes[a.nodeId]
            return (
              <li key={`${a.nodeId}-${i}`} className="flex gap-4 py-2.5">
                <span className="w-6 shrink-0 font-mono text-[10px] text-pearl-faint">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="min-w-0 flex-1 text-[13px] text-pearl-dim">
                  {a.label}
                  {node?.section && (
                    <span className="ml-2 font-mono text-[9.5px] uppercase tracking-[0.12em] text-pearl-faint">
                      {node.section}
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-[13px] text-pearl">{a.value}</span>
              </li>
            )
          })}
          {(row.answers?.length ?? 0) === 0 && (
            <li className="py-3 text-[13px] text-pearl-faint">
              No responses captured on this call.
            </li>
          )}
        </ol>

        {row.rebuttals_used?.length > 0 && (
          <p className="mt-5 border-t border-pearl/10 pt-4 text-[12.5px] text-pearl-faint">
            Rebuttals used: {row.rebuttals_used.length}
          </p>
        )}
        {row.notes && (
          <p className="mt-4 border-l-2 border-exec-300/60 pl-4 text-[13px] leading-relaxed text-pearl-dim">
            {row.notes}
          </p>
        )}
      </Panel>

      {/* Decision */}
      <Panel className="p-6">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-gold/80">
          Review
        </h3>

        <label className="mt-4 block">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-pearl-faint">
            Coaching notes — the agent sees these
          </span>
          <textarea
            value={coaching}
            onChange={(e) => setCoaching(e.target.value)}
            rows={3}
            placeholder="What to do differently next time. Specific beats general."
            className={cn(inputClass, 'mt-2 resize-y')}
          />
        </label>

        <label className="mt-4 block">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-pearl-faint">
            Supervisor comments — internal
          </span>
          <textarea
            value={supervisorNote}
            onChange={(e) => setSupervisorNote(e.target.value)}
            rows={2}
            className={cn(inputClass, 'mt-2 resize-y')}
          />
        </label>

        {!effectivePass && (
          <p className="mt-4 border-l-2 border-danger bg-danger/[0.06] px-4 py-3 text-[12.5px] leading-relaxed text-pearl">
            A critical statement is missing, so this lead cannot be presented
            as billable. Passing it anyway will still mark it failed.
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-2.5 border-t border-pearl/10 pt-5">
          <Button
            variant="success"
            disabled={busy || !effectivePass}
            onClick={() =>
              onSubmit({
                passed: true,
                coaching,
                overridden,
                ...(supervisorNote ? { supervisorNote } : {}),
              })
            }
          >
            Pass
          </Button>
          <Button
            variant="danger"
            disabled={busy}
            onClick={() =>
              onSubmit({
                passed: false,
                coaching,
                overridden,
                ...(supervisorNote ? { supervisorNote } : {}),
              })
            }
          >
            Fail
          </Button>
        </div>
      </Panel>
    </div>
  )
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}
