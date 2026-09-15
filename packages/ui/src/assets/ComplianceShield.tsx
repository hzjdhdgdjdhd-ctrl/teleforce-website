/* Generated from assets/icons/compliance-shield.svg by scripts/build-assets.mjs.
   Edit the SVG, not this file. */
import type { SVGProps } from 'react'

export const ComplianceShieldAlt = "A shield containing a tick, indicating a passed compliance check"

export function ComplianceShield({
  title,
  ...props
}: SVGProps<SVGSVGElement> & { title?: string }) {
  const label = title ?? ComplianceShieldAlt
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
      <path d="M24 4 40 10v13c0 10.2-6.7 18.3-16 21-9.3-2.7-16-10.8-16-21V10Z"/><path d="m17 23.5 5 5 9.5-10"/>
    </svg>
  )
}
