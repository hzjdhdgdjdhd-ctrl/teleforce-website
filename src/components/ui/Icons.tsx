/**
 * Line icons drawn on a 24×24 grid with a 1.25 stroke — deliberately
 * schematic rather than illustrative, to match the technical register of
 * the rest of the system.
 */

export type IconProps = { className?: string; size?: number }

function Svg({
  children,
  className,
  size = 22,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export const IconHeadset = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
    <rect x="2.5" y="13" width="4" height="6" rx="1.4" />
    <rect x="17.5" y="13" width="4" height="6" rx="1.4" />
    <path d="M19.5 19v.8a2.7 2.7 0 0 1-2.7 2.7H13" />
  </Svg>
)

export const IconLayers = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 2.6 21.4 7 12 11.4 2.6 7 12 2.6Z" />
    <path d="m2.6 12 9.4 4.4 9.4-4.4" />
    <path d="m2.6 17 9.4 4.4 9.4-4.4" />
  </Svg>
)

export const IconPipeline = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 5h18M3 12h12M3 19h6" />
    <circle cx="19" cy="12" r="2.2" />
    <circle cx="13" cy="19" r="2.2" />
  </Svg>
)

export const IconLedger = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4" y="2.8" width="16" height="18.4" rx="1.6" />
    <path d="M8 8h8M8 12h8M8 16h5" />
  </Svg>
)

export const IconTerminal = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2.4" y="4" width="19.2" height="16" rx="1.8" />
    <path d="m7 10 2.6 2.4L7 14.8M12.6 15h4.4" />
  </Svg>
)

export const IconShieldCheck = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 2.6 20 6v6c0 4.7-3.3 8.4-8 9.4-4.7-1-8-4.7-8-9.4V6l8-3.4Z" />
    <path d="m8.8 12 2.2 2.2 4.2-4.4" />
  </Svg>
)

export const IconMonitor = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2.4" y="3.4" width="19.2" height="13.2" rx="1.8" />
    <path d="M8.5 21h7M12 16.6V21" />
  </Svg>
)

export const IconServer = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="3.4" width="18" height="7" rx="1.6" />
    <rect x="3" y="13.6" width="18" height="7" rx="1.6" />
    <path d="M7 7h.01M7 17.1h.01" />
  </Svg>
)

export const IconUsers = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="9" cy="7.6" r="3.6" />
    <path d="M2.6 20.4c0-3.8 2.9-6.4 6.4-6.4s6.4 2.6 6.4 6.4" />
    <path d="M16.6 4.4a3.6 3.6 0 0 1 0 6.9M18 14.4c2.1.7 3.4 2.6 3.4 5.2" />
  </Svg>
)

export const IconNodes = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="4.4" r="2.2" />
    <circle cx="4.6" cy="18" r="2.2" />
    <circle cx="19.4" cy="18" r="2.2" />
    <path d="M10.4 6.2 6.2 16.2M13.6 6.2l4.2 10M6.8 18h10.4" />
  </Svg>
)
