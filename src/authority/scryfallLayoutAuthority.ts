/**
 * Infer UMPS layout + Scryfall art URI from Scryfall print metadata.
 * @see https://scryfall.com/docs/api/cards — `layout`, `type_line`, `full_art`, `border_color`, `frame_effects`
 */

import type { LayoutFamily, LayoutId, LayoutVariant } from './layoutTaxonomy'
import { isVariantCompatible } from './layoutTaxonomy'
import { scryfallTypeLineIsPlaneswalker } from './planeswalkerAbilityAuthority'

export type ScryfallImageUriSet = {
  art_crop?: string | null
  border_crop?: string | null
  large?: string | null
  normal?: string | null
  png?: string | null
}

export type ScryfallLayoutHints = {
  /** Scryfall `layout` (saga, class, normal, transform, battle, …). */
  layout: string | null
  full_art: boolean
  border_color: string | null
  frame_effects: readonly string[]
  type_line: string | null
}

export function scryfallTypeLineIsLand(typeLine: string | null | undefined): boolean {
  if (typeLine == null) return false
  return /\bLand\b/i.test(String(typeLine))
}

export function scryfallTypeLineIsBattle(typeLine: string | null | undefined): boolean {
  if (typeLine == null) return false
  return /\bBattle\b/i.test(String(typeLine))
}

/** Enchantment Creature — Saga (either face). */
export function scryfallTypeLineIsSagaCreature(typeLine: string | null | undefined): boolean {
  if (typeLine == null) return false
  const faces = String(typeLine).split(/\s*\/\/\s*/)
  return faces.some((face) => /\bCreature\b/i.test(face) && /\bSaga\b/i.test(face))
}

/** Enchantment — Saga (non-creature face). */
export function scryfallTypeLineIsSaga(typeLine: string | null | undefined): boolean {
  if (typeLine == null) return false
  if (scryfallTypeLineIsSagaCreature(typeLine)) return false
  const faces = String(typeLine).split(/\s*\/\/\s*/)
  return faces.some((face) => /\bSaga\b/i.test(face))
}

export function scryfallTypeLineIsClass(typeLine: string | null | undefined): boolean {
  if (typeLine == null) return false
  const faces = String(typeLine).split(/\s*\/\/\s*/)
  return faces.some((face) => /\bClass\b/i.test(face))
}

export function scryfallTypeLineIsCreature(typeLine: string | null | undefined): boolean {
  if (typeLine == null) return false
  return /\bCreature\b/i.test(String(typeLine))
}

export function scryfallTypeLineIsInstantOrSorcery(typeLine: string | null | undefined): boolean {
  if (typeLine == null) return false
  return /\b(?:Instant|Sorcery)\b/i.test(String(typeLine))
}

export function scryfallTypeLineIsEnchantment(typeLine: string | null | undefined): boolean {
  if (typeLine == null) return false
  return /\bEnchantment\b/i.test(String(typeLine))
}

function normalizeFrameEffects(value: unknown): readonly string[] {
  if (!Array.isArray(value)) return []
  return value.filter((entry): entry is string => typeof entry === 'string')
}

export function readScryfallLayoutHints(raw: {
  layout?: unknown
  full_art?: unknown
  border_color?: unknown
  frame_effects?: unknown
  type_line?: unknown
}): ScryfallLayoutHints {
  return {
    layout: typeof raw.layout === 'string' ? raw.layout.trim().toLowerCase() : null,
    full_art: raw.full_art === true,
    border_color: typeof raw.border_color === 'string' ? raw.border_color : null,
    frame_effects: normalizeFrameEffects(raw.frame_effects),
    type_line: typeof raw.type_line === 'string' ? raw.type_line : null,
  }
}

/**
 * Print-treatment variant (modern / borderless / full-art) when the family allows it.
 * Special variants (saga, class, saga-creature) are chosen by type/layout, not here.
 */
export function inferScryfallPrintTreatmentVariant(
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

/** @deprecated Prefer inferScryfallPrintTreatmentVariant; kept for call-site clarity. */
export function inferScryfallLayoutVariant(
  hints: Pick<ScryfallLayoutHints, 'full_art' | 'border_color' | 'frame_effects'>,
): LayoutVariant {
  return inferScryfallPrintTreatmentVariant(hints)
}

function withCompatibleTreatment(family: LayoutFamily, preferred: LayoutVariant, treatment: LayoutVariant): LayoutVariant {
  if (preferred !== 'modern') return preferred
  if (isVariantCompatible(family, treatment)) return treatment
  return preferred
}

/**
 * Map Scryfall type_line + layout to a PipMint family/variant.
 * PKMN is never auto-selected (MTG Scryfall payloads are not Pokémon).
 */
export function inferScryfallLayoutId(hints: ScryfallLayoutHints): LayoutId {
  const typeLine = hints.type_line
  const scryLayout = hints.layout
  const treatment = inferScryfallPrintTreatmentVariant(hints)

  // Battle (Siege) — layout `battle`, or DFC (`transform` / modal) with Battle on a face.
  // Front-face names like "Invasion of Ikoria" resolve via type_line "Battle — Siege // …".
  if (
    scryLayout === 'battle' ||
    scryfallTypeLineIsBattle(typeLine) ||
    ((scryLayout === 'transform' || scryLayout === 'modal_dfc' || scryLayout === 'double_faced_token') &&
      scryfallTypeLineIsBattle(typeLine))
  ) {
    return { family: 'battle', variant: 'modern' }
  }

  if (scryfallTypeLineIsPlaneswalker(typeLine)) {
    return {
      family: 'planeswalker',
      variant: withCompatibleTreatment('planeswalker', 'modern', treatment),
    }
  }

  // Saga Creature before plain Saga (Enchantment Creature — Saga).
  if (scryfallTypeLineIsSagaCreature(typeLine)) {
    return { family: 'standard', variant: 'saga-creature' }
  }

  if (scryLayout === 'saga' || scryfallTypeLineIsSaga(typeLine)) {
    return { family: 'spell', variant: 'saga' }
  }

  if (scryLayout === 'class' || scryfallTypeLineIsClass(typeLine)) {
    return { family: 'spell', variant: 'class' }
  }

  if (scryfallTypeLineIsLand(typeLine)) {
    return {
      family: 'land',
      variant: withCompatibleTreatment('land', 'modern', treatment),
    }
  }

  // Instants / sorceries / non-saga/class enchantments → Spell family.
  if (
    scryfallTypeLineIsInstantOrSorcery(typeLine) ||
    (scryfallTypeLineIsEnchantment(typeLine) && !scryfallTypeLineIsCreature(typeLine))
  ) {
    return {
      family: 'spell',
      variant: withCompatibleTreatment('spell', 'modern', treatment),
    }
  }

  // Creatures / artifacts / default permanents → Standard.
  return {
    family: 'standard',
    variant: withCompatibleTreatment('standard', 'modern', treatment),
  }
}

/** Family-only helper retained for callers that only need the family bucket. */
export function inferScryfallLayoutFamily(typeLine: string | null | undefined): LayoutFamily {
  return inferScryfallLayoutId(
    readScryfallLayoutHints({ type_line: typeLine ?? null, layout: null }),
  ).family
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
