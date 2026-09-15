import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  hhcroScript,
  validateScript,
  type CallScript,
  type QuestionNode,
  type ScriptNode,
} from '@teleforce/core'
import type { SupabaseScripts, StoredScript } from '@teleforce/data'
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Panel,
  cn,
  inputClass,
} from '@teleforce/ui'

/**
 * Question and script editor.
 *
 * Edits a draft, validates it, then publishes. A draft is never served to a
 * live call, and publishing is refused while the script has structural
 * problems — a broken flow reaching an agent mid-call is the worst outcome
 * this screen can produce.
 */

const CAMPAIGN_ID = 'hhcro'

export function Questions({ scripts }: { scripts: SupabaseScripts | null }) {
  const [stored, setStored] = useState<StoredScript[] | null>(null)
  const [draft, setDraft] = useState<CallScript | null>(null)
  const [draftId, setDraftId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    if (!scripts) return
    try {
      const list = await scripts.list(CAMPAIGN_ID)
      setStored(list)

      const editable = list.find((s) => !s.published) ?? list[0]
      if (editable) {
        setDraftId(editable.id)
        setDraft({
          id: editable.id,
          name: editable.name,
          version: editable.version,
          entry: editable.entry,
          nodes: editable.nodes as CallScript['nodes'],
        })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load scripts.')
      setStored([])
    }
  }, [scripts])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const problems = useMemo(
    () => (draft ? validateScript(draft) : []),
    [draft],
  )

  const nodes = useMemo(
    () => (draft ? Object.values(draft.nodes) : []),
    [draft],
  )

  const selected = selectedId && draft ? draft.nodes[selectedId] : undefined

  /* ---------------- actions ---------------- */

  const importBundled = async () => {
    if (!scripts) return
    setBusy(true)
    setError(null)
    try {
      const id = await scripts.save({
        campaignId: CAMPAIGN_ID,
        name: hhcroScript.name,
        entry: hhcroScript.entry,
        nodes: hhcroScript.nodes as unknown as Record<string, unknown>,
      })
      setStatus(`Imported ${Object.keys(hhcroScript.nodes).length} nodes as a draft.`)
      setDraftId(id)
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed.')
    }
    setBusy(false)
  }

  const save = async () => {
    if (!scripts || !draft || !draftId) return
    setBusy(true)
    setError(null)
    try {
      await scripts.save({
        id: draftId,
        campaignId: CAMPAIGN_ID,
        name: draft.name,
        entry: draft.entry,
        nodes: draft.nodes as unknown as Record<string, unknown>,
      })
      setStatus('Draft saved. Agents are still on the published version.')
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed.')
    }
    setBusy(false)
  }

  const publish = async () => {
    if (!scripts || !draftId || problems.length > 0) return
    setBusy(true)
    setError(null)
    try {
      await scripts.save({
        id: draftId,
        campaignId: CAMPAIGN_ID,
        name: draft!.name,
        entry: draft!.entry,
        nodes: draft!.nodes as unknown as Record<string, unknown>,
      })
      await scripts.publish(draftId)
      setStatus('Published. Agents pick this up on their next call.')
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Publish failed.')
    }
    setBusy(false)
  }

  const patchNode = (id: string, patch: Partial<ScriptNode>) => {
    setDraft((d) =>
      d
        ? {
            ...d,
            nodes: {
              ...d.nodes,
              [id]: { ...d.nodes[id], ...patch } as ScriptNode,
            },
          }
        : d,
    )
    setStatus(null)
  }

  /* ---------------- render ---------------- */

  if (!scripts) {
    return (
      <Panel className="p-10">
        <EmptyState
          title="Script editing needs Supabase"
          description="This app is on browser-local storage. Configure Supabase to edit and publish scripts."
        />
      </Panel>
    )
  }

  if (stored === null) {
    return (
      <p className="py-16 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-pearl-faint">
        Loading…
      </p>
    )
  }

  if (stored.length === 0) {
    return (
      <Panel className="p-10">
        <EmptyState
          title="No script in the database yet"
          description="The HHCRO flow currently ships inside the agent bundle. Import it here to make it editable — agents keep using the bundled version until you publish."
          action={
            <Button onClick={() => void importBundled()} disabled={busy}>
              {busy ? 'Importing…' : 'Import the HHCRO script'}
            </Button>
          }
        />
        {error && (
          <p className="mt-5 border-l-2 border-danger bg-danger/[0.06] px-4 py-3 text-[13px] text-pearl">
            {error}
          </p>
        )}
      </Panel>
    )
  }

  const publishedVersion = stored.find((s) => s.published)

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[1.9rem] leading-tight text-pearl">
            Questions &amp; script
          </h1>
          <p className="mt-2.5 max-w-xl text-[14px] leading-[1.7] text-pearl-dim">
            What agents see, one question at a time. Edits are a draft until
            you publish.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {publishedVersion ? (
            <Badge tone="ok">Live: v{publishedVersion.version}</Badge>
          ) : (
            <Badge tone="warn">Nothing published</Badge>
          )}
          <Button variant="secondary" onClick={() => void save()} disabled={busy}>
            Save draft
          </Button>
          <Button
            onClick={() => void publish()}
            disabled={busy || problems.length > 0}
            title={
              problems.length > 0
                ? 'Fix the problems below before publishing'
                : undefined
            }
          >
            Publish to agents
          </Button>
        </div>
      </header>

      {problems.length > 0 && (
        <Panel className="mb-5 border-danger/40 p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-danger">
            {problems.length} problem{problems.length === 1 ? '' : 's'} — publishing is blocked
          </p>
          <ul className="mt-3 space-y-1.5">
            {problems.slice(0, 10).map((p) => (
              <li key={p} className="text-[13px] text-pearl-dim">
                {p}
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {status && (
        <p className="mb-5 border-l-2 border-ok bg-ok/[0.06] px-4 py-3 text-[13px] text-pearl">
          {status}
        </p>
      )}
      {error && (
        <p className="mb-5 border-l-2 border-danger bg-danger/[0.06] px-4 py-3 text-[13px] text-pearl">
          {error}
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.15fr)]">
        {/* Node list */}
        <Panel className="max-h-[70vh] overflow-y-auto">
          <p className="border-b border-pearl/10 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-pearl-faint">
            {nodes.length} steps
          </p>
          <ul className="divide-y divide-pearl/8">
            {nodes.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(n.id)}
                  className={cn(
                    'w-full px-5 py-3 text-left transition-colors',
                    selectedId === n.id
                      ? 'bg-gold/[0.08]'
                      : 'hover:bg-pearl/[0.03]',
                  )}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span
                      className={cn(
                        'truncate text-[13px]',
                        selectedId === n.id ? 'text-gold' : 'text-pearl',
                      )}
                    >
                      {'label' in n ? n.label : n.section}
                    </span>
                    <Badge tone={toneFor(n.kind)}>{n.kind}</Badge>
                  </span>
                  <span className="mt-1 block truncate font-mono text-[10.5px] text-pearl-faint">
                    {n.id}
                    {n.checkpoint && ' · must say'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        {/* Editor */}
        <Panel className="max-h-[70vh] overflow-y-auto p-6">
          {!selected ? (
            <EmptyState
              title="Select a step"
              description="Pick a question or statement on the left to edit the wording agents read."
            />
          ) : (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <Badge tone={toneFor(selected.kind)}>{selected.kind}</Badge>
                {selected.checkpoint && (
                  <Badge tone="gold">Compliance checkpoint</Badge>
                )}
                <span className="font-mono text-[10.5px] text-pearl-faint">
                  {selected.id}
                </span>
              </div>

              <Field label="Section">
                <input
                  value={selected.section}
                  onChange={(e) =>
                    patchNode(selected.id, { section: e.target.value })
                  }
                  className={inputClass}
                />
              </Field>

              {'label' in selected && (
                <Field
                  label="Short label"
                  hint="Used in reports and QA, never read aloud."
                >
                  <input
                    value={selected.label}
                    onChange={(e) =>
                      patchNode(selected.id, {
                        label: e.target.value,
                      } as Partial<ScriptNode>)
                    }
                    className={inputClass}
                  />
                </Field>
              )}

              <Field
                label="What the agent says"
                hint={
                  selected.checkpoint
                    ? 'This is a mandatory statement. Changing the wording can make a lead unbillable.'
                    : undefined
                }
              >
                <textarea
                  value={selected.say}
                  onChange={(e) =>
                    patchNode(selected.id, { say: e.target.value })
                  }
                  rows={5}
                  className={cn(inputClass, 'resize-y leading-relaxed')}
                />
              </Field>

              <Field
                label="Agent note"
                hint="Guidance shown on screen but never read to the customer."
              >
                <textarea
                  value={selected.note ?? ''}
                  onChange={(e) =>
                    patchNode(selected.id, { note: e.target.value })
                  }
                  rows={2}
                  className={cn(inputClass, 'resize-y')}
                />
              </Field>

              {selected.kind === 'question' && (
                <AnswerEditor
                  node={selected}
                  allIds={nodes.map((n) => n.id)}
                  onChange={(options) =>
                    patchNode(selected.id, { options } as Partial<ScriptNode>)
                  }
                />
              )}
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */

function AnswerEditor({
  node,
  allIds,
  onChange,
}: {
  node: QuestionNode
  allIds: string[]
  onChange: (options: QuestionNode['options']) => void
}) {
  const update = (index: number, patch: Partial<QuestionNode['options'][0]>) => {
    onChange(node.options.map((o, i) => (i === index ? { ...o, ...patch } : o)))
  }

  return (
    <div className="border-t border-pearl/10 pt-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-pearl-faint">
        Answers and where each one goes
      </p>

      <div className="mt-4 space-y-3">
        {node.options.map((o, i) => (
          <div
            key={o.id}
            className="grid gap-2.5 border border-pearl/10 p-3.5 sm:grid-cols-[1fr_1fr]"
          >
            <label className="block">
              <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-pearl-faint">
                Button {i + 1}
              </span>
              <input
                value={o.label}
                onChange={(e) => update(i, { label: e.target.value })}
                className={cn(inputClass, 'mt-1.5 py-2 text-[13px]')}
              />
            </label>

            <label className="block">
              <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-pearl-faint">
                Goes to
              </span>
              <select
                value={o.next ?? '__end'}
                onChange={(e) =>
                  update(i, {
                    next: e.target.value === '__end' ? null : e.target.value,
                  })
                }
                className={cn(inputClass, 'mt-1.5 py-2 text-[13px]')}
              >
                <option value="__end" className="bg-navy">
                  End the call
                </option>
                {allIds.map((id) => (
                  <option key={id} value={id} className="bg-navy">
                    {id}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ))}
      </div>

      <p className="mt-4 text-[12px] leading-relaxed text-pearl-faint">
        Every answer must lead somewhere. Publishing is blocked while any
        answer points at a step that does not exist.
      </p>
    </div>
  )
}

function toneFor(kind: ScriptNode['kind']) {
  switch (kind) {
    case 'question':
      return 'info' as const
    case 'termination':
      return 'danger' as const
    case 'capture':
      return 'gold' as const
    default:
      return 'neutral' as const
  }
}
