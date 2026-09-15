/* Generated from assets/backgrounds/hero-grid.svg by scripts/build-assets.mjs.
   Edit the SVG, not this file. */
import type { SVGProps } from 'react'

export const HeroGridAlt = ""

export function HeroGrid({
  title,
  ...props
}: SVGProps<SVGSVGElement> & { title?: string }) {
  const label = title ?? HeroGridAlt
  return (
    <svg
      viewBox="0 0 800 400"
      xmlns="http://www.w3.org/2000/svg"
      role={label ? 'img' : 'presentation'}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      {...props}
    >
      {label ? <title>{label}</title> : null}
      <defs><linearGradient x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2C6FA8" stop-opacity="0.22"/><stop offset="100%" stop-color="#2C6FA8" stop-opacity="0"/></linearGradient><pattern width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0v40" fill="none" stroke="url(#hgFade)" stroke-width="1"/></pattern></defs><rect width="800" height="400" fill="url(#hgCells)"/>
    </svg>
  )
}
