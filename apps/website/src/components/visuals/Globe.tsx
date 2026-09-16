import { useEffect, useRef } from 'react'
import { DEG, rotate, slerp, toVec, type Vec3 } from '@/lib/sphere'

/**
 * Premium enterprise globe.
 *
 * A true 3-D orthographic projection rendered to canvas: a rotating graticule
 * sphere, hub nodes at real coordinates, and great-circle arcs tracing the
 * corridors from the Siliguri delivery floor out to every market we serve,
 * with travelling data pulses.
 *
 * Deliberately geometric rather than photographic — the mark should read as
 * infrastructure, not decoration.
 */

/* ---------------------------------------------------------------- */
/* Network definition — real coordinates                              */
/* ---------------------------------------------------------------- */

const HUBS = [
  { name: 'London', lat: 51.5074, lng: -0.1278, primary: true },
  { name: 'Manchester', lat: 53.4808, lng: -2.2426, primary: false },
  { name: 'Edinburgh', lat: 55.9533, lng: -3.1883, primary: false },
  { name: 'Birmingham', lat: 52.4862, lng: -1.8904, primary: false },
  { name: 'New York', lat: 40.7128, lng: -74.006, primary: true },
  { name: 'Chicago', lat: 41.8781, lng: -87.6298, primary: false },
  { name: 'Sydney', lat: -33.8688, lng: 151.2093, primary: true },
  { name: 'Melbourne', lat: -37.8136, lng: 144.9631, primary: false },
  { name: 'Siliguri', lat: 26.7271, lng: 88.3953, primary: true },
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639, primary: false },
] as const

const hubIndex = (name: (typeof HUBS)[number]['name']) =>
  HUBS.findIndex((h) => h.name === name)

/* Named rather than indexed: the hub list has grown once already, and a pair
   of bare numbers silently points somewhere else the moment it grows again. */
const LINKS: Array<[number, number]> = (
  [
    ['Siliguri', 'London'],
    ['Siliguri', 'Manchester'],
    ['Kolkata', 'Edinburgh'],
    ['Siliguri', 'New York'],
    ['Siliguri', 'Chicago'],
    ['Siliguri', 'Sydney'],
    ['Siliguri', 'Melbourne'],
  ] as const
).map(([a, b]) => [hubIndex(a), hubIndex(b)])

/* ---------------------------------------------------------------- */

interface GlobeProps {
  className?: string
  /** Visual radius as a fraction of the smaller canvas dimension. */
  scale?: number
}

