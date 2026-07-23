/**
 * Bundled land panel assets — served from `public/land-panels/` (stable URLs for web/PWA).
 * Source of truth for filenames: panels unpacked from TexturesAndPanels.zip → Panels/
 * (dev-time import only; no runtime filesystem path).
 */
export type LandPanelOption = { id: string; label: string; file: string }

export const LAND_PANEL_OPTIONS: readonly LandPanelOption[] = [
  { id: '', label: 'None', file: '' },
  { id: 'plains', label: 'Plains', file: 'Plains.png' },
  { id: 'island', label: 'Island', file: 'Island.png' },
  { id: 'swamp', label: 'Swamp', file: 'Swamp.png' },
  { id: 'mountain', label: 'Mountain', file: 'Mountain.png' },
  { id: 'forest', label: 'Forest', file: 'Forest.png' },
  { id: 'colorless', label: 'Colorless', file: 'Colorless.png' },
] as const

/** Resolve public URL for bundled panel image, or null for "None". */
export function resolveLandPanelPublicUrl(panelId: string): string | null {
  const id = String(panelId ?? '').trim()
  if (!id) return null
  const opt = LAND_PANEL_OPTIONS.find((o) => o.id === id)
  if (!opt || !opt.file) return null
  return `/land-panels/${encodeURIComponent(opt.file)}`
}
