/**
 * Special / Ascendant — design blueprint is 1488×2076; mapped into the UMPS trim box
 * (1500×2100) with bleed offset so Ascendant sits on the same 1650×2250 stage as other layouts.
 */
import { BLEED_PX, TRIM_HEIGHT, TRIM_WIDTH } from './geometryAuthority'

export const ASCENDANT_DESIGN_WIDTH = 1488
export const ASCENDANT_DESIGN_HEIGHT = 2076

const SX = TRIM_WIDTH / ASCENDANT_DESIGN_WIDTH
const SY = TRIM_HEIGHT / ASCENDANT_DESIGN_HEIGHT

/** Mana pip diameter scale vs blueprint (user: +30%). */
export const ASCENDANT_MANA_PIP_SCALE = 1.3
/** P/T outer box height scale vs blueprint (user: +30%). */
export const ASCENDANT_PT_HEIGHT_SCALE = 1.3
/** Footer / collector data downward nudge (stage px). */
export const ASCENDANT_COLLECTOR_DATA_DOWN_NUDGE_PX = 18
/** Expansion symbol diameter as a fraction of rules-box corner sit size. */
export const ASCENDANT_EXPANSION_SYMBOL_FILL = 0.82

export type AscendantStageRect = {
  x: number
  y: number
  width: number
  height: number
}

export type AscendantStageRects = {
  nameBar: AscendantStageRect
  art: AscendantStageRect
  typeLine: AscendantStageRect
  rulesText: AscendantStageRect
  metadataStrip: AscendantStageRect
  lowerRight: AscendantStageRect
  flavorText: AscendantStageRect
  expansionSymbol: AscendantStageRect
  hologram: AscendantStageRect
  manaColumn: AscendantStageRect
}

/** Max mana-cost pips rendered in the floating column. */
export const ASCENDANT_MANA_SLOT_COUNT = 10

/** Blueprint diameter for each mana circle (design px). */
const MANA_DIAMETER_DESIGN = 72
/** Blueprint center-to-center spacing (design px). */
const MANA_SLOT_STEP_DESIGN = 80

function sx(n: number): number {
  return Math.round(n * SX)
}

function sy(n: number): number {
  return Math.round(n * SY)
}

/** Map a blueprint X into stage coordinates (trim + bleed). */
export function ascendantDesignXToStage(x: number): number {
  return BLEED_PX + sx(x)
}

/** Map a blueprint Y into stage coordinates (trim + bleed). */
export function ascendantDesignYToStage(y: number): number {
  return BLEED_PX + sy(y)
}

export function ascendantDesignRectToStage(rect: {
  x: number
  y: number
  w: number
  h: number
}): AscendantStageRect {
  return {
    x: ascendantDesignXToStage(rect.x),
    y: ascendantDesignYToStage(rect.y),
    width: sx(rect.w),
    height: sy(rect.h),
  }
}

export function ascendantDesignPointToStage(point: readonly [number, number]): [number, number] {
  return [ascendantDesignXToStage(point[0]), ascendantDesignYToStage(point[1])]
}

export function ascendantDesignPolygonToStage(
  points: readonly (readonly [number, number])[],
): number[] {
  const out: number[] = []
  for (const p of points) {
    const [x, y] = ascendantDesignPointToStage(p)
    out.push(x, y)
  }
  return out
}

export function getAscendantBorderGeometry(): {
  outer: AscendantStageRect & { cornerRadius: number; strokeWidth: number }
  inner: AscendantStageRect & { cornerRadius: number; strokeWidth: number }
  cardCornerRadius: number
} {
  /** Edge-to-edge inner mat: fill the full trim face (no inset band). */
  const inner: AscendantStageRect & { cornerRadius: number; strokeWidth: number } = {
    x: BLEED_PX,
    y: BLEED_PX,
    width: TRIM_WIDTH,
    height: TRIM_HEIGHT,
    cornerRadius: sy(72),
    strokeWidth: Math.max(1, Math.round(2 * Math.min(SX, SY))),
  }
  return {
    cardCornerRadius: sy(72),
    outer: {
      ...ascendantDesignRectToStage({ x: 16, y: 16, w: 1456, h: 2044 }),
      cornerRadius: Math.round(58 * Math.min(SX, SY)),
      strokeWidth: Math.max(2, Math.round(3 * Math.min(SX, SY))),
    },
    inner,
  }
}

export function getAscendantNamePlatePolygonStage(): number[] {
  return ascendantDesignPolygonToStage([
    [224, 72],
    [1328, 72],
    [1356, 100],
    [1356, 128],
    [1328, 156],
    [224, 156],
    [196, 128],
    [196, 100],
  ])
}

export function getAscendantFlavorRibbonPolygonsStage(): {
  body: number[]
  leftTail: number[]
  rightTail: number[]
} {
  return {
    body: ascendantDesignPolygonToStage([
      [132, 1348],
      [1356, 1348],
      [1392, 1384],
      [1356, 1420],
      [132, 1420],
      [96, 1384],
    ]),
    leftTail: ascendantDesignPolygonToStage([
      [96, 1360],
      [44, 1336],
      [72, 1384],
      [44, 1432],
      [96, 1408],
    ]),
    rightTail: ascendantDesignPolygonToStage([
      [1392, 1360],
      [1444, 1336],
      [1416, 1384],
      [1444, 1432],
      [1392, 1408],
    ]),
  }
}

