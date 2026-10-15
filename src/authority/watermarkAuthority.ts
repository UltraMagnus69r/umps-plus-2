/**
 * Module 5.2 — Local watermark assets (Typal guild set). Paths are served from `public/watermarks/`.
 */

export const WATERMARK_PATH_KEYS = [
  'none',
  'custom',
  'azorius',
  'boros',
  'dimir',
  'golgari',
  'gruul',
  'izzet',
  'orzhov',
  'rakdos',
  'selesnya',
  'simic',
] as const

export type WatermarkPathKey = (typeof WATERMARK_PATH_KEYS)[number]

export const WATERMARK_SELECT_OPTIONS: { value: WatermarkPathKey; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'custom', label: 'Custom (Upload)' },
  { value: 'azorius', label: 'Azorius' },
  { value: 'boros', label: 'Boros' },
  { value: 'dimir', label: 'Dimir' },
  { value: 'golgari', label: 'Golgari' },
  { value: 'gruul', label: 'Gruul' },
  { value: 'izzet', label: 'Izzet' },
  { value: 'orzhov', label: 'Orzhov' },
  { value: 'rakdos', label: 'Rakdos' },
  { value: 'selesnya', label: 'Selesnya' },
  { value: 'simic', label: 'Simic' },
]

/** Public URL for Konva Image `src` (Vite `public/`). */
export function getWatermarkAssetUrl(key: WatermarkPathKey): string | null {
  if (key === 'none') return null
  if (key === 'custom') return null
  return `/watermarks/${key}.png`
}

const SCRYWATERMARK_ALIASES: Record<string, WatermarkPathKey> = {
  azorius: 'azorius',
  boros: 'boros',
  dimir: 'dimir',
  golgari: 'golgari',
  gruul: 'gruul',
  izzet: 'izzet',
  orzhov: 'orzhov',
  rakdos: 'rakdos',
  selesnya: 'selesnya',
  simic: 'simic',
  colorpie: 'none',
  miracle: 'none',
  draft: 'none',
  converted: 'none',
}

/**
 * Map Scryfall `card.watermark` string to a local watermark key, or null if unknown / none.
 */
export function mapScryfallWatermarkToPath(raw: string | null | undefined): WatermarkPathKey | null {
  if (raw == null || typeof raw !== 'string') return null
  const k = raw.trim().toLowerCase().replace(/[\s_-]+/g, '')
  if (!k) return null
  return SCRYWATERMARK_ALIASES[k] ?? null
}

export function isWatermarkPathKey(v: string): v is WatermarkPathKey {
  return (WATERMARK_PATH_KEYS as readonly string[]).includes(v)
}
