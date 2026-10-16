/**
 * Battle / Siege — landscape stack face (wider than tall).
 * Ground truth: fidelity-battle/battle-landscape-stack-reference.png
 * Top→bottom: nameplate, art, type, upright rules, defense; collector on left edge.
 */
import { BLEED_PX } from './geometryAuthority'
import type { LayoutId } from './layoutTaxonomy'
import { isBattleLayout } from './layoutTaxonomy'

export const BATTLE_TRIM_WIDTH = 2100
export const BATTLE_TRIM_HEIGHT = 1500
export const BATTLE_STAGE_WIDTH = BATTLE_TRIM_WIDTH + 2 * BLEED_PX // 2250
export const BATTLE_STAGE_HEIGHT = BATTLE_TRIM_HEIGHT + 2 * BLEED_PX // 1650

export type BattleStageRect = { x: number; y: number; width: number; height: number }

/** Landscape trim-norm (0–1 of 2100×1500) → stage px. */
function n(rect: { x: number; y: number; w: number; h: number }): BattleStageRect {
  return {
    x: Math.round(rect.x * BATTLE_TRIM_WIDTH + BLEED_PX),
    y: Math.round(rect.y * BATTLE_TRIM_HEIGHT + BLEED_PX),
    width: Math.round(rect.w * BATTLE_TRIM_WIDTH),
    height: Math.round(rect.h * BATTLE_TRIM_HEIGHT),
  }
}

/**
 * Landscape stack seating (trim-norm of 2100×1500).
 * Content reads upright; collector strip along the left edge is drawn rotated.
 */
const FACE = {
  /** Vertical collector / credit strip (text rotated 90° CW). */
  collector: { x: 28 / 2100, y: 70 / 1500, w: 70 / 2100, h: 1360 / 1500 },
  /** Horizontal nameplate — name left, mana right. */
  name: { x: 120 / 2100, y: 55 / 1500, w: 1860 / 2100, h: 110 / 1500 },
  /** DFC / transform mark on the left of the nameplate. */
  transform: { x: 135 / 2100, y: 72 / 1500, w: 76 / 2100, h: 76 / 1500 },
  /** Mana chips along the right of the nameplate. */
  mana: { x: 1500 / 2100, y: 68 / 1500, w: 460 / 2100, h: 84 / 1500 },
  /** Wide art aperture under the nameplate. */
  art: { x: 120 / 2100, y: 180 / 1500, w: 1860 / 2100, h: 620 / 1500 },
  /** Type line under art. */
  type: { x: 120 / 2100, y: 815 / 1500, w: 1860 / 2100, h: 95 / 1500 },
  setSymbol: { x: 1860 / 2100, y: 825 / 1500, w: 100 / 2100, h: 75 / 1500 },
  /** Tan parchment rules — upright text. */
  rules: { x: 120 / 2100, y: 925 / 1500, w: 1860 / 2100, h: 500 / 1500 },
  /** Defense shield overlapping bottom-right of rules. */
  defense: { x: 1840 / 2100, y: 1280 / 1500, w: 130 / 2100, h: 150 / 1500 },
} as const

export function layoutUsesBattleChrome(layout: Partial<LayoutId> | null | undefined): boolean {
  return isBattleLayout(layout)
}

export function getBattleStageSize(): { width: number; height: number } {
  return { width: BATTLE_STAGE_WIDTH, height: BATTLE_STAGE_HEIGHT }
}

export function getBattleArtRect(): BattleStageRect {
  return n(FACE.art)
}

export function getBattleNameRect(): BattleStageRect {
  return n(FACE.name)
}

export function getBattleManaRect(): BattleStageRect {
  return n(FACE.mana)
}

export function getBattleTransformRect(): BattleStageRect {
  return n(FACE.transform)
}

export function getBattleTypeRect(): BattleStageRect {
  return n(FACE.type)
}

export function getBattleSetSymbolRect(): BattleStageRect {
  return n(FACE.setSymbol)
}

export function getBattleRulesRect(): BattleStageRect {
  return n(FACE.rules)
}

export function getBattleDefenseRect(): BattleStageRect {
  return n(FACE.defense)
}

export function getBattleCollectorRect(): BattleStageRect {
  return n(FACE.collector)
}

export function getBattleTrimRect(): BattleStageRect {
  return {
    x: BLEED_PX,
    y: BLEED_PX,
    width: BATTLE_TRIM_WIDTH,
    height: BATTLE_TRIM_HEIGHT,
  }
}

/** Default Siege reminder (Scryfall / oracle). */
export const BATTLE_SIEGE_DEFAULT_REMINDER =
  "(As a Siege enters, choose an opponent to protect it. You and others can attack it. When it's defeated, exile it, then cast it transformed.)"

export function normalizeBattleDefense(value: unknown): string {
  return String(value ?? '').trim()
}
