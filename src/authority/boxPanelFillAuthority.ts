/**
 * Optional single-base “box coloring” treatment (name / type / rules / P/T panels).
 * Linear modes use a very light tint → boosted-saturation rich tone of the same hue; diagonal is TL→BR linear;
 * swirl is a deterministic single-hue procedural tile (`BOX_PANEL_SWIRL_ALGO_ID`) scaled via `buildBoxPanelSwirlFillSurface`.
 * High-res export rasterizes the same Konva tree as preview, using these helpers — no separate export swirl path.
 */

import { blendHex } from './colorAuthority'
import {
  createPanelTexturePattern,
  isPanelTextureBackground,
  resolvePanelBackgroundContrastHex,
} from './panelBackgroundAuthority'
import {
  resolveReadableInkOnPanel,
  resolveReadableInkOnPanelSamples,
} from '../utils/rulesPanelColor'

export type BoxColorGradientDirection = 'vertical' | 'horizontal' | 'diagonal' | 'swirl'

/** Phase 13.2 — single source for Panel Gradients direction values, order, and UI labels. */
export const BOX_PANEL_GRADIENT_DIRECTION_OPTIONS: ReadonlyArray<{
  value: BoxColorGradientDirection
  label: string
}> = [
  { value: 'vertical', label: 'Vertical' },
  { value: 'horizontal', label: 'Horizontal' },
  { value: 'diagonal', label: 'Diagonal' },
  { value: 'swirl', label: 'Swirl' },
]

// --- Box panel swirl pattern (Phase 13.3 authority) ---
/** Bumped when swirl math changes so tile cache cannot serve stale pixels. */
export const BOX_PANEL_SWIRL_ALGO_ID = '13.4.1' as const

