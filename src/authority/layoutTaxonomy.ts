import { getPlaneswalkerModernV2InnerBorderCornerRadius } from './planeswalkerModernV2LayoutAuthority'
import { MODERN_DUMMY_INNER_BORDER_EXTRA_HEIGHT_PX } from './modernDummyLayoutAuthority'
import type { CardLayoutMode } from './geometryAuthority'
import {
  INNER_BORDER_CORNER_RADIUS_MODERN,
  SPELL_PRE_MODERN_INNER_BORDER_CORNER_RADIUS_PX,
} from './geometryAuthority'

export type LayoutFamily = 'standard' | 'land' | 'spell' | 'planeswalker'

export type LayoutVariant =
  | 'modern'
  | 'modern-v2'
  | 'pre-modern'
  | 'borderless'
  | 'full-art'
  | 'saga'
  | 'class'

export type LayoutId = {
  family: LayoutFamily
  variant: LayoutVariant
}

export const DEFAULT_LAYOUT_ID: LayoutId = {
  family: 'standard',
  variant: 'modern',
}

export const layoutCompatibility: Record<LayoutFamily, readonly LayoutVariant[]> = {
  standard: ['modern', 'pre-modern', 'borderless', 'full-art'],
  land: ['modern', 'pre-modern', 'borderless', 'full-art'],
  spell: ['modern', 'pre-modern', 'saga', 'class'],
  planeswalker: ['modern', 'modern-v2', 'pre-modern', 'borderless', 'full-art'],
}

export const LAYOUT_FAMILY_LABELS: Record<LayoutFamily, string> = {
  standard: 'Standard',
  land: 'Land',
  spell: 'Spell',
  planeswalker: 'Planeswalker',
}

export const LAYOUT_VARIANT_LABELS: Record<LayoutVariant, string> = {
  modern: 'Modern',
  'modern-v2': 'Modern V2',
  'pre-modern': 'Pre-Modern',
  borderless: 'Borderless',
  'full-art': 'Full Art',
  saga: 'Saga',
  class: 'Class',
}

export function getLayoutFamilyLabel(family: LayoutFamily): string {
  return LAYOUT_FAMILY_LABELS[family] ?? family
}

export function getLayoutVariantLabel(variant: LayoutVariant): string {
  return LAYOUT_VARIANT_LABELS[variant] ?? variant
}

export function getAllowedVariantsForFamily(family: LayoutFamily): readonly LayoutVariant[] {
  return layoutCompatibility[family]
}

export function isVariantCompatible(family: LayoutFamily, variant: LayoutVariant): boolean {
  return layoutCompatibility[family].includes(variant)
}

export function getDefaultVariantForFamily(family: LayoutFamily): LayoutVariant {
  const [first] = layoutCompatibility[family]
  return first ?? 'modern'
}

function normalizeFamily(value: unknown): LayoutFamily {
  if (
    value === 'standard' ||
    value === 'land' ||
    value === 'spell' ||
    value === 'planeswalker'
  )
    return value
  return DEFAULT_LAYOUT_ID.family
}

function normalizeVariant(value: unknown): LayoutVariant {
  if (value === 'standard') return 'modern'
  if (value === 'modern-dummy') return 'modern'
  if (value === 'borderless-dummy') return 'borderless'
  /** Legacy: planeswalker was a Standard variant id before planeswalker became its own family. */
  if (value === 'planeswalker') return 'modern'
  if (
    value === 'modern' ||
    value === 'modern-v2' ||
    value === 'pre-modern' ||
    value === 'borderless' ||
    value === 'full-art' ||
    value === 'saga' ||
    value === 'class'
  )
    return value
  return DEFAULT_LAYOUT_ID.variant
}

export function normalizeLayout(layout: Partial<LayoutId> | null | undefined): LayoutId {
  const legacyFamily = (layout as { family?: unknown } | null | undefined)?.family
  const legacyVariant = (layout as { variant?: unknown } | null | undefined)?.variant
  if (legacyFamily === 'saga') return { family: 'spell', variant: 'saga' }
  if (legacyFamily === 'class') return { family: 'spell', variant: 'class' }
  if (legacyFamily === 'standard' && legacyVariant === 'extended') {
    return { family: 'standard', variant: 'full-art' }
  }
  if (legacyFamily === 'standard' && legacyVariant === 'planeswalker') {
    return { family: 'planeswalker', variant: 'modern' }
  }
  if (legacyFamily === 'warframe') return { family: 'standard', variant: 'modern' }
  if (
    legacyFamily === 'special' ||
    legacyVariant === 'ascendant' ||
    legacyVariant === 'tarot'
  ) {
    return { family: 'standard', variant: 'modern' }
  }
  const family = normalizeFamily(layout?.family)
  const variant = normalizeVariant(layout?.variant)
  if (isVariantCompatible(family, variant)) return { family, variant }
  return { family, variant: getDefaultVariantForFamily(family) }
}

