/**
 * Phase 18.1 — Export presets & output modes (control layer only).
 *
 * Presets map to existing export behavior: same Konva stage; PNG may be full bleed or trim
 * via store `exportPngIncludeBleed`. pHYs stays 600 DPI. Extensible for future batch/PDF/sheet.
 */

export const EXPORT_PRESET_IDS = ['standard', 'print-ready'] as const

export type ExportPresetId = (typeof EXPORT_PRESET_IDS)[number]

export type ExportPreset = {
  id: ExportPresetId
  /** Short UI label */
  label: string
  /** Tooltip / assistive description */
  description: string
  /**
   * Inserted immediately before `.png` on download (e.g. `-print`).
   * Empty string = legacy filename from `resolvePngFilename` only.
   */
  pngFilenameSuffixBeforeExt: string
}

export const EXPORT_PRESETS: readonly ExportPreset[] = [
  {
    id: 'standard',
    label: 'Standard',
    description: 'Default PNG: full-bleed master, same as before Phase 18.1.',
    pngFilenameSuffixBeforeExt: '',
  },
  {
    id: 'print-ready',
    label: 'Print-ready',
    description:
      'Same full-bleed 1650×2250 PNG and print metadata as Standard; adds a -print suffix to the filename for shop workflows.',
    pngFilenameSuffixBeforeExt: '-print',
  },
]

export const DEFAULT_EXPORT_PRESET_ID: ExportPresetId = 'standard'

const PRESET_BY_ID: Record<ExportPresetId, ExportPreset> = {
  standard: EXPORT_PRESETS[0],
  'print-ready': EXPORT_PRESETS[1],
}

export function normalizeExportPresetId(raw: unknown): ExportPresetId {
  if (raw === 'standard' || raw === 'print-ready') return raw
  return DEFAULT_EXPORT_PRESET_ID
}

export function getExportPreset(id: ExportPresetId): ExportPreset {
  return PRESET_BY_ID[id] ?? PRESET_BY_ID[DEFAULT_EXPORT_PRESET_ID]
}

/**
 * Apply preset filename suffix to an already-resolved `.png` name from `resolvePngFilename`.
 */
export function applyExportPresetToPngFilename(
  resolvedPngFilename: string,
  preset: ExportPreset,
): string {
  const suf = preset.pngFilenameSuffixBeforeExt
  if (!suf) return resolvedPngFilename
  const lower = resolvedPngFilename.toLowerCase()
  if (!lower.endsWith('.png')) {
    return `${resolvedPngFilename}${suf}.png`
  }
  return `${resolvedPngFilename.slice(0, -4)}${suf}.png`
}

const TRIM_PNG_SUFFIX = '-trim'

/** Insert `-trim` before `.png` (after any preset suffix). */
export function applyTrimCropToPngFilename(resolvedPngFilename: string): string {
  const lower = resolvedPngFilename.toLowerCase()
  if (!lower.endsWith('.png')) {
    return `${resolvedPngFilename}${TRIM_PNG_SUFFIX}.png`
  }
  return `${resolvedPngFilename.slice(0, -4)}${TRIM_PNG_SUFFIX}.png`
}
