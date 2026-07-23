/**
 * Planeswalker structured ability model — static line + loyalty-cost rows, cardText sync, Scryfall oracle parse.
 */

import {
  normalizePlaneswalkerAbilityRow,
  normalizePlaneswalkerCostSign,
  PLANESWALKER_MAX_ABILITY_ROWS,
  type PlaneswalkerCostSign,
} from './planeswalkerSymbolAuthority'

export type PlaneswalkerAbility = {
  costSign: PlaneswalkerCostSign
  costValue: number
  text: string
}

export function createDefaultPlaneswalkerAbility(): PlaneswalkerAbility {
  return { costSign: '+', costValue: 1, text: '' }
}

export function normalizePlaneswalkerAbilityCount(value: unknown): number {
  const n = Math.round(Number(value) || 1)
  return Math.max(1, Math.min(PLANESWALKER_MAX_ABILITY_ROWS, n))
}

export function normalizePlaneswalkerAbility(raw: unknown): PlaneswalkerAbility {
  if (raw != null && typeof raw === 'object') {
    const o = raw as Record<string, unknown>
    const costSign = normalizePlaneswalkerCostSign(o.costSign)
    const costValue =
      costSign === '0'
        ? 0
        : Math.max(0, Math.min(99, Math.round(Number(o.costValue) || 0)))
    return {
      costSign,
      costValue,
      text: String(o.text ?? ''),
    }
  }
  return createDefaultPlaneswalkerAbility()
}

export function normalizePlaneswalkerAbilities(
  raw: unknown,
  count?: unknown,
): PlaneswalkerAbility[] {
  const targetCount = normalizePlaneswalkerAbilityCount(
    count ?? (Array.isArray(raw) ? raw.length : 1),
  )
  const source = Array.isArray(raw) ? raw : []
  const out: PlaneswalkerAbility[] = []
  for (let i = 0; i < targetCount; i++) {
    out.push(normalizePlaneswalkerAbility(source[i]))
  }
  return out
}

export function formatAbilityCostLabel(sign: PlaneswalkerCostSign, value: number): string {
  if (sign === '0') return '0'
  const glyph = sign === '-' ? '−' : sign
  return `${glyph}${Math.max(0, Math.round(value) || 0)}`
}

/** Rebuild hidden `cardText` from structured planeswalker fields (export / debug / legacy readers). */
export function rebuildPlaneswalkerCardText(input: {
  planeswalkerStaticText: string
  planeswalkerAbilities: readonly PlaneswalkerAbility[]
  planeswalkerAbilityCount?: number
}): string {
  const parts: string[] = []
  const staticText = String(input.planeswalkerStaticText ?? '').trim()
  if (staticText) parts.push(staticText)
  const count = normalizePlaneswalkerAbilityCount(
    input.planeswalkerAbilityCount ?? input.planeswalkerAbilities.length,
  )
  const abilities = normalizePlaneswalkerAbilities(input.planeswalkerAbilities, count)
  for (const ab of abilities) {
    const text = String(ab.text ?? '').trim()
    if (!text) continue
    parts.push(`[${formatAbilityCostLabel(ab.costSign, ab.costValue)}]: ${text}`)
  }
  return parts.join('\n')
}

const ABILITY_LINE_BRACKETED_RE =
  /^\[(?<sign>\+|−|-|\u2212|0)(?<value>\d*)\]:\s*(?<text>.*)$/u
/** Scryfall bare oracle lines: `+1:`, `−4:`, `-9:`, `0:` (no brackets). */
const ABILITY_LINE_BARE_RE =
  /^(?<sign>\+|(?:\u2212|−|-))(?<value>\d*):\s*(?<text>.*)$/u
const ABILITY_LINE_BARE_ZERO_RE = /^0:\s*(?<text>.*)$/u

function parseAbilityLine(trimmed: string): PlaneswalkerAbility | null {
  let sign: PlaneswalkerCostSign | null = null
  let costValue = 0
  let text = ''

  const bracketed = trimmed.match(ABILITY_LINE_BRACKETED_RE)
  if (bracketed?.groups) {
    const signRaw = bracketed.groups.sign
    sign = signRaw === '0' ? '0' : signRaw.startsWith('+') ? '+' : '-'
    costValue = sign === '0' ? 0 : Math.max(0, parseInt(bracketed.groups.value || '0', 10) || 0)
    text = String(bracketed.groups.text ?? '').trim()
  } else {
    const bareZero = trimmed.match(ABILITY_LINE_BARE_ZERO_RE)
    if (bareZero?.groups) {
      sign = '0'
      costValue = 0
      text = String(bareZero.groups.text ?? '').trim()
    } else {
      const bare = trimmed.match(ABILITY_LINE_BARE_RE)
      if (!bare?.groups) return null
      sign = bare.groups.sign.startsWith('+') ? '+' : '-'
      costValue = Math.max(0, parseInt(bare.groups.value || '0', 10) || 0)
      text = String(bare.groups.text ?? '').trim()
    }
  }

  if (sign == null) return null
  return { costSign: sign, costValue, text }
}

export function scryfallTypeLineIsPlaneswalker(typeLine: string | null | undefined): boolean {
  return typeLine != null && /\bPlaneswalker\b/i.test(String(typeLine))
}

/** Parse Scryfall `oracle_text` into static + loyalty ability rows. */
export function parsePlaneswalkerOracleText(oracle: string | null | undefined): {
  staticText: string
  abilities: PlaneswalkerAbility[]
} {
  const lines = String(oracle ?? '').split(/\r?\n/)
  const abilities: PlaneswalkerAbility[] = []
  const staticLines: string[] = []
  let seenAbility = false

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const parsedLine = parseAbilityLine(trimmed)
    if (parsedLine) {
      seenAbility = true
      abilities.push(parsedLine)
    } else if (!seenAbility) {
      staticLines.push(trimmed)
    } else if (abilities.length > 0) {
      const last = abilities[abilities.length - 1]
      last.text = last.text ? `${last.text}\n${trimmed}` : trimmed
    }
  }

  return {
    staticText: staticLines.join('\n'),
    abilities: abilities.length > 0 ? abilities : [createDefaultPlaneswalkerAbility()],
  }
}

export function syncCardDataPlaneswalkerCardText(
  cardData: Pick<
    CardDataPlaneswalkerFields,
    'planeswalkerStaticText' | 'planeswalkerAbilities' | 'planeswalkerAbilityCount'
  >,
): string {
  return rebuildPlaneswalkerCardText(cardData)
}

export type CardDataPlaneswalkerFields = {
  startingLoyalty: string
  planeswalkerStaticText: string
  planeswalkerAbilityCount: number
  planeswalkerAbilities: PlaneswalkerAbility[]
  showFlavorTextOnCard: boolean
}

export const DEFAULT_PLANESWALKER_CARD_FIELDS: CardDataPlaneswalkerFields = {
  startingLoyalty: '',
  planeswalkerStaticText: '',
  planeswalkerAbilityCount: 1,
  planeswalkerAbilities: [createDefaultPlaneswalkerAbility()],
  showFlavorTextOnCard: false,
}

export function normalizeStartingLoyalty(value: unknown): string {
  return String(value ?? '').trim()
}

export function abilityRowIndexToDisplayRow(index: number): number {
  return normalizePlaneswalkerAbilityRow(index + 1)
}
