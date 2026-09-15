/* Generated from assets/icons/appointment.svg by scripts/build-assets.mjs.
   Edit the SVG, not this file. */
import type { SVGProps } from 'react'

export const AppointmentAlt = "A calendar with a tick, representing a booked appointment"

export function Appointment({
  title,
  ...props
}: SVGProps<SVGSVGElement> & { title?: string }) {
  const label = title ?? AppointmentAlt
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
      <rect x="7" y="10" width="34" height="32" rx="3"/><path d="M7 19h34M16 6v8M32 6v8"/><path d="m18 30 4 4 8-9"/>
    </svg>
  )
}
