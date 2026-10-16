/**
 * Battle / Siege — landscape stack face (name → art → type → upright rules).
 * Regions are trim-norm of 2100×1500; BattleChromeLayer + battleLayoutAuthority own seating.
 */
import type { LayoutRecipe } from './layoutRecipeTypes'
import { M15_REGULAR_MANA_PIP_SIZE_PX } from './m15RegularCreatureRecipe'

const CC_PIP_SIZE_FRAC = 71 / 1638

const L_COLLECTOR = { x: 28 / 2100, y: 70 / 1500, w: 70 / 2100, h: 1360 / 1500 }
const L_TITLE = { x: 120 / 2100, y: 55 / 1500, w: 1860 / 2100, h: 110 / 1500 }
const L_MANA = { x: 1500 / 2100, y: 68 / 1500, w: 460 / 2100, h: 84 / 1500 }
const L_ART = { x: 120 / 2100, y: 180 / 1500, w: 1860 / 2100, h: 620 / 1500 }
const L_TYPE = { x: 120 / 2100, y: 815 / 1500, w: 1860 / 2100, h: 95 / 1500 }
const L_SET = { x: 1860 / 2100, y: 825 / 1500, w: 100 / 2100, h: 75 / 1500 }
const L_RULES = { x: 120 / 2100, y: 925 / 1500, w: 1860 / 2100, h: 500 / 1500 }
const L_DEFENSE = { x: 1840 / 2100, y: 1280 / 1500, w: 130 / 2100, h: 150 / 1500 }

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
  },
  acceptancePxAt600: {
    nameTop: 6,
    artEdge: 8,
    typeTop: 6,
    rulesEdge: 8,
    pipSize: 2,
  },
}
