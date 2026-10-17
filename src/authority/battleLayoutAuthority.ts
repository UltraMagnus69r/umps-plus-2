/**
 * Battle / Siege — landscape stack face (wider than tall).
 * Ground truth: fidelity-battle/battle-no-inner-border-ref.png (Invasion of Ikoria)
 * Art fills the full inner content face underneath name/type/rules/defense chrome.
 * Collector + hologram on left edge.
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

/** Slight right widen so plates/art reach the right frame edge. */
const WIDEN_RIGHT = 24 / BATTLE_TRIM_WIDTH

/**
 * Stack chrome seating + full inner-face art (under plates/rules).
 * Art fills the entire content bay (where the old mat showed); chrome draws on top.
 */
const CONTENT_X = 108 / 2100
const CONTENT_W = 1930 / 2100 + WIDEN_RIGHT
const TOP = 44 / 1500
const BOTTOM = 40 / 1500
const PLATE_H = 92 / 1500
const RULES_H = 528 / 1500
const NAME_Y = TOP
const RULES_BOTTOM = 1 - BOTTOM
const RULES_Y = RULES_BOTTOM - RULES_H
const TYPE_Y = RULES_Y - PLATE_H
const RULES_RIGHT = CONTENT_X + CONTENT_W
/** Full inner face behind name → rules (no mid-band inset window). */
const ART_FACE_Y = 32 / 1500
const ART_FACE_BOTTOM = 1 - 32 / 1500
const DEFENSE_W = 138 / 2100
const DEFENSE_H = 158 / 1500
/** Transform mark — covers left end of name plate. */
const TRANSFORM_SIZE = 108 / 2100
const TRANSFORM_SIZE_Y = 108 / 1500

/**
 * Landscape stack seating (trim-norm of 2100×1500).
 * Content reads upright; collector strip along the left edge is drawn rotated.
 */
const FACE = {
  /** Vertical collector / credit strip (text rotated 90° CW). */
  collector: { x: 22 / 2100, y: 56 / 1500, w: 72 / 2100, h: 1390 / 1500 },
  /** Horizontal nameplate — drawn over art. */
  name: { x: CONTENT_X, y: NAME_Y, w: CONTENT_W, h: PLATE_H },
  /** DFC / transform mark covering the left end of the nameplate. */
  transform: {
    x: CONTENT_X - 6 / 2100,
    y: NAME_Y + PLATE_H / 2 - TRANSFORM_SIZE_Y / 2,
    w: TRANSFORM_SIZE,
    h: TRANSFORM_SIZE_Y,
  },
  /** Mana chips along the right of the nameplate. */
  mana: {
    x: CONTENT_X + CONTENT_W - 460 / 2100,
    y: NAME_Y + (PLATE_H - 72 / 1500) / 2,
    w: 440 / 2100,
    h: 72 / 1500,
  },
  /**
   * Art / inner-border content face (under name/type/rules/defense).
   * Clip + chrome punch use this rect with {@link getBattleInnerBorderCornerRadii}.
   */
  art: {
    x: CONTENT_X,
    y: ART_FACE_Y,
    w: CONTENT_W,
    h: ART_FACE_BOTTOM - ART_FACE_Y,
  },
  /** Type line — drawn over art. */
  type: { x: CONTENT_X, y: TYPE_Y, w: CONTENT_W, h: PLATE_H },
  setSymbol: {
    x: CONTENT_X + CONTENT_W - 120 / 2100,
    y: TYPE_Y + (PLATE_H - 68 / 1500) / 2,
    w: 96 / 2100,
    h: 68 / 1500,
  },
  /** Tan parchment rules — drawn over art. */
  rules: { x: CONTENT_X, y: RULES_Y, w: CONTENT_W, h: RULES_H },
  /** Defense shield centered on lower-right corner of rules (half in / half out). */
  defense: {
    x: RULES_RIGHT - DEFENSE_W / 2,
    y: RULES_BOTTOM - DEFENSE_H / 2,
    w: DEFENSE_W,
    h: DEFENSE_H,
  },
  /** Security / hologram stamp — left vertical frame. */
  hologram: {
    x: 10 / 2100,
    y: (NAME_Y + RULES_BOTTOM) / 2 - 55 / 1500,
    w: 68 / 2100,
    h: 110 / 1500,
  },
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

/**
 * Art aperture — full light-grey inner face (under name/type/rules/defense).
 * Identical to {@link getBattleInnerBorderRect}; ArtLayer cover-fills + clips this,
 * BattleChrome draws only the frame ring outside it (evenodd), never a mat fill.
 */
export function getBattleArtRect(): BattleStageRect {
  return getBattleInnerBorderRect()
}

/**
 * Inner-face aperture (stage px) — ArtLayer clip and chrome frame-ring hole share
 * this rect and the Battle corner radii (including left tangent extra).
 */
export function getBattleInnerBorderRect(): BattleStageRect {
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
