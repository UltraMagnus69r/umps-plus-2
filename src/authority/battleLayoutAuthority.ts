/**
 * Battle / Siege — geometry authority.
 * Baseline = Modern Spell seating/chrome stack; art aperture = Modern inner border
 * (same x/y/w/h + corner radii as TextureBorderLayer). No MotM / side-column.
 */
import {
  BLEED_PX,
  INNER_BORDER_CORNER_RADIUS_MODERN,
  TRIM_CORNER_RADIUS_PX,
  getStandardLayoutGeometry,
} from './geometryAuthority'
import {
  buildModernDummyStageRects,
  getModernDummyManaStageRect,
  MODERN_DUMMY_INNER_BORDER_EXTRA_HEIGHT_PX,
} from './modernDummyLayoutAuthority'
import type { LayoutId } from './layoutTaxonomy'
import { isBattleLayout } from './layoutTaxonomy'

/** Portrait trim — matches Standard / Spell Modern (1500×2100). */
export const BATTLE_TRIM_WIDTH = 1500
export const BATTLE_TRIM_HEIGHT = 2100
export const BATTLE_STAGE_WIDTH = BATTLE_TRIM_WIDTH + 2 * BLEED_PX // 1650
export const BATTLE_STAGE_HEIGHT = BATTLE_TRIM_HEIGHT + 2 * BLEED_PX // 2250

export const BATTLE_TRIM_CORNER_RADII = [
  TRIM_CORNER_RADIUS_PX,
  TRIM_CORNER_RADIUS_PX,
  TRIM_CORNER_RADIUS_PX,
  TRIM_CORNER_RADIUS_PX,
] as const

/**
 * Art / inner-border corner radii — exact Modern inner-border language
 * (TL/TR 30, BR/BL 175). Same array TextureBorderLayer uses via getInnerBorderCornerRadius.
 */
export const BATTLE_ART_CORNER_RADII = INNER_BORDER_CORNER_RADIUS_MODERN
export const BATTLE_ART_CORNER_RADIUS_PX = INNER_BORDER_CORNER_RADIUS_MODERN[0]

/** @deprecated Presentation rotate retired with side-column chrome. */
export const BATTLE_STUDIO_PRESENTATION_ROTATION_DEG = 90

/** @deprecated MotM left-tangent hack — unused. */
export const BATTLE_LEFT_CORNER_TANGENT_EXTRA_PX = 0

export type BattleStageRect = { x: number; y: number; width: number; height: number }

/**
 * Battle no longer owns a separate chrome layer — Studio uses the Modern Spell
 * (modernDummy) stack. Kept for taxonomy callers; always false.
 */
export function layoutUsesBattleChrome(_layout: Partial<LayoutId> | null | undefined): boolean {
  return false
}

export function getBattleStageSize(): { width: number; height: number } {
  return { width: BATTLE_STAGE_WIDTH, height: BATTLE_STAGE_HEIGHT }
}

function modern(): ReturnType<typeof buildModernDummyStageRects> {
  return buildModernDummyStageRects()
}

/**
 * Exact Modern / Spell inner-border stage rect (canonical geometry + modernDummy
 * bottom extend). Matches TextureBorderLayer for modernDummy layouts.
 */
export function getBattleModernInnerBorderRect(): BattleStageRect {
  const g = getStandardLayoutGeometry()
  return {
    x: g.innerX,
    y: g.innerY,
    width: g.innerW,
    height: g.innerH + MODERN_DUMMY_INNER_BORDER_EXTRA_HEIGHT_PX,
  }
}

/** Art aperture — 100% of the Modern inner border (same seat + size). */
export function getBattleArtRect(): BattleStageRect {
  return getBattleModernInnerBorderRect()
}

/** Alias — art and inner-border aperture are the same rect. */
export function getBattleInnerBorderRect(): BattleStageRect {
  return getBattleModernInnerBorderRect()
}

/** @deprecated No separate Battle art bottom extend; inner border already includes modernDummy extend. */
export const BATTLE_ART_BOTTOM_EXTEND_PX = 0

/** Studio presentation rotate — permanently off (portrait Modern Spell baseline). */
export function battleStudioPresentationActive(
  _layout: Partial<LayoutId> | null | undefined,
): boolean {
  return false
}

export function getBattleNameRect(): BattleStageRect {
  return { ...modern().nameBar }
}

export function getBattleManaRect(): BattleStageRect {
  return { ...getModernDummyManaStageRect() }
}

/** No transform seat on Modern Spell baseline — empty rect at mana origin. */
export function getBattleTransformRect(): BattleStageRect {
  const m = getModernDummyManaStageRect()
  return { x: m.x, y: m.y, width: 0, height: 0 }
}

export function getBattleTypeRect(): BattleStageRect {
  return { ...modern().typeLine }
}

/** Set symbol sits on the type line (same as Modern Spell contract path). */
export function getBattleSetSymbolRect(): BattleStageRect {
  const t = modern().typeLine
  const size = Math.round(Math.min(t.height * 0.85, 94))
  return {
    x: Math.round(t.x + t.width - size - 8),
    y: Math.round(t.y + (t.height - size) / 2),
    width: size,
    height: size,
  }
}

export function getBattleRulesRect(): BattleStageRect {
  return { ...modern().rulesText }
}

/** Defense maps to Modern lower-right / P-T slot (unused while no P/T chrome). */
export function getBattleDefenseRect(): BattleStageRect {
  return { ...modern().lowerRight }
}

export function getBattleBackFacePTRect(): BattleStageRect {
  return { ...modern().lowerRight }
}

export function getBattleCollectorRect(): BattleStageRect {
  return {
    x: Math.round(0.06 * BATTLE_TRIM_WIDTH + BLEED_PX),
    y: Math.round(0.94 * BATTLE_TRIM_HEIGHT + BLEED_PX),
    width: Math.round(0.88 * BATTLE_TRIM_WIDTH),
    height: Math.round(0.05 * BATTLE_TRIM_HEIGHT),
  }
}

export function getBattleHologramRect(): BattleStageRect {
  return { x: 0, y: 0, width: 0, height: 0 }
}

export function getBattleTrimRect(): BattleStageRect {
  return {
    x: BLEED_PX,
    y: BLEED_PX,
    width: BATTLE_TRIM_WIDTH,
    height: BATTLE_TRIM_HEIGHT,
  }
}

export function getBattleTrimCornerRadii(): readonly [number, number, number, number] {
  return BATTLE_TRIM_CORNER_RADII
}

export function getBattleInnerBorderCornerRadii(): readonly [number, number, number, number] {
  return BATTLE_ART_CORNER_RADII
}

export function getBattleLeftCornerHorizontalRadius(): number {
  return BATTLE_ART_CORNER_RADIUS_PX
}

/** True when layout is Battle family (taxonomy only; chrome flag is separate). */
export function isBattleFamilyLayout(layout: Partial<LayoutId> | null | undefined): boolean {
  return isBattleLayout(layout)
}

export const BATTLE_SIEGE_DEFAULT_REMINDER =
  "(As a Siege enters, choose an opponent to protect it. You and others can attack it. When it's defeated, exile it, then cast it transformed.)"

export function normalizeBattleDefense(value: unknown): string {
  return String(value ?? '').trim()
}

export function formatBattleBackFacePT(power: unknown, toughness: unknown): string {
  const p = String(power ?? '').trim()
  const t = String(toughness ?? '').trim()
  if (!p || !t) return ''
  return `${p}/${t}`
}
