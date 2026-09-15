import type { SupabaseRepository } from './supabaseRepository'

/**
 * Website content.
 *
 * Every field is optional and the site ships with its existing copy as the
 * default. A CMS that can render an empty page is a CMS that will, so a
 * missing row, a failed fetch or an unreachable database all leave the site
 * exactly as it was.
 */

export type SiteSection =
  | 'hero'
  | 'services'
  | 'about'
  | 'contact'
  | 'footer'
  | 'seo'

export interface HeroContent {
  eyebrow?: string
  headlineLines?: string[]
  lede?: string
  primaryCta?: string
  secondaryCta?: string
}

export interface ServicesContent {
  eyebrow?: string
  heading?: string
  lede?: string
  /** Overrides by service id; anything omitted keeps its shipped copy. */
  overrides?: Record<string, { title?: string; summary?: string }>
}

export interface AboutContent {
  heading?: string
  body?: string[]
}

export interface ContactContent {
  heading?: string
  lede?: string
  publicEmail?: string
  phone?: string
}

export interface FooterContent {
  blurb?: string
  disclosure?: string
}

export interface SeoContent {
  title?: string
  description?: string
  ogTitle?: string
  ogDescription?: string
}

export interface SiteContent {
  hero?: HeroContent
  services?: ServicesContent
  about?: AboutContent
  contact?: ContactContent
  footer?: FooterContent
  seo?: SeoContent
}

export interface ContentVersion {
  id: string
  section: SiteSection
  version: number
  content: Record<string, unknown>
  published: boolean
  publishedAt: string | null
  note: string | null
  updatedAt: string
}

/**
 * Reads published content with the anon key.
 *
 * Published rows are readable anonymously by policy — that is what published
 * means — so the public site needs no session.
 */
export async function fetchPublishedContent(
  url: string,
  anonKey: string,
  signal?: AbortSignal,
): Promise<SiteContent> {
  try {
    const res = await fetch(
      `${url}/rest/v1/site_content?select=section,content&published=eq.true`,
      {
        headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
        signal: signal ?? null,
      },
    )
    if (!res.ok) return {}

    const rows = (await res.json()) as Array<{
      section: SiteSection
      content: Record<string, unknown>
    }>

    const out: SiteContent = {}
    for (const row of rows) {
      ;(out as Record<string, unknown>)[row.section] = row.content
    }
    return out
  } catch {
    // Offline, blocked, or the project is down. The site keeps its own copy.
    return {}
  }
}

export class SupabaseCms {
  private readonly repo: SupabaseRepository

  constructor(repo: SupabaseRepository) {
    this.repo = repo
  }

  async versions(section: SiteSection): Promise<ContentVersion[]> {
    const { data, error } = await this.repo.client
      .from('site_content')
      .select('id, section, version, content, published, published_at, note, updated_at')
      .eq('section', section)
      .order('version', { ascending: false })
    if (error) throw new Error(error.message)

    return (data as Array<Record<string, unknown>>).map((r) => ({
      id: r.id as string,
      section: r.section as SiteSection,
      version: r.version as number,
      content: (r.content ?? {}) as Record<string, unknown>,
      published: r.published as boolean,
      publishedAt: (r.published_at as string | null) ?? null,
      note: (r.note as string | null) ?? null,
      updatedAt: r.updated_at as string,
    }))
  }

  /** Saves a new draft version. Never mutates a published row. */
  async saveDraft(
    section: SiteSection,
    content: Record<string, unknown>,
    note?: string,
  ): Promise<string> {
    const existing = await this.versions(section)
    const nextVersion = (existing[0]?.version ?? 0) + 1

    const { data, error } = await this.repo.client
      .from('site_content')
      .insert({
        section,
        version: nextVersion,
        content,
        note: note ?? null,
      })
      .select('id')
      .single()
    if (error) throw new Error(error.message)
    return (data as { id: string }).id
  }

  async publish(id: string): Promise<void> {
    const { error } = await this.repo.client.rpc('publish_site_content', {
      content_id: id,
    })
    if (error) throw new Error(error.message)
  }

  async rollback(id: string): Promise<void> {
    const { error } = await this.repo.client.rpc('rollback_site_content', {
      content_id: id,
    })
    if (error) throw new Error(error.message)
  }
}
