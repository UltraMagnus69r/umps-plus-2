import manaMapDefault from '../../manaData'
import manaMapAlternate from '../../manaDataAlternate'
import manaMapCustom from '../../manaDataCustom'

export type ManaSymbolSetId = 'default' | 'alternate' | 'custom'

export type ManaSymbolSetConfig = {
  label: string
  map: Record<string, string | undefined>
  /** Braced-token prefix for non-default inserts, e.g. `alt/` → `{alt/W}`. */
  tokenPrefix: string | null
}

export const MANA_SYMBOL_SET_REGISTRY: Record<ManaSymbolSetId, ManaSymbolSetConfig> = {
  default: {
    label: 'Default',
    map: manaMapDefault as Record<string, string | undefined>,
    tokenPrefix: null,
  },
  alternate: {
    label: 'Alternate',
    map: manaMapAlternate as Record<string, string | undefined>,
    tokenPrefix: 'alt/',
  },
  custom: {
    label: 'Custom',
    map: manaMapCustom as Record<string, string | undefined>,
    tokenPrefix: 'custom/',
  },
}

export const MANA_SYMBOL_SET_IDS = Object.keys(MANA_SYMBOL_SET_REGISTRY) as ManaSymbolSetId[]

/** Prefixes for non-default sets — shared by token normalization and parsing. */
export const NON_DEFAULT_MANA_TOKEN_PREFIXES = MANA_SYMBOL_SET_IDS
  .map((id) => MANA_SYMBOL_SET_REGISTRY[id].tokenPrefix)
  .filter((prefix): prefix is string => typeof prefix === 'string' && prefix.length > 0)
