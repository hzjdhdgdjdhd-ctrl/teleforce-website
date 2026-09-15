import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type {
  CallRecord,
  Contact,
  ContactBatch,
  Lead,
  Rebuttal,
  UserProfile,
} from '@teleforce/core'
import type { Repository } from './repository'
import type {
  ContactBatchRow,
  ContactRow,
  LeadRow,
  ProfileRow,
  RebuttalRow,
} from './database.types'

/**
 * Supabase-backed storage.
 *
 * Row-level security does the access control, so this class never filters by
 * user — it asks for what it wants and Postgres returns only what the caller
 * is entitled to. Any filtering here would be decoration, and decoration that
 * looks like security is worse than none.
 */

export interface SupabaseConfig {
  url: string
  anonKey: string
}

/**
 * Reads configuration from the environment.
 *
 * Returns null when unset, which is the signal to fall back to local storage
 * — that keeps development working without credentials instead of crashing
 * on boot.
 */
export function readSupabaseConfig(
  env: Record<string, string | undefined>,
): SupabaseConfig | null {
  const url = env.VITE_SUPABASE_URL
  const anonKey = env.VITE_SUPABASE_ANON_KEY
  if (!url || !anonKey) return null
  return { url, anonKey }
}

export class SupabaseRepository implements Repository {
  private readonly db: SupabaseClient

  constructor(config: SupabaseConfig, client?: SupabaseClient) {
    this.db =
      client ??
      createClient(config.url, config.anonKey, {
        auth: { persistSession: true, autoRefreshToken: true },
      })
  }

  /* ---------------- Contacts ---------------- */

  /**
   * Claims the next contact atomically.
   *
   * Delegates to the `claim_next_contact` function rather than doing a
   * read-then-write, because the client-side version races: two agents can
   * read the same "available" row and both dial the same household.
   */
  async nextAvailableContact(campaignId: string): Promise<Contact | null> {
    const { data, error } = await this.db.rpc('claim_next_contact', {
      target_campaign: campaignId,
    })
    if (error) throw new Error(`claim_next_contact failed: ${error.message}`)
    if (!data) return null
    return toContact(data as ContactRow)
  }

  async getContact(id: string): Promise<Contact | null> {
    const { data, error } = await this.db
      .from('contacts')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return data ? toContact(data as ContactRow) : null
  }

  async updateContact(id: string, patch: Partial<Contact>): Promise<void> {
    const { error } = await this.db
      .from('contacts')
      .update(fromContactPatch(patch))
      .eq('id', id)
    if (error) throw new Error(error.message)
  }

