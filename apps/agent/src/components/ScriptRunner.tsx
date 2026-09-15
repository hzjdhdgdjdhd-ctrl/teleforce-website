import { useEffect, useMemo, useRef, useState } from 'react'
import {
  currentNode,
  isComplete,
  type CallScript,
  type ScriptState,
} from '@teleforce/core'
import { Badge, Button, Kbd, Panel, cn } from '@teleforce/ui'

/**
 * The script cockpit.
 *
 * One node on screen at a time. The agent never scrolls to find the next
 * question and never searches for a rebuttal — answering advances the flow,
 * and number keys pick options so the whole call can be worked from the
 * keyboard while the agent is writing notes with the other hand.
 */
export function ScriptRunner({
  script,
  state,
  onAnswer,
  customerName,
}: {
  script: CallScript
  state: ScriptState
  onAnswer: (input: { optionId?: string; value?: string }) => void
  customerName: string
}) {
  const node = currentNode(script, state)
  const [captureValue, setCaptureValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const complete = isComplete(state)

  // Clear the capture field and focus it whenever the node changes.
  useEffect(() => {
    setCaptureValue('')
    if (node?.kind === 'capture' && node.inputType !== 'choice') {
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [node?.id, node?.kind])

  const options = node?.kind === 'question' ? node.options : []

  // Number keys 1–9 select options; Enter advances statements.
  useEffect(() => {
    if (!node) return
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement
      const typing =
        el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement
      if (e.metaKey || e.ctrlKey || e.altKey) return

      if (node.kind === 'question' && !typing) {
        const n = Number(e.key)
        if (n >= 1 && n <= options.length) {
          e.preventDefault()
          onAnswer({ optionId: options[n - 1]!.id })
        }
      } else if (node.kind === 'statement' && !typing && e.key === 'Enter') {
        e.preventDefault()
        onAnswer({})
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [node, options, onAnswer])

  const progress = useMemo(() => {
    const total = Object.keys(script.nodes).length
    return Math.min(99, Math.round((state.answers.length / total) * 100))
  }, [state.answers.length, script.nodes])

  if (!node || complete) {
    return (
      <Panel className="flex h-full flex-col items-center justify-center p-10 text-center">
        <Badge tone={state.outcome === 'qualified' ? 'ok' : 'warn'}>
          {state.outcome.replace(/_/g, ' ')}
        </Badge>
        <h2 className="mt-5 text-2xl text-pearl">Script complete</h2>
        <p className="mt-2.5 max-w-sm text-[14px] leading-relaxed text-pearl-dim">
          {state.outcome === 'qualified'
            ? 'All qualification gates passed. Review the summary and submit the lead.'
            : 'The caller did not qualify on this script. Select a disposition to close the call.'}
        </p>
      </Panel>
    )
  }

  return (
    <Panel className="flex flex-col overflow-hidden">
      {/* Progress + section */}
      <div className="border-b border-pearl/10 px-7 py-4">
        <div className="flex items-center justify-between gap-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-gold/80">
            {node.section}
          </span>
          <span className="font-mono text-[10px] text-pearl-faint">
            {state.answers.length} answered
          </span>
        </div>
        <div className="mt-3 h-[2px] w-full bg-pearl/8">
          <div
            className="h-full bg-gradient-to-r from-gold to-gold-300 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* What to say. Not flex-1: stretching this pushed the answers to the
          bottom of a tall screen, leaving the agent's eye to cross a void
          between the question and the buttons. */}
      <div className="overflow-y-auto px-7 pb-6 pt-7">
        {node.checkpoint && (
          <Badge tone="gold" className="mb-5">
            Must say — verbatim
          </Badge>
        )}

        <p className="text-[clamp(1.15rem,2.1vw,1.6rem)] leading-[1.5] text-pearl">
          {personalise(node.say, customerName)}
        </p>

        {node.note && (
          <p className="mt-5 border-l-2 border-exec-300/60 pl-4 text-[13px] leading-relaxed text-pearl-faint">
            {node.note}
          </p>
        )}
      </div>

      {/* Answers, directly beneath the wording that prompts them. */}
      <div className="px-7 pb-7">
        {node.kind === 'question' && (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {options.map((o, i) => (
              <button
                key={o.id}
                type="button"
                onClick={() => onAnswer({ optionId: o.id })}
                className={cn(
                  'group flex items-center justify-between gap-3 border px-4 py-3 text-left',
                  'border-pearl/15 text-[14px] text-pearl transition-all duration-150',
                  'hover:border-gold/60 hover:bg-gold/[0.06] hover:text-gold',
                  'focus-visible:border-gold',
                )}
              >
                <span>{o.label}</span>
                {i < 9 && (
                  <Kbd className="shrink-0 text-pearl-faint group-hover:text-gold">
                    {i + 1}
                  </Kbd>
                )}
              </button>
            ))}
          </div>
        )}

        {node.kind === 'statement' && (
          <Button onClick={() => onAnswer({})} shortcut="↵" fullWidth size="lg">
            Continue
          </Button>
        )}

        {node.kind === 'capture' && node.inputType === 'choice' && (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {(node.choices ?? []).map((choice, i) => (
              <button
                key={choice}
                type="button"
                onClick={() => onAnswer({ value: choice })}
                className="group flex items-center justify-between gap-3 border border-pearl/15 px-4 py-3 text-left text-[14px] text-pearl transition-all duration-150 hover:border-gold/60 hover:bg-gold/[0.06] hover:text-gold"
              >
                <span>{choice}</span>
                <Kbd className="text-pearl-faint group-hover:text-gold">{i + 1}</Kbd>
              </button>
            ))}
          </div>
        )}

        {node.kind === 'capture' && node.inputType !== 'choice' && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (node.required && !captureValue.trim()) return
              onAnswer({ value: captureValue })
            }}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <input
              ref={inputRef}
              type={node.inputType === 'tel' ? 'tel' : 'text'}
              value={captureValue}
              onChange={(e) => setCaptureValue(e.target.value)}
              placeholder={node.required ? 'Required' : 'Optional — ask anyway'}
              className="flex-1 border border-pearl/15 bg-pearl/[0.02] px-4 py-3 text-[15px] text-pearl placeholder:text-pearl-faint focus:border-gold/60 focus:outline-none"
              autoComplete="off"
            />
            <Button
              type="submit"
              disabled={node.required && !captureValue.trim()}
              shortcut="↵"
            >
              {node.required ? 'Save' : captureValue.trim() ? 'Save' : 'Not given'}
            </Button>
          </form>
        )}
      </div>
    </Panel>
  )
}

/**
 * Swap the script's "Mr/Mrs …" placeholders for the actual customer name.
 *
 * The source script is written with blanks for the agent to fill verbally;
 * substituting them removes a reading error on every single call.
 */
export function personalise(say: string, customerName: string): string {
  if (!customerName) return say
  return say
    .replace(/Mr\/Mrs\s*…+/g, customerName)
    .replace(/Mr\/Mrs\s*\.{2,}/g, customerName)
    .replace(/is this Mr\/Mrs\s*\?/g, `is this ${customerName}?`)
    .replace(/Mr\/Mrs/g, customerName)
}
