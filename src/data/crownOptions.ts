/**
 * Bundled Crown options — served from `public/assets/crowns/`.
 * Drawn behind the Modern nameplate (Showcase-style crown).
 * Canvas 2200×420 with transparent slot 1288×95 at (456, 110).
 */

export type CrownOption = { id: string; label: string; file: string }

export const DEFAULT_CROWN_ID = ''

export const CROWN_OPTIONS: readonly CrownOption[] = [
  { id: '', label: 'None', file: '' },
  { id: 'white', label: 'White', file: 'white-crown.png' },
  { id: 'blue', label: 'Blue', file: 'blue-crown.png' },
  { id: 'black', label: 'Black', file: 'black-crown.png' },
  { id: 'red', label: 'Red', file: 'red-crown.png' },
  { id: 'green', label: 'Green', file: 'green-crown.png' },
  { id: 'colorless', label: 'Colorless', file: 'colorless-crown.png' },
  { id: 'artifact', label: 'Artifact', file: 'artifact-crown.png' },
] as const

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
