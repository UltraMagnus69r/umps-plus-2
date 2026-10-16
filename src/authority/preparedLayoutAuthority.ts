/**
 * Prepared Creatures — standard modern top + split rules (left prepared / right mini-spell).
 * Seating derived from M15 regular rules aperture; split ~50/50 vertical.
 */
import { BLEED_PX, TRIM_HEIGHT, TRIM_WIDTH } from './geometryAuthority'
import type { LayoutId } from './layoutTaxonomy'
import { isPreparedLayout } from './layoutTaxonomy'
import { M15_REGULAR_CREATURE_RECIPE } from './recipes/m15RegularCreatureRecipe'

export type PreparedStageRect = { x: number; y: number; width: number; height: number }

const RULES = M15_REGULAR_CREATURE_RECIPE.regions.rules
const GAP_FRAC = 0.012
/** Extend both prepared + spell columns downward (stage px). */
export const PREPARED_PANEL_BOTTOM_EXTEND_PX = 15

function trimNormToStage(rect: { x: number; y: number; w: number; h: number }): PreparedStageRect {
  return {
    x: Math.round(rect.x * TRIM_WIDTH + BLEED_PX),
    y: Math.round(rect.y * TRIM_HEIGHT + BLEED_PX),
    width: Math.round(rect.w * TRIM_WIDTH),
    height: Math.round(rect.h * TRIM_HEIGHT),
  }
}

/** Full rules aperture — Standard Modern height + bottom extend for both columns. */
export function getPreparedRulesRect(): PreparedStageRect {
  const base = trimNormToStage(RULES)
  return { ...base, height: base.height + PREPARED_PANEL_BOTTOM_EXTEND_PX }
}

/** Left ~50% — prepared-side creature rules. */
export function getPreparedLeftRulesRect(): PreparedStageRect {
  const full = getPreparedRulesRect()
  const gap = Math.round(full.width * GAP_FRAC)
  const half = Math.floor((full.width - gap) / 2)
  return { x: full.x, y: full.y, width: half, height: full.height }
}

/** Right ~50% — nested mini-spell column. */
export function getPreparedSpellColumnRect(): PreparedStageRect {
  const full = getPreparedRulesRect()
  const left = getPreparedLeftRulesRect()
  const gap = Math.round(full.width * GAP_FRAC)
  const x = left.x + left.width + gap
  return { x, y: full.y, width: full.x + full.width - x, height: full.height }
}

/** Mini-spell name + mana bar (top of right column). */
export function getPreparedSpellNameBarRect(): PreparedStageRect {
  const col = getPreparedSpellColumnRect()
  return {
    x: col.x,
    y: col.y,
    width: col.width,
    height: Math.round(col.height * 0.18),
  }
}

/** Mini-spell type bar (e.g. Sorcery). */
export function getPreparedSpellTypeBarRect(): PreparedStageRect {
  const col = getPreparedSpellColumnRect()
  const nameH = Math.round(col.height * 0.18)
  return {
    x: col.x,
    y: col.y + nameH,
    width: col.width,
    height: Math.round(col.height * 0.12),
  }
}

/** Mini-spell effect text area. */
export function getPreparedSpellTextRect(): PreparedStageRect {
  const col = getPreparedSpellColumnRect()
  const nameH = Math.round(col.height * 0.18)
  const typeH = Math.round(col.height * 0.12)
  const y = col.y + nameH + typeH
  return {
    x: col.x,
    y,
    width: col.width,
    height: col.y + col.height - y,
  }
}

export function layoutUsesPreparedChrome(layout: Partial<LayoutId> | null | undefined): boolean {
  return isPreparedLayout(layout)
}

export const PREPARED_DEFAULT_REMINDER =
  "This creature enters prepared. (While it's prepared, you may cast a copy of its spell. Doing so unprepares it.)"

export function normalizePreparedSpellName(value: unknown): string {
  return String(value ?? '').trim()
}

export function normalizePreparedSpellMana(value: unknown): string {
  return String(value ?? '').trim()
}

export function normalizePreparedSpellType(value: unknown): string {
  return String(value ?? '').trim()
}

export function normalizePreparedSpellText(value: unknown): string {
  return String(value ?? '')
}
