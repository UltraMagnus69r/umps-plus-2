/**
 * Battle / Siege — portrait side-column face (Standard 1500×2100 trim).
 * Studio GT: Invasion of Zendikar as the user-attached portrait reference —
 * name left vertical, art center, type mid-right, rules far-right, collector bottom.
 * MotM landscape stack is legacy / play-rotated cousin only (not Studio default).
 * Seats: media/battle-zendikar-compare/remeasure-2026-10-23.json native → 1500×2100.
 */
import { BLEED_PX, INNER_BORDER_CORNER_RADIUS_MODERN } from './geometryAuthority'
import type { LayoutId } from './layoutTaxonomy'
import { isBattleLayout } from './layoutTaxonomy'

/** Portrait trim — matches Standard card aspect (user ref 672×936, ~isotropic). */
export const BATTLE_TRIM_WIDTH = 1500
export const BATTLE_TRIM_HEIGHT = 2100
export const BATTLE_STAGE_WIDTH = BATTLE_TRIM_WIDTH + 2 * BLEED_PX // 1650
export const BATTLE_STAGE_HEIGHT = BATTLE_TRIM_HEIGHT + 2 * BLEED_PX // 2250

/** Outer trim corners — Standard Modern language (portrait card). */
export const BATTLE_TRIM_CORNER_RADII = INNER_BORDER_CORNER_RADIUS_MODERN
/** Art aperture corner soften (center column). */
export const BATTLE_ART_CORNER_RADIUS_PX = 16

export type BattleStageRect = { x: number; y: number; width: number; height: number }

/** Portrait trim-norm (0–1 of 1500×2100) → stage px. */
function n(rect: { x: number; y: number; w: number; h: number }): BattleStageRect {
  return {
    x: Math.round(rect.x * BATTLE_TRIM_WIDTH + BLEED_PX),
    y: Math.round(rect.y * BATTLE_TRIM_HEIGHT + BLEED_PX),
    width: Math.round(rect.w * BATTLE_TRIM_WIDTH),
    height: Math.round(rect.h * BATTLE_TRIM_HEIGHT),
  }
}

/**
 * Side-column FACE — native user-ref seats mapped to 1500×2100 (anisotropy ≈ 0.995).
 * Stage = trim + BLEED 75. See battle-zendikar-remeasure-next-edits.md.
 */
const FACE = {
  /** Bottom horizontal collector / legal band. */
  collector: { x: 58 / 1500, y: 1932 / 2100, w: 1384 / 1500, h: 166 / 2100 },
  /** Tall left name plate. */
  name: { x: 58 / 1500, y: 58 / 2100, w: 141 / 1500, h: 1873 / 2100 },
  /** Mana cluster — top of name strip (upright pips). */
  mana: { x: 71 / 1500, y: 117 / 2100, w: 116 / 1500, h: 139 / 2100 },
  /** DFC / transform — bottom of name strip. */
  transform: { x: 71 / 1500, y: 1768 / 2100, w: 116 / 1500, h: 117 / 2100 },
  /** Center-column art aperture (between name and type). */
  art: { x: 201 / 1500, y: 58 / 2100, w: 656 / 1500, h: 1873 / 2100 },
  /** Narrow type column left of rules. */
  type: { x: 857 / 1500, y: 58 / 2100, w: 145 / 1500, h: 1873 / 2100 },
  /** Set symbol — near top of type column. */
  setSymbol: { x: 893 / 1500, y: 76 / 2100, w: 94 / 1500, h: 94 / 2100 },
  /** Far-right rules column. */
  rules: { x: 1002 / 1500, y: 58 / 2100, w: 442 / 1500, h: 1873 / 2100 },
  /** Defense shield — top-right of rules. */
  defense: { x: 1330 / 1500, y: 58 / 2100, w: 112 / 1500, h: 119 / 2100 },
  /** Back-face P/T cue — beside defense inside rules. */
  backFacePT: { x: 1250 / 1500, y: 90 / 2100, w: 71 / 1500, h: 123 / 2100 },
  /**
   * Optional MotM security stamp — art left seam mid-height.
   * Not present on Uncommon Zendikar; keep for rare/mythic / toggle.
   */
  hologram: {
    x: 201 / 1500 - 68 / 1500 / 2,
    y: 58 / 2100 + 1873 / 2100 / 2 - 110 / 2100 / 2,
    w: 68 / 1500,
    h: 110 / 2100,
  },
} as const

