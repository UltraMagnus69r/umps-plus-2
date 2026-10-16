/**
 * Standard / Modern (+ Land / Modern twin) seating.
 *
 * P0: regions come from Card Conjurer M15 Regular LayoutRecipe (measured trim-norm),
 * not mm-seeded / nudge composites. Procedural chrome still draws into these slots.
 */
import { BEVEL_INSET } from './geometryAuthority'
import {
  buildRecipeCoreStageRects,
  getRecipeManaPipGapPx,
  getRecipeManaPipSizePx,
  M15_REGULAR_CREATURE_RECIPE,
  type RecipeStageRect,
} from './recipes/layoutRecipeAuthority'
import type { PreModernTextBoxStageRect } from './preModernTextBoxAuthority'

export type ModernDummyStageRect = RecipeStageRect

export type ModernDummyStageRects = {
  nameBar: ModernDummyStageRect
  art: ModernDummyStageRect
  typeLine: ModernDummyStageRect
  rulesText: ModernDummyStageRect
  lowerRight: ModernDummyStageRect
}

/** @deprecated P0 seating no longer extends rules via nudge; kept for inner-border mat consumers. */
export const MODERN_DUMMY_RULES_TEXT_BOX_EXTRA_HEIGHT_PX = 0

/** Inner-border mat extends downward by this amount (Standard / Modern chrome). */
export const MODERN_DUMMY_INNER_BORDER_EXTRA_HEIGHT_PX = 50

/**
 * @deprecated Prefer {@link getModernDummyManaPipSizePx} from the M15 recipe.
 * Left at 1 so accidental legacy `ICON_SIZE * SCALE` paths stay near recipe size.
 */
export const MODERN_DUMMY_MANA_PIP_SCALE = 1

/** Collector Data footer shift for Standard / Modern and Borderless (P1 collector recipe TBD). */
export const MODERN_COLLECTOR_DATA_DOWN_NUDGE_PX = 8

/** Name plate and type line text stroke (Standard / Modern chrome). */
export const MODERN_PLATE_TEXT_STROKE_PX = 3
export const MODERN_PLATE_TEXT_STROKE_COLOR = '#000'

/** @deprecated PT slot comes from recipe; nudge unused. */
export const MODERN_DUMMY_PT_UP_NUDGE_PX = 0
/** @deprecated PT width comes from recipe. */
export const MODERN_DUMMY_PT_INNER_W_SCALE = 1

const RECIPE = M15_REGULAR_CREATURE_RECIPE

export function getModernDummyManaPipSizePx(): number {
  return getRecipeManaPipSizePx(RECIPE)
}

export function getModernDummyManaPipGapPx(): number {
  return getRecipeManaPipGapPx(RECIPE)
}

export function getModernDummyTextBoxOuterRect(): PreModernTextBoxStageRect {
  const inner = getModernDummyTextBoxInnerRect()
  return {
    x: inner.x - BEVEL_INSET,
    y: inner.y - BEVEL_INSET,
    width: inner.width + 2 * BEVEL_INSET,
    height: inner.height + 2 * BEVEL_INSET,
  }
}

export function getModernDummyTextBoxInnerRect(): PreModernTextBoxStageRect {
  const rects = buildModernDummyStageRects()
  return { ...rects.rulesText }
}

/**
 * Standard / Modern — M15 Regular recipe regions (trim-norm → stage).
 */
export function buildModernDummyStageRects(): ModernDummyStageRects {
  const r = buildRecipeCoreStageRects(RECIPE)
  return {
    nameBar: r.nameBar,
    art: r.art,
    typeLine: r.typeLine,
    rulesText: r.rulesText,
    lowerRight: r.lowerRight,
  }
}

/** Mana cost row stage rect from the same recipe (right-aligned pips). */
export function getModernDummyManaStageRect(): ModernDummyStageRect {
  return buildRecipeCoreStageRects(RECIPE).mana
}
