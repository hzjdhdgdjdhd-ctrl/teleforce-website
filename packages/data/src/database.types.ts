/**
 * Database row types.
 *
 * Hand-written to mirror supabase/migrations. Regenerate from the live schema
 * once a project exists:
 *
 *   npx supabase gen types typescript --linked > packages/data/src/database.types.ts
 *
 * Until then these are the contract, and a drift between them and the
 * migrations is a bug in this file.
 */

export type UserRole =
  | 'admin'
  | 'supervisor'
  | 'team_leader'
  | 'qa'
  | 'agent'
  | 'viewer'

export type ContactStatusRow =
  | 'available' | 'assigned' | 'in_call' | 'completed'
  | 'callback' | 'dnc' | 'invalid'

export type DispositionRow =
  | 'no_answer' | 'engaged' | 'wrong_number' | 'not_interested'
  | 'callback' | 'do_not_call' | 'terminated_ineligible'
  | 'terminated_property' | 'qualified'

export type LeadStatusRow =
  | 'new' | 'qa_pending' | 'qa_passed' | 'qa_failed' | 'submitted' | 'rejected'

export type LeadProductRow = 'loft' | 'cavity' | 'both' | 'none'

export interface ContactRow {
  id: string
  batch_id: string
  campaign_id: string
  title: string | null
  first_name: string
  last_name: string
  phone: string
  alternative_phone: string | null
  email: string | null
  address_line1: string | null
  address_line2: string | null
  city: string | null
  postcode: string | null
  extra: Record<string, string>
  status: ContactStatusRow
  assigned_to: string | null
  assigned_at: string | null
  attempts: number
  last_attempt_at: string | null
  callback_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ContactBatchRow {
  id: string
  campaign_id: string
  filename: string
  total_rows: number
  imported: number
  skipped_duplicates: number
  rejected: number
  issues: Array<{ row: number; reason: string; raw: string }>
  uploaded_by: string
  uploaded_at: string
}

export interface CallRow {
  id: string
  campaign_id: string
  contact_id: string
  agent_id: string
  script_id: string
  script_version: number
  started_at: string
  ended_at: string | null
  duration_seconds: number | null
  disposition: DispositionRow | null
  answers: Array<{
    nodeId: string
    label: string
    optionId?: string
    value: string
    at: number
  }>
  checkpoints_reached: string[]
  rebuttals_used: string[]
  notes: string | null
}

export interface LeadRow {
  id: string
  campaign_id: string
  contact_id: string
  call_id: string
  agent_id: string
  first_name: string
  last_name: string
  phone: string
  alternative_phone: string | null
  address_line1: string | null
  city: string | null
  postcode: string | null
  lead_type: LeadProductRow
  eligibility_path: string[]
  password: string | null
  best_time_to_call: string | null
  status: LeadStatusRow
  compliance_score: number
  billable: boolean
  appointment_at: string | null
  notes: string | null
  created_at: string
}

export interface RebuttalRow {
  id: string
  campaign_id: string
  label: string
  say: string
  sort_order: number
  active: boolean
}

export interface ProfileRow {
  id: string
  email: string
  display_name: string
  role: UserRole
  active: boolean
  last_seen_at: string | null
}
