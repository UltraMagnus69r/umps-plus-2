/**
 * Typography Authority — (1) card face text registry + (2) Phase 9.3 UI shell class names.
 * Card/renderer: types, defaults, creative font keys below.
 * Studio UI: `UI_TEXT_*` → `.ui-text-*` in `index.css` (Phase 9.1 tokens).
 *
 * Module 5.1 — Creative fonts: UI selects `CreativeFontKey`; full catalog in fontCatalog.ts.
 */

import {
  CREATIVE_FONT_OPTIONS,
  getCreativeFontStackFromKey,
  isCreativeFontKey,
  resolveCreativeFontFace,
  type CreativeFontKey,
  type CreativeFontWeight,
} from '../data/fontCatalog'

export type { CreativeFontKey }
export { CREATIVE_FONT_OPTIONS, isCreativeFontKey }

export type CardTextField = 'NAME' | 'PT' | 'TYPE' | 'RULES' | 'FLAVOR' | 'METADATA'

export const FONT_REGISTRY: Record<CardTextField, string> = {
  NAME: 'Beleren Bold',
  PT: 'Beleren Bold',
  TYPE: 'Matrix Bold',
  RULES: 'Plantin',
  FLAVOR: 'Plantin Italic',
  METADATA: 'Gill Sans Condensed Bold',
} as const

/**
 * Returns the authorized font stack for the field: primary family + serif fallback.
 */
export function getFontStack(field: CardTextField): string {
  return `${FONT_REGISTRY[field]}, serif`
}

export type CardFieldTypographyWeight = 'normal' | 'semibold' | 'bold' | 'italic'

export interface CardFieldTypography {
  fontKey: CreativeFontKey
  weight: CardFieldTypographyWeight
  /** Text fill #RRGGBB */
  color: string
  /** When true, `color` is used as-is and skips auto light/dark ink. */
  colorManual: boolean
  /** Designer scale 6–20 (pt-style); mapped to stage px in renderer. */
  sizePt: number
}

export const TYPOGRAPHY_SIZE_PT_MIN = 6
export const TYPOGRAPHY_SIZE_PT_MAX = 20

/** Pre-Modern face text (card name + type line): Plantin, normal weight. */
export function getPreModernFaceFontStack(): string {
  return getFontStack('RULES')
}

export const PRE_MODERN_FACE_FONT_STYLE = 'normal'

/** 12pt-reference cap height as a fraction of name-bar slot height (includes 15% base reduction). */
export const NAME_PLATE_BASE_HEIGHT_RATIO = 0.72 * 0.85
/** 12pt-reference cap height as a fraction of type-line slot height (includes 15% base reduction). */
export const TYPE_LINE_BASE_HEIGHT_RATIO = 0.62 * 0.85

export function getCreativeFontStack(key: CreativeFontKey): string {
  return getCreativeFontStackFromKey(key)
}

/** Resolve catalog font + weight to Konva-ready family stack and canvas fontStyle. */
export function resolveTypographyFontFace(
  fontKey: CreativeFontKey,
  weight: CardFieldTypographyWeight,
): { fontStack: string; fontStyle: string } {
  const face = resolveCreativeFontFace(fontKey, weight as CreativeFontWeight)
  return { fontStack: face.fontStack, fontStyle: face.fontStyle }
}

/** @deprecated Prefer resolveTypographyFontFace — weight alone ignores per-family @font-face rules. */
export function konvaFontStyleFromWeight(w: CardFieldTypographyWeight): string {
  switch (w) {
    case 'normal':
      return 'normal'
    case 'bold':
      return 'bold'
    case 'italic':
      return 'italic'
    case 'semibold':
      return '600'
    default:
      return 'normal'
  }
}

export function clampTypographySizePt(n: number): number {
  const x = Number(n)
  if (!Number.isFinite(x)) return TYPOGRAPHY_SIZE_PT_MIN
  return Math.max(
    TYPOGRAPHY_SIZE_PT_MIN,
    Math.min(TYPOGRAPHY_SIZE_PT_MAX, Math.round(x)),
  )
}

/**
 * Map 6–20 pt control to stage pixels; `referencePxAt12` is the px size that represents 12 on the slider.
 */
export function typographyPtToStagePx(pt: number, referencePxAt12: number): number {
  const p = clampTypographySizePt(pt)
  const ref = Math.max(1, referencePxAt12)
  return Math.max(1, (p / 12) * ref)
}

