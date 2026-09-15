import type { ScriptState } from '../script/types'
import {
  mandatoryCheckpoints,
  prohibitedStatements,
  type ProhibitedStatement,
  type Severity,
} from './rules'

/**
 * Compliance scoring for a completed call.
 *
 * Two independent inputs:
 *   1. Checkpoints the agent actually reached in the script (structural, exact).
 *   2. Optional transcript text, scanned for prohibited claims (advisory).
 *
 * Transcript hits are never allowed to auto-fail a lead on their own — ASR is
 * lossy and phrases carry context. They raise the call for human review.
 */

export interface CheckpointResult {
  key: string
  title: string
  met: boolean
  severity: Severity
  requirement: string
}

export interface ProhibitedHit {
  id: string
  claim: string
  reason: string
  insteadSay?: string
  severity: Severity
  /** The phrase that matched, with a little surrounding context. */
  excerpt: string
}

export interface ComplianceResult {
  /** 0–100, weighted by severity. Structural checkpoints only. */
  score: number
  /**
   * Whether the lead may be presented as billable.
   * False if any critical checkpoint was missed, or the call did not qualify.
   */
  billable: boolean
  /** True when a transcript hit needs a human to look at the call. */
  requiresReview: boolean
  checkpoints: CheckpointResult[]
  missedCritical: CheckpointResult[]
  prohibitedHits: ProhibitedHit[]
  /** Plain-English summary for the QA queue. */
  summary: string
}

const WEIGHT: Record<Severity, number> = {
  critical: 10,
  major: 4,
  minor: 1,
}

export interface ScoreOptions {
  /** Raw transcript, if one is available. */
  transcript?: string
}

export function scoreCall(
  state: ScriptState,
  options: ScoreOptions = {},
): ComplianceResult {
  const reached = new Set(state.checkpointsReached)

  const checkpoints: CheckpointResult[] = mandatoryCheckpoints.map((c) => ({
    key: c.key,
    title: c.title,
    requirement: c.requirement,
    severity: c.severity,
    met: reached.has(c.key),
  }))

  const totalWeight = checkpoints.reduce((n, c) => n + WEIGHT[c.severity], 0)
  const earned = checkpoints.reduce(
    (n, c) => n + (c.met ? WEIGHT[c.severity] : 0),
    0,
  )
  const score = totalWeight === 0 ? 100 : Math.round((earned / totalWeight) * 100)

  const missedCritical = checkpoints.filter(
    (c) => c.severity === 'critical' && !c.met,
  )

  const prohibitedHits = options.transcript
    ? scanTranscript(options.transcript)
    : []

  // Only a qualified call can be billable at all; on top of that, every
  // critical checkpoint must have been reached.
  const qualified = state.outcome === 'qualified'
  const billable = qualified && missedCritical.length === 0

  return {
    score,
    billable,
    requiresReview: prohibitedHits.length > 0,
    checkpoints,
    missedCritical,
    prohibitedHits,
    summary: summarise(state, billable, missedCritical, prohibitedHits),
  }
}

/* ------------------------------------------------------------------ */

/**
 * Scan a transcript for prohibited claims.
 *
 * Deliberately simple substring matching on a normalised string: an agent
 * reading from a script produces predictable wording, and a transparent rule
 * a QA lead can read and argue with beats an opaque classifier here.
 */
export function scanTranscript(transcript: string): ProhibitedHit[] {
  const haystack = normalise(transcript)
  const hits: ProhibitedHit[] = []

  for (const rule of prohibitedStatements) {
    for (const phrase of rule.detect) {
      const idx = haystack.indexOf(phrase)
      if (idx === -1) continue
      hits.push(toHit(rule, haystack, idx, phrase.length))
      break // one hit per rule is enough to flag it
    }
  }

  return hits
}

function toHit(
  rule: ProhibitedStatement,
  haystack: string,
  idx: number,
  len: number,
): ProhibitedHit {
  const from = Math.max(0, idx - 45)
  const to = Math.min(haystack.length, idx + len + 45)
  const excerpt =
    (from > 0 ? '…' : '') +
    haystack.slice(from, to).trim() +
    (to < haystack.length ? '…' : '')

  return {
    id: rule.id,
    claim: rule.claim,
    reason: rule.reason,
    ...(rule.insteadSay ? { insteadSay: rule.insteadSay } : {}),
    severity: rule.severity,
    excerpt,
  }
}

function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

function summarise(
  state: ScriptState,
  billable: boolean,
  missedCritical: CheckpointResult[],
  hits: ProhibitedHit[],
): string {
  const parts: string[] = []

  if (state.outcome !== 'qualified') {
    parts.push(`Call ended as ${state.outcome.replace(/_/g, ' ')}.`)
  } else if (billable) {
    parts.push('Qualified and compliant — presentable as a billable lead.')
  } else {
    parts.push('Qualified but NOT billable.')
  }

  if (missedCritical.length > 0) {
    parts.push(
      `Missing mandatory: ${missedCritical.map((c) => c.title).join(', ')}.`,
    )
  }

  if (hits.length > 0) {
    parts.push(
      `${hits.length} prohibited statement${hits.length === 1 ? '' : 's'} flagged for review.`,
    )
  }

  return parts.join(' ')
}
