import { BEVEL_INSET, getStandardLayoutGeometry, INNER_BORDER_CORNER_RADIUS_MODERN } from './geometryAuthority'
import {
  MODERN_DUMMY_INNER_BORDER_EXTRA_HEIGHT_PX,
  MODERN_DUMMY_PT_INNER_W_SCALE,
  MODERN_DUMMY_PT_UP_NUDGE_PX,
  MODERN_DUMMY_RULES_TEXT_BOX_EXTRA_HEIGHT_PX,
  type ModernDummyStageRect,
  type ModernDummyStageRects,
} from './modernDummyLayoutAuthority'

/** Gap between rules box left edge and loyalty badge right edge. */
export const PW_MODERN_V2_BADGE_OUTSIDE_GAP_PX = 8

/** Nudge loyalty badges right (stage px); rules box position unchanged. */
export const PW_MODERN_V2_BADGE_SHIFT_RIGHT_PX = 60

/** Rules text box width as a fraction of the inner mat. */
export const PW_MODERN_V2_RULES_WIDTH_SCALE = 0.72

/** Inset from inner-mat right edge to rules box right edge. */
export const PW_MODERN_V2_RULES_RIGHT_MARGIN_PX = 18

/** Shift entire rules text box left (stage px). */
export const PW_MODERN_V2_RULES_SHIFT_LEFT_PX = 30

/** Extra rules box width added toward the left (stage px). */
export const PW_MODERN_V2_RULES_EXTRA_WIDTH_LEFT_PX = 200

/** Ability loyalty badge display scale multiplier (Modern V2 only). */
export const PW_MODERN_V2_ABILITY_BADGE_SCALE = 1.15

/** Outward bow depth on art top/bottom edges (stage px). */
export const PW_MODERN_V2_ART_BOW_DEPTH_PX = 20

/** Outward bow depth on the rules text box bottom edge (stage px) — 2× art bow. */
export const PW_MODERN_V2_RULES_BOX_BOTTOM_BOW_DEPTH_PX = PW_MODERN_V2_ART_BOW_DEPTH_PX * 2

/** Bottom corner radius on the bowed rules text box (stage px). */
export const PW_MODERN_V2_RULES_BOX_BOTTOM_CORNER_RADIUS_PX = 40

/** @deprecated Use {@link PW_MODERN_V2_RULES_BOX_BOTTOM_CORNER_RADIUS_PX}. */
export const PW_MODERN_V2_RULES_BOX_CORNER_RADIUS_PX = PW_MODERN_V2_RULES_BOX_BOTTOM_CORNER_RADIUS_PX

/** Corner radius on the bowed art outer frame (stage px). */
export const PW_MODERN_V2_ART_FRAME_CORNER_RADIUS_PX = 30

/** Extra width added to the art box (stage px); expands symmetrically from center. */
export const PW_MODERN_V2_ART_EXTRA_WIDTH_PX = 20

/** Name / type plate corner radius multiplier vs standard barRadius. */
export const PW_MODERN_V2_PLATE_RADIUS_MULTIPLIER = 1.2

/** Corner radius on the unified Modern V2 chrome border (stage px). */
export const PW_MODERN_V2_UNIFIED_BORDER_CORNER_RADIUS_PX = 24

/** Toggle unified outer chrome border on Modern V2 (temporary — set false to hide while tuning). */
export const PW_MODERN_V2_UNIFIED_BORDER_ENABLED = false

/** Nudge collector line + footer rows below it downward (stage px). */
export const PW_MODERN_V2_COLLECTOR_DATA_DOWN_NUDGE_PX = 20

/** Nudge rarity hologram seal downward (stage px). */
export const PW_MODERN_V2_HOLOGRAM_DOWN_NUDGE_PX = 27

/** Additional starting-loyalty shield nudge on Modern V2 (stage px). */
export const PW_MODERN_V2_STARTING_LOYALTY_NUDGE_X_PX = 10
export const PW_MODERN_V2_STARTING_LOYALTY_NUDGE_Y_PX = -40

/** Inner-border bottom-right corner radius scale on Modern V2 (50% of modern). */
export const PW_MODERN_V2_INNER_BORDER_BOTTOM_RIGHT_CORNER_RADIUS_SCALE = 0.5

/** Modern V2 inner-border mat corner radii — bottom-right only, halved vs standard modern. */
export function getPlaneswalkerModernV2InnerBorderCornerRadius(): readonly number[] {
  const [topLeft, topRight, bottomRight, bottomLeft] = INNER_BORDER_CORNER_RADIUS_MODERN
  return [
    topLeft,
    topRight,
    Math.round(bottomRight * PW_MODERN_V2_INNER_BORDER_BOTTOM_RIGHT_CORNER_RADIUS_SCALE),
    bottomLeft,
  ]
}

export type PlaneswalkerModernV2ChromeOuterRect = {
  x: number
  y: number
  width: number
  height: number
}

function outerRectFromInner(inner: ModernDummyStageRect): PlaneswalkerModernV2ChromeOuterRect {
  return {
    x: inner.x - BEVEL_INSET,
    y: inner.y - BEVEL_INSET,
    width: inner.width + 2 * BEVEL_INSET,
    height: inner.height + 2 * BEVEL_INSET,
  }
}

