import { normalizeManaTokenInner } from '../utils/manaCanonical'
import {
  MANA_PICKER_SET_IDS,
  MANA_SYMBOL_SET_IDS,
  MANA_SYMBOL_SET_REGISTRY,
  NON_DEFAULT_MANA_TOKEN_PREFIXES,
  type ManaSymbolSetId,
} from './manaSymbolSetRegistry'

export type { ManaSymbolSetId } from './manaSymbolSetRegistry'

export type ManaPickerKey = { token: string; dataKey: string }

export const MANA_SYMBOL_SET_LABELS: Record<ManaSymbolSetId, string> = Object.fromEntries(
  MANA_SYMBOL_SET_IDS.map((id) => [id, MANA_SYMBOL_SET_REGISTRY[id].label]),
) as Record<ManaSymbolSetId, string>

/**
 * Normalize persisted / UI set ids.
 * - Classic is the default for new sessions (also migrates legacy `default`).
 * - Legacy stays selectable in the picker.
 * - Alternate / Custom are no longer selectable; coerce to Classic (prefixed tokens still resolve when rendering).
 */
export function normalizeManaSymbolSetId(value?: unknown): ManaSymbolSetId {
  if (value === 'legacy') return 'legacy'
  if (value === 'classic') return 'classic'
  // Historical id for the previous default glyph set → Classic
  if (value === 'default') return 'classic'
  // Alternate / Custom no longer offered in picker
  return 'classic'
}

export function getManaSymbolMap(setId: ManaSymbolSetId = 'classic'): Record<string, string | undefined> {
  return MANA_SYMBOL_SET_REGISTRY[setId].map
}

export function getManaSymbolSetTokenPrefix(setId: ManaSymbolSetId): string | null {
  return MANA_SYMBOL_SET_REGISTRY[setId].tokenPrefix
}

/** Ordered picker grid keys for a mana symbol set map. */
export function buildManaPickerKeys(map: Record<string, string | undefined>): ManaPickerKey[] {
  const present = new Set(Object.keys(map ?? {}))
  const ordered: ManaPickerKey[] = []
  const push = (token: string, dataKey: string) => {
    if (!present.has(dataKey)) return
    ordered.push({ token, dataKey })
  }
  for (const t of ['W', 'U', 'B', 'R', 'G']) push(t, t.toLowerCase())
  push('C', 'c')
  for (let i = 0; i <= 20; i++) push(String(i), String(i))
  push('X', 'x')
  push('Y', 'y')
  push('Z', 'z')
  push('T', 'tap')
  push('Q', 'q')
  push('S', 's')
  push('E', 'e')
  const twoColorHybridKeys = ['2w', '2u', '2b', '2r', '2g'] as const
  for (const k of twoColorHybridKeys) {
    if (!present.has(k)) continue
    const token = normalizeManaTokenInner(k)
    if (!token) continue
    if (ordered.some((o) => o.token === token)) continue
    ordered.push({ token, dataKey: k })
  }
  const reserved = new Set(ordered.map((o) => o.dataKey))
  const extras = [...present]
    .filter((k) => !reserved.has(k))
    .filter((k) => k !== '')
    .sort((a, b) => a.localeCompare(b))
  for (const k of extras) {
    const token = normalizeManaTokenInner(k).toUpperCase()
    if (!token) continue
    // Skip duplicate assets that normalize to the same insert token (e.g. wu + wbu).
    if (ordered.some((o) => o.token === token)) continue
    ordered.push({ token, dataKey: k })
  }
  return ordered
}

export function buildManaPickerKeysForSet(setId: ManaSymbolSetId): ManaPickerKey[] {
  return buildManaPickerKeys(getManaSymbolMap(setId))
}

export function formatManaTokenInnerForSet(setId: ManaSymbolSetId, token: string): string {
  const prefix = getManaSymbolSetTokenPrefix(setId)
  return prefix ? `${prefix}${token}` : token
}

/** @deprecated Prefer formatManaTokenInnerForSet('legacy' | 'alternate', …) */
export const ALTERNATE_MANA_TOKEN_PREFIX = 'alt/'

export function formatAlternateManaTokenInner(token: string): string {
  return formatManaTokenInnerForSet('alternate', token)
}

export function splitPrefixedManaTokenInner(inner: string): {
  symbolSet: ManaSymbolSetId
  coreInner: string
} {
  const trimmed = inner.trim()
  for (const setId of MANA_SYMBOL_SET_IDS) {
    const prefix = MANA_SYMBOL_SET_REGISTRY[setId].tokenPrefix
    if (!prefix) continue
    if (trimmed.toLowerCase().startsWith(prefix.toLowerCase())) {
      return { symbolSet: setId, coreInner: trimmed.slice(prefix.length).trim() }
    }
  }
  return { symbolSet: 'classic', coreInner: trimmed }
}

/** @deprecated Use splitPrefixedManaTokenInner */
export function splitAlternateManaTokenInner(inner: string): {
  symbolSet: ManaSymbolSetId
  coreInner: string
} {
  return splitPrefixedManaTokenInner(inner)
}

export { MANA_PICKER_SET_IDS, MANA_SYMBOL_SET_IDS, NON_DEFAULT_MANA_TOKEN_PREFIXES }
