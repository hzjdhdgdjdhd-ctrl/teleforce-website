import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ContentVersion, SiteSection, SupabaseCms } from '@teleforce/data'
import {
  Badge,
  Button,
  EmptyState,
  Panel,
  cn,
  inputClass,
} from '@teleforce/ui'

/**
 * Website content editor.
 *
 * Edits produce a new version rather than overwriting the live one, so
 * publishing is a deliberate act and rolling back is always possible. The
 * live site keeps its shipped copy for anything left blank, which is why
 * every field here is optional rather than required.
 */

interface FieldSpec {
  key: string
  label: string
  hint?: string
  kind: 'text' | 'multiline' | 'lines'
}

const SECTIONS: Array<{
  id: SiteSection
  label: string
  blurb: string
  fields: FieldSpec[]
}> = [
  {
    id: 'hero',
    label: 'Hero',
    blurb: 'The first thing a visitor reads.',
    fields: [
      { key: 'eyebrow', label: 'Eyebrow', kind: 'text' },
      {
        key: 'headlineLines',
        label: 'Headline',
        hint: 'One line per row. The last line is shown in gold.',
        kind: 'lines',
      },
      { key: 'lede', label: 'Opening paragraph', kind: 'multiline' },
      { key: 'primaryCta', label: 'Primary button', kind: 'text' },
      { key: 'secondaryCta', label: 'Secondary button', kind: 'text' },
    ],
  },
  {
    id: 'services',
    label: 'Services',
    blurb: 'The section heading above the service cards.',
    fields: [
      { key: 'eyebrow', label: 'Eyebrow', kind: 'text' },
      { key: 'heading', label: 'Heading', kind: 'text' },
      { key: 'lede', label: 'Intro paragraph', kind: 'multiline' },
    ],
  },
  {
    id: 'about',
    label: 'About',
    blurb: 'Who the company is.',
    fields: [
      { key: 'heading', label: 'Heading', kind: 'text' },
      { key: 'body', label: 'Paragraphs', hint: 'One paragraph per row.', kind: 'lines' },
    ],
  },
  {
    id: 'contact',
    label: 'Contact',
    blurb: 'How people reach you. Leave the email blank to show the form instead.',
    fields: [
      { key: 'heading', label: 'Heading', kind: 'text' },
      { key: 'lede', label: 'Intro paragraph', kind: 'multiline' },
      {
        key: 'publicEmail',
        label: 'Public email',
        hint: 'Only set this once a monitored mailbox exists — a published address that bounces is worse than none.',
        kind: 'text',
      },
      { key: 'phone', label: 'Published phone', kind: 'text' },
    ],
  },
  {
    id: 'footer',
    label: 'Footer',
    blurb: 'The closing block on every page.',
    fields: [
      { key: 'blurb', label: 'Description', kind: 'multiline' },
      { key: 'disclosure', label: 'Disclosure line', kind: 'multiline' },
    ],
  },
  {
    id: 'seo',
    label: 'SEO',
    blurb: 'Titles and descriptions for search and link previews.',
    fields: [
      { key: 'title', label: 'Page title', kind: 'text' },
      { key: 'description', label: 'Meta description', kind: 'multiline' },
      { key: 'ogTitle', label: 'Share title', kind: 'text' },
      { key: 'ogDescription', label: 'Share description', kind: 'multiline' },
    ],
  },
]

