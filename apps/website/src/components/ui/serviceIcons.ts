import type { ReactElement } from 'react'
import type { IconProps } from './Icons'
import {
  IconHeadset,
  IconLayers,
  IconLedger,
  IconPipeline,
  IconShieldCheck,
  IconTerminal,
} from './Icons'

/**
 * Icon lookup keyed by the service ids in data/services.ts.
 *
 * Kept out of Icons.tsx so that file exports components only — otherwise
 * React Fast Refresh cannot hot-reload the icon set during development.
 */
export const serviceIcons: Record<string, (p: IconProps) => ReactElement> = {
  'customer-operations': IconHeadset,
  'back-office': IconLayers,
  'sales-operations': IconPipeline,
  'finance-admin': IconLedger,
  'technical-support': IconTerminal,
  'quality-assurance': IconShieldCheck,
}