export default function Globe({ className, scale = 0.38 }: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number>(0)
  const visibleRef = useRef(true)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let width = 0
    let height = 0
    let dpr = 1

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = rect.width
      height = rect.height
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const io = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting
      },
      { threshold: 0 },
    )
    io.observe(canvas)

    // Positive tilt brings the northern hemisphere down and toward the
    // viewer, so the corridors land in the visible band rather than riding up
    // behind the header.
    const TILT = 22 * DEG
    const hubVecs = HUBS.map((h) => toVec(h.lat, h.lng))

    /* Pre-compute great-circle sample points so we only slerp once. */
    const ARC_STEPS = 72
    const arcs = LINKS.map(([a, b]) => {
      const pts: Vec3[] = []
      for (let i = 0; i <= ARC_STEPS; i++) {
        const t = i / ARC_STEPS
        const p = slerp(hubVecs[a], hubVecs[b], t)
        // Lift the arc off the surface so it reads as a route, not a coastline.
        const lift = 1 + 0.17 * Math.sin(Math.PI * t)
        pts.push({ x: p.x * lift, y: p.y * lift, z: p.z * lift })
      }
      return pts
    })

    const start = performance.now()

    const draw = (now: number) => {
      rafRef.current = requestAnimationFrame(draw)
      if (!visibleRef.current) return

      const elapsed = (now - start) / 1000
      // 5.5 rad ≈ -44°, which centres the UK ⇄ India corridor — the view the
      // globe rests at when motion is suppressed. With markets now spread
      // across roughly 225° of longitude no single face can show them all, so
      // the globe turns fully: something is always in view, and the Americas
      // and Australia get their turn instead of sitting permanently behind it.
      const BASE_YAW = 5.5
      const ROTATION_PERIOD = 80 // seconds for a full turn
      const yaw = reduced
        ? BASE_YAW
        : BASE_YAW + (elapsed * Math.PI * 2) / ROTATION_PERIOD

      const cx = width / 2
      const cy = height / 2
      const R = Math.min(width, height) * scale

      ctx.clearRect(0, 0, width, height)

      const project = (v: Vec3) => ({
        sx: cx + v.x * R,
        sy: cy - v.y * R,
        z: v.z,
      })

      /* ---- Atmosphere ---- */
      const atmo = ctx.createRadialGradient(cx, cy, R * 0.82, cx, cy, R * 1.55)
      atmo.addColorStop(0, 'rgba(18, 58, 99, 0.42)')
      atmo.addColorStop(0.45, 'rgba(18, 58, 99, 0.12)')
      atmo.addColorStop(1, 'rgba(5, 10, 20, 0)')
      ctx.fillStyle = atmo
      ctx.beginPath()
      ctx.arc(cx, cy, R * 1.55, 0, Math.PI * 2)
      ctx.fill()

      /* ---- Sphere body ---- */
      const body = ctx.createRadialGradient(
        cx - R * 0.34,
        cy - R * 0.4,
        R * 0.08,
        cx,
        cy,
        R,
      )
      body.addColorStop(0, 'rgba(18, 58, 99, 0.58)')
      body.addColorStop(0.55, 'rgba(11, 27, 43, 0.82)')
      body.addColorStop(1, 'rgba(3, 6, 13, 0.95)')
      ctx.fillStyle = body
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.fill()

      /* ---- Graticule ------------------------------------------------
         Drawn as two passes: the far hemisphere faintly (giving the
         sphere real depth), then the near hemisphere over the top.     */

      const drawPolyline = (pts: Vec3[], nearPass: boolean) => {
        ctx.beginPath()
        let pen = false
        for (const p of pts) {
          const q = project(p)
          const isNear = q.z >= 0
          if (isNear !== nearPass) {
            pen = false
            continue
          }
          if (!pen) {
            ctx.moveTo(q.sx, q.sy)
            pen = true
          } else {
            ctx.lineTo(q.sx, q.sy)
          }
        }
        ctx.stroke()
      }

      const meridians: Vec3[][] = []
      for (let lng = -180; lng < 180; lng += 15) {
        const line: Vec3[] = []
        for (let lat = -90; lat <= 90; lat += 3) {
          line.push(rotate(toVec(lat, lng), yaw, TILT))
        }
        meridians.push(line)
      }

      const parallels: Vec3[][] = []
      for (let lat = -75; lat <= 75; lat += 15) {
        const line: Vec3[] = []
        for (let lng = -180; lng <= 180; lng += 3) {
          line.push(rotate(toVec(lat, lng), yaw, TILT))
        }
        parallels.push(line)
      }

      // Far hemisphere
      ctx.lineWidth = 0.6
      ctx.strokeStyle = 'rgba(44, 111, 168, 0.16)'
      for (const m of meridians) drawPolyline(m, false)
      for (const p of parallels) drawPolyline(p, false)

      // Near hemisphere
      ctx.lineWidth = 0.75
      ctx.strokeStyle = 'rgba(44, 111, 168, 0.42)'
      for (const m of meridians) drawPolyline(m, true)
      for (const p of parallels) drawPolyline(p, true)

      // Equator, emphasised
      ctx.lineWidth = 1.1
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.28)'
      drawPolyline(
        Array.from({ length: 121 }, (_, i) =>
          rotate(toVec(0, -180 + i * 3), yaw, TILT),
        ),
        true,
      )

      /* ---- Limb / rim light ---- */
      ctx.lineWidth = 1
      const rim = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R)
      rim.addColorStop(0, 'rgba(234, 242, 250, 0.32)')
      rim.addColorStop(0.5, 'rgba(44, 111, 168, 0.22)')
      rim.addColorStop(1, 'rgba(212, 175, 55, 0.18)')
      ctx.strokeStyle = rim
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.stroke()

      /* ---- Route arcs ---- */
      arcs.forEach((pts, i) => {
        const rotated = pts.map((p) => rotate(p, yaw, TILT))

        ctx.lineWidth = 1.2
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.34)'
        ctx.beginPath()
        let pen = false
        for (const p of rotated) {
          const q = project(p)
          if (q.z < 0) {
            pen = false
            continue
          }
          if (!pen) {
            ctx.moveTo(q.sx, q.sy)
            pen = true
          } else {
            ctx.lineTo(q.sx, q.sy)
          }
        }
        ctx.stroke()

        /* Travelling pulse with a short trail */
        if (!reduced) {
          const cycle = 4.2
          const phase = ((elapsed + i * 1.05) % cycle) / cycle
          const headIdx = Math.floor(phase * ARC_STEPS)
          const TRAIL = 14
          for (let t = 0; t < TRAIL; t++) {
            const idx = headIdx - t
            if (idx < 0) break
            const p = rotated[idx]
            const q = project(p)
            if (q.z < 0) continue
            const fade = (1 - t / TRAIL) ** 2
            ctx.fillStyle = `rgba(232, 204, 116, ${fade * 0.9})`
            ctx.beginPath()
            ctx.arc(q.sx, q.sy, 1.7 * fade + 0.4, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      })

      /* ---- Hub nodes ---- */
      HUBS.forEach((hub, i) => {
        const p = rotate(hubVecs[i], yaw, TILT)
        const q = project(p)
        if (q.z < -0.05) return

        const depth = Math.max(0, Math.min(1, q.z + 0.15))
        const r = hub.primary ? 3.4 : 2.3

        // Halo
        const pulse = reduced
          ? 0.5
          : (Math.sin(elapsed * 1.7 + i * 1.3) + 1) / 2
        const haloR = r + 4 + pulse * (hub.primary ? 9 : 5)
        const halo = ctx.createRadialGradient(q.sx, q.sy, 0, q.sx, q.sy, haloR)
        halo.addColorStop(0, `rgba(212, 175, 55, ${0.34 * depth})`)
        halo.addColorStop(1, 'rgba(212, 175, 55, 0)')
        ctx.fillStyle = halo
        ctx.beginPath()
        ctx.arc(q.sx, q.sy, haloR, 0, Math.PI * 2)
        ctx.fill()

        // Core
        ctx.fillStyle = hub.primary
          ? `rgba(240, 222, 158, ${depth})`
          : `rgba(234, 242, 250, ${0.72 * depth})`
        ctx.beginPath()
        ctx.arc(q.sx, q.sy, r, 0, Math.PI * 2)
        ctx.fill()

        // Label the two anchor hubs — but only when the canvas is wide enough
        // that the text will not run off the edge on a phone.
        if (hub.primary && depth > 0.55 && width > 560) {
          ctx.font =
            '500 10px "IBM Plex Mono", ui-monospace, SFMono-Regular, monospace'
          ctx.fillStyle = `rgba(234, 242, 250, ${0.62 * depth})`
          ctx.fillText(hub.name.toUpperCase(), q.sx + 9, q.sy + 3.5)
        }
      })
    }

    rafRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
      io.disconnect()
    }
  }, [scale])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  )
}
