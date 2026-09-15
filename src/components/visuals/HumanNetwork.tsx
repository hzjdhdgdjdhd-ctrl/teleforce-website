import { motion, useReducedMotion } from 'framer-motion'

/**
 * Human silhouettes joined by connection lines.
 *
 * The visual argument of the whole brand: the network is made of people, and
 * the lines between them are the delivery. Figures sit on a gentle arc so the
 * group reads as a team facing the same direction rather than a grid of icons.
 */

/** A single stylised person glyph, drawn in a 24×24 box. */
const PERSON_PATH =
  'M12 2.8a4.3 4.3 0 1 1 0 8.6 4.3 4.3 0 0 1 0-8.6Zm0 10.1c5.5 0 9.6 3.6 9.6 9.4H2.4c0-5.8 4.1-9.4 9.6-9.4Z'

type Figure = {
  x: number
  y: number
  s: number
  o: number
  /** Marks the anchor figures that carry the gold accent. */
  key?: boolean
}

const FIGURES: Figure[] = [
  { x: 16, y: 104, s: 0.52, o: 0.18 },
  { x: 84, y: 94, s: 0.62, o: 0.26 },
  { x: 154, y: 84, s: 0.72, o: 0.36 },
  { x: 228, y: 72, s: 0.82, o: 0.48 },
  { x: 304, y: 60, s: 0.9, o: 0.62, key: true },
  { x: 380, y: 52, s: 1, o: 0.88 },
  { x: 456, y: 60, s: 0.9, o: 0.62, key: true },
  { x: 532, y: 72, s: 0.82, o: 0.48 },
  { x: 606, y: 84, s: 0.72, o: 0.36 },
  { x: 676, y: 94, s: 0.62, o: 0.26 },
  { x: 744, y: 104, s: 0.52, o: 0.18 },
]

/** Index pairs describing which figures are linked. */
const EDGES: Array<[number, number]> = [
  // The spine — every neighbour joined
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5],
  [5, 6], [6, 7], [7, 8], [8, 9], [9, 10],
  // Longer ties, so the group reads as a network rather than a queue
  [3, 5], [5, 7], [2, 4], [6, 8], [4, 6],
]

interface HumanNetworkProps {
  className?: string
}

export default function HumanNetwork({ className }: HumanNetworkProps) {
  const reduced = useReducedMotion()

  return (
    <svg
      viewBox="0 0 760 150"
      className={className}
      fill="none"
      aria-hidden="true"
      preserveAspectRatio="xMidYMax meet"
    >
      <defs>
        <linearGradient id="hn-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#123A63" stopOpacity="0" />
          <stop offset="18%" stopColor="#2C6FA8" stopOpacity="0.7" />
          <stop offset="50%" stopColor="#D4AF37" stopOpacity="0.85" />
          <stop offset="82%" stopColor="#2C6FA8" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#123A63" stopOpacity="0" />
        </linearGradient>

        <linearGradient id="hn-person" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EAF2FA" />
          <stop offset="100%" stopColor="#2C6FA8" />
        </linearGradient>

        <linearGradient id="hn-person-key" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8CC74" />
          <stop offset="100%" stopColor="#9A7C21" />
        </linearGradient>

        <filter id="hn-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ---- Connection lines ---- */}
      <g stroke="url(#hn-line)" strokeWidth="1">
        {EDGES.map(([a, b], i) => {
          const p1 = FIGURES[a]
          const p2 = FIGURES[b]
          // Bow each link slightly so overlapping edges stay readable.
          const mx = (p1.x + p2.x) / 2
          const my = (p1.y + p2.y) / 2 - Math.abs(p1.x - p2.x) * 0.12
          const d = `M ${p1.x} ${p1.y} Q ${mx} ${my} ${p2.x} ${p2.y}`

          return (
            <motion.path
              key={`${a}-${b}`}
              d={d}
              initial={reduced ? undefined : { pathLength: 0, opacity: 0 }}
              whileInView={reduced ? undefined : { pathLength: 1, opacity: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{
                duration: 1.4,
                delay: 0.25 + i * 0.09,
                ease: [0.22, 1, 0.36, 1],
              }}
            />
          )
        })}
      </g>

      {/* ---- Travelling pulses along the spine ---- */}
      {!reduced &&
        [0, 1, 2].map((n) => (
          <motion.circle
            key={n}
            r="2.1"
            fill="#E8CC74"
            filter="url(#hn-glow)"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0] }}
            transition={{
              duration: 4.5,
              delay: n * 1.5,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            <animateMotion
              dur="4.5s"
              begin={`${n * 1.5}s`}
              repeatCount="indefinite"
              path="M 16 104 C 120 62, 250 48, 380 52 C 510 48, 640 62, 744 104"
            />
          </motion.circle>
        ))}

      {/* ---- Figures ---- */}
      {FIGURES.map((f, i) => (
        <motion.g
          key={i}
          initial={reduced ? undefined : { opacity: 0, y: 14 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{
            duration: 0.7,
            delay: i * 0.07,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {/* Node marker sitting at the figure's connection point */}
          <circle cx={f.x} cy={f.y} r="2.4" fill="#D4AF37" opacity={f.o * 0.9} />
          {f.key && (
            <circle
              cx={f.x}
              cy={f.y}
              r="6"
              fill="none"
              stroke="#D4AF37"
              strokeWidth="0.7"
              opacity={f.o * 0.4}
            />
          )}

          {/* The person, standing above their node */}
          <g
            transform={`translate(${f.x - 12 * f.s} ${f.y - 30 * f.s}) scale(${f.s})`}
            opacity={f.o}
          >
            <path
              d={PERSON_PATH}
              fill={f.key ? 'url(#hn-person-key)' : 'url(#hn-person)'}
            />
          </g>
        </motion.g>
      ))}

      {/* ---- Ground line ---- */}
      <motion.line
        x1="0"
        y1="126"
        x2="760"
        y2="126"
        stroke="#123A63"
        strokeWidth="1"
        strokeOpacity="0.5"
        initial={reduced ? undefined : { pathLength: 0 }}
        whileInView={reduced ? undefined : { pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  )
}
