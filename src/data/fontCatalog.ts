/**
 * Full font catalog — one entry per distinct @font-face family in index.css.
 * 52 font files resolve to 42 selectable families.
 */

import {
  DEFAULT_FONT_FACE_CAPABILITIES,
  FONT_FACE_CAPABILITIES,
} from './fontFaceCapabilities'

export const LEGACY_FONT_KEY_BY_FAMILY = {
  "Beleren Bold": "belerenBold",
  "Matrix Bold": "matrixBold",
  "Plantin": "plantin",
  "Plantin Italic": "plantinItalic",
  "Gill Sans Condensed Bold": "gillCondensedBold"
} as const

export type FontCatalogEntry = {
  readonly key: string
  readonly label: string
  readonly family: string
}

/** Families that ship as separate files per weight/style — weight picker swaps the active face. */
export type FontWeightGroupId =
  | 'beleren'
  | 'matrix'
  | 'dinNext'
  | 'montserrat'
  | 'neoSans'
  | 'decour'
  | 'plantin'
  | 'gotham'
  | 'gillSans'

export type CreativeFontWeight = 'normal' | 'semibold' | 'bold' | 'italic'

export const FONT_CATALOG = [
  { key: "acmeRegular", label: "Acme-Regular", family: "Acme-Regular" },
  { key: "amandaStdRegular", label: "Amanda Std Regular", family: "Amanda Std Regular" },
  { key: "arialBlack", label: "Arial Black", family: "arial_black" },
  { key: "beleren", label: "Beleren", family: "Beleren" },
  { key: "belerenBold", label: "Beleren Bold", family: "Beleren Bold" },
  { key: "davisonAmericanaCgRegular", label: "Davison Americana CG Regular", family: "Davison Americana CG Regular" },
  { key: "decourCndRegular", label: "decour-cnd-regular", family: "decour-cnd-regular" },
  { key: "decourCndRegularItalic", label: "decour-cnd-regular-italic", family: "decour-cnd-regular-italic" },
  { key: "dinNextBold", label: "DIN-Next-Bold", family: "DIN-Next-Bold" },
  { key: "dinNextMedium", label: "DIN-Next-Medium", family: "DIN-Next-Medium" },
  { key: "dinNextRegular", label: "DIN-Next-Regular", family: "DIN-Next-Regular" },
  { key: "fritzQuadrata", label: "fritz-quadrata", family: "fritz-quadrata" },
  { key: "gillSansBoldItalic", label: "Gill Sans Bold Italic", family: "Gill Sans Bold Italic" },
  { key: "gillCondensedBold", label: "Gill Sans Condensed Bold", family: "Gill Sans Condensed Bold" },
  { key: "gillSansMedium", label: "Gill Sans Medium", family: "Gill Sans Medium" },
  { key: "gillSansMediumItalic", label: "Gill Sans Medium Italic", family: "Gill Sans Medium Italic" },
  { key: "gothamMedium", label: "gotham-medium", family: "gotham-medium" },
  { key: "gothambold", label: "gothambold", family: "gothambold" },
  { key: "goudyMedieval", label: "goudy-medieval", family: "goudy-medieval" },
  { key: "invocation", label: "Invocation", family: "Invocation" },
  { key: "magicFomalhaut", label: "Magic-Fomalhaut", family: "Magic-Fomalhaut" },
  { key: "matrix", label: "Matrix", family: "Matrix" },
  { key: "matrixBold", label: "Matrix Bold", family: "Matrix Bold" },
  { key: "montserratMedium", label: "Montserrat-Medium", family: "Montserrat-Medium" },
  { key: "montserratSemibold", label: "Montserrat-SemiBold", family: "Montserrat-SemiBold" },
  { key: "2012c863631ba71f874aba70590795a1", label: "MTG Symbol (2012)", family: "2012c863631ba71f874aba70590795a1" },
  { key: "neosansproitalic", label: "NeoSansProItalic", family: "NeoSansProItalic" },
  { key: "neosansproregular", label: "NeoSansProRegular", family: "NeoSansProRegular" },
  { key: "notosansRegular", label: "NotoSans-Regular", family: "NotoSans-Regular" },
  { key: "nudmotoyaexaporoW6", label: "NudMotoyaExAporo_W6", family: "NudMotoyaExAporo_W6" },
  { key: "ocrAStdRegular", label: "OCR A Std Regular", family: "OCR A Std Regular" },
  { key: "officinaSerItcBlack", label: "officina-ser-itc-black", family: "officina-ser-itc-black" },
  { key: "palatinoFont", label: "Palatino Font", family: "Palatino Font" },
  { key: "phyrexian", label: "Phyrexian", family: "Phyrexian" },
  { key: "plantin", label: "Plantin", family: "Plantin" },
  { key: "plantinItalic", label: "Plantin Italic", family: "Plantin Italic" },
  { key: "saloonGirl", label: "saloon-girl", family: "saloon-girl" },
  { key: "shangoGothicBold", label: "shango-gothic-bold", family: "shango-gothic-bold" },
  { key: "souvenirItcTOtBold", label: "Souvenir-Itc-T-OT-Bold", family: "Souvenir-Itc-T-OT-Bold" },
  { key: "souvenirstdMedium", label: "souvenirstd-medium", family: "souvenirstd-medium" },
  { key: "specialeliteRegular", label: "SpecialElite-Regular", family: "SpecialElite-Regular" },
  { key: "thunderman", label: "Thunderman", family: "Thunderman" },
] as const satisfies readonly FontCatalogEntry[]

