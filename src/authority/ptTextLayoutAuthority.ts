/**
 * P/T "P / T" seating — slash vertically centered in the box; power and toughness
 * share the same vertical middle / baseline band so the whole reading stays centered.
 * PKMN uses a separate split-half layout (no slash) and does not use this helper.
 */

export type PtTextPartRect = {
  text: string
  x: number
  y: number
  width: number
  height: number
}

export type PtSlashTextLayout = {
  power: PtTextPartRect
  slash: PtTextPartRect
  toughness: PtTextPartRect
}

const SLASH = '/'

/**
 * Beleren (and similar) ink sits low in the em box; Konva middle-align centers the
 * em box, so the whole P/T reading looks bottom-heavy. Shared lift keeps slash +
 * digits on one band while moving optical center up into the capsule.
 */
export function ptOpticalLiftPx(fontSize: number, boxH: number): number {
  // ~5% of font size — enough to correct Beleren's low ink without overshooting high.
  const fromFont = Math.round(Math.max(1, fontSize) * 0.05)
  const cap = Math.max(0, Math.floor(Math.max(1, boxH) * 0.08))
  return Math.min(fromFont, cap)
}

export function layoutPtSlashCenteredText(opts: {
  power: string
  toughness: string
  boxX: number
  boxY: number
  boxW: number
  boxH: number
  fontFamily: string
  fontStyle: string
  fontSize: number
  /** Horizontal packing inside the box. */
  align?: 'center' | 'right' | 'left'
  padX?: number
  measure: (text: string, fontFamily: string, fontStyle: string, fontSize: number) => number
}): PtSlashTextLayout {
  const power = String(opts.power ?? '')
  const toughness = String(opts.toughness ?? '')
  const padX = Math.max(0, opts.padX ?? 0)
  const innerX = opts.boxX + padX
  const innerW = Math.max(1, opts.boxW - padX * 2)
  const lift = ptOpticalLiftPx(opts.fontSize, opts.boxH)
  // Shift the shared middle band up so slash + digits optically center in the box.
  const y = opts.boxY - lift
  const height = Math.max(1, opts.boxH)

  const wPower = Math.max(0, opts.measure(power, opts.fontFamily, opts.fontStyle, opts.fontSize))
  const wSlash = Math.max(0, opts.measure(SLASH, opts.fontFamily, opts.fontStyle, opts.fontSize))
  const wTough = Math.max(0, opts.measure(toughness, opts.fontFamily, opts.fontStyle, opts.fontSize))
  const total = wPower + wSlash + wTough

  const align = opts.align ?? 'center'
  let cursor =
    align === 'right'
      ? innerX + Math.max(0, innerW - total)
      : align === 'left'
        ? innerX
        : innerX + Math.max(0, (innerW - total) / 2)

  const powerRect: PtTextPartRect = {
    text: power,
    x: cursor,
    y,
    width: Math.max(1, wPower),
    height,
  }
  cursor += wPower

  const slashRect: PtTextPartRect = {
    text: SLASH,
    x: cursor,
    y,
    width: Math.max(1, wSlash),
    height,
  }
  cursor += wSlash

  const toughnessRect: PtTextPartRect = {
    text: toughness,
    x: cursor,
    y,
    width: Math.max(1, wTough),
    height,
  }

  return { power: powerRect, slash: slashRect, toughness: toughnessRect }
}