/*
 * Legacy MotM landscape FACE (2100×1500 play-rotated) — kept for reference only.
 * Not used as Studio default.
 *
 * collector: { x: 8/2100, y: 91/1500, w: 202/2100, h: 1319/1500 }
 * name: { x: 218/2100, y: 58/1500, w: 1823/2100, h: 141/1500 }
 * transform: { x: 218/2100, y: 58/1500, w: 141/2100, h: 141/1500 }
 * mana: { x: 1793/2100, y: 77/1500, w: 222/2100, h: 105/1500 }
 * art: { x: 218/2100, y: 58/1500, w: 1823/2100, h: 1383/1500 }
 * type: { x: 218/2100, y: 866/1500, w: 1823/2100, h: 135/1500 }
 * rules: { x: 218/2100, y: 1001/1500, w: 1823/2100, h: 441/1500 }
 * defense: { x: 1894/2100, y: 1319/1500, w: 133/2100, h: 133/1500 }
 * backFacePT: { x: 1787/2100, y: 1313/1500, w: 105/2100, h: 48/1500 }
 */

/** @deprecated MotM left-tangent hack — unused on portrait side-column. */
export const BATTLE_LEFT_CORNER_TANGENT_EXTRA_PX = 0

export function layoutUsesBattleChrome(layout: Partial<LayoutId> | null | undefined): boolean {
  return isBattleLayout(layout)
}

export function getBattleStageSize(): { width: number; height: number } {
  return { width: BATTLE_STAGE_WIDTH, height: BATTLE_STAGE_HEIGHT }
}

/**
 * Art aperture — center column between name and type.
 * ArtLayer cover-fills + clips this; chrome evenodd hole matches.
 */
export function getBattleArtRect(): BattleStageRect {
  return getBattleInnerBorderRect()
}

/** Art / chrome-hole aperture (stage px). */
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

/** Back-face power/toughness cue seat (beside defense). */
export function getBattleBackFacePTRect(): BattleStageRect {
  return n(FACE.backFacePT)
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

/** Outer trim corner radii (TL, TR, BR, BL) — Standard Modern. */
export function getBattleTrimCornerRadii(): readonly [number, number, number, number] {
  return BATTLE_TRIM_CORNER_RADII
}

/** Art aperture corner radii (TL, TR, BR, BL). */
export function getBattleInnerBorderCornerRadii(): readonly [number, number, number, number] {
  const r = BATTLE_ART_CORNER_RADIUS_PX
  return [r, r, r, r]
}

/** @deprecated No left-tangent extra on portrait; equals art corner radius. */
export function getBattleLeftCornerHorizontalRadius(): number {
  return BATTLE_ART_CORNER_RADIUS_PX
}

/** Default Siege reminder (Scryfall / oracle). */
export const BATTLE_SIEGE_DEFAULT_REMINDER =
  "(As a Siege enters, choose an opponent to protect it. You and others can attack it. When it's defeated, exile it, then cast it transformed.)"

export function normalizeBattleDefense(value: unknown): string {
  return String(value ?? '').trim()
}

/** Format back-face P/T cue when both sides are present (e.g. "4/4"). */
export function formatBattleBackFacePT(power: unknown, toughness: unknown): string {
  const p = String(power ?? '').trim()
  const t = String(toughness ?? '').trim()
  if (!p || !t) return ''
  return `${p}/${t}`
}
