/**
 * Battle / Siege — true landscape face (CC packBattle + Invasion of Ikoria ground truth).
 * Trim 2100×1500 inside stage 2250×1650 (75 px bleed).
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
 * CC packBattle landscape fractions (x/w ÷2100, y/h ÷1500).
 * Tuned slightly so name strip / type / rules / defense match the Ikoria reference.
 */
const FACE = {
  /**
   * Visible art aperture between name strip and right column.
   * (CC packBattle art is wider under chrome; we seat the hole so ArtLayer cannot cover type/rules.)
   */
  art: { x: 167 / 2100, y: 60 / 1500, w: (1680 - 167) / 2100, h: 1371 / 1500 },
  /** Vertical name pill — text drawn 90° CCW (bottom → top). */
  name: { x: 48 / 2100, y: 70 / 1500, w: 110 / 2100, h: 1260 / 1500 },
  mana: { x: 48 / 2100, y: 78 / 1500, w: 110 / 2100, h: 200 / 1500 },
  transform: { x: 58 / 2100, y: 1280 / 1500, w: 90 / 2100, h: 90 / 1500 },
  type: { x: 1680 / 2100, y: 70 / 1500, w: 360 / 2100, h: 100 / 1500 },
  setSymbol: { x: 1945 / 2100, y: 78 / 1500, w: 90 / 2100, h: 86 / 1500 },
  rules: { x: 1680 / 2100, y: 180 / 1500, w: 360 / 2100, h: 1180 / 1500 },
  defense: { x: 1920 / 2100, y: 60 / 1500, w: 120 / 2100, h: 140 / 1500 },
  collector: { x: 180 / 2100, y: 1410 / 1500, w: 1740 / 2100, h: 70 / 1500 },
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
