import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import {
  fetchScryfallCardById,
  fetchScryfallCardBySetCollector,
  parseScryfallCardUrl,
  parseSetCollectorInput,
  searchScryfallPrintsByName,
  type ScryfallCardFields,
  type ScryfallPrintCandidate,
} from '../services/scryfallService'
import {
  mapScryfallWatermarkToPath,
  type WatermarkPathKey,
  isWatermarkPathKey,
} from '../authority/watermarkAuthority'
import {
  normalizeManaTokenInner,
  normalizeStoreManaCost,
  normalizeStoreRulesText,
} from '../utils/manaCanonical'
import { slugifyCardName } from '../utils/textUtils'
import { loadSharedImage } from '../utils/sharedImageLoadCache'
import { DEFAULT_CARD_COPYRIGHT, normalizeCardCopyright } from '../authority/collectorDataAuthority'
import { formatManaTokenInnerForSet, normalizeManaSymbolSetId } from '../authority/manaSymbolSetAuthority'
import { generateHighResExport, downloadBlob } from '../services/exportService'
import { resolvePngFilename } from '../utils/filenameAuthority'
import {
  applyExportPresetToPngFilename,
  applyTrimCropToPngFilename,
  DEFAULT_EXPORT_PRESET_ID,
  getExportPreset,
  normalizeExportPresetId,
  type ExportPresetId,
} from '../authority/exportPresetAuthority'
import {
  normalizePersistedColorBlendDirection,
  normalizePersistedManualColorCount,
  normalizePersistedManualColorKey,
  shouldRestoreEditorSession,
} from '../authority/sessionPersistenceAuthority'
import {
  normalizeColorIdentityPips,
  resolveProceduralIdentity,
  type ColorIdentityPip,
  type ManualColorKey,
} from '../authority/colorAuthority'
import type { BoxColorGradientDirection } from '../authority/boxPanelFillAuthority'
import {
  normalizeBoxColorGradientDirection,
  normalizeBoxColorGradientSaturation,
  normalizeBoxGradientReversed,
} from '../authority/boxPanelFillAuthority'
import { DEFAULT_PANEL_BOX_HEX } from '../authority/boxColorUiAuthority'
import { sanitizePanelBackground, type PanelBackgroundPreview } from '../authority/panelBackgroundAuthority'
import type { CardLayoutMode } from '../authority/geometryAuthority'
import {
  normalizeCardLayoutMode,
} from '../authority/geometryAuthority'
import {
  clampArtPlacementOffsets,
  computeDefaultArtPlacement,
} from '../authority/artPlacementAuthority'
import {
  normalizeNameplateBoxShape,
  migrateBezierPlateEnabled,
  type NameplateBoxShape,
} from '../authority/nameplateShapeAuthority'
import { processUploadedImage } from '../authority/imageProcessingAuthority'
import {
  DEFAULT_PLANESWALKER_CARD_FIELDS,
  normalizePlaneswalkerAbilities,
  normalizePlaneswalkerAbilityCount,
  normalizeStartingLoyalty,
  parsePlaneswalkerOracleText,
  rebuildPlaneswalkerCardText,
  scryfallTypeLineIsPlaneswalker,
  syncCardDataPlaneswalkerCardText,
  type PlaneswalkerAbility,
} from '../authority/planeswalkerAbilityAuthority'
import {
  normalizeLandFullArtManaCircleKey,
  type LandFullArtManaCircleKey,
} from '../authority/landFullArtManaCircle'
import {
  DEFAULT_LAYOUT_ID,
  layoutFromLegacyMode,
  layoutToLegacyMode,
  normalizeLayout,
  type LayoutId,
} from '../authority/layoutTaxonomy'
import {
  getActiveLayoutArtRectFromState,
  getActiveLayoutCapabilitiesFromState,
  normalizeRequestedLayoutSwitch,
  getLegacyLayoutArtRect,
} from '../authority/layoutRegistry'
import type { CardFieldTypography } from '../authority/typographyAuthority'
import type { TypographyFontPreview } from '../authority/typographyPreviewAuthority'
import {
  defaultFlavorTypography,
  defaultMetadataTypography,
  defaultNameTypography,
  defaultPtTypography,
  defaultRulesTypography,
  defaultTypeTypography,
  migrateTypographyColorManual,
  sanitizeCardFieldTypography,
} from '../authority/typographyAuthority'
import {
  deriveWorkflowState as deriveWorkflowStatePure,
  type WorkflowDerivationInput,
  type WorkflowState,
} from '../authority/workflowAuthority'
import { resolveSetSymbolBoxPx } from '../authority/symbolAuthority'
import { normalizeSpellTextBoxId } from '../data/spellPanelOptions'
import { normalizePreModernRulesTextBoxId } from '../data/preModernRulesTextBoxOptions'

export type { ColorIdentityPip, ManualColorKey } from '../authority/colorAuthority'
export type { BoxColorGradientDirection } from '../authority/boxPanelFillAuthority'
export { normalizeBoxGradientReversed } from '../authority/boxPanelFillAuthority'
export type { NameplateBoxShape } from '../authority/nameplateShapeAuthority'
export {
  OUTER_BORDER_COLORS,
  normalizeColorIdentityPips,
  getOuterBorderHex,
  getOuterBorderFill,
  resolveProceduralIdentity,
} from '../authority/colorAuthority'

export type ColorBlendDirection = 'vertical' | 'horizontal' | 'diagonal' | 'swirl'

export type ThemeMode = 'googled'

/** Module UI-J — Async Status Authority. Canonical 4-state model for async operations. */
export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error'

export type AsyncStatusState = { status: AsyncStatus; message: string | null }

/** Scryfall search/import flow status model for print-picker lifecycle. */
export type ScryfallFlowStatus = 'idle' | 'loading' | 'success' | 'failure'

export type AsyncOperationKey =
  | 'artUpload'
  | 'setIconUpload'
  | 'designLoad'
  | 'export'
  | 'scryfallFetch'

export interface CardData {
  name: string
  secondaryName: string
  showSecondaryName: boolean
  // Phase 3.6a – Secondary Name manual sizing (designer-controlled)
  secondaryNameFontSize: number
  /** When false: black text, white stroke, white shadow. When true: white text, black stroke, black shadow. */
  secondaryNameLightText: boolean
  manaCost: string
  /** Mana picker insert mode only — does not change how existing tokens render. */
  manaSymbolSet: 'default' | 'alternate' | 'custom'
  typeLine: string
  cardText: string
  power: string
  toughness: string
  rarity: 'common' | 'uncommon' | 'rare' | 'mythic'
  flavorText: string
  filename: string
  /** Module 3.6 — derived from card name for file naming; alphanumeric only. */
  filenameSlug: string
  theme: ThemeMode

  // Phase 2.4 – Print Guides (debug-only)
  showBleed: boolean
  showTrim: boolean
  showSafeZone: boolean
  /** Bleed fill: auto = follow outer border; otherwise a hex color (#RRGGBB). */
  bleedFillColor: 'auto' | string
  showPowerToughness: boolean
  // Phase 2.2 – Art & Texture
  artImage?: string
  /** Land / Standard + Borderless: stable id for bundled panel in `public/land-panels` (not a filesystem path). */
  landSecondaryPanelId: string
  /** Spell / Pre-Modern: bundled parchment panel id in `public/spell-panels`. */
  spellTextBoxId: string
  /** Standard / Land Pre-Modern: bundled rules text box background in `public/premodern-rules-textbox`. */
  preModernRulesTextBoxId: string
  /** Land / Full Art only — single basic-land style pip in the name-plate mana circle (`manaData` keys). */
  landFullArtManaCircleKey: LandFullArtManaCircleKey
  layout: LayoutId
  artIntrinsicWidth: number
  artIntrinsicHeight: number
  // Art transform (Konva)
  artZoom: number
  artOffsetX: number
  artOffsetY: number
  hasManualArtPlacement: boolean
  // Inner Border (frame mat) — Surface FX controls (doc 04 group D).
  /** Whether the generated Inner Border mat is drawn. */
  innerBorderEnabled: boolean
  /** Inner Border opacity, 0–1. (Control removed from UI; kept for saved-card compatibility.) */
  innerBorderOpacity: number
  /**
   * Inner Border background source. 'identity' = fill from Color Identity (auto/manual);
   * otherwise an Outer-Border picker value (color key, m15solid:, m15tex:) used as the fill.
   */
  innerBorderBackground: string
  // Outer Border Frame (OBF) Texture — applies over solid/dual Outer Border colors only.
  /** OBF texture file (served from /assets/textures/{file}); '' = none. */
  outerBorderFrameTexture: string
  /** OBF texture opacity, 0–1. */
  outerBorderFrameTextureOpacity: number
  // Phase 2.2 – Inside Border Texture
  selectedTexture: string
  textureOpacity: number
  // Back-compat for legacy UI/components that expect a nested texture settings object.
  // Keep this in sync with selectedTexture/textureOpacity.
  textureSettings?: {
    selection: string
    opacity: number
  }

  /** Surface FX — rules text box only; `/assets/textures/{file}`; empty = none. */
  rulesTextBoxTexture: string
  rulesTextBoxTextureOpacity: number
  /** Rules text box panel fill (`#RRGGBB`); under texture when Surface FX texture is on, else FrameLayer. */
  rulesTextBoxColor: string
  /** Name plate raised panel fill (`#RRGGBB`). */
  nameBoxColor: string
  /** Type line box raised panel fill (`#RRGGBB`). */
  typeLineBoxColor: string
  /** Module 6.3 — name plate silhouette: rounded rect vs Bezier stamped plate. */
  nameBarShape: NameplateBoxShape
  /** Module 6.3 — type line plate silhouette. */
  typeBarShape: NameplateBoxShape
  /** Module 6.3 — P/T box plate silhouette (when layout shows P/T). */
  ptBarShape: NameplateBoxShape
  /** Module 6.3 — reverse Bezier stamped plates on name, type, and P/T (default on). */
  bezierPlateEnabled: boolean
  /** P/T box raised panel fill (`#RRGGBB`) when layout supports P/T. */
  ptBoxColor: string

  /** Per-panel gradient: when false, that panel uses solid `*BoxColor`. */
  nameBoxGradientEnabled: boolean
  nameBoxGradientDirection: BoxColorGradientDirection
  /** 0–100; chroma for name bar gradient / swirl when enabled. */
  nameBoxGradientSaturation: number
  /** Swap light/rich (and swirl sampling) for name bar. */
  nameBoxGradientReversed: boolean
  typeLineBoxGradientEnabled: boolean
  typeLineBoxGradientDirection: BoxColorGradientDirection
  typeLineBoxGradientSaturation: number
  typeLineBoxGradientReversed: boolean
  rulesTextBoxGradientEnabled: boolean
  rulesTextBoxGradientDirection: BoxColorGradientDirection
  rulesTextBoxGradientSaturation: number
  rulesTextBoxGradientReversed: boolean
  ptBoxGradientEnabled: boolean
  ptBoxGradientDirection: BoxColorGradientDirection
  ptBoxGradientSaturation: number
  ptBoxGradientReversed: boolean

  /** Outer border (trim) color key; see OUTER_BORDER_COLORS. */
  outerBorderColor: string

  /**
   * Module 4.2 — explicit color identity (WUBRG) for auto-color; user-selected, max 5 unique pips.
   * Not inferred from card name or mana cost.
   */
  colorIdentity: ColorIdentityPip[]

  // Phase 2.3 – Set icon
  setIconImage?: string
  iconScale: number

  // Module 3.4 – Metadata strip
  set: string
  collector_number: string
  language: string
  artist: string
  copyright: string

  /** Module 5.2 — rules-area watermark (`none` = hidden). */
  watermarkPath: WatermarkPathKey
  /** Module 5.2 — 0–1 multiplier for watermark visibility. */
  watermarkOpacity: number
  /** Module 5.2 — user-uploaded watermark (data URL). Used when watermarkPath === 'custom'. */
  customWatermarkDataUrl: string

  /** Module 5.4 — Ghost Overlay Engine (editor-only reference image). */
  referenceImage: string
  referenceOpacity: number
  referenceOffsetX: number
  referenceOffsetY: number

  /** Module 5.4 completion — printable cloned card image workflow. */
  clonedCardImage: string

  /** Module 5.1 — Creative Suite typography per major face text region. */
  nameTypography: CardFieldTypography
  typeTypography: CardFieldTypography
  rulesTypography: CardFieldTypography
  flavorTypography: CardFieldTypography
  ptTypography: CardFieldTypography
  metadataTypography: CardFieldTypography

  /** Planeswalker — starting loyalty in lower-right slot. */
  startingLoyalty: string
  planeswalkerStaticText: string
  planeswalkerAbilityCount: number
  planeswalkerAbilities: PlaneswalkerAbility[]
  /** When false, flavor is editable but not rendered on card (planeswalker default OFF). */
  showFlavorTextOnCard: boolean
}

/** Keys for `updateCardTypography` — face text fields only (not metadata strip). */
export type CardTypographyKey = keyof Pick<
  CardData,
  | 'nameTypography'
  | 'typeTypography'
  | 'rulesTypography'
  | 'flavorTypography'
  | 'ptTypography'
  | 'metadataTypography'
>

export type SettingsState = {
  restoreSession: boolean
}

/** Module 4.1 — per-field dirty flags (manual edits). Strongly typed; not persisted. */
export const FIELD_DIRTY_KEYS = [
  'name',
  'manaCost',
  'typeLine',
  'cardText',
  'flavorText',
  'power',
  'toughness',
  'showPowerToughness',
  'set',
  'collectorNumber',
  'rarity',
  'artist',
  'copyright',
  'language',
  'artImage',
  'filename',
  'colorIdentity',
  'bleedFillColor',
  'watermarkPath',
  'watermarkOpacity',
  'customWatermarkDataUrl',
] as const

export type FieldDirtyKey = (typeof FIELD_DIRTY_KEYS)[number]

export type FieldDirtyState = { [K in FieldDirtyKey]: boolean }

