/* Generated from assets/icons/hard-phone.svg by scripts/build-assets.mjs.
   Edit the SVG, not this file. */
import type { SVGProps } from 'react'

export const HardPhoneAlt = "A desk IP telephone with a keypad and handset cradle"

export function HardPhone({
  title,
  ...props
}: SVGProps<SVGSVGElement> & { title?: string }) {
  const label = title ?? HardPhoneAlt
  return (
    <svg
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      role={label ? 'img' : 'presentation'}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      {...props}
    >
      {label ? <title>{label}</title> : null}
      <path d="M10 14a3 3 0 0 1 3-3h22a3 3 0 0 1 3 3v24a3 3 0 0 1-3 3H13a3 3 0 0 1-3-3Z"/><rect x="14" y="15" width="20" height="8" rx="1"/><path d="M17 28h3M24 28h3M31 28h3M17 33h3M24 33h3M31 33h3"/><path d="M38 17h3a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3h-3"/><path d="M4 12v-1a3 3 0 0 1 3-3h3"/>
    </svg>
  )
}