export function getAscendantRulesBoxGeometryStage(): {
  rect: AscendantStageRect
  cornerRadius: number
  leftNotch: number[]
  rightNotch: number[]
} {
  return {
    rect: ascendantDesignRectToStage({ x: 96, y: 1444, w: 1296, h: 376 }),
    cornerRadius: Math.round(28 * Math.min(SX, SY)),
    leftNotch: ascendantDesignPolygonToStage([
      [96, 1560],
      [72, 1584],
      [96, 1608],
    ]),
    rightNotch: ascendantDesignPolygonToStage([
      [1392, 1560],
      [1416, 1584],
      [1392, 1608],
    ]),
  }
}

export function getAscendantTypeLineGeometryStage(): {
  capsule: AscendantStageRect
  cornerRadius: number
  leftPoint: number[]
  rightPoint: number[]
} {
  return {
    capsule: ascendantDesignRectToStage({ x: 128, y: 1844, w: 836, h: 64 }),
    cornerRadius: Math.round(32 * Math.min(SX, SY)),
    leftPoint: ascendantDesignPolygonToStage([
      [128, 1844],
      [88, 1876],
      [128, 1908],
    ]),
    rightPoint: ascendantDesignPolygonToStage([
      [964, 1844],
      [1004, 1876],
      [964, 1908],
    ]),
  }
}

export function getAscendantPtBoxGeometryStage(): {
  outer: AscendantStageRect
  cornerRadius: number
  text: AscendantStageRect
} {
  const base = ascendantDesignRectToStage({ x: 1048, y: 1844, w: 260, h: 64 })
  const height = Math.round(base.height * ASCENDANT_PT_HEIGHT_SCALE)
  const y = base.y - Math.round((height - base.height) / 2)
  const outer: AscendantStageRect = { ...base, y, height }
  const padX = Math.round(outer.width * 0.1)
  const padY = Math.round(outer.height * 0.12)
  return {
    outer,
    cornerRadius: Math.round(14 * Math.min(SX, SY) * ASCENDANT_PT_HEIGHT_SCALE),
    text: {
      x: outer.x + padX,
      y: outer.y + padY,
      width: Math.max(1, outer.width - padX * 2),
      height: Math.max(1, outer.height - padY * 2),
    },
  }
}

export function getAscendantArtWindowStrokeWidth(): number {
  return Math.max(2, Math.round(3 * Math.min(SX, SY)))
}

export type AscendantManaSlot = {
  index: number
  cx: number
  cy: number
  r: number
  x: number
  y: number
  diameter: number
}

/**
 * Fixed column of up to {@link ASCENDANT_MANA_SLOT_COUNT} circle slots.
 * Centers sit on the art window's left edge. Callers only draw occupied slots.
 */
export function getAscendantManaSlots(artLeftX?: number): readonly AscendantManaSlot[] {
  const diameter = Math.round(MANA_DIAMETER_DESIGN * Math.min(SX, SY) * ASCENDANT_MANA_PIP_SCALE)
  const r = diameter / 2
  const step = Math.round(sy(MANA_SLOT_STEP_DESIGN) * ASCENDANT_MANA_PIP_SCALE)
  const art = ascendantDesignRectToStage({ x: 96, y: 168, w: 1296, h: 1152 })
  const cx = artLeftX ?? art.x
  const firstCy = art.y + r + sy(20)
  const slots: AscendantManaSlot[] = []
  for (let i = 0; i < ASCENDANT_MANA_SLOT_COUNT; i++) {
    const cy = firstCy + i * step
    slots.push({
      index: i,
      cx,
      cy,
      r,
      x: Math.round(cx - r),
      y: Math.round(cy - r),
      diameter,
    })
  }
  return slots
}

/** Expansion symbol circle whose center sits on the rules box lower-right corner. */
export function getAscendantExpansionSymbolRect(rulesOuter?: AscendantStageRect): AscendantStageRect {
  const rules = rulesOuter ?? getAscendantRulesBoxGeometryStage().rect
  const diameter = Math.round(96 * Math.min(SX, SY))
  const cx = rules.x + rules.width
  const cy = rules.y + rules.height
  return {
    x: Math.round(cx - diameter / 2),
    y: Math.round(cy - diameter / 2),
    width: diameter,
    height: diameter,
  }
}

export function buildAscendantStageRects(): AscendantStageRects {
  /** Use nearly the full plate / capsule height so auto-fit fonts are not clipped. */
  const nameBar = ascendantDesignRectToStage({ x: 244, y: 80, w: 1040, h: 68 })
  const art = ascendantDesignRectToStage({ x: 96, y: 168, w: 1296, h: 1152 })
  const typeLine = ascendantDesignRectToStage({ x: 148, y: 1850, w: 796, h: 52 })
  const rulesText = ascendantDesignRectToStage({ x: 140, y: 1496, w: 1208, h: 260 })
  const metadataStrip = ascendantDesignRectToStage({ x: 128, y: 2012, w: 1232, h: 32 })
  const pt = getAscendantPtBoxGeometryStage()
  const lowerRight = pt.text
  /** Flavor shares the rules text region (rendered under oracle text). */
  const flavorText = { ...rulesText }
  const expansionSymbol = getAscendantExpansionSymbolRect(getAscendantRulesBoxGeometryStage().rect)
  const hologram = ascendantDesignRectToStage({ x: 694, y: 1920, w: 100, h: 100 })
  const manaSlots = getAscendantManaSlots(art.x)
  const first = manaSlots[0]!
  const last = manaSlots[manaSlots.length - 1]!
  const manaColumn: AscendantStageRect = {
    x: first.x,
    y: first.y,
    width: first.diameter,
    height: last.y + last.diameter - first.y,
  }

  return {
    nameBar,
    art,
    typeLine,
    rulesText,
    metadataStrip,
    lowerRight,
    flavorText,
    expansionSymbol,
    hologram,
    manaColumn,
  }
}
