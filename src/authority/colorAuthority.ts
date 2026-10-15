/**
 * Color Identity & outer-border authority (Roadmap V8 — Module 4.2).
 * Auto-color = explicit `colorIdentity` pips **plus** WUBRG from **braced** tokens in the **card name** and
 * **mana cost** (e.g. name `Dragon {R}` or cost `{2}{R}{G}`). Does not parse bare letters. Manual mode uses hex slots.
 */

import { normalizeManaTokenInner } from '../utils/manaCanonical'

export type ColorIdentityPip = 'W' | 'U' | 'B' | 'R' | 'G'

const COLOR_ORDER: readonly ColorIdentityPip[] = ['W', 'U', 'B', 'R', 'G']

/**
 * WUBRG toggle chips (Color Identity sidebar): Plains–Island–Swamp–Mountain–Forest–aligned tints when active.
 * Uses sidebar surface tokens so light/dark shells both read clearly.
 */
export const COLOR_IDENTITY_PIP_CHIP: Record<
  ColorIdentityPip,
  { letter: string; background: string; border: string }
> = {
  W: {
    letter: '#7a6230',
    background: 'color-mix(in srgb, #f8e7b9 44%, var(--sb-surface-elevated))',
    border: 'color-mix(in srgb, #c9a227 50%, var(--sb-border))',
  },
  U: {
    letter: '#0b5a8c',
    background: 'color-mix(in srgb, #0e68ab 24%, var(--sb-surface-elevated))',
    border: 'color-mix(in srgb, #0e68ab 48%, var(--sb-border))',
  },
  B: {
    letter: '#eceae7',
    background: 'color-mix(in srgb, #150b00 52%, var(--sb-surface-elevated))',
    border: 'color-mix(in srgb, #3d3830 65%, var(--sb-border))',
  },
  R: {
    letter: '#b31824',
    background: 'color-mix(in srgb, #d3202a 24%, var(--sb-surface-elevated))',
    border: 'color-mix(in srgb, #d3202a 48%, var(--sb-border))',
  },
  G: {
    letter: '#005c30',
    background: 'color-mix(in srgb, #00733d 24%, var(--sb-surface-elevated))',
    border: 'color-mix(in srgb, #00733d 48%, var(--sb-border))',
  },
}

export type ManualColorKey =
  | 'none'
  | 'white'
  | 'blue'
  | 'black'
  | 'red'
  | 'green'
  | 'gold'
  | 'colorless'

type IdentityKey = ManualColorKey | 'artifact' | 'custom'

const IDENTITY_PALETTE: Record<IdentityKey, string> = {
  none: '#b0b7c2',
  white: '#f8e7b9',
  blue: '#0e68ab',
  black: '#150b00',
  red: '#d3202a',
  green: '#00733d',
  colorless: '#b0b7c2',
  gold: '#c0b673',
  artifact: '#90adbb',
  custom: '#90adbb',
}

const clamp8 = (n: number) => Math.max(0, Math.min(255, Math.round(n)))

const hexToRgb = (hex: string) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex)
  if (!m) return { r: 0, g: 0, b: 0 }
  const v = parseInt(m[1], 16)
  return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 }
}

const rgbToHex = (r: number, g: number, b: number) =>
  `#${clamp8(r).toString(16).padStart(2, '0')}${clamp8(g).toString(16).padStart(2, '0')}${clamp8(b)
    .toString(16)
    .padStart(2, '0')}`

export const blendHex = (a: string, b: string, t = 0.5) => {
  const A = hexToRgb(a)
  const B = hexToRgb(b)
  return rgbToHex(A.r + (B.r - A.r) * t, A.g + (B.g - A.g) * t, A.b + (B.b - A.b) * t)
}

/** Average stroke for multi-stop identities. */
export function averageHexColors(stops: string[]): string {
  if (stops.length === 0) return '#000000'
  if (stops.length === 1) return stops[0]
  let r = 0
  let g = 0
  let b = 0
  for (const h of stops) {
    const { r: rr, g: gg, b: bb } = hexToRgb(h)
    r += rr
    g += gg
    b += bb
  }
  const n = stops.length
  return rgbToHex(r / n, g / n, b / n)
}

