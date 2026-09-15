import type {
  CallRecord,
  Contact,
  ContactBatch,
  Lead,
  Rebuttal,
  UserProfile,
} from '@teleforce/core'
import { STORE_KEYS, newId, nowIso, type Repository } from './repository'

/**
 * Browser-local implementation.
 *
 * Used when no Firebase configuration is present — local development, and a
 * working single-machine deployment. Every write is synchronous under the
 * hood but the interface is async so swapping in Firestore changes nothing
 * at the call sites.
 *
 * Storage can be unavailable (private windows, blocked site data), so every
 * access is guarded and degrades to an empty dataset rather than throwing
 * mid-call.
 */

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Quota exceeded or storage blocked. The call in progress continues from
    // in-memory state; losing persistence is better than losing the call.
  }
}

export class LocalRepository implements Repository {
  async nextAvailableContact(
    campaignId: string,
    agentId: string,
  ): Promise<Contact | null> {
    const contacts = read<Contact[]>(STORE_KEYS.contacts, [])

    // Prefer a contact already assigned to this agent, so a refresh mid-call
    // returns them to the same person rather than skipping ahead.
    const mine = contacts.find(
      (c) =>
        c.campaignId === campaignId &&
        c.assignedTo === agentId &&
        (c.status === 'assigned' || c.status === 'in_call'),
    )
    if (mine) return mine

    const due = Date.now()
    const next = contacts.find(
      (c) =>
        c.campaignId === campaignId &&
        (c.status === 'available' ||
          (c.status === 'callback' &&
            c.callbackAt !== undefined &&
            Date.parse(c.callbackAt) <= due)),
    )
    if (!next) return null

    const claimed: Contact = {
      ...next,
      status: 'assigned',
      assignedTo: agentId,
      assignedAt: nowIso(),
    }
    write(
      STORE_KEYS.contacts,
      contacts.map((c) => (c.id === claimed.id ? claimed : c)),
    )
    return claimed
  }

  async claimContactByPhone(
    campaignId: string,
    phone: string,
  ): Promise<Contact | null> {
    const digits = phone.replace(/\D/g, '').slice(-9)
    if (digits.length < 9) return null

    const contacts = read<Contact[]>(STORE_KEYS.contacts, [])
    const match = contacts.find(
      (c) =>
        c.campaignId === campaignId &&
        c.status !== 'dnc' &&
        c.phone.replace(/\D/g, '').slice(-9) === digits,
    )
    if (!match) return null

    const claimed: Contact = { ...match, status: 'assigned', assignedAt: nowIso() }
    write(
      STORE_KEYS.contacts,
      contacts.map((c) => (c.id === claimed.id ? claimed : c)),
    )
    return claimed
  }

  async getContact(id: string): Promise<Contact | null> {
    return read<Contact[]>(STORE_KEYS.contacts, []).find((c) => c.id === id) ?? null
  }

  async updateContact(id: string, patch: Partial<Contact>): Promise<void> {
    const contacts = read<Contact[]>(STORE_KEYS.contacts, [])
    write(
      STORE_KEYS.contacts,
      contacts.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    )
  }

  async closeContact(
    id: string,
    status: Contact['status'],
    notes?: string,
    callbackAt?: string,
  ): Promise<void> {
    const contacts = read<Contact[]>(STORE_KEYS.contacts, [])
    write(
      STORE_KEYS.contacts,
      contacts.map((c) =>
        c.id === id
          ? {
              ...c,
              status,
              attempts: c.attempts + 1,
              lastAttemptAt: nowIso(),
              ...(notes ? { notes } : {}),
              ...(callbackAt ? { callbackAt } : {}),
              assignedTo: undefined,
              assignedAt: undefined,
            }
          : c,
      ),
    )
  }

  async listContacts(campaignId: string): Promise<Contact[]> {
    return read<Contact[]>(STORE_KEYS.contacts, []).filter(
      (c) => c.campaignId === campaignId,
    )
  }

  async addContacts(contacts: Array<Omit<Contact, 'id'>>): Promise<string[]> {
    const existing = read<Contact[]>(STORE_KEYS.contacts, [])
    const withIds = contacts.map((c) => ({ ...c, id: newId('ct') }))
    write(STORE_KEYS.contacts, [...existing, ...withIds])
    return withIds.map((c) => c.id)
  }

  async addBatch(batch: Omit<ContactBatch, 'id'>): Promise<string> {
    const batches = read<ContactBatch[]>(STORE_KEYS.batches, [])
    const id = newId('bt')
    write(STORE_KEYS.batches, [{ ...batch, id }, ...batches])
    return id
  }

  async listBatches(campaignId: string): Promise<ContactBatch[]> {
    return read<ContactBatch[]>(STORE_KEYS.batches, []).filter(
      (b) => b.campaignId === campaignId,
    )
  }

  async createCall(call: Omit<CallRecord, 'id'>): Promise<string> {
    const calls = read<CallRecord[]>(STORE_KEYS.calls, [])
    const id = newId('cl')
    write(STORE_KEYS.calls, [{ ...call, id }, ...calls])
    return id
  }

  async updateCall(id: string, patch: Partial<CallRecord>): Promise<void> {
    const calls = read<CallRecord[]>(STORE_KEYS.calls, [])
    write(
      STORE_KEYS.calls,
      calls.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    )
  }

  async createLead(lead: Omit<Lead, 'id'>): Promise<string> {
    const leads = read<Lead[]>(STORE_KEYS.leads, [])
    const id = newId('ld')
    write(STORE_KEYS.leads, [{ ...lead, id }, ...leads])
    return id
  }

  async listLeads(campaignId: string): Promise<Lead[]> {
    return read<Lead[]>(STORE_KEYS.leads, []).filter(
      (l) => l.campaignId === campaignId,
    )
  }

  async listRebuttals(campaignId: string): Promise<Rebuttal[]> {
    return read<Rebuttal[]>(STORE_KEYS.rebuttals, [])
      .filter((r) => r.campaignId === campaignId && r.active)
      .sort((a, b) => a.order - b.order)
  }

  async saveRebuttal(rebuttal: Rebuttal): Promise<void> {
    const all = read<Rebuttal[]>(STORE_KEYS.rebuttals, [])
    const idx = all.findIndex((r) => r.id === rebuttal.id)
    if (idx === -1) all.push(rebuttal)
    else all[idx] = rebuttal
    write(STORE_KEYS.rebuttals, all)
  }

  async currentUser(): Promise<UserProfile | null> {
    return read<UserProfile | null>(STORE_KEYS.user, null)
  }
}
