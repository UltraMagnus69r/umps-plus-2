/**
 * PKMN frame family — pre-made full-card frames (static PNGs, no recolor).
 * Color or basic-land = variant pick only. Served from `public/frames/pkmn/`.
 */

export type PkmnFrameVariantId =
  | 'white'
  | 'blue'
  | 'red'
  | 'green'
  | 'dark'
  | 'multicolor'
  | 'colorless'
  | 'forest'
  | 'island'
  | 'mountain'
  | 'plains'
  | 'swamp'

export type PkmnFrameOption = {
  id: PkmnFrameVariantId
  label: string
  file: string
  /** Full-art basic land — baked nameplate, no rules/P/T chrome. */
  basicLand?: boolean
}

export const PKMN_FRAME_OPTIONS: readonly PkmnFrameOption[] = [
  { id: 'white', label: 'White', file: 'pkmn-white.png' },
  { id: 'blue', label: 'Blue', file: 'pkmn-blue.png' },
  { id: 'red', label: 'Red', file: 'pkmn-red.png' },
  { id: 'green', label: 'Green', file: 'pkmn-green.png' },
  { id: 'dark', label: 'Dark', file: 'pkmn-dark.png' },
  { id: 'multicolor', label: 'Multicolor', file: 'pkmn-multicolor.png' },
  { id: 'colorless', label: 'Colorless', file: 'pkmn-colorless.png' },
  { id: 'forest', label: 'Forest', file: 'pkmn-forest.png', basicLand: true },
  { id: 'island', label: 'Island', file: 'pkmn-island.png', basicLand: true },
  { id: 'mountain', label: 'Mountain', file: 'pkmn-mountain.png', basicLand: true },
  { id: 'plains', label: 'Plains', file: 'pkmn-plains.png', basicLand: true },
  { id: 'swamp', label: 'Swamp', file: 'pkmn-swamp.png', basicLand: true },
] as const

export const DEFAULT_PKMN_FRAME_VARIANT: PkmnFrameVariantId = 'white'

export function isPkmnFrameVariantId(value: unknown): value is PkmnFrameVariantId {
  return PKMN_FRAME_OPTIONS.some((o) => o.id === value)
}

export function isPkmnBasicLandFrameVariantId(value: unknown): boolean {
  const opt = PKMN_FRAME_OPTIONS.find((o) => o.id === value)
  return opt?.basicLand === true
}

export function normalizePkmnFrameVariantId(value: unknown): PkmnFrameVariantId {
  return isPkmnFrameVariantId(value) ? value : DEFAULT_PKMN_FRAME_VARIANT
}

/** Public URL for a PKMN frame PNG. */
export function resolvePkmnFramePublicUrl(variantId: unknown): string {
  const id = normalizePkmnFrameVariantId(variantId)
  const opt = PKMN_FRAME_OPTIONS.find((o) => o.id === id)!
  return `/frames/pkmn/${encodeURIComponent(opt.file)}`
}