/**
 * Resolve an explicit layout-family / variant picker change.
 */
export function resolveRequestedLayoutSwitch(
  current: Partial<LayoutId> | null | undefined,
  requested: Partial<LayoutId> | null | undefined,
): LayoutId {
  const cur = normalizeLayout(current)
  const requestedFamily = normalizeFamily(requested?.family ?? cur.family)
  const allowed = getAllowedVariantsForFamily(requestedFamily)
  const requestedVariant = normalizeVariant(requested?.variant ?? cur.variant)
  const nextVariant = allowed.includes(requestedVariant)
    ? requestedVariant
    : getDefaultVariantForFamily(requestedFamily)
  return { family: requestedFamily, variant: nextVariant }
}

export function isStandardBorderlessLikeLayout(layout: Partial<LayoutId> | null | undefined): boolean {
  const normalized = normalizeLayout(layout)
  return (
    (normalized.family === 'standard' ||
      normalized.family === 'land' ||
      normalized.family === 'planeswalker') &&
    (normalized.variant === 'borderless' || normalized.variant === 'full-art')
  )
}

/**
 * Edge-to-bleed art / inner art-frame suppression: Standard, Land, or Planeswalker with borderless or full-art variant.
 */
export function isBorderlessArtTreatmentLayout(layout: Partial<LayoutId> | null | undefined): boolean {
  const normalized = normalizeLayout(layout)
  return (
    (normalized.family === 'standard' ||
      normalized.family === 'land' ||
      normalized.family === 'planeswalker') &&
    (normalized.variant === 'borderless' || normalized.variant === 'full-art')
  )
}

/** Standard / Full Art — floating-text full-art treatment (not Land / Full Art mana-circle frame). */
export function isStandardFullArtLayout(layout: Partial<LayoutId> | null | undefined): boolean {
  const normalized = normalizeLayout(layout)
  return normalized.family === 'standard' && normalized.variant === 'full-art'
}

/** Full-art variant frame treatment (Standard, Land, or Planeswalker). */
export function isFullArtVariantLayout(layout: Partial<LayoutId> | null | undefined): boolean {
  const normalized = normalizeLayout(layout)
  return (
    (normalized.family === 'standard' ||
      normalized.family === 'land' ||
      normalized.family === 'planeswalker') &&
    normalized.variant === 'full-art'
  )
}

/** Land / Full Art layout authority gate (mana-circle land frame). */
export function isLandFullArtLayout(layout: Partial<LayoutId> | null | undefined): boolean {
  const normalized = normalizeLayout(layout)
  return normalized.family === 'land' && normalized.variant === 'full-art'
}

/** Standard / Borderless — Modern chrome with full-bleed art (no inner border). */
export function isStandardModernBorderlessLayout(layout: Partial<LayoutId> | null | undefined): boolean {
  const normalized = normalizeLayout(layout)
  return (
    (normalized.family === 'standard' ||
      normalized.family === 'land' ||
      normalized.family === 'planeswalker') &&
    normalized.variant === 'borderless'
  )
}

/** Planeswalker layout family (any variant). */
export function isPlaneswalkerLayout(layout: Partial<LayoutId> | null | undefined): boolean {
  return normalizeLayout(layout).family === 'planeswalker'
}

/** Planeswalker / Modern V2 — bowed art, right-offset rules column, badge gutter. */
export function isPlaneswalkerModernV2Layout(layout: Partial<LayoutId> | null | undefined): boolean {
  const normalized = normalizeLayout(layout)
  return normalized.family === 'planeswalker' && normalized.variant === 'modern-v2'
}

/** Planeswalker Modern + Modern V2 — expandable vertically centered ability row boxes. */
export function isPlaneswalkerModernAbilityBoxLayout(layout: Partial<LayoutId> | null | undefined): boolean {
  const normalized = normalizeLayout(layout)
  return (
    normalized.family === 'planeswalker' &&
    (normalized.variant === 'modern' || normalized.variant === 'modern-v2')
  )
}

