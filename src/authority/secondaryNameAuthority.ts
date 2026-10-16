/**
 * Secondary name seating — overlay in the art window, just under the nameplate.
 */

export const SECONDARY_NAME_ALIGNS = ['left', 'center', 'right'] as const
export type SecondaryNameAlign = (typeof SECONDARY_NAME_ALIGNS)[number]

export const SECONDARY_NAME_FONT_SIZE_MIN = 20
export const SECONDARY_NAME_FONT_SIZE_MAX = 90
export const SECONDARY_NAME_FONT_SIZE_DEFAULT = 55

export function normalizeSecondaryNameAlign(value: unknown): SecondaryNameAlign {
  if (value === 'center' || value === 'right' || value === 'left') return value
  return 'left'
}

export function normalizeSecondaryNameFontSize(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return SECONDARY_NAME_FONT_SIZE_DEFAULT
  const clamped = Math.max(SECONDARY_NAME_FONT_SIZE_MIN, Math.min(SECONDARY_NAME_FONT_SIZE_MAX, n))
  return Math.floor(clamped * 2) / 2
}

export type StageRect = { x: number; y: number; width: number; height: number }

/**
 * Seat secondary name inside the art box, immediately under the nameplate when the
 * plate overlaps or sits above the art. Result is clipped by the caller to `art`.
 */
export function getSecondaryNameSeatRect(
  art: StageRect,
  nameBar: StageRect,
  fontSize: number,
): StageRect {
  const padX = 10
  const padTop = 8
  const padBottom = 8
  const textH = Math.max(54, Math.min(Math.ceil(fontSize * 1.25), Math.max(24, art.height - padTop - padBottom)))
  const nameBottom = nameBar.y + nameBar.height
  // Prefer just below the nameplate; never above the art top.
  const yRaw = Math.max(art.y + padTop, nameBottom + padTop)
  const yMax = art.y + art.height - textH - padBottom
  const y = Math.max(art.y + padTop, Math.min(yRaw, yMax))
  return {
    x: art.x + padX,
    y,
    width: Math.max(1, art.width - padX * 2),
    height: textH,
  }
}
