/**
 * LayoutRecipe runtime — trim-norm → stage rects + typography/mana readers.
 */
import { BLEED_PX, TRIM_HEIGHT, TRIM_WIDTH } from '../geometryAuthority'
import type { LayoutId } from '../layoutTaxonomy'
import { BATTLE_REGULAR_RECIPE } from './battleRegularRecipe'
import { CLASS_REGULAR_RECIPE } from './classRegularRecipe'
import { M15_REGULAR_CREATURE_RECIPE, M15_REGULAR_MANA_PIP_SIZE_PX } from './m15RegularCreatureRecipe'
import { SAGA_CREATURE_RECIPE } from './sagaCreatureRecipe'
import { SAGA_REGULAR_RECIPE } from './sagaRegularRecipe'
import type { LayoutRecipe, TrimNormRect } from './layoutRecipeTypes'

export type RecipeStageRect = {
  x: number
  y: number
  width: number
  height: number
}

export type RecipeCoreStageRects = {
  nameBar: RecipeStageRect
  art: RecipeStageRect
  typeLine: RecipeStageRect
  rulesText: RecipeStageRect
  lowerRight: RecipeStageRect
  mana: RecipeStageRect
  metadataStrip?: RecipeStageRect
}

/** Convert a trim-normalized rect (0–1 of 1500×2100) to stage pixels (+ bleed). */
export function trimNormToStageRect(rect: TrimNormRect): RecipeStageRect {
  return {
    x: Math.round(rect.x * TRIM_WIDTH + BLEED_PX),
    y: Math.round(rect.y * TRIM_HEIGHT + BLEED_PX),
    width: Math.round(rect.w * TRIM_WIDTH),
    height: Math.round(rect.h * TRIM_HEIGHT),
  }
}

export function trimNormSizeToStagePx(sizeNorm: number, axis: 'x' | 'y' = 'y'): number {
  const span = axis === 'x' ? TRIM_WIDTH : TRIM_HEIGHT
  return Math.round(sizeNorm * span)
}

/**
 * Layouts that seat from the M15 Regular recipe (Standard/Land Modern path and
 * chrome twins that inherit those plate/rules slots).
 */
export function layoutUsesM15RegularRecipe(layout: Partial<LayoutId> | null | undefined): boolean {
  if (!layout?.family || !layout.variant) return false
  if (layout.family !== 'standard' && layout.family !== 'land') return false
  return (
    layout.variant === 'modern' ||
    layout.variant === 'borderless' ||
    layout.variant === 'full-art'
  )
}

export function layoutUsesClassRecipe(layout: Partial<LayoutId> | null | undefined): boolean {
  return layout?.family === 'spell' && layout?.variant === 'class'
}

export function layoutUsesSagaRecipe(layout: Partial<LayoutId> | null | undefined): boolean {
  return layout?.family === 'spell' && layout?.variant === 'saga'
}

export function layoutUsesSagaCreatureRecipe(layout: Partial<LayoutId> | null | undefined): boolean {
  return layout?.family === 'standard' && layout?.variant === 'saga-creature'
}

export function layoutUsesBattleRecipe(layout: Partial<LayoutId> | null | undefined): boolean {
  return layout?.family === 'battle'
}

export function getLayoutRecipe(layout: Partial<LayoutId> | null | undefined): LayoutRecipe | null {
  if (layoutUsesSagaCreatureRecipe(layout)) return SAGA_CREATURE_RECIPE
  if (layoutUsesM15RegularRecipe(layout)) return M15_REGULAR_CREATURE_RECIPE
  if (layoutUsesClassRecipe(layout)) return CLASS_REGULAR_RECIPE
  if (layoutUsesSagaRecipe(layout)) return SAGA_REGULAR_RECIPE
  if (layoutUsesBattleRecipe(layout)) return BATTLE_REGULAR_RECIPE
  return null
}

export function buildRecipeCoreStageRects(recipe: LayoutRecipe): RecipeCoreStageRects {
  const nameBar = trimNormToStageRect(recipe.regions.name)
  const art = trimNormToStageRect(recipe.regions.art)
  const typeLine = trimNormToStageRect(recipe.regions.type)
  const rulesText = trimNormToStageRect(recipe.regions.rules)
  const lowerRight = trimNormToStageRect(recipe.regions.ptText)
  const mana = trimNormToStageRect(recipe.regions.mana)
  const metadataStrip = recipe.regions.collector
    ? trimNormToStageRect(recipe.regions.collector)
    : undefined
  return { nameBar, art, typeLine, rulesText, lowerRight, mana, metadataStrip }
}

export function buildRecipeExtensionStageRects(
  recipe: LayoutRecipe,
): Record<string, RecipeStageRect> | undefined {
  if (!recipe.extensions) return undefined
  const out: Record<string, RecipeStageRect> = {}
  for (const [key, rect] of Object.entries(recipe.extensions)) {
    out[key] = trimNormToStageRect(rect)
  }
  return out
}

export function getRecipeManaPipSizePx(recipe: LayoutRecipe): number {
  if (typeof recipe.mana.pipSizePx === 'number' && Number.isFinite(recipe.mana.pipSizePx)) {
    return Math.round(recipe.mana.pipSizePx)
  }
  return Math.round(recipe.mana.pipSize * TRIM_WIDTH)
}

export function getRecipeManaPipGapPx(recipe: LayoutRecipe): number {
  const g = recipe.mana.pipGap
  if (!Number.isFinite(g) || g <= 0) return 0
  // Treat values < 1 as trim-width fractions; otherwise absolute px.
  if (g < 1) return Math.round(g * TRIM_WIDTH)
  return Math.round(g)
}

export function getRecipeTypographySizePx(
  recipe: LayoutRecipe,
  field: 'name' | 'type' | 'rules' | 'pt',
): number {
  return trimNormSizeToStagePx(recipe.typography[field].size, 'y')
}

export function getRecipeTypographyMinSizePx(
  recipe: LayoutRecipe,
  field: 'name' | 'type' | 'rules' | 'pt',
): number | null {
  const min = recipe.typography[field].minSize
  if (typeof min !== 'number' || !Number.isFinite(min)) return null
  return trimNormSizeToStagePx(min, 'y')
}

export {
  M15_REGULAR_CREATURE_RECIPE,
  M15_REGULAR_MANA_PIP_SIZE_PX,
  CLASS_REGULAR_RECIPE,
  SAGA_REGULAR_RECIPE,
  SAGA_CREATURE_RECIPE,
  BATTLE_REGULAR_RECIPE,
}
