import type { Repository } from './repository'
import { LocalRepository } from './localRepository'
import { SupabaseRepository, readSupabaseConfig } from './supabaseRepository'

/**
 * Chooses the storage backend.
 *
 * Supabase when credentials are present, browser-local otherwise. The
 * fallback is deliberate: a developer without credentials gets a working app
 * rather than a blank screen, and the same code path ships to production.
 */
export function createRepository(
  env: Record<string, string | undefined> = {},
): { repo: Repository; backend: 'supabase' | 'local' } {
  const config = readSupabaseConfig(env)
  if (config) {
    return { repo: new SupabaseRepository(config), backend: 'supabase' }
  }
  return { repo: new LocalRepository(), backend: 'local' }
}