export const OUTER_BORDER_COLORS: {
  value: string
  label: string
  hex?: string
  hex1?: string
  hex2?: string
}[] = [
  { value: 'black', label: 'Black', hex: '#000000' },
  { value: 'white', label: 'White', hex: '#f5f5dc' },
  { value: 'blue', label: 'Blue', hex: '#0e68ab' },
  { value: 'red', label: 'Red', hex: '#d3202a' },
  { value: 'green', label: 'Green', hex: '#00733d' },
  { value: 'colorless', label: 'Colorless', hex: '#b0b7c2' },
  { value: 'WU', label: 'W/U', hex1: '#f5f5dc', hex2: '#0e68ab' },
  { value: 'UB', label: 'U/B', hex1: '#0e68ab', hex2: '#150b00' },
  { value: 'BR', label: 'B/R', hex1: '#150b00', hex2: '#d3202a' },
  { value: 'RG', label: 'R/G', hex1: '#d3202a', hex2: '#00733d' },
  { value: 'GW', label: 'G/W', hex1: '#00733d', hex2: '#f5f5dc' },
  { value: 'WB', label: 'W/B', hex1: '#f5f5dc', hex2: '#150b00' },
  { value: 'UR', label: 'U/R', hex1: '#0e68ab', hex2: '#d3202a' },
  { value: 'BG', label: 'B/G', hex1: '#150b00', hex2: '#00733d' },
  { value: 'RW', label: 'R/W', hex1: '#d3202a', hex2: '#f5f5dc' },
  { value: 'GU', label: 'G/U', hex1: '#00733d', hex2: '#0e68ab' },
]

export function getOuterBorderHex(key: string): string {
  const found = OUTER_BORDER_COLORS.find((o) => o.value === key)
  if (found?.hex) return found.hex
  if (found?.hex1 && found?.hex2) return blendHex(found.hex1, found.hex2, 0.5)
  return '#000000'
}

export type OuterBorderFill =
  | { type: 'solid'; hex: string }
  | { type: 'gradient'; hex1: string; hex2: string }

export function getOuterBorderFill(key: string): OuterBorderFill {
  const found = OUTER_BORDER_COLORS.find((o) => o.value === key)
  if (!found) return { type: 'solid', hex: '#000000' }
  if (found.hex1 != null && found.hex2 != null) return { type: 'gradient', hex1: found.hex1, hex2: found.hex2 }
  return { type: 'solid', hex: found.hex ?? '#000000' }
}

export type ResolvedIdentity =
  | { kind: 'solid'; key: IdentityKey; fill: string; stroke: string }
  | { kind: 'gradient'; topKey: IdentityKey; bottomKey: IdentityKey; top: string; bottom: string; stroke: string }
  | { kind: 'multi'; stops: string[]; stroke: string }

function pipToManualKey(p: ColorIdentityPip): Exclude<ManualColorKey, 'none' | 'gold' | 'colorless'> {
  return p === 'W' ? 'white' : p === 'U' ? 'blue' : p === 'B' ? 'black' : p === 'R' ? 'red' : 'green'
}

/**
 * WUBRG pips inside `{...}` in arbitrary text (card name, etc.). Hybrid `{W/U}` yields both;
 * does not treat bare letters as pips (avoids false positives in normal words).
 */
export function extractColorPipsFromBracketText(source: string): ColorIdentityPip[] {
  const found = new Set<ColorIdentityPip>()
  const src = `${source ?? ''}`
  const re = /\{([^}]+)\}/g
  let m: RegExpExecArray | null

  const addIfColor = (token: string) => {
    const norm = normalizeManaTokenInner(token)
    if (!norm) return
    for (const ch of norm) {
      if (ch === 'W' || ch === 'U' || ch === 'B' || ch === 'R' || ch === 'G') {
        found.add(ch as ColorIdentityPip)
      }
    }
  }

  while ((m = re.exec(src))) {
    const raw = String(m[1] ?? '').toUpperCase().trim()
    if (!raw) continue
    const parts = raw.split('/')
    for (const part of parts) {
      addIfColor(part)
      if (part.length >= 2 && part.endsWith('P')) {
        addIfColor(part[0])
      }
    }
  }
  return normalizeColorIdentityPips([...found])
}

/** Union explicit sidebar pips + bracket pips from name and mana cost; WUBRG order, max 5. */
export function mergeAutoColorIdentityPips(
  explicit: readonly ColorIdentityPip[],
  cardName: string,
  manaCost = '',
): ColorIdentityPip[] {
  return normalizeColorIdentityPips([
    ...explicit,
    ...extractColorPipsFromBracketText(cardName),
    ...extractColorPipsFromBracketText(manaCost),
  ])
}

