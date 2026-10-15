/** Land / Full Art — mana circle symbol keys (matches `manaData` + getSymbolDataUrl). */

/** Single pips + hybrid / two-color pips present in manaData (see CANONICAL_TO_LEGACY_DATA_KEY for wu/gu/ur/ub). */
export const LAND_FULL_ART_MANA_CIRCLE_KEYS = [
  'w',
  'u',
  'b',
  'r',
  'g',
  'c',
  'wbu',
  'bub',
  'bur',
  'gbu',
  'gw',
  'rg',
  'rw',
  'wb',
  'bg',
  'br',
  'cw',
  'cbu',
  'cb',
  'cr',
  'cg',
] as const

export type LandFullArtManaCircleKey = (typeof LAND_FULL_ART_MANA_CIRCLE_KEYS)[number]

export const LAND_FULL_ART_MANA_CIRCLE_OPTIONS: readonly { value: LandFullArtManaCircleKey; label: string }[] = [
  { value: 'w', label: 'White' },
  { value: 'u', label: 'Blue' },
  { value: 'b', label: 'Black' },
  { value: 'r', label: 'Red' },
  { value: 'g', label: 'Green' },
  { value: 'c', label: 'Colorless' },
  { value: 'wbu', label: 'White / Blue (Azorius)' },
  { value: 'bub', label: 'Blue / Black (Dimir)' },
  { value: 'bur', label: 'Blue / Red (Izzet)' },
  { value: 'gbu', label: 'Green / Blue (Simic)' },
  { value: 'gw', label: 'Green / White (Selesnya)' },
  { value: 'rg', label: 'Red / Green (Gruul)' },
  { value: 'rw', label: 'Red / White (Boros)' },
  { value: 'wb', label: 'White / Black (Orzhov)' },
  { value: 'bg', label: 'Black / Green (Golgari)' },
  { value: 'br', label: 'Black / Red (Rakdos)' },
  { value: 'cw', label: 'Colorless / White' },
  { value: 'cbu', label: 'Colorless / Blue' },
  { value: 'cb', label: 'Colorless / Black' },
  { value: 'cr', label: 'Colorless / Red' },
  { value: 'cg', label: 'Colorless / Green' },
]

export function isLandFullArtManaCircleKey(v: unknown): v is LandFullArtManaCircleKey {
  const s = typeof v === 'string' ? v.toLowerCase() : ''
  return (LAND_FULL_ART_MANA_CIRCLE_KEYS as readonly string[]).includes(s)
}

export function normalizeLandFullArtManaCircleKey(v: unknown): LandFullArtManaCircleKey {
  return isLandFullArtManaCircleKey(v) ? (v.toLowerCase() as LandFullArtManaCircleKey) : 'c'
}

/** Converts the selected Land / Full Art mana circle pip into a canonical braced mana token (identity / parsing). */
export function landFullArtManaCircleKeyToBracketToken(key: LandFullArtManaCircleKey): string {
  switch (key) {
    case 'w':
      return '{W}'
    case 'u':
      return '{U}'
    case 'b':
      return '{B}'
    case 'r':
      return '{R}'
    case 'g':
      return '{G}'
    case 'c':
      return '{C}'
    case 'wbu':
      return '{W/U}'
    case 'bub':
      return '{U/B}'
    case 'bur':
      return '{U/R}'
    case 'gbu':
      return '{G/U}'
    case 'gw':
      return '{G/W}'
    case 'rg':
      return '{R/G}'
    case 'rw':
      return '{R/W}'
    case 'wb':
      return '{W/B}'
    case 'bg':
      return '{B/G}'
    case 'br':
      return '{B/R}'
    case 'cw':
      return '{C/W}'
    case 'cbu':
      return '{C/U}'
    case 'cb':
      return '{C/B}'
    case 'cr':
      return '{C/R}'
    case 'cg':
      return '{C/G}'
    default:
      return '{C}'
  }
}