/** Bounding outer rect wrapping name, art, type, and rules chrome on Modern V2. */
export function getPlaneswalkerModernV2UnifiedChromeOuterRect(): PlaneswalkerModernV2ChromeOuterRect {
  const g = getStandardLayoutGeometry()
  const rules = resolvePlaneswalkerModernV2RulesOuterRect()
  const rects: PlaneswalkerModernV2ChromeOuterRect[] = [
    outerRectFromInner({ x: g.nameInnerX, y: g.nameInnerY, width: g.nameInnerW, height: g.nameInnerH }),
    getPlaneswalkerModernV2ArtOuterRect(),
    outerRectFromInner({ x: g.typeInnerX, y: g.typeInnerY, width: g.typeInnerW, height: g.typeInnerH }),
    { x: rules.x, y: rules.y, width: rules.width, height: rules.height },
  ]
  const left = Math.min(...rects.map((r) => r.x))
  const top = Math.min(...rects.map((r) => r.y))
  const right = Math.max(...rects.map((r) => r.x + r.width))
  const bottom = Math.max(...rects.map((r) => r.y + r.height))
  return { x: left, y: top, width: right - left, height: bottom - top }
}

/** @deprecated Use {@link PW_MODERN_V2_BADGE_OUTSIDE_GAP_PX} — kept for badge gutter width estimate. */
export const PW_MODERN_V2_BADGE_GUTTER_PX = 56

function resolvePlaneswalkerModernV2ArtInnerRect(): ModernDummyStageRect {
  const g = getStandardLayoutGeometry()
  const shift = -Math.round(PW_MODERN_V2_ART_EXTRA_WIDTH_PX / 2)
  return {
    x: g.artInnerX + shift,
    y: g.artInnerY,
    width: g.artInnerW + PW_MODERN_V2_ART_EXTRA_WIDTH_PX,
    height: g.artInnerH,
  }
}

/** Art window inner rect (stage px) — live V2 geometry for art clip and registry regions. */
export function getPlaneswalkerModernV2ArtInnerRect(): ModernDummyStageRect {
  return resolvePlaneswalkerModernV2ArtInnerRect()
}

/** Art frame outer rect (stage px) — includes bevel inset for bowed frame chrome. */
export function getPlaneswalkerModernV2ArtOuterRect(): PlaneswalkerModernV2ChromeOuterRect {
  return outerRectFromInner(resolvePlaneswalkerModernV2ArtInnerRect())
}

function resolvePlaneswalkerModernV2RulesOuterRect(): ModernDummyStageRect {
  const g = getStandardLayoutGeometry()
  const baseWidth = Math.round(g.innerW * PW_MODERN_V2_RULES_WIDTH_SCALE)
  const width = baseWidth + PW_MODERN_V2_RULES_EXTRA_WIDTH_LEFT_PX
  const x =
    g.innerX +
    g.innerW -
    PW_MODERN_V2_RULES_RIGHT_MARGIN_PX -
    baseWidth -
    PW_MODERN_V2_RULES_SHIFT_LEFT_PX -
    PW_MODERN_V2_RULES_EXTRA_WIDTH_LEFT_PX
  return {
    x,
    y: g.rulesY,
    width,
    height: g.rulesH + MODERN_DUMMY_RULES_TEXT_BOX_EXTRA_HEIGHT_PX,
  }
}

export function getPlaneswalkerModernV2TextBoxOuterRect(): ModernDummyStageRect {
  return resolvePlaneswalkerModernV2RulesOuterRect()
}

export function getPlaneswalkerModernV2TextBoxInnerRect(): ModernDummyStageRect {
  const outer = resolvePlaneswalkerModernV2RulesOuterRect()
  return {
    x: outer.x + BEVEL_INSET,
    y: outer.y + BEVEL_INSET,
    width: outer.width - 2 * BEVEL_INSET,
    height: outer.height - 2 * BEVEL_INSET,
  }
}

/** Right edge X for loyalty badges (stage px) — always from live V2 geometry, not frozen registry rects. */
export function getPlaneswalkerModernV2BadgeRightEdgeX(): number {
  const outer = resolvePlaneswalkerModernV2RulesOuterRect()
  return outer.x - PW_MODERN_V2_BADGE_OUTSIDE_GAP_PX + PW_MODERN_V2_BADGE_SHIFT_RIGHT_PX
}

/**
 * Planeswalker / Modern V2 — full-width standard name / art / type stack,
 * right-offset narrower rules box, bowed art frame, badge gutter left of rules.
 */
export function buildPlaneswalkerModernV2StageRects(): ModernDummyStageRects {
  const g = getStandardLayoutGeometry()
  const rulesOuter = resolvePlaneswalkerModernV2RulesOuterRect()
  const rulesInner = getPlaneswalkerModernV2TextBoxInnerRect()

  const nameBar: ModernDummyStageRect = {
    x: g.nameInnerX,
    y: g.nameInnerY,
    width: g.nameInnerW,
    height: g.nameInnerH,
  }

  const art = resolvePlaneswalkerModernV2ArtInnerRect()

  const typeLine: ModernDummyStageRect = {
    x: g.typeInnerX,
    y: g.typeInnerY,
    width: g.typeInnerW,
    height: g.typeInnerH,
  }

  const rulesOuterBottom = rulesOuter.y + rulesOuter.height
  const ptInnerH = g.typeInnerH
  const ptInnerW = Math.max(72, Math.round(g.ptInnerW * MODERN_DUMMY_PT_INNER_W_SCALE))
  const ptInnerY = rulesOuterBottom + BEVEL_INSET - MODERN_DUMMY_PT_UP_NUDGE_PX
  const ptInnerX = rulesOuter.x + rulesOuter.width - BEVEL_INSET - ptInnerW

  return {
    nameBar,
    art,
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

export {
  MODERN_DUMMY_INNER_BORDER_EXTRA_HEIGHT_PX,
  MODERN_DUMMY_RULES_TEXT_BOX_EXTRA_HEIGHT_PX,
}