function expandShortHex(s: string): string | null {
  const m = /^#([0-9a-f]{3})$/i.exec(s.trim())
  if (!m) return null
  const h = m[1]
  return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`
}

export function sanitizeCardFieldTypography(
  raw: unknown,
  fallback: CardFieldTypography,
): CardFieldTypography {
  if (raw == null || typeof raw !== 'object') return { ...fallback }
  const o = raw as Record<string, unknown>
  const fontKey =
    typeof o.fontKey === 'string' && isCreativeFontKey(o.fontKey) ? o.fontKey : fallback.fontKey
  const w = o.weight
  const weight: CardFieldTypographyWeight =
    w === 'normal' || w === 'semibold' || w === 'bold' || w === 'italic' ? w : fallback.weight
  let color = fallback.color
  if (typeof o.color === 'string') {
    const s = o.color.trim()
    if (/^#([0-9a-f]{6})$/i.test(s)) color = s
    else {
      const ex = expandShortHex(s)
      if (ex) color = ex
    }
  }
  const sizePt = clampTypographySizePt(
    typeof o.sizePt === 'number' ? o.sizePt : Number(o.sizePt) || fallback.sizePt,
  )
  const colorManual = o.colorManual === true
  return { fontKey, weight, color, colorManual, sizePt }
}

/** Use hand-picked ink when set; otherwise auto contrast ink from the renderer. */
export function resolveTypographyInkColor(typography: CardFieldTypography, autoInk: string): string {
  return typography.colorManual ? typography.color : autoInk
}

/** Treat stored non-default colors as manual (persisted designs before `colorManual` existed). */
export function migrateTypographyColorManual(
  raw: unknown,
  fallback: CardFieldTypography,
): CardFieldTypography {
  const t = sanitizeCardFieldTypography(raw, fallback)
  if (t.colorManual) return t
  if (t.color.toLowerCase() !== fallback.color.toLowerCase()) {
    return { ...t, colorManual: true }
  }
  return { ...t, colorManual: false }
}

export function defaultNameTypography(): CardFieldTypography {
  return {
    fontKey: 'belerenBold',
    weight: 'bold',
    color: '#111111',
    colorManual: false,
    sizePt: 12,
  }
}

export function defaultTypeTypography(): CardFieldTypography {
  return {
    fontKey: 'matrixBold',
    weight: 'bold',
    color: '#111111',
    colorManual: false,
    sizePt: 12,
  }
}

export function defaultRulesTypography(): CardFieldTypography {
  return {
    fontKey: 'plantin',
    weight: 'normal',
    color: '#111111',
    colorManual: false,
    sizePt: 12,
  }
}

export function defaultFlavorTypography(): CardFieldTypography {
  return {
    fontKey: 'plantinItalic',
    weight: 'italic',
    color: '#333333',
    colorManual: false,
    sizePt: 12,
  }
}

export function defaultPtTypography(): CardFieldTypography {
  return {
    fontKey: 'belerenBold',
    weight: 'bold',
    color: '#111111',
    colorManual: false,
    sizePt: 12,
  }
}

export function defaultMetadataTypography(): CardFieldTypography {
  return {
    fontKey: 'gillCondensedBold',
    weight: 'bold',
    color: '#ffffff',
    colorManual: false,
    sizePt: 12,
  }
}

/** Stage px anchors for 12pt on the slider (renderer tuning). */
export const TYPO_RULES_PT_REF_PX = 45
export const TYPO_FLAVOR_PT_REF_PX = 38
export const TYPO_PT_BOX_REF_PX = 110
export const TYPO_METADATA_PT_REF_PX = 18

// —— Phase 9.3 — UI shell typography roles (see `index.css` .ui-text-*) ——

export const UI_TEXT_SECTION_HEADER = 'ui-text-section-header'
export const UI_TEXT_LABEL = 'ui-text-label'
export const UI_TEXT_LABEL_COMPACT = 'ui-text-label ui-text-label--compact'
export const UI_TEXT_LABEL_SEMIBOLD = 'ui-text-label ui-text-label--semibold'
export const UI_TEXT_LABEL_COMPACT_SEMIBOLD = 'ui-text-label ui-text-label--semibold ui-text-label--compact'
export const UI_TEXT_LABEL_MD = 'ui-text-label ui-text-label--md'
export const UI_TEXT_HELP = 'ui-text-help'
export const UI_TEXT_HELP_COMPACT = 'ui-text-help ui-text-help--compact'
export const UI_TEXT_METADATA = 'ui-text-metadata'
export const UI_TEXT_METADATA_DANGER = 'ui-text-metadata ui-text-metadata--danger'
export const UI_TEXT_METADATA_SUCCESS = 'ui-text-metadata ui-text-metadata--success'
export const UI_TEXT_METADATA_SEMIBOLD = 'ui-text-metadata ui-text-metadata--semibold'
/** Primary actions in dense grids (theme tiles, etc.). */
export const UI_TEXT_ACTION = 'ui-text-label ui-text-label--md ui-text-label--semibold'

/** Primary CTA text on custom accent fills (mana modal close, etc.). */
export const UI_TEXT_INVERSE_STRONG = 'ui-text-inverse-strong'

/** Footer filename field (BottomBar). */
export const UI_TEXT_FOOTER_INPUT = 'ui-text-footer-input'
export const UI_TEXT_MONO_VALUE = 'ui-text-mono-value'
export const UI_TEXT_CONTROL = 'ui-text-control'
