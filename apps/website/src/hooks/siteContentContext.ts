import { createContext } from 'react'
import type { SiteContent } from '@teleforce/data'

/**
 * Published CMS overrides for the public site.
 *
 * Separate from the provider component so that file exports components only
 * and React Fast Refresh keeps working.
 */
export const SiteContentContext = createContext<SiteContent>({})
