/**
 * Battle / Siege — true landscape face (CC packBattle).
 * Regions are trim-norm of 2100×1500; BattleChromeLayer + battleLayoutAuthority own seating.
 */
import type { LayoutRecipe } from './layoutRecipeTypes'
import { M15_REGULAR_MANA_PIP_SIZE_PX } from './m15RegularCreatureRecipe'

const CC_PIP_SIZE_FRAC = 71 / 1638

/** CC Battle landscape fractions (x/w ÷2100, y/h ÷1500). */
/** Visible aperture between name strip and right column (not under type/rules chrome). */
const L_ART = { x: 167 / 2100, y: 60 / 1500, w: (1680 - 167) / 2100, h: 1371 / 1500 }
const L_TITLE = { x: 48 / 2100, y: 70 / 1500, w: 110 / 2100, h: 1260 / 1500 }
const L_MANA = { x: 48 / 2100, y: 78 / 1500, w: 110 / 2100, h: 200 / 1500 }
const L_TYPE = { x: 1680 / 2100, y: 70 / 1500, w: 360 / 2100, h: 100 / 1500 }
const L_RULES = { x: 1680 / 2100, y: 180 / 1500, w: 360 / 2100, h: 1180 / 1500 }
const L_DEFENSE = { x: 1920 / 2100, y: 60 / 1500, w: 120 / 2100, h: 140 / 1500 }
const L_SET = { x: 1945 / 2100, y: 78 / 1500, w: 90 / 2100, h: 86 / 1500 }
const L_COLLECTOR = { x: 180 / 2100, y: 1410 / 1500, w: 1740 / 2100, h: 70 / 1500 }

export const BATTLE_REGULAR_RECIPE: LayoutRecipe = {
  id: 'magic.battle.regular',
  family: 'battle',
  variant: 'modern',
  /** Landscape trim; consumers that assume portrait must use battleLayoutAuthority. */
  space: 'trim-1500x2100',
  chrome: {
    mode: 'procedural',
    sheet: null,
    ptOverlay: null,
  },
  regions: {
    art: L_ART,
    name: L_TITLE,
    mana: { ...L_MANA, align: 'center' },
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
  },
  acceptancePxAt600: {
    nameTop: 6,
    artEdge: 8,
    typeTop: 6,
    rulesEdge: 8,
    pipSize: 2,
  },
}
