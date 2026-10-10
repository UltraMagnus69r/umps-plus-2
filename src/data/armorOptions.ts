/**
 * Bundled Armor options — served from `public/armor/`.
 * Selection is stored for Layout sidebar UI; preview wiring comes later.
 */

export type ArmorOption = { id: string; label: string; file: string }

export const DEFAULT_ARMOR_ID = ''

export const ARMOR_OPTIONS: readonly ArmorOption[] = [
  { id: '', label: 'None', file: '' },
] as const

export function normalizeArmorId(value: unknown): string {
  const id = String(value ?? '').trim()
  if (!id) return DEFAULT_ARMOR_ID
  return ARMOR_OPTIONS.some((o) => o.id === id) ? id : DEFAULT_ARMOR_ID
}

export function resolveArmorPublicUrl(assetId: string): string | null {
  const id = normalizeArmorId(assetId)
  if (!id) return null
  const opt = ARMOR_OPTIONS.find((o) => o.id === id)
  if (!opt?.file) return null
  return `/armor/${encodeURIComponent(opt.file)}`
}