export function createInitialFieldDirty(): FieldDirtyState {
  return {
    name: false,
    manaCost: false,
    typeLine: false,
    cardText: false,
    flavorText: false,
    power: false,
    toughness: false,
    showPowerToughness: false,
    set: false,
    collectorNumber: false,
    rarity: false,
    artist: false,
    copyright: false,
    language: false,
    artImage: false,
    filename: false,
    colorIdentity: false,
    bleedFillColor: false,
    watermarkPath: false,
    watermarkOpacity: false,
    customWatermarkDataUrl: false,
  }
}

/** Maps CardData keys to Module 4.1 dirty keys (collector_number → collectorNumber). */
const CARD_KEY_TO_DIRTY_MAP = {
  name: 'name',
  manaCost: 'manaCost',
  typeLine: 'typeLine',
  cardText: 'cardText',
  flavorText: 'flavorText',
  power: 'power',
  toughness: 'toughness',
  showPowerToughness: 'showPowerToughness',
  set: 'set',
  collector_number: 'collectorNumber',
  rarity: 'rarity',
  artist: 'artist',
  copyright: 'copyright',
  language: 'language',
  artImage: 'artImage',
  filename: 'filename',
  colorIdentity: 'colorIdentity',
  bleedFillColor: 'bleedFillColor',
  watermarkPath: 'watermarkPath',
  watermarkOpacity: 'watermarkOpacity',
  customWatermarkDataUrl: 'customWatermarkDataUrl',
} as const satisfies Partial<Record<keyof CardData, FieldDirtyKey>>

const CARD_KEY_TO_DIRTY_KEY: Partial<Record<keyof CardData, FieldDirtyKey>> = CARD_KEY_TO_DIRTY_MAP

/** Module 4.2 — card fields that participate in automation guard rails (same scope as dirty flags). */
export type SystemUpdatableCardKey = keyof typeof CARD_KEY_TO_DIRTY_MAP

export type SystemCardDataUpdate = Partial<Pick<CardData, SystemUpdatableCardKey>>

function normalizeScryfallRarity(r: string): CardData['rarity'] {
  const v = r.toLowerCase()
  if (v === 'common' || v === 'uncommon' || v === 'rare' || v === 'mythic') return v
  return 'common'
}

/** Incoming Scryfall type line: only Creature / Vehicle use imported P/T. */
function scryfallTypeLineSupportsPT(typeLine: string | null): boolean {
  if (typeLine == null) return false
  const tl = String(typeLine)
  return /\bCreature\b/i.test(tl) || /\bVehicle\b/i.test(tl)
}

/** Map Scryfall service payload into applySystemUpdate input (only defined fields). */
function scryfallFieldsToSystemUpdate(data: ScryfallCardFields): SystemCardDataUpdate {
  const out: SystemCardDataUpdate = {}
  if (data.name != null) out.name = data.name
  if (data.mana_cost != null) out.manaCost = data.mana_cost
  if (data.type_line != null) out.typeLine = data.type_line
  if (!scryfallTypeLineIsPlaneswalker(data.type_line) && data.oracle_text != null) {
    out.cardText = data.oracle_text
  }
  if (data.flavor_text != null) out.flavorText = data.flavor_text
  if (data.power != null) out.power = data.power
  if (data.toughness != null) out.toughness = data.toughness
  if (data.set != null) out.set = data.set
  if (data.collector_number != null) out.collector_number = data.collector_number
  if (data.rarity != null) out.rarity = normalizeScryfallRarity(data.rarity)
  if (data.artist != null) out.artist = data.artist
  if (data.lang != null && String(data.lang).trim().length > 0) {
    out.language = String(data.lang).trim().toUpperCase()
  }
  if (data.art_crop_uri != null && data.art_crop_uri.length > 0) out.artImage = data.art_crop_uri
  if (data.watermark != null) {
    const wm = mapScryfallWatermarkToPath(data.watermark)
    if (wm != null && wm !== 'none') out.watermarkPath = wm
  }
  if (data.color_identity != null && data.color_identity.length > 0) {
    out.colorIdentity = normalizeColorIdentityPips(data.color_identity)
  }
  return out
}

type SystemUpdateApplyResult = {
  cardData: CardData
  changed: boolean
  shouldRefitArt: boolean
}

/** Pure applySystemUpdate body — shared by automation updates and batched Scryfall import. */
function applySystemUpdateToCardData(
  cardData: CardData,
  dirty: FieldDirtyState,
  update: SystemCardDataUpdate,
): SystemUpdateApplyResult {
  let next: CardData = { ...cardData }
  let changed = false
  let shouldRefitArt = false

  for (const cardKey of Object.keys(update) as SystemUpdatableCardKey[]) {
    if (!(cardKey in CARD_KEY_TO_DIRTY_MAP)) continue
    const dirtyKey = CARD_KEY_TO_DIRTY_MAP[cardKey]
    if (!dirtyKey || dirty[dirtyKey]) continue

    const raw = update[cardKey]
    if (raw === undefined) continue

    if (cardKey === 'filename') {
      next = { ...next, filename: String(raw) }
      changed = true
      continue
    }

    if (cardKey === 'name') {
      const n = String(raw ?? '')
      next = { ...next, name: n }
      if (!dirty.filename) {
        next = { ...next, filenameSlug: slugifyCardName(n) }
      }
      changed = true
      continue
    }

    if (cardKey === 'manaCost' || cardKey === 'cardText') {
      next =
        cardKey === 'manaCost'
          ? { ...next, manaCost: normalizeStoreManaCost(String(raw ?? '')) }
          : { ...next, cardText: normalizeStoreRulesText(String(raw ?? '')) }
      changed = true
      continue
    }

    if (cardKey === 'showPowerToughness') {
      next = { ...next, showPowerToughness: Boolean(raw) }
      changed = true
      continue
    }

    if (cardKey === 'artImage') {
      const nextArtImage = String(raw ?? '').trim()
      next = {
        ...next,
        artImage: nextArtImage,
        artIntrinsicWidth: 0,
        artIntrinsicHeight: 0,
        artZoom: 1,
        artOffsetX: 0,
        artOffsetY: 0,
        hasManualArtPlacement: false,
      }
      shouldRefitArt = Boolean(nextArtImage)
      changed = true
      continue
    }

    if (cardKey === 'typeLine') next = { ...next, typeLine: String(raw ?? '') }
    else if (cardKey === 'flavorText') next = { ...next, flavorText: String(raw ?? '') }
    else if (cardKey === 'power') next = { ...next, power: String(raw ?? '') }
    else if (cardKey === 'toughness') next = { ...next, toughness: String(raw ?? '') }
    else if (cardKey === 'set') next = { ...next, set: String(raw ?? '').trim().toLowerCase() }
    else if (cardKey === 'collector_number') next = { ...next, collector_number: String(raw ?? '') }
    else if (cardKey === 'rarity') next = { ...next, rarity: raw as CardData['rarity'] }
    else if (cardKey === 'artist') next = { ...next, artist: String(raw ?? '') }
    else if (cardKey === 'language') next = { ...next, language: String(raw ?? '').trim().toUpperCase() || 'EN' }
    else if (cardKey === 'copyright') next = { ...next, copyright: String(raw ?? '') }
    else if (cardKey === 'colorIdentity') {
      next = {
        ...next,
        colorIdentity: normalizeColorIdentityPips(Array.isArray(raw) ? (raw as string[]) : []),
      }
    } else if (cardKey === 'watermarkPath') {
      const v = String(raw ?? '')
      next = {
        ...next,
        watermarkPath: (isWatermarkPathKey(v) ? v : 'none') as WatermarkPathKey,
      }
    } else if (cardKey === 'watermarkOpacity') {
      const o = Number(raw)
      next = {
        ...next,
        watermarkOpacity: Number.isFinite(o) ? Math.max(0, Math.min(1, o)) : next.watermarkOpacity,
      }
    } else continue

    changed = true
  }

  return { cardData: next, changed, shouldRefitArt }
}

function buildScryfallImportMappedUpdate(
  data: ScryfallCardFields,
  mapped: SystemCardDataUpdate,
): SystemCardDataUpdate {
  const out = { ...mapped }
  const pwExtras = buildScryfallPlaneswalkerExtras(data)
  if (pwExtras) {
    out.power = ''
    out.toughness = ''
    out.showPowerToughness = false
  } else if (!scryfallTypeLineSupportsPT(data.type_line)) {
    out.power = ''
    out.toughness = ''
    out.showPowerToughness = false
  } else {
    out.showPowerToughness = true
  }
  return out
}

function buildScryfallPlaneswalkerExtras(data: ScryfallCardFields): Partial<CardData> | null {
  if (!scryfallTypeLineIsPlaneswalker(data.type_line)) return null
  const parsed = parsePlaneswalkerOracleText(data.oracle_text)
  const abilityCount = normalizePlaneswalkerAbilityCount(parsed.abilities.length)
  const planeswalkerAbilities = normalizePlaneswalkerAbilities(parsed.abilities, abilityCount)
  const planeswalkerStaticText = parsed.staticText
  const startingLoyalty = normalizeStartingLoyalty(data.loyalty)
  const cardText = rebuildPlaneswalkerCardText({
    planeswalkerStaticText,
    planeswalkerAbilities,
    planeswalkerAbilityCount: abilityCount,
  })
  return {
    startingLoyalty,
    planeswalkerStaticText,
    planeswalkerAbilityCount: abilityCount,
    planeswalkerAbilities,
    showFlavorTextOnCard: false,
    cardText,
    power: '',
    toughness: '',
    showPowerToughness: false,
  }
}

function applyPlaneswalkerStructuredSync(next: CardData): CardData {
  const count = normalizePlaneswalkerAbilityCount(next.planeswalkerAbilityCount)
  const planeswalkerAbilities = normalizePlaneswalkerAbilities(next.planeswalkerAbilities, count)
  return {
    ...next,
    startingLoyalty: normalizeStartingLoyalty(next.startingLoyalty),
    planeswalkerAbilityCount: count,
    planeswalkerAbilities,
    cardText: syncCardDataPlaneswalkerCardText({
      planeswalkerStaticText: next.planeswalkerStaticText,
      planeswalkerAbilities,
      planeswalkerAbilityCount: count,
    }),
  }
}

function routeScryfallInput(input: string): { kind: 'url' | 'setCollector' | 'name'; set?: string; collector?: string } {
  const raw = String(input ?? '').trim()
  const fromUrl = parseScryfallCardUrl(raw)
  if (fromUrl) {
    return { kind: 'url', set: fromUrl.set, collector: fromUrl.collectorNumber }
  }
  const fromSetCollector = parseSetCollectorInput(raw)
  if (fromSetCollector) {
    return { kind: 'setCollector', set: fromSetCollector.set, collector: fromSetCollector.collectorNumber }
  }
  return { kind: 'name' }
}

/**
 * Scryfall fetch: for each CardData key present in the automation payload, clear the matching
 * Module 4.1 dirty flag via `CARD_KEY_TO_DIRTY_KEY` (handles `collector_number` → `collectorNumber`, etc.).
 * Never clears `filename` — filename / filenameSlug ownership must not be overridden by fetch.
 */
function nextFieldDirtyAfterScryfallMappedClear(
  current: FieldDirtyState,
  mapped: SystemCardDataUpdate,
): FieldDirtyState {
  const next: FieldDirtyState = { ...current }
  const cardKeys = Object.keys(mapped) as SystemUpdatableCardKey[]
  for (const cardKey of cardKeys) {
    if (!(cardKey in CARD_KEY_TO_DIRTY_KEY)) continue
    const dirtyKey = CARD_KEY_TO_DIRTY_KEY[cardKey]
    if (dirtyKey === undefined || dirtyKey === 'filename') continue
    next[dirtyKey] = false
  }
  return next
}

function fieldValuesEffectivelyEqual<K extends keyof CardData>(
  key: K,
  prev: CardData[K],
  next: CardData[K],
): boolean {
  if (key === 'manaCost' || key === 'cardText') {
    const a = String(prev ?? '')
    const b = String(next ?? '')
    return key === 'manaCost'
      ? normalizeStoreManaCost(a) === normalizeStoreManaCost(b)
      : normalizeStoreRulesText(a) === normalizeStoreRulesText(b)
  }
  if (key === 'artImage') {
    return String(prev ?? '') === String(next ?? '')
  }
  if (key === 'colorIdentity') {
    const a = normalizeColorIdentityPips((prev as ColorIdentityPip[]) ?? [])
    const b = normalizeColorIdentityPips((next as ColorIdentityPip[]) ?? [])
    return a.length === b.length && a.every((p, i) => p === b[i])
  }
  return prev === next
}

/**
 * Module 4.2 — sync manual hex preview fields from explicit color identity when auto-color is on.
 */
function syncColorIdentity(state: {
  autoColorEnabled: boolean
  cardData: Pick<CardData, 'typeLine' | 'colorIdentity' | 'name' | 'manaCost'>
  manualColorKey: ManualColorKey
  manualColorHex1: string
  manualColorHex2: string
  manualColorHex3: string
  manualColorHex4: string
  manualColorHex5: string
  manualColorCount: number
}): {
  manualColorHex1: string
  manualColorHex2: string
  manualColorHex3: string
  manualColorHex4: string
  manualColorHex5: string
  manualColorCount: 1 | 2 | 3 | 4 | 5
  manualUseTwoColors: boolean
} | null {
  if (!state.autoColorEnabled) return null
  const resolved = resolveProceduralIdentity(
    state.cardData.typeLine,
    state.cardData.colorIdentity,
    state.cardData.name,
    state.cardData.manaCost ?? '',
    true,
    state.manualColorKey,
    state.manualColorHex1,
    state.manualColorHex2,
    state.manualColorHex3,
    state.manualColorHex4,
    state.manualColorHex5,
    state.manualColorCount,
  )
  if (resolved.kind === 'solid') {
    return {
      manualColorHex1: resolved.fill,
      manualColorHex2: resolved.fill,
      manualColorHex3: '',
      manualColorHex4: '',
      manualColorHex5: '',
      manualColorCount: 1,
      manualUseTwoColors: false,
    }
  }
  if (resolved.kind === 'gradient') {
    return {
      manualColorHex1: resolved.top,
      manualColorHex2: resolved.bottom,
      manualColorHex3: '',
      manualColorHex4: '',
      manualColorHex5: '',
      manualColorCount: 2,
      manualUseTwoColors: true,
    }
  }
  if (resolved.kind === 'multi') {
    const stops = resolved.stops
    const c = (i: number) => stops[i] ?? ''
    const n = Math.min(5, Math.max(1, stops.length)) as 1 | 2 | 3 | 4 | 5
    return {
      manualColorHex1: c(0),
      manualColorHex2: c(1),
      manualColorHex3: c(2),
      manualColorHex4: c(3),
      manualColorHex5: c(4),
      manualColorCount: n,
      manualUseTwoColors: stops.length >= 2,
    }
  }
  return null
}

