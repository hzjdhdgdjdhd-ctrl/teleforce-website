import { useContext } from 'react'
import type { SiteContent } from '@teleforce/data'
import { SiteContentContext } from './siteContentContext'

/**
 * Read one section, falling back to the shipped copy field by field.
 *
 * Merging per field rather than per section means an editor who sets only a
 * headline does not blank the lede underneath it.
 */
export function useSection<
  K extends keyof SiteContent,
  F extends NonNullable<SiteContent[K]>,
>(section: K, fallback: F): F {
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
