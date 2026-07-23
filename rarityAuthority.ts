export type CanonicalRarity =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'mythic'
  | 'special'
  | 'bonus'
  | 'masterpiece'
  | 'unknown'

export const RARITY_LETTERS: Record<CanonicalRarity, string> = {
  common: 'C',
  uncommon: 'U',
  rare: 'R',
  mythic: 'M',
  special: 'S',
  bonus: 'B',
  masterpiece: 'P',
  unknown: '?',
}

export const RARITY_COLORS: Record<CanonicalRarity, string> = {
  common: '#FFFFFF',
  uncommon: '#C0C0C0',
  rare: '#FFD700',
  mythic: '#E85D04',
  special: '#A78BFA',
  bonus: '#5BC0EB',
  masterpiece: '#F4D35E',
  unknown: '#FFFFFF',
}

/**
 * Module 5.2 — Scryfall-style set symbol fills (type-line slot). Distinct from footer/metadata `RARITY_COLORS`.
 */
export const SET_SYMBOL_RARITY_FILLS: Record<'common' | 'uncommon' | 'rare' | 'mythic', string> = {
  common: '#000000',
  uncommon: '#6b6e6d',
  rare: '#9c833c',
  mythic: '#bf4427',
}

export function getSetSymbolRarityFill(rarity: 'common' | 'uncommon' | 'rare' | 'mythic'): string {
  return SET_SYMBOL_RARITY_FILLS[rarity] ?? SET_SYMBOL_RARITY_FILLS.common
}

const RARITY_ALIASES: Record<string, CanonicalRarity> = {
  c: 'common',
  common: 'common',

  u: 'uncommon',
  uncommon: 'uncommon',
  uncomm: 'uncommon',

  r: 'rare',
  rare: 'rare',

  m: 'mythic',
  mythic: 'mythic',
  'mythic rare': 'mythic',
  mythicrare: 'mythic',
  mr: 'mythic',

  s: 'special',
  special: 'special',

  b: 'bonus',
  bonus: 'bonus',
  'bonus sheet': 'bonus',
  bonussheet: 'bonus',

  p: 'masterpiece',
  masterpiece: 'masterpiece',
  masterpieces: 'masterpiece',
}

function cleanRarityInput(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[\-_]+/g, ' ')
    .replace(/\s+/g, ' ')
}

export function normalizeRarity(input?: string | null): CanonicalRarity {
  if (!input) return 'unknown'

  const cleaned = cleanRarityInput(input)
  return RARITY_ALIASES[cleaned] ?? 'unknown'
}

export function getRarityLetter(input?: string | null): string {
  const rarity = normalizeRarity(input)
  return RARITY_LETTERS[rarity]
}

export function getRarityColor(input?: string | null): string {
  const rarity = normalizeRarity(input)
  return RARITY_COLORS[rarity]
}

export function isKnownRarity(input?: string | null): boolean {
  return normalizeRarity(input) !== 'unknown'
}
