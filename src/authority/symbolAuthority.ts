/**
 * Symbol authority — 600 DPI symbol scale, baseline alignment, canonical token → asset mapping.
 * Dimension Authority: 1650 × 2250 px (geometryAuthority).
 */

import { STAGE_WIDTH, STAGE_HEIGHT, SPELL_PRE_MODERN_MANA_PIP_SCALE } from './geometryAuthority'
import { CANONICAL_TO_LEGACY_DATA_KEY } from '../utils/manaCanonical'
import {
  getManaSymbolMap,
  normalizeManaSymbolSetId,
  type ManaSymbolSetId,
} from './manaSymbolSetAuthority'

function resolveFromMap(map: Record<string, string | undefined>, key: string): string | undefined {
  if (!key) return undefined
  if (/^\d+$/.test(key)) {
    const url = map[key]
    return typeof url === 'string' ? url : undefined
  }
  if (typeof map[key] === 'string') return map[key]
  const legacy = CANONICAL_TO_LEGACY_DATA_KEY[key] ?? key
  const url = map[legacy]
  return typeof url === 'string' ? url : undefined
}

/**
 * Resolve canonical token (lowercase letter or numeric string, e.g. "w", "u", "2", "4")
 * to data URL from project assets. Explicitly supports numeric keys for circle-digit symbols.
 */
export function getSymbolDataUrl(
  canonicalKey: string,
  setId: ManaSymbolSetId | unknown = 'default',
): string | undefined {
  const key = canonicalKey.toLowerCase()
  const normalizedSetId = normalizeManaSymbolSetId(setId)
  const url = resolveFromMap(getManaSymbolMap(normalizedSetId), key)
  return url ?? undefined
}

export type { ManaSymbolSetId } from './manaSymbolSetAuthority'

export const SYMBOL_STAGE_WIDTH = STAGE_WIDTH
export const SYMBOL_STAGE_HEIGHT = STAGE_HEIGHT

/** Mana cost symbol size (px) at 600 DPI stage. */
export const MANA_COST_ICON_SIZE = 80
/**
 * Custom-set coin assets are ~200px with ~12% inner padding vs full-bleed 216px default pips.
 * Scale display size so the visible glyph matches default/alternate at the same stage slot.
 */
export const CUSTOM_MANA_PIP_DISPLAY_SCALE = 1.15

export function scaleManaPipDisplaySizePx(
  baseSizePx: number,
  setId: ManaSymbolSetId | unknown = 'default',
): number {
  if (normalizeManaSymbolSetId(setId) !== 'custom') return baseSizePx
  return Math.round(baseSizePx * CUSTOM_MANA_PIP_DISPLAY_SCALE)
}
/** Spell / Pre-Modern nameplate mana pip size (stage px). */
export function getSpellPreModernManaCostIconSizePx(): number {
  return Math.round(MANA_COST_ICON_SIZE * SPELL_PRE_MODERN_MANA_PIP_SCALE)
}
/** Gap between mana cost symbols (px). */
export const MANA_COST_ICON_GAP = 4

/** Baseline correction (px) so symbols sit naturally on text baseline. */
export const SYMBOL_BASELINE_OFFSET = 6

/** Type-line set symbol / custom set icon box (stage px). Matches sidebar slider range. */
export const SET_SYMBOL_BOX_MIN_PX = 40
export const SET_SYMBOL_BOX_MAX_PX = 220

/**
 * Coerce store `iconScale` to a drawable box size (custom upload + Scryfall CDN symbol).
 */
export function resolveSetSymbolBoxPx(iconScale: unknown): number {
  const raw = typeof iconScale === 'number' ? iconScale : Number(iconScale)
  const n = Number.isFinite(raw) ? Math.round(raw) : 135
  return Math.max(SET_SYMBOL_BOX_MIN_PX, Math.min(SET_SYMBOL_BOX_MAX_PX, n))
}
