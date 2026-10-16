/**
 * Prepared Creatures — M15 regular top geometry + split rules extensions.
 */
import type { LayoutRecipe } from './layoutRecipeTypes'
import { M15_REGULAR_CREATURE_RECIPE, M15_REGULAR_MANA_PIP_SIZE_PX } from './m15RegularCreatureRecipe'

const RULES = M15_REGULAR_CREATURE_RECIPE.regions.rules
const GAP = 0.012
const LEFT_W = (RULES.w - GAP) / 2
const RIGHT_X = RULES.x + LEFT_W + GAP
const RIGHT_W = RULES.w - LEFT_W - GAP

const L_PREPARED_RULES = { x: RULES.x, y: RULES.y, w: LEFT_W, h: RULES.h }
const L_SPELL_COLUMN = { x: RIGHT_X, y: RULES.y, w: RIGHT_W, h: RULES.h }
const L_SPELL_NAME = { x: RIGHT_X, y: RULES.y, w: RIGHT_W, h: RULES.h * 0.18 }
const L_SPELL_TYPE = { x: RIGHT_X, y: RULES.y + RULES.h * 0.18, w: RIGHT_W, h: RULES.h * 0.12 }
const L_SPELL_TEXT = {
  x: RIGHT_X,
  y: RULES.y + RULES.h * 0.3,
  w: RIGHT_W,
  h: RULES.h * 0.7,
}

export const PREPARED_REGULAR_RECIPE: LayoutRecipe = {
  id: 'magic.prepared.regular',
  family: 'prepared',
  variant: 'modern',
  space: 'trim-1500x2100',
  chrome: {
    mode: 'procedural',
    sheet: null,
    ptOverlay: null,
  },
  regions: {
    ...M15_REGULAR_CREATURE_RECIPE.regions,
  },
  typography: {
    ...M15_REGULAR_CREATURE_RECIPE.typography,
    rules: { ...M15_REGULAR_CREATURE_RECIPE.typography.rules, vAlign: 'top' },
  },
  mana: {
    ...M15_REGULAR_CREATURE_RECIPE.mana,
    pipSizePx: M15_REGULAR_MANA_PIP_SIZE_PX,
  },
  extensions: {
    preparedRules: L_PREPARED_RULES,
    spellColumn: L_SPELL_COLUMN,
    spellName: L_SPELL_NAME,
    spellType: L_SPELL_TYPE,
    spellText: L_SPELL_TEXT,
  },
  acceptancePxAt600: {
    ...M15_REGULAR_CREATURE_RECIPE.acceptancePxAt600,
  },
}
