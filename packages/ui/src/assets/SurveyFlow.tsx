/* Generated from assets/diagrams/survey-flow.svg by scripts/build-assets.mjs.
   Edit the SVG, not this file. */
import type { SVGProps } from 'react'

export const SurveyFlowAlt = "A flow diagram showing one question branching into three outcomes before reaching a completion mark"

export function SurveyFlow({
  title,
  ...props
}: SVGProps<SVGSVGElement> & { title?: string }) {
  const label = title ?? SurveyFlowAlt
  return (
    <svg
      viewBox="0 0 320 180"
      xmlns="http://www.w3.org/2000/svg"
      role={label ? 'img' : 'presentation'}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      {...props}
    >
      {label ? <title>{label}</title> : null}
      <rect x="8" y="76" width="62" height="28" rx="2"/><path d="M70 90h28"/><path d="M126 68 154 90l-28 22-28-22Z"/><path d="M154 90h28M126 112v26h28M126 68V42h28"/><rect x="182" y="76" width="62" height="28" rx="2"/><rect x="154" y="28" width="62" height="28" rx="2"/><rect x="154" y="124" width="62" height="28" rx="2"/><path d="M244 90h20M264 84v12"/><circle cx="288" cy="90" r="12"/><path d="m283 90 3.5 3.5 6.5-7"/>
    </svg>
  )
}
