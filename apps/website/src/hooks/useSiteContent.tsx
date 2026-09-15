import { useEffect, useState, type ReactNode } from 'react'
import { fetchPublishedContent, type SiteContent } from '@teleforce/data'
import { SiteContentContext } from './siteContentContext'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/**
 * Supplies published CMS overrides.
 *
 * The site renders its shipped copy immediately and applies overrides when
 * they arrive. A page that waits for a network round trip before showing
 * anything shows nothing when the network is slow, and this is the front door.
 */
export function SiteContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<SiteContent>({})

  useEffect(() => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return
    const controller = new AbortController()
    void fetchPublishedContent(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      controller.signal,
    ).then(setContent)
    return () => controller.abort()
  }, [])

  return (
    <SiteContentContext.Provider value={content}>
      {children}
    </SiteContentContext.Provider>
  )
}
