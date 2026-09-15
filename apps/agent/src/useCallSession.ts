import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  answer as advance,
  capturedFields,
  hhcroScript,
  isComplete,
  scoreCall,
  startCall,
  type Disposition,
  type ScriptState,
  type Contact,
  type Lead,
} from '@teleforce/core'
import { newId, nowIso } from './data/repository'
import type { Repository } from './data/repository'

/**
 * A single call from dial to disposition.
 *
 * Owns the script state, the elapsed timer and the writes that close the call
 * out. Keeping this in one hook means the UI components stay presentational
 * and the whole lifecycle can be reasoned about in one place.
 */

const CAMPAIGN_ID = 'hhcro'

export interface CallSession {
  contact: Contact | null
  script: ScriptState | null
  elapsed: string
  loading: boolean
  rebuttalsUsed: string[]
  notes: string
  setNotes: (v: string) => void
  answer: (input: { optionId?: string; value?: string }) => void
  useRebuttal: (id: string) => void
  close: (disposition: Disposition, callbackAt?: string) => Promise<void>
  loadNext: () => Promise<void>
  outcomeSummary: ReturnType<typeof scoreCall> | null
}

export function useCallSession(
  repo: Repository,
  agentId: string,
): CallSession {
  const [contact, setContact] = useState<Contact | null>(null)
  const [script, setScript] = useState<ScriptState | null>(null)
  const [callId, setCallId] = useState<string | null>(null)
  const [rebuttalsUsed, setRebuttalsUsed] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [tick, setTick] = useState(0)
  const closing = useRef(false)
  const loadingNext = useRef(false)

  /* Elapsed timer — one interval for the whole session. */
  useEffect(() => {
    if (startedAt === null) return
    const id = window.setInterval(() => setTick((t) => t + 1), 1000)
    return () => window.clearInterval(id)
  }, [startedAt])

  const elapsed = useMemo(() => {
    if (startedAt === null) return '00:00'
    void tick
    const s = Math.max(0, Math.floor((Date.now() - startedAt) / 1000))
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  }, [startedAt, tick])

  const loadNext = useCallback(async () => {
    // Guard against overlapping invocations. React StrictMode double-invokes
    // effects in development, and a slow repository could let a second call
    // start before the first finishes — either would create an orphan call
    // record and, worse, claim two contacts for one agent.
    if (loadingNext.current) return
    loadingNext.current = true

    setLoading(true)
    setScript(null)
    setCallId(null)
    setRebuttalsUsed([])
    setNotes('')

    const next = await repo.nextAvailableContact(CAMPAIGN_ID, agentId)
    setContact(next)

    if (next) {
      const state = startCall(hhcroScript)
      setScript(state)
      const started = Date.now()
      setStartedAt(started)

      const id = await repo.createCall({
        campaignId: CAMPAIGN_ID,
        contactId: next.id,
        agentId,
        scriptId: hhcroScript.id,
        scriptVersion: hhcroScript.version,
        startedAt: new Date(started).toISOString(),
        answers: [],
        checkpointsReached: [],
        rebuttalsUsed: [],
      })
      setCallId(id)
      await repo.updateContact(next.id, { status: 'in_call' })
    } else {
      setStartedAt(null)
    }

    setLoading(false)
    loadingNext.current = false
  }, [repo, agentId])

  useEffect(() => {
    void loadNext()
  }, [loadNext])

  const answer = useCallback(
    (input: { optionId?: string; value?: string }) => {
      setScript((prev) => {
        if (!prev || isComplete(prev)) return prev
        try {
          return advance(hhcroScript, prev, input)
        } catch {
          // An invalid transition should never reach here — the UI only
          // offers valid options — but a thrown error mid-call would lose
          // the whole session, so hold position instead.
          return prev
        }
      })
    },
    [],
  )

  const useRebuttal = useCallback((id: string) => {
    setRebuttalsUsed((prev) => (prev.includes(id) ? prev : [...prev, id]))
  }, [])

  /* Persist script progress so a refresh does not lose the call. */
  useEffect(() => {
    if (!callId || !script) return
    void repo.updateCall(callId, {
      answers: script.answers,
      checkpointsReached: script.checkpointsReached,
      rebuttalsUsed,
    })
  }, [callId, script, rebuttalsUsed, repo])

  const outcomeSummary = useMemo(
    () => (script && isComplete(script) ? scoreCall(script) : null),
    [script],
  )

  const close = useCallback(
    async (disposition: Disposition, callbackAt?: string) => {
      if (!contact || !callId || closing.current) return
      closing.current = true

      try {
        const endedAt = Date.now()
        const compliance = script ? scoreCall(script) : null

        await repo.updateCall(callId, {
          endedAt: new Date(endedAt).toISOString(),
          durationSeconds: startedAt
            ? Math.round((endedAt - startedAt) / 1000)
            : 0,
          disposition,
          ...(notes ? { notes } : {}),
        })

        // A qualified call becomes a lead. Everything the surveyor needs is
        // denormalised onto it so the export stands alone.
        if (disposition === 'qualified' && script && compliance) {
          const fields = capturedFields(hhcroScript, script)
          const lead: Omit<Lead, 'id'> = {
            campaignId: CAMPAIGN_ID,
            contactId: contact.id,
            callId,
            agentId,
            firstName: contact.firstName,
            lastName: contact.lastName,
            phone: contact.phone,
            ...(fields.alternativeNumber
              ? { alternativePhone: fields.alternativeNumber }
              : contact.alternativePhone
                ? { alternativePhone: contact.alternativePhone }
                : {}),
            ...(contact.addressLine1 ? { addressLine1: contact.addressLine1 } : {}),
            ...(contact.city ? { city: contact.city } : {}),
            ...(contact.postcode ? { postcode: contact.postcode } : {}),
            leadType: script.leadType,
            eligibilityPath: script.groupsSatisfied,
            ...(fields.password ? { password: fields.password } : {}),
            ...(fields.bestTimeToCall
              ? { bestTimeToCall: fields.bestTimeToCall }
              : {}),
            status: compliance.billable ? 'qa_pending' : 'qa_failed',
            complianceScore: compliance.score,
            billable: compliance.billable,
            ...(notes ? { notes } : {}),
          }
          const leadId = await repo.createLead(lead)
          await repo.updateCall(callId, { leadId })
        }

        await repo.updateContact(contact.id, {
          status:
            disposition === 'callback'
              ? 'callback'
              : disposition === 'do_not_call'
                ? 'dnc'
                : disposition === 'wrong_number'
                  ? 'invalid'
                  : 'completed',
          attempts: contact.attempts + 1,
          lastAttemptAt: nowIso(),
          ...(callbackAt ? { callbackAt } : {}),
          ...(notes ? { notes } : {}),
          assignedTo: undefined,
        })

        await loadNext()
      } finally {
        closing.current = false
      }
    },
    [contact, callId, script, notes, startedAt, agentId, repo, loadNext],
  )

  return {
    contact,
    script,
    elapsed,
    loading,
    rebuttalsUsed,
    notes,
    setNotes,
    answer,
    useRebuttal,
    close,
    loadNext,
    outcomeSummary,
  }
}

export { CAMPAIGN_ID, newId }