  async listContacts(campaignId: string): Promise<Contact[]> {
    const { data, error } = await this.db
      .from('contacts')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: true })
    if (error) throw new Error(error.message)
    return (data as ContactRow[]).map(toContact)
  }

  async addContacts(contacts: Array<Omit<Contact, 'id'>>): Promise<string[]> {
    if (contacts.length === 0) return []

    // Chunked so a large daily upload does not hit the request size limit.
    const CHUNK = 500
    const ids: string[] = []

    for (let i = 0; i < contacts.length; i += CHUNK) {
      const slice = contacts.slice(i, i + CHUNK).map(fromContact)
      const { data, error } = await this.db
        .from('contacts')
        .insert(slice)
        .select('id')
      if (error) throw new Error(`contact insert failed: ${error.message}`)
      ids.push(...(data as Array<{ id: string }>).map((r) => r.id))
    }

    return ids
  }

  /* ---------------- Batches ---------------- */

  async addBatch(batch: Omit<ContactBatch, 'id'>): Promise<string> {
    const { data, error } = await this.db
      .from('contact_batches')
      .insert({
        campaign_id: batch.campaignId,
        filename: batch.filename,
        total_rows: batch.totalRows,
        imported: batch.imported,
        skipped_duplicates: batch.skippedDuplicates,
        rejected: batch.rejected,
        issues: batch.issues,
        uploaded_by: batch.uploadedBy,
        uploaded_at: batch.uploadedAt,
      })
      .select('id')
      .single()
    if (error) throw new Error(error.message)
    return (data as { id: string }).id
  }

  async listBatches(campaignId: string): Promise<ContactBatch[]> {
    const { data, error } = await this.db
      .from('contact_batches')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('uploaded_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data as ContactBatchRow[]).map((r) => ({
      id: r.id,
      campaignId: r.campaign_id,
      filename: r.filename,
      uploadedBy: r.uploaded_by,
      uploadedAt: r.uploaded_at,
      totalRows: r.total_rows,
      imported: r.imported,
      skippedDuplicates: r.skipped_duplicates,
      rejected: r.rejected,
      issues: r.issues,
    }))
  }

  /* ---------------- Calls and leads ---------------- */

  async createCall(call: Omit<CallRecord, 'id'>): Promise<string> {
    const { data, error } = await this.db
      .from('calls')
      .insert({
        campaign_id: call.campaignId,
        contact_id: call.contactId,
        agent_id: call.agentId,
        script_id: call.scriptId,
        script_version: call.scriptVersion,
        started_at: call.startedAt,
        answers: call.answers,
        checkpoints_reached: call.checkpointsReached,
        rebuttals_used: call.rebuttalsUsed,
      })
      .select('id')
      .single()
    if (error) throw new Error(error.message)
    return (data as { id: string }).id
  }

  async updateCall(id: string, patch: Partial<CallRecord>): Promise<void> {
    const row: Record<string, unknown> = {}
    if (patch.endedAt !== undefined) row.ended_at = patch.endedAt
    if (patch.durationSeconds !== undefined) row.duration_seconds = patch.durationSeconds
    if (patch.disposition !== undefined) row.disposition = patch.disposition
    if (patch.answers !== undefined) row.answers = patch.answers
    if (patch.checkpointsReached !== undefined) row.checkpoints_reached = patch.checkpointsReached
    if (patch.rebuttalsUsed !== undefined) row.rebuttals_used = patch.rebuttalsUsed
    if (patch.notes !== undefined) row.notes = patch.notes
    if (patch.leadId !== undefined) row.lead_id = patch.leadId
    if (Object.keys(row).length === 0) return

    const { error } = await this.db.from('calls').update(row).eq('id', id)
    if (error) throw new Error(error.message)
  }

  async createLead(lead: Omit<Lead, 'id'>): Promise<string> {
    const { data, error } = await this.db
      .from('leads')
      .insert({
        campaign_id: lead.campaignId,
        contact_id: lead.contactId,
        call_id: lead.callId,
        agent_id: lead.agentId,
        first_name: lead.firstName,
        last_name: lead.lastName,
        phone: lead.phone,
        alternative_phone: lead.alternativePhone ?? null,
        address_line1: lead.addressLine1 ?? null,
        city: lead.city ?? null,
        postcode: lead.postcode ?? null,
        lead_type: lead.leadType,
        eligibility_path: lead.eligibilityPath,
        password: lead.password ?? null,
        best_time_to_call: lead.bestTimeToCall ?? null,
        status: lead.status,
        compliance_score: lead.complianceScore,
        billable: lead.billable,
        notes: lead.notes ?? null,
      })
      .select('id')
      .single()
    if (error) throw new Error(error.message)
    return (data as { id: string }).id
  }

  async listLeads(campaignId: string): Promise<Lead[]> {
    const { data, error } = await this.db
      .from('leads')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data as LeadRow[]).map(toLead)
  }

  /* ---------------- Reference data ---------------- */

  async listRebuttals(campaignId: string): Promise<Rebuttal[]> {
    const { data, error } = await this.db
      .from('rebuttals')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('active', true)
      .order('sort_order', { ascending: true })
    if (error) throw new Error(error.message)
    return (data as RebuttalRow[]).map((r) => ({
      id: r.id,
      campaignId: r.campaign_id,
      label: r.label,
      say: r.say,
      order: r.sort_order,
      active: r.active,
    }))
  }

  async saveRebuttal(rebuttal: Rebuttal): Promise<void> {
    const { error } = await this.db.from('rebuttals').upsert({
      id: rebuttal.id,
      campaign_id: rebuttal.campaignId,
      label: rebuttal.label,
      say: rebuttal.say,
      sort_order: rebuttal.order,
      active: rebuttal.active,
    })
    if (error) throw new Error(error.message)
  }

  /* ---------------- Session ---------------- */

  async currentUser(): Promise<UserProfile | null> {
    const { data: auth } = await this.db.auth.getUser()
    if (!auth.user) return null

    const { data, error } = await this.db
      .from('profiles')
      .select('*')
      .eq('id', auth.user.id)
      .maybeSingle()
    if (error || !data) return null

    const row = data as ProfileRow
    return {
      uid: row.id,
      email: row.email,
      displayName: row.display_name,
      role: row.role,
      active: row.active,
      campaignIds: [],
      ...(row.last_seen_at ? { lastSeenAt: row.last_seen_at } : {}),
    }
  }

  /** Underlying client, for realtime subscriptions in the wallboard. */
  get client(): SupabaseClient {
    return this.db
  }
}

/* ------------------------------------------------------------------ */
/* Row <-> domain mapping                                              */
/* ------------------------------------------------------------------ */