const SUBTLE_TILE_PX = 96
/** Lower turn rate = calmer, more premium texture (Phase 13.3 subtlety pass). */
const SUBTLE_TURNS = 0.3
const SUBTLE_RADIAL = 1.02
const SUBTLE_HARMONIC2 = 0.08
const SUBTLE_PHI2_SCALE = 1.06

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  const v = m ? parseInt(m[1], 16) : 0
  return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 }
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  let r1 = r / 255
  let g1 = g / 255
  let b1 = b / 255
  const max = Math.max(r1, g1, b1)
  const min = Math.min(r1, g1, b1)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r1:
        h = ((g1 - b1) / d + (g1 < b1 ? 6 : 0)) / 6
        break
      case g1:
        h = ((b1 - r1) / d + 2) / 6
        break
      default:
        h = ((r1 - g1) / d + 4) / 6
        break
    }
  }
  return { h, s, l }
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  if (s === 0) {
    const v = Math.round(l * 255)
    return { r: v, g: v, b: v }
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t
    if (tt < 0) tt += 1
    if (tt > 1) tt -= 1
    if (tt < 1 / 6) return p + (q - p) * 6 * tt
    if (tt < 1 / 2) return q
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6
    return p
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const r = hue2rgb(p, q, h + 1 / 3)
  const g = hue2rgb(p, q, h)
  const b = hue2rgb(p, q, h - 1 / 3)
  return {
    r: Math.max(0, Math.min(255, Math.round(r * 255))),
    g: Math.max(0, Math.min(255, Math.round(g * 255))),
    b: Math.max(0, Math.min(255, Math.round(b * 255))),
  }
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

const subtleSwirlTileCache = new Map<string, HTMLCanvasElement>()
const SUBTLE_CACHE_CAP = 24

/** 0 = grayscale luminance ramp, 100 = full chroma (default). */
function saturationFactor(saturationPercent: number): number {
  return Math.max(0, Math.min(100, Math.round(Number(saturationPercent)))) / 100
}

/**
 * Single-hue panel gradient: light tint → richer tone (Phase 13.4 — slightly narrower contrast band for readability).
 * `saturationPercent` scales chroma on both ends (0 = neutral gray light → gray rich by luminance only).
 */
export function deriveBoxPanelGradientEndpoints(
  baseRaw: string,
  saturationPercent = 100,
): { light: string; rich: string } {
  const t = saturationFactor(saturationPercent)
  const b = resolvePanelBackgroundContrastHex(baseRaw)
  const { r, g, b: bv } = hexToRgb(b)
  const { h, s, l } = rgbToHsl(r, g, bv)

  const lightL = 0.905
  const lightS = (s < 0.04 ? 0.1 : Math.min(0.62, 0.2 + s * 0.9)) * t
  const lightRgb = hslToRgb(h, lightS, lightL)

  const richS = Math.min(1, (s < 0.04 ? 0.42 : s * 1.36 + 0.28)) * t
  const richL = Math.max(0.23, Math.min(0.49, l * 0.76 + 0.06))
  const richRgb = hslToRgb(h, richS, richL)

  return {
    light: rgbToHex(lightRgb.r, lightRgb.g, lightRgb.b),
    rich: rgbToHex(richRgb.r, richRgb.g, richRgb.b),
  }
}

function midSwirlStopForBase(base: string, saturationPercent: number): string {
  const t = saturationFactor(saturationPercent)
  const b = resolvePanelBackgroundContrastHex(base)
  const { r, g, b: bv } = hexToRgb(b)
  const { h, s, l } = rgbToHsl(r, g, bv)
  const mid = hslToRgb(h, s * t, l)
  return rgbToHex(mid.r, mid.g, mid.b)
}

/**
 * Deterministic procedural swirl: same inputs always yield the same RGBA tile (no randomness).
 * Single-hue stops from `deriveBoxPanelGradientEndpoints` + mid anchor only.
 */
function renderSubtleMonoSwirlTile(
  base: string,
  saturationPercent: number,
  gradientReversed: boolean,
): HTMLCanvasElement {
  const b = resolvePanelBackgroundContrastHex(base)
  const { light, rich } = deriveBoxPanelGradientEndpoints(b, saturationPercent)
  const mid = midSwirlStopForBase(b, saturationPercent)
  const stops = [light, mid, rich].map(hexToRgb)
  const width = SUBTLE_TILE_PX
  const height = SUBTLE_TILE_PX
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
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
      const phi = Math.PI * 2 * SUBTLE_TURNS * SUBTLE_RADIAL * rNorm * (0.38 + 0.62 * rNorm)

      let spiral: number
      if (rPhys < eps) {
        spiral = 0.5
      } else {
        const inv = 1 / rPhys
        const sinT = ay * inv
        const cosT = ax * inv
        const s1 = sinT * Math.cos(phi) + cosT * Math.sin(phi)
        const sin2T = 2 * sinT * cosT
        const cos2T = cosT * cosT - sinT * sinT
        const phi2 = phi * SUBTLE_PHI2_SCALE
        const s2 = sin2T * Math.cos(phi2) + cos2T * Math.sin(phi2)
        const blend = (1 - SUBTLE_HARMONIC2) * s1 + SUBTLE_HARMONIC2 * s2
        spiral = (blend + 1) * 0.5
      }
      if (gradientReversed) spiral = 1 - spiral
      // Pull sampling toward mid-stops — material texture, less decorative banding (Phase 13.4).
      spiral = spiral * 0.88 + 0.5 * 0.12

      const { r: rr, g: gg, b: bb } = sampleStopRgb(stops, spiral)
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

/**
 * Cached authoritative swirl tile for box panels (name / type / rules / P/T).
 * Preview and high-res export both rasterize the same Konva scene that uses `getKonvaBoxPanelRectProps` /
 * `createBoxPanelInnerFillStyle`, which share `buildBoxPanelSwirlFillSurface` — no second implementation.
 */
export function getSubtleBoxSwirlTile(
  baseRaw: string,
  saturationPercent = 100,
  gradientReversed = false,
): HTMLCanvasElement {
  const base = resolvePanelBackgroundContrastHex(baseRaw).toLowerCase()
  const sat = Math.max(0, Math.min(100, Math.round(Number(saturationPercent))))
  const key = `${base}:swirl-${BOX_PANEL_SWIRL_ALGO_ID}:s${sat}:r${gradientReversed ? 1 : 0}`
  const hit = subtleSwirlTileCache.get(key)
  if (hit) return hit
  const c = renderSubtleMonoSwirlTile(base, sat, gradientReversed)
  if (subtleSwirlTileCache.size >= SUBTLE_CACHE_CAP) {
    const first = subtleSwirlTileCache.keys().next().value
    if (first !== undefined) subtleSwirlTileCache.delete(first)
  }
  subtleSwirlTileCache.set(key, c)
  return c
}

/**
 * Scales the canonical swirl tile to panel pixel size — single path for Canvas2D patterns and Konva fillPatternImage.
 */
export function buildBoxPanelSwirlFillSurface(
  widthPx: number,
  heightPx: number,
  baseRaw: string,
  saturationPercent: number,
  gradientReversed: boolean,
): HTMLCanvasElement | null {
  const w = Math.max(1, Math.ceil(widthPx))
  const h = Math.max(1, Math.ceil(heightPx))
  const base = resolvePanelBackgroundContrastHex(baseRaw)
  const tile = getSubtleBoxSwirlTile(base, saturationPercent, gradientReversed)
  const scaled = document.createElement('canvas')
  scaled.width = w
  scaled.height = h
  const sctx = scaled.getContext('2d')
  if (!sctx) return null
  sctx.imageSmoothingEnabled = true
  sctx.drawImage(tile, 0, 0, w, h)
  return scaled
}

/**
 * Representative mid-tone between gradient ends (legacy / diagnostics). Ink selection uses multi-sample path in
 * `resolveReadableInkOnBoxPanel` for accurate contrast across the full fill.
 */
export function boxPanelContrastReferenceHex(
  baseRaw: string,
  gradientEnabled: boolean,
  _dir: BoxColorGradientDirection,
  saturationPercent = 100,
): string {
  const b = resolvePanelBackgroundContrastHex(baseRaw)
  if (!gradientEnabled) return b
  const { light, rich } = deriveBoxPanelGradientEndpoints(b, saturationPercent)
  return blendHex(light, rich, 0.5)
}

function boxPanelInkContrastSampleHexes(
  baseRaw: string,
  gradientEnabled: boolean,
  dir: BoxColorGradientDirection,
  saturationPercent: number,
): string[] {
  const b = resolvePanelBackgroundContrastHex(baseRaw)
  if (!gradientEnabled) return [b]
  const { light, rich } = deriveBoxPanelGradientEndpoints(b, saturationPercent)
  const midBlend = blendHex(light, rich, 0.5)
  if (dir === 'swirl') {
    const midSwirl = midSwirlStopForBase(b, saturationPercent)
    return [light, rich, midBlend, midSwirl]
  }
  return [light, rich, midBlend]
}

export function resolveReadableInkOnBoxPanel(
  panelRaw: string | undefined,
  preferredInk: string | undefined,
  gradientEnabled: boolean,
  dir: BoxColorGradientDirection,
  saturationPercent = 100,
  minRatio = 4.5,
): string {
  const samples = boxPanelInkContrastSampleHexes(
    panelRaw ?? '',
    gradientEnabled,
    dir,
    saturationPercent,
  )
  if (samples.length === 1) {
    return resolveReadableInkOnPanel(samples[0], preferredInk, minRatio)
  }
  return resolveReadableInkOnPanelSamples(samples, preferredInk, minRatio)
}

/**
 * Canvas fill style for the inner (flat) region of a beveled panel, in local coords (0,0)–(w,h).
 */
export function createBoxPanelInnerFillStyle(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  baseRaw: string,
  gradientEnabled: boolean,
  dir: BoxColorGradientDirection,
  saturationPercent = 100,
  gradientReversed = false,
  textureImage?: HTMLImageElement | null,
): string | CanvasGradient | CanvasPattern {
  const w = Math.max(1, width)
  const h = Math.max(1, height)

  if (textureImage && isPanelTextureBackground(baseRaw)) {
    return createPanelTexturePattern(ctx, w, h, textureImage)
  }

  const base = resolvePanelBackgroundContrastHex(baseRaw)

  if (!gradientEnabled) return base

  if (dir === 'swirl') {
    const scaled = buildBoxPanelSwirlFillSurface(w, h, baseRaw, saturationPercent, gradientReversed)
    if (!scaled) return base
    return ctx.createPattern(scaled, 'no-repeat') ?? base
  }

  const { light, rich } = deriveBoxPanelGradientEndpoints(base, saturationPercent)
  const c0 = gradientReversed ? rich : light
  const c1 = gradientReversed ? light : rich

  if (dir === 'vertical') {
    const g = ctx.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, c0)
    g.addColorStop(1, c1)
    return g
  }
  if (dir === 'horizontal') {
    const g = ctx.createLinearGradient(0, 0, w, 0)
    g.addColorStop(0, c0)
    g.addColorStop(1, c1)
    return g
  }
  if (dir === 'diagonal') {
    const g = ctx.createLinearGradient(0, 0, w, h)
    g.addColorStop(0, c0)
    g.addColorStop(1, c1)
    return g
  }
  return base
}

/** Konva `Rect` props for rules-text base layer (same fills as canvas path). */
export function getKonvaBoxPanelRectProps(
  width: number,
  height: number,
  baseRaw: string,
  gradientEnabled: boolean,
  dir: BoxColorGradientDirection,
  saturationPercent = 100,
  gradientReversed = false,
  textureImage?: HTMLImageElement | null,
): Record<string, unknown> {
  const w = Math.max(1, width)
  const h = Math.max(1, height)

  if (textureImage && isPanelTextureBackground(baseRaw)) {
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.imageSmoothingEnabled = true
      ctx.drawImage(textureImage, 0, 0, w, h)
      return {
        fillPatternImage: canvas as unknown as HTMLImageElement,
        fillPatternRepeat: 'no-repeat',
        fillPatternX: 0,
        fillPatternY: 0,
        fillPatternScaleX: 1,
        fillPatternScaleY: 1,
      }
    }
  }

  const base = resolvePanelBackgroundContrastHex(baseRaw)
  if (!gradientEnabled) return { fill: base }

  if (dir === 'swirl') {
    const scaled = buildBoxPanelSwirlFillSurface(w, h, baseRaw, saturationPercent, gradientReversed)
    if (!scaled) return { fill: base }
    return {
      fillPatternImage: scaled as unknown as HTMLImageElement,
      fillPatternRepeat: 'no-repeat',
      fillPatternX: 0,
      fillPatternY: 0,
      fillPatternScaleX: 1,
      fillPatternScaleY: 1,
    }
  }

  const { light, rich } = deriveBoxPanelGradientEndpoints(base, saturationPercent)
  const c0 = gradientReversed ? rich : light
  const c1 = gradientReversed ? light : rich

  if (dir === 'vertical') {
    return {
      fillLinearGradientStartPoint: { x: 0, y: 0 },
      fillLinearGradientEndPoint: { x: 0, y: h },
      fillLinearGradientColorStops: [0, c0, 1, c1],
    }
  }
  if (dir === 'horizontal') {
    return {
      fillLinearGradientStartPoint: { x: 0, y: 0 },
      fillLinearGradientEndPoint: { x: w, y: 0 },
      fillLinearGradientColorStops: [0, c0, 1, c1],
    }
  }
  if (dir === 'diagonal') {
    return {
      fillLinearGradientStartPoint: { x: 0, y: 0 },
      fillLinearGradientEndPoint: { x: w, y: h },
      fillLinearGradientColorStops: [0, c0, 1, c1],
    }
  }
  return { fill: base }
}

export function normalizeBoxGradientReversed(raw: unknown): boolean {
  return raw === true
}

export function normalizeBoxColorGradientDirection(raw: unknown): BoxColorGradientDirection {
  if (raw === 'horizontal' || raw === 'swirl' || raw === 'diagonal') return raw
  return 'vertical'
}

export function normalizeBoxColorGradientSaturation(raw: unknown): number {
  const n = typeof raw === 'number' ? raw : Number(raw)
  if (!Number.isFinite(n)) return 100
  return Math.max(0, Math.min(100, Math.round(n)))
}
