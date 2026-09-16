/**
 * Orthographic sphere projection.
 *
 * Shared by the hero globe (canvas) and the per-market marks (SVG) so the two
 * cannot drift apart: both place a node at a real latitude and longitude using
 * the same maths, which is the only reason a small disc reads as the same
 * planet as the big one.
 */

export type Vec3 = { x: number; y: number; z: number }

export const DEG = Math.PI / 180

/** Unit vector for a geographic coordinate. +z faces the viewer at yaw 0. */
export function toVec(latDeg: number, lngDeg: number): Vec3 {
  const lat = latDeg * DEG
  const lng = lngDeg * DEG
  return {
    x: Math.cos(lat) * Math.sin(lng),
    y: Math.sin(lat),
    z: Math.cos(lat) * Math.cos(lng),
  }
}

/** Yaw about the polar axis, then a fixed tilt toward the viewer. */
export function rotate(v: Vec3, yaw: number, tilt: number): Vec3 {
  const cy = Math.cos(yaw)
  const sy = Math.sin(yaw)
  const x1 = v.x * cy + v.z * sy
  const z1 = -v.x * sy + v.z * cy

  const ct = Math.cos(tilt)
  const st = Math.sin(tilt)
  const y2 = v.y * ct - z1 * st
  const z2 = v.y * st + z1 * ct

  return { x: x1, y: y2, z: z2 }
}

/** Spherical linear interpolation — gives a true great-circle path. */
export function slerp(a: Vec3, b: Vec3, t: number): Vec3 {
  let dot = a.x * b.x + a.y * b.y + a.z * b.z
  dot = Math.max(-1, Math.min(1, dot))
  const omega = Math.acos(dot)
  if (omega < 1e-6) return a
  const s = Math.sin(omega)
  const w1 = Math.sin((1 - t) * omega) / s
  const w2 = Math.sin(t * omega) / s
  return {
    x: a.x * w1 + b.x * w2,
    y: a.y * w1 + b.y * w2,
    z: a.z * w1 + b.z * w2,
  }
}

/**
 * Yaw and tilt that bring a coordinate to the exact centre of the disc.
 *
 * Derivation: yawing by -lng zeroes the x component, leaving the point at
 * (0, sin lat, cos lat); tilting by lat then zeroes y as well, so the point
 * lands on the +z axis — dead centre, facing the viewer.
 */
export function centreOn(latDeg: number, lngDeg: number) {
  return { yaw: -lngDeg * DEG, tilt: latDeg * DEG }
}