/** Dedupe, WUBRG order, max 5 pips (explicit identity is user-controlled). */
export function normalizeColorIdentityPips(input: readonly string[]): ColorIdentityPip[] {
  const allowed = new Set<string>(COLOR_ORDER)
  const seen = new Set<ColorIdentityPip>()
  const out: ColorIdentityPip[] = []
  for (const raw of input) {
    const u = String(raw ?? '').trim().toUpperCase()
    if (!allowed.has(u) || seen.has(u as ColorIdentityPip)) continue
    seen.add(u as ColorIdentityPip)
    out.push(u as ColorIdentityPip)
    if (out.length >= 5) break
  }
  out.sort((a, b) => COLOR_ORDER.indexOf(a) - COLOR_ORDER.indexOf(b))
  return out
}

const isHex = (v?: string) => typeof v === 'string' && /^#([0-9a-f]{6})$/i.test(v.trim())

function clampManualColorCount(n: number): 1 | 2 | 3 | 4 | 5 {
  const x = Math.floor(Number(n))
  if (!Number.isFinite(x)) return 1
  return (Math.max(1, Math.min(5, x)) as 1 | 2 | 3 | 4 | 5)
}

function autoIdentityFromPips(pips: readonly ColorIdentityPip[]): ResolvedIdentity {
  if (pips.length === 0) {
    const fill = IDENTITY_PALETTE.colorless
    return { kind: 'solid', key: 'colorless', fill, stroke: fill }
  }

  if (pips.length === 1) {
    const key = pipToManualKey(pips[0])
    const fill = IDENTITY_PALETTE[key]
    return { kind: 'solid', key, fill, stroke: fill }
  }

  if (pips.length === 2) {
    const k1 = pipToManualKey(pips[0])
    const k2 = pipToManualKey(pips[1])
    const top = IDENTITY_PALETTE[k1]
    const bottom = IDENTITY_PALETTE[k2]
    return { kind: 'gradient', topKey: k1, bottomKey: k2, top, bottom, stroke: blendHex(top, bottom, 0.5) }
  }

  const stops = pips.map((p) => IDENTITY_PALETTE[pipToManualKey(p)])
  return { kind: 'multi', stops, stroke: averageHexColors(stops) }
}

/**
 * Inner-border identity: auto mode merges `colorIdentity` with bracket tokens in `cardName` and `manaCost`; manual uses hex/palette.
 */
export function resolveProceduralIdentity(
  typeLine: string,
  colorIdentity: readonly ColorIdentityPip[],
  cardName: string,
  manaCost: string,
  autoColorEnabled: boolean,
  manualColorKey: ManualColorKey,
  manualColorHex1?: string,
  manualColorHex2?: string,
  manualColorHex3?: string,
  manualColorHex4?: string,
  manualColorHex5?: string,
  manualColorCount?: number,
): ResolvedIdentity {
  if (!autoColorEnabled) {
    const count = clampManualColorCount(manualColorCount ?? 1)
    const slots = [manualColorHex1, manualColorHex2, manualColorHex3, manualColorHex4, manualColorHex5].slice(0, count)
    const valid = slots.map((s) => (isHex(s) ? s!.trim() : '')).filter(Boolean) as string[]

    if (valid.length >= 2) {
      const stroke = averageHexColors(valid)
      return { kind: 'multi', stops: valid, stroke }
    }

    if (valid.length === 1) {
      const f = valid[0]
      return { kind: 'solid', key: 'custom' as IdentityKey, fill: f, stroke: f }
    }

    const key = (manualColorKey === 'none' ? 'colorless' : manualColorKey) as Exclude<ManualColorKey, 'none'>
    const fill = IDENTITY_PALETTE[key]
    return { kind: 'solid', key, fill, stroke: fill }
  }

  const tl = String(typeLine ?? '')
  if (/\bartifact\b/i.test(tl)) {
    const fill = IDENTITY_PALETTE.artifact
    return { kind: 'solid', key: 'artifact', fill, stroke: fill }
  }

  return autoIdentityFromPips(mergeAutoColorIdentityPips(colorIdentity, cardName, manaCost))
}
