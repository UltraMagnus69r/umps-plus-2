/**
 * Planeswalker loyalty badge + starting loyalty assets — served from `public/planeswalker-symbols/`.
 * Source: `New Assets/Planeswalker Symbols/` (copied at build/deploy time with semantic filenames).
 *
 * Cost badges vary by ability row (1–6) and cost direction (Up / Down / Neutral).
 * Rows 5–6 reuse 4th-row badge art until dedicated assets exist.
 */

import { buildCanvasFont } from '../data/fontCatalog'

export const PLANESWALKER_SYMBOL_BASE_PATH = '/planeswalker-symbols'

export const PLANESWALKER_MAX_ABILITY_ROWS = 6

export type PlaneswalkerCostSign = '+' | '-' | '0'

export type PlaneswalkerCostDirection = 'up' | 'down' | 'neutral'

const ROW_ORDINALS = ['1st', '2nd', '3rd', '4th', '5th', '6th'] as const

export type PlaneswalkerRowOrdinal = (typeof ROW_ORDINALS)[number]

export function normalizePlaneswalkerCostSign(value: unknown): PlaneswalkerCostSign {
  const raw = String(value ?? '').trim().toLowerCase()
  if (raw === '+' || raw === 'plus' || raw === 'up' || raw === 'add') return '+'
  if (raw === '-' || raw === 'minus' || raw === 'down' || raw === 'sub') return '-'
  return '0'
}

export function costSignToDirection(sign: PlaneswalkerCostSign): PlaneswalkerCostDirection {
  if (sign === '+') return 'up'
  if (sign === '-') return 'down'
  return 'neutral'
}

export function normalizePlaneswalkerAbilityRow(value: unknown): number {
  const n = Math.round(Number(value) || 1)
  return Math.max(1, Math.min(PLANESWALKER_MAX_ABILITY_ROWS, n))
}

export function abilityRowToOrdinal(row: number): PlaneswalkerRowOrdinal {
  const index = normalizePlaneswalkerAbilityRow(row) - 1
  return ROW_ORDINALS[index] ?? '1st'
}

/** Loyalty cost badge PNG for a given ability row and sign (+ / − / 0). */
export function getPlaneswalkerLoyaltyBadgeUrl(
  row: number,
  costSign: PlaneswalkerCostSign | unknown,
): string {
  const normalizedRow = normalizePlaneswalkerAbilityRow(row)
  const direction = costSignToDirection(normalizePlaneswalkerCostSign(costSign))
  return `${PLANESWALKER_SYMBOL_BASE_PATH}/badges/row-${normalizedRow}-${direction}.png`
}

/** Optional row-position ribbon (Up / Down / Neutral styling sets). */
export function getPlaneswalkerRowMarkerUrl(
  row: number,
  costSign: PlaneswalkerCostSign | unknown,
): string {
  const direction = costSignToDirection(normalizePlaneswalkerCostSign(costSign))
  const ordinal = abilityRowToOrdinal(row)
  return `${PLANESWALKER_SYMBOL_BASE_PATH}/row-markers/${direction}-${ordinal}.png`
}

/** Starting loyalty shield in the lower-right slot (P/T replacement). */
export function getStartingLoyaltyShieldUrl(): string {
  return `${PLANESWALKER_SYMBOL_BASE_PATH}/starting-loyalty.png`
}

/** Intrinsic badge dimensions at 600 DPI source (stage scaling applied in renderer). */
export const PLANESWALKER_LOYALTY_BADGE_INTRINSIC: Record<
  PlaneswalkerCostDirection,
  { width: number; height: number }
> = {
  up: { width: 90, height: 64 },
  down: { width: 90, height: 63 },
  neutral: { width: 85, height: 51 },
}

export const STARTING_LOYALTY_SHIELD_INTRINSIC = { width: 121, height: 78 } as const

/** Display scale multipliers applied in renderer layers (stage px). */
export const ABILITY_BADGE_DISPLAY_SCALE = 1.8
export const STARTING_LOYALTY_SHIELD_DISPLAY_SCALE = 0.88
/** Nudge starting-loyalty shield upward (stage px); negative moves up. */
export const STARTING_LOYALTY_SHIELD_TOP_OFFSET_PX = -30
/** Additional starting-loyalty shield nudge (stage px). */
export const STARTING_LOYALTY_SHIELD_OFFSET_X_PX = 35
export const STARTING_LOYALTY_SHIELD_OFFSET_Y_PX = 30

export const PLANESWALKER_BADGE_COST_TEXT_FILL = '#ffffff'
export const PLANESWALKER_STARTING_LOYALTY_TEXT_FILL = '#ffffff'

