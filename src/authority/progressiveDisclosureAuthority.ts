/**
 * Phase 10.4 — Progressive Disclosure Engine.
 * Pure visibility rules for sidebar UI; no store, no React, no side effects.
 */

import type { LayoutCapabilityFlags } from './layoutContract'
import type { LayoutFamily, LayoutId } from './layoutTaxonomy'
import type { WorkflowState } from './workflowAuthority'

/** Snapshot needed for left sidebar + shared layout-driven visibility. */
export type ProgressiveDisclosureSidebarInput = {
  layoutFamily: LayoutFamily
  capabilities: LayoutCapabilityFlags
  showSecondaryName: boolean
  /** Planeswalker flavor toggle — when false, flavor typography is hidden. */
  showFlavorTextOnCard?: boolean
}

export type ProgressiveDisclosureColorInput = {
  autoColorEnabled: boolean
}

/** Land / Full Art reduced Core Inputs (name + name-plate mana only). */
export function isLandFullArtReducedCore(capabilities: LayoutCapabilityFlags): boolean {
  return capabilities.useLandFullArtManaCircle
}

/** Full Core Inputs (non–Land-Full-Art card text block). */
export function shouldShowExpandedCoreCardInputs(capabilities: LayoutCapabilityFlags): boolean {
  return !capabilities.useLandFullArtManaCircle
}

export function shouldShowSecondaryNameToggle(input: ProgressiveDisclosureSidebarInput): boolean {
  return shouldShowExpandedCoreCardInputs(input.capabilities)
}

export function shouldShowSecondaryNameFields(input: ProgressiveDisclosureSidebarInput): boolean {
  return input.showSecondaryName && shouldShowSecondaryNameToggle(input)
}

export function shouldShowRulesTextAndFlavorBlock(input: ProgressiveDisclosureSidebarInput): boolean {
  if (input.capabilities.supportsPlaneswalkerAbilities) return false
  return (
    shouldShowExpandedCoreCardInputs(input.capabilities) &&
    !input.capabilities.supportsLandSecondaryArtInRulesRegion
  )
}

export function shouldShowRulesTextEditor(input: ProgressiveDisclosureSidebarInput): boolean {
  return shouldShowRulesTextAndFlavorBlock(input)
}

export function shouldShowFlavorTextField(input: ProgressiveDisclosureSidebarInput): boolean {
  if (input.capabilities.supportsPlaneswalkerAbilities) {
    return input.capabilities.supportsFlavorText
  }
  return shouldShowRulesTextAndFlavorBlock(input) && input.capabilities.supportsFlavorText
}

export function shouldShowPowerToughnessCoreBlock(input: ProgressiveDisclosureSidebarInput): boolean {
  if (input.layoutFamily === 'land' || input.layoutFamily === 'planeswalker') return false
  return (
    input.layoutFamily === 'standard' &&
    shouldShowExpandedCoreCardInputs(input.capabilities)
  )
}

export function shouldShowStartingLoyaltyCoreBlock(input: ProgressiveDisclosureSidebarInput): boolean {
  return input.capabilities.supportsStartingLoyaltyBox
}

export function shouldShowPowerToughnessControls(input: ProgressiveDisclosureSidebarInput): boolean {
  return (
    shouldShowPowerToughnessCoreBlock(input) &&
    (input.capabilities.supportsPowerToughnessBox || input.capabilities.supportsPreModernInlinePowerToughness)
  )
}

export function shouldShowLandPanelArtSelector(capabilities: LayoutCapabilityFlags): boolean {
  return capabilities.supportsLandSecondaryArtInRulesRegion
}

export function shouldShowPtTypographySubsection(capabilities: LayoutCapabilityFlags): boolean {
  return capabilities.supportsPowerToughnessBox
}

export function shouldShowRulesTypographySubsection(input: ProgressiveDisclosureSidebarInput): boolean {
  if (input.capabilities.supportsPlaneswalkerAbilities) return true
  return shouldShowRulesTextAndFlavorBlock(input)
}

