/**
 * Bundled Crown options — served from `public/assets/crowns/`.
 * Drawn behind the Modern nameplate (Showcase-style crown).
 * Canvas 2200×420 with transparent slot ~1259×130 (see CROWN_ASSET_SLOT).
 * Fill is a near-white luminance map for multiply land tints; `*-shadow.png` is stroke+soft drop.
 */

export type CrownOption = {
  id: string
  label: string
  file: string
  /** Optional soft drop-shadow + stroke overlay (same canvas registration as fill). */
  shadowFile?: string
}

export const DEFAULT_CROWN_ID = ''

export const CROWN_OPTIONS: readonly CrownOption[] = [
  { id: '', label: 'None', file: '' },
  {
    id: 'white',
    label: 'White',
    file: 'white-crown.png',
    shadowFile: 'white-crown-shadow.png',
  },
  {
    id: 'blue',
    label: 'Blue',
    file: 'blue-crown.png',
    shadowFile: 'blue-crown-shadow.png',
  },
  {
    id: 'black',
    label: 'Black',
    file: 'black-crown.png',
    shadowFile: 'black-crown-shadow.png',
  },
  {
    id: 'red',
    label: 'Red',
    file: 'red-crown.png',
    shadowFile: 'red-crown-shadow.png',
  },
  {
    id: 'green',
    label: 'Green',
    file: 'green-crown.png',
    shadowFile: 'green-crown-shadow.png',
  },
  {
    id: 'colorless',
    label: 'Colorless',
    file: 'colorless-crown.png',
    shadowFile: 'colorless-crown-shadow.png',
  },
  {
    id: 'artifact',
    label: 'Artifact',
    file: 'artifact-crown.png',
    shadowFile: 'artifact-crown-shadow.png',
  },
] as const

/** Land-tint presets: crown fill = background RGB; default shadow = mana RGB. */
export type CrownTintPresetId = 'forest' | 'island' | 'plains' | 'mountain' | 'swamp' | 'custom'

export type CrownTintPreset = {
  id: CrownTintPresetId
  label: string
  /** Crown / background fill tint (multiply on gold base). */
  crownRgb: readonly [number, number, number]
  /** Default shadow / mana companion when shadow is on. */
  shadowRgb: readonly [number, number, number]
}

/** Plains mana (249,250,244) is too light for a readable drop shadow — darkened companion. */
const PLAINS_SHADOW_RGB = [120, 105, 72] as const

export const CROWN_TINT_PRESETS: readonly CrownTintPreset[] = [
  { id: 'forest', label: 'Forest', crownRgb: [196, 211, 202], shadowRgb: [0, 115, 62] },
  { id: 'island', label: 'Island', crownRgb: [179, 206, 234], shadowRgb: [14, 104, 171] },
  {
    id: 'plains',
    label: 'Plains',
    crownRgb: [248, 231, 185],
    shadowRgb: PLAINS_SHADOW_RGB,
  },
  { id: 'mountain', label: 'Mountain', crownRgb: [235, 159, 130], shadowRgb: [211, 32, 42] },
  { id: 'swamp', label: 'Swamp', crownRgb: [166, 159, 157], shadowRgb: [21, 11, 0] },
  { id: 'custom', label: 'Custom', crownRgb: [239, 194, 99], shadowRgb: [20, 16, 12] },
] as const

export const DEFAULT_CROWN_TINT_PRESET: CrownTintPresetId = 'custom'
export const DEFAULT_CROWN_COLOR = '#efc263'
export const DEFAULT_CROWN_SHADOW_COLOR = '#14100c'

export function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}

export function normalizeHexColor(value: unknown, fallback: string): string {
  const s = String(value ?? '').trim()
  if (/^#[0-9a-fA-F]{6}$/.test(s)) return s.toLowerCase()
  if (/^[0-9a-fA-F]{6}$/.test(s)) return `#${s.toLowerCase()}`
  return fallback
}

export function normalizeCrownTintPreset(value: unknown): CrownTintPresetId {
  const id = String(value ?? '').trim() as CrownTintPresetId
  return CROWN_TINT_PRESETS.some((p) => p.id === id) ? id : DEFAULT_CROWN_TINT_PRESET
}

export function getCrownTintPreset(id: CrownTintPresetId): CrownTintPreset {
  return CROWN_TINT_PRESETS.find((p) => p.id === id) ?? CROWN_TINT_PRESETS[CROWN_TINT_PRESETS.length - 1]!
}

export function normalizeCrownId(value: unknown): string {
  const id = String(value ?? '').trim()
  if (!id) return DEFAULT_CROWN_ID
  return CROWN_OPTIONS.some((o) => o.id === id) ? id : DEFAULT_CROWN_ID
}

export function resolveCrownPublicUrl(assetId: string): string | null {
  const id = normalizeCrownId(assetId)
  if (!id) return null
  const opt = CROWN_OPTIONS.find((o) => o.id === id)
  if (!opt?.file) return null
  // Served under /assets/crowns (Vite does not reliably expose a top-level /crown public path).
  return `/assets/crowns/${encodeURIComponent(opt.file)}`
}

export function resolveCrownShadowPublicUrl(assetId: string): string | null {
  const id = normalizeCrownId(assetId)
  if (!id) return null
  const opt = CROWN_OPTIONS.find((o) => o.id === id)
  if (!opt?.shadowFile) return null
  return `/assets/crowns/${encodeURIComponent(opt.shadowFile)}`
}
