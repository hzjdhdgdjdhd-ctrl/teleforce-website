import type { RealtimeChannel } from '@supabase/supabase-js'
import type { SupabaseRepository } from './supabaseRepository'

/**
 * Agent presence and the wallboard feed.
 *
 * Agents push state; supervisors subscribe. The wallboard is told only that
 * something changed and refetches the aggregates itself — pushing computed
 * KPIs over the wire would mean every screen deriving its own numbers, and
 * two supervisors disagreeing about conversion rate is worse than a
 * half-second delay.
 */

export type AgentStatus = 'available' | 'talking' | 'wrap' | 'break' | 'offline'

export interface PresenceUpdate {
  status: AgentStatus
  campaignId?: string | null
  contactId?: string | null
  callId?: string | null
  dialStartedAt?: string | null
}

export interface WallboardMetrics {
  generatedAt: string
  dayStart: string
  agents: {
    online: number
    available: number
    talking: number
    wrap: number
    onBreak: number
    offline: number
  }
  calls: { today: number; completed: number; averageHandleSeconds: number }
  leads: {
    qualified: number
    billable: number
    appointments: number
    averageCompliance: number
  }
  queue: {
    waiting: number
    claimed: number
    inCall: number
    completed: number
    callback: number
    dnc: number
    invalid: number
    total: number
  }
  conversionRate: number
}

export interface WallboardAgent {
  user_id: string
  display_name: string
  email: string
  role: string
  status: AgentStatus
  state_since: string
  dial_started_at: string | null
  campaign_id: string | null
  customer_name: string | null
  customer_phone: string | null
  call_id: string | null
  checkpoints_reached: number
  calls_today: number
  leads_today: number
}

/** How often an agent proves it is still there. */
const HEARTBEAT_MS = 30_000

export class PresenceClient {
  private timer: number | null = null

  private readonly repo: SupabaseRepository

  constructor(repo: SupabaseRepository) {
    this.repo = repo
  }

  async report(update: PresenceUpdate): Promise<void> {
    const { error } = await this.repo.client.rpc('report_presence', {
      new_status: update.status,
      target_campaign: update.campaignId ?? null,
      target_contact: update.contactId ?? null,
      target_call: update.callId ?? null,
      dialled_at: update.dialStartedAt ?? null,
    })
    // Presence is telemetry. A failure here must never interrupt a live call,
    // so it is logged and swallowed rather than thrown at the agent.
    if (error) console.warn('presence report failed:', error.message)
  }

  /**
   * Keep reporting the current state until stopped.
   *
   * The server marks an agent offline when the heartbeat lapses, because a
   * closed laptop lid never sends a disconnect.
   */
  startHeartbeat(getState: () => PresenceUpdate): void {
    this.stopHeartbeat()
    void this.report(getState())
    this.timer = window.setInterval(() => {
      void this.report(getState())
    }, HEARTBEAT_MS)
  }

  stopHeartbeat(): void {
    if (this.timer !== null) {
      window.clearInterval(this.timer)
      this.timer = null
    }
  }

  /** Best-effort offline marker for a closing tab. */
  async goOffline(): Promise<void> {
    this.stopHeartbeat()
    await this.report({ status: 'offline' })
  }
}

/* ------------------------------------------------------------------ */
/* Supervisor side                                                     */
/* ------------------------------------------------------------------ */

export class WallboardClient {
  private readonly repo: SupabaseRepository

  constructor(repo: SupabaseRepository) {
    this.repo = repo
  }

  async metrics(campaignId = 'hhcro'): Promise<WallboardMetrics> {
    const { data, error } = await this.repo.client.rpc('wallboard_metrics', {
      target_campaign: campaignId,
    })
    if (error) throw new Error(error.message)
    return data as WallboardMetrics
  }

  async agents(campaignId = 'hhcro'): Promise<WallboardAgent[]> {
    const { data, error } = await this.repo.client.rpc('wallboard_agents', {
      target_campaign: campaignId,
    })
    if (error) throw new Error(error.message)
    return (data ?? []) as WallboardAgent[]
  }

  async expireStale(): Promise<void> {
    await this.repo.client.rpc('expire_stale_presence', {
      older_than: '90 seconds',
    })
  }

  /**
   * Subscribe to every table that can move a number on the board.
   *
   * Changes are coalesced by the caller: a bulk contact import fires hundreds
   * of events, and refetching per event would hammer the database for a board
   * nobody can read that fast anyway.
   */
  subscribe(onChange: () => void): () => void {
    const channel: RealtimeChannel = this.repo.client
      .channel('wallboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agent_presence' }, onChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calls' }, onChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, onChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contacts' }, onChange)
      .subscribe()

    return () => {
      void this.repo.client.removeChannel(channel)
    }
  }
}
