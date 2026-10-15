import manaMapClassic from '../../manaDataClassic'
import manaMapLegacy from '../../manaData'
import manaMapAlternate from '../../manaDataAlternate'
import manaMapCustom from '../../manaDataCustom'

/**
 * Alternate / Custom maps remain for resolving legacy braced tokens (`{alt/W}`, `{custom/…}`)
 * already stored on cards. They are not offered in the PipMint mana picker UI.
 *
 * Classic = new PipMint PNG batches (default). Legacy = previous in-app mana art.
 */
export type ManaSymbolSetId = 'classic' | 'legacy' | 'alternate' | 'custom'

export type ManaSymbolSetConfig = {
  label: string
  map: Record<string, string | undefined>
  /** Braced-token prefix for non-default inserts, e.g. `legacy/` → `{legacy/W}`. */
  tokenPrefix: string | null
}

export const MANA_SYMBOL_SET_REGISTRY: Record<ManaSymbolSetId, ManaSymbolSetConfig> = {
  classic: {
    label: 'Classic',
    map: manaMapClassic as Record<string, string | undefined>,
    tokenPrefix: null,
  },
  legacy: {
    label: 'Legacy',
    map: manaMapLegacy as Record<string, string | undefined>,
    tokenPrefix: 'legacy/',
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

/** All known set ids (includes Alternate/Custom kept for token resolution only). */
export const MANA_SYMBOL_SET_IDS = Object.keys(MANA_SYMBOL_SET_REGISTRY) as ManaSymbolSetId[]

/** Sets offered in the PipMint mana picker — Classic (default) + Legacy. */
export const MANA_PICKER_SET_IDS: ManaSymbolSetId[] = ['classic', 'legacy']

/** Prefixes for non-default sets — shared by token normalization and parsing. */
export const NON_DEFAULT_MANA_TOKEN_PREFIXES = MANA_SYMBOL_SET_IDS
  .map((id) => MANA_SYMBOL_SET_REGISTRY[id].tokenPrefix)
  .filter((prefix): prefix is string => typeof prefix === 'string' && prefix.length > 0)
