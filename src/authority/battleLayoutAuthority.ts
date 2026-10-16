/**
 * Battle / Siege — landscape stack face (wider than tall).
 * Ground truth: fidelity-battle/battle-landscape-stack-reference.png
 * Top→bottom: nameplate, art, type, upright rules, defense; collector on left edge.
 */
import { BLEED_PX, INNER_BORDER_CORNER_RADIUS_MODERN } from './geometryAuthority'
import type { LayoutId } from './layoutTaxonomy'
import { isBattleLayout } from './layoutTaxonomy'

export const BATTLE_TRIM_WIDTH = 2100
export const BATTLE_TRIM_HEIGHT = 1500
export const BATTLE_STAGE_WIDTH = BATTLE_TRIM_WIDTH + 2 * BLEED_PX // 2250
export const BATTLE_STAGE_HEIGHT = BATTLE_TRIM_HEIGHT + 2 * BLEED_PX // 1650

/** Modern bottom inner-border radius (stage px) — used for Battle landscape left corners. */
export const BATTLE_INNER_BORDER_LEFT_CORNER_RADIUS =
  INNER_BORDER_CORNER_RADIUS_MODERN[2] /* bottom-right = bottom radius language */
/** Modern top inner-border radius — used for Battle landscape right corners. */
export const BATTLE_INNER_BORDER_RIGHT_CORNER_RADIUS = INNER_BORDER_CORNER_RADIUS_MODERN[0]

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

/** +20 stage-px widen on art/rules right edge (trim-norm). */
const WIDEN_RIGHT = 20 / BATTLE_TRIM_WIDTH

/**
 * Type plate fills the full art→rules gap; name plate matches that thickness.
 * art ends 800, rules starts 925 → plate height 125 (trim px).
 */
const PLATE_H = 125 / 1500
const ART_Y = 180 / 1500
const ART_H = 620 / 1500
const TYPE_Y = ART_Y + ART_H // 800/1500 — flush under art
const RULES_Y = 925 / 1500
const RULES_H = 500 / 1500
const NAME_Y = ART_Y - PLATE_H // 55/1500 — flush above art
const RULES_RIGHT = 120 / 2100 + 1860 / 2100 + WIDEN_RIGHT // 2000/2100
const RULES_BOTTOM = RULES_Y + RULES_H // 1425/1500
const DEFENSE_W = 130 / 2100
const DEFENSE_H = 150 / 1500
/** Transform mark — 2× prior 76 px, covers left end of name plate. */
const TRANSFORM_SIZE = 152 / 2100
const TRANSFORM_SIZE_Y = 152 / 1500

/**
 * Landscape stack seating (trim-norm of 2100×1500).
 * Content reads upright; collector strip along the left edge is drawn rotated.
 */
const FACE = {
  /** Vertical collector / credit strip (text rotated 90° CW). */
  collector: { x: 28 / 2100, y: 70 / 1500, w: 70 / 2100, h: 1360 / 1500 },
  /** Horizontal nameplate — same thickness as type plate. */
  name: { x: 120 / 2100, y: NAME_Y, w: 1860 / 2100 + WIDEN_RIGHT, h: PLATE_H },
  /** DFC / transform mark covering the left end of the nameplate. */
  transform: {
    x: 112 / 2100,
    y: NAME_Y + PLATE_H / 2 - TRANSFORM_SIZE_Y / 2,
    w: TRANSFORM_SIZE,
    h: TRANSFORM_SIZE_Y,
  },
  /** Mana chips along the right of the nameplate. */
  mana: {
    x: 1520 / 2100,
    y: NAME_Y + (PLATE_H - 84 / 1500) / 2,
    w: 460 / 2100,
    h: 84 / 1500,
  },
  /** Wide art aperture under the nameplate (+20 px right). */
  art: { x: 120 / 2100, y: ART_Y, w: 1860 / 2100 + WIDEN_RIGHT, h: ART_H },
  /** Type line — fills full vertical gap between art and rules. */
  type: { x: 120 / 2100, y: TYPE_Y, w: 1860 / 2100 + WIDEN_RIGHT, h: PLATE_H },
  setSymbol: {
    x: 1880 / 2100,
    y: TYPE_Y + (PLATE_H - 75 / 1500) / 2,
    w: 100 / 2100,
    h: 75 / 1500,
  },
  /** Tan parchment rules — upright text (+20 px right). */
  rules: { x: 120 / 2100, y: RULES_Y, w: 1860 / 2100 + WIDEN_RIGHT, h: RULES_H },
  /** Defense shield centered on lower-right corner of rules (half in / half out). */
  defense: {
    x: RULES_RIGHT - DEFENSE_W / 2,
    y: RULES_BOTTOM - DEFENSE_H / 2,
    w: DEFENSE_W,
    h: DEFENSE_H,
  },
  /** Security / hologram stamp — on the vertical left inner frame (not type plate). */
  hologram: { x: 8 / 2100, y: 680 / 1500, w: 70 / 2100, h: 110 / 1500 },
} as const

/**
 * Extra trim-px on top/bottom left-corner tangents (arc starts later to the right).
 * Vertical left-edge anchors stay put.
 */
export const BATTLE_LEFT_CORNER_TANGENT_EXTRA_PX = 50

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

export function getBattleHologramRect(): BattleStageRect {
  return n(FACE.hologram)
}

export function getBattleTrimRect(): BattleStageRect {
  return {
    x: BLEED_PX,
    y: BLEED_PX,
    width: BATTLE_TRIM_WIDTH,
    height: BATTLE_TRIM_HEIGHT,
  }
}

/**
 * Konva/canvas corner radii for the Battle inner mat (TL, TR, BR, BL).
 * Upper-left + lower-left match Standard Modern bottom inner-border radius.
 * Left corners also use {@link BATTLE_LEFT_CORNER_TANGENT_EXTRA_PX} on the
 * top/bottom tangent (horizontal) so the arc starts ~50 px later.
 */
export function getBattleInnerBorderCornerRadii(): readonly [number, number, number, number] {
  const left = BATTLE_INNER_BORDER_LEFT_CORNER_RADIUS
  const right = BATTLE_INNER_BORDER_RIGHT_CORNER_RADIUS
  return [left, right, right, left]
}

/** Horizontal tangent inset for left corners (= vertical radius + 50 px). */
export function getBattleLeftCornerHorizontalRadius(): number {
  return BATTLE_INNER_BORDER_LEFT_CORNER_RADIUS + BATTLE_LEFT_CORNER_TANGENT_EXTRA_PX
}

/** Default Siege reminder (Scryfall / oracle). */
export const BATTLE_SIEGE_DEFAULT_REMINDER =
  "(As a Siege enters, choose an opponent to protect it. You and others can attack it. When it's defeated, exile it, then cast it transformed.)"

export function normalizeBattleDefense(value: unknown): string {
  return String(value ?? '').trim()
}