export type CreativeFontKey = (typeof FONT_CATALOG)[number]['key']

export const CREATIVE_FONT_OPTIONS: readonly { key: CreativeFontKey; label: string }[] =
  FONT_CATALOG.map(({ key, label }) => ({ key, label }))

const FONT_CATALOG_BY_KEY = new Map<string, FontCatalogEntry>(
  FONT_CATALOG.map((entry) => [entry.key, entry]),
)

export function isCreativeFontKey(k: string): k is CreativeFontKey {
  return FONT_CATALOG_BY_KEY.has(k)
}

export function getCreativeFontFamily(key: string): string | null {
  return FONT_CATALOG_BY_KEY.get(key)?.family ?? null
}

/** Primary family + serif fallback for Konva / canvas text. */
export function getCreativeFontStackFromKey(key: string): string {
  const family = getCreativeFontFamily(key)
  return family ? `${family}, serif` : 'Plantin, serif'
}

export const FONT_CATALOG_WEIGHT_GROUP: Partial<Record<CreativeFontKey, FontWeightGroupId>> = {
  beleren: 'beleren',
  belerenBold: 'beleren',
  matrix: 'matrix',
  matrixBold: 'matrix',
  dinNextRegular: 'dinNext',
  dinNextMedium: 'dinNext',
  dinNextBold: 'dinNext',
  montserratMedium: 'montserrat',
  montserratSemibold: 'montserrat',
  neosansproregular: 'neoSans',
  neosansproitalic: 'neoSans',
  decourCndRegular: 'decour',
  decourCndRegularItalic: 'decour',
  plantin: 'plantin',
  plantinItalic: 'plantin',
  gothamMedium: 'gotham',
  gothambold: 'gotham',
  gillSansMedium: 'gillSans',
  gillSansMediumItalic: 'gillSans',
  gillSansBoldItalic: 'gillSans',
}

export const FONT_WEIGHT_GROUP_SLOTS: Record<
  FontWeightGroupId,
  Partial<Record<CreativeFontWeight, CreativeFontKey>>
