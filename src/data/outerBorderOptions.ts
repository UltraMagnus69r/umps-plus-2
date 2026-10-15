/**
 * Outer Border options — PNG-backed entries for the Outer Border Color dropdown.
 * Two PNG groups complement the solid/dual color keys in OUTER_BORDER_COLORS:
 *   - M15 Solid Colors: New Assets/Outer Border Solid Colors/ -> public/card-parts/outer-border-solid/
 *   - M15 Textures:      New Assets/Inner Border/             -> public/card-parts/outer-border-texture/
 *
 * Stored in cardData.outerBorderColor using prefixed values so the renderer can
 * distinguish PNG fills from color keys:
 *   - 'm15solid:<file>'  -> /card-parts/outer-border-solid/<file>
 *   - 'm15tex:<file>'    -> /card-parts/outer-border-texture/<file>
 * PNGs are stretched to fill the whole card.
 */
import { OUTER_BORDER_COLORS } from '../authority/colorAuthority'

export const OUTER_BORDER_SOLID_BASE_PATH = '/card-parts/outer-border-solid'
export const OUTER_BORDER_TEXTURE_BASE_PATH = '/card-parts/outer-border-texture'

export const M15_SOLID_VALUE_PREFIX = 'm15solid:'
export const M15_TEXTURE_VALUE_PREFIX = 'm15tex:'

type OuterBorderPngOption = { value: string; label: string; file: string }

