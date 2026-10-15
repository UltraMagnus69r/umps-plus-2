/**
 * Phase 15.1 — Empty states & contextual guidance (typography via Phase 9 `UI_TEXT_HELP*`).
 */
import { UI_TEXT_HELP_COMPACT } from './typographyAuthority'

/** Muted inline hint: use inside panels or over preview (keep `pointer-events-none` on overlays). */
export const UI_GUIDANCE_INLINE = `${UI_TEXT_HELP_COMPACT} block pt-1 leading-snug`

export type CardGuidanceSnapshot = {
  name: string
  typeLine: string
  manaCost: string
  cardText: string
  flavorText: string
  power: string
  toughness: string
  artImage: string
  clonedCardImage: string
}

const blank = (s: string | undefined | null) => !String(s ?? '').trim()

/**
 * True when the card has no primary text, P/T, flavor, or raster/cloned art — “blank slate” for preview hints.
 */
export function isCardEffectivelyEmptyForGuidance(d: CardGuidanceSnapshot): boolean {
  return (
    blank(d.name) &&
    blank(d.typeLine) &&
    blank(d.manaCost) &&
    blank(d.cardText) &&
    blank(d.flavorText) &&
    blank(d.power) &&
    blank(d.toughness) &&
    blank(d.artImage) &&
    blank(d.clonedCardImage)
  )
}

/** Normalized “no prints” outcome from Scryfall name search (store uses this message). */
export function isScryfallNoMatchingPrintsMessage(message: string | null | undefined): boolean {
  if (!message) return false
  return /no matching prints found/i.test(message.trim())
}
