/**
 * Battle / Siege — landscape stack face (name → art → type → upright rules).
 * Regions are trim-norm of 2100×1500; BattleChromeLayer + battleLayoutAuthority own seating.
 */
import type { LayoutRecipe } from './layoutRecipeTypes'
import { M15_REGULAR_MANA_PIP_SIZE_PX } from './m15RegularCreatureRecipe'

const CC_PIP_SIZE_FRAC = 71 / 1638

const WIDEN_RIGHT = 24 / 2100
const CONTENT_X = 108 / 2100
const CONTENT_W = 1930 / 2100 + WIDEN_RIGHT
const TOP = 44 / 1500
const BOTTOM = 40 / 1500
const PLATE_H = 92 / 1500
const RULES_H = 528 / 1500
const NAME_Y = TOP
const ART_Y = NAME_Y + PLATE_H
const RULES_BOTTOM = 1 - BOTTOM
const RULES_Y = RULES_BOTTOM - RULES_H
const TYPE_Y = RULES_Y - PLATE_H
const ART_H = TYPE_Y - ART_Y
const RULES_RIGHT = CONTENT_X + CONTENT_W
const DEFENSE_W = 138 / 2100
const DEFENSE_H = 158 / 1500
const TRANSFORM_SIZE = 108 / 2100
const TRANSFORM_SIZE_Y = 108 / 1500

const L_COLLECTOR = { x: 22 / 2100, y: 56 / 1500, w: 72 / 2100, h: 1390 / 1500 }
const L_TITLE = { x: CONTENT_X, y: NAME_Y, w: CONTENT_W, h: PLATE_H }
const L_MANA = {
  x: CONTENT_X + CONTENT_W - 460 / 2100,
  y: NAME_Y + (PLATE_H - 72 / 1500) / 2,
  w: 440 / 2100,
  h: 72 / 1500,
}
const L_ART = { x: CONTENT_X, y: ART_Y, w: CONTENT_W, h: ART_H }
const L_TYPE = { x: CONTENT_X, y: TYPE_Y, w: CONTENT_W, h: PLATE_H }
const L_SET = {
  x: CONTENT_X + CONTENT_W - 120 / 2100,
  y: TYPE_Y + (PLATE_H - 68 / 1500) / 2,
  w: 96 / 2100,
  h: 68 / 1500,
}
const L_RULES = { x: CONTENT_X, y: RULES_Y, w: CONTENT_W, h: RULES_H }
const L_DEFENSE = {
  x: RULES_RIGHT - DEFENSE_W / 2,
  y: RULES_BOTTOM - DEFENSE_H / 2,
  w: DEFENSE_W,
  h: DEFENSE_H,
}
const L_HOLOGRAM = {
  x: 10 / 2100,
  y: ART_Y + ART_H / 2 - 55 / 1500,
  w: 68 / 2100,
  h: 110 / 1500,
}
const L_TRANSFORM = {
  x: CONTENT_X - 6 / 2100,
  y: NAME_Y + PLATE_H / 2 - TRANSFORM_SIZE_Y / 2,
  w: TRANSFORM_SIZE,
  h: TRANSFORM_SIZE_Y,
}

export const BATTLE_REGULAR_RECIPE: LayoutRecipe = {
  id: 'magic.battle.regular',
  family: 'battle',
  variant: 'modern',
  /** Landscape trim; BattleChromeLayer owns upright stack seating. */
  space: 'trim-1500x2100',
  chrome: {
    mode: 'procedural',
    sheet: null,
    ptOverlay: null,
  },
  regions: {
    art: L_ART,
    name: L_TITLE,
    mana: { ...L_MANA, align: 'right' },
    type: L_TYPE,
    setSymbol: { ...L_SET, anchor: 'right-center' },
    rules: L_RULES,
    ptText: L_DEFENSE,
    collector: L_COLLECTOR,
  },
  typography: {
    name: { font: 'belerenb', size: 0.0381, oneLine: true, minSize: 0.022 },
    type: { font: 'belerenb', size: 0.0324, oneLine: true, minSize: 0.02 },
    rules: { font: 'mplantin', size: 0.0362, minSize: 0.018, lineHeight: 1.2, vAlign: 'top' },
    pt: { font: 'belerenbsc', size: 0.0372, align: 'center' },
  },
  mana: {
    pipSize: CC_PIP_SIZE_FRAC,
    pipSizePx: M15_REGULAR_MANA_PIP_SIZE_PX,
    pipGap: 0,
    shadowX: -0.001,
    shadowY: 0.0029,
  },
  extensions: {
    defense: L_DEFENSE,
    collectorStrip: L_COLLECTOR,
    hologram: L_HOLOGRAM,
    transform: L_TRANSFORM,
  },
  acceptancePxAt600: {
    nameTop: 6,
    artEdge: 8,
    typeTop: 6,
    rulesEdge: 8,
    pipSize: 2,
  },
}