/** Beleren Bold — matches real PW loyalty pips; rules typography is wrong for badge metrics. */
export const PLANESWALKER_BADGE_COST_FONT_FAMILY = 'Beleren Bold'

/** Tiny uniform nudge for shield PNG optical center (same for all signs). */
export const BADGE_SHIELD_OPTICAL_NUDGE = { x: 0, y: 1 } as const

/** Gap between sign glyph and digit (stage px, scaled with font size). */
export const BADGE_COST_SIGN_DIGIT_GAP_RATIO = 0.05

/** Down/minus shield text nudge (stage px). Negative y = up. Tune per badge art. */
export const BADGE_COST_MINUS_SHIELD_TEXT_NUDGE = { x: 0, y: -6 } as const

export type MeasuredBadgeTextInk = {
  width: number
  offsetX: number
  offsetY: number
}

export type PlaneswalkerBadgeCostTextNode = {
  text: string
  centerX: number
  centerY: number
  offsetX: number
  offsetY: number
}

export type PlaneswalkerBadgeCostLayout = {
  digit: PlaneswalkerBadgeCostTextNode
  sign: PlaneswalkerBadgeCostTextNode | null
}

function getBadgeMeasureContext(): CanvasRenderingContext2D | null {
  if (typeof document === 'undefined') return null
  return document.createElement('canvas').getContext('2d')
}

/** One shared vertical anchor for all badge glyphs — em-box center from reference digit. */
function measureBadgeVerticalAnchor(fontSize: number): number {
  const fallback = fontSize * 0.5
  const ctx = getBadgeMeasureContext()
  if (!ctx) return fallback
  const stack = `"${PLANESWALKER_BADGE_COST_FONT_FAMILY}", serif`
  ctx.font = buildCanvasFont('bold', fontSize, stack)
  const m = ctx.measureText('0')
  const ascent = m.fontBoundingBoxAscent ?? fontSize * 0.72
  const descent = m.fontBoundingBoxDescent ?? fontSize * 0.2
  return (ascent + descent) / 2
}

function measureBadgeTextWidth(label: string, fontSize: number): number {
  const fallback = fontSize * 0.35 * label.length
  const ctx = getBadgeMeasureContext()
  if (!ctx) return fallback
  const stack = `"${PLANESWALKER_BADGE_COST_FONT_FAMILY}", serif`
  ctx.font = buildCanvasFont('bold', fontSize, stack)
  return ctx.measureText(label).width
}

function measureBadgeTextInk(label: string, fontSize: number): MeasuredBadgeTextInk {
  const width = measureBadgeTextWidth(label, fontSize)
  const offsetY = measureBadgeVerticalAnchor(fontSize)
  return { width, offsetX: width / 2, offsetY }
}

/**
 * Lay out badge cost: digit centered on shield rect; +/- floats left of the digit.
 */
export function layoutPlaneswalkerBadgeCostOnShield(
  costSign: PlaneswalkerCostSign,
  costValue: number,
  fontSize: number,
  badgeRect: { x: number; y: number; width: number; height: number },
): PlaneswalkerBadgeCostLayout {
  const value = Math.max(0, Math.round(costValue) || 0)
  const digitText = costSign === '0' ? '0' : String(value)
  const digitInk = measureBadgeTextInk(digitText, fontSize)
  const verticalOffsetY = digitInk.offsetY

  const minusNudge = costSign === '-' ? BADGE_COST_MINUS_SHIELD_TEXT_NUDGE : { x: 0, y: 0 }
  const shieldCenterX =
    badgeRect.x + badgeRect.width / 2 + BADGE_SHIELD_OPTICAL_NUDGE.x + minusNudge.x
  const shieldCenterY =
    badgeRect.y + badgeRect.height / 2 + BADGE_SHIELD_OPTICAL_NUDGE.y + minusNudge.y

  const digit: PlaneswalkerBadgeCostTextNode = {
    text: digitText,
    centerX: shieldCenterX,
    centerY: shieldCenterY,
    offsetX: digitInk.offsetX,
    offsetY: verticalOffsetY,
  }

  if (costSign !== '+' && costSign !== '-') {
    return { digit, sign: null }
  }

  const signText = costSign === '+' ? '+' : '−'
  const signWidth = measureBadgeTextWidth(signText, fontSize)
  const gap = fontSize * BADGE_COST_SIGN_DIGIT_GAP_RATIO
  const digitLeft = shieldCenterX - digitInk.width / 2
  const signCenterX = digitLeft - gap - signWidth / 2

  return {
    digit,
    sign: {
      text: signText,
      centerX: signCenterX,
      centerY: shieldCenterY,
      offsetX: signWidth / 2,
      offsetY: verticalOffsetY,
    },
  }
}
