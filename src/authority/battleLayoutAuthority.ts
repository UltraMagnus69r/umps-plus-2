/**
 * Battle / Siege — landscape stack face (wider than tall).
 * Ground truth: MotM Invasion of Ikoria (Scryfall MOM/190) left-edge crops —
 * fidelity-battle/ikoria-official-left.png (+ -2).
 * Art cover-fills top/right/bottom to the black outer edge (no dark-grey mats),
 * but insets from the left so a frame-colored strip remains for vertical
 * collector text; hologram straddles that strip / art edge.
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

/** Slight right widen so plates reach the right content edge. */
const WIDEN_RIGHT = 24 / BATTLE_TRIM_WIDTH

/**
 * Plate/rules seating (overlays on art). Art left edge aligns with CONTENT_X
 * so the MotM frame-colored collector strip shows; top/right/bottom stay flush
 * to the black outer edge (no dark-grey mats on those sides).
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
const DEFENSE_W = 138 / 2100
const DEFENSE_H = 158 / 1500
/** Transform mark — covers left end of name plate. */
const TRANSFORM_SIZE = 108 / 2100
const TRANSFORM_SIZE_Y = 108 / 1500
/** MotM security stamp — straddles left frame strip / art edge. */
const HOLO_W = 68 / 2100
const HOLO_H = 110 / 1500

/**
 * Landscape stack seating (trim-norm of 2100×1500).
 * Content reads upright; collector strip along the left edge is drawn rotated.
 */
const FACE = {
  /** Vertical collector / credit strip on the left frame-colored band. */
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
   * Left-only inset (MotM collector strip). Top / right / bottom meet the
   * black outer edge so no identity mat / dark-grey band returns there.
   */
  art: {
    x: CONTENT_X,
    y: 0,
    w: 1 - CONTENT_X,
    h: 1,
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
  /** Security / hologram stamp — centered on art left edge (overlaps frame + art). */
  hologram: {
    x: CONTENT_X - HOLO_W / 2,
    y: (NAME_Y + RULES_BOTTOM) / 2 - HOLO_H / 2,
    w: HOLO_W,
    h: HOLO_H,
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
 * Art aperture — left-inset MotM face (under name/type/rules/defense).
 * Identical to {@link getBattleInnerBorderRect}. ArtLayer cover-fills + clips this;
 * chrome evenodd hole matches so the left strip stays frame-colored for collector
 * while top/right/bottom stay flush to the black outer edge.
 */
export function getBattleArtRect(): BattleStageRect {
  return getBattleInnerBorderRect()
}

/**
 * Art / chrome-hole aperture (stage px) — ArtLayer clip and chrome frame-ring hole
 * share this rect and the Battle corner radii (including left tangent extra).
 * Left edge = CONTENT_X; top/right/bottom = trim.
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