type Snapshot = CardData

/** Persistence schema version. Increment when migrating persisted shape. */
export const PERSIST_SCHEMA_VERSION = 1

/** Design file schema version (string). Used for Save Design / Load Design. */
export const DESIGN_SCHEMA_VERSION = '1.0.0'

/** Serialized design artifact: full store snapshot for save/load. */
export type DesignSnapshot = {
  schemaVersion: string
  cardData: CardData
  settings: SettingsState
  currentLayout: CardLayoutMode
  showTooltips: boolean
  showHologram: boolean
}

export type CardStoreState = {
  /** Must be 1 for current persisted state structure. Used for safe rehydration. */
  schemaVersion: number
  cardData: CardData
  settings: SettingsState

  // Layout taxonomy & debug controls (Module 4.3)
  currentLayout: CardLayoutMode
  showTooltips: boolean
  /** Module 3.7 — authenticity/security mark visibility. */
  showHologram: boolean

  /** Phase 18.1 — export preset / output mode (persisted). */
  exportPresetId: ExportPresetId
  setExportPresetId: (id: ExportPresetId) => void
  /** PNG export: full 1650×2250 vs trim-only 1500×2100 (persisted). */
  exportPngIncludeBleed: boolean
  setExportPngIncludeBleed: (value: boolean) => void

  /**
   * Module 5.3 — increments when `resetCard` runs (New Card / Reset Card). Sidebars reset local UI.
   * Ephemeral; not persisted so refresh always starts from layout defaults + rehydrate rules.
   */
  workspaceInitEpoch: number

  /** Module 4.1 — manual-edit flags; automation/hydration must not set these via user paths. */
  isFieldDirty: FieldDirtyState

  /**
   * Phase 10.1 — derived workflow mode (Context Header / gating spine).
   * Recomputed inside every store `set`; never assign from UI.
   */
  workflowState: WorkflowState
  /** Re-runs Phase 10.1 derivation from current slices (tests / debug). */
  deriveWorkflowState: () => WorkflowState

  /** Module UI-J — Async Status Authority. Ephemeral; not persisted. */
  asyncStatus: Record<AsyncOperationKey, AsyncStatusState>
  setAsyncStatus: (op: AsyncOperationKey, status: AsyncStatus, message?: string | null) => void

// Phase 4.1 – Procedural Color & Stroke Identity (behavioral pass)
autoColorEnabled: boolean
manualColorKey: ManualColorKey
manualColorHex1: string
manualColorHex2: string
manualColorHex3: string
manualColorHex4: string
manualColorHex5: string
/** Module 4.2 — 1–5 manual gradient stops (manual mode). */
manualColorCount: 1 | 2 | 3 | 4 | 5
manualUseTwoColors: boolean
  colorBlendDirection: ColorBlendDirection
setAutoColorEnabled: (enabled: boolean) => void
setManualColorKey: (key: ManualColorKey) => void
setManualColorHex1: (hex: string) => void
setManualColorHex2: (hex: string) => void
setManualColorHex3: (hex: string) => void
setManualColorHex4: (hex: string) => void
setManualColorHex5: (hex: string) => void
setManualColorCount: (count: 1 | 2 | 3 | 4 | 5) => void
setManualUseTwoColors: (enabled: boolean) => void
  setColorBlendDirection: (dir: ColorBlendDirection) => void


  // Phase 3.5 – Mana Symbol Picker UI (UI-only)
  activeInputId: 'manaCost' | 'rulesText' | null
  activeSelectionStart: number
  activeSelectionEnd: number
  manaPopupOpen: boolean
  manaPopupTarget: 'manaCost' | 'rulesText'
  manaPopupPosition: { top: number; left: number }
  registerManaInputFocus: ((target: 'manaCost' | 'rulesText', caret: number) => void) | null


  // Phase 3.1 – Dynamic Font Loader
  fontsLoaded: boolean
  past: Snapshot[]
  future: Snapshot[]
  committed: Snapshot

  setField: <K extends keyof CardData>(key: K, value: CardData[K]) => void
  /** Module 5.1 — merge creative typography for one face field (clamped, sanitized). */
  updateCardTypography: (key: CardTypographyKey, patch: Partial<CardFieldTypography>) => void
  setCardData: (partial: Partial<CardData>) => void
  ingestArtUpload: (file: File) => Promise<void>
  setLayout: (layout: LayoutId) => void
  getActiveLayoutCapabilities: () => ReturnType<typeof getActiveLayoutCapabilitiesFromState>
  setManualArtPlacement: (partial: Pick<Partial<CardData>, 'artZoom' | 'artOffsetX' | 'artOffsetY'>) => void
  refitArtPlacement: () => Promise<void>
  setRestoreSession: (restoreSession: boolean) => void
  setCurrentLayout: (layout: CardLayoutMode) => void
  toggleTooltips: () => void
  setShowHologram: (showHologram: boolean) => void
  setClonedCardImage: (url: string) => void
  clearClonedCardImage: () => void
  setReferenceImage: (url: string) => void
  setReferenceOpacity: (opacity: number) => void
  setReferenceOffset: (x: number, y: number) => void
  clearReferenceImage: () => void


  // Phase 3.5 – Mana Symbol Picker UI (UI-only)
  setActiveInputId: (id: 'manaCost' | 'rulesText' | null) => void
  setActiveSelectionRange: (start: number, end: number) => void
  insertManaSymbol: (symbolKey: string) => number
  openManaPopup: () => void
  closeManaPopup: () => void
  setManaPopupTarget: (target: 'manaCost' | 'rulesText') => void
  setManaPopupPosition: (top: number, left: number) => void
  setRegisterManaInputFocus: (fn: ((target: 'manaCost' | 'rulesText', caret: number) => void) | null) => void

  setFontsLoaded: (loaded: boolean) => void
  /** Transient hover-preview for Outer Border selection (not persisted, not in undo). null = use committed value. */
  outerBorderColorPreview: string | null
  setOuterBorderColorPreview: (value: string | null) => void
  /** Transient hover-preview for Inner Border background selection (not persisted, not in undo). null = use committed value. */
  innerBorderBackgroundPreview: string | null
  setInnerBorderBackgroundPreview: (value: string | null) => void
  /** Transient hover-preview for Panels background pickers (not persisted, not in undo). */
  panelBackgroundPreview: PanelBackgroundPreview | null
  setPanelBackgroundPreview: (preview: PanelBackgroundPreview | null) => void
  /** Transient hover-preview for font family pickers (card canvas only, not persisted). */
  typographyFontPreview: TypographyFontPreview | null
  setTypographyFontPreview: (preview: TypographyFontPreview | null) => void
  // Phase 2.5 – Snapshot Export Engine
  stageExporter: null | (() => Promise<HTMLCanvasElement>)
  registerStageExporter: (fn: null | (() => Promise<HTMLCanvasElement>)) => void
  /** Module 5.3 — high-res (1650×2250) Blob-based PNG export + download. Phase 18.1 respects `exportPresetId` for filename only. */
  exportCardImage: () => Promise<void>

  commitState: () => void
  /** Module 5.3 — full default card, preview-first layout, field dirty cleared; bumps UI epoch. */
  resetCard: () => void
  /** @deprecated Prefer `resetCard`; identical behavior. */
  resetCardData: () => void
  undo: () => void
  redo: () => void

  // Module 3.5 – Design Persistence Authority
  getDesignSnapshot: () => DesignSnapshot
  hydrateFromDesign: (payload: DesignSnapshot) => void

  /** Module 4.2 — apply automation/API data only to fields the user has not manually edited. Never marks dirty. */
  applySystemUpdate: (update: SystemCardDataUpdate) => void

  /** Module 4.2 — Scryfall fuzzy lookup; applies via applySystemUpdate only (respects isFieldDirty). */
  fetchAndApplyScryfallData: (name: string) => Promise<void>
  scryfallSearchStatus: { status: ScryfallFlowStatus; message: string | null }
  scryfallImportStatus: { status: ScryfallFlowStatus; message: string | null }
  scryfallSearchResults: ScryfallPrintCandidate[]
  scryfallChosenPrint: ScryfallPrintCandidate | null
  clearScryfallSearchFlow: () => void
  importScryfallPrintById: (cardId: string, prefetched?: ScryfallCardFields) => Promise<void>
  scryfallCloneSearchStatus: { status: ScryfallFlowStatus; message: string | null }
  scryfallCloneApplyStatus: { status: ScryfallFlowStatus; message: string | null }
  scryfallCloneSearchResults: ScryfallPrintCandidate[]
  scryfallCloneChosenPrint: ScryfallPrintCandidate | null
  clearScryfallCloneFlow: () => void
  applyScryfallCloneById: (cardId: string, prefetched?: ScryfallCardFields) => Promise<void>
  fetchScryfallCloneData: (input: string) => Promise<void>

  /** Phase 12.1 — quick view modal (ephemeral; not persisted). */
  quickViewOpen: boolean
  openQuickView: () => void
  closeQuickView: () => void
}

const MAX_HISTORY = 50

/**
 * Migration entry for loaded designs. Verifies schemaVersion, allows same-version load,
 * placeholder for future version migrations.
 */
export function migrateDesignPayload(raw: unknown): DesignSnapshot | null {
  if (raw == null || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (o.schemaVersion == null || typeof o.schemaVersion !== 'string') return null
  const ver = o.schemaVersion as string
  if (ver === DESIGN_SCHEMA_VERSION) return raw as DesignSnapshot
  // Placeholder: future migrations (e.g. "1.0.1" -> normalize and return)
  return null
}

export const defaultCardData: CardData = {
  name: '',
  secondaryName: '',
  showSecondaryName: false,
  secondaryNameFontSize: 55,
  secondaryNameLightText: true,
  manaCost: '',
  manaSymbolSet: 'default',
  typeLine: '',
  cardText: '',
  power: '',
  toughness: '',
  rarity: 'common',
  flavorText: '',
  filename: 'card',
  filenameSlug: '',
  theme: 'googled',
  showBleed: false,
  showTrim: false,
  showSafeZone: false,
  bleedFillColor: 'auto',
  showPowerToughness: true,
  artImage: '',
  landSecondaryPanelId: '',
  spellTextBoxId: 'white',
  preModernRulesTextBoxId: 'white',
  landFullArtManaCircleKey: 'c',
  layout: { ...DEFAULT_LAYOUT_ID },
  artIntrinsicWidth: 0,
  artIntrinsicHeight: 0,
  artZoom: 1,
  artOffsetX: 0,
  artOffsetY: 0,
  hasManualArtPlacement: false,
  innerBorderEnabled: true,
  innerBorderOpacity: 1.0,
  innerBorderBackground: 'identity',
  outerBorderFrameTexture: '',
  outerBorderFrameTextureOpacity: 1.0,
  // Default to no texture.
  selectedTexture: '',
  textureOpacity: 1.0,
  textureSettings: {
    selection: '',
    opacity: 1.0,
  },
  rulesTextBoxTexture: '',
  rulesTextBoxTextureOpacity: 1.0,
  rulesTextBoxColor: DEFAULT_PANEL_BOX_HEX,
  nameBoxColor: DEFAULT_PANEL_BOX_HEX,
  typeLineBoxColor: DEFAULT_PANEL_BOX_HEX,
  nameBarShape: 'rounded',
  typeBarShape: 'rounded',
  ptBarShape: 'rounded',
  bezierPlateEnabled: true,
  ptBoxColor: DEFAULT_PANEL_BOX_HEX,
  nameBoxGradientEnabled: false,
  nameBoxGradientDirection: 'vertical',
  nameBoxGradientSaturation: 100,
  nameBoxGradientReversed: false,
  typeLineBoxGradientEnabled: false,
  typeLineBoxGradientDirection: 'vertical',
  typeLineBoxGradientSaturation: 100,
  typeLineBoxGradientReversed: false,
  rulesTextBoxGradientEnabled: false,
  rulesTextBoxGradientDirection: 'vertical',
  rulesTextBoxGradientSaturation: 100,
  rulesTextBoxGradientReversed: false,
  ptBoxGradientEnabled: false,
  ptBoxGradientDirection: 'vertical',
  ptBoxGradientSaturation: 100,
  ptBoxGradientReversed: false,
  outerBorderColor: 'black',
  colorIdentity: [],
  setIconImage: '',
  iconScale: 135,
  set: '',
  collector_number: '',
  language: 'EN',
  artist: '',
  copyright: DEFAULT_CARD_COPYRIGHT,
  watermarkPath: 'none',
  watermarkOpacity: 0.14,
  customWatermarkDataUrl: '',
  referenceImage: '',
  referenceOpacity: 0.5,
  referenceOffsetX: 0,
  referenceOffsetY: 0,
  clonedCardImage: '',
  nameTypography: defaultNameTypography(),
  typeTypography: defaultTypeTypography(),
  rulesTypography: defaultRulesTypography(),
  flavorTypography: defaultFlavorTypography(),
  ptTypography: defaultPtTypography(),
  metadataTypography: defaultMetadataTypography(),
  ...DEFAULT_PLANESWALKER_CARD_FIELDS,
}

export const defaultSettings: SettingsState = {
  restoreSession: true,
}

function shallowEqualSnapshot(a: Snapshot, b: Snapshot): boolean {
  // Compare the union of keys so newly-added fields (e.g., artImage/setIconImage)
  // are detected as changes immediately and can be committed as their own undo step.
  const keys = new Set<string>([...Object.keys(a), ...Object.keys(b)])
  for (const k of keys) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((a as any)[k] !== (b as any)[k]) return false
  }
  return true
}


