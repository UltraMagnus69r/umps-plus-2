import type { NormalizedRect } from './geometryAuthority'
import type { LayoutId } from './layoutTaxonomy'

export type LayoutRegionRect = NormalizedRect

export type CoreLayoutRegionKey = 'art' | 'nameBar' | 'typeLine' | 'rulesText' | 'metadataStrip'

export type LowerRightRegion = {
  kind: 'powerToughness' | 'functionalZone'
  rect: LayoutRegionRect
}

export type CoreLayoutRegions = {
  art: LayoutRegionRect
  nameBar: LayoutRegionRect
  typeLine: LayoutRegionRect
  rulesText: LayoutRegionRect
  metadataStrip: LayoutRegionRect
  lowerRight?: LowerRightRegion
}

export type LayoutCapabilityFlags = {
  supportsFlavorText: boolean
  supportsPowerToughnessBox: boolean
  supportsMetadataStrip: boolean
  supportsEdgeToBleedArt: boolean
  supportsFloatingTextTreatment: boolean
  supportsSecondaryStructuralRegions: boolean
  /** Land / Standard + Land / Borderless: rules region shows bundled land panel art, not rules text. */
  supportsLandSecondaryArtInRulesRegion: boolean
  /** Rules text box can use Surface FX color/texture (false when rules region is land panel art). */
  supportsRulesTextBoxTexture: boolean
  /** Land / Full Art: hide parsed mana-cost icons in the name strip (symbol only in mana circle). */
  suppressNameBarManaCostRendering: boolean
  /** Land / Full Art: render left mana circle (driven by cardData.landFullArtManaCircleKey). */
  useLandFullArtManaCircle: boolean
  /** Land / Full Art: do not render oracle/rules body text in the rules region. */
  suppressRulesTextRendering: boolean
  /** Raised Name Plate panel in FrameLayer (false for Pre-Modern). */
  supportsNamePlateBox: boolean
  /** Raised Type Line panel in FrameLayer (false for Pre-Modern). */
  supportsTypeLineBox: boolean
  /** Rarity hologram seal between rules and metadata (false for Pre-Modern). */
  supportsHologramSeal: boolean
  /** Pre-Modern: P/T text below rules box; centered artist/copyright footer. */
  supportsPreModernFooterLayout: boolean
  /** Raised rules-text recess in FrameLayer (false for Spell / Pre-Modern parchment panel). */
  supportsRulesTextBoxFrame: boolean
  /** Spell / Pre-Modern: bundled parchment panel in the rules-text frame slot. */
  supportsSpellTextBoxPanel: boolean
  /** Pre-Modern face layout: art-aligned name/type, scaled mana pips, type-line slot geometry. */
  supportsPreModernFaceLayout: boolean
  /** Standard / Land Pre-Modern: fixed recessed rules text box (art-box style frame). */
  supportsPreModernTextBoxFrame: boolean
  /** Standard / Pre-Modern: inline P/T below rules text box (no P/T chrome box). */
  supportsPreModernInlinePowerToughness: boolean
  /** Standard / Modern: contract-driven plate + P/T slots (pre-modern column, modern chrome). */
  supportsModernDummyLayout: boolean
  /** Planeswalker: starting loyalty shield in the lower-right slot (replaces P/T). */
  supportsStartingLoyaltyBox: boolean
  /** Planeswalker: structured static + loyalty ability rows instead of monolithic rules text. */
  supportsPlaneswalkerAbilities: boolean
  /** Planeswalker / Modern V2 — bowed art frame, rounded rules recess, badge gutter outside rules box. */
  supportsPlaneswalkerModernV2Layout: boolean
}

export type BleedBehavior = 'trim-contained' | 'edge-to-bleed'

export type ComplianceMetadata = {
  requiresTrimCompliance: boolean
  requiresSafeZoneCompliance: boolean
}

export type LayoutFamilyRegionExtensions = Record<string, LayoutRegionRect | readonly LayoutRegionRect[]>

export type LayoutContract = {
  id: LayoutId
  regions: CoreLayoutRegions
  capabilities: LayoutCapabilityFlags
  bleedBehavior: BleedBehavior
  compliance: ComplianceMetadata
  familyExtensions?: LayoutFamilyRegionExtensions
}

const DEFAULT_CAPABILITIES: LayoutCapabilityFlags = {
  supportsFlavorText: true,
  supportsPowerToughnessBox: true,
  supportsMetadataStrip: true,
  supportsEdgeToBleedArt: false,
  supportsFloatingTextTreatment: false,
  supportsSecondaryStructuralRegions: false,
  supportsLandSecondaryArtInRulesRegion: false,
  supportsRulesTextBoxTexture: true,
  suppressNameBarManaCostRendering: false,
  useLandFullArtManaCircle: false,
  suppressRulesTextRendering: false,
  supportsNamePlateBox: true,
  supportsTypeLineBox: true,
  supportsHologramSeal: true,
  supportsPreModernFooterLayout: false,
  supportsRulesTextBoxFrame: true,
  supportsSpellTextBoxPanel: false,
  supportsPreModernFaceLayout: false,
  supportsPreModernTextBoxFrame: false,
  supportsPreModernInlinePowerToughness: false,
  supportsModernDummyLayout: false,
  supportsStartingLoyaltyBox: false,
  supportsPlaneswalkerAbilities: false,
  supportsPlaneswalkerModernV2Layout: false,
}

const DEFAULT_COMPLIANCE: ComplianceMetadata = {
  requiresTrimCompliance: true,
  requiresSafeZoneCompliance: true,
}

export function isCoreRegionKey(key: string): key is CoreLayoutRegionKey {
  return key === 'art' || key === 'nameBar' || key === 'typeLine' || key === 'rulesText' || key === 'metadataStrip'
}

export function hasFamilyExtensionRegions(contract: LayoutContract): contract is LayoutContract & {
  familyExtensions: LayoutFamilyRegionExtensions
} {
  return Boolean(contract.familyExtensions && Object.keys(contract.familyExtensions).length > 0)
}

export function hasRequiredCoreRegions(
  regions: Partial<CoreLayoutRegions> | null | undefined,
): regions is CoreLayoutRegions {
  if (!regions) return false
  return Boolean(regions.art && regions.nameBar && regions.typeLine && regions.rulesText && regions.metadataStrip)
}

export function normalizeLayoutCapabilities(
  value: Partial<LayoutCapabilityFlags> | null | undefined,
): LayoutCapabilityFlags {
  return {
    ...DEFAULT_CAPABILITIES,
    ...(value ?? {}),
  }
}

export function normalizeLayoutContract(
  contract: Omit<LayoutContract, 'capabilities' | 'compliance'> & {
    capabilities?: Partial<LayoutCapabilityFlags>
    compliance?: Partial<ComplianceMetadata>
  },
): LayoutContract {
  return {
    ...contract,
    capabilities: normalizeLayoutCapabilities(contract.capabilities),
    compliance: {
      ...DEFAULT_COMPLIANCE,
      ...(contract.compliance ?? {}),
    },
  }
}
