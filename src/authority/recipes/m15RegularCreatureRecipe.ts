/**
 * Card Conjurer M15 Regular seating (packM15Regular) — numbers only, no frame assets.
 * Source: true-layout-fidelity-plan §1.2 / §7.
 */
import type { LayoutRecipe } from './layoutRecipeTypes'

/** 71/1638 — CC pack mana size fraction of their width reference. */
const CC_PIP_SIZE_FRAC = 71 / 1638

/**
 * Acceptance prefers ~71 px at 600 DPI trim; store absolute so metrics are unambiguous.
 * (CC fraction × 1500 ≈ 65; we lock the P0 acceptance target of 71±2.)
 */
export const M15_REGULAR_MANA_PIP_SIZE_PX = 71

export const M15_REGULAR_CREATURE_RECIPE: LayoutRecipe = {
  id: 'magic.m15.regular.creature',
  family: 'standard',
  variant: 'modern',
  space: 'trim-1500x2100',
  chrome: {
    mode: 'procedural',
    sheet: null,
    ptOverlay: null,
  },
  regions: {
    art: { x: 0.0767, y: 0.1129, w: 0.8476, h: 0.4429 },
    name: { x: 0.0854, y: 0.0522, w: 0.8292, h: 0.0543 },
    mana: { x: 0.0, y: 0.0613, w: 0.9292, h: 71 / 2100, align: 'right' },
    type: { x: 0.0854, y: 0.5664, w: 0.8292, h: 0.0543 },
    setSymbol: { x: 0.9213, y: 0.591, w: 0.12, h: 0.041, anchor: 'right-center' },
    rules: { x: 0.086, y: 0.6303, w: 0.828, h: 0.2875 },
    ptFrame: { x: 0.7573, y: 0.8848, w: 0.188, h: 0.0733 },
    ptText: { x: 0.7928, y: 0.902, w: 0.1367, h: 0.0372 },
    collector: { x: 0.06, y: 0.94, w: 0.88, h: 0.05 },
  },
  typography: {
    name: { font: 'belerenb', size: 0.0381, oneLine: true, minSize: 0.022 },
    type: { font: 'belerenb', size: 0.0324, oneLine: true, minSize: 0.02 },
    rules: { font: 'mplantin', size: 0.0362, minSize: 0.018, lineHeight: 1.2, vAlign: 'center' },
    pt: { font: 'belerenbsc', size: 0.0372, align: 'center' },
  },
  mana: {
    pipSize: CC_PIP_SIZE_FRAC,
    pipSizePx: M15_REGULAR_MANA_PIP_SIZE_PX,
    pipGap: 0,
    shadowX: -0.001,
    shadowY: 0.0029,
  },
  acceptancePxAt600: {
    nameTop: 4,
    artEdge: 6,
    typeTop: 4,
    rulesEdge: 6,
    ptCenter: 4,
    pipSize: 2,
  },
}
