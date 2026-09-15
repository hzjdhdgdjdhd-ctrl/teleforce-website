import { useCallback, useRef, useState } from 'react'
import {
  importContacts,
  importContactsFromRows,
  looksLikeXlsx,
  readXlsx,
  type ImportResult,
} from '@teleforce/core'
import type { Repository } from '@teleforce/data'
import { Badge, Button, EmptyState, Panel, cn } from '@teleforce/ui'

/**
 * Daily contact upload.
 *
 * The file is parsed and previewed before anything is written. An admin
 * uploading a mis-mapped list at 8am and discovering it at noon is the
 * failure mode worth designing against, so the preview shows exactly what
 * will be imported, what will be skipped and why.
 */

const CAMPAIGN_ID = 'hhcro'

type Stage = 'idle' | 'parsed' | 'importing' | 'done' | 'failed'

export function Upload({ repo, userId }: { repo: Repository; userId: string }) {
  const [stage, setStage] = useState<Stage>('idle')
  const [filename, setFilename] = useState('')
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    async (file: File) => {
      setError(null)
      setFilename(file.name)

      // Guard before reading: a mis-dropped video would otherwise be read
      // into memory in full before failing.
      if (file.size > 25 * 1024 * 1024) {
        setError('That file is larger than 25 MB. Split it and upload in parts.')
        setStage('failed')
        return
      }

      try {
        // Skip numbers already on the campaign so a re-uploaded list does not
        // create duplicate work for agents.
        const existing = await repo.listContacts(CAMPAIGN_ID)
        const existingPhones = new Set(existing.map((c) => c.phone))
        const options = {
          campaignId: CAMPAIGN_ID,
          batchId: 'pending',
          existingPhones,
        }

        // Sniff the bytes rather than trusting the extension — a .csv that is
        // really a workbook is a common export mistake, and vice versa.
        const bytes = new Uint8Array(await file.arrayBuffer())
        const parsed = looksLikeXlsx(bytes)
          ? importContactsFromRows(await readXlsx(bytes), options)
          : importContacts(new TextDecoder().decode(bytes), options)

        setResult(parsed)
        setStage('parsed')
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : 'Could not read that file. Save it as CSV and try again.',
        )
        setStage('failed')
      }
    },
    [repo],
  )

  const confirmImport = useCallback(async () => {
    if (!result || result.imported === 0) return
    setStage('importing')
    setError(null)

    try {
      // The batch is written first so every contact carries a real batch id
      // and a bad list can be traced back to the file it came from.
      const batchId = await repo.addBatch({
        campaignId: CAMPAIGN_ID,
        filename,
        uploadedBy: userId,
        uploadedAt: new Date().toISOString(),
        totalRows: result.totalRows,
        imported: result.imported,
        skippedDuplicates: result.skippedDuplicates,
        rejected: result.rejected,
        issues: result.issues,
      })

      await repo.addContacts(
        result.contacts.map((c) => ({ ...c, batchId })),
      )
      setStage('done')
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'The import failed partway through. Check the contacts list before retrying.',
      )
      setStage('failed')
    }
  }, [result, filename, userId, repo])

  const reset = () => {
    setStage('idle')
    setResult(null)
    setError(null)
    setFilename('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8">
        <h1 className="text-[1.9rem] leading-tight text-pearl">
          Upload today's contacts
        </h1>
        <p className="mt-2.5 max-w-xl text-[14px] leading-[1.7] text-pearl-dim">
          Excel (.xlsx), CSV or tab-separated. Column names are matched
          automatically, and any column we do not recognise is kept with the
          contact rather than discarded.
        </p>
      </header>

      {stage === 'idle' || stage === 'failed' ? (
        <>
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              const file = e.dataTransfer.files[0]
              if (file) void handleFile(file)
            }}
            className={cn(
              'panel flex flex-col items-center justify-center border-dashed px-6 py-16 text-center transition-colors',
              dragging ? 'border-gold/70 bg-gold/[0.04]' : 'border-pearl/15',
            )}
          >
            <p className="text-[15px] text-pearl">
              Drop a contact file here
            </p>
            <p className="mt-1.5 text-[13px] text-pearl-faint">
              .xlsx, .csv or .tsv — or choose one from your computer
            </p>
            <Button
              variant="secondary"
              className="mt-6"
              onClick={() => inputRef.current?.click()}
            >
              Choose file
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.csv,.tsv,.txt,text/csv,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void handleFile(file)
              }}
            />
          </div>

          {error && (
            <p className="mt-5 border-l-2 border-danger bg-danger/[0.06] px-4 py-3 text-[13px] leading-relaxed text-pearl">
              {error}
            </p>
          )}
        </>
      ) : null}

      {stage === 'parsed' && result && (
        <Preview
          filename={filename}
          result={result}
          onConfirm={() => void confirmImport()}
          onCancel={reset}
        />
      )}

      {stage === 'importing' && (
        <Panel className="flex items-center justify-center py-20">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-pearl-faint">
            Importing {result?.imported} contacts…
          </span>
        </Panel>
      )}

      {stage === 'done' && result && (
        <Panel className="p-10">
          <EmptyState
            title={`${result.imported} contacts imported`}
            description={`${filename} is now in the queue. Agents will start receiving these numbers immediately.`}
            action={<Button onClick={reset}>Upload another file</Button>}
          />
        </Panel>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */

function Preview({
  filename,
  result,
  onConfirm,
  onCancel,
}: {
  filename: string
  result: ImportResult
  onConfirm: () => void
  onCancel: () => void
}) {
  const nothingToImport = result.imported === 0

  return (
    <Panel className="overflow-hidden">
      <div className="hairline" />

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-pearl/10 px-6 py-5">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-pearl-faint">
            Ready to import
          </p>
          <p className="mt-1.5 text-[15px] text-pearl">{filename}</p>
        </div>
        <div className="flex gap-2.5">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={nothingToImport}>
            Import {result.imported} contacts
          </Button>
        </div>
      </div>

      <dl className="grid grid-cols-2 divide-pearl/10 md:grid-cols-4 md:divide-x">
        <Stat label="Rows in file" value={result.totalRows} />
        <Stat label="Will import" value={result.imported} tone="ok" />
        <Stat
          label="Duplicates skipped"
          value={result.skippedDuplicates}
          tone={result.skippedDuplicates > 0 ? 'warn' : 'neutral'}
        />
        <Stat
          label="Rejected"
          value={result.rejected}
          tone={result.rejected > 0 ? 'danger' : 'neutral'}
        />
      </dl>

      {nothingToImport && (
        <p className="border-t border-pearl/10 px-6 py-5 text-[13.5px] leading-relaxed text-warn">
          Nothing in this file can be imported. Every row was either a
          duplicate or missing a usable phone number — check that the file has
          a header row and that the phone column is not formatted as a number,
          which strips the leading zero.
        </p>
      )}

      {result.contacts.length > 0 && (
        <div className="border-t border-pearl/10">
          <p className="px-6 pb-3 pt-5 font-mono text-[10px] uppercase tracking-[0.18em] text-pearl-faint">
            First rows, as they will be stored
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-[13px]">
              <thead>
                <tr className="border-y border-pearl/10 text-pearl-faint">
                  <Th>Name</Th>
                  <Th>Phone</Th>
                  <Th>Town</Th>
                  <Th>Postcode</Th>
                  <Th>Extra columns kept</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pearl/8">
                {result.contacts.slice(0, 5).map((c, i) => (
                  <tr key={i} className="text-pearl-dim">
                    <Td>
                      {[c.title, c.firstName, c.lastName].filter(Boolean).join(' ')}
                    </Td>
                    <Td className="font-mono">{c.phone}</Td>
                    <Td>{c.city ?? '—'}</Td>
                    <Td>{c.postcode ?? '—'}</Td>
                    <Td className="text-pearl-faint">
                      {Object.keys(c.extra).length > 0
                        ? Object.keys(c.extra).join(', ')
                        : '—'}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {result.issues.length > 0 && (
        <details className="border-t border-pearl/10 px-6 py-5">
          <summary className="cursor-pointer text-[13px] text-pearl-dim hover:text-pearl">
            {result.issues.length} row
            {result.issues.length === 1 ? '' : 's'} could not be imported
          </summary>
          <ul className="mt-4 space-y-2">
            {result.issues.slice(0, 25).map((issue) => (
              <li key={issue.row} className="flex gap-3 text-[12.5px]">
                <span className="shrink-0 font-mono text-pearl-faint">
                  Row {issue.row}
                </span>
                <span className="text-danger">{issue.reason}</span>
                <span className="truncate text-pearl-faint">{issue.raw}</span>
              </li>
            ))}
            {result.issues.length > 25 && (
              <li className="text-[12.5px] text-pearl-faint">
                …and {result.issues.length - 25} more
              </li>
            )}
          </ul>
        </details>
      )}
    </Panel>
  )
}

function Stat({
  label,
  value,
  tone = 'neutral',
}: {
  label: string
  value: number
  tone?: 'neutral' | 'ok' | 'warn' | 'danger'
}) {
  const color = {
    neutral: 'text-pearl',
    ok: 'text-ok',
    warn: 'text-warn',
    danger: 'text-danger',
  }[tone]

  return (
    <div className="px-6 py-5">
      <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-pearl-faint">
        {label}
      </dt>
      <dd className={cn('mt-2 text-[1.6rem] leading-none', color)}>{value}</dd>
    </div>
  )
}

const Th = ({ children }: { children: React.ReactNode }) => (
  <th className="px-6 py-2.5 font-mono text-[9.5px] font-normal uppercase tracking-[0.16em]">
    {children}
  </th>
)

const Td = ({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) => <td className={cn('px-6 py-3', className)}>{children}</td>

export { Badge }
