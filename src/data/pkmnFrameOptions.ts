/**
 * PKMN frame family — pre-made full-card frames (static PNGs, no recolor).
 * Color = variant pick only. Served from `public/frames/pkmn/`.
 */

export type PkmnFrameVariantId =
  | 'white'
  | 'blue'
  | 'red'
  | 'green'
  | 'dark'
  | 'multicolor'
  | 'colorless'

export type PkmnFrameOption = {
  id: PkmnFrameVariantId
  label: string
  file: string
}

export const PKMN_FRAME_OPTIONS: readonly PkmnFrameOption[] = [
  { id: 'white', label: 'White', file: 'pkmn-white.png' },
  { id: 'blue', label: 'Blue', file: 'pkmn-blue.png' },
  { id: 'red', label: 'Red', file: 'pkmn-red.png' },
  { id: 'green', label: 'Green', file: 'pkmn-green.png' },
  { id: 'dark', label: 'Dark', file: 'pkmn-dark.png' },
  { id: 'multicolor', label: 'Multicolor', file: 'pkmn-multicolor.png' },
  { id: 'colorless', label: 'Colorless', file: 'pkmn-colorless.png' },
] as const

export const DEFAULT_PKMN_FRAME_VARIANT: PkmnFrameVariantId = 'white'

export function isPkmnFrameVariantId(value: unknown): value is PkmnFrameVariantId {
  return PKMN_FRAME_OPTIONS.some((o) => o.id === value)
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
