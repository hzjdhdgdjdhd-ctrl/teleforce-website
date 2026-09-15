/**
 * Call-script flow model.
 *
 * A script is a directed graph of nodes. The agent never scrolls or searches:
 * answering the current node determines the next one, so the cockpit always
 * shows exactly one thing to say and the choices available.
 *
 * The model is deliberately data-only — no behaviour lives here — so that the
 * same definitions can be authored in the visual flow builder, stored in
 * Firestore, replayed for QA, and evaluated in tests.
 */

/** Stable identifier for a node within one script. */
export type NodeId = string

/** Identifier for a single answer option. */
export type OptionId = string

/**
 * What happened to the call by the time the flow stopped advancing.
 *
 * `qualified` means every gate was passed and the lead may be presented as
 * billable, provided compliance also passes — see the compliance module.
 */
export type Outcome =
  | 'in_progress'
  | 'qualified'
  | 'terminated_ineligible'
  | 'terminated_property'
  | 'callback'

/** Which product the call is qualifying for. Some gates route between them. */
export type LeadType = 'loft' | 'cavity' | 'both' | 'none'

/* ------------------------------------------------------------------ */
/* Answer options                                                      */
/* ------------------------------------------------------------------ */

export interface ScriptOption {
  id: OptionId
  /** Text on the agent's button. */
  label: string
  /**
   * Where answering this option sends the call.
   * `null` means the flow ends here with `outcome`.
   */
  next: NodeId | null
  /** Set when `next` is null. */
  outcome?: Outcome
  /**
   * Narrows or sets the lead type. Used where the script routes a caller
   * away from loft and onto cavity questions, and vice versa.
   */
  setsLeadType?: LeadType
  /**
   * Marks this answer as satisfying one of the "need at least one YES"
   * groups in the eligibility checks.
   */
  satisfiesGroup?: string
}

/* ------------------------------------------------------------------ */
/* Nodes                                                               */
/* ------------------------------------------------------------------ */

interface NodeBase {
  id: NodeId
  /** Section heading shown above the script text in the cockpit. */
  section: string
  /**
   * Compliance checkpoint key. When set, reaching this node records that the
   * agent was shown the mandatory wording — see compliance/rules.ts.
   */
  checkpoint?: string
  /** Guidance shown to the agent in the cockpit but never read aloud. */
  note?: string
}

/**
 * Something the agent says with no branching — salutation, transition,
 * a mandatory statement. Advances to exactly one next node.
 */
export interface StatementNode extends NodeBase {
  kind: 'statement'
  /** Exact wording the agent reads. */
  say: string
  next: NodeId | null
  outcome?: Outcome
  /** True for wording the compliance rules mark as MUST SAY. */
  mustSay?: boolean
}

/** A branching question with discrete answer options. */
export interface QuestionNode extends NodeBase {
  kind: 'question'
  /** Wording the agent reads. */
  say: string
  /** Short label for reports and QA, e.g. "Cavity walls insulated". */
  label: string
  options: ScriptOption[]
}

/**
 * Free-text or structured capture — mobile number, password, best time.
 * Captured values land on the lead record.
 */
export interface CaptureNode extends NodeBase {
  kind: 'capture'
  say: string
  label: string
  field: string
  inputType: 'text' | 'tel' | 'choice'
  /** Present when inputType is 'choice'. */
  choices?: string[]
  required: boolean
  next: NodeId | null
  outcome?: Outcome
}

/**
 * A terminal node. The call ends here with a fixed outcome and a script the
 * agent reads so the ending is consistent and compliant.
 */
export interface TerminationNode extends NodeBase {
  kind: 'termination'
  say: string
  outcome: Exclude<Outcome, 'in_progress'>
}

export type ScriptNode =
  | StatementNode
  | QuestionNode
  | CaptureNode
  | TerminationNode

/* ------------------------------------------------------------------ */
/* Script                                                              */
/* ------------------------------------------------------------------ */

export interface CallScript {
  id: string
  name: string
  /** Bumped whenever the flow changes, so QA can replay the exact version. */
  version: number
  /** Where the call starts. */
  entry: NodeId
  nodes: Record<NodeId, ScriptNode>
}

/* ------------------------------------------------------------------ */
/* Runtime state                                                       */
/* ------------------------------------------------------------------ */

export interface AnswerRecord {
  nodeId: NodeId
  label: string
  optionId?: OptionId
  /** Button text, or the captured value for capture nodes. */
  value: string
  at: number
}

export interface ScriptState {
  scriptId: string
  scriptVersion: number
  currentNodeId: NodeId | null
  outcome: Outcome
  leadType: LeadType
  answers: AnswerRecord[]
  /** Checkpoint keys reached, in order. Feeds compliance scoring. */
  checkpointsReached: string[]
  /** Groups satisfied by a qualifying YES, e.g. "elig3.q1". */
  groupsSatisfied: string[]
}
