/**
 * Infer UMPS layout + Scryfall art URI from Scryfall print metadata.
 * @see https://scryfall.com/docs/api/cards — `full_art`, `border_color`, `frame_effects`
 */

import type { LayoutFamily, LayoutId, LayoutVariant } from './layoutTaxonomy'
import { scryfallTypeLineIsPlaneswalker } from './planeswalkerAbilityAuthority'

export type ScryfallImageUriSet = {
  art_crop?: string | null
  border_crop?: string | null
  large?: string | null
  normal?: string | null
  png?: string | null
}

export type ScryfallLayoutHints = {
  full_art: boolean
  border_color: string | null
  frame_effects: readonly string[]
  type_line: string | null
}

export function scryfallTypeLineIsLand(typeLine: string | null | undefined): boolean {
  if (typeLine == null) return false
  return /\bLand\b/i.test(String(typeLine))
}

function normalizeFrameEffects(value: unknown): readonly string[] {
  if (!Array.isArray(value)) return []
  return value.filter((entry): entry is string => typeof entry === 'string')
}

export function readScryfallLayoutHints(raw: {
  full_art?: unknown
  border_color?: unknown
  frame_effects?: unknown
  type_line?: unknown
}): ScryfallLayoutHints {
  return {
    full_art: raw.full_art === true,
    border_color: typeof raw.border_color === 'string' ? raw.border_color : null,
    frame_effects: normalizeFrameEffects(raw.frame_effects),
    type_line: typeof raw.type_line === 'string' ? raw.type_line : null,
  }
}

export function inferScryfallLayoutFamily(typeLine: string | null | undefined): LayoutFamily {
  if (scryfallTypeLineIsPlaneswalker(typeLine)) return 'planeswalker'
  if (scryfallTypeLineIsLand(typeLine)) return 'land'
  return 'standard'
}

/** Map Scryfall print fields to a UMPS layout variant (modern / borderless / full-art). */
export function inferScryfallLayoutVariant(
  hints: Pick<ScryfallLayoutHints, 'full_art' | 'border_color' | 'frame_effects'>,
): LayoutVariant {
  // Borderless showcase prints often set both `border_color: borderless` and `full_art: true`.
  // UMPS borderless keeps modern plates; full-art uses floating text — borderless wins.
  if (hints.border_color === 'borderless') return 'borderless'
  if (hints.frame_effects.some((effect) => effect === 'extendedart' || effect === 'showcase')) {
    return 'borderless'
  }
  if (hints.full_art) return 'full-art'
  return 'modern'
}

export function inferScryfallLayoutId(hints: ScryfallLayoutHints): LayoutId {
  return {
    family: inferScryfallLayoutFamily(hints.type_line),
    variant: inferScryfallLayoutVariant(hints),
  }
}

export function scryfallLayoutUsesFullBleedArt(variant: LayoutVariant): boolean {
  return variant === 'borderless' || variant === 'full-art'
}

/**
 * Art-only import URI for the editor art layer.
 * Prefers `art_crop`; full-bleed prints fall back to wider card crops only when art crop is missing.
 */
export function resolveScryfallImportArtUri(
  uris: ScryfallImageUriSet | null | undefined,
  variant: LayoutVariant,
): string | null {
  const artCrop = pickUri(uris?.art_crop)
  if (artCrop) return artCrop

  if (scryfallLayoutUsesFullBleedArt(variant)) {
    return pickUri(uris?.border_crop) ?? pickUri(uris?.large) ?? pickUri(uris?.normal) ?? null
  }

  return pickUri(uris?.normal) ?? pickUri(uris?.large) ?? null
}

function pickUri(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}