function prettyLabel(file: string): string {
  return file
    .replace(/\.png$/i, '')
    .replace(/-lite$/i, ' (Lite)')
    .replace(/\bTexture\b/g, '')
    .replace(/\bcopy\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** M15 Solid Colors — from Outer Border Solid Colors/. */
export const M15_SOLID_OUTER_BORDER_OPTIONS: OuterBorderPngOption[] = [
  'White.png',
  'White-Lite.png',
  'Blue.png',
  'Blue-Lite.png',
  'Black.png',
  'Black-lite.png',
  'Red.png',
  'Red-Lite.png',
  'Green.png',
  'Green-Lite.png',
  'Gold.png',
  'Land.png',
].map((file) => ({ value: `${M15_SOLID_VALUE_PREFIX}${file}`, label: prettyLabel(file), file }))

/** Textures — from New Assets/Inner Border/ (served at /card-parts/outer-border-texture/). */
export const M15_TEXTURE_OUTER_BORDER_OPTIONS: OuterBorderPngOption[] = [
  { file: 'white.png', label: 'White' },
  { file: 'white - night.png', label: 'White (Night)' },
  { file: 'blue.png', label: 'Blue' },
  { file: 'blue - night.png', label: 'Blue (Night)' },
  { file: 'black.png', label: 'Black' },
  { file: 'black -night.png', label: 'Black (Night)' },
  { file: 'red.png', label: 'Red' },
  { file: 'red - night.png', label: 'Red (Night)' },
  { file: 'green.png', label: 'Green' },
  { file: 'green - night.png', label: 'Green (Night)' },
  { file: 'gold.png', label: 'Gold' },
  { file: 'gold - night.png', label: 'Gold (Night)' },
  { file: 'artifact.png', label: 'Colorless' },
  { file: 'artifact - night.png', label: 'Colorless (Night)' },
  { file: 'land.png', label: 'Land' },
  { file: 'land - night.png', label: 'Land (Night)' },
  { file: 'White - Modern.png', label: 'White (Modern)' },
  { file: 'Blue - Modern.png', label: 'Blue (Modern)' },
  { file: 'Black - Modern.png', label: 'Black (Modern)' },
  { file: 'Red - Modern.png', label: 'Red (Modern)' },
  { file: 'Green - Modern.png', label: 'Green (Modern)' },
  { file: 'Colorless - Modern.png', label: 'Colorless (Modern)' },
  { file: 'Artifact - Modern.png', label: 'Artifact (Modern)' },
  { file: 'Land - Modern.png', label: 'Land (Modern)' },
  { file: 'White - Abstract.png', label: 'White (Abstract)' },
  { file: 'Blue - Abstract.png', label: 'Blue (Abstract)' },
  { file: 'Black - Abstract.png', label: 'Black (Abstract)' },
  { file: 'Red - Absract.png', label: 'Red (Abstract)' },
  { file: 'Green - Abstract.png', label: 'Green (Abstract)' },
  { file: 'Colorless - Abstract.png', label: 'Colorless (Abstract)' },
  { file: 'Artifact - Abstract.png', label: 'Artifact (Abstract)' },
  { file: 'Land - Abstract.png', label: 'Land (Abstract)' },
  { file: 'White - Poster.png', label: 'White (Poster)' },
  { file: 'Blue - Poster.png', label: 'Blue (Poster)' },
  { file: 'Black - Poster.png', label: 'Black (Poster)' },
  { file: 'Red - Poster.png', label: 'Red (Poster)' },
  { file: 'Green - Poster.png', label: 'Green (Poster)' },
  { file: 'Colorless - Poster.png', label: 'Colorless (Poster)' },
  { file: 'Artifact - Poster.png', label: 'Artifact (Poster)' },
  { file: 'Land - Poster.png', label: 'Land (Poster)' },
  { file: 'White Space.png', label: 'White (Space)' },
  { file: 'Blue - Space.png', label: 'Blue (Space)' },
  { file: 'Black -Space.png', label: 'Black (Space)' },
  { file: 'Red - Space.png', label: 'Red (Space)' },
  { file: 'Green - Space.png', label: 'Green (Space)' },
  { file: 'Colorless - Space.png', label: 'Colorless (Space)' },
  { file: 'Artifact - Space.png', label: 'Artifact (Space)' },
  { file: 'Land - Space.png', label: 'Land (Space)' },
  { file: 'WU Azorius - Dual.png', label: 'Azorius (Dual)' },
  { file: 'UB Dimir - Dual.png', label: 'Dimir (Dual)' },
  { file: 'BR Rakdos - Dual.png', label: 'Rakdos (Dual)' },
  { file: 'RG Gruul -Dual.png', label: 'Gruul (Dual)' },
  { file: 'WG Selesnya - Dual.png', label: 'Selesnya (Dual)' },
  { file: 'WB Orzhov - Dual.png', label: 'Orzhov (Dual)' },
  { file: 'UR Izzet - Dual.png', label: 'Izzet (Dual)' },
  { file: 'BG Golgari - Dual.png', label: 'Golgari (Dual)' },
  { file: 'WR Boros - Dual.png', label: 'Boros (Dual)' },
  { file: 'UG Simic - Dual.png', label: 'Simic (Dual)' },
  { file: 'White - Land.png', label: 'White (Land)' },
  { file: 'Blue - Land.png', label: 'Blue (Land)' },
  { file: 'Black - Land.png', label: 'Black (Land)' },
  { file: 'Red - Land.png', label: 'Red (Land)' },
  { file: 'Green - Land.png', label: 'Green (Land)' },
  { file: 'Colorless - Land.png', label: 'Colorless (Land)' },
  { file: 'Artifact - Land.png', label: 'Artifact (Land)' },
  { file: 'Generic - Land.png', label: 'Generic (Land)' },
  { file: 'Prismatic - Land.png', label: 'Prismatic (Land)' },
].map(({ file, label }) => ({ value: `${M15_TEXTURE_VALUE_PREFIX}${file}`, label, file }))

/**
 * True only for "Textures" group values (m15tex:). Solid colors, dual colors, and M15
 * Solid PNGs (m15solid:) all return false, so OBF Texture can be layered over them.
 */
export function isOuterBorderTexture(value: string): boolean {
  return typeof value === 'string' && value.startsWith(M15_TEXTURE_VALUE_PREFIX)
}

/** Guild dual-color frames — from provided guild art (served at /card-parts/outer-border-texture/). */
export const GUILD_OUTER_BORDER_OPTIONS: OuterBorderPngOption[] = [
  { file: 'WU Azorius - Guild.png', label: 'Azorius (W/U)' },
  { file: 'UB Dimir - Guild.png', label: 'Dimir (U/B)' },
  { file: 'BR Rakdos - Guild.png', label: 'Rakdos (B/R)' },
  { file: 'RG Gruul - Guild.png', label: 'Gruul (R/G)' },
  { file: 'WG Selesnya - Guild.png', label: 'Selesnya (W/G)' },
  { file: 'WB Orzhov - Guild.png', label: 'Orzhov (W/B)' },
  { file: 'UR Izzet - Guild.png', label: 'Izzet (U/R)' },
  { file: 'BG Golgari - Guild.png', label: 'Golgari (B/G)' },
  { file: 'WR Boros - Guild.png', label: 'Boros (W/R)' },
  { file: 'UG Simic - Guild.png', label: 'Simic (U/G)' },
].map(({ file, label }) => ({ value: `${M15_TEXTURE_VALUE_PREFIX}${file}`, label, file }))

/* ───────────────────────── Unified picker model ─────────────────────────
 * The Outer Border picker organizes everything along two axes:
 *   - category (coarse filter chips): solids | duals | guild | textures
 *   - color (filter chips): W U B R G C multi land
 * plus per-style sub-headers (sections) and free-text search on the label.
 */
export type ColorTag = 'W' | 'U' | 'B' | 'R' | 'G' | 'C' | 'multi' | 'land'
export type OuterBorderCategory = 'solids' | 'duals' | 'guild' | 'textures'
export type OuterBorderItem = { value: string; label: string; colors: ColorTag[] }
export type OuterBorderSection = {
  id: string
  label: string
  category: OuterBorderCategory
  items: OuterBorderItem[]
}

/** Single-color identity chips. Pick one for mono backgrounds, two for that dual pair. */
export const OUTER_BORDER_COLOR_CHIPS: { tag: ColorTag; label: string }[] = [
  { tag: 'W', label: 'W' },
  { tag: 'U', label: 'U' },
  { tag: 'B', label: 'B' },
  { tag: 'R', label: 'R' },
  { tag: 'G', label: 'G' },
  { tag: 'C', label: 'C' },
]

/** Identity color tags (used to decide mono vs dual for chip filtering). */
export const OUTER_BORDER_IDENTITY_TAGS: ColorTag[] = ['W', 'U', 'B', 'R', 'G', 'C']

const LETTER_TO_TAG: Record<string, ColorTag> = { w: 'W', u: 'U', b: 'B', r: 'R', g: 'G' }
const COLOR_WORD_TO_TAG: Record<string, ColorTag> = {
  white: 'W',
  blue: 'U',
  black: 'B',
  red: 'R',
  green: 'G',
  colorless: 'C',
  artifact: 'C',
  gold: 'multi',
  prismatic: 'multi',
  land: 'land',
  generic: 'land',
}
const GUILD_TO_TAGS: Record<string, ColorTag[]> = {
  azorius: ['W', 'U'],
  dimir: ['U', 'B'],
  rakdos: ['B', 'R'],
  gruul: ['R', 'G'],
  selesnya: ['W', 'G'],
  orzhov: ['W', 'B'],
  izzet: ['U', 'R'],
  golgari: ['B', 'G'],
  boros: ['W', 'R'],
  simic: ['U', 'G'],
}

/** Best-effort color tags from a human label (guild name, W/U pair, or leading color word). */
function colorTagsFromLabel(label: string): ColorTag[] {
  const lower = label.toLowerCase()
  for (const guild in GUILD_TO_TAGS) {
    if (lower.includes(guild)) return [...GUILD_TO_TAGS[guild], 'multi']
  }
  const pair = lower.match(/\b([wubrg])\s*\/\s*([wubrg])\b/)
  if (pair) {
    const a = LETTER_TO_TAG[pair[1]]
    const b = LETTER_TO_TAG[pair[2]]
    return a && b ? [a, b, 'multi'] : []
  }
  const first = lower.split(/[\s(\-]+/)[0]
  const tag = COLOR_WORD_TO_TAG[first]
  return tag ? [tag] : []
}

const TEXTURE_STYLES: { id: string; label: string; test: (label: string) => boolean }[] = [
  { id: 'modern', label: 'Modern', test: (l) => /\(Modern\)/i.test(l) },
  { id: 'abstract', label: 'Abstract', test: (l) => /\(Abstract\)/i.test(l) },
  { id: 'poster', label: 'Poster', test: (l) => /\(Poster\)/i.test(l) },
  { id: 'space', label: 'Space', test: (l) => /\(Space\)/i.test(l) },
  { id: 'dualtex', label: 'Dual Textures', test: (l) => /\(Dual\)/i.test(l) },
  { id: 'land', label: 'Land', test: (l) => /\(Land\)/i.test(l) },
]

function textureStyleId(label: string): string {
  for (const s of TEXTURE_STYLES) if (s.test(label)) return s.id
  return 'classic' // base + Night, no style suffix
}

const toItem = (o: { value: string; label: string }): OuterBorderItem => ({
  value: o.value,
  label: o.label,
  colors: colorTagsFromLabel(o.label),
})

/** Build a Textures-group item from a 3/4-color code (e.g. 'WUB'); tagged multi so the
 * single/dual color chips don't surface it (they only match mono or exact pairs). */
function multiColorItem({ file, label, code }: { file: string; label: string; code: string }): OuterBorderItem {
  const tags = code
    .toLowerCase()
    .split('')
    .map((c) => LETTER_TO_TAG[c])
    .filter(Boolean) as ColorTag[]
  return {
    value: `${M15_TEXTURE_VALUE_PREFIX}${file}`,
    label,
    colors: [...tags, 'multi'],
  }
}

/** 3-Color (shards & wedges) — from three_color_rules_textures.zip. */
export const THREE_COLOR_OUTER_BORDER_ITEMS: OuterBorderItem[] = [
  { file: 'WUB-Esper.png', label: 'Esper (WUB)', code: 'WUB' },
  { file: 'WUR-Jeskai.png', label: 'Jeskai (WUR)', code: 'WUR' },
  { file: 'WUG-Bant.png', label: 'Bant (WUG)', code: 'WUG' },
  { file: 'WBR-Mardu.png', label: 'Mardu (WBR)', code: 'WBR' },
  { file: 'WBG-Abzan.png', label: 'Abzan (WBG)', code: 'WBG' },
  { file: 'WRG-Naya.png', label: 'Naya (WRG)', code: 'WRG' },
  { file: 'UBR-Grixis.png', label: 'Grixis (UBR)', code: 'UBR' },
  { file: 'UBG-Sultai.png', label: 'Sultai (UBG)', code: 'UBG' },
  { file: 'URG-Temur.png', label: 'Temur (URG)', code: 'URG' },
  { file: 'BRG-Jund.png', label: 'Jund (BRG)', code: 'BRG' },
].map(multiColorItem)

/** 4-Color (with normal + alt corner-mana variants) — from four_color_textures.zip. */
export const FOUR_COLOR_OUTER_BORDER_ITEMS: OuterBorderItem[] = [
  { file: 'WUBR-Yore-Tiller.png', label: 'Yore-Tiller (WUBR)', code: 'WUBR' },
  { file: 'WUBR-Yore-Tiller-Alt-Corner-Mana.png', label: 'Yore-Tiller (WUBR) — Alt Mana', code: 'WUBR' },
  { file: 'UBRG-Glint-Eye.png', label: 'Glint-Eye (UBRG)', code: 'UBRG' },
  { file: 'UBRG-Glint-Eye-Alt-Corner-Mana.png', label: 'Glint-Eye (UBRG) — Alt Mana', code: 'UBRG' },
  { file: 'BRGW-Dune-Brood.png', label: 'Dune-Brood (BRGW)', code: 'BRGW' },
  { file: 'BRGW-Dune-Brood-Alt-Corner-Mana.png', label: 'Dune-Brood (BRGW) — Alt Mana', code: 'BRGW' },
  { file: 'RGWU-Ink-Treader.png', label: 'Ink-Treader (RGWU)', code: 'RGWU' },
  { file: 'RGWU-Ink-Treader-Alt-Corner-Mana.png', label: 'Ink-Treader (RGWU) — Alt Mana', code: 'RGWU' },
  { file: 'GWUB-Witch-Maw.png', label: 'Witch-Maw (GWUB)', code: 'GWUB' },
  { file: 'GWUB-Witch-Maw-Alt-Corner-Mana.png', label: 'Witch-Maw (GWUB) — Alt Mana', code: 'GWUB' },
].map(multiColorItem)

/** 5-Color (WUBRG) — user-provided prismatic frames. */
export const FIVE_COLOR_OUTER_BORDER_ITEMS: OuterBorderItem[] = [
  { file: '5color-1.png', label: '5-Color 1 (WUBRG)', code: 'WUBRG' },
  { file: '5color-2.png', label: '5-Color 2 (WUBRG)', code: 'WUBRG' },
  { file: '5color-3.png', label: '5-Color 3 (WUBRG)', code: 'WUBRG' },
  { file: '5color-4.png', label: '5-Color 4 (WUBRG)', code: 'WUBRG' },
  { file: '5color-5.png', label: '5-Color 5 (WUBRG)', code: 'WUBRG' },
  { file: '5color-6.png', label: '5-Color 6 (WUBRG)', code: 'WUBRG' },
  { file: '5color-7.png', label: '5-Color 7 (WUBRG)', code: 'WUBRG' },
  { file: '5color-8.png', label: '5-Color 8 (WUBRG)', code: 'WUBRG' },
  { file: '5color-9.png', label: '5-Color 9 (WUBRG)', code: 'WUBRG' },
  { file: '5color-10.png', label: '5-Color 10 (WUBRG)', code: 'WUBRG' },
].map(multiColorItem)

/** Ordered sections rendered as sub-headers in the picker. Empty sections are hidden. */
export const OUTER_BORDER_SECTIONS: OuterBorderSection[] = [
  {
    id: 'solid',
    label: 'Solid Colors',
    category: 'solids' as OuterBorderCategory,
    items: OUTER_BORDER_COLORS.filter((o) => o.hex != null).map((o) => toItem({ value: o.value, label: o.label })),
  },
  {
    id: 'm15solid',
    label: 'M15 Solid',
    category: 'solids' as OuterBorderCategory,
    items: M15_SOLID_OUTER_BORDER_OPTIONS.map((o) => toItem({ value: o.value, label: `${o.label} - M15` })),
  },
  {
    id: 'dual',
    label: 'Dual Colors',
    category: 'duals' as OuterBorderCategory,
    items: OUTER_BORDER_COLORS.filter((o) => o.hex1 != null).map((o) => toItem({ value: o.value, label: o.label })),
  },
  {
    id: 'guild',
    label: 'Guild',
    category: 'guild' as OuterBorderCategory,
    items: GUILD_OUTER_BORDER_OPTIONS.map(toItem),
  },
  { id: 'threecolor', label: '3-Color', category: 'textures' as OuterBorderCategory, items: THREE_COLOR_OUTER_BORDER_ITEMS },
  { id: 'fourcolor', label: '4-Color', category: 'textures' as OuterBorderCategory, items: FOUR_COLOR_OUTER_BORDER_ITEMS },
  { id: 'fivecolor', label: '5-Color', category: 'textures' as OuterBorderCategory, items: FIVE_COLOR_OUTER_BORDER_ITEMS },
  { id: 'classic', label: 'Classic', category: 'textures' as OuterBorderCategory, items: [] as OuterBorderItem[] },
  ...TEXTURE_STYLES.map((s) => ({ id: s.id, label: s.label, category: 'textures' as const, items: [] as OuterBorderItem[] })),
].map((section) => {
  // Only auto-fill texture sections that were declared empty; pre-populated ones keep their items.
  if (section.category !== 'textures' || section.items.length > 0) return section
  const items = M15_TEXTURE_OUTER_BORDER_OPTIONS.filter((o) => textureStyleId(o.label) === section.id).map(toItem)
  return { ...section, items }
}).filter((section) => section.items.length > 0)

export const CLASSIC_OUTER_BORDER_SECTION_ID = 'classic' as const

/** Subset of picker sections (e.g. Classic-only for panel backgrounds). */
export function getOuterBorderSectionsByIds(ids: readonly string[]): OuterBorderSection[] {
  const allowed = new Set(ids)
  return OUTER_BORDER_SECTIONS.filter((section) => allowed.has(section.id))
}

/** Resolve a stored outerBorderColor value to a served PNG url, or null for color keys. */
export function outerBorderPngUrl(value: string): string | null {
  if (typeof value !== 'string') return null
  if (value.startsWith(M15_SOLID_VALUE_PREFIX)) {
    return `${OUTER_BORDER_SOLID_BASE_PATH}/${encodeURIComponent(value.slice(M15_SOLID_VALUE_PREFIX.length))}`
  }
  if (value.startsWith(M15_TEXTURE_VALUE_PREFIX)) {
    return `${OUTER_BORDER_TEXTURE_BASE_PATH}/${encodeURIComponent(value.slice(M15_TEXTURE_VALUE_PREFIX.length))}`
  }
  return null
}
