import { memo, startTransition, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Settings2,
  Wand2,
  LayoutTemplate,
  Blend,
} from 'lucide-react'
import {
  IDENTITY_SWIRL_RASTER_PX,
  getIdentitySwirlPatternCanvas,
  getSwirlStopsFromResolvedIdentity,
} from '../../authority/identitySwirlAuthority'
import { landFullArtManaCircleKeyToBracketToken } from '../../authority/landFullArtManaCircle'
import {
  getActiveLayoutCapabilitiesFromState,
  serializeLayoutId,
} from '../../authority/layoutRegistry'
import { BOX_PANEL_GRADIENT_DIRECTION_OPTIONS } from '../../authority/boxPanelFillAuthority'
import { shouldDefaultWhiteInnerBorder as computeShouldDefaultWhiteInnerBorder } from '../../authority/textBackgroundContrastAuthority'
import type { BoxColorGradientDirection, CardData, ColorBlendDirection } from '../../store/useCardStore'
import {
  COLOR_IDENTITY_PIP_CHIP,
  mergeAutoColorIdentityPips,
} from '../../authority/colorAuthority'
import { normalizeColorIdentityPips, resolveProceduralIdentity, useCardStore } from '../../store/useCardStore'
import type { LayoutFamily, LayoutVariant } from '../../authority/layoutTaxonomy'
import {
  getAllowedVariantsForFamily,
  getLayoutFamilyLabel,
  getLayoutVariantLabel,
  LAYOUT_FAMILY_LABELS,
} from '../../authority/layoutTaxonomy'
import {
  WATERMARK_SELECT_OPTIONS,
  type WatermarkPathKey,
} from '../../authority/watermarkAuthority'
import { TEXTURE_OPTIONS } from '../../data/textureOptions'
import { isOuterBorderTexture, outerBorderPngUrl, CLASSIC_OUTER_BORDER_SECTION_ID } from '../../data/outerBorderOptions'
import OuterBorderPicker from './OuterBorderPicker'
import PanelFillSwatch from './PanelFillSwatch'
import { effectivePanelBackground } from '../../authority/panelBackgroundAuthority'
import {
  UI_TEXT_ACTION,
  UI_TEXT_CONTROL,
  UI_TEXT_HELP_COMPACT,
  UI_TEXT_LABEL_COMPACT,
  UI_TEXT_LABEL_SEMIBOLD,
  UI_TEXT_METADATA,
  UI_TEXT_METADATA_SEMIBOLD,
  UI_TEXT_SECTION_HEADER,
} from '../../authority/typographyAuthority'
import {
  shouldShowColorIdentityPipControls,
  shouldShowManualColorPaletteControls,
  shouldShowPtPanelGradientField,
  shouldShowPlateGeometry,
  shouldShowPreModernTextBoxSelector,
  shouldShowSpellTextBoxSelector,
} from '../../authority/progressiveDisclosureAuthority'
import { SPELL_PANEL_OPTIONS } from '../../data/spellPanelOptions'
import { PRE_MODERN_RULES_TEXT_BOX_OPTIONS } from '../../data/preModernRulesTextBoxOptions'
import { BOX_PANEL_COLOR_UI } from '../../authority/boxColorUiAuthority'
import { CONSTRAINT_COPY } from '../../authority/constraintFeedbackAuthority'
import CollapsibleSection from './CollapsibleSection'
import SwitchRow from '../ui/SwitchRow'
import FieldRow from '../ui/FieldRow'
import ConstraintHint from '../ui/ConstraintHint'

const BoxPanelGradientControls = memo(function BoxPanelGradientControls({
  enabled,
  direction,
  saturation,
  reversed,
  enabledKey,
  directionKey,
  saturationKey,
  reversedKey,
  setField,
  commitState,
  gradientAriaPrefix,
}: {
  enabled: boolean
  direction: BoxColorGradientDirection
  saturation: number
  reversed: boolean
  enabledKey: keyof CardData
  directionKey: keyof CardData
  saturationKey: keyof CardData
  reversedKey: keyof CardData
  setField: <K extends keyof CardData>(key: K, value: CardData[K]) => void
  commitState: () => void
  /** Disambiguates identical visible labels when multiple box panels appear in one section. */
  gradientAriaPrefix?: string
}) {
  const sat = Math.max(0, Math.min(100, Math.round(Number(saturation) || 0)))
  const p = gradientAriaPrefix?.trim()
  const ariaPanelGradient = p ? `${p} panel gradient` : 'Panel gradient'
  const ariaDirection = p ? `${p} gradient direction` : 'Gradient direction'
  const ariaSaturation = p ? `${p} gradient saturation` : 'Gradient saturation'
  const ariaReverse = p ? `${p} reverse gradient` : 'Reverse gradient'
  return (
    <div className="mt-2 space-y-2 border-l-2 border-neutral-200 pl-2 dark:border-[color-mix(in_srgb,var(--sb-border)_70%,transparent)]">
      <SwitchRow
        label="Panel Gradient"
        checked={!!enabled}
        onToggle={() => {
          setField(enabledKey, (!enabled) as CardData[typeof enabledKey])
          commitState()
        }}
        ariaLabel={ariaPanelGradient}
      />
      {enabled ? (
        <div className="space-y-2">
          <div className="space-y-1">
            <label className={`block ${UI_TEXT_LABEL_COMPACT}`}>Gradient Direction</label>
            <select
              value={direction}
              onChange={(e) => {
                setField(directionKey, e.target.value as BoxColorGradientDirection)
                commitState()
              }}
              className="ui-text-control w-full h-10 rounded-xl border border-neutral-200 bg-white px-3 outline-none ui-focus-ring-control dark:border-[var(--sb-border)] dark:bg-[var(--sb-surface-soft)]"
              aria-label={ariaDirection}
            >
              {BOX_PANEL_GRADIENT_DIRECTION_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <FieldRow label="Saturation" layout="stacked">
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={sat}
                onChange={(e) => setField(saturationKey, Number(e.target.value) as CardData[typeof saturationKey])}
                onMouseUp={commitState}
                onTouchEnd={commitState}
                className="w-full min-w-0"
                aria-label={ariaSaturation}
              />
              <span className={`shrink-0 tabular-nums ${UI_TEXT_METADATA} w-8 text-right`}>
                {sat}
              </span>
            </div>
          </FieldRow>
          <SwitchRow
            label="Reverse Gradient"
            checked={!!reversed}
            onToggle={() => {
              setField(reversedKey, (!reversed) as CardData[typeof reversedKey])
              commitState()
            }}
            ariaLabel={ariaReverse}
          />
          <p className={`${UI_TEXT_HELP_COMPACT} leading-snug`}>
            0 = grayscale ramp; 100 = full chroma. Reverse swaps light and rich ends (and swirl sampling).
          </p>
        </div>
      ) : null}
    </div>
  )
})

/** Phase 10.3 correction — exactly one top-level section open per right sidebar. */
type RightSectionId = 'layout' | 'identity' | 'panels' | 'settings'

const IdentitySwirlPreviewBar = memo(function IdentitySwirlPreviewBar({ stops }: { stops: string[] }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const w = IDENTITY_SWIRL_RASTER_PX
  const h = IDENTITY_SWIRL_RASTER_PX
  const stopsKey = stops.join(';')
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const src = getIdentitySwirlPatternCanvas(w, h, stops)
    const ctx = el.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, w, h)
    ctx.drawImage(src, 0, 0)
  }, [stopsKey, h, w, stops])
  return (
    <canvas
      ref={ref}
      width={w}
      height={h}
      className="h-4 w-full rounded-[var(--ui-radius-lg)] border border-[var(--ui-color-border)]"
      style={{ width: '100%', height: '1rem', display: 'block' }}
      aria-label="Identity swirl preview"
    />
  )
})

