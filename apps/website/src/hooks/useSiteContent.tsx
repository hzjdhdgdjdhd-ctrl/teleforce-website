import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { fetchPublishedContent, type SiteContent } from '@teleforce/data'

/**
 * CMS overrides for the public site.
 *
 * The site renders its shipped copy immediately and applies published
 * overrides when they arrive. That ordering matters: a page that waits for a
 * network round trip before showing anything is a page that shows nothing
 * when the network is slow, and this is the front door.
 */

const SiteContentContext = createContext<SiteContent>({})

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<SiteContent>({})

  useEffect(() => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return
    const controller = new AbortController()
    void fetchPublishedContent(SUPABASE_URL, SUPABASE_ANON_KEY, controller.signal).then(
      setContent,
    )
    return () => controller.abort()
  }, [])

  return (
    <SiteContentContext.Provider value={content}>
      {children}
    </SiteContentContext.Provider>
  )
}

/**
 * Read one section, falling back to the shipped copy field by field.
 *
 * Merging per field rather than per section means an editor who sets only a
 * headline does not blank the lede underneath it.
 */
export function useSection<K extends keyof SiteContent, F extends NonNullable<SiteContent[K]>>(
  section: K,
  fallback: F,
): F {
  const content = useContext(SiteContentContext)
  const override = content[section]
  if (!override) return fallback

  const merged = { ...fallback } as Record<string, unknown>
  for (const [key, value] of Object.entries(override as Record<string, unknown>)) {
    // An empty string is an editor clearing a field deliberately; undefined
    // and null are absence. Only absence falls back.
    if (value !== undefined && value !== null) merged[key] = value
  }
  return merged as F
}