function normalizeSnapshot(s: Snapshot): Snapshot {
  // Ensure stable presence of all CardData keys so undo/redo snapshots and comparisons
  // are not affected by missing optional fields.
  const anyS = s as any
  const legacyTexture = anyS?.textureSettings ?? null

  const selectedTexture =
    typeof anyS?.selectedTexture === 'string'
      ? anyS.selectedTexture
      : typeof legacyTexture?.selection === 'string'
        ? legacyTexture.selection
        : defaultCardData.selectedTexture

  const textureOpacity =
    typeof anyS?.textureOpacity === 'number'
      ? anyS.textureOpacity
      : typeof legacyTexture?.opacity === 'number'
        ? legacyTexture.opacity
        : defaultCardData.textureOpacity

  const filenameSlug =
    typeof anyS?.filenameSlug === 'string' ? anyS.filenameSlug : slugifyCardName(anyS?.name ?? '')

  const colorIdentity = normalizeColorIdentityPips(
    Array.isArray(anyS?.colorIdentity) ? (anyS.colorIdentity as string[]) : defaultCardData.colorIdentity,
  )
  const artIntrinsicWidth =
    typeof anyS?.artIntrinsicWidth === 'number' && Number.isFinite(anyS.artIntrinsicWidth)
      ? Math.max(0, Math.floor(anyS.artIntrinsicWidth))
      : defaultCardData.artIntrinsicWidth
  const artIntrinsicHeight =
    typeof anyS?.artIntrinsicHeight === 'number' && Number.isFinite(anyS.artIntrinsicHeight)
      ? Math.max(0, Math.floor(anyS.artIntrinsicHeight))
      : defaultCardData.artIntrinsicHeight
  const layout = normalizeLayout((anyS?.layout as Partial<LayoutId> | undefined) ?? defaultCardData.layout)

  const hasPerBoxGradientKey =
    'nameBoxGradientEnabled' in anyS ||
    'typeLineBoxGradientEnabled' in anyS ||
    'rulesTextBoxGradientEnabled' in anyS ||
    'ptBoxGradientEnabled' in anyS
  const hasLegacyGradientKey =
    'boxColorGradientEnabled' in anyS ||
    'boxColorGradientDirection' in anyS ||
    'boxColorGradientSaturation' in anyS
  const migrateLegacyBoxGradient = !hasPerBoxGradientKey && hasLegacyGradientKey
  const legacyGradEnabled =
    typeof anyS?.boxColorGradientEnabled === 'boolean'
      ? anyS.boxColorGradientEnabled
      : defaultCardData.nameBoxGradientEnabled
  const legacyGradDir = normalizeBoxColorGradientDirection(anyS?.boxColorGradientDirection)
  const legacyGradSat = normalizeBoxColorGradientSaturation(anyS?.boxColorGradientSaturation)

  return {
    ...defaultCardData,
    ...s,
    selectedTexture,
    textureOpacity,
    textureSettings: {
      selection: selectedTexture,
      opacity: textureOpacity,
    },
    rulesTextBoxTexture:
      typeof anyS?.rulesTextBoxTexture === 'string' ? anyS.rulesTextBoxTexture : defaultCardData.rulesTextBoxTexture,
    rulesTextBoxTextureOpacity:
      typeof anyS?.rulesTextBoxTextureOpacity === 'number' && Number.isFinite(anyS.rulesTextBoxTextureOpacity)
        ? anyS.rulesTextBoxTextureOpacity
        : defaultCardData.rulesTextBoxTextureOpacity,
    rulesTextBoxColor: sanitizePanelBackground(anyS?.rulesTextBoxColor, defaultCardData.rulesTextBoxColor),
    nameBoxColor: sanitizePanelBackground(anyS?.nameBoxColor, defaultCardData.nameBoxColor),
    typeLineBoxColor: sanitizePanelBackground(anyS?.typeLineBoxColor, defaultCardData.typeLineBoxColor),
    nameBarShape: normalizeNameplateBoxShape(anyS?.nameBarShape),
    typeBarShape: normalizeNameplateBoxShape(anyS?.typeBarShape),
    ptBarShape: normalizeNameplateBoxShape(anyS?.ptBarShape),
    bezierPlateEnabled: migrateBezierPlateEnabled(anyS?.bezierPlateEnabled, {
      nameBarShape: anyS?.nameBarShape,
      typeBarShape: anyS?.typeBarShape,
      ptBarShape: anyS?.ptBarShape,
    }),
    ptBoxColor: sanitizePanelBackground(anyS?.ptBoxColor, defaultCardData.ptBoxColor),
    nameBoxGradientEnabled: migrateLegacyBoxGradient
      ? legacyGradEnabled
      : typeof anyS?.nameBoxGradientEnabled === 'boolean'
        ? anyS.nameBoxGradientEnabled
        : defaultCardData.nameBoxGradientEnabled,
    nameBoxGradientDirection: migrateLegacyBoxGradient
      ? legacyGradDir
      : normalizeBoxColorGradientDirection(anyS?.nameBoxGradientDirection),
    nameBoxGradientSaturation: migrateLegacyBoxGradient
      ? legacyGradSat
      : normalizeBoxColorGradientSaturation(anyS?.nameBoxGradientSaturation),
    nameBoxGradientReversed: migrateLegacyBoxGradient
      ? false
      : normalizeBoxGradientReversed(anyS?.nameBoxGradientReversed),
    typeLineBoxGradientEnabled: migrateLegacyBoxGradient
      ? legacyGradEnabled
      : typeof anyS?.typeLineBoxGradientEnabled === 'boolean'
        ? anyS.typeLineBoxGradientEnabled
        : defaultCardData.typeLineBoxGradientEnabled,
    typeLineBoxGradientDirection: migrateLegacyBoxGradient
      ? legacyGradDir
      : normalizeBoxColorGradientDirection(anyS?.typeLineBoxGradientDirection),
    typeLineBoxGradientSaturation: migrateLegacyBoxGradient
      ? legacyGradSat
      : normalizeBoxColorGradientSaturation(anyS?.typeLineBoxGradientSaturation),
    typeLineBoxGradientReversed: migrateLegacyBoxGradient
      ? false
      : normalizeBoxGradientReversed(anyS?.typeLineBoxGradientReversed),
    rulesTextBoxGradientEnabled: migrateLegacyBoxGradient
      ? legacyGradEnabled
      : typeof anyS?.rulesTextBoxGradientEnabled === 'boolean'
        ? anyS.rulesTextBoxGradientEnabled
        : defaultCardData.rulesTextBoxGradientEnabled,
    rulesTextBoxGradientDirection: migrateLegacyBoxGradient
      ? legacyGradDir
      : normalizeBoxColorGradientDirection(anyS?.rulesTextBoxGradientDirection),
    rulesTextBoxGradientSaturation: migrateLegacyBoxGradient
      ? legacyGradSat
      : normalizeBoxColorGradientSaturation(anyS?.rulesTextBoxGradientSaturation),
    rulesTextBoxGradientReversed: migrateLegacyBoxGradient
      ? false
      : normalizeBoxGradientReversed(anyS?.rulesTextBoxGradientReversed),
    ptBoxGradientEnabled: migrateLegacyBoxGradient
      ? legacyGradEnabled
      : typeof anyS?.ptBoxGradientEnabled === 'boolean'
        ? anyS.ptBoxGradientEnabled
        : defaultCardData.ptBoxGradientEnabled,
    ptBoxGradientDirection: migrateLegacyBoxGradient
      ? legacyGradDir
      : normalizeBoxColorGradientDirection(anyS?.ptBoxGradientDirection),
    ptBoxGradientSaturation: migrateLegacyBoxGradient
      ? legacyGradSat
      : normalizeBoxColorGradientSaturation(anyS?.ptBoxGradientSaturation),
    ptBoxGradientReversed: migrateLegacyBoxGradient
      ? false
      : normalizeBoxGradientReversed(anyS?.ptBoxGradientReversed),
    filenameSlug,
    colorIdentity,
    layout,
    landFullArtManaCircleKey: normalizeLandFullArtManaCircleKey(anyS?.landFullArtManaCircleKey),
    spellTextBoxId: normalizeSpellTextBoxId(anyS?.spellTextBoxId),
    preModernRulesTextBoxId: normalizePreModernRulesTextBoxId(anyS?.preModernRulesTextBoxId),
    artIntrinsicWidth,
    artIntrinsicHeight,
    iconScale: resolveSetSymbolBoxPx(anyS?.iconScale ?? defaultCardData.iconScale),
    nameTypography: migrateTypographyColorManual(anyS?.nameTypography, defaultNameTypography()),
    typeTypography: migrateTypographyColorManual(anyS?.typeTypography, defaultTypeTypography()),
    rulesTypography: migrateTypographyColorManual(anyS?.rulesTypography, defaultRulesTypography()),
    flavorTypography: migrateTypographyColorManual(anyS?.flavorTypography, defaultFlavorTypography()),
    ptTypography: migrateTypographyColorManual(anyS?.ptTypography, defaultPtTypography()),
    metadataTypography: migrateTypographyColorManual(anyS?.metadataTypography, defaultMetadataTypography()),
    copyright: normalizeCardCopyright(anyS?.copyright),
    manaSymbolSet: normalizeManaSymbolSetId(anyS?.manaSymbolSet),
    theme: 'googled',
    startingLoyalty: normalizeStartingLoyalty(anyS?.startingLoyalty),
    planeswalkerStaticText: String(anyS?.planeswalkerStaticText ?? defaultCardData.planeswalkerStaticText),
    planeswalkerAbilityCount: normalizePlaneswalkerAbilityCount(
      anyS?.planeswalkerAbilityCount ?? defaultCardData.planeswalkerAbilityCount,
    ),
    planeswalkerAbilities: normalizePlaneswalkerAbilities(
      anyS?.planeswalkerAbilities,
      anyS?.planeswalkerAbilityCount ?? defaultCardData.planeswalkerAbilityCount,
    ),
    showFlavorTextOnCard:
      typeof anyS?.showFlavorTextOnCard === 'boolean'
        ? anyS.showFlavorTextOnCard
        : defaultCardData.showFlavorTextOnCard,
  } as Snapshot
}


function artBoundsChanged(prevLayout: CardLayoutMode, nextLayout: CardLayoutMode): boolean {
  if (prevLayout === nextLayout) return false
  const prev = getLegacyLayoutArtRect(prevLayout)
  const next = getLegacyLayoutArtRect(nextLayout)
  return prev.x !== next.x || prev.y !== next.y || prev.width !== next.width || prev.height !== next.height
}

function isWorkflowBrowsingBaseline(state: CardStoreState): boolean {
  const baseline: CardData = { ...defaultCardData }
  if (!shallowEqualSnapshot(normalizeSnapshot(state.cardData), normalizeSnapshot(baseline))) {
    return false
  }
  for (const k of FIELD_DIRTY_KEYS) {
    if (state.isFieldDirty[k]) return false
  }
  return true
}

/** Phase 16.2 — snapshot for workflow analysis / validation (keeps parity with computeWorkflowStateForStore). */
export function getWorkflowDerivationSnapshot(state: CardStoreState): WorkflowDerivationInput {
  return {
    isBrowsingBaseline: isWorkflowBrowsingBaseline(state),
    name: state.cardData.name,
    typeLine: state.cardData.typeLine,
    fontsLoaded: state.fontsLoaded,
    stageExporter: state.stageExporter,
    currentLayout: state.currentLayout,
    clonedCardImage: state.cardData.clonedCardImage,
  }
}

function computeWorkflowStateForStore(state: CardStoreState): WorkflowState {
  return deriveWorkflowStatePure(getWorkflowDerivationSnapshot(state))
}

