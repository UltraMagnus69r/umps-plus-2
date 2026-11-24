/**
 * Battle / Siege — Modern Spell seating baseline.
 * Regions/typography/mana mirror M15 Regular (same stack as Spell / Modern).
 * No side-column / MotM / Zendikar FACE.
 */
import type { LayoutRecipe } from './layoutRecipeTypes'
import { M15_REGULAR_CREATURE_RECIPE, M15_REGULAR_MANA_PIP_SIZE_PX } from './m15RegularCreatureRecipe'

export const BATTLE_REGULAR_RECIPE: LayoutRecipe = {
  ...M15_REGULAR_CREATURE_RECIPE,
  id: 'magic.battle.regular',
  family: 'battle',
  variant: 'modern',
  chrome: {
    mode: 'procedural',
    sheet: null,
    ptOverlay: null,
  },
  mana: {
    ...M15_REGULAR_CREATURE_RECIPE.mana,
    pipSizePx: M15_REGULAR_MANA_PIP_SIZE_PX,
  },
  /** No Battle-only extensions on the Modern Spell baseline. */
  extensions: undefined,
}
