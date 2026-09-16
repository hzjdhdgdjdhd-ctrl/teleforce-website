import { useId, useMemo } from 'react'
import { centreOn, rotate, toVec, type Vec3 } from '@/lib/sphere'
import { cn } from '@/lib/cn'

/**
 * A market mark: the globe turned so one country faces the viewer dead centre.
 *
 * The same orthographic projection as the hero globe, rendered as static SVG
 * rather than an animated canvas — three of these sit on the page at once and
 * none of them needs a render loop to make its point. The graticule therefore
 * differs honestly between markets: the pole sits high over Britain, low over
 * Australia, and the gold equator crosses where it actually crosses.
 */

const R = 46
const C = 60
const VIEW = 120

interface RegionGlobeProps {
  lat: number
  lng: number
  className?: string
}

/** Project a rotated vector, keeping the z depth for hemisphere clipping. */
function project(v: Vec3) {
  return { x: C + v.x * R, y: C - v.y * R, z: v.z }
}

/**
 * Near-hemisphere path data for a polyline, broken wherever the line passes
 * behind the sphere. Returning one `d` string rather than many elements keeps
 * the DOM small enough to put three of these in a grid without thinking twice.
 */
function nearPath(points: Vec3[]): string {
  let d = ''
  let pen = false
  for (const p of points) {
    const q = project(p)
    if (q.z < 0) {
      pen = false
      continue
    }
    d += `${pen ? 'L' : 'M'}${q.x.toFixed(2)} ${q.y.toFixed(2)}`
    pen = true
  }
  return d
}

export default function RegionGlobe({ lat, lng, className }: RegionGlobeProps) {
  const uid = useId().replace(/:/g, '')

  const { meridians, parallels, equator } = useMemo(() => {
    const { yaw, tilt } = centreOn(lat, lng)
    const spin = (latDeg: number, lngDeg: number) =>
      rotate(toVec(latDeg, lngDeg), yaw, tilt)

    const mer: string[] = []
    for (let l = -180; l < 180; l += 20) {
      const line: Vec3[] = []
      for (let a = -90; a <= 90; a += 4) line.push(spin(a, l))
      const d = nearPath(line)
      if (d) mer.push(d)
    }

    const par: string[] = []
    for (let a = -60; a <= 60; a += 20) {
      if (a === 0) continue // the equator is drawn separately, in gold
      const line: Vec3[] = []
      for (let l = -180; l <= 180; l += 4) line.push(spin(a, l))
      const d = nearPath(line)
      if (d) par.push(d)
    }

    const eq: Vec3[] = []
    for (let l = -180; l <= 180; l += 4) eq.push(spin(0, l))

    return { meridians: mer, parallels: par, equator: nearPath(eq) }
  }, [lat, lng])

  return (
    <svg
      viewBox={`0 0 ${VIEW} ${VIEW}`}
      className={cn('overflow-visible', className)}
      aria-hidden="true"
      role="presentation"
    >
      <defs>
        <radialGradient id={`${uid}-body`} cx="34%" cy="30%" r="78%">
          <stop offset="0%" stopColor="#123A63" stopOpacity="0.62" />
          <stop offset="58%" stopColor="#0B1B2B" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#03060D" stopOpacity="0.96" />
        </radialGradient>
        <linearGradient id={`${uid}-rim`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#EAF2FA" stopOpacity="0.34" />
          <stop offset="55%" stopColor="#2C6FA8" stopOpacity="0.24" />
          <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.2" />
        </linearGradient>
        <radialGradient id={`${uid}-atmo`} cx="50%" cy="50%" r="50%">
          <stop offset="62%" stopColor="#123A63" stopOpacity="0" />
          <stop offset="82%" stopColor="#123A63" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#123A63" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx={C} cy={C} r={R * 1.3} fill={`url(#${uid}-atmo)`} />
      <circle cx={C} cy={C} r={R} fill={`url(#${uid}-body)`} />

      <g fill="none" stroke="#2C6FA8" strokeOpacity="0.38" strokeWidth="0.5">
        {meridians.map((d) => (
          <path key={d} d={d} />
        ))}
        {parallels.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>

      <path
        d={equator}
        fill="none"
        stroke="#D4AF37"
        strokeOpacity="0.3"
        strokeWidth="0.8"
      />

      <circle
        cx={C}
        cy={C}
        r={R}
        fill="none"
        stroke={`url(#${uid}-rim)`}
        strokeWidth="0.8"
      />

      {/* The market itself, at the exact centre by construction */}
      <circle
        cx={C}
        cy={C}
        r="6"
        fill="#D4AF37"
        fillOpacity="0.22"
        className="animate-pulse-ring origin-center"
        style={{ transformBox: 'fill-box' }}
      />
      <circle cx={C} cy={C} r="2.6" fill="#E8CC74" />
    </svg>
  )
}
