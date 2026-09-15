import type {
  AnswerRecord,
  CallScript,
  NodeId,
  OptionId,
  Outcome,
  ScriptNode,
  ScriptState,
} from './types'

/**
 * Deterministic call-script runtime.
 *
 * Every transition is a pure function of (state, answer), so a call can be
 * replayed exactly from its stored answers during QA review — no hidden
 * state, no wall-clock dependence beyond the timestamps we record.
 */

export class ScriptError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ScriptError'
  }
}

/** Fresh state positioned at the script's entry node. */
export function startCall(
  script: CallScript,
  now: number = Date.now(),
): ScriptState {
  const entry = script.nodes[script.entry]
  if (!entry) {
    throw new ScriptError(
      `Script "${script.id}" entry node "${script.entry}" does not exist`,
    )
  }

  const state: ScriptState = {
    scriptId: script.id,
    scriptVersion: script.version,
    currentNodeId: script.entry,
    outcome: 'in_progress',
    leadType: 'none',
    answers: [],
    checkpointsReached: [],
    groupsSatisfied: [],
  }

  return recordCheckpoint(state, entry, now)
}

/** The node the agent is currently on, or null once the call has ended. */
export function currentNode(
  script: CallScript,
  state: ScriptState,
): ScriptNode | null {
  if (!state.currentNodeId) return null
  const node = script.nodes[state.currentNodeId]
  if (!node) {
    throw new ScriptError(`Node "${state.currentNodeId}" does not exist`)
  }
  return node
}

/**
 * Answer the current node and advance.
 *
 * For question nodes pass the chosen `optionId`. For capture nodes pass the
 * captured `value`. Statement and termination nodes take neither.
 */
export function answer(
  script: CallScript,
  state: ScriptState,
  input: { optionId?: OptionId; value?: string } = {},
  now: number = Date.now(),
): ScriptState {
  const node = currentNode(script, state)
  if (!node) {
    throw new ScriptError('Call has already ended; nothing to answer')
  }

  switch (node.kind) {
    case 'question': {
      if (!input.optionId) {
        throw new ScriptError(`Node "${node.id}" requires an optionId`)
      }
      const option = node.options.find((o) => o.id === input.optionId)
      if (!option) {
        throw new ScriptError(
          `Option "${input.optionId}" is not valid for node "${node.id}"`,
        )
      }

      let next: ScriptState = {
        ...state,
        answers: [
          ...state.answers,
          {
            nodeId: node.id,
            label: node.label,
            optionId: option.id,
            value: option.label,
            at: now,
          },
        ],
        ...(option.setsLeadType ? { leadType: option.setsLeadType } : {}),
        groupsSatisfied: option.satisfiesGroup
          ? dedupe([...state.groupsSatisfied, option.satisfiesGroup])
          : state.groupsSatisfied,
      }

      next = moveTo(script, next, option.next, option.outcome, now)
      return next
    }

    case 'capture': {
      const value = (input.value ?? '').trim()
      if (node.required && !value) {
        throw new ScriptError(`Node "${node.id}" requires a value`)
      }
      const next: ScriptState = {
        ...state,
        answers: [
          ...state.answers,
          { nodeId: node.id, label: node.label, value, at: now },
        ],
      }
      return moveTo(script, next, node.next, node.outcome, now)
    }

    case 'statement':
      return moveTo(script, state, node.next, node.outcome, now)

    case 'termination':
      return { ...state, currentNodeId: null, outcome: node.outcome }
  }
}

/* ------------------------------------------------------------------ */
/* Internals                                                           */
/* ------------------------------------------------------------------ */

function moveTo(
  script: CallScript,
  state: ScriptState,
  nextId: NodeId | null,
  outcome: Outcome | undefined,
  now: number,
): ScriptState {
  if (nextId === null) {
    return {
      ...state,
      currentNodeId: null,
      outcome: outcome ?? state.outcome,
    }
  }

  const node = script.nodes[nextId]
  if (!node) {
    throw new ScriptError(`Transition target "${nextId}" does not exist`)
  }

  // A termination node reached by transition ends the call immediately —
  // the agent still reads its wording, but there is nothing to answer.
  const advanced: ScriptState = { ...state, currentNodeId: nextId }
  const withCheckpoint = recordCheckpoint(advanced, node, now)

  if (node.kind === 'termination') {
    return { ...withCheckpoint, outcome: node.outcome }
  }
  return withCheckpoint
}

function recordCheckpoint(
  state: ScriptState,
  node: ScriptNode,
  _now: number,
): ScriptState {
  if (!node.checkpoint) return state
  if (state.checkpointsReached.includes(node.checkpoint)) return state
  return {
    ...state,
    checkpointsReached: [...state.checkpointsReached, node.checkpoint],
  }
}

function dedupe(values: string[]): string[] {
  return [...new Set(values)]
}

/* ------------------------------------------------------------------ */
/* Helpers used by the cockpit and by reporting                        */
/* ------------------------------------------------------------------ */

/** True once the call can no longer advance. */
export function isComplete(state: ScriptState): boolean {
  return state.currentNodeId === null || state.outcome !== 'in_progress'
}

/** Captured field values keyed by their `field` name, for the lead record. */
export function capturedFields(
  script: CallScript,
  state: ScriptState,
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const a of state.answers) {
    const node = script.nodes[a.nodeId]
    if (node?.kind === 'capture') out[node.field] = a.value
  }
  return out
}

/**
 * Static validation of a script definition. Run in CI and in the flow builder
 * before publish, so a broken campaign can never reach an agent mid-call.
 */
export function validateScript(script: CallScript): string[] {
  const problems: string[] = []
  const ids = new Set(Object.keys(script.nodes))

  if (!ids.has(script.entry)) {
    problems.push(`entry node "${script.entry}" does not exist`)
  }

  const referenced = new Set<NodeId>([script.entry])
  const check = (from: NodeId, target: NodeId | null) => {
    if (target === null) return
    referenced.add(target)
    if (!ids.has(target)) {
      problems.push(`"${from}" points at missing node "${target}"`)
    }
  }

  for (const [id, node] of Object.entries(script.nodes)) {
    if (node.id !== id) {
      problems.push(`node keyed "${id}" declares id "${node.id}"`)
    }
    switch (node.kind) {
      case 'question':
        if (node.options.length === 0) {
          problems.push(`question "${id}" has no options`)
        }
        for (const o of node.options) {
          check(id, o.next)
          if (o.next === null && !o.outcome) {
            problems.push(`option "${id}.${o.id}" ends the call with no outcome`)
          }
        }
        break
      case 'statement':
      case 'capture':
        check(id, node.next)
        if (node.next === null && !node.outcome) {
          problems.push(`"${id}" ends the call with no outcome`)
        }
        break
      case 'termination':
        break
    }
  }

  for (const id of ids) {
    if (!referenced.has(id)) problems.push(`node "${id}" is unreachable`)
  }

  return problems
}

export type { AnswerRecord }
