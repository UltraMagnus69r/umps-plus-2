import { normalizeMana } from './manaNormalization'
import { NON_DEFAULT_MANA_TOKEN_PREFIXES } from '../authority/manaSymbolSetRegistry'

/**
 * Phase 3.2 – Canonical mana token rules (forward-only, no legacy).
 *
 * Canonical token rules:
 * - Single: {W}, {U}, {B}, {R}, {G}, {C}
 * - Hybrid: exactly 2 letters from WUBRG (e.g. {GU}, {UR}, {WB})
 * - Phyrexian: {WP}, {UP}, {BP}, {RP}, {GP} or two-letter phyrexian hybrid {PGU} etc.
 * - No 3-letter hybrid tokens (e.g. no {BUR}, {GBU}).
 * - No B-prefixed marker; reject any non-canonical token by normalizing to canonical form.
 */

const LEGACY_B_PREFIX_HYBRID = /^B([WUBRG]{2})$/i
const LEGACY_MIDDLE_B_HYBRID = /^([WUBRG])B([WUBRG])$/i
const LEGACY_PHYREXIAN_B = /^P([WUBRG])B([WUBRG])$/i

/** Colon syntax: :U = C/U (colorless or blue) -> canonical CU */
const COLON_COLORLESS_HYBRID = /^:([WUBRG])$/i
/** 3-letter C+B+color (e.g. cbu, cbr) -> C+color; data key "cbu" is the C/U hybrid asset */
function reduceCHybrid3(norm: string): string | null {
  if (norm.length !== 3) return null
  const up = norm.toUpperCase()
  if (!/C/.test(up) || !/B/.test(up)) return null
  const other = up.replace(/[CB]/g, '')
  if (other.length === 1 && /^[WUBRG]$/.test(other)) return 'C' + other
  return null
}

/**
 * Normalize a single token inner (contents of {}) to canonical form.
 * - BUR -> UR, GBU -> GU, WBU -> WU, BGU -> GU, BRU -> RU
 * - PGBU -> PGU
 * - :U -> CU (colorless/blue hybrid), :W/:B/:R/:G -> CW/CB/CR/CG
 * - cbu/bcu/ucb (data key for C/U hybrid) -> CU
 * Returns canonical 2-letter (or single, or phyrexian) form; does not validate full set.
 */
/** Two generic + one colored pip: {2/W} … {2/G}; data keys 2w … 2g (see manaData). */
const TWO_GENERIC_COLOR_HYBRID = /^2(?:\/([WUBRG])|([WUBRG]))$/i

function normalizeManaTokenInnerCore(inner: string): string {
  const t = inner.trim().toUpperCase()
  if (!t) return ''
  // {2}, {3}, {10}, etc. — must not strip all digits (that would erase the token in canonicalizeManaString).
  if (/^\d+$/.test(t)) return t
  const twoGen = t.match(TWO_GENERIC_COLOR_HYBRID)
  if (twoGen) {
    const color = (twoGen[1] ?? twoGen[2])!
    return `2/${color}`
  }
  // Reject malformed 2-prefixed inners (e.g. 2BU) so they are not folded into plain hybrids.
  if (t.startsWith('2')) return ''
  // Colon syntax: :U = C/U hybrid -> CU (and :W, :B, :R, :G)
  const colonMatch = t.match(COLON_COLORLESS_HYBRID)
  if (colonMatch) return 'C' + colonMatch[1]
  const stripped = t.replace(/^\d+/, '')
  let norm = stripped
  const cHybrid = reduceCHybrid3(norm)
  if (cHybrid) return cHybrid
  if (LEGACY_B_PREFIX_HYBRID.test(norm)) norm = norm.slice(1)
  const mM = norm.match(LEGACY_MIDDLE_B_HYBRID)
  if (mM) norm = mM[1] + mM[2]
  const mP = norm.match(LEGACY_PHYREXIAN_B)
  if (mP) norm = `P${mP[1]}${mP[2]}`
  return norm
}

export function normalizeManaTokenInner(inner: string): string {
  const trimmed = inner.trim()
  for (const prefix of NON_DEFAULT_MANA_TOKEN_PREFIXES) {
    if (!trimmed.toLowerCase().startsWith(prefix.toLowerCase())) continue
    const coreInner = trimmed.slice(prefix.length).trim()
    const core = normalizeManaTokenInnerCore(coreInner)
    return core ? `${prefix}${core}` : ''
  }
  return normalizeManaTokenInnerCore(trimmed)
}

/**
 * Canonicalize a full string containing mana tokens {X}, {XY}, etc.
 * Replaces legacy 3-letter / B-prefixed forms with 2-letter canonical.
 */
export function canonicalizeManaString(str: string | undefined | null): string {
  if (str == null || typeof str !== 'string') return ''
  return str.replace(/\{([^}]+)\}/g, (_, inner) => {
    const canon = normalizeManaTokenInner(inner)
    return canon ? `{${canon}}` : ''
  })
}

/**
 * Store + renderer alignment: brace-token canonicalization, then shorthand → bracket expansion.
 * Use for mana cost and rules text anywhere the symbol layer must render consistently.
 */
export function normalizeStoreManaAndRulesText(str: string | undefined | null): string {
  // Back-compat name: historically used for both mana cost + rules text.
  // Rules text must NOT convert plain digits like "1/1" into mana tokens, so use the rules-safe path.
  return normalizeStoreRulesText(str)
}

/**
 * Mana cost field: allow shorthand like "2g" → "{2}{G}" and "12" → "{12}".
 */
export function normalizeStoreManaCost(str: string | undefined | null): string {
  return normalizeMana(canonicalizeManaString(str))
}

/**
 * Rules text field: ONLY normalize already-braced tokens "{...}" (Scryfall oracle_text already uses braces).
 * Do not convert arbitrary digits in prose (e.g. "1/1") into mana tokens.
 */
export function normalizeStoreRulesText(str: string | undefined | null): string {
  return canonicalizeManaString(str)
}

/**
 * For rendering: map canonical 2-letter (lowercase) to manaData key if asset uses legacy key.
 * Used only when manaData has no 2-letter key (e.g. ur -> bur for image lookup).
 * Cross-checked against manaData.js: wbu, gbu, bur, bub, pgbu, cbu all exist.
 * Split/hybrid forms (e.g. W/U -> wu -> wbu) resolve via this map.
 */
export const CANONICAL_TO_LEGACY_DATA_KEY: Record<string, string> = {
  wu: 'wbu',
  uw: 'wbu',
  gu: 'gbu',
  ug: 'gbu',
  ur: 'bur',
  ru: 'bur',
  ub: 'bub',
  bu: 'bub',
  pgu: 'pgbu',
  pug: 'pgbu',
  cu: 'cbu',
  uc: 'cbu',
}
