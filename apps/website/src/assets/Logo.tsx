/**
 * TELEFORCE logo lockup.
 *
 * Faithful vector reconstruction of the supplied artwork: the "O" of TELEFORCE
 * is replaced by a ringed globe, "TELEF" sits in deep indigo, "RCE" in royal
 * blue, with the letter-spaced descriptor beneath.
 *
 * Two variants ship:
 *   `primary`  — the artwork exactly as supplied, for light backgrounds.
 *   `reversed` — identical geometry with the deep-indigo letterforms lifted to
 *                Pearl White so the mark stays legible on Obsidian Black.
 *                Standard practice for a dark-UI brand system; the globe and
 *                the royal-blue letterforms are untouched.
 */

/* Palette sampled from the supplied artwork */
const INK = '#1A2B8F' // deep indigo — "TELEF"
const ROYAL = '#2C6BE6' // royal blue — "RCE", ring
const SUB = '#5B8FD6' // descriptor
const PEARL = '#EAF2FA'

/**
 * NOTE: the supplied artwork reads "SYETEMS & SERVICES".
 * That is reproduced verbatim below, as requested. If it is a typo for
 * "SYSTEMS", change this one constant and it updates everywhere.
 */
export const DESCRIPTOR = 'SYSTEMS & SERVICES'

type Variant = 'primary' | 'reversed'

interface LogoProps {
  variant?: Variant
  className?: string
  /** Hide the descriptor line for tight placements (e.g. a condensed nav). */
  showDescriptor?: boolean
  title?: string
}

/* ------------------------------------------------------------------ */
/* The globe mark — also usable standalone                             */
/* ------------------------------------------------------------------ */

export function GlobeMark({
  className,
  idPrefix = 'tf',
}: {
  className?: string
  idPrefix?: string
}) {
  const sphere = `${idPrefix}-sphere`
  const clip = `${idPrefix}-clip`
  const ringGrad = `${idPrefix}-ring`

  return (
    <svg viewBox="-56 -44 112 88" className={className} role="presentation">
      <defs>
        <radialGradient id={sphere} cx="34%" cy="28%" r="78%">
          <stop offset="0%" stopColor="#6AA6F7" />
          <stop offset="48%" stopColor="#2C6BE6" />
          <stop offset="100%" stopColor="#15328F" />
        </radialGradient>
        <linearGradient id={ringGrad} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6AA6F7" />
          <stop offset="55%" stopColor={ROYAL} />
          <stop offset="100%" stopColor="#15328F" />
        </linearGradient>
        {/* Everything outside the sphere — used to show the ring's far half */}
        <clipPath id={clip}>
          <path d="M-56,-44 H56 V44 H-56 Z M0,-31 A31,31 0 1,1 0,31 A31,31 0 1,1 0,-31 Z" />
        </clipPath>
      </defs>

      {/* Ring — far half, behind the sphere */}
      <g clipPath={`url(#${clip})`}>
        <ellipse
          cx="0"
          cy="0"
          rx="47"
          ry="15"
          fill="none"
          stroke={`url(#${ringGrad})`}
          strokeWidth="5"
          transform="rotate(-22)"
          opacity="0.75"
        />
      </g>

      {/* Sphere */}
      <circle cx="0" cy="0" r="31" fill={`url(#${sphere})`} />

      {/* Graticule */}
      <g fill="none" stroke="#BFD9FF" strokeWidth="1.6" opacity="0.5">
        <ellipse cx="0" cy="0" rx="31" ry="11" />
        <ellipse cx="0" cy="0" rx="12" ry="31" />
        <ellipse cx="0" cy="0" rx="25.5" ry="31" />
      </g>

      {/* Specular highlight */}
      <ellipse cx="-11" cy="-13" rx="9" ry="6" fill="#FFFFFF" opacity="0.28" transform="rotate(-28 -11 -13)" />

      {/* Ring — near half, drawn over the sphere */}
      <path
        d="M -43.6,17.6 A 47,15 0 0 0 43.6,-17.6"
        fill="none"
        stroke={`url(#${ringGrad})`}
        strokeWidth="5"
        strokeLinecap="round"
        transform="rotate(-22)"
      />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Full lockup                                                         */
/* ------------------------------------------------------------------ */

export function Logo({
  variant = 'reversed',
  className,
  showDescriptor = true,
  title = 'Teleforce — Systems & Services',
}: LogoProps) {
  const inkColor = variant === 'reversed' ? PEARL : INK
  const subColor = variant === 'reversed' ? 'rgba(234,242,250,0.62)' : SUB
  const uid = variant

  const wordFont =
    '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif'

  return (
    <svg
      viewBox="-206 -58 352 128"
      className={className}
      role="img"
      aria-label={title}
      overflow="visible"
    >
      <title>{title}</title>
      <defs>
        <radialGradient id={`${uid}-sphere`} cx="34%" cy="28%" r="78%">
          <stop offset="0%" stopColor="#6AA6F7" />
          <stop offset="48%" stopColor="#2C6BE6" />
          <stop offset="100%" stopColor="#15328F" />
        </radialGradient>
        <linearGradient id={`${uid}-ring`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6AA6F7" />
          <stop offset="55%" stopColor={ROYAL} />
          <stop offset="100%" stopColor="#15328F" />
        </linearGradient>
        <clipPath id={`${uid}-clip`}>
          <path d="M-206,-58 H146 V70 H-206 Z M0,-31 A31,31 0 1,1 0,31 A31,31 0 1,1 0,-31 Z" />
        </clipPath>
      </defs>

      {/* --- TELEF --- */}
      <text
        x="-34"
        y="22"
        textAnchor="end"
        fontFamily={wordFont}
        fontWeight="800"
        fontSize="62"
        letterSpacing="-1"
        fill={inkColor}
      >
        TELEF
      </text>

      {/* --- Globe standing in for the O --- */}
      <g clipPath={`url(#${uid}-clip)`}>
        <ellipse
          cx="0"
          cy="0"
          rx="47"
          ry="15"
          fill="none"
          stroke={`url(#${uid}-ring)`}
          strokeWidth="5"
          transform="rotate(-22)"
          opacity="0.75"
        />
      </g>
      <circle cx="0" cy="0" r="31" fill={`url(#${uid}-sphere)`} />
      <g fill="none" stroke="#BFD9FF" strokeWidth="1.6" opacity="0.5">
        <ellipse cx="0" cy="0" rx="31" ry="11" />
        <ellipse cx="0" cy="0" rx="12" ry="31" />
        <ellipse cx="0" cy="0" rx="25.5" ry="31" />
      </g>
      <ellipse cx="-11" cy="-13" rx="9" ry="6" fill="#FFFFFF" opacity="0.28" transform="rotate(-28 -11 -13)" />
      <path
        d="M -43.6,17.6 A 47,15 0 0 0 43.6,-17.6"
        fill="none"
        stroke={`url(#${uid}-ring)`}
        strokeWidth="5"
        strokeLinecap="round"
        transform="rotate(-22)"
      />

      {/* --- RCE --- */}
      <text
        x="34"
        y="22"
        textAnchor="start"
        fontFamily={wordFont}
        fontWeight="800"
        fontSize="62"
        letterSpacing="-1"
        fill={ROYAL}
      >
        RCE
      </text>

      {/* --- Descriptor --- */}
      {showDescriptor && (
        <text
          x="-30"
          y="56"
          textAnchor="middle"
          fontFamily={wordFont}
          fontWeight="500"
          fontSize="15.5"
          letterSpacing="5.4"
          fill={subColor}
        >
          {DESCRIPTOR}
        </text>
      )}
    </svg>
  )
}
