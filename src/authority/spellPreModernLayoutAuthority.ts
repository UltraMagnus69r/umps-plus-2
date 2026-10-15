import { SPELL_TEXT_BOX_OUTSET_PX, SPELL_TEXT_BOX_INSET_LEFT_PX, SPELL_TEXT_BOX_INSET_RIGHT_PX } from '../data/spellPanelOptions'
import { getSpellPreModernManaCostIconSizePx } from './symbolAuthority'
import { TYPE_LINE_BASE_HEIGHT_RATIO } from './typographyAuthority'
import {
  BEVEL_INSET,
  METADATA_FONT_SIZE,
  SPELL_PRE_MODERN_ART_EXTRA_HEIGHT_PX,
  SPELL_PRE_MODERN_NAME_STRIP_PADDING_PX,
  SPELL_PRE_MODERN_RULES_SHIFT_RIGHT_PX,
  SPELL_PRE_MODERN_SPELL_BOX_SHIFT_UP_PX,
  SPELL_PRE_MODERN_TYPE_LINE_STRIP_PADDING_PX,
  getPreModernLayoutVerticalShiftPx,
  getStandardLayoutGeometry,
} from './geometryAuthority'

export type SpellPreModernRulesInnerRect = {
  x: number
  y: number
  width: number
  height: number
}

export type SpellPreModernParchmentOuterRect = {
  x: number
  y: number
  width: number
  height: number
}

/** Parchment panel extends this far above the rules inner rect (bevel + texture outset). */
export function getSpellParchmentTopOutsetPx(): number {
  return BEVEL_INSET + SPELL_TEXT_BOX_OUTSET_PX
}

/** Matches default single-line type cap height used in TextIconsLayer. */
export function estimateSpellPreModernTypeLineCapPx(typeH: number): number {
  return Math.max(1, Math.floor(typeH * TYPE_LINE_BASE_HEIGHT_RATIO))
}

/** Visual parchment top: 22 px below type-line text bottom. */
export function getSpellPreModernParchmentTopPx(artOuterBottom: number, typeCapPx: number): number {
  const typeTextBottom =
    artOuterBottom + SPELL_PRE_MODERN_TYPE_LINE_STRIP_PADDING_PX + typeCapPx
  return typeTextBottom + SPELL_PRE_MODERN_TYPE_LINE_STRIP_PADDING_PX
}

export function getSpellPreModernInnerBorderBottomPx(
  g: ReturnType<typeof getStandardLayoutGeometry>,
): number {
  const topMargin = g.innerY - g.trimY
  return g.trimY + g.trimH - topMargin
}

export function resolveSpellPreModernRulesInnerRect(
  g: ReturnType<typeof getStandardLayoutGeometry>,
  artOuterBottom: number,
  typeCapPx: number,
): SpellPreModernRulesInnerRect {
  const parchmentTop = getSpellPreModernParchmentTopPx(artOuterBottom, typeCapPx)
  const rulesInnerY = parchmentTop + SPELL_TEXT_BOX_OUTSET_PX + BEVEL_INSET
  const innerBorderBottom = getSpellPreModernInnerBorderBottomPx(g)
  const rulesInnerH = Math.max(
    240,
    innerBorderBottom - rulesInnerY - BEVEL_INSET - getSpellPreModernCollectorBandMinPx(),
  )
  return {
    x: g.rulesInnerX + SPELL_PRE_MODERN_RULES_SHIFT_RIGHT_PX,
    y: rulesInnerY,
    width: g.rulesInnerW,
    height: rulesInnerH,
  }
}

export function resolveSpellPreModernParchmentOuterRect(
  rulesInner: SpellPreModernRulesInnerRect,
): SpellPreModernParchmentOuterRect {
  const outset = SPELL_TEXT_BOX_OUTSET_PX
  return {
    x: rulesInner.x - BEVEL_INSET - outset + SPELL_TEXT_BOX_INSET_LEFT_PX,
    y: rulesInner.y - BEVEL_INSET - outset - SPELL_PRE_MODERN_SPELL_BOX_SHIFT_UP_PX,
    width:
      rulesInner.width + 2 * BEVEL_INSET + 2 * outset - SPELL_TEXT_BOX_INSET_LEFT_PX - SPELL_TEXT_BOX_INSET_RIGHT_PX,
    height: rulesInner.height + 2 * BEVEL_INSET + 2 * outset,
  }
}

function getSpellPreModernCollectorBandMinPx(): number {
  const lineHeight = Math.round(METADATA_FONT_SIZE * 1.08)
  return lineHeight * 2 + 6
}

function buildSpellPreModernNameStrip(baseNameStripH: number): {
  nameStripHeight: number
  artTopLiftPx: number
} {
  const nameStripHeight =
    SPELL_PRE_MODERN_NAME_STRIP_PADDING_PX +
    getSpellPreModernManaCostIconSizePx() +
    SPELL_PRE_MODERN_NAME_STRIP_PADDING_PX
  const artTopLiftPx = Math.max(0, baseNameStripH - nameStripHeight)
  return { nameStripHeight, artTopLiftPx }
}

export type SpellPreModernStageRects = {
  nameBar: { x: number; y: number; width: number; height: number }
  art: { x: number; y: number; width: number; height: number }
  typeLine: { x: number; y: number; width: number; height: number }
  rulesText: { x: number; y: number; width: number; height: number }
}

/**
 * Spell / Pre-Modern — old-border slot geometry:
 * parchment top sits 22 px below the type line text; rules fill remaining inner-mat height.
 */
export function buildSpellPreModernStageRects(): SpellPreModernStageRects {
  const g = getStandardLayoutGeometry()
  const shift = getPreModernLayoutVerticalShiftPx()
  const innerMatTop = g.innerY
  const artOuterTopBase = g.artY - shift
  const baseNameStripH = artOuterTopBase - innerMatTop
  const { nameStripHeight, artTopLiftPx } = buildSpellPreModernNameStrip(baseNameStripH)
  const artOuterTop = artOuterTopBase - artTopLiftPx
  const nameStripH = nameStripHeight
  const artOuterH = g.artH + SPELL_PRE_MODERN_ART_EXTRA_HEIGHT_PX
  const artOuterBottom = artOuterTop + artOuterH
  const typeCapPx = estimateSpellPreModernTypeLineCapPx(g.typeH)
  const rulesInner = resolveSpellPreModernRulesInnerRect(g, artOuterBottom, typeCapPx)

  const typeStripH =
    SPELL_PRE_MODERN_TYPE_LINE_STRIP_PADDING_PX + typeCapPx + SPELL_PRE_MODERN_TYPE_LINE_STRIP_PADDING_PX

  return {
    nameBar: {
      x: g.artInnerX,
      y: innerMatTop,
      width: g.artInnerW,
      height: nameStripH,
    },
    art: {
      x: g.artInnerX,
      y: artOuterTop + BEVEL_INSET,
      width: g.artInnerW,
      height: artOuterH - 2 * BEVEL_INSET,
    },
    typeLine: {
      x: g.artInnerX,
      y: artOuterBottom,
      width: g.artInnerW,
      height: typeStripH,
    },
    rulesText: {
      x: rulesInner.x,
      y: rulesInner.y,
      width: rulesInner.width,
      height: rulesInner.height,
    },
  }
}