> = {
  beleren: { normal: 'beleren', semibold: 'belerenBold', bold: 'belerenBold' },
  matrix: { normal: 'matrix', semibold: 'matrixBold', bold: 'matrixBold' },
  dinNext: { normal: 'dinNextRegular', semibold: 'dinNextMedium', bold: 'dinNextBold' },
  montserrat: {
    normal: 'montserratMedium',
    semibold: 'montserratSemibold',
    bold: 'montserratSemibold',
  },
  neoSans: {
    normal: 'neosansproregular',
    semibold: 'neosansproregular',
    bold: 'neosansproregular',
    italic: 'neosansproitalic',
  },
  decour: {
    normal: 'decourCndRegular',
    semibold: 'decourCndRegular',
    bold: 'decourCndRegular',
    italic: 'decourCndRegularItalic',
  },
  plantin: { normal: 'plantin', semibold: 'plantin', bold: 'plantin', italic: 'plantinItalic' },
  gotham: { normal: 'gothamMedium', semibold: 'gothamMedium', bold: 'gothambold' },
  gillSans: {
    normal: 'gillSansMedium',
    semibold: 'gillSansMedium',
    bold: 'gillSansBoldItalic',
    italic: 'gillSansMediumItalic',
  },
}

function resolveFontKeyForWeight(fontKey: string, weight: CreativeFontWeight): CreativeFontKey {
  const groupId = FONT_CATALOG_WEIGHT_GROUP[fontKey as CreativeFontKey]
  if (!groupId) return fontKey as CreativeFontKey
  const slots = FONT_WEIGHT_GROUP_SLOTS[groupId]
  return (slots[weight] ?? slots.normal ?? fontKey) as CreativeFontKey
}

function buildCanvasFontStylePrefix(
  weight: CreativeFontWeight,
  family: string,
): string {
  const caps = FONT_FACE_CAPABILITIES[family] ?? DEFAULT_FONT_FACE_CAPABILITIES
  const maxWeight = Math.max(...caps.weights)
  const parts: string[] = []
  const intrinsicItalic =
    caps.styles.includes('italic') && !caps.styles.includes('normal')

  if (weight === 'italic') {
    if (caps.variableWeight && caps.styles.includes('italic')) parts.push('italic')
    else if (!intrinsicItalic) parts.push('italic')
  }

  if (weight === 'bold') {
    if (caps.variableWeight && caps.weights.includes(700)) parts.push('bold')
    else if (maxWeight < 700) parts.push('bold')
  } else if (weight === 'semibold') {
    if (caps.variableWeight && caps.weights.includes(600)) parts.push('600')
    else if (maxWeight < 600) {
      if (caps.weights.includes(600)) parts.push('600')
      else if (maxWeight < 700) parts.push('bold')
    }
  }

  return parts.length ? parts.join(' ') : 'normal'
}

export type ResolvedCreativeFontFace = {
  fontKey: CreativeFontKey
  fontStack: string
  fontStyle: string
}

/** Map font + weight to the loaded @font-face family and Konva fontStyle prefix. */
export function resolveCreativeFontFace(
  fontKey: string,
  weight: CreativeFontWeight,
): ResolvedCreativeFontFace {
  const resolvedKey = resolveFontKeyForWeight(fontKey, weight)
  const family = getCreativeFontFamily(resolvedKey) ?? 'Plantin'
  return {
    fontKey: resolvedKey,
    fontStack: getCreativeFontStackFromKey(resolvedKey),
    fontStyle: buildCanvasFontStylePrefix(weight, family),
  }
}

/** Canvas font string aligned with Konva Text._getContextFont (fontStyle + variant + size + family). */
export function buildCanvasFont(fontStyle: string, fontSize: number, fontFamily: string): string {
  const stylePrefix = fontStyle && fontStyle !== 'normal' ? `${fontStyle} ` : ''
  const normalizedFamily = fontFamily
    .split(',')
    .map((part) => {
      let family = part.trim()
      const hasSpace = family.includes(' ')
      const hasQuotes = family.includes('"') || family.includes("'")
      if (hasSpace && !hasQuotes) family = `"${family}"`
      return family
    })
    .join(', ')
  return `${stylePrefix}normal ${fontSize}px ${normalizedFamily}`
}
