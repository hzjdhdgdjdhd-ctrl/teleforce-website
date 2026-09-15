/**
 * Firestore domain model.
 *
 * Every stored document carries the same audit envelope, because "who changed
 * this and when" is the first question asked in any dispute with a client over
 * a lead.
 */

export type Uid = string
export type Iso = string

/** Audit fields present on every document. Never optional. */
export interface AuditFields {
  createdAt: Iso
  updatedAt: Iso
  createdBy: Uid
  updatedBy: Uid
}

export type WithAudit<T> = T & AuditFields

/* ------------------------------------------------------------------ */
/* People and access                                                   */
/* ------------------------------------------------------------------ */

export type Role =
  | 'admin'
  | 'supervisor'
  | 'team_leader'
  | 'qa'
  | 'agent'
  | 'viewer'

/** Capability checks read better than role checks at call sites. */
export const ROLE_CAPABILITIES = {
  admin: [
    'campaign.manage',
    'contacts.upload',
    'contacts.assign',
    'script.edit',
    'rebuttal.edit',
    'user.manage',
    'report.view',
    'qa.review',
    'lead.view',
    'call.work',
    'audit.view',
  ],
  supervisor: [
    'contacts.assign',
    'report.view',
    'qa.review',
    'lead.view',
    'call.work',
    'rebuttal.edit',
    'team.manage',
  ],
  /**
   * Runs one team. Sees and coaches their own agents, reassigns their leads.
   * Deliberately cannot manage users, delete campaigns or edit the website —
   * those are the powers that make the difference between running a team and
   * running the company.
   */
  team_leader: [
    'report.view',
    'qa.review',
    'lead.view',
    'lead.reassign',
    'call.work',
    'team.coach',
  ],
  qa: ['qa.review', 'lead.view', 'report.view'],
  agent: ['call.work', 'lead.view.own'],
  /** Read-only. For a client or a stakeholder who needs numbers, not access. */
  viewer: ['report.view'],
} as const satisfies Record<Role, readonly string[]>

export type Capability =
  (typeof ROLE_CAPABILITIES)[Role][number]

export function can(role: Role, capability: Capability): boolean {
  return (ROLE_CAPABILITIES[role] as readonly string[]).includes(capability)
}

export interface UserProfile {
  uid: Uid
  email: string
  displayName: string
  role: Role
  active: boolean
  /** Campaigns this user may work. Empty means all, for admins. */
  campaignIds: string[]
  lastSeenAt?: Iso
}

/* ------------------------------------------------------------------ */
/* Contacts — the daily upload                                         */
/* ------------------------------------------------------------------ */

/**
 * Where a contact sits in the working day. Agents pull the next `available`
 * contact; everything else is either in flight or finished.
 */
export type ContactStatus =
  | 'available'
  | 'assigned'
  | 'in_call'
  | 'completed'
  | 'callback'
  | 'dnc'
  | 'invalid'

export interface Contact {
  id: string
  batchId: string
  campaignId: string

  /* Identity — what the agent greets them with */
  title?: string
  firstName: string
  lastName: string

  /* Contact details — agent copies the phone and dials manually */
  phone: string
  alternativePhone?: string
  email?: string

  /* Property — pre-fills what the script would otherwise ask */
  addressLine1?: string
  addressLine2?: string
  city?: string
  postcode?: string

  /** Anything else the uploaded file carried, preserved verbatim. */
  extra: Record<string, string>

  status: ContactStatus
  assignedTo?: Uid
  assignedAt?: Iso
  attempts: number
  lastAttemptAt?: Iso
  /** Set when status is 'callback'. */
  callbackAt?: Iso
  notes?: string
}

/** One day's upload. Keeps provenance for every contact in it. */
export interface ContactBatch {
  id: string
  campaignId: string
  /** Original filename, so a bad list can be traced back. */
  filename: string
  uploadedBy: Uid
  uploadedAt: Iso
  totalRows: number
  imported: number
  skippedDuplicates: number
  rejected: number
  /** Row-level problems, capped for storage. */
  issues: ImportIssue[]
}