export function Cms({ cms }: { cms: SupabaseCms | null }) {
  const [section, setSection] = useState<SiteSection>('hero')
  const [versions, setVersions] = useState<ContentVersion[] | null>(null)
  const [draft, setDraft] = useState<Record<string, unknown>>({})
  const [note, setNote] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const spec = useMemo(() => SECTIONS.find((s) => s.id === section)!, [section])

  const load = useCallback(async () => {
    if (!cms) {
      setVersions([])
      return
    }
    try {
      const list = await cms.versions(section)
      setVersions(list)
      const live = list.find((v) => v.published) ?? list[0]
      setDraft(live?.content ?? {})
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load content.')
      setVersions([])
    }
  }, [cms, section])

  useEffect(() => {
    setStatus(null)
    setNote('')
    void load()
  }, [load])

  const setField = (key: string, value: unknown) => {
    setDraft((d) => ({ ...d, [key]: value }))
    setStatus(null)
  }

  const saveDraft = async () => {
    if (!cms) return
    setBusy(true)
    try {
      await cms.saveDraft(section, draft, note || undefined)
      setStatus('Draft saved. The live site is unchanged until you publish.')
      setNote('')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save.')
    }
    setBusy(false)
  }

  const publishDraft = async () => {
    if (!cms) return
    setBusy(true)
    try {
      const id = await cms.saveDraft(section, draft, note || undefined)
      await cms.publish(id)
      setStatus('Published. The website updates on the next page load.')
      setNote('')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not publish.')
    }
    setBusy(false)
  }

  if (!cms) {
    return (
      <Panel className="p-10">
        <EmptyState
          title="Content editing needs Supabase"
          description="This app is on browser-local storage. Configure Supabase to edit the website."
        />
      </Panel>
    )
  }

  const published = versions?.find((v) => v.published)

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-[1.9rem] leading-tight text-pearl">Website content</h1>
        <p className="mt-2.5 max-w-2xl text-[14px] leading-[1.7] text-pearl-dim">
          Anything left blank keeps the copy the site ships with, so an empty
          field is never an empty page.
        </p>
      </header>

      {/* Section tabs */}
      <div className="mb-5 flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSection(s.id)}
            className={cn(
              'border px-3.5 py-1.5 text-[12.5px] transition-colors',
              section === s.id
                ? 'border-gold/60 bg-gold/[0.08] text-gold'
                : 'border-pearl/12 text-pearl-dim hover:border-pearl/25 hover:text-pearl',
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

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

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
        {/* Editor */}
        <Panel className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-[17px] text-pearl">{spec.label}</h2>
              <p className="mt-1 text-[12.5px] text-pearl-faint">{spec.blurb}</p>
            </div>
            {published ? (
              <Badge tone="ok">Live: v{published.version}</Badge>
            ) : (
              <Badge tone="neutral">Using shipped copy</Badge>
            )}
          </div>

          <div className="mt-6 space-y-5">
            {spec.fields.map((f) => (
              <label key={f.key} className="block">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-pearl-faint">
                  {f.label}
                </span>

                {f.kind === 'lines' ? (
                  <textarea
                    value={
                      Array.isArray(draft[f.key])
                        ? (draft[f.key] as string[]).join('\n')
                        : ''
                    }
                    onChange={(e) =>
                      setField(
                        f.key,
                        e.target.value.split('\n').filter((l) => l.trim() !== ''),
                      )
                    }
                    rows={4}
                    className={cn(inputClass, 'mt-2 resize-y')}
                  />
                ) : f.kind === 'multiline' ? (
                  <textarea
                    value={(draft[f.key] as string) ?? ''}
                    onChange={(e) => setField(f.key, e.target.value)}
                    rows={3}
                    className={cn(inputClass, 'mt-2 resize-y')}
                  />
                ) : (
                  <input
                    value={(draft[f.key] as string) ?? ''}
                    onChange={(e) => setField(f.key, e.target.value)}
                    className={cn(inputClass, 'mt-2')}
                  />
                )}

                {f.hint && (
                  <span className="mt-1.5 block text-[11.5px] leading-relaxed text-pearl-faint">
                    {f.hint}
                  </span>
                )}
              </label>
            ))}
          </div>

          <div className="mt-7 border-t border-pearl/10 pt-5">
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-pearl-faint">
                Change note — shown in the version history
              </span>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Why this changed"
                className={cn(inputClass, 'mt-2')}
              />
            </label>

            <div className="mt-5 flex flex-wrap gap-2.5">
              <Button variant="secondary" onClick={() => void saveDraft()} disabled={busy}>
                Save draft
              </Button>
              <Button onClick={() => void publishDraft()} disabled={busy}>
                Publish to the website
              </Button>
              <a
                href="https://teleforcetechnology.org"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1.5 text-[12.5px] text-pearl-dim underline-offset-4 hover:text-gold hover:underline"
              >
                Open the live site
              </a>
            </div>
          </div>
        </Panel>

        {/* History */}
        <Panel className="max-h-[70vh] overflow-y-auto">
          <p className="border-b border-pearl/10 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-pearl-faint">
            Version history
          </p>

          {versions === null ? (
            <p className="px-5 py-8 text-center font-mono text-[10.5px] uppercase tracking-[0.18em] text-pearl-faint">
              Loading…
            </p>
          ) : versions.length === 0 ? (
            <p className="px-5 py-8 text-[13px] leading-relaxed text-pearl-faint">
              Nothing published yet. The site is showing its shipped copy.
            </p>
          ) : (
            <ul className="divide-y divide-pearl/8">
              {versions.map((v) => (
                <li key={v.id} className="px-5 py-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-[12px] text-pearl">
                      v{v.version}
                    </span>
                    {v.published ? (
                      <Badge tone="ok">live</Badge>
                    ) : (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={async () => {
                          setBusy(true)
                          try {
                            await cms.rollback(v.id)
                            setStatus(`Restored version ${v.version} and published it.`)
                            await load()
                          } catch (e) {
                            setError(
                              e instanceof Error ? e.message : 'Could not roll back.',
                            )
                          }
                          setBusy(false)
                        }}
                        className="font-mono text-[10px] uppercase tracking-[0.14em] text-pearl-faint underline-offset-4 hover:text-gold hover:underline"
                      >
                        Restore
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-pearl-faint">
                    {new Date(v.updatedAt).toLocaleString('en-GB')}
                    {v.note && ` · ${v.note}`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  )
}
