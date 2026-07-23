/**
 * Deterministic identity swirl fill (Module 4.x). Same raster is used for Konva inner border and sidebar preview.
 * Colors come only from `ResolvedIdentity` via `getSwirlStopsFromResolvedIdentity`.
 */

import type { ResolvedIdentity } from './colorAuthority'
import { blendHex } from './colorAuthority'

/** Authoritative raster resolution; pattern is scaled to layout bounds (preview + export stay aligned). */
export const IDENTITY_SWIRL_RASTER_PX = 512

/** Radial twist strength (deterministic, no randomness). */
const SWIRL_TURNS = 1.05
/** Radial weighting so the pattern tightens toward corners without muddy collapse. */
const SWIRL_RADIAL_CURVE = 1.25
/** Secondary harmonic mix for extra band motion without atan2 seams. */
const SWIRL_HARMONIC2 = 0.34
const SWIRL_PHI2_SCALE = 1.12

export function getSwirlStopsFromResolvedIdentity(resolved: ResolvedIdentity): string[] {
  if (resolved.kind === 'solid') {
    const b = resolved.fill
    return [blendHex(b, '#ffffff', 0.2), b, blendHex(b, '#000000', 0.22)]
  }
  if (resolved.kind === 'gradient') {
    return [resolved.top, blendHex(resolved.top, resolved.bottom, 0.5), resolved.bottom]
  }
  if (resolved.stops.length === 1) {
    const b = resolved.stops[0]
    return [blendHex(b, '#ffffff', 0.2), b, blendHex(b, '#000000', 0.22)]
  }
  return [...resolved.stops]
}

function hexToRgb01(hex: string): { r: number; g: number; b: number } {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  const v = m ? parseInt(m[1], 16) : 0
  return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 }
}

const smoothstep01 = (x: number) => x * x * (3 - 2 * x)

function sampleStopRgb(stops: { r: number; g: number; b: number }[], t: number) {
  const n = stops.length
  if (n === 0) return { r: 0, g: 0, b: 0 }
  if (n === 1) return stops[0]
  let tt = t % 1
  if (tt < 0) tt += 1
  const span = (n - 1) * tt
  const i = Math.min(Math.floor(span), n - 2)
  const f = smoothstep01(span - i)
  const a = stops[i]
  const b = stops[i + 1]
  return {
    r: a.r + (b.r - a.r) * f,
    g: a.g + (b.g - a.g) * f,
    b: a.b + (b.b - a.b) * f,
  }
}

function averageStopRgb(stops: { r: number; g: number; b: number }[]) {
  if (stops.length === 0) return { r: 0, g: 0, b: 0 }
  let r = 0
  let g = 0
  let b = 0
  for (const s of stops) {
    r += s.r
    g += s.g
    b += s.b
  }
  const n = stops.length
  return { r: r / n, g: g / n, b: b / n }
}

export function renderIdentitySwirlToCanvas(opts: {
  width: number
  height: number
  stops: string[]
}): HTMLCanvasElement {
  const { width, height, stops } = opts
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  if (stops.length === 0) return canvas
  const rgbStops = stops.map(hexToRgb01)
  const centerRgb = averageStopRgb(rgbStops)
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  const img = ctx.createImageData(width, height)
  const d = img.data
  const maxD = Math.max(width, height)
  const eps = 1e-7
  let p = 0
  for (let iy = 0; iy < height; iy++) {
    for (let ix = 0; ix < width; ix++) {
      const u = (ix + 0.5) / width
      const v = (iy + 0.5) / height
      const ax = (u - 0.5) * 2 * (width / maxD)
      const ay = (v - 0.5) * 2 * (height / maxD)
      const rPhys = Math.hypot(ax, ay)
      const rNorm = Math.min(1, rPhys / Math.SQRT2)
      const phi =
        Math.PI * 2 * SWIRL_TURNS * SWIRL_RADIAL_CURVE * rNorm * (0.35 + 0.65 * rNorm)

      let spiral: number
      if (rPhys < eps) {
        spiral = 0.5
      } else {
        const inv = 1 / rPhys
        const sinT = ay * inv
        const cosT = ax * inv
        // sin(θ+φ) and sin(2θ+φ₂): continuous everywhere (no atan2 branch cut).
        const s1 = sinT * Math.cos(phi) + cosT * Math.sin(phi)
        const sin2T = 2 * sinT * cosT
        const cos2T = cosT * cosT - sinT * sinT
        const phi2 = phi * SWIRL_PHI2_SCALE
        const s2 = sin2T * Math.cos(phi2) + cos2T * Math.sin(phi2)
        const blend = (1 - SWIRL_HARMONIC2) * s1 + SWIRL_HARMONIC2 * s2
        spiral = (blend + 1) * 0.5
      }

      const { r: rr, g: gg, b: bb } =
        rPhys < eps ? centerRgb : sampleStopRgb(rgbStops, spiral)
      d[p] = rr
      d[p + 1] = gg
      d[p + 2] = bb
      d[p + 3] = 255
      p += 4
    }
  }
  ctx.putImageData(img, 0, 0)
  return canvas
}

const swirlCache = new Map<string, HTMLCanvasElement>()
const CACHE_CAP = 48

export function getIdentitySwirlPatternCanvas(width: number, height: number, stops: string[]): HTMLCanvasElement {
  const key = `${width}x${height}:v2:${stops.map((s) => s.toLowerCase()).join(',')}`
  const hit = swirlCache.get(key)
  if (hit) return hit
  const c = renderIdentitySwirlToCanvas({ width, height, stops })
  if (swirlCache.size >= CACHE_CAP) {
    const first = swirlCache.keys().next().value
    if (first !== undefined) swirlCache.delete(first)
  }
  swirlCache.set(key, c)
  return c
}