export const useCardStore = create<CardStoreState>()(
  persist(
    (setBase, get) => {
      const logWorkflowTransition = (prev: WorkflowState | undefined, next: WorkflowState) => {
        if (!import.meta.env.DEV || prev === next) return
        // eslint-disable-next-line no-console
        console.debug(`[workflowState] ${String(prev)} → ${next}`)
      }

      const set: typeof setBase = (partial, replace) => {
        return setBase((state) => {
          if (replace) {
            const next =
              typeof partial === 'function'
                ? (partial as (s: CardStoreState) => CardStoreState)(state)
                : (partial as CardStoreState)
            const workflowState = computeWorkflowStateForStore(next)
            logWorkflowTransition(state.workflowState, workflowState)
            return { ...next, workflowState }
          }
          if (typeof partial === 'function') {
            const patch = partial(state)
            if (patch === state) return state
            const merged = { ...state, ...patch } as CardStoreState
            const workflowState = computeWorkflowStateForStore(merged)
            logWorkflowTransition(state.workflowState, workflowState)
            return { ...patch, workflowState }
          }
          const merged = { ...state, ...partial } as CardStoreState
          const workflowState = computeWorkflowStateForStore(merged)
          logWorkflowTransition(state.workflowState, workflowState)
          return { ...partial, workflowState }
        }, replace)
      }

      return {
      schemaVersion: PERSIST_SCHEMA_VERSION,
      cardData: defaultCardData,
      settings: defaultSettings,

      currentLayout: 'Standard',
      showTooltips: false,
      showHologram: true,
      exportPresetId: DEFAULT_EXPORT_PRESET_ID,
      setExportPresetId: (id) => set({ exportPresetId: normalizeExportPresetId(id) }),
      exportPngIncludeBleed: true,
      setExportPngIncludeBleed: (value) => set({ exportPngIncludeBleed: value }),
      workspaceInitEpoch: 0,
      quickViewOpen: false,
      isFieldDirty: createInitialFieldDirty(),
      workflowState: 'BROWSING',
      deriveWorkflowState: () => computeWorkflowStateForStore(get()),

      asyncStatus: {
        artUpload: { status: 'idle', message: null },
        setIconUpload: { status: 'idle', message: null },
        designLoad: { status: 'idle', message: null },
        export: { status: 'idle', message: null },
        scryfallFetch: { status: 'idle', message: null },
      },
      setAsyncStatus: (op, status, message = null) => {
        set((state) => ({
          asyncStatus: {
            ...state.asyncStatus,
            [op]: { status, message },
          },
        }))
      },
      scryfallSearchStatus: { status: 'idle', message: null },
      scryfallImportStatus: { status: 'idle', message: null },
      scryfallSearchResults: [],
      scryfallChosenPrint: null,
      scryfallCloneSearchStatus: { status: 'idle', message: null },
      scryfallCloneApplyStatus: { status: 'idle', message: null },
      scryfallCloneSearchResults: [],
      scryfallCloneChosenPrint: null,
      clearScryfallSearchFlow: () =>
        set(() => ({
          scryfallSearchStatus: { status: 'idle', message: null },
          scryfallImportStatus: { status: 'idle', message: null },
          scryfallSearchResults: [],
          scryfallChosenPrint: null,
        })),
      clearScryfallCloneFlow: () =>
        set(() => ({
          scryfallCloneSearchStatus: { status: 'idle', message: null },
          scryfallCloneApplyStatus: { status: 'idle', message: null },
          scryfallCloneSearchResults: [],
          scryfallCloneChosenPrint: null,
        })),

// Phase 4.1 – Procedural Color & Stroke Identity (behavioral pass)
autoColorEnabled: true,
manualColorKey: 'none',




manualColorHex1: '',
manualColorHex2: '',
manualColorHex3: '',
manualColorHex4: '',
manualColorHex5: '',
manualColorCount: 1,
manualUseTwoColors: false,
colorBlendDirection: 'vertical',
      // Phase 3.5 – Mana Symbol Picker UI (UI-only)
      activeInputId: null,
      activeSelectionStart: 0,
      activeSelectionEnd: 0,
      manaPopupOpen: false,
      manaPopupTarget: 'manaCost',
      manaPopupPosition: { top: 150, left: 100 },
      registerManaInputFocus: null,

      fontsLoaded: false,

      openQuickView: () => set({ quickViewOpen: true }),

      closeQuickView: () => set({ quickViewOpen: false }),

      outerBorderColorPreview: null,
      setOuterBorderColorPreview: (value) => set({ outerBorderColorPreview: value }),

      innerBorderBackgroundPreview: null,
      setInnerBorderBackgroundPreview: (value) => set({ innerBorderBackgroundPreview: value }),

      panelBackgroundPreview: null,
      setPanelBackgroundPreview: (preview) => set({ panelBackgroundPreview: preview }),

      typographyFontPreview: null,
      setTypographyFontPreview: (preview) => set({ typographyFontPreview: preview }),

      stageExporter: null,
      registerStageExporter: (fn) => set({ stageExporter: fn }),
      exportCardImage: async () => {
        const s = get()
        if (!s.stageExporter) return
        s.setAsyncStatus('export', 'loading', null)
        try {
          const blob = await generateHighResExport(s.stageExporter, {
            includeBleed: s.exportPngIncludeBleed,
          })
          const baseName = resolvePngFilename(
            s.cardData.filename,
            s.cardData.filenameSlug,
            s.isFieldDirty.filename,
            'card',
          )
          let outName = applyExportPresetToPngFilename(baseName, getExportPreset(s.exportPresetId))
          if (!s.exportPngIncludeBleed) {
            outName = applyTrimCropToPngFilename(outName)
          }
          downloadBlob(blob, outName)
          s.setAsyncStatus('export', 'success', null)
        } catch {
          s.setAsyncStatus('export', 'error', 'Export failed')
        }
        window.setTimeout(() => get().setAsyncStatus('export', 'idle'), 2000)
      },

      past: [],
      future: [],
      committed: defaultCardData,

      setField: (key, value) => {
        set((state) => {
          const prevSnap = state.cardData
          let next: any = { ...prevSnap, [key]: value }
          if (key === 'name') {
            if (!state.isFieldDirty.filename) {
              next.filenameSlug = slugifyCardName(String(value ?? ''))
            }
          }
          // Keep `cardText` raw during manual typing to preserve caret stability.
          // (Explicit symbol insertion and system updates can still write normalized tokens.)
          if (key === 'manaCost') next.manaCost = normalizeStoreManaCost(next.manaCost)
          if (key === 'set') next.set = String(value ?? '').trim().toLowerCase()
          if (key === 'watermarkPath') {
            const v = String(value ?? '')
            next.watermarkPath = isWatermarkPathKey(v) ? v : 'none'
          }
          if (key === 'watermarkOpacity') {
            const o = Number(value)
            next.watermarkOpacity = Number.isFinite(o)
              ? Math.max(0, Math.min(1, o))
              : prevSnap.watermarkOpacity
          }
          if (key === 'rulesTextBoxTextureOpacity') {
            const o = Number(value)
            next.rulesTextBoxTextureOpacity = Number.isFinite(o)
              ? Math.max(0, Math.min(1, o))
              : prevSnap.rulesTextBoxTextureOpacity
          }
          if (key === 'nameBoxGradientEnabled') next.nameBoxGradientEnabled = Boolean(value)
          if (key === 'typeLineBoxGradientEnabled') next.typeLineBoxGradientEnabled = Boolean(value)
          if (key === 'rulesTextBoxGradientEnabled') next.rulesTextBoxGradientEnabled = Boolean(value)
          if (key === 'ptBoxGradientEnabled') next.ptBoxGradientEnabled = Boolean(value)
          if (key === 'nameBoxGradientDirection') {
            next.nameBoxGradientDirection = normalizeBoxColorGradientDirection(value)
          }
          if (key === 'typeLineBoxGradientDirection') {
            next.typeLineBoxGradientDirection = normalizeBoxColorGradientDirection(value)
          }
          if (key === 'rulesTextBoxGradientDirection') {
            next.rulesTextBoxGradientDirection = normalizeBoxColorGradientDirection(value)
          }
          if (key === 'ptBoxGradientDirection') {
            next.ptBoxGradientDirection = normalizeBoxColorGradientDirection(value)
          }
          if (key === 'nameBoxGradientSaturation') {
            next.nameBoxGradientSaturation = normalizeBoxColorGradientSaturation(value)
          }
          if (key === 'typeLineBoxGradientSaturation') {
            next.typeLineBoxGradientSaturation = normalizeBoxColorGradientSaturation(value)
          }
          if (key === 'rulesTextBoxGradientSaturation') {
            next.rulesTextBoxGradientSaturation = normalizeBoxColorGradientSaturation(value)
          }
          if (key === 'ptBoxGradientSaturation') {
            next.ptBoxGradientSaturation = normalizeBoxColorGradientSaturation(value)
          }
          if (key === 'nameBoxGradientReversed') next.nameBoxGradientReversed = normalizeBoxGradientReversed(value)
          if (key === 'typeLineBoxGradientReversed') {
            next.typeLineBoxGradientReversed = normalizeBoxGradientReversed(value)
          }
          if (key === 'rulesTextBoxGradientReversed') {
            next.rulesTextBoxGradientReversed = normalizeBoxGradientReversed(value)
          }
          if (key === 'ptBoxGradientReversed') next.ptBoxGradientReversed = normalizeBoxGradientReversed(value)
          if (key === 'nameBarShape') {
            next.nameBarShape = normalizeNameplateBoxShape(value)
          }
          if (key === 'typeBarShape') {
            next.typeBarShape = normalizeNameplateBoxShape(value)
          }
          if (key === 'ptBarShape') {
            next.ptBarShape = normalizeNameplateBoxShape(value)
          }
          if (key === 'bezierPlateEnabled') {
            next.bezierPlateEnabled = Boolean(value)
          }
          if (
            key === 'rulesTextBoxColor' ||
            key === 'nameBoxColor' ||
            key === 'typeLineBoxColor' ||
            key === 'ptBoxColor'
          ) {
            const raw = String(value ?? '').trim()
            const def = defaultCardData[key]
            if (raw === '') {
              next[key] = def
            } else if (sanitizePanelBackground(raw, '') === raw) {
              next[key] = raw
            } else {
              let v = raw.startsWith('#') ? raw : `#${raw}`
              if (v.length > 7) v = v.slice(0, 7)
              next[key] = /^#[0-9a-f]*$/i.test(v) && v.length >= 1 ? v : prevSnap[key]
            }
          }
          if (key === 'customWatermarkDataUrl') {
            next.customWatermarkDataUrl = String(value ?? '')
          }
          if (key === 'iconScale') {
            next.iconScale = resolveSetSymbolBoxPx(value)
          }
          if (key === 'artImage') {
            next.artImage = String(value ?? '')
            next.artIntrinsicWidth = 0
            next.artIntrinsicHeight = 0
            next.artZoom = 1
            next.artOffsetX = 0
            next.artOffsetY = 0
            next.hasManualArtPlacement = false
          }
          if (key === 'artZoom' || key === 'artOffsetX' || key === 'artOffsetY') {
            next.hasManualArtPlacement = true
          }
          if (key === 'selectedTexture') {
            next.textureSettings = {
              selection: String(value ?? defaultCardData.selectedTexture),
              opacity: typeof next.textureOpacity === 'number' ? next.textureOpacity : defaultCardData.textureOpacity,
            }
          }
          if (key === 'textureOpacity') {
            next.textureSettings = {
              selection: typeof next.selectedTexture === 'string' ? next.selectedTexture : defaultCardData.selectedTexture,
              opacity: Number(value ?? defaultCardData.textureOpacity),
            }
          }
          if (key === 'colorIdentity') {
            next.colorIdentity = normalizeColorIdentityPips((value as ColorIdentityPip[]) ?? [])
          }
          if (key === 'landFullArtManaCircleKey') {
            next.landFullArtManaCircleKey = normalizeLandFullArtManaCircleKey(value)
          }
          if (
            key === 'startingLoyalty' ||
            key === 'planeswalkerStaticText' ||
            key === 'planeswalkerAbilityCount' ||
            key === 'planeswalkerAbilities' ||
            key === 'showFlavorTextOnCard'
          ) {
            if (key === 'startingLoyalty') next.startingLoyalty = normalizeStartingLoyalty(value)
            if (key === 'planeswalkerStaticText') next.planeswalkerStaticText = String(value ?? '')
            if (key === 'showFlavorTextOnCard') next.showFlavorTextOnCard = Boolean(value)
            if (key === 'planeswalkerAbilityCount' || key === 'planeswalkerAbilities') {
              if (key === 'planeswalkerAbilityCount') {
                next.planeswalkerAbilityCount = normalizePlaneswalkerAbilityCount(value)
              }
              if (key === 'planeswalkerAbilities') {
                next.planeswalkerAbilities = normalizePlaneswalkerAbilities(
                  value,
                  next.planeswalkerAbilityCount,
                )
              }
            }
            next = applyPlaneswalkerStructuredSync(next)
          }

          const dirtyKey = CARD_KEY_TO_DIRTY_KEY[key]
          let isFieldDirty = state.isFieldDirty
          if (dirtyKey) {
            const prevVal = prevSnap[key]
            const newVal = next[key] as CardData[typeof key]
            if (!fieldValuesEffectivelyEqual(key, prevVal, newVal)) {
              isFieldDirty = { ...state.isFieldDirty, [dirtyKey]: true }
            }
          }

          let out: { cardData: typeof next; isFieldDirty: typeof isFieldDirty } & {
            manualColorHex1?: string
            manualColorHex2?: string
            manualColorHex3?: string
            manualColorHex4?: string
            manualColorHex5?: string
            manualColorCount?: 1 | 2 | 3 | 4 | 5
            manualUseTwoColors?: boolean
          } = { cardData: next, isFieldDirty }
          if (
            (key === 'colorIdentity' ||
              key === 'typeLine' ||
              key === 'name' ||
              key === 'manaCost') &&
            state.autoColorEnabled
          ) {
            const colorPatch = syncColorIdentity({
              autoColorEnabled: state.autoColorEnabled,
              cardData: {
                typeLine: next.typeLine,
                colorIdentity: next.colorIdentity,
                name: next.name,
                manaCost: next.manaCost,
              },
              manualColorKey: state.manualColorKey,
              manualColorHex1: state.manualColorHex1,
              manualColorHex2: state.manualColorHex2,
              manualColorHex3: state.manualColorHex3,
              manualColorHex4: state.manualColorHex4,
              manualColorHex5: state.manualColorHex5,
              manualColorCount: state.manualColorCount,
            })
            if (colorPatch) out = { ...out, ...colorPatch }
          }
          return out
        })
      },

      updateCardTypography: (key, patch) => {
        set((state) => {
          const fallback =
            key === 'nameTypography'
              ? defaultNameTypography()
              : key === 'typeTypography'
                ? defaultTypeTypography()
                : key === 'rulesTypography'
                  ? defaultRulesTypography()
                  : key === 'flavorTypography'
                    ? defaultFlavorTypography()
                    : key === 'ptTypography'
                      ? defaultPtTypography()
                      : defaultMetadataTypography()
          const cur = state.cardData[key]
          const merged: CardFieldTypography = { ...sanitizeCardFieldTypography(cur, fallback), ...patch }
          const sanitized = sanitizeCardFieldTypography(merged, fallback)
          return {
            cardData: {
              ...state.cardData,
              [key]: sanitized,
            },
          }
        })
      },

      applySystemUpdate: (update) => {
        let shouldRefitArt = false
        set((state) => {
          const result = applySystemUpdateToCardData(state.cardData, state.isFieldDirty, update)
          if (!result.changed) return state
          shouldRefitArt = result.shouldRefitArt
          return { cardData: result.cardData }
        })
        if (shouldRefitArt) void get().refitArtPlacement()
      },

      importScryfallPrintById: async (cardId, prefetched) => {
        const id = String(cardId ?? '').trim()
        if (!id) {
          set(() => ({ scryfallImportStatus: { status: 'failure', message: 'Missing print id' } }))
          return
        }
        set((state) => ({
          scryfallChosenPrint: state.scryfallSearchResults.find((p) => p.id === id) ?? state.scryfallChosenPrint,
        }))
        get().setAsyncStatus('scryfallFetch', 'loading', null)
        set(() => ({ scryfallImportStatus: { status: 'loading', message: null } }))
        try {
          const data = prefetched ?? (await fetchScryfallCardById(id))
          const mapped = buildScryfallImportMappedUpdate(data, scryfallFieldsToSystemUpdate(data))
          const pwExtras = buildScryfallPlaneswalkerExtras(data)

          if (mapped.artImage) {
            await loadSharedImage(String(mapped.artImage))
          }

          let shouldRefitArt = false
          set((state) => {
            const dirty = nextFieldDirtyAfterScryfallMappedClear(state.isFieldDirty, mapped)
            const normalizedLayout = normalizeRequestedLayoutSwitch(state.cardData.layout, data.inferred_layout)
            let cardData: CardData = {
              ...state.cardData,
              layout: normalizedLayout,
              ...(normalizedLayout.family === 'land' || normalizedLayout.family === 'planeswalker'
                ? { showPowerToughness: false }
                : null),
            }

            const systemResult = applySystemUpdateToCardData(cardData, dirty, mapped)
            cardData = systemResult.cardData
            shouldRefitArt = systemResult.shouldRefitArt

            if (pwExtras) {
              cardData = applyPlaneswalkerStructuredSync({ ...cardData, ...pwExtras })
            }

            if (!dirty.manaCost) {
              const m = normalizeStoreManaCost(cardData.manaCost)
              if (m !== cardData.manaCost) cardData = { ...cardData, manaCost: m }
            }
            if (!dirty.cardText) {
              const t = normalizeStoreRulesText(cardData.cardText)
              if (t !== cardData.cardText) cardData = { ...cardData, cardText: t }
            }

            const currentLayout = layoutToLegacyMode(normalizedLayout)
            const current = normalizeSnapshot(cardData)
            const committed = normalizeSnapshot(state.committed)
            let past = state.past
            let committedNext = state.committed
            let future = state.future
            if (!shallowEqualSnapshot(committed, current)) {
              past = [...state.past, { ...committed }]
              if (past.length > MAX_HISTORY) past = past.slice(past.length - MAX_HISTORY)
              committedNext = { ...current }
              future = []
            }

            const colorPatch = syncColorIdentity({
              autoColorEnabled: state.autoColorEnabled,
              cardData: {
                typeLine: cardData.typeLine,
                colorIdentity: cardData.colorIdentity,
                name: cardData.name,
                manaCost: cardData.manaCost,
              },
              manualColorKey: state.manualColorKey,
              manualColorHex1: state.manualColorHex1,
              manualColorHex2: state.manualColorHex2,
              manualColorHex3: state.manualColorHex3,
              manualColorHex4: state.manualColorHex4,
              manualColorHex5: state.manualColorHex5,
              manualColorCount: state.manualColorCount,
            })

            return {
              cardData,
              currentLayout,
              isFieldDirty: dirty,
              past,
              future,
              committed: committedNext,
              scryfallImportStatus: { status: 'success', message: null },
              ...(colorPatch ?? {}),
            }
          })

          if (shouldRefitArt) await get().refitArtPlacement()

          get().setAsyncStatus('scryfallFetch', 'success', null)
          window.setTimeout(() => {
            if (get().scryfallImportStatus.status === 'success') {
              set(() => ({ scryfallImportStatus: { status: 'idle', message: null } }))
            }
          }, 2000)
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Scryfall import failed'
          set(() => ({ scryfallImportStatus: { status: 'failure', message: msg } }))
          get().setAsyncStatus('scryfallFetch', 'error', msg)
        }
        window.setTimeout(() => get().setAsyncStatus('scryfallFetch', 'idle'), 2000)
      },

      applyScryfallCloneById: async (cardId, prefetched) => {
        const id = String(cardId ?? '').trim()
        if (!id) {
          set(() => ({ scryfallCloneApplyStatus: { status: 'failure', message: 'Missing print id' } }))
          return
        }
        set((state) => ({
          scryfallCloneChosenPrint:
            state.scryfallCloneSearchResults.find((p) => p.id === id) ?? state.scryfallCloneChosenPrint,
          scryfallCloneApplyStatus: { status: 'loading', message: null },
        }))
        try {
          const data = prefetched ?? (await fetchScryfallCardById(id))
          const png = String(data.png_uri ?? '').trim()
          if (!png) throw new Error('Selected print has no cloneable PNG image')

          const mapped: SystemCardDataUpdate = { ...scryfallFieldsToSystemUpdate(data) }
          // Full-card PNG is the clone overlay; do not replace editor art with art crop (import path does).
          delete mapped.artImage
          if (!scryfallTypeLineSupportsPT(data.type_line)) {
            mapped.power = ''
            mapped.toughness = ''
            mapped.showPowerToughness = false
          } else {
            mapped.showPowerToughness = true
          }
          get().setLayout(data.inferred_layout)
          set((state) => ({
            isFieldDirty: nextFieldDirtyAfterScryfallMappedClear(state.isFieldDirty, mapped),
          }))
          get().applySystemUpdate(mapped)
          set((state) => {
            const d = state.cardData
            const patch: Partial<CardData> = {}
            if (!state.isFieldDirty.manaCost) {
              const m = normalizeStoreManaCost(d.manaCost)
              if (m !== d.manaCost) patch.manaCost = m
            }
            if (!state.isFieldDirty.cardText) {
              const t = normalizeStoreRulesText(d.cardText)
              if (t !== d.cardText) patch.cardText = t
            }
            if (Object.keys(patch).length === 0) return state
            return { cardData: { ...d, ...patch } }
          })
          get().setClonedCardImage(png)
          get().commitState()
          const after = get()
          const colorPatch = syncColorIdentity({
            autoColorEnabled: after.autoColorEnabled,
            cardData: {
              typeLine: after.cardData.typeLine,
              colorIdentity: after.cardData.colorIdentity,
              name: after.cardData.name,
              manaCost: after.cardData.manaCost,
            },
            manualColorKey: after.manualColorKey,
            manualColorHex1: after.manualColorHex1,
            manualColorHex2: after.manualColorHex2,
            manualColorHex3: after.manualColorHex3,
            manualColorHex4: after.manualColorHex4,
            manualColorHex5: after.manualColorHex5,
            manualColorCount: after.manualColorCount,
          })
          if (colorPatch) set(() => colorPatch)

          set(() => ({ scryfallCloneApplyStatus: { status: 'success', message: null } }))
          window.setTimeout(() => {
            if (get().scryfallCloneApplyStatus.status === 'success') {
              set(() => ({ scryfallCloneApplyStatus: { status: 'idle', message: null } }))
            }
          }, 2000)
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Scryfall clone failed'
          set(() => ({ scryfallCloneApplyStatus: { status: 'failure', message: msg } }))
        }
      },

      fetchScryfallCloneData: async (input) => {
        const trimmed = String(input ?? '').trim()
        if (!trimmed) {
          set(() => ({
            scryfallCloneSearchStatus: {
              status: 'failure',
              message: 'Enter a card name, Scryfall URL, or set/collector',
            },
          }))
          return
        }

        const route = routeScryfallInput(trimmed)
        if (route.kind === 'url' || route.kind === 'setCollector') {
          const setCode = route.set ?? ''
          const collector = route.collector ?? ''
          set(() => ({
            scryfallCloneSearchResults: [],
            scryfallCloneChosenPrint: null,
            scryfallCloneSearchStatus: { status: 'success', message: null },
            scryfallCloneApplyStatus: { status: 'loading', message: null },
          }))
          try {
            const data = await fetchScryfallCardBySetCollector(setCode, collector)
            if (!data.id) throw new Error('Exact print lookup did not return an id')
            await get().applyScryfallCloneById(data.id, data)
          } catch (e) {
            const msg = e instanceof Error ? e.message : 'Exact print clone failed'
            set(() => ({ scryfallCloneApplyStatus: { status: 'failure', message: msg } }))
          }
          return
        }

        set(() => ({
          scryfallCloneSearchStatus: { status: 'loading', message: null },
          scryfallCloneApplyStatus: { status: 'idle', message: null },
          scryfallCloneSearchResults: [],
          scryfallCloneChosenPrint: null,
        }))
        try {
          const prints = await searchScryfallPrintsByName(trimmed)
          if (prints.length === 0) throw new Error('No matching prints found')
          if (prints.length === 1) {
            const only = prints[0]
            set(() => ({
              scryfallCloneSearchResults: prints,
              scryfallCloneChosenPrint: only,
              scryfallCloneSearchStatus: { status: 'success', message: null },
            }))
            await get().applyScryfallCloneById(only.id)
            return
          }
          set(() => ({
            scryfallCloneSearchResults: prints,
            scryfallCloneChosenPrint: null,
            scryfallCloneSearchStatus: {
              status: 'success',
              message: `${prints.length} prints found. Select one to clone.`,
            },
          }))
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Scryfall clone search failed'
          set(() => ({
            scryfallCloneSearchStatus: { status: 'failure', message: msg },
            scryfallCloneSearchResults: [],
            scryfallCloneChosenPrint: null,
          }))
        }
      },

      fetchAndApplyScryfallData: async (input) => {
        const trimmed = String(input ?? '').trim()
        if (!trimmed) {
          get().setAsyncStatus('scryfallFetch', 'error', 'Enter a card name, Scryfall URL, or set/collector')
          set(() => ({
            scryfallSearchStatus: { status: 'failure', message: 'Enter a card name, Scryfall URL, or set/collector' },
          }))
          window.setTimeout(() => get().setAsyncStatus('scryfallFetch', 'idle'), 2000)
          return
        }
        const route = routeScryfallInput(trimmed)
        if (route.kind === 'url' || route.kind === 'setCollector') {
          const setCode = route.set ?? ''
          const collector = route.collector ?? ''
          get().setAsyncStatus('scryfallFetch', 'loading', null)
          set(() => ({
            scryfallSearchResults: [],
            scryfallChosenPrint: null,
            scryfallSearchStatus: { status: 'success', message: null },
            scryfallImportStatus: { status: 'loading', message: null },
          }))
          try {
            const data = await fetchScryfallCardBySetCollector(setCode, collector)
            if (data.id) {
              await get().importScryfallPrintById(data.id, data)
              return
            }
            throw new Error('Exact print lookup did not return an id')
          } catch (e) {
            const msg = e instanceof Error ? e.message : 'Exact print import failed'
            set(() => ({ scryfallImportStatus: { status: 'failure', message: msg } }))
            get().setAsyncStatus('scryfallFetch', 'error', msg)
            window.setTimeout(() => get().setAsyncStatus('scryfallFetch', 'idle'), 2000)
          }
          return
        }

        get().setAsyncStatus('scryfallFetch', 'loading', null)
        set(() => ({
          scryfallSearchStatus: { status: 'loading', message: null },
          scryfallImportStatus: { status: 'idle', message: null },
          scryfallSearchResults: [],
          scryfallChosenPrint: null,
        }))
        try {
          const prints = await searchScryfallPrintsByName(trimmed)
          if (prints.length === 0) {
            throw new Error('No matching prints found')
          }
          if (prints.length === 1) {
            const only = prints[0]
            set(() => ({
              scryfallSearchResults: prints,
              scryfallChosenPrint: only,
              scryfallSearchStatus: { status: 'success', message: null },
            }))
            await get().importScryfallPrintById(only.id)
            return
          }
          set(() => ({
            scryfallSearchResults: prints,
            scryfallChosenPrint: null,
            scryfallSearchStatus: { status: 'success', message: `${prints.length} prints found. Select one to import.` },
          }))
          get().setAsyncStatus('scryfallFetch', 'idle', null)
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Scryfall search failed'
          set(() => ({
            scryfallSearchStatus: { status: 'failure', message: msg },
            scryfallSearchResults: [],
            scryfallChosenPrint: null,
          }))
          get().setAsyncStatus('scryfallFetch', 'error', msg)
          window.setTimeout(() => get().setAsyncStatus('scryfallFetch', 'idle'), 2000)
        }
      },

      setCardData: (partial) => {
        set((state) => {
          const merged: any = {
            ...state.cardData,
            ...partial,
          }
          merged.layout = normalizeLayout(merged.layout)

          const selectedTexture =
            typeof merged.selectedTexture === 'string'
              ? merged.selectedTexture
              : typeof merged.textureSettings?.selection === 'string'
                ? merged.textureSettings.selection
                : defaultCardData.selectedTexture

          const textureOpacity =
            typeof merged.textureOpacity === 'number'
              ? merged.textureOpacity
              : typeof merged.textureSettings?.opacity === 'number'
                ? merged.textureSettings.opacity
                : defaultCardData.textureOpacity

          merged.selectedTexture = selectedTexture
          merged.textureOpacity = textureOpacity
          merged.textureSettings = { selection: selectedTexture, opacity: textureOpacity }
          merged.nameBarShape = normalizeNameplateBoxShape(merged.nameBarShape)
          merged.typeBarShape = normalizeNameplateBoxShape(merged.typeBarShape)
          merged.ptBarShape = normalizeNameplateBoxShape(merged.ptBarShape)
          merged.bezierPlateEnabled = migrateBezierPlateEnabled(merged.bezierPlateEnabled, {
            nameBarShape: merged.nameBarShape,
            typeBarShape: merged.typeBarShape,
            ptBarShape: merged.ptBarShape,
          })
          merged.nameBoxGradientEnabled = Boolean(merged.nameBoxGradientEnabled)
          merged.typeLineBoxGradientEnabled = Boolean(merged.typeLineBoxGradientEnabled)
          merged.rulesTextBoxGradientEnabled = Boolean(merged.rulesTextBoxGradientEnabled)
          merged.ptBoxGradientEnabled = Boolean(merged.ptBoxGradientEnabled)
          merged.nameBoxGradientDirection = normalizeBoxColorGradientDirection(merged.nameBoxGradientDirection)
          merged.typeLineBoxGradientDirection = normalizeBoxColorGradientDirection(
            merged.typeLineBoxGradientDirection,
          )
          merged.rulesTextBoxGradientDirection = normalizeBoxColorGradientDirection(
            merged.rulesTextBoxGradientDirection,
          )
          merged.ptBoxGradientDirection = normalizeBoxColorGradientDirection(merged.ptBoxGradientDirection)
          merged.nameBoxGradientSaturation = normalizeBoxColorGradientSaturation(merged.nameBoxGradientSaturation)
          merged.typeLineBoxGradientSaturation = normalizeBoxColorGradientSaturation(
            merged.typeLineBoxGradientSaturation,
          )
          merged.rulesTextBoxGradientSaturation = normalizeBoxColorGradientSaturation(
            merged.rulesTextBoxGradientSaturation,
          )
          merged.ptBoxGradientSaturation = normalizeBoxColorGradientSaturation(merged.ptBoxGradientSaturation)
          merged.nameBoxGradientReversed = normalizeBoxGradientReversed(merged.nameBoxGradientReversed)
          merged.typeLineBoxGradientReversed = normalizeBoxGradientReversed(merged.typeLineBoxGradientReversed)
          merged.rulesTextBoxGradientReversed = normalizeBoxGradientReversed(merged.rulesTextBoxGradientReversed)
          merged.ptBoxGradientReversed = normalizeBoxGradientReversed(merged.ptBoxGradientReversed)

          return { cardData: merged }
        })
      },

      setLayout: (layout) => {
        const current = get().cardData.layout
        const normalized = normalizeRequestedLayoutSwitch(current, layout)
        set((state) => ({
          cardData: {
            ...state.cardData,
            layout: normalized,
            ...(normalized.family === 'land' || normalized.family === 'planeswalker'
              ? { showPowerToughness: false }
              : null),
          },
          currentLayout: layoutToLegacyMode(normalized),
        }))
      },

      getActiveLayoutCapabilities: () => {
        const state = get()
        return getActiveLayoutCapabilitiesFromState({
          currentLayout: state.currentLayout,
          cardData: { layout: state.cardData.layout },
        })
      },

      ingestArtUpload: async (file) => {
        const s0 = get()
        s0.setAsyncStatus('artUpload', 'loading', null)
        try {
          const processed = await processUploadedImage(file)
          set((state) => ({
            cardData: {
              ...state.cardData,
              artImage: processed.normalizedDataUrl,
              artIntrinsicWidth: processed.intrinsicWidth,
              artIntrinsicHeight: processed.intrinsicHeight,
              artZoom: 1,
              artOffsetX: 0,
              artOffsetY: 0,
              hasManualArtPlacement: false,
            },
          }))
          await get().refitArtPlacement()
          get().setAsyncStatus('artUpload', 'success', null)
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to process uploaded image'
          get().setAsyncStatus('artUpload', 'error', message)
          throw error
        } finally {
          window.setTimeout(() => get().setAsyncStatus('artUpload', 'idle'), 2000)
        }
      },

      setManualArtPlacement: (partial) => {
        set((state) => {
          const nextZoom =
            partial.artZoom == null
              ? state.cardData.artZoom
              : Math.min(4, Math.max(1, Number(partial.artZoom)))
          return {
            cardData: {
              ...state.cardData,
              ...partial,
              artZoom: nextZoom,
              hasManualArtPlacement: true,
            },
          }
        })
      },

      refitArtPlacement: async () => {
        const state = get()
        const src = String(state.cardData.artImage ?? '').trim()
        if (!src) {
          set((s) => ({
            cardData: {
              ...s.cardData,
              artIntrinsicWidth: 0,
              artIntrinsicHeight: 0,
              artZoom: 1,
              artOffsetX: 0,
              artOffsetY: 0,
              hasManualArtPlacement: false,
            },
          }))
          return
        }

        let dims = {
          width: Math.floor(Number(state.cardData.artIntrinsicWidth) || 0),
          height: Math.floor(Number(state.cardData.artIntrinsicHeight) || 0),
        }
        if (dims.width <= 0 || dims.height <= 0) {
          const loaded = await loadSharedImage(src)
          if (!loaded) return
          dims = { width: loaded.width, height: loaded.height }
        }

        const now = get()
        if (String(now.cardData.artImage ?? '').trim() !== src) return

        const bounds = getActiveLayoutArtRectFromState({
          currentLayout: now.currentLayout,
          cardData: { layout: now.cardData.layout },
        })
        const defaults = computeDefaultArtPlacement({
          imageWidth: dims.width,
          imageHeight: dims.height,
          bounds,
        })
        const clamped = clampArtPlacementOffsets({
          imageWidth: dims.width,
          imageHeight: dims.height,
          bounds,
          artZoom: defaults.artZoom,
          artOffsetX: defaults.artOffsetX,
          artOffsetY: defaults.artOffsetY,
        })

        set((s) => ({
          cardData: {
            ...s.cardData,
            artIntrinsicWidth: dims.width,
            artIntrinsicHeight: dims.height,
            artZoom: defaults.artZoom,
            artOffsetX: clamped.artOffsetX,
            artOffsetY: clamped.artOffsetY,
            hasManualArtPlacement: false,
          },
        }))
      },

      setRestoreSession: (restoreSession) => {
        set((state) => ({
          settings: {
            ...state.settings,
            restoreSession,
          },
        }))
      },

      setCurrentLayout: (layout) => {
        const nextLayout = normalizeCardLayoutMode(layout)
        const before = get()
        const prevLayout = before.currentLayout
        set((state) => ({
          currentLayout: nextLayout,
          cardData: {
            ...state.cardData,
            layout: nextLayout === 'Hidden' ? state.cardData.layout : layoutFromLegacyMode(nextLayout),
          },
        }))
        if (
          before.cardData.artImage &&
          !before.cardData.hasManualArtPlacement &&
          artBoundsChanged(prevLayout, nextLayout)
        ) {
          void get().refitArtPlacement()
        }
      },

      toggleTooltips: () => {
        set((state) => ({ showTooltips: !state.showTooltips }))
      },

      setShowHologram: (showHologram: boolean) => {
        set(() => ({ showHologram }))
      },

      setClonedCardImage: (url: string) => {
        const nextUrl = String(url ?? '').trim()
        set((state) => ({
          cardData: {
            ...state.cardData,
            clonedCardImage: nextUrl,
          },
          currentLayout: nextUrl ? 'Hidden' : state.currentLayout,
        }))
      },

      clearClonedCardImage: () => {
        set((state) => ({
          cardData: {
            ...state.cardData,
            clonedCardImage: '',
          },
          currentLayout: state.currentLayout === 'Hidden' ? 'Standard' : state.currentLayout,
        }))
      },

      setReferenceImage: (url: string) => {
        const nextUrl = String(url ?? '').trim()
        set((state) => ({
          cardData: {
            ...state.cardData,
            referenceImage: nextUrl,
            referenceOffsetX: 0,
            referenceOffsetY: 0,
          },
        }))
      },

      setReferenceOpacity: (opacity: number) => {
        const o = Number(opacity)
        const next = Number.isFinite(o) ? Math.max(0, Math.min(1, o)) : defaultCardData.referenceOpacity
        set((state) => ({
          cardData: {
            ...state.cardData,
            referenceOpacity: next,
          },
        }))
      },

      setReferenceOffset: (x: number, y: number) => {
        const nx = Number.isFinite(x) ? Math.round(x) : 0
        const ny = Number.isFinite(y) ? Math.round(y) : 0
        set((state) => ({
          cardData: {
            ...state.cardData,
            referenceOffsetX: nx,
            referenceOffsetY: ny,
          },
        }))
      },

      clearReferenceImage: () => {
        set((state) => ({
          cardData: {
            ...state.cardData,
            referenceImage: '',
            referenceOffsetX: 0,
            referenceOffsetY: 0,
          },
        }))
      },


      
// Phase 4.1 – Procedural Color & Stroke Identity (behavioral pass)
setAutoColorEnabled: (enabled) => {
        set(() => ({ autoColorEnabled: enabled }))
        if (enabled) {
          const s = get()
          const p = syncColorIdentity({
            autoColorEnabled: true,
            cardData: {
              typeLine: s.cardData.typeLine,
              colorIdentity: s.cardData.colorIdentity,
              name: s.cardData.name,
              manaCost: s.cardData.manaCost,
            },
            manualColorKey: s.manualColorKey,
            manualColorHex1: s.manualColorHex1,
            manualColorHex2: s.manualColorHex2,
            manualColorHex3: s.manualColorHex3,
            manualColorHex4: s.manualColorHex4,
            manualColorHex5: s.manualColorHex5,
            manualColorCount: s.manualColorCount,
          })
          if (p) set(() => p)
        }
      },
setManualColorKey: (key) => set(() => ({ manualColorKey: key })),

setManualColorHex1: (hex) => set(() => ({ manualColorHex1: hex })),
setManualColorHex2: (hex) => set(() => ({ manualColorHex2: hex })),
setManualColorHex3: (hex) => set(() => ({ manualColorHex3: hex })),
setManualColorHex4: (hex) => set(() => ({ manualColorHex4: hex })),
setManualColorHex5: (hex) => set(() => ({ manualColorHex5: hex })),
setManualColorCount: (count) =>
  set(() => ({
    manualColorCount: count,
    manualUseTwoColors: count >= 2,
  })),
setManualUseTwoColors: (enabled) =>
  set((s) => ({
    manualUseTwoColors: enabled,
    manualColorCount: enabled
      ? ((s.manualColorCount < 2 ? 2 : s.manualColorCount) as 1 | 2 | 3 | 4 | 5)
      : 1,
  })),

      setColorBlendDirection: (dir) => set(() => ({ colorBlendDirection: dir })),// Phase 3.5 – Mana Symbol Picker UI (UI-only)
      setActiveInputId: (id) => set({ activeInputId: id }),
      setActiveSelectionRange: (start, end) =>
        set(() => ({
          activeSelectionStart: Number.isFinite(start) ? Math.max(0, Math.floor(start)) : 0,
          activeSelectionEnd: Number.isFinite(end) ? Math.max(0, Math.floor(end)) : 0,
        })),
      insertManaSymbol: (symbolKey) => {
        let caret = 0

        set((state) => {
          const target: 'manaCost' | 'rulesText' = state.activeInputId ?? 'rulesText'

          const rawKey = String(symbolKey ?? '')
          const upperToken = rawKey.match(/^\d+$/)
            ? rawKey
            : rawKey.length
              ? (normalizeManaTokenInner(rawKey) || rawKey.toUpperCase())
              : ''

          const symbolSet = normalizeManaSymbolSetId(state.cardData.manaSymbolSet)
          const tokenInner = upperToken ? formatManaTokenInnerForSet(symbolSet, upperToken) : ''
          const token = tokenInner ? `{${tokenInner}}` : ''

          const current =
            target === 'manaCost' ? (state.cardData.manaCost ?? '') : (state.cardData.cardText ?? '')

          const start = Number.isFinite(state.activeSelectionStart)
            ? Math.max(0, Math.min(current.length, Math.floor(state.activeSelectionStart)))
            : current.length
          const end = Number.isFinite(state.activeSelectionEnd)
            ? Math.max(0, Math.min(current.length, Math.floor(state.activeSelectionEnd)))
            : current.length

          const a = Math.min(start, end)
          const b = Math.max(start, end)

          const next = token ? current.slice(0, a) + token + current.slice(b) : current

          caret = token ? a + token.length : a

          const nextCardData: any = { ...state.cardData }
          if (target === 'manaCost') nextCardData.manaCost = normalizeStoreManaCost(next)
          else nextCardData.cardText = normalizeStoreRulesText(next)

          const canonBefore = target === 'manaCost' ? normalizeStoreManaCost(current) : normalizeStoreRulesText(current)
          const canonAfter =
            target === 'manaCost' ? normalizeStoreManaCost(nextCardData.manaCost) : normalizeStoreRulesText(nextCardData.cardText)
          const textChanged = canonBefore !== canonAfter
          const dirtyKey: FieldDirtyKey = target === 'manaCost' ? 'manaCost' : 'cardText'
          const isFieldDirty =
            textChanged ? { ...state.isFieldDirty, [dirtyKey]: true } : state.isFieldDirty

          const out: {
            cardData: typeof nextCardData
            activeSelectionStart: number
            activeSelectionEnd: number
            isFieldDirty: typeof isFieldDirty
          } = {
            cardData: nextCardData,
            activeSelectionStart: caret,
            activeSelectionEnd: caret,
            isFieldDirty,
          }
          return out
        })

        return caret
      },

      openManaPopup: () =>
        set((_state) => {
          const POPUP_W = 280
          const TOP_OFFSET = 80
          const top =
            typeof window !== 'undefined'
              ? TOP_OFFSET
              : 80
          const left =
            typeof window !== 'undefined'
              ? Math.round(window.innerWidth / 2 - POPUP_W / 2)
              : 100
          return {
            manaPopupOpen: true,
            manaPopupPosition: { top, left },
          }
        }),
      closeManaPopup: () => set({ manaPopupOpen: false }),
      setManaPopupTarget: (target) => set({ manaPopupTarget: target }),
      setManaPopupPosition: (top, left) =>
        set({ manaPopupPosition: { top, left } }),
      setRegisterManaInputFocus: (fn) => set({ registerManaInputFocus: fn }),


      setFontsLoaded: (loaded) => set({ fontsLoaded: loaded }),

      commitState: () => {
        set((state) => {
          const current = normalizeSnapshot(state.cardData)
          const committed = normalizeSnapshot(state.committed)

          if (shallowEqualSnapshot(committed, current)) return state

          const nextPast = [...state.past, { ...committed }]
          const trimmedPast =
            nextPast.length > MAX_HISTORY ? nextPast.slice(nextPast.length - MAX_HISTORY) : nextPast

          return {
            ...state,
            past: trimmedPast,
            future: [],
            committed: { ...current },
          }
        })
      },

      resetCard: () => {
        set((state) => {
          const nextCardData: CardData = {
            ...defaultCardData,
            layout: { ...DEFAULT_LAYOUT_ID },
          }
          return {
            ...state,
            cardData: nextCardData,
            committed: { ...nextCardData },
            past: [],
            future: [],
            isFieldDirty: createInitialFieldDirty(),
            currentLayout: 'Standard',
            manaPopupOpen: false,
            activeInputId: null,
            activeSelectionStart: 0,
            activeSelectionEnd: 0,
            workspaceInitEpoch: state.workspaceInitEpoch + 1,
            quickViewOpen: false,
          }
        })
      },

      resetCardData: () => {
        get().resetCard()
      },

      undo: () => {
        set((state) => {
          const pastLen = state.past?.length ?? 0
          if (pastLen === 0) return state

          const previous = state.past[pastLen - 1]
          const remainingPast = state.past.slice(0, -1)

          const nextFuture = [{ ...state.committed }, ...state.future]
          const trimmedFuture =
            nextFuture.length > MAX_HISTORY ? nextFuture.slice(0, MAX_HISTORY) : nextFuture

          return {
            ...state,
            cardData: { ...normalizeSnapshot(previous) },
            committed: { ...normalizeSnapshot(previous) },
            past: remainingPast,
            future: trimmedFuture,
            isFieldDirty: createInitialFieldDirty(),
          }
        })
      },

      redo: () => {
        set((state) => {
          const futureLen = state.future?.length ?? 0
          if (futureLen === 0) return state

          const next = state.future[0]
          const remainingFuture = state.future.slice(1)

          const nextPast = [...state.past, { ...state.committed }]
          const trimmedPast =
            nextPast.length > MAX_HISTORY ? nextPast.slice(nextPast.length - MAX_HISTORY) : nextPast

          return {
            ...state,
            cardData: { ...normalizeSnapshot(next) },
            committed: { ...normalizeSnapshot(next) },
            past: trimmedPast,
            future: remainingFuture,
            isFieldDirty: createInitialFieldDirty(),
          }
        })
      },

      getDesignSnapshot: () => {
        const state = useCardStore.getState()
        return {
          schemaVersion: DESIGN_SCHEMA_VERSION,
          cardData: { ...state.cardData },
          settings: { ...state.settings },
          currentLayout: state.currentLayout,
          showTooltips: state.showTooltips,
          showHologram: state.showHologram,
        }
      },

      hydrateFromDesign: (payload: DesignSnapshot) => {
        set((state) => {
          const cardData = normalizeSnapshot(payload.cardData)
          const layoutFromDesign =
            payload?.cardData?.layout && typeof payload.cardData.layout === 'object'
              ? normalizeLayout(payload.cardData.layout)
              : layoutFromLegacyMode(normalizeCardLayoutMode(payload.currentLayout ?? state.currentLayout))
          return {
            ...state,
            cardData: {
              ...cardData,
              layout: layoutFromDesign,
            },
            settings: payload.settings ?? state.settings,
            currentLayout: layoutToLegacyMode(layoutFromDesign),
            showTooltips: typeof payload.showTooltips === 'boolean' ? payload.showTooltips : state.showTooltips,
            showHologram: typeof payload.showHologram === 'boolean' ? payload.showHologram : state.showHologram,
            past: [],
            future: [],
            committed: { ...cardData },
            isFieldDirty: createInitialFieldDirty(),
            quickViewOpen: false,
          }
        })
      },
    } as CardStoreState
  },
    {
      name: 'um-proxy-showcase-store',
      version: 1,
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          try { return window.localStorage.getItem(name) }
          catch { return null }
        },
        setItem: (name, value) => {
          try {
            window.localStorage.setItem(name, value)
          } catch (e: any) {
            // Quota exceeded or storage blocked; attempt to recover by clearing our key.
            try { window.localStorage.removeItem(name) } catch {}
            try { window.localStorage.setItem(name, value) } catch {}
          }
        },
        removeItem: (name) => {
          try { window.localStorage.removeItem(name) } catch {}
        },
      })),
      migrate: (persistedState) => {
        const ps = persistedState as { schemaVersion?: number } | null | undefined
        if (ps != null && typeof ps === 'object' && ps.schemaVersion === PERSIST_SCHEMA_VERSION) return persistedState as any
        return {
          schemaVersion: PERSIST_SCHEMA_VERSION,
          cardData: { ...defaultCardData },
          settings: { ...defaultSettings },
          currentLayout: 'Standard',
          showTooltips: false,
          showHologram: true,
          exportPresetId: DEFAULT_EXPORT_PRESET_ID,
        } as any
      },
      partialize: (state) => {
        const { artImage, setIconImage, ...cardDataSansImages } = state.cardData as any
        return {
          schemaVersion: state.schemaVersion,
          cardData: cardDataSansImages,
          settings: state.settings,
          currentLayout: state.currentLayout,
          showTooltips: state.showTooltips,
          showHologram: state.showHologram,
          exportPresetId: state.exportPresetId,
          exportPngIncludeBleed: state.exportPngIncludeBleed,
          // Phase 18.2 — procedural color continuity (same persist path as card JSON fields).
          autoColorEnabled: state.autoColorEnabled,
          manualColorKey: state.manualColorKey,
          manualColorHex1: state.manualColorHex1,
          manualColorHex2: state.manualColorHex2,
          manualColorHex3: state.manualColorHex3,
          manualColorHex4: state.manualColorHex4,
          manualColorHex5: state.manualColorHex5,
          manualColorCount: state.manualColorCount,
          manualUseTwoColors: state.manualUseTwoColors,
          colorBlendDirection: state.colorBlendDirection,
        }
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return
        state.schemaVersion = state.schemaVersion === PERSIST_SCHEMA_VERSION ? PERSIST_SCHEMA_VERSION : PERSIST_SCHEMA_VERSION
        if (!Array.isArray(state.past)) state.past = []
        if (!Array.isArray(state.future)) state.future = []
        if (!state.settings) state.settings = { restoreSession: true }
        if (!state.cardData) state.cardData = { ...defaultCardData }
        state.currentLayout = normalizeCardLayoutMode(state.currentLayout ?? 'Standard')
        if (typeof state.showTooltips !== 'boolean') state.showTooltips = false
        if (typeof state.showHologram !== 'boolean') state.showHologram = true
        if (typeof (state as CardStoreState).quickViewOpen !== 'boolean')
          (state as CardStoreState).quickViewOpen = false
        ;(state as CardStoreState).asyncStatus = {
          artUpload: { status: 'idle', message: null },
          setIconUpload: { status: 'idle', message: null },
          designLoad: { status: 'idle', message: null },
          export: { status: 'idle', message: null },
          scryfallFetch: { status: 'idle', message: null },
        }
        ;(state as CardStoreState).exportPresetId = normalizeExportPresetId(
          (state as CardStoreState).exportPresetId,
        )
        if (typeof (state as CardStoreState).exportPngIncludeBleed !== 'boolean') {
          ;(state as CardStoreState).exportPngIncludeBleed = true
        }
        const cd = state.cardData as unknown as Record<string, unknown>
        if (cd.cardNumber !== undefined) {
          cd.collector_number = cd.collector_number ?? cd.cardNumber
          delete cd.cardNumber
        }
        if (typeof (state.cardData as any).filenameSlug !== 'string') (state.cardData as any).filenameSlug = slugifyCardName((state.cardData as any).name ?? '')
        state.cardData = normalizeSnapshot(state.cardData)
        state.cardData.layout = normalizeLayout(
          state.cardData.layout ?? layoutFromLegacyMode(state.currentLayout ?? 'Standard'),
        )
        if (state.currentLayout !== 'Hidden') {
          state.currentLayout = layoutToLegacyMode(state.cardData.layout)
        }
        state.committed = { ...state.cardData }
        ;(state as CardStoreState).isFieldDirty = createInitialFieldDirty()
        ;(state as CardStoreState).workflowState = computeWorkflowStateForStore(state as CardStoreState)
      },
      merge: (persistedState, currentState) => {
        const ps = (persistedState ?? {}) as Partial<
          Pick<
            CardStoreState,
            | 'schemaVersion'
            | 'cardData'
            | 'settings'
            | 'currentLayout'
            | 'showTooltips'
            | 'showHologram'
            | 'exportPresetId'
            | 'exportPngIncludeBleed'
            | 'autoColorEnabled'
            | 'manualColorKey'
            | 'manualColorHex1'
            | 'manualColorHex2'
            | 'manualColorHex3'
            | 'manualColorHex4'
            | 'manualColorHex5'
            | 'manualColorCount'
            | 'manualUseTwoColors'
            | 'colorBlendDirection'
          >
        >
        const schemaVersion = ps.schemaVersion === PERSIST_SCHEMA_VERSION ? PERSIST_SCHEMA_VERSION : PERSIST_SCHEMA_VERSION

        const mergedSettings: SettingsState = {
          ...currentState.settings,
          ...(ps.settings ?? {}),
        }

        const restoreSession = shouldRestoreEditorSession(mergedSettings)

        let mergedCardData: CardData
        if (restoreSession && ps.cardData != null && typeof ps.cardData === 'object') {
          mergedCardData = normalizeSnapshot({
            ...defaultCardData,
            ...(ps.cardData as unknown as Partial<CardData>),
          } as CardData)
        } else {
          mergedCardData = normalizeSnapshot({
            ...defaultCardData,
          })
        }

        const layoutSeed =
          restoreSession && ps.currentLayout != null
            ? (ps.currentLayout as CardLayoutMode)
            : layoutToLegacyMode(mergedCardData.layout)

        let nextLayout = normalizeCardLayoutMode(layoutSeed)
        mergedCardData.layout = normalizeLayout(
          mergedCardData.layout ?? layoutFromLegacyMode(nextLayout),
        )
        if (nextLayout !== 'Hidden') {
          nextLayout = layoutToLegacyMode(mergedCardData.layout)
        }

        const colorSlice = restoreSession
          ? {
              autoColorEnabled:
                typeof ps.autoColorEnabled === 'boolean' ? ps.autoColorEnabled : currentState.autoColorEnabled,
              manualColorKey: normalizePersistedManualColorKey(ps.manualColorKey, currentState.manualColorKey),
              manualColorHex1:
                typeof ps.manualColorHex1 === 'string' ? ps.manualColorHex1 : currentState.manualColorHex1,
              manualColorHex2:
                typeof ps.manualColorHex2 === 'string' ? ps.manualColorHex2 : currentState.manualColorHex2,
              manualColorHex3:
                typeof ps.manualColorHex3 === 'string' ? ps.manualColorHex3 : currentState.manualColorHex3,
              manualColorHex4:
                typeof ps.manualColorHex4 === 'string' ? ps.manualColorHex4 : currentState.manualColorHex4,
              manualColorHex5:
                typeof ps.manualColorHex5 === 'string' ? ps.manualColorHex5 : currentState.manualColorHex5,
              manualColorCount: normalizePersistedManualColorCount(
                ps.manualColorCount,
                currentState.manualColorCount,
              ),
              manualUseTwoColors:
                typeof ps.manualUseTwoColors === 'boolean'
                  ? ps.manualUseTwoColors
                  : currentState.manualUseTwoColors,
              colorBlendDirection: normalizePersistedColorBlendDirection(
                ps.colorBlendDirection,
                currentState.colorBlendDirection,
              ),
            }
          : {
              autoColorEnabled: currentState.autoColorEnabled,
              manualColorKey: currentState.manualColorKey,
              manualColorHex1: currentState.manualColorHex1,
              manualColorHex2: currentState.manualColorHex2,
              manualColorHex3: currentState.manualColorHex3,
              manualColorHex4: currentState.manualColorHex4,
              manualColorHex5: currentState.manualColorHex5,
              manualColorCount: currentState.manualColorCount,
              manualUseTwoColors: currentState.manualUseTwoColors,
              colorBlendDirection: currentState.colorBlendDirection,
            }

        const merged: CardStoreState = {
          ...currentState,
          schemaVersion,
          settings: mergedSettings,
          cardData: mergedCardData,
          currentLayout: nextLayout,
          showTooltips: typeof ps.showTooltips === 'boolean' ? ps.showTooltips : currentState.showTooltips,
          showHologram: typeof ps.showHologram === 'boolean' ? ps.showHologram : currentState.showHologram,
          exportPresetId: normalizeExportPresetId(ps.exportPresetId ?? currentState.exportPresetId),
          exportPngIncludeBleed:
            typeof ps.exportPngIncludeBleed === 'boolean'
              ? ps.exportPngIncludeBleed
              : currentState.exportPngIncludeBleed,
          ...colorSlice,
          isFieldDirty: createInitialFieldDirty(),
          past: [],
          future: [],
          committed: { ...mergedCardData },
          workspaceInitEpoch: 0,
          manaPopupOpen: false,
          activeInputId: null,
          activeSelectionStart: 0,
          activeSelectionEnd: 0,
          quickViewOpen: false,
        } as CardStoreState

        return {
          ...merged,
          workflowState: computeWorkflowStateForStore(merged),
        }
      },
    },
  ),
)

/** Module 5.1 — explicit reset without hook (same as in-store `resetCard`). */
export const resetCard = () => useCardStore.getState().resetCard()

/** @deprecated Use `resetCard`; delegates to the same implementation. */
export const resetCardData = () => useCardStore.getState().resetCardData()