function toContact(r: ContactRow): Contact {
  return {
    id: r.id,
    batchId: r.batch_id,
    campaignId: r.campaign_id,
    ...(r.title ? { title: r.title } : {}),
    firstName: r.first_name,
    lastName: r.last_name,
    phone: r.phone,
    ...(r.alternative_phone ? { alternativePhone: r.alternative_phone } : {}),
    ...(r.email ? { email: r.email } : {}),
    ...(r.address_line1 ? { addressLine1: r.address_line1 } : {}),
    ...(r.address_line2 ? { addressLine2: r.address_line2 } : {}),
    ...(r.city ? { city: r.city } : {}),
    ...(r.postcode ? { postcode: r.postcode } : {}),
    extra: r.extra ?? {},
    status: r.status,
    ...(r.assigned_to ? { assignedTo: r.assigned_to } : {}),
    ...(r.assigned_at ? { assignedAt: r.assigned_at } : {}),
    attempts: r.attempts,
    ...(r.last_attempt_at ? { lastAttemptAt: r.last_attempt_at } : {}),
    ...(r.callback_at ? { callbackAt: r.callback_at } : {}),
    ...(r.notes ? { notes: r.notes } : {}),
  }
}

function fromContact(c: Omit<Contact, 'id'>): Record<string, unknown> {
  return {
    batch_id: c.batchId,
    campaign_id: c.campaignId,
    title: c.title ?? null,
    first_name: c.firstName,
    last_name: c.lastName,
    phone: c.phone,
    alternative_phone: c.alternativePhone ?? null,
    email: c.email ?? null,
    address_line1: c.addressLine1 ?? null,
    address_line2: c.addressLine2 ?? null,
    city: c.city ?? null,
    postcode: c.postcode ?? null,
    extra: c.extra,
    status: c.status,
    attempts: c.attempts,
  }
}

function fromContactPatch(p: Partial<Contact>): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  if (p.status !== undefined) row.status = p.status
  if (p.attempts !== undefined) row.attempts = p.attempts
  if (p.notes !== undefined) row.notes = p.notes
  if (p.callbackAt !== undefined) row.callback_at = p.callbackAt
  if (p.lastAttemptAt !== undefined) row.last_attempt_at = p.lastAttemptAt
  // `assignedTo: undefined` is the caller releasing the contact, which must
  // become an explicit null rather than being dropped from the patch.
  if ('assignedTo' in p) row.assigned_to = p.assignedTo ?? null
  return row
}

function toLead(r: LeadRow): Lead {
  return {
    id: r.id,
    campaignId: r.campaign_id,
    contactId: r.contact_id,
    callId: r.call_id,
    agentId: r.agent_id,
    firstName: r.first_name,
    lastName: r.last_name,
    phone: r.phone,
    ...(r.alternative_phone ? { alternativePhone: r.alternative_phone } : {}),
    ...(r.address_line1 ? { addressLine1: r.address_line1 } : {}),
    ...(r.city ? { city: r.city } : {}),
    ...(r.postcode ? { postcode: r.postcode } : {}),
    leadType: r.lead_type,
    eligibilityPath: r.eligibility_path,
    ...(r.password ? { password: r.password } : {}),
    ...(r.best_time_to_call ? { bestTimeToCall: r.best_time_to_call } : {}),
    status: r.status,
    complianceScore: r.compliance_score,
    billable: r.billable,
    ...(r.appointment_at ? { appointmentAt: r.appointment_at } : {}),
    ...(r.notes ? { notes: r.notes } : {}),
  }
}

/* ------------------------------------------------------------------ */
/* Auth helpers                                                        */
/* ------------------------------------------------------------------ */

export interface AuthResult {
  ok: boolean
  message?: string
}

/**
 * Sign-in helpers kept alongside the repository so apps import one module.
 *
 * Error messages are deliberately plain: an agent locked out at the start of
 * a shift needs to know what to do, not read a stack trace.
 */
export class SupabaseAuth {
  constructor(private readonly repo: SupabaseRepository) {}

  async signIn(email: string, password: string): Promise<AuthResult> {
    const { error } = await this.repo.client.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (!error) return { ok: true }

    // Supabase returns the same message for a wrong password and an unknown
    // account, which is correct — it avoids confirming whether an address is
    // registered.
    return {
      ok: false,
      message:
        error.message === 'Invalid login credentials'
          ? 'That email and password did not match. Check both and try again.'
          : error.message,
    }
  }

  async signOut(): Promise<void> {
    await this.repo.client.auth.signOut()
  }

  /** Fires on sign-in, sign-out and token refresh. */
  onChange(callback: (signedIn: boolean) => void): () => void {
    const { data } = this.repo.client.auth.onAuthStateChange((_event, session) => {
      callback(Boolean(session))
    })
    return () => data.subscription.unsubscribe()
  }

  async hasSession(): Promise<boolean> {
    const { data } = await this.repo.client.auth.getSession()
    return Boolean(data.session)
  }
}
