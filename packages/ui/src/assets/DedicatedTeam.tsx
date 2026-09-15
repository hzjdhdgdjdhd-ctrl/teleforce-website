/* Generated from assets/icons/dedicated-team.svg by scripts/build-assets.mjs.
   Edit the SVG, not this file. */
import type { SVGProps } from 'react'

export const DedicatedTeamAlt = "Three people standing together, representing a dedicated campaign team"

export function DedicatedTeam({
  title,
  ...props
}: SVGProps<SVGSVGElement> & { title?: string }) {
  const label = title ?? DedicatedTeamAlt
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
      <circle cx="24" cy="13" r="6"/><path d="M13 39c0-6.6 4.9-11 11-11s11 4.4 11 11"/><circle cx="9" cy="19" r="4.5"/><path d="M2 38c0-4.7 3.1-7.6 7-7.6"/><circle cx="39" cy="19" r="4.5"/><path d="M46 38c0-4.7-3.1-7.6-7-7.6"/>
    </svg>
  )
}