export function shouldShowFlavorTypographySubsection(input: ProgressiveDisclosureSidebarInput): boolean {
  if (input.capabilities.supportsPlaneswalkerAbilities) {
    return Boolean(input.showFlavorTextOnCard) && input.capabilities.supportsFlavorText
  }
  return shouldShowFlavorTextField(input)
}

export function shouldShowColorIdentityPipControls(input: ProgressiveDisclosureColorInput): boolean {
  return input.autoColorEnabled
}

export function shouldShowManualColorPaletteControls(input: ProgressiveDisclosureColorInput): boolean {
  return !input.autoColorEnabled
}

export function shouldShowPtPlateGeometry(capabilities: LayoutCapabilityFlags): boolean {
  return capabilities.supportsPowerToughnessBox && !capabilities.supportsPreModernFooterLayout
}

export function shouldShowPlateGeometry(capabilities: LayoutCapabilityFlags): boolean {
  return !capabilities.supportsPreModernFooterLayout
}

export function shouldShowSpellTextBoxSelector(input: {
  layoutFamily: LayoutFamily
  layout: LayoutId
}): boolean {
  return input.layout.variant === 'pre-modern' && input.layoutFamily === 'spell'
}

/** Crown / Armor asset pickers — Modern layout variant only. */
export function shouldShowCrownArmorSelectors(input: {
  layout: LayoutId
}): boolean {
  return input.layout.variant === 'modern'
}

export function shouldShowPreModernTextBoxSelector(input: {
  layoutFamily: LayoutFamily
  layout: LayoutId
}): boolean {
  if (
    input.layoutFamily === 'standard' &&
    (input.layout.variant === 'modern' || input.layout.variant === 'borderless')
  ) {
    return true
  }
  if (
    input.layoutFamily === 'land' &&
    (input.layout.variant === 'modern' || input.layout.variant === 'borderless')
  ) {
    return true
  }
  if (
    input.layoutFamily === 'planeswalker' &&
    (input.layout.variant === 'modern' ||
      input.layout.variant === 'modern-v2' ||
      input.layout.variant === 'borderless')
  ) {
    return true
  }
  return (
    input.layout.variant === 'pre-modern' &&
    (input.layoutFamily === 'standard' ||
      input.layoutFamily === 'land' ||
      input.layoutFamily === 'planeswalker')
  )
}

export function shouldShowPtPanelGradientField(capabilities: LayoutCapabilityFlags): boolean {
  return capabilities.supportsPowerToughnessBox
}

export function shouldShowLayoutCapabilityPtSummaryLine(family: LayoutFamily): boolean {
  return family === 'standard'
}

/** Planeswalker structured inputs (static + loyalty rows) — Phase 2 UI; gate on capability for now. */
export function shouldShowPlaneswalkerCoreInputs(input: ProgressiveDisclosureSidebarInput): boolean {
  return input.capabilities.supportsPlaneswalkerAbilities
}

/**
 * Print guides / bleed UI — lives under Settings & Debug; always available so bleed/trim/safe
 * overlays can be toggled while editing (not only after preview-ready workflow).
 */
export function shouldShowPrintAlignmentDebugTools(_workflowState: WorkflowState): boolean {
  return true
}

/** Alias (roadmap naming): P/T core inputs visibility. */
export const shouldShowPTFields = shouldShowPowerToughnessControls

/** Art Assets section remains available for all layouts; upload/zoom apply universally. */
export function shouldShowArtControls(_input: ProgressiveDisclosureSidebarInput): boolean {
  return true
}

/** Color Identity section is always shown when opened; pip vs manual splits use dedicated helpers. */
export function shouldShowColorControls(_input: ProgressiveDisclosureColorInput): boolean {
  return true
}

/** Metadata strip on card; collector/editorial fields remain editable regardless (reserved for future gating). */
export function shouldShowMetadata(capabilities: LayoutCapabilityFlags): boolean {
  return capabilities.supportsMetadataStrip
}
