import { useEffect, useMemo, useState } from 'react'
import type { Lead } from '@teleforce/core'
import type { Repository } from '@teleforce/data'
import { Badge, Button, EmptyState, Panel, cn } from '@teleforce/ui'

/**
 * Leads produced by the floor, and the export that gets them to the client.
 *
 * Billable and non-billable are shown together rather than filtering the
 * failures away: a lead that missed a mandatory checkpoint is the most
 * useful thing on this screen, because it is coachable.
 */

const CAMPAIGN_ID = 'hhcro'

type Filter = 'all' | 'billable' | 'not_billable'

export function Leads({ repo }: { repo: Repository }) {
  const [leads, setLeads] = useState<Lead[] | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void repo
      .listLeads(CAMPAIGN_ID)
      .then(setLeads)
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Could not load leads.')
        setLeads([])
      })
  }, [repo])

  const shown = useMemo(() => {
    if (!leads) return []
    if (filter === 'billable') return leads.filter((l) => l.billable)
    if (filter === 'not_billable') return leads.filter((l) => !l.billable)
    return leads
  }, [leads, filter])

  const counts = useMemo(
    () => ({
      all: leads?.length ?? 0,
      billable: leads?.filter((l) => l.billable).length ?? 0,
      not_billable: leads?.filter((l) => !l.billable).length ?? 0,
    }),
    [leads],
  )

  return (
    <div>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[1.9rem] leading-tight text-pearl">Leads</h1>
          <p className="mt-2.5 text-[14px] text-pearl-dim">
            Every qualified call, with the compliance result that decides
            whether it can be invoiced.
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={() => downloadCsv(shown)}
          disabled={shown.length === 0}
        >
          Export {shown.length} as CSV
        </Button>
      </header>

      <div className="mb-5 flex flex-wrap gap-2">
        {(['all', 'billable', 'not_billable'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              'border px-3.5 py-1.5 text-[12.5px] transition-colors',
              filter === f
                ? 'border-gold/60 bg-gold/[0.08] text-gold'
                : 'border-pearl/12 text-pearl-dim hover:border-pearl/25 hover:text-pearl',
            )}
          >
            {f === 'all' ? 'All' : f === 'billable' ? 'Billable' : 'Not billable'}
            <span className="ml-2 font-mono text-[11px] opacity-70">
              {counts[f]}
            </span>
          </button>
        ))}
      </div>

      {error && (
        <p className="mb-5 border-l-2 border-danger bg-danger/[0.06] px-4 py-3 text-[13px] text-pearl">
          {error}
        </p>
      )}

      <Panel className="overflow-hidden">
        {leads === null ? (
          <p className="px-6 py-16 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-pearl-faint">
            Loading…
          </p>
        ) : shown.length === 0 ? (
          <EmptyState
            title={filter === 'all' ? 'No leads yet' : 'Nothing matches this filter'}
            description={
              filter === 'all'
                ? 'Leads appear here as agents complete qualified calls.'
                : 'Try a different filter.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-pearl/10 text-pearl-faint">
                  <Th>Name</Th>
                  <Th>Phone</Th>
                  <Th>Postcode</Th>
                  <Th>Product</Th>
                  <Th>Password</Th>
                  <Th>Best time</Th>
                  <Th>Compliance</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pearl/8">
                {shown.map((l) => (
                  <tr key={l.id} className="text-pearl-dim hover:bg-pearl/[0.02]">
                    <Td className="text-pearl">
                      {l.firstName} {l.lastName}
                    </Td>
                    <Td className="font-mono">{l.phone}</Td>
                    <Td>{l.postcode ?? '—'}</Td>
                    <Td className="capitalize">{l.leadType}</Td>
                    <Td>{l.password ?? '—'}</Td>
                    <Td>{l.bestTimeToCall ?? '—'}</Td>
                    <Td>
                      <Badge tone={l.billable ? 'ok' : 'danger'}>
                        {l.complianceScore}%
                      </Badge>
                    </Td>
                    <Td>
                      <Badge tone={statusTone(l.status)}>
                        {l.status.replace(/_/g, ' ')}
                      </Badge>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  )
}

function statusTone(status: Lead['status']) {
  switch (status) {
    case 'qa_passed':
    case 'submitted':
      return 'ok' as const
    case 'qa_failed':
    case 'rejected':
      return 'danger' as const
    default:
      return 'neutral' as const
  }
}

/* ------------------------------------------------------------------ */

const COLUMNS: Array<[string, (l: Lead) => string]> = [
  ['First name', (l) => l.firstName],
  ['Last name', (l) => l.lastName],
  ['Phone', (l) => l.phone],
  ['Alternative phone', (l) => l.alternativePhone ?? ''],
  ['Address', (l) => l.addressLine1 ?? ''],
  ['Town', (l) => l.city ?? ''],
  ['Postcode', (l) => l.postcode ?? ''],
  ['Product', (l) => l.leadType],
  ['Password', (l) => l.password ?? ''],
  ['Best time to call', (l) => l.bestTimeToCall ?? ''],
  ['Eligibility path', (l) => l.eligibilityPath.join(' > ')],
  ['Compliance score', (l) => String(l.complianceScore)],
  ['Billable', (l) => (l.billable ? 'Yes' : 'No')],
  ['Status', (l) => l.status],
]

/**
 * Quote every field.
 *
 * Addresses contain commas and names contain apostrophes; quoting
 * unconditionally is cheaper than deciding per field and cannot be got
 * wrong. A leading =, +, - or @ is prefixed with a quote so spreadsheets do
 * not interpret a lead's data as a formula.
 */
function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
  return `"${safe.replace(/"/g, '""')}"`
}

function downloadCsv(leads: Lead[]): void {
  const header = COLUMNS.map(([name]) => csvCell(name)).join(',')
  const rows = leads.map((l) =>
    COLUMNS.map(([, get]) => csvCell(get(l))).join(','),
  )
  // BOM so Excel opens UTF-8 correctly rather than mangling accented names.
  const csv = '﻿' + [header, ...rows].join('\r\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `teleforce-leads-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const Th = ({ children }: { children: React.ReactNode }) => (
  <th className="px-5 py-3 font-mono text-[9.5px] font-normal uppercase tracking-[0.16em]">
    {children}
  </th>
)

const Td = ({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) => <td className={cn('px-5 py-3', className)}>{children}</td>
