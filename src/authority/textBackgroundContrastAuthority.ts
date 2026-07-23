import type { ColorBlendDirection } from '../store/useCardStore'
import { normalizeSpellTextBoxId } from '../data/spellPanelOptions'
import { blendHex, type ResolvedIdentity } from './colorAuthority'
import { getSwirlStopsFromResolvedIdentity } from './identitySwirlAuthority'
import { resolvePanelBackgroundContrastHex } from './panelBackgroundAuthority'
import type { ManualColorKey } from './colorAuthority'

/** Representative mid-tone for spell parchment panel ink contrast. */
const SPELL_PANEL_CONTRAST_HEX: Record<string, string> = {
  white: '#f2ebe0',
  artifact: '#d4c4a8',
  black: '#2a2a2a',
  blue: '#4a6a9a',
  colorless: '#c8c0b8',
  gold: '#c9a227',
  green: '#4a7a4a',
  land: '#e8dcc8',
  red: '#9a4a4a',
}

export function shouldDefaultWhiteInnerBorder(input: {
  autoColorEnabled: boolean
  manualColorKey: ManualColorKey
  manualColorHex1: string
  manualColorHex2: string
  manualColorHex3: string
  manualColorHex4: string
  manualColorHex5: string
  manualColorCount: 1 | 2 | 3 | 4 | 5
}): boolean {
  if (input.autoColorEnabled) return false
  const isHex = (v?: string) => typeof v === 'string' && /^#([0-9a-f]{6})$/i.test(v.trim())
  const slots = [
    input.manualColorHex1,
    input.manualColorHex2,
    input.manualColorHex3,
    input.manualColorHex4,
    input.manualColorHex5,
  ].slice(0, input.manualColorCount)
  const validCount = slots.filter((s) => isHex(s)).length
  if (validCount >= 1) return false
  return input.manualColorKey === 'none'
}

export function resolveIdentityContrastReferenceHex(identity: ResolvedIdentity): string {
  if (identity.kind === 'solid') return identity.fill
  if (identity.kind === 'gradient') return blendHex(identity.top, identity.bottom, 0.5)
  if (identity.kind === 'multi') return blendHexStops(identity.stops)
  return '#808080'
}

function blendHexStops(stops: readonly string[]): string {
  if (stops.length === 0) return '#808080'
  if (stops.length === 1) return stops[0]!
  return stops.reduce((acc, stop, index) => (index === 0 ? stop : blendHex(acc, stop, 0.5)))
}

export function resolveInnerBorderContrastReferenceHex(
  identity: ResolvedIdentity,
  innerBorderBackground: string,
  defaultWhite: boolean,
  colorBlendDirection: ColorBlendDirection = 'vertical',
): string {
  if (defaultWhite) return '#ffffff'
  if (innerBorderBackground === 'identity') {
    if (colorBlendDirection === 'swirl') {
      return blendHexStops(getSwirlStopsFromResolvedIdentity(identity))
    }
    return resolveIdentityContrastReferenceHex(identity)
  }
  return resolvePanelBackgroundContrastHex(innerBorderBackground)
}

export function resolveSpellPanelContrastReferenceHex(panelId: string): string {
  const id = normalizeSpellTextBoxId(panelId)
  return SPELL_PANEL_CONTRAST_HEX[id] ?? SPELL_PANEL_CONTRAST_HEX.white
}

/** Pre-modern collector band behind footer metadata (artist / copyright / rarity). */
export const PRE_MODERN_COLLECTOR_BAND_CONTRAST_HEX = '#000000'

/** Footer metadata sits on the collector band for pre-modern layouts, not the inner border fill. */
export function resolveMetadataFooterContrastReferenceHex(
  supportsPreModernFooterLayout: boolean,
  innerBorderContrastHex: string,
): string {
  return supportsPreModernFooterLayout ? PRE_MODERN_COLLECTOR_BAND_CONTRAST_HEX : innerBorderContrastHex
}