/** Standard or Land family Modern or Borderless variant (pre-modern art column + modern plates). */
export function isModernDummyLayout(layout: Partial<LayoutId> | null | undefined): boolean {
  const normalized = normalizeLayout(layout)
  return (
    (normalized.family === 'standard' ||
      normalized.family === 'land' ||
      normalized.family === 'planeswalker') &&
    (normalized.variant === 'modern' ||
      normalized.variant === 'modern-v2' ||
      normalized.variant === 'borderless')
  )
}

/** Standard, Land, or Spell with the Pre-Modern variant. */
export function isPreModernLayout(layout: Partial<LayoutId> | null | undefined): boolean {
  return normalizeLayout(layout).variant === 'pre-modern'
}

/** Spell family with the Pre-Modern variant. */
export function isSpellPreModernLayout(layout: Partial<LayoutId> | null | undefined): boolean {
  const normalized = normalizeLayout(layout)
  return normalized.family === 'spell' && normalized.variant === 'pre-modern'
}

/** Inner-border mat corner radii for the active layout variant (Konva `cornerRadius`). */
export function getInnerBorderCornerRadius(
  layout: Partial<LayoutId> | null | undefined,
): number | readonly number[] {
  if (isPreModernLayout(layout)) return SPELL_PRE_MODERN_INNER_BORDER_CORNER_RADIUS_PX
  if (isPlaneswalkerModernV2Layout(layout)) return getPlaneswalkerModernV2InnerBorderCornerRadius()
  return INNER_BORDER_CORNER_RADIUS_MODERN
}

export type InnerBorderFrameInput = {
  trimY: number
  trimH: number
  innerX: number
  innerY: number
  innerW: number
  innerH: number
}

/**
 * Pre-Modern: extend the inner-border mat downward so the bottom inset from trim
 * matches the top inset (innerY − trimY). Modern layouts return the canonical rect.
 */
export function getInnerBorderStageRect(
  layout: Partial<LayoutId> | null | undefined,
  frame: InnerBorderFrameInput,
): Pick<InnerBorderFrameInput, 'innerX' | 'innerY' | 'innerW' | 'innerH'> {
  if (isModernDummyLayout(layout)) {
    return {
      innerX: frame.innerX,
      innerY: frame.innerY,
      innerW: frame.innerW,
      innerH: frame.innerH + MODERN_DUMMY_INNER_BORDER_EXTRA_HEIGHT_PX,
    }
  }
  if (!isPreModernLayout(layout)) {
    return {
      innerX: frame.innerX,
      innerY: frame.innerY,
      innerW: frame.innerW,
      innerH: frame.innerH,
    }
  }
  const topMargin = frame.innerY - frame.trimY
  return {
    innerX: frame.innerX,
    innerY: frame.innerY,
    innerW: frame.innerW,
    innerH: Math.max(1, frame.trimH - 2 * topMargin),
  }
}

export function layoutFromLegacyMode(mode: CardLayoutMode): LayoutId {
  switch (mode) {
    case 'Land':
      return { family: 'land', variant: 'modern' }
    case 'Saga':
      return { family: 'spell', variant: 'saga' }
    case 'Class':
      return { family: 'spell', variant: 'class' }
    case 'Full Art':
      return { family: 'standard', variant: 'full-art' }
    case 'Extended Art':
      return { family: 'planeswalker', variant: 'modern' }
    case 'Borderless':
      return { family: 'standard', variant: 'borderless' }
    case 'Hidden':
      return { ...DEFAULT_LAYOUT_ID }
    case 'Standard':
    default:
      return { ...DEFAULT_LAYOUT_ID }
  }
}

export function layoutToLegacyMode(layout: LayoutId): Exclude<CardLayoutMode, 'Hidden'> {
  const normalized = normalizeLayout(layout)
  if (normalized.family === 'spell' && normalized.variant === 'saga') return 'Saga'
  if (normalized.family === 'spell' && normalized.variant === 'class') return 'Class'
  if (normalized.family === 'planeswalker' && normalized.variant === 'full-art') return 'Full Art'
  if (normalized.family === 'planeswalker' && normalized.variant === 'borderless') return 'Borderless'
  if (normalized.family === 'planeswalker') return 'Standard'
  if (normalized.family === 'standard' && normalized.variant === 'full-art') return 'Full Art'
  if (normalized.family === 'standard' && normalized.variant === 'borderless') return 'Borderless'
  if (normalized.family === 'land' && normalized.variant === 'full-art') return 'Full Art'
  if (normalized.family === 'land' && normalized.variant === 'borderless') return 'Borderless'
  if (normalized.family === 'land') return 'Land'
  return 'Standard'
}
