import { BEVEL_INSET, getStandardLayoutGeometry } from './geometryAuthority'
import {
  getPreModernTextBoxOuterRect,
  type PreModernTextBoxStageRect,
} from './preModernTextBoxAuthority'
import { buildSpellPreModernStageRects } from './spellPreModernLayoutAuthority'

export type ModernDummyStageRect = {
  x: number
  y: number
  width: number
  height: number
}

export type ModernDummyStageRects = {
  nameBar: ModernDummyStageRect
  art: ModernDummyStageRect
  typeLine: ModernDummyStageRect
  rulesText: ModernDummyStageRect
  lowerRight: ModernDummyStageRect
}

/** Extra rules text box height at the bottom (Standard / Modern only). Top edge unchanged. */
export const MODERN_DUMMY_RULES_TEXT_BOX_EXTRA_HEIGHT_PX = 50

/** Inner-border mat extends downward by this amount (Standard / Modern only). */
export const MODERN_DUMMY_INNER_BORDER_EXTRA_HEIGHT_PX = 50

/** Name-plate mana pip scale relative to {@link MANA_COST_ICON_SIZE}. */
export const MODERN_DUMMY_MANA_PIP_SCALE = 0.9

/** Collector Data footer shift for Standard / Modern and Borderless. */
export const MODERN_COLLECTOR_DATA_DOWN_NUDGE_PX = 8

/** Name plate and type line text stroke (Standard / Modern chrome). */
export const MODERN_PLATE_TEXT_STROKE_PX = 3
export const MODERN_PLATE_TEXT_STROKE_COLOR = '#000'

export function getModernDummyTextBoxOuterRect(): PreModernTextBoxStageRect {
  const base = getPreModernTextBoxOuterRect()
  return {
    ...base,
    height: base.height + MODERN_DUMMY_RULES_TEXT_BOX_EXTRA_HEIGHT_PX,
  }
}

export function getModernDummyTextBoxInnerRect(): PreModernTextBoxStageRect {
  const outer = getModernDummyTextBoxOuterRect()
  return {
    x: outer.x + BEVEL_INSET,
    y: outer.y + BEVEL_INSET,
    width: outer.width - 2 * BEVEL_INSET,
    height: outer.height - 2 * BEVEL_INSET,
  }
}

export const MODERN_DUMMY_PT_UP_NUDGE_PX = 50
export const MODERN_DUMMY_PT_INNER_W_SCALE = 0.85

/**
 * Standard / Modern — pre-modern art + rules column, modern plates + P/T box slot.
 */
export function buildModernDummyStageRects(): ModernDummyStageRects {
  const g = getStandardLayoutGeometry()
  const face = buildSpellPreModernStageRects()
  const rulesOuter = getModernDummyTextBoxOuterRect()
  const rulesInner = getModernDummyTextBoxInnerRect()

  const artInner = face.art
  const artOuterTop = artInner.y - BEVEL_INSET
  const artOuterBottom = artInner.y + artInner.height + BEVEL_INSET

  const plateOuterH = Math.max(BEVEL_INSET * 2 + 8, rulesOuter.y - artOuterBottom)
  const plateOuterW = rulesOuter.width
  const plateOuterX = rulesOuter.x
  const plateInnerH = plateOuterH - 2 * BEVEL_INSET
  const plateInnerW = plateOuterW - 2 * BEVEL_INSET
  const plateInnerX = plateOuterX + BEVEL_INSET

  const typeLine: ModernDummyStageRect = {
    x: plateInnerX,
    y: artOuterBottom + BEVEL_INSET,
    width: plateInnerW,
    height: plateInnerH,
  }

  const nameBar: ModernDummyStageRect = {
    x: plateInnerX,
    y: artOuterTop - BEVEL_INSET - plateInnerH,
    width: plateInnerW,
    height: plateInnerH,
  }

  const rulesOuterBottom = rulesOuter.y + rulesOuter.height
  const ptInnerH = plateInnerH
  const ptInnerW = Math.max(72, Math.round(g.ptInnerW * MODERN_DUMMY_PT_INNER_W_SCALE))
  const ptInnerY = rulesOuterBottom + BEVEL_INSET - MODERN_DUMMY_PT_UP_NUDGE_PX
  const ptInnerX = rulesOuter.x + rulesOuter.width - BEVEL_INSET - ptInnerW

  return {
    nameBar,
    art: artInner,
    typeLine,
    rulesText: rulesInner,
    lowerRight: {
      x: ptInnerX,
      y: ptInnerY,
      width: ptInnerW,
      height: ptInnerH,
    },
  }
}