export default function SidebarRight() {
  const [collapsed, setCollapsed] = useState(false)
  const [rightOpenSection, setRightOpenSection] = useState<RightSectionId | null>(null)
  const toggleRightSection = (id: RightSectionId) => {
    startTransition(() => {
      setRightOpenSection((cur) => (cur === id ? null : id))
    })
  }
  const workspaceInitEpoch = useCardStore((s) => s.workspaceInitEpoch)
  const restoreSession = useCardStore((s) => s.settings.restoreSession)

  const showTooltips = useCardStore((s) => s.showTooltips)

// Phase 4.1 – Procedural Color & Stroke Identity (behavioral pass)
const autoColorEnabled = useCardStore((s) => s.autoColorEnabled)
const manualColorKey = useCardStore((s) => s.manualColorKey)
const setAutoColorEnabled = useCardStore((s) => s.setAutoColorEnabled)
const manualColorHex1 = useCardStore((s) => s.manualColorHex1)
const manualColorHex2 = useCardStore((s) => s.manualColorHex2)
const manualColorHex3 = useCardStore((s) => s.manualColorHex3)
const manualColorHex4 = useCardStore((s) => s.manualColorHex4)
const manualColorHex5 = useCardStore((s) => s.manualColorHex5)
const manualColorCount = useCardStore((s) => s.manualColorCount)
const colorBlendDirection = useCardStore((s) => s.colorBlendDirection)
const setColorBlendDirection = useCardStore((s) => s.setColorBlendDirection)
const setManualColorHex1 = useCardStore((s) => s.setManualColorHex1)
const setManualColorHex2 = useCardStore((s) => s.setManualColorHex2)
const setManualColorHex3 = useCardStore((s) => s.setManualColorHex3)
const setManualColorHex4 = useCardStore((s) => s.setManualColorHex4)
const setManualColorHex5 = useCardStore((s) => s.setManualColorHex5)
const setManualColorCount = useCardStore((s) => s.setManualColorCount)
const currentLayout = useCardStore((s) => s.currentLayout)
const activeLayout = useCardStore((s) => s.cardData.layout)
const setLayout = useCardStore((s) => s.setLayout)
const layoutCapabilitiesKey = serializeLayoutId(activeLayout)
const activeLayoutCapabilities = useMemo(
  () =>
    getActiveLayoutCapabilitiesFromState({
      currentLayout,
      cardData: { layout: activeLayout },
    }),
  // layout identity is fully captured by `layoutCapabilitiesKey`; omit `activeLayout` ref to avoid churn
  [currentLayout, layoutCapabilitiesKey],
)

  const selectedTexture = useCardStore((s) => s.cardData.selectedTexture)
  const textureOpacity = useCardStore((s) => s.cardData.textureOpacity)
  const outerBorderFrameTexture = useCardStore((s) => s.cardData.outerBorderFrameTexture)
  const outerBorderFrameTextureOpacity = useCardStore((s) => s.cardData.outerBorderFrameTextureOpacity)
  const innerBorderEnabled = useCardStore((s) => s.cardData.innerBorderEnabled)
  const innerBorderBackground = useCardStore((s) => s.cardData.innerBorderBackground ?? 'identity')
  // Card Frame Texture is unavailable when the inner border uses a picked image/texture.
  const cardFrameTextureDisabled =
    innerBorderBackground !== 'identity' && outerBorderPngUrl(innerBorderBackground) != null
  const panelBackgroundPreview = useCardStore((s) => s.panelBackgroundPreview)
  const rulesTextBoxColor = useCardStore((s) => s.cardData.rulesTextBoxColor)
  const effectiveRulesTextBoxColor = effectivePanelBackground(
    'rulesTextBoxColor',
    rulesTextBoxColor,
    panelBackgroundPreview,
  )
  const nameBoxColor = useCardStore((s) => s.cardData.nameBoxColor)
  const effectiveNameBoxColor = effectivePanelBackground('nameBoxColor', nameBoxColor, panelBackgroundPreview)
  const typeLineBoxColor = useCardStore((s) => s.cardData.typeLineBoxColor)
  const effectiveTypeLineBoxColor = effectivePanelBackground(
    'typeLineBoxColor',
    typeLineBoxColor,
    panelBackgroundPreview,
  )
  const ptBoxColor = useCardStore((s) => s.cardData.ptBoxColor)
  const effectivePtBoxColor = effectivePanelBackground('ptBoxColor', ptBoxColor, panelBackgroundPreview)
  const nameBoxGradientEnabled = useCardStore((s) => s.cardData.nameBoxGradientEnabled)
  const nameBoxGradientDirection = useCardStore((s) => s.cardData.nameBoxGradientDirection)
  const nameBoxGradientSaturation = useCardStore((s) => s.cardData.nameBoxGradientSaturation)
  const nameBoxGradientReversed = useCardStore((s) => s.cardData.nameBoxGradientReversed)
  const typeLineBoxGradientEnabled = useCardStore((s) => s.cardData.typeLineBoxGradientEnabled)
  const typeLineBoxGradientDirection = useCardStore((s) => s.cardData.typeLineBoxGradientDirection)
  const typeLineBoxGradientSaturation = useCardStore((s) => s.cardData.typeLineBoxGradientSaturation)
  const typeLineBoxGradientReversed = useCardStore((s) => s.cardData.typeLineBoxGradientReversed)
  const rulesTextBoxGradientEnabled = useCardStore((s) => s.cardData.rulesTextBoxGradientEnabled)
  const rulesTextBoxGradientDirection = useCardStore((s) => s.cardData.rulesTextBoxGradientDirection)
  const rulesTextBoxGradientSaturation = useCardStore((s) => s.cardData.rulesTextBoxGradientSaturation)
  const rulesTextBoxGradientReversed = useCardStore((s) => s.cardData.rulesTextBoxGradientReversed)
  const ptBoxGradientEnabled = useCardStore((s) => s.cardData.ptBoxGradientEnabled)
  const ptBoxGradientDirection = useCardStore((s) => s.cardData.ptBoxGradientDirection)
  const ptBoxGradientSaturation = useCardStore((s) => s.cardData.ptBoxGradientSaturation)
  const ptBoxGradientReversed = useCardStore((s) => s.cardData.ptBoxGradientReversed)
  const bezierPlateEnabled = useCardStore((s) => s.cardData.bezierPlateEnabled)
  const spellTextBoxId = useCardStore((s) => s.cardData.spellTextBoxId)
  const preModernRulesTextBoxId = useCardStore((s) => s.cardData.preModernRulesTextBoxId)
  const pdColorInput = useMemo(
    () => ({ autoColorEnabled: !!autoColorEnabled }),
    [autoColorEnabled],
  )
  const watermarkPath = useCardStore((s) => s.cardData.watermarkPath)
  const watermarkOpacity = useCardStore((s) => s.cardData.watermarkOpacity)
  const customWatermarkDataUrl = useCardStore((s) => s.cardData.customWatermarkDataUrl)
  const outerBorderColor = useCardStore((s) => s.cardData.outerBorderColor ?? 'black')
  // OBF Texture/Opacity only apply to Solid, M15 Solid, and Dual color selections —
  // Textures and Guild frames (m15tex:) already paint the full border.
  const outerBorderFrameTextureApplicable = !isOuterBorderTexture(outerBorderColor)
  const [obfTextureOpen, setObfTextureOpen] = useState(false)
  const [innerBorderOpen, setInnerBorderOpen] = useState(false)
  const [outerBorderOpen, setOuterBorderOpen] = useState(false)

  const classicPanelSectionIds = useMemo(() => [CLASSIC_OUTER_BORDER_SECTION_ID] as const, [])

  const setField = useCardStore((s) => s.setField)
  const commitState = useCardStore((s) => s.commitState)
  const setRestoreSession = useCardStore((s) => s.setRestoreSession)
  const toggleTooltips = useCardStore((s) => s.toggleTooltips)
  const colorIdentity = useCardStore((s) => s.cardData.colorIdentity)
  const cardTypeLine = useCardStore((s) => s.cardData.typeLine)
  const cardName = useCardStore((s) => s.cardData.name)
  const manaCost = useCardStore((s) => s.cardData.manaCost)
  const landFullArtManaCircleKey = useCardStore((s) => s.cardData.landFullArtManaCircleKey)

  const landFullArtManaCircle = activeLayoutCapabilities.useLandFullArtManaCircle
  const identityManaCost = landFullArtManaCircle
    ? landFullArtManaCircleKeyToBracketToken(landFullArtManaCircleKey)
    : (manaCost ?? '')
  const identityPips = landFullArtManaCircle ? [] : colorIdentity
  const identityAutoColorEnabled = landFullArtManaCircle ? true : autoColorEnabled

  /** Matches auto-color: explicit pips + braced symbols in name and mana (e.g. mana picker {R}). */
  const mergedColorIdentityPips = useMemo(
    () => mergeAutoColorIdentityPips(colorIdentity, cardName ?? '', identityManaCost ?? ''),
    [colorIdentity, cardName, identityManaCost],
  )

  const resolvedIdentity = useMemo(
    () =>
      resolveProceduralIdentity(
        cardTypeLine,
        identityPips,
        cardName,
        identityManaCost,
        identityAutoColorEnabled,
        manualColorKey,
        manualColorHex1,
        manualColorHex2,
        manualColorHex3,
        manualColorHex4,
        manualColorHex5,
        manualColorCount,
      ),
    [
      landFullArtManaCircle,
      landFullArtManaCircleKey,
      cardTypeLine,
      identityPips,
      cardName,
      identityManaCost,
      identityAutoColorEnabled,
      manualColorKey,
      manualColorHex1,
      manualColorHex2,
      manualColorHex3,
      manualColorHex4,
      manualColorHex5,
      manualColorCount,
    ],
  )

  const shouldDefaultWhiteInnerBorder = useMemo(
    () =>
      computeShouldDefaultWhiteInnerBorder({
        autoColorEnabled,
        manualColorKey,
        manualColorHex1,
        manualColorHex2,
        manualColorHex3,
        manualColorHex4,
        manualColorHex5,
        manualColorCount,
      }),
    [
      autoColorEnabled,
      manualColorHex1,
      manualColorHex2,
      manualColorHex3,
      manualColorHex4,
      manualColorHex5,
      manualColorKey,
      manualColorCount,
    ],
  )

  const swirlPreviewStops = useMemo(
    () => getSwirlStopsFromResolvedIdentity(resolvedIdentity),
    [resolvedIdentity],
  )

  const asideWidthClass = collapsed ? 'lg:w-14' : 'lg:w-[304px]'

  const manualColorPreview = useMemo(() => {
    if (colorBlendDirection === 'swirl') return 'transparent'
    const dir =
      colorBlendDirection === 'horizontal'
        ? 'to right'
        : colorBlendDirection === 'vertical'
          ? 'to bottom'
          : 'to bottom right'
    const slots = [manualColorHex1, manualColorHex2, manualColorHex3, manualColorHex4, manualColorHex5].slice(
      0,
      manualColorCount,
    )
    const valid = slots.filter((s) => /^#([0-9a-f]{6})$/i.test(String(s ?? ''))) as string[]
    if (valid.length >= 2) {
      const stops = valid.map((c, i) => `${c} ${(i / (valid.length - 1)) * 100}%`).join(', ')
      return `linear-gradient(${dir}, ${stops})`
    }
    if (valid.length === 1) return valid[0]
    return '#90adbb'
  }, [
    colorBlendDirection,
    manualColorCount,
    manualColorHex1,
    manualColorHex2,
    manualColorHex3,
    manualColorHex4,
    manualColorHex5,
  ])

  const manualHexSlots = [
    { n: 1, hex: manualColorHex1, setHex: setManualColorHex1, def: '#90adbb' },
    { n: 2, hex: manualColorHex2, setHex: setManualColorHex2, def: '#0e68ab' },
    { n: 3, hex: manualColorHex3, setHex: setManualColorHex3, def: '#00733d' },
    { n: 4, hex: manualColorHex4, setHex: setManualColorHex4, def: '#d3202a' },
    { n: 5, hex: manualColorHex5, setHex: setManualColorHex5, def: '#c0b673' },
  ] as const

  useEffect(() => {
    if (workspaceInitEpoch === 0) return
    setRightOpenSection(null)
  }, [workspaceInitEpoch])

  return (
    <aside
      className={`sidebar-shell h-full min-h-0 min-w-0 w-full max-w-none flex flex-col flex-none overflow-x-hidden lg:shrink-[2] lg:max-w-[320px] ${asideWidthClass} order-3 max-h-[min(40vh,22rem)] lg:order-none lg:max-h-none`}
      aria-label="Right sidebar"
    >
      <div className="h-full min-h-0 flex flex-col">
        <div className="sidebar-header flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="sidebar-header-badge h-9 w-9 rounded-xl flex items-center justify-center">
              <SlidersHorizontal className="h-4 w-4" aria-hidden />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className={`${UI_TEXT_SECTION_HEADER} leading-5 truncate`}>Styling</div>
                <div className={`${UI_TEXT_METADATA} truncate`}>
                  Color, borders & panels
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              startTransition(() => setCollapsed((v) => !v))
            }}
            className="sidebar-btn-secondary ui-focus-ring h-9 w-9 rounded-xl flex items-center justify-center text-neutral-600 dark:text-neutral-300"
            aria-label={collapsed ? 'Expand right sidebar' : 'Collapse right sidebar'}
          >
            {collapsed ? <ChevronLeft className="h-4 w-4" aria-hidden /> : <ChevronRight className="h-4 w-4" aria-hidden />}
          </button>
        </div>

	        <div
	          className="sidebar-content flex-1 min-h-0 overflow-y-auto"
	          aria-label="Styling sections"
	        >
	          {!collapsed && (
            <>
  <CollapsibleSection
    title="Layout"
    icon={<LayoutTemplate className="h-4 w-4" />}
    open={rightOpenSection === 'layout'}
    onToggle={() => toggleRightSection('layout')}
  >
    <div className="space-y-2">
      <FieldRow label="Layout Family" layout="stacked">
        <select
          value={activeLayout.family}
          onChange={(e) => {
            const family = e.target.value as LayoutFamily
            setLayout({ family, variant: activeLayout.variant })
            commitState()
          }}
          className="w-full h-10 rounded-xl border border-neutral-200 bg-white px-3 ui-text-control outline-none ui-focus-ring-control dark:border-[var(--sb-border)] dark:bg-[var(--sb-surface-soft)]"
          aria-label="Layout family"
        >
          {(Object.keys(LAYOUT_FAMILY_LABELS) as LayoutFamily[]).map((family) => (
            <option key={family} value={family}>
              {getLayoutFamilyLabel(family)}
            </option>
          ))}
        </select>
      </FieldRow>
      <FieldRow label="Layout Variant" layout="stacked">
        <select
          value={activeLayout.variant}
          onChange={(e) => {
            const variant = e.target.value as LayoutVariant
            setLayout({ family: activeLayout.family, variant })
            commitState()
          }}
          className="w-full h-10 rounded-xl border border-neutral-200 bg-white px-3 ui-text-control outline-none ui-focus-ring-control dark:border-[var(--sb-border)] dark:bg-[var(--sb-surface-soft)]"
          aria-label="Layout variant"
        >
          {getAllowedVariantsForFamily(activeLayout.family).map((v) => (
            <option key={v} value={v}>
              {getLayoutVariantLabel(v)}
            </option>
          ))}
        </select>
      </FieldRow>
      {shouldShowSpellTextBoxSelector({ layoutFamily: activeLayout.family, layout: activeLayout }) ? (
        <FieldRow label="Spell Text Box" layout="stacked">
          <select
            value={spellTextBoxId}
            onChange={(e) => {
              setField('spellTextBoxId', e.target.value)
              commitState()
            }}
            className="w-full h-10 rounded-xl border border-neutral-200 bg-white px-3 ui-text-control outline-none ui-focus-ring-control dark:border-[var(--sb-border)] dark:bg-[var(--sb-surface-soft)]"
            aria-label="Spell text box parchment panel"
          >
            {SPELL_PANEL_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </FieldRow>
      ) : null}
      {shouldShowPreModernTextBoxSelector({ layoutFamily: activeLayout.family, layout: activeLayout }) ? (
        <FieldRow label="Rules Text Box" layout="stacked">
          <select
            value={preModernRulesTextBoxId}
            onChange={(e) => {
              setField('preModernRulesTextBoxId', e.target.value)
              commitState()
            }}
            className="w-full h-10 rounded-xl border border-neutral-200 bg-white px-3 ui-text-control outline-none ui-focus-ring-control dark:border-[var(--sb-border)] dark:bg-[var(--sb-surface-soft)]"
            aria-label="Rules text box background"
          >
            {PRE_MODERN_RULES_TEXT_BOX_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </FieldRow>
      ) : null}
      {shouldShowPlateGeometry(activeLayoutCapabilities) ? (
        <SwitchRow
          label="Bezier Plate"
          checked={!!bezierPlateEnabled}
          onToggle={() => {
            setField('bezierPlateEnabled', !bezierPlateEnabled)
            commitState()
          }}
          ariaLabel="Bezier plate"
        />
      ) : null}
    </div>
  </CollapsibleSection>

  <CollapsibleSection
    title="Color & Borders"
    icon={<Wand2 className="h-4 w-4" />}
    open={rightOpenSection === 'identity'}
    onToggle={() => toggleRightSection('identity')}
  >
    <div className="space-y-2">
      <SwitchRow
        label="Auto Color"
        checked={!!autoColorEnabled}
        onToggle={() => setAutoColorEnabled(!autoColorEnabled)}
        ariaLabel="Auto color"
      />
      {autoColorEnabled ? (
        <ConstraintHint>{CONSTRAINT_COPY.colorAutoOn}</ConstraintHint>
      ) : (
        <ConstraintHint>{CONSTRAINT_COPY.colorAutoOff}</ConstraintHint>
      )}
      {landFullArtManaCircle ? <ConstraintHint>{CONSTRAINT_COPY.colorLandFullArt}</ConstraintHint> : null}

      <div className="space-y-2">
        <div className={UI_TEXT_LABEL_SEMIBOLD}>Color identity blend</div>
        <select
          value={colorBlendDirection}
          onChange={(e) => setColorBlendDirection(e.target.value as ColorBlendDirection)}
          className="w-full h-10 rounded-xl border border-neutral-200 bg-white px-3 ui-text-control outline-none ui-focus-ring-control dark:border-[var(--sb-border)] dark:bg-[var(--sb-surface-soft)]"
          aria-label="Color identity blend mode"
        >
          <option value="vertical">Vertical</option>
          <option value="horizontal">Horizontal</option>
          <option value="diagonal">Diagonal</option>
          <option value="swirl">Swirl</option>
        </select>
        {colorBlendDirection === 'swirl' ? (
          <p className={`${UI_TEXT_HELP_COMPACT} leading-snug`}>
            Procedural swirl matches the card inner border in preview and export (no linear direction).
          </p>
        ) : null}
      </div>

      {shouldShowColorIdentityPipControls(pdColorInput) ? (
        <div className="space-y-1">
          <label className={`block ${UI_TEXT_LABEL_COMPACT}`}>
            Color identity (explicit WUBRG — drives auto-color)
          </label>
          <div className="flex flex-wrap gap-2">
            {(['W', 'U', 'B', 'R', 'G'] as const).map((pip) => {
              const active = mergedColorIdentityPips.includes(pip)
              const chip = COLOR_IDENTITY_PIP_CHIP[pip]
              return (
                <button
                  key={pip}
                  type="button"
                  onClick={() => {
                    const cur = [...colorIdentity]
                    const idx = cur.indexOf(pip)
                    if (idx >= 0) cur.splice(idx, 1)
                    else if (cur.length < 5) cur.push(pip)
                    setField('colorIdentity', normalizeColorIdentityPips(cur))
                    commitState()
                  }}
                  className={[
                    `sidebar-btn-secondary ui-focus-ring h-9 min-w-[2.25rem] rounded-xl border px-2 ${UI_TEXT_METADATA_SEMIBOLD}`,
                    active ? '' : 'text-[var(--sb-text)]',
                  ].join(' ')}
                  style={
                    active
                      ? {
                          background: chip.background,
                          color: chip.letter,
                          borderColor: chip.border,
                        }
                      : undefined
                  }
                  aria-pressed={active}
                  aria-label={`Toggle ${pip} identity`}
                >
                  {pip}
                </button>
              )
            })}
          </div>
          <p className={`${UI_TEXT_HELP_COMPACT} leading-snug`}>
            Up to five colors. Braced pips in the card name or mana cost field also count (e.g. {'{R}'},{' '}
            {'{W/U}'}); bare letters in the name are ignored. Two = hybrid gradient; three or more = multi-stop inner border.
          </p>
        </div>
      ) : null}

      {shouldShowManualColorPaletteControls(pdColorInput) ? (
        <div className="space-y-2">
            <div className="space-y-1">
              <label className={`block ${UI_TEXT_LABEL_COMPACT}`}>
                Manual colors (1–5)
              </label>
              <select
                value={manualColorCount}
                onChange={(e) => setManualColorCount(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                className="w-full h-10 rounded-xl border border-neutral-200 bg-white px-3 ui-text-control outline-none ui-focus-ring-control dark:border-[var(--sb-border)] dark:bg-[var(--sb-surface-soft)]"
                aria-label="Number of manual colors"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} color{n > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {manualHexSlots.slice(0, manualColorCount).map(({ n, hex, setHex, def }) => (
                <div key={n} className="space-y-1">
                  <label className={`block ${UI_TEXT_LABEL_COMPACT}`}>Color {n}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={/^#([0-9a-f]{6})$/i.test(hex) ? hex : def}
                      onChange={(e) => setHex(e.target.value)}
                      className="h-10 w-10 shrink-0 rounded-xl border border-neutral-200 bg-white p-0 dark:border-[var(--sb-border)] dark:bg-[var(--sb-surface-soft)]"
                      aria-label={`Manual color ${n} picker`}
                    />
                    <input
                      value={hex}
                      onChange={(e) => setHex(e.target.value)}
                      placeholder="#RRGGBB"
                      className="w-full h-10 rounded-xl border border-neutral-200 bg-white px-3 ui-text-mono-value outline-none ui-focus-ring-control dark:border-[var(--sb-border)] dark:bg-[var(--sb-surface-soft)]"
                      aria-label={`Manual color ${n} hex`}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-1">
              {colorBlendDirection === 'swirl' ? (
                shouldDefaultWhiteInnerBorder ? (
                  <div
                    className="h-4 w-full rounded-[var(--ui-radius-lg)] border border-[var(--ui-color-border)] bg-[var(--ui-color-surface-elevated)]"
                    aria-label="Manual color preview"
                  />
                ) : (
                  <IdentitySwirlPreviewBar stops={swirlPreviewStops} />
                )
              ) : (
                <div
                  className="h-4 w-full rounded-[var(--ui-radius-lg)] border border-[var(--ui-color-border)]"
                  style={{ background: manualColorPreview }}
                  aria-label="Manual color preview"
                />
              )}
            </div>
        </div>
      ) : null}
      <div className="rounded-xl border border-neutral-200 dark:border-[var(--sb-border)]">
        <button
          type="button"
          onClick={() => setInnerBorderOpen((v) => !v)}
          aria-expanded={innerBorderOpen}
          className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left ui-text-control outline-none ui-focus-ring-control hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <span className={UI_TEXT_LABEL_SEMIBOLD}>Inner Border</span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 transition-transform ${innerBorderOpen ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </button>

        {innerBorderOpen ? (
          <div className="space-y-2 border-t border-neutral-200 px-3 py-3 dark:border-[var(--sb-border)]">
            <SwitchRow
              label="Inner Border - ON/OFF"
              checked={innerBorderEnabled !== false}
              onToggle={() => {
                setField('innerBorderEnabled', !(innerBorderEnabled !== false))
                commitState()
              }}
              ariaLabel="Inner border on/off"
            />

            <OuterBorderPicker
              field="innerBorderBackground"
              buttonLabel="Inner Border Background"
              identityOption={{ value: 'identity', label: 'From Color Identity' }}
            />

            <FieldRow label="Card Frame Texture" layout="stacked">
              <select
                value={selectedTexture}
                onChange={(e) => {
                  setField('selectedTexture', e.target.value)
                  commitState()
                }}
                disabled={cardFrameTextureDisabled}
                className="w-full h-10 rounded-xl border border-neutral-200 bg-white px-3 ui-text-control outline-none ui-focus-ring-control disabled:opacity-50 dark:border-[var(--sb-border)] dark:bg-[var(--sb-surface-soft)]"
                aria-label="Card frame texture"
              >
                {TEXTURE_OPTIONS.map((t) => (
                  <option key={t.file || 'none'} value={t.file}>
                    {t.label}
                  </option>
                ))}
              </select>
            </FieldRow>

            {selectedTexture && !cardFrameTextureDisabled ? (
              <FieldRow label="Card Frame Texture Opacity" layout="stacked">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={typeof textureOpacity === 'number' ? textureOpacity : 1}
                  onChange={(e) => setField('textureOpacity', parseFloat(e.target.value))}
                  onMouseUp={commitState}
                  onTouchEnd={commitState}
                  className="w-full"
                  aria-label="Card frame texture opacity"
                />
              </FieldRow>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="rounded-xl border border-neutral-200 dark:border-[var(--sb-border)]">
        <button
          type="button"
          onClick={() => setOuterBorderOpen((v) => !v)}
          aria-expanded={outerBorderOpen}
          className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left ui-text-control outline-none ui-focus-ring-control hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <span className={UI_TEXT_LABEL_SEMIBOLD}>Outer Border</span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 transition-transform ${outerBorderOpen ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </button>

        {outerBorderOpen ? (
          <div className="space-y-2 border-t border-neutral-200 px-3 py-3 dark:border-[var(--sb-border)]">
            <OuterBorderPicker buttonLabel="Outer Border Background" />

            <div className="rounded-xl border border-neutral-200 dark:border-[var(--sb-border)]">
              <button
                type="button"
                disabled={!outerBorderFrameTextureApplicable}
                onClick={() => setObfTextureOpen((v) => !v)}
                aria-expanded={outerBorderFrameTextureApplicable && obfTextureOpen}
                className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left ui-text-control outline-none ui-focus-ring-control enabled:hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 dark:enabled:hover:bg-neutral-800"
                title={
                  outerBorderFrameTextureApplicable
                    ? 'Overlay a frame texture on the Outer Border'
                    : 'Available for Solid, M15, and Dual colors only'
                }
              >
                <span>Outer Border Texture</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 transition-transform ${
                    outerBorderFrameTextureApplicable && obfTextureOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {outerBorderFrameTextureApplicable && obfTextureOpen && (
                <div className="space-y-3 border-t border-neutral-200 px-3 py-3 dark:border-[var(--sb-border)]">
                  <FieldRow label="Texture" layout="stacked">
                    <select
                      value={outerBorderFrameTexture}
                      onChange={(e) => {
                        setField('outerBorderFrameTexture', e.target.value)
                        commitState()
                      }}
                      className="w-full h-10 rounded-xl border border-neutral-200 bg-white px-3 ui-text-control outline-none ui-focus-ring-control dark:border-[var(--sb-border)] dark:bg-[var(--sb-surface-soft)]"
                      aria-label="Outer border frame texture"
                    >
                      {TEXTURE_OPTIONS.map((t) => (
                        <option key={`obf-${t.file || 'none'}`} value={t.file}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </FieldRow>

                  <FieldRow label="Opacity" layout="stacked">
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={typeof outerBorderFrameTextureOpacity === 'number' ? outerBorderFrameTextureOpacity : 1}
                      onChange={(e) => setField('outerBorderFrameTextureOpacity', parseFloat(e.target.value))}
                      onMouseUp={commitState}
                      onTouchEnd={commitState}
                      className="w-full"
                      aria-label="Outer border frame texture opacity"
                    />
                  </FieldRow>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  </CollapsibleSection>

  <CollapsibleSection
    title="Panels"
    icon={<Blend className="h-4 w-4" aria-hidden />}
    open={rightOpenSection === 'panels'}
    onToggle={() => toggleRightSection('panels')}
  >
    <div className="space-y-3">
      <p className={`${UI_TEXT_HELP_COMPACT} leading-snug`}>
        Base colors and optional per-panel gradients for name, type, rules, and P/T (preview and export). Typography ink uses your font color when contrast allows.
      </p>
      <FieldRow label={BOX_PANEL_COLOR_UI.name.rowLabel} layout="stacked">
        <>
          <div className="flex items-center gap-2">
            <PanelFillSwatch
              value={effectiveNameBoxColor}
              ariaLabel={BOX_PANEL_COLOR_UI.name.colorAriaLabel}
              onHexChange={(hex) => {
                setField('nameBoxColor', hex)
                commitState()
              }}
            />
            <input
              value={effectiveNameBoxColor}
              onChange={(e) => setField('nameBoxColor', e.target.value)}
              onBlur={commitState}
              placeholder="#RRGGBB"
              className="w-full h-10 rounded-xl border border-neutral-200 bg-white px-3 ui-text-mono-value outline-none ui-focus-ring-control dark:border-[var(--sb-border)] dark:bg-[var(--sb-surface-soft)]"
              aria-label={BOX_PANEL_COLOR_UI.name.hexAriaLabel}
            />
          </div>
          <BoxPanelGradientControls
            enabled={nameBoxGradientEnabled}
            direction={nameBoxGradientDirection}
            saturation={nameBoxGradientSaturation}
            reversed={nameBoxGradientReversed}
            enabledKey="nameBoxGradientEnabled"
            directionKey="nameBoxGradientDirection"
            saturationKey="nameBoxGradientSaturation"
            reversedKey="nameBoxGradientReversed"
            setField={setField}
            commitState={commitState}
            gradientAriaPrefix={BOX_PANEL_COLOR_UI.name.gradientAriaPrefix}
          />
          <div className="mt-2">
            <OuterBorderPicker
              field="nameBoxColor"
              sectionIds={classicPanelSectionIds}
              buttonLabel="Name Plate Background"
            />
          </div>
        </>
      </FieldRow>
      <FieldRow label={BOX_PANEL_COLOR_UI.typeLine.rowLabel} layout="stacked">
        <>
          <div className="flex items-center gap-2">
            <PanelFillSwatch
              value={effectiveTypeLineBoxColor}
              ariaLabel={BOX_PANEL_COLOR_UI.typeLine.colorAriaLabel}
              onHexChange={(hex) => {
                setField('typeLineBoxColor', hex)
                commitState()
              }}
            />
            <input
              value={effectiveTypeLineBoxColor}
              onChange={(e) => setField('typeLineBoxColor', e.target.value)}
              onBlur={commitState}
              placeholder="#RRGGBB"
              className="w-full h-10 rounded-xl border border-neutral-200 bg-white px-3 ui-text-mono-value outline-none ui-focus-ring-control dark:border-[var(--sb-border)] dark:bg-[var(--sb-surface-soft)]"
              aria-label={BOX_PANEL_COLOR_UI.typeLine.hexAriaLabel}
            />
          </div>
          <BoxPanelGradientControls
            enabled={typeLineBoxGradientEnabled}
            direction={typeLineBoxGradientDirection}
            saturation={typeLineBoxGradientSaturation}
            reversed={typeLineBoxGradientReversed}
            enabledKey="typeLineBoxGradientEnabled"
            directionKey="typeLineBoxGradientDirection"
            saturationKey="typeLineBoxGradientSaturation"
            reversedKey="typeLineBoxGradientReversed"
            setField={setField}
            commitState={commitState}
            gradientAriaPrefix={BOX_PANEL_COLOR_UI.typeLine.gradientAriaPrefix}
          />
          <div className="mt-2">
            <OuterBorderPicker
              field="typeLineBoxColor"
              sectionIds={classicPanelSectionIds}
              buttonLabel="Type Line Background"
            />
          </div>
        </>
      </FieldRow>
      <FieldRow label={BOX_PANEL_COLOR_UI.rulesText.rowLabel} layout="stacked">
        <>
          <div className="flex items-center gap-2">
            <PanelFillSwatch
              value={effectiveRulesTextBoxColor}
              ariaLabel={BOX_PANEL_COLOR_UI.rulesText.colorAriaLabel}
              onHexChange={(hex) => {
                setField('rulesTextBoxColor', hex)
                commitState()
              }}
            />
            <input
              value={effectiveRulesTextBoxColor}
              onChange={(e) => setField('rulesTextBoxColor', e.target.value)}
              onBlur={commitState}
              placeholder="#RRGGBB"
              className="w-full h-10 rounded-xl border border-neutral-200 bg-white px-3 ui-text-mono-value outline-none ui-focus-ring-control dark:border-[var(--sb-border)] dark:bg-[var(--sb-surface-soft)]"
              aria-label={BOX_PANEL_COLOR_UI.rulesText.hexAriaLabel}
            />
          </div>
          <BoxPanelGradientControls
            enabled={rulesTextBoxGradientEnabled}
            direction={rulesTextBoxGradientDirection}
            saturation={rulesTextBoxGradientSaturation}
            reversed={rulesTextBoxGradientReversed}
            enabledKey="rulesTextBoxGradientEnabled"
            directionKey="rulesTextBoxGradientDirection"
            saturationKey="rulesTextBoxGradientSaturation"
            reversedKey="rulesTextBoxGradientReversed"
            setField={setField}
            commitState={commitState}
            gradientAriaPrefix={BOX_PANEL_COLOR_UI.rulesText.gradientAriaPrefix}
          />
          <div className="mt-2">
            <OuterBorderPicker
              field="rulesTextBoxColor"
              sectionIds={classicPanelSectionIds}
              buttonLabel="Rules Text Background"
            />
          </div>
        </>
      </FieldRow>
      {shouldShowPtPanelGradientField(activeLayoutCapabilities) ? (
        <FieldRow label={BOX_PANEL_COLOR_UI.powerToughness.rowLabel} layout="stacked">
          <>
            <div className="flex items-center gap-2">
              <PanelFillSwatch
                value={effectivePtBoxColor}
                ariaLabel={BOX_PANEL_COLOR_UI.powerToughness.colorAriaLabel}
                onHexChange={(hex) => {
                  setField('ptBoxColor', hex)
                  commitState()
                }}
              />
              <input
                value={effectivePtBoxColor}
                onChange={(e) => setField('ptBoxColor', e.target.value)}
                onBlur={commitState}
                placeholder="#RRGGBB"
                className="w-full h-10 rounded-xl border border-neutral-200 bg-white px-3 ui-text-mono-value outline-none ui-focus-ring-control dark:border-[var(--sb-border)] dark:bg-[var(--sb-surface-soft)]"
                aria-label={BOX_PANEL_COLOR_UI.powerToughness.hexAriaLabel}
              />
            </div>
            <BoxPanelGradientControls
              enabled={ptBoxGradientEnabled}
              direction={ptBoxGradientDirection}
              saturation={ptBoxGradientSaturation}
              reversed={ptBoxGradientReversed}
              enabledKey="ptBoxGradientEnabled"
              directionKey="ptBoxGradientDirection"
              saturationKey="ptBoxGradientSaturation"
              reversedKey="ptBoxGradientReversed"
              setField={setField}
              commitState={commitState}
              gradientAriaPrefix={BOX_PANEL_COLOR_UI.powerToughness.gradientAriaPrefix}
            />
            <div className="mt-2">
              <OuterBorderPicker
                field="ptBoxColor"
                sectionIds={classicPanelSectionIds}
                buttonLabel="P/T Background"
              />
            </div>
          </>
        </FieldRow>
      ) : (
        <ConstraintHint>{CONSTRAINT_COPY.gradientNoPt}</ConstraintHint>
      )}

      <div className="space-y-3 border-t border-neutral-200 pt-3 dark:border-[var(--sb-border)]">
      <div className="space-y-1.5">
        <div className={UI_TEXT_LABEL_SEMIBOLD}>Watermark</div>

        <FieldRow label="Selection" layout="stacked">
          <select
            value={watermarkPath}
            onChange={(e) => {
              setField('watermarkPath', e.target.value as WatermarkPathKey)
              commitState()
            }}
            className="w-full h-10 rounded-xl border border-neutral-200 bg-white px-3 ui-text-control outline-none ui-focus-ring-control dark:border-[var(--sb-border)] dark:bg-[var(--sb-surface-soft)]"
            aria-label="Rules text watermark"
          >
            {WATERMARK_SELECT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </FieldRow>

        <FieldRow label="Upload" layout="stacked">
          <div className="space-y-2">
            <input
              type="file"
              accept="image/svg+xml,image/*"
              className={`ui-focus-ring block w-full ${UI_TEXT_CONTROL} text-[var(--ui-color-text-strong)] file:mr-3 file:rounded-xl file:border-0 file:bg-neutral-900 file:px-3 file:py-2 file:text-[length:var(--ui-font-size-xs)] file:font-semibold file:text-white hover:file:bg-neutral-800 dark:file:bg-white dark:file:text-black dark:hover:file:bg-neutral-100`}
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null
                if (!file) return
                const reader = new FileReader()
                reader.onerror = () => {
                  // Non-destructive: ignore failed reads.
                }
                reader.onload = () => {
                  const base64 = String(reader.result ?? '')
                  if (!base64) return
                  setField('customWatermarkDataUrl', base64)
                  setField('watermarkPath', 'custom' as WatermarkPathKey)
                  commitState()
                }
                reader.readAsDataURL(file)
              }}
              aria-label="Upload custom watermark"
            />

            {customWatermarkDataUrl ? (
              <button
                type="button"
                className={`sidebar-btn-secondary ui-focus-ring h-9 w-full rounded-xl border px-3 ${UI_TEXT_ACTION} hover:bg-neutral-50 dark:hover:bg-neutral-800`}
                onClick={() => {
                  setField('customWatermarkDataUrl', '')
                  if (watermarkPath === 'custom') setField('watermarkPath', 'none' as WatermarkPathKey)
                  commitState()
                }}
                aria-label="Clear custom watermark"
              >
                Clear Custom Watermark
              </button>
            ) : null}
          </div>
        </FieldRow>

        <FieldRow label="Watermark Opacity" layout="stacked">
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={typeof watermarkOpacity === 'number' ? watermarkOpacity : 0.14}
            onChange={(e) => setField('watermarkOpacity', parseFloat(e.target.value))}
            onMouseUp={commitState}
            onTouchEnd={commitState}
            className="w-full"
            aria-label="Watermark opacity"
          />
        </FieldRow>
      </div>
      </div>
    </div>
  </CollapsibleSection>
  <CollapsibleSection
    title="Settings & Debug"
    icon={<Settings2 className="h-4 w-4" />}
    open={rightOpenSection === 'settings'}
    onToggle={() => toggleRightSection('settings')}
  >
    <div className="space-y-3">
                <div className="space-y-2">
                  <SwitchRow
                    label="Restore last session"
                    checked={!!restoreSession}
                    onToggle={() => setRestoreSession(!restoreSession)}
                    ariaLabel="Restore last session"
                  />
                  <SwitchRow
                    label="Show Layout Labels"
                    checked={!!showTooltips}
                    onToggle={() => toggleTooltips()}
                    ariaLabel="Show layout labels"
                  />
                </div>
              
    </div>
  </CollapsibleSection>
</>
	          )}
	        </div>
	      </div>
	    </aside>
  )
}