export interface ImportIssue {
  row: number
  reason: string
  raw: string
}

/* ------------------------------------------------------------------ */
/* Calls and outcomes                                                  */
/* ------------------------------------------------------------------ */

/**
 * Disposition the agent selects. Distinct from the script outcome: a call can
 * end without ever reaching the script (no answer, wrong number).
 */
export type Disposition =
  | 'no_answer'
  | 'engaged'
  | 'wrong_number'
  | 'not_interested'
  | 'callback'
  | 'do_not_call'
  | 'terminated_ineligible'
  | 'terminated_property'
  | 'qualified'

/** Dispositions that mean the agent worked the script to a conclusion. */
export const SCRIPTED_DISPOSITIONS: readonly Disposition[] = [
  'terminated_ineligible',
  'terminated_property',
  'qualified',
]

export interface CallRecord {
  id: string
  campaignId: string
  contactId: string
  agentId: Uid
  scriptId: string
  scriptVersion: number

  startedAt: Iso
  endedAt?: Iso
  /** Seconds. Computed on close, stored so reports need no recomputation. */
  durationSeconds?: number

  disposition?: Disposition
  /** Serialised ScriptState, so QA can replay the call exactly. */
  answers: CallAnswer[]
  checkpointsReached: string[]
  rebuttalsUsed: string[]
  notes?: string

  /** Populated when the call produced a lead. */
  leadId?: string
}

export interface CallAnswer {
  nodeId: string
  label: string
  optionId?: string
  value: string
  at: number
}

/* ------------------------------------------------------------------ */
/* Leads                                                               */
/* ------------------------------------------------------------------ */

export type LeadStatus =
  | 'new'
  | 'qa_pending'
  | 'qa_passed'
  | 'qa_failed'
  | 'submitted'
  | 'rejected'

export interface Lead {
  id: string
  campaignId: string
  contactId: string
  callId: string
  agentId: Uid

  /* Denormalised so the lead stands alone in an export */
  firstName: string
  lastName: string
  phone: string
  alternativePhone?: string
  addressLine1?: string
  city?: string
  postcode?: string

  /** Which product qualified. */
  leadType: 'loft' | 'cavity' | 'both' | 'none'
  /** Which eligibility gate the caller passed, for audit. */
  eligibilityPath: string[]
  /** Agreed password the surveyor quotes. */
  password?: string
  bestTimeToCall?: string

  status: LeadStatus
  /** Compliance score at the moment of creation. */
  complianceScore: number
  billable: boolean

  appointmentAt?: Iso
  notes?: string
}

/* ------------------------------------------------------------------ */
/* Rebuttals                                                           */
/* ------------------------------------------------------------------ */

export interface Rebuttal {
  id: string
  campaignId: string
  /** Button label, e.g. "Busy". */
  label: string
  /** Wording the agent reads. */
  say: string
  /** Optional ordering hint for the cockpit. */
  order: number
  active: boolean
}

/* ------------------------------------------------------------------ */
/* QA                                                                  */
/* ------------------------------------------------------------------ */

export interface QaReview {
  id: string
  callId: string
  leadId?: string
  reviewerId: Uid
  reviewedAt: Iso
  complianceScore: number
  passed: boolean
  /** Checkpoint keys the reviewer marked as failed despite the system score. */
  overriddenFailures: string[]
  coachingNotes: string
  supervisorComments?: string
}

/* ------------------------------------------------------------------ */
/* Audit                                                               */
/* ------------------------------------------------------------------ */

export interface AuditLogEntry {
  id: string
  at: Iso
  actorId: Uid
  actorEmail: string
  action: string
  /** Collection/document the action touched. */
  target: string
  /** Small, human-readable diff or context. Never the full document. */
  detail?: Record<string, string | number | boolean>
}
