import type {
  CallRecord,
  Contact,
  ContactBatch,
  Lead,
  Rebuttal,
  UserProfile,
} from '@teleforce/core'

/**
 * Storage seam.
 *
 * The cockpit never talks to a database directly. Today the local adapter
 * backs it; when Firebase credentials exist, a Firestore adapter implements
 * the same interface and nothing in the UI changes.
 */
export interface Repository {
  /* Contacts */
  nextAvailableContact(campaignId: string, agentId: string): Promise<Contact | null>
  getContact(id: string): Promise<Contact | null>
  updateContact(id: string, patch: Partial<Contact>): Promise<void>
  listContacts(campaignId: string): Promise<Contact[]>
  addContacts(contacts: Array<Omit<Contact, 'id'>>): Promise<string[]>

  /* Batches */
  addBatch(batch: Omit<ContactBatch, 'id'>): Promise<string>
  listBatches(campaignId: string): Promise<ContactBatch[]>

  /* Calls and leads */
  createCall(call: Omit<CallRecord, 'id'>): Promise<string>
  updateCall(id: string, patch: Partial<CallRecord>): Promise<void>
  createLead(lead: Omit<Lead, 'id'>): Promise<string>
  listLeads(campaignId: string): Promise<Lead[]>

  /* Reference data */
  listRebuttals(campaignId: string): Promise<Rebuttal[]>
  saveRebuttal(rebuttal: Rebuttal): Promise<void>

  /* Session */
  currentUser(): Promise<UserProfile | null>
}

/** Keys used by the local adapter. Exported so the admin app matches. */
export const STORE_KEYS = {
  contacts: 'tf.contacts',
  batches: 'tf.batches',
  calls: 'tf.calls',
  leads: 'tf.leads',
  rebuttals: 'tf.rebuttals',
  user: 'tf.user',
} as const

export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

export function nowIso(): string {
  return new Date().toISOString()
}
